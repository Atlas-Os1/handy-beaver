import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { pricing, subscriptionPlans, cabinAddOns } = siteConfig;

const services = [
  {
    icon: '/api/assets/icons/carpentry.png',
    name: 'Trim Carpentry',
    description: 'Expert woodwork that adds character and value to your home.',
    items: [
      'Crown molding installation',
      'Baseboard replacement',
      'Door & window trim',
      'Wainscoting & paneling',
      'Custom built-ins',
      'Chair rails & picture rails'
    ]
  },
  {
    icon: '/api/assets/icons/flooring.png',
    name: 'Flooring Services',
    description: 'From installation to repair, we handle all your flooring needs.',
    items: [
      'Hardwood installation',
      'Laminate flooring',
      'Vinyl plank installation',
      'Subfloor repair',
      'Floor refinishing',
      'Threshold transitions'
    ]
  },
  {
    icon: '/api/assets/icons/deck.png',
    name: 'Deck Repair & Restoration',
    description: 'Bring your outdoor space back to life.',
    items: [
      'Board replacement',
      'Rail repair & replacement',
      'Staining & sealing',
      'Structural repairs',
      'Post replacement',
      'Full deck restoration'
    ]
  },
  {
    icon: '/api/assets/icons/maintenance.png',
    name: 'General Maintenance',
    description: 'Handyman services for all your home repair needs.',
    items: [
      'Door hanging & adjustment',
      'Cabinet repairs',
      'Shelving installation',
      'Drywall patches',
      'Minor plumbing fixes',
      'General home repairs'
    ]
  }
];

export const servicesPage = (c: Context) => {
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">Our Services</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">Cabin Maintenance plans + quality craftsmanship for Hochatown and Southeast Oklahoma</p>
    </section>

    <!-- 🏕️ VACATION RENTAL MAINTENANCE → PRIMARY OFFERING -->
    <section class="container" style="margin-top: 2rem; padding: 3rem 0; background: linear-gradient(180deg, rgba(139, 69, 19, 0.1) 0%, transparent 100%); border-radius: 20px;">
      <h2 class="section-title">🏕️ Vacation Rental Maintenance</h2>
      <p class="section-subtitle">Proactive care for Hochatown cabins — we keep your property guest-ready year-round</p>

      <!-- Subscription Plans -->
      <div class="grid grid-3" style="max-width: 1100px; margin: 2rem auto;">
        <div class="card" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏠</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.cabinCare.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 0.5rem 0;">$${subscriptionPlans.cabinCare.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">${subscriptionPlans.cabinCare.hours} hour/mo · 1-2 BR cabins</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.9rem;">
            ${subscriptionPlans.cabinCare.features.map(f => `<li style="padding: 0.4rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/pricing" class="btn btn-secondary" style="margin-top: 1rem; display: block;">View Plan Details</a>
        </div>
        <div class="card" style="text-align: center; border: 3px solid var(--secondary);">
          <div style="background: var(--secondary); color: white; padding: 0.5rem; margin: -2rem -2rem 1rem; border-radius: 14px 14px 0 0; font-weight: bold;">🏆 MOST POPULAR</div>
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏡</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.lodgeKeeper.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 0.5rem 0;">$${subscriptionPlans.lodgeKeeper.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">${subscriptionPlans.lodgeKeeper.hours} hrs/mo · 3-4 BR lodges</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.9rem;">
            ${subscriptionPlans.lodgeKeeper.features.map(f => `<li style="padding: 0.4rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/pricing" class="btn btn-primary" style="margin-top: 1rem; display: block;">View Plan Details</a>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏔️</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.premiumCare.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 0.5rem 0;">$${subscriptionPlans.premiumCare.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">${subscriptionPlans.premiumCare.hours} hrs/mo · 5+ BR luxury cabins</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.9rem;">
            ${subscriptionPlans.premiumCare.features.map(f => `<li style="padding: 0.4rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/pricing" class="btn btn-secondary" style="margin-top: 1rem; display: block;">View Plan Details</a>
        </div>
      </div>

      <!-- Full 6-Point Vacation Rental Checklist -->
      <div style="max-width: 900px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <h3 style="text-align: center; color: var(--primary); font-family: 'Playfair Display', serif; margin-bottom: 1.5rem;">📋 Every Visit Follows Our 6-Point Checklist</h3>
        <div class="grid grid-3" style="gap: 1.5rem;">
          <div>
            <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">1. 🔒 Safety</h4>
            <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: #555;">
              <li style="padding: 0.2rem 0;">✓ Smoke/CO detector test</li>
              <li style="padding: 0.2rem 0;">✓ Fire extinguisher check</li>
              <li style="padding: 0.2rem 0;">✓ Window/door locks</li>
              <li style="padding: 0.2rem 0;">✓ Furniture anchors</li>
              <li style="padding: 0.2rem 0;">✓ Walkway trip hazards</li>
            </ul>
          </div>
          <div>
            <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">2. 🏠 Interior</h4>
            <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: #555;">
              <li style="padding: 0.2rem 0;">✓ Walls & trim touch-ups</li>
              <li style="padding: 0.2rem 0;">✓ Cabinet/drawer hardware</li>
              <li style="padding: 0.2rem 0;">✓ Flooring & transitions</li>
              <li style="padding: 0.2rem 0;">✓ Window screens & glass</li>
              <li style="padding: 0.2rem 0;">✓ Towel racks & fixtures</li>
            </ul>
          </div>
          <div>
            <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">3. 🎮 Amenities</h4>
            <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: #555;">
              <li style="padding: 0.2rem 0;">✓ TVs & sound systems</li>
              <li style="padding: 0.2rem 0;">✓ Wi-Fi connection test</li>
              <li style="padding: 0.2rem 0;">✓ Light bulbs & fixtures</li>
              <li style="padding: 0.2rem 0;">✓ Pool tables & games</li>
              <li style="padding: 0.2rem 0;">✓ Small appliances</li>
            </ul>
          </div>
          <div>
            <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">4. 🔧 Mechanicals</h4>
            <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: #555;">
              <li style="padding: 0.2rem 0;">✓ HVAC filter replacement</li>
              <li style="padding: 0.2rem 0;">✓ Battery replacements</li>
              <li style="padding: 0.2rem 0;">✓ Plumbing test (drains)</li>
              <li style="padding: 0.2rem 0;">✓ Under-sink leak check</li>
              <li style="padding: 0.2rem 0;">✓ Showerhead descaling</li>
            </ul>
          </div>
          <div>
            <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">5. 🌲 Exterior</h4>
            <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: #555;">
              <li style="padding: 0.2rem 0;">✓ Deck/balcony inspection</li>
              <li style="padding: 0.2rem 0;">✓ Foundation vents & gaps</li>
              <li style="padding: 0.2rem 0;">✓ Roof & siding check</li>
              <li style="padding: 0.2rem 0;">✓ HVAC condenser cleaning</li>
              <li style="padding: 0.2rem 0;">✓ Debris removal</li>
            </ul>
          </div>
          <div>
            <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">6. 🌤️ Seasonal</h4>
            <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: #555;">
              <li style="padding: 0.2rem 0;">✓ Gutter cleaning</li>
              <li style="padding: 0.2rem 0;">✓ Pool/spa care</li>
              <li style="padding: 0.2rem 0;">✓ Freeze prep (pipes)</li>
              <li style="padding: 0.2rem 0;">✓ Wildfire fuel reduction</li>
              <li style="padding: 0.2rem 0;">✓ Weatherstripping</li>
            </ul>
          </div>
        </div>
        <div style="text-align: center; margin-top: 1.5rem;">
          <p style="color: #666; font-size: 0.9rem; font-style: italic;">Remote owners receive a photo report after every visit</p>
        </div>
      </div>
      
      <!-- Call to action -->
      <div style="text-align: center; margin-top: 1.5rem;">
        <a href="/pricing" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2.5rem;">See Full Pricing & Add-Ons →</a>
      </div>
    </section>

    <!-- 🔧 Handyman Services → SECONDARY -->
    <section class="container" style="margin-top: 3rem;">
      <h2 class="section-title">🔧 Handyman & Renovation Services</h2>
      <p class="section-subtitle">Quality craftsmanship for homes and cabins in Southeast Oklahoma</p>
      
      <div class="grid grid-2">
        ${services.map(service => `
          <div class="card">
            <img src="${service.icon}" alt="${service.name}" style="width: 80px; height: 80px; margin-bottom: 1rem;">
            <h3 style="font-size: 1.5rem; color: var(--primary); margin-bottom: 0.5rem;">${service.name}</h3>
            <p style="color: #666; margin-bottom: 1.5rem;">${service.description}</p>
            <ul style="list-style: none; padding: 0;">
              ${service.items.map(item => `
                <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="color: var(--secondary);">✓</span> ${item}
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </section>
    
    <!-- Pricing -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">One-Time Handyman Rates</h2>
      <p class="section-subtitle">Need something fixed or installed? Single visit pricing.</p>
      <p style="text-align: center; color: #666; margin-bottom: 2rem;">No hidden fees. You pay for materials directly.</p>
      
      <div class="grid grid-2" style="max-width: 700px; margin: 0 auto; gap: 1.5rem;">
        <div class="card">
          <h3 style="color: var(--primary); margin-bottom: 1rem; font-family: 'Playfair Display', serif;">Labor Rates</h3>
          <div style="border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem;">
            <p style="color: #666; margin: 0;">Half Day (≤6 hours)</p>
            <p style="font-size: 1.75rem; font-weight: bold; color: var(--secondary); margin: 0.5rem 0 0;">$${pricing.labor.underSixHours}</p>
          </div>
          <div>
            <p style="color: #666; margin: 0;">Full Day (6+ hours)</p>
            <p style="font-size: 1.75rem; font-weight: bold; color: var(--secondary); margin: 0.5rem 0 0;">$${pricing.labor.overSixHours}/day</p>
          </div>
        </div>
        <div class="card">
          <h3 style="color: var(--primary); margin-bottom: 1rem; font-family: 'Playfair Display', serif;">Helper Rates</h3>
          <div style="border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem;">
            <p style="color: #666; margin: 0;">Half Day (≤6 hours)</p>
            <p style="font-size: 1.75rem; font-weight: bold; color: var(--secondary); margin: 0.5rem 0 0;">$${pricing.helper.underSixHours}</p>
          </div>
          <div>
            <p style="color: #666; margin: 0;">Full Day (6+ hours)</p>
            <p style="font-size: 1.75rem; font-weight: bold; color: var(--secondary); margin: 0.5rem 0 0;">$${pricing.helper.overSixHours}/day</p>
          </div>
        </div>
      </div>
      
      <div style="max-width: 600px; margin: 1.5rem auto 0; padding: 1rem; background: #f9f9f9; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 0.9rem;">
          <strong>Note:</strong> ${pricing.notes}
        </p>
      </div>
    </section>
    
    <!-- Special Offers -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">💰 Special Offers</h2>
      <div class="grid grid-3">
        <div class="card" style="border: 2px solid var(--secondary); text-align: center;">
          <div style="background: var(--secondary); color: white; padding: 0.5rem; margin: -2rem -2rem 1.5rem; border-radius: 14px 14px 0 0; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <img src="/api/assets/icons/new-badge.png" alt="New" style="width: 24px; height: 24px;">
            NEW CUSTOMERS
          </div>
          <h3 style="color: var(--primary); font-size: 1.75rem;">10% OFF</h3>
          <p style="color: #666;">Your first job with us</p>
          <p style="font-size: 0.85rem; color: #999; margin-top: 1rem;">+ Free consultation</p>
        </div>
        <div class="card" style="border: 2px solid var(--secondary); text-align: center;">
          <div style="background: var(--secondary); color: white; padding: 0.5rem; margin: -2rem -2rem 1.5rem; border-radius: 14px 14px 0 0; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <img src="/api/assets/icons/schedule.png" alt="Schedule" style="width: 24px; height: 24px;">
            FLEXIBLE SCHEDULING
          </div>
          <h3 style="color: var(--primary); font-size: 1.75rem;">5% OFF</h3>
          <p style="color: #666;">Book our open time slots</p>
          <p style="font-size: 0.85rem; color: #999; margin-top: 1rem;">We fill gaps, you save</p>
        </div>
        <div class="card" style="border: 2px solid var(--secondary); text-align: center;">
          <div style="background: var(--secondary); color: white; padding: 0.5rem; margin: -2rem -2rem 1.5rem; border-radius: 14px 14px 0 0; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <img src="/api/assets/icons/discount.png" alt="Discount" style="width: 24px; height: 24px;">
            REFERRAL BONUS
          </div>
          <h3 style="color: var(--primary); font-size: 1.75rem;">$25 OFF</h3>
          <p style="color: #666;">For you AND your friend</p>
          <p style="font-size: 0.85rem; color: #999; margin-top: 1rem;">Both save on your next job</p>
        </div>
      </div>
    </section>
    
    <section class="container" style="margin-top: 4rem; text-align: center;">
      <a href="/contact" class="btn btn-primary" style="font-size: 1.25rem;">Get Your Free Quote →</a>
    </section>
  `;
  
    return c.html(layout('Services', content, 'services', {
    description: "Vacation rental cabin maintenance with our 6-point checklist, plus handyman services for SE Oklahoma homes. Monthly plans from $199.",
    canonical: "/services",
  }));
};