import { Context } from 'hono';
import { adminLayout } from './admin';

export const adminJobsPage = async (c: Context) => {
  const admin = c.get('admin');
  const db = c.env.DB;
  const status = c.req.query('status') || '';
  
  // Get jobs with customer info
  let query = `
    SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
  `;
  if (status) {
    query += ` WHERE b.status = '${status}'`;
  }
  query += ` ORDER BY b.scheduled_date DESC, b.created_at DESC LIMIT 100`;
  
  const jobs = await db.prepare(query).all<any>();
  
  // Get stats
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bookings
  `).first<any>();
  
  const content = `
    <div class="admin-jobs">
      <div class="page-header">
        <h1>Jobs</h1>
        <div class="header-actions">
          <select id="status-filter" onchange="filterJobs()">
            <option value="">All Jobs</option>
            <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat-card" onclick="filterJobs('')">
          <span class="stat-value">${stats?.total || 0}</span>
          <span class="stat-label">Total Jobs</span>
        </div>
        <div class="stat-card stat-pending" onclick="filterJobs('pending')">
          <span class="stat-value">${stats?.pending || 0}</span>
          <span class="stat-label">Pending</span>
        </div>
        <div class="stat-card stat-confirmed" onclick="filterJobs('confirmed')">
          <span class="stat-value">${stats?.confirmed || 0}</span>
          <span class="stat-label">Confirmed</span>
        </div>
        <div class="stat-card stat-progress" onclick="filterJobs('in_progress')">
          <span class="stat-value">${stats?.in_progress || 0}</span>
          <span class="stat-label">In Progress</span>
        </div>
        <div class="stat-card stat-completed" onclick="filterJobs('completed')">
          <span class="stat-value">${stats?.completed || 0}</span>
          <span class="stat-label">Completed</span>
        </div>
      </div>
      
      <div class="jobs-grid" id="jobs-grid">
        ${jobs.results?.map((job: any) => `
          <div class="job-card">
            <div class="job-header">
              <span class="badge badge-${job.status}">${job.status?.replace('_', ' ')}</span>
              ${job.scheduled_date ? `<span class="job-date">📅 ${new Date(job.scheduled_date).toLocaleDateString()}</span>` : ''}
            </div>
            <h3 class="job-title">${job.title || job.service_type || 'Untitled Job'}</h3>
            <p class="job-customer">
              👤 ${job.customer_name}<br>
              ${job.customer_phone ? `📱 ${job.customer_phone}<br>` : ''}
              ${job.address ? `📍 ${job.address}` : ''}
            </p>
            ${job.description ? `<p class="job-desc">${job.description}</p>` : ''}
            ${job.notes ? `<p class="job-notes">📝 ${job.notes}</p>` : ''}
            <div class="job-actions">
              <button onclick="viewJob(${job.id})">View Details</button>
              ${job.status === 'pending' ? `<button onclick="updateStatus(${job.id}, 'confirmed')">✓ Confirm</button>` : ''}
              ${job.status === 'confirmed' ? `<button onclick="updateStatus(${job.id}, 'in_progress')">🔨 Start</button>` : ''}
              ${job.status === 'in_progress' ? `<button onclick="updateStatus(${job.id}, 'completed')">✅ Complete</button>` : ''}
            </div>
          </div>
        `).join('') || '<div class="empty">No jobs found</div>'}
      </div>
    </div>
    
    <!-- Job Detail Modal -->
    <div class="modal-overlay" id="job-modal">
      <div class="modal" style="max-width: 700px;">
        <div class="modal-header">
          <h2 id="modal-title">Job Details</h2>
          <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div id="job-detail-content"></div>
      </div>
    </div>
    
    <style>
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
      .header-actions select { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 6px; }
      
      .stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
      .stat-card { background: white; padding: 1rem 1.5rem; border-radius: 8px; text-align: center; flex: 1; min-width: 100px; cursor: pointer; transition: transform 0.2s; }
      .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #8B4513; display: block; }
      .stat-label { font-size: 0.8rem; color: #666; text-transform: uppercase; }
      .stat-pending { border-left: 3px solid #fbbf24; }
      .stat-confirmed { border-left: 3px solid #3b82f6; }
      .stat-progress { border-left: 3px solid #8b5cf6; }
      .stat-completed { border-left: 3px solid #10b981; }
      
      .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
      
      .job-card { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
      .job-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
      .job-date { font-size: 0.85rem; color: #666; }
      .job-title { margin: 0 0 0.75rem; color: #333; font-size: 1.1rem; }
      .job-customer { color: #666; font-size: 0.9rem; line-height: 1.6; margin-bottom: 0.75rem; }
      .job-desc { color: #888; font-size: 0.85rem; margin-bottom: 0.75rem; }
      .job-notes { background: #fff8dc; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; color: #8B4513; }
      .job-actions { display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; }
      .job-actions button { flex: 1; padding: 0.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; background: #f3f4f6; }
      .job-actions button:hover { background: #e5e7eb; }
      
      .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
      .badge-pending { background: #fef3c7; color: #92400e; }
      .badge-confirmed { background: #dbeafe; color: #1e40af; }
      .badge-in_progress { background: #ede9fe; color: #6b21a8; }
      .badge-completed { background: #d1fae5; color: #065f46; }
      
      .empty { grid-column: 1/-1; text-align: center; padding: 3rem; color: #666; background: white; border-radius: 12px; }
      
      .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; z-index: 1000; }
      .modal-overlay.active { display: flex; }
      .modal { background: white; border-radius: 12px; width: 100%; max-height: 90vh; overflow-y: auto; }
      .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #eee; }
      .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
      
      .detail-section { padding: 1.5rem; }
      .detail-row { display: grid; grid-template-columns: 120px 1fr; gap: 1rem; margin-bottom: 0.75rem; }
      .detail-label { font-weight: 600; color: #666; }
      .detail-value { color: #333; }
      
      .notes-list { margin-top: 1.5rem; }
      .note-item { background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; }
      .note-meta { font-size: 0.8rem; color: #999; margin-bottom: 0.5rem; }
      
      .add-note-form { margin-top: 1rem; display: flex; gap: 0.5rem; }
      .add-note-form textarea { flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; resize: none; }
      .add-note-form button { padding: 0.75rem 1.5rem; background: #8B4513; color: white; border: none; border-radius: 6px; cursor: pointer; }
    </style>
    
    <script>
      function filterJobs(status) {
        const url = new URL(window.location);
        if (status) {
          url.searchParams.set('status', status);
        } else {
          url.searchParams.delete('status');
        }
        window.location = url;
      }
      
      async function updateStatus(id, newStatus) {
        const res = await fetch('/api/admin/bookings/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) {
          location.reload();
        } else {
          alert('Failed to update status');
        }
      }
      
      async function viewJob(id) {
        const res = await fetch('/api/admin/bookings/' + id);
        const job = await res.json();
        
        const notesRes = await fetch('/api/admin/bookings/' + id + '/notes');
        const notes = await notesRes.json();
        
        document.getElementById('modal-title').textContent = job.title || 'Job Details';
        document.getElementById('job-detail-content').innerHTML = \`
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value"><span class="badge badge-\${job.status}">\${job.status?.replace('_', ' ')}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Customer:</span>
              <span class="detail-value">\${job.customer_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">\${job.service_type || '-'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scheduled:</span>
              <span class="detail-value">\${job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Not scheduled'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">\${job.description || '-'}</span>
            </div>
            
            <div class="notes-list">
              <h4>Job Notes</h4>
              \${notes.results?.map(n => \`
                <div class="note-item">
                  <div class="note-meta">\${n.admin_name || 'Admin'} • \${new Date(n.created_at * 1000).toLocaleString()}</div>
                  <div>\${n.content}</div>
                </div>
              \`).join('') || '<p style="color:#666">No notes yet</p>'}
              
              <div class="add-note-form">
                <textarea id="new-note" placeholder="Add a note..." rows="2"></textarea>
                <button onclick="addNote(\${id})">Add</button>
              </div>
            </div>
          </div>
        \`;
        
        document.getElementById('job-modal').classList.add('active');
      }
      
      function closeModal() {
        document.getElementById('job-modal').classList.remove('active');
      }
      
      async function addNote(jobId) {
        const content = document.getElementById('new-note').value.trim();
        if (!content) return;
        
        await fetch('/api/admin/bookings/' + jobId + '/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        
        viewJob(jobId); // Refresh
      }
    </script>
  `;
  
  return c.html(adminLayout('Jobs', content, 'jobs', admin));
};
