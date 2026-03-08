import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
};

export const facebookPosts = new Hono<{ Bindings: Bindings }>();

// Post to Facebook page
facebookPosts.post('/post', async (c) => {
  const { message, link, image_url } = await c.req.json();
  
  if (!c.env.FACEBOOK_PAGE_ID || !c.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return c.json({ error: 'Facebook credentials not configured' }, 500);
  }
  
  const url = `https://graph.facebook.com/v18.0/${c.env.FACEBOOK_PAGE_ID}/feed`;
  
  const params: Record<string, string> = {
    access_token: c.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    message,
  };
  
  if (link) params.link = link;
  
  // For image posts, use /photos endpoint instead
  if (image_url) {
    const photoUrl = `https://graph.facebook.com/v18.0/${c.env.FACEBOOK_PAGE_ID}/photos`;
    const photoResponse = await fetch(photoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: c.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        url: image_url,
        caption: message,
      }),
    });
    
    const photoResult = await photoResponse.json() as any;
    
    if (!photoResponse.ok) {
      return c.json({ error: 'Failed to post photo', details: photoResult }, 500);
    }
    
    return c.json({ success: true, post_id: photoResult.post_id || photoResult.id });
  }
  
  // Text/link post
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  
  const result = await response.json() as any;
  
  if (!response.ok) {
    return c.json({ error: 'Failed to post', details: result }, 500);
  }
  
  return c.json({ success: true, post_id: result.id });
});

// Get recent posts
facebookPosts.get('/posts', async (c) => {
  if (!c.env.FACEBOOK_PAGE_ID || !c.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return c.json({ error: 'Facebook credentials not configured' }, 500);
  }
  
  const url = `https://graph.facebook.com/v18.0/${c.env.FACEBOOK_PAGE_ID}/posts?fields=id,message,created_time,shares,reactions.summary(true),comments.summary(true)&access_token=${c.env.FACEBOOK_PAGE_ACCESS_TOKEN}`;
  
  const response = await fetch(url);
  const result = await response.json();
  
  return c.json(result);
});

// Get page insights
facebookPosts.get('/insights', async (c) => {
  if (!c.env.FACEBOOK_PAGE_ID || !c.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return c.json({ error: 'Facebook credentials not configured' }, 500);
  }
  
  const url = `https://graph.facebook.com/v18.0/${c.env.FACEBOOK_PAGE_ID}/insights?metric=page_impressions,page_engaged_users,page_post_engagements&period=day&access_token=${c.env.FACEBOOK_PAGE_ACCESS_TOKEN}`;
  
  const response = await fetch(url);
  const result = await response.json();
  
  return c.json(result);
});
