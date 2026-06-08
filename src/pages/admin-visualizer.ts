import { Context } from 'hono';
import { Admin } from '../lib/auth';
import { siteConfig } from '../../config/site.config';

// Import admin layout helper
const adminLayout = (title: string, content: string, activePage: string, admin?: Admin) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Admin - ${siteConfig.business.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
    }
    .admin-nav {
      background: #2C1810;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .admin-nav .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .admin-nav .brand img { width: 40px; height: 40px; border-radius: 50%; }
    .admin-layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: calc(100vh - 60px);
    }
    .sidebar {
      background: white;
      border-right: 1px solid #e5e5e5;
      padding: 1rem 0;
    }
    .sidebar a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #333;
      text-decoration: none;
      border-left: 3px solid transparent;
    }
    .sidebar a:hover { background: #f9f9f9; }
    .sidebar a.active {
      background: #fff5f0;
      border-left-color: #8B4513;
      color: #8B4513;
      font-weight: 600;
    }
    .sidebar .divider {
      height: 1px;
      background: #e5e5e5;
      margin: 1rem 0;
    }
    .main-content {
      padding: 2rem;
      overflow-y: auto;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-primary { background: #8B4513; color: white; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .grid { display: grid; gap: 1.5rem; }
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 2rem; font-weight: bold; color: #8B4513; }
    .stat-label { color: #666; font-size: 0.9rem; }
    :root { --primary: #8B4513; --secondary: #D2691E; }
    
    /* Mobile Menu Toggle */
    .menu-toggle {
      display: none;
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
    }
    
    /* Mobile Styles */
    @media (max-width: 900px) {
      .menu-toggle { display: block !important; }
      .admin-nav { padding: 0.75rem 1rem; }
      .admin-nav .user span { display: none; }
      
      .admin-layout { grid-template-columns: 1fr; }
      
      .sidebar {
        position: fixed !important;
        top: 60px;
        left: -260px;
        width: 250px !important;
        height: calc(100vh - 60px);
        z-index: 1000;
        transition: left 0.3s ease;
        box-shadow: 2px 0 10px rgba(0,0,0,0.3);
        background: #1a1a2e !important;
        flex-direction: column !important;
        overflow-y: auto;
        display: flex !important;
        padding: 1rem 0 !important;
      }
      .sidebar.open { left: 0 !important; }
      
      .sidebar a {
        color: #ccc !important;
        border-left: 3px solid transparent !important;
        padding: 0.75rem 1rem !important;
      }
      .sidebar a:hover { background: rgba(255,255,255,0.1) !important; }
      .sidebar a.active {
        border-left-color: #8B4513 !important;
        background: rgba(139, 69, 19, 0.2) !important;
        color: white !important;
      }
      .sidebar .divider {
        background: rgba(255,255,255,0.1) !important;
        margin: 0.5rem 0 !important;
      }
      
      .sidebar-overlay {
        display: none;
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
      }
      .sidebar-overlay.open { display: block; }
      
      .main-content { padding: 1rem; width: 100% !important; }
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav class="admin-nav">
    <div class="brand">
      <button class="menu-toggle" onclick="toggleSidebar()">☰</button>
      <img src="/beaver-avatar.png" alt="Beaver">
      <span>${siteConfig.business.name} Admin</span>
    </div>
    <div class="user" style="display: flex; align-items: center; gap: 1rem;">
      <span>${admin?.name || admin?.github_username || 'Admin'}</span>
      <a href="/api/auth/logout" style="color: #ccc;">Logout</a>
    </div>
  </nav>
  <div class="sidebar-overlay" onclick="toggleSidebar()"></div>
  
  <div class="admin-layout">
    <aside class="sidebar">
      <a href="/admin" class="${activePage === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
      <a href="/admin/quotes" class="${activePage === 'quotes' ? 'active' : ''}">💰 Quotes</a>
      <a href="/admin/jobs" class="${activePage === 'jobs' ? 'active' : ''}">🛠️ Jobs</a>
      <a href="/admin/customers" class="${activePage === 'customers' ? 'active' : ''}">👥 Customers</a>
      <a href="/admin/messages" class="${activePage === 'messages' ? 'active' : ''}">💬 Messages</a>
      <div class="divider"></div>
      <a href="/admin/visualizer" class="${activePage === 'visualizer' ? 'active' : ''}">✨ AI Visualizer</a>
      <a href="/admin/invoices" class="${activePage === 'invoices' ? 'active' : ''}">📄 Invoices</a>
      <a href="/admin/gallery" class="${activePage === 'gallery' ? 'active' : ''}">🖼️ Gallery</a>
      <div class="divider"></div>
      <a href="/admin/settings" class="${activePage === 'settings' ? 'active' : ''}">⚙️ Settings</a>
      <a href="/" target="_blank">🌐 View Site</a>
    </aside>
    
    <main class="main-content">
      ${content}
    </main>
  </div>
  <script>
    function toggleSidebar() {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    }
  </script>
</body>
</html>
`;

export const adminVisualizerPage = async (c: Context) => {
  const admin = c.get('admin') as Admin;
  // Get recent usage stats
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_uses,
      COUNT(DISTINCT customer_id) as unique_users,
      COUNT(CASE WHEN created_at >= unixepoch() - 86400 THEN 1 END) as uses_today
    FROM visualizer_usage
  `).first<{ total_uses: number; unique_users: number; uses_today: number }>();
  
  const recentHistory = await c.env.DB.prepare(`
    SELECT vu.*, c.name, c.email
    FROM visualizer_usage vu
    LEFT JOIN customers c ON vu.customer_id = c.id
    ORDER BY vu.created_at DESC
    LIMIT 10
  `).all();

  const recentQuotes = await c.env.DB.prepare(`
    SELECT vq.*, c.name as customer_name, c.email as customer_email
    FROM visualizer_quotes vq
    LEFT JOIN customers c ON vq.customer_id = c.id
    ORDER BY vq.created_at DESC
    LIMIT 10
  `).all().catch(() => ({ results: [] }));
  
  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1 style="color: var(--primary); font-family: 'Playfair Display', serif;">
        ✨ AI Visualizer (Admin)
      </h1>
      <span style="background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
        👑 Unlimited Access
      </span>
    </div>
    
    <!-- Stats -->
    <div class="grid grid-3" style="margin-bottom: 2rem;">
      <div class="stat-card">
        <div class="stat-value">${stats?.total_uses || 0}</div>
        <div class="stat-label">Total Visualizations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats?.unique_users || 0}</div>
        <div class="stat-label">Unique Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats?.uses_today || 0}</div>
        <div class="stat-label">Today</div>
      </div>
    </div>
    
    <div class="grid grid-2" style="gap: 2rem;">
      <!-- Visualizer Form -->
      <div class="card">
        <h2 style="color: var(--primary); margin-bottom: 1.5rem;">Generate Visualization</h2>
        
        <form id="visualize-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
              📸 Upload Photo
            </label>
            <div 
              id="drop-zone"
              style="
                border: 2px dashed #ccc; 
                border-radius: 12px; 
                padding: 2rem; 
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                background: #fafafa;
              "
            >
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
              <p style="color: #666;">Click or drag to upload</p>
              <input type="file" id="photo-input" accept="image/*" style="display: none;">
            </div>
            <div id="preview-container" style="display: none; margin-top: 1rem; text-align: center;">
              <img id="photo-preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
              <button type="button" id="clear-photo" style="margin-top: 0.5rem; color: #999; background: none; border: none; cursor: pointer;">
                ✕ Clear
              </button>
            </div>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
              🎨 Describe Changes
            </label>
            <textarea 
              id="prompt-input"
              rows="3"
              placeholder="Example: Show this deck with dark walnut stain and new railings..."
              style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;"
            ></textarea>
          </div>
          
          <button type="submit" id="visualize-btn" class="btn btn-primary" style="width: 100%;">
            ✨ Generate
          </button>
        </form>
        
        <div id="result-container" style="display: none; margin-top: 2rem;">
          <h3 style="color: var(--primary);">Result</h3>
          <div id="result-image" style="margin-top: 1rem;"></div>
          <button type="button" id="download-btn" class="btn btn-secondary" style="margin-top: 1rem; width: 100%;">
            📥 Download
          </button>
        </div>
      </div>
      
      <!-- Recent History -->
      <div class="card">
        <h2 style="color: var(--primary); margin-bottom: 1.5rem;">Recent Activity</h2>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #eee;">
                <th style="text-align: left; padding: 0.75rem;">Customer</th>
                <th style="text-align: left; padding: 0.75rem;">Prompt</th>
                <th style="text-align: left; padding: 0.75rem;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${recentHistory.results?.map((row: any) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 0.75rem;">
                    ${row.customer_id === 0 ? '👑 Admin' : row.name || row.email || 'Unknown'}
                  </td>
                  <td style="padding: 0.75rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${row.prompt}
                  </td>
                  <td style="padding: 0.75rem; color: #666; font-size: 0.9rem;">
                    ${new Date(row.created_at * 1000).toLocaleDateString()}
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="3" style="padding: 1rem; color: #999;">No activity yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Recent Quotes Section -->
    <div class="card" style="margin-top: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="color: var(--primary);">💰 Recent Quote Estimates</h2>
        <span style="background: #e5e7eb; color: #555; padding: 0.3rem 0.8rem; border-radius: 10px; font-size: 0.85rem;">
          ${recentQuotes.results?.length || 0} recent
        </span>
      </div>

      ${recentQuotes.results?.length ? `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${recentQuotes.results.map((q: any) => {
            let lineItems: any[] = [];
            try { lineItems = JSON.parse(q.line_items || '[]'); } catch (e) {}
            const total = q.total_amount ? '$' + Number(q.total_amount).toLocaleString('en-US', { minimumFractionDigits: 0 }) : 'N/A';
            return `
              <details style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <summary style="padding: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; list-style: none;">
                  <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <span style="font-weight: 600;">${q.customer_name || q.customer_email || 'Admin'}</span>
                    <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; text-transform: capitalize;">${q.project_type || 'Project'}</span>
                    <span style="background: #f3e8ff; color: #7c3aed; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; text-transform: capitalize;">${q.style || 'No style'}</span>
                    <span style="color: #666; font-size: 0.85rem;">${new Date(q.created_at * 1000).toLocaleDateString()}</span>
                  </div>
                  <span style="font-weight: 700; color: var(--primary); font-size: 1.1rem; white-space: nowrap;">${total}</span>
                </summary>
                <div style="padding: 1rem;">
                  ${q.summary ? `<p style="color: #555; margin-bottom: 0.75rem; font-size: 0.9rem;">${q.summary}</p>` : ''}
                  ${q.description ? `<p style="color: #666; font-size: 0.85rem; margin-bottom: 0.75rem;"><strong>Request:</strong> ${q.description}</p>` : ''}
                  ${lineItems.length ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                      <thead><tr style="background: #f3f4f6;">
                        <th style="text-align: left; padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">Type</th>
                        <th style="text-align: left; padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">Description</th>
                        <th style="text-align: right; padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">Qty</th>
                        <th style="text-align: left; padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">Unit</th>
                        <th style="text-align: right; padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">$/Unit</th>
                        <th style="text-align: right; padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">Total</th>
                      </tr></thead>
                      <tbody>
                        ${lineItems.map((item: any) => `
                          <tr style="border-bottom: 1px solid #f9fafb;">
                          <tr style="border-bottom: 1px solid #f9fafb;">
                            <td style="padding: 0.5rem;"><span style="background: ${item.type === 'LABOR' ? '#dbeafe' : '#dcfce7'}; color: ${item.type === 'LABOR' ? '#1d4ed8' : '#166534'}; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 600;">${item.type}</span></td>
                            <td style="padding: 0.5rem; font-weight: 500;">${item.description || ''}</td>
                            <td style="padding: 0.5rem; text-align: right; color: #555;">${item.qty || 0}</td>
                            <td style="padding: 0.5rem; color: #555;">${item.unit || ''}</td>
                            <td style="padding: 0.5rem; text-align: right; color: #555;">$${Number(item.price_per_unit || 0).toFixed(2)}</td>
                            <td style="padding: 0.5rem; text-align: right; font-weight: 600; color: var(--primary);">$${Number(item.total || 0).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot><tr>
                        <td colspan="5" style="padding: 0.5rem; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">Total</td>
                        <td style="padding: 0.5rem; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb; color: var(--primary);">${total}</td>
                      </tr></tfoot>
                    </table>
                  ` : '<p style="color: #999; font-size: 0.85rem;">No line items available.</p>'}
                </div>
              </details>
            `;
          }).join('')}
        </div>
      ` : '<p style="color: #999;">No quotes yet. Quotes generated by portal customers will appear here.</p>'}
    </div>
  `;

  return c.html(adminLayout('AI Design Studio', content, 'visualizer', admin));
};
