/**
 * Content Publisher — Actually posts to Facebook/Instagram
 * 
 * Called by cron to publish scheduled content from the queue.
 */

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
  INSTAGRAM_ACCOUNT_ID?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

export interface PublishResult {
  success: boolean;
  published: number;
  failed: number;
  errors: string[];
  posts: Array<{
    id: number;
    platform: string;
    postId?: string;
    error?: string;
  }>;
}

/**
 * Publish all ready content from the queue
 */
export async function publishQueuedContent(env: Bindings): Promise<PublishResult> {
  const now = Math.floor(Date.now() / 1000);
  const errors: string[] = [];
  const posts: PublishResult['posts'] = [];
  let published = 0;
  let failed = 0;

  // Get all ready content that's past its scheduled time
  const pending = await env.DB.prepare(`
    SELECT * FROM content_queue
    WHERE status = 'ready' 
      AND scheduled_for <= ?
    ORDER BY scheduled_for ASC
    LIMIT 5
  `).bind(now).all<any>();

  if (!pending.results || pending.results.length === 0) {
    return { success: true, published: 0, failed: 0, errors: [], posts: [] };
  }

  console.log(`Publishing ${pending.results.length} queued post(s)`);

  for (const content of pending.results) {
    try {
      // Mark as publishing
      await env.DB.prepare(`
        UPDATE content_queue SET status = 'publishing', updated_at = datetime('now')
        WHERE id = ?
      `).bind(content.id).run();

      const result = await publishSinglePost(env, content);
      
      if (result.success) {
        // Mark as published
        await env.DB.prepare(`
          UPDATE content_queue SET 
            status = 'published', 
            published_at = datetime('now'),
            fb_post_id = ?,
            ig_media_id = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(result.fbPostId || null, result.igMediaId || null, content.id).run();
        
        published++;
        posts.push({ 
          id: content.id, 
          platform: content.platform, 
          postId: result.fbPostId || result.igMediaId 
        });
        
        console.log(`Published content #${content.id} to ${content.platform}`);
      } else {
        // Mark as failed
        await env.DB.prepare(`
          UPDATE content_queue SET 
            status = 'failed', 
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(content.id).run();
        
        failed++;
        errors.push(`Content #${content.id}: ${result.error}`);
        posts.push({ id: content.id, platform: content.platform, error: result.error });
        
        console.error(`Failed to publish content #${content.id}: ${result.error}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      
      await env.DB.prepare(`
        UPDATE content_queue SET status = 'failed', updated_at = datetime('now')
        WHERE id = ?
      `).bind(content.id).run();
      
      failed++;
      errors.push(`Content #${content.id}: ${errorMsg}`);
      posts.push({ id: content.id, platform: content.platform, error: errorMsg });
    }
  }

  // Send Discord notification if we published anything
  if (published > 0 && env.DISCORD_WEBHOOK_NOTIFICATIONS) {
    try {
      await notifyDiscord(env.DISCORD_WEBHOOK_NOTIFICATIONS, {
        title: '🦫 Social Media Published!',
        description: `Published ${published} post(s) to Facebook/Instagram`,
        color: 0x4CAF50,
        fields: posts.filter(p => !p.error).map(p => ({
          name: `Post #${p.id}`,
          value: `Platform: ${p.platform}\nPost ID: ${p.postId || 'N/A'}`,
          inline: true
        }))
      });
    } catch (e) {
      console.error('Failed to send Discord notification:', e);
    }
  }

  return { success: failed === 0, published, failed, errors, posts };
}

interface SinglePostResult {
  success: boolean;
  fbPostId?: string;
  igMediaId?: string;
  error?: string;
}

async function publishSinglePost(env: Bindings, content: any): Promise<SinglePostResult> {
  const platform = content.platform || 'both';
  let fbPostId: string | undefined;
  let igMediaId: string | undefined;
  const errors: string[] = [];

  // Publish to Facebook
  if ((platform === 'facebook' || platform === 'both') && env.FACEBOOK_PAGE_ID && env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    const fbResult = await postToFacebook(env, content);
    if (fbResult.success) {
      fbPostId = fbResult.postId;
    } else {
      errors.push(`Facebook: ${fbResult.error}`);
    }
  }

  // Publish to Instagram (if configured)
  if ((platform === 'instagram' || platform === 'both') && env.INSTAGRAM_ACCOUNT_ID && env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    const igResult = await postToInstagram(env, content);
    if (igResult.success) {
      igMediaId = igResult.mediaId;
    } else {
      errors.push(`Instagram: ${igResult.error}`);
    }
  }

  // Consider success if at least one platform succeeded
  if (fbPostId || igMediaId) {
    return { success: true, fbPostId, igMediaId };
  }

  return { success: false, error: errors.join('; ') || 'No platforms configured' };
}

interface FacebookResult {
  success: boolean;
  postId?: string;
  error?: string;
}

async function postToFacebook(env: Bindings, content: any): Promise<FacebookResult> {
  const message = content.caption + (content.hashtags ? `\n\n${content.hashtags}` : '');
  
  try {
    // If there's an image, post as photo
    if (content.image_url) {
      // Convert relative URLs to absolute
      let imageUrl = content.image_url;
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://handybeaver.co${imageUrl}`;
      }
      
      const photoUrl = `https://graph.facebook.com/v18.0/${env.FACEBOOK_PAGE_ID}/photos`;
      const response = await fetch(photoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: env.FACEBOOK_PAGE_ACCESS_TOKEN!,
          url: imageUrl,
          caption: message,
        }),
      });

      const result = await response.json() as any;

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Photo post failed' };
      }

      return { success: true, postId: result.post_id || result.id };
    }

    // Text-only post
    const feedUrl = `https://graph.facebook.com/v18.0/${env.FACEBOOK_PAGE_ID}/feed`;
    const response = await fetch(feedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: env.FACEBOOK_PAGE_ACCESS_TOKEN!,
        message,
      }),
    });

    const result = await response.json() as any;

    if (!response.ok) {
      return { success: false, error: result.error?.message || 'Feed post failed' };
    }

    return { success: true, postId: result.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

interface InstagramResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

async function postToInstagram(env: Bindings, content: any): Promise<InstagramResult> {
  // Instagram requires an image
  if (!content.image_url) {
    return { success: false, error: 'Instagram requires an image' };
  }

  const caption = content.caption + (content.hashtags ? `\n\n${content.hashtags}` : '');
  
  // Convert relative URLs to absolute
  let imageUrl = content.image_url;
  if (imageUrl.startsWith('/')) {
    imageUrl = `https://handybeaver.co${imageUrl}`;
  }

  try {
    // Step 1: Create media container
    const createUrl = `https://graph.facebook.com/v18.0/${env.INSTAGRAM_ACCOUNT_ID}/media`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: env.FACEBOOK_PAGE_ACCESS_TOKEN!,
        image_url: imageUrl,
        caption,
      }),
    });

    const createResult = await createResponse.json() as any;

    if (!createResponse.ok) {
      return { success: false, error: createResult.error?.message || 'Container creation failed' };
    }

    const containerId = createResult.id;

    // Step 2: Wait for processing (Instagram needs time)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Publish the container
    const publishUrl = `https://graph.facebook.com/v18.0/${env.INSTAGRAM_ACCOUNT_ID}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: env.FACEBOOK_PAGE_ACCESS_TOKEN!,
        creation_id: containerId,
      }),
    });

    const publishResult = await publishResponse.json() as any;

    if (!publishResponse.ok) {
      return { success: false, error: publishResult.error?.message || 'Publish failed' };
    }

    return { success: true, mediaId: publishResult.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function notifyDiscord(webhookUrl: string, embed: any): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed]
    }),
  });
}
