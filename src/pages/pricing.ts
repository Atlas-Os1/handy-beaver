import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { serviceBlocks, subscriptionPlans, tinyHomePackages, cabinAddOns } = siteConfig;

export const pricingPage = (c: Context) => {
  const content = `
    <!-- Hero Section — Cabin Maintenance Focus -->
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">🏕️ Cabin Maintenance Plans</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">Protect your vacation rental investment — proactive care for Hochatown cabins</p>
    </section>
    
    <!-- Cabin Subscription Plans — PRIMARY OFFERING -->
    <section class="container" style="margin-top: 2rem; padding: 3rem 0; background: linear-gradient(180deg, rgba(139, 69, 19, 0.1) 0%, transparent 100%); border-radius: 20px;">
      <h2 class="section-title">🦫 Vacation Rental Maintenance</h2>
      <p class="section-subtitle">Monthly subscriptions — guaranteed hours, peace of mind for remote cabin owners</p>
      
      <div class="grid grid-3" style="max-width: 1100px; margin: 2rem auto;">
        <!-- Cabin Care -->
        <div class="card" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏠</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.cabinCare.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${subscriptionPlans.cabinCare.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1.5rem;">${subscriptionPlans.cabinCare.hours} hour per month</p>
          <ul style="list-style: none; padding: 0; text-align: left;">
            ${subscriptionPlans.cabinCare.features.map(f => `<li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/contact?plan=cabin-care" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Get Started</a>
        </div>
        
        <!-- Lodge Keeper — BEST VALUE -->
        <div class="card" style="text-align: center; border: 3px solid var(--secondary);">
          <div style="background: var(--secondary); color: white; padding: 0.5rem; margin: -2rem -2rem 1rem; border-radius: 14px 14px 0 0; font-weight: bold;">🏆 MOST POPULAR</div>
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏡</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.lodgeKeeper.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${subscriptionPlans.lodgeKeeper.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1.5rem;">${subscriptionPlans.lodgeKeeper.hours} hours per month</p>
          <ul style="list-style: none; padding: 0; text-align: left;">
            ${subscriptionPlans.lodgeKeeper.features.map(f => `<li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/contact?plan=lodge-keeper" class="btn btn-primary" style="margin-top: 1.5rem; display: block;">Get Started</a>
        </div>
        
        <!-- Premium Care -->
        <div class="card" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏔️</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.premiumCare.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${subscriptionPlans.premiumCare.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1.5rem;">${subscriptionPlans.premiumCare.hours} hours per month</p>
          <ul style="list-style: none; padding: 0; text-align: left;">
            ${subscriptionPlans.premiumCare.features.map(f => `<li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/contact?plan=premium-care" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Get Started</a>
        </div>
      </div>
      
      <!-- How Subscriptions Work -->
      <div style="max-width: 700px; margin: 2rem auto; padding: 1.5rem; background: #fff; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem;">How It Works</h4>
        <p style="color: #666; margin: 0; font-size: 0.95rem;">
          We handle a full inspection checklist every visit. Remote owners get a photo report + status update. 
          Tasks are tracked through your customer portal — just upload photos of what needs attention.
        </p>
      </div>
    </section>
    
    <!-- Add-On Services -->
    <section class="container" style="margin-top: 3rem;">
      <h2 class="section-title">🔧 Add-On Services</h2>
      <p class="section-subtitle">Enhance your plan with cabin-specific extras</p>
      
      <div class="grid grid-4" style="max-width: 1000px; margin: 2rem auto;">
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🫧</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">${cabinAddOns.hotTubService.label}</h4>
          <p style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">$${cabinAddOns.hotTubService.price}<span style="font-size: 0.9rem; color: #666;">/mo</span></p>
          <p style="color: #666; font-size: 0.85rem;">${cabinAddOns.hotTubService.description}</p>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">❄️</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">${cabinAddOns.winterization.label}</h4>
          <p style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">$${cabinAddOns.winterization.price}<span style="font-size: 0.9rem; color: #666;">/season</span></p>
          <p style="color: #666; font-size: 0.85rem;">${cabinAddOns.winterization.description}</p>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📋</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">${cabinAddOns.deepInspection.label}</h4>
          <p style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">$${cabinAddOns.deepInspection.price}<span style="font-size: 0.9rem; color: #666;">/qtr</span></p>
          <p style="color: #666; font-size: 0.85rem;">${cabinAddOns.deepInspection.description}</p>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💰</div>
          <h4 style="color: var(--primary); margin-bottom: 0.25rem;">${cabinAddOns.annualBilling.label}</h4>
          <p style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">${cabinAddOns.annualBilling.savings}<span style="font-size: 0.9rem; color: #666;"> saved</span></p>
          <p style="color: #666; font-size: 0.85rem;">${cabinAddOns.annualBilling.description}</p>
        </div>
      </div>
    </section>
    
    <!-- One-Time Handyman Services — SECONDARY -->
    <section class="container" style="margin-top: 3rem;">
      <h2 class="section-title">🔧 Handyman Services</h2>
      <p class="section-subtitle">One-time visits for repairs, installations, and projects</p>
      
      <div class="grid grid-3" style="max-width: 900px; margin: 2rem auto;">
        <!-- Service Call -->
        <div class="card" style="text-align: center; position: relative;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⏱️</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${serviceBlocks.serviceCall.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${serviceBlocks.serviceCall.price}</p>
          <p style="color: #666; margin-bottom: 1rem;">${serviceBlocks.serviceCall.hours} hours of work</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.9rem; color: #666;">
            <li style="padding: 0.3rem 0;">✓ Quick fixes & repairs</li>
            <li style="padding: 0.3rem 0;">✓ Minor installations</li>
            <li style="padding: 0.3rem 0;">✓ One-off maintenance</li>
          </ul>
          <a href="/quote?block=service-call" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Book Now</a>
        </div>
        
        <!-- Half Day -->
        <div class="card" style="text-align: center; position: relative;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏠</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${serviceBlocks.halfDay.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${serviceBlocks.halfDay.price}</p>
          <p style="color: #666; margin-bottom: 1rem;">${serviceBlocks.halfDay.hours} hours of work</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.9rem; color: #666;">
            <li style="padding: 0.3rem 0;">✓ Medium projects</li>
            <li style="padding: 0.3rem 0;">✓ Multiple small tasks</li>
            <li style="padding: 0.3rem 0;">✓ Deck/trim repairs</li>
          </ul>
          <a href="/quote?block=half-day" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Book Now</a>
        </div>
        
        <!-- Full Day -->
        <div class="card" style="text-align: center; position: relative;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏡</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${serviceBlocks.fullDay.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${serviceBlocks.fullDay.price}</p>
          <p style="color: #666; margin-bottom: 1rem;">${serviceBlocks.fullDay.hours} hours of work</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.9rem; color: #666;">
            <li style="padding: 0.3rem 0;">✓ Large single projects</li>
            <li style="padding: 0.3rem 0;">✓ Full room renovations</li>
            <li style="padding: 0.3rem 0;">✓ Best value per hour</li>
          </ul>
          <a href="/quote?block=full-day" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Book Now</a>
        </div>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 1rem;">
        <strong>Note:</strong> Materials billed separately at cost. No markup.
      </p>
    </section>
    
    <!-- Large Projects CTA -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">🔨 Larger Projects?</h2>
      <p class="section-subtitle">Flooring, wallboard, tile, decking, and tiny home finishes</p>
      
      <div class="grid grid-2" style="max-width: 800px; margin: 2rem auto; gap: 2rem;">
        <!-- Residential Projects -->
        <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white;">
          <h3 style="margin: 0 0 1rem;">Residential Projects</h3>
          <p style="opacity: 0.9; margin-bottom: 1rem;">Quoted by square footage:</p>
          <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
            <li style="padding: 0.3rem 0;">• Wallboard/Drywall: $3-5/sq.ft.</li>
            <li style="padding: 0.3rem 0;">• Flooring: $4-15/sq.ft.</li>
            <li style="padding: 0.3rem 0;">• Tile: $8-15/sq.ft.</li>
            <li style="padding: 0.3rem 0;">• Decking: $15-25/sq.ft.</li>
          </ul>
          <a href="/quote?type=residential" class="btn" style="background: white; color: var(--primary); display: block; text-align: center;">Get a Quote</a>
        </div>
        
        <!-- Tiny Home Packages -->
        <div class="card" style="background: linear-gradient(135deg, #2C1810, #4a2c1a); color: white;">
          <h3 style="margin: 0 0 1rem;">Tiny Home Finish</h3>
          <p style="opacity: 0.9; margin-bottom: 1rem;">Complete interior packages:</p>
          <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
            <li style="padding: 0.3rem 0;">🏠 <strong>${tinyHomePackages.modernMinimal.label}:</strong> $${tinyHomePackages.modernMinimal.pricePerSqft}/sq.ft.</li>
            <li style="padding: 0.3rem 0;">🪵 <strong>${tinyHomePackages.rusticCabin.label}:</strong> $${tinyHomePackages.rusticCabin.pricePerSqft}/sq.ft.</li>
          </ul>
          <p style="opacity: 0.7; font-size: 0.85rem; margin-bottom: 1rem;">For builds under 1,000 sq.ft.</p>
          <a href="/tiny-homes" class="btn" style="background: white; color: var(--primary); display: block; text-align: center;">View Packages</a>
        </div>
      </div>
    </section>
    
    <!-- Trust Badges -->
    <section class="container" style="margin-top: 4rem; text-align: center;">
      <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; opacity: 0.8;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">✅</span>
          <span>Licensed & Insured</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">⭐</span>
          <span>5-Star Rated</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">📸</span>
          <span>Photo Reports Included</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">🏔️</span>
          <span>Local SE Oklahoma</span>
        </div>
      </div>
    </section>
    
    <!-- Final CTA -->
    <section class="container" style="margin-top: 4rem; text-align: center; padding-bottom: 2rem;">
      <div style="max-width: 600px; margin: 0 auto; padding: 2rem; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Remote Owner? No Problem.</h3>
        <p style="color: #666; margin-bottom: 1.5rem;">We handle everything and send you a full report. Your cabin stays in top shape between guests.</p>
        <a href="/contact" class="btn btn-primary" style="font-size: 1.25rem; padding: 1rem 2rem;">Get Started Today →</a>
      </div>
    </section>
  `;
  
    return c.html(layout('Pricing', content, 'pricing', {
    description: "Cabin maintenance plans from $199/mo. Hot tub service, winterization, HVAC tune-ups for Hochatown cabins. Handyman rates too.",
    canonical: "/pricing",
  }));
};