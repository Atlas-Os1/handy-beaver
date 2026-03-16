import { Hono } from 'hono';
import puppeteer from '@cloudflare/puppeteer';

type Bindings = {
  DB: D1Database;
  BROWSER: any;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

export const facebookComment = new Hono<{ Bindings: Bindings }>();

// Get stored session cookies
async function getSession(db: D1Database): Promise<any[] | null> {
  const result = await db.prepare(
    'SELECT cookies FROM facebook_sessions WHERE id = 1'
  ).first<{ cookies: string }>();
  
  if (!result?.cookies) return null;
  return JSON.parse(result.cookies);
}

/**
 * POST /api/facebook/comment
 * Post a comment on any Facebook post using browser automation
 * 
 * Body: { post_url: string, comment: string }
 */
facebookComment.post('/comment', async (c) => {
  const { post_url, comment } = await c.req.json();
  
  if (!post_url || !comment) {
    return c.json({ error: 'post_url and comment are required' }, 400);
  }
  
  // Validate URL
  if (!post_url.includes('facebook.com')) {
    return c.json({ error: 'Invalid Facebook URL' }, 400);
  }
  
  // Get session
  const cookies = await getSession(c.env.DB);
  if (!cookies) {
    return c.json({ 
      error: 'No Facebook session. Use /api/facebook/login/cookies first.' 
    }, 401);
  }
  
  const browser = await puppeteer.launch(c.env.BROWSER);
  let page;
  
  try {
    page = await browser.newPage();
    
    // Set up browser
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setCookie(...cookies);
    
    // Navigate to post
    await page.goto(post_url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Check if we're logged in (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
      await browser.close();
      return c.json({ 
        error: 'Session expired. Please re-login.',
        logged_out: true 
      }, 401);
    }
    
    // Wait a moment for page to fully render
    await new Promise(r => setTimeout(r, 2000));
    
    // Find and click the comment box
    // Facebook uses different selectors, try multiple approaches
    const commentBoxSelectors = [
      '[aria-label="Write a comment"]',
      '[aria-label="Write a comment..."]',
      '[placeholder="Write a comment..."]',
      '[contenteditable="true"][role="textbox"]',
      'div[data-contents="true"]',
    ];
    
    let commentBox = null;
    for (const selector of commentBoxSelectors) {
      commentBox = await page.$(selector);
      if (commentBox) break;
    }
    
    if (!commentBox) {
      // Try clicking "Comment" button first to expand the box
      const commentButton = await page.$('[aria-label="Leave a comment"]') ||
                           await page.$('[aria-label="Comment"]') ||
                           await page.$('[data-testid="UFI2CommentLink"]');
      if (commentButton) {
        await commentButton.click();
        await new Promise(r => setTimeout(r, 1000));
        
        // Try selectors again
        for (const selector of commentBoxSelectors) {
          commentBox = await page.$(selector);
          if (commentBox) break;
        }
      }
    }
    
    if (!commentBox) {
      // Take screenshot for debugging
      const screenshot = await page.screenshot({ encoding: 'base64' });
      await browser.close();
      return c.json({ 
        error: 'Could not find comment box. Post may not allow comments.',
        screenshot: `data:image/png;base64,${screenshot}`,
        debug: 'Tried multiple selectors, none found'
      }, 400);
    }
    
    // Click the comment box to focus it
    await commentBox.click();
    await new Promise(r => setTimeout(r, 500));
    
    // Type the comment
    await page.keyboard.type(comment, { delay: 50 });
    await new Promise(r => setTimeout(r, 500));
    
    // Submit - press Enter or find submit button
    // Try Enter first (works for most FB comment boxes)
    await page.keyboard.press('Enter');
    
    // Wait for comment to post
    await new Promise(r => setTimeout(r, 3000));
    
    // Take confirmation screenshot
    const confirmScreenshot = await page.screenshot({ encoding: 'base64' });
    
    await browser.close();
    
    // Log to DB
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(`
      INSERT INTO facebook_comments (post_url, comment_text, posted_at)
      VALUES (?, ?, ?)
    `).bind(post_url, comment, now).run().catch(() => {
      // Table might not exist, that's okay
    });
    
    // Notify Discord if configured
    if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
      await fetch(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '💬 Comment Posted',
            color: 0x4267B2,
            fields: [
              { name: 'Post', value: post_url.substring(0, 100), inline: false },
              { name: 'Comment', value: comment.substring(0, 200), inline: false },
            ],
            timestamp: new Date().toISOString(),
          }],
        }),
      }).catch(() => {});
    }
    
    return c.json({ 
      success: true, 
      message: 'Comment posted!',
      post_url,
      comment,
      screenshot: `data:image/png;base64,${confirmScreenshot}`
    });
    
  } catch (error: any) {
    if (page) {
      try {
        const errorScreenshot = await page.screenshot({ encoding: 'base64' });
        await browser.close();
        return c.json({ 
          error: error.message,
          screenshot: `data:image/png;base64,${errorScreenshot}`
        }, 500);
      } catch {
        await browser.close();
      }
    }
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/facebook/comment/lead/:id
 * Comment on a lead from the leads table
 */
facebookComment.post('/comment/lead/:id', async (c) => {
  const id = c.req.param('id');
  const { comment } = await c.req.json();
  
  // Get lead
  const lead = await c.env.DB.prepare(
    'SELECT * FROM leads WHERE id = ?'
  ).bind(id).first<{ source_url: string; keywords_matched: string }>();
  
  if (!lead) {
    return c.json({ error: 'Lead not found' }, 404);
  }
  
  if (!lead.source_url) {
    return c.json({ error: 'Lead has no source URL' }, 400);
  }
  
  // Use provided comment or generate one from keywords
  let commentText = comment;
  if (!commentText) {
    const keywords = JSON.parse(lead.keywords_matched || '[]');
    commentText = generateResponse(keywords);
  }
  
  // Forward to main comment endpoint
  const response = await facebookComment.request(
    new Request('http://localhost/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        post_url: lead.source_url, 
        comment: commentText 
      }),
    }),
    c.env
  );
  
  // Mark lead as responded
  if (response.ok) {
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(`
      UPDATE leads 
      SET response_sent = 1, response_content = ?, response_sent_at = ?
      WHERE id = ?
    `).bind(commentText, now, id).run();
  }
  
  return response;
});

// Generate response based on keywords
function generateResponse(keywords: string[]): string {
  const hasFlooring = keywords.some(k => 
    ['flooring', 'floors', 'lvp', 'hardwood', 'tile', 'carpet', 'laminate'].includes(k)
  );
  const hasTrim = keywords.some(k => 
    ['trim', 'baseboards', 'crown molding', 'casing', 'carpenter', 'finish work'].includes(k)
  );
  const hasDeck = keywords.some(k => 
    ['deck', 'porch', 'staining', 'boards', 'railing'].includes(k)
  );
  
  if (hasFlooring) {
    return "I handle flooring! LVP, hardwood, tile — $175/half day or $300/full day, you just cover materials. Based in SE Oklahoma. More at handybeaver.co 🦫";
  }
  if (hasTrim) {
    return "Finish carpentry is my specialty! Crown, base, casing, built-ins. $175/half day or $300/full day. SE Oklahoma area. Details at handybeaver.co 🦫";
  }
  if (hasDeck) {
    return "I do deck work — repairs, board replacement, staining. $175/half day or $300/full day, you cover materials. Check out handybeaver.co 🦫";
  }
  
  return "Hey! I do this kind of work in SE Oklahoma — flooring, trim, deck repair, maintenance. $175/half day or $300/full day. Check out handybeaver.co for a free quote! 🦫";
}
