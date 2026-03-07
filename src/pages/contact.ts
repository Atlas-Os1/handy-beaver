import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { business } = siteConfig;

export const contactPage = (c: Context) => {
  const promo = c.req.query('promo');
  const promoText = promo === 'new10' 
    ? `<div style="background: var(--secondary); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; text-align: center;">
        🎉 <strong>New Customer Discount Applied!</strong> You'll receive 10% off + free consultation.
       </div>`
    : '';
  
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">Contact Us</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">Get your free consultation and quote</p>
    </section>
    
    <section class="container">
      <div class="grid grid-2">
        <div class="card">
          <h2 style="color: var(--primary); font-family: 'Playfair Display', serif; margin-bottom: 1.5rem;">
            Request a Quote
          </h2>
          
          ${promoText}
          
          <form action="/api/contact" method="POST" enctype="multipart/form-data" style="display: flex; flex-direction: column; gap: 1rem;">
            <input type="hidden" name="promo" value="${promo || ''}">
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Name *</label>
              <input 
                type="text" 
                name="name" 
                required
                style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
                placeholder="Your name"
              >
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email *</label>
              <input 
                type="email" 
                name="email" 
                required
                style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
                placeholder="your@email.com"
              >
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Phone</label>
              <input 
                type="tel" 
                name="phone"
                style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
                placeholder="(555) 123-4567"
              >
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Service Type *</label>
              <select 
                name="service_type" 
                required
                style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; background: white;"
              >
                <option value="">Select a service...</option>
                <option value="trim_carpentry">Trim Carpentry</option>
                <option value="flooring">Flooring</option>
                <option value="deck_repair">Deck Repair</option>
                <option value="general_maintenance">General Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Project Description *</label>
              <textarea 
                name="description" 
                required
                rows="4"
                style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; resize: vertical;"
                placeholder="Tell us about your project..."
              ></textarea>
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                Photos (optional)
                <span style="font-weight: normal; color: #666; font-size: 0.9rem;"> - Help us understand your project</span>
              </label>
              <input 
                type="file" 
                name="photos" 
                multiple
                accept="image/*"
                style="width: 100%; padding: 0.75rem; border: 2px dashed #ddd; border-radius: 8px; background: #fafafa;"
              >
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Address</label>
              <input 
                type="text" 
                name="address"
                style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
                placeholder="Project location (city/area)"
              >
            </div>
            
            <button type="submit" class="btn btn-primary" style="margin-top: 1rem; width: 100%;">
              Submit Quote Request 🦫
            </button>
          </form>
        </div>
        
        <div>
          <div class="card" style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary); margin-bottom: 1rem;">Contact Information</h3>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">📧</span>
                <div>
                  <strong>Email</strong>
                  <p style="margin: 0; color: #666;">${business.email}</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">📍</span>
                <div>
                  <strong>Service Area</strong>
                  <p style="margin: 0; color: #666;">${business.serviceArea}</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">💬</span>
                <div>
                  <strong>AI Assistant</strong>
                  <p style="margin: 0; color: #666;"><a href="/chat" style="color: var(--primary);">Chat with our AI now</a></p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white;">
            <h3 style="margin-bottom: 1rem;">🎁 Current Offers</h3>
            <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem;">
              <li>✓ <strong>New customers:</strong> 10% off first job</li>
              <li>✓ <strong>Flexible scheduling:</strong> 5% off open slots</li>
              <li>✓ <strong>Referrals:</strong> $25 off for both parties</li>
              <li>✓ <strong>All quotes:</strong> Free consultation</li>
            </ul>
          </div>
          
          <div class="card" style="margin-top: 2rem; text-align: center;">
            <h3 style="color: var(--primary); margin-bottom: 1rem;">See Your Project First!</h3>
            <p style="color: #666; margin-bottom: 1rem;">
              Try our AI Visualizer to see what your finished project could look like.
            </p>
            <a href="/visualize" class="btn btn-secondary">Try AI Visualizer →</a>
          </div>
        </div>
      </div>
    </section>
  `;
  
  return c.html(layout('Contact Us', content, 'contact'));
};
