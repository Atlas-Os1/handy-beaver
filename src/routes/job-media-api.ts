import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  DISCORD_WEBHOOK_SECRET?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
};

export const jobMediaApi = new Hono<{ Bindings: Bindings }>();

// ─── Cloudinary helpers ───────────────────────────────────────────────────────

/**
 * Upload a buffer to Cloudinary using signed API key + secret.
 * Returns { url, public_id } or null if not configured / upload fails.
 *
 * Worker env vars required:
 *   CLOUDINARY_CLOUD_NAME  — shown at top of Cloudflare dashboard
 *   CLOUDINARY_API_KEY     — from Settings → Access Keys
 *   CLOUDINARY_API_SECRET  — from Settings → Access Keys
 */
async function uploadToCloudinary(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string,
  env: Bindings,
  folder = 'handy-beaver/job-media'
): Promise<{ url: string; public_id: string } | null> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return null;
  }

  try {
    const resourceType = mimeType.startsWith('video') ? 'video' : 'image';
    const endpoint = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Build signature: SHA-1 of "folder=...&timestamp=...{secret}"
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const msgBuffer = new TextEncoder().encode(paramsToSign + env.CLOUDINARY_API_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), filename);
    form.append('api_key', env.CLOUDINARY_API_KEY);
    form.append('timestamp', timestamp);
    form.append('folder', folder);
    form.append('signature', signature);

    const res = await fetch(endpoint, { method: 'POST', body: form });
    if (!res.ok) {
      console.error('Cloudinary upload failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json<{ secure_url: string; public_id: string }>();
    return { url: data.secure_url, public_id: data.public_id };
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return null;
  }
}

// ─── R2 helpers ───────────────────────────────────────────────────────────────

function r2Key(bookingId: string | number | null, filename: string) {
  return `job-media/${bookingId ?? 'general'}/${Date.now()}-${filename}`;
}

function r2ProxyUrl(key: string) {
  return `/api/job-media/file/${encodeURIComponent(key)}`;
}

// ─── Serve file (R2 with Cloudinary fallback) ─────────────────────────────────

jobMediaApi.get('/file/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace('/api/job-media/file/', ''));

  // Try R2 first
  const obj = await c.env.IMAGES.get(key);
  if (obj) {
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    return new Response(obj.body, { headers });
  }

  // R2 miss — look up Cloudinary fallback URL in DB
  const row = await c.env.DB.prepare(
    'SELECT cloudinary_url FROM job_media WHERE r2_key = ? AND cloudinary_url IS NOT NULL'
  ).bind(key).first<{ cloudinary_url: string }>();

  if (row?.cloudinary_url) {
    // Permanent redirect so browsers/CDN cache the Cloudinary URL directly
    return c.redirect(row.cloudinary_url, 302);
  }

  return c.json({ error: 'Not found' }, 404);
});

// ─── Upload (Admin) ───────────────────────────────────────────────────────────

/**
 * POST /api/job-media/upload
 * multipart: file, booking_id?, customer_id?, title?, description?, taken_at?, visible_to_client?
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

  // Resolve customer from booking if not provided
  let resolvedCustomerId = customerId;
  if (bookingId && !customerId) {
    const booking = await c.env.DB.prepare(
      'SELECT customer_id FROM bookings WHERE id = ?'
    ).bind(bookingId).first<{ customer_id: number }>();
    if (booking) resolvedCustomerId = String(booking.customer_id);
  }

  const buffer = await file.arrayBuffer();
  const key = r2Key(bookingId, file.name);

  // Upload to R2 (primary)
  await c.env.IMAGES.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  // Upload to Cloudinary (backup) — fire-and-forget style but await so we can store the URL
  const cloudinary = await uploadToCloudinary(buffer, file.name, file.type, c.env);

  const url = r2ProxyUrl(key);

  const result = await c.env.DB.prepare(`
    INSERT INTO job_media
      (booking_id, customer_id, r2_key, url, media_type, filename, file_size, mime_type,
       title, description, taken_at, source, visible_to_client, cloudinary_url, cloudinary_public_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?, ?)
  `).bind(
    bookingId || null,
    resolvedCustomerId || null,
    key, url, mediaType,
    file.name, file.size, file.type,
    title, description, takenAt,
    visibleToClient,
    cloudinary?.url || null,
    cloudinary?.public_id || null
  ).run();

  return c.json({
    success: true,
    id: result.meta.last_row_id,
    url,
    cloudinary_url: cloudinary?.url || null,
    backup: !!cloudinary,
  });
});

// ─── Discord Webhook ──────────────────────────────────────────────────────────

/**
 * POST /api/job-media/discord
 * Called by Hermes/Lil Beaver when a photo is posted in #lil-beaver-admin
 *
 * Body (multipart OR JSON):
 *   file | image_url, booking_id?, customer_email?,
 *   title?, description?, discord_message_id, discord_channel_id, secret
 */
jobMediaApi.post('/discord', async (c) => {
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

  // Resolve customer
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

  // Fetch from URL if not a direct upload
  if (!fileBuffer && fields.image_url) {
    try {
      const resp = await fetch(fields.image_url);
      fileBuffer = await resp.arrayBuffer();
      mimeType = resp.headers.get('content-type') || mimeType;
      const parts = fields.image_url.split('/');
      fileName = parts[parts.length - 1].split('?')[0] || fileName;
    } catch {
      return c.json({ error: 'Could not fetch image from URL' }, 400);
    }
  }

  if (!fileBuffer) return c.json({ error: 'No file or image_url provided' }, 400);

  const mediaType = mimeType.startsWith('video') ? 'video' : 'image';
  const key = r2Key(bookingId, fileName);

  // R2 primary
  await c.env.IMAGES.put(key, fileBuffer, { httpMetadata: { contentType: mimeType } });

  // Cloudinary backup
  const cloudinary = await uploadToCloudinary(fileBuffer, fileName, mimeType, c.env);

  const url = r2ProxyUrl(key);

  const result = await c.env.DB.prepare(`
    INSERT INTO job_media
      (booking_id, customer_id, r2_key, url, media_type, filename, mime_type,
       title, description, source, discord_message_id, discord_channel_id,
       uploaded_by, visible_to_client, cloudinary_url, cloudinary_public_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'discord', ?, ?, 'discord-bot', 1, ?, ?)
  `).bind(
    bookingId || null,
    customerId || null,
    key, url, mediaType, fileName, mimeType,
    fields.title || 'Job Photo',
    fields.description || fields.caption || '',
    fields.discord_message_id || null,
    fields.discord_channel_id || '1479913371326353590',
    cloudinary?.url || null,
    cloudinary?.public_id || null
  ).run();

  return c.json({
    success: true,
    id: result.meta.last_row_id,
    url,
    cloudinary_url: cloudinary?.url || null,
    backup: !!cloudinary,
    customer_id: customerId,
  });
});

// ─── List media (admin) ───────────────────────────────────────────────────────

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

// ─── Visibility toggle ────────────────────────────────────────────────────────

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
  const row = await c.env.DB.prepare(
    'SELECT r2_key, cloudinary_public_id FROM job_media WHERE id = ?'
  ).bind(id).first<{ r2_key: string; cloudinary_public_id: string | null }>();

  if (!row) return c.json({ error: 'Not found' }, 404);

  // Delete from R2
  await c.env.IMAGES.delete(row.r2_key);

  // Note: Cloudinary deletion requires API secret (server-side signed request).
  // Skipping auto-delete from Cloudinary — orphaned files are small and free tier is generous.
  // Manual cleanup: Cloudflare dashboard → Media Library → handy-beaver/job-media

  await c.env.DB.prepare('DELETE FROM job_media WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});
