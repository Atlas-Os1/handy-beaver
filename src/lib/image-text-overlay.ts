/**
 * Image Text Overlay Generator
 * 
 * Takes portfolio images and adds marketing text overlays
 * for social media posts. Uses SVG-based text rendering.
 */

export interface TextOverlayOptions {
  // Text content
  headline: string;
  subtext?: string;
  cta?: string;  // Call to action
  
  // Positioning
  position?: 'top' | 'center' | 'bottom';
  align?: 'left' | 'center' | 'right';
  
  // Styling
  theme?: 'dark' | 'light' | 'branded';
  fontSize?: 'small' | 'medium' | 'large';
  
  // Branding
  showLogo?: boolean;
  showPhone?: boolean;
}

export interface OverlayResult {
  success: boolean;
  imageUrl?: string;
  svgDataUrl?: string;
  error?: string;
}

// Brand colors
const BRAND = {
  primary: '#8B4513',     // Saddle brown (beaver color)
  secondary: '#D2691E',   // Chocolate 
  accent: '#FFD700',      // Gold
  dark: '#2C1810',        // Dark brown
  light: '#FFF8DC',       // Cornsilk
  phone: '(580) 566-7017',
  tagline: 'Dam Good Work, Every Time',
};

/**
 * Generate an SVG overlay for an image
 */
export function generateOverlaySvg(
  imageUrl: string,
  options: TextOverlayOptions,
  width: number = 1200,
  height: number = 630
): string {
  const {
    headline,
    subtext,
    cta,
    position = 'bottom',
    align = 'center',
    theme = 'dark',
    fontSize = 'medium',
    showLogo = true,
    showPhone = true,
  } = options;

  // Font sizes based on option
  const sizes = {
    small: { headline: 36, subtext: 20, cta: 24 },
    medium: { headline: 48, subtext: 24, cta: 28 },
    large: { headline: 64, subtext: 32, cta: 36 },
  };
  const size = sizes[fontSize];

  // Colors based on theme
  const colors = {
    dark: { bg: 'rgba(0,0,0,0.7)', text: '#FFFFFF', accent: BRAND.accent },
    light: { bg: 'rgba(255,255,255,0.85)', text: '#2C1810', accent: BRAND.primary },
    branded: { bg: 'rgba(44,24,16,0.85)', text: '#FFF8DC', accent: BRAND.accent },
  };
  const color = colors[theme];

  // Position calculations
  const padding = 40;
  const textX = align === 'left' ? padding : align === 'right' ? width - padding : width / 2;
  const textAnchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
  
  let textY: number;
  let boxY: number;
  let boxHeight = 180;
  
  if (subtext) boxHeight += 40;
  if (cta) boxHeight += 50;
  if (showPhone) boxHeight += 30;

  switch (position) {
    case 'top':
      boxY = 0;
      textY = padding + size.headline;
      break;
    case 'center':
      boxY = (height - boxHeight) / 2;
      textY = boxY + padding + size.headline;
      break;
    case 'bottom':
    default:
      boxY = height - boxHeight;
      textY = boxY + padding + size.headline;
  }

  // Build SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  
  <!-- Background Image -->
  <image href="${imageUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- Overlay Box -->
  <rect x="0" y="${boxY}" width="${width}" height="${boxHeight}" fill="${color.bg}"/>
  
  <!-- Headline -->
  <text x="${textX}" y="${textY}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${size.headline}" 
        font-weight="bold"
        fill="${color.text}" 
        text-anchor="${textAnchor}">
    ${escapeXml(headline)}
  </text>`;

  let currentY = textY;

  // Subtext
  if (subtext) {
    currentY += size.subtext + 20;
    svg += `
  <text x="${textX}" y="${currentY}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${size.subtext}" 
        fill="${color.text}" 
        text-anchor="${textAnchor}"
        opacity="0.9">
    ${escapeXml(subtext)}
  </text>`;
  }

  // CTA Button
  if (cta) {
    currentY += size.cta + 30;
    const ctaWidth = cta.length * (size.cta * 0.6) + 40;
    const ctaX = align === 'left' ? textX : align === 'right' ? textX - ctaWidth : textX - ctaWidth / 2;
    
    svg += `
  <rect x="${ctaX}" y="${currentY - size.cta}" 
        width="${ctaWidth}" height="${size.cta + 16}" 
        rx="8" fill="${color.accent}"/>
  <text x="${ctaX + ctaWidth / 2}" y="${currentY + 4}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${size.cta}" 
        font-weight="bold"
        fill="${theme === 'light' ? '#FFFFFF' : BRAND.dark}" 
        text-anchor="middle">
    ${escapeXml(cta)}
  </text>`;
  }

  // Phone number
  if (showPhone) {
    currentY += 40;
    svg += `
  <text x="${textX}" y="${currentY}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="22" 
        fill="${color.accent}" 
        text-anchor="${textAnchor}">
    📞 ${BRAND.phone}
  </text>`;
  }

  // Logo/Branding (top corner)
  if (showLogo) {
    svg += `
  <rect x="${width - 220}" y="20" width="200" height="50" rx="8" fill="rgba(0,0,0,0.6)"/>
  <text x="${width - 120}" y="52" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="20" 
        font-weight="bold"
        fill="#FFFFFF" 
        text-anchor="middle">
    🦫 The Handy Beaver
  </text>`;
  }

  svg += `
</svg>`;

  return svg;
}

/**
 * Convert SVG to data URL for embedding
 */
export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Generate marketing text for different post styles
 */
export function generateMarketingText(
  style: string,
  theme: string
): { headline: string; subtext?: string; cta?: string } {
  const templates: Record<string, Record<string, { headline: string; subtext?: string; cta?: string }>> = {
    'tip': {
      'bathroom-remodel': {
        headline: 'Pro Tip: Bathroom Edition',
        subtext: 'Small upgrades make a big difference',
        cta: 'Get a Free Quote',
      },
      'flooring': {
        headline: 'Flooring Done Right',
        subtext: 'The first time, every time',
        cta: 'Book Now',
      },
      'deck-outdoor': {
        headline: 'Deck Season is Here!',
        subtext: "Don't wait until it's too late",
        cta: 'Schedule Service',
      },
      'default': {
        headline: 'Pro Tip of the Day',
        subtext: 'Quality work you can trust',
        cta: 'Learn More',
      },
    },
    'before-after': {
      'bathroom-remodel': {
        headline: 'The Transformation',
        subtext: 'From tired to inspired',
        cta: 'See More Projects',
      },
      'flooring': {
        headline: 'New Floors, New Life',
        subtext: 'Professional installation',
        cta: 'Get Started',
      },
      'deck-outdoor': {
        headline: 'Deck Revival',
        subtext: 'Staining & restoration',
        cta: 'Free Estimate',
      },
      'default': {
        headline: 'Before → After',
        subtext: 'Quality craftsmanship',
        cta: 'View Gallery',
      },
    },
    'seasonal': {
      'deck-outdoor': {
        headline: 'Spring is Here! 🌸',
        subtext: 'Get your outdoor spaces ready',
        cta: 'Book Spring Service',
      },
      'default': {
        headline: 'Seasonal Special',
        subtext: 'Limited time offer',
        cta: 'Call Today',
      },
    },
    'local-pride': {
      'default': {
        headline: 'Serving SE Oklahoma',
        subtext: 'Broken Bow • Hochatown • Idabel',
        cta: 'Local & Reliable',
      },
    },
    'question': {
      'default': {
        headline: "What's Your Project?",
        subtext: 'No job too small',
        cta: "Let's Talk",
      },
    },
  };

  const styleTemplates = templates[style] || templates['tip'];
  return styleTemplates[theme] || styleTemplates['default'] || templates['tip']['default'];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Marketing post templates with pre-designed layouts
 */
export const POST_TEMPLATES = {
  'promo-bottom': {
    position: 'bottom' as const,
    theme: 'dark' as const,
    fontSize: 'large' as const,
    showLogo: true,
    showPhone: true,
  },
  'promo-center': {
    position: 'center' as const,
    theme: 'branded' as const,
    fontSize: 'large' as const,
    showLogo: true,
    showPhone: true,
  },
  'minimal': {
    position: 'bottom' as const,
    theme: 'dark' as const,
    fontSize: 'medium' as const,
    showLogo: true,
    showPhone: false,
  },
  'clean-light': {
    position: 'bottom' as const,
    theme: 'light' as const,
    fontSize: 'medium' as const,
    showLogo: true,
    showPhone: true,
  },
};
