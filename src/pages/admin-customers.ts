import { Context } from 'hono';
import { adminLayout } from './admin';

export const adminCustomersPage = async (c: Context) => {
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
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Notes</label>
            <textarea id="customer-notes" rows="3"></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary">Save Customer</button>
          </div>
        </form>
      </div>
    </div>
    
    <style>
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
      .btn-primary { background: #2196f3; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
      .btn-secondary { background: #e0e0e0; color: #333; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; }
      
      .search-bar { margin-bottom: 1.5rem; }
      .search-bar input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
      
      .stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; padding: 1rem 1.5rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #2196f3; display: block; }
      .stat-label { font-size: 0.85rem; color: #666; }
      
      .customer-list { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      .customer-item { display: grid; grid-template-columns: 1fr 1fr 120px 100px 100px; padding: 1rem; border-bottom: 1px solid #eee; align-items: center; }
      .customer-item:hover { background: #f8f9fa; }
      .customer-item:last-child { border-bottom: none; }
      .customer-name { font-weight: 600; }
      .customer-email { color: #666; font-size: 0.9rem; }
      .customer-phone { color: #666; }
      .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
      .status-lead { background: #fff3e0; color: #e65100; }
      .status-prospect { background: #e3f2fd; color: #1565c0; }
      .status-active { background: #e8f5e9; color: #2e7d32; }
      .status-completed { background: #f3e5f5; color: #7b1fa2; }
      .customer-actions { display: flex; gap: 0.5rem; }
      .customer-actions button { background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
      .customer-actions button:hover { background: #e0e0e0; }
      
      .loading { padding: 2rem; text-align: center; color: #666; }
      
      .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; z-index: 1000; }
      .modal-overlay.active { display: flex; }
      .modal { background: white; border-radius: 12px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
      .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #eee; }
      .modal-header h2 { margin: 0; }
      .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
      .modal form { padding: 1.5rem; }
      .form-group { margin-bottom: 1rem; }
      .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333; }
      .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
      .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
    </style>
    
    <script>
      let customers = [];
      
      async function loadCustomers() {
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        customers = data.results || [];
        
        // Calculate stats
        document.getElementById('stat-total').textContent = customers.length;
        document.getElementById('stat-leads').textContent = customers.filter(c => c.status === 'lead').length;
        document.getElementById('stat-active').textContent = customers.filter(c => c.status === 'active').length;
        
        renderCustomers(customers);
      }
      
      function renderCustomers(list) {
        const container = document.getElementById('customer-list');
        
        if (!list.length) {
          container.innerHTML = '<div class="loading">No customers found</div>';
          return;
        }
        
        container.innerHTML = list.map(c => \`
          <div class="customer-item">
            <div>
              <div class="customer-name">\${c.name}</div>
              <div class="customer-email">\${c.email}</div>
            </div>
            <div class="customer-phone">\${c.phone || '-'}</div>
            <div>\${c.job_count || 0} jobs</div>
            <div><span class="status-badge status-\${c.status || 'lead'}">\${c.status || 'lead'}</span></div>
            <div class="customer-actions">
              <button onclick="editCustomer(\${c.id})" title="Edit">✏️</button>
              <button onclick="viewCustomer(\${c.id})" title="View Details">👁️</button>
            </div>
          </div>
        \`).join('');
      }
      
      function searchCustomers() {
        const query = document.getElementById('search-input').value.toLowerCase();
        const filtered = customers.filter(c => 
          c.name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query)
        );
        renderCustomers(filtered);
      }
      
      function showAddModal() {
        document.getElementById('modal-title').textContent = 'Add Customer';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-id').value = '';
        document.getElementById('customer-modal').classList.add('active');
      }
      
      function closeModal() {
        document.getElementById('customer-modal').classList.remove('active');
      }
      
      function editCustomer(id) {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        
        document.getElementById('modal-title').textContent = 'Edit Customer';
        document.getElementById('customer-id').value = id;
        document.getElementById('customer-name').value = customer.name || '';
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-phone').value = customer.phone || '';
        document.getElementById('customer-address').value = customer.address || '';
        document.getElementById('customer-status').value = customer.status || 'lead';
        document.getElementById('customer-notes').value = customer.notes || '';
        
        document.getElementById('customer-modal').classList.add('active');
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
          notes: document.getElementById('customer-notes').value,
        };
        
        const url = id ? '/api/admin/customers/' + id : '/api/admin/customers';
        const method = id ? 'PATCH' : 'POST';
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (result.success || result.id) {
          closeModal();
          loadCustomers();
        } else {
          alert(result.error || 'Failed to save customer');
        }
      }
      
      function viewCustomer(id) {
        window.location.href = '/admin?view=customer&id=' + id;
      }
      
      // Initial load
      loadCustomers();
    </script>
  `;
  
  return c.html(adminLayout('Customers', content, 'customers'));
};
