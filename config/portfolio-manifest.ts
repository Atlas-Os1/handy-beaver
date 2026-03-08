/**
 * Portfolio Image Manifest
 * 
 * Organized from Flo's photo analysis in Discord thread.
 * Images will be uploaded to R2 bucket: handy-beaver-images
 * 
 * Structure: /portfolio/{category}/{filename}
 */

export interface PortfolioImage {
  filename: string;
  title: string;
  description: string;
  category: PortfolioCategory;
  type: 'gallery' | 'hero' | 'service' | 'before' | 'after' | 'about' | 'social';
  tags: string[];
  featured?: boolean;
  pairedWith?: string; // filename of paired before/after image
  notes?: string; // Internal notes from Flo's analysis
}

export type PortfolioCategory = 
  | 'bathroom-remodels'
  | 'specialty-wood'
  | 'trim-carpentry'
  | 'flooring'
  | 'stairs-railings'
  | 'decks-outdoor'
  | 'doors'
  | 'about';

/**
 * Images from thread analysis - TO BE UPLOADED
 * 
 * Minte needs to share actual image files. These are placeholders
 * based on Flo's descriptions.
 */
export const portfolioManifest: PortfolioImage[] = [
  // ============================================
  // BATHROOM REMODELS - Stone Tile Bathroom
  // ============================================
  {
    filename: 'bathroom-stone-before.jpg',
    title: 'Bathroom Remodel - Before',
    description: 'Tub framed in, insulation up, cement board starting',
    category: 'bathroom-remodels',
    type: 'before',
    tags: ['bathroom', 'remodel', 'before-after', 'framing'],
    pairedWith: 'bathroom-stone-after.jpg',
    notes: 'Shows work from the studs - builds trust'
  },
  {
    filename: 'bathroom-stone-after.jpg',
    title: 'Stone Tile Bathroom',
    description: 'Stone-look tile surround, shiplap walls, T&G wood ceiling, rustic flooring',
    category: 'bathroom-remodels',
    type: 'after',
    tags: ['bathroom', 'remodel', 'tile', 'shiplap', 'T&G'],
    featured: true,
    pairedWith: 'bathroom-stone-before.jpg',
    notes: 'HERO MATERIAL - before/after pair that sells jobs'
  },

  // ============================================
  // BATHROOM REMODELS - Shiplap Bathroom
  // ============================================
  {
    filename: 'bathroom-shiplap-gut.jpg',
    title: 'Bathroom Gut Phase',
    description: 'Stripped to studs, popcorn ceiling removed, demo debris',
    category: 'bathroom-remodels',
    type: 'before',
    tags: ['bathroom', 'demo', 'gut-job'],
    pairedWith: 'bathroom-shiplap-finished.jpg'
  },
  {
    filename: 'bathroom-shiplap-midwork.jpg',
    title: 'Shiplap Installation',
    description: 'Shiplap going up, ceiling joists exposed, exhaust fan install',
    category: 'bathroom-remodels',
    type: 'gallery',
    tags: ['bathroom', 'shiplap', 'process']
  },
  {
    filename: 'bathroom-shiplap-ceiling.jpg',
    title: 'Pine Shiplap Bathroom',
    description: 'Pine shiplap walls AND ceiling, modern lighting, clean finish',
    category: 'bathroom-remodels',
    type: 'after',
    tags: ['bathroom', 'shiplap', 'pine', 'ceiling'],
    featured: true,
    notes: 'Shows full shiplap treatment'
  },
  {
    filename: 'bathroom-liveedge-vanity.jpg',
    title: 'Live-Edge Walnut Vanity',
    description: 'Custom vanity with live-edge walnut countertop, pine shiplap, brushed nickel fixtures',
    category: 'bathroom-remodels',
    type: 'hero',
    tags: ['bathroom', 'vanity', 'live-edge', 'walnut', 'custom'],
    featured: true,
    notes: 'HERO MATERIAL - craftsman-level work, shows custom woodwork capability'
  },
  {
    filename: 'bathroom-shiplap-finished.jpg',
    title: 'Completed Shiplap Bathroom',
    description: 'Grey slate-look tile floor, white fixtures, pine throughout',
    category: 'bathroom-remodels',
    type: 'after',
    tags: ['bathroom', 'shiplap', 'tile', 'finished'],
    pairedWith: 'bathroom-shiplap-gut.jpg'
  },

  // ============================================
  // SPECIALTY WOOD - Blue Pine / Beetle Kill
  // ============================================
  {
    filename: 'blue-pine-room.jpg',
    title: 'Blue Pine Interior',
    description: 'Beetle kill pine walls AND ceiling with distinctive blue-grey mineral streaking',
    category: 'specialty-wood',
    type: 'hero',
    tags: ['blue-pine', 'beetle-kill', 'specialty', 'premium'],
    featured: true,
    notes: 'SIGNATURE SHOT - Premium, expensive, hard to source. Differentiates from big-box basics.'
  },

  // ============================================
  // STAIRS & RAILINGS
  // ============================================
  {
    filename: 'stairs-construction.jpg',
    title: 'Custom Stair Construction',
    description: 'Custom stringer work showing build process',
    category: 'stairs-railings',
    type: 'before',
    tags: ['stairs', 'construction', 'process'],
    notes: 'Good for "How We Build" section'
  },
  {
    filename: 'stairs-metal-railing.jpg',
    title: 'Modern Metal Railing',
    description: 'Custom stair trim with zigzag detail, black horizontal bar railing, buggy pine accent wall',
    category: 'stairs-railings',
    type: 'hero',
    tags: ['stairs', 'railing', 'metal', 'modern-rustic'],
    featured: true,
    notes: 'Modern-rustic perfected. Reshoot when scaffolding removed.'
  },

  // ============================================
  // DECKS & OUTDOOR
  // ============================================
  {
    filename: 'deck-timber-sunset.jpg',
    title: 'Timber Frame Deck',
    description: 'Dramatic timber trusses, covered deck with horizontal railing, golden hour shot',
    category: 'decks-outdoor',
    type: 'gallery',
    tags: ['deck', 'timber', 'outdoor', 'architecture'],
    notes: 'Beautiful golden hour shot. Reshoot when siding complete.'
  },

  // ============================================
  // TRIM & CARPENTRY - T&G Accent Walls
  // ============================================
  {
    filename: 'tg-accent-wall.jpg',
    title: 'T&G Accent Wall',
    description: 'Knotty pine tongue-and-groove wrapping around corner partition, dark stained baseboard',
    category: 'trim-carpentry',
    type: 'hero',
    tags: ['T&G', 'pine', 'accent-wall', 'trim'],
    featured: true,
    notes: 'Portfolio-ready NOW. Shows precision - horizontal lines tight, corners wrap seamlessly.'
  },
  {
    filename: 'french-doors-tg.jpg',
    title: 'French Doors with T&G Surround',
    description: 'French doors framed with pine T&G, shows integration of woodwork with door installation',
    category: 'trim-carpentry',
    type: 'gallery',
    tags: ['french-doors', 'T&G', 'doors', 'trim'],
    notes: 'Reshoot when finished for best version'
  },

  // ============================================
  // DOORS
  // ============================================
  {
    filename: 'door-exterior-mahogany.jpg',
    title: 'Exterior Door Installation',
    description: 'Mahogany-style exterior door with 3/4 glass panel, cedar trim',
    category: 'doors',
    type: 'gallery',
    tags: ['door', 'exterior', 'mahogany', 'glass'],
    notes: 'Hold until stickers removed and trim stained/painted'
  },

  // ============================================
  // FLOORING - Hardwood Repair
  // ============================================
  {
    filename: 'flooring-damage.jpg',
    title: 'Water Damaged Hardwood',
    description: 'Oak hardwood with water damage - buckling, gaps, boards lifting',
    category: 'flooring',
    type: 'before',
    tags: ['flooring', 'hardwood', 'damage', 'repair'],
    pairedWith: 'flooring-repair-bar.jpg'
  },
  {
    filename: 'flooring-subfloor.jpg',
    title: 'Subfloor Repair',
    description: 'Subfloor exposed, old underlayment visible, significant repair scope',
    category: 'flooring',
    type: 'gallery',
    tags: ['flooring', 'subfloor', 'repair', 'process'],
    notes: 'Good for "Our Process" page'
  },
  {
    filename: 'flooring-repair-bar.jpg',
    title: 'Seamless Hardwood Repair',
    description: 'Repaired floor with stone bar base, blue pine walls, granite counters - seamless match',
    category: 'flooring',
    type: 'after',
    tags: ['flooring', 'hardwood', 'repair', 'seamless'],
    featured: true,
    pairedWith: 'flooring-damage.jpg',
    notes: 'MONEY SHOT - Can\'t tell where repair was. Proves invisible patch capability.'
  },
  {
    filename: 'flooring-repair-lifestyle.jpg',
    title: 'Restored Hardwood',
    description: 'Warm, lived-in space showing floor in use with Christmas tree',
    category: 'flooring',
    type: 'gallery',
    tags: ['flooring', 'hardwood', 'lifestyle'],
    notes: 'Great lifestyle shot for social/homepage'
  },
  {
    filename: 'flooring-kitchen.jpg',
    title: 'Kitchen Floor Continuity',
    description: 'Floor continuity throughout kitchen, around island, professional finish',
    category: 'flooring',
    type: 'gallery',
    tags: ['flooring', 'kitchen', 'hardwood']
  },

  // ============================================
  // ABOUT - Owner/Team
  // ============================================
  {
    filename: 'owner-headshot.jpg',
    title: 'Owner Photo',
    description: 'Casual headshot with personality - blue mirror shades and beard',
    category: 'about',
    type: 'about',
    tags: ['owner', 'headshot', 'about'],
    featured: true,
    notes: 'Good for About page, social profiles, Meet the Team'
  },
  {
    filename: 'owner-working.mp4',
    title: 'Craftsman at Work',
    description: 'Precision trim work with nail gun, shows attention to detail',
    category: 'about',
    type: 'social',
    tags: ['owner', 'working', 'video', 'social'],
    notes: 'GOLD for social media - Instagram/TikTok/Facebook. Shows real skill.'
  },

  // ============================================
  // VIDEO CONTENT
  // ============================================
  {
    filename: 'transformation-compilation.mp4',
    title: 'Full Project Transformation',
    description: 'Video compilation: construction → finished bar, bathroom, interiors',
    category: 'specialty-wood',
    type: 'social',
    tags: ['video', 'transformation', 'social', 'compilation'],
    featured: true,
    notes: 'Perfect for Instagram Reels, TikTok, Facebook. Homepage background video potential.'
  },
];

/**
 * Get images by category
 */
export function getImagesByCategory(category: PortfolioCategory): PortfolioImage[] {
  return portfolioManifest.filter(img => img.category === category);
}

/**
 * Get featured images for homepage
 */
export function getFeaturedImages(): PortfolioImage[] {
  return portfolioManifest.filter(img => img.featured);
}

/**
 * Get before/after pairs
 */
export function getBeforeAfterPairs(): Array<{ before: PortfolioImage; after: PortfolioImage }> {
  const pairs: Array<{ before: PortfolioImage; after: PortfolioImage }> = [];
  const beforeImages = portfolioManifest.filter(img => img.type === 'before' && img.pairedWith);
  
  for (const before of beforeImages) {
    const after = portfolioManifest.find(img => img.filename === before.pairedWith);
    if (after) {
      pairs.push({ before, after });
    }
  }
  
  return pairs;
}

/**
 * Get hero images for each category
 */
export function getHeroImages(): PortfolioImage[] {
  return portfolioManifest.filter(img => img.type === 'hero');
}

/**
 * R2 URL builder
 */
export function getR2Url(filename: string, category: PortfolioCategory): string {
  return `/api/images/portfolio/${category}/${filename}`;
}
