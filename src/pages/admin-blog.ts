import { Context } from 'hono';
import { adminLayout } from './admin';

export async function adminBlogPage(c: Context) {
  const admin = c.get('admin');
  
  // Get all blog posts
  const posts = await c.env.DB.prepare(`
    SELECT * FROM blog_posts ORDER BY created_at DESC
  `).all<any>();
  
  const content = `
    <main class="container" style="padding: 40px 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h1>📝 Blog Management</h1>
        <div style="display: flex; gap: 15px;">
          <a href="/admin" class="btn btn-secondary">← Back to Admin</a>
          <button onclick="openNewPostModal()" class="btn">+ New Post</button>
        </div>
      </div>
      
      <!-- AI Generation Section -->
      <div class="card" style="margin-bottom: 30px; background: linear-gradient(135deg, #2C1810 0%, #3d2317 100%); color: #FFF8DC;">
        <h2 style="margin-bottom: 20px;">🤖 AI Blog Generator</h2>
        <form id="ai-generate-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Topic</label>
              <select id="ai-topic" name="topic" style="width: 100%; padding: 10px; border-radius: 8px; border: none;">
                <option value="flooring">Flooring Tips & Care</option>
                <option value="deck">Deck Maintenance</option>
                <option value="bathroom">Bathroom Renovations</option>
                <option value="kitchen">Kitchen Updates</option>
                <option value="seasonal">Seasonal Home Prep</option>
                <option value="diy">DIY vs Professional</option>
                <option value="local">Broken Bow / Hochatown Guide</option>
                <option value="cabin">Cabin Maintenance</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Style</label>
              <select id="ai-style" name="style" style="width: 100%; padding: 10px; border-radius: 8px; border: none;">
                <option value="educational">Educational How-To</option>
                <option value="listicle">Top X List</option>
                <option value="story">Customer Story</option>
                <option value="guide">Complete Guide</option>
                <option value="comparison">Comparison/Review</option>
              </select>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Custom Prompt (optional)</label>
            <input type="text" id="ai-prompt" placeholder="e.g., Write about preparing your deck for summer BBQ season" 
                   style="width: 100%; padding: 10px; border-radius: 8px; border: none;">
          </div>
          <button type="submit" class="btn" style="background: #FFD700; color: #2C1810;">
            ✨ Generate Blog Post
          </button>
        </form>
        <div id="ai-status" style="margin-top: 15px;"></div>
      </div>
      
      <!-- Blog Posts List -->
      <div class="card">
        <h2 style="margin-bottom: 20px;">All Posts (${posts.results?.length || 0})</h2>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button onclick="filterPosts('all')" class="btn btn-secondary filter-btn active" data-filter="all">All</button>
          <button onclick="filterPosts('published')" class="btn btn-secondary filter-btn" data-filter="published">Published</button>
          <button onclick="filterPosts('draft')" class="btn btn-secondary filter-btn" data-filter="draft">Drafts</button>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #eee;">
              <th style="text-align: left; padding: 12px 8px;">Title</th>
              <th style="text-align: left; padding: 12px 8px;">Category</th>
              <th style="text-align: left; padding: 12px 8px;">Status</th>
              <th style="text-align: left; padding: 12px 8px;">Created</th>
              <th style="text-align: right; padding: 12px 8px;">Actions</th>
            </tr>
          </thead>
          <tbody id="posts-table">
            ${posts.results?.length ? posts.results.map((post: any) => `
              <tr class="post-row" data-status="${post.status}" style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 8px;">
                  <a href="/blog/${post.slug}" target="_blank" style="color: #8B4513; font-weight: 600;">${post.title}</a>
                </td>
                <td style="padding: 12px 8px;">${post.category || '-'}</td>
                <td style="padding: 12px 8px;">
                  <span style="
                    padding: 4px 12px; 
                    border-radius: 20px; 
                    font-size: 0.85em;
                    background: ${post.status === 'published' ? '#d4edda' : '#fff3cd'};
                    color: ${post.status === 'published' ? '#155724' : '#856404'};
                  ">${post.status}</span>
                </td>
                <td style="padding: 12px 8px; color: #666;">${new Date(post.created_at).toLocaleDateString()}</td>
                <td style="padding: 12px 8px; text-align: right;">
                  <button onclick="editPost(${post.id})" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85em;">Edit</button>
                  ${post.status === 'draft' ? `
                    <button onclick="publishPost(${post.id})" class="btn" style="padding: 6px 12px; font-size: 0.85em;">Publish</button>
                  ` : ''}
                  <button onclick="deletePost(${post.id})" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85em; background: #dc3545;">🗑</button>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="padding: 40px; text-align: center; color: #666;">
                  No blog posts yet. Create your first one above!
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </main>
    
    <!-- New/Edit Post Modal -->
    <div id="post-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; overflow: auto;">
      <div style="background: white; max-width: 900px; margin: 40px auto; border-radius: 12px; padding: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 id="modal-title">New Blog Post</h2>
          <button onclick="closeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
        
        <form id="post-form">
          <input type="hidden" id="post-id" name="id">
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Title *</label>
            <input type="text" id="post-title" name="title" required
                   style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 1.1em;">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Slug</label>
              <input type="text" id="post-slug" name="slug" placeholder="auto-generated-from-title"
                     style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Category</label>
              <select id="post-category" name="category" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                <option value="tips">Tips & How-To</option>
                <option value="projects">Project Showcase</option>
                <option value="local">Local Guide</option>
                <option value="seasonal">Seasonal</option>
                <option value="news">News & Updates</option>
              </select>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Excerpt</label>
            <textarea id="post-excerpt" name="excerpt" rows="2" placeholder="Brief summary for previews and SEO..."
                      style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;"></textarea>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Content *</label>
            <textarea id="post-content" name="content" rows="15" required
                      style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-family: monospace;"></textarea>
            <p style="color: #666; font-size: 0.85em; margin-top: 8px;">Supports Markdown formatting</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Featured Image</label>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <button type="button" onclick="openGalleryPicker()" class="btn btn-secondary" style="flex: 1;">
                🖼️ Pick from Gallery
              </button>
              <button type="button" onclick="openVisualizerModal()" class="btn btn-secondary" style="flex: 1;">
                ✨ Generate with AI
              </button>
            </div>
            <input type="text" id="post-image" name="featured_image" placeholder="Or paste image URL..."
                   style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
            <div id="image-preview" style="margin-top: 10px; display: none;">
              <img id="preview-img" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Tags</label>
            <input type="text" id="post-tags" name="tags" placeholder="flooring, tips, maintenance"
                   style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Meta Title (SEO)</label>
              <input type="text" id="post-meta-title" name="meta_title" placeholder="Custom title for search engines"
                     style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Meta Description (SEO)</label>
              <input type="text" id="post-meta-desc" name="meta_description" placeholder="Custom description for search engines"
                     style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
          </div>
          
          <div style="display: flex; gap: 15px; justify-content: flex-end;">
            <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
            <button type="submit" name="action" value="draft" class="btn btn-secondary">Save as Draft</button>
            <button type="submit" name="action" value="publish" class="btn">Publish</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Gallery Picker Modal -->
    <div id="gallery-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1001; overflow: auto;">
      <div style="background: white; max-width: 900px; margin: 40px auto; border-radius: 12px; padding: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2>🖼️ Select from Gallery</h2>
          <button onclick="closeGalleryModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
        
        <div id="gallery-categories" style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;"></div>
        
        <div id="gallery-images" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto;">
          <p style="color: #666; grid-column: 1/-1; text-align: center;">Loading gallery...</p>
        </div>
      </div>
    </div>
    
    <!-- AI Visualizer Modal -->
    <div id="visualizer-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1001; overflow: auto;">
      <div style="background: white; max-width: 700px; margin: 40px auto; border-radius: 12px; padding: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2>✨ AI Image Generator</h2>
          <button onclick="closeVisualizerModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
        
        <form id="visualizer-form">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Describe the image you want</label>
            <textarea id="viz-prompt" rows="3" placeholder="e.g., A beautiful hardwood floor installation in a modern cabin living room, warm lighting, professional finish"
                      style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd;"></textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Style</label>
              <select id="viz-style" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                <option value="photo">Photorealistic</option>
                <option value="professional">Professional/Stock</option>
                <option value="warm">Warm & Cozy</option>
                <option value="modern">Modern & Clean</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Subject</label>
              <select id="viz-subject" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                <option value="interior">Interior/Room</option>
                <option value="exterior">Exterior/Outdoor</option>
                <option value="detail">Detail/Close-up</option>
                <option value="before-after">Before/After</option>
              </select>
            </div>
          </div>
          
          <button type="submit" class="btn" style="width: 100%;">🎨 Generate Image</button>
        </form>
        
        <div id="viz-status" style="margin-top: 15px;"></div>
        
        <div id="viz-result" style="display: none; margin-top: 20px; text-align: center;">
          <img id="viz-result-img" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 15px;">
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="useGeneratedImage()" class="btn">Use This Image</button>
            <button onclick="regenerateImage()" class="btn btn-secondary">Try Again</button>
          </div>
        </div>
      </div>
    </div>
    
    <script>
      const API_BASE = '/api/admin';
      
      // Filter posts
      function filterPosts(status) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(\`[data-filter="\${status}"]\`).classList.add('active');
        
        document.querySelectorAll('.post-row').forEach(row => {
          if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      }
      
      // Open modal for new post
      function openNewPostModal() {
        document.getElementById('modal-title').textContent = 'New Blog Post';
        document.getElementById('post-form').reset();
        document.getElementById('post-id').value = '';
        document.getElementById('post-modal').style.display = 'block';
      }
      
      // Close modal
      function closeModal() {
        document.getElementById('post-modal').style.display = 'none';
      }
      
      // Edit post
      async function editPost(id) {
        try {
          const res = await fetch(\`\${API_BASE}/blog/\${id}\`, {
            headers: { 'Authorization': 'Bearer ' + getApiKey() }
          });
          const post = await res.json();
          
          document.getElementById('modal-title').textContent = 'Edit Blog Post';
          document.getElementById('post-id').value = post.id;
          document.getElementById('post-title').value = post.title || '';
          document.getElementById('post-slug').value = post.slug || '';
          document.getElementById('post-category').value = post.category || 'tips';
          document.getElementById('post-excerpt').value = post.excerpt || '';
          document.getElementById('post-content').value = post.content || '';
          document.getElementById('post-image').value = post.featured_image || '';
          document.getElementById('post-tags').value = post.tags || '';
          document.getElementById('post-meta-title').value = post.meta_title || '';
          document.getElementById('post-meta-desc').value = post.meta_description || '';
          
          document.getElementById('post-modal').style.display = 'block';
        } catch (err) {
          alert('Error loading post: ' + err.message);
        }
      }
      
      // Publish post
      async function publishPost(id) {
        if (!confirm('Publish this post?')) return;
        
        try {
          await fetch(\`\${API_BASE}/blog/\${id}\`, {
            method: 'PATCH',
            headers: {
              'Authorization': 'Bearer ' + getApiKey(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'published' })
          });
          location.reload();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
      
      // Delete post
      async function deletePost(id) {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        
        try {
          await fetch(\`\${API_BASE}/blog/\${id}\`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + getApiKey() }
          });
          location.reload();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
      
      // Submit post form
      document.getElementById('post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = document.getElementById('post-id').value;
        const action = e.submitter?.value || 'draft';
        
        const data = {
          title: document.getElementById('post-title').value,
          slug: document.getElementById('post-slug').value || undefined,
          category: document.getElementById('post-category').value,
          excerpt: document.getElementById('post-excerpt').value || undefined,
          content: document.getElementById('post-content').value,
          featured_image: document.getElementById('post-image').value || undefined,
          tags: document.getElementById('post-tags').value || undefined,
          meta_title: document.getElementById('post-meta-title').value || undefined,
          meta_description: document.getElementById('post-meta-desc').value || undefined,
          status: action === 'publish' ? 'published' : 'draft'
        };
        
        try {
          const method = id ? 'PATCH' : 'POST';
          const url = id ? \`\${API_BASE}/blog/\${id}\` : \`\${API_BASE}/blog\`;
          
          const res = await fetch(url, {
            method,
            headers: {
              'Authorization': 'Bearer ' + getApiKey(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          if (!res.ok) throw new Error(await res.text());
          
          closeModal();
          location.reload();
        } catch (err) {
          alert('Error saving: ' + err.message);
        }
      });
      
      // AI Generate
      document.getElementById('ai-generate-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('ai-status');
        statusEl.innerHTML = '<p style="color: #FFD700;">🔄 Generating blog post with AI...</p>';
        
        const topic = document.getElementById('ai-topic').value;
        const style = document.getElementById('ai-style').value;
        const customPrompt = document.getElementById('ai-prompt').value;
        
        try {
          const res = await fetch(\`\${API_BASE}/blog/generate\`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + getApiKey(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic, style, prompt: customPrompt })
          });
          
          if (!res.ok) throw new Error(await res.text());
          
          const result = await res.json();
          statusEl.innerHTML = '<p style="color: #90EE90;">✅ Generated! Opening editor...</p>';
          
          // Open in edit modal
          setTimeout(() => {
            document.getElementById('modal-title').textContent = 'Review Generated Post';
            document.getElementById('post-id').value = '';
            document.getElementById('post-title').value = result.title || '';
            document.getElementById('post-slug').value = result.slug || '';
            document.getElementById('post-category').value = result.category || 'tips';
            document.getElementById('post-excerpt').value = result.excerpt || '';
            document.getElementById('post-content').value = result.content || '';
            document.getElementById('post-tags').value = result.tags || '';
            document.getElementById('post-modal').style.display = 'block';
            statusEl.innerHTML = '';
          }, 500);
        } catch (err) {
          statusEl.innerHTML = \`<p style="color: #ff6b6b;">❌ Error: \${err.message}</p>\`;
        }
      });
      
      // Auto-generate slug from title
      document.getElementById('post-title').addEventListener('blur', function() {
        const slugField = document.getElementById('post-slug');
        if (!slugField.value && this.value) {
          slugField.value = this.value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }
      });
      
      function getApiKey() {
        return document.cookie.split('; ').find(c => c.startsWith('admin_token='))?.split('=')[1] || '';
      }
      
      // ============ GALLERY PICKER ============
      let galleryImages = [];
      
      async function openGalleryPicker() {
        document.getElementById('gallery-modal').style.display = 'block';
        await loadGalleryImages();
      }
      
      function closeGalleryModal() {
        document.getElementById('gallery-modal').style.display = 'none';
      }
      
      async function loadGalleryImages(categoryId = null) {
        const imagesEl = document.getElementById('gallery-images');
        const categoriesEl = document.getElementById('gallery-categories');
        
        try {
          // Load categories
          const catRes = await fetch('/api/portfolio/categories');
          const categories = await catRes.json();
          
          categoriesEl.innerHTML = \`
            <button onclick="loadGalleryImages()" class="btn btn-secondary \${!categoryId ? 'active' : ''}" style="padding: 6px 12px;">All</button>
            \${categories.map(cat => \`
              <button onclick="loadGalleryImages(\${cat.id})" class="btn btn-secondary \${categoryId === cat.id ? 'active' : ''}" style="padding: 6px 12px;">\${cat.name}</button>
            \`).join('')}
          \`;
          
          // Load images
          const imgRes = await fetch('/api/portfolio/manifest');
          const manifest = await imgRes.json();
          galleryImages = manifest.images || [];
          
          // Filter by category if specified
          let filtered = galleryImages;
          if (categoryId) {
            filtered = galleryImages.filter(img => img.category_id === categoryId);
          }
          
          if (filtered.length === 0) {
            imagesEl.innerHTML = '<p style="color: #666; grid-column: 1/-1; text-align: center;">No images found</p>';
            return;
          }
          
          imagesEl.innerHTML = filtered.map(img => \`
            <div onclick="selectGalleryImage('\${img.url}')" style="cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid transparent; transition: all 0.2s;" 
                 onmouseover="this.style.borderColor='#8B4513'" onmouseout="this.style.borderColor='transparent'">
              <img src="\${img.url}" alt="\${img.title || ''}" style="width: 100%; height: 120px; object-fit: cover;">
              <p style="padding: 5px; font-size: 0.8em; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${img.title || 'Untitled'}</p>
            </div>
          \`).join('');
        } catch (err) {
          imagesEl.innerHTML = '<p style="color: #ff6b6b; grid-column: 1/-1; text-align: center;">Error loading gallery</p>';
        }
      }
      
      function selectGalleryImage(url) {
        document.getElementById('post-image').value = url;
        showImagePreview(url);
        closeGalleryModal();
      }
      
      // ============ AI VISUALIZER ============
      let lastGeneratedImageUrl = '';
      
      function openVisualizerModal() {
        document.getElementById('visualizer-modal').style.display = 'block';
        document.getElementById('viz-result').style.display = 'none';
        document.getElementById('viz-status').innerHTML = '';
      }
      
      function closeVisualizerModal() {
        document.getElementById('visualizer-modal').style.display = 'none';
      }
      
      document.getElementById('visualizer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await generateVisualizerImage();
      });
      
      async function generateVisualizerImage() {
        const statusEl = document.getElementById('viz-status');
        const resultEl = document.getElementById('viz-result');
        
        const prompt = document.getElementById('viz-prompt').value;
        const style = document.getElementById('viz-style').value;
        const subject = document.getElementById('viz-subject').value;
        
        if (!prompt.trim()) {
          statusEl.innerHTML = '<p style="color: #ff6b6b;">Please describe the image you want</p>';
          return;
        }
        
        statusEl.innerHTML = '<p style="color: #8B4513;">🎨 Generating image... This may take 15-30 seconds...</p>';
        resultEl.style.display = 'none';
        
        // Build enhanced prompt
        const stylePrompts = {
          'photo': 'photorealistic, high quality photograph',
          'professional': 'professional stock photography, commercial quality',
          'warm': 'warm cozy atmosphere, soft lighting, inviting',
          'modern': 'modern clean aesthetic, minimalist, contemporary'
        };
        
        const subjectPrompts = {
          'interior': 'interior room shot, home improvement',
          'exterior': 'exterior outdoor shot, curb appeal',
          'detail': 'close-up detail shot, craftsmanship focus',
          'before-after': 'renovation transformation, dramatic improvement'
        };
        
        const enhancedPrompt = \`\${prompt}. \${stylePrompts[style] || ''}. \${subjectPrompts[subject] || ''}. Southeast Oklahoma cabin style, professional handyman work.\`;
        
        try {
          const res = await fetch('/api/visualize/generate', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + getApiKey(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              prompt: enhancedPrompt,
              admin: true // Skip customer_id requirement
            })
          });
          
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Generation failed');
          }
          
          const result = await res.json();
          lastGeneratedImageUrl = result.result_url || result.url;
          
          statusEl.innerHTML = '<p style="color: #90EE90;">✅ Image generated!</p>';
          document.getElementById('viz-result-img').src = lastGeneratedImageUrl;
          resultEl.style.display = 'block';
        } catch (err) {
          statusEl.innerHTML = \`<p style="color: #ff6b6b;">❌ Error: \${err.message}</p>\`;
        }
      }
      
      function useGeneratedImage() {
        if (lastGeneratedImageUrl) {
          document.getElementById('post-image').value = lastGeneratedImageUrl;
          showImagePreview(lastGeneratedImageUrl);
          closeVisualizerModal();
        }
      }
      
      function regenerateImage() {
        document.getElementById('viz-result').style.display = 'none';
        generateVisualizerImage();
      }
      
      // ============ IMAGE PREVIEW ============
      function showImagePreview(url) {
        const previewEl = document.getElementById('image-preview');
        const imgEl = document.getElementById('preview-img');
        if (url) {
          imgEl.src = url;
          previewEl.style.display = 'block';
        } else {
          previewEl.style.display = 'none';
        }
      }
      
      // Update preview when URL changes
      document.getElementById('post-image').addEventListener('change', function() {
        showImagePreview(this.value);
      });
      
      document.getElementById('post-image').addEventListener('input', function() {
        if (this.value && this.value.startsWith('http')) {
          showImagePreview(this.value);
        }
      });
    </script>
  `;
  
  return c.html(adminLayout('Blog Management', content, 'blog'));
}

// Single blog post detail/edit page
export async function adminBlogDetail(c: Context) {
  const id = c.req.param('id');
  const post = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first<any>();
  
  if (!post) {
    return c.redirect('/admin/blog');
  }
  
  // Redirect to the main page with edit modal - simpler UX
  return c.redirect(`/admin/blog?edit=${id}`);
}
