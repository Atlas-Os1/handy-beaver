/**
 * Handy Beaver Social Worker v2
 *
 * Improvements over v1:
 * - 3 post types: real portfolio photo, AI professional cabin, Lil Beaver mascot
 * - Seasonal-aware prompts (no snow in summer/fall, explicit SE Oklahoma setting)
 * - Uses new mascot v2 (red plaid shirt, brown work hat) not generic cartoon
 * - Better caption variety (10 themes, human voice, less repetitive)
 * - KV fallback when R2 unavailable
 * - GET /sync-fb-gallery — pulls Facebook page photos into site gallery KV
 * - Uses flux-2-klein-9b for better image quality
 *
 * Endpoints:
 *   POST /post              — Generate and post (optional: theme, type in body)
 *   GET  /status            — Health check
 *   GET  /history           — Recent post history
 *   GET  /sync-fb-gallery   — Pull FB page photos → KV gallery (auth required)
 */

export interface Env {
  FB_PAGE_TOKEN: string;
  IG_TOKEN?: string;
  AUTH_TOKEN?: string;

  MEDIA?: any;       // R2 bucket (atlas-collab-pub) — optional
  STATE: KVNamespace;  // Post history + gallery manifest
  GALLERY?: KVNamespace; // Site gallery KV (handy-beaver-assets) — optional
  AI: any;

  PAGE_ID: string;
  INSTAGRAM_ID: string;
  BRAND_NAME: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = 'real_photo' | 'ai_cabin' | 'mascot';

type Theme =
  | 'deck' | 'flooring' | 'trim' | 'general'
  | 'cabin_maintenance' | 'hot_tub' | 'signs'
  | 'before_after' | 'seasonal' | 'client_story';

// ─── Portfolio images in public/ (served at these paths on handybeaver.co) ───

const PORTFOLIO_IMAGES: Array<{ path: string; theme: Theme; caption_theme: Theme }> = [
  { path: '/portfolio/bathroom/shiplap-finished.jpg',         theme: 'trim',     caption_theme: 'trim' },
  { path: '/portfolio/bathroom/stone-tile-after.jpg',         theme: 'trim',     caption_theme: 'trim' },
  { path: '/portfolio/blue-pine/full-room.jpg',               theme: 'trim',     caption_theme: 'trim' },
  { path: '/portfolio/blue-pine/tg-walls-full-room.jpg',      theme: 'trim',     caption_theme: 'trim' },
  { path: '/portfolio/doors-trim/french-doors-tg.jpg',        theme: 'trim',     caption_theme: 'trim' },
  { path: '/portfolio/doors-trim/tg-accent-wall.jpg',         theme: 'trim',     caption_theme: 'trim' },
  { path: '/portfolio/flooring/hardwood-finished-bar.jpg',    theme: 'flooring', caption_theme: 'flooring' },
  { path: '/portfolio/flooring/hardwood-finished-kitchen.jpg',theme: 'flooring', caption_theme: 'flooring' },
  { path: '/portfolio/kitchen-bar/bar-main.jpg',              theme: 'general',  caption_theme: 'general_handyman' },
  { path: '/portfolio/hero/bar-epoxy-counter.jpg',            theme: 'general',  caption_theme: 'general_handyman' },
  { path: '/portfolio/hero/blue-pine-room.jpg',               theme: 'trim',     caption_theme: 'trim' },
  { path: '/portfolio/tiny-home/exterior.jpg',                theme: 'general',  caption_theme: 'cabin_maintenance' },
  { path: '/portfolio/tiny-home/kitchen.jpg',                 theme: 'general',  caption_theme: 'general_handyman' },
  { path: '/portfolio/signs/handy-beaver-business-sign.png',  theme: 'signs',    caption_theme: 'signs' },
  { path: '/portfolio/signs/happy_fall_porch_sign.jpeg',      theme: 'signs',    caption_theme: 'signs' },
  { path: '/portfolio/signs/house_marker.jpeg',               theme: 'signs',    caption_theme: 'signs' },
  { path: '/portfolio/signs/wavy_american_flag.jpeg',         theme: 'signs',    caption_theme: 'signs' },
];

// ─── Seasonal context ─────────────────────────────────────────────────────────

function getSeasonContext(): { season: string; month: number; oklahomaNotes: string } {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5)  return { season: 'spring',  month, oklahomaNotes: 'spring green-up, dogwoods, warming up fast in SE Oklahoma' };
  if (month >= 6 && month <= 8)  return { season: 'summer',  month, oklahomaNotes: 'hot humid summer, full green forest, peak cabin booking season in Hochatown' };
  if (month >= 9 && month <= 11) return { season: 'fall',    month, oklahomaNotes: 'fall foliage peak in Hochatown, cool evenings, fire pit season' };
  return { season: 'winter', month, oklahomaNotes: 'mild Oklahoma winter, some cold nights, fire pit and hot tub season, minimal snow' };
}

// ─── Captions ─────────────────────────────────────────────────────────────────

const CAPTIONS: Record<string, string[]> = {
  deck: [
    "Wrapped up a deck restoration in {area} this week. Owner said it looks better than the day it was built. That's the goal. handybeaver.co",
    "If your cabin deck is grey and splintering, it's not done — it just needs work. Stain, seal, replace the bad boards. We do all of it. {area}.",
    "Hot tip for cabin owners: if water isn't beading off your deck boards anymore, your stain is gone. Time to redo it before the wood starts to go soft.",
    "Just saved a client in {area} a few grand — they were going to replace the whole deck. We repaired and restained instead. Same result, way less money. handybeaver.co",
    "Nothing like a fresh deck stain job. Completely changes the look of a cabin. {area} and SE Oklahoma. handybeaver.co"
  ],
  flooring: [
    "Flooring changes a room more than almost anything else. Installed LVP in a Hochatown cabin this week — client was blown away. handybeaver.co",
    "Hardwood floors in a cabin are a statement. We install, repair, and refinish. {area} area and beyond.",
    "If your cabin floors are scratched up or dated, that's the first thing guests notice. We can fix that. handybeaver.co",
    "New floors done right in {area} today. Client picked the finish — we handled everything else. That's how it should work.",
    "From LVP to solid hardwood — we do flooring that holds up in cabin environments. Humidity, heavy traffic, all of it."
  ],
  cabin_maintenance: [
    "Most cabin owners in Hochatown don't have eyes on their property between bookings. That's what our maintenance plans are for. Monthly checks, photo reports, fixes handled. handybeaver.co",
    "A bad review from a maintenance issue is avoidable. Monthly inspection catches it first. {area} area. Plans from $199/mo. handybeaver.co",
    "We do the walk-throughs so you don't have to drive from {city} every time something needs attention. Photo report after every visit. handybeaver.co/pricing",
    "Cabin property managers — we partner with management companies across {area} to keep properties in top shape. Local, documented, reliable. Let's talk.",
    "A well-maintained cabin books better. Guests notice. Reviews reflect it. That's the ROI on a maintenance plan. handybeaver.co"
  ],
  hot_tub: [
    "Nothing kills a 5-star review faster than a cloudy hot tub. We check chemicals, clean filters, flag issues before guests arrive. Ask about our {area} cabin plans.",
    "Hot tub maintenance is optional until it isn't. Monthly checks are cheap. A bad review is not. handybeaver.co",
    "If your hot tub water is anything less than crystal clear, that's a fixable problem. Included in our cabin maintenance plans. handybeaver.co",
    "Cabin owners — hot tub season never really ends in Hochatown. Make sure yours is actually maintained. handybeaver.co"
  ],
  signs: [
    "Just delivered a custom cedar sign for a Hochatown cabin. Dark walnut stain, double-coated exterior seal, rustic chain mount. First thing guests see when they pull up. 🪵",
    "Every cabin deserves a name. We design it, cut it, finish it, and install it. AI mockup before we ever touch the machine. handybeaver.co/signs",
    "Custom cabin signs starting at $125. Cedar, personalized, weatherproof. {area} and surrounding areas. handybeaver.co/signs",
    "We'll show you exactly what your sign looks like before we cut it. No surprises. Custom orders year-round. handybeaver.co/signs",
    "Sign Wednesday — another one out the door. Cedar + dark walnut stain + exterior sealer. The real deal. handybeaver.co/signs"
  ],
  trim: [
    "Trim work is where good construction looks great. Crown molding, baseboards, door trim, custom built-ins. SE Oklahoma. handybeaver.co",
    "Just finished some T&G accent walls in a {area} cabin. Client wanted that mountain lodge feel. We got there.",
    "The difference between a nice cabin and a great one is usually in the details. Trim, built-ins, wood accents. That's our work. handybeaver.co",
    "Custom woodwork in {area} today. These things take time to do right — right is the only way we do them."
  ],
  before_after: [
    "Before: weathered, grey, soft in spots. After: fresh cedar stain, new boards where needed, sealed. Same deck, completely different cabin. {area}.",
    "This deck was one bad summer from being replaced. We stained and sealed it instead. Saved the client real money. handybeaver.co",
    "Before and after — floor refinish in {area}. Original hardwood, just needed care. Came out better than new.",
    "Small maintenance visit now versus big repair later. That's always the math. handybeaver.co"
  ],
  seasonal: [
    "Summer booking season is peak time in Hochatown — and it's when deferred maintenance shows up in reviews. Catch it before guests do. handybeaver.co",
    "Peak season in {area} — we're running maintenance checks, deck repairs, and hot tub service. If you need us, book now.",
    "Fall gutter cleaning — leaves don't care about your cabin, but we do. Included in all maintenance plans. {area}.",
    "Before cold hits: deck inspection, weatherstripping, hot tub service, gutters. All of it. handybeaver.co/pricing"
  ],
  general_handyman: [
    "Got a project you've been putting off? Let's knock it out. SE Oklahoma handyman services. handybeaver.co",
    "No job too small, no attitude too big. That's how we do it. Serving {area} and surrounding areas.",
    "Local, reliable, shows up when we say we will. Apparently that's rare. handybeaver.co",
    "Fair prices, good work, no BS. That's the Handy Beaver way. {area} and beyond.",
    "Something needs fixing? There's a good chance we handle it. handybeaver.co"
  ],
  client_story: [
    "Had a cabin owner from Dallas reach out — hadn't been to the property in 6 months. We went out, did a full inspection, found 3 things that needed attention. All handled same week. That's the service. handybeaver.co",
    "Got a call from a property manager in {area} — guest arriving in 4 hours and a door wouldn't lock. We were there in 45 minutes. That's what being local means.",
    "Client in {area} was going to replace their whole deck. We looked at it and said — no you don't. Repaired and stained for a fraction of the cost. They were happy.",
    "Out-of-state cabin owners — we're your local eyes and hands. Monthly check, photo report, we handle what needs handling. You can breathe. handybeaver.co"
  ]
};

const SERVICE_AREAS = ['Hochatown', 'Broken Bow', 'Beavers Bend', 'McCurtain County', 'Idabel', 'Valliant'];
const INVESTOR_CITIES = ['Dallas', 'Fort Worth', 'OKC', 'Tulsa', 'Houston'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCaption(theme: string): string {
  const pool = CAPTIONS[theme] ?? CAPTIONS.general_handyman;
  let caption = randomItem(pool);
  caption = caption.replace('{area}', randomItem(SERVICE_AREAS));
  caption = caption.replace('{city}', randomItem(INVESTOR_CITIES));
  return caption;
}

// ─── Image generation ─────────────────────────────────────────────────────────

/**
 * Build a generation prompt that is:
 * - Seasonally correct (no snow in summer/fall)
 * - Grounded in Hochatown/SE Oklahoma cabin aesthetic
 * - Uses correct mascot description (v2)
 */
function buildImagePrompt(postType: PostType, theme: Theme): string {
  const { season, oklahomaNotes } = getSeasonContext();
  const noSnow = season !== 'winter' ? ', NO snow, no winter elements' : ', minimal snow if any';
  const seasonalForest = season === 'fall'
    ? 'fall foliage, orange and red hardwood trees'
    : season === 'winter'
    ? 'bare winter trees, mild Oklahoma winter'
    : 'lush green pine and hardwood forest, full summer foliage';

  if (postType === 'mascot') {
    const MASCOT = 'Lil Beaver — a friendly cartoon beaver character wearing a red plaid flannel shirt and a round brown work hat, confident stance';
    const MASCOT_SCENES: Partial<Record<Theme, string>> = {
      deck:             `${MASCOT}, standing proudly on a freshly stained cedar cabin deck in SE Oklahoma, ${seasonalForest}, warm afternoon light, string lights, professional illustration style${noSnow}`,
      flooring:         `${MASCOT}, installing beautiful hardwood floors in a cabin interior, warm wood tones, natural window light, ${seasonalForest} visible outside, professional illustration${noSnow}`,
      trim:             `${MASCOT}, doing trim carpentry in a cabin, measuring tape in hand, cedar walls, warm interior light, professional cartoon illustration${noSnow}`,
      hot_tub:          `${MASCOT}, standing next to a luxury cabin hot tub on a deck, steam rising gently, ${seasonalForest} backdrop, warm evening light, string lights, professional illustration${noSnow}`,
      signs:            `${MASCOT}, proudly holding a large custom cedar cabin sign, forest background, warm natural light, professional illustration${noSnow}`,
      cabin_maintenance:`${MASCOT}, doing a property inspection walk-through at a Hochatown vacation cabin, clipboard in hand, ${seasonalForest}, warm light${noSnow}`,
      general:          `${MASCOT}, holding a toolbox outside a beautiful SE Oklahoma cabin, ${seasonalForest}, warm afternoon light, professional illustration${noSnow}`,
    };
    return MASCOT_SCENES[theme] ?? MASCOT_SCENES.general!;
  }

  // Professional cabin photography (no mascot)
  const PRO_SCENES: Partial<Record<Theme, string>> = {
    deck: `Professional real estate photography of a freshly stained cedar deck on a luxury Hochatown Oklahoma vacation cabin, dark walnut stain, Adirondack chairs, string lights, ${seasonalForest}, golden hour${noSnow}, no people, photorealistic 4K`,
    flooring: `Professional interior photography of a luxury Hochatown Oklahoma cabin with beautiful dark hardwood floors, cedar ceiling, large windows with ${seasonalForest} view, warm natural light, no people, photorealistic`,
    hot_tub: `Luxury vacation cabin in Hochatown Oklahoma, hot tub on covered cedar deck, outdoor stone fireplace lit, ${seasonalForest}, string lights, warm evening ambiance${noSnow}, no people, professional photography 4K`,
    signs: `Beautiful custom carved cedar cabin sign mounted on exterior of Hochatown Oklahoma vacation cabin, dark walnut stain, rustic rope/chain hardware, ${seasonalForest} backdrop, warm natural light, photorealistic close-up`,
    cabin_maintenance: `Stunning luxury vacation rental cabin in Hochatown Oklahoma at golden hour, modern craftsman exterior, cedar and stone, wraparound deck, fire pit glowing, ${seasonalForest}${noSnow}, no people, professional real estate photography 4K`,
    before_after: `Beautiful Hochatown Oklahoma cabin deck after professional restoration, fresh cedar stain gleaming, ${seasonalForest} backdrop, warm afternoon light${noSnow}, no people, professional photography`,
    seasonal: `Gorgeous Hochatown Oklahoma vacation cabin, ${seasonalForest}, string lights on deck, fire pit in gravel clearing, Adirondack chairs, warm cabin glow from windows${noSnow}, professional real estate photography 4K`,
    trim: `Luxury cabin interior in SE Oklahoma, custom tongue-and-groove cedar walls and ceiling, stone fireplace, large windows, natural warm light, beautiful wood tones, professional interior photography`,
    general: `Stunning vacation rental cabin in Hochatown Oklahoma, modern craftsman design, cedar exterior, wraparound porch, ${seasonalForest}${noSnow}, professional real estate photography, golden hour`,
  };

  return PRO_SCENES[theme] ?? PRO_SCENES.general!;
}

// ─── Post type selection ──────────────────────────────────────────────────────

/**
 * Picks post type avoiding repeats.
 * Rotation: real_photo → ai_cabin → real_photo → mascot → real_photo → ai_cabin...
 */
async function selectPostType(env: Env): Promise<PostType> {
  const lastType = (await env.STATE.get('last_post_type') ?? 'mascot') as PostType;
  const rotation: PostType[] = ['real_photo', 'ai_cabin', 'real_photo', 'mascot', 'real_photo', 'ai_cabin'];
  const idx = rotation.indexOf(lastType);
  return rotation[(idx + 1) % rotation.length];
}

// ─── Image handling ───────────────────────────────────────────────────────────

async function generateAIImage(env: Env, postType: PostType, theme: Theme): Promise<Uint8Array> {
  const prompt = buildImagePrompt(postType, theme);
  console.log(`Generating image: type=${postType} theme=${theme}`);
  console.log(`Prompt: ${prompt}`);

  // Try flux-2-klein-9b first (best quality), fall back to flux-1-schnell
  for (const model of ['@cf/black-forest-labs/flux-2-klein-9b', '@cf/black-forest-labs/flux-1-schnell']) {
    try {
      const response = await env.AI.run(model, { prompt, num_steps: 4 });

      if (response instanceof ReadableStream) {
        const chunks: Uint8Array[] = [];
        const reader = response.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) { merged.set(c, offset); offset += c.length; }
        if (merged.length > 500) return merged;
      }

      if (response?.image) {
        const bin = atob(response.image);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        if (bytes.length > 500) return bytes;
      }
    } catch (err) {
      console.error(`Model ${model} failed:`, err);
    }
  }
  throw new Error('All AI image models failed');
}

async function storeImage(env: Env, data: Uint8Array, key: string): Promise<string> {
  // Try R2 first (public CDN URL), fall back to KV
  if (env.MEDIA) {
    try {
      await env.MEDIA.put(key, data, { httpMetadata: { contentType: 'image/jpeg' } });
      return `https://pub-30a843d7499b4062bd2f2e9cde157bd0.r2.dev/${key}`;
    } catch (e) {
      console.warn('R2 store failed, trying KV:', e);
    }
  }
  if (env.GALLERY) {
    await env.GALLERY.put(key, data.buffer, { metadata: { contentType: 'image/jpeg' }, expirationTtl: 30 * 24 * 60 * 60 });
    return `https://handybeaver.co/api/assets/${key}`;
  }
  throw new Error('No storage available for image');
}

// ─── Facebook posting ─────────────────────────────────────────────────────────

async function postToFacebook(token: string, pageId: string, imageUrl: string, caption: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ url: imageUrl, caption, access_token: token }),
  });
  if (!res.ok) throw new Error(`FB error: ${JSON.stringify(await res.json())}`);
  return res.json() as Promise<{ id: string; post_id: string }>;
}

async function postToInstagram(env: Env, imageUrl: string, caption: string): Promise<{ id: string } | null> {
  if (!env.IG_TOKEN || !env.INSTAGRAM_ID) return null;
  const hashtagsByTheme = '#HandyBeaverCo #SoutheastOklahoma #BrokenBow #Hochatown #HochatownCabins #CabinLife #VacationRentalHost';
  const igCaption = `${caption}\n\n${hashtagsByTheme}`;

  const step1 = await fetch(`https://graph.facebook.com/v19.0/${env.INSTAGRAM_ID}/media`, {
    method: 'POST',
    body: new URLSearchParams({ image_url: imageUrl, caption: igCaption, access_token: env.IG_TOKEN }),
  });
  if (!step1.ok) { console.error('IG container error'); return null; }
  const { id: creationId } = await step1.json() as { id: string };

  const step2 = await fetch(`https://graph.facebook.com/v19.0/${env.INSTAGRAM_ID}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: creationId, access_token: env.IG_TOKEN }),
  });
  if (!step2.ok) { console.error('IG publish error'); return null; }
  return step2.json() as Promise<{ id: string }>;
}

// ─── Facebook → Gallery sync ──────────────────────────────────────────────────

/**
 * Pulls recent photos posted to the FB page, downloads them, stores in KV
 * so they appear in the site gallery and can be used as generation references.
 */
async function syncFacebookGallery(env: Env): Promise<{ synced: number; skipped: number }> {
  if (!env.FB_PAGE_TOKEN) throw new Error('No FB_PAGE_TOKEN configured');

  const fields = 'id,images,created_time,backdated_time,alt_text,album';
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${env.PAGE_ID}/photos?type=uploaded&fields=${fields}&limit=25&access_token=${env.FB_PAGE_TOKEN}`
  );
  if (!res.ok) throw new Error(`FB photos API error: ${res.status}`);
  const data = await res.json() as { data: any[] };

  let synced = 0;
  let skipped = 0;

  const manifest: Array<{ id: string; url: string; created: string; source: 'facebook' }> =
    JSON.parse(await env.STATE.get('fb_gallery_manifest') ?? '[]');
  const existingIds = new Set(manifest.map(m => m.id));

  for (const photo of data.data ?? []) {
    if (existingIds.has(photo.id)) { skipped++; continue; }

    // Get highest-res image
    const images: Array<{ source: string; width: number; height: number }> = photo.images ?? [];
    const best = images.sort((a, b) => b.width - a.width)[0];
    if (!best?.source) { skipped++; continue; }

    try {
      // Download image
      const imgRes = await fetch(best.source);
      if (!imgRes.ok) { skipped++; continue; }
      const imgData = await imgRes.arrayBuffer();

      // Store in KV gallery
      const key = `gallery/facebook/${photo.id}.jpg`;
      if (env.GALLERY) {
        await env.GALLERY.put(key, imgData, {
          metadata: { contentType: 'image/jpeg', source: 'facebook', photoId: photo.id },
          expirationTtl: 365 * 24 * 60 * 60, // 1 year
        });
      }

      manifest.unshift({
        id: photo.id,
        url: `/api/assets/${key}`,
        created: photo.created_time ?? new Date().toISOString(),
        source: 'facebook',
      });
      synced++;
    } catch (e) {
      console.error(`Failed to sync photo ${photo.id}:`, e);
      skipped++;
    }
  }

  // Save updated manifest (keep last 100)
  await env.STATE.put('fb_gallery_manifest', JSON.stringify(manifest.slice(0, 100)));
  return { synced, skipped };
}

// ─── Main post creation ───────────────────────────────────────────────────────

async function createPost(env: Env, options: { theme?: string; type?: string } = {}) {
  try {
    const postType = (options.type as PostType | undefined) ?? await selectPostType(env);

    // Pick theme
    const ALL_THEMES: Theme[] = ['deck', 'flooring', 'trim', 'general', 'cabin_maintenance', 'hot_tub', 'signs', 'before_after', 'seasonal', 'client_story'];
    const theme = (options.theme as Theme | undefined) ?? randomItem(ALL_THEMES);

    let imageUrl: string;
    let caption: string;

    if (postType === 'real_photo') {
      // Use a real portfolio photo
      const photo = randomItem(PORTFOLIO_IMAGES);
      imageUrl = `https://handybeaver.co${photo.path}`;
      caption = generateCaption(photo.caption_theme);
    } else {
      // Generate AI image
      const imageData = await generateAIImage(env, postType, theme);
      const key = `social/posts/${postType}-${theme}-${Date.now()}.jpg`;
      imageUrl = await storeImage(env, imageData, key);
      caption = generateCaption(theme);
    }

    // Post to Facebook
    const fbResult = await postToFacebook(env.FB_PAGE_TOKEN, env.PAGE_ID, imageUrl, caption);

    // Post to Instagram
    const igResult = await postToInstagram(env, imageUrl, caption);

    // Save to state
    await env.STATE.put('last_post_type', postType);
    const history = JSON.parse(await env.STATE.get('post_history') ?? '[]');
    history.unshift({
      id: fbResult.post_id ?? fbResult.id,
      instagramId: igResult?.id,
      postType,
      theme,
      caption,
      imageUrl,
      timestamp: new Date().toISOString(),
    });
    await env.STATE.put('post_history', JSON.stringify(history.slice(0, 50)));

    return { success: true, postId: fbResult.post_id ?? fbResult.id, instagramId: igResult?.id, postType, theme };
  } catch (err) {
    console.error('createPost error:', err);
    return { success: false, error: String(err) };
  }
}

// ─── Worker ───────────────────────────────────────────────────────────────────

function checkAuth(request: Request, env: Env): boolean {
  if (!env.AUTH_TOKEN) return true;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${env.AUTH_TOKEN}`;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data, null, 2), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const { season, oklahomaNotes } = getSeasonContext();

    if (url.pathname === '/status' || url.pathname === '/') {
      return json({
        service: 'handy-beaver-social-worker',
        version: '2.0.0',
        status: 'running',
        brand: env.BRAND_NAME,
        fb_configured: !!env.FB_PAGE_TOKEN,
        ig_configured: !!env.IG_TOKEN,
        storage: env.MEDIA ? 'r2+kv' : env.GALLERY ? 'kv' : 'none',
        season,
        season_notes: oklahomaNotes,
        endpoints: ['POST /post', 'GET /status', 'GET /history', 'GET /sync-fb-gallery'],
      });
    }

    if (url.pathname === '/history') {
      const history = await env.STATE.get('post_history') ?? '[]';
      return new Response(history, { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/post' && request.method === 'POST') {
      if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json().catch(() => ({})) as { theme?: string; type?: string };
      const result = await createPost(env, body);
      return json(result, result.success ? 200 : 500);
    }

    if (url.pathname === '/sync-fb-gallery') {
      if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
      try {
        const result = await syncFacebookGallery(env);
        return json({ success: true, ...result });
      } catch (err) {
        return json({ success: false, error: String(err) }, 500);
      }
    }

    return new Response('Not Found', { status: 404, headers: CORS });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const result = await createPost(env);
    console.log('Scheduled post:', result);
  },
};
