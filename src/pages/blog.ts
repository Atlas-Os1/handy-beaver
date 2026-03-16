import { Context } from 'hono';
import { layout } from '../lib/html';

// Placeholder blog posts - will be dynamic from D1 later
const blogPosts = [
  {
    id: 5,
    title: 'Tornado Season Prep: Securing Your Outdoor Spaces in Southeast Oklahoma',
    slug: 'tornado-season-prep-oklahoma-2026',
    excerpt: 'With tornado season approaching, now is the time to secure loose items, reinforce structures, and prepare your property for severe weather. Essential tips for Oklahoma homeowners.',
    date: '2026-03-15',
    category: 'Safety',
    content: `<h1>Tornado Season Prep: Securing Your Outdoor Spaces in Southeast Oklahoma</h1>

<p>March in Southeast Oklahoma means one thing: tornado season is right around the corner. While we can't control the weather, we can control how well our properties are prepared. A few hours of work now can prevent thousands in damage and keep your family safer when severe weather strikes.</p>

<h2>Why Outdoor Prep Matters</h2>

<p>Tornadoes and severe thunderstorms don't just damage roofs and windows — they turn everyday outdoor items into dangerous projectiles. That patio chair, unsecured trash can, or loose fence panel becomes a hazard in 70+ mph winds. Taking time to secure or store these items protects both your property and your neighbors'.</p>

<h2>Secure Loose Items First</h2>

<p><strong>Patio Furniture &amp; Grills:</strong> Heavy items might seem stable, but high winds can toss even a full propane grill. Move furniture into a garage or shed, or use heavy-duty straps to anchor pieces to the deck or ground.</p>

<p><strong>Trash Cans &amp; Recycling Bins:</strong> Either bring them into the garage between storm events or use bungee cords to secure lids and anchor bins to a fence post or wall hook.</p>

<p><strong>Yard Decorations:</strong> Garden gnomes, flags, hanging planters — anything not permanently installed should come down or be secured. Spring is beautiful, but decorations can wait until after severe weather season passes.</p>

<p><strong>Tools &amp; Equipment:</strong> Ladders, wheelbarrows, garden tools left outside become missiles in a tornado. Store everything in a shed or garage. If you don't have storage, lay items flat and anchor them.</p>

<h2>Reinforce Your Fence</h2>

<p>High winds love to find weak fence panels and posts. A quick inspection now can save you from replacing entire sections later.</p>

<p><strong>Check Posts:</strong> Wiggle each fence post to test stability. Loose posts need immediate attention — dig out and reset with fresh concrete, or add cross-bracing for temporary support.</p>

<p><strong>Tighten Panels:</strong> Walk the fence line and tighten any loose screws or nails. Replace missing fasteners. A panel that's slightly loose now will be ripped off in a storm.</p>

<p><strong>Clear Debris:</strong> Remove anything leaning against or piled near your fence. Debris creates pressure points that can snap posts or panels.</p>

<p><strong>Consider Temporary Removal:</strong> If you have decorative fence sections or gates that are purely cosmetic, consider removing them for tornado season and reinstalling in late summer.</p>

<h2>Inspect Your Deck</h2>

<p>A well-maintained deck handles wind better than one with structural issues.</p>

<p><strong>Check Railings:</strong> Shake railings firmly. Loose railings can detach and become airborne. Tighten bolts and replace damaged sections.</p>

<p><strong>Secure Lattice:</strong> Decorative lattice panels under decks catch wind like a sail. Either remove them for the season or add extra fasteners every 12 inches.</p>

<p><strong>Remove or Secure Deck Furniture:</strong> Don't leave cushions, umbrellas, or lightweight furniture on the deck. Store them or anchor them securely.</p>

<h2>Trim Trees and Shrubs</h2>

<p>Overhanging branches and dead limbs are the #1 cause of storm damage to homes and fences in our area.</p>

<p><strong>Dead Branches:</strong> Remove any dead or damaged limbs now, before a storm does it for you. A falling branch can punch through a roof or demolish a fence.</p>

<p><strong>Overgrown Trees:</strong> Trim back branches within 10 feet of your house, deck, or fence. This creates a buffer zone that reduces impact damage.</p>

<p><strong>Clear Storm Drains:</strong> Make sure gutters and yard drains are clear. Heavy rain accompanies tornadoes, and flooding can cause as much damage as wind.</p>

<h2>Create a Safe Zone</h2>

<p>Know where you'll shelter during a tornado warning. Basements and interior rooms on the lowest floor are safest. Avoid windows, exterior walls, and mobile structures.</p>

<p>Keep a weather radio, flashlight, first aid kit, and battery bank in your safe zone. Cell towers often go down during severe weather — don't rely on your phone alone.</p>

<h2>Document Your Property</h2>

<p>Take photos of your deck, fence, and outdoor structures <em>before</em> storm season. If you need to file an insurance claim, having "before" photos makes the process much easier.</p>

<p>Walk your property with your phone and snap pictures from multiple angles. Include close-ups of areas you've recently repaired or reinforced.</p>

<h2>DIY vs. Professional Help</h2>

<p><strong>You Can Handle:</strong></p>
<ul>
<li>Moving patio furniture and loose items</li>
<li>Tightening visible screws and bolts</li>
<li>Clearing gutters and yard debris</li>
<li>Taking inventory photos</li>
</ul>

<p><strong>Call a Professional For:</strong></p>
<ul>
<li>Resetting fence posts in concrete</li>
<li>Major tree trimming (especially near power lines)</li>
<li>Structural deck repairs</li>
<li>Anything requiring a ladder on uneven ground</li>
</ul>

<p>A handyman can handle fence and deck reinforcement in a half-day ($175) or tackle larger structural projects with a full-day rate ($300). Materials are provided at cost.</p>

<h2>When Storms Approach</h2>

<p>Keep an eye on weather forecasts from mid-March through June. When severe weather is predicted:</p>
<ul>
<li>Move vehicles into the garage if possible</li>
<li>Bring in any remaining outdoor items</li>
<li>Close and latch all gates and shed doors</li>
<li>Charge phones and battery banks</li>
<li>Fill bathtubs with water (in case water service is interrupted)</li>
</ul>

<h2>After the Storm</h2>

<p>Don't rush outside immediately. Downed power lines, gas leaks, and structural damage aren't always visible. Wait for the all-clear from local authorities.</p>

<p>When it's safe, inspect your property carefully:</p>
<ul>
<li>Check for fence and deck damage</li>
<li>Look for roof damage or missing shingles</li>
<li>Inspect trees for hanging or damaged limbs</li>
<li>Document damage with photos for insurance</li>
</ul>

<p>If you have structural damage, don't attempt DIY repairs without professional assessment first. What looks like a simple fix might be hiding bigger problems.</p>

<h2>Start This Weekend</h2>

<p>Tornado prep doesn't have to be overwhelming. Start with one task this weekend — secure loose items, inspect your fence, or trim that dead branch you've been ignoring. Each step makes your property safer and gives you peace of mind when storm warnings pop up on your phone.</p>

<p>We can't stop tornadoes, but we can be ready for them. A few hours of preparation now means less stress and fewer repairs later.</p>

<hr>

<p><em>Need help securing your fence, deck, or outdoor structures before storm season? The Handy Beaver serves Southeast Oklahoma with professional handyman services. <a href="/contact">Get a free quote today!</a></em></p>`
  },
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
