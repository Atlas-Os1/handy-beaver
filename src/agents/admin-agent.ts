/**
 * AdminAgent — Durable Object for admin dashboard chat.
 * Full admin tools access: query customers, get stats, manage quotes/jobs.
 */
import { AIChatAgent } from "@cloudflare/ai-chat";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
import { ADMIN_SYSTEM_PROMPT } from "./prompts";

interface Env {
  DB: D1Database;
  AI: any;
  OPENCLAW_GATEWAY_URL?: string;
  OPENCLAW_GATEWAY_TOKEN?: string;
}

export class AdminAgent extends AIChatAgent<Env> {
  maxPersistedMessages = 200;

  async onChatMessage(
    _onFinish: unknown,
    options?: { abortSignal?: AbortSignal; body?: Record<string, unknown> }
  ) {
    const workersai = createWorkersAI({ binding: this.env.AI });

    const result = streamText({
      model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
      system: ADMIN_SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      tools: {
        queryCustomers: tool({
          description: "Search customers by name or email, or list recent customers",
          inputSchema: z.object({
            search: z.string().optional().describe("Name or email to search for"),
            limit: z.number().optional().describe("Max results (default 10)"),
          }),
          execute: async ({ search, limit }: { search?: string; limit?: number }) => {
            const max = limit || 10;
            let results;
            if (search) {
              results = await this.env.DB.prepare(`
                SELECT id, name, email, phone, status, created_at
                FROM customers
                WHERE name LIKE ? OR email LIKE ?
                ORDER BY created_at DESC LIMIT ?
              `).bind(`%${search}%`, `%${search}%`, max).all<any>();
            } else {
              results = await this.env.DB.prepare(`
                SELECT id, name, email, phone, status, created_at
                FROM customers ORDER BY created_at DESC LIMIT ?
              `).bind(max).all<any>();
            }
            return { customers: results.results || [], count: results.results?.length || 0 };
          },
        }),

        getQuotes: tool({
          description: "Get quotes, optionally filtered by status or customer",
          inputSchema: z.object({
            status: z.enum(['pending', 'sent', 'accepted', 'declined', 'expired']).optional(),
            customerId: z.number().optional(),
            limit: z.number().optional(),
          }),
          execute: async ({ status, customerId, limit }: { status?: string; customerId?: number; limit?: number }) => {
            const max = limit || 10;
            let query = 'SELECT q.id, q.total, q.status, q.created_at, c.name as customer_name FROM quotes q LEFT JOIN customers c ON q.customer_id = c.id';
            const conditions: string[] = [];
            const binds: any[] = [];

            if (status) { conditions.push('q.status = ?'); binds.push(status); }
            if (customerId) { conditions.push('q.customer_id = ?'); binds.push(customerId); }

            if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
            query += ' ORDER BY q.created_at DESC LIMIT ?';
            binds.push(max);

            const results = await this.env.DB.prepare(query).bind(...binds).all<any>();
            return { quotes: results.results || [], count: results.results?.length || 0 };
          },
        }),

        getDashboardStats: tool({
          description: "Get business dashboard statistics: total customers, open quotes, active jobs, revenue",
          inputSchema: z.object({}),
          execute: async () => {
            const [customers, quotes, jobs, invoices] = await Promise.all([
              this.env.DB.prepare('SELECT COUNT(*) as count FROM customers').first<any>(),
              this.env.DB.prepare("SELECT COUNT(*) as count FROM quotes WHERE status IN ('pending', 'sent')").first<any>(),
              this.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'in_progress'").first<any>(),
              this.env.DB.prepare("SELECT SUM(total) as revenue FROM invoices WHERE status = 'paid'").first<any>(),
            ]);
            return {
              totalCustomers: customers?.count || 0,
              openQuotes: quotes?.count || 0,
              activeJobs: jobs?.count || 0,
              totalRevenue: invoices?.revenue || 0,
            };
          },
        }),

        getActiveJobs: tool({
          description: "Get currently active/in-progress jobs",
          inputSchema: z.object({
            limit: z.number().optional(),
          }),
          execute: async ({ limit }: { limit?: number }) => {
            const max = limit || 10;
            const results = await this.env.DB.prepare(`
              SELECT b.id, b.title, b.description, b.status, b.service_type, b.created_at,
                     c.name as customer_name, c.phone as customer_phone
              FROM bookings b
              LEFT JOIN customers c ON b.customer_id = c.id
              WHERE b.status IN ('in_progress', 'scheduled', 'pending')
              ORDER BY b.created_at DESC LIMIT ?
            `).bind(max).all<any>();
            return { jobs: results.results || [], count: results.results?.length || 0 };
          },
        }),

        getMessages: tool({
          description: "Get recent messages from customers",
          inputSchema: z.object({
            customerId: z.number().optional().describe("Filter by customer ID"),
            limit: z.number().optional(),
          }),
          execute: async ({ customerId, limit }: { customerId?: number; limit?: number }) => {
            const max = limit || 20;
            let query = `
              SELECT m.id, m.content, m.sender, m.source, m.created_at,
                     c.name as customer_name
              FROM messages m
              LEFT JOIN customers c ON m.customer_id = c.id
            `;
            const binds: any[] = [];

            if (customerId) {
              query += ' WHERE m.customer_id = ?';
              binds.push(customerId);
            }
            query += ' ORDER BY m.created_at DESC LIMIT ?';
            binds.push(max);

            const results = await this.env.DB.prepare(query).bind(...binds).all<any>();
            return { messages: results.results || [], count: results.results?.length || 0 };
          },
        }),
      },
      stopWhen: stepCountIs(5),
      abortSignal: options?.abortSignal,
    });

    return result.toUIMessageStreamResponse();
  }
}
