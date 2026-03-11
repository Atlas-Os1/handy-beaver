import { Hono } from 'hono';
import { SquareClient, SquareEnvironment } from 'square';

type Bindings = {
  DB: D1Database;
  SQUARE_ACCESS_TOKEN?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

export const squareInvoicesApi = new Hono<{ Bindings: Bindings }>();

// Get Square client
function getSquareClient(env: Bindings) {
  if (!env.SQUARE_ACCESS_TOKEN) {
    throw new Error('Square not configured');
  }
  return new SquareClient({
    environment: SquareEnvironment.Production,
    token: env.SQUARE_ACCESS_TOKEN,
  });
}

// Get primary location
async function getLocationId(client: SquareClient): Promise<string> {
  const response = await client.locations.list();
  const location = response.result.locations?.[0];
  if (!location?.id) throw new Error('No Square location found');
  return location.id;
}

// Create Square invoice from our invoice
squareInvoicesApi.post('/create/:invoice_id', async (c) => {
  const invoiceId = c.req.param('invoice_id');
  
  try {
    const client = getSquareClient(c.env);
    const locationId = await getLocationId(client);
    
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
    
    // Create order first (required for invoice)
    const orderResponse = await client.orders.create({
      order: {
        locationId,
        lineItems: [
          {
            name: invoice.description || 'Handy Beaver Services',
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(Math.round(invoice.amount * 100)),
              currency: 'USD',
            },
          },
        ],
      },
      idempotencyKey: `invoice-${invoiceId}-order`,
    });
    
    const orderId = orderResponse.result.order?.id;
    if (!orderId) throw new Error('Failed to create order');
    
    // Create invoice
    const invoiceResponse = await client.invoices.create({
      invoice: {
        orderId,
        locationId,
        primaryRecipient: {
          customerId: undefined, // Will use email
          emailAddress: invoice.email,
        },
        paymentRequests: [
          {
            requestType: 'BALANCE',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
            automaticPaymentSource: 'NONE',
          },
        ],
        deliveryMethod: 'EMAIL',
        title: `Invoice #${invoiceId}`,
        description: invoice.description || 'The Handy Beaver - Professional Services',
        acceptedPaymentMethods: {
          card: true,
          squareGiftCard: false,
          bankAccount: false,
        },
      },
      idempotencyKey: `invoice-${invoiceId}`,
    });
    
    const squareInvoice = invoiceResponse.result.invoice;
    if (!squareInvoice?.id) throw new Error('Failed to create invoice');
    
    // Update our invoice with Square ID
    await c.env.DB.prepare(`
      UPDATE invoices SET square_invoice_id = ?, status = 'sent', updated_at = ?
      WHERE id = ?
    `).bind(squareInvoice.id, new Date().toISOString(), invoiceId).run();
    
    // Publish the invoice (sends email)
    await client.invoices.publish({
      invoiceId: squareInvoice.id,
      version: squareInvoice.version || 0,
      idempotencyKey: `publish-${invoiceId}`,
    });
    
    return c.json({
      success: true,
      square_invoice_id: squareInvoice.id,
      public_url: squareInvoice.publicUrl,
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
    const client = getSquareClient(c.env);
    const response = await client.invoices.get({ invoiceId: squareInvoiceId });
    const invoice = response.result.invoice;
    
    return c.json({
      id: invoice?.id,
      status: invoice?.status,
      publicUrl: invoice?.publicUrl,
      paymentRequests: invoice?.paymentRequests,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// List invoices from Square
squareInvoicesApi.get('/list', async (c) => {
  try {
    const client = getSquareClient(c.env);
    const locationId = await getLocationId(client);
    
    const response = await client.invoices.list({ locationId, limit: 50 });
    
    return c.json({
      invoices: response.result.invoices?.map(inv => ({
        id: inv.id,
        status: inv.status,
        title: inv.title,
        publicUrl: inv.publicUrl,
        createdAt: inv.createdAt,
      })) || [],
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
