/**
 * Intent Detection Module
 *
 * Detects visitor intent from UTM params, referrer, geo, and query params.
 * Returns signals used to personalize the hero section on the home page.
 */

export type VisitorIntent = 'cabin_owner' | 'sign_shopper' | 'maintenance' | 'general';

export interface IntentSignals {
  intent: VisitorIntent;
  city: string | null;
  isLocal: boolean;
  isOutOfState: boolean;
}

export interface HeroContent {
  headline: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
}

const LOCAL_CITIES = ['hochatown', 'broken bow', 'idabel', 'valliant', 'hugo', 'antlers', 'mccurtain'];
const INVESTOR_CITIES = ['dallas', 'fort worth', 'oklahoma city', 'okc', 'tulsa', 'houston', 'austin', 'san antonio'];

export function detectIntent(request: Request, cf?: any): IntentSignals {
  const url = new URL(request.url);
  const utmCampaign = url.searchParams.get('utm_campaign')?.toLowerCase() ?? '';
  const utmTerm = url.searchParams.get('utm_term')?.toLowerCase() ?? '';
  const ref = url.searchParams.get('ref')?.toLowerCase() ?? '';
  const referrer = request.headers.get('referer')?.toLowerCase() ?? '';

  const city = (cf?.city as string) ?? null;
  const cityLower = city?.toLowerCase() ?? '';
  const region = (cf?.region as string)?.toLowerCase() ?? '';

  const isLocal = LOCAL_CITIES.some(c => cityLower.includes(c) || region.includes(c));
  const isOutOfState = !isLocal && (
    INVESTOR_CITIES.some(c => cityLower.includes(c)) ||
    (cf?.regionCode && cf.regionCode !== 'OK')
  );

  // UTM-based detection (highest priority)
  if (utmCampaign.includes('sign') || utmTerm.includes('sign') || ref === 'signs') {
    return { intent: 'sign_shopper', city, isLocal, isOutOfState };
  }
  if (utmCampaign.includes('maintenance') || utmCampaign.includes('cabin_care') || ref === 'maintenance') {
    return { intent: 'maintenance', city, isLocal, isOutOfState };
  }
  if (utmCampaign.includes('cabin') || utmTerm.includes('cabin') || ref === 'cabin') {
    return { intent: 'cabin_owner', city, isLocal, isOutOfState };
  }

  // Referrer-based detection
  if (referrer.includes('airbnb') || referrer.includes('vrbo') || referrer.includes('vacasa')) {
    return { intent: 'cabin_owner', city, isLocal, isOutOfState };
  }

  // Geo-based detection (out-of-state visitors likely cabin investors)
  if (isOutOfState) {
    return { intent: 'cabin_owner', city, isLocal, isOutOfState };
  }

  return { intent: 'general', city, isLocal, isOutOfState };
}

export function getHeroContent(intent: VisitorIntent): HeroContent {
  switch (intent) {
    case 'cabin_owner':
      return {
        headline: 'Your Cabin, Maintained',
        subtitle: 'Monthly inspections, photo reports, and repairs handled — so you don\'t have to drive out every time something needs attention.',
        cta: 'See Maintenance Plans',
        ctaLink: '/pricing#maintenance',
      };
    case 'sign_shopper':
      return {
        headline: 'Custom Cabin Signs',
        subtitle: 'Cedar, personalized, weatherproof. AI mockup before we cut — you approve the design first.',
        cta: 'Design Your Sign',
        ctaLink: '/signs',
      };
    case 'maintenance':
      return {
        headline: 'Cabin Care Plans',
        subtitle: 'Monthly walk-throughs, documented photo reports, and same-week repairs. Plans from $75/mo.',
        cta: 'View Plans & Pricing',
        ctaLink: '/pricing#maintenance',
      };
    case 'general':
    default:
      return {
        headline: 'The Handy Beaver',
        subtitle: 'Your Detail-Oriented Craftsman & Maintenance Service',
        cta: 'What do you need?',
        ctaLink: '#services',
      };
  }
}
