import { Context } from 'hono';
import { layout } from '../lib/html';

// Placeholder blog posts - will be dynamic from D1 later
const blogPosts = [
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
          </div>
        </div>
      </div>
    </article>
  `;
  
  return c.html(layout(post.title, content, 'blog'));
};
