import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  GEMINI_API_KEY?: string;
  ADMIN_API_KEY?: string;
};

export const flierApi = new Hono<{ Bindings: Bindings }>();

// Brand constants - ALWAYS use these for accuracy
const BRAND = {
  name: 'Handy Beaver',
  tagline: 'Dam Good Work, Every Time',
  phone: '(580) 566-7017',
  website: 'handybeaver.co',
  colors: {
    brown: '#8B4513',
    cream: '#F5DEB3',
    darkBrown: '#5D3A1A',
    white: '#FFFFFF',
  }
};

// Flier templates
const flierTemplates = {
  promo: { name: 'Promotional', bgColor: BRAND.colors.brown },
  seasonal: { name: 'Seasonal', bgColor: '#228B22' },
  service: { name: 'Service Highlight', bgColor: '#1a1a1a' },
  testimonial: { name: 'Testimonial', bgColor: BRAND.colors.cream },
};

/**
 * POST /api/flier/generate
 * Two-step flier generation:
 * 1. Generate background image (NO text - AI is unreliable with text)
 * 2. Return data for text overlay (done client-side or via separate endpoint)
 */
flierApi.post('/generate', async (c) => {
  try {
    const body = await c.req.json() as {
      imageUrl?: string;       // Use existing image from gallery
      imagePrompt?: string;    // Generate new background image
      template?: keyof typeof flierTemplates;
      headline: string;
      subtext?: string;
      cta?: string;
      includePhone?: boolean;  // Add phone number
      includeWebsite?: boolean; // Add website
    };

    const { 
      headline, 
      subtext, 
      cta, 
      template = 'promo',
      includePhone = true,
      includeWebsite = true 
    } = body;
    
    if (!headline) {
      return c.json({ error: 'Headline is required' }, 400);
    }

    let backgroundUrl: string | null = null;
    let generationMethod = 'existing';

    // Option 1: Use existing gallery image
    if (body.imageUrl) {
      backgroundUrl = body.imageUrl;
      generationMethod = 'gallery';
    } 
    // Option 2: Generate new background (NO TEXT in prompt!)
    else {
      const bgPrompt = body.imagePrompt || 'Professional wooden deck with fresh stain, warm Oklahoma sunshine, no text, no logos, no watermarks';
      
      // IMPORTANT: Explicitly tell AI NOT to add text
      const cleanPrompt = `${bgPrompt}. IMPORTANT: Do NOT include any text, words, letters, numbers, logos, or watermarks in the image. Pure background image only.`;

      const cfModels = [
        '@cf/black-forest-labs/flux-2-dev',
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/lykon/dreamshaper-8-lcm',
      ];

      let imageData: Uint8Array | null = null;

      for (const model of cfModels) {
        try {
          console.log(`Generating background with: ${model}`);
          const result = await c.env.AI.run(model, { prompt: cleanPrompt });
          
          let buffer: ArrayBuffer | null = null;
          
          if (result instanceof ReadableStream) {
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
          } else if (result && typeof result === 'object' && 'image' in result) {
            const binaryString = atob((result as any).image);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            buffer = bytes.buffer;
          }
          
          if (buffer && buffer.byteLength > 100) {
            imageData = new Uint8Array(buffer);
            generationMethod = model.split('/').pop() || 'workers-ai';
            console.log(`Background generated: ${imageData.length} bytes`);
            break;
          }
        } catch (err) {
          console.error(`Model ${model} failed:`, err);
        }
      }

      if (!imageData) {
        return c.json({ error: 'Failed to generate background image' }, 500);
      }

      // Save background to R2
      const bgKey = `fliers/backgrounds/${Date.now()}-${crypto.randomUUID()}.jpg`;
      await c.env.IMAGES.put(bgKey, imageData, {
        httpMetadata: { contentType: 'image/jpeg' },
        customMetadata: { prompt: cleanPrompt, model: generationMethod }
      });
      
      backgroundUrl = `/api/assets/${bgKey}`;
    }

    // Build the text overlay data (for client-side rendering or separate endpoint)
    const textOverlay = {
      headline: headline,
      subtext: subtext || null,
      cta: cta || null,
      phone: includePhone ? BRAND.phone : null,
      website: includeWebsite ? BRAND.website : null,
      brand: BRAND.name,
    };

    // Generate SVG overlay that can be composited
    const svgOverlay = generateSvgOverlay(textOverlay, template);

    // Save flier metadata to DB
    const now = Math.floor(Date.now() / 1000);
    const result = await c.env.DB.prepare(`
      INSERT INTO content_queue (caption, image_url, theme, persona, content_type, platform, status, created_by, created_at, scheduled_for, updated_at)
      VALUES (?, ?, ?, 'lil-beaver', 'flier', 'both', 'draft', 'flier-generator', ?, ?, ?)
      RETURNING id
    `).bind(
      `${headline}${subtext ? '\n' + subtext : ''}${cta ? '\n\n' + cta : ''}`,
      backgroundUrl,
      template,
      now,
      now + 3600,
      now
    ).first<{ id: number }>();

    return c.json({
      success: true,
      flierId: result?.id,
      backgroundUrl,
      fullBackgroundUrl: `https://handybeaver.co${backgroundUrl}`,
      textOverlay,
      svgOverlay,
      template,
      model: generationMethod,
      brand: BRAND,
      instructions: `
This flier was generated in two steps for accuracy:
1. Background image (AI-generated, no text)
2. Text overlay data (exact, verified text)

To create the final flier:
- Use the SVG overlay on top of the background
- Or use a canvas/image editor to add the text
- Text is GUARANTEED correct (no AI hallucinations)

Preview: Combine backgroundUrl + svgOverlay
      `.trim()
    });

  } catch (error) {
    console.error('Flier generation error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Flier generation failed',
    }, 500);
  }
});

/**
 * Generate SVG text overlay for compositing
 */
function generateSvgOverlay(
  text: { headline: string; subtext?: string | null; cta?: string | null; phone?: string | null; website?: string | null; brand: string },
  template: string
): string {
  const colors = template === 'testimonial' 
    ? { bg: 'rgba(255,255,255,0.9)', text: '#333333', accent: BRAND.colors.brown }
    : { bg: 'rgba(139,69,19,0.85)', text: '#FFFFFF', accent: BRAND.colors.cream };

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <!-- Top banner with brand -->
  <rect x="0" y="0" width="1080" height="120" fill="${colors.bg}"/>
  <text x="540" y="70" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="${colors.text}" text-anchor="middle">${escapeXml(text.brand)}</text>
  <text x="540" y="100" font-family="Arial, sans-serif" font-size="20" fill="${colors.accent}" text-anchor="middle">${escapeXml(text.website || BRAND.website)}</text>
  
  <!-- Main headline -->
  <rect x="0" y="400" width="1080" height="140" fill="${colors.bg}"/>
  <text x="540" y="490" font-family="Georgia, serif" font-size="56" font-weight="bold" fill="${colors.text}" text-anchor="middle">${escapeXml(text.headline)}</text>
  
  <!-- Subtext -->
  ${text.subtext ? `
  <rect x="0" y="540" width="1080" height="80" fill="${colors.bg}"/>
  <text x="540" y="590" font-family="Arial, sans-serif" font-size="32" fill="${colors.accent}" text-anchor="middle">${escapeXml(text.subtext)}</text>
  ` : ''}
  
  <!-- Bottom CTA bar -->
  <rect x="0" y="920" width="1080" height="160" fill="${colors.bg}"/>
  ${text.cta ? `<text x="540" y="980" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${colors.text}" text-anchor="middle">${escapeXml(text.cta)}</text>` : ''}
  ${text.phone ? `<text x="540" y="1040" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="${colors.accent}" text-anchor="middle">${escapeXml(text.phone)}</text>` : ''}
</svg>`.trim();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * POST /api/flier/composite
 * Composite background + SVG overlay into final image
 * Uses Workers AI or returns instructions for client-side compositing
 */
flierApi.post('/composite', async (c) => {
  const body = await c.req.json() as {
    backgroundUrl: string;
    svgOverlay: string;
    flierId?: number;
  };

  // For now, return the components for client-side compositing
  // Full server-side compositing would need canvas/sharp which isn't available in Workers
  return c.json({
    success: true,
    message: 'Use client-side canvas to composite these layers',
    layers: [
      { type: 'background', url: body.backgroundUrl },
      { type: 'overlay', svg: body.svgOverlay }
    ],
    html: `
<!DOCTYPE html>
<html>
<head><title>Flier Preview</title></head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#222;">
  <div style="position:relative; width:1080px; height:1080px;">
    <img src="${body.backgroundUrl}" style="position:absolute; width:100%; height:100%; object-fit:cover;">
    <div style="position:absolute; width:100%; height:100%;">
      ${body.svgOverlay}
    </div>
  </div>
</body>
</html>
    `.trim()
  });
});

/**
 * GET /api/flier/templates
 */
flierApi.get('/templates', (c) => {
  return c.json({
    templates: Object.entries(flierTemplates).map(([key, config]) => ({
      id: key,
      name: config.name,
    })),
    brand: BRAND,
    suggestedContent: {
      promo: [
        { headline: '10% OFF Spring Deck Staining', subtext: 'Book before April 30th' },
        { headline: 'FREE Estimates', subtext: 'Quality work at fair prices' },
      ],
      seasonal: [
        { headline: 'Spring is Here!', subtext: 'Time to refresh your outdoor space' },
      ],
      service: [
        { headline: 'Custom Blue Pine Woodwork', subtext: 'Specialty finishes for Hochatown cabins' },
      ],
      testimonial: [
        { headline: '"Best decision we made!"', subtext: '— Happy Hochatown Customer' },
      ],
    }
  });
});

/**
 * GET /api/flier/list
 */
flierApi.get('/list', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  
  const fliers = await c.env.DB.prepare(`
    SELECT id, caption, image_url, theme, status, created_at, scheduled_for
    FROM content_queue 
    WHERE content_type = 'flier'
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all<any>();

  return c.json({
    fliers: fliers.results || [],
    count: fliers.results?.length || 0,
  });
});

export default flierApi;
