import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  GEMINI_API_KEY?: string;
  ADMIN_API_KEY?: string;
};

export const flierApi = new Hono<{ Bindings: Bindings }>();

// Flier templates with text overlay configs
const flierTemplates = {
  promo: {
    name: 'Promotional',
    layouts: [
      { headline: { y: '85%', size: '48px' }, subtext: { y: '92%', size: '24px' }, cta: { y: '96%', size: '18px' } },
      { headline: { y: '10%', size: '48px' }, subtext: { y: '18%', size: '24px' }, cta: { y: '90%', size: '20px' } },
    ],
    colors: { bg: 'rgba(139, 69, 19, 0.85)', text: '#FFFFFF', accent: '#F5DEB3' }
  },
  seasonal: {
    name: 'Seasonal',
    layouts: [
      { headline: { y: '50%', size: '56px' }, subtext: { y: '60%', size: '28px' }, cta: { y: '90%', size: '22px' } },
    ],
    colors: { bg: 'rgba(34, 139, 34, 0.8)', text: '#FFFFFF', accent: '#FFD700' }
  },
  service: {
    name: 'Service Highlight',
    layouts: [
      { headline: { y: '15%', size: '44px' }, subtext: { y: '75%', size: '22px' }, cta: { y: '88%', size: '20px' } },
    ],
    colors: { bg: 'rgba(0, 0, 0, 0.7)', text: '#FFFFFF', accent: '#8B4513' }
  },
  testimonial: {
    name: 'Testimonial',
    layouts: [
      { headline: { y: '70%', size: '32px' }, subtext: { y: '82%', size: '20px' }, cta: { y: '92%', size: '16px' } },
    ],
    colors: { bg: 'rgba(255, 255, 255, 0.9)', text: '#333333', accent: '#8B4513' }
  }
};

/**
 * POST /api/flier/generate
 * Generate a flier with text overlays using CF Workers AI (primary) or Gemini (fallback)
 */
flierApi.post('/generate', async (c) => {
  try {
    const body = await c.req.json() as {
      imageUrl?: string;       // Existing image URL (from gallery)
      imagePrompt?: string;    // Generate new image with this prompt
      template?: keyof typeof flierTemplates;
      headline: string;
      subtext?: string;
      cta?: string;
      customColors?: { bg?: string; text?: string; accent?: string };
    };

    const { headline, subtext, cta, template = 'promo', customColors } = body;
    
    if (!headline) {
      return c.json({ error: 'Headline is required' }, 400);
    }

    const templateConfig = flierTemplates[template] || flierTemplates.promo;
    const colors = { ...templateConfig.colors, ...customColors };

    // Build the image generation prompt
    let baseImagePrompt = body.imagePrompt || 'Professional home improvement scene, wooden deck with fresh stain, warm Oklahoma sunshine';
    
    // Full prompt for flier generation - include text overlay instructions
    const fullPrompt = `Professional marketing flier for "Handy Beaver" handyman business. ${baseImagePrompt}. 
Include text overlays: "${headline}"${subtext ? `, "${subtext}"` : ''}${cta ? `, "${cta}"` : ''}.
Style: Clean professional design, brown and cream colors, 1080x1080 social media format.`;

    let imageData: Uint8Array | null = null;
    let mimeType = 'image/jpeg';
    let generationMethod = 'unknown';

    // Try CF Workers AI models first (they're already available)
    const cfModels = [
      '@cf/black-forest-labs/flux-2-dev',      // Best quality
      '@cf/black-forest-labs/flux-1-schnell',  // Fast backup
      '@cf/lykon/dreamshaper-8-lcm',           // Last resort
    ];

    for (const model of cfModels) {
      try {
        console.log(`Trying CF model: ${model}`);
        const result = await c.env.AI.run(model, { prompt: fullPrompt });
        
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
          console.log(`Success with ${model}, size: ${imageData.length} bytes`);
          break;
        }
      } catch (err) {
        console.error(`Model ${model} failed:`, err);
      }
    }

    if (!imageData) {
      return c.json({ 
        error: 'Failed to generate flier image',
        details: 'All CF Workers AI models failed'
      }, 500);
    }

    // Save to R2
    const flierKey = `fliers/${Date.now()}-${crypto.randomUUID()}.jpg`;
    
    await c.env.IMAGES.put(flierKey, imageData, {
      httpMetadata: { contentType: mimeType },
      customMetadata: {
        headline,
        subtext: subtext || '',
        cta: cta || '',
        template,
        model: generationMethod,
        generatedAt: new Date().toISOString(),
      }
    });

    // Save to DB for tracking
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(`
      INSERT INTO content_queue (caption, image_url, theme, persona, content_type, platform, status, created_by, created_at, scheduled_for, updated_at)
      VALUES (?, ?, ?, 'lil-beaver', 'flier', 'both', 'draft', 'flier-generator', ?, ?, ?)
    `).bind(
      `${headline}${subtext ? '\n' + subtext : ''}${cta ? '\n\n' + cta : ''}`,
      `/api/assets/${flierKey}`,
      template,
      now,
      now + 3600, // Schedule 1 hour from now by default
      now
    ).run();

    return c.json({
      success: true,
      flierUrl: `/api/assets/${flierKey}`,
      fullUrl: `https://handybeaver.co/api/assets/${flierKey}`,
      template,
      model: generationMethod,
      text: { headline, subtext, cta },
      addedToQueue: true,
    });

  } catch (error) {
    console.error('Flier generation error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Flier generation failed',
    }, 500);
  }
});

/**
 * GET /api/flier/templates
 * List available flier templates
 */
flierApi.get('/templates', (c) => {
  return c.json({
    templates: Object.entries(flierTemplates).map(([key, config]) => ({
      id: key,
      name: config.name,
      colors: config.colors,
      layoutCount: config.layouts.length,
    })),
    suggestedContent: {
      promo: [
        { headline: '10% OFF Spring Deck Staining', subtext: 'Book before April 30th', cta: 'Call (580) 566-7017' },
        { headline: 'FREE Estimates', subtext: 'Quality work at fair prices', cta: 'handybeaver.co' },
      ],
      seasonal: [
        { headline: 'Spring is Here!', subtext: 'Time to refresh your outdoor space', cta: 'Book Your Project Now' },
        { headline: 'Beat the Summer Rush', subtext: 'Schedule early for best availability', cta: 'Free Quote' },
      ],
      service: [
        { headline: 'Custom Blue Pine Woodwork', subtext: 'Specialty finishes for Hochatown cabins', cta: 'See Our Portfolio' },
        { headline: 'Deck Restoration', subtext: 'Staining • Sealing • Repairs', cta: 'Transform Your Deck' },
      ],
      testimonial: [
        { headline: '"Best decision we made!"', subtext: '— Happy Hochatown Customer', cta: '5 Stars on Google' },
      ],
    }
  });
});

/**
 * GET /api/flier/list
 * List generated fliers
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
