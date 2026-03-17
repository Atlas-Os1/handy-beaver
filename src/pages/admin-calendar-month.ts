import { Context } from 'hono';
import { adminLayout } from './admin';

export const adminCalendarMonthPage = async (c: Context) => {
  const admin = c.get('admin');

  const content = `
    <div class="calendar-month-page">
      <div class="calendar-header">
        <div>
          <h1>📅 Calendar</h1>
          <p>View and manage your schedule</p>
        </div>
        <div class="calendar-nav">
          <button class="btn btn-secondary" onclick="prevMonth()">← Prev</button>
          <span id="month-label" class="month-label">March 2026</span>
          <button class="btn btn-secondary" onclick="nextMonth()">Next →</button>
          <button class="btn btn-primary" onclick="goToday()">Today</button>
        </div>
      </div>

      <div class="calendar-grid" id="calendar-grid">
        <!-- Calendar will be rendered here -->
      </div>
      
      <!-- Day detail modal -->
      <div id="day-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="modal-date-label">March 17, 2026</h2>
            <button onclick="closeModal()" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div class="modal-section">
              <h3>📋 Scheduled Jobs</h3>
              <div id="modal-jobs"></div>
            </div>
            <div class="modal-section">
              <h3>📝 Day Notes</h3>
              <div class="form-group">
                <label>Hours Worked</label>
                <input type="number" id="modal-hours" step="0.5" min="0" max="24" placeholder="0">
              </div>
              <div class="form-group">
                <label>Jobs Completed</label>
                <input type="number" id="modal-jobs-completed" min="0" placeholder="0">
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea id="modal-note" rows="4" placeholder="Add notes for this day..."></textarea>
              </div>
              <button class="btn btn-primary" onclick="saveNote()">Save Notes</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .calendar-month-page { padding: 0; }
      
      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .calendar-header h1 { margin: 0; }
      .calendar-header p { color: #666; margin: 0.25rem 0 0; }
      
      .calendar-nav {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .month-label {
        font-size: 1.25rem;
        font-weight: 600;
        min-width: 150px;
        text-align: center;
      }
      
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        background: #f5f5f5;
        border-radius: 12px;
        padding: 4px;
      }
      
      .calendar-day-header {
        padding: 0.75rem 0.5rem;
        text-align: center;
        font-weight: 600;
        font-size: 0.85rem;
        color: #666;
        background: transparent;
      }
      
      .calendar-day {
        min-height: 100px;
        background: white;
        border-radius: 8px;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }
      
      .calendar-day:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transform: translateY(-1px);
      }
      
      .calendar-day.other-month {
        background: #fafafa;
        color: #aaa;
      }
      
      .calendar-day.today {
        border: 2px solid var(--primary, #8b4513);
      }
      
      .calendar-day.has-jobs {
        background: linear-gradient(135deg, #fff 0%, #e8f5e9 100%);
      }
      
      .calendar-day.has-notes {
        background: linear-gradient(135deg, #fff 0%, #fff3e0 100%);
      }
      
      .calendar-day.has-jobs.has-notes {
        background: linear-gradient(135deg, #e8f5e9 0%, #fff3e0 100%);
      }
      
      .day-number {
        font-weight: 600;
        font-size: 0.95rem;
        margin-bottom: 0.25rem;
      }
      
      .day-jobs {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .day-job {
        font-size: 0.7rem;
        padding: 2px 4px;
        background: #4CAF50;
        color: white;
        border-radius: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .day-job.pending { background: #FF9800; }
      .day-job.completed { background: #2196F3; }
      .day-job.cancelled { background: #9e9e9e; }
      
      .day-hours {
        position: absolute;
        bottom: 4px;
        right: 4px;
        font-size: 0.7rem;
        color: #666;
        background: rgba(255,255,255,0.9);
        padding: 2px 4px;
        border-radius: 4px;
      }
      
      .day-note-indicator {
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 0.7rem;
      }
      
      /* Modal */
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #eee;
      }
      
      .modal-header h2 { margin: 0; }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        line-height: 1;
      }
      
      .modal-body {
        padding: 1.5rem;
      }
      
      .modal-section {
        margin-bottom: 1.5rem;
      }
      
      .modal-section:last-child { margin-bottom: 0; }
      
      .modal-section h3 {
        font-size: 1rem;
        margin: 0 0 0.75rem;
        color: #333;
      }
      
      .form-group {
        margin-bottom: 1rem;
      }
      
      .form-group label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
      }
      
      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      
      .form-group textarea {
        resize: vertical;
      }
      
      .job-item {
        padding: 0.75rem;
        background: #f9f9f9;
        border-radius: 8px;
        margin-bottom: 0.5rem;
      }
      
      .job-item h4 {
        margin: 0 0 0.25rem;
        font-size: 0.95rem;
      }
      
      .job-item p {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
      }
      
      .no-jobs {
        color: #999;
        font-style: italic;
        font-size: 0.9rem;
      }
      
      @media (max-width: 768px) {
        .calendar-day { min-height: 60px; padding: 0.25rem; }
        .day-job { display: none; }
        .day-number { font-size: 0.85rem; }
        .calendar-header { flex-direction: column; align-items: flex-start; }
      }
    </style>

    <script>
      let currentYear = new Date().getFullYear();
      let currentMonth = new Date().getMonth() + 1;
      let selectedDate = null;
      let monthData = null;
      
      const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      function updateMonthLabel() {
        document.getElementById('month-label').textContent = MONTHS[currentMonth] + ' ' + currentYear;
      }
      
      function prevMonth() {
        currentMonth--;
        if (currentMonth < 1) {
          currentMonth = 12;
          currentYear--;
        }
        loadMonth();
      }
      
      function nextMonth() {
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
        loadMonth();
      }
      
      function goToday() {
        currentYear = new Date().getFullYear();
        currentMonth = new Date().getMonth() + 1;
        loadMonth();
      }
      
      async function loadMonth() {
        updateMonthLabel();
        
        const res = await fetch('/api/calendar/notes/month/' + currentYear + '/' + currentMonth);
        monthData = await res.json();
        
        renderCalendar();
      }
      
      function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const today = new Date().toISOString().split('T')[0];
        
        // Day headers
        let html = DAYS.map(d => '<div class="calendar-day-header">' + d + '</div>').join('');
        
        // First day of month (0 = Sunday)
        const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
        
        // Previous month padding
        const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
          const day = prevMonthDays - i;
          html += '<div class="calendar-day other-month"><div class="day-number">' + day + '</div></div>';
        }
        
        // Current month days
        const daysData = {};
        for (const day of monthData.days || []) {
          daysData[day.date] = day;
        }
        
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          const dayData = daysData[dateStr] || { date: dateStr, bookings: [], hours_worked: 0, note: null };
          
          const isToday = dateStr === today;
          const hasJobs = dayData.bookings.length > 0;
          const hasNotes = dayData.note || dayData.hours_worked > 0;
          
          let classes = 'calendar-day';
          if (isToday) classes += ' today';
          if (hasJobs) classes += ' has-jobs';
          if (hasNotes) classes += ' has-notes';
          
          html += '<div class="' + classes + '" onclick="openDay(\\'' + dateStr + '\\')">';
          html += '<div class="day-number">' + d + '</div>';
          
          if (dayData.note) {
            html += '<div class="day-note-indicator">📝</div>';
          }
          
          html += '<div class="day-jobs">';
          for (let i = 0; i < Math.min(dayData.bookings.length, 2); i++) {
            const job = dayData.bookings[i];
            const statusClass = job.status === 'completed' ? 'completed' : 
                               job.status === 'cancelled' ? 'cancelled' :
                               job.status === 'pending' ? 'pending' : '';
            html += '<div class="day-job ' + statusClass + '">' + (job.title || 'Job') + '</div>';
          }
          if (dayData.bookings.length > 2) {
            html += '<div class="day-job" style="background:#666;">+' + (dayData.bookings.length - 2) + ' more</div>';
          }
          html += '</div>';
          
          if (dayData.hours_worked > 0) {
            html += '<div class="day-hours">' + dayData.hours_worked + 'h</div>';
          }
          
          html += '</div>';
        }
        
        // Next month padding
        const totalCells = firstDayOfWeek + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remainingCells; i++) {
          html += '<div class="calendar-day other-month"><div class="day-number">' + i + '</div></div>';
        }
        
        grid.innerHTML = html;
      }
      
      function openDay(dateStr) {
        selectedDate = dateStr;
        const dayData = (monthData.days || []).find(d => d.date === dateStr) || {
          date: dateStr, bookings: [], hours_worked: 0, jobs_completed: 0, note: null
        };
        
        // Format date for display
        const dateObj = new Date(dateStr + 'T12:00:00');
        document.getElementById('modal-date-label').textContent = dateObj.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        // Jobs
        const jobsHtml = dayData.bookings.length === 0
          ? '<p class="no-jobs">No jobs scheduled</p>'
          : dayData.bookings.map(job => 
              '<div class="job-item">' +
              '<h4>' + (job.title || 'Scheduled Job') + '</h4>' +
              '<p>' + (job.customer_name || 'Customer') + ' · ' + (job.status || 'pending') + '</p>' +
              '</div>'
            ).join('');
        document.getElementById('modal-jobs').innerHTML = jobsHtml;
        
        // Form fields
        document.getElementById('modal-hours').value = dayData.hours_worked || '';
        document.getElementById('modal-jobs-completed').value = dayData.jobs_completed || '';
        document.getElementById('modal-note').value = dayData.note || '';
        
        document.getElementById('day-modal').style.display = 'flex';
      }
      
      function closeModal() {
        document.getElementById('day-modal').style.display = 'none';
        selectedDate = null;
      }
      
      async function saveNote() {
        if (!selectedDate) return;
        
        const hours = parseFloat(document.getElementById('modal-hours').value) || 0;
        const jobsCompleted = parseInt(document.getElementById('modal-jobs-completed').value) || 0;
        const note = document.getElementById('modal-note').value.trim() || null;
        
        const res = await fetch('/api/calendar/notes/' + selectedDate, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours_worked: hours, jobs_completed: jobsCompleted, note: note })
        });
        
        if (res.ok) {
          closeModal();
          loadMonth();
        } else {
          alert('Failed to save note');
        }
      }
      
      // Close modal on escape or outside click
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
      document.getElementById('day-modal').addEventListener('click', e => {
        if (e.target.id === 'day-modal') closeModal();
      });
      
      // Initial load
      loadMonth();
    </script>
  `;

  return c.html(adminLayout('Calendar', content, 'calendar', admin));
};
