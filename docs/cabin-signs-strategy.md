# HandyBeaver Co — Cabin Signs Department Strategy
**Prepared by:** Flo 🤖  
**Date:** May 29, 2026  
**Topic:** Outdoor Custom Cabin Signs — Market Entry Plan

---

## The Opportunity

The Hochatown/Broken Bow area has over **2,966 vacation rental properties** on VRBO alone — and that number doesn't include off-platform cabins, private retreats, and hunting camps. Luxury four-bedroom cabins here average **$350/night at 75% occupancy**. That means these cabin owners are generating serious revenue and actively reinvesting in their properties to stand out from competitors.

A custom cabin sign is one of the first things a guest sees. It sets the tone, makes the cabin feel legitimate and polished, and photographs beautifully for Airbnb listings. Yet almost nobody local is offering **high-quality, CNC-crafted, weatherproof cabin signs** — the market is filled with generic mass-produced pieces from Amazon or thin Etsy signs that weren't built for Oklahoma weather.

You have the CNC, the wood skills, and you're already the go-to craftsman in the area. This is a natural extension.

---

## Market Positioning

**Don't compete on price with Etsy.** Compete on:
- Local presence and fast turnaround (days, not weeks)
- Weatherproof outdoor construction (1.5"+ cedar/pine, exterior grade)
- Installation included or available
- Personalization consult (AI-assisted design previews before cutting)
- The "built by the same guy who did my floors" trust factor

**Target customers:**
1. Cabin owners who rent on Airbnb/VRBO (largest group — they buy signs as a business investment)
2. New cabin builds (construction phase is prime time — they need a sign before opening)
3. Families with a family name cabin (sentimental purchase, often gifted)
4. Local businesses — hunting lodges, small resorts, glamping operations

---

## Pricing Model

### Your Cost Breakdown (per sign)

| Item | Cost |
|------|------|
| Cedar/pine board (1.5"–2" thick, outdoor grade) | $15–40 |
| Consumables (bits, sandpaper, finish, stain) | $8–15 |
| Hardware (D-rings, mounting bolts, post brackets) | $10–30 |
| AI design time (prompts, layout, mockup) | 15–30 min |
| CNC machine time | 1–3 hrs |
| Hand finishing (sanding, stain, 2x exterior sealer coats) | 1–2 hrs |
| **Total hard cost** | **~$50–100** |

### Recommended Retail Pricing

| Product | Size | Your Time | Price | Est. Margin |
|---------|------|-----------|-------|-------------|
| Address/Name Sign | 12"×18" | ~2 hrs | $125–150 | 65–70% |
| Standard Cabin Sign | 18"×24" | ~3 hrs | $200–250 | 65–70% |
| Statement Sign | 24"×36" | ~4 hrs | $300–375 | 65–70% |
| Premium Large Sign | 36"×48" | ~5–6 hrs | $425–525 | 60–65% |
| Add: Post mounting kit | — | +30 min | +$75 | — |
| Add: Cedar post installation | — | +1 hr | +$100 | — |

**Pricing rationale:** Etsy competitors charge $45–150 for thinner, machine-only signs with no local support and ship times of 2–4 weeks. Your signs are thicker, locally made, can be installed, and can be previewed with an AI mockup before cutting. A 50–100% premium over Etsy is completely justified.

**Rule of thumb:** Never price below $125 for any custom sign. Under that number you're not covering your time at a fair rate.

### Volume / Package Deals (for property managers with multiple cabins)
- 3–5 signs: 10% discount
- 6–10 signs: 15% discount  
- 10+: Custom quote (this becomes a real contract job)

---

## Profitable Time Breakdown

For a standard 18"×24" cabin sign at $225:

| Task | Who Does It | Time |
|------|-------------|------|
| Customer consult & design brief | Minte | 20 min |
| AI design mockup (image gen prompt) | Claude/AI | 10 min |
| CAM setup / toolpath | Minte | 20 min |
| CNC cutting | Machine runs | 1–1.5 hrs |
| Hand sanding | Minte | 30 min |
| Staining + 2 sealer coats (dry between) | Minte active time | 30 min |
| Cure time (passive) | — | 24 hrs |
| Delivery/install (local) | Minte | 30 min |
| **Total Minte time** | | **~2.5 hrs** |

At $225 sale price and ~$60 hard cost, you net **$165 for 2.5 hrs of work = ~$66/hr effective rate.** That beats your standard labor rate and the machine is doing the heavy lifting.

---

## Adding Signs to HandyBeaver.co

### Site Changes Needed

**1. Services List** — Add "Custom Cabin Signs" to `content-templates.json` and the services array:
```json
"custom cabin signs"
```

**2. New Services Page or Section** — Create `/signs` page or a section on the main services page covering:
- What you make (outdoor cabin signs, address signs, name signs)
- Materials (cedar, pine, weatherproof finish)
- Turnaround (5–7 business days)
- AI preview before cutting (this is a huge selling point)
- Gallery of completed signs
- CTA: "Get a quote" → existing quote flow

**3. Portfolio Category** — Add a `signs/` folder under `handy-beaver-media/portfolio/` for sign photos. These will be extremely shareable content.

**4. Quote Flow Update** — Add "Custom Sign" as a service type option in the scheduling/quote system so customers can describe what they want (cabin name, size, wood type, mounting preference).

**5. AI Visualizer** — The existing photo visualizer could be adapted to show sign mockups. Customer types their cabin name, picks a style, and sees an AI-generated preview. This alone will close sales.

---

## Social Media Workflow Updates

### Add to the Weekly Content Calendar

The current calendar has a gap on **Wednesday ("Deck Day")** that could rotate with a sign-specific day. Suggested addition:

| Day (Alt) | New Focus | Theme |
|-----------|-----------|-------|
| Wednesday (rotating) | Custom Signs | "Sign Wednesday" — process shots, reveal videos |

### New Content Types for Signs

**1. CNC Process Videos (highest potential engagement)**
Time-lapse or short-form of the CNC cutting a cabin name is *hypnotic* content. These routinely go viral in local groups. Film from above, add music, keep it under 30 seconds. Post as Reels on Instagram and native video on Facebook.

**2. "Name Reveal" Posts**
After cutting a sign for a cabin (e.g., "The Lakeview Lodge"), post a photo of the finished sign on the cabin. Tag the cabin's rental page if they have one. This gets you in front of their audience for free.

**3. Before/After — Generic vs. Custom**
Side-by-side of a cabin entrance with no sign vs. the same cabin with your sign installed. Powerful visual.

**4. AI Mockup Reveal**
Post the AI-generated design mockup alongside the finished physical product. Shows your process and the value of the preview service.

**5. Caption Templates to Add to `content-templates.json`:**
```json
{
  "theme": "cabin_signs",
  "captions": [
    "Every cabin deserves a name. 🪵 We cut, stain, seal, and install — all local, all custom. handybeaver.co/signs",
    "Just delivered 'The Broken Bow Hideaway' sign to a Hochatown cabin owner. Cedar, dark walnut stain, exterior sealed. That's a statement. 🦫",
    "Cabin owners — your sign is the first impression your guests get. Make it count. Custom signs starting at $125. handybeaver.co",
    "We let the CNC do the hard part, but the finishing? That's all craftsmanship. 🪵 Custom cabin signs, SE Oklahoma.",
    "Know a cabin owner who needs a sign? Send this their way. We do custom orders year-round. 🦫 handybeaver.co"
  ],
  "image_prompts": [
    "Rustic cedar wood cabin sign carved with 'Lakeview Lodge' mounted on a beautiful Oklahoma cabin exterior, warm evening light, photorealistic",
    "CNC router carving a custom wood cabin sign, sawdust flying, warm workshop lighting, time-lapse style",
    "Cute cartoon beaver mascot holding a large wooden cabin sign reading 'The Family Retreat', forest background, warm friendly style",
    "Before and after split: plain cabin exterior vs same cabin with beautiful carved cedar sign installed, Oklahoma forest setting"
  ]
}
```

### New Hashtags to Add
```
#CabinSigns #CustomWoodSigns #CNCWoodworking #CabinLife #HochatownCabins 
#BrokenBowCabin #CustomSigns #WoodSign #OutdoorSign #CabinDecor
#VacationRentalHost #AirbnbHost #ShortTermRental #OklahomaWoodworking
```

---

## $0 Facebook & Meta Advertising Strategy

**The rules of the game:** Facebook's algorithm kills organic page posts now (~2–5% reach). But there are three free channels that still work extremely well for a local craftsman:

### Channel 1: Facebook Marketplace (Best ROI for $0)

List every completed sign on Facebook Marketplace as a product. It's free to list, zero fees for local pickup/delivery, and Marketplace gets heavy local traffic from exactly the kind of people who own cabins.

**Listing strategy:**
- Title: "Custom CNC Cabin Sign — Cedar, Weatherproof, Personalized — Hochatown/Broken Bow"
- Price: Show your real price — don't discount on Marketplace
- Photos: Sign alone + sign mounted on a cabin exterior
- Description: Mention turnaround time, AI mockup preview, local installation
- Re-list every 7 days to stay at the top (free bump)
- Add the listing to "For Sale" groups when prompted

### Channel 2: Facebook Groups (Your Existing Strategy + New Groups)

You already have 4 groups in your workflow. Add these sign-specific ones:

| Group Type | What to Post |
|------------|--------------|
| Hochatown/Broken Bow cabin owner groups | Direct — "We make custom cabin signs, AI mockup before we cut" |
| McCurtain County buy/sell/trade | Finished sign photos with price and CTA |
| Oklahoma vacation rental host groups | Value post: "5 things that help your cabin photos stand out" with sign as #1 |
| Local Airbnb/VRBO host communities | Same value post approach |

**The key rule:** Lead with value or beauty, not a pitch. Post the photo of a stunning sign, let people ask "where did you get that?" and THEN you reply. Facebook group algorithms love comment engagement.

### Channel 3: Tagging & Partnerships (Free Reach Multiplier)

When you install a sign at a cabin, ask the owner to:
- Tag HandyBeaver Co in their next listing update post
- Post a photo of the new sign on their rental page

A cabin with 500 followers who shows off their new custom sign sends all 500 of those eyeballs to your business page for free. One install → multiple leads.

**Partner approach:** Reach out to 2–3 cabin property managers who manage multiple properties. Offer a free sign for one cabin in exchange for a testimonial and a post. One manager with 10 cabins could become a recurring client worth $2,000+ per year.

### Channel 4: Meta Business Suite — Free Tools

Use these at zero cost:
- **Reels** — The algorithm still gives organic reach to Reels. CNC process videos = perfect Reels content.
- **Stories** — Behind-the-scenes of a sign being made. Disappears in 24 hrs but keeps you visible.
- **Facebook Events** — "Custom Sign Pop-Up" at a local market or hardware store. Free event listing, free reach.
- **Product Catalog** — Link your site's sign products to a free Meta product catalog for Shop tab visibility.

### When to Start Paid Ads (Later, Not Now)

When you have 5–10 completed sign photos and proof of demand from organic, a $5–10/day Facebook ad targeted at:
- McCurtain County + 30-mile radius
- Interest: Airbnb hosting, vacation rentals, cabin decor, VRBO
- Custom audience: people who visited handybeaver.co

...will be a multiplier, not a gamble. But build the organic proof first.

---

## Launch Checklist

### Week 1 — Setup
- [ ] Add "Custom Cabin Signs" to services list in `content-templates.json`
- [ ] Add `cabin_signs` caption/image prompt block to templates
- [ ] Add `#CabinSigns` and related hashtags to hashtag list
- [ ] Create `handy-beaver-media/portfolio/signs/` folder
- [ ] Make 1–2 sample signs to photograph (even spec pieces work)

### Week 2 — Launch Content
- [ ] Film CNC cutting process video (30 sec, share as Reel)
- [ ] Post finished sign photo to Facebook page + 2 local groups
- [ ] List on Facebook Marketplace
- [ ] Add signs page/section to handybeaver.co
- [ ] Post AI mockup → finished product side-by-side

### Week 3 — Outreach
- [ ] DM 5 local cabin rental pages on Facebook: "We make custom cabin signs, want to see a free mockup of what yours would look like?"
- [ ] Identify 1–2 property managers for partnership/free sign deal
- [ ] Add "Custom Sign" option to quote form on site

### Ongoing
- [ ] Every completed sign gets posted (never skip this)
- [ ] Re-list Marketplace listing weekly
- [ ] Rotate "Sign Wednesday" into content calendar
- [ ] Track which group posts get the most inquiries

---

## Revenue Projections

Conservatively, if the Hochatown area has ~3,000 cabins and even 1% buy a sign from you in year one:

- **30 signs × $225 avg = $6,750 gross revenue**
- At 65% margin = **~$4,400 net**
- At 2.5 hrs per sign = **75 total hours of your time**
- Effective rate = **~$59/hr net**

If 3% of the market buys (still very conservative given your local advantage):
- **90 signs × $225 avg = $20,250 gross**
- Net: **~$13,000**

And that's before volume deals with property managers, before upsells to installation, before repeat orders as new cabins get built.

---

## Why This Wins

1. **Almost zero local competition** — Nobody is doing this with CNC quality and local presence combined.
2. **High margin, scalable** — The CNC runs while you do other things. Time investment per sign is low relative to price.
3. **Self-marketing product** — Every installed sign is a permanent advertisement. Every cabin guest who sees it and loves it is a potential future customer.
4. **Synergy with existing work** — You're already in these cabins doing flooring, decks, trim. Signs become a natural upsell. "Hey, while I'm here — want to see a mockup of a sign for the front?"
5. **AI gives you an edge** — Competitors on Etsy can't offer a local AI-generated preview before cutting. You can, right now, today.

---

*"Quality craftsmanship for Southeast Oklahoma homes — and the signs that name them."* 🦫
