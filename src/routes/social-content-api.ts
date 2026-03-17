/**
 * Social Content API for Lil Beaver
 * 
 * Endpoints for creative social media management:
 * - Generate content ideas
 * - Get gallery images for posts
 * - Track post performance
 * - Learn from engagement
 */

import { Hono } from 'hono';
import { 
  socialEngine, 
  PostStyle, 
  ContentTheme, 
  GeneratedPost, 
  PostHistory 
} from '../lib/social-content-engine';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  ADMIN_API_KEY?: string;
};

export const socialContentApi = new Hono<{ Bindings: Bindings }>();

// Auth middleware
socialContentApi.use('/*', async (c, next) => {
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

// Generate a content idea
socialContentApi.get('/idea', async (c) => {
  // Get recent styles to avoid repetition
  const recentPosts = await c.env.DB.prepare(`
    SELECT style FROM social_posts 
    WHERE created_at > datetime('now', '-7 days')
    ORDER BY created_at DESC
    LIMIT 5
  `).all<{ style: PostStyle }>();
  
  const recentStyles = recentPosts.results?.map(p => p.style) || [];
  
  const idea = socialEngine.generateContentIdea(recentStyles);
  
  // If there's a gallery image, include the URL
  let imageUrl = null;
  if (idea.galleryImage) {
    imageUrl = socialEngine.getImageUrl(idea.galleryImage);
  }
  
  return c.json({
    idea: {
      ...idea,
      imageUrl,
      galleryImage: idea.galleryImage ? {
        filename: idea.galleryImage.filename,
        folder: idea.galleryImage.folder,
        title: idea.galleryImage.title,
        description: idea.galleryImage.description,
        category: idea.galleryImage.category,
        tags: idea.galleryImage.tags
      } : null
    },
    season: socialEngine.getCurrentSeason(),
    dayOfWeek: socialEngine.getDayOfWeek()
  });
});

// Get gallery images for a specific theme
socialContentApi.get('/gallery/:theme', async (c) => {
  const theme = c.req.param('theme') as ContentTheme;
  
  // Map themes to categories
  const categoryMap: Record<string, string[]> = {
    'bathroom-remodel': ['bathroom-remodels'],
    'deck-outdoor': ['decks-outdoor', 'siding'],
    'flooring': ['flooring'],
    'specialty-wood': ['specialty-wood'],
    'trim-carpentry': ['trim-carpentry', 'doors'],
    'general-handyman': ['kitchen-bar', 'tiny-home', 'stairs-railings'],
    'all': []
  };
  
  const categories = categoryMap[theme] || categoryMap['all'];
  
  let images = socialEngine.portfolioManifest;
  if (categories.length > 0) {
    images = images.filter(img => categories.includes(img.category));
  }
  
  return c.json({
    theme,
    count: images.length,
    images: images.map(img => ({
      filename: img.filename,
      folder: img.folder,
      title: img.title,
      description: img.description,
      category: img.category,
      type: img.type,
      tags: img.tags,
      featured: img.featured,
      url: socialEngine.getImageUrl(img)
    }))
  });
});

// Get before/after pairs
socialContentApi.get('/transformations', async (c) => {
  const pairs = socialEngine.getBeforeAfterPairs();
  
  return c.json({
    count: pairs.length,
    pairs: pairs.map(pair => ({
      before: {
        ...pair.before,
        url: socialEngine.getImageUrl(pair.before)
      },
      after: {
        ...pair.after,
        url: socialEngine.getImageUrl(pair.after)
      }
    }))
  });
});

// Get featured images (hero shots)
socialContentApi.get('/featured', async (c) => {
  const featured = socialEngine.getFeaturedImages();
  
  return c.json({
    count: featured.length,
    images: featured.map(img => ({
      ...img,
      url: socialEngine.getImageUrl(img)
    }))
  });
});

// Generate caption with AI
socialContentApi.post('/generate-caption', async (c) => {
  const body = await c.req.json<{
    prompt: string;
    style?: PostStyle;
    tone?: string;
  }>();
  
  if (!body.prompt) {
    return c.json({ error: 'Prompt is required' }, 400);
  }
  
  try {
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are Lil Beaver, the social media manager for The Handy Beaver - a traveling craftsman service in Southeast Oklahoma. 
Write engaging, authentic social media captions that sound human, not like a marketing bot.
Keep captions concise (under 280 characters ideally, max 500).
Don't include hashtags - they're added separately.
Sound like a real tradesperson who takes pride in their work.`
        },
        {
          role: 'user',
          content: body.prompt
        }
      ],
      max_tokens: 200
    }) as { response: string };
    
    return c.json({ 
      caption: response.response?.trim() || '',
      style: body.style,
      generatedAt: Date.now()
    });
  } catch (error) {
    console.error('AI generation failed:', error);
    return c.json({ error: 'Failed to generate caption' }, 500);
  }
});

// Save a generated post to the queue
socialContentApi.post('/queue', async (c) => {
  const body = await c.req.json<{
    caption: string;
    imageUrl?: string;
    imageDescription?: string;
    style: PostStyle;
    theme: ContentTheme;
    tone?: string;
    hashtags: string[];
    platform?: 'facebook' | 'instagram' | 'both';
    scheduledFor?: number; // Unix timestamp
  }>();
  
  if (!body.caption) {
    return c.json({ error: 'Caption is required' }, 400);
  }
  
  const now = Math.floor(Date.now() / 1000);
  const scheduledFor = body.scheduledFor || (now + 3600); // Default: 1 hour from now
  
  const result = await c.env.DB.prepare(`
    INSERT INTO social_posts (
      caption, image_url, image_description,
      style, theme, tone, hashtags,
      platform, status, scheduled_for, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
  `).bind(
    body.caption,
    body.imageUrl || null,
    body.imageDescription || null,
    body.style,
    body.theme,
    body.tone || 'casual',
    JSON.stringify(body.hashtags),
    body.platform || 'both',
    scheduledFor
  ).run();
  
  return c.json({ 
    success: true, 
    postId: result.meta?.last_row_id,
    scheduledFor: new Date(scheduledFor * 1000).toISOString()
  });
});

// Get post history and stats
socialContentApi.get('/stats', async (c) => {
  // Style distribution in last 30 days
  const styleStats = await c.env.DB.prepare(`
    SELECT style, COUNT(*) as count
    FROM social_posts
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY style
    ORDER BY count DESC
  `).all<{ style: string; count: number }>();
  
  // Recent posts
  const recentPosts = await c.env.DB.prepare(`
    SELECT id, caption, style, theme, platform, status, 
           scheduled_for, published_at, engagement_score
    FROM social_posts
    ORDER BY created_at DESC
    LIMIT 20
  `).all<any>();
  
  // Top performing (by engagement)
  const topPosts = await c.env.DB.prepare(`
    SELECT id, caption, style, theme, engagement_score,
           likes, comments, shares
    FROM social_posts
    WHERE engagement_score > 0
    ORDER BY engagement_score DESC
    LIMIT 5
  `).all<any>();
  
  // Images used
  const imagesUsed = await c.env.DB.prepare(`
    SELECT image_url, COUNT(*) as times_used
    FROM social_posts
    WHERE image_url IS NOT NULL
    GROUP BY image_url
    ORDER BY times_used DESC
    LIMIT 10
  `).all<{ image_url: string; times_used: number }>();
  
  return c.json({
    styleDistribution: styleStats.results,
    recentPosts: recentPosts.results,
    topPerformers: topPosts.results,
    imagesUsed: imagesUsed.results,
    totalPosts: recentPosts.results?.length || 0
  });
});

// Record engagement metrics (called after posting)
socialContentApi.post('/engagement/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    likes?: number;
    comments?: number;
    shares?: number;
    reach?: number;
    fbPostId?: string;
    igMediaId?: string;
  }>();
  
  // Calculate engagement score
  const likes = body.likes || 0;
  const comments = body.comments || 0;
  const shares = body.shares || 0;
  const engagementScore = likes + (comments * 3) + (shares * 5); // Weight interactions
  
  await c.env.DB.prepare(`
    UPDATE social_posts SET
      likes = ?,
      comments = ?,
      shares = ?,
      reach = ?,
      engagement_score = ?,
      fb_post_id = COALESCE(?, fb_post_id),
      ig_media_id = COALESCE(?, ig_media_id),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    likes, comments, shares, body.reach || 0,
    engagementScore,
    body.fbPostId || null,
    body.igMediaId || null,
    id
  ).run();
  
  return c.json({ success: true, engagementScore });
});

// Get content recommendations based on what's working
socialContentApi.get('/recommendations', async (c) => {
  // Find best performing styles
  const bestStyles = await c.env.DB.prepare(`
    SELECT style, AVG(engagement_score) as avg_engagement, COUNT(*) as posts
    FROM social_posts
    WHERE engagement_score > 0 AND created_at > datetime('now', '-60 days')
    GROUP BY style
    HAVING posts >= 3
    ORDER BY avg_engagement DESC
    LIMIT 3
  `).all<{ style: PostStyle; avg_engagement: number; posts: number }>();
  
  // Find underused styles
  const recentStyles = await c.env.DB.prepare(`
    SELECT DISTINCT style FROM social_posts
    WHERE created_at > datetime('now', '-14 days')
  `).all<{ style: string }>();
  
  const usedStyles = new Set(recentStyles.results?.map(r => r.style) || []);
  const allStyles: PostStyle[] = [
    'tip', 'before-after', 'behind-scenes', 'seasonal', 'customer-story',
    'fun-fact', 'question', 'local-pride', 'tool-spotlight', 'mistake-lesson',
    'inspiration', 'weekend-project', 'material-deep-dive', 'raw-moment'
  ];
  const unusedStyles = allStyles.filter(s => !usedStyles.has(s));
  
  // Find least-used gallery images
  const underusedImages = await c.env.DB.prepare(`
    SELECT image_url, COUNT(*) as uses
    FROM social_posts
    WHERE image_url IS NOT NULL
    GROUP BY image_url
    ORDER BY uses ASC
    LIMIT 10
  `).all<{ image_url: string; uses: number }>();
  
  return c.json({
    bestPerformingStyles: bestStyles.results || [],
    unusedStyles: unusedStyles.slice(0, 5),
    underusedImages: underusedImages.results || [],
    recommendations: [
      bestStyles.results?.[0] 
        ? `Your "${bestStyles.results[0].style}" posts perform best - consider doing more!`
        : null,
      unusedStyles.length > 0
        ? `Try a "${unusedStyles[0]}" post - you haven't done one in 2 weeks`
        : null,
      `Current season: ${socialEngine.getCurrentSeason()} - good time for seasonal content`
    ].filter(Boolean)
  });
});

// Random inspiration - get a gallery image to spark ideas
socialContentApi.get('/inspire', async (c) => {
  const image = socialEngine.getGalleryInspiration();
  
  return c.json({
    image: {
      ...image,
      url: socialEngine.getImageUrl(image)
    },
    suggestion: `Use this ${image.title} (${image.category}) as inspiration. It's a ${image.type} shot that could work great for a ${
      image.type === 'before' ? 'transformation story' :
      image.type === 'hero' ? 'showcase post' :
      'behind-the-scenes or tip'
    } post.`
  });
});
