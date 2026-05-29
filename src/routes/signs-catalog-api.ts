/**
 * Signs Catalog API
 * Creates and manages Square catalog items for custom cabin signs.
 *
 * Admin endpoint — requires ADMIN_API_KEY header.
 *
 * POST /api/signs/setup-catalog  → creates all sign products in Square
 * GET  /api/signs/products       → lists current sign catalog items
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_ENVIRONMENT?: string;
  ADMIN_API_KEY?: string;
};

export const signsCatalogApi = new Hono<{ Bindings: Bindings }>();

const SQUARE_API_BASE = 'https://connect.squareup.com/v2';
const SQUARE_SANDBOX_BASE = 'https://connect.squareupsandbox.com/v2';

function getSquareBase(env: Bindings): string {
  return env.SQUARE_ENVIRONMENT === 'sandbox' ? SQUARE_SANDBOX_BASE : SQUARE_API_BASE;
}

async function squareReq(env: Bindings, path: string, options: RequestInit = {}) {
  if (!env.SQUARE_ACCESS_TOKEN) throw new Error('Square not configured');
  const res = await fetch(`${getSquareBase(env)}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': '2024-01-18',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.errors?.[0]?.detail || `Square error ${res.status}`);
  return data;
}

// Sign catalog items to create
const SIGN_PRODUCTS = [
  {
    id: '#sign-12x18',
    name: 'Custom Cabin Sign — Address / Name (12" × 18")',
    description: 'CNC-carved cedar or pine cabin sign. 12" × 18". Includes exterior stain, double-coat sealer, and hanging hardware. AI mockup provided before cutting. 5–7 business day turnaround.',
    priceCents: 13700, // $137 (midpoint of $125-150)
    sku: 'SIGN-12X18',
  },
  {
    id: '#sign-18x24',
    name: 'Custom Cabin Sign — Standard (18" × 24")',
    description: 'CNC-carved cedar or pine cabin sign. 18" × 24" — most popular size. Includes exterior stain, double-coat sealer, and hanging hardware. AI mockup provided before cutting. 5–7 business day turnaround.',
    priceCents: 22500, // $225 (midpoint of $200-250)
    sku: 'SIGN-18X24',
  },
  {
    id: '#sign-24x36',
    name: 'Custom Cabin Sign — Statement (24" × 36")',
    description: 'CNC-carved cedar or pine cabin sign. 24" × 36". Large format for serious curb appeal. Includes exterior stain, double-coat sealer, and rope or bracket hardware. AI mockup provided before cutting. 5–7 business day turnaround.',
    priceCents: 33700, // $337 (midpoint of $300-375)
    sku: 'SIGN-24X36',
  },
  {
    id: '#sign-36x48',
    name: 'Custom Cabin Sign — Premium Large (36" × 48")',
    description: 'CNC-carved cedar or pine cabin sign. 36" × 48". Statement piece. Includes exterior stain, double-coat sealer, and heavy-duty hardware. Design consultation included. AI mockup provided before cutting. 5–7 business day turnaround.',
    priceCents: 47500, // $475 (midpoint of $425-525)
    sku: 'SIGN-36X48',
  },
  {
    id: '#sign-addon-post-kit',
    name: 'Sign Add-On — Cedar Post Mounting Kit',
    description: 'Hardware and cedar posts for a freestanding cabin sign at the end of your driveway. Add to any sign order.',
    priceCents: 7500, // $75
    sku: 'SIGN-ADDON-POST-KIT',
  },
  {
    id: '#sign-addon-post-install',
    name: 'Sign Add-On — Post Installation (Labor)',
    description: 'We come out and install the posts and sign in the ground for you. Add to any sign + post kit order.',
    priceCents: 10000, // $100
    sku: 'SIGN-ADDON-POST-INSTALL',
  },
  {
    id: '#sign-addon-address',
    name: 'Sign Add-On — Address Numbers',
    description: 'Add your 911 address number to any sign for easier guest navigation.',
    priceCents: 2500, // $25
    sku: 'SIGN-ADDON-ADDRESS',
  },
];

// Admin: seed Square catalog with all sign products
signsCatalogApi.post('/setup-catalog', async (c) => {
  // Auth check
  const apiKey = c.req.header('x-admin-key') || c.req.query('key');
  if (!c.env.ADMIN_API_KEY || apiKey !== c.env.ADMIN_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!c.env.SQUARE_ACCESS_TOKEN) {
    return c.json({ error: 'SQUARE_ACCESS_TOKEN not set' }, 500);
  }

  try {
    // Get location for tax/availability
    const locData = await squareReq(c.env, '/locations');
    const locationId = locData.locations?.[0]?.id;

    // Build batch upsert objects
    const objects = SIGN_PRODUCTS.map(p => ({
      type: 'ITEM',
      id: p.id,
      item_data: {
        name: p.name,
        description: p.description,
        category_id: undefined, // will set if category exists
        variations: [
          {
            type: 'ITEM_VARIATION',
            id: `${p.id}-var`,
            item_variation_data: {
              item_id: p.id,
              name: 'Standard',
              sku: p.sku,
              pricing_type: 'FIXED_PRICING',
              price_money: {
                amount: p.priceCents,
                currency: 'USD',
              },
              available_for_booking: false,
              sellable: true,
              stockable: false, // custom order, not inventory
            },
          },
        ],
        available_online: true,
        available_for_pickup: false,
        available_electronically: true,
      },
    }));

    const result = await squareReq(c.env, '/catalog/batch-upsert', {
      method: 'POST',
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        batches: [{ objects }],
      }),
    });

    const created = result.objects?.length || 0;
    return c.json({
      success: true,
      message: `Created/updated ${created} sign catalog items in Square`,
      items: result.objects?.map((o: any) => ({
        id: o.id,
        name: o.item_data?.name,
        price: o.item_data?.variations?.[0]?.item_variation_data?.price_money?.amount,
      })),
    });

  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// List current sign catalog items from Square
signsCatalogApi.get('/products', async (c) => {
  if (!c.env.SQUARE_ACCESS_TOKEN) {
    return c.json({ error: 'Square not configured' }, 500);
  }

  try {
    const result = await squareReq(c.env, '/catalog/search', {
      method: 'POST',
      body: JSON.stringify({
        object_types: ['ITEM'],
        query: {
          text_query: {
            keywords: ['Custom Cabin Sign', 'Sign Add-On'],
          },
        },
      }),
    });

    const items = (result.objects || []).map((o: any) => {
      const variation = o.item_data?.variations?.[0]?.item_variation_data;
      return {
        id: o.id,
        name: o.item_data?.name,
        description: o.item_data?.description,
        sku: variation?.sku,
        price_cents: variation?.price_money?.amount,
        price_display: variation?.price_money?.amount
          ? `$${(variation.price_money.amount / 100).toFixed(2)}`
          : 'N/A',
        available_online: o.item_data?.available_online,
      };
    });

    return c.json({ count: items.length, items });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
