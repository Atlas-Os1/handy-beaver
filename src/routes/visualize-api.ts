import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

// ─── Types ────────────────────────────────────────────────────────────────────

type Bindings = {
  DB: D1Database;
  IMAGES?: R2Bucket;   // Optional — R2 pending
  KV: KVNamespace;     // Primary image store
  AI: Ai;
};

type CustomerSession = {
  customer_id: number;
  status: string;
  email: string;
  name: string;
};

type AdminSession = {
  id: number;
  role: string;
};

type LineItem = {
  category: string;
  description: string;
  qty: number;
  unit: string;
  unit_cost: number;
  total: number;
};

type QuoteTotals = {
  materials: number;
  labor: number;
  overhead: number;
  markup: number;
  grand: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const USAGE_LIMITS: Record<string, number> = {
  lead: 3,
  prospect: 5,
  quote: 5,
  active: 20,
  completed: 10,
};

// Workers AI models — ordered by quality/preference
const IMAGE_MODELS = [
  '@cf/black-forest-labs/flux-2-klein-9b',   // newest, fastest, best quality
  '@cf/black-forest-labs/flux-1-schnell',    // reliable fallback
  '@cf/lykon/dreamshaper-8-lcm',             // last resort
] as const;

const HERMES_MODEL = '@cf/nousresearch/hermes-2-pro-mistral-7b';

// ─── KV TTLs ──────────────────────────────────────────────────────────────────
const KV_TTL_VISUALIZER = 7 * 24 * 60 * 60;   // 7 days — generated images
const KV_TTL_UPLOAD     = 30 * 24 * 60 * 60;  // 30 days — user uploads

/** Store binary asset in KV (primary) with R2 as fallback */
async function storeAsset(
  env: Bindings,
  key: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string,
  ttl = KV_TTL_VISUALIZER
): Promise<string> {
  const buf = data instanceof Uint8Array ? data.buffer : data;
  if (env.KV) {
    await env.KV.put(key, buf, { metadata: { contentType }, expirationTtl: ttl });
    return `/api/assets/${key}`;
  }
  if (env.IMAGES) {
    await env.IMAGES.put(key, buf, { httpMetadata: { contentType } });
    return `/api/assets/${key}`;
  }
  throw new Error('No storage configured — add KV or R2 binding');
}

const CHAT_MODEL   = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

// Labor rates from pricing config
const LABOR_RATES = {
  standard: 175 / 6,   // $/hr for ≤6 hr jobs
  day_rate: 300 / 8,   // $/hr for full-day jobs
  helper: 100 / 6,     // $/hr helper
  overhead_pct: 0.15,  // 15% overhead
  markup_pct: 0.20,    // 20% markup
};

// Mode → prompt system prefix
const MODE_CONTEXT: Record<string, string> = {
  remodel:  'Southeast Oklahoma cabin and home remodel visualization. Hochatown/Broken Bow area aesthetic.',
  addition: 'New cabin room addition or structural expansion in SE Oklahoma mountain/lake setting.',
  sign:     'Custom hand-crafted cedar cabin sign design, rustic mountain lodge style, SE Oklahoma.',
  material: 'Material and finish visualization for SE Oklahoma cabin or home, photorealistic.',
};

export const visualizeApi = new Hono<{ Bindings: Bindings }>();

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getPortalCustomer(db: D1Database, token: string): Promise<CustomerSession | null> {
  const now = Math.floor(Date.now() / 1000);
  return db.prepare(`
    SELECT cs.customer_id, c.status, c.email, c.name
    FROM customer_sessions cs
    JOIN customers c ON cs.customer_id = c.id
    WHERE cs.token = ? AND cs.expires_at > ?
  `).bind(token, now).first<CustomerSession>();
}

async function getAdmin(db: D1Database, token: string): Promise<AdminSession | null> {
  const [githubId] = token.split(':');
  return db.prepare(`SELECT id, role FROM admins WHERE github_id = ?`)
    .bind(githubId).first<AdminSession>();
}

async function getUsageToday(db: D1Database, customerId: number): Promise<number> {
  const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const r = await db.prepare(`
    SELECT COUNT(*) as count FROM visualizer_usage
    WHERE customer_id = ? AND created_at >= ?
  `).bind(customerId, startOfDay).first<{ count: number }>();
  return r?.count ?? 0;
}

// ─── Image generation helper ──────────────────────────────────────────────────

async function generateImage(ai: Ai, prompt: string): Promise<{ data: Uint8Array; model: string }> {
  let lastError: unknown;

  for (const model of IMAGE_MODELS) {
    try {
      const result = await (ai as any).run(model, {
        prompt: `${prompt}. Photorealistic, high quality, professional photography, natural lighting, ultra-detailed.`,
        num_steps: model.includes('flux-2') ? 4 : 20,
      });

      let buffer: ArrayBuffer | null = null;

      if (result instanceof ReadableStream) {
        const chunks: Uint8Array[] = [];
        const reader = result.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) { merged.set(c, offset); offset += c.length; }
        buffer = merged.buffer;
      } else if (result instanceof ArrayBuffer) {
        buffer = result;
      } else if (result && typeof result === 'object' && 'image' in result) {
        const b64 = (result as any).image as string;
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        buffer = bytes.buffer;
      }

      if (buffer && buffer.byteLength > 500) {
        return { data: new Uint8Array(buffer), model };
      }
    } catch (err) {
      console.error(`Model ${model} failed:`, err);
      lastError = err;
    }
  }

  throw new Error(`All image models failed. Last: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

// ─── Prompt enhancement via Hermes ───────────────────────────────────────────

async function enhancePrompt(ai: Ai, userPrompt: string, mode: string): Promise<string> {
  const modeContext = MODE_CONTEXT[mode] ?? MODE_CONTEXT.remodel;

  try {
    const result = await (ai as any).run(HERMES_MODEL, {
      messages: [
        {
          role: 'system',
          content: `You are a professional home improvement visualization expert for The Handy Beaver,
a handyman service in Hochatown/Broken Bow, Southeast Oklahoma. Context: ${modeContext}
Your task: Rewrite the user's prompt into a detailed image generation prompt (1-2 sentences max).
Include: specific wood species, stain colors, finish types, construction details, lighting conditions.
Output ONLY the enhanced prompt — no explanation, no quotes.`,
        },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.6,
    });

    const text = (result as any)?.response?.trim();
    return text && text.length > 10 ? text : userPrompt;
  } catch (err) {
    console.warn('Prompt enhancement failed, using original:', err);
    return userPrompt;
  }
}

// ─── AI Quote generation ──────────────────────────────────────────────────────

async function generateQuoteAI(
  ai: Ai,
  db: D1Database,
  params: {
    mode: string;
    area_type: string;
    style_preset: string;
    sqft: number;
    prompt: string;
    lf?: number;
  }
): Promise<{ line_items: LineItem[]; totals: QuoteTotals; summary: string }> {
  // Pull relevant materials from catalog
  const mats = await db.prepare(`
    SELECT name, category, unit, retail_cost, coverage, description
    FROM material_catalog
    WHERE active = 1
    ORDER BY category, name
  `).all<{ name: string; category: string; unit: string; retail_cost: number; coverage: number | null; description: string }>();

  const catalog = (mats.results ?? []).map(
    m => `${m.category}|${m.name}|${m.unit}|$${m.retail_cost}${m.coverage ? `|covers ${m.coverage} sqft/gal` : ''}`
  ).join('\n');

  const systemPrompt = `You are a construction estimator for The Handy Beaver handyman service in SE Oklahoma.
Labor rates: $${LABOR_RATES.standard.toFixed(0)}/hr standard, $${LABOR_RATES.day_rate.toFixed(0)}/hr full-day, $${LABOR_RATES.helper.toFixed(0)}/hr helper.
Overhead: ${(LABOR_RATES.overhead_pct * 100).toFixed(0)}%. Markup: ${(LABOR_RATES.markup_pct * 100).toFixed(0)}%.

Available materials (category|name|unit|price):
${catalog}

Respond with ONLY valid JSON matching this schema exactly:
{
  "line_items": [
    { "category": "materials"|"labor"|"equipment", "description": string, "qty": number, "unit": string, "unit_cost": number, "total": number }
  ],
  "summary": "one sentence plain-english summary of this estimate"
}`;

  const userMsg = `Generate a detailed itemized estimate for:
Mode: ${params.mode}
Area type: ${params.area_type}
Style: ${params.style_preset}
Size: ${params.sqft} sqft${params.lf ? `, ${params.lf} linear feet` : ''}
Description: "${params.prompt}"

Include realistic quantities for all materials, prep work, and labor. Break labor into skilled and helper separately.`;

  let line_items: LineItem[] = [];
  let summary = '';

  try {
    const result = await (ai as any).run(CHAT_MODEL, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });

    const text = (result as any)?.response ?? '';
    // Extract JSON from response (may have surrounding text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      line_items = parsed.line_items ?? [];
      summary = parsed.summary ?? '';
    }
  } catch (err) {
    console.error('Quote generation failed:', err);
    // Fallback: generate a basic estimate from sqft
    line_items = buildFallbackLineItems(params);
    summary = `Estimated cost for ${params.sqft} sqft ${params.area_type} ${params.mode}.`;
  }

  const totals = computeTotals(line_items);
  return { line_items, totals, summary };
}

function buildFallbackLineItems(params: { mode: string; sqft: number; area_type: string }): LineItem[] {
  const { sqft } = params;
  const items: LineItem[] = [
    { category: 'materials', description: 'Lumber & structural materials', qty: sqft, unit: 'sqft', unit_cost: 6.50, total: sqft * 6.50 },
    { category: 'materials', description: 'Fasteners & hardware', qty: 1, unit: 'lot', unit_cost: sqft * 0.40, total: sqft * 0.40 },
    { category: 'materials', description: 'Stain / finish', qty: Math.ceil(sqft / 150), unit: 'gallon', unit_cost: 65, total: Math.ceil(sqft / 150) * 65 },
    { category: 'labor', description: 'Skilled labor', qty: Math.ceil(sqft / 20), unit: 'hr', unit_cost: LABOR_RATES.standard, total: Math.ceil(sqft / 20) * LABOR_RATES.standard },
    { category: 'labor', description: 'Helper labor', qty: Math.ceil(sqft / 30), unit: 'hr', unit_cost: LABOR_RATES.helper, total: Math.ceil(sqft / 30) * LABOR_RATES.helper },
  ];
  return items;
}

function computeTotals(items: LineItem[]): QuoteTotals {
  const materials = items.filter(i => i.category === 'materials').reduce((s, i) => s + i.total, 0);
  const labor     = items.filter(i => i.category === 'labor').reduce((s, i) => s + i.total, 0);
  const equipment = items.filter(i => i.category === 'equipment').reduce((s, i) => s + i.total, 0);
  const subtotal  = materials + labor + equipment;
  const overhead  = subtotal * LABOR_RATES.overhead_pct;
  const markup    = (subtotal + overhead) * LABOR_RATES.markup_pct;
  const grand     = subtotal + overhead + markup;
  return { materials, labor: labor + equipment, overhead, markup, grand };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/visualize/status
visualizeApi.get('/status', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken  = getCookie(c, 'hb_admin');

  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) return c.json({ authorized: true, isAdmin: true, unlimited: true, remaining: 9999, status: 'admin' });
  }

  if (portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      const usedToday = await getUsageToday(c.env.DB, customer.customer_id);
      const limit = USAGE_LIMITS[customer.status] ?? 3;
      return c.json({
        authorized: true, isAdmin: false, unlimited: false,
        usedToday, remaining: Math.max(0, limit - usedToday), limit,
        status: customer.status, name: customer.name,
      });
    }
  }

  return c.json({ authorized: false, isAdmin: false, unlimited: false, remaining: 0, status: 'guest' });
});

// GET /api/visualize/materials
visualizeApi.get('/materials', async (c) => {
  const category = c.req.query('category');
  const query = category
    ? `SELECT * FROM material_catalog WHERE active = 1 AND category = ? ORDER BY name`
    : `SELECT * FROM material_catalog WHERE active = 1 ORDER BY category, name`;
  const result = category
    ? await c.env.DB.prepare(query).bind(category).all()
    : await c.env.DB.prepare(query).all();
  return c.json({ materials: result.results ?? [] });
});

// POST /api/visualize/generate
visualizeApi.post('/generate', async (c) => {
  // ── Auth ──
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken  = getCookie(c, 'hb_admin');
  let customerId: number | null = null;
  let isAdmin = false;

  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) { isAdmin = true; }
  }

  if (!isAdmin && portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      customerId = customer.customer_id;
      const usedToday = await getUsageToday(c.env.DB, customerId);
      const limit = USAGE_LIMITS[customer.status] ?? 3;
      if (usedToday >= limit) {
        return c.json({ success: false, error: 'Daily limit reached', usedToday, limit }, 429);
      }
    }
  }

  if (!isAdmin && customerId === null) {
    return c.json({ success: false, error: 'Sign in to use the Cabin Design Studio' }, 401);
  }

  // ── Parse form ──
  const formData  = await c.req.formData();
  const imageFile = formData.get('image') as File | null;
  const prompt    = (formData.get('prompt') as string | null)?.trim();
  const mode      = (formData.get('mode') as string | null) ?? 'remodel';
  const stylePreset = (formData.get('style_preset') as string | null) ?? 'rustic_cedar';
  const areaType  = (formData.get('area_type') as string | null) ?? 'exterior';

  if (!prompt) return c.json({ success: false, error: 'Prompt is required' }, 400);

  // Image optional for sign/addition modes
  if (!imageFile && mode === 'remodel') {
    return c.json({ success: false, error: 'Photo required for remodel mode' }, 400);
  }

  if (imageFile && imageFile.size > 10 * 1024 * 1024) {
    return c.json({ success: false, error: 'Image too large (max 10MB)' }, 400);
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const sessionId = crypto.randomUUID();

    // Store input image
    let inputKey: string | null = null;
    if (imageFile) {
      const buf = await imageFile.arrayBuffer();
      inputKey = `visualizer/input/${sessionId}.${imageFile.type.split('/')[1] || 'jpg'}`;
      await storeAsset(c.env, inputKey, buf, imageFile.type, KV_TTL_UPLOAD);
    }

    // Enhance prompt via Hermes
    const modePrefix = MODE_CONTEXT[mode] ?? '';
    const fullPrompt = `${areaType} ${mode} in Hochatown cabin style. ${prompt}`;
    const enhanced = await enhancePrompt(c.env.AI, fullPrompt, mode);

    // Generate image — for modes with a reference photo, guide the model with it
    const genPrompt = mode === 'sign'
      ? `Custom rustic cedar cabin sign: ${enhanced}. Dark wood, carved/routed lettering, stained finish, mountain cabin aesthetic, hung on cabin exterior, high quality product photo.`
      : `${modePrefix} ${enhanced}`;

    const { data: imageData, model: usedModel } = await generateImage(c.env.AI, genPrompt);

    // Store result in KV (7-day TTL) — falls back to R2 if bound
    const resultKey = `visualizer/output/${sessionId}.jpg`;
    await storeAsset(c.env, resultKey, imageData, 'image/jpeg', KV_TTL_VISUALIZER);

    // Save design session
    await c.env.DB.prepare(`
      INSERT INTO design_sessions
        (id, customer_id, mode, style_preset, area_type, input_image_key, result_image_key, prompt, enhanced_prompt, generation_model, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?, ?)
    `).bind(sessionId, customerId, mode, stylePreset, areaType, inputKey, resultKey, prompt, enhanced, usedModel, now, now).run();

    // Log usage
    await c.env.DB.prepare(`
      INSERT INTO visualizer_usage (customer_id, image_key, prompt, result_key, result_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(customerId, inputKey ?? 'text-only', `[${usedModel}] ${enhanced}`, resultKey, `/api/assets/${resultKey}`, now).run();

    return c.json({
      success: true,
      sessionId,
      resultUrl: `/api/assets/${resultKey}`,
      inputUrl: inputKey ? `/api/assets/${inputKey}` : null,
      enhancedPrompt: enhanced,
      model: usedModel,
    });
  } catch (err) {
    console.error('Visualization error:', err);
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Generation failed' }, 500);
  }
});

// POST /api/visualize/quote  — generate itemized quote from a design session
visualizeApi.post('/quote', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken  = getCookie(c, 'hb_admin');
  let customerId: number | null = null;
  let isAdmin = false;

  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) isAdmin = true;
  }
  if (!isAdmin && portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) customerId = customer.customer_id;
  }
  if (!isAdmin && !customerId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{
    session_id?: string;
    mode: string;
    area_type: string;
    style_preset: string;
    sqft: number;
    lf?: number;
    prompt: string;
  }>();

  if (!body.sqft || body.sqft <= 0) {
    return c.json({ success: false, error: 'sqft is required' }, 400);
  }

  try {
    const { line_items, totals, summary } = await generateQuoteAI(c.env.AI, c.env.DB, body);
    const now = Math.floor(Date.now() / 1000);

    // Save design quote
    const result = await c.env.DB.prepare(`
      INSERT INTO design_quotes
        (session_id, customer_id, title, line_items, sqft, materials_total, labor_total, overhead_total, markup_total, grand_total, notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    `).bind(
      body.session_id ?? null, customerId,
      `${body.area_type} ${body.mode} — ${body.sqft} sqft`,
      JSON.stringify(line_items), body.sqft,
      totals.materials, totals.labor, totals.overhead, totals.markup, totals.grand,
      summary, now
    ).run();

    // Update session status if provided
    if (body.session_id) {
      await c.env.DB.prepare(`
        UPDATE design_sessions SET status = 'quoted', quote_data = ?, updated_at = ? WHERE id = ?
      `).bind(JSON.stringify({ line_items, totals }), now, body.session_id).run();
    }

    return c.json({
      success: true,
      quote_id: result.meta.last_row_id,
      line_items,
      totals,
      summary,
    });
  } catch (err) {
    console.error('Quote error:', err);
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Quote failed' }, 500);
  }
});

// POST /api/visualize/request — customer requests this quote be converted to a real job
visualizeApi.post('/request', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  if (!portalToken) return c.json({ error: 'Unauthorized' }, 401);
  const customer = await getPortalCustomer(c.env.DB, portalToken);
  if (!customer) return c.json({ error: 'Unauthorized' }, 401);

  const { quote_id, notes } = await c.req.json<{ quote_id: number; notes?: string }>();
  const now = Math.floor(Date.now() / 1000);

  // Fetch the design quote
  const dq = await c.env.DB.prepare(`SELECT * FROM design_quotes WHERE id = ? AND customer_id = ?`)
    .bind(quote_id, customer.customer_id).first<any>();
  if (!dq) return c.json({ error: 'Quote not found' }, 404);

  // Mark as requested
  await c.env.DB.prepare(`UPDATE design_quotes SET status = 'sent', notes = ? WHERE id = ?`)
    .bind(notes ?? null, quote_id).run();

  // Create a formal quote in the quotes table
  const formal = await c.env.DB.prepare(`
    INSERT INTO quotes (customer_id, title, description, total_amount, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?)
  `).bind(
    customer.customer_id,
    dq.title ?? 'Design Studio Request',
    `AI Design Studio quote (id: ${quote_id}). ${dq.notes ?? ''}`,
    dq.grand_total, now, now
  ).run();

  // Update design quote with formal quote reference
  await c.env.DB.prepare(`UPDATE design_quotes SET converted_quote_id = ? WHERE id = ?`)
    .bind(formal.meta.last_row_id, quote_id).run();

  return c.json({ success: true, quote_id: formal.meta.last_row_id });
});

// GET /api/visualize/history
visualizeApi.get('/history', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken  = getCookie(c, 'hb_admin');

  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) {
      const results = await c.env.DB.prepare(`
        SELECT ds.*, c.name, c.email
        FROM design_sessions ds LEFT JOIN customers c ON ds.customer_id = c.id
        ORDER BY ds.created_at DESC LIMIT 50
      `).all();
      return c.json({ history: results.results ?? [], isAdmin: true });
    }
  }

  if (!portalToken) return c.json({ error: 'Unauthorized' }, 401);
  const customer = await getPortalCustomer(c.env.DB, portalToken);
  if (!customer) return c.json({ error: 'Unauthorized' }, 401);

  const results = await c.env.DB.prepare(`
    SELECT ds.*, dq.grand_total, dq.status as quote_status
    FROM design_sessions ds
    LEFT JOIN design_quotes dq ON dq.session_id = ds.id AND dq.id = (
      SELECT id FROM design_quotes WHERE session_id = ds.id ORDER BY created_at DESC LIMIT 1
    )
    WHERE ds.customer_id = ?
    ORDER BY ds.created_at DESC LIMIT 30
  `).bind(customer.customer_id).all();

  return c.json({ history: results.results ?? [], isAdmin: false });
});

// POST /api/visualize/save/:id
visualizeApi.post('/save/:id', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  if (!portalToken) return c.json({ error: 'Unauthorized' }, 401);
  const customer = await getPortalCustomer(c.env.DB, portalToken);
  if (!customer) return c.json({ error: 'Unauthorized' }, 401);

  const r = await c.env.DB.prepare(`
    UPDATE visualizer_usage SET saved_indefinitely = 1 WHERE id = ? AND customer_id = ?
  `).bind(c.req.param('id'), customer.customer_id).run();

  return r.meta.changes ? c.json({ success: true }) : c.json({ error: 'Not found' }, 404);
});