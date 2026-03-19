import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { business } = siteConfig;

export const howItWorksPage = (c: Context) => {
  const content = `
    <section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 3rem;">How It Works</h1>
      <p class="section-subtitle" style="font-size: 1.25rem;">Handyman services, reimagined. Fast quotes. No surprises.</p>
    </section>
    
    <!-- 3-Step Process -->
    <section class="container" style="margin-top: 3rem;">
      <div style="max-width: 1000px; margin: 0 auto;">
        
        <!-- Step 1: Upload -->
        <div style="display: flex; align-items: center; gap: 3rem; margin-bottom: 4rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <div style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; margin-bottom: 1.5rem;">1</div>
            <h2 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.75rem;">📸 Upload Photos</h2>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
              Snap photos of what needs fixing. Describe the issue. That's it.
            </p>
            <p style="color: #888; font-size: 0.95rem; margin-top: 1rem;">
              Use our quote form, customer portal, or chat with Lil Beaver — our AI assistant who's available 24/7.
            </p>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <div class="card" style="padding: 2rem; text-align: center; background: #f9f9f9;">
              <div style="font-size: 4rem; margin-bottom: 1rem;">📱</div>
              <p style="color: #666; font-size: 0.9rem;">
                "The deck railing is loose and the boards are rotting near the stairs..."
              </p>
              <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                <div style="width: 60px; height: 60px; background: #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center;">📷</div>
                <div style="width: 60px; height: 60px; background: #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center;">📷</div>
                <div style="width: 60px; height: 60px; background: #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center;">📷</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Step 2: Get Quote -->
        <div style="display: flex; align-items: center; gap: 3rem; margin-bottom: 4rem; flex-wrap: wrap; flex-direction: row-reverse;">
          <div style="flex: 1; min-width: 280px;">
            <div style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; margin-bottom: 1.5rem;">2</div>
            <h2 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.75rem;">💰 Get Upfront Pricing</h2>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
              We review your photos and provide a clear, flat-rate quote. No hidden fees. No in-person estimates for simple jobs.
            </p>
            <p style="color: #888; font-size: 0.95rem; margin-top: 1rem;">
              For larger projects, we'll schedule a quick site visit if needed — but most handyman work is quoted same-day from photos.
            </p>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <div class="card" style="padding: 2rem; text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 1rem;">📋</div>
              <h3 style="color: var(--primary); margin-bottom: 1rem;">Your Quote</h3>
              <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; text-align: left;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #ddd;">
                  <span>Deck Rail Repair</span>
                  <strong>$175</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #ddd;">
                  <span>Board Replacement (3)</span>
                  <strong>$85</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #ddd;">
                  <span>Materials (estimated)</span>
                  <strong>$120</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; font-size: 1.2rem;">
                  <strong>Total</strong>
                  <strong style="color: var(--secondary);">$380</strong>
                </div>
              </div>
              <p style="color: #888; font-size: 0.8rem; margin-top: 0.5rem;">Materials at cost, no markup</p>
            </div>
          </div>
        </div>
        
        <!-- Step 3: We Fix It -->
        <div style="display: flex; align-items: center; gap: 3rem; margin-bottom: 4rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <div style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; margin-bottom: 1.5rem;">3</div>
            <h2 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.75rem;">🔧 We Fix It</h2>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
              Accept your quote, pick a time, and we show up ready to work. Materials in hand. Zero wasted time.
            </p>
            <p style="color: #888; font-size: 0.95rem; margin-top: 1rem;">
              We know what we're walking into. No surprises for you, no extra trips for us. Just quality work, done right.
            </p>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <div class="card" style="padding: 2rem; text-align: center; background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.1));">
              <div style="font-size: 4rem; margin-bottom: 1rem;">🦫</div>
              <p style="color: var(--primary); font-weight: bold; font-size: 1.1rem;">
                "Your Handy Beaver arrives prepared"
              </p>
              <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap;">
                <span style="background: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">🔨 Tools</span>
                <span style="background: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">🪵 Materials</span>
                <span style="background: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">📋 Plan</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
    
    <!-- Why It's Better -->
    <section class="container" style="margin-top: 2rem; padding: 3rem 0;">
      <h2 class="section-title">Why This Works Better</h2>
      
      <div class="grid grid-3" style="max-width: 900px; margin: 2rem auto;">
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">⏱️</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Save Time</h3>
          <p style="color: #666; font-size: 0.95rem;">No scheduling estimate visits. Get quotes from your couch.</p>
        </div>
        
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">💵</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Know the Price</h3>
          <p style="color: #666; font-size: 0.95rem;">Upfront flat-rate pricing. What you see is what you pay.</p>
        </div>
        
        <div class="card" style="text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">✅</div>
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Done Right</h3>
          <p style="color: #666; font-size: 0.95rem;">We arrive prepared with everything needed to finish the job.</p>
        </div>
      </div>
    </section>
    
    <!-- Lil Beaver Chat -->
    <section class="container" style="margin-top: 2rem;">
      <div style="max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 2.5rem; border-radius: 20px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🦫💬</div>
        <h2 style="margin: 0 0 1rem;">Meet Lil Beaver</h2>
        <p style="opacity: 0.9; margin-bottom: 1.5rem; font-size: 1.1rem;">
          Our AI assistant is available 24/7 to answer questions, help you describe your project, and get you quoted fast.
        </p>
        <a href="/agent" class="btn" style="background: white; color: var(--primary);">Chat with Lil Beaver →</a>
      </div>
    </section>
    
    <!-- CTA -->
    <section class="container" style="margin-top: 4rem; text-align: center; padding-bottom: 2rem;">
      <h2 class="section-title">Ready to Get Started?</h2>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
        <a href="/quote" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem;">Get a Free Quote →</a>
        <a href="/pricing" class="btn btn-secondary" style="font-size: 1.1rem; padding: 1rem 2rem;">View Pricing</a>
      </div>
    </section>
  `;
  
  return c.html(layout('How It Works', content, 'how-it-works'));
};
