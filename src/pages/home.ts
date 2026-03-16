import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { business, pricing } = siteConfig;

export const homePage = (c: Context) => {
  const content = `
    <style>
      .home-hero-title { font-size: 4rem; }
      .home-hero-tagline { font-size: 1.5rem; }
      .home-pricing-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
      }

      @media (max-width: 900px) {
        .home-hero-title { font-size: 2.75rem; }
      }

      @media (max-width: 600px) {
        .home-hero-title { font-size: 2.1rem; }
        .home-hero-tagline { font-size: 1.1rem; }
        .home-pricing-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }
      }
    </style>

    <!-- Hero Section -->
    <section style="
      padding: 6rem 2rem;
      text-align: center;
      background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);
    ">
      <img 
        src="/api/assets/beaver-avatar.png" 
        alt="${business.name} mascot"
        style="width: 200px; height: 200px; border-radius: 50%; border: 4px solid var(--secondary); box-shadow: 0 0 40px var(--card-glow);"
      >
      <h1 class="home-hero-title" style="
        font-family: 'Playfair Display', serif;
        color: var(--accent);
        margin: 1.5rem 0;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
      ">${business.name}</h1>
      <p class="home-hero-tagline" style="
        color: var(--secondary);
        max-width: 600px;
        margin: 0 auto 2rem;
      ">${business.tagline}</p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="/quote" class="btn btn-primary" style="font-size: 1.25rem;">💰 Get Instant Quote</a>
        <a href="/visualize" class="btn btn-secondary">See Your Project Come to Life ✨</a>
      </div>
    </section>
    
    <!-- Services Preview -->
    <section class="container">
      <h2 class="section-title">What We Do</h2>
      <p class="section-subtitle">Quality craftsmanship for your home</p>
      
      <div class="grid grid-4">
        <a href="/services#carpentry" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <span class="service-icon">🔨</span>
          <h3>Trim Carpentry</h3>
          <p style="color: #666; margin-top: 0.5rem;">Crown molding, baseboards, door frames, and custom woodwork</p>
          <span class="learn-more" style="margin-top: 1rem;">Learn More</span>
        </a>
        <a href="/services#flooring" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <span class="service-icon">🏠</span>
          <h3>Flooring</h3>
          <p style="color: #666; margin-top: 0.5rem;">Installation, repair, and refinishing for all floor types</p>
          <span class="learn-more" style="margin-top: 1rem;">Learn More</span>
        </a>
        <a href="/services#deck" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <span class="service-icon">🪵</span>
          <h3>Deck Repair</h3>
          <p style="color: #666; margin-top: 0.5rem;">Restoration, board replacement, and sealing</p>
          <span class="learn-more" style="margin-top: 1rem;">Learn More</span>
        </a>
        <a href="/services#maintenance" class="card service-card" style="text-align: center; text-decoration: none; color: inherit;">
          <span class="service-icon">🔧</span>
          <h3>Maintenance</h3>
          <p style="color: #666; margin-top: 0.5rem;">General repairs and home improvement projects</p>
          <span class="learn-more" style="margin-top: 1rem;">Learn More</span>
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <a href="/services" class="btn btn-secondary">View All Services →</a>
      </div>
    </section>
    
    <!-- Pricing Section -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Simple, Honest Pricing</h2>
      <p class="section-subtitle">No hidden fees. You pay for materials directly.</p>
      
      <div class="grid grid-2" style="max-width: 800px; margin: 0 auto;">
        <div class="card">
          <h3 style="color: var(--primary); font-size: 1.5rem; margin-bottom: 1rem;">Labor Rates</h3>
          <div class="home-pricing-row" style="border-bottom: 1px solid #eee;">
            <span>Half Day (≤6 hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.labor.underSixHours}</span>
          </div>
          <div class="home-pricing-row">
            <span>Full Day (6+ hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.labor.overSixHours}/day</span>
          </div>
        </div>
        
        <div class="card">
          <h3 style="color: var(--primary); font-size: 1.5rem; margin-bottom: 1rem;">Helper Rates</h3>
          <div class="home-pricing-row" style="border-bottom: 1px solid #eee;">
            <span>Half Day (≤6 hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.helper.underSixHours}</span>
          </div>
          <div class="home-pricing-row">
            <span>Full Day (6+ hours)</span>
            <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">$${pricing.helper.overSixHours}/day</span>
          </div>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 2rem; color: var(--accent); font-style: italic;">
        ${pricing.notes}
      </p>
    </section>
    
    <!-- AI Visualizer Teaser -->
    <section class="container" style="margin-top: 4rem;">
      <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; text-align: center; padding: 3rem;">
        <h2 style="font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 1rem;">
          ✨ See Your Project Before We Start
        </h2>
        <p style="max-width: 600px; margin: 0 auto 1.5rem; font-size: 1.1rem;">
          Upload a photo of your space and our AI will show you what your finished project could look like!
        </p>
        <a href="/visualize" class="btn" style="background: white; color: var(--primary);">Try AI Visualizer Free</a>
        <p style="margin-top: 1rem; font-size: 0.85rem; opacity: 0.9;">
          New visitors get 3 free visualizations • Customers get unlimited access
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
            Follow on Instagram →
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
            Like on Facebook →
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
    </script>

    <!-- CTA Section -->
    <section class="container" style="margin-top: 4rem; text-align: center;">
      <h2 class="section-title">Ready to Get Started?</h2>
      <p class="section-subtitle">Contact us for a free consultation and quote</p>
      <a href="/contact" class="btn btn-primary" style="font-size: 1.25rem; padding: 1.25rem 3rem;">
        Request Free Quote 🦫
      </a>
    </section>
  `;
  
  return c.html(layout('Home', content, 'home'));
};
