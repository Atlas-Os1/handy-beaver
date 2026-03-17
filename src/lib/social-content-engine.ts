/**
 * Social Content Engine for Lil Beaver 🦫
 * 
 * Creative social media generation with:
 * - Post variety (different styles, formats, tones)
 * - Gallery integration (real project photos)
 * - Performance tracking (learn what works)
 * - Authenticity (no robotic templates)
 */

import { portfolioManifest, getImageUrl, getFeaturedImages, getBeforeAfterPairs, PortfolioImage, PortfolioCategory } from '../../config/portfolio-manifest';
import { r2PortfolioImages } from '../../config/r2-portfolio';

// Post styles to rotate through
export type PostStyle = 
  | 'tip'              // Quick woodworking/DIY tip
  | 'before-after'     // Transformation showcase
  | 'behind-scenes'    // Work in progress, on-site
  | 'seasonal'         // Weather/season relevant
  | 'customer-story'   // (Fictional) testimonial feel
  | 'fun-fact'         // Industry trivia
  | 'question'         // Engagement bait (good kind)
  | 'milestone'        // Business celebration
  | 'local-pride'      // Oklahoma/local community
  | 'tool-spotlight'   // Favorite tools, why they matter
  | 'mistake-lesson'   // What NOT to do (relatable)
  | 'inspiration'      // Motivational craftsman vibe
  | 'weekend-project'  // DIY ideas customers can try
  | 'material-deep-dive' // Blue pine, hardwood, etc.
  | 'raw-moment';      // Candid, unpolished authenticity

// Content themes
export type ContentTheme =
  | 'bathroom-remodel'
  | 'deck-outdoor'
  | 'flooring'
  | 'specialty-wood'
  | 'trim-carpentry'
  | 'general-handyman'
  | 'business-life'
  | 'oklahoma-local'
  | 'seasonal-timing';

// Platform targets
export type Platform = 'facebook' | 'instagram' | 'both';

// Tone variations
export type Tone = 
  | 'casual'      // Hey y'all
  | 'professional' // Quality craftsmanship
  | 'humorous'    // Dad jokes, puns
  | 'educational' // Did you know...
  | 'personal'    // Real talk
  | 'urgent'      // Limited availability
  | 'celebratory'; // Just finished!

export interface ContentIdea {
  style: PostStyle;
  theme: ContentTheme;
  tone: Tone;
  useGalleryImage: boolean;
  galleryImage?: PortfolioImage;
  prompt: string;
  hashtags: string[];
  bestTimeToPost?: string; // e.g. "morning", "evening", "weekend"
}

export interface GeneratedPost {
  caption: string;
  imageUrl?: string;
  imageDescription?: string;
  hashtags: string[];
  platform: Platform;
  style: PostStyle;
  theme: ContentTheme;
  tone: Tone;
  generatedAt: number;
  source: 'gallery' | 'ai-generated' | 'text-only';
}

// Seasonal context
function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function getDayOfWeek(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}

// Random selection helpers
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Hashtag pools
const CORE_HASHTAGS = ['#HandyBeaver', '#SoutheastOklahoma', '#LocalCraftsman'];

const STYLE_HASHTAGS: Record<string, string[]> = {
  bathroom: ['#BathroomRemodel', '#ShowerTile', '#BathroomMakeover', '#Shiplap'],
  flooring: ['#Hardwood', '#FlooringInstall', '#WoodFloors', '#FloorRepair'],
  deck: ['#DeckLife', '#OutdoorLiving', '#DeckRepair', '#BackyardGoals'],
  wood: ['#BluePine', '#BeetleKill', '#SpecialtyWood', '#WoodWorking'],
  trim: ['#TrimWork', '#Carpentry', '#CustomTrim', '#Molding'],
  general: ['#Handyman', '#FixIt', '#HomeRepair', '#Craftsman'],
  oklahoma: ['#Oklahoma', '#OklahomaProud', '#BrokenBow', '#Hochatown'],
};

const ENGAGEMENT_HASHTAGS = [
  '#BeforeAndAfter', '#Transformation', '#SmallBusiness', '#SupportLocal',
  '#HomeImprovement', '#DIY', '#Woodworker', '#TradesLife'
];

// Generate hashtags based on content
function generateHashtags(theme: ContentTheme, style: PostStyle, maxCount: number = 12): string[] {
  const tags = [...CORE_HASHTAGS];
  
  // Add theme-specific
  if (theme.includes('bathroom')) tags.push(...STYLE_HASHTAGS.bathroom.slice(0, 2));
  if (theme.includes('flooring')) tags.push(...STYLE_HASHTAGS.flooring.slice(0, 2));
  if (theme.includes('deck') || theme.includes('outdoor')) tags.push(...STYLE_HASHTAGS.deck.slice(0, 2));
  if (theme.includes('wood') || theme.includes('specialty')) tags.push(...STYLE_HASHTAGS.wood.slice(0, 2));
  if (theme.includes('trim') || theme.includes('carpentry')) tags.push(...STYLE_HASHTAGS.trim.slice(0, 2));
  if (theme.includes('oklahoma') || theme.includes('local')) tags.push(...STYLE_HASHTAGS.oklahoma.slice(0, 2));
  
  // Add engagement hashtags
  tags.push(...shuffle(ENGAGEMENT_HASHTAGS).slice(0, 3));
  
  // Style-specific
  if (style === 'before-after') tags.push('#BeforeAndAfter', '#Transformation');
  if (style === 'tip') tags.push('#ProTip', '#DIYTips');
  if (style === 'behind-scenes') tags.push('#BehindTheScenes', '#WorkInProgress');
  
  // Dedupe and limit
  return [...new Set(tags)].slice(0, maxCount);
}

// Content idea generator
export function generateContentIdea(recentStyles: PostStyle[] = []): ContentIdea {
  // Avoid repeating recent styles
  const availableStyles: PostStyle[] = [
    'tip', 'before-after', 'behind-scenes', 'seasonal', 'customer-story',
    'fun-fact', 'question', 'local-pride', 'tool-spotlight', 'mistake-lesson',
    'inspiration', 'weekend-project', 'material-deep-dive', 'raw-moment'
  ].filter(s => !recentStyles.includes(s));
  
  const style = pick(availableStyles.length > 0 ? availableStyles : ['tip', 'behind-scenes', 'question']);
  
  // Theme based on style
  let theme: ContentTheme;
  if (style === 'local-pride' || style === 'seasonal') {
    theme = pick(['oklahoma-local', 'seasonal-timing', 'business-life']);
  } else {
    theme = pick([
      'bathroom-remodel', 'deck-outdoor', 'flooring', 'specialty-wood', 
      'trim-carpentry', 'general-handyman'
    ]);
  }
  
  // Tone varies by style
  let tone: Tone;
  if (style === 'tip' || style === 'mistake-lesson') {
    tone = pick(['educational', 'casual', 'humorous']);
  } else if (style === 'behind-scenes' || style === 'raw-moment') {
    tone = pick(['personal', 'casual']);
  } else if (style === 'question') {
    tone = pick(['casual', 'humorous']);
  } else {
    tone = pick(['casual', 'professional', 'personal']);
  }
  
  // Decide if we use gallery image
  const useGalleryImage = Math.random() > 0.3; // 70% chance to use real photo
  let galleryImage: PortfolioImage | undefined;
  
  if (useGalleryImage) {
    if (style === 'before-after') {
      const pairs = getBeforeAfterPairs();
      if (pairs.length > 0) {
        const pair = pick(pairs);
        galleryImage = pair.after; // Use the 'after' image
      }
    } else {
      // Match theme to category
      const categoryMap: Record<string, PortfolioCategory[]> = {
        'bathroom-remodel': ['bathroom-remodels'],
        'deck-outdoor': ['decks-outdoor', 'siding'],
        'flooring': ['flooring'],
        'specialty-wood': ['specialty-wood'],
        'trim-carpentry': ['trim-carpentry', 'doors'],
        'general-handyman': ['kitchen-bar', 'tiny-home', 'stairs-railings'],
      };
      
      const categories = categoryMap[theme] || [];
      const matchingImages = portfolioManifest.filter(img => 
        categories.includes(img.category) && img.type !== 'before'
      );
      
      if (matchingImages.length > 0) {
        galleryImage = pick(matchingImages);
      } else {
        // Fallback to featured
        const featured = getFeaturedImages();
        galleryImage = pick(featured);
      }
    }
  }
  
  // Generate prompt for AI
  const prompt = buildContentPrompt(style, theme, tone, galleryImage, getCurrentSeason());
  
  return {
    style,
    theme,
    tone,
    useGalleryImage,
    galleryImage,
    prompt,
    hashtags: generateHashtags(theme, style),
    bestTimeToPost: getBestPostTime(style)
  };
}

function getBestPostTime(style: PostStyle): string {
  // Different styles work at different times
  const timeMap: Record<PostStyle, string> = {
    'tip': 'morning',
    'before-after': 'afternoon',
    'behind-scenes': 'morning',
    'seasonal': 'afternoon',
    'customer-story': 'evening',
    'fun-fact': 'afternoon',
    'question': 'evening',
    'milestone': 'afternoon',
    'local-pride': 'evening',
    'tool-spotlight': 'morning',
    'mistake-lesson': 'afternoon',
    'inspiration': 'morning',
    'weekend-project': 'weekend-morning',
    'material-deep-dive': 'afternoon',
    'raw-moment': 'any'
  };
  return timeMap[style] || 'afternoon';
}

function buildContentPrompt(
  style: PostStyle, 
  theme: ContentTheme, 
  tone: Tone, 
  image?: PortfolioImage,
  season?: string
): string {
  const base = `Write a ${tone} social media post for The Handy Beaver, a traveling craftsman in Southeast Oklahoma.`;
  
  const imageContext = image 
    ? `The post features this image: ${image.title} - ${image.description}. Category: ${image.category}.`
    : 'This will be a text-only post or paired with AI-generated content.';
  
  const seasonContext = season ? `Current season: ${season}.` : '';
  
  const styleGuides: Record<PostStyle, string> = {
    'tip': 'Share a quick, practical tip about home improvement or woodworking. Keep it actionable.',
    'before-after': 'Celebrate a transformation! Show the dramatic difference your work makes.',
    'behind-scenes': 'Give a peek at work in progress. Make people feel like they are on the job site.',
    'seasonal': `Tie the content to ${season} - seasonal maintenance, weather prep, or timely projects.`,
    'customer-story': 'Tell a story about helping someone (keep it general, relatable). Show the human side.',
    'fun-fact': 'Share something surprising or interesting about woodworking, materials, or the trade.',
    'question': 'Ask an engaging question that invites responses. Make people want to comment.',
    'milestone': 'Celebrate a business win - a completed project, a happy customer, or a work anniversary.',
    'local-pride': 'Show love for Southeast Oklahoma. Connect the business to the community.',
    'tool-spotlight': 'Talk about a favorite tool and why it matters for quality work.',
    'mistake-lesson': 'Share a common mistake (that homeowners or DIYers make) and how to avoid it.',
    'inspiration': 'Motivational craftsman energy. Pride in the work, respect for the trade.',
    'weekend-project': 'Suggest a DIY project homeowners could tackle themselves (simple stuff).',
    'material-deep-dive': 'Educate about a material - beetle kill pine, hardwood types, etc.',
    'raw-moment': 'Authentic, unpolished moment. Could be tiring, funny, or just real.'
  };
  
  const toneGuides: Record<Tone, string> = {
    'casual': 'Use conversational language. Contractions, simple words, maybe an emoji or two.',
    'professional': 'Confident and knowledgeable. Show expertise without being stiff.',
    'humorous': 'Include a pun, dad joke, or playful observation. Keep it light.',
    'educational': 'Teach something. Use "Did you know" or "Pro tip" framing.',
    'personal': 'First person, authentic. Share feelings or personal perspective.',
    'urgent': 'Create gentle urgency. Limited slots, seasonal timing, etc.',
    'celebratory': 'Excited energy! Use exclamation marks sparingly but effectively.'
  };
  
  return `${base}

${imageContext}

${seasonContext}

Style: ${style}
${styleGuides[style]}

Tone: ${tone}
${toneGuides[tone]}

Theme: ${theme}

Requirements:
- Keep it under 280 characters for Twitter compatibility (even though we post on FB/IG)
- Don't use hashtags in the caption (they'll be added separately)
- Sound like a real person, not a marketing bot
- Reference Southeast Oklahoma or the traveling craftsman angle naturally
- End with something that invites engagement (question, call to action, or relatable statement)

Return ONLY the caption text, nothing else.`;
}

// Pick a random gallery image for inspiration (even if not posting it)
export function getGalleryInspiration(): PortfolioImage {
  return pick(portfolioManifest);
}

// Get before/after pairs for transformation posts
export function getTransformationContent(): { before: PortfolioImage; after: PortfolioImage } | null {
  const pairs = getBeforeAfterPairs();
  return pairs.length > 0 ? pick(pairs) : null;
}

// Recent post tracking for variety
export interface PostHistory {
  styles: PostStyle[];
  themes: ContentTheme[];
  imagesUsed: string[]; // filenames
  lastPosted: number;
}

export function updatePostHistory(
  history: PostHistory, 
  post: GeneratedPost,
  maxHistory: number = 10
): PostHistory {
  return {
    styles: [post.style, ...history.styles].slice(0, maxHistory),
    themes: [post.theme, ...history.themes].slice(0, maxHistory),
    imagesUsed: post.imageUrl 
      ? [post.imageUrl, ...history.imagesUsed].slice(0, maxHistory)
      : history.imagesUsed,
    lastPosted: Date.now()
  };
}

// Export for Lil Beaver to use
// Combined portfolio: original manifest + R2 uploads (160 images)
const fullPortfolio = [...portfolioManifest, ...r2PortfolioImages.map(img => ({
  ...img,
  getUrl: () => `/api/assets/${img.r2Path}`
}))];

// Get random R2 image for a category
function getR2Image(category?: string): { url: string; title: string; folder: string } | null {
  const filtered = category 
    ? r2PortfolioImages.filter(img => img.category === category || img.folder.toLowerCase().includes(category.toLowerCase()))
    : r2PortfolioImages;
  
  if (filtered.length === 0) return null;
  const img = filtered[Math.floor(Math.random() * filtered.length)];
  return {
    url: `/api/assets/${img.r2Path}`,
    title: img.title,
    folder: img.folder
  };
}

// Get all R2 images for a folder
function getR2ImagesByFolder(folder: string): Array<{ url: string; filename: string }> {
  return r2PortfolioImages
    .filter(img => img.folder.toLowerCase() === folder.toLowerCase())
    .map(img => ({
      url: `/api/assets/${img.r2Path}`,
      filename: img.filename
    }));
}

export const socialEngine = {
  generateContentIdea,
  getGalleryInspiration,
  getTransformationContent,
  getImageUrl,
  getFeaturedImages,
  getBeforeAfterPairs,
  portfolioManifest,
  r2PortfolioImages,
  fullPortfolio,
  getR2Image,
  getR2ImagesByFolder,
  updatePostHistory,
  getCurrentSeason,
  getDayOfWeek,
};
