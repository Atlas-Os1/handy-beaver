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
    tagline: "Your Cabin & Home Maintenance Service — SE Oklahoma",
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

  // Subscription Plans (monthly recurring cabin maintenance)
  subscriptionPlans: {
    cabinCare: { 
      hours: 1, 
      price: 199, 
      label: "Cabin Care",
      features: [
        "Monthly cabin safety inspection",
        "HVAC filter replacement",
        "Smoke/CO detector test",
        "Minor fix-it service on the spot",
        "Photo task queue",
        "Priority scheduling"
      ]
    },
    lodgeKeeper: { 
      hours: 2, 
      price: 299, 
      label: "Lodge Keeper",
      features: [
        "Bi-weekly cabin inspection & checkup",
        "Full 6-point maintenance checklist",
        "Hot tub health check",
        "HVAC filter + coil clean",
        "Minor repairs included",
        "10% off larger repairs",
        "Same-week scheduling"
      ]
    },
    premiumCare: { 
      hours: 4, 
      price: 399, 
      label: "Premium Care",
      features: [
        "Weekly cabin oversight",
        "Full 6-point inspection with photo report",
        "Hot tub service + chemicals",
        "HVAC tune-up (spring & fall)",
        "Winterization prep (pipes, heat tape)",
        "15% off all repairs",
        "24/7 emergency dispatch",
        "Seasonal deep inspection"
      ]
    },
  },

  // Cabin Add-On Services
  cabinAddOns: {
    hotTubService: { price: 125, label: "Hot Tub Service", description: "Weekly chemical check, filter clean, pump check" },
    winterization: { price: 250, label: "Seasonal Winterization", description: "Pipe wrap, heat tape, faucet blowout, fireplace check" },
    deepInspection: { price: 150, label: "Quarterly Deep Inspection", description: "Full 6-point checklist with photo report sent to owner" },
    annualBilling: { savings: "1 month free", label: "Annual Billing", description: "Pay for 11 months, get 12. Save ~8%" },
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
