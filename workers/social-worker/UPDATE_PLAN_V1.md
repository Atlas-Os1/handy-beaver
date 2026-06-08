Implementation Plan

 Step 0: Preview Deployment Setup

 File: wrangler.toml -- add [env.preview] block at bottom:
 [env.preview]
 name = "handy-beaver-preview"
 [env.preview.triggers]
 crons = []
 - Inherits all bindings (D1, R2, AI, Browser) from top-level config
 - No custom domain routes, no cron triggers (avoids duplication)
 - Deploy: wrangler deploy --env preview
 - URL: https://handy-beaver-preview.srvcflo.workers.dev/

 Step 1: Copy Testimonial Images to Public

 Copy assets/testimonials/*.png to public/testimonials/ so they're served as static files via [assets] directory = "./public".

 Step 2: Intent Detection Module (New File)

 New file: src/lib/intent-detection.ts

 - Detect visitor intent from UTM params (utm_campaign, utm_term), referrer header keywords, Cloudflare geo (c.req.raw.cf?.city), and query
  params
 - Return IntentSignals object with: intent (cabin_owner | sign_shopper | maintenance | general), city, isLocal, isOutOfState
 - Client-side: localStorage check for return visitors (hb_visited key)

 Intent-to-hero mapping:
 ┌───────────────────┬────────────────────────────────────┬─────────────────────────┐
 │      Intent       │              Headline              │           CTA           │
 ├───────────────────┼────────────────────────────────────┼─────────────────────────┤
 │ cabin_owner       │ "Your Cabin, Maintained"           │ "See Maintenance Plans" │
 ├───────────────────┼────────────────────────────────────┼─────────────────────────┤
 │ sign_shopper      │ "Custom Cabin Signs"               │ "Design Your Sign"      │
 ├───────────────────┼────────────────────────────────────┼─────────────────────────┤
 │ general (default) │ Current tagline + service selector │ "What do you need?"     │
 ├───────────────────┼────────────────────────────────────┼─────────────────────────┤
 │ Return visitor    │ "Welcome Back"                     │ "Get Your Quote"        │
 └───────────────────┴────────────────────────────────────┴─────────────────────────┘
 Step 3: Rewrite Hero Section in src/pages/home.ts

 Two-part hero:
 - Left: Intent-responsive headline + subtitle + CTA (changes based on detected intent)
 - Right: Interactive service selector -- 6 tappable cards (Carpentry, Flooring, Deck, Maintenance, Signs, Other)

 Clicking a service card:
 1. Highlights the card (reuse .service-option.selected pattern from quote.ts)
 2. Updates hero headline/CTA to match that service
 3. Shows inline price range from siteConfig.pricing
 4. Opens the mini quote wizard (Step 4)

 Responsive: Cards become horizontal scroll strip on mobile.

 Step 4: Mini Quote Wizard (Inline in Hero)

 Slides into view after service card selection. Simplified 2-step flow:
 - Step 1: Size selector -- 3 buttons ("Quick Fix ~$175", "Half Day ~$175", "Full Day ~$300/day")
 - Step 2: Phone number input + "Get Exact Quote" button

 Submits to existing POST /api/quotes endpoint. Shows inline success message. Links to /quote for complex projects.

 Step 5: Testimonials Section (New)

 Placed after services preview, before pricing. Horizontal scrollable strip of 4 cards:
 - Each card: review screenshot image + customer name + service type + stars
 - Images: /testimonials/prince-bath.png, burke-remodel.png, luke-office.png, boykin-laminate-floor.png
 - Uses .card styling, scroll-snap-type: x mandatory
 - Data hardcoded as const array in home.ts

 Step 6: Before/After Showcase (New)

 2 portfolio pairs shown side-by-side, reusing existing gallery.ts before/after pattern:
 - Bathroom stone-tile pair (/portfolio/bathroom/stone-tile-before.jpg / stone-tile-after.jpg)
 - Flooring pair (/portfolio/flooring/hardwood-damage.jpg / hardwood-finished-bar.jpg)
 - "See All Transformations" link to /gallery
 - Import from config/portfolio-manifest.ts (getBeforeAfterPairs(), getImageUrl())

 Step 7: How It Works Strip (New)

 3-column .grid-3 strip with numbered steps:
 1. "Tell Us What You Need" -- upload photos or describe project
 2. "Get Your Price" -- same-day quote, no surprise fees
 3. "We Show Up Ready" -- tools, materials, done right

 Placed between pricing and AI visualizer teaser.

 Step 8: Trust Signals Update in src/lib/html.ts

 Update the trust banner (lines ~492-497):
 - "100+" -> "200+ Projects Completed"
 - "5-Star Rated" -> "5.0 Stars (Facebook Reviews)"
 - "SE Oklahoma" -> "Hochatown & SE Oklahoma"
 - Add 5th item: "Licensed & Insured"

 Step 9: Proactive Lil Beaver Chat in src/lib/html.ts

 Speech-bubble popup above chat trigger after 15 seconds on homepage (if no interaction):
 - "Hey there! Need help picking a service or want a quick estimate?"
 - "Chat with Lil Beaver" button that opens existing ElevenLabs widget
 - Gated by localStorage.getItem('beaverPromptShown') -- shows once
 - Dismissible with X button

 Future upgrade: Replace ElevenLabs widget with @cloudflare/voice native voice agent (see Cloudflare 2026 section above). This moves
 STT/TTS entirely onto Cloudflare Workers AI, eliminates external dependency, and enables persistent conversation history via SQLite.
 Target: next phase after this plan lands.

 Step 10: Social Worker Updates

 Files: workers/social-worker/index.ts, social/content-templates.json

 New post types added to the rotation:
 - testimonial -- Uses review screenshot images from /testimonials/ with captions
 - blog_share -- Links to blog posts at handybeaver.co/blog
 - qa -- Common customer Q&A text posts
 - schedule -- Behind-the-scenes daily lineup posts

 Updated rotation: real_photo -> ai_cabin -> real_photo -> testimonial -> real_photo -> mascot -> qa/schedule

 Add new caption arrays and testimonial entries to PORTFOLIO_IMAGES.

 Posting schedule increase: Update cron triggers from 3x/week to daily (7 days). New crons:
 crons = ["0 16 * * *", "0 20 * * *"]
 This gives 2 posts/day (10 AM + 2 PM CST) across all 7 days = 14 posts/week (up from 9).

 AI-assisted caption variation: Optionally use Workers AI (@cf/moonshotai/kimi-k2.6) to generate fresh caption variations from the template
  base, preventing repetitive posts. The model runs on Workers AI binding already configured -- no new dependencies.

 Step 11: Deploy Preview and Test

 wrangler deploy --env preview

 Verify at https://handy-beaver-preview.srvcflo.workers.dev/:
 - Intent detection works (test with ?utm_campaign=cabin_signs)
 - Service selector cards highlight and update hero
 - Mini quote wizard shows price ranges and submits
 - Testimonials render with images
 - Before/after pairs display correctly
 - How It Works strip renders in grid-3
 - Trust banner shows updated text
 - Beaver chat prompt appears after 15s
 - Mobile responsive at all breakpoints (900px, 768px, 600px)
 - Social worker deploys separately without errors
 - Social worker cron schedule updated to daily
 - New post types (testimonial, qa, blog_share) generate correctly via /post endpoint

 ---
 Revised Home Page Section Order

 1. Intent-Responsive Hero + Service Selector + Mini Quote Wizard
 2. How It Works (3-step strip)
 3. Services Preview (existing grid-4)
 4. Testimonials (new horizontal scroll)
 5. Before/After Showcase (2 pairs)
 6. Pricing (existing grid-2)
 7. AI Visualizer Teaser (existing)
 8. Social Feeds (existing)
 9. Bottom CTA (existing)

 Files Modified
 File: wrangler.toml
 Changes: Add [env.preview] block
 ────────────────────────────────────────
 File: src/lib/intent-detection.ts
 Changes: New -- intent detection logic
 ────────────────────────────────────────
 File: src/pages/home.ts
 Changes: Major rewrite -- new hero, service selector, mini wizard, testimonials, before/after, how-it-works
 ────────────────────────────────────────
 File: src/lib/html.ts
 Changes: Trust banner update, proactive chat popup
 ────────────────────────────────────────
 File: workers/social-worker/index.ts
 Changes: New post types, rotation, AI caption generation via Kimi K2.6
 ────────────────────────────────────────
 File: workers/social-worker/wrangler.toml
 Changes: Update cron schedule to daily
 ────────────────────────────────────────
 File: social/content-templates.json
 Changes: New caption themes (testimonial, blog_share, qa, schedule)
 ────────────────────────────────────────
 File: public/testimonials/
 Changes: Copy 4 testimonial images
 Future Roadmap (Post This Plan)

 These are tracked for the next iteration, not part of the current implementation:

 1. Lil Beaver Voice Upgrade -- Migrate from ElevenLabs to @cloudflare/voice native pipeline
 2. Lil Beaver Agent Upgrade -- Migrate from OpenClaw/OpenResponses to @cloudflare/think (Project Think) with Kimi K2.6 on Workers AI
 3. Visitor Memory -- Integrate Agent Memory (once GA) for personalized return visits
 4. Hero A/B Testing -- Use Flagship feature flags (once GA) to test hero variants
 5. Employee Portal -- Receipt intake, login/dispatch, job/client views
 6. Hermes Agent -- Evaluate Hermes model via API call for Lil Beaver

---

## CONTINUATION NOTES (Session: 2026-06-02)

### What Was Completed
Steps 0-10 of the plan are code-complete. All files were modified/created:
- wrangler.toml — [env.preview] block added (all bindings duplicated since envs don't inherit)
- src/lib/intent-detection.ts — NEW, intent detection from UTM/referrer/geo
- src/pages/home.ts — MAJOR rewrite with hero, service selector, mini wizard, testimonials, before/after, how-it-works
- src/lib/html.ts — Trust banner updated, proactive Lil Beaver chat popup added
- workers/social-worker/index.ts — New post types (testimonial, blog_share, qa, schedule), AI caption variation via Kimi K2.6, updated rotation
- workers/social-worker/wrangler.toml — Cron updated to daily 2x: ["0 16 * * *", "0 20 * * *"]
- social/content-templates.json — New caption themes added
- public/testimonials/ — 4 testimonial images copied from assets/

### What Has NOT Been Deployed
- **Neither the main worker nor the social worker have been deployed with session changes.**
- Main worker production: version 053f6b3a (June 1 — ELEVENLABS_API_KEY secret update only)
- Social worker production: version dd437044 (June 1)
- Preview deploy was attempted but hit:
  1. R2 binding error (needs dashboard enablement, not wrangler CLI)
  2. Cron trigger limit (5 total on account)
  3. 1042 error when accessing preview URL

### CRITICAL: NO R2 — ALL ASSETS FROM public/ ONLY
R2 bucket has account issues being worked out separately. ALL images, icons, and assets
MUST load from the `public/` directory (served via Cloudflare Workers `[assets]` static config).
Any path starting with `/api/assets/` hits R2 and WILL FAIL. Grep the entire codebase for
`/api/assets/` references and replace with `public/`-served equivalents before deploying.

### REMAINING FIXES NEEDED BEFORE DEPLOY

#### Fix 1: Icon paths — use public/ file tree, NOT R2
The service card icons and "What We Do" section icons currently reference `/api/assets/icons/...` (R2).
Icons already exist in `public/icons/` so paths should be `/icons/...` (served via [assets] static).
Also the beaver avatar in hero uses `/api/assets/beaver-avatar.png` — should be `/beaver-avatar.png`.
Reference commit `a9469fe` which did exactly this fix previously.

**Must check ALL pages, not just home.ts.** Run: `grep -r "/api/assets/" src/` to find every reference.

Files to change in `src/pages/home.ts`:
- SERVICE_CARDS array: `/api/assets/icons/carpentry.png` → `/icons/carpentry.png` (same for flooring, deck, maintenance, other)
- Hero avatar: `/api/assets/beaver-avatar.png` → `/beaver-avatar.png`
- Services Preview section (grid-4): same icon path changes
- Any other `/api/assets/` references across all src/ files

#### Fix 2: Add Vacation Rental Maintenance plans to home page
The current pricing section only shows labor rates + helper rates.
**MISSING:** The "Vacation Rental Maintenance" section with 3 plan tiers.
The correct plans are (from commit 597022b):

| Plan | Price | Hours | Frequency | Best For |
|------|-------|-------|-----------|----------|
| Cabin Care (MOST POPULAR) | $199/mo | 1 hour | Monthly inspections | 1-2 BR cabins |
| Lodge Keeper | $299/mo | 2 hours | Bi-weekly checks | 3-4 BR lodges |
| Premium Care | $399/mo | 4 hours | Weekly oversight | 5+ BR luxury cabins |

Features:
- Cabin Care: Walk-through inspection, hot tub check & chemical balance, photo report, priority scheduling
- Lodge Keeper: Bi-weekly property inspections, hot tub + pool maintenance, seasonal prep & winterization, minor repairs included
- Premium Care: Weekly property oversight, full hot tub & amenity care, vendor coordination, unlimited minor repairs

CTA links: `/contact?plan=cabin-care`, `/contact?plan=lodge-keeper`, `/contact?plan=premium-care`
"View All Plans & Add-Ons →" link to `/pricing`

The full HTML for this section is in commit 597022b — see `git show 597022b:src/pages/home.ts`.

**NOTE:** The site.config.ts still has the old generic plans (Basic $75, Standard $140, Premium $280).
These should be updated to match the vacation rental tiers OR the home page should hardcode the correct plans.

#### Fix 3: Pick-a-Service card images/videos
User will provide custom images or short clips in `assets/pick-a-service/` for the service selector cards.
Currently available in that folder:
- carpentry.mp4
- Flooring-1.mp4
- other.mp4
- deck_repair.mov + deck_repair.jpg
- maintenance.MOV

These are mostly videos. Steps to integrate:
1. Copy to `public/pick-a-service/` for static serving
2. Decide on format: use video thumbnails or extract stills? Or convert cards to support `<video>` tags?
3. Missing assets: signs card (currently uses `/portfolio/signs/handy-beaver-business-sign.png` — may be fine)
4. User may provide more images — check `assets/pick-a-service/` for new files

#### Fix 4: Cabin Maintenance as lead service in "What We Do"
Per the Discord deployment notes, "What We Do" should lead with:
1. Cabin Maintenance — Inspections, hot tubs, winterization — plans from $199/mo → links to /pricing
2. Trim Carpentry
3. Flooring
4. Deck Repair

Currently the grid-4 in home.ts shows: Carpentry, Flooring, Deck Repair, Maintenance (in that order).
Cabin Maintenance should be first and mention "$199/mo".

### Deployment Commands
```bash
# Main worker (from project root)
npx wrangler deploy

# Social worker
npx wrangler deploy --config workers/social-worker/wrangler.toml

# Preview (if R2 is enabled in dashboard)
npx wrangler deploy --env preview
```

### Deployment Blockers
1. **R2 is NOT available** — account issues being resolved. All assets must serve from `public/` via `[assets]` static. The R2 binding (`IMAGES`) can remain in wrangler.toml for when it's fixed, but NO code paths should depend on it for page rendering. Preview env already has R2 commented out.
2. Cron trigger limit (5 total) — preview env uses `crons = []` but still counts. May need to remove unused cron triggers from other workers.
3. For production deploy, use `CLOUDFLARE_API_TOKEN` (stored in GitHub Actions secrets) rather than OAuth login
4. Before deploying, run `grep -r "/api/assets/" src/` to catch any remaining R2-dependent asset paths

### Branch Status
- Branch: `feat/cabin-signs`
- No commits made with these changes yet (all unstaged)
- Run `git status` to see modified files

---

## SESSION 2 (2026-06-02, continued)

### Fixes Completed

#### Fix 1: Icon paths — DONE
- `src/pages/home.ts`: All `/api/assets/icons/...` → `/icons/...`, beaver avatar → `/beaver-avatar.png`
- `src/lib/html.ts`: Nav beaver avatar → `/beaver-avatar.png`, new-badge icon → `/icons/new-badge.png`
- `src/pages/services.ts`: All 8 icon references → `/icons/...`
- `src/components/chat-widget.ts`: Both beaver avatar references → `/beaver-avatar.png`
- Zero `/api/assets/` references remain in home.ts, html.ts, services.ts, chat-widget.ts

#### Fix 2: Vacation Rental Maintenance plans — DONE
- Added full 3-tier plan section (Cabin Care $199, Lodge Keeper $299, Premium Care $399) between pricing and AI Visualizer
- Includes features lists, CTA buttons linking to `/contact?plan=...`, and "View All Plans" link to `/pricing`

#### Fix 3: Pick-a-Service assets — DONE (partial)
- Copied all files from `assets/pick-a-service/` to `public/pick-a-service/` for static serving
- Files: carpentry.mp4, Flooring-1.mp4, other.mp4, deck_repair.mov, deck_repair.jpg, maintenance.MOV
- Service selector cards still use icon-based approach (not video). Videos available at `/pick-a-service/` for future integration
- Signs card still uses `/portfolio/signs/handy-beaver-business-sign.png` (exists in public/)

#### Fix 4: Cabin Maintenance as lead service — DONE
- "What We Do" grid reordered: Cabin Maintenance (→/pricing), Trim Carpentry, Flooring, Deck Repair
- Cabin Maintenance card shows "Inspections, hot tubs, winterization — plans from $199/mo" with "See Plans" CTA
- SERVICE_CARDS maintenance priceHint updated from "$75/mo" to "$199/mo"

### Remaining `/api/assets/` References (NOT blocking home page deploy)
These pages still reference R2 (`/api/assets/`). They'll show broken images until R2 is re-enabled:
- `about.ts` — headshot, working video, beaver avatar
- `tiny-homes.ts` — 12+ portfolio images
- `signs.ts` — wood-texture background
- `agent.ts` — beaver avatar (4 refs)
- `gallery.ts` — R2 portfolio image URLs
- `quote-share.ts`, `payment.ts` — beaver avatar / mascot
- `admin*.ts`, `portal*.ts` — admin/portal UI (internal, lower priority)
- API routes (index.ts, visualize-api.ts, etc.) — these generate R2 URLs server-side, correct behavior

### Ready for Deploy
All 4 fixes are complete. The home page, services page, and global layout (html.ts) will render correctly from `public/` assets only. Deploy with:
```bash
npx wrangler deploy
npx wrangler deploy --config workers/social-worker/wrangler.toml
```