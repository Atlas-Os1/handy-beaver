/**
 * Portfolio Image Manifest
 * 
 * Images are stored in public/portfolio/ (static files)
 * Organized by Flo's photo analysis in Discord thread.
 */

export interface PortfolioImage {
  filename: string;
  folder: string; // Folder in public/portfolio/
  title: string;
  description: string;
  category: PortfolioCategory;
  type: 'gallery' | 'hero' | 'service' | 'before' | 'after' | 'about' | 'social';
  tags: string[];
  featured?: boolean;
  pairedWith?: string; // filename of paired before/after image
  notes?: string;
}

export type PortfolioCategory = 
  | 'bathroom-remodels'
  | 'specialty-wood'
  | 'trim-carpentry'
  | 'flooring'
  | 'stairs-railings'
  | 'decks-outdoor'
  | 'doors'
  | 'tiny-home'
  | 'kitchen-bar'
  | 'about';

/**
 * Actual images from public/portfolio/
 */
export const portfolioManifest: PortfolioImage[] = [
  // ============================================
  // HERO IMAGES (Homepage feature)
  // ============================================
  {
    filename: 'blue-pine-room.jpg',
    folder: 'hero',
    title: 'Blue Pine Interior',
    description: 'Beetle kill pine walls AND ceiling with distinctive blue-grey mineral streaking',
    category: 'specialty-wood',
    type: 'hero',
    tags: ['blue-pine', 'beetle-kill', 'specialty', 'premium'],
    featured: true,
    notes: 'SIGNATURE SHOT - Premium material differentiator'
  },
  {
    filename: 'live-edge-vanity.jpg',
    folder: 'hero',
    title: 'Live-Edge Walnut Vanity',
    description: 'Custom vanity with live-edge walnut countertop, pine shiplap, brushed nickel fixtures',
    category: 'bathroom-remodels',
    type: 'hero',
    tags: ['bathroom', 'vanity', 'live-edge', 'walnut', 'custom'],
    featured: true,
    notes: 'HERO MATERIAL - craftsman-level work'
  },
  {
    filename: 'bar-epoxy-counter.jpg',
    folder: 'hero',
    title: 'Epoxy Bar Counter',
    description: 'Custom bar with epoxy river counter, blue pine walls, professional finish',
    category: 'kitchen-bar',
    type: 'hero',
    tags: ['bar', 'epoxy', 'custom', 'blue-pine'],
    featured: true,
    notes: 'Shows custom finish work capability'
  },

  // ============================================
  // BATHROOM REMODELS
  // ============================================
  {
    filename: 'stone-tile-before.jpg',
    folder: 'bathroom',
    title: 'Bathroom Remodel - Before',
    description: 'Tub framed in, insulation up, cement board starting',
    category: 'bathroom-remodels',
    type: 'before',
    tags: ['bathroom', 'remodel', 'before-after', 'framing'],
    pairedWith: 'stone-tile-after.jpg'
  },
  {
    filename: 'stone-tile-after.jpg',
    folder: 'bathroom',
    title: 'Stone Tile Bathroom',
    description: 'Stone-look tile surround, shiplap walls, T&G wood ceiling, rustic flooring',
    category: 'bathroom-remodels',
    type: 'after',
    tags: ['bathroom', 'remodel', 'tile', 'shiplap', 'T&G'],
    featured: true,
    pairedWith: 'stone-tile-before.jpg'
  },
  {
    filename: 'shiplap-gut.jpg',
    folder: 'bathroom',
    title: 'Bathroom Gut Phase',
    description: 'Stripped to studs, popcorn ceiling removed, demo debris',
    category: 'bathroom-remodels',
    type: 'before',
    tags: ['bathroom', 'demo', 'gut-job'],
    pairedWith: 'shiplap-finished.jpg'
  },
  {
    filename: 'shiplap-mid.jpg',
    folder: 'bathroom',
    title: 'Shiplap Installation',
    description: 'Shiplap going up, ceiling joists exposed, exhaust fan install',
    category: 'bathroom-remodels',
    type: 'gallery',
    tags: ['bathroom', 'shiplap', 'process']
  },
  {
    filename: 'shiplap-finished.jpg',
    folder: 'bathroom',
    title: 'Pine Shiplap Bathroom',
    description: 'Pine shiplap walls AND ceiling, modern lighting, clean finish',
    category: 'bathroom-remodels',
    type: 'after',
    tags: ['bathroom', 'shiplap', 'pine', 'ceiling'],
    pairedWith: 'shiplap-gut.jpg'
  },
  {
    filename: 'vanity-detail.jpg',
    folder: 'bathroom',
    title: 'Vanity Detail',
    description: 'Close-up of custom vanity craftsmanship',
    category: 'bathroom-remodels',
    type: 'gallery',
    tags: ['bathroom', 'vanity', 'detail']
  },

  // ============================================
  // SPECIALTY WOOD - Blue Pine
  // ============================================
  {
    filename: 'full-room.jpg',
    folder: 'blue-pine',
    title: 'Blue Pine Full Room',
    description: 'Complete room with beetle kill pine walls and ceiling',
    category: 'specialty-wood',
    type: 'gallery',
    tags: ['blue-pine', 'beetle-kill', 'specialty'],
    featured: true
  },
  {
    filename: 'stairs-railing.jpg',
    folder: 'blue-pine',
    title: 'Modern Metal Railing',
    description: 'Custom stair trim with zigzag detail, black horizontal bar railing, buggy pine accent wall',
    category: 'stairs-railings',
    type: 'hero',
    tags: ['stairs', 'railing', 'metal', 'modern-rustic'],
    featured: true
  },
  {
    filename: 'stair-build.jpg',
    folder: 'blue-pine',
    title: 'Custom Stair Construction',
    description: 'Custom stringer work showing build process',
    category: 'stairs-railings',
    type: 'before',
    tags: ['stairs', 'construction', 'process']
  },

  // ============================================
  // FLOORING
  // ============================================
  {
    filename: 'hardwood-damage.jpg',
    folder: 'flooring',
    title: 'Water Damaged Hardwood',
    description: 'Oak hardwood with water damage - buckling, gaps, boards lifting',
    category: 'flooring',
    type: 'before',
    tags: ['flooring', 'hardwood', 'damage', 'repair'],
    pairedWith: 'hardwood-finished-bar.jpg'
  },
  {
    filename: 'hardwood-subfloor.jpg',
    folder: 'flooring',
    title: 'Subfloor Repair',
    description: 'Subfloor exposed, old underlayment visible, significant repair scope',
    category: 'flooring',
    type: 'gallery',
    tags: ['flooring', 'subfloor', 'repair', 'process']
  },
  {
    filename: 'hardwood-finished-bar.jpg',
    folder: 'flooring',
    title: 'Seamless Hardwood Repair',
    description: 'Repaired floor with stone bar base - seamless invisible patch',
    category: 'flooring',
    type: 'after',
    tags: ['flooring', 'hardwood', 'repair', 'seamless'],
    featured: true,
    pairedWith: 'hardwood-damage.jpg'
  },
  {
    filename: 'hardwood-finished-kitchen.jpg',
    folder: 'flooring',
    title: 'Kitchen Floor Continuity',
    description: 'Floor continuity throughout kitchen, around island, professional finish',
    category: 'flooring',
    type: 'gallery',
    tags: ['flooring', 'kitchen', 'hardwood']
  },

  // ============================================
  // TINY HOME
  // ============================================
  {
    filename: 'exterior.jpg',
    folder: 'tiny-home',
    title: 'Tiny Home Exterior',
    description: 'Tiny home build exterior with timber framing',
    category: 'tiny-home',
    type: 'gallery',
    tags: ['tiny-home', 'exterior', 'build']
  },
  {
    filename: 'exterior-sunset.jpg',
    folder: 'tiny-home',
    title: 'Tiny Home at Sunset',
    description: 'Golden hour shot with dramatic timber trusses and covered deck',
    category: 'tiny-home',
    type: 'gallery',
    tags: ['tiny-home', 'exterior', 'sunset'],
    featured: true
  },
  {
    filename: 'flooring-main.jpg',
    folder: 'tiny-home',
    title: 'Tiny Home Flooring',
    description: 'Interior flooring installation',
    category: 'tiny-home',
    type: 'gallery',
    tags: ['tiny-home', 'flooring', 'interior']
  },
  {
    filename: 'kitchen.jpg',
    folder: 'tiny-home',
    title: 'Tiny Home Kitchen',
    description: 'Compact kitchen with custom woodwork',
    category: 'tiny-home',
    type: 'gallery',
    tags: ['tiny-home', 'kitchen', 'interior']
  },

  // ============================================
  // KITCHEN/BAR
  // ============================================
  {
    filename: 'bar-main.jpg',
    folder: 'kitchen-bar',
    title: 'Custom Bar',
    description: 'Full custom bar with blue pine and epoxy finishes',
    category: 'kitchen-bar',
    type: 'gallery',
    tags: ['bar', 'kitchen', 'custom', 'blue-pine']
  },

  // ============================================
  // DOORS & TRIM
  // ============================================
  {
    filename: 'tg-accent-wall.jpg',
    folder: 'doors-trim',
    title: 'T&G Accent Wall',
    description: 'Knotty pine tongue-and-groove wrapping around corner partition',
    category: 'trim-carpentry',
    type: 'hero',
    tags: ['T&G', 'pine', 'accent-wall', 'trim'],
    featured: true
  },
  {
    filename: 'french-doors-tg.jpg',
    folder: 'doors-trim',
    title: 'French Doors with T&G',
    description: 'French doors framed with pine T&G surround',
    category: 'doors',
    type: 'gallery',
    tags: ['french-doors', 'T&G', 'doors', 'trim']
  },

  // ============================================
  // ABOUT
  // ============================================
  {
    filename: 'headshot.jpg',
    folder: 'about',
    title: 'Owner Photo',
    description: 'Casual headshot with personality',
    category: 'about',
    type: 'about',
    tags: ['owner', 'headshot', 'about'],
    featured: true
  },
];

/**
 * Video content (separate from images)
 */
export const portfolioVideos = [
  {
    filename: 'transformation.mov',
    folder: 'videos',
    title: 'Full Project Transformation',
    description: 'Video compilation: construction → finished bar, bathroom, interiors',
    category: 'specialty-wood',
    tags: ['video', 'transformation', 'social'],
    notes: 'Perfect for Instagram Reels, TikTok, Facebook'
  },
  {
    filename: 'working.mov',
    folder: 'about',
    title: 'Craftsman at Work',
    description: 'Precision trim work with nail gun, shows attention to detail',
    category: 'about',
    tags: ['owner', 'working', 'video', 'social'],
    notes: 'GOLD for social media'
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
    const after = portfolioManifest.find(img => img.filename === before.pairedWith && img.folder === before.folder);
    if (after) {
      pairs.push({ before, after });
    }
  }
  
  return pairs;
}

/**
 * Get hero images
 */
export function getHeroImages(): PortfolioImage[] {
  return portfolioManifest.filter(img => img.type === 'hero');
}

/**
 * URL builder (images served from R2 via /api/assets/)
 */
export function getImageUrl(image: PortfolioImage): string {
  return `/api/assets/portfolio/${image.folder}/${image.filename}`;
}
