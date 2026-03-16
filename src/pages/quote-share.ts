import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

export const quoteSharePage = async (c: Context) => {
  const quoteId = c.req.param('id');
  const db = c.env.DB;
  
  // Fetch the quote with customer info
  const quote = await db.prepare(`
    SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM quotes q
    JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ?
  `).bind(quoteId).first<any>();
  
  if (!quote) {
    return c.html(layout('Quote Not Found', `
      <section class="container" style="padding: 4rem 2rem; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🦫</div>
        <h1 style="color: var(--primary);">Quote Not Found</h1>
        <p style="color: #666; margin: 1rem 0;">This quote may have expired or doesn't exist.</p>
        <a href="/contact" class="btn btn-primary">Request a New Quote</a>
      </section>
    `, 'quote'));
  }
  
  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const isExpired = quote.valid_until && (quote.valid_until * 1000) < Date.now();
  const statusColors: Record<string, string> = {
    draft: '#6b7280',
    sent: '#3b82f6',
    viewed: '#8b5cf6',
    accepted: '#10b981',
    declined: '#ef4444',
    expired: '#9ca3af'
  };
  
  const content = `
    <section style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 2rem;">
        <img src="/api/assets/beaver-avatar.png" alt="${siteConfig.business.name}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 1rem;">
        <h1 style="color: var(--primary); font-family: 'Playfair Display', serif; margin-bottom: 0.5rem;">
          Quote for ${quote.customer_name}
        </h1>
        <p style="color: #666;">Quote #${quote.id} • Created ${formatDate(quote.created_at)}</p>
      </div>
      
      ${isExpired ? `
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
          <strong style="color: #dc2626;">⚠️ This quote has expired</strong>
          <p style="color: #666; margin-top: 0.5rem;">Please <a href="/contact" style="color: var(--primary);">request a new quote</a> for current pricing.</p>
        </div>
      ` : ''}
      
      <!-- Quote Card -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #f3f4f6;">
          <div>
            <span style="background: ${statusColors[quote.status] || '#6b7280'}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">
              ${quote.status}
            </span>
          </div>
          ${quote.valid_until && !isExpired ? `
            <div style="color: #666; font-size: 0.9rem;">
              Valid until: <strong>${formatDate(quote.valid_until)}</strong>
            </div>
          ` : ''}
        </div>
        
        <!-- Line Items -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: var(--primary); margin-bottom: 1rem;">Quote Details</h3>
          
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
            <span>Labor (${quote.labor_type === 'full_day' ? 'Full Day' : 'Half Day'})</span>
            <strong>$${(quote.labor_rate || 0).toFixed(2)}</strong>
          </div>
          
          ${quote.helper_needed ? `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
              <span>Helper (${quote.helper_type === 'full_day' ? 'Full Day' : 'Half Day'})</span>
              <strong>$${(quote.helper_rate || 0).toFixed(2)}</strong>
            </div>
          ` : ''}
          
          ${quote.materials_estimate > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
              <span>Materials (Estimate)</span>
              <strong>$${quote.materials_estimate.toFixed(2)}</strong>
            </div>
          ` : ''}
          
          ${quote.equipment_estimate > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
              <span>Equipment Rental</span>
              <strong>$${quote.equipment_estimate.toFixed(2)}</strong>
            </div>
          ` : ''}
          
          ${quote.discount_percent > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb; color: #10b981;">
              <span>Discount (${quote.discount_percent}%${quote.discount_reason ? ` - ${quote.discount_reason}` : ''})</span>
              <strong>-$${((quote.subtotal * quote.discount_percent / 100) || 0).toFixed(2)}</strong>
            </div>
          ` : ''}
        </div>
        
        <!-- Total -->
        <div style="background: #f9fafb; margin: -1.5rem; margin-top: 0; padding: 1.5rem; border-radius: 0 0 8px 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 1.25rem;">
            <span style="font-weight: 600;">Total</span>
            <strong style="color: var(--primary); font-size: 1.5rem;">$${(quote.total || 0).toFixed(2)}</strong>
          </div>
        </div>
      </div>
      
      ${quote.notes ? `
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="color: var(--primary); margin-bottom: 0.75rem;">Notes</h3>
          <p style="color: #666; white-space: pre-wrap;">${quote.notes}</p>
        </div>
      ` : ''}
      
      <!-- Actions -->
      ${!isExpired && quote.status === 'sent' ? `
        <div class="card" style="text-align: center; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white;">
          <h3 style="margin-bottom: 1rem;">Ready to proceed?</h3>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <form action="/quote/${quote.id}/accept" method="POST" style="display: inline;">
              <button type="submit" class="btn" style="background: white; color: var(--primary); padding: 0.75rem 2rem; font-size: 1rem;">
                ✓ Accept Quote
              </button>
            </form>
            <a href="/contact?ref=quote-${quote.id}" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 0.75rem 2rem; font-size: 1rem; border: 1px solid white;">
              Questions? Contact Us
            </a>
          </div>
        </div>
      ` : ''}
      
      ${quote.status === 'accepted' ? `
        <div class="card" style="text-align: center; background: #d1fae5; border: 1px solid #10b981;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">✓</div>
          <h3 style="color: #065f46;">Quote Accepted!</h3>
          <p style="color: #047857;">We'll be in touch soon to schedule your project.</p>
        </div>
      ` : ''}
      
      <!-- Customer Sign Up/Login -->
      ${!quote.customer_email ? `
        <div class="card" style="margin-top: 1.5rem;">
          <h3 style="color: var(--primary); margin-bottom: 1rem;">📧 Add Your Email</h3>
          <p style="color: #666; margin-bottom: 1rem;">Add your email to receive updates about this quote and access your customer portal.</p>
          <form action="/quote/${quote.id}/add-email" method="POST" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <input type="email" name="email" placeholder="your@email.com" required
              style="flex: 1; min-width: 200px; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.5rem;">Save Email</button>
          </form>
        </div>
      ` : `
        <div class="card" style="margin-top: 1.5rem; text-align: center;">
          <p style="color: #666; margin-bottom: 1rem;">View all your quotes, invoices, and messages in your customer portal.</p>
          <a href="/portal" class="btn btn-primary">Go to Customer Portal →</a>
        </div>
      `}
      
      <!-- Business Info -->
      <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; text-align: center; color: #666;">
        <img src="/api/assets/beaver-avatar.png" alt="${siteConfig.business.name}" style="width: 48px; height: 48px; border-radius: 50%; margin-bottom: 0.5rem;">
        <h4 style="color: var(--primary); margin-bottom: 0.25rem;">${siteConfig.business.name}</h4>
        <p style="font-size: 0.9rem;">${siteConfig.business.tagline}</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">
          <a href="tel:${siteConfig.business.phone}" style="color: var(--secondary);">${siteConfig.business.phone}</a> •
          <a href="mailto:${siteConfig.business.email}" style="color: var(--secondary);">${siteConfig.business.email}</a>
        </p>
      </div>
    </section>
  `;
  
  // Mark quote as viewed if it's in 'sent' status
  if (quote.status === 'sent') {
    await db.prepare(`
      UPDATE quotes SET status = 'viewed', viewed_at = unixepoch() WHERE id = ? AND status = 'sent'
    `).bind(quoteId).run();
  }
  
  return c.html(layout(`Quote #${quote.id}`, content, 'quote'));
};

// Accept quote
export const acceptQuote = async (c: Context) => {
  const quoteId = c.req.param('id');
  const db = c.env.DB;
  
  await db.prepare(`
    UPDATE quotes SET status = 'accepted', responded_at = unixepoch(), updated_at = unixepoch()
    WHERE id = ? AND status IN ('sent', 'viewed')
  `).bind(quoteId).run();
  
  return c.redirect(`/quote/${quoteId}?accepted=1`);
};

// Add email to customer
export const addEmailToQuote = async (c: Context) => {
  const quoteId = c.req.param('id');
  const formData = await c.req.formData();
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const db = c.env.DB;
  
  if (!email) {
    return c.redirect(`/quote/${quoteId}?error=email_required`);
  }
  
  // Get the quote to find the customer
  const quote = await db.prepare('SELECT customer_id FROM quotes WHERE id = ?').bind(quoteId).first<{customer_id: number}>();
  
  if (quote) {
    await db.prepare(`
      UPDATE customers SET email = ?, updated_at = unixepoch() WHERE id = ? AND (email IS NULL OR email = '')
    `).bind(email, quote.customer_id).run();
  }
  
  return c.redirect(`/quote/${quoteId}?email_added=1`);
};
