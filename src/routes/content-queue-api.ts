import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  ADMIN_API_KEY?: string;
};

export const contentQueueApi = new Hono<{ Bindings: Bindings }>();

// Middleware: require admin API key
contentQueueApi.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const apiKey = c.env.ADMIN_API_KEY;
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500);
  }
  
  if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== apiKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
});

// Get queue status
contentQueueApi.get('/status', async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM content_queue
    GROUP BY status
  `).all<{ status: string; count: number }>();
  
  const upcoming = await c.env.DB.prepare(`
    SELECT id, caption, content_type, platform, scheduled_for, status
    FROM content_queue
    WHERE status IN ('pending', 'ready')
    ORDER BY scheduled_for ASC
    LIMIT 10
  `).all<any>();
  
  const recent = await c.env.DB.prepare(`
    SELECT id, caption, content_type, platform, published_at, fb_post_id, ig_media_id
    FROM content_queue
    WHERE status = 'published'
    ORDER BY published_at DESC
    LIMIT 5
  `).all<any>();
  
  return c.json({
    stats: stats.results,
    upcoming: upcoming.results,
    recent: recent.results,
  });
});

// Queue new content
contentQueueApi.post('/queue', async (c) => {
  const body = await c.req.json();
  
  const {
    caption,
    image_url,
    image_prompts,
    hashtags,
    theme,
    persona = 'lil-beaver',
    content_type = 'post',
    platform = 'both',
    scheduled_for,
    publish_window_start,
    publish_window_end,
    created_by = 'api',
  } = body;
  
  if (!caption) {
    return c.json({ error: 'Caption is required' }, 400);
  }
  
  // Calculate scheduled time
  let scheduledTime = scheduled_for;
  if (!scheduledTime && publish_window_start && publish_window_end) {
    // Random time within window
    scheduledTime = Math.floor(
      publish_window_start + Math.random() * (publish_window_end - publish_window_start)
    );
  } else if (!scheduledTime) {
    // Default: 1 hour from now
    scheduledTime = Math.floor(Date.now() / 1000) + 3600;
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO content_queue (
      caption, image_url, image_prompts, hashtags,
      theme, persona, content_type, platform,
      scheduled_for, publish_window_start, publish_window_end,
      status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    RETURNING id
  `).bind(
    caption,
    image_url || null,
    image_prompts ? JSON.stringify(image_prompts) : null,
    hashtags || null,
    theme || null,
    persona,
    content_type,
    platform,
    scheduledTime,
    publish_window_start || null,
    publish_window_end || null,
    created_by
  ).first<{ id: number }>();
  
  // Update theme usage
  if (theme) {
    await c.env.DB.prepare(`
      UPDATE content_themes 
      SET last_used_at = strftime('%s', 'now'), use_count = use_count + 1
      WHERE name = ?
    `).bind(theme).run();
  }
  
  return c.json({
    success: true,
    id: result?.id,
    scheduled_for: scheduledTime,
    scheduled_for_human: new Date(scheduledTime * 1000).toISOString(),
  });
});

// Generate image and queue content (all-in-one)
contentQueueApi.post('/generate-and-queue', async (c) => {
  const body = await c.req.json();
  
  const {
    caption,
    image_prompt,
    image_prompts, // For reels: array of 3 prompts
    hashtags,
    theme,
    persona = 'lil-beaver',
    content_type = 'post',
    platform = 'both',
    scheduled_for,
    created_by = 'api',
  } = body;
  
  if (!caption) {
    return c.json({ error: 'Caption is required' }, 400);
  }
  
  let imageUrl: string | null = null;
  const prompts = image_prompts || (image_prompt ? [image_prompt] : []);
  
  // Generate image(s) using FLUX dev 2
  if (prompts.length > 0 && c.env.AI) {
    try {
      const firstPrompt = prompts[0];
      const enhancedPrompt = `Lil Beaver mascot, a friendly cartoon beaver in a tool belt, ${firstPrompt}. Warm colors, professional, clean design.`;
      
      console.log('Generating image with prompt:', enhancedPrompt);
      
      // Try FLUX schnell first (more reliable), then dev-2
      let result: any = null;
      const models = [
        '@cf/black-forest-labs/flux-1-schnell',
        '@cf/black-forest-labs/flux-1-dev',
        '@cf/lykon/dreamshaper-8-lcm',
      ];
      
      for (const model of models) {
        try {
          console.log('Trying model:', model);
          result = await c.env.AI.run(model, {
            prompt: enhancedPrompt,
          });
          if (result) {
            console.log('Success with model:', model, typeof result);
            break;
          }
        } catch (modelErr) {
          console.error('Model failed:', model, modelErr);
          continue;
        }
      }
      
      if (!result) {
        throw new Error('All models failed');
      }
      
      if (result) {
        // Store in R2
        const key = `content/${Date.now()}-${crypto.randomUUID()}.png`;
        let buffer: ArrayBuffer;
        
        if (result instanceof ReadableStream) {
          const reader = result.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          buffer = combined.buffer;
        } else if (result instanceof ArrayBuffer) {
          buffer = result;
        } else if (result && typeof result === 'object' && 'image' in result) {
          const binaryString = atob(result.image as string);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          buffer = bytes.buffer;
        } else {
          throw new Error('Unknown result format from AI');
        }
        
        await c.env.IMAGES.put(key, buffer, {
          httpMetadata: { contentType: 'image/png' },
        });
        
        imageUrl = `https://handybeaver.co/api/assets/${key}`;
      }
    } catch (e) {
      console.error('Image generation failed:', e);
      // Continue without image
    }
  }
  
  // Calculate scheduled time
  let scheduledTime = scheduled_for;
  if (!scheduledTime) {
    scheduledTime = Math.floor(Date.now() / 1000) + 3600;
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO content_queue (
      caption, image_url, image_prompts, hashtags,
      theme, persona, content_type, platform,
      scheduled_for, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    caption,
    imageUrl,
    prompts.length > 0 ? JSON.stringify(prompts) : null,
    hashtags || null,
    theme || null,
    persona,
    content_type,
    platform,
    scheduledTime,
    imageUrl ? 'ready' : 'pending',
    created_by
  ).first<{ id: number }>();
  
  return c.json({
    success: true,
    id: result?.id,
    image_url: imageUrl,
    scheduled_for: scheduledTime,
    status: imageUrl ? 'ready' : 'pending',
  });
});

// Get themes for variety
contentQueueApi.get('/themes', async (c) => {
  const themes = await c.env.DB.prepare(`
    SELECT name, description, last_used_at, use_count
    FROM content_themes
    ORDER BY COALESCE(last_used_at, 0) ASC
  `).all<any>();
  
  return c.json({
    themes: themes.results,
    least_used: themes.results?.slice(0, 3).map((t: any) => t.name),
  });
});

// Publish pending content (called by cron)
contentQueueApi.post('/publish', async (c) => {
  const now = Math.floor(Date.now() / 1000);
  
  // Get ready content that's due
  const pending = await c.env.DB.prepare(`
    SELECT * FROM content_queue
    WHERE status = 'ready' 
      AND scheduled_for <= ?
    ORDER BY scheduled_for ASC
    LIMIT 1
  `).bind(now).first<any>();
  
  if (!pending) {
    return c.json({ message: 'No content ready to publish' });
  }
  
  // Mark as publishing
  await c.env.DB.prepare(`
    UPDATE content_queue SET status = 'publishing', updated_at = ?
    WHERE id = ?
  `).bind(now, pending.id).run();
  
  // TODO: Actually publish to FB/IG
  // For now, return what would be published
  return c.json({
    would_publish: pending,
    message: 'Publishing logic not yet connected',
  });
});

export default contentQueueApi;

/**
 * POST /api/content-queue/publish-now
 * Manually trigger publishing of ready posts (for testing)
 */
contentQueueApi.post('/publish-now', async (c) => {
  const env = c.env as any;
  const now = Math.floor(Date.now() / 1000);
  
  const readyPosts = await env.DB.prepare(`
    SELECT * FROM content_queue 
    WHERE status = 'ready' 
    AND scheduled_for <= ?
    ORDER BY scheduled_for ASC
    LIMIT 3
  `).bind(now).all<any>();
  
  if (!readyPosts.results || readyPosts.results.length === 0) {
    return c.json({ message: 'No posts ready to publish', count: 0 });
  }
  
  const results = [];
  
  for (const post of readyPosts.results) {
    try {
      const fbToken = env.FACEBOOK_PAGE_ACCESS_TOKEN;
      const fbPageId = env.FACEBOOK_PAGE_ID || '1040910635768535';
      
      if (!fbToken) {
        results.push({ id: post.id, status: 'skipped', reason: 'No FB token' });
        continue;
      }
      
      if (post.platform !== 'facebook' && post.platform !== 'both') {
        results.push({ id: post.id, status: 'skipped', reason: `Platform is ${post.platform}` });
        continue;
      }
      
      const fbUrl = `https://graph.facebook.com/v18.0/${fbPageId}/feed`;
      const fbPayload: any = { message: post.caption, access_token: fbToken };
      
      // Add image if available
      if (post.image_url) {
        const imageUrl = post.image_url.startsWith('/') 
          ? `https://handybeaver.co${post.image_url}` 
          : post.image_url;
        fbPayload.link = imageUrl;
      }
      
      const fbRes = await fetch(fbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbPayload)
      });
      
      const fbData = await fbRes.json() as any;
      
      if (fbData.id) {
        await env.DB.prepare(`
          UPDATE content_queue 
          SET status = 'published', fb_post_id = ?, published_at = ?, updated_at = ?
          WHERE id = ?
        `).bind(fbData.id, now, now, post.id).run();
        
        results.push({ id: post.id, status: 'published', fb_post_id: fbData.id });
      } else {
        await env.DB.prepare(`
          UPDATE content_queue 
          SET status = 'failed', error_message = ?, updated_at = ?
          WHERE id = ?
        `).bind(JSON.stringify(fbData.error || fbData), now, post.id).run();
        
        results.push({ id: post.id, status: 'failed', error: fbData });
      }
    } catch (err) {
      results.push({ id: post.id, status: 'error', error: String(err) });
    }
  }
  
  return c.json({ message: 'Publishing complete', results });
});
