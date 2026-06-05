import { Context } from 'hono';
import { adminLayout } from './admin';

export const adminJobMediaPage = async (c: Context) => {
  const db = c.env.DB;

  // Get all jobs with customer info for the selector
  const jobs = await db.prepare(`
    SELECT b.id, b.title, b.scheduled_date, b.status, c.name as customer_name, c.email as customer_email
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    ORDER BY b.scheduled_date DESC, b.created_at DESC
    LIMIT 200
  `).all<any>();

  // Get recent job media with join info
  const media = await db.prepare(`
    SELECT m.*, b.title as job_title, c.name as customer_name, c.email as customer_email
    FROM job_media m
    LEFT JOIN bookings b ON m.booking_id = b.id
    LEFT JOIN customers c ON m.customer_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all<any>();

  const content = `
    <div style="padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 700; color: #2C1810;">📷 Job Photos & Videos</h1>
          <p style="color: #666; margin-top: 0.25rem;">Upload and manage job media visible to clients in their portal</p>
        </div>
        <button onclick="document.getElementById('upload-panel').scrollIntoView({behavior:'smooth'})"
          style="background:#8B4513;color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;cursor:pointer;font-weight:600;">
          + Upload Media
        </button>
      </div>

      <!-- Upload Panel -->
      <div id="upload-panel" style="background:white;border-radius:12px;padding:2rem;margin-bottom:2rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <h2 style="margin-bottom:1.5rem;font-size:1.25rem;color:#2C1810;">Upload Photos / Videos</h2>

        <form id="upload-form" enctype="multipart/form-data">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem;">

            <div style="grid-column:1/-1;">
              <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#333;">Attach to Job</label>
              <select name="booking_id" id="booking-select"
                style="width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;"
                onchange="onJobSelect(this)">
                <option value="">— Select a job (optional) —</option>
                ${jobs.results?.map((j: any) => `
                  <option value="${j.id}" data-email="${j.customer_email}" data-customer="${j.customer_name}">
                    #${j.id} · ${j.customer_name} · ${j.title || j.status} ${j.scheduled_date ? '· ' + new Date(j.scheduled_date).toLocaleDateString() : ''}
                  </option>
                `).join('') || ''}
              </select>
              <p id="customer-hint" style="font-size:0.8rem;color:#888;margin-top:0.3rem;"></p>
            </div>

            <div>
              <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#333;">Title</label>
              <input type="text" name="title" placeholder="e.g. Deck build – Day 1"
                style="width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:8px;">
            </div>

            <div>
              <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#333;">Date Taken</label>
              <input type="date" name="taken_at"
                style="width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:8px;">
            </div>

            <div style="grid-column:1/-1;">
              <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#333;">Description (shown to client)</label>
              <textarea name="description" rows="2" placeholder="Brief note about the work shown..."
                style="width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:8px;resize:vertical;"></textarea>
            </div>

            <div style="grid-column:1/-1;">
              <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#333;">Files (images or videos)</label>
              <div id="drop-zone"
                style="border:2px dashed #ccc;border-radius:8px;padding:2.5rem;text-align:center;cursor:pointer;transition:border-color 0.2s;"
                onclick="document.getElementById('file-input').click()"
                ondragover="event.preventDefault();this.style.borderColor='#8B4513'"
                ondragleave="this.style.borderColor='#ccc'"
                ondrop="handleDrop(event)">
                <div style="font-size:2.5rem;margin-bottom:0.5rem;">📁</div>
                <p style="color:#555;">Drag &amp; drop files here or <strong>click to browse</strong></p>
                <p style="color:#999;font-size:0.85rem;margin-top:0.25rem;">JPG, PNG, GIF, MP4, MOV — multiple files OK</p>
              </div>
              <input type="file" id="file-input" name="file" multiple accept="image/*,video/*"
                style="display:none;" onchange="previewFiles(this.files)">
              <div id="file-preview" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;"></div>
            </div>

            <div>
              <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                <input type="checkbox" name="visible_to_client" value="true" checked
                  style="width:16px;height:16px;">
                <span style="font-weight:600;color:#333;">Visible to client in portal</span>
              </label>
            </div>
          </div>

          <button type="submit"
            style="background:#8B4513;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;cursor:pointer;font-weight:600;font-size:1rem;">
            Upload Files
          </button>
          <span id="upload-status" style="margin-left:1rem;color:#666;font-size:0.9rem;"></span>
        </form>
      </div>

      <!-- Media Grid -->
      <div style="background:white;border-radius:12px;padding:2rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
          <h2 style="font-size:1.25rem;color:#2C1810;">Recent Media (${media.results?.length || 0})</h2>
          <div style="display:flex;gap:0.5rem;">
            <input type="text" id="search-media" placeholder="Search by client or job..."
              oninput="filterMedia(this.value)"
              style="padding:0.5rem 0.75rem;border:1px solid #ddd;border-radius:6px;width:220px;">
          </div>
        </div>

        <div id="media-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;">
          ${media.results?.map((m: any) => `
            <div class="media-card" data-search="${(m.customer_name || '').toLowerCase()} ${(m.job_title || '').toLowerCase()}"
              style="border:1px solid #eee;border-radius:10px;overflow:hidden;position:relative;">
              ${m.media_type === 'video'
                ? `<video src="${m.url}" style="width:100%;height:160px;object-fit:cover;background:#000;" controls></video>`
                : `<img src="${m.url}" alt="${m.title || ''}" style="width:100%;height:160px;object-fit:cover;background:#f0f0f0;"
                    onerror="this.style.background='#eee';this.alt='Preview unavailable'">`
              }
              <div style="padding:0.75rem;">
                <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.title || 'Untitled'}</div>
                ${m.customer_name ? `<div style="font-size:0.8rem;color:#8B4513;margin-top:0.2rem;">👤 ${m.customer_name}</div>` : ''}
                ${m.job_title ? `<div style="font-size:0.8rem;color:#666;">🔨 ${m.job_title}</div>` : ''}
                ${m.description ? `<div style="font-size:0.8rem;color:#555;margin-top:0.4rem;">${m.description}</div>` : ''}
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;">
                  <span style="font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:4px;background:${m.visible_to_client ? '#d4edda' : '#f8d7da'};color:${m.visible_to_client ? '#155724' : '#721c24'};">
                    ${m.visible_to_client ? '👁 Visible' : '🚫 Hidden'}
                  </span>
                  <span style="font-size:0.75rem;color:#999;">${m.source === 'discord' ? '💬 Discord' : '⬆️ Admin'}</span>
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
                  <button onclick="toggleVisibility(${m.id}, ${m.visible_to_client ? 0 : 1})"
                    style="flex:1;padding:0.4rem;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:0.8rem;background:white;">
                    ${m.visible_to_client ? 'Hide' : 'Show'}
                  </button>
                  <button onclick="deleteMedia(${m.id}, this)"
                    style="padding:0.4rem 0.75rem;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;font-size:0.8rem;background:#fff5f5;color:#c00;">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          `).join('') || '<p style="color:#999;text-align:center;grid-column:1/-1;padding:3rem;">No media uploaded yet.</p>'}
        </div>
      </div>
    </div>

    <script>
      // Job selector hint
      function onJobSelect(sel) {
        const opt = sel.options[sel.selectedIndex];
        const hint = document.getElementById('customer-hint');
        if (opt.dataset.customer) {
          hint.textContent = '👤 ' + opt.dataset.customer + ' · ' + (opt.dataset.email || '');
        } else {
          hint.textContent = '';
        }
      }

      // Drag & drop
      function handleDrop(e) {
        e.preventDefault();
        document.getElementById('drop-zone').style.borderColor = '#ccc';
        const dt = e.dataTransfer;
        if (dt.files.length) previewFiles(dt.files);
        const input = document.getElementById('file-input');
        input.files = dt.files;
      }

      function previewFiles(files) {
        const preview = document.getElementById('file-preview');
        preview.innerHTML = '';
        Array.from(files).forEach(f => {
          const el = document.createElement('div');
          el.style.cssText = 'position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid #eee;';
          if (f.type.startsWith('video')) {
            el.innerHTML = '<div style="width:100%;height:100%;background:#222;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;">▶</div>';
          } else {
            const img = document.createElement('img');
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            img.src = URL.createObjectURL(f);
            el.appendChild(img);
          }
          preview.appendChild(el);
        });
        document.getElementById('drop-zone').style.display = 'none';
        preview.style.marginTop = '0.75rem';
      }

      // Upload form
      document.getElementById('upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const status = document.getElementById('upload-status');
        const files = document.getElementById('file-input').files;
        if (!files.length) { status.textContent = 'Please select at least one file.'; return; }

        status.textContent = 'Uploading...';
        let uploaded = 0, failed = 0;

        for (const file of files) {
          const fd = new FormData(form);
          fd.delete('file');
          fd.append('file', file);
          try {
            const r = await fetch('/api/job-media/upload', { method: 'POST', body: fd });
            if (r.ok) uploaded++; else failed++;
          } catch { failed++; }
        }

        status.textContent = \`✅ \${uploaded} uploaded\${failed ? ', ' + failed + ' failed' : ''}. Refreshing...\`;
        setTimeout(() => location.reload(), 1200);
      });

      // Toggle visibility
      async function toggleVisibility(id, visible) {
        await fetch('/api/job-media/' + id + '/visibility', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visible: !!visible })
        });
        location.reload();
      }

      // Delete
      async function deleteMedia(id, btn) {
        if (!confirm('Delete this photo/video? This cannot be undone.')) return;
        btn.textContent = '...';
        const r = await fetch('/api/job-media/' + id, { method: 'DELETE' });
        if (r.ok) btn.closest('.media-card').remove();
        else btn.textContent = '🗑';
      }

      // Search filter
      function filterMedia(q) {
        const lower = q.toLowerCase();
        document.querySelectorAll('.media-card').forEach(card => {
          card.style.display = card.dataset.search.includes(lower) ? '' : 'none';
        });
      }
    </script>
  `;

  return c.html(adminLayout('Job Media', content, 'job-media'));
};
