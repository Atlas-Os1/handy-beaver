import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import puppeteer from '@cloudflare/puppeteer';
import { isLeadPost, generateAIResponse, notifyLead } from '../routes/facebook-monitor';

type Env = {
  DB: D1Database;
  BROWSER: any;
  AI?: any;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

type LeadScanParams = {
  group_id?: string; // scan specific group, or all if omitted
  source?: 'cron' | 'manual';
};

// Facebook groups to monitor
const MONITORED_GROUPS = [
  { id: '412909228814153', name: 'McCurtain County', enabled: true },
  { id: '382445346214454', name: 'Broken Bow McCurtain County and Surrounding Area', enabled: true },
  { id: 'hochatownpublic', name: 'Hochatown', enabled: true },
  { id: '939908112835798', name: 'McCurtain County Swap Shop', enabled: true },
  { id: '618696202323805', name: 'Paris Texas Swap Shop', enabled: true },
  { id: '779481948731205', name: "HOCHATOWN...what's happenin'", enabled: true },
];

export class LeadScanWorkflow extends WorkflowEntrypoint<Env, LeadScanParams> {
  async run(event: WorkflowEvent<LeadScanParams>, step: WorkflowStep) {
    const params = event.payload;

    // Step 1: Get Facebook session cookies
    const session = await step.do('get-session', async () => {
      const result = await this.env.DB.prepare(
        'SELECT cookies FROM facebook_sessions WHERE id = 1'
      ).first<{ cookies: string }>();

      if (!result?.cookies) return null;
      return JSON.parse(result.cookies);
    });

    if (!session) {
      // Notify that no session is available
      await step.do('notify-no-session', async () => {
        if (this.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
          await fetch(this.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: '⚠️ Lead scan skipped — no Facebook session stored. Use `/api/facebook/login/cookies` to add one.',
            }),
          });
        }
      });
      return { skipped: true, reason: 'no_session' };
    }

    // Step 2: Determine which groups to scan
    const groups = params.group_id
      ? MONITORED_GROUPS.filter(g => g.id === params.group_id)
      : MONITORED_GROUPS.filter(g => g.enabled);

    // Step 3: Scrape each group for posts
    const allPosts = await step.do('scrape-groups', { timeout: '5 minutes', retries: { limit: 1, delay: '10 seconds' } }, async () => {
      const browser = await puppeteer.launch(this.env.BROWSER);
      const results: Array<{ group: string; groupId: string; posts: Array<{ text: string; url: string; author: string }> }> = [];

      try {
        for (const group of groups) {
          try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setCookie(...session);

            const groupUrl = `https://www.facebook.com/groups/${group.id}`;
            await page.goto(groupUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.waitForSelector('[role="article"]', { timeout: 10000 }).catch(() => null);

            // Scroll to load more posts
            await page.evaluate(() => window.scrollBy(0, 1500));
            await new Promise(r => setTimeout(r, 2000));

            const posts = await page.evaluate(() => {
              const articles = document.querySelectorAll('[role="article"]');
              const results: Array<{ text: string; url: string; author: string }> = [];

              articles.forEach((article, index) => {
                if (index > 20) return;
                const textElement = article.querySelector('[data-ad-preview="message"]') ||
                  article.querySelector('[dir="auto"]');
                const text = textElement?.textContent?.trim() || '';
                const linkElement = article.querySelector('a[href*="/posts/"]') ||
                  article.querySelector('a[href*="/permalink/"]');
                const url = linkElement?.getAttribute('href') || '';
                const authorElement = article.querySelector('h2 a, h3 a, strong a');
                const author = authorElement?.textContent?.trim() || 'Unknown';

                if (text && text.length > 20) {
                  results.push({
                    text: text.substring(0, 1000),
                    url: url.startsWith('http') ? url : `https://www.facebook.com${url}`,
                    author,
                  });
                }
              });
              return results;
            });

            await page.close();
            results.push({ group: group.name, groupId: group.id, posts });
          } catch (err: any) {
            console.error(`Error scraping ${group.name}:`, err.message);
            results.push({ group: group.name, groupId: group.id, posts: [] });
          }
        }
      } finally {
        await browser.close();
      }

      return results;
    });

    // Step 4: Detect leads from scraped posts
    const leads = await step.do('detect-leads', async () => {
      const detectedLeads: Array<{
        groupName: string;
        groupId: string;
        author: string;
        text: string;
        url: string;
        keywords: string[];
        categories: string[];
      }> = [];

      const now = Math.floor(Date.now() / 1000);

      for (const group of allPosts) {
        for (const post of group.posts) {
          // Skip if already processed
          const existing = await this.env.DB.prepare(
            'SELECT id FROM leads WHERE source_url = ?'
          ).bind(post.url).first();
          if (existing) continue;

          const result = isLeadPost(post.text);
          if (result.isLead) {
            // Save lead to DB
            const insertResult = await this.env.DB.prepare(`
              INSERT INTO leads (
                source, source_url, source_group_id, source_group_name,
                source_user_name, content, keywords_matched, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              'facebook', post.url, group.groupId, group.groupName,
              post.author, post.text, JSON.stringify(result.keywords), now
            ).run();

            detectedLeads.push({
              groupName: group.groupName,
              groupId: group.groupId,
              author: post.author,
              text: post.text,
              url: post.url,
              keywords: result.keywords,
              categories: result.categories,
            });
          }
        }
      }

      // Log scan results
      for (const group of allPosts) {
        const groupLeads = detectedLeads.filter(l => l.groupId === group.groupId);
        await this.env.DB.prepare(`
          INSERT INTO group_scan_log (group_id, group_name, posts_found, leads_found, scan_duration_ms, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(group.groupId, group.group, group.posts.length, groupLeads.length, 0, now).run();
      }

      return detectedLeads;
    });

    if (leads.length === 0) {
      return {
        success: true,
        groups_scanned: allPosts.length,
        total_posts: allPosts.reduce((a, g) => a + g.posts.length, 0),
        leads_found: 0,
      };
    }

    // Step 5: Generate AI responses for each lead
    const drafts = await step.do('generate-ai-responses', async () => {
      const responses: Array<{ leadUrl: string; author: string; groupName: string; postText: string; draftResponse: string }> = [];

      for (const lead of leads) {
        let draftResponse: string;
        if (this.env.AI) {
          draftResponse = await generateAIResponse(lead.text, lead.categories, this.env.AI);
        } else {
          // Fallback — import getResponseTemplate
          const { getResponseTemplate } = await import('../routes/facebook-monitor');
          draftResponse = getResponseTemplate(lead.categories);
        }

        // Store draft in DB
        await this.env.DB.prepare(`
          UPDATE leads SET response_content = ?, auto_respond_rejected = 0
          WHERE source_url = ?
        `).bind(draftResponse, lead.url).run();

        responses.push({
          leadUrl: lead.url,
          author: lead.author,
          groupName: lead.groupName,
          postText: lead.text,
          draftResponse,
        });
      }

      return responses;
    });

    // Step 6: Send Discord notifications for each lead
    await step.do('notify-discord', async () => {
      if (!this.env.DISCORD_WEBHOOK_NOTIFICATIONS) return;

      for (const draft of drafts) {
        const lead = await this.env.DB.prepare(
          'SELECT id FROM leads WHERE source_url = ?'
        ).bind(draft.leadUrl).first<{ id: number }>();

        await fetch(this.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🎯 New Lead — Auto-posting in 10 min',
              color: 0x8B4513,
              fields: [
                { name: 'Group', value: draft.groupName, inline: true },
                { name: 'Author', value: draft.author, inline: true },
                { name: 'Post', value: draft.postText.substring(0, 300) },
                { name: 'Link', value: draft.leadUrl },
                { name: '🤖 AI Draft', value: draft.draftResponse },
                { name: '❌ To Cancel', value: lead ? `POST handybeaver.co/api/facebook/leads/${lead.id}/reject` : 'N/A' },
              ],
              footer: { text: 'Will auto-post unless rejected within 10 minutes' },
              timestamp: new Date().toISOString(),
            }],
          }),
        });

        // Small delay between Discord messages to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
      }
    });

    // Step 7: Wait 10 minutes for potential rejection
    await step.sleep('wait-for-review', '10 minutes');

    // Step 8: Post approved responses via Browser Rendering
    const postResults = await step.do('post-comments', { timeout: '5 minutes', retries: { limit: 1, delay: '10 seconds' } }, async () => {
      const results: Array<{ url: string; posted: boolean; reason?: string }> = [];

      // Check which leads were NOT rejected
      const approvedDrafts: typeof drafts = [];
      for (const draft of drafts) {
        const lead = await this.env.DB.prepare(
          'SELECT id, auto_respond_rejected, response_sent FROM leads WHERE source_url = ?'
        ).bind(draft.leadUrl).first<{ id: number; auto_respond_rejected: number; response_sent: number }>();

        if (!lead) {
          results.push({ url: draft.leadUrl, posted: false, reason: 'lead_not_found' });
          continue;
        }
        if (lead.auto_respond_rejected) {
          results.push({ url: draft.leadUrl, posted: false, reason: 'rejected' });
          continue;
        }
        if (lead.response_sent) {
          results.push({ url: draft.leadUrl, posted: false, reason: 'already_sent' });
          continue;
        }

        approvedDrafts.push(draft);
      }

      if (approvedDrafts.length === 0) {
        return results;
      }

      // Get session again (may have been refreshed during the 10-min wait)
      const freshSession = await this.env.DB.prepare(
        'SELECT cookies FROM facebook_sessions WHERE id = 1'
      ).first<{ cookies: string }>();

      if (!freshSession?.cookies) {
        for (const draft of approvedDrafts) {
          results.push({ url: draft.leadUrl, posted: false, reason: 'no_session' });
        }
        return results;
      }

      const cookies = JSON.parse(freshSession.cookies);
      const browser = await puppeteer.launch(this.env.BROWSER);

      try {
        for (const draft of approvedDrafts) {
          try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 900 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setCookie(...cookies);

            await page.goto(draft.leadUrl, { waitUntil: 'networkidle0', timeout: 30000 });

            // Check not redirected to login
            if (page.url().includes('login') || page.url().includes('checkpoint')) {
              await page.close();
              results.push({ url: draft.leadUrl, posted: false, reason: 'session_expired' });
              continue;
            }

            await new Promise(r => setTimeout(r, 2000));

            // Find comment box
            const commentBoxSelectors = [
              '[aria-label="Write a comment"]',
              '[aria-label="Write a comment..."]',
              '[placeholder="Write a comment..."]',
              '[contenteditable="true"][role="textbox"]',
            ];

            let commentBox = null;
            for (const selector of commentBoxSelectors) {
              commentBox = await page.$(selector);
              if (commentBox) break;
            }

            if (!commentBox) {
              // Try clicking "Comment" button first
              const commentButton = await page.$('[aria-label="Leave a comment"]') ||
                await page.$('[aria-label="Comment"]');
              if (commentButton) {
                await commentButton.click();
                await new Promise(r => setTimeout(r, 1000));
                for (const selector of commentBoxSelectors) {
                  commentBox = await page.$(selector);
                  if (commentBox) break;
                }
              }
            }

            if (!commentBox) {
              await page.close();
              results.push({ url: draft.leadUrl, posted: false, reason: 'no_comment_box' });
              continue;
            }

            await commentBox.click();
            await new Promise(r => setTimeout(r, 500));
            await page.keyboard.type(draft.draftResponse, { delay: 50 });
            await new Promise(r => setTimeout(r, 500));
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 3000));
            await page.close();

            // Mark as sent
            const now = Math.floor(Date.now() / 1000);
            await this.env.DB.prepare(`
              UPDATE leads SET response_sent = 1, response_sent_at = ? WHERE source_url = ?
            `).bind(now, draft.leadUrl).run();

            // Log comment
            await this.env.DB.prepare(`
              INSERT INTO facebook_comments (post_url, comment_text, posted_at) VALUES (?, ?, ?)
            `).bind(draft.leadUrl, draft.draftResponse, now).run().catch(() => {});

            results.push({ url: draft.leadUrl, posted: true });

            // Notify Discord
            if (this.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
              await fetch(this.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  embeds: [{
                    title: '💬 Auto-comment Posted',
                    color: 0x4267B2,
                    fields: [
                      { name: 'Post', value: draft.leadUrl.substring(0, 100) },
                      { name: 'Comment', value: draft.draftResponse.substring(0, 200) },
                    ],
                    timestamp: new Date().toISOString(),
                  }],
                }),
              }).catch(() => {});
            }

            // Delay between comments to avoid rate limiting
            await new Promise(r => setTimeout(r, 5000));
          } catch (err: any) {
            console.error(`Error posting to ${draft.leadUrl}:`, err.message);
            results.push({ url: draft.leadUrl, posted: false, reason: err.message });
          }
        }
      } finally {
        await browser.close();
      }

      return results;
    });

    return {
      success: true,
      groups_scanned: allPosts.length,
      total_posts: allPosts.reduce((a, g) => a + g.posts.length, 0),
      leads_found: leads.length,
      drafts_generated: drafts.length,
      post_results: postResults,
    };
  }
}
