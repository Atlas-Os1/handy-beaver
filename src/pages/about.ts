import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { business } = siteConfig;

export const aboutPage = (c: Context) => {
  const content = `
    <style>
      .about-hero h1 { font-size: 3rem; margin-top: 1.5rem; }
      .about-feature-row { display: flex; align-items: center; gap: 1rem; text-align: left; }
      .about-media { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
      .about-media-item img,
      .about-media-item video { width: 100%; border-radius: 12px; object-fit: cover; min-height: 240px; }
      .about-media-item p { margin-top: 0.75rem; color: #666; font-size: 0.9rem; }

      @media (max-width: 900px) {
        .about-hero h1 { font-size: 2.25rem; }
        .about-media { grid-template-columns: 1fr; }
      }

      @media (max-width: 600px) {
        .about-feature-row { align-items: flex-start; }
      }
    </style>

    <section class="about-hero" style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <img 
        src="/api/assets/beaver-avatar.png" 
        alt="${business.name} mascot"
        style="width: 150px; height: 150px; border-radius: 50%; border: 4px solid var(--secondary); box-shadow: 0 0 30px var(--card-glow);"
      >
      <h1 class="section-title">About ${business.name}</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">${business.tagline}</p>
    </section>
    
    <section class="container">
      <div class="grid grid-2" style="align-items: center;">
        <div class="card">
          <h2 style="color: var(--primary); font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 1rem;">
            Our Story
          </h2>
          <p style="color: #444; line-height: 1.8; margin-bottom: 1rem;">
            ${business.name} was born from thousands of mitered corners, finished edges, and maintenance issues resolved. With years of experience spanning work as a sub-contractor, trim installer, remodeling and renovation builds, and general maintenance — we can cover just about all of it.
          </p>
          <p style="color: #444; line-height: 1.8; margin-bottom: 1rem;">
            We've helped finish and trim dozens of high-quality vacation rentals, from full custom builds down to guest bathroom installs and simple bulb changes. No job is too small when quality matters.
          </p>
          <p style="color: #444; line-height: 1.8;">
            Let us give your home, rental, or investment property the quality it deserves. We come to you throughout ${business.serviceArea} — no big overhead, no hidden fees. Just honest work at honest prices.
          </p>
        </div>
        
        <div class="card" style="text-align: center;">
          <h3 style="color: var(--primary); font-family: 'Playfair Display', serif; margin-bottom: 2rem;">Why Choose Us?</h3>
          
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div class="about-feature-row">
              <span style="font-size: 2rem;">🛠️</span>
              <div>
                <strong>Experienced Craftsmanship</strong>
                <p style="color: #666; font-size: 0.9rem; margin: 0;">Years of hands-on experience in residential work</p>
              </div>
            </div>
            
            <div class="about-feature-row">
              <span style="font-size: 2rem;">💰</span>
              <div>
                <strong>Transparent Pricing</strong>
                <p style="color: #666; font-size: 0.9rem; margin: 0;">Know exactly what you'll pay before we start</p>
              </div>
            </div>
            
            <div class="about-feature-row">
              <span style="font-size: 2rem;">🚗</span>
              <div>
                <strong>We Come to You</strong>
                <p style="color: #666; font-size: 0.9rem; margin: 0;">Serving all of ${business.serviceArea}</p>
              </div>
            </div>
            
            <div class="about-feature-row">
              <span style="font-size: 2rem;">✨</span>
              <div>
                <strong>AI Project Previews</strong>
                <p style="color: #666; font-size: 0.9rem; margin: 0;">See your finished project before we start</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>

    <section class="container" style="margin-top: 2.5rem;">
      <h2 class="section-title">Meet the Craft Behind the Brand</h2>
      <p class="section-subtitle">A quick look at the person and process behind ${business.name}</p>
      <div class="card">
        <div class="about-media">
          <div class="about-media-item">
            <img src="/api/assets/portfolio/about/headshot.jpg" alt="Owner headshot" loading="lazy">
            <p>Owner portrait from the field.</p>
          </div>
          <div class="about-media-item">
            <video controls preload="metadata" playsinline>
              <source src="/api/assets/portfolio/about/working.mp4" type="video/mp4">
              <source src="/api/assets/portfolio/about/working.mov" type="video/quicktime">
              Your browser does not support embedded video.
            </video>
            <p>On-site work in progress.</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Service Area -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Service Area</h2>
      <p class="section-subtitle">Proudly serving ${business.serviceArea}</p>
      
      <div class="card" style="max-width: 700px; margin: 0 auto; text-align: center;">
        <p style="font-size: 1.1rem; color: #444; margin-bottom: 1.5rem;">
          We travel throughout ${business.serviceArea} to bring quality craftsmanship to your home. 
          No project is too far if it's in our service area.
        </p>
        <p style="color: #666;">
          Not sure if we serve your area? <a href="/contact" style="color: var(--primary);">Contact us</a> and we'll let you know!
        </p>
      </div>
    </section>
    
    <!-- CTA -->
    <section class="container" style="margin-top: 4rem; text-align: center;">
      <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; display: inline-block; padding: 3rem 4rem;">
        <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 1rem;">Ready to Start Your Project?</h2>
        <p style="margin-bottom: 1.5rem;">Get a free consultation and quote today</p>
        <a href="/contact" class="btn" style="background: white; color: var(--primary);">Contact Us</a>
      </div>
    </section>
  `;
  
  return c.html(layout('About Us', content, 'about'));
};
