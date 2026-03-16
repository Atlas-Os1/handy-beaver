import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

export const socialPage = (c: Context) => {
  const content = `
    <!-- Hero Section -->
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">📱 Follow The Handy Beaver</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">See our latest projects, tips, and behind-the-scenes action</p>
    </section>
    
    <section class="container">
      <!-- Social Links -->
      <div style="display: flex; justify-content: center; gap: 2rem; margin-bottom: 3rem; flex-wrap: wrap;">
        <a href="https://instagram.com/lilhandybeaver" target="_blank" rel="noopener" 
           style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem 2rem; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; transition: transform 0.2s;"
           onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          @lilhandybeaver
        </a>
        <a href="https://facebook.com/handybeaverco" target="_blank" rel="noopener"
           style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem 2rem; background: #1877F2; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; transition: transform 0.2s;"
           onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
          Handy Beaver Co
        </a>
      </div>
      
      <div class="grid grid-2" style="gap: 2rem;">
        <!-- Instagram Feed -->
        <div class="card">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #eee;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E4405F" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <div>
              <h2 style="color: var(--primary); margin: 0; font-size: 1.25rem;">Instagram</h2>
              <span style="color: #666; font-size: 0.9rem;">@lilhandybeaver</span>
            </div>
          </div>
          
          <div id="instagram-feed" style="min-height: 300px;">
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #666;">
              <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📸</div>
                <p>Loading posts...</p>
              </div>
            </div>
          </div>
          
          <a href="https://instagram.com/lilhandybeaver" target="_blank" rel="noopener" 
             class="btn btn-secondary" style="width: 100%; margin-top: 1.5rem; text-align: center;">
            View on Instagram →
          </a>
        </div>
        
        <!-- Facebook Feed -->
        <div class="card">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #eee;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
            <div>
              <h2 style="color: var(--primary); margin: 0; font-size: 1.25rem;">Facebook</h2>
              <span style="color: #666; font-size: 0.9rem;">Handy Beaver Co</span>
            </div>
          </div>
          
          <div id="facebook-feed" style="min-height: 300px;">
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #666;">
              <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📘</div>
                <p>Loading posts...</p>
              </div>
            </div>
          </div>
          
          <a href="https://facebook.com/handybeaverco" target="_blank" rel="noopener"
             class="btn btn-secondary" style="width: 100%; margin-top: 1.5rem; text-align: center;">
            View on Facebook →
          </a>
        </div>
      </div>
    </section>
    
    <!-- Reviews Section (Coming Soon) -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">⭐ Customer Reviews</h2>
      <p class="section-subtitle">What our customers say about us</p>
      
      <div id="reviews-feed" style="max-width: 800px; margin: 0 auto;">
        <div class="card" style="text-align: center; padding: 3rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🦫</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Reviews Coming Soon!</h3>
          <p style="color: #666;">We're just getting started. Be one of our first customers and leave a review!</p>
          <a href="/contact" class="btn btn-primary" style="margin-top: 1.5rem;">Get a Free Quote</a>
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="container" style="margin-top: 4rem; text-align: center;">
      <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 3rem;">
        <h2 style="font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 1rem;">
          Ready to Start Your Project?
        </h2>
        <p style="max-width: 500px; margin: 0 auto 1.5rem; font-size: 1.1rem;">
          Follow us on social media for tips and inspiration, then reach out when you're ready!
        </p>
        <a href="/contact" class="btn" style="background: white; color: var(--primary);">Get Free Quote →</a>
      </div>
    </section>
    
    <script>
      async function loadSocialFeeds() {
        try {
          const response = await fetch('/api/social/feed');
          const data = await response.json();
          
          // Render Instagram
          const igFeed = document.getElementById('instagram-feed');
          if (data.instagram && data.instagram.length > 0) {
            igFeed.innerHTML = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">' +
              data.instagram.map(post => 
                '<a href="' + post.permalink + '" target="_blank" rel="noopener" style="aspect-ratio: 1; overflow: hidden; border-radius: 8px; display: block;">' +
                '<img src="' + post.media_url + '" alt="' + (post.caption || 'Instagram post').substring(0, 50) + '" ' +
                'style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" ' +
                'onmouseover="this.style.transform=\\'scale(1.1)\\'" onmouseout="this.style.transform=\\'scale(1)\\'">' +
                '</a>'
              ).join('') +
            '</div>';
          } else {
            igFeed.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">' +
              '<div style="font-size: 3rem; margin-bottom: 1rem;">📸</div>' +
              '<p>No posts yet — follow us to see upcoming content!</p>' +
              '</div>';
          }
          
          // Render Facebook
          const fbFeed = document.getElementById('facebook-feed');
          if (data.facebook && data.facebook.length > 0) {
            fbFeed.innerHTML = '<div style="display: flex; flex-direction: column; gap: 1rem;">' +
              data.facebook.map(post => {
                const hasImage = post.full_picture;
                const message = post.message || '';
                const truncated = message.length > 200 ? message.substring(0, 200) + '...' : message;
                const date = new Date(post.created_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                return '<a href="' + post.permalink_url + '" target="_blank" rel="noopener" style="text-decoration: none; color: inherit; display: block; border: 1px solid #eee; border-radius: 12px; overflow: hidden; transition: box-shadow 0.3s;" onmouseover="this.style.boxShadow=\\'0 4px 12px rgba(0,0,0,0.15)\\'" onmouseout="this.style.boxShadow=\\'none\\'">' +
                  (hasImage ? '<img src="' + post.full_picture + '" alt="Post image" style="width: 100%; height: 200px; object-fit: cover;">' : '') +
                  '<div style="padding: 1rem;">' +
                  '<p style="color: #333; margin: 0 0 0.5rem; font-size: 0.95rem; line-height: 1.5;">' + truncated + '</p>' +
                  '<span style="color: #999; font-size: 0.8rem;">' + date + '</span>' +
                  '</div>' +
                  '</a>';
              }).join('') +
            '</div>';
          } else {
            fbFeed.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">' +
              '<div style="font-size: 3rem; margin-bottom: 1rem;">📘</div>' +
              '<p>No posts yet — like our page for updates!</p>' +
              '</div>';
          }
          
        } catch (error) {
          console.error('Failed to load social feeds:', error);
          document.getElementById('instagram-feed').innerHTML = '<p style="text-align: center; color: #999;">Unable to load Instagram feed</p>';
          document.getElementById('facebook-feed').innerHTML = '<p style="text-align: center; color: #999;">Unable to load Facebook feed</p>';
        }
      }
      
      loadSocialFeeds();
    </script>
  `;
  
  return c.html(layout('Social Media', content, 'social'));
};
