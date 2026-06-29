import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
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

// Usage limits by status
const USAGE_LIMITS: Record<string, number> = {
  lead: 3,
  prospect: 3,
  quote: 3,
  active: 10,
  completed: 5,
};

const ADMIN_UNLIMITED = true;

export const visualizeApi = new Hono<{ Bindings: Bindings }>();

// Check usage for a customer
async function getUsageToday(db: D1Database, customerId: number): Promise<number> {
  const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  
  const result = await db.prepare(`
    SELECT COUNT(*) as count FROM visualizer_usage 
    WHERE customer_id = ? AND created_at >= ?
  `).bind(customerId, startOfDay).first<{ count: number }>();
  
  return result?.count || 0;
}

// Get customer from portal session
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

// Get admin from admin session
async function getAdmin(db: D1Database, token: string): Promise<AdminSession | null> {
  const [githubId] = token.split(':');
  const admin = await db.prepare(`
    SELECT id, role FROM admins WHERE github_id = ?
  `).bind(githubId).first<AdminSession>();
  
  return admin || null;
}

// Check usage limits and return status
visualizeApi.get('/status', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken = getCookie(c, 'hb_admin');
  
  // Admin check first
  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) {
      return c.json({
        authorized: true,
        isAdmin: true,
        unlimited: true,
        usedToday: 0,
        remaining: Infinity,
        status: 'admin',
      });
    }
  }
  
  // Customer check
  if (portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      const usedToday = await getUsageToday(c.env.DB, customer.customer_id);
      const limit = USAGE_LIMITS[customer.status] || 3;
      
      return c.json({
        authorized: true,
        isAdmin: false,
        unlimited: false,
        usedToday,
        remaining: Math.max(0, limit - usedToday),
        limit,
        status: customer.status,
        name: customer.name,
      });
    }
  }
  
  // Not logged in
  return c.json({
    authorized: false,
    isAdmin: false,
    unlimited: false,
    usedToday: 0,
    remaining: 0,
    status: 'guest',
    message: 'Please sign in or request a quote to use the AI Visualizer',
  });
});

// Helper: convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

// Helper: generate image using Workers AI
async function generateWithWorkersAI(ai: any, prompt: string, inputImageBase64?: string): Promise<{ data: ArrayBuffer; mime: string; model: string } | null> {
  // Try img2img models first (klein models are fast + support image editing)
  const img2imgModels = [
    '@cf/black-forest-labs/flux-2-klein-4b',   // Fastest, cheapest, supports editing
    '@cf/black-forest-labs/flux-2-klein-9b',   // Higher quality, supports editing
    '@cf/black-forest-labs/flux-2-dev',        // Multi-reference support
  ];
  
  // Try prompting using multipart form (supports image input)
  if (inputImageBase64) {
    for (const modelName of img2imgModels) {
      try {
        console.log(`Trying img2img model: ${modelName}`);
        
        const form = new FormData();
        form.append('prompt', `Professional home improvement visualization: ${prompt}. Photorealistic, high quality, natural lighting, detailed textures.`);
        form.append('image', inputImageBase64);
        form.append('strength', '0.8');  // 0.8 = keep 80% of original, change 20%
        form.append('width', '1024');
        form.append('height', '1024');
        form.append('steps', '25');
        
        const formResponse = new Response(form);
        const formBody = formResponse.body;
        const formContentType = formResponse.headers.get('content-type') || 'multipart/form-data';
        
        const result = await ai.run(modelName, {
          multipart: {
            body: formBody,
            contentType: formContentType,
          },
        });
        
        // Klein models return { image: "base64..." }
        if (result && typeof result === 'object' && 'image' in result && typeof result.image === 'string') {
          const binaryString = atob(result.image);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          if (bytes.length > 100) {
            console.log(`Success with img2img model: ${modelName}, size: ${bytes.length} bytes`);
            return { data: bytes.buffer, mime: 'image/png', model: modelName.split('/').pop() || 'workers-ai' };
          }
        }
      } catch (err) {
        console.error(`Model ${modelName} failed:`, err);
      }
    }
  }
  
  // Fallback: text-to-image models (no image input, generates from scratch)
  const t2iModels = [
    { name: '@cf/black-forest-labs/flux-2-dev', type: 'base64-image' },
    { name: '@cf/black-forest-labs/flux-1-schnell', type: 'base64-image' },
    { name: '@cf/lykon/dreamshaper-8-lcm', type: 'readable-stream' },
  ];

  for (const { name, type } of t2iModels) {
    try {
      console.log(`Trying text-to-image model: ${name}`);
      
      // Skip flux-2-dev if we already tried it with img2img (it was in img2imgModels too)
      if (inputImageBase64 && name === '@cf/black-forest-labs/flux-2-dev') continue;
      
      const result = await ai.run(name, {
        prompt: `Professional home improvement visualization: ${prompt}. Photorealistic, high quality, natural lighting, detailed textures.`,
      });

      let buffer: ArrayBuffer | null = null;

      if (type === 'base64-image' && result && typeof result === 'object' && 'image' in result && typeof result.image === 'string') {
        const binaryString = atob(result.image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        buffer = bytes.buffer;
      } else if (result instanceof ReadableStream) {
        const reader = result.getReader();
        const chunks: Uint8Array[] = [];
        let totalLength = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalLength += value.length;
        }
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        buffer = combined.buffer;
      } else if (result instanceof ArrayBuffer) {
        buffer = result;
      }

      if (buffer && buffer.byteLength > 100) {
        console.log(`Success with model: ${name}, size: ${buffer.byteLength} bytes`);
        return { data: buffer, mime: 'image/png', model: name.split('/').pop() || 'workers-ai' };
      }
    } catch (err) {
      console.error(`Model ${name} failed:`, err);
    }
  }

  return null;
}

// Helper: generate image using Gemini Imagen
async function generateWithImagen(apiKey: string, prompt: string): Promise<{ data: ArrayBuffer; mime: string; model: string } | null> {
  try {
    console.log('Trying Gemini Imagen as fallback...');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ 
            prompt: `Professional home improvement visualization: ${prompt}. Photorealistic, high quality, natural lighting.`
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            personGeneration: 'dont_allow',
            safetySetting: 'block_low_and_above'
          }
        })
      }
    );

    const data = await res.json() as any;
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      const binaryString = atob(data.predictions[0].bytesBase64Encoded);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log(`Success with Imagen 4, size: ${bytes.length} bytes`);
      return { data: bytes.buffer, mime: 'image/png', model: 'imagen-4' };
    }
  } catch (err) {
    console.error('Gemini Imagen failed:', err);
  }
  return null;
}

// Test endpoint - check if AI model is working
visualizeApi.get('/test-ai', async (c) => {
  try {
    if (!c.env.AI) {
      return c.json({ success: false, error: 'AI binding not configured' });
    }
    
    // Test the multipart format (used by klein models)
    let multipartResult = null;
    try {
      const form = new FormData();
      form.append('prompt', 'A test image of a wooden deck with furniture');
      form.append('width', '512');
      form.append('height', '512');
      form.append('steps', '4');
      
      const formResponse = new Response(form);
      const mpResult = await c.env.AI.run('@cf/black-forest-labs/flux-2-klein-4b', {
        multipart: {
          body: formResponse.body,
          contentType: formResponse.headers.get('content-type') || 'multipart/form-data',
        },
      });
      
      const hasImage = mpResult && typeof mpResult === 'object' && 'image' in mpResult;
      multipartResult = { 
        success: true, 
        model: 'flux-2-klein-4b', 
        hasImage,
        imageLength: hasImage ? (mpResult as any).image.length : 0,
      };
    } catch (mpErr: any) {
      multipartResult = { success: false, error: mpErr.message?.substring(0, 200) };
    }
    
    // Also test the standard JSON format (used by flux-1-schnell)
    let standardResult = null;
    try {
      const result = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt: 'A small wooden deck with a cute cartoon beaver mascot, simple minimal design',
      });
      
      const type = typeof result;
      const hasImage = result && typeof result === 'object' && 'image' in result;
      
      standardResult = {
        success: true,
        model: 'flux-1-schnell',
        hasImage,
        imageLength: hasImage ? (result as any).image.length : 0,
      };
    } catch (stdErr: any) {
      standardResult = { success: false, error: stdErr.message?.substring(0, 200) };
    }
    
    return c.json({
      multipart: multipartResult,
      standard: standardResult,
    });
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message,
      stack: err.stack?.substring(0, 500),
    });
  }
});

// Generate visualization
visualizeApi.post('/generate', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken = getCookie(c, 'hb_admin');
  
  let customerId: number | null = null;
  let isAdmin = false;
  let customerStatus = 'guest';
  
  // Admin check
  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) {
      isAdmin = true;
      customerId = null;
    }
  }
  
  // Customer check
  if (!isAdmin && portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      customerId = customer.customer_id;
      customerStatus = customer.status;
      
      // Check usage limit
      const usedToday = await getUsageToday(c.env.DB, customerId);
      const limit = USAGE_LIMITS[customerStatus] || 3;
      
      if (usedToday >= limit) {
        return c.json({
          success: false,
          error: 'Daily limit reached',
          usedToday,
          limit,
        }, 429);
      }
    }
  }
  
  // Require auth (admin OR customer)
  if (customerId === null && !isAdmin) {
    return c.json({
      success: false,
      error: 'Please sign in or request a quote to use the AI Visualizer',
    }, 401);
  }
  
  // Parse multipart form
  const formData = await c.req.formData();
  const imageFile = formData.get('image') as File | null;
  const prompt = formData.get('prompt') as string;
  
  if (!imageFile || !prompt) {
    return c.json({
      success: false,
      error: 'Image and prompt are required',
    }, 400);
  }
  
  // Validate image
  if (!imageFile.type.startsWith('image/')) {
    return c.json({
      success: false,
      error: 'Invalid image type',
    }, 400);
  }
  
  if (imageFile.size > 10 * 1024 * 1024) {
    return c.json({
      success: false,
      error: 'Image too large (max 10MB)',
    }, 400);
  }
  
  try {
    // Convert input image to base64 for display (no R2 storage)
    const imageBuffer = await imageFile.arrayBuffer();
    const inputBase64 = arrayBufferToBase64(imageBuffer);
    const inputDataUrl = `data:${imageFile.type};base64,${inputBase64}`;
    
    // Enhance prompt if Gemini API key is available
    let enhancedPrompt = prompt;
    const geminiApiKey = c.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      try {
        const enhanceUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const enhanceResponse = await fetch(enhanceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are Lil Beaver, a friendly home improvement expert assistant for The Handy Beaver handyman service. 

Your task: Enhance this customer's visualization request into a detailed, professional prompt for AI image generation. Add specific details about:
- Wood types (cedar, pine, oak, mahogany, etc.)
- Stain/paint terminology (semi-transparent, solid, satin, semi-gloss, matte)
- Color accuracy (use descriptive color names like "dark walnut", "honey oak", "weathered gray")
- Construction details where relevant (board width, railing style, trim profiles)

Keep the customer's intent but make it more specific and detailed. Output ONLY the enhanced prompt, no explanations.

Customer's request: "${prompt}"

Enhanced prompt:`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 200,
              temperature: 0.7,
            },
          }),
        });
        
        if (enhanceResponse.ok) {
          const enhanceResult = await enhanceResponse.json() as any;
          const enhancedText = enhanceResult.candidates?.[0]?.content?.parts?.[0]?.text;
          if (enhancedText) {
            enhancedPrompt = enhancedText.trim();
            console.log('Prompt enhanced:', enhancedPrompt);
          }
        }
      } catch (e) {
        console.error('Prompt enhancement failed, using original:', e);
      }
    }
    
    // Generate image — try Workers AI first, then Gemini Imagen
    let result: { data: ArrayBuffer; mime: string; model: string } | null = null;
    
    if (c.env.AI) {
      result = await generateWithWorkersAI(c.env.AI, enhancedPrompt, inputBase64);
    }
    
    if (!result && geminiApiKey) {
      result = await generateWithImagen(geminiApiKey, enhancedPrompt);
    }
    
    if (!result) {
      // No AI model available — log as demo and return input back
      const now = Math.floor(Date.now() / 1000);
      await c.env.DB.prepare(`
        INSERT INTO visualizer_usage (customer_id, image_key, prompt, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(customerId, 'inline', prompt, now).run();
      
      return c.json({
        success: true,
        demo: true,
        message: 'AI visualization coming soon! Please set up Workers AI or a Gemini API key.',
        inputUrl: inputDataUrl,
      });
    }
    
    // Convert result to base64 for inline response (no R2 storage)
    const outputBase64 = arrayBufferToBase64(result.data);
    const ext = result.mime === 'image/png' ? 'png' : 'jpg';
    const resultDataUrl = `data:${result.mime};base64,${outputBase64}`;
    
    // Log usage in D1 (store result as base64 data URL for retrieval)
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(`
      INSERT INTO visualizer_usage (customer_id, image_key, prompt, result_url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(customerId, 'inline', `[${result.model}] ${enhancedPrompt}`, resultDataUrl, now).run();
    
    return c.json({
      success: true,
      resultDataUrl,
      inputDataUrl,
      model: result.model,
    });
    
  } catch (error) {
    console.error('Visualization error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    }, 500);
  }
});

// Save visualization indefinitely (just a metadata flag now)
visualizeApi.post('/save/:id', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const id = c.req.param('id');
  
  if (!portalToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const customer = await getPortalCustomer(c.env.DB, portalToken);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Verify ownership and update
  const result = await c.env.DB.prepare(`
    UPDATE visualizer_usage 
    SET saved_indefinitely = 1 
    WHERE id = ? AND customer_id = ?
  `).bind(id, customer.customer_id).run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Not found or not yours' }, 404);
  }
  
  return c.json({ success: true });
});

// Get usage history for customer
visualizeApi.get('/history', async (c) => {
  const portalToken = getCookie(c, 'hb_portal');
  const adminToken = getCookie(c, 'hb_admin');
  
  let customerId: number | null = null;
  
  if (adminToken) {
    const admin = await getAdmin(c.env.DB, adminToken);
    if (admin) {
      // Admin can see all - return recent
      const results = await c.env.DB.prepare(`
        SELECT vu.*, c.name, c.email
        FROM visualizer_usage vu
        LEFT JOIN customers c ON vu.customer_id = c.id
        ORDER BY vu.created_at DESC
        LIMIT 50
      `).all();
      
      return c.json({ history: results.results, isAdmin: true });
    }
  }
  
  if (portalToken) {
    const customer = await getPortalCustomer(c.env.DB, portalToken);
    if (customer) {
      customerId = customer.customer_id;
    }
  }
  
  if (!customerId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const results = await c.env.DB.prepare(`
    SELECT * FROM visualizer_usage 
    WHERE customer_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).bind(customerId).all();
  
  return c.json({ history: results.results, isAdmin: false });
});