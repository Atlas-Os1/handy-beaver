/**
 * SEO Keywords Configuration
 * 
 * Based on market research of Hochatown/Broken Bow vacation rental market.
 * Target audience: Out-of-state cabin investors (primarily Dallas-Fort Worth)
 * 
 * Updated: March 2026
 */

export const seoKeywords = {
  // Primary location keywords (highest priority)
  locations: {
    primary: [
      "Hochatown",
      "Broken Bow",
      "Beavers Bend",
      "Southeast Oklahoma",
    ],
    secondary: [
      "McCurtain County",
      "Mountain Fork River",
      "Broken Bow Lake",
      "Ouachita Mountains",
      "Kiamichi Mountains",
    ],
    regional: [
      "SE Oklahoma",
      "Oklahoma cabin country",
      "Broken Bow area",
    ],
  },

  // Service keywords - what we do
  services: {
    // High-priority cabin maintenance
    cabinMaintenance: [
      "cabin maintenance",
      "vacation rental maintenance",
      "Airbnb maintenance",
      "VRBO maintenance",
      "short-term rental repairs",
      "cabin repair service",
      "rental property maintenance",
    ],
    
    // Specific services (match to actual offerings)
    deck: [
      "deck repair",
      "deck staining",
      "deck sealing",
      "deck maintenance",
      "wood deck repair",
      "deck restoration",
      "deck refinishing",
    ],
    
    siding: [
      "siding repair",
      "siding replacement",
      "log cabin siding",
      "cedar siding repair",
      "cabin siding maintenance",
    ],
    
    roofing: [
      "roof sweep",
      "roof maintenance",
      "roof repair",
      "gutter cleaning",
      "roof inspection",
      "minor roof repairs",
    ],
    
    trim: [
      "trim repair",
      "trim replacement",
      "exterior trim",
      "window trim",
      "door trim",
      "fascia repair",
    ],
    
    railings: [
      "railing repair",
      "deck railing",
      "stair railing",
      "balcony railing",
      "porch railing repair",
    ],
    
    stairs: [
      "stair repair",
      "deck stairs",
      "outdoor stairs",
      "step repair",
      "stair replacement",
    ],
    
    windows: [
      "window replacement",
      "window repair",
      "window installation",
      "cabin windows",
    ],
    
    doors: [
      "door replacement",
      "door repair",
      "exterior door installation",
      "screen door repair",
    ],
    
    general: [
      "handyman",
      "handyman services",
      "home repair",
      "property repair",
      "carpentry",
      "general contractor",
    ],
  },

  // Audience-focused keywords
  audience: {
    // Remote investor focused
    investors: [
      "cabin investor services",
      "investment property maintenance",
      "remote property management",
      "out-of-state cabin owner",
      "Dallas cabin owner services",
      "DFW vacation rental maintenance",
      "Texas cabin investor",
    ],
    
    // Property manager focused
    propertyManagers: [
      "property manager vendor",
      "PM maintenance contractor",
      "vacation rental contractor",
      "Airbnb vendor services",
      "turnover maintenance",
      "between-guest repairs",
    ],
    
    // Seasonal/urgency keywords
    seasonal: [
      "emergency cabin repair",
      "same-day handyman",
      "quick cabin fixes",
      "seasonal cabin prep",
      "winterization services",
      "spring deck prep",
    ],
  },

  // Long-tail keyword phrases (for content/blog)
  longTail: [
    "Hochatown cabin maintenance services",
    "Broken Bow vacation rental repairs",
    "handyman for Airbnb cabin Hochatown",
    "deck repair Beavers Bend area",
    "cabin siding repair Southeast Oklahoma",
    "emergency handyman Broken Bow",
    "vacation rental maintenance contractor Oklahoma",
    "reliable cabin repair service Hochatown",
    "out-of-state cabin owner maintenance Broken Bow",
    "Dallas investor cabin maintenance Oklahoma",
    "Hochatown property manager vendor",
    "Airbnb cabin turnover repairs Broken Bow",
    "deck staining service Hochatown",
    "roof sweep cabin Beavers Bend",
    "window replacement Broken Bow cabin",
  ],

  // Meta description templates
  metaTemplates: {
    home: "The Handy Beaver provides professional cabin maintenance and repair services in Hochatown, Broken Bow, and Southeast Oklahoma. Trusted by vacation rental owners and property managers.",
    services: "Expert deck repair, siding, roofing, and cabin maintenance for Hochatown and Broken Bow vacation rentals. Same-day emergency service available.",
    about: "Your reliable local handyman for Hochatown and Broken Bow cabins. Serving out-of-state investors and property managers with quality craftsmanship.",
    contact: "Need cabin repairs in Hochatown or Broken Bow? Contact The Handy Beaver for a free quote. We serve vacation rental owners across Southeast Oklahoma.",
  },

  // Structured data keywords (for schema markup)
  schemaKeywords: {
    serviceTypes: [
      "HandymanService",
      "HomeRepairService", 
      "DeckContractor",
      "CarpentryService",
    ],
    areaServed: [
      "Hochatown, OK",
      "Broken Bow, OK",
      "McCurtain County, OK",
      "Beavers Bend, OK",
    ],
  },
} as const;

// Helper: Generate title tags
export function generateTitle(page: string): string {
  const base = "The Handy Beaver";
  const location = "Hochatown & Broken Bow, OK";
  
  const titles: Record<string, string> = {
    home: `${base} | Cabin Maintenance & Repair | ${location}`,
    services: `Services | Deck, Siding, Roof Repair | ${base}`,
    about: `About | Your Local Cabin Handyman | ${base}`,
    contact: `Contact | Free Quotes | ${base} | ${location}`,
    blog: `Blog | Cabin Maintenance Tips | ${base}`,
  };
  
  return titles[page] || `${page} | ${base}`;
}

// Helper: Get keywords for page
export function getPageKeywords(page: string): string[] {
  const base = [
    ...seoKeywords.locations.primary,
    "cabin maintenance",
    "handyman",
    "vacation rental repairs",
  ];
  
  const pageSpecific: Record<string, string[]> = {
    home: [...base, "deck repair", "siding", "roofing"],
    services: [...seoKeywords.services.cabinMaintenance, ...seoKeywords.services.deck],
    about: [...base, "local contractor", "trusted handyman"],
    contact: [...base, "free quote", "emergency repair"],
  };
  
  return pageSpecific[page] || base;
}

export type SeoKeywords = typeof seoKeywords;
