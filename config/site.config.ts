/**
 * Site Configuration - Template Variables
 * 
 * All business-specific values are defined here.
 * Change these to rebrand the entire app.
 */

export const siteConfig = {
  // Business Identity
  business: {
    name: "The Handy Beaver",
    tagline: "Your Detail-Oriented Craftsman & Maintenance Service",
    description: "Professional carpentry, flooring, deck repair, and residential maintenance for Southeast Oklahoma",
    mascot: "🦫",
    email: "contact@handybeaver.co",
    phone: "+15803929061", // Main contact
    serviceArea: "Southeast Oklahoma",
  },

  // URLs
  urls: {
    site: "https://handybeaver.co",
    api: "https://handybeaver.co/api",
    dev: "https://handy-beaver.srvcflo.workers.dev", // Dev URL fallback
  },

  // Social Media (to be configured)
  social: {
    facebook: {
      pageId: "", // TBD - Minte will set up
      appId: "", // TBD
    },
    instagram: "",
  },

  // Payment Integration
  payments: {
    square: {
      applicationId: "", // TBD - Minte will set up
      locationId: "", // TBD
      environment: "sandbox" as "sandbox" | "production",
    },
  },

  // Pricing Structure
  pricing: {
    labor: {
      underSixHours: 175.00,
      overSixHours: 300.00, // per day
    },
    helper: {
      underSixHours: 100.00,
      overSixHours: 225.00, // per day
    },
    notes: "Customer pays all materials, consumables, and equipment rental",
  },

  // Service Blocks (one-time handyman bookings)
  serviceBlocks: {
    serviceCall: { hours: 2, price: 175, label: "Service Call" },
    halfDay: { hours: 4, price: 350, label: "Half Day" },
    fullDay: { hours: 8, price: 650, label: "Full Day" },
  },

  // Subscription Plans (monthly recurring maintenance)
  subscriptionPlans: {
    basic: { 
      hours: 1, 
      price: 75, 
      label: "Basic",
      features: ["1 hour/month", "Priority scheduling", "Photo task queue"]
    },
    standard: { 
      hours: 2, 
      price: 140, 
      label: "Standard",
      features: ["2 hours/month", "Priority scheduling", "Photo task queue", "10% off projects"]
    },
    premium: { 
      hours: 4, 
      price: 280, 
      label: "Premium",
      features: ["4 hours/month", "Same-week scheduling", "Photo task queue", "15% off projects", "Seasonal home checkup"]
    },
  },

  // Tiny Home Finish Packages (price per sq.ft.)
  tinyHomePackages: {
    modernMinimal: {
      pricePerSqft: 75,
      label: "Modern Minimal",
      description: "Clean drywall, basic trim, LVP flooring, painted cabinets",
      includes: ["Interior walls/ceiling", "LVP flooring", "Basic trim", "Painted cabinet area"],
    },
    rusticCabin: {
      pricePerSqft: 110,
      label: "Rustic Cabin",
      description: "Pine tongue-and-groove, corrugated metal accents, exposed beams",
      includes: ["Pine T&G walls/ceiling", "Rustic flooring", "Exposed beam finish", "Metal accent features"],
    },
  },

  // Residential Services (per sq.ft. ranges for quotes)
  residentialServices: {
    wallboard: { min: 3, max: 5, unit: "sq.ft.", label: "Wallboard/Drywall" },
    trim: { min: 2, max: 4, unit: "linear ft.", label: "Trim/Molding" },
    flooringLvp: { min: 4, max: 8, unit: "sq.ft.", label: "Flooring (LVP/Laminate)" },
    flooringHardwood: { min: 8, max: 15, unit: "sq.ft.", label: "Flooring (Hardwood)" },
    tile: { min: 8, max: 15, unit: "sq.ft.", label: "Tile" },
    decking: { min: 15, max: 25, unit: "sq.ft.", label: "Decking" },
  },

  // Google/Email Integration
  integrations: {
    googleCalendar: {
      email: "serviceflowagi@gmail.com",
    },
    email: {
      from: "noreply@handybeaver.co",
      support: "support@handybeaver.co",
    },
  },

  // Discord Notifications
  discord: {
    webhookUrl: "", // TBD - for scheduling notifications
    channelId: "1479281060222337034", // This thread
  },

  // AI Image Generation (Gemini Pro)
  imageGeneration: {
    provider: "google",
    model: "gemini-pro", // For visualizing project outcomes
    useCase: "Upload photo → AI shows finished project (siding, paint, repairs)",
  },

  // Design Theme
  theme: {
    style: "barnwood",
    cardEffect: "white-glow",
    colors: {
      primary: "#8B4513", // Saddle brown (wood)
      secondary: "#D2691E", // Chocolate
      accent: "#F5DEB3", // Wheat
      background: "#2C1810", // Dark wood
      card: "#FFFFFF",
      cardGlow: "rgba(255, 255, 255, 0.3)",
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
