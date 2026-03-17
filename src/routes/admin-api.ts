import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { detectSchedulingConflicts } from './calendar-api';

type Bindings = {
  DB: D1Database;
  ADMIN_API_KEY?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_ACCESS_TOKEN?: string;
  GOOGLE_CALENDAR_ID?: string;
};

export const adminApi = new Hono<{ Bindings: Bindings }>();

// Admin auth middleware
adminApi.use('*', async (c, next) => {
  const apiKey = c.req.header('Authorization')?.replace('Bearer ', '');
  const adminCookie = getCookie(c, 'hb_admin');
  
  if (!apiKey && !adminCookie) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Verify API key or admin session
  if (apiKey && c.env.ADMIN_API_KEY && apiKey !== c.env.ADMIN_API_KEY) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  if (adminCookie) {
    const [githubId] = adminCookie.split(':');
    const admin = await c.env.DB.prepare(
      'SELECT * FROM admins WHERE github_id = ?'
    ).bind(githubId).first();
    
    if (!admin) {
      return c.json({ error: 'Invalid session' }, 401);
    }
    
    c.set('admin', admin);
  }
  
  await next();
});

// ============ CUSTOMERS ============

adminApi.get('/customers', async (c) => {
  const customers = await c.env.DB.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as job_count,
      (SELECT SUM(amount) FROM payments WHERE customer_id = c.id AND status = 'completed') as total_paid
    FROM customers c
    ORDER BY c.created_at DESC
    LIMIT 100
  `).all();
  
  return c.json(customers);
});

adminApi.get('/customers/search', async (c) => {
  const query = c.req.query('q') || '';
  
  const customers = await c.env.DB.prepare(`
    SELECT * FROM customers 
    WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `).bind(`%${query}%`, `%${query}%`, `%${query}%`).all();
  
  return c.json(customers);
});

// Create customer manually
adminApi.post('/customers', async (c) => {
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  if (!data.name || !data.email) {
    return c.json({ error: 'Name and email required' }, 400);
  }
  
  // Check if customer exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM customers WHERE email = ?'
  ).bind(data.email).first();
  
  if (existing) {
    return c.json({ error: 'Customer with this email already exists', id: existing.id }, 409);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO customers (name, email, phone, address, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.name,
    data.email,
    data.phone || null,
    data.address || null,
    data.status || 'lead',
    data.notes || null,
    now,
    now
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Update customer
adminApi.patch('/customers/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const fields = ['name', 'email', 'phone', 'address', 'status', 'notes'];
  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }
  
  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  await c.env.DB.prepare(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();
  
  return c.json({ success: true });
});

adminApi.get('/customers/:id', async (c) => {
  const id = c.req.param('id');
  
  const [customer, bookings, messages, payments] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first(),
    c.env.DB.prepare('SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC').bind(id).all(),
    c.env.DB.prepare('SELECT * FROM messages WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50').bind(id).all(),
    c.env.DB.prepare('SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC').bind(id).all(),
  ]);
  
  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  return c.json({
    ...customer,
    bookings: bookings.results,
    messages: messages.results,
    payments: payments.results,
  });
});

// ============ QUOTES ============

// List all quotes
adminApi.get('/quotes', async (c) => {
  const quotes = await c.env.DB.prepare(`
    SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM quotes q
    JOIN customers c ON q.customer_id = c.id
    ORDER BY q.created_at DESC
    LIMIT 100
  `).all();
  
  return c.json(quotes);
});

// Get single quote
adminApi.get('/quotes/:id', async (c) => {
  const quoteId = c.req.param('id');
  
  const quote = await c.env.DB.prepare(`
    SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM quotes q
    JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ?
  `).bind(quoteId).first();
  
  if (!quote) {
    return c.json({ error: 'Quote not found' }, 404);
  }
  
  return c.json(quote);
});

adminApi.post('/quotes', async (c) => {
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  // Calculate totals
  const laborTotal = data.labor_rate * (data.estimated_hours || 1);
  const helperTotal = data.helper_needed ? (data.helper_rate || 0) : 0;
  const materialsTotal = data.materials_estimate || 0;
  const equipmentTotal = data.equipment_estimate || 0;
  
  const subtotal = laborTotal + helperTotal + materialsTotal + equipmentTotal;
  const discountAmount = subtotal * ((data.discount_percent || 0) / 100);
  const total = subtotal - discountAmount;
  
  const validUntil = now + ((data.valid_days || 14) * 24 * 60 * 60);
  
  const result = await c.env.DB.prepare(`
    INSERT INTO quotes (
      customer_id, booking_id, labor_type, labor_rate, estimated_hours,
      helper_needed, helper_type, helper_rate, materials_estimate, equipment_estimate,
      discount_percent, discount_reason, subtotal, total, status, valid_until, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)
  `).bind(
    data.customer_id,
    data.booking_id || null,
    data.labor_type,
    data.labor_rate,
    data.estimated_hours || null,
    data.helper_needed ? 1 : 0,
    data.helper_type || null,
    data.helper_rate || null,
    materialsTotal,
    equipmentTotal,
    data.discount_percent || 0,
    data.discount_reason || null,
    subtotal,
    total,
    validUntil,
    data.notes || null,
    now,
    now
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id, total });
});

// Update quote
adminApi.put('/quotes/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  const result = await c.env.DB.prepare(`
    UPDATE quotes SET
      customer_id = ?,
      status = ?,
      labor_type = ?,
      labor_rate = ?,
      estimated_hours = ?,
      helper_needed = ?,
      helper_type = ?,
      helper_rate = ?,
      materials_estimate = ?,
      equipment_estimate = ?,
      discount_percent = ?,
      discount_reason = ?,
      subtotal = ?,
      total = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    data.customer_id,
    data.status,
    data.labor_type,
    data.labor_rate,
    data.estimated_hours,
    data.helper_needed ? 1 : 0,
    data.helper_type,
    data.helper_rate,
    data.materials_estimate,
    data.equipment_estimate,
    data.discount_percent,
    data.discount_reason,
    data.subtotal,
    data.total,
    data.notes,
    now,
    id
  ).run();
  
  return c.json({ success: true, id });
});

// Quote preview HTML (for viewing and printing)
adminApi.get('/quotes/:id/preview', async (c) => {
  const id = c.req.param('id');
  
  const quote = await c.env.DB.prepare(`
    SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address
    FROM quotes q
    JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ?
  `).bind(id).first<any>();
  
  if (!quote) {
    return c.text('Quote not found', 404);
  }
  
  const validDate = quote.valid_until ? new Date(quote.valid_until * 1000).toLocaleDateString() : 'N/A';
  const createdDate = quote.created_at ? new Date(quote.created_at * 1000).toLocaleDateString() : 'N/A';
  
  const laborTotal = (quote.labor_rate || 0) * (quote.estimated_hours || 1);
  const helperTotal = quote.helper_needed ? (quote.helper_rate || 0) : 0;
  
  const html = `
    <div class="quote-document" style="padding: 2rem; font-family: Georgia, serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #8B4513; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
        <div>
          <h1 style="color: #8B4513; margin: 0; font-size: 2rem;">🦫 The Handy Beaver</h1>
          <p style="margin: 0.5rem 0 0; color: #666;">Traveling Craftsman & Maintenance Services</p>
          <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">SE Oklahoma | contact@handybeaver.co</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #8B4513;">QUOTE</h2>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">Date: ${createdDate}</p>
          <p style="margin: 0.25rem 0; font-size: 0.9rem;">Valid Until: ${validDate}</p>
          <span style="display: inline-block; padding: 4px 12px; background: ${quote.status === 'accepted' ? '#d1fae5' : quote.status === 'sent' ? '#dbeafe' : '#f3f4f6'}; border-radius: 12px; font-size: 0.8rem; text-transform: uppercase;">${quote.status}</span>
        </div>
      </div>
      
      <!-- Customer Info -->
      <div style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem; color: #333;">Prepared For:</h3>
        <p style="margin: 0; font-weight: 600;">${quote.customer_name}</p>
        <p style="margin: 0.25rem 0; color: #666;">${quote.customer_email}</p>
        ${quote.customer_phone ? `<p style="margin: 0.25rem 0; color: #666;">${quote.customer_phone}</p>` : ''}
        ${quote.address ? `<p style="margin: 0.25rem 0; color: #666;">${quote.address}</p>` : ''}
      </div>
      
      <!-- Line Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
        <thead>
          <tr style="background: #8B4513; color: white;">
            <th style="padding: 0.75rem; text-align: left;">Description</th>
            <th style="padding: 0.75rem; text-align: right;">Qty</th>
            <th style="padding: 0.75rem; text-align: right;">Rate</th>
            <th style="padding: 0.75rem; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Labor (${quote.labor_type || 'Standard'})</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">${quote.estimated_hours || 1}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${(quote.labor_rate || 0).toFixed(2)}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${laborTotal.toFixed(2)}</td>
          </tr>
          ${quote.helper_needed ? `
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Helper (${quote.helper_type || 'Standard'})</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">1</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${(quote.helper_rate || 0).toFixed(2)}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${(quote.helper_rate || 0).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${quote.materials_estimate ? `
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Materials (estimate)</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">-</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">-</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${quote.materials_estimate.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${quote.equipment_estimate ? `
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Equipment Rental</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">-</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">-</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${quote.equipment_estimate.toFixed(2)}</td>
          </tr>
          ` : ''}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 0.75rem; text-align: right; font-weight: 600;">Subtotal:</td>
            <td style="padding: 0.75rem; text-align: right;">$${quote.subtotal?.toFixed(2) || '0.00'}</td>
          </tr>
          ${quote.discount_percent ? `
          <tr>
            <td colspan="3" style="padding: 0.75rem; text-align: right; color: #059669;">Discount (${quote.discount_percent}%${quote.discount_reason ? ' - ' + quote.discount_reason : ''}):</td>
            <td style="padding: 0.75rem; text-align: right; color: #059669;">-$${((quote.subtotal || 0) * quote.discount_percent / 100).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="background: #f9f9f9;">
            <td colspan="3" style="padding: 1rem; text-align: right; font-weight: 700; font-size: 1.1rem;">TOTAL:</td>
            <td style="padding: 1rem; text-align: right; font-weight: 700; font-size: 1.25rem; color: #8B4513;">$${quote.total?.toFixed(2) || '0.00'}</td>
          </tr>
        </tfoot>
      </table>
      
      ${quote.notes ? `
      <div style="background: #fff8dc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h4 style="margin: 0 0 0.5rem; color: #8B4513;">Notes:</h4>
        <p style="margin: 0; white-space: pre-wrap;">${quote.notes}</p>
      </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="border-top: 1px solid #eee; padding-top: 1rem; font-size: 0.85rem; color: #666;">
        <p><strong>Terms:</strong> Quote valid for 14 days. 50% deposit required to schedule. Materials purchased separately by customer. Payment due upon completion.</p>
        <p style="margin-top: 1rem; text-align: center;">
          <strong>Accept this quote:</strong> Reply to this email or call/text to confirm.
        </p>
      </div>
    </div>
  `;
  
  return c.html(html);
});

// Quote PDF (uses browser print)
adminApi.get('/quotes/:id/pdf', async (c) => {
  const id = c.req.param('id');
  
  const quote = await c.env.DB.prepare(`
    SELECT q.*, c.name as customer_name, c.email as customer_email
    FROM quotes q
    JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ?
  `).bind(id).first<any>();
  
  if (!quote) {
    return c.text('Quote not found', 404);
  }
  
  // Return printable HTML page
  const previewRes = await fetch(c.req.url.replace('/pdf', '/preview'));
  const previewHtml = await previewRes.text();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quote - ${quote.customer_name}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 1in; }
        }
      </style>
    </head>
    <body onload="window.print()">
      ${previewHtml}
    </body>
    </html>
  `;
  
  return c.html(html);
});

adminApi.post('/quotes/:id/send', async (c) => {
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);
  
  // Update quote status
  await c.env.DB.prepare(`
    UPDATE quotes SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?
  `).bind(now, now, id).run();
  
  // Get quote with customer
  const quote = await c.env.DB.prepare(`
    SELECT q.*, c.email, c.name FROM quotes q
    JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ?
  `).bind(id).first();
  
  // TODO: Send email via Cloudflare Email
  
  return c.json({ success: true, message: `Quote sent to ${quote?.email}` });
});

// ============ INVOICES ============

adminApi.get('/invoices', async (c) => {
  const status = c.req.query('status');
  
  let query = `
    SELECT i.*, c.name as customer_name, c.email as customer_email
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
  `;
  
  if (status === 'unpaid') {
    query += ` WHERE i.status IN ('sent', 'partial', 'overdue')`;
  }
  
  query += ` ORDER BY i.created_at DESC LIMIT 50`;
  
  const invoices = await c.env.DB.prepare(query).all();
  return c.json(invoices);
});

adminApi.post('/invoices', async (c) => {
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  // Support both legacy fixed fields and new line items format
  let subtotal = 0;
  const hasLineItems = Array.isArray(data.items) && data.items.length > 0;
  
  if (hasLineItems) {
    // Calculate subtotal from line items
    subtotal = data.items.reduce((sum: number, item: any) => 
      sum + ((item.quantity || 1) * (item.rate || 0)), 0);
  } else {
    // Legacy: fixed fields
    subtotal = (data.labor_amount || 0) + (data.helper_amount || 0) + 
               (data.materials_amount || 0) + (data.equipment_amount || 0) -
               (data.discount_amount || 0);
  }
  
  const taxAmount = subtotal * ((data.tax_rate || 0) / 100);
  const total = subtotal + taxAmount;
  
  const dueDate = now + ((data.due_days || 14) * 24 * 60 * 60);
  
  // Generate invoice number
  const count = await c.env.DB.prepare('SELECT COUNT(*) as count FROM invoices').first<{count: number}>();
  const invoiceNumber = `HB-${new Date().getFullYear()}-${String((count?.count || 0) + 1).padStart(4, '0')}`;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO invoices (
      customer_id, booking_id, quote_id, invoice_number,
      labor_amount, helper_amount, materials_amount, equipment_amount, discount_amount,
      subtotal, tax_rate, tax_amount, total, status, due_date, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)
  `).bind(
    data.customer_id,
    data.booking_id || null,
    data.quote_id || null,
    invoiceNumber,
    data.labor_amount || 0,
    data.helper_amount || 0,
    data.materials_amount || 0,
    data.equipment_amount || 0,
    data.discount_amount || 0,
    subtotal,
    data.tax_rate || 0,
    taxAmount,
    total,
    dueDate,
    data.notes || null,
    now,
    now
  ).run();
  
  const invoiceId = result.meta.last_row_id;
  
  // Insert line items if provided
  if (hasLineItems) {
    for (const item of data.items) {
      await c.env.DB.prepare(`
        INSERT INTO invoice_items (invoice_id, description, quantity, rate, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        invoiceId,
        item.description || '',
        item.quantity || 1,
        item.rate || 0,
        item.sort_order || 0,
        now
      ).run();
    }
  }
  
  return c.json({ success: true, id: invoiceId, invoice_number: invoiceNumber, total });
});

// Invoice preview HTML
adminApi.get('/invoices/:id/preview', async (c) => {
  const id = c.req.param('id');
  
  const invoice = await c.env.DB.prepare(`
    SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).bind(id).first<any>();
  
  if (!invoice) {
    return c.text('Invoice not found', 404);
  }
  
  // Get line items
  const lineItems = await c.env.DB.prepare(`
    SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC
  `).bind(id).all<any>();
  
  const hasLineItems = lineItems.results && lineItems.results.length > 0;
  
  const createdDate = invoice.created_at ? new Date(invoice.created_at * 1000).toLocaleDateString() : 'N/A';
  const dueDate = invoice.due_date ? new Date(invoice.due_date * 1000).toLocaleDateString() : 'N/A';
  const paymentLink = `https://handybeaver.co/pay/${id}`;
  
  // Build line items HTML
  let lineItemsHtml = '';
  if (hasLineItems) {
    lineItemsHtml = lineItems.results!.map((item: any) => `
      <tr>
        <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.rate).toFixed(2)}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.amount).toFixed(2)}</td>
      </tr>
    `).join('');
  } else {
    // Legacy: fixed fields
    if (invoice.labor_amount) lineItemsHtml += `<tr><td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Labor</td><td></td><td></td><td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${Number(invoice.labor_amount).toFixed(2)}</td></tr>`;
    if (invoice.helper_amount) lineItemsHtml += `<tr><td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Helper</td><td></td><td></td><td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${Number(invoice.helper_amount).toFixed(2)}</td></tr>`;
    if (invoice.materials_amount) lineItemsHtml += `<tr><td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Materials</td><td></td><td></td><td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${Number(invoice.materials_amount).toFixed(2)}</td></tr>`;
    if (invoice.equipment_amount) lineItemsHtml += `<tr><td style="padding: 0.75rem; border-bottom: 1px solid #eee;">Equipment Rental</td><td></td><td></td><td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right;">$${Number(invoice.equipment_amount).toFixed(2)}</td></tr>`;
    if (invoice.discount_amount) lineItemsHtml += `<tr><td style="padding: 0.75rem; border-bottom: 1px solid #eee; color: #059669;">Discount</td><td></td><td></td><td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align: right; color: #059669;">-$${Number(invoice.discount_amount).toFixed(2)}</td></tr>`;
  }
  
  const html = `
    <div class="invoice-document" style="padding: 2rem; font-family: Georgia, serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #8B4513; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
        <div>
          <h1 style="color: #8B4513; margin: 0; font-size: 2rem;">🦫 The Handy Beaver</h1>
          <p style="margin: 0.5rem 0 0; color: #666;">Traveling Craftsman & Maintenance Services</p>
          <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">SE Oklahoma | contact@handybeaver.co</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #8B4513;">INVOICE</h2>
          <p style="margin: 0.5rem 0 0; font-weight: 600; font-size: 1.1rem;">${invoice.invoice_number || 'DRAFT'}</p>
          <p style="margin: 0.5rem 0; font-size: 0.9rem;">Date: ${createdDate}</p>
          <p style="margin: 0; font-size: 0.9rem; ${invoice.status === 'overdue' ? 'color: #dc2626; font-weight: 600;' : ''}">Due: ${dueDate}</p>
          <span style="display: inline-block; margin-top: 0.5rem; padding: 4px 12px; background: ${invoice.status === 'paid' ? '#d1fae5' : invoice.status === 'overdue' ? '#fee2e2' : '#dbeafe'}; border-radius: 12px; font-size: 0.8rem; text-transform: uppercase;">${invoice.status}</span>
        </div>
      </div>
      
      <!-- Bill To -->
      <div style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem; color: #333;">Bill To:</h3>
        <p style="margin: 0; font-weight: 600;">${invoice.customer_name}</p>
        <p style="margin: 0.25rem 0; color: #666;">${invoice.customer_email}</p>
        ${invoice.customer_phone ? `<p style="margin: 0.25rem 0; color: #666;">${invoice.customer_phone}</p>` : ''}
        ${invoice.address ? `<p style="margin: 0.25rem 0; color: #666;">${invoice.address}</p>` : ''}
      </div>
      
      <!-- Line Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
        <thead>
          <tr style="background: #8B4513; color: white;">
            <th style="padding: 0.75rem; text-align: left;">Description</th>
            <th style="padding: 0.75rem; text-align: center; width: 60px;">Qty</th>
            <th style="padding: 0.75rem; text-align: right; width: 80px;">Rate</th>
            <th style="padding: 0.75rem; text-align: right; width: 100px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 0.75rem; text-align: right; font-weight: 600;">Subtotal:</td>
            <td style="padding: 0.75rem; text-align: right;">$${Number(invoice.subtotal || 0).toFixed(2)}</td>
          </tr>
          ${invoice.tax_amount ? `
          <tr>
            <td colspan="3" style="padding: 0.75rem; text-align: right;">Tax (${invoice.tax_rate}%):</td>
            <td style="padding: 0.75rem; text-align: right;">$${Number(invoice.tax_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="background: #f9f9f9;">
            <td colspan="3" style="padding: 1rem; text-align: right; font-weight: 700; font-size: 1.1rem;">TOTAL:</td>
            <td style="padding: 1rem; text-align: right; font-weight: 700; font-size: 1.25rem; color: #8B4513;">$${Number(invoice.total || 0).toFixed(2)}</td>
          </tr>
          ${invoice.amount_paid ? `
          <tr>
            <td colspan="3" style="padding: 0.75rem; text-align: right; color: #059669;">Amount Paid:</td>
            <td style="padding: 0.75rem; text-align: right; color: #059669;">-$${Number(invoice.amount_paid).toFixed(2)}</td>
          </tr>
          <tr style="background: #fef3c7;">
            <td colspan="3" style="padding: 0.75rem; text-align: right; font-weight: 700;">BALANCE DUE:</td>
            <td style="padding: 0.75rem; text-align: right; font-weight: 700; color: #dc2626;">$${(invoice.total - invoice.amount_paid).toFixed(2)}</td>
          </tr>
          ` : ''}
        </tfoot>
      </table>
      
      ${invoice.notes ? `
      <div style="background: #fff8dc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h4 style="margin: 0 0 0.5rem; color: #8B4513;">Notes:</h4>
        <p style="margin: 0; white-space: pre-wrap;">${invoice.notes}</p>
      </div>
      ` : ''}
      
      <!-- Payment Section -->
      ${invoice.status !== 'paid' ? `
      <div style="background: #e0f2fe; padding: 1.5rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem; color: #0369a1;">Pay Online</h3>
        <p style="margin: 0 0 1rem; color: #666;">Secure payment via credit/debit card</p>
        <a href="${paymentLink}" style="display: inline-block; background: #8B4513; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">Pay Now →</a>
        <p style="margin: 1rem 0 0; font-size: 0.85rem; color: #666;">${paymentLink}</p>
      </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="border-top: 1px solid #eee; padding-top: 1rem; font-size: 0.85rem; color: #666;">
        <p><strong>Payment Methods:</strong> Credit Card, Debit Card, Cash</p>
        <p><strong>Questions?</strong> Contact us at contact@handybeaver.co</p>
        <p style="margin-top: 1rem; text-align: center; font-style: italic;">Thank you for your business! 🦫</p>
      </div>
    </div>
  `;
  
  return c.html(html);
});

// Invoice PDF (printable)
adminApi.get('/invoices/:id/pdf', async (c) => {
  const id = c.req.param('id');
  
  const invoice = await c.env.DB.prepare(`
    SELECT i.*, c.name as customer_name FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).bind(id).first<any>();
  
  if (!invoice) {
    return c.text('Invoice not found', 404);
  }
  
  const previewRes = await fetch(c.req.url.replace('/pdf', '/preview'));
  const previewHtml = await previewRes.text();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number} - ${invoice.customer_name}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 0.75in; }
        }
      </style>
    </head>
    <body onload="window.print()">
      ${previewHtml}
    </body>
    </html>
  `;
  
  return c.html(html);
});

adminApi.post('/invoices/:id/send', async (c) => {
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);
  
  await c.env.DB.prepare(`
    UPDATE invoices SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?
  `).bind(now, now, id).run();
  
  const invoice = await c.env.DB.prepare(`
    SELECT i.*, c.email, c.name FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).bind(id).first();
  
  // TODO: Send email via Cloudflare Email
  
  return c.json({ success: true, message: `Invoice sent to ${invoice?.email}` });
});

// ============ BOOKINGS/JOBS ============

adminApi.get('/bookings', async (c) => {
  const status = c.req.query('status');
  
  let query = `
    SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
  `;
  
  if (status) {
    query += ` WHERE b.status = '${status}'`;
  }
  
  query += ` ORDER BY b.created_at DESC LIMIT 50`;
  
  const bookings = await c.env.DB.prepare(query).all();
  return c.json(bookings);
});

adminApi.get('/bookings/:id', async (c) => {
  const id = c.req.param('id');
  
  const booking = await c.env.DB.prepare(`
    SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `).bind(id).first();
  
  if (!booking) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  return c.json(booking);
});

adminApi.patch('/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);

  const existing = await c.env.DB.prepare(
    'SELECT * FROM bookings WHERE id = ?'
  ).bind(id).first<any>();

  if (!existing) {
    return c.json({ error: 'Job not found' }, 404);
  }

  const nextStatus = data.status || existing.status;
  const nextDate = data.scheduled_date || existing.scheduled_date;

  if (nextStatus === 'confirmed') {
    if (!nextDate) {
      return c.json({ error: 'scheduled_date is required before confirming a job' }, 400);
    }

    if (!data.force_conflict_override) {
      const conflicts = await detectSchedulingConflicts(c.env, Number(id), nextDate);
      if (conflicts.length > 0) {
        return c.json({
          error: 'Scheduling conflict detected',
          conflicts,
          allow_override: true,
        }, 409);
      }
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (data.status) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.scheduled_date) {
    updates.push('scheduled_date = ?');
    values.push(data.scheduled_date);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  return c.json({ success: true });
});

adminApi.post('/bookings/:id/notes', async (c) => {
  const bookingId = c.req.param('id');
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  const admin = c.get('admin');
  
  await c.env.DB.prepare(`
    INSERT INTO job_notes (booking_id, admin_id, content, note_type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(bookingId, admin?.id || null, data.content, data.note_type || 'general', now).run();
  
  return c.json({ success: true });
});

adminApi.get('/bookings/:id/notes', async (c) => {
  const bookingId = c.req.param('id');
  
  const notes = await c.env.DB.prepare(`
    SELECT jn.*, a.github_username as admin_name
    FROM job_notes jn
    LEFT JOIN admins a ON jn.admin_id = a.id
    WHERE jn.booking_id = ?
    ORDER BY jn.created_at DESC
  `).bind(bookingId).all();
  
  return c.json(notes);
});

// ============ SCHEDULE ============

adminApi.get('/schedule', async (c) => {
  const days = parseInt(c.req.query('days') || '7');
  const now = Math.floor(Date.now() / 1000);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  const bookings = await c.env.DB.prepare(`
    SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.status IN ('confirmed', 'in_progress')
    AND b.scheduled_date IS NOT NULL
    AND b.scheduled_date <= ?
    ORDER BY b.scheduled_date ASC
  `).bind(endDate.toISOString().split('T')[0]).all();
  
  return c.json(bookings);
});

// ============ MESSAGES ============

// Get all messages/conversations
adminApi.get('/messages', async (c) => {
  const source = c.req.query('source'); // 'customer', 'agent', 'webhook', 'whatsapp'
  const customerId = c.req.query('customer_id');
  const unreadOnly = c.req.query('unread') === 'true';
  
  let query = `
    SELECT m.*, c.name as customer_name, c.email as customer_email
    FROM messages m
    LEFT JOIN customers c ON m.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (source) {
    query += ` AND m.source = ?`;
    params.push(source);
  }
  if (customerId) {
    query += ` AND m.customer_id = ?`;
    params.push(customerId);
  }
  if (unreadOnly) {
    query += ` AND m.read_at IS NULL AND m.sender != 'business'`;
  }
  
  query += ` ORDER BY m.created_at DESC LIMIT 100`;
  
  const messages = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(messages);
});

// Get conversation threads (grouped by customer)
adminApi.get('/messages/threads', async (c) => {
  const threads = await c.env.DB.prepare(`
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      COUNT(m.id) as message_count,
      SUM(CASE WHEN m.read_at IS NULL AND m.sender != 'business' THEN 1 ELSE 0 END) as unread_count,
      MAX(m.created_at) as last_message_at,
      (SELECT content FROM messages WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM customers c
    JOIN messages m ON m.customer_id = c.id
    GROUP BY c.id
    ORDER BY last_message_at DESC
    LIMIT 50
  `).all();
  
  return c.json(threads);
});

// Mark messages as read
adminApi.patch('/messages/:id/read', async (c) => {
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);
  
  await c.env.DB.prepare(
    'UPDATE messages SET read_at = ? WHERE id = ?'
  ).bind(now, id).run();
  
  return c.json({ success: true });
});

// Mark all messages from customer as read
adminApi.patch('/messages/customer/:customerId/read-all', async (c) => {
  const customerId = c.req.param('customerId');
  const now = Math.floor(Date.now() / 1000);
  
  await c.env.DB.prepare(
    'UPDATE messages SET read_at = ? WHERE customer_id = ? AND read_at IS NULL'
  ).bind(now, customerId).run();
  
  return c.json({ success: true });
});

adminApi.post('/messages', async (c) => {
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  // Get customer info for email
  const customer = await c.env.DB.prepare(`
    SELECT id, name, email FROM customers WHERE id = ?
  `).bind(data.customer_id).first<{ id: number; name: string; email: string }>();
  
  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  await c.env.DB.prepare(`
    INSERT INTO messages (customer_id, booking_id, sender, content, created_at)
    VALUES (?, ?, 'business', ?, ?)
  `).bind(data.customer_id, data.booking_id || null, data.content, now).run();
  
  // Send email notification (default: false - must explicitly set send_email: true)
  // This ensures admin approval before external emails are sent
  const shouldSendEmail = data.send_email === true && customer.email;
  let emailSent = false;
  
  if (shouldSendEmail) {
    try {
      const { sendGmail } = await import('../utils/gmail');
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2d5a27; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🦫 The Handy Beaver</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <p>Hi ${customer.name.split(' ')[0]},</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #2d5a27; margin: 15px 0;">
              ${data.content.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 14px;">
              You can reply to this email or log into your <a href="https://handybeaver.co/portal">customer portal</a> to view all messages.
            </p>
          </div>
          <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
            The Handy Beaver | Southeast Oklahoma<br>
            <a href="https://handybeaver.co">handybeaver.co</a>
          </div>
        </div>
      `;
      
      const result = await sendGmail(
        c.env as any,
        customer.email,
        'New message from The Handy Beaver 🦫',
        emailHtml,
        'The Handy Beaver'
      );
      
      emailSent = result.success;
      if (!result.success) {
        console.error('Email send failed:', result.error);
      }
    } catch (e) {
      console.error('Failed to send email notification:', e);
    }
  }
  
  return c.json({ success: true, email_sent: emailSent });
});

// ============ SUMMARY ============

adminApi.get('/summary', async (c) => {
  const [
    pendingQuotes,
    unpaidInvoices,
    todaysJobs,
    unreadMessages,
    recentActivity
  ] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").first<{count: number}>(),
    c.env.DB.prepare("SELECT COUNT(*) as count, SUM(total - amount_paid) as total FROM invoices WHERE status IN ('sent', 'partial', 'overdue')").first<{count: number, total: number}>(),
    c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE status IN ('confirmed', 'in_progress') 
      AND scheduled_date = date('now')
    `).first<{count: number}>(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM messages WHERE sender = 'customer' AND read_at IS NULL").first<{count: number}>(),
    c.env.DB.prepare(`
      SELECT 'booking' as type, title as description, created_at 
      FROM bookings ORDER BY created_at DESC LIMIT 5
    `).all(),
  ]);
  
  return c.json({
    pending_quotes: pendingQuotes?.count || 0,
    unpaid_invoices: {
      count: unpaidInvoices?.count || 0,
      total: unpaidInvoices?.total || 0,
    },
    todays_jobs: todaysJobs?.count || 0,
    unread_messages: unreadMessages?.count || 0,
    recent_activity: recentActivity.results,
  });
});

// ============ BLOG POSTS ============

// List all blog posts
adminApi.get('/blog', async (c) => {
  const status = c.req.query('status'); // draft, published, all
  
  let query = 'SELECT * FROM blog_posts';
  const params: any[] = [];
  
  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const posts = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ posts: posts.results });
});

// Get single blog post
adminApi.get('/blog/:id', async (c) => {
  const id = c.req.param('id');
  const post = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
  
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  
  return c.json({ post });
});

// Create blog post
adminApi.post('/blog', async (c) => {
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  // Generate slug from title
  const slug = data.slug || data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const result = await c.env.DB.prepare(`
    INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, featured_image, meta_title, meta_description, status, author, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    data.title,
    slug,
    data.excerpt || null,
    data.content,
    data.category || 'General',
    data.tags ? JSON.stringify(data.tags) : null,
    data.featured_image || null,
    data.meta_title || data.title,
    data.meta_description || data.excerpt,
    data.status || 'draft',
    data.author || 'lil-beaver',
    now,
    now
  ).first<{ id: number }>();
  
  return c.json({ success: true, id: result?.id, slug });
});

// Update blog post
adminApi.patch('/blog/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  // Build dynamic update
  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [now];
  
  if (data.title) { updates.push('title = ?'); params.push(data.title); }
  if (data.slug) { updates.push('slug = ?'); params.push(data.slug); }
  if (data.excerpt !== undefined) { updates.push('excerpt = ?'); params.push(data.excerpt); }
  if (data.content) { updates.push('content = ?'); params.push(data.content); }
  if (data.category) { updates.push('category = ?'); params.push(data.category); }
  if (data.tags) { updates.push('tags = ?'); params.push(JSON.stringify(data.tags)); }
  if (data.featured_image !== undefined) { updates.push('featured_image = ?'); params.push(data.featured_image); }
  if (data.meta_title) { updates.push('meta_title = ?'); params.push(data.meta_title); }
  if (data.meta_description) { updates.push('meta_description = ?'); params.push(data.meta_description); }
  if (data.status) {
    updates.push('status = ?');
    params.push(data.status);
    // Set published_at when publishing
    if (data.status === 'published') {
      updates.push('published_at = ?');
      params.push(now);
    }
  }
  
  params.push(id);
  
  await c.env.DB.prepare(`UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  
  return c.json({ success: true });
});

// Delete blog post
adminApi.delete('/blog/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Generate AI blog post
adminApi.post('/blog/generate', async (c) => {
  const data = await c.req.json();
  const { topic, category, job_id, notes } = data;
  
  // Get job context if provided
  let jobContext = '';
  if (job_id) {
    const job = await c.env.DB.prepare(`
      SELECT b.*, c.name as customer_name 
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).bind(job_id).first<any>();
    
    if (job) {
      jobContext = `Project: ${job.title}\nCustomer: ${job.customer_name}\nDescription: ${job.description || ''}`;
    }
    
    const jobNotes = await c.env.DB.prepare(
      'SELECT content FROM job_notes WHERE booking_id = ? ORDER BY created_at ASC'
    ).bind(job_id).all<{ content: string }>();
    
    if (jobNotes.results?.length) {
      jobContext += '\n\nNotes:\n' + jobNotes.results.map(n => `- ${n.content}`).join('\n');
    }
  }
  
  // Use Workers AI to generate blog post
  if (c.env.AI) {
    try {
      const prompt = `You are a blog writer for The Handy Beaver, a professional handyman service in Southeast Oklahoma. Write a helpful, SEO-friendly blog post about: ${topic || category || 'home improvement'}

${jobContext ? `Context from a recent project:\n${jobContext}\n` : ''}
${notes ? `Additional notes:\n${notes}\n` : ''}

The blog should:
- Be 500-800 words
- Include practical tips for homeowners
- Mention Southeast Oklahoma / Broken Bow area naturally
- Have clear headings (use ## for H2)
- End with a call to action to contact The Handy Beaver
- Be friendly but professional in tone

Format the response as JSON with: title, excerpt (1-2 sentences), content (HTML with proper tags)`;

      const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      }) as { response?: string };
      
      // Try to parse JSON response
      try {
        const match = result.response?.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return c.json({
            success: true,
            draft: {
              title: parsed.title,
              excerpt: parsed.excerpt,
              content: parsed.content,
              category: category || 'Tips',
            }
          });
        }
      } catch {
        // If JSON parse fails, return raw content
        return c.json({
          success: true,
          draft: {
            title: topic || 'Home Improvement Tips',
            excerpt: '',
            content: result.response || '',
            category: category || 'General',
          }
        });
      }
    } catch (e) {
      console.error('AI generation failed:', e);
    }
  }
  
  // Fallback template
  return c.json({
    success: true,
    draft: {
      title: topic || 'Home Improvement Tips',
      excerpt: 'Helpful advice from your local handyman.',
      content: `<h2>${topic || 'Getting Started'}</h2>\n\n<p>${notes || 'Your content here...'}</p>\n\n<p><strong>Need help with your next project?</strong> Contact The Handy Beaver for a free quote!</p>`,
      category: category || 'General',
    }
  });
});

// ============ INVOICE LINE ITEMS ============

// Helper to recalculate invoice totals
async function recalculateInvoiceTotals(db: D1Database, invoiceId: number) {
  // Sum all line items
  const itemsSum = await db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as subtotal FROM invoice_items WHERE invoice_id = ?
  `).bind(invoiceId).first<{ subtotal: number }>();
  
  const subtotal = itemsSum?.subtotal || 0;
  
  // Get current tax rate and amount_paid
  const invoice = await db.prepare(`
    SELECT tax_rate, amount_paid FROM invoices WHERE id = ?
  `).bind(invoiceId).first<{ tax_rate: number; amount_paid: number }>();
  
  const taxRate = invoice?.tax_rate || 0;
  const amountPaid = invoice?.amount_paid || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const balanceDue = total - amountPaid;
  
  await db.prepare(`
    UPDATE invoices 
    SET subtotal = ?, tax_amount = ?, total = ?, balance_due = ?, updated_at = unixepoch()
    WHERE id = ?
  `).bind(subtotal, taxAmount, total, balanceDue, invoiceId).run();
  
  return { subtotal, taxAmount, total, balanceDue };
}

// List items for invoice
adminApi.get('/invoices/:id/items', async (c) => {
  const invoiceId = c.req.param('id');
  
  const items = await c.env.DB.prepare(`
    SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC
  `).bind(invoiceId).all();
  
  return c.json(items);
});

// Add item to invoice
adminApi.post('/invoices/:id/items', async (c) => {
  const invoiceId = c.req.param('id');
  const data = await c.req.json();
  
  if (!data.description || data.rate === undefined) {
    return c.json({ error: 'description and rate are required' }, 400);
  }
  
  // Get max sort_order
  const maxOrder = await c.env.DB.prepare(`
    SELECT COALESCE(MAX(sort_order), 0) as max_order FROM invoice_items WHERE invoice_id = ?
  `).bind(invoiceId).first<{ max_order: number }>();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO invoice_items (invoice_id, description, quantity, rate, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    invoiceId,
    data.description,
    data.quantity ?? 1,
    data.rate,
    data.sort_order ?? (maxOrder?.max_order || 0) + 1
  ).run();
  
  // Recalculate invoice totals
  const totals = await recalculateInvoiceTotals(c.env.DB, Number(invoiceId));
  
  return c.json({ 
    success: true, 
    id: result.meta.last_row_id,
    ...totals
  });
});

// Update item
adminApi.patch('/invoices/:id/items/:itemId', async (c) => {
  const invoiceId = c.req.param('id');
  const itemId = c.req.param('itemId');
  const data = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(data.quantity);
  }
  if (data.rate !== undefined) {
    updates.push('rate = ?');
    values.push(data.rate);
  }
  if (data.sort_order !== undefined) {
    updates.push('sort_order = ?');
    values.push(data.sort_order);
  }
  
  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  values.push(itemId, invoiceId);
  
  await c.env.DB.prepare(
    `UPDATE invoice_items SET ${updates.join(', ')} WHERE id = ? AND invoice_id = ?`
  ).bind(...values).run();
  
  // Recalculate invoice totals
  const totals = await recalculateInvoiceTotals(c.env.DB, Number(invoiceId));
  
  return c.json({ success: true, ...totals });
});

// Delete item
adminApi.delete('/invoices/:id/items/:itemId', async (c) => {
  const invoiceId = c.req.param('id');
  const itemId = c.req.param('itemId');
  
  await c.env.DB.prepare(
    'DELETE FROM invoice_items WHERE id = ? AND invoice_id = ?'
  ).bind(itemId, invoiceId).run();
  
  // Recalculate invoice totals
  const totals = await recalculateInvoiceTotals(c.env.DB, Number(invoiceId));
  
  return c.json({ success: true, ...totals });
});

// ============ INVOICE PAYMENTS ============

// Helper to update invoice payment status
async function updateInvoicePaymentStatus(db: D1Database, invoiceId: number) {
  // Sum all payments
  const paymentsSum = await db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_paid FROM invoice_payments WHERE invoice_id = ?
  `).bind(invoiceId).first<{ total_paid: number }>();
  
  const amountPaid = paymentsSum?.total_paid || 0;
  
  // Get invoice total
  const invoice = await db.prepare(`
    SELECT total, status FROM invoices WHERE id = ?
  `).bind(invoiceId).first<{ total: number; status: string }>();
  
  const total = invoice?.total || 0;
  const balanceDue = total - amountPaid;
  
  // Determine status
  let newStatus = invoice?.status || 'draft';
  if (balanceDue <= 0) {
    newStatus = 'paid';
  } else if (amountPaid > 0) {
    newStatus = 'partial';
  } else if (invoice?.status === 'paid' || invoice?.status === 'partial') {
    newStatus = 'sent'; // Revert if payments deleted
  }
  
  await db.prepare(`
    UPDATE invoices 
    SET amount_paid = ?, balance_due = ?, status = ?, updated_at = unixepoch()
    WHERE id = ?
  `).bind(amountPaid, balanceDue, newStatus, invoiceId).run();
  
  return { amountPaid, balanceDue, status: newStatus };
}

// List payments for invoice
adminApi.get('/invoices/:id/payments', async (c) => {
  const invoiceId = c.req.param('id');
  
  const payments = await c.env.DB.prepare(`
    SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC
  `).bind(invoiceId).all();
  
  return c.json(payments);
});

// Record payment
adminApi.post('/invoices/:id/payments', async (c) => {
  const invoiceId = c.req.param('id');
  const data = await c.req.json();
  
  if (!data.amount || !data.payment_date) {
    return c.json({ error: 'amount and payment_date are required' }, 400);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO invoice_payments (invoice_id, amount, payment_date, method, reference, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    invoiceId,
    data.amount,
    data.payment_date,
    data.method || null,
    data.reference || null,
    data.notes || null
  ).run();
  
  // Update invoice payment status
  const status = await updateInvoicePaymentStatus(c.env.DB, Number(invoiceId));
  
  return c.json({ 
    success: true, 
    id: result.meta.last_row_id,
    ...status
  });
});

// Delete payment
adminApi.delete('/invoices/:id/payments/:paymentId', async (c) => {
  const invoiceId = c.req.param('id');
  const paymentId = c.req.param('paymentId');
  
  await c.env.DB.prepare(
    'DELETE FROM invoice_payments WHERE id = ? AND invoice_id = ?'
  ).bind(paymentId, invoiceId).run();
  
  // Update invoice payment status
  const status = await updateInvoicePaymentStatus(c.env.DB, Number(invoiceId));
  
  return c.json({ success: true, ...status });
});

// Mark invoice as fully paid
adminApi.post('/invoices/:id/mark-paid', async (c) => {
  const invoiceId = c.req.param('id');
  const data = await c.req.json().catch(() => ({}));
  
  // Get invoice total and current amount paid
  const invoice = await c.env.DB.prepare(`
    SELECT total, amount_paid FROM invoices WHERE id = ?
  `).bind(invoiceId).first<{ total: number; amount_paid: number }>();
  
  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404);
  }
  
  const remaining = invoice.total - (invoice.amount_paid || 0);
  
  if (remaining > 0) {
    // Record payment for remaining balance
    const today = new Date().toISOString().split('T')[0];
    await c.env.DB.prepare(`
      INSERT INTO invoice_payments (invoice_id, amount, payment_date, method, notes)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      invoiceId,
      remaining,
      data.payment_date || today,
      data.method || 'cash',
      data.notes || 'Marked as paid'
    ).run();
  }
  
  // Update invoice status
  await c.env.DB.prepare(`
    UPDATE invoices 
    SET amount_paid = total, balance_due = 0, status = 'paid', updated_at = unixepoch()
    WHERE id = ?
  `).bind(invoiceId).run();
  
  return c.json({ 
    success: true, 
    amountPaid: invoice.total, 
    balanceDue: 0, 
    status: 'paid' 
  });
});

// ============ BUSINESS SETTINGS ============

// Get all settings as object
adminApi.get('/settings', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT key, value FROM business_settings
  `).all<{ key: string; value: string }>();
  
  const settings: Record<string, string> = {};
  for (const row of result.results) {
    settings[row.key] = row.value;
  }
  
  return c.json(settings);
});

// Update settings (key-value pairs)
adminApi.patch('/settings', async (c) => {
  const data = await c.req.json();
  
  const updates: Promise<any>[] = [];
  for (const [key, value] of Object.entries(data)) {
    updates.push(
      c.env.DB.prepare(`
        INSERT INTO business_settings (key, value, updated_at)
        VALUES (?, ?, unixepoch())
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(key, String(value)).run()
    );
  }
  
  await Promise.all(updates);
  
  return c.json({ success: true, updated: Object.keys(data) });
});

// Upload logo (save URL)
adminApi.post('/settings/logo', async (c) => {
  const data = await c.req.json();
  
  if (!data.url) {
    return c.json({ error: 'url is required' }, 400);
  }
  
  await c.env.DB.prepare(`
    INSERT INTO business_settings (key, value, updated_at)
    VALUES ('logo_url', ?, unixepoch())
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).bind(data.url).run();
  
  return c.json({ success: true, logo_url: data.url });
});

// ============ SQUARE INVOICES ============

import { createSquareInvoice, publishSquareInvoice, getSquareInvoiceStatus } from '../utils/square';

// Create Square invoice from our invoice
adminApi.post('/invoices/:id/square', async (c) => {
  const invoiceId = c.req.param('id');
  
  // Get invoice with customer info
  const invoice = await c.env.DB.prepare(`
    SELECT i.*, c.name as customer_name, c.email as customer_email
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).bind(invoiceId).first<any>();
  
  if (!invoice) {
    return c.json({ success: false, error: 'Invoice not found' }, 404);
  }
  
  // Build line items
  const lineItems = [];
  if (invoice.labor_amount) lineItems.push({ description: 'Labor', amount: invoice.labor_amount });
  if (invoice.helper_amount) lineItems.push({ description: 'Helper', amount: invoice.helper_amount });
  if (invoice.materials_amount) lineItems.push({ description: 'Materials', amount: invoice.materials_amount });
  if (invoice.equipment_amount) lineItems.push({ description: 'Equipment', amount: invoice.equipment_amount });
  
  // Create Square invoice
  const result = await createSquareInvoice(c.env, {
    id: invoice.id,
    customer_email: invoice.customer_email,
    customer_name: invoice.customer_name,
    total: invoice.total,
    due_date: invoice.due_date,
    description: invoice.notes,
    line_items: lineItems.length > 0 ? lineItems : undefined,
  });
  
  if (result.success && result.invoiceId) {
    // Store Square invoice ID
    await c.env.DB.prepare(`
      UPDATE invoices SET square_invoice_id = ?, updated_at = unixepoch() WHERE id = ?
    `).bind(result.invoiceId, invoiceId).run();
    
    return c.json({ success: true, squareInvoiceId: result.invoiceId });
  }
  
  return c.json({ success: false, error: result.error }, 400);
});

// Send Square invoice (publish)
adminApi.post('/invoices/:id/square/send', async (c) => {
  const invoiceId = c.req.param('id');
  
  const invoice = await c.env.DB.prepare(
    'SELECT square_invoice_id FROM invoices WHERE id = ?'
  ).bind(invoiceId).first<any>();
  
  if (!invoice?.square_invoice_id) {
    return c.json({ success: false, error: 'No Square invoice linked' }, 400);
  }
  
  const result = await publishSquareInvoice(c.env, invoice.square_invoice_id);
  
  if (result.success) {
    await c.env.DB.prepare(`
      UPDATE invoices SET status = 'sent', sent_at = unixepoch(), updated_at = unixepoch() WHERE id = ?
    `).bind(invoiceId).run();
    
    return c.json({ success: true });
  }
  
  return c.json({ success: false, error: result.error }, 400);
});

// Sync Square invoice status
adminApi.post('/invoices/:id/square/sync', async (c) => {
  const invoiceId = c.req.param('id');
  
  const invoice = await c.env.DB.prepare(
    'SELECT square_invoice_id, total FROM invoices WHERE id = ?'
  ).bind(invoiceId).first<any>();
  
  if (!invoice?.square_invoice_id) {
    return c.json({ success: false, error: 'No Square invoice linked' }, 400);
  }
  
  const result = await getSquareInvoiceStatus(c.env, invoice.square_invoice_id);
  
  if (result.error) {
    return c.json({ success: false, error: result.error }, 400);
  }
  
  // Update our invoice based on Square status
  let status = 'sent';
  if (result.status === 'PAID') status = 'paid';
  else if (result.status === 'PARTIALLY_PAID') status = 'partial';
  else if (result.status === 'CANCELED') status = 'cancelled';
  
  await c.env.DB.prepare(`
    UPDATE invoices 
    SET status = ?, amount_paid = ?, updated_at = unixepoch() 
    WHERE id = ?
  `).bind(status, result.amountPaid || 0, invoiceId).run();
  
  return c.json({ 
    success: true, 
    squareStatus: result.status,
    amountPaid: result.amountPaid,
  });
});
