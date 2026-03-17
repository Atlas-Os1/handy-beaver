
/**
 * Tiny Cabin / Portable Shed Finish Packages
 * Added: 2026-03-17 per Minte
 */
export const cabinPackages = {
  // Premium rustic finish (like Rustic-Cabin gallery)
  rusticPremium: {
    name: 'Rustic Premium Finish',
    description: 'Detailed rustic finish with specialty wood, custom details',
    pricePerSqFt: 110.00,
    examples: ['Rustic-Cabin gallery images'],
    includes: ['Premium materials', 'Custom woodwork', 'Specialty finishes'],
  },
  
  // Basic finish package (like Tiny-Home gallery)
  basicPackage: {
    name: 'Basic Finish Package',
    description: 'Quality finish at an affordable price',
    pricePerSqFt: 75.00,
    examples: ['Tiny-Home gallery images'],
    includes: ['Standard materials', 'Clean finish', 'Professional installation'],
  },
};

/**
 * Individual Service Pricing (per sq.ft.)
 */
export const servicePricing = {
  tongueAndGroove: {
    name: 'Tongue & Groove',
    basePrice: 4.00,
    unit: 'sq.ft.',
    notes: 'Walls, accent walls',
  },
  
  ceilings: {
    name: 'T&G Ceilings',
    basePrice: 6.00,
    unit: 'sq.ft.',
    notes: 'Standard height ceilings',
  },
  
  ceilingsOver10ft: {
    name: 'T&G Ceilings (10ft+)',
    basePrice: 5.00,
    unit: 'sq.ft.',
    notes: 'High ceilings over 10 feet',
  },
  
  flooringLaminate: {
    name: 'Laminate Flooring',
    basePrice: 1.75,
    unit: 'sq.ft.',
    notes: 'Installation only, materials separate',
  },
  
  flooringHardwood: {
    name: 'Hardwood Flooring',
    priceRange: { min: 10.00, max: 12.00 },
    unit: 'sq.ft.',
    notes: 'Sealed and sanded finish',
  },
};

/**
 * Quick quote calculator for Lil Beaver
 */
export function calculateQuote(
  sqFt: number,
  packageType: 'rusticPremium' | 'basicPackage' | null,
  services: Array<keyof typeof servicePricing>
): { total: number; breakdown: string[] } {
  const breakdown: string[] = [];
  let total = 0;

  if (packageType && cabinPackages[packageType]) {
    const pkg = cabinPackages[packageType];
    const cost = sqFt * pkg.pricePerSqFt;
    total += cost;
    breakdown.push(`${pkg.name}: ${sqFt} sq.ft. × $${pkg.pricePerSqFt} = $${cost.toFixed(2)}`);
  }

  services.forEach(service => {
    const svc = servicePricing[service];
    if (svc) {
      const price = 'basePrice' in svc ? svc.basePrice : svc.priceRange.min;
      const cost = sqFt * price;
      total += cost;
      breakdown.push(`${svc.name}: ${sqFt} sq.ft. × $${price} = $${cost.toFixed(2)}`);
    }
  });

  return { total, breakdown };
}
