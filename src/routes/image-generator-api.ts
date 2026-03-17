/**
 * Image Generator API
 * 
 * Generates marketing images with text overlays from portfolio photos.
 * Used by Lil Beaver to create social media content.
 */

import { Hono } from 'hono';
import puppeteer from '@cloudflare/puppeteer';
import { 
  generateOverlaySvg, 
  svgToDataUrl, 
  generateMarketingText,
  POST_TEMPLATES,
  type TextOverlayOptions 
} from '../lib/image-text-overlay';
import { r2PortfolioImages } from '../../config/r2-portfolio';

// Type for R2 portfolio images
interface R2PortfolioImage {
  filename: string;
  folder: string;
  title: string;
  description: string;
  category: string;
  type: string;
  tags: string[];
  r2Path: string;
}

// Helper to get gallery images by theme
function getGalleryByTheme(theme: string): R2PortfolioImage[] {
  if (!theme || theme === 'general-handyman' || theme === 'all') {
    return r2PortfolioImages as R2PortfolioImage[];
  }
  
  const normalizedTheme = theme.toLowerCase().replace(/-/g, '');
  const filtered = (r2PortfolioImages as R2PortfolioImage[]).filter(img => {
    const category = (img.category || '').toLowerCase();
    const folder = (img.folder || '').toLowerCase().replace(/[^a-z]/g, '');
    return category.includes(normalizedTheme) || 
           folder.includes(normalizedTheme) ||
           normalizedTheme.includes(category) ||
           normalizedTheme.includes(folder);
  });
  
  // Return filtered if found, otherwise all images
  return filtered.length > 0 ? filtered : r2PortfolioImages as R2PortfolioImage[];
}

// Convert R2 path to public URL
function getImageUrl(img: R2PortfolioImage): string {
  return `/api/assets/${img.r2Path}`;
}

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: any;
  ADMIN_API_KEY?: string;
};

export const imageGeneratorApi = new Hono<{ Bindings: Bindings }>();

// Auth middleware (skip for preview endpoint - it's public)
imageGeneratorApi.use('/*', async (c, next) => {
  // Allow public preview endpoint
  if (c.req.path.endsWith('/preview') || c.req.path.includes('/preview?')) {
    return next();
  }
  
  const authHeader = c.req.header('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== c.env.ADMIN_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
});

/**
 * Generate a marketing image with text overlay
 * 
 * POST /api/image/generate
 * {
 *   "imageUrl": "/api/assets/portfolio/Flooring/hardwood-install.png",
 *   "headline": "New Floors, New Life",
 *   "subtext": "Professional installation",
 *   "cta": "Get Started",
 *   "template": "promo-bottom"
 * }
 */
imageGeneratorApi.post('/generate', async (c) => {
  const body = await c.req.json();
  const {
    imageUrl,
    headline,
    subtext,
    cta,
    template = 'promo-bottom',
    position,
    theme,
    fontSize,
    showLogo,
    showPhone,
    width = 1200,
    height = 630,
  } = body;

  if (!imageUrl || !headline) {
    return c.json({ error: 'imageUrl and headline are required' }, 400);
  }

  // Convert relative URL to absolute
  const fullImageUrl = imageUrl.startsWith('/') 
    ? `https://handybeaver.co${imageUrl}` 
    : imageUrl;

  // Build options from template + overrides
  const templateOptions = POST_TEMPLATES[template as keyof typeof POST_TEMPLATES] || POST_TEMPLATES['promo-bottom'];
  
  const options: TextOverlayOptions = {
    headline,
    subtext,
    cta,
    position: position || templateOptions.position,
    theme: theme || templateOptions.theme,
    fontSize: fontSize || templateOptions.fontSize,
    showLogo: showLogo ?? templateOptions.showLogo,
    showPhone: showPhone ?? templateOptions.showPhone,
  };

  try {
    const svg = generateOverlaySvg(fullImageUrl, options, width, height);
    const dataUrl = svgToDataUrl(svg);

    return c.json({
      success: true,
      svg,
      dataUrl,
      previewUrl: `https://handybeaver.co/api/image/preview?${new URLSearchParams({
        imageUrl: fullImageUrl,
        headline,
        ...(subtext && { subtext }),
        ...(cta && { cta }),
        template,
      }).toString()}`,
    });
  } catch (err) {
    return c.json({ 
      error: 'Failed to generate image', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    }, 500);
  }
});

/**
 * Preview a generated image (renders as HTML for proper image loading)
 * 
 * GET /api/image/preview?imageUrl=...&headline=...&template=...
 */
imageGeneratorApi.get('/preview', async (c) => {
  const imageUrl = c.req.query('imageUrl');
  const headline = c.req.query('headline');
  const subtext = c.req.query('subtext');
  const cta = c.req.query('cta');
  const template = c.req.query('template') || 'promo-bottom';
  const format = c.req.query('format') || 'html'; // html or svg

  if (!imageUrl || !headline) {
    return c.text('Missing imageUrl or headline', 400);
  }

  const templateOptions = POST_TEMPLATES[template as keyof typeof POST_TEMPLATES] || POST_TEMPLATES['promo-bottom'];
  
  // For SVG format, return raw SVG
  if (format === 'svg') {
    const options: TextOverlayOptions = {
      headline,
      subtext,
      cta,
      ...templateOptions,
    };
    const svg = generateOverlaySvg(imageUrl, options);
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // HTML format - renders properly in browsers
  const theme = templateOptions.theme || 'dark';
  const position = templateOptions.position || 'bottom';
  
  const colors = {
    dark: { bg: 'rgba(0,0,0,0.75)', text: '#FFFFFF', accent: '#FFD700', ctaText: '#2C1810' },
    light: { bg: 'rgba(255,255,255,0.9)', text: '#2C1810', accent: '#8B4513', ctaText: '#FFFFFF' },
    branded: { bg: 'rgba(44,24,16,0.9)', text: '#FFF8DC', accent: '#FFD700', ctaText: '#2C1810' },
  };
  const color = colors[theme as keyof typeof colors] || colors.dark;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200, height=630">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      width: 1200px; 
      height: 630px; 
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      position: relative;
      width: 1200px;
      height: 630px;
    }
    .background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .overlay {
      position: absolute;
      ${position === 'bottom' ? 'bottom: 0;' : position === 'top' ? 'top: 0;' : 'top: 50%; transform: translateY(-50%);'}
      left: 0;
      right: 0;
      background: ${color.bg};
      padding: 40px;
      text-align: center;
    }
    .logo {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.6);
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      font-size: 18px;
    }
    .headline {
      font-size: 56px;
      font-weight: bold;
      color: ${color.text};
      margin-bottom: 16px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .subtext {
      font-size: 28px;
      color: ${color.text};
      opacity: 0.9;
      margin-bottom: 24px;
    }
    .cta {
      display: inline-block;
      background: ${color.accent};
      color: ${color.ctaText};
      padding: 16px 40px;
      border-radius: 8px;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    .phone {
      font-size: 22px;
      color: ${color.accent};
    }
  </style>
</head>
<body>
  <div class="container">
    <img class="background" src="${imageUrl}" alt="Background">
    <div class="logo">🦫 The Handy Beaver</div>
    <div class="overlay">
      <div class="headline">${headline}</div>
      ${subtext ? `<div class="subtext">${subtext}</div>` : ''}
      ${cta ? `<div class="cta">${cta}</div>` : ''}
      <div class="phone">📞 (580) 566-7017</div>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * Render preview as PNG using Browser Rendering API
 * 
 * GET /api/image/render?imageUrl=...&headline=...&template=...
 */
imageGeneratorApi.get('/render', async (c) => {
  const imageUrl = c.req.query('imageUrl');
  const headline = c.req.query('headline');
  const subtext = c.req.query('subtext');
  const cta = c.req.query('cta');
  const template = c.req.query('template') || 'promo-bottom';

  if (!imageUrl || !headline) {
    return c.text('Missing imageUrl or headline', 400);
  }

  // Build preview URL
  const previewUrl = `https://handybeaver.co/api/image/preview?${new URLSearchParams({
    imageUrl,
    headline,
    ...(subtext && { subtext }),
    ...(cta && { cta }),
    template,
  }).toString()}`;

  try {
    // Use Cloudflare Browser Rendering to screenshot the HTML preview
    const browser = await puppeteer.launch(c.env.BROWSER);
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.goto(previewUrl, { waitUntil: 'networkidle0' });
    
    // Wait for images to load
    await page.waitForSelector('.background', { timeout: 5000 }).catch(() => {});
    
    const screenshot = await page.screenshot({ type: 'png' }) as Buffer;
    await browser.close();

    return new Response(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return c.json({ 
      error: 'Failed to render image', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    }, 500);
  }
});

/**
 * Generate a complete marketing post (auto-picks image + text)
 * 
 * POST /api/image/marketing-post
 * {
 *   "style": "tip",
 *   "theme": "flooring",
 *   "template": "promo-bottom"
 * }
 */
imageGeneratorApi.post('/marketing-post', async (c) => {
  const body = await c.req.json();
  const {
    style = 'tip',
    theme = 'general-handyman',
    template = 'promo-bottom',
  } = body;

  // Get a random image from the gallery matching the theme
  const galleryImages = getGalleryByTheme(theme);
  if (galleryImages.length === 0) {
    return c.json({ error: `No images found for theme: ${theme}` }, 404);
  }

  const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
  const imageUrl = getImageUrl(randomImage);
  const fullImageUrl = `https://handybeaver.co${imageUrl}`;

  // Generate marketing text based on style and theme
  const marketingText = generateMarketingText(style, theme);

  // Build the overlay
  const templateOptions = POST_TEMPLATES[template as keyof typeof POST_TEMPLATES] || POST_TEMPLATES['promo-bottom'];
  
  const options: TextOverlayOptions = {
    ...marketingText,
    ...templateOptions,
  };

  try {
    const svg = generateOverlaySvg(fullImageUrl, options);
    const dataUrl = svgToDataUrl(svg);

    return c.json({
      success: true,
      image: {
        originalUrl: imageUrl,
        fullUrl: fullImageUrl,
        description: randomImage.description,
        folder: randomImage.folder,
        category: randomImage.category,
      },
      text: marketingText,
      style,
      template,
      svg,
      dataUrl,
      previewUrl: `https://handybeaver.co/api/image/preview?${new URLSearchParams({
        imageUrl: fullImageUrl,
        headline: marketingText.headline,
        ...(marketingText.subtext && { subtext: marketingText.subtext }),
        ...(marketingText.cta && { cta: marketingText.cta }),
        template,
      }).toString()}`,
    });
  } catch (err) {
    return c.json({ 
      error: 'Failed to generate marketing post', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    }, 500);
  }
});

/**
 * List available templates
 */
imageGeneratorApi.get('/templates', async (c) => {
  return c.json({
    templates: Object.entries(POST_TEMPLATES).map(([name, config]) => ({
      name,
      ...config,
    })),
  });
});

/**
 * Generate image and queue for posting
 * 
 * POST /api/image/create-and-queue
 * {
 *   "style": "tip",
 *   "theme": "flooring", 
 *   "template": "promo-bottom",
 *   "caption": "Optional custom caption",
 *   "scheduledFor": "2026-03-18T10:00:00Z"
 * }
 */
imageGeneratorApi.post('/create-and-queue', async (c) => {
  const body = await c.req.json();
  const {
    style = 'tip',
    theme = 'general-handyman',
    template = 'promo-bottom',
    caption,
    scheduledFor,
    platform = 'both',
  } = body;

  // Get a random image from the gallery matching the theme
  const galleryImages = getGalleryByTheme(theme);
  if (galleryImages.length === 0) {
    return c.json({ error: `No images found for theme: ${theme}` }, 404);
  }

  const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
  const imageUrl = getImageUrl(randomImage);
  const fullImageUrl = `https://handybeaver.co${imageUrl}`;

  // Generate marketing text
  const marketingText = generateMarketingText(style, theme);
  
  // Use custom caption or generate one
  const postCaption = caption || `${marketingText.headline}\n\n${marketingText.subtext || ''}\n\n🦫 The Handy Beaver - Dam Good Work, Every Time\n📞 (580) 566-7017`;

  // Calculate scheduled time
  const now = Math.floor(Date.now() / 1000);
  const scheduleTime = scheduledFor 
    ? Math.floor(new Date(scheduledFor).getTime() / 1000)
    : now + 300; // Default: 5 minutes from now

  // Build hashtags
  const hashtags = JSON.stringify([
    '#HandyBeaver',
    '#' + theme.replace(/-/g, ''),
    '#Oklahoma',
    '#HomeImprovement',
    '#BrokenBow',
  ]);

  // Insert into content queue
  const result = await c.env.DB.prepare(`
    INSERT INTO content_queue (
      caption, image_url, content_type, style, theme, hashtags,
      platform, status, scheduled_for, created_at, updated_at
    ) VALUES (?, ?, 'image', ?, ?, ?, ?, 'ready', ?, datetime('now'), datetime('now'))
  `).bind(
    postCaption,
    imageUrl,
    style,
    theme,
    hashtags,
    platform,
    scheduleTime
  ).run();

  // Also insert into social_posts for tracking
  await c.env.DB.prepare(`
    INSERT INTO social_posts (
      caption, image_url, image_description, style, theme, hashtags,
      platform, status, scheduled_for, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
  `).bind(
    postCaption,
    imageUrl,
    randomImage.description,
    style,
    theme,
    hashtags,
    platform,
    scheduleTime
  ).run();

  return c.json({
    success: true,
    queued: {
      id: result.meta.last_row_id,
      caption: postCaption,
      imageUrl: imageUrl,
      style,
      theme,
      platform,
      scheduledFor: new Date(scheduleTime * 1000).toISOString(),
    },
    previewUrl: `https://handybeaver.co/api/image/preview?${new URLSearchParams({
      imageUrl: fullImageUrl,
      headline: marketingText.headline,
      ...(marketingText.subtext && { subtext: marketingText.subtext }),
      ...(marketingText.cta && { cta: marketingText.cta }),
      template,
    }).toString()}`,
  });
});

export default imageGeneratorApi;
