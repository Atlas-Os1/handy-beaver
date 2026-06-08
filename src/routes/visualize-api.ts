import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  GEMINI_API_KEY?: string;
  AI?: any; // Cloudflare Workers AI binding
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

// Usage limits by customer status
const USAGE_LIMITS: Record<string, number> = {
  lead: 3,
  prospect: 3,
  quote: 3,
  active: 10,
  completed: 5,
};

// ─── Fixed Pricing Table ──────────────────────────────────────────────────────
// These rates are authoritative. The AI selects items + quantities from this
// table, so $/unit is always consistent between runs.
const LABOR_RATES: Record<string, number> = {
  'Finish Carpentry': 95,
  'Framing & Rough Carpentry': 75,
  'Tile Work': 85,
  'Flooring Installation': 65,
  'Painting & Staining': 45,
  'Sign Fabrication': 55,
  'Demo & Cleanup': 45,
  'Project Management': 35,
};

const MATERIAL_PRICES: Record<string, { price: number; unit: string }> = {
  'Cedar Shiplap': { price: 3.50, unit: 'sqft' },
  'Knotty Pine T&G': { price: 4.25, unit: 'sqft' },
  'Blue Pine / Beetle Kill': { price: 8.50, unit: 'sqft' },
  'Oak Hardwood Flooring': { price: 8.50, unit: 'sqft' },
  'Laminate Flooring': { price: 4.50, unit: 'sqft' },
  'Luxury Vinyl Plank': { price: 6.00, unit: 'sqft' },
  'Ceramic Tile': { price: 4.00, unit: 'sqft' },
  'Porcelain / Stone Tile': { price: 8.00, unit: 'sqft' },
  'Baseboard & Trim': { price: 3.50, unit: 'lf' },
  'Crown Molding': { price: 6.00, unit: 'lf' },
  'Handrail': { price: 18.00, unit: 'lf' },
  'Interior Door': { price: 280, unit: 'each' },
  'Exterior Door': { price: 450, unit: 'each' },
  'Standard Vanity': { price: 350, unit: 'each' },
  'Custom Live-Edge Vanity': { price: 850, unit: 'each' },
  'Toilet': { price: 220, unit: 'each' },
  'Paint': { price: 45, unit: 'gallon' },
  'Deck / Wood Stain': { price: 55, unit: 'gallon' },
  'Cedar Sign Stock': { price: 65, unit: 'each' },
  'Epoxy Resin': { price: 35, unit: 'quart' },
  'Waste Removal': { price: 350, unit: 'job' },
};

// Build pricing table string for the quote prompt
function buildPricingTableStr(): string {
  const laborLines = Object.entries(LABOR_RATES)
    .map(([name, rate]) => `  - ${name}: $${rate}/hr`)
    .join('\n');
  const materialLines = Object.entries(MATERIAL_PRICES)
    .map(([name, { price, unit }]) => `  - ${name}: $${price}/${unit}`)
    .join('\n');
  return `LABOR (per hour):\n${laborLines}\n\nMATERIALS:\n${materialLines}`;
}

export const visualizeApi = new Hono<{ Bindings: Bindings }>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUsageToday(db: D1Database, customerId: number): Promise<number> {
  const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const result = await db.prepare(
    `SELECT COUNT(*) as count FROM visualizer_usage WHERE customer_id = ? AND created_at >= ?`
  ).bind(customerId, startOfDay).first<{ count: number }>();
  return result?.count || 0;
}

async function getPortalCustomer(db: D1Database, token: string): Promise<CustomerSession | null> {
  const now = Math.floor(Date.now() / 1000);
  const result = await db.prepare(`
    SELECT cs.customer_id, c.status, c.email, c.name
    FROM customer_sessions cs
    JOIN customers c ON cs.customer_id = c.id
    WHERE cs.token = ? AND cs.expires_at > ?
  `).bind(token, now).first<CustomerSession>();
  return result || null;
}

async function getAdmin(db: D1Database, token: string): Promise<AdminSession | null> {
  const [githubId] = token.split(':');
  const admin = await db.prepare(
    `SELECT id, role FROM admins WHERE github_id = ?`
  ).bind(githubId).first<AdminSession>();
  return admin || null;
}

// Convert ArrayBuffer to base64 in chunks to avoid stack overflow
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

// ─── Status Check ─────────────────────────────────────────────────────────────

visualizeApi.get('/status', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken = getCookie(c, 'hb_admin');

  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) {
      return c.json({ authorized: true, isAdmin: true, unlimited: true, usedToday: 0, remaining: 999, status: 'admin' });
    }
  }

  if (portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      const usedToday = await getUsageToday(c.env.DB, customer.customer_id);
      const limit = USAGE_LIMITS[customer.status] || 3;
      return c.json({
        authorized: true, isAdmin: false, unlimited: false,
        usedToday, remaining: Math.max(0, limit - usedToday), limit,
        status: customer.status, name: customer.name,
      });
    }
  }

  return c.json({ authorized: false, isAdmin: false, unlimited: false, usedToday: 0, remaining: 0, status: 'guest' });
});

// ─── Generate Visualization (Image-to-Image) ──────────────────────────────────

visualizeApi.post('/generate', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken = getCookie(c, 'hb_admin');

  let customerId: number | null = null;
  let isAdmin = false;
  let customerStatus = 'guest';

  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) { isAdmin = true; customerId = null; }
  }

  if (!isAdmin && portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      customerId = customer.customer_id;
      customerStatus = customer.status;
      const usedToday = await getUsageToday(c.env.DB, customerId);
      const limit = USAGE_LIMITS[customerStatus] || 3;
      if (usedToday >= limit) {
        return c.json({ success: false, error: 'Daily limit reached', usedToday, limit }, 429);
      }
    }
  }

  if (customerId === null && !isAdmin) {
    return c.json({ success: false, error: 'Please sign in to use the AI Visualizer' }, 401);
  }

  const formData = await c.req.formData();
  const imageFile = formData.get('image') as File | null;
  const prompt = formData.get('prompt') as string;
  const style = (formData.get('style') as string) || '';

  if (!imageFile || !prompt) {
    return c.json({ success: false, error: 'Image and prompt are required' }, 400);
  }
  if (!imageFile.type.startsWith('image/')) {
    return c.json({ success: false, error: 'Invalid image type' }, 400);
  }
  if (imageFile.size > 10 * 1024 * 1024) {
    return c.json({ success: false, error: 'Image too large (max 10MB)' }, 400);
  }

  try {
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = bufferToBase64(imageBuffer);

    // Store input image in R2
    const inputKey = `visualizer/input/${Date.now()}-${crypto.randomUUID()}.${imageFile.type.split('/')[1] || 'jpg'}`;
    if (c.env.IMAGES) {
      await c.env.IMAGES.put(inputKey, imageBuffer, { httpMetadata: { contentType: imageFile.type } });
    }

    if (!c.env.GEMINI_API_KEY) {
      // Demo mode
      const now = Math.floor(Date.now() / 1000);
      await c.env.DB.prepare(
        `INSERT INTO visualizer_usage (customer_id, image_key, prompt, created_at) VALUES (?, ?, ?, ?)`
      ).bind(customerId, inputKey, prompt, now).run();
      return c.json({ success: true, demo: true, message: 'AI visualization coming soon! Your request has been logged.' });
    }

    // Step 1: Enhance prompt with image context using Gemini Flash
    let enhancedPrompt = prompt;
    let promptForViz = prompt;
    try {
      const enhanceRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: { mime_type: imageFile.type, data: imageBase64 }
                },
                {
                  text: `You are a home improvement visualization expert. Look at this photo carefully and understand the space.

The customer wants to visualize this change: "${prompt}"
${style ? `Design style preference: ${style}` : ''}

Write a precise image editing instruction starting with "In this exact photo, " that:
1. Describes the specific changes to make to the uploaded photo
2. References actual elements visible in the photo
3. Specifies materials, colors, and finishes from the style preference
4. Instructs to keep everything else unchanged

Output ONLY the enhanced instruction, no explanations or preamble.`
                }
              ]
            }],
            generationConfig: { maxOutputTokens: 250, temperature: 0.3 },
          }),
        }
      );
      if (enhanceRes.ok) {
        const enhanceData = await enhanceRes.json() as any;
        const txt = enhanceData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (txt) {
          enhancedPrompt = txt;
          promptForViz = txt;
        }
      }
    } catch (e) {
      console.error('Prompt enhancement failed:', e);
    }

    // Step 2: Image-to-image editing via Gemini 2.0 Flash (primary)
    let imageData: Uint8Array | null = null;
    let generationMethod = 'unknown';

    const geminiModels = [
      'gemini-2.0-flash-exp-image-generation',
      'gemini-2.0-flash-exp',
    ];

    for (const model of geminiModels) {
      try {
        console.log(`Trying Gemini image editing with model: ${model}`);
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${c.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: imageFile.type, data: imageBase64 } },
                  {
                    text: `${promptForViz}

IMPORTANT: This must look like a realistic home improvement visualization. Preserve the original photo's perspective, lighting, and all unchanged elements. Only modify what is explicitly requested. Professional quality photo-realistic result.`
                  }
                ]
              }],
              generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                temperature: 0.4,
              },
            }),
          }
        );

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.log(`Gemini model ${model} returned ${geminiRes.status}: ${errText.substring(0, 200)}`);
          continue;
        }

        const geminiData = await geminiRes.json() as any;
        const parts = geminiData.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
          if (part.inline_data?.data && part.inline_data.data.length > 100) {
            const binaryStr = atob(part.inline_data.data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
            imageData = bytes;
            generationMethod = model;
            console.log(`Success with ${model}, size: ${imageData.length} bytes`);
            break;
          }
        }

        if (imageData) break;
      } catch (e) {
        console.error(`Gemini model ${model} failed:`, e);
      }
    }

    // Step 3: CF Workers AI fallback (text-to-image with enhanced description)
    if (!imageData && c.env.AI) {
      console.log('Falling back to CF Workers AI text-to-image...');
      const cfModels = [
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/lykon/dreamshaper-8-lcm',
      ];

      for (const model of cfModels) {
        try {
          const result = await c.env.AI.run(model, {
            prompt: `Photorealistic home improvement visualization: ${promptForViz}. Professional photo quality, natural lighting, detailed.`,
          });

          let buffer: ArrayBuffer | null = null;
          if (result instanceof ReadableStream) {
            const reader = result.getReader();
            const chunks: Uint8Array[] = [];
            let total = 0;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              total += value.length;
            }
            const combined = new Uint8Array(total);
            let offset = 0;
            for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
            buffer = combined.buffer;
          } else if (result instanceof ArrayBuffer) {
            buffer = result;
          } else if (result?.image) {
            const b = atob(result.image);
            const arr = new Uint8Array(b.length);
            for (let i = 0; i < b.length; i++) arr[i] = b.charCodeAt(i);
            buffer = arr.buffer;
          }

          if (buffer && buffer.byteLength > 100) {
            imageData = new Uint8Array(buffer);
            generationMethod = model.split('/').pop() || 'workers-ai';
            console.log(`CF Workers AI success with ${model}, size: ${imageData.length} bytes`);
            break;
          }
        } catch (e) {
          console.error(`CF Workers AI model ${model} failed:`, e);
        }
      }
    }

    if (!imageData || imageData.length < 100) {
      throw new Error('All AI models failed. Please try again.');
    }

    // Store result in R2
    const resultKey = `visualizer/output/${Date.now()}-${crypto.randomUUID()}.jpg`;
    if (c.env.IMAGES) {
      await c.env.IMAGES.put(resultKey, imageData, {
        httpMetadata: { contentType: 'image/jpeg' },
        customMetadata: { prompt, customerId: String(customerId) },
      });
    }

    // Convert result to data URL (used when R2 is unavailable or for immediate display)
    const resultBase64 = bufferToBase64(imageData.buffer as ArrayBuffer);
    const resultDataUrl = `data:image/jpeg;base64,${resultBase64}`;
    const resultUrl = c.env.IMAGES ? `/api/assets/${resultKey}` : resultDataUrl;
    const inputUrl = c.env.IMAGES ? `/api/assets/${inputKey}` : '';

    // Log to visualizer_usage
    const now = Math.floor(Date.now() / 1000);
    const insertResult = await c.env.DB.prepare(
      `INSERT INTO visualizer_usage (customer_id, image_key, prompt, result_key, result_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(customerId, inputKey, `[${generationMethod}] ${enhancedPrompt}`, resultKey, resultUrl, now).run();

    return c.json({
      success: true,
      resultUrl,
      inputUrl,
      enhancedPrompt,
      usageId: insertResult.meta.last_row_id,
    });

  } catch (error) {
    console.error('Visualization error:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Generation failed' }, 500);
  }
});

// ─── Quote Estimate ───────────────────────────────────────────────────────────

visualizeApi.post('/quote', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken = getCookie(c, 'hb_admin');

  let customerId: number | null = null;
  let isAdmin = false;

  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) { isAdmin = true; customerId = null; }
  }
  if (!isAdmin && portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) customerId = customer.customer_id;
  }

  if (customerId === null && !isAdmin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{
    project_type: string;
    style?: string;
    description: string;
    sqft?: number;
    usage_id?: number;
  }>();

  if (!body.project_type || !body.description) {
    return c.json({ error: 'project_type and description are required' }, 400);
  }

  if (!c.env.GEMINI_API_KEY) {
    // Demo mode - return sample data
    return c.json({
      success: true,
      demo: true,
      line_items: [
        { type: 'LABOR', description: 'Finish Carpentry', qty: 8, unit: 'hr', price_per_unit: 95, total: 760 },
        { type: 'MATERIALS', description: 'Cedar Shiplap', qty: 120, unit: 'sqft', price_per_unit: 3.50, total: 420 },
        { type: 'LABOR', description: 'Painting & Staining', qty: 4, unit: 'hr', price_per_unit: 45, total: 180 },
        { type: 'MATERIALS', description: 'Deck / Wood Stain', qty: 2, unit: 'gallon', price_per_unit: 55, total: 110 },
      ],
      total_amount: 1470,
      summary: 'Sample estimate. Configure GEMINI_API_KEY for real quotes.',
    });
  }

  try {
    const pricingTable = buildPricingTableStr();
    const quotePrompt = `You are a professional home improvement cost estimator for The Handy Beaver in Southeast Oklahoma.

STRICT RULE: Select ONLY from the pricing items below. Do NOT invent prices.

${pricingTable}

PROJECT TO ESTIMATE:
Type: ${body.project_type}
${body.style ? `Style: ${body.style}` : ''}
Description: ${body.description}
${body.sqft ? `Estimated area: ${body.sqft} sqft` : ''}

Select 4 to 8 line items. Separate LABOR from MATERIALS. Return ONLY valid JSON:
{
  "line_items": [
    {
      "type": "LABOR",
      "description": "<exact name from table>",
      "qty": <number>,
      "unit": "<hr|sqft|lf|each|gallon|quart|job>",
      "price_per_unit": <exact price>,
      "total": <qty * price_per_unit>
    }
  ],
  "summary": "<2-3 sentence summary>"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: quotePrompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!geminiRes.ok) throw new Error(`Gemini quote failed: ${geminiRes.status}`);

    const geminiData = await geminiRes.json() as any;
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const lineItems = (parsed.line_items || []).map((item: any) => {
      let pricePerUnit = item.price_per_unit;
      if (item.type === 'LABOR' && LABOR_RATES[item.description] !== undefined) {
        pricePerUnit = LABOR_RATES[item.description];
      } else if (item.type === 'MATERIALS' && MATERIAL_PRICES[item.description] !== undefined) {
        pricePerUnit = MATERIAL_PRICES[item.description].price;
      }
      const qty = Number(item.qty) || 1;
      return { type: item.type || 'MATERIALS', description: item.description, qty, unit: item.unit, price_per_unit: pricePerUnit, total: Math.round(qty * pricePerUnit * 100) / 100 };
    });

    const totalAmount = Math.round(lineItems.reduce((sum: number, i: any) => sum + i.total, 0) * 100) / 100;

    const now = Math.floor(Date.now() / 1000);
    const insertResult = await c.env.DB.prepare(
      `INSERT INTO visualizer_quotes (customer_id, usage_id, project_type, style, description, line_items, total_amount, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(customerId, body.usage_id || null, body.project_type, body.style || null, body.description, JSON.stringify(lineItems), totalAmount, parsed.summary || '', now).run()
      .catch(e => { console.error('Failed to save quote:', e); return { meta: { last_row_id: null } }; });

    return c.json({ success: true, line_items: lineItems, total_amount: totalAmount, summary: parsed.summary || '', quote_id: (insertResult as any).meta?.last_row_id });

  } catch (error: any) {
    console.error('Quote error:', error);
    return c.json({ error: error.message || 'Quote failed' }, 500);
  }
});

// --- Recent Quotes (Admin) ---
visualizeApi.get('/quotes/recent', async (c) => {
  const adminToken = getCookie(c, 'hb_admin');
  if (!adminToken) return c.json({ error: 'Unauthorized' }, 401);
  const admin = await getAdmin(c.env.DB, adminToken);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  const results = await c.env.DB.prepare(`
    SELECT vq.*, c.name as customer_name, c.email as customer_email
    FROM visualizer_quotes vq LEFT JOIN customers c ON vq.customer_id = c.id
    ORDER BY vq.created_at DESC LIMIT 20
  `).all();
  return c.json({ quotes: results.results });
});

// --- Save Visualization ---
visualizeApi.post('/save/:id', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const id = c.req.param('id');
  if (!portalToken) return c.json({ error: 'Unauthorized' }, 401);
  const customer = await getPortalCustomer(c.env.DB, portalToken);
  if (!customer) return c.json({ error: 'Unauthorized' }, 401);
  const result = await c.env.DB.prepare(`UPDATE visualizer_usage SET saved_indefinitely = 1 WHERE id = ? AND customer_id = ?`).bind(id, customer.customer_id).run();
  if (result.meta.changes === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

// --- Usage History ---
visualizeApi.get('/history', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken = getCookie(c, 'hb_admin');
  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) {
      const results = await c.env.DB.prepare(`SELECT vu.*, c.name, c.email FROM visualizer_usage vu LEFT JOIN customers c ON vu.customer_id = c.id ORDER BY vu.created_at DESC LIMIT 50`).all();
      return c.json({ history: results.results, isAdmin: true });
    }
  }
  if (portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      const results = await c.env.DB.prepare(`SELECT * FROM visualizer_usage WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20`).bind(customer.customer_id).all();
      return c.json({ history: results.results, isAdmin: false });
    }
  }
  return c.json({ error: 'Unauthorized' }, 401);
});
