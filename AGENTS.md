# AGENTS.md — The Handy Beaver

AI coding agents working in this repository should follow these rules.

## Project Overview

**The Handy Beaver** is an AI-powered traveling craftsman & maintenance service app for Southeast Oklahoma. It includes:
- Customer portal (scheduling, payments, messaging, subscription management)
- AI chat agents (Discord admin + website customer)
- Voice agent (ElevenLabs phone support)
- AI photo visualizer (before/after renovation previews)
- Social media automation
- Subscription service with task queue

## Pricing & Plans

### Service Blocks (One-Time)
| Block | Hours | Price |
|-------|-------|-------|
| Service Call | 2 | $175 |
| Half Day | 4 | $350 |
| Full Day | 8 | $650 |

### Subscription Plans (Monthly)
| Plan | Hours/Month | Price | Features |
|------|-------------|-------|----------|
| Basic | 1 | $75 | Priority scheduling, Photo task queue |
| Standard | 2 | $140 | + 10% off projects |
| Premium | 4 | $280 | + Same-week scheduling, 15% off, Seasonal checkup |

### Tiny Home Finish Packages
| Package | $/sq.ft. | Style |
|---------|----------|-------|
| Modern Minimal | $75 | Clean drywall, LVP flooring, basic trim |
| Rustic Cabin | $110 | Pine T&G, exposed beams, metal accents |

### Labor Rates
- Under 6 hours: $175 (lead) / $100 (helper)
- Full day (6+ hours): $300 (lead) / $225 (helper)
- Materials: Customer pays at cost, no markup

## Service Area

**Primary:** Idabel, Broken Bow, Hochatown, Valliant, Wright City, Millerton, Garvin, Haworth, Eagletown, Smithville, Bethel

**Extended (+$25 trip):** Hugo, Antlers, Fort Towson, Talihina

**Arkansas (+$35 trip):** De Queen, Horatio, Ashdown, Foreman

## Tech Stack

- **Runtime:** Cloudflare Workers (Hono framework)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (images, assets)
- **AI:** Cloudflare Workers AI (chat, image gen)
- **Frontend:** Vite + vanilla HTML/CSS/JS
- **Payments:** Square API
- **Voice:** ElevenLabs Conversational AI

## Project Structure

```
/
├── src/                  # Main worker source
│   ├── index.ts          # Entry point (Hono app)
│   ├── routes/           # API route handlers
│   ├── lib/              # Shared utilities
│   └── types/            # TypeScript types
├── public/               # Static assets
├── agent/                # Lil Beaver agent workspace
│   ├── SOUL.md           # Agent personality
│   ├── SKILL.md          # API capabilities (admin tools)
│   ├── voice/            # Voice agent config
│   └── CUSTOMER-RULES.md # Customer interaction rules
│   └── ADMIN-RULES.md    # Admin interaction rules
├── docs/                 # Architecture docs
├── schema*.sql           # D1 migrations (versioned)
├── wrangler.toml         # Cloudflare config
└── config/               # Environment configs
```

## Do

- Use TypeScript with strict mode
- Use Hono for all API routes
- Use D1 prepared statements (never raw SQL interpolation)
- Use R2 for all file uploads (images, PDFs)
- Follow existing route patterns in `src/routes/`
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Use environment bindings from `wrangler.toml`

## Don't

- Don't use `any` types — define interfaces
- Don't hard-code secrets — use env bindings
- Don't add heavy npm dependencies without approval
- Don't bypass D1 for data (no external DBs)
- Don't store PII in logs
- Don't commit `.dev.vars` or real API keys

## Commands

```bash
# Development
npm run dev              # Local dev server

# Type check single file
npx tsc --noEmit src/routes/quotes.ts

# Deploy to Cloudflare
npm run deploy

# D1 migrations
npx wrangler d1 execute handy-beaver-db --file=schema-v17.sql --remote

# List D1 tables
npx wrangler d1 execute handy-beaver-db --command="SELECT name FROM sqlite_master WHERE type='table'" --remote
```

## Safety & Permissions

**Allowed without asking:**
- Read/list files
- Type check, lint
- Local dev server
- D1 queries (SELECT)

**Ask first:**
- npm install (new dependencies)
- D1 schema changes (migrations)
- wrangler deploy
- git push
- Deleting files

## API Conventions

All API routes follow this pattern:

```typescript
// src/routes/example.ts
import { Hono } from 'hono'
import type { Env } from '../types'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const db = c.env.DB
  const result = await db.prepare('SELECT * FROM example').all()
  return c.json(result.results)
})

export default app
```

## Database Schema

Current schema lives in `schema.sql` with migrations in `schema-v*.sql`.

Key tables:
- `customers` — Contact info, status
- `bookings` — Jobs/appointments
- `quotes` — Price estimates
- `invoices` — Bills with line items
- `invoice_items` — Individual line items
- `payments` — Payment records
- `messages` — Customer communications
- `content_queue` — Scheduled social posts
- `subscription_plans` — Available subscription tiers
- `customer_subscriptions` — Active customer subscriptions
- `subscription_tasks` — Task queue for subscribers (with photo uploads)
- `tiny_home_projects` — Tiny home finish projects

## Agent Architecture

This repo contains TWO agents with different access levels:

| Agent | Channel | Access | Rules |
|-------|---------|--------|-------|
| Lil Beaver Admin | Discord | Full CRUD | `agent/ADMIN-RULES.md` |
| Lil Beaver Customer | Website/Phone | Read + Lead capture | `agent/CUSTOMER-RULES.md` |

When modifying agent behavior:
- Check which mode you're editing
- Admin tools go in `agent/SKILL.md`
- Customer tools are limited by `CUSTOMER-RULES.md`

## Good Examples

- **API route:** `src/routes/quotes.ts`
- **D1 queries:** `src/routes/customers.ts`
- **R2 uploads:** `src/routes/assets.ts`
- **Square integration:** `src/routes/square.ts`

## When Stuck

- Ask a clarifying question
- Propose a short plan before major changes
- Check `docs/` for architecture decisions
- Don't guess at business logic — verify with existing code

## PR Checklist

- [ ] TypeScript compiles (`npm run build`)
- [ ] No hardcoded secrets
- [ ] D1 migrations are versioned (`schema-vN.sql`)
- [ ] Diff is small and focused
- [ ] Brief summary of what changed and why
