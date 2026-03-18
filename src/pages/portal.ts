import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { siteConfig } from '../../config/site.config';
import { chatWidgetStyles, chatWidgetHTML } from '../components/chat-widget';

const { business, theme } = siteConfig;

// Portal layout (customer-facing, different from admin)
const portalLayout = (title: string, content: string, customer?: any, showChat: boolean = true) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${business.name} Portal</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    /* ===== MOBILE-FIRST BASE STYLES ===== */
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    :root {
      --primary: ${theme.colors.primary};
      --secondary: ${theme.colors.secondary};
      --safe-bottom: env(safe-area-inset-bottom, 0px);
    }
    html { font-size: 16px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100dvh;
      padding-bottom: calc(70px + var(--safe-bottom)); /* Space for bottom nav */
    }
    
    /* ===== TOP NAV (Minimal on mobile) ===== */
    .portal-nav {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .portal-nav .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Playfair Display', serif;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .portal-nav .brand img { width: 36px; height: 36px; border-radius: 50%; }
    .portal-nav .user { font-size: 0.9rem; }
    .portal-nav .user a { color: rgba(255,255,255,0.9); margin-left: 0.75rem; }
    
    /* ===== BOTTOM NAVIGATION (Mobile default) ===== */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid #e5e5e5;
      display: flex;
      justify-content: space-around;
      padding: 0.5rem 0;
      padding-bottom: calc(0.5rem + var(--safe-bottom));
      z-index: 1000;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    }
    .bottom-nav a {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem;
      color: #666;
      text-decoration: none;
      font-size: 0.7rem;
      min-width: 60px;
      min-height: 48px; /* Touch target */
      justify-content: center;
    }
    .bottom-nav a.active { color: var(--primary); }
    .bottom-nav .nav-icon { width: 24px; height: 24px; }
    
    /* ===== SIDEBAR (Hidden on mobile) ===== */
    .sidebar { display: none; }
    
    /* ===== MAIN CONTENT ===== */
    .portal-layout { display: block; }
    .main-content {
      padding: 1rem;
      max-width: 100%;
    }
    
    /* ===== CARDS (Full width mobile) ===== */
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      margin-bottom: 1rem;
    }
    .card h2 { color: var(--primary); margin-bottom: 0.75rem; font-size: 1.25rem; }
    
    /* ===== BUTTONS (Large touch targets) ===== */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.875rem 1.5rem;
      min-height: 48px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      border: none;
      transition: transform 0.1s, opacity 0.2s;
      touch-action: manipulation;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary { background: var(--primary); color: white; }
    .btn-secondary { background: #e5e7eb; color: #333; }
    .btn-block { width: 100%; margin-bottom: 0.75rem; }
    
    /* ===== BADGES ===== */
    .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-sent { background: #dbeafe; color: #1e40af; }
    .badge-accepted, .badge-paid, .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-confirmed { background: #dbeafe; color: #1e40af; }
    .badge-in_progress { background: #ede9fe; color: #6b21a8; }
    .badge-overdue { background: #fee2e2; color: #991b1b; }
    
    /* ===== TABLES → CARDS ON MOBILE ===== */
    .table { display: none; }
    .mobile-cards { display: block; }
    .mobile-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .mobile-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .mobile-card-title { font-weight: 600; font-size: 1rem; }
    .mobile-card-meta { color: #666; font-size: 0.85rem; }
    .mobile-card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .mobile-card-actions .btn { flex: 1; padding: 0.75rem; min-height: 44px; }
    
    /* ===== FORMS ===== */
    input, textarea, select {
      width: 100%;
      padding: 0.875rem;
      font-size: 16px; /* Prevents zoom on iOS */
      border: 1px solid #ddd;
      border-radius: 10px;
      margin-bottom: 1rem;
      -webkit-appearance: none;
    }
    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }
    label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333; }
    
    /* ===== STATS GRID ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--primary); }
    .stat-label { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    
    /* ===== QUICK ACTIONS ===== */
    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .quick-action {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      text-decoration: none;
      color: #333;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      min-height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: transform 0.1s;
    }
    .quick-action:active { transform: scale(0.97); }
    .quick-action img { width: 28px; height: 28px; }
    
    .empty { text-align: center; padding: 2rem 1rem; color: #666; }
    
    /* ===== DESKTOP STYLES (640px+) ===== */
    @media (min-width: 640px) {
      body { padding-bottom: 0; }
      .portal-nav { padding: 1rem 2rem; }
      .portal-nav .brand { font-size: 1.25rem; }
      .bottom-nav { display: none; }
      .sidebar {
        display: block;
        background: white;
        border-right: 1px solid #e5e5e5;
        padding: 1.5rem 0;
      }
      .sidebar a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        color: #333;
        text-decoration: none;
        border-left: 3px solid transparent;
        transition: all 0.2s;
      }
      .sidebar a:hover { background: #f9f9f9; }
      .sidebar a.active {
        background: #fff5f0;
        border-left-color: var(--primary);
        color: var(--primary);
        font-weight: 600;
      }
      .sidebar .nav-icon { width: 20px; height: 20px; }
      .portal-layout {
        display: grid;
        grid-template-columns: 220px 1fr;
        min-height: calc(100vh - 60px);
      }
      .main-content { padding: 2rem; max-width: 1200px; }
      .card { padding: 1.5rem; }
      .stats-grid { grid-template-columns: repeat(4, 1fr); }
      .table { display: table; width: 100%; border-collapse: collapse; }
      .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
      .table th { font-weight: 600; color: #666; font-size: 0.85rem; }
      .mobile-cards { display: none; }
    }
    
    /* Chat Widget */
    ${chatWidgetStyles}
  </style>
</head>
<body>
  <nav class="portal-nav">
    <div class="brand">
      <img src="/api/assets/beaver-avatar.png" alt="Beaver">
      <span>My Account</span>
    </div>
    <div class="user">
      <span>👋 ${customer?.name || 'Customer'}</span>
      <a href="/portal/logout" style="color: rgba(255,255,255,0.8);">Logout</a>
    </div>
  </nav>
  
  <div class="portal-layout">
    <aside class="sidebar">
      <a href="/portal"><img src="/api/assets/icons/dashboard.png" alt="" class="nav-icon"> Dashboard</a>
      <a href="/portal/quotes"><img src="/api/assets/icons/quotes.png" alt="" class="nav-icon"> My Quotes</a>
      <a href="/portal/invoices"><img src="/api/assets/icons/invoices.png" alt="" class="nav-icon"> Invoices</a>
      <a href="/portal/jobs"><img src="/api/assets/icons/jobs.png" alt="" class="nav-icon"> Job History</a>
      <a href="/portal/messages"><img src="/api/assets/icons/messages.png" alt="" class="nav-icon"> Messages</a>
      <a href="/portal/subscription">🦫 Subscription</a>
      <a href="/portal/visualizer">✨ AI Visualizer</a>
      <a href="/portal/gallery">🖼️ My Gallery</a>
    </aside>
  
  <!-- Mobile Bottom Navigation -->
  <nav class="bottom-nav">
    <a href="/portal"><img src="/api/assets/icons/dashboard.png" alt="" class="nav-icon">Home</a>
    <a href="/portal/quotes"><img src="/api/assets/icons/quotes.png" alt="" class="nav-icon">Quotes</a>
    <a href="/portal/subscription" style="font-size: 1.2rem;">🦫<span style="font-size: 0.7rem;">Plan</span></a>
    <a href="/portal/invoices"><img src="/api/assets/icons/invoices.png" alt="" class="nav-icon">Pay</a>
    <a href="/portal/messages"><img src="/api/assets/icons/messages.png" alt="" class="nav-icon">Chat</a>
  </nav>
    
    <main class="main-content">
      ${content}
    </main>
  </div>
  
  ${showChat ? chatWidgetHTML('customer', { customerId: customer?.id, customerName: customer?.name }) : ''}
</body>
</html>
`;

// Portal auth middleware
export const requirePortalAuth = async (c: Context, next: () => Promise<void>) => {
  const sessionToken = getCookie(c, 'hb_portal');
  
  if (!sessionToken) {
    return c.redirect('/portal/login');
  }
  
  // Verify session
  const session = await c.env.DB.prepare(`
    SELECT cs.*, c.* FROM customer_sessions cs
    JOIN customers c ON cs.customer_id = c.id
    WHERE cs.token = ? AND cs.expires_at > ?
  `).bind(sessionToken, Math.floor(Date.now() / 1000)).first<any>();
  
  if (!session) {
    return c.redirect('/portal/login');
  }
  
  c.set('customer', session);
  await next();
};

// Login page
export const portalLoginPage = async (c: Context) => {
  const error = c.req.query('error');
  const success = c.req.query('success');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login | ${business.name} Portal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .login-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .logo { text-align: center; margin-bottom: 2rem; }
    .logo img { width: 80px; height: 80px; border-radius: 50%; }
    .logo h1 { font-size: 1.5rem; color: #8B4513; margin-top: 1rem; }
    .logo p { color: #666; font-size: 0.9rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333; }
    .form-group input { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus { outline: none; border-color: #8B4513; }
    .btn-login { width: 100%; padding: 1rem; background: #8B4513; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    .btn-login:hover { background: #6d360f; }
    .alert { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
    .alert-error { background: #fee2e2; color: #991b1b; }
    .alert-success { background: #d1fae5; color: #065f46; }
    .help { text-align: center; margin-top: 1.5rem; color: #666; font-size: 0.9rem; }
    .help a { color: #8B4513; }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="logo">
      <img src="/api/assets/beaver-avatar.png" alt="${business.name}">
      <h1>Customer Portal</h1>
      <p>View your quotes, invoices, and job history</p>
    </div>
    
    ${error ? '<div class="alert alert-error">Invalid or expired link. Please request a new one.</div>' : ''}
    ${success ? '<div class="alert alert-success">Check your email! We sent you a login link.</div>' : ''}
    
    <form action="/portal/login" method="POST">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" placeholder="you@example.com" required>
      </div>
      
      <button type="submit" class="btn-login">Send Magic Link ✨</button>
    </form>
    
    <p class="help">
      No account? Contact us at <a href="mailto:${business.email}">${business.email}</a>
    </p>
  </div>
</body>
</html>
  `;
  
  return c.html(html);
};

// Dashboard
export const portalDashboard = async (c: Context) => {
  const customer = c.get('customer');
  const db = c.env.DB;
  
  const [quotes, invoices, jobs] = await Promise.all([
    db.prepare(`
      SELECT COUNT(*) as count, SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as pending
      FROM quotes WHERE customer_id = ?
    `).bind(customer.customer_id).first<any>(),
    db.prepare(`
      SELECT COUNT(*) as count, 
        SUM(CASE WHEN status IN ('sent', 'partial') THEN total - amount_paid ELSE 0 END) as outstanding
      FROM invoices WHERE customer_id = ?
    `).bind(customer.customer_id).first<any>(),
    db.prepare(`
      SELECT COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM bookings WHERE customer_id = ?
    `).bind(customer.customer_id).first<any>(),
  ]);
  
  const recentActivity = await db.prepare(`
    SELECT 'quote' as type, 'Quote received' as title, total as amount, status, created_at
    FROM quotes WHERE customer_id = ?
    UNION ALL
    SELECT 'invoice' as type, invoice_number as title, total as amount, status, created_at
    FROM invoices WHERE customer_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).bind(customer.customer_id, customer.customer_id).all<any>();
  
  const content = `
    <h1 style="margin-bottom: 1.5rem;">Welcome back, ${customer.name?.split(' ')[0]}! 👋</h1>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 2.5rem; color: var(--primary);">${quotes?.pending || 0}</div>
        <div style="color: #666;">Pending Quotes</div>
        <a href="/portal/quotes" style="color: var(--secondary); font-size: 0.9rem;">View all →</a>
      </div>
      <div class="card" style="text-align: center;">
        <div style="font-size: 2.5rem; color: ${invoices?.outstanding > 0 ? '#dc2626' : 'var(--primary)'};">$${(invoices?.outstanding || 0).toLocaleString()}</div>
        <div style="color: #666;">Outstanding Balance</div>
        ${invoices?.outstanding > 0 ? `<a href="/portal/invoices" class="btn btn-primary" style="margin-top: 0.5rem; font-size: 0.85rem;">Pay Now</a>` : ''}
      </div>
      <div class="card" style="text-align: center;">
        <div style="font-size: 2.5rem; color: var(--primary);">${jobs?.completed || 0}</div>
        <div style="color: #666;">Jobs Completed</div>
        <a href="/portal/jobs" style="color: var(--secondary); font-size: 0.9rem;">View history →</a>
      </div>
    </div>
    
    <div class="card">
      <h2>Recent Activity</h2>
      ${recentActivity.results?.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${recentActivity.results.map((a: any) => `
              <tr>
                <td>
                  ${a.type === 'quote' ? '💰' : '📄'} ${a.title}
                </td>
                <td>$${a.amount?.toLocaleString() || '-'}</td>
                <td><span class="badge badge-${a.status}">${a.status}</span></td>
                <td>${new Date(a.created_at * 1000).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<div class="empty">No recent activity</div>'}
    </div>
    
    <div class="card">
      <h2>Need Help?</h2>
      <p style="color: #666; margin-bottom: 1rem;">Have a question about a quote or invoice? We're here to help!</p>
      <a href="/portal/messages" class="btn btn-primary">Send a Message</a>
      <a href="tel:${business.phone}" class="btn btn-secondary" style="margin-left: 0.5rem;">📞 Call Us</a>
    </div>
  `;
  
  return c.html(portalLayout('Dashboard', content, customer));
};

// Quotes list
export const portalQuotes = async (c: Context) => {
  const customer = c.get('customer');
  
  const quotes = await c.env.DB.prepare(`
    SELECT * FROM quotes
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `).bind(customer.customer_id).all<any>();
  
  const content = `
    <h1 style="margin-bottom: 1.5rem;">My Quotes</h1>
    
    <div class="card">
      ${quotes.results?.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Total</th>
              <th>Status</th>
              <th>Valid Until</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${quotes.results.map((q: any) => `
              <tr>
                <td>${q.labor_type || 'Work Quote'}</td>
                <td><strong>$${q.total?.toLocaleString()}</strong></td>
                <td><span class="badge badge-${q.status}">${q.status}</span></td>
                <td>${q.valid_until ? new Date(q.valid_until * 1000).toLocaleDateString() : '-'}</td>
                <td>
                  <a href="/portal/quotes/${q.id}" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">View</a>
                  ${q.status === 'sent' ? `<a href="/portal/quotes/${q.id}/accept" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-left: 0.5rem;">Accept</a>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<div class="empty">No quotes yet. Contact us for a free estimate!</div>'}
    </div>
  `;
  
  return c.html(portalLayout('My Quotes', content, customer));
};

// Invoices list
export const portalInvoices = async (c: Context) => {
  const customer = c.get('customer');
  
  const invoices = await c.env.DB.prepare(`
    SELECT * FROM invoices
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `).bind(customer.customer_id).all<any>();
  
  const content = `
    <h1 style="margin-bottom: 1.5rem;">My Invoices</h1>
    
    <div class="card">
      ${invoices.results?.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.results.map((inv: any) => `
              <tr>
                <td><strong>${inv.invoice_number || 'DRAFT'}</strong></td>
                <td>$${inv.total?.toLocaleString()}</td>
                <td>$${(inv.amount_paid || 0).toLocaleString()}</td>
                <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
                <td>${inv.due_date ? new Date(inv.due_date * 1000).toLocaleDateString() : '-'}</td>
                <td>
                  <a href="/portal/invoices/${inv.id}" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">View</a>
                  ${['sent', 'partial', 'overdue'].includes(inv.status) ? `<a href="/pay/${inv.id}" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-left: 0.5rem;">Pay</a>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<div class="empty">No invoices yet.</div>'}
    </div>
  `;
  
  return c.html(portalLayout('My Invoices', content, customer));
};

// Quote detail view
export const portalQuoteDetail = async (c: Context) => {
  const customer = c.get('customer');
  const quoteId = c.req.param('id');
  
  const quote = await c.env.DB.prepare(`
    SELECT * FROM quotes WHERE id = ? AND customer_id = ?
  `).bind(quoteId, customer.customer_id).first<any>();
  
  if (!quote) {
    return c.redirect('/portal/quotes');
  }
  
  const laborTotal = (quote.labor_rate || 0) * (quote.estimated_hours || 1);
  const helperTotal = quote.helper_needed ? (quote.helper_rate || 0) : 0;
  const validDate = quote.valid_until ? new Date(quote.valid_until * 1000).toLocaleDateString() : 'N/A';
  
  const content = `
    <div style="max-width: 800px;">
      <a href="/portal/quotes" style="color: var(--secondary); text-decoration: none;">← Back to Quotes</a>
      
      <div class="card" style="margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
          <div>
            <h1 style="margin: 0;">Quote</h1>
            <p style="color: #666; margin: 0.25rem 0 0;">Valid until: ${validDate}</p>
          </div>
          <span class="badge badge-${quote.status}" style="font-size: 1rem;">${quote.status}</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Labor (${quote.labor_type || 'Standard'})</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${laborTotal.toFixed(2)}</td>
          </tr>
          ${quote.helper_needed ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Helper</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${helperTotal.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${quote.materials_estimate ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Materials (estimate)</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${quote.materials_estimate.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${quote.equipment_estimate ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Equipment</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${quote.equipment_estimate.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${quote.discount_percent ? `
          <tr style="border-bottom: 1px solid #eee; color: #059669;">
            <td style="padding: 0.75rem 0;">Discount (${quote.discount_percent}%)</td>
            <td style="padding: 0.75rem 0; text-align: right;">-$${((quote.subtotal || 0) * quote.discount_percent / 100).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="font-size: 1.25rem; font-weight: 600;">
            <td style="padding: 1rem 0;">Total</td>
            <td style="padding: 1rem 0; text-align: right; color: var(--primary);">$${quote.total?.toFixed(2) || '0.00'}</td>
          </tr>
        </table>
        
        ${quote.notes ? `
        <div style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong>Notes:</strong>
          <p style="margin: 0.5rem 0 0; white-space: pre-wrap;">${quote.notes}</p>
        </div>
        ` : ''}
        
        ${quote.status === 'sent' ? `
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <form action="/portal/quotes/${quote.id}/accept" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem;">
              ✓ Accept Quote
            </button>
          </form>
          <form action="/portal/quotes/${quote.id}/decline" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-secondary">
              Decline
            </button>
          </form>
        </div>
        ` : quote.status === 'accepted' ? `
        <div style="text-align: center; padding: 1rem; background: #d1fae5; border-radius: 8px;">
          ✅ You accepted this quote. We'll be in touch to schedule the work!
        </div>
        ` : ''}
      </div>
    </div>
  `;
  
  return c.html(portalLayout('Quote Details', content, customer));
};

// Invoice detail view
export const portalInvoiceDetail = async (c: Context) => {
  const customer = c.get('customer');
  const invoiceId = c.req.param('id');
  
  const invoice = await c.env.DB.prepare(`
    SELECT * FROM invoices WHERE id = ? AND customer_id = ?
  `).bind(invoiceId, customer.customer_id).first<any>();
  
  if (!invoice) {
    return c.redirect('/portal/invoices');
  }
  
  const dueDate = invoice.due_date ? new Date(invoice.due_date * 1000).toLocaleDateString() : 'N/A';
  const balance = (invoice.total || 0) - (invoice.amount_paid || 0);
  
  const content = `
    <div style="max-width: 800px;">
      <a href="/portal/invoices" style="color: var(--secondary); text-decoration: none;">← Back to Invoices</a>
      
      <div class="card" style="margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
          <div>
            <h1 style="margin: 0;">Invoice ${invoice.invoice_number || ''}</h1>
            <p style="color: #666; margin: 0.25rem 0 0;">Due: ${dueDate}</p>
          </div>
          <span class="badge badge-${invoice.status}" style="font-size: 1rem;">${invoice.status}</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          ${invoice.labor_amount ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Labor</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${invoice.labor_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.helper_amount ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Helper</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${invoice.helper_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.materials_amount ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Materials</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${invoice.materials_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.equipment_amount ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Equipment</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${invoice.equipment_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.discount_amount ? `
          <tr style="border-bottom: 1px solid #eee; color: #059669;">
            <td style="padding: 0.75rem 0;">Discount</td>
            <td style="padding: 0.75rem 0; text-align: right;">-$${invoice.discount_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.tax_amount ? `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem 0;">Tax (${invoice.tax_rate}%)</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${invoice.tax_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="font-weight: 600;">
            <td style="padding: 0.75rem 0;">Total</td>
            <td style="padding: 0.75rem 0; text-align: right;">$${invoice.total?.toFixed(2) || '0.00'}</td>
          </tr>
          ${invoice.amount_paid ? `
          <tr style="color: #059669;">
            <td style="padding: 0.75rem 0;">Amount Paid</td>
            <td style="padding: 0.75rem 0; text-align: right;">-$${invoice.amount_paid.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${balance > 0 ? `
          <tr style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">
            <td style="padding: 1rem 0;">Balance Due</td>
            <td style="padding: 1rem 0; text-align: right;">$${balance.toFixed(2)}</td>
          </tr>
          ` : ''}
        </table>
        
        ${invoice.notes ? `
        <div style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong>Notes:</strong>
          <p style="margin: 0.5rem 0 0; white-space: pre-wrap;">${invoice.notes}</p>
        </div>
        ` : ''}
        
        ${balance > 0 ? `
        <div style="text-align: center;">
          <a href="/pay/${invoice.id}" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem;">
            💳 Pay $${balance.toFixed(2)} Now
          </a>
          <p style="color: #666; font-size: 0.85rem; margin-top: 1rem;">Secure payment via credit/debit card</p>
        </div>
        ` : `
        <div style="text-align: center; padding: 1rem; background: #d1fae5; border-radius: 8px;">
          ✅ This invoice has been paid in full. Thank you!
        </div>
        `}
      </div>
    </div>
  `;
  
  return c.html(portalLayout('Invoice Details', content, customer));
};

// Messages
export const portalMessages = async (c: Context) => {
  const customer = c.get('customer');
  
  const messages = await c.env.DB.prepare(`
    SELECT * FROM messages WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50
  `).bind(customer.customer_id).all<any>();
  
  const content = `
    <h1 style="margin-bottom: 1.5rem;">Messages</h1>
    
    <div class="card">
      <form action="/portal/messages" method="POST" style="margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.5rem;">
          <input type="text" name="message" placeholder="Type a message..." required
            style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
          <button type="submit" class="btn btn-primary">Send</button>
        </div>
      </form>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${messages.results?.length ? messages.results.map((m: any) => `
          <div style="
            padding: 0.75rem 1rem;
            border-radius: 12px;
            max-width: 80%;
            ${m.sender === 'customer' 
              ? 'background: #dbeafe; align-self: flex-end; border-bottom-right-radius: 4px;' 
              : 'background: #f3f4f6; align-self: flex-start; border-bottom-left-radius: 4px;'}
          ">
            <p style="margin: 0;">${m.content}</p>
            <small style="color: #666; font-size: 0.75rem;">
              ${new Date(m.created_at * 1000).toLocaleString()}
            </small>
          </div>
        `).join('') : '<p style="text-align: center; color: #666;">No messages yet. Send one above!</p>'}
      </div>
    </div>
    
    <div class="card" style="margin-top: 1.5rem;">
      <h3>Other ways to reach us:</h3>
      <p>📧 Email: ${business.email}</p>
      <p>📱 Phone: ${business.phone}</p>
    </div>
  `;
  
  return c.html(portalLayout('Messages', content, customer));
};

// Jobs list
export const portalJobs = async (c: Context) => {
  const customer = c.get('customer');
  
  const jobs = await c.env.DB.prepare(`
    SELECT * FROM bookings
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `).bind(customer.customer_id).all<any>();
  
  const content = `
    <h1 style="margin-bottom: 1.5rem;">Job History</h1>
    
    <div class="card">
      ${jobs.results?.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${jobs.results.map((job: any) => `
              <tr>
                <td>
                  <strong>${job.title || job.service_type}</strong>
                  ${job.description ? `<br><small style="color:#666">${job.description.slice(0, 50)}...</small>` : ''}
                </td>
                <td><span class="badge badge-${job.status}">${job.status?.replace('_', ' ')}</span></td>
                <td>${job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'TBD'}</td>
                <td>
                  <a href="/portal/jobs/${job.id}" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Details</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<div class="empty">No jobs yet. Request a quote to get started!</div>'}
    </div>
  `;
  
  return c.html(portalLayout('Job History', content, customer));
};

// Subscription management page
export const portalSubscription = async (c: Context) => {
  const customer = c.get('customer');
  const db = c.env.DB;
  
  // Get active subscription
  const subscription = await db.prepare(`
    SELECT 
      cs.*,
      sp.display_name as plan_name,
      sp.hours_per_month,
      sp.monthly_price,
      sp.features
    FROM customer_subscriptions cs
    JOIN subscription_plans sp ON cs.plan_id = sp.id
    WHERE cs.customer_id = ? AND cs.status = 'active'
    ORDER BY cs.created_at DESC
    LIMIT 1
  `).bind(customer.customer_id).first<any>();
  
  // Get tasks for subscriber
  const tasks = subscription ? await db.prepare(`
    SELECT * FROM subscription_tasks
    WHERE subscription_id = ?
    ORDER BY 
      CASE status
        WHEN 'pending' THEN 1
        WHEN 'scheduled' THEN 2
        WHEN 'in_progress' THEN 3
        WHEN 'completed' THEN 4
      END,
      created_at DESC
    LIMIT 20
  `).bind(subscription.id).all<any>() : { results: [] };
  
  // Calculate hours
  const hoursUsed = subscription?.hours_used_this_period || 0;
  const hoursTotal = subscription?.hours_per_month || 0;
  const hoursRemaining = Math.max(0, hoursTotal - hoursUsed);
  const hoursPercent = hoursTotal > 0 ? Math.round((hoursUsed / hoursTotal) * 100) : 0;
  
  // Period info
  const periodEnd = subscription?.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString() 
    : 'N/A';
  
  const urgencyColors: Record<string, string> = {
    urgent: '#dc2626',
    high: '#f59e0b',
    normal: '#3b82f6',
    low: '#6b7280',
  };
  
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    scheduled: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };
  
  const content = subscription ? `
    <h1 style="margin-bottom: 1.5rem;">My Subscription 🦫</h1>
    
    <!-- Subscription Status Card -->
    <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="font-size: 0.9rem; opacity: 0.9;">Current Plan</div>
          <div style="font-size: 1.75rem; font-weight: 600;">${subscription.plan_name}</div>
          <div style="font-size: 1.1rem; opacity: 0.9;">$${subscription.monthly_price}/month</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.9rem; opacity: 0.9;">Period Ends</div>
          <div style="font-size: 1.1rem;">${periodEnd}</div>
        </div>
      </div>
      
      <!-- Hours Progress Bar -->
      <div style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Hours Used</span>
          <span>${hoursUsed} / ${hoursTotal} hours</span>
        </div>
        <div style="background: rgba(255,255,255,0.3); border-radius: 10px; height: 12px; overflow: hidden;">
          <div style="background: white; height: 100%; width: ${hoursPercent}%; border-radius: 10px; transition: width 0.3s;"></div>
        </div>
        <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.9;">
          ${hoursRemaining} hours remaining this period
        </div>
      </div>
    </div>
    
    <!-- Add Task Form -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <h2 style="margin-bottom: 1rem;">➕ Add a Task</h2>
      <form action="/portal/subscription/add-task" method="POST" enctype="multipart/form-data">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">What do you need done?</label>
          <textarea name="description" required rows="3" 
            placeholder="Describe the task... e.g., Fix squeaky door hinge in master bedroom"
            style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;"></textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Urgency</label>
            <select name="urgency" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
              <option value="normal">Normal</option>
              <option value="low">Low - whenever you can</option>
              <option value="high">High - this week if possible</option>
              <option value="urgent">Urgent - ASAP!</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Estimated Hours</label>
            <input type="number" name="estimated_hours" min="0.5" max="10" step="0.5" 
              placeholder="Optional"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
          </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">📸 Photos (optional)</label>
          <input type="file" name="photos" accept="image/*" multiple 
            style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
          <small style="color: #666;">Upload photos to help us understand the task</small>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%;">
          Add to My Queue →
        </button>
      </form>
    </div>
    
    <!-- Task Queue -->
    <div class="card">
      <h2 style="margin-bottom: 1rem;">📋 My Task Queue</h2>
      
      ${tasks.results?.length ? `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${tasks.results.map((task: any) => {
            const photos = task.photos ? JSON.parse(task.photos) : [];
            return `
              <div style="padding: 1rem; border: 1px solid #e5e5e5; border-radius: 12px; border-left: 4px solid ${statusColors[task.status] || '#ddd'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                  <span style="background: ${urgencyColors[task.urgency]}; color: white; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; text-transform: uppercase;">
                    ${task.urgency}
                  </span>
                  <span style="background: ${statusColors[task.status]}22; color: ${statusColors[task.status]}; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 500;">
                    ${task.status?.replace('_', ' ')}
                  </span>
                </div>
                <p style="margin: 0.5rem 0; color: #333;">${task.description}</p>
                ${task.scheduled_date ? `
                  <div style="font-size: 0.85rem; color: #666;">
                    📅 Scheduled: ${new Date(task.scheduled_date).toLocaleDateString()}
                  </div>
                ` : ''}
                ${task.hours_spent ? `
                  <div style="font-size: 0.85rem; color: #666;">
                    ⏱️ Hours used: ${task.hours_spent}
                  </div>
                ` : ''}
                ${photos.length > 0 ? `
                  <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    ${photos.map((url: string) => `
                      <img src="${url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    `).join('')}
                  </div>
                ` : ''}
                ${task.notes ? `
                  <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem; padding: 0.5rem; background: #f9f9f9; border-radius: 8px;">
                    💬 ${task.notes}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty">
          No tasks in your queue yet. Add one above! 👆
        </div>
      `}
    </div>
    
    <!-- Features included -->
    <div class="card" style="margin-top: 1.5rem;">
      <h2 style="margin-bottom: 1rem;">✨ Your Plan Includes</h2>
      <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
        ${(subscription.features ? JSON.parse(subscription.features) : []).map((f: string) => `
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--secondary);">✓</span> ${f}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : `
    <h1 style="margin-bottom: 1.5rem;">Subscription</h1>
    
    <div class="card" style="text-align: center; padding: 3rem 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">🦫</div>
      <h2 style="color: var(--primary); margin-bottom: 1rem;">No Active Subscription</h2>
      <p style="color: #666; margin-bottom: 1.5rem; max-width: 400px; margin-left: auto; margin-right: auto;">
        Get unlimited task queuing, priority scheduling, and rollover hours with a Handy Beaver subscription.
      </p>
      <a href="/pricing" class="btn btn-primary">View Plans →</a>
    </div>
  `;
  
  return c.html(portalLayout('My Subscription', content, customer));
};
