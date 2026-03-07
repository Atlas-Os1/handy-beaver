# 🦫 The Handy Beaver

AI-powered traveling craftsman & maintenance service app for Southeast Oklahoma.

## Features

- **Customer Portal** - Email-based login, scheduling, payments, messaging
- **AI Agent** - Chat assistant that handles inquiries and schedules
- **Photo Visualizer** - Upload photos, see AI-generated finished project previews
- **Square Payments** - Deposits, labor, materials payments
- **Voice Agent** - ElevenLabs-powered phone support
- **Social Media** - Automated Facebook content generation

## Tech Stack

- **Cloudflare Pages** - Hono + Vite frontend
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - Image storage
- **Cloudflare Workers AI** - Chat and image generation
- **Cloudflare Agents** - Customer service agent
- **Durable Objects** - Real-time chat sessions
- **Email Routing** - Cloudflare email to serviceflowagi@gmail.com

## Pricing

| Service | Rate |
|---------|------|
| Labor ≤6 hrs | $175.00 |
| Labor >6 hrs | $300.00/day |
| Helper ≤6 hrs | $100.00 |
| Helper >6 hrs | $225.00/day |
| Materials | Customer pays |
| Equipment Rental | Customer pays |

## Service Area

Southeast Oklahoma

## Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
```

---

*Built with ❤️ by the Atlas team*
