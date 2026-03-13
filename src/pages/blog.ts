import { Context } from 'hono';
import { layout } from '../lib/html';

// Placeholder blog posts - will be dynamic from D1 later
const blogPosts = [
  {
    id: 4,
    title: 'Spring Home Maintenance Essentials: Preparing Your Southeast Oklahoma Property',
    slug: 'spring-home-maintenance-essentials-2026',
    excerpt: 'Early spring is the perfect time to prepare your deck, fence, and outdoor spaces for the year ahead. Learn essential maintenance tips for Southeast Oklahoma homeowners.',
    date: '2026-03-13',
    category: 'Tips',
    content: `<h1>Spring Home Maintenance Essentials: Preparing Your Southeast Oklahoma Property</h1>

<p>As March brings warmer weather to Southeast Oklahoma, it's the perfect time to tackle outdoor home maintenance projects. After a winter of ice, moisture, and debris buildup, your deck, fence, and exterior need some attention to stay in great shape for the rest of the year.</p>

<h2>Why Spring Maintenance Matters</h2>

<p>Winter conditions can be tough on outdoor structures. Snow, ice, and accumulated moisture create the perfect environment for mildew, decay, and structural damage. Taking care of these issues now — before summer heat sets in — can save you major repairs down the road.</p>

<h2>Your Spring Deck Care Checklist</h2>

<p><strong>1. Clear the Debris</strong><br>
Start by removing leaves, twigs, and grass clippings that have collected around your deck. This debris traps moisture against the wood, leading to rot and mildew. A simple sweep and rinse can make a huge difference.</p>

<p><strong>2. Inspect for Damage</strong><br>
Look for loose boards, popped nails, or cracked wood. Early spring is ideal for catching small problems before they become expensive repairs. Check railings for stability — safety first!</p>

<p><strong>3. Deep Clean</strong><br>
Use a gentle deck cleaner and soft brush to remove winter grime. Avoid pressure washers on older wood — they can damage the surface. For best results, clean on a mild, dry day.</p>

<p><strong>4. Seal and Protect</strong><br>
If your deck hasn't been sealed in the last 2-3 years, early spring is the perfect time. Choose a dry period (we typically see good weather windows in March and April) and apply a quality sealant. This protects against UV damage and moisture all year long.</p>

<h2>Fence Maintenance for Oklahoma Weather</h2>

<p>Fences take a beating from our unpredictable Oklahoma weather — from ice storms to summer heat.</p>

<p><strong>Clear the Base:</strong> Remove debris collecting along the fence line. This is where moisture damage starts.</p>

<p><strong>Check Posts and Panels:</strong> Look for loose posts, warped boards, or damaged gates. Cedar fences (popular in our area) benefit from gentle cleaning and resealing every 2-3 years.</p>

<p><strong>Trim Vegetation:</strong> Prune back trees and shrubs that touch your fence. Overgrowth holds moisture and can cause wood rot.</p>

<h2>DIY vs. Professional Help: When to Call</h2>

<p><strong>Good DIY Projects:</strong></p>
<ul>
<li>Basic cleaning and debris removal</li>
<li>Simple repairs (tightening screws, replacing a single board)</li>
<li>Applying sealant if you have experience</li>
</ul>

<p><strong>Call a Professional For:</strong></p>
<ul>
<li>Structural repairs (sagging decks, leaning fences)</li>
<li>Full deck or fence refinishing</li>
<li>Anything involving safety concerns</li>
<li>Large-scale projects requiring permits</li>
</ul>

<p>A professional handyman can complete a full deck inspection and repair in a half-day ($175) or tackle bigger projects with a full-day rate ($300). Materials are provided at cost, so you're only paying for skilled labor and experience.</p>

<h2>Oklahoma-Specific Tips</h2>

<p>Our region's climate means dealing with:</p>
<ul>
<li><strong>High humidity</strong> in spring/summer — prioritize ventilation and drainage</li>
<li><strong>Extreme temperature swings</strong> — use products rated for temperature changes</li>
<li><strong>Red clay soil</strong> — can stain decks and fences, clean promptly</li>
<li><strong>Tornado season ahead</strong> — secure loose boards and check structural integrity now</li>
</ul>

<h2>Get Started This Weekend</h2>

<p>You don't need to tackle everything at once. Start with a thorough inspection and cleaning this weekend. Make a list of repairs, prioritize by safety and urgency, then decide what you can DIY and what deserves professional attention.</p>

<p>Your outdoor spaces work hard for you — a little spring maintenance ensures they're ready for cookouts, family time, and enjoying our beautiful Oklahoma spring weather.</p>

<hr>

<p><em>Need help with deck or fence repairs? The Handy Beaver serves Southeast Oklahoma with professional handyman services. <a href="/contact">Get a free quote today!</a></em></p>`
  },
  {
    id: 1,
    title: 'Welcome to The Handy Beaver!',
    slug: 'welcome-to-handy-beaver',
    excerpt: 'We\'re excited to launch our new website and share our story with you.',
    date: '2026-03-07',
    category: 'News'
  },
  {
    id: 2,
    title: '5 Signs Your Deck Needs Repair',
    slug: 'signs-deck-needs-repair',
    excerpt: 'Is your deck showing its age? Here are the warning signs that it\'s time to call in a professional.',
    date: '2026-03-06',
    category: 'Tips'
  },
  {
    id: 3,
    title: 'Trim Carpentry: The Details That Make a Home',
    slug: 'trim-carpentry-details',
    excerpt: 'Crown molding, baseboards, and door trim might seem small, but they transform a space.',
    date: '2026-03-05',
    category: 'Tips'
  }
];

export const blogPage = (c: Context) => {
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">Blog</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">Tips, news, and project inspiration</p>
    </section>
    
    <section class="container">
      <div class="grid grid-3">
        ${blogPosts.map(post => `
          <article class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <span style="background: var(--secondary); color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem;">
                ${post.category}
              </span>
              <span style="color: #999; font-size: 0.85rem;">${post.date}</span>
            </div>
            <h2 style="color: var(--primary); font-family: 'Playfair Display', serif; font-size: 1.25rem; margin-bottom: 0.75rem;">
              ${post.title}
            </h2>
            <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">
              ${post.excerpt}
            </p>
            <a href="/blog/${post.slug}" style="color: var(--primary); font-weight: 600; text-decoration: none;">
              Read More →
            </a>
          </article>
        `).join('')}
      </div>
      
      <div style="text-align: center; margin-top: 3rem;">
        <p style="color: var(--accent); margin-bottom: 1rem;">More posts coming soon!</p>
        <p style="color: #888; font-size: 0.9rem;">
          Follow us on Facebook for updates and project photos.
        </p>
      </div>
    </section>
  `;
  
  return c.html(layout('Blog', content, 'blog'));
};

export const blogPostPage = (c: Context) => {
  const slug = c.req.param('slug');
  const post = blogPosts.find(p => p.slug === slug);
  
  if (!post) {
    return c.html(layout('Post Not Found', `
      <section class="container" style="text-align: center; padding: 4rem;">
        <h1 style="color: var(--accent);">Post Not Found</h1>
        <p style="color: #888; margin: 1rem 0;">The blog post you're looking for doesn't exist.</p>
        <a href="/blog" class="btn btn-secondary">← Back to Blog</a>
      </section>
    `), 404);
  }
  
  // Placeholder content - will come from D1 later
  const content = `
    <article style="padding: 4rem 2rem;">
      <div class="container" style="max-width: 800px;">
        <a href="/blog" style="color: var(--secondary); text-decoration: none; display: inline-block; margin-bottom: 2rem;">
          ← Back to Blog
        </a>
        
        <div class="card">
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <span style="background: var(--secondary); color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem;">
              ${post.category}
            </span>
            <span style="color: #999; font-size: 0.85rem;">${post.date}</span>
          </div>
          
          <h1 style="color: var(--primary); font-family: 'Playfair Display', serif; font-size: 2.5rem; margin-bottom: 1.5rem;">
            ${post.title}
          </h1>
          
          <div style="color: #444; line-height: 1.8;">
            ${(post as any).content ? (post as any).content : `
              <p style="font-size: 1.25rem; margin-bottom: 1.5rem; color: #666;">
                ${post.excerpt}
              </p>
              
              <p style="margin-bottom: 1rem;">
                Full blog content coming soon! We're working on bringing you helpful tips, 
                project showcases, and industry insights.
              </p>
              
              <p>
                In the meantime, if you have a project in mind, 
                <a href="/contact" style="color: var(--primary);">contact us</a> for a free quote!
              </p>
            `}
          </div>
        </div>
      </div>
    </article>
  `;
  
  return c.html(layout(post.title, content, 'blog'));
};
