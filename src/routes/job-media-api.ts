import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  DISCORD_WEBHOOK_SECRET?: string;
};

export const jobMediaApi = new Hono<{ Bindings: Bindings }>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r2Key(bookingId: string | number | null, filename: string) {
  return `job-media/${bookingId ?? 'general'}/${Date.now()}-${filename}`;
}

function publicUrl(key: string) {
  return `/api/job-media/file/${encodeURIComponent(key)}`;
}

// ─── Serve R2 file ────────────────────────────────────────────────────────────

jobMediaApi.get('/file/*', async (c) => {
  // Extract key from wildcard path
  const key = decodeURIComponent(c.req.path.replace('/api/job-media/file/', ''));
  const obj = await c.env.IMAGES.get(key);
  if (!obj) return c.json({ error: 'Not found' }, 404);

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000');
  return new Response(obj.body, { headers });
});

// ─── Upload (Admin) ───────────────────────────────────────────────────────────

/**
 * POST /api/job-media/upload
 * multipart form: file, booking_id?, customer_id?, title?, description?, taken_at?, visible_to_client?
 */
jobMediaApi.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return c.json({ error: 'No file provided' }, 400);

  const bookingId = formData.get('booking_id') as string | null;
  const customerId = formData.get('customer_id') as string | null;
  const title = (formData.get('title') as string) || file.name;
  const description = (formData.get('description') as string) || '';
  const takenAt = (formData.get('taken_at') as string) || null;
  const mediaType = file.type.startsWith('video') ? 'video' : 'image';
  const visibleToClient = formData.get('visible_to_client') !== 'false' ? 1 : 0;

  // If booking_id provided but no customer_id, look up customer
  let resolvedCustomerId = customerId;
  if (bookingId && !customerId) {
    const booking = await c.env.DB.prepare(
      'SELECT customer_id FROM bookings WHERE id = ?'
    ).bind(bookingId).first<{ customer_id: number }>();
    if (booking) resolvedCustomerId = String(booking.customer_id);
  }

  const key = r2Key(bookingId, file.name);
  await c.env.IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const url = publicUrl(key);
  const result = await c.env.DB.prepare(`
    INSERT INTO job_media (booking_id, customer_id, r2_key, url, media_type, filename, file_size, mime_type, title, description, taken_at, source, visible_to_client)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?)
  `).bind(
    bookingId || null,
    resolvedCustomerId || null,
    key, url, mediaType,
    file.name, file.size, file.type,
    title, description, takenAt,
    visibleToClient
  ).run();

  return c.json({ success: true, id: result.meta.last_row_id, url });
});

// ─── Discord Webhook ──────────────────────────────────────────────────────────

/**
 * POST /api/job-media/discord
 * Called by Hermes agent when a photo/video is posted in #lil-beaver-admin
 *
 * Expected body (multipart OR JSON):
 *   - file (multipart) OR image_url (JSON, publicly fetchable temp URL)
 *   - booking_id?     — job to attach to
 *   - customer_email? — fallback to look up customer
 *   - title?
 *   - description?
 *   - discord_message_id
 *   - discord_channel_id
 *   - secret          — must match DISCORD_WEBHOOK_SECRET env var
 */
jobMediaApi.post('/discord', async (c) => {
  // Auth check
  const secret = c.env.DISCORD_WEBHOOK_SECRET;
  const contentType = c.req.header('content-type') || '';
  let fields: Record<string, string> = {};
  let fileBuffer: ArrayBuffer | null = null;
  let fileName = 'discord-upload.jpg';
  let mimeType = 'image/jpeg';

  if (contentType.includes('multipart/form-data')) {
    const form = await c.req.formData();
    for (const [k, v] of form.entries()) {
      if (typeof v === 'string') fields[k] = v;
      else {
        const f = v as File;
        fileBuffer = await f.arrayBuffer();
        fileName = f.name;
        mimeType = f.type;
      }
    }
  } else {
    fields = await c.req.json();
  }

  if (secret && fields.secret !== secret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Resolve customer from booking or email
  const bookingId = fields.booking_id || null;
  let customerId: string | null = null;

  if (bookingId) {
    const b = await c.env.DB.prepare('SELECT customer_id FROM bookings WHERE id = ?')
      .bind(bookingId).first<{ customer_id: number }>();
    if (b) customerId = String(b.customer_id);
  }

  if (!customerId && fields.customer_email) {
    const cust = await c.env.DB.prepare('SELECT id FROM customers WHERE email = ?')
      .bind(fields.customer_email.toLowerCase().trim())
      .first<{ id: number }>();
    if (cust) customerId = String(cust.id);
  }

  // Fetch file from URL if not uploaded directly
  if (!fileBuffer && fields.image_url) {
    try {
      const resp = await fetch(fields.image_url);
      fileBuffer = await resp.arrayBuffer();
      mimeType = resp.headers.get('content-type') || mimeType;
      const urlParts = fields.image_url.split('/');
      fileName = urlParts[urlParts.length - 1].split('?')[0] || fileName;
    } catch {
      return c.json({ error: 'Could not fetch image from URL' }, 400);
    }
  }

  if (!fileBuffer) return c.json({ error: 'No file or image_url provided' }, 400);

  const mediaType = mimeType.startsWith('video') ? 'video' : 'image';
  const key = r2Key(bookingId, fileName);
  await c.env.IMAGES.put(key, fileBuffer, { httpMetadata: { contentType: mimeType } });
  const url = publicUrl(key);

  const result = await c.env.DB.prepare(`
    INSERT INTO job_media (booking_id, customer_id, r2_key, url, media_type, filename, mime_type, title, description, source, discord_message_id, discord_channel_id, uploaded_by, visible_to_client)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'discord', ?, ?, 'discord-bot', 1)
  `).bind(
    bookingId || null,
    customerId || null,
    key, url, mediaType, fileName, mimeType,
    fields.title || 'Job Photo',
    fields.description || fields.caption || '',
    fields.discord_message_id || null,
    fields.discord_channel_id || '1479913371326353590'
  ).run();

  return c.json({ success: true, id: result.meta.last_row_id, url, customer_id: customerId });
});

// ─── List media (admin) ───────────────────────────────────────────────────────

/**
 * GET /api/job-media?booking_id=&customer_id=&limit=&offset=
 */
jobMediaApi.get('/', async (c) => {
  const bookingId = c.req.query('booking_id');
  const customerId = c.req.query('customer_id');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  let where = '1=1';
  const binds: any[] = [];

  if (bookingId) { where += ' AND m.booking_id = ?'; binds.push(bookingId); }
  if (customerId) { where += ' AND m.customer_id = ?'; binds.push(customerId); }

  binds.push(limit, offset);

  const rows = await c.env.DB.prepare(`
    SELECT m.*, b.title as job_title, c.name as customer_name, c.email as customer_email
    FROM job_media m
    LEFT JOIN bookings b ON m.booking_id = b.id
    LEFT JOIN customers c ON m.customer_id = c.id
    WHERE ${where}
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...binds).all<any>();

  return c.json({ media: rows.results || [], total: rows.results?.length || 0 });
});

// ─── List media (portal — customer-facing) ────────────────────────────────────

/**
 * GET /api/job-media/portal/:customerId
 * Only returns visible_to_client = 1
 */
jobMediaApi.get('/portal/:customerId', async (c) => {
  const customerId = c.req.param('customerId');
  const rows = await c.env.DB.prepare(`
    SELECT m.*, b.title as job_title, b.scheduled_date
    FROM job_media m
    LEFT JOIN bookings b ON m.booking_id = b.id
    WHERE m.customer_id = ? AND m.visible_to_client = 1
    ORDER BY m.created_at DESC
  `).bind(customerId).all<any>();

  return c.json({ media: rows.results || [] });
});

// ─── Update visibility ─────────────────────────────────────────────────────────

jobMediaApi.patch('/:id/visibility', async (c) => {
  const id = c.req.param('id');
  const { visible } = await c.req.json<{ visible: boolean }>();
  await c.env.DB.prepare('UPDATE job_media SET visible_to_client = ? WHERE id = ?')
    .bind(visible ? 1 : 0, id).run();
  return c.json({ success: true });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

jobMediaApi.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT r2_key FROM job_media WHERE id = ?')
    .bind(id).first<{ r2_key: string }>();

  if (!row) return c.json({ error: 'Not found' }, 404);

  await c.env.IMAGES.delete(row.r2_key);
  await c.env.DB.prepare('DELETE FROM job_media WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});
