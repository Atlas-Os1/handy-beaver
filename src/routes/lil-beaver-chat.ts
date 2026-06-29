import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  IMAGES?: R2Bucket;
  OPENCLAW_GATEWAY_URL?: string;
  OPENCLAW_GATEWAY_TOKEN?: string;
  ADMIN_API_KEY?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

export const lilBeaverChatApi = new Hono<{ Bindings: Bindings }>();

// OpenClaw OpenResponses API integration
const GATEWAY_URL = 'http://localhost:18789'; // Local gateway
const AGENT_ID = 'lil-beaver';

// Admin chat - full admin tools
lilBeaverChatApi.post('/admin', async (c) => {
  const body = await c.req.json<{ message: string; session_key?: string }>();
  
  if (!body.message) {
    return c.json({ error: 'message is required' }, 400);
  }
  
  const gatewayUrl = c.env.OPENCLAW_GATEWAY_URL || GATEWAY_URL;
  const gatewayToken = c.env.OPENCLAW_GATEWAY_TOKEN;
  
  if (!gatewayToken) {
    return c.json({ error: 'Gateway not configured' }, 500);
  }
  
  try {
    // System prompt for admin context
    const systemPrompt = `You are Lil Beaver, the admin assistant for The Handy Beaver handyman service.
You have FULL ADMIN ACCESS. You can:
- Create, edit, and send quotes
- Create and send invoices via Square
- Manage customers (create, update, view)
- Update job statuses and add notes
- View all messages and leads
- Access dashboard stats

Use the admin API at https://handybeaver.co/api/admin/* with your tools.
Be helpful, concise, and action-oriented. When asked to do something, do it.`;

    const response = await fetch(`${gatewayUrl}/api/v1/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        agent: AGENT_ID,
        input: body.message,
        session_key: body.session_key || `admin-chat-${Date.now()}`,
        instructions: systemPrompt,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Gateway error:', error);
      return c.json({ error: 'Failed to get response from Lil Beaver' }, 500);
    }
    
    const data = await response.json() as any;
    
    return c.json({
      response: data.output_text || data.content || data.message || 'No response',
      session_key: data.session_key,
    });
    
  } catch (error: any) {
    console.error('Lil Beaver chat error:', error);
    return c.json({ error: error.message || 'Chat failed' }, 500);
  }
});

// Customer chat - customer tools only, scoped to their data
lilBeaverChatApi.post('/customer', async (c) => {
  const body = await c.req.json<{ 
    message: string; 
    customer_id: number;
    customer_name?: string;
    session_key?: string;
  }>();
  
  if (!body.message || !body.customer_id) {
    return c.json({ error: 'message and customer_id are required' }, 400);
  }
  
  const gatewayUrl = c.env.OPENCLAW_GATEWAY_URL || GATEWAY_URL;
  const gatewayToken = c.env.OPENCLAW_GATEWAY_TOKEN;
  
  if (!gatewayToken) {
    return c.json({ error: 'Gateway not configured' }, 500);
  }
  
  // Get customer info from DB
  const customer = await c.env.DB.prepare(
    'SELECT id, name, email, phone FROM customers WHERE id = ?'
  ).bind(body.customer_id).first<any>();
  
  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  const now = Math.floor(Date.now() / 1000);

  // Save customer message to DB for admin visibility
  await c.env.DB.prepare(
    `INSERT INTO messages (customer_id, sender, content, source, created_at) VALUES (?, 'customer', ?, 'lil-beaver', ?)`
  ).bind(customer.id, body.message, now).run().catch(e => console.error('Failed to save customer msg:', e));

  try {
    // System prompt for customer context - LIMITED access
    const systemPrompt = `You are Lil Beaver 🦫, the friendly assistant for The Handy Beaver handyman service based in Southeast Oklahoma.

You are helping: ${customer.name} (customer ID: ${customer.id})

IMPORTANT RULES:
- You can ONLY access this customer's own data
- You CANNOT create or modify quotes, invoices, or jobs
- You CANNOT access other customers' information
- This conversation IS recorded and visible to the admin team

YOU CAN help with:
- Answering questions about their quotes, jobs, and invoices
- Explaining our services, pricing, and subscription plans
- General customer service questions
- Passing messages to the owner

ACCOUNT DATA (fetch when needed):
- GET /api/portal/quotes?customer_id=${customer.id}
- GET /api/portal/jobs?customer_id=${customer.id}
- GET /api/portal/invoices?customer_id=${customer.id}

PASSING A MESSAGE TO THE OWNER:
If the customer wants to leave a message, relay contact info, or request a callback, call:
POST https://handybeaver.co/api/chat/forward-message
Body: { "customer_id": ${customer.id}, "message": "<their message>", "phone": "<phone if given>", "context": "<brief summary>" }
After calling it, tell the customer: "I've passed your message to the owner. You can expect a call back within 1 business day."

Be warm, friendly, and concise. Always address ${customer.name.split(' ')[0]} by first name.`;

    const response = await fetch(`${gatewayUrl}/api/v1/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        agent: AGENT_ID,
        input: body.message,
        session_key: body.session_key || `customer-${customer.id}-${Date.now()}`,
        instructions: systemPrompt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gateway error:', error);
      return c.json({ error: 'Failed to get response' }, 500);
    }

    const data = await response.json() as any;
    const agentReply = data.output_text || data.content || data.message || 'No response';

    // Save agent reply to DB
    await c.env.DB.prepare(
      `INSERT INTO messages (customer_id, sender, content, source, created_at) VALUES (?, 'ai', ?, 'lil-beaver', ?)`
    ).bind(customer.id, agentReply, Math.floor(Date.now() / 1000)).run().catch(e => console.error('Failed to save agent msg:', e));

    return c.json({
      response: agentReply,
      session_key: data.session_key,
      customer_id: customer.id,
    });

  } catch (error: any) {
    console.error('Lil Beaver customer chat error:', error);
    return c.json({ error: error.message || 'Chat failed' }, 500);
  }
});

// Forward a customer message to the owner via Discord
lilBeaverChatApi.post('/forward-message', async (c) => {
  const body = await c.req.json<{
    customer_id: number;
    message: string;
    phone?: string;
    context?: string;
  }>();

  if (!body.customer_id || !body.message) {
    return c.json({ error: 'customer_id and message are required' }, 400);
  }

  const customer = await c.env.DB.prepare(
    'SELECT id, name, email, phone FROM customers WHERE id = ?'
  ).bind(body.customer_id).first<any>();

  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  const now = Math.floor(Date.now() / 1000);

  // Save to messages table so admin can see it
  await c.env.DB.prepare(
    `INSERT INTO messages (customer_id, sender, content, source, created_at) VALUES (?, 'customer', ?, 'forwarded', ?)`
  ).bind(customer.id, body.message, now).run().catch(e => console.error('Failed to save forwarded msg:', e));

  // Fire Discord notification
  if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
    try {
      await fetch(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: null,
          embeds: [{
            title: '📬 Message from Client Portal',
            color: 0xf59e0b, // Amber — distinct from lead (green) and quote (blue)
            fields: [
              { name: '👤 Client', value: customer.name, inline: true },
              { name: '📧 Email', value: customer.email, inline: true },
              { name: '📱 Phone', value: body.phone || customer.phone || 'Not provided', inline: true },
              { name: '💬 Message', value: body.message.substring(0, 500), inline: false },
              ...(body.context ? [{ name: '📋 Context', value: body.context, inline: false }] : []),
            ],
            footer: { text: 'Via Lil Beaver client portal agent' },
            timestamp: new Date().toISOString(),
          }],
        }),
      });
    } catch (e) {
      console.error('Discord forward notification failed:', e);
    }
  }

  return c.json({ success: true, message: 'Message forwarded to owner' });
});

// Health check
lilBeaverChatApi.get('/status', async (c) => {
  const gatewayToken = c.env.OPENCLAW_GATEWAY_TOKEN;
  return c.json({
    configured: !!gatewayToken,
    agent: AGENT_ID,
    endpoints: {
      admin: '/api/chat/admin',
      customer: '/api/chat/customer',
      upload: '/api/chat/upload',
    },
  });
});

// Photo upload for task submissions
lilBeaverChatApi.post('/upload', async (c) => {
  const contentType = c.req.header('Content-Type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    return c.json({ error: 'multipart/form-data required' }, 400);
  }
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('photo') as File | null;
    const customerId = formData.get('customer_id') as string | null;
    const taskId = formData.get('task_id') as string | null;
    const context = formData.get('context') as string || 'chat';
    
    if (!file) {
      return c.json({ error: 'No photo uploaded' }, 400);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, 400);
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File too large. Max 10MB.' }, 400);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const folder = context === 'task' ? 'tasks' : 'chat';
    const key = `uploads/${folder}/${customerId || 'unknown'}/${timestamp}.${ext}`;
    
   