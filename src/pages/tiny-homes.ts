import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { tinyHomePackages } = siteConfig;

export const tinyHomesPage = (c: Context) => {
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">Tiny Home Finish Packages</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">Complete interior finishes for sheds, cabins & tiny homes under 1,000 sq.ft.</p>
    </section>
    
    <!-- Package Comparison -->
    <section class="container" style="margin-top: 2rem;">
      <div class="grid grid-2" style="max-width: 900px; margin: 0 auto; gap: 2rem;">
        
        <!-- Modern Minimal -->
        <div class="card" style="position: relative; overflow: hidden;">
          <div style="background: url('/api/assets/portfolio/tiny-home/474709192_933240365588379_2964908423868795235_n.jpg') center/cover; padding: 6rem 2rem; margin: -2rem -2rem 1.5rem; text-align: center; position: relative;">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);"></div>
            <div style="position: relative; z-index: 1;">
              <h2 style="color: white; margin: 0 0 0.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${tinyHomePackages.modernMinimal.label}</h2>
            <p style="font-size: 2rem; font-weight: bold; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                $${tinyHomePackages.modernMinimal.pricePerSqft}<span style="font-size: 1rem; color: #ddd;">/sq.ft.</span>
              </p>
            </div>
          </div>
          
          <p style="color: #666; margin-bottom: 1.5rem; font-size: 1.05rem;">
            ${tinyHomePackages.modernMinimal.description}
          </p>
          
          <h4 style="color: var(--primary); margin-bottom: 1rem;">What's Included:</h4>
          <ul style="list-style: none; padding: 0;">
            ${tinyHomePackages.modernMinimal.includes.map(item => `
              <li style="padding: 0.75rem 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 0.75rem;">
                <span style="color: var(--secondary);">✓</span> ${item}
              </li>
            `).join('')}
          </ul>
          
          <div style="margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 0.9rem;">
              <strong>Example:</strong> 400 sq.ft. shed = <strong style="color: var(--secondary);">$${400 * tinyHomePackages.modernMinimal.pricePerSqft}</strong>
            </p>
          </div>
          
          <a href="/contact?package=modern-minimal" class="btn btn-secondary" style="margin-top: 1.5rem; display: block; text-align: center;">Get a Quote →</a>
        </div>
        
        <!-- Rustic Cabin -->
        <div class="card" style="position: relative; overflow: hidden; border: 3px solid var(--secondary);">
          <div style="position: absolute; top: 1rem; right: 1rem; background: var(--secondary); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; z-index: 2;">PREMIUM</div>
          
          <div style="background: url('/api/assets/portfolio/rustic-cabin/kitchen.jpg') center/cover; padding: 6rem 2rem; margin: -2rem -2rem 1.5rem; text-align: center; position: relative;">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(61,35,23,0.5) 0%, rgba(61,35,23,0.8) 100%);"></div>
            <div style="position: relative; z-index: 1;">
              <h2 style="color: #F5DEB3; margin: 0 0 0.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${tinyHomePackages.rusticCabin.label}</h2>
              <p style="font-size: 2rem; font-weight: bold; color: #F5DEB3; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                $${tinyHomePackages.rusticCabin.pricePerSqft}<span style="font-size: 1rem; color: #ddd;">/sq.ft.</span>
              </p>
            </div>
          </div>
          
          <p style="color: #666; margin-bottom: 1.5rem; font-size: 1.05rem;">
            ${tinyHomePackages.rusticCabin.description}
          </p>
          
          <h4 style="color: var(--primary); margin-bottom: 1rem;">What's Included:</h4>
          <ul style="list-style: none; padding: 0;">
            ${tinyHomePackages.rusticCabin.includes.map(item => `
              <li style="padding: 0.75rem 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 0.75rem;">
                <span style="color: var(--secondary);">✓</span> ${item}
              </li>
            `).join('')}
          </ul>
          
          <div style="margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 0.9rem;">
              <strong>Example:</strong> 400 sq.ft. cabin = <strong style="color: var(--secondary);">$${400 * tinyHomePackages.rusticCabin.pricePerSqft}</strong>
            </p>
          </div>
          
          <a href="/contact?package=rustic-cabin" class="btn btn-primary" style="margin-top: 1.5rem; display: block; text-align: center;">Get a Quote →</a>
        </div>
        
      </div>
    </section>
    
    <!-- Calculator -->
    <section class="container" style="margin-top: 4rem;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div class="card" style="text-align: center;">
          <h2 style="color: var(--primary); margin-bottom: 1.5rem;">🧮 Quick Price Calculator</h2>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; color: #666; margin-bottom: 0.5rem;">Square Footage</label>
            <input type="number" id="sqft-input" value="400" min="100" max="1000" step="50" 
              style="width: 150px; padding: 1rem; font-size: 1.25rem; text-align: center; border: 2px solid #ddd; border-radius: 8px;"
              oninput="updatePrice()">
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; color: #666; margin-bottom: 0.5rem;">Package</label>
            <select id="package-select" style="padding: 1rem; font-size: 1rem; border: 2px solid #ddd; border-radius: 8px; min-width: 200px;" onchange="updatePrice()">
              <option value="${tinyHomePackages.modernMinimal.pricePerSqft}">${tinyHomePackages.modernMinimal.label} ($${tinyHomePackages.modernMinimal.pricePerSqft}/sq.ft.)</option>
              <option value="${tinyHomePackages.rusticCabin.pricePerSqft}">${tinyHomePackages.rusticCabin.label} ($${tinyHomePackages.rusticCabin.pricePerSqft}/sq.ft.)</option>
            </select>
          </div>
          
          <div style="padding: 1.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 12px; color: white;">
            <p style="margin: 0; font-size: 1rem; opacity: 0.9;">Estimated Total</p>
            <p id="price-display" style="margin: 0.5rem 0 0; font-size: 2.5rem; font-weight: bold;">$30,000</p>
          </div>
          
          <p style="color: #888; font-size: 0.85rem; margin-top: 1rem;">
            *Estimate only. Final price depends on site conditions and custom options.
          </p>
        </div>
      </div>
      
      <script>
        function updatePrice() {
          const sqft = parseInt(document.getElementById('sqft-input').value) || 400;
          const rate = parseFloat(document.getElementById('package-select').value);
          const total = sqft * rate;
          document.getElementById('price-display').textContent = '$' + total.toLocaleString();
        }
        updatePrice();
      </script>
    </section>
    
    <!-- What's NOT Included -->
    <section class="container" style="margin-top: 4rem;">
      <div style="max-width: 700px; margin: 0 auto;">
        <h2 class="section-title">What's NOT Included</h2>
        <p class="section-subtitle">These items are typically handled separately</p>
        
        <div class="card" style="margin-top: 2rem;">
          <div class="grid grid-2" style="gap: 1rem;">
            <div>
              <h4 style="color: var(--primary); margin-bottom: 0.5rem;">❌ Not in Package</h4>
              <ul style="list-style: none; padding: 0; color: #666;">
                <li style="padding: 0.5rem 0;">• Plumbing rough-in/fixtures</li>
                <li style="padding: 0.5rem 0;">• HVAC installation</li>
                <li style="padding: 0.5rem 0;">• Exterior work</li>
                <li style="padding: 0.5rem 0;">• Appliances</li>
                <li style="padding: 0.5rem 0;">• Furniture</li>
              </ul>
            </div>
            <div>
              <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">✓ Available as Add-Ons</h4>
              <ul style="list-style: none; padding: 0; color: #666;">
                <li style="padding: 0.5rem 0;">• Custom shelving</li>
                <li style="padding: 0.5rem 0;">• Built-in storage</li>
                <li style="padding: 0.5rem 0;">• Window treatments</li>
                <li style="padding: 0.5rem 0;">• Lighting fixtures</li>
                <li style="padding: 0.5rem 0;">• Accent walls</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Process -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Our Process</h2>
      
      <div style="max-width: 800px; margin: 2rem auto;">
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
            <div style="background: var(--primary); color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; flex-shrink: 0;">1</div>
            <div>
              <h3 style="color: var(--primary); margin: 0 0 0.5rem;">Consultation & Quote</h3>
              <p style="color: #666; margin: 0;">Send us photos of your shell. We'll discuss your vision and provide a detailed quote.</p>
            </div>
          </div>
          
          <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
            <div style="background: var(--primary); color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; flex-shrink: 0;">2</div>
            <div>
              <h3 style="color: var(--primary); margin: 0 0 0.5rem;">Material Selection</h3>
              <p style="color: #666; margin: 0;">Choose your finishes — flooring type, wall color, trim style, and any upgrades.</p>
            </div>
          </div>
          
          <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
            <div style="background: var(--primary); color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; flex-shrink: 0;">3</div>
            <div>
              <h3 style="color: var(--primary); margin: 0 0 0.5rem;">Build Out (2-4 weeks)</h3>
              <p style="color: #666; margin: 0;">We handle everything — framing, insulation, walls, flooring, trim. Progress photos daily.</p>
            </div>
          </div>
          
          <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
            <div style="background: var(--secondary); color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; flex-shrink: 0;">4</div>
            <div>
              <h3 style="color: var(--secondary); margin: 0 0 0.5rem;">Final Walkthrough</h3>
              <p style="color: #666; margin: 0;">We walk through together, address any punch list items, and hand over your finished space.</p>
            </div>
          </div>
          
        </div>
      </div>
    </section>
    
    <!-- Photo Gallery -->
    <section class="container" style="margin-top: 4rem;">
      <h2 class="section-title">Our Work</h2>
      <p class="section-subtitle">Real projects we've completed in SE Oklahoma</p>
      
      <!-- Rustic Cabin Gallery -->
      <div style="margin-top: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">🪵 Rustic Cabin Finishes</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
          <img src="/api/assets/portfolio/rustic-cabin/kitchen.jpg" alt="Rustic kitchen" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/rustic-cabin/barn-wood.jpg" alt="Barn wood accent" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/rustic-cabin/kitchen-island.jpg" alt="Kitchen island" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/rustic-cabin/bath.jpg" alt="Bathroom" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/rustic-cabin/shower.jpg" alt="Shower" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/rustic-cabin/barnwood-and-hardwood-floor.jpg" alt="Flooring" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
        </div>
      </div>
      
      <!-- Modern Minimal Gallery -->
      <div style="margin-top: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">🏠 Modern Minimal Finishes</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
          <img src="/api/assets/portfolio/tiny-home/474709192_933240365588379_2964908423868795235_n.jpg" alt="Tiny home interior" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/tiny-home/474788122_933240192255063_5658823891692943582_n.jpg" alt="Tiny home" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/tiny-home/474795745_933240485588367_5571935148128073929_n.jpg" alt="Tiny home" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/tiny-home/474826354_933240358921713_6302472880919064509_n.jpg" alt="Tiny home" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/tiny-home/475124387_933240505588365_3669914998546832511_n.jpg" alt="Tiny home" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
          <img src="/api/assets/portfolio/tiny-home/475139154_933240438921705_6791029253756598687_n.jpg" alt="Tiny home" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; cursor: pointer;" onclick="openLightbox(this.src)">
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <a href="/gallery" class="btn btn-secondary">View Full Gallery →</a>
      </div>
    </section>
    
    <!-- Lightbox -->
    <div id="lightbox" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; justify-content: center; align-items: center;" onclick="closeLightbox()">
      <img id="lightbox-img" src="" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">
      <button style="position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;" onclick="closeLightbox()">×</button>
    </div>
    <script>
      function openLightbox(src) {
        document.getElementById('lightbox').style.display = 'flex';
        document.getElementById('lightbox-img').src = src;
      }
      function closeLightbox() {
        document.getElementById('lightbox').style.display = 'none';
      }
    </script>
    
    <!-- CTA -->
    <section class="container" style="margin-top: 4rem; text-align: center; padding-bottom: 2rem;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, var(--primary), var(--secondary)); padding: 2.5rem; border-radius: 20px; color: white;">
        <h2 style="margin: 0 0 1rem;">Ready to Finish Your Space?</h2>
        <p style="opacity: 0.9; margin-bottom: 1.5rem;">
          Send us photos of your shell and we'll provide a detailed quote within 24 hours.
        </p>
        <a href="/contact?type=tiny-home" class="btn" style="background: white; color: var(--primary);">Start Your Project →</a>
      </div>
    </section>
  `;
  
  return c.html(layout('Tiny Home Finish Packages', content, 'tiny-homes'));
};
