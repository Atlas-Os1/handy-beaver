import { Context } from 'hono';
import { layout } from '../lib/html';

export const visualizePage = (c: Context) => {
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">✨ AI Project Visualizer</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">See your finished project before we start</p>
    </section>
    
    <section class="container">
      <div class="grid grid-2" style="align-items: start;">
        <div class="card">
          <h2 style="color: var(--primary); font-family: 'Playfair Display', serif; margin-bottom: 1rem;">
            How It Works
          </h2>
          <ol style="padding-left: 1.25rem; color: #444; line-height: 2;">
            <li>Upload a photo of your current space</li>
            <li>Tell us what changes you're thinking about</li>
            <li>Our AI generates a visualization of the finished result</li>
            <li>Use it to refine your vision before we start work</li>
          </ol>
          
          <div style="margin-top: 2rem; padding: 1rem; background: #f9f9f9; border-radius: 8px;">
            <h4 style="color: var(--primary); margin-bottom: 0.5rem;">💡 Best For:</h4>
            <ul style="padding-left: 1.25rem; color: #666; font-size: 0.95rem;">
              <li>Deck staining color options</li>
              <li>Trim and molding additions</li>
              <li>Flooring material changes</li>
              <li>Paint color visualization</li>
              <li>Before/after comparisons</li>
            </ul>
          </div>
        </div>
        
        <div class="card">
          <div id="visualizer-app">
            <form id="visualize-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary);">
                  📸 Upload Your Photo
                </label>
                <div 
                  id="drop-zone"
                  style="
                    border: 2px dashed #ccc; 
                    border-radius: 12px; 
                    padding: 3rem 2rem; 
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    background: #fafafa;
                  "
                >
                  <div style="font-size: 3rem; margin-bottom: 0.5rem;">📷</div>
                  <p style="color: #666; margin-bottom: 0.5rem;">Drag & drop your photo here</p>
                  <p style="color: #999; font-size: 0.85rem;">or click to browse</p>
                  <input type="file" id="photo-input" accept="image/*" style="display: none;">
                </div>
                <div id="preview-container" style="display: none; margin-top: 1rem; text-align: center;">
                  <img id="photo-preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                  <button type="button" id="clear-photo" style="margin-top: 0.5rem; color: #999; background: none; border: none; cursor: pointer;">
                    ✕ Remove photo
                  </button>
                </div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary);">
                  🎨 Describe Your Vision
                </label>
                <textarea 
                  id="prompt-input"
                  rows="3"
                  placeholder="Example: Show this deck with dark walnut stain and new white railings..."
                  style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; resize: vertical;"
                ></textarea>
              </div>
              
              <div id="usage-info" style="padding: 1rem; background: var(--secondary); color: white; border-radius: 8px; text-align: center;">
                <span id="usage-text">🎁 You have <strong>3 free visualizations</strong> remaining</span>
                <p style="font-size: 0.85rem; margin-top: 0.5rem; opacity: 0.9;">
                  <a href="/portal" style="color: white;">Sign up</a> for unlimited access!
                </p>
              </div>
              
              <button 
                type="submit" 
                id="visualize-btn"
                class="btn btn-primary" 
                style="width: 100%;"
              >
                ✨ Generate Visualization
              </button>
            </form>
            
            <div id="result-container" style="display: none; margin-top: 2rem;">
              <h3 style="color: var(--primary); margin-bottom: 1rem;">Your Visualization</h3>
              <div id="result-image" style="background: #f9f9f9; border-radius: 8px; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                <p style="color: #999;">Generating...</p>
              </div>
              <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                <button type="button" id="download-btn" class="btn btn-secondary" style="flex: 1;">
                  📥 Download
                </button>
                <button type="button" id="new-btn" class="btn btn-primary" style="flex: 1;">
                  🔄 New Visualization
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Examples Section -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Example Transformations</h2>
      <p class="section-subtitle">See what's possible with AI visualization</p>
      
      <div class="grid grid-3">
        <div class="card" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏡</div>
          <h3 style="color: var(--primary);">Deck Staining</h3>
          <p style="color: #666; font-size: 0.9rem;">
            "Show this weathered deck with a rich mahogany stain"
          </p>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🪵</div>
          <h3 style="color: var(--primary);">Crown Molding</h3>
          <p style="color: #666; font-size: 0.9rem;">
            "Add 4-inch crown molding where the wall meets the ceiling"
          </p>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏠</div>
          <h3 style="color: var(--primary);">Flooring</h3>
          <p style="color: #666; font-size: 0.9rem;">
            "Replace carpet with light oak hardwood flooring"
          </p>
        </div>
      </div>
    </section>
    
    <!-- CTA -->
    <section class="container" style="margin-top: 4rem; text-align: center;">
      <div class="card" style="display: inline-block; padding: 2rem 3rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">Like What You See?</h3>
        <p style="color: #666; margin-bottom: 1.5rem;">Let's make it real! Get a free quote for your project.</p>
        <a href="/contact" class="btn btn-primary">Request Free Quote →</a>
      </div>
    </section>
    
    <script>
      // Usage tracking
      const MAX_FREE_USES = 3;
      let usageCount = parseInt(localStorage.getItem('visualizerUsage') || '0');
      const isCustomer = localStorage.getItem('customerToken');
      
      function updateUsageDisplay() {
        const remaining = MAX_FREE_USES - usageCount;
        const usageText = document.getElementById('usage-text');
        const usageInfo = document.getElementById('usage-info');
        
        if (isCustomer) {
          usageInfo.style.background = 'var(--primary)';
          usageText.innerHTML = '✓ <strong>Unlimited access</strong> as a customer';
        } else if (remaining <= 0) {
          usageInfo.style.background = '#dc3545';
          usageText.innerHTML = '⚠️ <strong>Free uses exhausted</strong>';
          document.getElementById('visualize-btn').disabled = true;
          document.getElementById('visualize-btn').textContent = 'Sign up for more';
        } else {
          usageText.innerHTML = \`🎁 You have <strong>\${remaining} free visualization\${remaining === 1 ? '' : 's'}</strong> remaining\`;
        }
      }
      
      updateUsageDisplay();
      
      // File upload handling
      const dropZone = document.getElementById('drop-zone');
      const photoInput = document.getElementById('photo-input');
      const previewContainer = document.getElementById('preview-container');
      const photoPreview = document.getElementById('photo-preview');
      const clearPhoto = document.getElementById('clear-photo');
      
      dropZone.addEventListener('click', () => photoInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.background = '#fff';
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
        dropZone.style.background = '#fafafa';
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        if (e.dataTransfer.files.length) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
      
      photoInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          handleFile(e.target.files[0]);
        }
      });
      
      clearPhoto.addEventListener('click', () => {
        photoInput.value = '';
        previewContainer.style.display = 'none';
        dropZone.style.display = 'block';
      });
      
      function handleFile(file) {
        if (!file.type.startsWith('image/')) {
          alert('Please upload an image file');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.src = e.target.result;
          previewContainer.style.display = 'block';
          dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
      
      // Form submission
      document.getElementById('visualize-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isCustomer && usageCount >= MAX_FREE_USES) {
          window.location.href = '/portal';
          return;
        }
        
        const prompt = document.getElementById('prompt-input').value;
        if (!photoPreview.src || !prompt) {
          alert('Please upload a photo and describe your vision');
          return;
        }
        
        const btn = document.getElementById('visualize-btn');
        btn.disabled = true;
        btn.textContent = '⏳ Generating...';
        
        // TODO: Call /api/images/visualize
        // For now, simulate
        setTimeout(() => {
          usageCount++;
          localStorage.setItem('visualizerUsage', usageCount);
          updateUsageDisplay();
          
          document.getElementById('result-container').style.display = 'block';
          document.getElementById('result-image').innerHTML = '<p style="color: var(--primary);">AI visualization coming soon! For now, contact us for a free consultation.</p>';
          
          btn.disabled = false;
          btn.textContent = '✨ Generate Visualization';
        }, 2000);
      });
      
      document.getElementById('new-btn').addEventListener('click', () => {
        document.getElementById('result-container').style.display = 'none';
        clearPhoto.click();
        document.getElementById('prompt-input').value = '';
      });
    </script>
  `;
  
  return c.html(layout('AI Project Visualizer', content, 'visualize'));
};
