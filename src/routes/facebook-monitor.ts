import { Hono } from 'hono';
import puppeteer from '@cloudflare/puppeteer';

type Bindings = {
  DB: D1Database;
  BROWSER: any; // Browser Rendering binding
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
  FACEBOOK_SESSION?: string; // Stored FB session cookies
};

export const facebookMonitor = new Hono<{ Bindings: Bindings }>();

// Keywords that indicate someone needs handyman services
const HIGH_INTENT_PHRASES = [
  'looking for',
  'need someone',
  'anyone know',
  'recommendations for',
  'recommend',
  'looking to hire',
  'who does',
  'who can',
];

const SERVICE_KEYWORDS = [
  // Flooring
  'flooring', 'floors', 'lvp', 'hardwood', 'tile', 'carpet', 'laminate',
  // Trim/Carpentry
  'trim', 'baseboards', 'crown molding', 'casing', 'carpenter', 'finish work',
  // Deck
  'deck', 'porch', 'staining', 'boards', 'railing',
  // General
  'handyman', 'odd jobs', 'home repair', 'maintenance', 'fix', 'repair',
];

// Check if post matches our lead criteria
function isLeadPost(content: string): { isLead: boolean; keywords: string[] } {
  const lowerContent = content.toLowerCase();
  const matchedKeywords: string[] = [];
  
  // Check for high-intent phrases
  const hasIntent = HIGH_INTENT_PHRASES.some(phrase => lowerContent.includes(phrase));
  if (!hasIntent) return { isLead: false, keywords: [] };
  
  // Check for service keywords
  for (const keyword of SERVICE_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }
  
  return {
    isLead: matchedKeywords.length > 0,
    keywords: matchedKeywords,
  };
}

// Response templates based on matched keywords
function getResponseTemplate(keywords: string[]): string {
  const hasFlooring = keywords.some(k => ['flooring', 'floors', 'lvp', 'hardwood', 'tile', 'carpet', 'laminate'].includes(k));
  const hasTrim = keywords.some(k => ['trim', 'baseboards', 'crown molding', 'casing', 'carpenter', 'finish work'].includes(k));
  const hasDeck = keywords.some(k => ['deck', 'porch', 'staining', 'boards', 'railing'].includes(k));
  
  if (hasFlooring) {
    return "I handle flooring! LVP, hardwood, tile — $175/half day or $300/full day, you just cover materials. Based in SE Oklahoma. More at handybeaver.co 🦫";
  }
  
  if (hasTrim) {
    return "Finish carpentry is my specialty! Crown, base, casing, built-ins. $175/half day or $300/full day. SE Oklahoma area. Details at handybeaver.co 🦫";
  }
  
  if (hasDeck) {
    return "I do deck work — repairs, board replacement, staining. $175/half day or $300/full day, you cover materials. Check out handybeaver.co 🦫";
  }
  
  // Generic response
  return "Hey! I do this kind of work in SE Oklahoma — flooring, trim, deck repair, maintenance. $175/half day or $300/full day. Check out handybeaver.co for a free quote! 🦫";
}

// Note: /scan route moved to facebook-scraper.ts with full implementation

// Get all detected leads
facebookMonitor.get('/leads', async (c) => {
  const leads = await c.env.DB.prepare(`
    SELECT * FROM leads 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all();
  
  return c.json(leads);
});

// Mark lead as responded
facebookMonitor.post('/leads/:id/respond', async (c) => {
  const id = c.req.param('id');
  const { response_content } = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  await c.env.DB.prepare(`
    UPDATE leads 
    SET response_sent = 1, response_content = ?, response_sent_at = ?
    WHERE id = ?
  `).bind(response_content, now, id).run();
  
  return c.json({ success: true });
});

// Mark lead as converted to customer
facebookMonitor.post('/leads/:id/convert', async (c) => {
  const id = c.req.param('id');
  const { customer_id } = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE leads 
    SET converted_to_customer = 1, customer_id = ?
    WHERE id = ?
  `).bind(customer_id, id).run();
  
  return c.json({ success: true });
});

// Webhook for when a lead is detected (called internally)
async function notifyLead(env: Bindings, lead: any) {
  if (!env.DISCORD_WEBHOOK_NOTIFICATIONS) return;
  
  const response = getResponseTemplate(JSON.parse(lead.keywords_matched || '[]'));
  
  await fetch(env.DISCORD_WEBHOOK_NOTIFICATIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: '🎯 New Lead Detected!',
        color: 0x8B4513,
        fields: [
          { name: 'Group', value: lead.source_group_name || 'Unknown', inline: true },
          { name: 'User', value: lead.source_user_name || 'Unknown', inline: true },
          { name: 'Keywords', value: lead.keywords_matched || 'N/A', inline: true },
          { name: 'Post', value: lead.content?.substring(0, 200) || 'No content' },
          { name: 'Suggested Response', value: response },
        ],
        footer: { text: 'React with ✅ to auto-respond, ❌ to ignore' },
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}

// Test endpoint - analyze text for lead potential
facebookMonitor.post('/test-classify', async (c) => {
  const { text } = await c.req.json();
  
  if (!text) {
    return c.json({ error: 'text required' }, 400);
  }
  
  const result = isLeadPost(text);
  const response = result.isLead ? getResponseTemplate(result.keywords) : null;
  
  return c.json({
    text,
    is_lead: result.isLead,
    keywords: result.keywords,
    suggested_response: response,
  });
});

export { isLeadPost, getResponseTemplate, notifyLead };
