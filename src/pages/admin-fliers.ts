import { Context } from 'hono';
import { adminLayout } from './admin';

// Brand constants
const BRAND = {
  name: 'Handy Beaver',
  tagline: 'Dam Good Work, Every Time',
  phone: '+1 (555) 797-2503',  // ElevenLabs WhatsApp number
  website: 'handybeaver.co',
};

export const adminFliersPage = async (c: Context) => {
  const content = `
    <style>
      .flier-builder {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }
      @media (max-width: 1024px) {
        .flier-builder { grid-template-columns: 1fr; }
      }
      .form-section {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid var(--border);
      }
      .form-section h3 {
        margin-top: 0;
        color: var(--primary);
        border-bottom: 2px solid var(--primary);
        padding-bottom: 0.5rem;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text);
      }
      .form-group input, .form-group select, .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 1rem;
        background: var(--bg);
        color: var(--text);
      }
      .preview-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        background: #222;
        border-radius: 12px;
        overflow: hidden;
      }
      .preview-container img {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .preview-container .svg-overlay {
        position: absolute;
        width: 100%;
        height: 100%;
      }
      .template-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .template-option {
        padding: 0.75rem;
        border: 2px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
      }
      .template-option:hover, .template-option.selected {
        border-color: var(--primary);
        background: rgba(139, 69, 19, 0.1);
      }
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        padding: 0.5rem;
        background: var(--bg);
        border-radius: 8px;
      }
      .gallery-item {
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;
      }
      .gallery-item:hover, .gallery-item.selected {
        border-color: var(--primary);
        transform: scale(1.05);
      }
      .gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .btn-row {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
      }
      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary {
        background: var(--primary);
        color: white;
      }
      .btn-primary:hover {
        background: var(--primary-dark);
      }
      .btn-secondary {
        background: var(--secondary);
        color: white;
      }
      .btn-success {
        background: #28a745;
        color: white;
      }
      .suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .suggestion-chip {
        padding: 0.25rem 0.75rem;
        background: rgba(139, 69, 19, 0.1);
        border: 1px solid var(--primary);
        border-radius: 20px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .suggestion-chip:hover {
        background: var(--primary);
        color: white;
      }
      .loading {
        display: none;
        text-align: center;
        padding: 2rem;
      }
      .loading.active {
        display: block;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>

    <h1>🎨 Flier Generator</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">
      Create professional marketing fliers with guaranteed accurate text.
      Background images are AI-generated, text is always exact.
    </p>

    <div class="flier-builder">
      <!-- Left: Form -->
      <div>
        <div class="form-section">
          <h3>📝 Text Content</h3>
          
          <div class="form-group">
            <label>Headline *</label>
            <input type="text" id="headline" placeholder="Spring Deck Special" maxlength="50">
            <div class="suggestions">
              <span class="suggestion-chip" onclick="setHeadline('10% OFF Spring Deck Staining')">10% OFF Spring Deck Staining</span>
              <span class="suggestion-chip" onclick="setHeadline('FREE Estimates')">FREE Estimates</span>
              <span class="suggestion-chip" onclick="setHeadline('Beat the Summer Rush')">Beat the Summer Rush</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>Subtext</label>
            <input type="text" id="subtext" placeholder="Book before April 30th" maxlength="60">
          </div>
          
          <div class="form-group">
            <label>Call to Action</label>
            <input type="text" id="cta" placeholder="Book Your Free Quote Today!" maxlength="40">
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="includePhone" checked> Include Phone: ${BRAND.phone}
            </label>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="includeWebsite" checked> Include Website: ${BRAND.website}
            </label>
          </div>
        </div>

        <div class="form-section" style="margin-top: 1rem;">
          <h3>🎨 Template</h3>
          <div class="template-grid">
            <div class="template-option selected" onclick="selectTemplate('promo')" data-template="promo">
              <div style="font-size: 1.5rem;">💰</div>
              <div>Promo</div>
            </div>
            <div class="template-option" onclick="selectTemplate('seasonal')" data-template="seasonal">
              <div style="font-size: 1.5rem;">🌸</div>
              <div>Seasonal</div>
            </div>
            <div class="template-option" onclick="selectTemplate('service')" data-template="service">
              <div style="font-size: 1.5rem;">🔧</div>
              <div>Service</div>
            </div>
            <div class="template-option" onclick="selectTemplate('testimonial')" data-template="testimonial">
              <div style="font-size: 1.5rem;">⭐</div>
              <div>Review</div>
            </div>
          </div>
        </div>

        <div class="form-section" style="margin-top: 1rem;">
          <h3>🖼️ Background</h3>
          
          <div class="form-group">
            <label>
              <input type="radio" name="bgSource" value="generate" checked onchange="toggleBgSource()"> 
              Generate with AI
            </label>
            <input type="text" id="imagePrompt" placeholder="wooden deck in Oklahoma sunshine" style="margin-top: 0.5rem;">
          </div>
          
          <div class="form-group">
            <label>
              <input type="radio" name="bgSource" value="gallery" onchange="toggleBgSource()"> 
              Pick from Gallery
            </label>
            <div id="galleryPicker" style="display: none; margin-top: 0.5rem;">
              <select id="galleryCategory" onchange="loadGalleryImages()">
                <option value="">Select category...</option>
                <option value="Barndo">Barndo</option>
                <option value="Decking">Decking</option>
                <option value="Flooring">Flooring</option>
                <option value="Rustic-Cabin">Rustic Cabin</option>
                <option value="Tiny-Home">Tiny Home</option>
                <option value="bath-remodel">Bath Remodel</option>
              </select>
              <div id="galleryImages" class="gallery-grid" style="margin-top: 0.5rem;"></div>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" onclick="generateFlier()">🎨 Generate Flier</button>
          <button class="btn btn-secondary" onclick="updatePreview()">👁️ Preview</button>
        </div>
      </div>

      <!-- Right: Preview -->
      <div>
        <div class="form-section">
          <h3>👀 Preview</h3>
          
          <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Generating background image...</p>
          </div>
          
          <div class="preview-container" id="previewContainer">
            <img id="previewBg" src="/api/assets/portfolio/Decking/BluePineTG.png" alt="Background">
            <div class="svg-overlay" id="previewOverlay"></div>
          </div>
          
          <div class="btn-row" style="margin-top: 1rem;">
            <button class="btn btn-success" onclick="downloadFlier()" id="downloadBtn" disabled>
              ⬇️ Download Final
            </button>
            <button class="btn btn-secondary" onclick="addToQueue()" id="queueBtn" disabled>
              📋 Add to Queue
            </button>
          </div>
          
          <div id="flierResult" style="display: none; margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
            <p><strong>Background URL:</strong> <a id="bgUrl" href="#" target="_blank"></a></p>
            <p><strong>Flier ID:</strong> <span id="flierId"></span></p>
          </div>
        </div>
      </div>
    </div>

    <script>
      let currentTemplate = 'promo';
      let selectedGalleryImage = null;
      let generatedBgUrl = null;
      let flierId = null;
      
      const BRAND = {
        name: '${BRAND.name}',
        phone: '${BRAND.phone}',
        website: '${BRAND.website}',
      };

      function setHeadline(text) {
        document.getElementById('headline').value = text;
        updatePreview();
      }

      function selectTemplate(template) {
        currentTemplate = template;
        document.querySelectorAll('.template-option').forEach(el => {
          el.classList.toggle('selected', el.dataset.template === template);
        });
        updatePreview();
      }

      function toggleBgSource() {
        const isGallery = document.querySelector('input[name="bgSource"][value="gallery"]').checked;
        document.getElementById('galleryPicker').style.display = isGallery ? 'block' : 'none';
        document.getElementById('imagePrompt').style.display = isGallery ? 'none' : 'block';
      }

      async function loadGalleryImages() {
        const category = document.getElementById('galleryCategory').value;
        if (!category) return;
        
        const container = document.getElementById('galleryImages');
        container.innerHTML = '<p>Loading...</p>';
        
        try {
          const res = await fetch('/api/portfolio/r2-images?folder=' + category);
          const data = await res.json();
          
          container.innerHTML = data.images.map(img => 
            '<div class="gallery-item" onclick="selectGalleryImage(this, \\'' + img.url + '\\')">' +
            '<img src="' + img.url + '" loading="lazy">' +
            '</div>'
          ).join('');
        } catch (err) {
          container.innerHTML = '<p>Error loading images</p>';
        }
      }

      function selectGalleryImage(el, url) {
        document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        selectedGalleryImage = url;
        document.getElementById('previewBg').src = url;
        // Enable buttons when gallery image is selected
        document.getElementById('downloadBtn').disabled = false;
        document.getElementById('queueBtn').disabled = false;
        document.getElementById('queueBtn').textContent = '📋 Add to Queue';
        generatedBgUrl = url;
        console.log('Selected gallery image:', url);
        updatePreview();
      }

      function generateSvgOverlay() {
        const headline = document.getElementById('headline').value || 'Your Headline';
        const subtext = document.getElementById('subtext').value;
        const cta = document.getElementById('cta').value;
        const includePhone = document.getElementById('includePhone').checked;
        const includeWebsite = document.getElementById('includeWebsite').checked;
        
        const colors = currentTemplate === 'testimonial' 
          ? { bg: 'rgba(255,255,255,0.9)', text: '#333333', accent: '#8B4513' }
          : { bg: 'rgba(139,69,19,0.85)', text: '#FFFFFF', accent: '#F5DEB3' };

        return \`
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid slice">
  <rect x="0" y="0" width="1080" height="120" fill="\${colors.bg}"/>
  <text x="540" y="70" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="\${colors.text}" text-anchor="middle">\${BRAND.name}</text>
  <text x="540" y="100" font-family="Arial, sans-serif" font-size="20" fill="\${colors.accent}" text-anchor="middle">\${includeWebsite ? BRAND.website : ''}</text>
  
  <rect x="0" y="400" width="1080" height="140" fill="\${colors.bg}"/>
  <text x="540" y="490" font-family="Georgia, serif" font-size="56" font-weight="bold" fill="\${colors.text}" text-anchor="middle">\${headline}</text>
  
  \${subtext ? \`
  <rect x="0" y="540" width="1080" height="80" fill="\${colors.bg}"/>
  <text x="540" y="590" font-family="Arial, sans-serif" font-size="32" fill="\${colors.accent}" text-anchor="middle">\${subtext}</text>
  \` : ''}
  
  <rect x="0" y="920" width="1080" height="160" fill="\${colors.bg}"/>
  \${cta ? \`<text x="540" y="980" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="\${colors.text}" text-anchor="middle">\${cta}</text>\` : ''}
  \${includePhone ? \`<text x="540" y="1040" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="\${colors.accent}" text-anchor="middle">\${BRAND.phone}</text>\` : ''}
</svg>\`;
      }

      function updatePreview() {
        const svg = generateSvgOverlay();
        document.getElementById('previewOverlay').innerHTML = svg;
      }

      async function generateFlier() {
        const loading = document.getElementById('loading');
        const previewContainer = document.getElementById('previewContainer');
        
        loading.classList.add('active');
        previewContainer.style.opacity = '0.5';
        
        const isGallery = document.querySelector('input[name="bgSource"][value="gallery"]').checked;
        
        const payload = {
          headline: document.getElementById('headline').value,
          subtext: document.getElementById('subtext').value || undefined,
          cta: document.getElementById('cta').value || undefined,
          template: currentTemplate,
          includePhone: document.getElementById('includePhone').checked,
          includeWebsite: document.getElementById('includeWebsite').checked,
        };
        
        if (isGallery && selectedGalleryImage) {
          payload.imageUrl = selectedGalleryImage;
        } else {
          payload.imagePrompt = document.getElementById('imagePrompt').value || 'wooden deck in Oklahoma sunshine';
        }
        
        try {
          const res = await fetch('/api/flier/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          const data = await res.json();
          
          if (data.success) {
            generatedBgUrl = data.fullBackgroundUrl;
            flierId = data.flierId;
            
            document.getElementById('previewBg').src = data.fullBackgroundUrl;
            document.getElementById('bgUrl').href = data.fullBackgroundUrl;
            document.getElementById('bgUrl').textContent = data.backgroundUrl;
            document.getElementById('flierId').textContent = flierId;
            document.getElementById('flierResult').style.display = 'block';
            document.getElementById('downloadBtn').disabled = false;
            document.getElementById('queueBtn').disabled = false;
            
            updatePreview();
          } else {
            alert('Error: ' + data.error);
          }
        } catch (err) {
          alert('Failed to generate flier: ' + err.message);
        } finally {
          loading.classList.remove('active');
          previewContainer.style.opacity = '1';
        }
      }

      async function downloadFlier() {
        try {
          // Create canvas and composite layers
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          
          // Load background
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          const bgSrc = document.getElementById('previewBg').src;
          
          // Fetch the image as blob to avoid CORS issues
          const response = await fetch(bgSrc);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          bgImg.onload = async () => {
            ctx.drawImage(bgImg, 0, 0, 1080, 1080);
            URL.revokeObjectURL(blobUrl);
            
            // Draw text directly on canvas (more reliable than SVG)
            const headline = document.getElementById('headline').value || 'Your Headline';
            const subtext = document.getElementById('subtext').value;
            const cta = document.getElementById('cta').value;
            const includePhone = document.getElementById('includePhone').checked;
            const includeWebsite = document.getElementById('includeWebsite').checked;
            
            const colors = currentTemplate === 'testimonial' 
              ? { bg: 'rgba(255,255,255,0.9)', text: '#333333', accent: '#8B4513' }
              : { bg: 'rgba(139,69,19,0.85)', text: '#FFFFFF', accent: '#F5DEB3' };
            
            // Top banner
            ctx.fillStyle = colors.bg;
            ctx.fillRect(0, 0, 1080, 120);
            ctx.fillStyle = colors.text;
            ctx.font = 'bold 48px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText(BRAND.name, 540, 70);
            ctx.fillStyle = colors.accent;
            ctx.font = '20px Arial, sans-serif';
            if (includeWebsite) ctx.fillText(BRAND.website, 540, 100);
            
            // Headline
            ctx.fillStyle = colors.bg;
            ctx.fillRect(0, 400, 1080, 140);
            ctx.fillStyle = colors.text;
            ctx.font = 'bold 56px Georgia, serif';
            ctx.fillText(headline, 540, 490);
            
            // Subtext
            if (subtext) {
              ctx.fillStyle = colors.bg;
              ctx.fillRect(0, 540, 1080, 80);
              ctx.fillStyle = colors.accent;
              ctx.font = '32px Arial, sans-serif';
              ctx.fillText(subtext, 540, 590);
            }
            
            // Bottom CTA
            ctx.fillStyle = colors.bg;
            ctx.fillRect(0, 920, 1080, 160);
            if (cta) {
              ctx.fillStyle = colors.text;
              ctx.font = 'bold 36px Arial, sans-serif';
              ctx.fillText(cta, 540, 980);
            }
            if (includePhone) {
              ctx.fillStyle = colors.accent;
              ctx.font = 'bold 44px Arial, sans-serif';
              ctx.fillText(BRAND.phone, 540, 1040);
            }
            
            // Download
            const link = document.createElement('a');
            link.download = 'handy-beaver-flier-' + Date.now() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          };
          
          bgImg.onerror = () => {
            alert('Failed to load background image. Try generating a new one.');
          };
          
          bgImg.src = blobUrl;
        } catch (err) {
          console.error('Download error:', err);
          alert('Download failed: ' + err.message);
        }
      }

      async function addToQueue() {
        const headline = document.getElementById('headline').value;
        if (!headline) {
          alert('Add a headline first');
          return;
        }
        
        const bgUrl = generatedBgUrl || selectedGalleryImage;
        console.log('Add to queue - bgUrl:', bgUrl);
        console.log('generatedBgUrl:', generatedBgUrl);
        console.log('selectedGalleryImage:', selectedGalleryImage);
        
        if (!bgUrl) {
          alert('Select or generate a background image first');
          return;
        }
        
        // Disable button and show loading
        const queueBtn = document.getElementById('queueBtn');
        queueBtn.disabled = true;
        queueBtn.textContent = '⏳ Adding...';
        
        try {
          // Create flier in content queue via API
          const payload = {
            headline: headline,
            subtext: document.getElementById('subtext').value || undefined,
            cta: document.getElementById('cta').value || undefined,
            template: currentTemplate,
            imageUrl: bgUrl,
            includePhone: document.getElementById('includePhone').checked,
            includeWebsite: document.getElementById('includeWebsite').checked,
          };
          
          console.log('Payload:', JSON.stringify(payload));
          
          const res = await fetch('/api/flier/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          console.log('Response status:', res.status);
          const data = await res.json();
          console.log('Response data:', data);
          
          if (data.success) {
            queueBtn.textContent = '✅ Added #' + data.flierId;
            alert('Flier #' + data.flierId + ' added to content queue!');
          } else {
            queueBtn.textContent = '📋 Add to Queue';
            queueBtn.disabled = false;
            alert('Error: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          console.error('Queue error:', err);
          queueBtn.textContent = '📋 Add to Queue';
          queueBtn.disabled = false;
          alert('Failed to add to queue: ' + err.message);
        }
      }

      // Initial preview
      updatePreview();
    </script>
  `;

  return c.html(adminLayout('Flier Generator', content, 'fliers'));
};
