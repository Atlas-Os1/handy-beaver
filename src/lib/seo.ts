/**
 * SEO utilities for The Handy Beaver
 * Generates <head> meta tags, Open Graph, Twitter Cards, and JSON-LD schema
 * for every page — targeting SE Oklahoma local search.
 */

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;          // absolute URL or path
  url?: string;            // canonical path e.g. "/services"
  type?: 'website' | 'article';
  schema?: object | object[];  // extra JSON-LD blocks
  noindex?: boolean;
}

const SITE_URL  = 'https://handybeaver.co';
const SITE_NAME = 'The Handy Beaver';
const DEFAULT_IMAGE = 'https://handybeaver.co/beaver-avatar.png';
const PHONE = '+15803929061';
const EMAIL = 'contact@handybeaver.co';

// Local Business JSON-LD — on every page
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['HomeAndConstructionBusiness', 'LocalBusiness'],
  name: SITE_NAME,
  description: 'Professional carpentry, flooring, deck repair, tiny home finishing, and custom cabin signs for Southeast Oklahoma.',
  url: SITE_URL,
  telephone: PHONE,
  email: EMAIL,
  logo: `${SITE_URL}/beaver-avatar.png`,
  image: `${SITE_URL}/portfolio/hero/blue-pine-room.jpg`,
  priceRange: '$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Cash, Credit Card, Check',
  areaServed: [
    { '@type': 'City', name: 'Broken Bow', containedInPlace: { '@type': 'State', name: 'Oklahoma' } },
    { '@type': 'City', name: 'Hochatown', containedInPlace: { '@type': 'State', name: 'Oklahoma' } },
    { '@type': 'City', name: 'Idabel', containedInPlace: { '@type': 'State', name: 'Oklahoma' } },
    { '@type': 'City', name: 'Antlers', containedInPlace: { '@type': 'State', name: 'Oklahoma' } },
    { '@type': 'City', name: 'Hugo', containedInPlace: { '@type': 'State', name: 'Oklahoma' } },
    { '@type': 'City', name: 'McAlester', containedInPlace: { '@type': 'State', name: 'Oklahoma' } },
    { '@type': 'GeoShape', name: 'Southeast Oklahoma' }
  ],
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 34.0290,
    longitude: -94.7199
  },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '15:00' }
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Handyman & Craftsman Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Carpentry & Custom Woodwork' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Flooring Installation & Repair' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Deck Building & Repair' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tiny Home Finishing' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Custom Cabin Signs' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'General Home Maintenance' } },
    ]
  },
  sameAs: [
    'https://www.facebook.com/1040910635768535'
  ]
};

export function buildHead(seo: SeoConfig): string {
  const canonicalUrl = `${SITE_URL}${seo.url || '/'}`;
  const image = seo.image?.startsWith('http') ? seo.image : `${SITE_URL}${seo.image || '/beaver-avatar.png'}`;
  const fullTitle = `${seo.title} | ${SITE_NAME}`;
  const schemas = [localBusinessSchema, ...(Array.isArray(seo.schema) ? seo.schema : seo.schema ? [seo.schema] : [])];

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary SEO -->
  <title>${fullTitle}</title>
  <meta name="description" content="${seo.description}">
  ${seo.keywords ? `<meta name="keywords" content="${seo.keywords}">` : ''}
  <link rel="canonical" href="${canonicalUrl}">
  ${seo.noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}

  <!-- Geographic / Local -->
  <meta name="geo.region" content="US-OK">
  <meta name="geo.placename" content="Southeast Oklahoma">
  <meta name="geo.position" content="34.0290;-94.7199">
  <meta name="ICBM" content="34.0290, -94.7199">

  <!-- Open Graph -->
  <meta property="og:type" content="${seo.type || 'website'}">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${seo.description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${seo.description}">
  <meta name="twitter:image" content="${image}">

  <!-- Favicon / PWA -->
  <link rel="icon" type="image/png" href="/beaver-avatar.png">
  <link rel="apple-touch-icon" href="/beaver-avatar.png">
  <meta name="theme-color" content="#8B4513">

  <!-- Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://res.cloudinary.com">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">${JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)}</script>
`.trim();
}

// Per-page SEO configs
export const pageSeo: Record<string, SeoConfig> = {
  home: {
    title: 'Handyman & Craftsman Services',
    description: 'The Handy Beaver — SE Oklahoma\'s detail-oriented craftsman. Carpentry, flooring, decks, tiny homes & custom cabin signs. 25 years experience. Free quotes.',
    keywords: 'handyman Broken Bow OK, carpenter Southeast Oklahoma, flooring installation Hochatown, deck repair McCurtain County, custom cabin signs Oklahoma, tiny home finishing SE Oklahoma',
    url: '/',
    image: '/portfolio/hero/blue-pine-room.jpg',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What areas does The Handy Beaver serve?', acceptedAnswer: { '@type': 'Answer', text: 'We serve all of Southeast Oklahoma including Broken Bow, Hochatown, Idabel, Antlers, Hugo, McAlester and surrounding McCurtain, Pushmataha, and Pittsburg counties.' } },
        { '@type': 'Question', name: 'How much does a handyman service call cost?', acceptedAnswer: { '@type': 'Answer', text: 'Service calls start at $175 for up to 2 hours. Half day (4 hrs) is $350 and a full day (8 hrs) is $650. Customer pays all materials.' } },
        { '@type': 'Question', name: 'Do you build custom cabin signs?', acceptedAnswer: { '@type': 'Answer', text: 'Yes! We CNC-carve custom cedar and pine signs for cabins, addresses, and businesses. Prices start at $125 for a 12×18" sign with 5-7 day turnaround.' } },
        { '@type': 'Question', name: 'Do you work on Airbnb and vacation rental cabins?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. We work extensively in the Hochatown/Beavers Bend area on cabin maintenance, repairs, and custom wood features for short-term rentals.' } }
      ]
    }
  },
  services: {
    title: 'Services — Carpentry, Flooring, Decks & More',
    description: 'Full-service handyman and craftsman work in SE Oklahoma. Carpentry, hardwood flooring, deck building, bathroom remodels, home maintenance and more.',
    keywords: 'handyman services Broken Bow, carpentry Oklahoma, hardwood flooring installation, deck building SE Oklahoma, bathroom remodel McCurtain County',
    url: '/services',
    image: '/portfolio/flooring/hardwood-finished-kitchen.jpg',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Handyman & Craftsman Services',
      provider: { '@type': 'LocalBusiness', name: 'The Handy Beaver', url: 'https://handybeaver.co' },
      areaServed: 'Southeast Oklahoma',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: [
          { '@type': 'Offer', name: 'Carpentry', price: '175.00', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Flooring Installation', price: '175.00', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Deck Repair & Building', price: '175.00', priceCurrency: 'USD' },
        ]
      }
    }
  },
  pricing: {
    title: 'Pricing — Transparent Flat-Rate Handyman Rates',
    description: 'Clear, honest pricing. Service calls from $175, half days $350, full days $650. Monthly maintenance subscriptions from $75/mo. No hidden fees.',
    keywords: 'handyman prices SE Oklahoma, handyman cost Broken Bow, carpenter rates Oklahoma, how much does handyman cost',
    url: '/pricing',
  },
  gallery: {
    title: 'Project Gallery — Carpentry, Flooring & Cabin Work',
    description: 'Before & after photos from our Southeast Oklahoma projects. Custom woodwork, flooring, bathrooms, tiny homes, deck builds and cabin signs.',
    keywords: 'handyman portfolio Oklahoma, carpentry before after, flooring installation photos, custom cabin signs gallery',
    url: '/gallery',
    image: '/portfolio/bathroom/shiplap-finished.jpg',
  },
  tinyHomes: {
    title: 'Tiny Home Finishing — SE Oklahoma',
    description: 'Tiny home finish packages starting at $75/sq.ft. Modern Minimal and Rustic Cabin styles. Pine T&G walls, LVP flooring, custom trim. Based in SE Oklahoma.',
    keywords: 'tiny home finishing Oklahoma, tiny house contractor SE Oklahoma, pine tongue groove walls, LVP flooring tiny home',
    url: '/tiny-homes',
    image: '/portfolio/tiny-home/exterior.jpg',
  },
  signs: {
    title: 'Custom Cabin Signs — CNC Carved Cedar & Pine',
    description: 'Hand-finished CNC cabin signs for Oklahoma cabins and Airbnbs. Cedar or pine, weatherproof, AI mockup before cutting. Starting at $125. Local delivery.',
    keywords: 'custom cabin signs Oklahoma, CNC wood signs Broken Bow, Airbnb cabin sign maker, cedar sign Hochatown OK',
    url: '/signs',
    image: '/portfolio/signs/handy-beaver-business-sign.png',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Custom CNC Cabin Sign',
      description: 'Hand-finished CNC-carved cedar or pine signs for cabins, Airbnbs, and businesses in SE Oklahoma.',
      brand: { '@type': 'Brand', name: 'The Handy Beaver' },
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '125', highPrice: '525', priceCurrency: 'USD',
        offerCount: '4',
        seller: { '@type': 'LocalBusiness', name: 'The Handy Beaver' }
      }
    }
  },
  serviceArea: {
    title: 'Service Area — Southeast Oklahoma Handyman',
    description: 'Serving Broken Bow, Hochatown, Idabel, Antlers, Hugo, McAlester and all of SE Oklahoma. McCurtain, Pushmataha, Pittsburg, Choctaw and Atoka counties.',
    keywords: 'handyman Broken Bow OK, handyman Hochatown, handyman Idabel OK, contractor McCurtain County Oklahoma, SE Oklahoma service area',
    url: '/service-area',
  },
  contact: {
    title: 'Contact & Free Quote — SE Oklahoma Handyman',
    description: 'Get a free quote from The Handy Beaver. Call, text, or fill out our online form. Serving SE Oklahoma with fast response times.',
    keywords: 'free handyman quote Oklahoma, contact handyman Broken Bow, hire carpenter SE Oklahoma',
    url: '/contact',
    noindex: false,
  },
  about: {
    title: 'About — 25 Years of Craftsman Experience',
    description: 'Meet the team behind The Handy Beaver. 25+ years of carpentry and home improvement experience in Southeast Oklahoma. Detail-oriented, honest, and local.',
    keywords: 'about handyman Oklahoma, experienced carpenter SE Oklahoma, local contractor Broken Bow',
    url: '/about',
  },
  blog: {
    title: 'Blog — Home Improvement Tips for SE Oklahoma',
    description: 'DIY tips, project showcases, and home maintenance advice from SE Oklahoma\'s favorite handyman service.',
    keywords: 'home improvement tips Oklahoma, DIY cabin maintenance, handyman blog SE Oklahoma',
    url: '/blog',
  },
  quote: {
    title: 'Get an Instant Quote',
    description: 'Get an instant online estimate for your home improvement project. No commitment required.',
    url: '/quote',
    noindex: false,
  },
  howItWorks: {
    title: 'How It Works — Simple 3-Step Process',
    description: 'Getting work done with The Handy Beaver is easy. Request a quote, we schedule, you relax. Transparent pricing, 25 years experience.',
    url: '/how-it-works',
  }
};
