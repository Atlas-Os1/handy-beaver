import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { serviceBlocks, subscriptionPlans, tinyHomePackages } = siteConfig;

export const pricingPage = (c: Context) => {
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">Simple, Honest Pricing</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">No hidden fees. You pay for materials directly.</p>
    </section>
    
    <!-- Service Blocks (One-Time) -->
    <section class="container" style="margin-top: 2rem;">
      <h2 class="section-title">🔧 Service Blocks</h2>
      <p class="section-subtitle">One-time handyman visits — book when you need us</p>
      
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
            <li style="padding: 0.3rem 0;">✓ Home assessments</li>
          </ul>
          <a href="/quote?block=service-call" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Book Now</a>
        </div>
        
        <!-- Half Day -->
        <div class="card" style="text-align: center; position: relative; border: 3px solid var(--secondary);">
          <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--secondary); color: white; padding: 0.25rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">MOST POPULAR</div>
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏠</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${serviceBlocks.halfDay.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${serviceBlocks.halfDay.price}</p>
          <p style="color: #666; margin-bottom: 1rem;">${serviceBlocks.halfDay.hours} hours of work</p>
          <ul style="list-style: none; padding: 0; text-align: left; font-size: 0.9rem; color: #666;">
            <li style="padding: 0.3rem 0;">✓ Medium projects</li>
            <li style="padding: 0.3rem 0;">✓ Multiple small tasks</li>
            <li style="padding: 0.3rem 0;">✓ Deck/trim repairs</li>
          </ul>
          <a href="/quote?block=half-day" class="btn btn-primary" style="margin-top: 1.5rem; display: block;">Book Now</a>
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
    
    <!-- Monthly Subscription Plans -->
    <section class="container" style="margin-top: 4rem; padding: 3rem 0; background: linear-gradient(180deg, rgba(139, 69, 19, 0.1) 0%, transparent 100%); border-radius: 20px;">
      <h2 class="section-title">🦫 Beaver Maintenance Plans</h2>
      <p class="section-subtitle">Monthly subscription — guaranteed hours, priority scheduling</p>
      
      <div class="grid grid-3" style="max-width: 900px; margin: 2rem auto;">
        <!-- Basic -->
        <div class="card" style="text-align: center;">
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.basic.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${subscriptionPlans.basic.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1.5rem;">${subscriptionPlans.basic.hours} hour per month</p>
          <ul style="list-style: none; padding: 0; text-align: left;">
            ${subscriptionPlans.basic.features.map(f => `<li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/contact?plan=basic" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Get Started</a>
        </div>
        
        <!-- Standard -->
        <div class="card" style="text-align: center; border: 3px solid var(--secondary);">
          <div style="background: var(--secondary); color: white; padding: 0.5rem; margin: -2rem -2rem 1rem; border-radius: 14px 14px 0 0; font-weight: bold;">BEST VALUE</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.standard.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${subscriptionPlans.standard.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1.5rem;">${subscriptionPlans.standard.hours} hours per month</p>
          <ul style="list-style: none; padding: 0; text-align: left;">
            ${subscriptionPlans.standard.features.map(f => `<li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/contact?plan=standard" class="btn btn-primary" style="margin-top: 1.5rem; display: block;">Get Started</a>
        </div>
        
        <!-- Premium -->
        <div class="card" style="text-align: center;">
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${subscriptionPlans.premium.label}</h3>
          <p style="font-size: 2.5rem; font-weight: bold; color: var(--secondary); margin: 1rem 0;">$${subscriptionPlans.premium.price}<span style="font-size: 1rem; color: #666;">/mo</span></p>
          <p style="color: #666; margin-bottom: 1.5rem;">${subscriptionPlans.premium.hours} hours per month</p>
          <ul style="list-style: none; padding: 0; text-align: left;">
            ${subscriptionPlans.premium.features.map(f => `<li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">✓ ${f}</li>`).join('')}
          </ul>
          <a href="/contact?plan=premium" class="btn btn-secondary" style="margin-top: 1.5rem; display: block;">Get Started</a>
        </div>
      </div>
      
      <div style="max-width: 700px; margin: 2rem auto; padding: 1.5rem; background: #fff; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem;">How Subscriptions Work</h4>
        <p style="color: #666; margin: 0; font-size: 0.95rem;">
          Upload photos of tasks via your portal or Lil Beaver chat. We sort by urgency and schedule your guaranteed hours each month. 
          Unused time doesn't roll over, but we'll use it for a home checkup to catch issues early!
        </p>
      </div>
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
          <span>Licensed</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">🛡️</span>
          <span>Insured</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">⭐</span>
          <span>Local SE Oklahoma</span>
        </div>
      </div>
    </section>
    
    <!-- Final CTA -->
    <section class="container" style="margin-top: 4rem; text-align: center; padding-bottom: 2rem;">
      <a href="/contact" class="btn btn-primary" style="font-size: 1.25rem; padding: 1rem 2rem;">Questions? Contact Us →</a>
    </section>
  `;
  
  return c.html(layout('Pricing', content, 'pricing'));
};
