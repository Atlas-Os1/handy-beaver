/**
 * Handy Beaver Social Worker
 * Automated Facebook/Instagram posting for Handy Beaver Co
 * 
 * Endpoints:
 * - POST /post - Generate and post content
 * - GET /status - Health check
 * - GET /history - Recent posts
 * 
 * Cron: Triggers scheduled posts
 */

export interface Env {
  // Secrets
  FB_PAGE_TOKEN: string;
  IG_TOKEN?: string;
  FB_APP_ID?: string;
  FB_APP_SECRET?: string;
  AUTH_TOKEN?: string; // Bearer token for /post endpoint

  // Bindings
  MEDIA: R2Bucket;
  STATE: KVNamespace;
  AI: any;

  // Vars
  PAGE_ID: string;
  INSTAGRAM_ID: string;
  BRAND_NAME: string;
  BRAND_VOICE: string;
}

const THEMES = ['deck', 'flooring', 'trim', 'general'] as const;
type Theme = typeof THEMES[number];

const SERVICE_AREAS = ['Hochatown', 'Broken Bow', 'Idabel', 'Valliant', 'Hugo', 'Antlers', 'Paris TX'];

const CAPTIONS: Record<Theme, string[]> = {
  deck: [
    "Nothing beats a fresh deck stain job. 🦫 If your deck's looking rough, let's talk → handybeaver.co",
    "Deck season is coming — make sure yours is ready. We do staining, sealing, and repairs across Southeast Oklahoma.",
    "Just wrapped another deck restoration in {area}. That weathered gray? Gone. 🪵 handybeaver.co",
    "Your deck deserves better than peeling stain and wobbly boards. We fix that. 🦫",
    "Stained a beauty in {area} today. Nothing like fresh cedar in the sun. handybeaver.co"
  ],
  flooring: [
    "New floors can transform a whole room. We install hardwood, laminate, and vinyl plank. 🦫 handybeaver.co",
    "That feeling when the last plank clicks into place... chef's kiss. Flooring installs across SE Oklahoma.",
    "Thinking about new floors? We've got you covered — hardwood to vinyl plank. Message us or visit handybeaver.co",
    "Flooring done right the first time. Serving {area} and beyond. 🦫",
    "From subfloor to shine — that's what we do. handybeaver.co"
  ],
  trim: [
    "Baseboards make the room. We do trim carpentry that actually looks right. 🦫 handybeaver.co",
    "Custom trim work in {area} today. Those clean corners? That's the good stuff.",
    "It's the details that matter — baseboards, crown molding, door trim. We handle it all.",
    "Finished some custom built-ins in {area}. Client's happy, beaver's happy. 🦫",
    "Trim carpentry is an art. We take it seriously. handybeaver.co"
  ],
  general: [
    "Got a project you've been putting off? Let's knock it out. 🦫 handybeaver.co",
    "No job too small, no attitude too big. That's how we do it at Handy Beaver Co.",
    "Something broken? We can probably fix it. Serving {area} and surrounding areas.",
    "Quality work, fair prices, no BS. That's the Handy Beaver way. 🦫",
    "Another day, another project done right. handybeaver.co"
  ]
};

// Base prompts - will be enhanced by AI for variety
const BASE_IMAGE_PROMPTS: Record<Theme, string> = {
  deck: "Lil Beaver (cute cartoon beaver mascot) in yellow hard hat and red flannel shirt on a wooden deck",
  flooring: "Lil Beaver (cute cartoon beaver mascot) in hard hat installing hardwood flooring in a home",
  trim: "Lil Beaver (cute cartoon beaver mascot) in hard hat doing trim carpentry work",
  general: "Lil Beaver (cute cartoon beaver mascot) in yellow hard hat and flannel shirt as a handyman"
};

// Variations to add visual diversity
const SETTINGS = ['cozy cabin', 'modern farmhouse', 'rustic lodge', 'suburban home', 'lakeside retreat'];
const TIMES = ['golden hour sunset', 'bright morning light', 'soft afternoon glow', 'warm indoor lighting'];
const ACTIONS = ['working confidently', 'giving thumbs up', 'holding tools proudly', 'measuring carefully', 'standing back to admire work'];
const OKLAHOMA_ELEMENTS = ['Ouachita Mountains in background', 'pine trees visible through window', 'Oklahoma red dirt visible', 'scenic forest backdrop', 'Broken Bow lake visible'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCaption(theme: Theme): string {
  const caption = randomItem(CAPTIONS[theme]);
  const area = randomItem(SERVICE_AREAS);
  return caption.replace('{area}', area);
}

// Generate unique, AI-enhanced image prompt
async function generateEnhancedPrompt(env: Env, theme: Theme, recentPrompts: string[]): Promise<string> {
  const base = BASE_IMAGE_PROMPTS[theme];
  const setting = randomItem(SETTINGS);
  const time = randomItem(TIMES);
  const action = randomItem(ACTIONS);
  const okElement = randomItem(OKLAHOMA_ELEMENTS);
  
  // Build a unique prompt with random variations
  const prompt = `${base}, ${action}, ${setting} setting, ${okElement}, ${time}, professional home improvement photography style, photorealistic background with cartoon character, high quality`;
  
  // Check if too similar to recent prompts (simple hash check)
  const promptHash = prompt.slice(0, 50);
  if (recentPrompts.some(p => p.startsWith(promptHash.slice(0, 30)))) {
    // If similar, add more randomization
    const extraDetails = ['with power tools', 'wearing safety glasses', 'with wood shavings around', 'next to a toolbox', 'with a happy expression'];
    return `${prompt}, ${randomItem(extraDetails)}`;
  }
  
  return prompt;
}

async function generateImage(env: Env, theme: Theme, recentPrompts: string[] = []): Promise<{ image: Uint8Array; prompt: string }> {
  const prompt = await generateEnhancedPrompt(env, theme, recentPrompts);
  console.log('Generated image prompt:', prompt);
  
  const response = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
    prompt,
    num_steps: 4
  });
  
  // Workers AI returns base64 encoded image in response.image
  if (response.image) {
    // Decode base64 to Uint8Array
    const binaryString = atob(response.image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { image: bytes, prompt };
  }
  
  throw new Error('No image in AI response');
}

// Get recent prompts to avoid duplicates
async function getRecentPrompts(env: Env): Promise<string[]> {
  const history = JSON.parse(await env.STATE.get('post_history') || '[]');
  return history.slice(0, 10).map((p: any) => p.imagePrompt || '').filter(Boolean);
}

async function postToFacebook(env: Env, imageUrl: string, caption: string): Promise<{ id: string; post_id: string }> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${env.PAGE_ID}/photos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: imageUrl,
        caption,
        access_token: env.FB_PAGE_TOKEN
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
  }
  
  return response.json();
}

async function postToInstagram(env: Env, imageUrl: string, caption: string): Promise<{ id: string } | null> {
  if (!env.IG_TOKEN) {
    console.log('No Instagram token configured, skipping IG post');
    return null;
  }
  
  // Add hashtags for Instagram
  const hashtags = '\n\n#HandyBeaverCo #SoutheastOklahoma #Handyman #HomeImprovement #BrokenBow #Hochatown';
  const igCaption = caption + hashtags;
  
  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    image_url: imageUrl,
    caption: igCaption,
    access_token: env.IG_TOKEN
  });
  
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${env.INSTAGRAM_ID}/media`,
    {
      method: 'POST',
      body: containerParams
    }
  );
  
  if (!containerResponse.ok) {
    const error = await containerResponse.json();
    console.error('Instagram container error:', error);
    return null;
  }
  
  const container = await containerResponse.json() as { id: string };
  
  // Step 2: Wait for media to be ready (Instagram needs time to process)
  // Poll the container status until it's ready (max 30 seconds)
  let mediaReady = false;
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(
      `https://graph.facebook.com/v18.0/${container.id}?fields=status_code&access_token=${env.IG_TOKEN}`
    );
    
    if (statusResponse.ok) {
      const status = await statusResponse.json() as { status_code?: string };
      console.log(`Instagram media status check ${i + 1}/6:`, status.status_code);
      
      if (status.status_code === 'FINISHED') {
        mediaReady = true;
        break;
      } else if (status.status_code === 'ERROR') {
        console.error('Instagram media processing failed');
        return null;
      }
    }
  }
  
  if (!mediaReady) {
    console.error('Instagram media not ready after 30 seconds');
    return null;
  }
  
  // Step 3: Publish
  const publishParams = new URLSearchParams({
    creation_id: container.id,
    access_token: env.IG_TOKEN
  });
  
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${env.INSTAGRAM_ID}/media_publish`,
    {
      method: 'POST',
      body: publishParams
    }
  );
  
  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    console.error('Instagram publish error:', error);
    return null;
  }
  
  return publishResponse.json();
}

async function createPost(env: Env, theme?: string): Promise<{ success: boolean; postId?: string; instagramId?: string; error?: string }> {
  try {
    // Validate theme - fallback to random if invalid
    const selectedTheme: Theme = (theme && THEMES.includes(theme as Theme)) 
      ? (theme as Theme) 
      : randomItem([...THEMES]);
    
    // Check for duplicate theme in last 24 hours
    const history = JSON.parse(await env.STATE.get('post_history') || '[]');
    const recentThemes = history
      .filter((p: any) => Date.now() - new Date(p.timestamp).getTime() < 24 * 60 * 60 * 1000)
      .map((p: any) => p.theme);
    
    // Avoid same theme twice in a day
    let finalTheme = selectedTheme;
    if (recentThemes.includes(selectedTheme)) {
      const availableThemes = THEMES.filter(t => !recentThemes.includes(t));
      finalTheme = availableThemes.length > 0 ? randomItem(availableThemes) : selectedTheme;
      console.log(`Theme ${selectedTheme} used recently, switching to ${finalTheme}`);
    }
    
    const caption = generateCaption(finalTheme);
    
    // Get recent prompts to avoid duplicates
    const recentPrompts = await getRecentPrompts(env);
    
    // Generate image with enhanced, unique prompt
    const { image: imageData, prompt: imagePrompt } = await generateImage(env, finalTheme, recentPrompts);
    
    // Upload to R2
    const timestamp = Date.now();
    const imagePath = `handy-beaver/posts/lilbeaver-${finalTheme}-${timestamp}.png`;
    await env.MEDIA.put(imagePath, imageData, {
      httpMetadata: { contentType: 'image/png' }
    });
    
    const imageUrl = `https://pub-30a843d7499b4062bd2f2e9cde157bd0.r2.dev/${imagePath}`;
    
    // Post to Facebook
    const fbResult = await postToFacebook(env, imageUrl, caption);
    
    // Post to Instagram
    const igResult = await postToInstagram(env, imageUrl, caption);
    
    // Track in KV with prompt for duplicate detection
    history.unshift({
      id: fbResult.post_id,
      instagramId: igResult?.id,
      theme: finalTheme,
      caption,
      imageUrl,
      imagePrompt,
      timestamp: new Date().toISOString()
    });
    await env.STATE.put('post_history', JSON.stringify(history.slice(0, 50)));
    
    return { 
      success: true, 
      postId: fbResult.post_id,
      instagramId: igResult?.id 
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (path === '/status' || path === '/') {
      return new Response(JSON.stringify({
        service: 'handy-beaver-social-worker',
        version: '1.0.0',
        status: 'running',
        brand: env.BRAND_NAME,
        configured: !!env.FB_PAGE_TOKEN,
        endpoints: ['POST /post', 'GET /status', 'GET /history']
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/history') {
      const history = await env.STATE.get('post_history') || '[]';
      return new Response(history, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/post' && request.method === 'POST') {
      // Auth check - require Bearer token if AUTH_TOKEN is configured
      if (env.AUTH_TOKEN) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      const body = await request.json().catch(() => ({})) as { theme?: string };
      const result = await createPost(env, body.theme);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const result = await createPost(env);
    console.log('Scheduled post result:', result);
  }
};
