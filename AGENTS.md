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

### Custom Cabin Signs (New — May 2026)
CNC-carved, hand-finished, weatherproof outdoor signs. Cedar or pine. AI mockup before cutting. 5–7 day turnaround. Local delivery + install.

| Size | Product | Price |
|------|---------|-------|
| 12"×18" | Address / Name Sign | $125–150 |
| 18"×24" | Standard Cabin Sign (most popular) | $200–250 |
| 24"×36" | Statement Sign | $300–375 |
| 36"×48" | Premium Large Sign | $425–525 |

**Add-ons:** Post Mounting Kit +$75 · Post Installation +$100 · Address Numbers +$25 · Rush (3–4 days) +15%

**Volume discounts:** 3–5 signs 10% off · 6–10 signs 15% off · 10+ custom quote

**Square SKUs:** SIGN-12X18 · SIGN-18X24 · SIGN-24X36 · SIGN-36X48 · SIGN-ADDON-POST-KIT · SIGN-ADDON-POST-INSTALL · SIGN-ADDON-ADDRESS

**Key pages:** `/signs` (public product page) · `/quote?service=cabin_sign` (quote form with sign fields)

**Square catalog setup:** `POST /api/signs/setup-catalog` with `x-admin-key` header seeds all products into Square.

**Static sign photos:** `public/portfolio/signs/` served at `/portfolio/signs/` via `[assets]` binding in wrangler.toml. To add more photos, drop files in that folder and redeploy.

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
- **Storage:** Cloudflare R2 (primary) + Cloudinary (fallback/CDN for images)
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
- `job_media` — Photos/videos per job (schema-v17). Linked to `bookings` + `customers`. Uploaded via admin panel or Discord bot. Visible to clients at `/portal/photos`.

## Job Media System

Photos and videos from jobs are stored in R2 with Cloudinary as automatic fallback.

### Upload endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/job-media/upload` | Admin session | Upload from admin panel (multipart) |
| POST | `/api/job-media/discord` | `secret` field | Upload from Discord bot (Hermes/Lil Beaver) |
| GET  | `/api/job-media` | Admin | List all media, filter by `booking_id` / `customer_id` |
| GET  | `/api/job-media/portal/:customerId` | Portal session | Customer-facing list (visible only) |
| PATCH | `/api/job-media/:id/visibility` | Admin | Toggle `visible_to_client` |
| DELETE | `/api/job-media/:id` | Admin | Delete from R2 + DB |

### Discord webhook (for Hermes / Lil Beaver admin bot)

```
POST https://handybeaver.co/api/job-media/discord
Content-Type: application/json  (or multipart/form-data)

{
  "image_url": "https://cdn.discordapp.com/...",  // OR send file directly
  "booking_id": "42",          // optional — attaches to job
  "customer_email": "...",     // optional — fallback customer lookup
  "title": "Deck framing day 1",
  "description": "Progress shot",
  "discord_message_id": "...",
  "discord_channel_id": "1479913371326353590",
  "secret": "<DISCORD_WEBHOOK_SECRET env var>"
}
```

The bot should watch channel `1479913371326353590` (#lil-beaver-admin). When an image/video is posted with a message, parse `booking:<id>` or `client:<email>` from the caption and include in the payload.

### Cloudinary asset library (CDN backup + gallery)

All static assets are mirrored to Cloudinary under `https://res.cloudinary.com/din7n5qzx/`:

| Cloudinary folder | Contents |
|-------------------|----------|
| `handy-beaver/brand/` | Logos, avatars (beaver-avatar, lil-beaver-mascot, handy-beaver-official) |
| `handy-beaver/icons/` | All UI icons (calendar, jobs, messages, etc.) |
| `handy-beaver/portfolio/` | Portfolio images by category (bathroom, flooring, signs, tiny-home, etc.) |
| `handy-beaver/testimonials/` | Testimonial photos |
| `handy-beaver/job-media/` | Job photos uploaded via admin/Discord |

The serve route (`/api/job-media/file/*`) tries R2 first and 302-redirects to Cloudinary if R2 misses. **Worker env vars required:** `CLOUDINARY_CLOUD_NAME=din7n5qzx`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

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
