import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  SQUARE_ACCESS_TOKEN?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

export const squareInvoicesApi = new Hono<{ Bindings: Bindings }>();

const SQUARE_API_BASE = 'https://connect.squareup.com/v2';
const SQUARE_VERSION = '2024-01-18';

// Helper for Square API calls
async function squareApi(env: Bindings, path: string, options: RequestInit = {}) {
  if (!env.SQUARE_ACCESS_TOKEN) {
    throw new Error('Square not configured');
  }
  
  const response = await fetch(`${SQUARE_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.detail || 'Square API error');
  }
  return data;
}

// Get primary location
async function getLocationId(env: Bindings): Promise<string> {
  const data = await squareApi(env, '/locations');
  const location = data.locations?.[0];
  if (!location?.id) throw new Error('No Square location found');
  return location.id;
}

// Find or create Square customer
async function findOrCreateCustomer(env: Bindings, email: string, name: string): Promise<string> {
  // Search for existing customer
  const searchData = await squareApi(env, '/customers/search', {
    method: 'POST',
    body: JSON.stringify({
      query: {
        filter: {
          email_address: { exact: email }
        }
      }
    })
  });
  
  if (searchData.customers?.[0]?.id) {
    return searchData.customers[0].id;
  }
  
  // Create new customer
  const createData = await squareApi(env, '/customers', {
    method: 'POST',
    body: JSON.stringify({
      email_address: email,
      given_name: name.split(' ')[0],
      family_name: name.split(' ').slice(1).join(' ') || undefined,
      idempotency_key: `customer-${email}-${Date.now()}`
    })
  });
  
  if (!createData.customer?.id) {
    throw new Error('Failed to create Square customer');
  }
  
  return createData.customer.id;
}

// Create Square invoice from our invoice
squareInvoicesApi.post('/create/:invoice_id', async (c) => {
  const invoiceId = c.req.param('invoice_id');
  
  try {
    const locationId = await getLocationId(c.env);
    
    // Get invoice details from D1
    const invoice = await c.env.DB.prepare(`
      SELECT i.*, c.name, c.email, c.phone, c.address
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).bind(invoiceId).first<any>();
    
    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }
    
    // Find or create Square customer
    const customerId = await findOrCreateCustomer(c.env, invoice.email, invoice.name);
    
    // Create order first (required for invoice)
    const orderData = await squareApi(c.env, '/orders', {
      method: 'POST',
      body: JSON.stringify({
        order: {
          location_id: locationId,
          line_items: [
            {
              name: `The Handy Beaver - Invoice #${invoiceId}`,
              quantity: '1',
              base_price_money: {
                amount: Math.round(invoice.total * 100),
                currency: 'USD',
              },
            },
          ],
        },
        idempotency_key: `invoice-${invoiceId}-order-${Date.now()}`,
      }),
    });
    
    const orderId = orderData.order?.id;
    if (!orderId) throw new Error('Failed to create order');
    
    // Calculate due date (14 days from now)
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    // Create invoice
    const invoiceData = await squareApi(c.env, '/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoice: {
          order_id: orderId,
          location_id: locationId,
          primary_recipient: {
            customer_id: customerId,
          },
          payment_requests: [
            {
              request_type: 'BALANCE',
              due_date: dueDateStr,
              automatic_payment_source: 'NONE',
            },
          ],
          delivery_method: 'EMAIL',
          title: `Invoice #${invoiceId}`,
          description: `The Handy Beaver - Professional Craftsman Services\n\nCustomer: ${invoice.name}\nPhone: ${invoice.phone || 'N/A'}`,
          accepted_payment_methods: {
            card: true,
            square_gift_card: false,
            bank_account: false,
          },
        },
        idempotency_key: `invoice-${invoiceId}-${Date.now()}`,
      }),
    });
    
    const squareInvoice = invoiceData.invoice;
    if (!squareInvoice?.id) throw new Error('Failed to create invoice');
    
    // Update our invoice with Square ID
    await c.env.DB.prepare(`
      UPDATE invoices SET square_invoice_id = ?, status = 'pending', updated_at = ?
      WHERE id = ?
    `).bind(squareInvoice.id, new Date().toISOString(), invoiceId).run();
    
    // Publish the invoice (sends email)
    const publishData = await squareApi(c.env, `/invoices/${squareInvoice.id}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        version: squareInvoice.version || 0,
        idempotency_key: `publish-${invoiceId}-${Date.now()}`,
      }),
    });
    
    return c.json({
      success: true,
      square_invoice_id: squareInvoice.id,
      public_url: publishData.invoice?.public_url,
      status: 'sent',
    });
    
  } catch (error: any) {
    console.error('Square invoice error:', error);
    return c.json({ error: error.message || 'Failed to create invoice' }, 500);
  }
});

// Get invoice status from Square
squareInvoicesApi.get('/status/:square_invoice_id', async (c) => {
  const squareInvoiceId = c.req.param('square_invoice_id');
  
  try {
    const data = await squareApi(c.env, `/invoices/${squareInvoiceId}`);
    const invoice = data.invoice;
    
    return c.json({
      id: invoice?.id,
      status: invoice?.status,
      public_url: invoice?.public_url,
      payment_requests: invoice?.payment_requests,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// List invoices from Square
squareInvoicesApi.get('/list', async (c) => {
  try {
    const locationId = await getLocationId(c.env);
    const data = await squareApi(c.env, `/invoices?location_id=${locationId}&limit=50`);
    
    return c.json({
      invoices: data.invoices?.map((inv: any) => ({
        id: inv.id,
        status: inv.status,
        title: inv.title,
        public_url: inv.public_url,
        created_at: inv.created_at,
      })) || [],
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Sync payment status from Square to our DB
squareInvoicesApi.post('/sync/:invoice_id', async (c) => {
  const invoiceId = c.req.param('invoice_id');
  
  try {
    // Get our invoice
    const invoice = await c.env.DB.prepare(
      'SELECT square_invoice_id FROM invoices WHERE id = ?'
    ).bind(invoiceId).first<{ square_invoice_id: string }>();
    
    if (!invoice?.square_invoice_id) {
      return c.json({ error: 'No Square invoice linked' }, 404);
    }
    
    // Get Square invoice status
    const data = await squareApi(c.env, `/invoices/${invoice.square_invoice_id}`);
    const squareInvoice = data.invoice;
    
    // Map Square status to our status
    let status = 'pending';
    if (squareInvoice.status === 'PAID') status = 'paid';
    else if (squareInvoice.status === 'CANCELED') status = 'cancelled';
    else if (squareInvoice.status === 'UNPAID' && squareInvoice.payment_requests?.[0]?.computed_amount_money?.amount === 0) {
      status = 'paid';
    }
    
    // Update our invoice
    await c.env.DB.prepare(
      'UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?'
    ).bind(status, new Date().toISOString(), invoiceId).run();
    
    return c.json({
      success: true,
      square_status: squareInvoice.status,
      our_status: status,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
