/**
 * Competitor Tracking Configuration
 * Monitor these competitors to stay ahead in the market
 */

export interface Competitor {
  id: string;
  name: string;
  location: string;
  facebook?: string;
  website?: string;
  instagram?: string;
  services: string[];
  notes?: string;
}

export const competitors: Competitor[] = [
  {
    id: 'blackjack-mountain',
    name: 'Blackjack Mountain Construction',
    location: 'Hochatown/Broken Bow, OK',
    facebook: 'https://www.facebook.com/blackjackmountainconstruction',
    services: ['Construction', 'Remodeling', 'Cabin Building'],
    notes: 'Major Hochatown competitor, cabin construction focus'
  },
  {
    id: 'davis-ms-contracting',
    name: 'Davis MS Contracting',
    location: 'Southeast Oklahoma',
    facebook: 'https://www.facebook.com/davismscontracting',
    services: ['General Contracting', 'Remodeling'],
    notes: 'Local contractor'
  },
  {
    id: 'lonestar-remodeling',
    name: 'Lone Star Remodeling & Construction',
    location: 'Dallas, TX',
    website: 'https://lonestarremodelingdallas.com/',
    facebook: 'https://www.facebook.com/lonestarremodelingandconstruction/',
    services: ['Remodeling', 'Construction', 'Home Improvement'],
    notes: 'Dallas-based, larger operation'
  },
  {
    id: 'cruz-all-services',
    name: 'Cruz All Services',
    location: 'Oklahoma',
    website: 'https://www.cruzallservices.com/',
    facebook: 'https://www.facebook.com/cruzallserviceshandyman/',
    services: ['Handyman', 'Home Repair', 'Maintenance'],
    notes: 'Direct handyman competitor'
  }
];

/**
 * What to track for each competitor
 */
export const trackingMetrics = {
  facebook: [
    'follower_count',
    'post_frequency',
    'engagement_rate',
    'review_rating',
    'review_count',
    'response_time',
    'content_types', // photos, videos, offers
  ],
  website: [
    'services_offered',
    'pricing_visible',
    'portfolio_quality',
    'contact_methods',
    'testimonials_count',
    'blog_posts',
    'seo_keywords',
  ],
  instagram: [
    'follower_count',
    'post_frequency',
    'hashtags_used',
    'story_frequency',
    'reels_count',
  ]
};

/**
 * Competitive advantages to highlight
 */
export const ourAdvantages = [
  'AI-powered scheduling and quotes',
  'Instant response via Lil Beaver assistant',
  'Online booking system',
  'Real-time project tracking',
  'Transparent pricing',
  'Professional portfolio website',
  'Active social media presence',
  'Customer portal for quotes/invoices',
  'Voice assistant integration',
];

/**
 * Areas to improve based on competitor analysis
 */
export const improvementAreas = [
  'Video content (before/after transformations)',
  'Customer testimonial videos',
  'Behind-the-scenes content',
  'Educational tips posts',
  'Local community engagement',
  'Google Business reviews',
  'Referral program',
];
