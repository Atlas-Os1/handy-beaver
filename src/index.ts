import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { siteConfig } from '../config/site.config';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  ENVIRONMENT: string;
  SQUARE_ACCESS_TOKEN?: string;
  GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('/api/*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: siteConfig.business.name,
    environment: c.env.ENVIRONMENT 
  });
});

// Landing page
app.get('/', (c) => {
  const { business, pricing, theme } = siteConfig;
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${business.name} - ${business.tagline}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Georgia', serif;
          background: ${theme.colors.background};
          color: ${theme.colors.card};
          min-height: 100vh;
        }
        .hero {
          text-align: center;
          padding: 4rem 2rem;
          background: linear-gradient(180deg, ${theme.colors.primary} 0%, ${theme.colors.background} 100%);
        }
        .mascot { font-size: 5rem; }
        h1 { font-size: 3rem; color: ${theme.colors.accent}; margin: 1rem 0; }
        .tagline { font-size: 1.25rem; color: ${theme.colors.secondary}; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .card {
          background: ${theme.colors.card};
          color: ${theme.colors.background};
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
          box-shadow: 0 0 30px ${theme.cardGlow};
        }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .price { font-size: 2rem; color: ${theme.colors.primary}; font-weight: bold; }
        .cta {
          display: inline-block;
          background: ${theme.colors.primary};
          color: ${theme.colors.card};
          padding: 1rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-size: 1.25rem;
          margin: 1rem 0;
        }
        .cta:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="hero">
        <div class="mascot">${business.mascot}</div>
        <h1>${business.name}</h1>
        <p class="tagline">${business.tagline}</p>
        <a href="/portal" class="cta">Schedule Service</a>
      </div>
      
      <div class="container">
        <div class="card">
          <h2>Our Services</h2>
          <p>${business.description}</p>
          <ul style="margin: 1rem 0; padding-left: 1.5rem;">
            <li>Carpentry & Wood Work</li>
            <li>Flooring Installation & Repair</li>
            <li>Deck Building & Restoration</li>
            <li>General Home Maintenance</li>
          </ul>
        </div>
        
        <div class="card">
          <h2>Pricing</h2>
          <div class="pricing-grid">
            <div>
              <h3>Labor (≤6 hrs)</h3>
              <p class="price">$${pricing.labor.underSixHours}</p>
            </div>
            <div>
              <h3>Labor (Full Day)</h3>
              <p class="price">$${pricing.labor.overSixHours}/day</p>
            </div>
            <div>
              <h3>Helper (≤6 hrs)</h3>
              <p class="price">$${pricing.helper.underSixHours}</p>
            </div>
            <div>
              <h3>Helper (Full Day)</h3>
              <p class="price">$${pricing.helper.overSixHours}/day</p>
            </div>
          </div>
          <p style="margin-top: 1rem; font-style: italic;">${pricing.notes}</p>
        </div>
        
        <div class="card">
          <h2>Service Area</h2>
          <p>Proudly serving ${business.serviceArea}</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Routes
const api = new Hono<{ Bindings: Bindings }>();

// Auth: Send magic link
api.post('/auth/login', async (c) => {
  const { email } = await c.req.json();
  // TODO: Generate magic token, send email via Resend
  return c.json({ success: true, message: 'Magic link sent' });
});

// Auth: Verify magic link
api.get('/auth/verify', async (c) => {
  const token = c.req.query('token');
  // TODO: Verify token, create session
  return c.json({ success: true });
});

// Bookings
api.get('/bookings', async (c) => {
  // TODO: Auth middleware, get customer bookings
  const bookings = await c.env.DB.prepare(
    'SELECT * FROM bookings ORDER BY created_at DESC LIMIT 50'
  ).all();
  return c.json(bookings);
});

api.post('/bookings', async (c) => {
  const data = await c.req.json();
  // TODO: Create booking
  return c.json({ success: true, id: 1 });
});

// Messages
api.get('/messages/:bookingId', async (c) => {
  const bookingId = c.req.param('bookingId');
  const messages = await c.env.DB.prepare(
    'SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at ASC'
  ).bind(bookingId).all();
  return c.json(messages);
});

api.post('/messages', async (c) => {
  const data = await c.req.json();
  // TODO: Save message, trigger AI response if needed
  return c.json({ success: true });
});

// Image upload & AI visualization
api.post('/images/upload', async (c) => {
  // TODO: Accept image, store in R2
  return c.json({ success: true, key: 'image-key' });
});

api.post('/images/visualize', async (c) => {
  // TODO: Send image + prompt to Gemini Pro, return visualization
  return c.json({ success: true, visualization_url: '' });
});

// Mount API
app.route('/api', api);

export default app;
