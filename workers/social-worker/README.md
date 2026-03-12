# Handy Beaver Social Worker

Automated Facebook and Instagram posting for Handy Beaver Co.

## Features

- 🎨 AI-generated images via Cloudflare Workers AI (Flux)
- 📱 Posts to Facebook and Instagram automatically
- ⏰ Cron triggers: Mon/Wed/Fri at 10AM, 2PM, 6PM CST
- 🦫 4 content themes: deck, flooring, trim, general
- 📸 R2 storage for generated images
- 📊 KV for post history tracking

## Endpoints

- `GET /status` - Health check
- `GET /history` - Recent posts
- `POST /post` - Manual post (optional `theme` param)

## Deployment

```bash
cd workers/social-worker
npm install
wrangler deploy
```

## Secrets

```bash
wrangler secret put FB_PAGE_TOKEN   # Facebook Page Access Token
wrangler secret put IG_TOKEN        # Instagram Graph API Token
```

## Configuration

Edit `wrangler.toml` for:
- Page IDs
- Cron schedules
- Brand voice settings

## Live URL

https://handy-beaver-social-worker.srvcflo.workers.dev
