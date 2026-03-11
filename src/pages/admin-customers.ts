import { Context } from 'hono';
import { adminLayout } from './admin';

// Customer detail page
export const adminCustomerDetail = async (c: Context) => {
  const admin = c.get('admin');
  const customerId = c.req.param('id');
  
  const customer = await c.env.DB.prepare(`
    SELECT * FROM customers WHERE id = ?
  `).bind(customerId).first<any>();
  
  if (!customer) {
    return c.notFound();
  }
  
  // Get customer's bookings
  const bookings = await c.env.DB.prepare(`
    SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC
  `).bind(customerId).all<any>();
  
  // Get customer's quotes
  const quotes = await c.env.DB.prepare(`
    SELECT * FROM quotes WHERE customer_id = ? ORDER BY created_at DESC
  `).bind(customerId).all<any>();
  
  // Get customer's invoices
  const invoices = await c.env.DB.prepare(`
    SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC
  `).bind(customerId).all<any>();
  
  // Get customer's messages
  const messages = await c.env.DB.prepare(`
    SELECT * FROM messages WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20
  `).bind(customerId).all<any>();
  
  const statusColors: Record<string, string> = {
    lead: '#f59e0b',
    active: '#10b981',
    inactive: '#6b7280',
    pending: '#3b82f6',
    completed: '#10b981',
    sent: '#3b82f6',
    paid: '#10b981',
  };
  
  const statusBadge = (status: string) => 
    `<span style="background: ${statusColors[status] || '#6b7280'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${status}</span>`;
  
  const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleDateString() : '-';
  const formatMoney = (amt: number) => amt ? `$${amt.toFixed(2)}` : '-';
  
  const bookingsHtml = bookings.results?.length ? `
    <table class="data-table">
      <thead><tr><th>Title</th><th>Service</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${bookings.results.map((b: any) => `
          <tr>
            <td>${b.title}</td>
            <td>${b.service_type}</td>
            <td>${statusBadge(b.status)}</td>
            <td>${formatDate(b.created_at)}</td>
            <td><a href="/admin/jobs/${b.id}">View</a></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #666;">No jobs yet.</p>';
  
  const quotesHtml = quotes.results?.length ? `
    <table class="data-table">
      <thead><tr><th>ID</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${quotes.results.map((q: any) => `
          <tr>
            <td>#${q.id}</td>
            <td>${formatMoney(q.total)}</td>
            <td>${statusBadge(q.status)}</td>
            <td>${formatDate(q.created_at)}</td>
            <td><a href="/admin/quotes/${q.id}">View</a></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #666;">No quotes yet.</p>';
  
  const invoicesHtml = invoices.results?.length ? `
    <table class="data-table">
      <thead><tr><th>#</th><th>Total</th><th>Paid</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead>
      <tbody>
        ${invoices.results.map((i: any) => `
          <tr>
            <td>${i.invoice_number || i.id}</td>
            <td>${formatMoney(i.total)}</td>
            <td>${formatMoney(i.amount_paid)}</td>
            <td>${statusBadge(i.status)}</td>
            <td>${formatDate(i.due_date)}</td>
            <td><a href="/admin/invoices/${i.id}">View</a></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #666;">No invoices yet.</p>';
  
  const messagesHtml = messages.results?.length ? messages.results.map((m: any) => `
    <div style="margin-bottom: 1rem; padding: 0.75rem; background: ${m.sender === 'customer' ? '#1e3a5f' : '#2d2d2d'}; border-radius: 8px;">
      <div style="font-size: 0.8rem; color: #888; margin-bottom: 0.25rem;">
        ${m.sender} • ${formatDate(m.created_at)} • via ${m.source || 'unknown'}
      </div>
      <div>${m.content}</div>
    </div>
  `).join('') : '<p style="color: #666;">No messages yet.</p>';
  
  const content = `
    <div class="customer-detail">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <a href="/admin/customers" style="color: #666; text-decoration: none;">← Back to Customers</a>
          <h1 style="margin: 0.5rem 0;">${customer.name || 'Unknown'}</h1>
          ${statusBadge(customer.status || 'lead')}
        </div>
        <div>
          <button class="btn-secondary" onclick="sendMagicLink()">📧 Send Portal Link</button>
          <button class="btn-primary" onclick="editCustomer()">Edit</button>
        </div>
      </div>
      
      <div class="customer-info card" style="margin: 1.5rem 0; padding: 1.5rem; background: #1a1a1a; border-radius: 8px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <strong>Email:</strong><br>
            <a href="mailto:${customer.email}">${customer.email}</a>
          </div>
          <div>
            <strong>Phone:</strong><br>
            ${customer.phone ? `<a href="tel:${customer.phone}">${customer.phone}</a>` : '-'}
          </div>
          <div>
            <strong>Address:</strong><br>
            ${customer.address || '-'}
          </div>
          <div>
            <strong>Customer Since:</strong><br>
            ${formatDate(customer.created_at)}
          </div>
        </div>
      </div>
      
      <div class="tabs" style="display: flex; gap: 0; border-bottom: 2px solid #333; margin-bottom: 1rem;">
        <button class="tab active" onclick="showTab('bookings')" id="tab-bookings">Jobs (${bookings.results?.length || 0})</button>
        <button class="tab" onclick="showTab('quotes')" id="tab-quotes">Quotes (${quotes.results?.length || 0})</button>
        <button class="tab" onclick="showTab('invoices')" id="tab-invoices">Invoices (${invoices.results?.length || 0})</button>
        <button class="tab" onclick="showTab('messages')" id="tab-messages">Messages (${messages.results?.length || 0})</button>
      </div>
      
      <div id="panel-bookings" class="tab-panel">
        ${bookingsHtml}
        <button class="btn-primary" onclick="createJob()" style="margin-top: 1rem;">+ New Job</button>
      </div>
      
      <div id="panel-quotes" class="tab-panel" style="display: none;">
        ${quotesHtml}
        <button class="btn-primary" onclick="createQuote()" style="margin-top: 1rem;">+ New Quote</button>
      </div>
      
      <div id="panel-invoices" class="tab-panel" style="display: none;">
        ${invoicesHtml}
        <button class="btn-primary" onclick="createInvoice()" style="margin-top: 1rem;">+ New Invoice</button>
      </div>
      
      <div id="panel-messages" class="tab-panel" style="display: none;">
        <div style="max-height: 400px; overflow-y: auto; padding: 1rem; background: #111; border-radius: 8px;">
          ${messagesHtml}
        </div>
      </div>
    </div>
    
    <style>
      .tab {
        padding: 0.75rem 1.5rem;
        background: transparent;
        border: none;
        color: #888;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
      }
      .tab.active {
        color: #fff;
        border-bottom-color: #f97316;
      }
      .tab:hover { color: #fff; }
      .data-table {
        width: 100%;
        border-collapse: collapse;
      }
      .data-table th, .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #333;
      }
      .data-table th { color: #888; font-weight: normal; }
    </style>
    
    <script>
      function showTab(name) {
        document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('panel-' + name).style.display = 'block';
        document.getElementById('tab-' + name).classList.add('active');
      }
      
      async function sendMagicLink() {
        if (!confirm('Send portal login link to ${customer.email}?')) return;
        const res = await fetch('/portal/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'email=${encodeURIComponent(customer.email)}'
        });
        alert('Magic link sent!');
      }
      
      function editCustomer() {
        window.location.href = '/admin/customers?edit=${customer.id}';
      }
      
      function createJob() {
        window.location.href = '/admin/jobs?new=1&customer=${customer.id}';
      }
      
      function createQuote() {
        window.location.href = '/admin/quotes?new=1&customer=${customer.id}';
      }
      
      function createInvoice() {
        window.location.href = '/admin/invoices?new=1&customer=${customer.id}';
      }
    </script>
  `;
  
  return c.html(adminLayout(`Customer: ${customer.name}`, content, 'customers', admin));
};

export const adminCustomersPage = async (c: Context) => {
  const admin = c.get('admin');
  const content = `
    <div class="admin-customers">
      <div class="page-header">
        <h1>Customers</h1>
        <button class="btn-primary" onclick="showAddModal()">+ Add Customer</button>
      </div>
      
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="Search by name, email, or phone..." oninput="searchCustomers()">
      </div>
      
      <div class="stats-row" id="stats">
        <div class="stat-card">
          <span class="stat-value" id="stat-total">-</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="stat-leads">-</span>
          <span class="stat-label">Leads</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="stat-active">-</span>
          <span class="stat-label">Active</span>
        </div>
      </div>
      
      <div class="customer-list" id="customer-list">
        <div class="loading">Loading customers...</div>
      </div>
    </div>
    
    <!-- Add/Edit Modal -->
    <div class="modal-overlay" id="customer-modal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modal-title">Add Customer</h2>
          <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <form id="customer-form" onsubmit="saveCustomer(event)">
          <input type="hidden" id="customer-id">
          
          <div class="form-group">
            <label>Name *</label>
            <input type="text" id="customer-name" required>
          </div>
          
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="customer-email" required>
          </div>
          
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="customer-phone">
          </div>
          
          <div class="form-group">
            <label>Address</label>
            <textarea id="customer-address" rows="2"></textarea>
          </div>
          
          <div class="form-group">
            <label>Status</label>
            <select id="customer-status">
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
    
    <style>
      .admin-customers { padding: 0; }
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
      .search-bar { margin-bottom: 1.5rem; }
      .search-bar input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #333; border-radius: 8px; background: #1a1a1a; color: #fff; font-size: 1rem; }
      .stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { flex: 1; padding: 1rem; background: #1a1a1a; border-radius: 8px; text-align: center; }
      .stat-value { display: block; font-size: 2rem; font-weight: bold; color: #f97316; }
      .stat-label { color: #888; font-size: 0.875rem; }
      .customer-list { background: #1a1a1a; border-radius: 8px; overflow: hidden; }
      .customer-row { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 100px; padding: 1rem; border-bottom: 1px solid #333; align-items: center; }
      .customer-row:hover { background: #222; }
      .customer-row.header { background: #111; font-weight: 600; color: #888; }
      .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; }
      .status-lead { background: #f59e0b33; color: #f59e0b; }
      .status-active { background: #10b98133; color: #10b981; }
      .status-inactive { background: #6b728033; color: #6b7280; }
      .customer-actions { display: flex; gap: 0.5rem; }
      .customer-actions button { padding: 4px 8px; font-size: 0.8rem; }
      .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; align-items: center; justify-content: center; }
      .modal-overlay.active { display: flex; }
      .modal { background: #1a1a1a; border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 500px; }
      .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
      .close-btn { background: none; border: none; color: #888; font-size: 1.5rem; cursor: pointer; }
      .form-group { margin-bottom: 1rem; }
      .form-group label { display: block; margin-bottom: 0.5rem; color: #888; }
      .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 6px; background: #111; color: #fff; }
      .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
      .loading { padding: 2rem; text-align: center; color: #888; }
    </style>
    
    <script>
      let customers = [];
      
      async function loadCustomers() {
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        customers = data.customers || [];
        renderCustomers();
        updateStats();
      }
      
      function renderCustomers(filtered = null) {
        const list = document.getElementById('customer-list');
        const items = filtered || customers;
        
        if (items.length === 0) {
          list.innerHTML = '<div class="loading">No customers found</div>';
          return;
        }
        
        list.innerHTML = \`
          <div class="customer-row header">
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          \${items.map(c => \`
            <div class="customer-row">
              <div><a href="/admin/customers/\${c.id}" style="color: #fff; text-decoration: none;">\${c.name || 'Unknown'}</a></div>
              <div style="color: #888;">\${c.email}</div>
              <div style="color: #888;">\${c.phone || '-'}</div>
              <div><span class="status-badge status-\${c.status || 'lead'}">\${c.status || 'lead'}</span></div>
              <div class="customer-actions">
                <button onclick="viewCustomer(\${c.id})" title="View">👁</button>
                <button onclick="editCustomerModal(\${c.id})" title="Edit">✏️</button>
              </div>
            </div>
          \`).join('')}
        \`;
      }
      
      function updateStats() {
        document.getElementById('stat-total').textContent = customers.length;
        document.getElementById('stat-leads').textContent = customers.filter(c => c.status === 'lead').length;
        document.getElementById('stat-active').textContent = customers.filter(c => c.status === 'active').length;
      }
      
      function searchCustomers() {
        const q = document.getElementById('search-input').value.toLowerCase();
        if (!q) { renderCustomers(); return; }
        const filtered = customers.filter(c => 
          (c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q)
        );
        renderCustomers(filtered);
      }
      
      function showAddModal() {
        document.getElementById('modal-title').textContent = 'Add Customer';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-id').value = '';
        document.getElementById('customer-modal').classList.add('active');
      }
      
      function editCustomerModal(id) {
        const c = customers.find(x => x.id === id);
        if (!c) return;
        document.getElementById('modal-title').textContent = 'Edit Customer';
        document.getElementById('customer-id').value = c.id;
        document.getElementById('customer-name').value = c.name || '';
        document.getElementById('customer-email').value = c.email || '';
        document.getElementById('customer-phone').value = c.phone || '';
        document.getElementById('customer-address').value = c.address || '';
        document.getElementById('customer-status').value = c.status || 'lead';
        document.getElementById('customer-modal').classList.add('active');
      }
      
      function closeModal() {
        document.getElementById('customer-modal').classList.remove('active');
      }
      
      async function saveCustomer(e) {
        e.preventDefault();
        const id = document.getElementById('customer-id').value;
        const data = {
          name: document.getElementById('customer-name').value,
          email: document.getElementById('customer-email').value,
          phone: document.getElementById('customer-phone').value,
          address: document.getElementById('customer-address').value,
          status: document.getElementById('customer-status').value,
        };
        
        const url = id ? \`/api/admin/customers/\${id}\` : '/api/admin/customers';
        const method = id ? 'PATCH' : 'POST';
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (result.success) {
          closeModal();
          loadCustomers();
        } else {
          alert(result.error || 'Failed to save customer');
        }
      }
      
      function viewCustomer(id) {
        window.location.href = '/admin/customers/' + id;
      }
      
      // Initial load
      loadCustomers();
    </script>
  `;
  
  return c.html(adminLayout('Customers', content, 'customers', admin));
};
