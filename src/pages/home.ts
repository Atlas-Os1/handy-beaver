import { Context } from 'hono';
import { layout } from '../lib/html';
import { buildHead, pageSeo } from '../lib/seo';
import { siteConfig } from '../../config/site.config';
import { detectIntent, getHeroContent } from '../lib/intent-detection';

const { business, pricing } = siteConfig;

// Testimonial data
const TESTIMONIALS = [
  { image: '/testimonials/prince-bath.png', name: 'Prince', service: 'Bathroom Remodel', stars: 5 },
  { image: '/testimonials/burke-remodel.png', name: 'Burke', service: 'Home Remodel', stars: 5 },
  { image: '/testimonials/luke-office.png', name: 'Luke', service: 'Office Build-Out', stars: 5 },
  { image: '/testimonials/boykin-laminate-floor.png', name: 'Boykin', service: 'Laminate Flooring', stars: 5 },
] as const;

// Service cards for the selector
const SERVICE_CARDS = [
  { id: 'carpentry', media: '/pick-a-service/carpentry.mp4', type: 'video' as const, label: 'Carpentry', desc: 'Trim, molding, custom woodwork', priceHint: 'From $175' },
  { id: 'flooring', media: '/pick-a-service/Flooring-1.mp4', type: 'video' as const, label: 'Flooring', desc: 'Install, repair, refinish', priceHint: 'From $175' },
  { id: 'deck', media: '/pick-a-service/deck_repair.jpg', type: 'image' as const, label: 'Deck Repair', desc: 'Restore, replace, seal', priceHint: 'From $175' },
  { id: 'maintenance', media: '/pick-a-service/maintenance.MOV', type: 'video' as const, label: 'Maintenance', desc: 'Monthly cabin care plans', priceHint: 'From $199/mo' },
  { id: 'signs', media: '/portfolio/signs/handy-beaver-business-sign.png', type: 'image' as const, label: 'Cabin Signs', desc: 'Custom cedar, personalized', priceHint: 'From $125' },
  { id: 'other', media: '/pick-a-service/other.mp4', type: 'video' as const, label: 'Other', desc: 'General handyman work', priceHint: 'From $175' },
] as const;

export const homePage = (c: Context) => {
  const signals = detectIntent(c.req.raw, (c.req.raw as any).cf);
  const hero = getHeroContent(signals.intent);

  const content = `
    <style>
      /* Hero layout */
      .home-hero {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: center;
        padding: 4rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
        background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);
      }
      .home-hero-left { text-align: left; }
      .home-hero-title {
        font-size: 3.5rem;
        font-family: 'Playfair Display', serif;
        color: var(--accent);
        margin-bottom: 1rem;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
        line-height: 1.15;
      }
      .home-hero-tagline {
        font-size: 1.25rem;
        color: var(--secondary);
        margin-bottom: 2rem;
        line-height: 1.6;
      }
      .hero-ctas {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      /* Service selector grid */
      .service-selector {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }
      .svc-card {
        background: var(--card);
        border: 3px solid transparent;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        text-decoration: none;
        color: var(--bg);
      }
      .svc-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 0 20px var(--card-glow), 0 8px 24px rgba(0,0,0,0.3);
      }
      .svc-card.selected {
        border-color: var(--secondary);
        background: #fff5e6;
        box-shadow: 0 0 20px rgba(210, 105, 30, 0.3);
      }
      .svc-card img, .svc-card video {
        width: 100%;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 0.5rem;
      }
      .svc-card h4 {
        font-size: 0.95rem;
        margin-bottom: 0.25rem;
        color: var(--primary);
      }
      .svc-card .svc-desc {
        font-size: 0.75rem;
        color: #888;
      }
      .svc-card .svc-price {
        display: none;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--secondary);
        margin-top: 0.25rem;
      }
      .svc-card.selected .svc-price {
        display: block;
      }

      /* Mini quote wizard */
      .mini-wizard {
        display: none;
        margin-top: 2rem;
        padding: 1.5rem;
        background: rgba(44, 24, 16, 0.6);
        border-radius: 16px;
        border: 1px solid var(--secondary);
        backdrop-filter: blur(6px);
        animation: fadeIn 0.4s ease;
      }
      .mini-wizard.active { display: block; }
      .mini-wizard h3 {
        color: var(--accent);
        font-family: 'Playfair Display', serif;
        margin-bottom: 1rem;
        font-size: 1.2rem;
      }
      .size-btns {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .size-btn {
        flex: 1;
        min-width: 120px;
        padding: 0.75rem 1rem;
        background: rgba(255,255,255,0.1);
        border: 2px solid var(--accent);
        border-radius: 8px;
        color: var(--accent);
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 600;
        font-size: 0.9rem;
        text-align: center;
      }
      .size-btn:hover { background: rgba(245, 222, 179, 0.15); }
      .size-btn.selected {
        background: var(--secondary);
        border-color: var(--secondary);
        color: white;
      }
      .wizard-step-2 {
        display: none;
        animation: fadeIn 0.4s ease;
      }
      .wizard-step-2.active { display: block; }
      .wizard-input-row {
        display: flex;
        gap: 0.75rem;
        align-items: stretch;
      }
      .wizard-input-row input {
        flex: 1;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: 2px solid var(--accent);
        background: rgba(255,255,255,0.1);
        color: var(--accent);
        font-size: 1rem;
      }
      .wizard-input-row input::placeholder { color: rgba(245, 222, 179, 0.5); }
      .wizard-success {
        display: none;
        padding: 1.5rem;
        text-align: center;
        color: var(--accent);
        animation: fadeIn 0.4s ease;
      }
      .wizard-success.active { display: block; }

      /* How It Works strip */
      .hiw-card {
        text-align: center;
        padding: 2rem 1.5rem;
      }
      .hiw-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }
      .hiw-card h3 {
        color: var(--primary);
        margin-bottom: 0.5rem;
      }
      .hiw-card p { color: #666; }

      /* Testimonials scroll strip */
      .testimonial-strip {
        display: flex;
        gap: 1.5rem;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        padding: 1rem 0.5rem 1.5rem;
        -webkit-overflow-scrolling: touch;
      }
      .testimonial-strip::-webkit-scrollbar { height: 6px; }
      .testimonial-strip::-webkit-scrollbar-thumb { background: var(--secondary); border-radius: 3px; }
      .testimonial-card {
        flex: 0 0 280px;
        scroll-snap-align: start;
        padding: 0;
        overflow: hidden;
      }
      .testimonial-card img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 12px 12px 0 0;
      }
      .testimonial-info {
        padding: 1rem;
      }
      .testimonial-info .stars {
        color: #f5a623;
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }
      .testimonial-info h4 {
        color: var(--primary);
        font-size: 1rem;
        margin-bottom: 0.15rem;
      }
      .testimonial-info p {
        color: #888;
        font-size: 0.85rem;
      }

      /* Before/After showcase */
      .ba-home-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
      }
      .ba-home-card {
        overflow: hidden;
      }
      .ba-home-images {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
      }
      .ba-home-images > div {
        position: relative;
        overflow: hidden;
      }
      .ba-home-images img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
      }
      .ba-home-images .ba-label {
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .ba-home-info {
        padding: 1rem;
      }
      .ba-home-info h4 {
        color: var(--primary);
        margin-bottom: 0.25rem;
      }
      .ba-home-info p {
        color: #666;
        font-size: 0.9rem;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 900px) {
        .home-hero {
          grid-template-columns: 1fr;
          padding: 3rem 1.5rem;
          text-align: center;
        }
        .home-hero-left { text-align: center; }
        .home-hero-title { font-size: 2.5rem; }
        .hero-ctas { justify-content: center; }
        .service-selector {
          grid-template-columns: repeat(3, 1fr);
          max-width: 500px;
          margin: 0 auto;
        }
        .ba-home-grid { grid-template-columns: 1fr; }
      }

      @media (max-width: 600px) {
        .home-hero { padding: 2rem 1rem; }
        .home-hero-title { font-size: 2rem; }
        .home-hero-tagline { font-size: 1.05rem; }
        .service-selector {
          grid-template-columns: repeat(2, 1fr);
        }
        .size-btns { flex-direction: column; }
        .wizard-input-row { flex-direction: column; }
        .ba-home-images { grid-template-columns: 1fr; }
        .ba-home-images img { height: 160px; }
        .testimonial-card { flex: 0 0 240px; }
      }
    </style>

    <!-- Intent-Responsive Hero + Service Selector -->
    <section class="home-hero">
      <div class="home-hero-left">
        <img
          src="/beaver-avatar.png"
          alt="${business.name} mascot"
          style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--secondary); box-shadow: 0 0 30px var(--card-glow); margin-bottom: 1.5rem;"
        >
        <h1 class="home-hero-title" id="hero-headline">${hero.headline}</h1>
        <p class="home-hero-tagline" id="hero-subtitle">${hero.subtitle}</p>
        <div class="hero-ctas">
          <a href="${hero.ctaLink}" class="btn btn-primary" style="font-size: 1.15rem;" id="hero-cta">${hero.cta}</a>
          <a href="/visualize" class="btn btn-secondary">AI Visualizer</a>
        </div>
      </div>

      <div>
        <h3 style="color: var(--accent); font-family: 'Playfair Display', serif; margin-bottom: 1rem; text-align: center;">Pick a Service</h3>
        <div class="service-selector" id="service-selector">
          ${SERVICE_CARDS.map(svc => `
            <div class="svc-card" data-service="${svc.id}" onclick="selectService('${svc.id}')">
              ${svc.type === 'video'
                ? `<video src="${svc.media}" autoplay muted loop playsinline></video>`
                : `<img src="${svc.media}" alt="${svc.label}">`}
              <h4>${svc.label}</h4>
              <div class="svc-desc">${svc.desc}</div>
              <div class="svc-price">${svc.priceHint}</div>
            </div>
          `).join('')}
        </div>

        <!-- Mini Quote Wizard (slides in after service selection) -->
        <div class="mini-wizard" id="mini-wizard">
          <h3 id="wizard-title">How big is the job?</h3>

          <div id="wizard-step-1">
            <div class="size-btns">
              <button class="size-btn" onclick="selectSize('quick', this)">Quick Fix<br><small>~$175</small></button>
              <button class="size-btn" onclick="selectSize('half', this)">Half Day<br><small>~$175</small></button>
              <button class="size-btn" onclick="selectSize('full', this)">Full Day<br><small>~$300/day</small></button>
            </div>
          </div>

          <div class="wizard-step-2" id="wizard-step-2">
            <p style="color: var(--accent); margin-bottom: 0.75rem;">Drop your number and we'll text you an exact quote:</p>
            <div class="wizard-input-row">
              <input type="tel" id="wizard-phone" placeholder="(555) 123-4567" maxlength="14">
              <button class="btn btn-primary" onclick="submitMiniQuote()" style="white-space: nowrap;">Get Exact Quote</button>
            </div>
            <p style="margin-top: 0.75rem; text-align: center;">
              <a href="/quote" style="color: var(--accent); font-size: 0.85rem;">Need something more detailed? Full quote form &rarr;</a>
            </p>
          </div>

          <div class="wizard-success" id="wizard-success">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">&#9989;</div>
            <h3 style="color: var(--accent);">Got it!</h3>
            <p style="color: var(--secondary);">We'll text you a quote shortly. Usually same day.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Strip -->
    <section class="container">
      <h2 class="section-title">How It Works</h2>
      <div class="grid grid-3">
        <div class="card hiw-card">
          <div class="hiw-number">1</div>
          <h3>Tell Us What You Need</h3>
          <p>Upload photos or describe your project. We'll figure out the rest.</p>
        </div>
        <div class="card hiw-card">
          <div class="hiw-number">2</div>
          <h3>Get Your Price</h3>
          <p>Same-day quote, no surprise fees. Materials paid by you, directly.</p>
        </div>
        <div class="card hiw-card">
          <div class="hiw-number">3</div>
          <h3>We Show Up Ready</h3>
          <p>Tools, materials, done right. 25 years of experience on every job.</p>
        </div>
      </div>
    </section>

    <!-- Services Preview -->
    <section class="container" id="services">
      <h2 class="section-title">What We Do</h2>
      <p class="section-subtitle">Quality craftsmanship for your home</p>

      <div class="grid grid-4">
        <a href="/pricing" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <img src="/icons/maintenance.png" alt="Cabin Maintenance" class="service-icon" style="width: 64px; height: 64px; margin-bottom: 1rem;">
          <h3>Cabin Maintenance</h3>
          <p style="color: #666; margin-top: 0.5rem;">Inspections, hot tubs, winterization — plans from $199/mo</p>
          <span class="learn-more" style="margin-top: 1rem;">See Plans</span>
        </a>
        <a href="/services#carpentry" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <img src="/icons/carpentry.png" alt="Carpentry" class="service-icon" style="width: 64px; height: 64px; margin-bottom: 1rem;">
          <h3>Trim Carpentry</h3>
          <p style="color: #666; margin-top: 0.5rem;">Crown molding, baseboards, door frames, and custom woodwork</p>
          <span class="learn-more" style="margin-top: 1rem;">Learn More</span>
        </a>
        <a href="/services#flooring" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <img src="/icons/flooring.png" alt="Flooring" class="service-icon" style="width: 64px; height: 64px; margin-bottom: 1rem;">
          <h3>Flooring</h3>
          <p style="color: #666; margin-top: 0.5rem;">Installation, repair, and refinishing for all floor types</p>
          <span class="learn-more" style="margin-top: 1rem;">Learn More</span>
        </a>
        <a href="/services#deck" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <img src="/icons/deck.png" alt="Deck" class="service-icon" style="width: 64px; height: 64px; margin-bottom: 1rem;">
          <h3>Deck Repair</h3>
          <p style="color: #666; margin-top: 0.5rem;">Restoration, board replacement, and sealing</p>
          <span class="learn-more" style="margin-top: 1rem;">Learn More</span>
        </a>
      </div>

      <div style="text-align: center; margin-top: 2rem;">
        <a href="/services" class="btn btn-secondary">View All Services &rarr;</a>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">What Our Customers Say</h2>
      <p class="section-subtitle">Real reviews from real projects</p>

      <div class="testimonial-strip">
        ${TESTIMONIALS.map(t => `
          <div class="card testimonial-card">
            <img src="${t.image}" alt="${t.name} - ${t.service}" loading="lazy">
            <div class="testimonial-info">
              <div class="stars">${'&#9733;'.repeat(t.stars)}</div>
              <h4>${t.name}</h4>
              <p>${t.service}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Before/After Showcase -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Transformations</h2>
      <p class="section-subtitle">See the difference quality work makes</p>

      <div class="ba-home-grid">
        <div class="card ba-home-card">
          <div class="ba-home-images">
            <div>
              <img src="/portfolio/bathroom/stone-tile-before.jpg" alt="Bathroom before" loading="lazy">
              <span class="ba-label">Before</span>
            </div>
            <div>
              <img src="/portfolio/bathroom/stone-tile-after.jpg" alt="Bathroom after" loading="lazy">
              <span class="ba-label">After</span>
            </div>
          </div>
          <div class="ba-home-info">
            <h4>Stone Tile Bathroom</h4>
            <p>Stone-look tile surround, shiplap walls, T&G wood ceiling</p>
          </div>
        </div>

        <div class="card ba-home-card">
          <div class="ba-home-images">
            <div>
              <img src="/portfolio/flooring/hardwood-damage.jpg" alt="Floor before" loading="lazy">
              <span class="ba-label">Before</span>
            </div>
            <div>
              <img src="/portfolio/flooring/hardwood-finished-bar.jpg" alt="Floor after" loading="lazy">
              <span class="ba-label">After</span>
            </div>
          </div>
          <div class="ba-home-info">
            <h4>Hardwood Floor Repair</h4>
            <p>Water-damaged hardwood restored to seamless finish</p>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 2rem;">
        <a href="/gallery" class="btn btn-secondary">See All Transformations &rarr;</a>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Simple, Honest Pricing</h2>
      <p class="section-subtitle">No hidden fees. You pay for materials directly.</p>

      <div class="grid grid-2" style="max-width: 800px; margin: 0 auto;">
        <div class="card">
          <h3 style="color: var(--primary); font-size: 1.5rem; margin-bottom: 1rem;">Labor Rates</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #eee;">
            <span>Half Day (&le;6 hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.labor.underSixHours}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;">
            <span>Full Day (6+ hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.labor.overSixHours}/day</span>
          </div>
        </div>

        <div class="card">
          <h3 style="color: var(--primary); font-size: 1.5rem; margin-bottom: 1rem;">Helper Rates</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #eee;">
            <span>Half Day (&le;6 hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.helper.underSixHours}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;">
            <span>Full Day (6+ hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.helper.overSixHours}/day</span>
          </div>
        </div>
      </div>

      <p style="text-align: center; margin-top: 2rem; color: var(--accent); font-style: italic;">
        ${pricing.notes}
      </p>
    </section>

    <!-- Vacation Rental Maintenance Plans -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Vacation Rental Maintenance</h2>
      <p class="section-subtitle">Monthly plans designed for Hochatown cabins — inspections, hot tubs, seasonal prep</p>

      <div class="grid grid-3" style="max-width: 900px; margin: 2rem auto;">
        <!-- Cabin Care -->
        <div class="card" style="text-align: center; position: relative; border: 3px solid var(--secondary);">
          <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--secondary); color: white; padding: 0.25rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; white-space: nowrap;">MOST POPULAR</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem; margin-top: 0.5rem;">Cabin Care</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 0.75rem 0;">$199<span style="font-size: 1rem; color: #666; font-weight: normal;">/mo</span></p>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">1 hour · Monthly inspections</p>
          <p style="color: #888; font-size: 0.8rem; font-style: italic; margin-bottom: 1rem;">Best for 1-2 BR cabins</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.85rem; color: #555; margin-bottom: 1.5rem;">
            <li style="padding: 0.25rem 0;">&#10003; Monthly walk-through inspection</li>
            <li style="padding: 0.25rem 0;">&#10003; Hot tub check & chemical balance</li>
            <li style="padding: 0.25rem 0;">&#10003; Photo report after each visit</li>
            <li style="padding: 0.25rem 0;">&#10003; Priority scheduling for repairs</li>
          </ul>
          <a href="/contact?plan=cabin-care" class="btn btn-primary" style="width: 100%; text-align: center;">Get Started</a>
        </div>

        <!-- Lodge Keeper -->
        <div class="card" style="text-align: center; position: relative;">
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Lodge Keeper</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 0.75rem 0;">$299<span style="font-size: 1rem; color: #666; font-weight: normal;">/mo</span></p>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">2 hours · Bi-weekly checks</p>
          <p style="color: #888; font-size: 0.8rem; font-style: italic; margin-bottom: 1rem;">Best for 3-4 BR lodges</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.85rem; color: #555; margin-bottom: 1.5rem;">
            <li style="padding: 0.25rem 0;">&#10003; Bi-weekly property inspections</li>
            <li style="padding: 0.25rem 0;">&#10003; Hot tub + pool maintenance</li>
            <li style="padding: 0.25rem 0;">&#10003; Seasonal prep & winterization</li>
            <li style="padding: 0.25rem 0;">&#10003; Minor repairs included</li>
          </ul>
          <a href="/contact?plan=lodge-keeper" class="btn btn-secondary" style="width: 100%; text-align: center;">Get Started</a>
        </div>

        <!-- Premium Care -->
        <div class="card" style="text-align: center; position: relative;">
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Premium Care</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 0.75rem 0;">$399<span style="font-size: 1rem; color: #666; font-weight: normal;">/mo</span></p>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">4 hours · Full oversight</p>
          <p style="color: #888; font-size: 0.8rem; font-style: italic; margin-bottom: 1rem;">Best for 5+ BR luxury cabins</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.85rem; color: #555; margin-bottom: 1.5rem;">
            <li style="padding: 0.25rem 0;">&#10003; Weekly property oversight</li>
            <li style="padding: 0.25rem 0;">&#10003; Full hot tub & amenity care</li>
            <li style="padding: 0.25rem 0;">&#10003; Vendor coordination</li>
            <li style="padding: 0.25rem 0;">&#10003; Unlimited minor repairs</li>
          </ul>
          <a href="/contact?plan=premium-care" class="btn btn-primary" style="width: 100%; text-align: center;">Get Started</a>
        </div>
      </div>

      <p style="text-align: center; margin-top: 1.5rem;">
        <a href="/pricing" style="color: var(--secondary); font-weight: 600;">View All Plans & Add-Ons &rarr;</a>
      </p>
    </section>

    <!-- AI Visualizer Teaser -->
    <section class="container" style="margin-top: 4rem;">
      <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; text-align: center; padding: 3rem;">
        <h2 style="font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 1rem;">
          See Your Project Before We Start
        </h2>
        <p style="max-width: 600px; margin: 0 auto 1.5rem; font-size: 1.1rem;">
          Upload a photo of your space and our AI will show you what your finished project could look like!
        </p>
        <a href="/visualize" class="btn" style="background: white; color: var(--primary);">Try AI Visualizer Free</a>
        <p style="margin-top: 1rem; font-size: 0.85rem; opacity: 0.9;">
          New visitors get 3 free visualizations &bull; Customers get unlimited access
        </p>
      </div>
    </section>

    <!-- Social Feed Section -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Follow Our Work</h2>
      <p class="section-subtitle">See our latest projects and tips on social media</p>

      <div class="grid grid-2" style="max-width: 900px; margin: 0 auto; gap: 2rem;">
        <!-- Instagram Feed -->
        <div class="card" style="text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #E4405F;">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <h3 style="color: var(--primary); margin: 0;">@lilhandybeaver</h3>
          </div>
          <div id="instagram-feed" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
            <p style="color: #666;">Loading latest posts...</p>
          </div>
          <a href="https://instagram.com/lilhandybeaver" target="_blank" rel="noopener" class="btn btn-secondary" style="margin-top: 1rem; width: 100%;">
            Follow on Instagram &rarr;
          </a>
        </div>

        <!-- Facebook Feed -->
        <div class="card" style="text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
            <h3 style="color: var(--primary); margin: 0;">Handy Beaver Co</h3>
          </div>
          <div id="facebook-feed" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
            <p style="color: #666;">Loading latest posts...</p>
          </div>
          <a href="https://www.facebook.com/1040910635768535" target="_blank" rel="noopener" class="btn btn-secondary" style="margin-top: 1rem; width: 100%;">
            Like on Facebook &rarr;
          </a>
        </div>
      </div>
    </section>

    <script>
      // Load social feeds
      async function loadSocialFeeds() {
        try {
          const response = await fetch('/api/social/feed');
          const data = await response.json();

          if (data.instagram && data.instagram.length > 0) {
            const igFeed = document.getElementById('instagram-feed');
            igFeed.innerHTML = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">' +
              data.instagram.slice(0, 6).map(post =>
                '<a href="' + post.permalink + '" target="_blank" style="aspect-ratio: 1; overflow: hidden; border-radius: 4px;">' +
                '<img src="' + post.media_url + '" alt="' + (post.caption || '').substring(0, 50) + '" style="width: 100%; height: 100%; object-fit: cover;">' +
                '</a>'
              ).join('') +
            '</div>';
          }

          if (data.facebook && data.facebook.length > 0) {
            const fbFeed = document.getElementById('facebook-feed');
            fbFeed.innerHTML = '<div style="text-align: left; max-height: 300px; overflow-y: auto;">' +
              data.facebook.slice(0, 3).map(post =>
                '<div style="padding: 0.75rem; border-bottom: 1px solid #eee;">' +
                '<p style="color: #333; font-size: 0.9rem; margin: 0;">' + (post.message || '').substring(0, 150) + (post.message && post.message.length > 150 ? '...' : '') + '</p>' +
                '<span style="color: #999; font-size: 0.75rem;">' + new Date(post.created_time).toLocaleDateString() + '</span>' +
                '</div>'
              ).join('') +
            '</div>';
          }
        } catch (e) {
          console.log('Social feeds not available');
        }
      }
      loadSocialFeeds();

      // Return visitor detection
      (function() {
        if (localStorage.getItem('hb_visited')) {
          var headline = document.getElementById('hero-headline');
          var subtitle = document.getElementById('hero-subtitle');
          var cta = document.getElementById('hero-cta');
          // Only override if intent was general
          if (headline && headline.textContent === '${business.name}') {
            headline.textContent = 'Welcome Back';
            subtitle.textContent = 'Ready to get your next project quoted?';
            cta.textContent = 'Get Your Quote';
            cta.href = '/quote';
          }
        }
        localStorage.setItem('hb_visited', Date.now().toString());
      })();

      // Service selector
      var selectedService = null;
      var selectedSize = null;

      function selectService(id) {
        selectedService = id;
        document.querySelectorAll('.svc-card').forEach(function(card) {
          card.classList.toggle('selected', card.getAttribute('data-service') === id);
        });
        // Show mini wizard
        document.getElementById('mini-wizard').classList.add('active');
        // Reset wizard state
        document.getElementById('wizard-step-1').style.display = 'block';
        document.getElementById('wizard-step-2').classList.remove('active');
        document.getElementById('wizard-success').classList.remove('active');
        document.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('selected'); });
        selectedSize = null;

        // Update hero headline for the selected service
        var headlines = {
          carpentry: 'Custom Trim & Woodwork',
          flooring: 'Flooring Done Right',
          deck: 'Deck Repair & Restoration',
          maintenance: 'Cabin Care Plans',
          signs: 'Custom Cabin Signs',
          other: 'Let\\'s Get It Done'
        };
        var ctas = {
          carpentry: 'Get Carpentry Quote',
          flooring: 'Get Flooring Quote',
          deck: 'Get Deck Quote',
          maintenance: 'See Plans',
          signs: 'Design Your Sign',
          other: 'Get Quote'
        };
        var links = {
          carpentry: '/quote',
          flooring: '/quote',
          deck: '/quote',
          maintenance: '/pricing#maintenance',
          signs: '/signs',
          other: '/quote'
        };
        document.getElementById('hero-headline').textContent = headlines[id] || '${business.name}';
        document.getElementById('hero-cta').textContent = ctas[id] || 'Get Quote';
        document.getElementById('hero-cta').href = links[id] || '/quote';
      }

      function selectSize(size, btn) {
        selectedSize = size;
        document.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        // Show step 2
        document.getElementById('wizard-step-2').classList.add('active');
        document.getElementById('wizard-phone').focus();
      }

      function submitMiniQuote() {
        var phone = document.getElementById('wizard-phone').value.trim();
        if (!phone || phone.length < 7) {
          document.getElementById('wizard-phone').style.borderColor = '#e74c3c';
          return;
        }

        fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: selectedService,
            size: selectedSize,
            phone: phone,
            source: 'mini_wizard'
          })
        }).then(function() {
          document.getElementById('wizard-step-1').style.display = 'none';
          document.getElementById('wizard-step-2').classList.remove('active');
          document.getElementById('wizard-success').classList.add('active');
        }).catch(function() {
          document.getElementById('wizard-step-1').style.display = 'none';
          document.getElementById('wizard-step-2').classList.remove('active');
          document.getElementById('wizard-success').classList.add('active');
        });
      }
    </script>

    <!-- CTA Section -->
    <section class="container" style="margin-top: 4rem; text-align: center;">
      <h2 class="section-title">Ready to Get Started?</h2>
      <p class="section-subtitle">Contact us for a free consultation and quote</p>
      <a href="/contact" class="btn btn-primary" style="font-size: 1.25rem; padding: 1.25rem 3rem;">
        Request Free Quote
      </a>
    </section>
  `;

  return c.html(layout('Home', content, 'home', buildHead(pageSeo.home)));
};
