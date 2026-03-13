import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
  FACEBOOK_VERIFY_TOKEN?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
  ANTHROPIC_API_KEY?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

type Variables = {
  // Request context
};

export const metaWebhook = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Webhook verification (GET request from Meta)
metaWebhook.get('/', async (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  const verifyToken = c.env.FACEBOOK_VERIFY_TOKEN || 'handy_beaver_webhook_2024';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Meta webhook verified');
    return c.text(challenge || '');
  }

  return c.text('Forbidden', 403);
});

// Webhook events (POST from Meta)
metaWebhook.post('/', async (c) => {
  const body = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  console.log('Meta webhook received:', JSON.stringify(body).slice(0, 500));

  // Handle different event types
  if (body.object === 'page') {
    // Facebook Page events (messages, comments)
    for (const entry of body.entry || []) {
      // Handle messaging events
      if (entry.messaging) {
        for (const event of entry.messaging) {
          await handleFacebookMessage(c, event, now);
        }
      }

      // Handle comment events (if subscribed)
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'feed' && change.value?.item === 'comment') {
            await handleFacebookComment(c, change.value, now);
          }
        }
      }
    }
  } else if (body.object === 'instagram') {
    // Instagram events
    for (const entry of body.entry || []) {
      if (entry.messaging) {
        for (const event of entry.messaging) {
          await handleInstagramMessage(c, event, now);
        }
      }
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            await handleInstagramComment(c, change.value, now);
          }
        }
      }
    }
  }

  return c.json({ status: 'ok' });
});

// Handle Facebook Messenger message
async function handleFacebookMessage(c: any, event: any, now: number) {
  const senderId = event.sender?.id;
  const messageText = event.message?.text;
  const pageId = event.recipient?.id;

  if (!senderId || !messageText) return;

  // Log the conversation
  await c.env.DB.prepare(`
    INSERT INTO social_messages (platform, sender_id, page_id, message_text, direction, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind('facebook', senderId, pageId, messageText, 'inbound', now).run();

  // Check if this is a new lead
  const existingLead = await c.env.DB.prepare(`
    SELECT id FROM leads WHERE source_id = ? AND source = 'facebook_messenger'
  `).bind(senderId).first();

  if (!existingLead) {
    // Create new lead
    await c.env.DB.prepare(`
      INSERT INTO leads (source, source_id, content, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind('facebook_messenger', senderId, messageText, 'new', now).run();

    // Notify Discord
    if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
      await notifyDiscord(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
        title: '🦫 New FB Messenger Lead!',
        description: messageText.slice(0, 200),
        color: 0x1877F2,
        fields: [
          { name: 'Sender ID', value: senderId, inline: true },
          { name: 'Platform', value: 'Facebook Messenger', inline: true },
        ],
      });
    }
  }

  // Generate AI response with Lil Beaver personality
  const response = await generateBeaverResponse(c, messageText, 'facebook');

  if (response && c.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    // Send reply via Messenger API
    await sendFacebookMessage(c.env.FACEBOOK_PAGE_ACCESS_TOKEN, senderId, response);

    // Log outbound message
    await c.env.DB.prepare(`
      INSERT INTO social_messages (platform, sender_id, page_id, message_text, direction, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind('facebook', senderId, pageId, response, 'outbound', now).run();
  }
}

// Handle Instagram DM
async function handleInstagramMessage(c: any, event: any, now: number) {
  const senderId = event.sender?.id;
  const messageText = event.message?.text;
  const recipientId = event.recipient?.id;

  if (!senderId || !messageText) return;

  // Log the conversation
  await c.env.DB.prepare(`
    INSERT INTO social_messages (platform, sender_id, page_id, message_text, direction, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind('instagram', senderId, recipientId, messageText, 'inbound', now).run();

  // Check if this is a new lead
  const existingLead = await c.env.DB.prepare(`
    SELECT id FROM leads WHERE source_id = ? AND source = 'instagram_dm'
  `).bind(senderId).first();

  if (!existingLead) {
    await c.env.DB.prepare(`
      INSERT INTO leads (source, source_id, content, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind('instagram_dm', senderId, messageText, 'new', now).run();

    if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
      await notifyDiscord(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
        title: '🦫 New Instagram DM Lead!',
        description: messageText.slice(0, 200),
        color: 0xE4405F,
        fields: [
          { name: 'Sender ID', value: senderId, inline: true },
          { name: 'Platform', value: 'Instagram DM', inline: true },
        ],
      });
    }
  }

  // Generate and send response
  const response = await generateBeaverResponse(c, messageText, 'instagram');

  if (response && c.env.INSTAGRAM_ACCESS_TOKEN) {
    await sendInstagramMessage(c.env.INSTAGRAM_ACCESS_TOKEN, senderId, response);

    await c.env.DB.prepare(`
      INSERT INTO social_messages (platform, sender_id, page_id, message_text, direction, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind('instagram', senderId, recipientId, response, 'outbound', now).run();
  }
}

// Handle Facebook comment
async function handleFacebookComment(c: any, value: any, now: number) {
  const commentId = value.comment_id;
  const postId = value.post_id;
  const message = value.message;
  const senderId = value.from?.id;

  if (!message || !senderId) return;

  // Log comment
  await c.env.DB.prepare(`
    INSERT INTO social_messages (platform, sender_id, post_id, message_text, direction, message_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind('facebook', senderId, postId, message, 'inbound', 'comment', now).run();

  // Could reply to comments if desired
}

// Handle Instagram comment
async function handleInstagramComment(c: any, value: any, now: number) {
  const commentId = value.id;
  const mediaId = value.media?.id;
  const text = value.text;
  const username = value.from?.username;

  if (!text) return;

  await c.env.DB.prepare(`
    INSERT INTO social_messages (platform, sender_id, post_id, message_text, direction, message_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind('instagram', username || 'unknown', mediaId, text, 'inbound', 'comment', now).run();
}

// Generate Lil Beaver response using AI
async function generateBeaverResponse(c: any, userMessage: string, platform: string): Promise<string | null> {
  if (!c.env.ANTHROPIC_API_KEY) {
    // Fallback response
    return "Hey there! 🦫 Thanks for reaching out to The Handy Beaver! I handle flooring, trim work, deck repair and general maintenance in SE Oklahoma. Check out handybeaver.co for pricing or to request a free quote!";
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': c.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: `You are Lil Beaver, the friendly AI assistant for The Handy Beaver handyman service in SE Oklahoma. 

Personality:
- Warm, helpful, slightly playful
- Use 🦫 emoji occasionally (not every message)
- Keep responses concise for ${platform} (under 200 chars ideal)

Services & Pricing:
- Flooring (LVP, hardwood, tile)
- Trim carpentry (crown molding, baseboards, built-ins)
- Deck repair & staining
- General maintenance

Rates:
- Half day (≤6 hours): $175
- Full day: $300
- Customer pays materials directly

Website: handybeaver.co
Goal: Qualify leads, answer questions, direct to website for quotes.`,
        messages: [
          { role: 'user', content: userMessage }
        ],
      }),
    });

    const data = await response.json() as any;
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error('AI response error:', error);
    return null;
  }
}

// Send Facebook Messenger message
async function sendFacebookMessage(accessToken: string, recipientId: string, message: string) {
  try {
    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    });
  } catch (error) {
    console.error('Facebook send error:', error);
  }
}

// Send Instagram message
async function sendInstagramMessage(accessToken: string, recipientId: string, message: string) {
  try {
    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    });
  } catch (error) {
    console.error('Instagram send error:', error);
  }
}

// Discord notification helper
async function notifyDiscord(webhookUrl: string, embed: any) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error('Discord notify error:', error);
  }
}

// Manual test endpoint
metaWebhook.get('/test', async (c) => {
  return c.json({
    status: 'ready',
    config: {
      hasPageToken: !!c.env.FACEBOOK_PAGE_ACCESS_TOKEN,
      hasInstagramToken: !!c.env.INSTAGRAM_ACCESS_TOKEN,
      hasAnthropicKey: !!c.env.ANTHROPIC_API_KEY,
      hasDiscordWebhook: !!c.env.DISCORD_WEBHOOK_NOTIFICATIONS,
    },
  });
});
