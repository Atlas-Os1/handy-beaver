# TOOLS.md — Lil Beaver Local Config

## Admin API Access

**API Key:** `$ADMIN_API_KEY` (stored as secret, never commit!)
**Base URL:** `https://handybeaver.co`

When making API calls, include:
```
Authorization: Bearer $ADMIN_API_KEY
Content-Type: application/json
```

---

## Business Info

- **Business:** The Handy Beaver
- **Owner:** Colt (use first name only with customers)
- **Phone:** +1 (555) 797-2503
- **Email:** contact@handybeaver.co
- **Website:** https://handybeaver.co
- **Facebook:** Handy Beaver Co (Page ID: 1040910635768535)
- **Tagline:** "Dam Good Work, Every Time"

---

## API Endpoints

Base URL: `https://handybeaver.co`

### Customer Operations
```
GET  /api/admin/customers          — List customers
POST /api/admin/customers          — Create customer
GET  /api/admin/customers/:id      — Get customer details
```

### Quotes & Bookings
```
GET  /api/admin/quotes             — List quotes
POST /api/admin/quotes             — Create quote
GET  /api/admin/bookings           — List bookings
POST /api/admin/bookings           — Create booking
```

### Invoices & Payments
```
GET  /api/admin/invoices           — List invoices
POST /api/admin/invoices           — Create invoice
GET  /pay/:invoice_id              — Customer payment page
```

### Messages & Leads
```
GET  /api/admin/messages           — List contact messages
GET  /api/admin/leads              — List Facebook leads
```

### Calendar
```
GET  /api/calendar/events          — Get calendar events
GET  /api/calendar/month           — Get month view
POST /api/calendar/notes           — Add day notes
```

---

## Social Media & Content

### Flier Generation (NEW!)
```
POST /api/flier/generate
{
  "headline": "Spring Deck Special",
  "subtext": "10% OFF Through April",
  "cta": "Book Your Free Quote!",
  "template": "promo",
  "imageUrl": "/api/assets/portfolio/Decking/BluePineTG.png",
  "includePhone": true,
  "includeWebsite": true
}
```

**Templates:** `promo`, `seasonal`, `service`, `testimonial`

Fliers are auto-added to content queue as drafts.

### Gallery Images
```
GET /api/portfolio/r2-images                    — List all folders
GET /api/portfolio/r2-images?folder=Decking     — Get folder images
```

**Folders:** Barndo, Decking, Flooring, Rustic-Cabin, Tiny-Home, bath-remodel, Siding, Stairs-Decking-Railing, TandG, office-space, Burke-residence

160+ real project photos available!

### Content Queue
```
GET  /api/content/status           — Queue status
POST /api/content/publish-now      — Publish ready posts
GET  /api/flier/list               — List generated fliers
```

### Social Post Styles

Mix up content with different styles:
- **tip** — Quick helpful tips
- **before-after** — Transformation posts
- **behind-scenes** — On the job content
- **seasonal** — Seasonal promotions
- **customer-story** — Testimonials
- **fun-fact** — Interesting info
- **question** — Engagement posts
- **local-pride** — SE Oklahoma love
- **tool-spotlight** — Equipment features
- **mistake-lesson** — Learning moments
- **inspiration** — Design ideas
- **weekend-project** — DIY ideas
- **material-deep-dive** — Product education
- **raw-moment** — Authentic snapshots

---

## Discord

- **Admin Channel:** #lil-beaver-admin (1479913371326353590)
- **Webhook:** (configured in worker)

---

## ElevenLabs Voice Agent

- **Agent ID:** agent_6401kk7jr6ngey2ancnk6nf7kpwy
- **Phone Number:** +1 (555) 797-2503

---

## WhatsApp Business

- **Phone Number:** +1 (555) 797-2503
- **Account Name:** The Handy Beaver Co (Colt Cogburn)

---

## Service Categories

1. **Bathroom Remodels** — Tile, fixtures, vanities
2. **Flooring** — LVP, hardwood, tile installation  
3. **Custom Woodwork** — Bars, countertops, built-ins
4. **Deck & Outdoor** — Staining, repairs, builds
5. **General Maintenance** — Repairs, handyman work
6. **New Construction** — Tiny homes, cabins

---

## Pricing Reference

| Package/Service | Price |
|-----------------|-------|
| Rustic Premium Finish | $110/sq.ft. |
| Basic Package | $75/sq.ft. |
| Tongue & Groove | $4.00+/sq.ft. |
| T&G Ceilings | $6.00/sq.ft. |
| T&G Ceilings (10ft+) | $5.00/sq.ft. |
| Laminate Flooring | $1.75/sq.ft. |
| Hardwood Flooring | $10-12/sq.ft. |
| Daily Labor (>6hrs) | $300/day |
| Half-Day Labor (≤6hrs) | $175 |
| Helper Daily | $225/day |
| Helper Half-Day | $100 |

---

## Common Questions

**Q: What areas do you serve?**
A: SE Oklahoma — McCurtain County, Broken Bow, Hochatown, Idabel. We also serve Paris, TX area.

**Q: How much does it cost?**
A: Labor is $175 for jobs up to 6 hours, $300/day for longer. Helper rate is $100 (≤6 hrs) or $225/day. Materials are purchased by the customer.

**Q: How do I schedule?**
A: Fill out the contact form on our website, call us, or message on Facebook. We'll get back to you within 24 hours.

**Q: Do you do free estimates?**
A: Yes! We provide free consultations and estimates for most projects.

---

## Competitors (Research)

Track these to stay competitive:
- Blackjack Mountain Construction (Hochatown)
- Davis MS Contracting (SE Oklahoma)
- Lone Star Remodeling (Dallas)
- Cruz All Services (Oklahoma handyman)

Admin page: https://handybeaver.co/admin/competitors
