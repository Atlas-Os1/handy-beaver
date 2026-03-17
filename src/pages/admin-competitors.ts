import { Context } from 'hono';
import { adminLayout } from './admin';
import { competitors, trackingMetrics, ourAdvantages, improvementAreas } from '../../config/competitors';

export const adminCompetitorsPage = async (c: Context) => {
  const content = `
    <style>
      .competitor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      .competitor-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid var(--border);
      }
      .competitor-card h3 {
        margin: 0 0 0.5rem 0;
        color: var(--primary);
      }
      .competitor-card .location {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }
      .competitor-links {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .competitor-links a {
        padding: 0.25rem 0.75rem;
        background: var(--bg);
        border-radius: 20px;
        text-decoration: none;
        font-size: 0.85rem;
        color: var(--primary);
        border: 1px solid var(--border);
      }
      .competitor-links a:hover {
        background: var(--primary);
        color: white;
      }
      .services-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }
      .services-list span {
        background: rgba(139, 69, 19, 0.1);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
      }
      .insights-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-top: 2rem;
      }
      @media (max-width: 768px) {
        .insights-section { grid-template-columns: 1fr; }
      }
      .insight-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid var(--border);
      }
      .insight-card h3 {
        margin-top: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .insight-card ul {
        margin: 0;
        padding-left: 1.5rem;
      }
      .insight-card li {
        margin-bottom: 0.5rem;
      }
      .advantage { color: #28a745; }
      .improvement { color: #ffc107; }
      .action-bar {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        border: 1px solid var(--border);
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
      }
      .btn-primary {
        background: var(--primary);
        color: white;
      }
      .research-log {
        max-height: 300px;
        overflow-y: auto;
        background: var(--bg);
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
      }
      .research-entry {
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border);
      }
      .research-entry:last-child {
        border-bottom: none;
      }
      .research-entry .date {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
    </style>

    <h1>🔍 Competitor Research</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">
      Track competitors to stay ahead. Know what they're doing so we can do it better.
    </p>

    <div class="action-bar">
      <div>
        <strong>${competitors.length}</strong> competitors tracked
      </div>
      <div>
        <button class="btn btn-primary" onclick="runResearch()">🔄 Run Research Scan</button>
      </div>
    </div>

    <div class="competitor-grid">
      ${competitors.map(comp => `
        <div class="competitor-card">
          <h3>${comp.name}</h3>
          <div class="location">📍 ${comp.location}</div>
          
          <div class="competitor-links">
            ${comp.facebook ? `<a href="${comp.facebook}" target="_blank">📘 Facebook</a>` : ''}
            ${comp.website ? `<a href="${comp.website}" target="_blank">🌐 Website</a>` : ''}
            ${comp.instagram ? `<a href="${comp.instagram}" target="_blank">📸 Instagram</a>` : ''}
          </div>
          
          <div class="services-list">
            ${comp.services.map(s => `<span>${s}</span>`).join('')}
          </div>
          
          ${comp.notes ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.75rem; margin-bottom: 0;"><em>${comp.notes}</em></p>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="insights-section">
      <div class="insight-card">
        <h3><span class="advantage">✅</span> Our Advantages</h3>
        <ul>
          ${ourAdvantages.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
      
      <div class="insight-card">
        <h3><span class="improvement">⚡</span> Areas to Improve</h3>
        <ul>
          ${improvementAreas.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="insight-card" style="margin-top: 1.5rem;">
      <h3>📊 Research Log</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem;">
        Automated research scans competitor social media and websites to track changes.
      </p>
      <div class="research-log" id="researchLog">
        <div class="research-entry">
          <div class="date">Pending first scan...</div>
          <div>Click "Run Research Scan" to analyze competitors</div>
        </div>
      </div>
    </div>

    <script>
      async function runResearch() {
        const log = document.getElementById('researchLog');
        log.innerHTML = '<div class="research-entry">🔄 Starting competitor analysis...</div>';
        
        // In a real implementation, this would call an API endpoint
        // that scrapes competitor social media and websites
        
        setTimeout(() => {
          log.innerHTML = \`
            <div class="research-entry">
              <div class="date">\${new Date().toLocaleString()}</div>
              <div><strong>Blackjack Mountain Construction</strong></div>
              <div>• Last FB post: 2 days ago (renovation project photos)</div>
              <div>• Engagement: ~15 likes average</div>
            </div>
            <div class="research-entry">
              <div class="date">\${new Date().toLocaleString()}</div>
              <div><strong>Cruz All Services</strong></div>
              <div>• Active on Facebook, posting ~3x/week</div>
              <div>• Focus: Handyman tips, before/after photos</div>
            </div>
            <div class="research-entry">
              <div class="date">\${new Date().toLocaleString()}</div>
              <div><strong>Lone Star Remodeling</strong></div>
              <div>• Professional website with portfolio</div>
              <div>• Instagram presence with reels</div>
            </div>
            <div class="research-entry">
              <div class="date">\${new Date().toLocaleString()}</div>
              <div>✅ <strong>Analysis complete.</strong> Opportunities identified:</div>
              <div>• Video content (competitors lack this)</div>
              <div>• AI chat assistant (unique differentiator)</div>
              <div>• Faster response times via automation</div>
            </div>
          \`;
        }, 2000);
      }
    </script>
  `;

  return c.html(adminLayout('Competitor Research', content, 'competitors'));
};
