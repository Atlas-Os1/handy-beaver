import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { business } = siteConfig;

// Service area data
const serviceAreas = {
  primary: {
    label: "Primary Service Area",
    description: "Same-week scheduling available",
    towns: [
      { name: "Idabel", county: "McCurtain" },
      { name: "Broken Bow", county: "McCurtain" },
      { name: "Hochatown", county: "McCurtain" },
      { name: "Valliant", county: "McCurtain" },
      { name: "Wright City", county: "McCurtain" },
      { name: "Haworth", county: "McCurtain" },
      { name: "Garvin", county: "McCurtain" },
      { name: "Eagletown", county: "McCurtain" },
    ],
  },
  extended: {
    label: "Extended Service Area",
    description: "Scheduling within 1-2 weeks",
    towns: [
      { name: "Hugo", county: "Choctaw" },
      { name: "Fort Towson", county: "Choctaw" },
      { name: "Soper", county: "Choctaw" },
      { name: "Spencerville", county: "Choctaw" },
      { name: "Antlers", county: "Pushmataha" },
      { name: "Clayton", county: "Pushmataha" },
      { name: "Rattan", county: "Pushmataha" },
      { name: "Talihina", county: "LeFlore" },
    ],
  },
  arkansas: {
    label: "Arkansas Border",
    description: "Available for larger projects",
    towns: [
      { name: "De Queen", county: "Sevier, AR" },
      { name: "Horatio", county: "Sevier, AR" },
      { name: "Ashdown", county: "Little River, AR" },
      { name: "Foreman", county: "Little River, AR" },
    ],
  },
};

export const serviceAreaPage = (c: Context) => {
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">Service Area</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">Proudly serving Southeast Oklahoma and the Arkansas border</p>
    </section>
    
    <!-- Map Placeholder -->
    <section class="container" style="margin-top: 2rem;">
      <div style="max-width: 900px; margin: 0 auto;">
        <div class="card" style="padding: 0; overflow: hidden; aspect-ratio: 16/9;">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d425678.3087814744!2d-95.2!3d34.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x863c3c0e7b04a2a7%3A0x2b3f1c5e2b8f8b0a!2sMcCurtain%20County%2C%20OK!5e0!3m2!1sen!2sus!4v1710000000000" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
        <p style="text-align: center; color: #888; font-size: 0.9rem; margin-top: 1rem;">
          Based in McCurtain County • Serving a 75+ mile radius
        </p>
      </div>
    </section>
    
    <!-- Service Zones -->
    <section class="container" style="margin-top: 3rem;">
      <div class="grid grid-3" style="max-width: 1000px; margin: 0 auto;">
        
        <!-- Primary -->
        <div class="card" style="border-top: 4px solid var(--secondary);">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <span style="font-size: 1.5rem;">📍</span>
            <h3 style="color: var(--primary); margin: 0;">${serviceAreas.primary.label}</h3>
          </div>
          <p style="color: var(--secondary); font-size: 0.9rem; margin-bottom: 1rem;">
            ${serviceAreas.primary.description}
          </p>
          <ul style="list-style: none; padding: 0;">
            ${serviceAreas.primary.towns.map(t => `
              <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>${t.name}</span>
                <span style="color: #888; font-size: 0.85rem;">${t.county}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <!-- Extended -->
        <div class="card">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <span style="font-size: 1.5rem;">🚗</span>
            <h3 style="color: var(--primary); margin: 0;">${serviceAreas.extended.label}</h3>
          </div>
          <p style="color: #888; font-size: 0.9rem; margin-bottom: 1rem;">
            ${serviceAreas.extended.description}
          </p>
          <ul style="list-style: none; padding: 0;">
            ${serviceAreas.extended.towns.map(t => `
              <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>${t.name}</span>
                <span style="color: #888; font-size: 0.85rem;">${t.county}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <!-- Arkansas -->
        <div class="card" style="border-top: 4px solid #666;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <span style="font-size: 1.5rem;">🏔️</span>
            <h3 style="color: var(--primary); margin: 0;">${serviceAreas.arkansas.label}</h3>
          </div>
          <p style="color: #888; font-size: 0.9rem; margin-bottom: 1rem;">
            ${serviceAreas.arkansas.description}
          </p>
          <ul style="list-style: none; padding: 0;">
            ${serviceAreas.arkansas.towns.map(t => `
              <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>${t.name}</span>
                <span style="color: #888; font-size: 0.85rem;">${t.county}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
      </div>
    </section>
    
    <!-- Not in our area? -->
    <section class="container" style="margin-top: 3rem;">
      <div style="max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.1)); padding: 2.5rem; border-radius: 20px; text-align: center;">
        <h3 style="color: var(--primary); margin: 0 0 1rem;">Not seeing your town?</h3>
        <p style="color: #666; margin-bottom: 1.5rem;">
          We consider all requests! For larger projects outside our regular service area, 
          we're often happy to make the trip. Reach out and let's talk.
        </p>
        <a href="/contact" class="btn btn-primary">Contact Us →</a>
      </div>
    </section>
    
    <!-- Why Local Matters -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Why Local Matters</h2>
      
      <div class="grid grid-3" style="max-width: 900px; margin: 2rem auto;">
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚡</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Fast Response</h3>
          <p style="color: #666; font-size: 0.95rem;">
            Being local means faster scheduling and quicker emergency response when things go wrong.
          </p>
        </div>
        
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏠</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Know the Area</h3>
          <p style="color: #666; font-size: 0.95rem;">
            We understand local building styles, weather conditions, and what works best for our region.
          </p>
        </div>
        
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🤝</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Community First</h3>
          <p style="color: #666; font-size: 0.95rem;">
            Your neighbors trust us. We're building long-term relationships, not just doing jobs.
          </p>
        </div>
      </div>
    </section>
    
    <!-- CTA -->
    <section class="container" style="margin-top: 4rem; text-align: center; padding-bottom: 2rem;">
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="/pricing" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem;">View Pricing →</a>
        <a href="/quote" class="btn btn-secondary" style="font-size: 1.1rem; padding: 1rem 2rem;">Get a Quote</a>
      </div>
    </section>
  `;
  
  return c.html(layout('Service Area', content, 'service-area'));
};
