import { siteConfig } from '../../config/site.config';

const { theme, business } = siteConfig;

export const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap');
  
  :root {
    --primary: ${theme.colors.primary};
    --secondary: ${theme.colors.secondary};
    --accent: ${theme.colors.accent};
    --bg: ${theme.colors.background};
    --card: ${theme.colors.card};
    --card-glow: ${theme.colors.cardGlow};
  }
  
  body {
    font-family: 'Open Sans', sans-serif;
    background-color: #1a0f0a;
    background-image: url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="wood" patternUnits="userSpaceOnUse" width="100" height="100"><rect fill="#2C1810" width="100" height="100"/><path d="M0 20 Q 50 15, 100 20 M0 40 Q 50 35, 100 40 M0 60 Q 50 55, 100 60 M0 80 Q 50 75, 100 80" stroke="#3d2317" stroke-width="2" fill="none" opacity="0.5"/><path d="M20 0 Q 22 50, 20 100 M50 0 Q 52 50, 50 100 M80 0 Q 78 50, 80 100" stroke="#3d2317" stroke-width="1" fill="none" opacity="0.3"/></pattern></defs><rect fill="url(#wood)" width="100" height="100"/></svg>`)}');
    background-attachment: fixed;
    color: var(--card);
    min-height: 100vh;
  }
  
  /* Navigation */
  nav {
    background: rgba(44, 24, 16, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem 2rem;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 2px solid var(--secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: var(--accent);
  }
  
  .nav-brand img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--secondary);
  }
  
  .nav-brand span {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }
  
  .nav-links a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s;
  }
  
  .nav-links a:hover {
    color: var(--secondary);
  }
  
  /* Cards with white glow */
  .card {
    background: var(--card);
    color: var(--bg);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 
      0 0 20px var(--card-glow),
      0 0 40px var(--card-glow),
      0 10px 40px rgba(0,0,0,0.3);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .card:hover {
    transform: translateY(-5px);
    box-shadow: 
      0 0 30px var(--card-glow),
      0 0 60px var(--card-glow),
      0 15px 50px rgba(0,0,0,0.4);
  }
  
  /* Buttons */
  .btn {
    display: inline-block;
    padding: 1rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-size: 1rem;
    transition: all 0.3s;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: var(--card);
  }
  
  .btn-primary:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(139, 69, 19, 0.5);
  }
  
  .btn-secondary {
    background: transparent;
    color: var(--accent);
    border: 2px solid var(--accent);
  }
  
  .btn-secondary:hover {
    background: var(--accent);
    color: var(--bg);
  }
  
  /* Container */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  /* Grid */
  .grid {
    display: grid;
    gap: 2rem;
  }
  
  .grid-2 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
  .grid-3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
  .grid-4 { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
  
  /* Section headers */
  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem;
    color: var(--accent);
    text-align: center;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }
  
  .section-subtitle {
    text-align: center;
    color: var(--secondary);
    margin-bottom: 3rem;
  }
  
  /* Promo popup */
  .promo-popup {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, var(--primary), #6B3410);
    color: var(--card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    max-width: 350px;
    z-index: 99998;
    animation: slideIn 0.5s ease-out;
    display: none;
  }
  
  .promo-popup.active { display: block; }
  
  .promo-popup h4 {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }
  
  .promo-popup p { font-size: 0.9rem; margin-bottom: 1rem; }
  
  .promo-popup .close {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    color: var(--card);
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  /* Mobile CTA Buttons - sits below chat trigger */
  .mobile-cta-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, var(--primary), #6B3410);
    padding: 0.75rem 1rem;
    z-index: 9999;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
  }

  .mobile-cta-bar .cta-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .mobile-cta-bar a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--card);
    color: var(--primary);
    text-decoration: none;
    font-weight: 700;
    border-radius: 50px;
    transition: transform 0.2s;
  }

  .mobile-cta-bar a:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    .mobile-cta-bar {
      display: block;
    }
    
    body {
      padding-bottom: 70px;
    }
    
    .promo-popup {
      bottom: 80px;
      z-index: 9998;
    }
    
    /* ElevenLabs widget must be above mobile bar */
    elevenlabs-convai {
      z-index: 9998 !important;
    }
  }

  /* Service Card Enhanced Animations */
  .service-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .service-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 
      0 0 40px var(--card-glow),
      0 0 80px var(--card-glow),
      0 20px 60px rgba(0,0,0,0.4);
  }

  .service-card:hover .service-icon {
    animation: bounce 0.5s ease;
  }

  .service-card:hover .learn-more {
    transform: translateX(8px);
  }

  .service-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
    transition: transform 0.3s;
  }

  .learn-more {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary);
    font-weight: 600;
    transition: transform 0.3s;
  }

  .learn-more::after {
    content: '→';
    transition: transform 0.3s;
  }

  .service-card:hover .learn-more::after {
    transform: translateX(5px);
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  /* Trust Signals Banner */
  .trust-banner {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2rem;
    padding: 1.5rem;
    background: rgba(44, 24, 16, 0.8);
    border-bottom: 2px solid var(--secondary);
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--accent);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.3s;
  }

  .trust-item:hover {
    color: var(--secondary);
  }

  .trust-item span.icon {
    font-size: 1.5rem;
  }

  /* Chat Trigger Button - positioned to not overlap with ElevenLabs widget */
  .chat-trigger {
    position: fixed;
    bottom: 160px;
    right: 20px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: var(--card);
    padding: 1rem 1.5rem;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(139, 69, 19, 0.4);
    z-index: 99999;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    transition: transform 0.3s, box-shadow 0.3s;
    animation: pulse 2s infinite;
  }

  .chat-trigger:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 30px rgba(139, 69, 19, 0.6);
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(139, 69, 19, 0.4); }
    50% { box-shadow: 0 4px 30px rgba(139, 69, 19, 0.7); }
  }

  /* Hide the default ElevenLabs widget button, we use our own trigger */
  elevenlabs-convai {
    --elevenlabs-button-display: none;
  }

  @media (max-width: 768px) {
    .chat-trigger {
      bottom: 220px;
      right: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
    }
    
    /* Ensure ElevenLabs conversation panel is above mobile bar */
    elevenlabs-convai {
      --elevenlabs-button-display: none;
      bottom: 80px !important;
    }
    
    .trust-banner {
      gap: 1rem;
      padding: 1rem 0.5rem;
    }
    
    .trust-item {
      font-size: 0.85rem;
    }
  }
  
  /* Footer */
  footer {
    background: rgba(44, 24, 16, 0.95);
    padding: 3rem 2rem;
    margin-top: 4rem;
    border-top: 2px solid var(--secondary);
    text-align: center;
  }
  
  footer p { color: var(--accent); }

  @media (max-width: 900px) {
    nav {
      padding: 0.75rem 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .nav-brand span {
      font-size: 1.15rem;
    }

    .nav-links {
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem 1rem;
    }

    .container {
      padding: 1.25rem;
    }

    .section-title {
      font-size: 2rem;
    }

    .section-subtitle {
      margin-bottom: 2rem;
    }

    .card {
      padding: 1.25rem;
    }
  }

  @media (max-width: 600px) {
    .nav-brand img {
      width: 40px;
      height: 40px;
    }

    .grid {
      gap: 1rem;
    }

    .promo-popup {
      left: 12px;
      right: 12px;
      bottom: 12px;
      max-width: none;
      width: auto;
      padding: 1rem;
    }
  }
`;

export function layout(title: string, content: string, activeNav?: string, seo?: {
  description?: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article';
}) {
  const siteUrl = "https://handybeaver.co";
  const defaultDesc = "Professional carpentry, flooring, deck repair, and vacation rental maintenance for SE Oklahoma cabins and homes.";
  const defaultImage = "/api/assets/lil-beaver-mascot.png";
  
  const seoTitle = `${title} | ${business.name}`;
  const seoDesc = seo?.description || defaultDesc;
  const seoImage = seo?.image ? `${siteUrl}${seo.image}` : `${siteUrl}${defaultImage}`;
  const seoCanonical = seo?.canonical ? `${siteUrl}${seo.canonical}` : `${siteUrl}/`;
  const seoType = seo?.type || 'website';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDesc}">
  <link rel="canonical" href="${seoCanonical}">
  <link rel="icon" type="image/png" href="/api/assets/beaver-avatar.png">
  <link rel="apple-touch-icon" href="/api/assets/beaver-avatar.png">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${seoType}">
  <meta property="og:url" content="${seoCanonical}">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${seoDesc}">
  <meta property="og:image" content="${seoImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${business.name}">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${seoDesc}">
  <meta name="twitter:image" content="${seoImage}">
  
  <!-- JSON-LD Structured Data / LocalBusiness -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "${business.name}",
    "image": "${siteUrl}/api/assets/beaver-avatar.png",
    "url": "${siteUrl}",
    "telephone": "${business.phone}",
    "email": "${business.email}",
    "description": "${seoDesc}",
    "areaServed": "${business.serviceArea}",
    "priceRange": "$$-$$$",
    "openingHours": "Mo-Fr 08:00-17:00",
    "sameAs": [
      "https://www.facebook.com/1040910635768535",
      "https://instagram.com/lilhandybeaver"
    ]
  }
  </script>
  
  <style>${baseStyles}</style>
</head>
<body>
  <nav>
    <a href="/" class="nav-brand">
      <img src="/api/assets/beaver-avatar.png" alt="${business.name} mascot">
      <span>${business.name}</span>
    </a>
    <ul class="nav-links">
      <li><a href="/" ${activeNav === 'home' ? 'style="color: var(--secondary)"' : ''}>Home</a></li>
      <li><a href="/services" ${activeNav === 'services' ? 'style="color: var(--secondary)"' : ''}>Services</a></li>
      <li><a href="/pricing" ${activeNav === 'pricing' ? 'style="color: var(--secondary)"' : ''}>Pricing</a></li>
      <li><a href="/tiny-homes" ${activeNav === 'tiny-homes' ? 'style="color: var(--secondary)"' : ''}>Tiny Homes</a></li>
      <li><a href="/gallery" ${activeNav === 'gallery' ? 'style="color: var(--secondary)"' : ''}>Gallery</a></li>
      <li><a href="/service-area" ${activeNav === 'service-area' ? 'style="color: var(--secondary)"' : ''}>Service Area</a></li>
      <li><a href="/contact" ${activeNav === 'contact' ? 'style="color: var(--secondary)"' : ''}>Contact</a></li>
      <li><a href="/portal" class="btn btn-primary" style="padding: 0.5rem 1rem">Customer Portal</a></li>
    </ul>
  </nav>
  
  <!-- Trust Signals Banner -->
  <div class="trust-banner">
    <span class="trust-item"><span class="icon">🛠️</span> 25 Years Experience</span>
    <span class="trust-item"><span class="icon">✅</span> 100+ Projects Completed</span>
    <a href="https://www.facebook.com/1040910635768535/reviews" target="_blank" rel="noopener" class="trust-item"><span class="icon">⭐</span> 5-Star Rated</a>
    <span class="trust-item"><span class="icon">🏠</span> Locally Owned - SE Oklahoma</span>
  </div>
  
  ${content}
  
  <!-- Promo Popup -->
  <div id="promo-popup" class="promo-popup">
    <button class="close" onclick="closePromo()">&times;</button>
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <img src="/api/assets/icons/new-badge.png" alt="New" style="width: 40px; height: 40px;">
      <h4 style="margin: 0;">New Customer Special!</h4>
    </div>
    <p><strong>FREE consultation</strong> + <strong>10% off</strong> your first job!</p>
    <a href="/contact?promo=new10" class="btn btn-secondary" style="width: 100%; text-align: center">Claim Offer</a>
  </div>
  
  <footer>
    <p>&copy; 2026 ${business.name}. Proudly serving ${business.serviceArea}.</p>
    <p style="margin-top: 0.5rem; font-size: 0.85rem; opacity: 0.8">
      📧 ${business.email} | 📍 ${business.serviceArea}
    </p>
    <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 1rem;">
      <a href="tel:${business.phone}" style="color: var(--secondary); text-decoration: none; font-weight: 600;">📞 Call Us</a>
      <a href="sms:${business.phone}" style="color: var(--secondary); text-decoration: none; font-weight: 600;">💬 Text Us</a>
      <a href="/quote" style="color: var(--accent); text-decoration: none; font-weight: 600;">💰 Get Quote</a>
    </div>
  </footer>
  
  <!-- Mobile CTA Bar (shows on mobile only) -->
  <div class="mobile-cta-bar">
    <div class="cta-buttons">
      <a href="tel:${business.phone}">📞 Call</a>
      <a href="sms:${business.phone}">💬 Text</a>
      <a href="/quote" style="background: var(--secondary); color: white;">💰 Quote</a>
    </div>
  </div>
  
  <!-- Chat Trigger Button - shown on public pages for customer leads -->
  <button class="chat-trigger" id="chat-trigger" style="display:none;" onclick="document.querySelector('elevenlabs-convai').click(); this.style.display='none';">
    🦫 Chat with Lil Beaver
  </button>
  
  <script>
    // Show chat trigger on ALL pages (main landing = customer leads)
    // Only hide on admin/portal where customers don't browse
    if (!window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/portal')) {
      document.getElementById('chat-trigger').style.display = '';
    }
    
    // Show promo after 5 seconds for new visitors
    setTimeout(() => {
      if (!localStorage.getItem('promoShown')) {
        document.getElementById('promo-popup').classList.add('active');
        localStorage.setItem('promoShown', Date.now());
      }
    }, 5000);
    
    function closePromo() {
      document.getElementById('promo-popup').classList.remove('active');
    }
    
    // Show chat prompt after 10 seconds
    setTimeout(() => {
      const trigger = document.querySelector('.chat-trigger');
      if (trigger && !localStorage.getItem('chatPrompted')) {
        trigger.innerHTML = '🦫 Need help? Ask Lil Beaver!';
        localStorage.setItem('chatPrompted', Date.now());
      }
    }, 10000);
  </script>
  
  <!-- Lil Beaver Voice Agent Widget - loads on public pages for customer call leads -->
  <span id="lilbeaver-widget"></span>
  <script>
    // Load ElevenLabs widget on public pages (not admin/portal) for customer voice leads
    if (!window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/portal')) {
      document.getElementById('lilbeaver-widget').innerHTML = '<elevenlabs-convai agent-id="agent_6401kk7jr6ngey2ancnk6nf7kpwy"></elevenlabs-convai>';
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      document.body.appendChild(script);
    }
  </script>
</body>
</html>`;
}