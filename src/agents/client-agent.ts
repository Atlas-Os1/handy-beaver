/**
 * ClientAgent — Durable Object for public visitors and customer portal chat.
 * Uses WebSocket transport for persistent, streaming conversations.
 */
import { AIChatAgent } from "@cloudflare/ai-chat";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
import { PUBLIC_SYSTEM_PROMPT, CUSTOMER_SYSTEM_PROMPT } from "./prompts";

interface Env {
  DB: D1Database;
  AI: any;
  OPENCLAW_GATEWAY_URL?: string;
  OPENCLAW_GATEWAY_TOKEN?: string;
}

interface ClientState {
  mode: 'public' | 'customer';
  customerId?: number;
  customerName?: string;
}

export class ClientAgent extends AIChatAgent<Env> {
  maxPersistedMessages = 100;

  private getState(): ClientState {
    // State is set via the URL instance name pattern:
    // public-{sessionId} or customer-{customerId}
    const name = this.name || '';
    if (name.startsWith('customer-')) {
      const customerId = parseInt(name.replace('customer-', ''), 10);
      return { mode: 'customer', customerId: customerId || undefined };
    }
    return { mode: 'public' };
  }

  async onChatMessage(
    _onFinish: unknown,
    options?: { abortSignal?: AbortSignal; body?: Record<string, unknown> }
  ) {
    const state = this.getState();
    let systemPrompt = PUBLIC_SYSTEM_PROMPT;

    // Enrich with customer data if in customer mode
    if (state.mode === 'customer' && state.customerId) {
      let customerContext = '';
      try {
        const customer = await this.env.DB.prepare(`
          SELECT c.*,
            (SELECT COUNT(*) FROM quotes WHERE customer_id = c.id) as quote_count,
            (SELECT COUNT(*) FROM invoices WHERE customer_id = c.id AND status != 'paid') as unpaid_invoices,
            (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND status = 'in_progress') as active_jobs
          FROM customers c WHERE c.id = ?
        `).bind(state.customerId).first<any>();

        if (customer) {
          customerContext = `\nCUSTOMER CONTEXT:\nCustomer: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone || 'Not provided'}\nQuotes: ${customer.quote_count}\nUnpaid invoices: ${customer.unpaid_invoices}\nActive jobs: ${customer.active_jobs}`;

          // Get recent quotes
          const quotes = await this.env.DB.prepare(`
            SELECT id, total, status FROM quotes
            WHERE customer_id = ? ORDER BY created_at DESC LIMIT 3
          `).bind(state.customerId).all<any>();

          if (quotes.results?.length) {
            customerContext += '\n\nRecent quotes:\n' + quotes.results.map((q: any) =>
              `- Quote #${q.id}: $${q.total} (${q.status})`
            ).join('\n');
          }

          // Get unpaid invoices
          const invoices = await this.env.DB.prepare(`
            SELECT id, total, status FROM invoices
            WHERE customer_id = ? AND status != 'paid' ORDER BY created_at DESC LIMIT 3
          `).bind(state.customerId).all<any>();

          if (invoices.results?.length) {
            customerContext += '\n\nUnpaid invoices:\n' + invoices.results.map((inv: any) =>
              `- Invoice #${inv.id}: $${inv.total} (${inv.status})`
            ).join('\n');
          }
        }
      } catch (e) {
        console.error('Failed to fetch customer data:', e);
      }

      systemPrompt = CUSTOMER_SYSTEM_PROMPT + customerContext;
    }

    const workersai = createWorkersAI({ binding: this.env.AI });

    const result = streamText({
      model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
      system: systemPrompt,
      messages: await convertToModelMessages(this.messages),
      tools: {
        getServiceInfo: tool({
          description: "Get information about a specific service offered by The Handy Beaver",
          inputSchema: z.object({
            service: z.enum(['carpentry', 'flooring', 'deck', 'maintenance', 'tiny-homes', 'signs']),
          }),
          execute: async ({ service }: { service: string }) => {
            const services: Record<string, string> = {
              'carpentry': 'Custom shelving, trim/molding, door/window repairs, deck building, fence work. Service Call starts at $175.',
              'flooring': 'Hardwood, laminate, vinyl, tile, subfloor repair. $4-15/sq ft depending on material.',
              'deck': 'Staining/sealing, repairs, pergolas, arbors, fence staining. Decking from $15-25/sq ft.',
              'maintenance': 'Drywall repair, painting, caulking, light fixtures, furniture assembly. Service Call starts at $175.',
              'tiny-homes': 'Modern Minimal ($75/sq ft) or Rustic Cabin ($110/sq ft) finish packages.',
              'signs': 'Hand-routed cedar signs for cabins and vacation rentals. Custom designs available.',
            };
            return { info: services[service] || 'Contact us for details.' };
          },
        }),
        requestQuote: tool({
          description: "Submit a quote request for the customer",
          inputSchema: z.object({
            name: z.string().describe("Customer name"),
            serviceType: z.string().describe("Type of service needed"),
            description: z.string().describe("Brief project description"),
          }),
          execute: async ({ name, serviceType, description }: { name: string; serviceType: string; description: string }) => {
            try {
              await this.env.DB.prepare(`
                INSERT INTO bookings (customer_id, title, description, service_type, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'pending', unixepoch(), unixepoch())
              `).bind(
                state.customerId || null,
                `Quote Request - ${serviceType}`,
                description,
                serviceType
              ).run();
              return { success: true, message: `Quote request submitted for ${name}. The team will follow up within 24 hours.` };
            } catch (e) {
              return { success: false, message: 'Failed to submit quote request. Please try calling (580) 392-9061.' };
            }
          },
        }),
      },
      stopWhen: stepCountIs(3),
      abortSignal: options?.abortSignal,
    });

    return result.toUIMessageStreamResponse();
  }
}
