/**
 * ContentPublishWorkflow
 * Publishes scheduled social media posts from content_queue table to Facebook.
 * Triggered by cron — each post gets its own durable step with retry.
 * A failed FB post no longer blocks other posts or other workflows.
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  DB: D1Database;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
  FACEBOOK_PAGE_ID?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

type Params = { triggered_by?: string; limit?: number };

type ContentQueuePost = {
  id: number;
  platform: string;
  caption: string;
  hashtags?: string;
  image_url?: string;
  scheduled_for: number;
};

export class ContentPublishWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const limit = event.payload?.limit ?? 3;

    // Step 1: Fetch ready posts from D1
    const posts = await step.do('fetch-ready-posts', async () => {
      const now = Math.floor(Date.now() / 1000);
      const result = await this.env.DB.prepare(`
        SELECT * FROM content_queue
        WHERE status = 'ready' AND scheduled_for <= ?
        ORDER BY scheduled_for ASC
        LIMIT ?
      `).bind(now, limit).all<ContentQueuePost>();
      return result.results ?? [];
    });

    if (!posts.length) return { published: 0, failed: 0 };

    let published = 0;
    let failed = 0;

    for (const post of posts) {
      const postResult = await step.do(`publish-post-${post.id}`, {
        retries: { limit: 2, delay: '30 seconds', backoff: 'linear' },
        timeout: '2 minutes',
      }, async () => {
        const fbToken = this.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const fbPageId = this.env.FACEBOOK_PAGE_ID ?? '1040910635768535';

        if (!fbToken) return { success: false, error: 'No FB token' };

        const message = post.caption + (post.hashtags ? `\n\n${post.hashtags}` : '');

        let fbUrl: string;
        let fbParams: Record<string, string>;

        if (post.image_url) {
          const imageUrl = post.image_url.startsWith('/')
            ? `https://handybeaver.co${post.image_url}`
            : post.image_url;
          fbUrl = `https://graph.facebook.com/v19.0/${fbPageId}/photos`;
          fbParams = { access_token: fbToken, url: imageUrl, caption: message };
        } else {
          fbUrl = `https://graph.facebook.com/v19.0/${fbPageId}/feed`;
          fbParams = { access_token: fbToken, message };
        }

        const fbRes = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(fbParams),
        });

        const fbData = await fbRes.json() as any;
        if (!fbData.id) throw new Error(`FB error: ${JSON.stringify(fbData.error ?? fbData)}`);

        return { success: true, fb_post_id: fbData.id };
      }).catch(err => ({ success: false, error: String(err) }));

      // Step: Update post status in D1
      const now = Math.floor(Date.now() / 1000);
      await step.do(`update-status-${post.id}`, async () => {
        if ((postResult as any).success) {
          await this.env.DB.prepare(
            'UPDATE content_queue SET status=\'published\', fb_post_id=?, published_at=?, updated_at=? WHERE id=?'
          ).bind((postResult as any).fb_post_id, now, now, post.id).run();
        } else {
          await this.env.DB.prepare(
            'UPDATE content_queue SET status=\'failed\', error_message=?, updated_at=? WHERE id=?'
          ).bind((postResult as any).error, now, post.id).run();
        }
      });

      if ((postResult as any).success) published++;
      else failed++;
    }

    return { published, failed };
  }
}
