// Square Invoices API integration
import { SquareClient, SquareEnvironment } from "square";

type SquareEnv = {
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_APPLICATION_ID?: string;
};

// Initialize Square client
export function getSquareClient(env: SquareEnv): SquareClient | null {
  if (!env.SQUARE_ACCESS_TOKEN) {
    console.error('SQUARE_ACCESS_TOKEN not set');
    return null;
  }
  
  return new SquareClient({
    environment: SquareEnvironment.Production,
    token: env.SQUARE_ACCESS_TOKEN,
  });
}

// Create a Square invoice from our invoice data
export async function createSquareInvoice(
  env: SquareEnv,
  invoice: {
    id: number;
    customer_email: string;
    customer_name: string;
    total: number;
    due_date?: number;
    description?: string;
    line_items?: Array<{ description: string; amount: number }>;
  }
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  const client = getSquareClient(env);
  if (!client) {
    return { success: false, error: 'Square client not configured' };
  }

  try {
    // First, search for or create customer
    const customerResult = await findOrCreateCustomer(client, invoice.customer_email, invoice.customer_name);
    if (!customerResult.customerId) {
      return { success: false, error: 'Failed to create Square customer' };
    }

    // Get the primary location
    const locationsResponse = await client.locations.list();
    const locationId = locationsResponse.result?.locations?.[0]?.id;
    if (!locationId) {
      return { success: false, error: 'No Square location found' };
    }

    // Build line items
    const lineItems = invoice.line_items?.map(item => ({
      name: item.description,
      quantity: "1",
      basePriceMoney: {
        amount: BigInt(Math.round(item.amount * 100)), // Convert to cents
        currency: "USD" as const,
      },
    })) || [{
      name: invoice.description || `Invoice #${invoice.id}`,
      quantity: "1",
      basePriceMoney: {
        amount: BigInt(Math.round(invoice.total * 100)),
        currency: "USD" as const,
      },
    }];

    // Create the invoice
    const dueDate = invoice.due_date 
      ? new Date(invoice.due_date * 1000).toISOString().split('T')[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 14 days from now

    const response = await client.invoices.create({
      invoice: {
        locationId,
        orderId: undefined, // We'll create without an order
        primaryRecipient: {
          customerId: customerResult.customerId,
        },
        paymentRequests: [{
          requestType: "BALANCE",
          dueDate,
          automaticPaymentSource: "NONE",
        }],
        deliveryMethod: "EMAIL",
        invoiceNumber: `HB-${invoice.id}`,
        title: `The Handy Beaver - Invoice #${invoice.id}`,
        description: invoice.description || 'Thank you for your business!',
        customFields: [{
          label: "Internal ID",
          value: String(invoice.id),
          placement: "ABOVE_LINE_ITEMS",
        }],
      },
      idempotencyKey: `handy-beaver-invoice-${invoice.id}-${Date.now()}`,
    });

    if (response.result?.invoice?.id) {
      return { 
        success: true, 
        invoiceId: response.result.invoice.id,
      };
    }

    return { success: false, error: 'No invoice ID returned' };
  } catch (error: any) {
    console.error('Square invoice creation error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Publish (send) a Square invoice
export async function publishSquareInvoice(
  env: SquareEnv,
  invoiceId: string,
  version: number = 0
): Promise<{ success: boolean; error?: string }> {
  const client = getSquareClient(env);
  if (!client) {
    return { success: false, error: 'Square client not configured' };
  }

  try {
    await client.invoices.publish(invoiceId, {
      version,
      idempotencyKey: `publish-${invoiceId}-${Date.now()}`,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Square invoice publish error:', error);
    return { success: false, error: error.message };
  }
}

// Get invoice status from Square
export async function getSquareInvoiceStatus(
  env: SquareEnv,
  invoiceId: string
): Promise<{ status?: string; amountPaid?: number; error?: string }> {
  const client = getSquareClient(env);
  if (!client) {
    return { error: 'Square client not configured' };
  }

  try {
    const response = await client.invoices.get(invoiceId);
    const invoice = response.result?.invoice;
    
    if (!invoice) {
      return { error: 'Invoice not found' };
    }

    const amountPaid = invoice.paymentRequests?.[0]?.computedAmountMoney?.amount;
    
    return {
      status: invoice.status,
      amountPaid: amountPaid ? Number(amountPaid) / 100 : 0,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Find or create a customer in Square
async function findOrCreateCustomer(
  client: SquareClient,
  email: string,
  name: string
): Promise<{ customerId?: string }> {
  try {
    // Search for existing customer
    const searchResponse = await client.customers.search({
      query: {
        filter: {
          emailAddress: { exact: email },
        },
      },
    });

    if (searchResponse.result?.customers?.[0]?.id) {
      return { customerId: searchResponse.result.customers[0].id };
    }

    // Create new customer
    const nameParts = name.split(' ');
    const createResponse = await client.customers.create({
      emailAddress: email,
      givenName: nameParts[0],
      familyName: nameParts.slice(1).join(' ') || undefined,
      idempotencyKey: `customer-${email}-${Date.now()}`,
    });

    return { customerId: createResponse.result?.customer?.id };
  } catch (error) {
    console.error('Square customer error:', error);
    return {};
  }
}
