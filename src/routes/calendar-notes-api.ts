import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

type CalendarNote = {
  id: number;
  date: string;
  hours_worked: number;
  jobs_completed: number;
  note: string | null;
  created_at: number;
  updated_at: number;
};

export const calendarNotesApi = new Hono<{ Bindings: Bindings }>();

// Get notes for a date range (for month view)
calendarNotesApi.get('/range', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  
  if (!from || !to) {
    return c.json({ error: 'from and to dates required (YYYY-MM-DD)' }, 400);
  }
  
  const notes = await c.env.DB.prepare(`
    SELECT * FROM calendar_notes
    WHERE date >= ? AND date <= ?
    ORDER BY date ASC
  `).bind(from, to).all<CalendarNote>();
  
  return c.json({ notes: notes.results || [] });
});

// Get note for a specific date
calendarNotesApi.get('/:date', async (c) => {
  const date = c.req.param('date');
  
  const note = await c.env.DB.prepare(`
    SELECT * FROM calendar_notes WHERE date = ?
  `).bind(date).first<CalendarNote>();
  
  if (!note) {
    return c.json({ 
      date,
      hours_worked: 0,
      jobs_completed: 0,
      note: null
    });
  }
  
  return c.json(note);
});

// Create or update note for a date
calendarNotesApi.post('/:date', async (c) => {
  const date = c.req.param('date');
  const body = await c.req.json<{
    hours_worked?: number;
    jobs_completed?: number;
    note?: string;
  }>();
  
  const now = Math.floor(Date.now() / 1000);
  
  // Upsert - try insert, on conflict update
  await c.env.DB.prepare(`
    INSERT INTO calendar_notes (date, hours_worked, jobs_completed, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      hours_worked = COALESCE(excluded.hours_worked, hours_worked),
      jobs_completed = COALESCE(excluded.jobs_completed, jobs_completed),
      note = COALESCE(excluded.note, note),
      updated_at = excluded.updated_at
  `).bind(
    date,
    body.hours_worked ?? 0,
    body.jobs_completed ?? 0,
    body.note ?? null,
    now,
    now
  ).run();
  
  const updated = await c.env.DB.prepare(`
    SELECT * FROM calendar_notes WHERE date = ?
  `).bind(date).first<CalendarNote>();
  
  return c.json({ success: true, note: updated });
});

// Delete note for a date
calendarNotesApi.delete('/:date', async (c) => {
  const date = c.req.param('date');
  
  await c.env.DB.prepare(`
    DELETE FROM calendar_notes WHERE date = ?
  `).bind(date).run();
  
  return c.json({ success: true });
});

// Get month summary (for calendar grid)
calendarNotesApi.get('/month/:year/:month', async (c) => {
  const year = parseInt(c.req.param('year'));
  const month = parseInt(c.req.param('month'));
  
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return c.json({ error: 'Invalid year or month' }, 400);
  }
  
  // Get first and last day of month
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
  
  // Get notes for the month
  const notes = await c.env.DB.prepare(`
    SELECT * FROM calendar_notes
    WHERE date >= ? AND date <= ?
    ORDER BY date ASC
  `).bind(firstDay, lastDay).all<CalendarNote>();
  
  // Get bookings for the month
  const bookings = await c.env.DB.prepare(`
    SELECT b.id, b.title, b.service_type, b.scheduled_date, b.status,
           c.name as customer_name
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.scheduled_date >= ? AND b.scheduled_date <= ?
    ORDER BY b.scheduled_date ASC
  `).bind(firstDay, lastDay).all<any>();
  
  // Build day-by-day map
  const days: Record<string, {
    date: string;
    hours_worked: number;
    jobs_completed: number;
    note: string | null;
    bookings: any[];
  }> = {};
  
  // Initialize all days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days[dateStr] = {
      date: dateStr,
      hours_worked: 0,
      jobs_completed: 0,
      note: null,
      bookings: []
    };
  }
  
  // Add notes
  for (const note of notes.results || []) {
    if (days[note.date]) {
      days[note.date].hours_worked = note.hours_worked;
      days[note.date].jobs_completed = note.jobs_completed;
      days[note.date].note = note.note;
    }
  }
  
  // Add bookings
  for (const booking of bookings.results || []) {
    if (booking.scheduled_date && days[booking.scheduled_date]) {
      days[booking.scheduled_date].bookings.push({
        id: booking.id,
        title: booking.title || booking.service_type,
        customer_name: booking.customer_name,
        status: booking.status
      });
    }
  }
  
  return c.json({
    year,
    month,
    firstDay,
    lastDay,
    days: Object.values(days)
  });
});
