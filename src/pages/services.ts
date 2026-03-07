import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { pricing } = siteConfig;

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
      <p class="section-subtitle" style="font-size: 1.25rem;">Quality craftsmanship for Southeast Oklahoma homes</p>
    </section>
    
    <section class="container">
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
      <h2 class="section-title">Transparent Pricing</h2>
      <p class="section-subtitle">Simple rates, no surprises</p>
      
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--primary);">
              <th style="text-align: left; padding: 1rem; color: var(--primary);">Service</th>
              <th style="text-align: center; padding: 1rem; color: var(--primary);">Half Day (≤6 hrs)</th>
              <th style="text-align: center; padding: 1rem; color: var(--primary);">Full Day</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 1rem;">Skilled Labor</td>
              <td style="padding: 1rem; text-align: center; font-weight: bold;">$${pricing.labor.underSixHours}</td>
              <td style="padding: 1rem; text-align: center; font-weight: bold;">$${pricing.labor.overSixHours}/day</td>
            </tr>
            <tr>
              <td style="padding: 1rem;">Helper/Assistant</td>
              <td style="padding: 1rem; text-align: center; font-weight: bold;">$${pricing.helper.underSixHours}</td>
              <td style="padding: 1rem; text-align: center; font-weight: bold;">$${pricing.helper.overSixHours}/day</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-radius: 8px;">
          <p style="margin: 0; color: #666;">
            <strong>Note:</strong> ${pricing.notes}
          </p>
        </div>
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
  
  return c.html(layout('Services', content, 'services'));
};
