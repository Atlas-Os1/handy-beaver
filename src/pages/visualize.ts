import { Context } from 'hono';
import { layout } from '../lib/html';

export const visualizePage = (c: Context) => {
  const content = `
<style>
/* ── Cabin Design Studio Styles ─────────────────────────────────────── */
.cds-wrap { max-width: 1200px; margin: 0 auto; padding: 0 1rem 4rem; }

/* Hero */
.cds-hero { text-align: center; padding: 3rem 1rem 2rem; background: linear-gradient(180deg, rgba(139,69,19,0.25) 0%, transparent 100%); }
.cds-hero h1 { font-size: 2.6rem; color: var(--primary); font-family: 'Playfair Display', serif; margin-bottom: 0.5rem; }
.cds-hero p  { color: #666; font-size: 1.1rem; }

/* Mode selector */
.mode-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin: 1.5rem 0; }
.mode-card { border: 2px solid #ddd; border-radius: 12px; padding: 1rem 0.75rem; text-align: center; cursor: pointer; transition: all 0.2s; background: white; }
.mode-card:hover { border-color: var(--secondary); background: #fdf6f0; }
.mode-card.active { border-color: var(--primary); background: #fdf0e6; box-shadow: 0 0 0 3px rgba(139,69,19,0.15); }
.mode-card .icon { font-size: 2rem; display: block; margin-bottom: 0.4rem; }
.mode-card .label { font-weight: 700; font-size: 0.85rem; color: #333; }
.mode-card .sub   { font-size: 0.75rem; color: #888; margin-top: 0.2rem; }

/* Studio layout */
.studio { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
@media (max-width: 768px) { .mode-grid { grid-template-columns: repeat(2,1fr); } .studio { grid-template-columns: 1fr; } }

/* Panels */
.panel { background: white; border-radius: 14px; border: 1px solid #e0d6cc; overflow: hidden; }
.panel-header { padding: 0.9rem 1.2rem; background: #fdf6f0; border-bottom: 1px solid #e0d6cc; font-weight: 700; font-size: 0.95rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; }
.panel-body { padding: 1.2rem; }

/* Upload zone */
.upload-zone { border: 2px dashed #ccc; border-radius: 10px; padding: 2.5rem 1rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa; }
.upload-zone:hover, .upload-zone.drag { border-color: var(--primary); background: #fff8f4; }
.upload-zone .icon { font-size: 2.5rem; }
.upload-zone p { color: #888; font-size: 0.9rem; margin-top: 0.3rem; }

/* Style presets */
.style-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 0.75rem 0; }
.style-btn { border: 1.5px solid #ddd; border-radius: 8px; padding: 0.55rem 0.5rem; cursor: pointer; font-size: 0.8rem; font-weight: 600; background: white; transition: all 0.15s; text-align: center; }
.style-btn:hover  { border-color: var(--secondary); }
.style-btn.active { border-color: var(--primary); background: #fdf0e6; color: var(--primary); }

/* Area type pills */
.area-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.5rem 0; }
.area-pill { border: 1.5px solid #ddd; border-radius: 20px; padding: 0.3rem 0.8rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; background: white; transition: all 0.15s; }
.area-pill:hover  { border-color: var(--secondary); }
.area-pill.active { border-color: var(--primary); background: var(--primary); color: white; }

/* Textarea */
.cds-textarea { width: 100%; border: 1.5px solid #ddd; border-radius: 8px; padding: 0.75rem; font-size: 0.95rem; resize: vertical; min-height: 90px; font-family: inherit; transition: border-color 0.15s; }
.cds-textarea:focus { outline: none; border-color: var(--primary); }

/* Dimension row */
.dim-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; }
.dim-field label { font-size: 0.8rem; font-weight: 600; color: #555; display: block; margin-bottom: 0.25rem; }
.dim-field input  { width: 100%; border: 1.5px solid #ddd; border-radius: 6px; padding: 0.5rem 0.6rem; font-size: 0.9rem; }
.dim-field input:focus { outline: none; border-color: var(--primary); }

/* Generate button */
.gen-btn { width: 100%; padding: 0.9rem; border-radius: 10px; border: none; background: var(--primary); color: white; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.gen-btn:hover:not(:disabled) { background: var(--secondary); transform: translateY(-1px); }
.gen-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Before/After viewer */
.ba-viewer { position: relative; width: 100%; border-radius: 10px; overflow: hidden; background: #111; min-height: 280px; }
.ba-before, .ba-after { position: absolute; inset: 0; }
.ba-before img, .ba-after img { width: 100%; height: 100%; object-fit: cover; }
.ba-after { clip-path: inset(0 50% 0 0); }
.ba-slider { position: absolute; top: 0; bottom: 0; left: 50%; width: 3px; background: white; cursor: ew-resize; z-index: 10; }
.ba-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 36px; height: 36px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: ew-resize; }
.ba-label { position: absolute; top: 8px; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
.ba-label.before { left: 8px; }
.ba-label.after  { right: 8px; }
.ba-placeholder  { width: 100%; min-height: 280px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #666; gap: 0.5rem; background: #f9f5f2; border-radius: 10px; border: 2px dashed #ddd; }

/* Quote panel */
.quote-section { margin-top: 1rem; }
.quote-toggle { background: none; border: 1.5px solid var(--primary); color: var(--primary); border-radius: 8px; padding: 0.6rem 1rem; font-weight: 700; cursor: pointer; font-size: 0.9rem; width: 100%; transition: all 0.15s; }
.quote-toggle:hover { background: var(--primary); color: white; }
.quote-box { margin-top: 0.75rem; border: 1px solid #e0d6cc; border-radius: 10px; overflow: hidden; display: none; }
.quote-box.open { display: block; }
.quote-dims { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding: 0.75rem; background: #fdf6f0; border-bottom: 1px solid #e0d6cc; }
.quote-dims label { font-size: 0.78rem; font-weight: 600; color: #555; display: block; margin-bottom: 0.2rem; }
.quote-dims input  { width: 100%; border: 1px solid #ddd; border-radius: 6px; padding: 0.4rem 0.5rem; font-size: 0.85rem; }
.quote-run-btn { width: 100%; padding: 0.65rem; background: #2d5a27; color: white; border: none; font-weight: 700; cursor: pointer; font-size: 0.88rem; transition: background 0.15s; }
.quote-run-btn:hover:not(:disabled) { background: #1e4018; }
.quote-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.quote-loading { padding: 1rem; text-align: center; color: #888; font-size: 0.9rem; }
.quote-result  { padding: 0.75rem 1rem; }
.quote-summary { font-size: 0.85rem; color: #555; font-style: italic; margin-bottom: 0.75rem; }
.quote-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.quote-table th { text-align: left; padding: 0.4rem 0.5rem; background: #f5f0eb; font-weight: 700; color: #555; font-size: 0.75rem; text-transform: uppercase; }
.quote-table td { padding: 0.4rem 0.5rem; border-top: 1px solid #f0e8e0; }
.quote-table tr:hover td { background: #fdf8f5; }
.quote-cat { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
.cat-materials { background: #dbeafe; color: #1e40af; }
.cat-labor     { background: #dcfce7; color: #15803d; }
.cat-equipment { background: #fef3c7; color: #92400e; }
.quote-totals { margin-top: 0.5rem; padding: 0.75rem; background: #fdf6f0; border-top: 2px solid #e0d6cc; }
.totals-row { display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.2rem 0; color: #555; }
.totals-row.grand { font-weight: 800; font-size: 1rem; color: var(--primary); border-top: 1px solid #ccc; margin-top: 0.4rem; padding-top: 0.4rem; }
.quote-actions { padding: 0.75rem; display: flex; gap: 0.5rem; }
.qa-btn { flex: 1; padding: 0.6rem; border-radius: 7px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; }
.qa-save    { background: #f3f4f6; color: #374151; }
.qa-save:hover   { background: #e5e7eb; }
.qa-request      { background: var(--primary); color: white; }
.qa-request:hover { background: var(--secondary); }

/* Usage badge */
.usage-badge { padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.83rem; font-weight: 600; margin-top: 0.75rem; text-align: center; }
.usage-ok   { background: #dcfce7; color: #15803d; }
.usage-warn { background: #fef3c7; color: #92400e; }
.usage-out  { background: #fee2e2; color: #991b1b; }
.usage-admin { background: var(--primary); color: white; }

/* Auth gate */
.auth-gate { text-align: center; padding: 2.5rem 1rem; }
.auth-gate .icon { font-size: 3rem; margin-bottom: 1rem; }
.auth-gate h3 { color: var(--primary); margin-bottom: 0.5rem; }
.auth-gate p  { color: #666; font-size: 0.9rem; }
.auth-btns { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem; flex-wrap: wrap; }

/* Prompt suggestions */
.suggestions { margin-top: 0.5rem; }
.sug-label { font-size: 0.75rem; color: #888; margin-bottom: 0.3rem; }
.sug-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.sug-chip  { background: #f3f0ec; border: 1px solid #ddd; border-radius: 20px; padding: 0.25rem 0.65rem; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; color: #444; }
.sug-chip:hover { background: #fdf0e6; border-color: var(--primary); color: var(--primary); }

/* Result actions */
.result-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
.result-actions button { flex: 1; padding: 0.6rem; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: 1.5px solid #ddd; background: white; transition: all 0.15s; }
.result-actions button:hover { border-color: var(--primary); color: var(--primary); }
</style>

<div class="cds-wrap">
  <!-- Hero -->
  <div class="cds-hero">
    <h1>🏡 Cabin Design Studio</h1>
    <p>Visualize your Hochatown cabin addition, remodel, or custom sign — with an instant AI quote</p>
  </div>

  <!-- Mode Selector -->
  <div class="mode-grid">
    <div class="mode-card active" data-mode="remodel" onclick="setMode('remodel', this)">
      <span class="icon">🔨</span>
      <div class="label">Remodel</div>
      <div class="sub">Decks, stain, trim, floors</div>
    </div>
    <div class="mode-card" data-mode="addition" onclick="setMode('addition', this)">
      <span class="icon">🏗️</span>
      <div class="label">Addition</div>
      <div class="sub">New rooms, porches, lofts</div>
    </div>
    <div class="mode-card" data-mode="sign" onclick="setMode('sign', this)">
      <span class="icon">🪵</span>
      <div class="label">Sign Creator</div>
      <div class="sub">Cedar cabin signs</div>
    </div>
    <div class="mode-card" data-mode="material" onclick="setMode('material', this)">
      <span class="icon">🎨</span>
      <div class="label">Materials</div>
      <div class="sub">Stain, paint, flooring</div>
    </div>
  </div>

  <div class="studio">
    <!-- LEFT: Input Panel -->
    <div>
      <div class="panel" id="input-panel">
        <div class="panel-header">🛠️ Design Your Project</div>
        <div class="panel-body">

          <!-- Auth gate (hidden when logged in) -->
          <div id="auth-gate" style="display:none">
            <div class="auth-gate">
              <div class="icon">🔐</div>
              <h3>Sign In to Design</h3>
              <p>Create a free account or sign in to use the Cabin Design Studio and get instant AI quotes.</p>
              <div class="auth-btns">
                <a href="/portal/login" class="btn btn-primary">Sign In →</a>
                <a href="/contact" class="btn btn-secondary">Get Free Quote</a>
              </div>
            </div>
          </div>

          <!-- Main form -->
          <div id="main-form">
            <!-- Upload zone (hidden for text-only modes) -->
            <div id="upload-section">
              <label style="font-weight:700;font-size:0.88rem;color:var(--primary);display:block;margin-bottom:0.4rem">📸 Upload Your Photo</label>
              <div class="upload-zone" id="drop-zone">
                <div class="icon">📷</div>
                <p>Drag & drop or click to upload<br><span style="font-size:0.78rem;color:#aaa">JPG/PNG up to 10MB</span></p>
                <input type="file" id="photo-input" accept="image/*" style="display:none">
              </div>
              <div id="preview-wrap" style="display:none;margin-top:0.5rem;text-align:center;position:relative">
                <img id="photo-preview" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover">
                <button onclick="clearPhoto()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.55);color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:0.75rem">✕</button>
              </div>
            </div>

            <!-- Style Presets -->
            <div style="margin-top:1rem">
              <label style="font-weight:700;font-size:0.88rem;color:var(--primary);display:block;margin-bottom:0.4rem">🪵 Style</label>
              <div class="style-grid">
                <button class="style-btn active" data-style="rustic_cedar" onclick="setStyle('rustic_cedar',this)">🌲 Rustic Cedar</button>
                <button class="style-btn" data-style="mountain_lodge" onclick="setStyle('mountain_lodge',this)">🏔️ Mountain Lodge</button>
                <button class="style-btn" data-style="modern_farmhouse" onclick="setStyle('modern_farmhouse',this)">🏡 Modern Farmhouse</button>
                <button class="style-btn" data-style="lakeside" onclick="setStyle('lakeside',this)">🌊 Lakeside Retreat</button>
              </div>
            </div>

            <!-- Area type -->
            <div style="margin-top:0.75rem" id="area-section">
              <label style="font-weight:700;font-size:0.88rem;color:var(--primary);display:block;margin-bottom:0.4rem">📍 Area</label>
              <div class="area-pills" id="area-pills">
                <span class="area-pill active" data-area="deck" onclick="setArea('deck',this)">Deck</span>
                <span class="area-pill" data-area="exterior" onclick="setArea('exterior',this)">Exterior</span>
                <span class="area-pill" data-area="entry" onclick="setArea('entry',this)">Entry / Porch</span>
                <span class="area-pill" data-area="interior" onclick="setArea('interior',this)">Interior</span>
                <span class="area-pill" data-area="loft" onclick="setArea('loft',this)">Loft</span>
                <span class="area-pill" data-area="kitchen" onclick="setArea('kitchen',this)">Kitchen</span>
                <span class="area-pill" data-area="bathroom" onclick="setArea('bathroom',this)">Bathroom</span>
                <span class="area-pill" data-area="addition" onclick="setArea('addition',this)">Addition</span>
              </div>
            </div>

            <!-- Prompt -->
            <div style="margin-top:0.75rem">
              <label style="font-weight:700;font-size:0.88rem;color:var(--primary);display:block;margin-bottom:0.4rem">✏️ Describe Your Vision</label>
              <textarea id="prompt-input" class="cds-textarea" placeholder="e.g. Restain this deck in dark walnut with white metal railings…"></textarea>
              <div class="suggestions">
                <div class="sug-label">Quick suggestions:</div>
                <div class="sug-chips" id="sug-chips"></div>
              </div>
            </div>

            <!-- Usage badge -->
            <div id="usage-badge" class="usage-badge" style="display:none"></div>

            <button id="gen-btn" class="gen-btn" disabled onclick="runGenerate()">
              ✨ Generate Visualization
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT: Result Panel -->
    <div>
      <div class="panel">
        <div class="panel-header">🖼️ Preview</div>
        <div class="panel-body">
          <!-- Placeholder -->
          <div id="ba-placeholder" class="ba-placeholder">
            <span style="font-size:2.5rem">🏡</span>
            <span style="font-size:0.9rem">Your visualization will appear here</span>
            <span style="font-size:0.78rem;color:#aaa">Upload a photo and describe your project</span>
          </div>

          <!-- Before/After viewer (hidden until result) -->
          <div id="ba-viewer" class="ba-viewer" style="display:none;min-height:300px">
            <div class="ba-before">
              <img id="before-img" src="" alt="Before" style="width:100%;height:300px;object-fit:cover">
              <span class="ba-label before">BEFORE</span>
            </div>
            <div class="ba-after" id="ba-after-el">
              <img id="after-img" src="" alt="After" style="width:100%;height:300px;object-fit:cover">
              <span class="ba-label after">AFTER</span>
            </div>
            <div class="ba-slider" id="ba-slider">
              <div class="ba-handle">⇔</div>
            </div>
          </div>

          <!-- Result with input-only (sign/addition) -->
          <div id="result-only" style="display:none">
            <img id="result-img" src="" alt="Generated" style="width:100%;border-radius:10px">
          </div>

          <div id="result-actions" class="result-actions" style="display:none">
            <button onclick="downloadResult()">📥 Download</button>
            <button onclick="newVisualization()">🔄 New</button>
            <button onclick="shareResult()">🔗 Share</button>
          </div>

          <!-- Enhanced prompt shown after gen -->
          <div id="enhanced-prompt-box" style="display:none;margin-top:0.75rem;padding:0.6rem 0.8rem;background:#f9f5f0;border-radius:8px;font-size:0.78rem;color:#666;font-style:italic;">
            <strong style="color:var(--primary)">AI enhanced your prompt:</strong>
            <span id="enhanced-prompt-text"></span>
          </div>
        </div>
      </div>

      <!-- Quote Section -->
      <div id="quote-section" class="panel" style="margin-top:1rem;display:none">
        <div class="panel-header">💰 Instant Project Quote</div>
        <div class="panel-body">
          <button class="quote-toggle" onclick="toggleQuote()">📊 Generate AI Quote Estimate</button>
          <div class="quote-box" id="quote-box">
            <div class="quote-dims">
              <div>
                <label>Square Feet</label>
                <input type="number" id="q-sqft" placeholder="e.g. 300" min="1">
              </div>
              <div>
                <label>Linear Feet (optional)</label>
                <input type="number" id="q-lf" placeholder="e.g. 60">
              </div>
            </div>
            <button class="quote-run-btn" id="quote-run-btn" onclick="runQuote()">
              🧮 Calculate Estimate
            </button>
            <div id="quote-loading" class="quote-loading" style="display:none">
              ⏳ Building your itemized estimate…
            </div>
            <div id="quote-result" style="display:none">
              <div class="quote-result">
                <div class="quote-summary" id="quote-summary"></div>
                <table class="quote-table">
                  <thead>
                    <tr>
                      <th>Type</th><th>Description</th><th>Qty</th><th>Unit</th><th>$/Unit</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody id="quote-tbody"></tbody>
                </table>
              </div>
              <div class="quote-totals" id="quote-totals"></div>
              <div class="quote-actions">
                <button class="qa-btn qa-save" onclick="saveQuote()">💾 Save Quote</button>
                <button class="qa-btn qa-request" onclick="requestQuote()">🙋 Request This Job</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Examples -->
  <div style="margin-top:3rem">
    <h2 class="section-title">Inspiration Gallery</h2>
    <p class="section-subtitle" style="margin-bottom:1.5rem">Hochatown cabin ideas to get you started</p>
    <div class="grid grid-3">
      <div class="card" onclick="loadExample('remodel','deck','rustic_cedar','Restain this weathered deck in dark walnut, add new cedar hand railings with black iron balusters')" style="cursor:pointer;transition:transform 0.15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="font-size:2.5rem;text-align:center;padding:1rem 0">🏚️→🏡</div>
        <h3 style="color:var(--primary);text-align:center">Deck Refresh</h3>
        <p style="color:#666;font-size:0.85rem;text-align:center">Dark walnut stain + iron railings</p>
        <p style="text-align:center;margin-top:0.5rem"><span style="font-size:0.75rem;color:var(--secondary);font-weight:700">Click to try →</span></p>
      </div>
      <div class="card" onclick="loadExample('addition','addition','mountain_lodge','Add a covered screened-in porch with cedar tongue-and-groove ceiling and stone accent wall on the back of this cabin')" style="cursor:pointer;transition:transform 0.15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="font-size:2.5rem;text-align:center;padding:1rem 0">🏗️</div>
        <h3 style="color:var(--primary);text-align:center">Screened Porch Add-On</h3>
        <p style="color:#666;font-size:0.85rem;text-align:center">Cedar ceiling + stone accent</p>
        <p style="text-align:center;margin-top:0.5rem"><span style="font-size:0.75rem;color:var(--secondary);font-weight:700">Click to try →</span></p>
      </div>
      <div class="card" onclick="loadExample('sign','entry','rustic_cedar','Hand-routed cedar sign reading The Pines Lodge with a pine tree silhouette, dark walnut stain, hung above cabin entrance with rustic chains')" style="cursor:pointer;transition:transform 0.15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="font-size:2.5rem;text-align:center;padding:1rem 0">🪵</div>
        <h3 style="color:var(--primary);text-align:center">Cedar Cabin Sign</h3>
        <p style="color:#666;font-size:0.85rem;text-align:center">Hand-routed, stained, hung</p>
        <p style="text-align:center;margin-top:0.5rem"><span style="font-size:0.75rem;color:var(--secondary);font-weight:700">Click to try →</span></p>
      </div>
    </div>
  </div>
</div>

<script>
// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  mode: 'remodel',
  style: 'rustic_cedar',
  area: 'deck',
  file: null,
  sessionId: null,
  resultUrl: null,
  inputUrl: null,
  quoteId: null,
  usageStatus: null,
  dragging: false,
  sliderPct: 50,
};

// Prompt suggestions per mode
const SUGGESTIONS = {
  remodel: ['Restain deck in dark walnut', 'Add cedar crown molding', 'Install LVP flooring', 'Paint exterior with Sherwin Williams Urbane Bronze', 'Add cedar board-and-batten siding'],
  addition: ['Add screened-in back porch', 'Build covered carport', 'Add loft bedroom', 'Enclose garage as living space', 'Build outdoor kitchen area'],
  sign:     ['The Broken Bow Lodge — carved cedar', 'Family name + est. year sign', 'Welcome sign with pine tree', 'Airbnb property sign 16x32', 'Address number sign, black on cedar'],
  material: ['Show dark walnut TWP stain on this wood', 'Preview LVP oak flooring', 'Test Sikkens log & siding stain', 'Show composite deck boards', 'Preview white shiplap interior wall'],
};

const AREA_SETS = {
  remodel:  ['deck','exterior','entry','interior','loft','kitchen','bathroom'],
  addition: ['addition','entry','exterior','deck'],
  sign:     ['entry','exterior'],
  material: ['deck','interior','exterior','kitchen','bathroom'],
};

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await checkStatus();
  renderSuggestions();
  initSlider();
}

async function checkStatus() {
  try {
    const r = await fetch('/api/visualize/status');
    state.usageStatus = await r.json();
    renderUsageBadge();
    const form = document.getElementById('main-form');
    const gate = document.getElementById('auth-gate');
    if (!state.usageStatus.authorized) {
      form.style.display = 'none';
      gate.style.display = 'block';
    } else {
      form.style.display = 'block';
      gate.style.display = 'none';
      updateGenBtn();
    }
  } catch(e) { console.error('Status check failed', e); }
}

function renderUsageBadge() {
  const el = document.getElementById('usage-badge');
  const s = state.usageStatus;
  if (!s?.authorized) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  if (s.isAdmin) {
    el.className = 'usage-badge usage-admin';
    el.textContent = '👑 Admin — Unlimited visualizations';
  } else if (s.remaining <= 0) {
    el.className = 'usage-badge usage-out';
    el.textContent = '⛔ Daily limit reached — upgrade your plan';
  } else if (s.remaining <= 2) {
    el.className = 'usage-badge usage-warn';
    el.textContent = \`⚠️ \${s.remaining} of \${s.limit} visualizations remaining today\`;
  } else {
    el.className = 'usage-badge usage-ok';
    el.textContent = \`✅ \${s.remaining} of \${s.limit} remaining today\${s.name ? ' · ' + s.name : ''}\`;
  }
}

function updateGenBtn() {
  const s = state.usageStatus;
  const btn = document.getElementById('gen-btn');
  const hasPhoto = !!state.file || state.mode !== 'remodel';
  const hasPrompt = document.getElementById('prompt-input').value.trim().length > 3;
  const canGen = s?.authorized && (s?.isAdmin || s?.remaining > 0) && hasPhoto && hasPrompt;
  btn.disabled = !canGen;
}

// ── Mode / Style / Area ───────────────────────────────────────────────────────
function setMode(mode, el) {
  state.mode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  // Upload only needed for remodel/material
  document.getElementById('upload-section').style.display =
    (mode === 'sign' || mode === 'addition') ? 'none' : 'block';

  // Update area pills
  const areas = AREA_SETS[mode] || AREA_SETS.remodel;
  const pills = document.getElementById('area-pills');
  pills.innerHTML = areas.map((a,i) =>
    \`<span class="area-pill \${i===0?'active':''}" data-area="\${a}" onclick="setArea('\${a}',this)">\${a.charAt(0).toUpperCase()+a.slice(1)}</span>\`
  ).join('');
  state.area = areas[0];

  renderSuggestions();
  updateGenBtn();
}

function setStyle(style, el) {
  state.style = style;
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function setArea(area, el) {
  state.area = area;
  document.querySelectorAll('.area-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

function renderSuggestions() {
  const chips = document.getElementById('sug-chips');
  const sugs = SUGGESTIONS[state.mode] || [];
  chips.innerHTML = sugs.map(s =>
    \`<span class="sug-chip" onclick="usesuggestion(this)">\${s}</span>\`
  ).join('');
}

function usesuggestion(el) {
  document.getElementById('prompt-input').value = el.textContent;
  updateGenBtn();
}

// ── File upload ───────────────────────────────────────────────────────────────
const dz = document.getElementById('drop-zone');
const pi = document.getElementById('photo-input');

dz.addEventListener('click', () => pi.click());
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
dz.addEventListener('drop', e => {
  e.preventDefault(); dz.classList.remove('drag');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
pi.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
document.getElementById('prompt-input').addEventListener('input', updateGenBtn);

function handleFile(file) {
  if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
  if (file.size > 10 * 1024 * 1024) { alert('Image too large (max 10MB)'); return; }
  state.file = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('photo-preview').src = e.target.result;
    document.getElementById('preview-wrap').style.display = 'block';
    document.getElementById('drop-zone').style.display = 'none';
  };
  reader.readAsDataURL(file);
  updateGenBtn();
}

function clearPhoto() {
  state.file = null;
  pi.value = '';
  document.getElementById('preview-wrap').style.display = 'none';
  document.getElementById('drop-zone').style.display = 'block';
  updateGenBtn();
}

// ── Generate ──────────────────────────────────────────────────────────────────
async function runGenerate() {
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) return;
  if (state.mode === 'remodel' && !state.file) { alert('Please upload a photo for remodel mode'); return; }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Generating… (30–60s)';

  try {
    const fd = new FormData();
    if (state.file) fd.append('image', state.file);
    fd.append('prompt', prompt);
    fd.append('mode', state.mode);
    fd.append('style_preset', state.style);
    fd.append('area_type', state.area);

    const r = await fetch('/api/visualize/generate', { method: 'POST', body: fd });
    const data = await r.json();

    if (!data.success) throw new Error(data.error || 'Generation failed');

    state.sessionId = data.sessionId;
    state.resultUrl = data.resultUrl;
    state.inputUrl  = data.inputUrl;

    // Show result
    showResult(data);
    await checkStatus(); // refresh usage count

  } catch(err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Generate Visualization';
  }
}

function showResult(data) {
  const placeholder = document.getElementById('ba-placeholder');
  const viewer = document.getElementById('ba-viewer');
  const resultOnly = document.getElementById('result-only');

  if (data.inputUrl && state.mode !== 'sign') {
    // Before/After mode
    placeholder.style.display = 'none';
    viewer.style.display = 'block';
    resultOnly.style.display = 'none';
    document.getElementById('before-img').src = data.inputUrl;
    document.getElementById('after-img').src = data.resultUrl;
    resetSlider();
  } else {
    // Result-only mode (sign, text-only addition)
    placeholder.style.display = 'none';
    viewer.style.display = 'none';
    resultOnly.style.display = 'block';
    document.getElementById('result-img').src = data.resultUrl;
  }

  if (data.enhancedPrompt && data.enhancedPrompt !== document.getElementById('prompt-input').value.trim()) {
    document.getElementById('enhanced-prompt-text').textContent = data.enhancedPrompt;
    document.getElementById('enhanced-prompt-box').style.display = 'block';
  }

  document.getElementById('result-actions').style.display = 'flex';
  document.getElementById('quote-section').style.display = 'block';
}

function newVisualization() {
  document.getElementById('ba-viewer').style.display = 'none';
  document.getElementById('result-only').style.display = 'none';
  document.getElementById('ba-placeholder').style.display = 'flex';
  document.getElementById('result-actions').style.display = 'none';
  document.getElementById('quote-section').style.display = 'none';
  document.getElementById('enhanced-prompt-box').style.display = 'none';
  document.getElementById('quote-result').style.display = 'none';
  document.getElementById('quote-box').classList.remove('open');
  clearPhoto();
  document.getElementById('prompt-input').value = '';
  state.sessionId = null; state.resultUrl = null; state.inputUrl = null; state.quoteId = null;
}

async function downloadResult() {
  if (!state.resultUrl) return;
  const r = await fetch(state.resultUrl);
  const blob = await r.blob();
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'handy-beaver-design.jpg'; a.click();
}

function shareResult() {
  if (navigator.share && state.resultUrl) {
    navigator.share({ title: 'My Cabin Design', url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'));
  }
}

// ── Before/After Slider ───────────────────────────────────────────────────────
function initSlider() {
  const slider = document.getElementById('ba-slider');
  const viewer = document.getElementById('ba-viewer');
  if (!slider || !viewer) return;

  let dragging = false;
  const move = (x) => {
    const rect = viewer.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
    state.sliderPct = pct;
    slider.style.left = pct + '%';
    document.getElementById('ba-after-el').style.clipPath = \`inset(0 \${100 - pct}% 0 0)\`;
  };

  slider.addEventListener('mousedown', () => dragging = true);
  viewer.addEventListener('mousemove', e => { if (dragging) move(e.clientX); });
  document.addEventListener('mouseup', () => dragging = false);

  slider.addEventListener('touchstart', () => dragging = true, { passive: true });
  viewer.addEventListener('touchmove', e => { if (dragging) move(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('touchend', () => dragging = false);
}

function resetSlider() {
  state.sliderPct = 50;
  const slider = document.getElementById('ba-slider');
  if (slider) slider.style.left = '50%';
  const after = document.getElementById('ba-after-el');
  if (after) after.style.clipPath = 'inset(0 50% 0 0)';
}

// ── Quote ─────────────────────────────────────────────────────────────────────
function toggleQuote() {
  document.getElementById('quote-box').classList.toggle('open');
}

async function runQuote() {
  const sqft = parseFloat(document.getElementById('q-sqft').value);
  const lf   = parseFloat(document.getElementById('q-lf').value) || undefined;
  if (!sqft || sqft <= 0) { alert('Enter a square footage estimate'); return; }

  document.getElementById('quote-run-btn').disabled = true;
  document.getElementById('quote-loading').style.display = 'block';
  document.getElementById('quote-result').style.display = 'none';

  try {
    const r = await fetch('/api/visualize/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: state.sessionId,
        mode: state.mode,
        area_type: state.area,
        style_preset: state.style,
        sqft,
        lf,
        prompt: document.getElementById('prompt-input').value.trim(),
      }),
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error);
    state.quoteId = data.quote_id;
    renderQuote(data);
  } catch(err) {
    alert('Quote error: ' + err.message);
  } finally {
    document.getElementById('quote-run-btn').disabled = false;
    document.getElementById('quote-loading').style.display = 'none';
  }
}

function renderQuote(data) {
  const catClass = { materials: 'cat-materials', labor: 'cat-labor', equipment: 'cat-equipment' };
  document.getElementById('quote-summary').textContent = data.summary;

  const rows = (data.line_items || []).map(li => \`
    <tr>
      <td><span class="quote-cat \${catClass[li.category]||'cat-materials'}">\${li.category}</span></td>
      <td>\${li.description}</td>
      <td>\${li.qty}</td>
      <td>\${li.unit}</td>
      <td>$\${li.unit_cost.toFixed(2)}</td>
      <td style="font-weight:600">$\${li.total.toFixed(2)}</td>
    </tr>
  \`).join('');
  document.getElementById('quote-tbody').innerHTML = rows;

  const t = data.totals;
  document.getElementById('quote-totals').innerHTML = \`
    <div class="totals-row"><span>Materials</span><span>$\${t.materials.toFixed(2)}</span></div>
    <div class="totals-row"><span>Labor & Equipment</span><span>$\${t.labor.toFixed(2)}</span></div>
    <div class="totals-row"><span>Overhead (15%)</span><span>$\${t.overhead.toFixed(2)}</span></div>
    <div class="totals-row"><span>Markup (20%)</span><span>$\${t.markup.toFixed(2)}</span></div>
    <div class="totals-row grand"><span>TOTAL ESTIMATE</span><span>$\${t.grand.toFixed(2)}</span></div>
  \`;

  document.getElementById('quote-result').style.display = 'block';
}

async function saveQuote() {
  alert('Quote saved to your portal! View it under My Quotes.');
}

async function requestQuote() {
  if (!state.quoteId) { alert('Generate a quote first'); return; }
  const notes = prompt('Any additional notes for your request? (optional)') || '';
  try {
    const r = await fetch('/api/visualize/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_id: state.quoteId, notes }),
    });
    const d = await r.json();
    if (d.success) {
      alert('✅ Request submitted! We\\'ll be in touch within 24 hours. Check your portal for updates.');
    } else throw new Error(d.error);
  } catch(err) { alert('Error: ' + err.message); }
}

// ── Examples ──────────────────────────────────────────────────────────────────
function loadExample(mode, area, style, prompt) {
  // Set mode
  const modeCard = document.querySelector(\`[data-mode="\${mode}"]\`);
  if (modeCard) setMode(mode, modeCard);

  // Set style
  const styleBtn = document.querySelector(\`[data-style="\${style}"]\`);
  if (styleBtn) setStyle(style, styleBtn);

  // Set prompt
  document.getElementById('prompt-input').value = prompt;

  // Scroll to studio
  document.querySelector('.studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateGenBtn();
}

// ── Spin keyframe ─────────────────────────────────────────────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(spinStyle);

init();
</script>
`;

  return c.html(layout('Cabin Design Studio', content, 'visualize'));
};
