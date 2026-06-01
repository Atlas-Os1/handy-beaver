/**
 * Lil Beaver Chat API
 *
 * Uses Workers AI directly — no external gateway dependency.
 * Models:
 *   Admin chat  → @cf/meta/llama-3.3-70b-instruct-fp8-fast  (smart, function calling)
 *   Customer    → @cf/meta/llama-3.3-70b-instruct-fp8-fast  (same model, scoped prompt)
 *   Tool calls  → @cf/nousresearch/hermes-2-pro-mistral-7b  (Hermes for structured output)
 *
 * Photo uploads require R2 — returns 503 with clear message until R2 is enabled.
 */

import { Hono } from 'hono';

// ─── Types ────────────────────────────────────────────────────────────────────

type Bindings = {
  DB: D1Database;
  AI: Ai;
  KV?: KVNamespace;            // Primary upload store
  IMAGES?: R2Bucket;          // R2 fallback when enabled
  ADMIN_API_KEY?: string;
};

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_MODEL  = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const HERMES_MODEL = '@cf/nousresearch/hermes-2-pro-mistral-7b';

const ADMIN_SYSTEM = `You are Lil Beaver, the smart admin assistant for The Handy Beaver — a handyman and cabin maintenance service in Hochatown/Broken Bow, Southeast Oklahoma.

You have full admin context. You can:
- Draft quotes, check on jobs, summarize customer activity
- Answer questions about the business, pricing, and services
- Help compose messages, social posts, and blog content
- Analyze the business — what's working, what needs attention

Pricing:
- Labor ≤6 hrs: $175 flat | >6 hrs: $300/day
- Helper ≤6 hrs: $100 | >6 hrs: $225/day
- Cabin Care plans: $199/mo (1-2BR), $299/mo (3-4BR), $399/mo (5+BR)

Service area: Hochatown, Broken Bow, SE Oklahoma.
Be concise, direct, and action-oriented. Think like a business partner.`;

const CUSTOMER_SYSTEM = (name: string, customerId: number, email: string) =>
  `You are Lil Beaver, the friendly assistant for The Handy Beaver handyman service in SE Oklahoma.

You are chatting with: ${name} (account #${customerId})

You CAN help with:
- Their quotes, jobs, invoices, and subscription status
- Questions about services and pricing
- Scheduling inquiries and general questions
- The AI Design Studio at handybeaver.co/visualize

You CANNOT modify quotes, invoices, or account data — direct those requests to contact@handybeaver.co.

Pricing reference:
- Cabin Care: from $199/mo | Instant quotes at handybeaver.co/quote
- Free consultations available

Be warm, helpful, and conversational. Keep replies brief unless detail is needed.`;

// ─── Simple in-memory session cache (resets on worker restart, that's fine) ──

const sessionCache = new Map<string, Message[]>();

function getHistory(sessionKey: string): Message[] {
  return sessionCache.get(sessionKey) ?? [];
}

function appendHistory(sessionKey: string, role: 'user' | 'assistant', content: string) {
  const history = getHistory(sessionKey);
  history.push({ role, content });
  // Keep last 20 turns to avoid token overflow
  if (history.length > 20) history.splice(0, history.length - 20);
  sessionCache.set(sessionKey, history);
}

// ─── AI call helper ───────────────────────────────────────────────────────────

async function chat(
  ai: Ai,
  messages: Message[],
  model = CHAT_MODEL
): Promise<string> {
  const result = await (ai as any).run(model, {
    messages,
    max_tokens: 800,
    temperature: 0.7,
  });
  return (result as any)?.response?.trim() ?? 'Sorry, I had trouble responding. Try again!';
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const lilBeaverChatApi = new Hono<{ Bindings: Bindings }>();

// ── Admin chat ────────────────────────────────────────────────────────────────
lilBeaverChatApi.post('/admin', async (c) => {
  const body = await c.req.json<{ message: string; session_key?: string }>().catch(() => null);
  if (!body?.message) return c.json({ error: 'message is required' }, 400);

  const sessionKey = body.session_key ?? `admin-${Date.now()}`;
  const history    = getHistory(sessionKey);

  const messages: Message[] = [
    { role: 'system', content: ADMIN_SYSTEM },
    ...history,
    { role: 'user', content: body.message },
  ];

  try {
    const response = await chat(c.env.AI, messages);
    appendHistory(sessionKey, 'user', body.message);
    appendHistory(sessionKey, 'assistant', response);

    return c.json({ response, session_key: sessionKey });
  } catch (err) {
    console.error('Admin chat error:', err);
    return c.json({ error: 'Chat failed — Workers AI unavailable' }, 500);
  }
});

// ── Customer chat ─────────────────────────────────────────────────────────────
lilBeaverChatApi.post('/customer', async (c) => {
  const body = await c.req.json<{
    message: string;
    customer_id: number;
    customer_name?: string;
    session_key?: string;
  }>().catch(() => null);

  if (!body?.message || !body.customer_id) {
    return c.json({ error: 'message and customer_id are required' }, 400);
  }

  // Fetch customer from DB
  const customer = await c.env.DB.prepare(
    'SELECT id, name, email FROM customers WHERE id = ?'
  ).bind(body.customer_id).first<{ id: number; name: string; email: string }>();

  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  const sessionKey = body.session_key ?? `customer-${customer.id}-${Date.now()}`;
  const history    = getHistory(sessionKey);

  const messages: Message[] = [
    { role: 'system', content: CUSTOMER_SYSTEM(customer.name, customer.id, customer.email) },
    ...history,
    { role: 'user', content: body.message },
  ];

  try {
    const response = await chat(c.env.AI, messages);
    appendHistory(sessionKey, 'user', body.message);
    appendHistory(sessionKey, 'assistant', response);

    return c.json({ response, session_key: sessionKey, customer_id: customer.id });
  } catch (err) {
    console.error('Customer chat error:', err);
    return c.json({ error: 'Chat failed — Workers AI unavailable' }, 500);
  }
});

// ── Public homepage chat (no auth, rate-limited by IP-style key) ──────────────
lilBeaverChatApi.post('/public', async (c) => {
  const body = await c.req.json<{ message: string; session_key?: string }>().catch(() => null);
  if (!body?.message) return c.json({ error: 'message is required' }, 400);

  const sessionKey = body.session_key ?? `public-${Date.now()}`;
  const history    = getHistory(sessionKey);

  // Public system — no business data access, just lead capture + info
  const publicSystem = `You are Lil Beaver 🦫, the friendly chatbot for The Handy Beaver — a handyman and cabin maintenance service in Hochatown/Broken Bow, Southeast Oklahoma.

Help visitors learn about services, get rough pricing estimates, and book a free consultation.

Services: Cabin maintenance plans, deck repair/staining, flooring, trim carpentry, custom cedar signs, tiny home finishing.
Pricing: Plans from $199/mo | Labor from $175 | Free consultations
Book: handybeaver.co/contact | Quote: handybeaver.co/quote | Design Studio: handybeaver.co/visualize

Keep replies short and friendly. End with a call to action if relevant. Use 🦫 occasionally.`;

  const messages: Message[] = [
    { role: 'system', content: publicSystem },
    ...history,
    { role: 'user', content: body.message },
  ];

  try {
    const response = await chat(c.env.AI, messages);
    appendHistory(sessionKey, 'user', body.message);
    appendHistory(sessionKey, 'assistant', response);
    return c.json({ response, session_key: sessionKey });
  } catch (err) {
    console.error('Public chat error:', err);
    return c.json({ error: 'Chat temporarily unavailable' }, 500);
  }
});

// ── Photo upload — KV primary, R2 fallback ────────────────────────────────────
const UPLOAD_TTL = 30 * 24 * 60 * 60; // 30 days

async function saveUpload(env: Bindings, key: string, data: ArrayBuffer, contentType: string): Promise<string> {
  if (env.KV) {
    await env.KV.put(key, data, { metadata: { contentType }, expirationTtl: UPLOAD_TTL });
  } else if (env.IMAGES) {
    await env.IMAGES.put(key, data, { httpMetadata: { contentType } });
  } else {
    throw new Error('No storage available');
  }
  return `https://handybeaver.co/api/assets/${key}`;
}

lilBeaverChatApi.post('/upload', async (c) => {
  if (!c.env.KV && !c.env.IMAGES) {
    return c.json({ error: 'Storage not configured', workaround: 'Text photos to (580) 392-9061' }, 503);
  }
  const formData = await c.req.formData();
  const file = formData.get('photo') as File | null;
  const customerId = formData.get('customer_id') as string ?? 'unknown';
  const context = formData.get('context') as string ?? 'chat';

  if (!file) return c.json({ error: 'No photo uploaded' }, 400);
  if (!file.type.startsWith('image/')) return c.json({ error: 'Images only (JPEG, PNG, WebP)' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Max 10MB' }, 400);

  const ext = file.name.split('.').pop() ?? 'jpg';
  const key = `uploads/${context}/${customerId}/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${ext}`;
  const buf = await file.arrayBuffer();
  const url = await saveUpload(c.env, key, buf, file.type);

  return c.json({ success: true, key, url, filename: file.name, size: file.size });
});

lilBeaverChatApi.post('/upload-multiple', async (c) => {
  if (!c.env.KV && !c.env.IMAGES) {
    return c.json({ error: 'Storage not configured', workaround: 'Text photos to (580) 392-9061' }, 503);
  }
  const formData = await c.req.formData();
  const customerId = formData.get('customer_id') as string ?? 'unknown';
  const context = formData.get('context') as string ?? 'chat';
  const uploads: { key: string; url: string; filename: string }[] = [];
  const errors: { filename: string; error: string }[] = [];

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File) || !value.name) continue;
    if (!value.type.startsWith('image/')) { errors.push({ filename: value.name, error: 'Not an image' }); continue; }
    if (value.size > 10 * 1024 * 1024) { errors.push({ filename: value.name, error: 'Too large (max 10MB)' }); continue; }
    const ext = value.name.split('.').pop() ?? 'jpg';
    const key = `uploads/${context}/${customerId}/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${ext}`;
    try {
      const url = await saveUpload(c.env, key, await value.arrayBuffer(), value.type);
      uploads.push({ key, url, filename: value.name });
    } catch (e) {
      errors.push({ filename: value.name, error: String(e) });
    }
  }
  return c.json({ success: true, uploads, errors: errors.length ? errors : undefined, count: uploads.length });
});

// ── Status ────────────────────────────────────────────────────────────────────
lilBeaverChatApi.get('/status', async (c) => {
  return c.json({
    status: 'ok',
    model: CHAT_MODEL,
    hermes: HERMES_MODEL,
    storage: c.env.KV ? 'kv' : c.env.IMAGES ? 'r2' : 'none',
    uploads_enabled: !!(c.env.KV || c.env.IMAGES),
    endpoints: {
      admin:    'POST /api/lilbeaver/admin',
      customer: 'POST /api/lilbeaver/customer',
      public:   'POST /api/lilbeaver/public',
      upload:   'POST /api/lilbeaver/upload',
      upload_multiple: 'POST /api/lilbeaver/upload-multiple',
    },
  });
});