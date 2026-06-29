/**
 * Lil Beaver API — Internal endpoints for Lil Beaver's monitoring cron
 * Protected by ADMIN_API_KEY (same as admin-api)
 *
 * Endpoints:
 *   GET  /check       — New leads since timestamp (legacy, works)
 *   GET  /check-leads — New leads aggregated across all sources
 *   POST /send-email  — Send email via Resend
 *   POST /send-sms    — Send SMS via WhatsApp
 */
import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  ADMIN_API_KEY?: string;
  RESEND_API_KEY?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
};

export const lilbeaverApi = new Hono<{ Bindings: Bindings }>();

// Auth middleware
lilbeaverApi.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ') || !c.env.ADMIN_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (authHeader.slice(7) !== c.env.ADMIN_API_KEY) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  await next();
});

/**
 * GET /check — Legacy lead check (original working version)
 */
lilbeaverApi.get('/check', async (c) => {
  const since = parseInt(c.req.query('since') || '0', 10);
  const sinceTs = since > 0 ? since : Math.floor(Date.now() / 1000) - 86400;
  const sinceISO = new Date(sinceTs * 1000).toISOString();

  const [newLeads, newQuoteRequests, pendingBookings, unreadMessages, recentCustomers] = await Promise.all([
    c.env.DB.prepare(`SELECT id, customer_id, source, content, notes, created_at FROM leads WHERE created_at > datetime(?) ORDER BY created_at DESC LIMIT 20`).bind(sinceISO).all<any>(),
    c.env.DB.prepare(`SELECT qr.*, c.name as customer_name, c.email, c.phone FROM quote_requests qr LEFT JOIN customers c ON c.email = qr.email WHERE qr.created_at > datetime(?) ORDER BY qr.created_at DESC LIMIT 20`).bind(sinceISO).all<any>(),
    c.env.DB.prepare(`SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone FROM bookings b JOIN customers c ON b.customer_id = c.id WHERE b.status = 'pending' AND b.created_at > datetime(?) ORDER BY b.created_at DESC LIMIT 20`).bind(sinceISO).all<any>(),
    c.env.DB.prepare(`SELECT m.*, c.name as customer_name, c.email as customer_email FROM messages m JOIN customers c ON m.customer_id = c.id WHERE m.sender = 'customer' AND m.read_at IS NULL ORDER BY m.created_at DESC LIMIT 20`).all<any>(),
    c.env.DB.prepare(`SELECT id, name, email, phone, address, status, notes, created_at FROM customers WHERE status = 'lead' AND created_at > datetime(?) ORDER BY created_at DESC LIMIT 20`).bind(sinceISO).all<any>(),
  ]);

  return c.json({
    checked_at: new Date().toISOString(),
    since: sinceISO,
    summary: {
      total_new: (newLeads.results?.length || 0) + (newQuoteRequests.results?.length || 0) + (pendingBookings.results?.length || 0) + (unreadMessages.results?.length || 0) + (recentCustomers.results?.length || 0),
    },
    leads: newLeads.results || [],
    quote_requests: newQuoteRequests.results || [],
    pending_bookings: pendingBookings.results || [],
    unread_messages: unreadMessages.results || [],
    recent_leads: recentCustomers.results || [],
  });
});

/**
 * GET /check-leads — Enhanced lead check with cleaner response
 */
lilbeaverApi.get('/check-leads', async (c) => {
  const since = parseInt(c.req.query('since') || '0', 10);
  const sinceTs = since > 0 ? since : Math.floor(Date.now() / 1000) - 86400;
  const sinceIso = new Date(sinceTs * 1000).toISOString();

  const [newCustomerLeads, newLeadsTable, newQuoteRequests, newMessages] = await Promise.all([
    c.env.DB.prepare(`SELECT id, name, email, phone, address, status, promo_code, notes, created_at FROM customers WHERE created_at >= ? AND status = 'lead' ORDER BY created_at DESC LIMIT 50`).bind(sinceTs).all<any>(),
    c.env.DB.prepare(`SELECT id, source, source_url, source_group_name, source_user_name, content, keywords_matched, converted_to_customer, customer_id, notes, created_at FROM leads WHERE created_at >= ? ORDER BY created_at DESC LIMIT 50`).bind(sinceTs).all<any>(),
    c.env.DB.prepare(`SELECT id, customer_name, email, phone, project_details, service_type, project_size, timeline, estimated_cost, status, created_at FROM quote_requests WHERE created_at >= ? ORDER BY created_at DESC LIMIT 50`).bind(sinceIso).all<any>(),
    c.env.DB.prepare(`SELECT m.id, m.customer_id, m.content, m.source, m.created_at, c.name as customer_name, c.email as customer_email FROM messages m LEFT JOIN customers c ON c.id = m.customer_id WHERE m.created_at >= ? AND m.sender = 'customer' ORDER BY m.created_at DESC LIMIT 50`).bind(sinceTs).all<any>(),
  ]);

  return c.json({
    checked_at: Math.floor(Date.now() / 1000),
    since: sinceTs,
    summary: {
      total: (newCustomerLeads.results?.length || 0) + (newLeadsTable.results?.length || 0) + (newQuoteRequests.results?.length || 0) + (newMessages.results?.length || 0),
      new_customer_leads: newCustomerLeads.results?.length || 0,
      new_leads_table: newLeadsTable.results?.length || 0,
      new_quote_requests: newQuoteRequests.results?.length || 0,
      new_messages: newMessages.results?.length || 0,
    },
    leads: {
      customers: newCustomerLeads.results || [],
      leads_table: newLeadsTable.results || [],
      quote_requests: newQuoteRequests.results || [],
      messages: newMessages.results || [],
    },
  });
});

/**
 * POST /send-email — Send email via Resend
 */
lilbeaverApi.post('/send-email', async (c) => {
  const body = await c.req.json<{ to: string; subject: string; html: string; from?: string }>();
  if (!body.to || !body.subject || !body.html) {
    return c.json({ error: 'Missing required fields: to, subject, html' }, 400);
  }
  if (!c.env.RESEND_API_KEY) {
    return c.json({ error: 'Resend API key not configured. Set RESEND_API_KEY secret.' }, 500);
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: body.from || 'Handy Beaver <notifications@handybeaver.co>',
        to: [body.to],
        subject: body.subject,
        html: body.html,
      }),
    });
    const result = await response.json();
    if (!response.ok) return c.json({ error: `Email failed: ${result.message || JSON.stringify(result)}` }, 500);
    return c.json({ success: true, id: result.id });
  } catch (error) {
    return c.json({ error: 'Failed to send email' }, 500);
  }
});

/**
 * POST /send-sms — Send SMS via WhatsApp Business API
 */
lilbeaverApi.post('/send-sms', async (c) => {
  const body = await c.req.json<{ phone: string; message: string }>();
  if (!body.phone || !body.message) {
    return c.json({ error: 'Missing required fields: phone, message' }, 400);
  }
  if (!c.env.WHATSAPP_ACCESS_TOKEN) {
    return c.json({ error: 'WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN secret.' }, 500);
  }
  try {
    const phoneNumberId = '1016449968218067';
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${c.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: body.phone.replace(/\D/g, ''), type: 'text', text: { body: body.message } }),
    });
    const result = await response.json();
    if (response.ok) return c.json({ success: true, messageId: result.messages?.[0]?.id });
    return c.json({ error: `SMS failed: ${result.error?.message || JSON.stringify(result)}` }, 400);
  } catch (error) {
    return c.json({ error: 'Failed to send SMS' }, 500);
  }
});