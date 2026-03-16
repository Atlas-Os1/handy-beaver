import { Context } from 'hono';
import { layout } from '../lib/html';
import { siteConfig } from '../../config/site.config';

const { pricing, business } = siteConfig;

export const quotePage = (c: Context) => {
  const content = `
    <style>
      .quote-container {
        max-width: 700px;
        margin: 0 auto;
      }
      
      .quote-step {
        display: none;
      }
      
      .quote-step.active {
        display: block;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .service-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
      }
      
      .service-option {
        background: #f5f5f5;
        border: 3px solid transparent;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .service-option:hover {
        border-color: var(--secondary);
        transform: translateY(-3px);
      }
      
      .service-option.selected {
        border-color: var(--primary);
        background: #fff5e6;
      }
      
      .service-option .icon {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        display: block;
      }
      
      .size-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 2rem 0;
      }
      
      .size-option {
        background: #f5f5f5;
        border: 3px solid transparent;
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .size-option:hover {
        border-color: var(--secondary);
      }
      
      .size-option.selected {
        border-color: var(--primary);
        background: #fff5e6;
      }
      
      .timeline-options {
        display: flex;
        gap: 1rem;
        margin: 2rem 0;
        flex-wrap: wrap;
      }
      
      .timeline-option {
        flex: 1;
        min-width: 120px;
        background: #f5f5f5;
        border: 3px solid transparent;
        border-radius: 12px;
        padding: 1.25rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .timeline-option:hover {
        border-color: var(--secondary);
      }
      
      .timeline-option.selected {
        border-color: var(--primary);
        background: #fff5e6;
      }
      
      .estimate-display {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        padding: 2rem;
        border-radius: 16px;
        text-align: center;
        margin: 2rem 0;
      }
      
      .estimate-display .amount {
        font-size: 3rem;
        font-family: 'Playfair Display', serif;
        font-weight: 700;
      }
      
      .estimate-display .note {
        font-size: 0.9rem;
        opacity: 0.9;
        margin-top: 0.5rem;
      }
      
      .progress-bar {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
      }
      
      .progress-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ddd;
        transition: all 0.3s;
      }
      
      .progress-dot.active {
        background: var(--primary);
        transform: scale(1.2);
      }
      
      .progress-dot.completed {
        background: var(--secondary);
      }
      
      .quote-nav {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
      }
      
      .quote-form-group {
        margin-bottom: 1.5rem;
      }
      
      .quote-form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--primary);
      }
      
      .quote-form-group input {
        width: 100%;
        padding: 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s;
      }
      
      .quote-form-group input:focus {
        outline: none;
        border-color: var(--primary);
      }
      
      @media (max-width: 600px) {
        .service-options {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .timeline-options {
          flex-direction: column;
        }
        
        .estimate-display .amount {
          font-size: 2rem;
        }
      }
    </style>
    
    <section style="padding: 3rem 2rem; text-align: center; background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);">
      <h1 class="section-title" style="font-size: 2.5rem;">💰 Instant Quote Calculator</h1>
      <p class="section-subtitle" style="font-size: 1.1rem;">Get a quick estimate in under 60 seconds</p>
    </section>
    
    <section class="container">
      <div class="quote-container">
        <div class="card">
          <div class="progress-bar">
            <div class="progress-dot active" id="dot-1"></div>
            <div class="progress-dot" id="dot-2"></div>
            <div class="progress-dot" id="dot-3"></div>
            <div class="progress-dot" id="dot-4"></div>
          </div>
          
          <!-- Step 1: Service Type -->
          <div class="quote-step active" id="step-1">
            <h2 style="text-align: center; color: var(--primary); margin-bottom: 0.5rem;">What type of project?</h2>
            <p style="text-align: center; color: #666; margin-bottom: 1rem;">Select the service you need</p>
            
            <div class="service-options">
              <div class="service-option" data-service="deck" onclick="selectService(this)">
                <span class="icon">🪵</span>
                <strong>Deck Repair</strong>
              </div>
              <div class="service-option" data-service="flooring" onclick="selectService(this)">
                <span class="icon">🏠</span>
                <strong>Flooring</strong>
              </div>
              <div class="service-option" data-service="trim" onclick="selectService(this)">
                <span class="icon">🔨</span>
                <strong>Trim Carpentry</strong>
              </div>
              <div class="service-option" data-service="maintenance" onclick="selectService(this)">
                <span class="icon">🔧</span>
                <strong>Maintenance</strong>
              </div>
              <div class="service-option" data-service="painting" onclick="selectService(this)">
                <span class="icon">🎨</span>
                <strong>Painting</strong>
              </div>
              <div class="service-option" data-service="other" onclick="selectService(this)">
                <span class="icon">📋</span>
                <strong>Other</strong>
              </div>
            </div>
            
            <div class="quote-nav">
              <div></div>
              <button class="btn btn-primary" onclick="nextStep()" id="next-1" disabled>Next →</button>
            </div>
          </div>
          
          <!-- Step 2: Project Size -->
          <div class="quote-step" id="step-2">
            <h2 style="text-align: center; color: var(--primary); margin-bottom: 0.5rem;">How big is the project?</h2>
            <p style="text-align: center; color: #666; margin-bottom: 1rem;">Estimate the scope of work</p>
            
            <div class="size-options">
              <div class="size-option" data-size="small" data-hours="3" onclick="selectSize(this)">
                <div>
                  <strong style="font-size: 1.1rem;">Small</strong>
                  <p style="color: #666; margin: 0;">Quick fix, ~2-4 hours</p>
                </div>
                <span style="font-size: 1.5rem;">📦</span>
              </div>
              <div class="size-option" data-size="medium" data-hours="6" onclick="selectSize(this)">
                <div>
                  <strong style="font-size: 1.1rem;">Medium</strong>
                  <p style="color: #666; margin: 0;">Half-day to full day</p>
                </div>
                <span style="font-size: 1.5rem;">📦📦</span>
              </div>
              <div class="size-option" data-size="large" data-hours="16" onclick="selectSize(this)">
                <div>
                  <strong style="font-size: 1.1rem;">Large</strong>
                  <p style="color: #666; margin: 0;">2-2.5 days</p>
                </div>
                <span style="font-size: 1.5rem;">📦📦📦</span>
              </div>
              <div class="size-option" data-size="xlarge" data-hours="24" onclick="selectSize(this)">
                <div>
                  <strong style="font-size: 1.1rem;">Multi-Day Project</strong>
                  <p style="color: #666; margin: 0;">3+ days — custom quote</p>
                </div>
                <span style="font-size: 1.5rem;">🏗️</span>
              </div>
            </div>
            
            <div class="quote-nav">
              <button class="btn btn-secondary" onclick="prevStep()">← Back</button>
              <button class="btn btn-primary" onclick="nextStep()" id="next-2" disabled>Next →</button>
            </div>
          </div>
          
          <!-- Step 3: Timeline -->
          <div class="quote-step" id="step-3">
            <h2 style="text-align: center; color: var(--primary); margin-bottom: 0.5rem;">When do you need it done?</h2>
            <p style="text-align: center; color: #666; margin-bottom: 1rem;">Select your preferred timeline</p>
            
            <div class="timeline-options">
              <div class="timeline-option" data-timeline="flexible" onclick="selectTimeline(this)">
                <span style="font-size: 1.5rem;">📅</span>
                <strong>Flexible</strong>
                <p style="color: #666; margin: 0; font-size: 0.85rem;">Next available</p>
              </div>
              <div class="timeline-option" data-timeline="soon" onclick="selectTimeline(this)">
                <span style="font-size: 1.5rem;">⚡</span>
                <strong>Soon</strong>
                <p style="color: #666; margin: 0; font-size: 0.85rem;">Within 2 weeks</p>
              </div>
              <div class="timeline-option" data-timeline="urgent" onclick="selectTimeline(this)">
                <span style="font-size: 1.5rem;">🚨</span>
                <strong>Urgent</strong>
                <p style="color: #666; margin: 0; font-size: 0.85rem;">ASAP</p>
              </div>
            </div>
            
            <!-- Estimate Display -->
            <div class="estimate-display" id="estimate-display" style="display: none;">
              <p style="margin-bottom: 0.5rem;">Estimated Cost</p>
              <div class="amount" id="estimate-amount">$175 - $300</div>
              <p class="note">*Labor only. Materials priced separately.</p>
            </div>
            
            <div class="quote-nav">
              <button class="btn btn-secondary" onclick="prevStep()">← Back</button>
              <button class="btn btn-primary" onclick="nextStep()" id="next-3" disabled>Get My Quote →</button>
            </div>
          </div>
          
          <!-- Step 4: Contact Info -->
          <div class="quote-step" id="step-4">
            <h2 style="text-align: center; color: var(--primary); margin-bottom: 0.5rem;">Almost done! 🎉</h2>
            <p style="text-align: center; color: #666; margin-bottom: 1.5rem;">Enter your info to receive your personalized quote</p>
            
            <div class="estimate-display">
              <p style="margin-bottom: 0.5rem;">Your Estimate</p>
              <div class="amount" id="final-estimate">$175 - $300</div>
              <p class="note" id="estimate-details"></p>
            </div>
            
            <form id="quote-form" onsubmit="submitQuote(event)">
              <div class="quote-form-group">
                <label for="name">Your Name *</label>
                <input type="text" id="name" name="name" required placeholder="John Smith">
              </div>
              
              <div class="quote-form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required placeholder="john@example.com">
              </div>
              
              <div class="quote-form-group">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" name="phone" placeholder="(555) 123-4567">
              </div>
              
              <div class="quote-form-group">
                <label for="details">Project Details (optional)</label>
                <textarea id="details" name="details" rows="3" style="width: 100%; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; resize: vertical;" placeholder="Describe your project..."></textarea>
              </div>
              
              <div class="quote-nav">
                <button type="button" class="btn btn-secondary" onclick="prevStep()">← Back</button>
                <button type="submit" class="btn btn-primary" id="submit-btn">Submit Quote Request</button>
              </div>
            </form>
          </div>
          
          <!-- Success State -->
          <div class="quote-step" id="step-success">
            <div style="text-align: center; padding: 2rem 0;">
              <span style="font-size: 5rem;">🦫</span>
              <h2 style="color: var(--primary); margin: 1rem 0;">Quote Request Received!</h2>
              <p style="color: #666; max-width: 400px; margin: 0 auto 2rem;">We'll review your project and get back to you within 24 hours with a detailed quote.</p>
              
              <div class="estimate-display">
                <p style="margin-bottom: 0.5rem;">Your Estimate</p>
                <div class="amount" id="success-estimate">$175 - $300</div>
              </div>
              
              <div style="margin-top: 2rem;">
                <a href="/" class="btn btn-secondary" style="margin-right: 1rem;">Back to Home</a>
                <a href="tel:${business.phone}" class="btn btn-primary">📞 Call Now</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <script>
      let currentStep = 1;
      let quoteData = {
        service: null,
        size: null,
        timeline: null,
        hours: 0
      };
      
      const pricing = {
        halfDay: ${pricing.labor.underSixHours},
        fullDay: ${pricing.labor.overSixHours}
      };
      
      function selectService(el) {
        document.querySelectorAll('#step-1 .service-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        quoteData.service = el.dataset.service;
        document.getElementById('next-1').disabled = false;
      }
      
      function selectSize(el) {
        document.querySelectorAll('#step-2 .size-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        quoteData.size = el.dataset.size;
        quoteData.hours = parseInt(el.dataset.hours);
        document.getElementById('next-2').disabled = false;
      }
      
      function selectTimeline(el) {
        document.querySelectorAll('#step-3 .timeline-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        quoteData.timeline = el.dataset.timeline;
        document.getElementById('next-3').disabled = false;
        
        // Show estimate
        updateEstimate();
        document.getElementById('estimate-display').style.display = 'block';
      }
      
      function updateEstimate() {
        let min, max;
        let isCustomQuote = false;
        
        // Check for large deck/multi-day projects that require custom quotes
        if (quoteData.size === 'xlarge' || (quoteData.service === 'deck' && quoteData.size === 'large')) {
          // Multi-day deck jobs or 3+ day projects: $1,500+
          min = 1500;
          max = null; // Custom quote
          isCustomQuote = true;
        } else if (quoteData.hours <= 4) {
          min = pricing.halfDay;
          max = pricing.halfDay;
        } else if (quoteData.hours <= 8) {
          min = pricing.halfDay;
          max = pricing.fullDay;
        } else if (quoteData.hours <= 20) {
          // Up to ~2.5 days (handyman rate)
          const days = Math.ceil(quoteData.hours / 8);
          min = pricing.fullDay * (days - 1);
          max = pricing.fullDay * days;
        } else {
          // Over 2.5 days: custom quote territory
          min = 1500;
          max = null;
          isCustomQuote = true;
        }
        
        // Urgency premium (only for standard quotes)
        if (!isCustomQuote && quoteData.timeline === 'urgent') {
          min = Math.round(min * 1.15);
          if (max) max = Math.round(max * 1.15);
        }
        
        let estimate;
        if (isCustomQuote) {
          estimate = '$' + min + '+';
        } else {
          estimate = min === max ? '$' + min : '$' + min + ' - $' + max;
        }
        
        document.getElementById('estimate-amount').textContent = estimate;
        document.getElementById('final-estimate').textContent = estimate;
        document.getElementById('success-estimate').textContent = estimate;
        
        const sizeText = { small: 'Small project', medium: 'Medium project', large: 'Large project (2-2.5 days)', xlarge: 'Multi-day project (custom quote)' };
        const timeText = { flexible: 'Flexible timing', soon: 'Within 2 weeks', urgent: 'Urgent (rush fee may apply)' };
        
        let detailsText = (sizeText[quoteData.size] || 'Project') + ' • ' + (timeText[quoteData.timeline] || '');
        if (isCustomQuote) {
          detailsText += ' • We\\'ll provide a detailed custom quote';
        }
        document.getElementById('estimate-details').textContent = detailsText;
      }
      
      function nextStep() {
        document.getElementById('step-' + currentStep).classList.remove('active');
        document.getElementById('dot-' + currentStep).classList.remove('active');
        document.getElementById('dot-' + currentStep).classList.add('completed');
        
        currentStep++;
        
        document.getElementById('step-' + currentStep).classList.add('active');
        document.getElementById('dot-' + currentStep).classList.add('active');
        
        if (currentStep === 4) {
          updateEstimate();
        }
      }
      
      function prevStep() {
        document.getElementById('step-' + currentStep).classList.remove('active');
        document.getElementById('dot-' + currentStep).classList.remove('active');
        
        currentStep--;
        
        document.getElementById('step-' + currentStep).classList.add('active');
        document.getElementById('dot-' + currentStep).classList.add('active');
        document.getElementById('dot-' + (currentStep + 1)).classList.remove('completed');
      }
      
      async function submitQuote(e) {
        e.preventDefault();
        
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = 'Submitting...';
        
        const formData = {
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value,
          details: document.getElementById('details').value,
          service: quoteData.service,
          size: quoteData.size,
          timeline: quoteData.timeline,
          estimated_cost: document.getElementById('final-estimate').textContent
        };
        
        try {
          const res = await fetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          
          if (res.ok) {
            // Show success
            document.getElementById('step-4').classList.remove('active');
            document.getElementById('dot-4').classList.remove('active');
            document.getElementById('dot-4').classList.add('completed');
            document.getElementById('step-success').classList.add('active');
          } else {
            throw new Error('Failed to submit');
          }
        } catch (err) {
          alert('Something went wrong. Please try again or call us directly.');
          btn.disabled = false;
          btn.textContent = 'Submit Quote Request';
        }
      }
    </script>
  `;
  
  return c.html(layout('Instant Quote Calculator', content, 'quote'));
};
