import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  OPENCLAW_GATEWAY_URL?: string;
  OPENCLAW_GATEWAY_TOKEN?: string;
  ADMIN_API_KEY?: string;
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
  
  try {
    // System prompt for customer context - LIMITED access
    const systemPrompt = `You are Lil Beaver, the friendly assistant for The Handy Beaver handyman service.

You are helping customer: ${customer.name} (ID: ${customer.id}, Email: ${customer.email})

IMPORTANT: You can ONLY access this customer's data. You CANNOT:
- Create or modify quotes, invoices, or jobs
- Access other customers' information
- Perform admin actions

You CAN help with:
- Answering questions about their quotes, jobs, and invoices
- Explaining pricing and services
- Scheduling questions
- General customer service

When they ask about their account, use the customer API to fetch their specific data:
- GET /api/portal/quotes?customer_id=${customer.id}
- GET /api/portal/jobs?customer_id=${customer.id}
- GET /api/portal/invoices?customer_id=${customer.id}

Be friendly, helpful, and professional. If they need admin help (like changing a quote), tell them to contact us directly.`;

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
    
    return c.json({
      response: data.output_text || data.content || data.message || 'No response',
      session_key: data.session_key,
      customer_id: customer.id,
    });
    
  } catch (error: any) {
    console.error('Lil Beaver customer chat error:', error);
    return c.json({ error: error.message || 'Chat failed' }, 500);
  }
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
    },
  });
});
