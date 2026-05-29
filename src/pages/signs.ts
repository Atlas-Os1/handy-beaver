import { Context } from 'hono';
import { layout } from '../lib/html';

const signTiers = [
  {
    name: 'Address / Name Sign',
    size: '12" × 18"',
    price: '$125–150',
    time: '~2 hrs your time',
    features: ['Cabin name or family name', 'Cedar or pine', 'Dark walnut or natural stain', 'Exterior sealed (2 coats)', 'D-ring or keyhole hardware included'],
    icon: '🪵'
  },
  {
    name: 'Standard Cabin Sign',
    size: '18" × 24"',
    price: '$200–250',
    time: '~3 hrs your time',
    features: ['Custom cabin name + optional tagline', 'Cedar or pine, 1.5" thick', 'Choice of stain color', 'Exterior sealed (2 coats)', 'Heavy-duty hanging hardware'],
    icon: '🏕️',
    popular: true
  },
  {
    name: 'Statement Sign',
    size: '24" × 36"',
    price: '$300–375',
    time: '~4 hrs your time',
    features: ['Large format — real curb appeal', 'Thick cedar, routed border option', 'Multi-tone stain available', 'Exterior sealed (2 coats)', 'Rope or bracket hardware'],
    icon: '✨'
  },
  {
    name: 'Premium Large Sign',
    size: '36" × 48"',
    price: '$425–525',
    time: '~5–6 hrs your time',
    features: ['Statement piece for any property', 'Live-edge or straight cedar slab', 'Custom design consultation', 'Exterior sealed (2 coats)', 'Cedar post installation available'],
    icon: '🏆'
  }
];

export const signsPage = (c: Context) => {
  const content = `
    <style>
      .signs-hero {
        padding: 5rem 2rem;
        text-align: center;
        background: linear-gradient(180deg, rgba(101, 67, 33, 0.4) 0%, transparent 100%);
        position: relative;
        overflow: hidden;
      }
      .signs-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: url('/api/assets/icons/wood-texture.png') center/cover;
        opacity: 0.06;
        pointer-events: none;
      }
      .signs-hero h1 {
        font-size: 3.5rem;
        font-family: 'Playfair Display', serif;
        color: var(--primary);
        margin-bottom: 1rem;
      }
      .signs-hero p {
        font-size: 1.25rem;
        color: #555;
        max-width: 640px;
        margin: 0 auto 2rem;
      }
      .badge-new {
        display: inline-block;
        background: var(--secondary);
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        text-transform: uppercase;
        margin-bottom: 1.25rem;
      }
      .tier-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.5rem;
        margin: 3rem 0;
      }
      .tier-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        border: 2px solid transparent;
        position: relative;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .tier-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.13);
      }
      .tier-card.popular {
        border-color: var(--secondary);
      }
      .popular-badge {
        position: absolute;
        top: -14px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--secondary);
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.3rem 1rem;
        border-radius: 20px;
        white-space: nowrap;
        letter-spacing: 0.05em;
      }
      .tier-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
      .tier-name { font-size: 1.2rem; font-weight: 700; color: var(--primary); margin-bottom: 0.25rem; }
      .tier-size { color: #888; font-size: 0.9rem; margin-bottom: 0.75rem; }
      .tier-price { font-size: 2rem; font-weight: 800; color: var(--secondary); margin-bottom: 1.25rem; font-family: 'Playfair Display', serif; }
      .tier-features { list-style: none; padding: 0; margin: 0 0 1.5rem; }
      .tier-features li {
        padding: 0.45rem 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #444;
      }
      .tier-features li::before { content: '✓'; color: var(--secondary); font-weight: 700; flex-shrink: 0; }
      .process-steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 2rem;
        margin: 3rem 0;
        counter-reset: steps;
      }
      .process-step {
        text-align: center;
        counter-increment: steps;
        position: relative;
      }
      .process-step::before {
        content: counter(steps);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        background: var(--primary);
        color: white;
        border-radius: 50%;
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 auto 1rem;
        font-family: 'Playfair Display', serif;
      }
      .process-step h3 { color: var(--primary); margin-bottom: 0.5rem; }
      .process-step p { color: #666; font-size: 0.95rem; line-height: 1.5; }
      .mockup-cta {
        background: linear-gradient(135deg, var(--primary), #5a3010);
        color: white;
        border-radius: 20px;
        padding: 3rem 2rem;
        text-align: center;
        margin: 3rem 0;
      }
      .mockup-cta h2 { font-size: 2rem; margin-bottom: 0.75rem; font-family: 'Playfair Display', serif; }
      .mockup-cta p { font-size: 1.1rem; opacity: 0.9; max-width: 540px; margin: 0 auto 2rem; }
      .addons {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
        margin: 2rem 0;
      }
      .addon-card {
        flex: 1;
        min-width: 200px;
        background: #faf8f5;
        border: 1.5px solid #e8ddd0;
        border-radius: 12px;
        padding: 1.5rem;
      }
      .addon-card h4 { color: var(--primary); margin-bottom: 0.25rem; }
      .addon-card .addon-price { font-size: 1.25rem; font-weight: 700; color: var(--secondary); }
      .addon-card p { color: #666; font-size: 0.9rem; margin-top: 0.5rem; }
      .volume-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0,0,0,0.07);
      }
      .volume-table th {
        background: var(--primary);
        color: white;
        padding: 0.9rem 1.25rem;
        text-align: left;
        font-weight: 600;
      }
      .volume-table td {
        padding: 0.9rem 1.25rem;
        border-bottom: 1px solid #f0f0f0;
        color: #444;
      }
      .volume-table tr:last-child td { border-bottom: none; }
      .volume-table tr:nth-child(even) td { background: #faf8f5; }
      @media (max-width: 640px) {
        .signs-hero h1 { font-size: 2.25rem; }
        .tier-grid { grid-template-columns: 1fr; }
        .process-steps { grid-template-columns: 1fr 1fr; }
      }
    </style>

    <!-- Hero -->
    <section class="signs-hero">
      <span class="badge-new">New Service</span>
      <h1>🪵 Custom Cabin Signs</h1>
      <p>CNC-carved, hand-finished, weatherproof outdoor signs made right here in Southeast Oklahoma. Your cabin name, your style — installed and ready before your next guests arrive.</p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="/quote?service=cabin_sign" class="btn btn-primary" style="font-size: 1.1rem;">Get a Free AI Mockup →</a>
        <a href="#pricing" class="btn btn-secondary" style="font-size: 1.1rem;">See Pricing</a>
      </div>
    </section>

    <!-- Why a custom sign -->
    <section class="container" style="margin-top: 3rem;">
      <h2 class="section-title">Why Cabin Owners Choose Us</h2>
      <p class="section-subtitle">Not your Amazon sign. Not a 3-week Etsy wait.</p>
      <div class="grid grid-3" style="margin-top: 2rem;">
        <div class="card" style="text-align: center;">
          <span style="font-size: 2.5rem;">🤖</span>
          <h3 style="color: var(--primary); margin: 1rem 0 0.5rem;">AI Mockup First</h3>
          <p style="color: #666;">See exactly what your sign will look like before we ever touch the CNC. We generate a design preview, you approve it, then we cut it.</p>
        </div>
        <div class="card" style="text-align: center;">
          <span style="font-size: 2.5rem;">🌧️</span>
          <h3 style="color: var(--primary); margin: 1rem 0 0.5rem;">Built for Oklahoma Weather</h3>
          <p style="color: #666;">1.5"+ cedar or pine, double-coat exterior sealer, rust-proof hardware. Your sign will still look great in 10 years.</p>
        </div>
        <div class="card" style="text-align: center;">
          <span style="font-size: 2.5rem;">📍</span>
          <h3 style="color: var(--primary); margin: 1rem 0 0.5rem;">Local & Fast</h3>
          <p style="color: #666;">5–7 business day turnaround. We deliver and install — no waiting 4 weeks for a thin Etsy sign to show up.</p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">How It Works</h2>
      <div class="process-steps">
        <div class="process-step">
          <h3>Tell Us Your Vision</h3>
          <p>Cabin name, size preference, any design ideas. Takes 5 minutes via our quote form.</p>
        </div>
        <div class="process-step">
          <h3>We Generate a Mockup</h3>
          <p>We use AI to produce a realistic preview of your sign. You see it before we cut anything.</p>
        </div>
        <div class="process-step">
          <h3>You Approve It</h3>
          <p>Like what you see? We finalize the design and queue it on the CNC.</p>
        </div>
        <div class="process-step">
          <h3>We Cut, Finish & Deliver</h3>
          <p>Carved, sanded, stained, sealed, and delivered to your cabin — ready to install.</p>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="container" id="pricing" style="margin-top: 4rem;">
      <h2 class="section-title">Sign Pricing</h2>
      <p class="section-subtitle">All signs include exterior stain, double-coat sealer, and hanging hardware.</p>
      <div class="tier-grid">
        ${signTiers.map(tier => `
          <div class="tier-card ${tier.popular ? 'popular' : ''}">
            ${tier.popular ? '<span class="popular-badge">⭐ Most Popular</span>' : ''}
            <div class="tier-icon">${tier.icon}</div>
            <div class="tier-name">${tier.name}</div>
            <div class="tier-size">${tier.size}</div>
            <div class="tier-price">${tier.price}</div>
            <ul class="tier-features">
              ${tier.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <a href="/quote?service=cabin_sign&size=${encodeURIComponent(tier.size)}" class="btn btn-primary" style="width: 100%; text-align: center; display: block;">Order This Size →</a>
          </div>
        `).join('')}
      </div>

      <!-- Add-ons -->
      <h3 style="color: var(--primary); margin-top: 3rem; margin-bottom: 0.5rem;">Add-Ons</h3>
      <div class="addons">
        <div class="addon-card">
          <h4>Cedar Post Mounting Kit</h4>
          <div class="addon-price">+$75</div>
          <p>Hardware and posts for a freestanding sign at the end of your driveway.</p>
        </div>
        <div class="addon-card">
          <h4>Post Installation</h4>
          <div class="addon-price">+$100</div>
          <p>We come out and install the posts and sign in the ground for you.</p>
        </div>
        <div class="addon-card">
          <h4>Address Numbers</h4>
          <div class="addon-price">+$25</div>
          <p>Add your 911 address number to any sign for easier guest navigation.</p>
        </div>
        <div class="addon-card">
          <h4>Rush Order (3–4 days)</h4>
          <div class="addon-price">+15%</div>
          <p>Need it fast before a booking or event? We can make it happen.</p>
        </div>
      </div>

      <!-- Volume pricing -->
      <h3 style="color: var(--primary); margin-top: 3rem; margin-bottom: 0.75rem;">Property Manager Discounts</h3>
      <p style="color: #666; margin-bottom: 1rem;">Managing multiple cabins? We've got you covered.</p>
      <table class="volume-table">
        <thead>
          <tr><th>Number of Signs</th><th>Discount</th><th>Example Savings</th></tr>
        </thead>
        <tbody>
          <tr><td>3–5 signs</td><td><strong style="color: var(--secondary);">10% off</strong></td><td>Save up to $125 on a 5-sign order</td></tr>
          <tr><td>6–10 signs</td><td><strong style="color: var(--secondary);">15% off</strong></td><td>Save up to $375 on a 10-sign order</td></tr>
          <tr><td>10+ signs</td><td><strong style="color: var(--secondary);">Custom quote</strong></td><td>Let's talk — this becomes a real contract</td></tr>
        </tbody>
      </table>
    </section>

    <!-- Our Work Gallery -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Our Work</h2>
      <p class="section-subtitle">Real signs made right here in SE Oklahoma</p>
      <div id="signs-gallery" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-top: 2rem;">
        <div class="card" style="padding: 0; overflow: hidden; border-radius: 16px;">
          <img src="/portfolio/signs/handy-beaver-business-sign.png" alt="HandyBeaver.Co CNC Business Sign" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" loading="lazy" onerror="this.parentElement.style.display='none'">
          <div style="padding: 1rem;">
            <p style="font-weight: 600; color: var(--primary); margin: 0;">HandyBeaver.Co Business Sign</p>
            <p style="color: #888; font-size: 0.85rem; margin: 0.25rem 0 0;">CNC carved · Mascot + QR code · Cedar</p>
          </div>
        </div>
        <div class="card" style="padding: 0; overflow: hidden; border-radius: 16px;">
          <img src="/portfolio/signs/happy_fall_porch_sign.jpeg" alt="Happy Fall Porch Sign" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" loading="lazy" onerror="this.parentElement.style.display='none'">
          <div style="padding: 1rem;">
            <p style="font-weight: 600; color: var(--primary); margin: 0;">Happy Fall Y'All Porch Sign</p>
            <p style="color: #888; font-size: 0.85rem; margin: 0.25rem 0 0;">Vertical · Pine · Dark stain lettering</p>
          </div>
        </div>
        <div class="card" style="padding: 0; overflow: hidden; border-radius: 16px;">
          <img src="/portfolio/signs/house_marker.jpeg" alt="CNC Address Signs" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" loading="lazy" onerror="this.parentElement.style.display='none'">
          <div style="padding: 1rem;">
            <p style="font-weight: 600; color: var(--primary); margin: 0;">Address Marker Signs — 305 Slim Rd.</p>
            <p style="color: #888; font-size: 0.85rem; margin: 0.25rem 0 0;">CNC carved · Sunflower design · Address + street</p>
          </div>
        </div>
        <div class="card" style="padding: 0; overflow: hidden; border-radius: 16px;">
          <img src="/portfolio/signs/wavy_american_flag.jpeg" alt="Rustic Wood American Flag" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" loading="lazy" onerror="this.parentElement.style.display='none'">
          <div style="padding: 1rem;">
            <p style="font-weight: 600; color: var(--primary); margin: 0;">Rustic Wood American Flag</p>
            <p style="color: #888; font-size: 0.85rem; margin: 0.25rem 0 0;">Torched · Hand-stained · Wall art</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Order Online via Square -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Order a Sign Online</h2>
      <p class="section-subtitle">Pay securely through Square — we'll reach out to finalize your design</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-top: 2rem;">
        <div class="card" style="text-align: center; border: 2px solid #f0e8dc;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🪵</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">Address / Name Sign</h4>
          <p style="color: #888; font-size: 0.85rem; margin-bottom: 0.75rem;">12" × 18"</p>
          <p style="font-size: 1.5rem; font-weight: 800; color: var(--secondary); margin-bottom: 1rem;">$137</p>
          <a href="/quote?service=cabin_sign&size=12x18&order=true" class="btn btn-primary" style="width: 100%; display: block; text-align: center;">Order Now →</a>
        </div>
        <div class="card" style="text-align: center; border: 2px solid var(--secondary);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏕️</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">Standard Cabin Sign</h4>
          <p style="color: #888; font-size: 0.85rem; margin-bottom: 0.75rem;">18" × 24" — Most Popular</p>
          <p style="font-size: 1.5rem; font-weight: 800; color: var(--secondary); margin-bottom: 1rem;">$225</p>
          <a href="/quote?service=cabin_sign&size=18x24&order=true" class="btn btn-primary" style="width: 100%; display: block; text-align: center;">Order Now →</a>
        </div>
        <div class="card" style="text-align: center; border: 2px solid #f0e8dc;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">✨</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">Statement Sign</h4>
          <p style="color: #888; font-size: 0.85rem; margin-bottom: 0.75rem;">24" × 36"</p>
          <p style="font-size: 1.5rem; font-weight: 800; color: var(--secondary); margin-bottom: 1rem;">$337</p>
          <a href="/quote?service=cabin_sign&size=24x36&order=true" class="btn btn-primary" style="width: 100%; display: block; text-align: center;">Order Now →</a>
        </div>
        <div class="card" style="text-align: center; border: 2px solid #f0e8dc;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏆</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">Premium Large Sign</h4>
          <p style="color: #888; font-size: 0.85rem; margin-bottom: 0.75rem;">36" × 48"</p>
          <p style="font-size: 1.5rem; font-weight: 800; color: var(--secondary); margin-bottom: 1rem;">$475</p>
          <a href="/quote?service=cabin_sign&size=36x48&order=true" class="btn btn-primary" style="width: 100%; display: block; text-align: center;">Order Now →</a>
        </div>
      </div>
      <p style="text-align: center; color: #999; font-size: 0.85rem; margin-top: 1rem;">All orders include a free AI mockup before we cut. Secure payment via Square.</p>
    </section>

    <!-- AI Mockup CTA -->
    <section class="container" style="margin-top: 4rem;">
      <div class="mockup-cta">
        <h2>See Your Sign Before We Cut It</h2>
        <p>Tell us your cabin name and we'll generate a realistic AI mockup so you know exactly what you're getting. No commitment, no cost — just a preview.</p>
        <a href="/quote?service=cabin_sign" class="btn" style="background: var(--secondary); color: white; font-size: 1.15rem; padding: 1rem 2.5rem;">Get My Free Mockup →</a>
      </div>
    </section>

    <!-- FAQ -->
    <section class="container" style="margin-top: 4rem; max-width: 760px; margin-left: auto; margin-right: auto;">
      <h2 class="section-title">Common Questions</h2>
      <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1.25rem;">
        <div class="card" style="padding: 1.5rem;">
          <h4 style="color: var(--primary); margin-bottom: 0.5rem;">What wood do you use?</h4>
          <p style="color: #666; margin: 0;">We primarily use cedar and pine — both hold up extremely well outdoors in Oklahoma's climate. Cedar is naturally rot-resistant and smells great. We finish every sign with exterior-grade stain and two coats of UV-resistant sealer.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <h4 style="color: var(--primary); margin-bottom: 0.5rem;">How long until I get my sign?</h4>
          <p style="color: #666; margin: 0;">Standard turnaround is 5–7 business days from design approval. Rush orders (3–4 days) are available for a 15% fee.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Do you install them?</h4>
          <p style="color: #666; margin: 0;">Yes. We deliver and hang wall-mounted signs at no extra charge (within our service area). Post installation for freestanding signs is an add-on — see pricing above.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Can I see a design before you cut it?</h4>
          <p style="color: #666; margin: 0;">Always. We generate an AI mockup of your sign — realistic rendering of the wood, font, and layout — and you approve it before we run the CNC. No surprises.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <h4 style="color: var(--primary); margin-bottom: 0.5rem;">What areas do you serve?</h4>
          <p style="color: #666; margin: 0;">Hochatown, Broken Bow, Idabel, Valliant, Hugo, Antlers, and the surrounding McCurtain County area. Not sure if you're in range? <a href="/contact" style="color: var(--primary);">Ask us</a>.</p>
        </div>
      </div>
    </section>

    <section class="container" style="margin-top: 4rem; text-align: center; padding-bottom: 4rem;">
      <h2 style="font-family: 'Playfair Display', serif; color: var(--primary);">Ready to name your cabin?</h2>
      <p style="color: #666; margin: 1rem 0 2rem;">Start with a free AI mockup — see it, love it, then we build it.</p>
      <a href="/quote?service=cabin_sign" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 3rem;">Get My Free Mockup →</a>
    </section>
  `;

  return c.html(layout('Custom Cabin Signs — HandyBeaver Co', content, 'signs'));
};
