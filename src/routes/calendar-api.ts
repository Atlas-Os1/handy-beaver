import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_ACCESS_TOKEN?: string;
};

export const calendarApi = new Hono<{ Bindings: Bindings }>();

// Token refresh helper
async function getAccessToken(env: Bindings): Promise<string | null> {
  // First try the stored access token
  if (env.GOOGLE_ACCESS_TOKEN) {
    return env.GOOGLE_ACCESS_TOKEN;
  }
  
  // Otherwise refresh using the refresh token
  if (!env.GOOGLE_REFRESH_TOKEN || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }
  
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: env.GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });
    
    const data = await res.json() as { access_token?: string };
    return data.access_token || null;
  } catch (e) {
    console.error('Failed to refresh token:', e);
    return null;
  }
}

// Get calendar events for a date range
calendarApi.get('/events', async (c) => {
  const from = c.req.query('from') || new Date().toISOString().split('T')[0];
  const to = c.req.query('to') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const accessToken = await getAccessToken(c.env);
  if (!accessToken) {
    return c.json({ error: 'Calendar not configured' }, 500);
  }
  
  const calendarId = 'primary';
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`);
  url.searchParams.set('timeMin', `${from}T00:00:00Z`);
  url.searchParams.set('timeMax', `${to}T23:59:59Z`);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!res.ok) {
    const error = await res.text();
    console.error('Calendar API error:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
  
  const data = await res.json() as { items?: any[] };
  
  return c.json({
    events: data.items?.map(e => ({
      id: e.id,
      title: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location,
      description: e.description,
    })) || [],
  });
});

// Check availability for a specific date
calendarApi.get('/availability', async (c) => {
  const date = c.req.query('date');
  if (!date) {
    return c.json({ error: 'Date required (YYYY-MM-DD)' }, 400);
  }
  
  const accessToken = await getAccessToken(c.env);
  if (!accessToken) {
    return c.json({ error: 'Calendar not configured' }, 500);
  }
  
  const calendarId = 'primary';
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`);
  url.searchParams.set('timeMin', `${date}T00:00:00Z`);
  url.searchParams.set('timeMax', `${date}T23:59:59Z`);
  url.searchParams.set('singleEvents', 'true');
  
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!res.ok) {
    return c.json({ error: 'Failed to check availability' }, 500);
  }
  
  const data = await res.json() as { items?: any[] };
  const events = data.items || [];
  
  // Define work hours (8 AM - 6 PM)
  const slots = [
    { time: '08:00', label: '8:00 AM', available: true },
    { time: '09:00', label: '9:00 AM', available: true },
    { time: '10:00', label: '10:00 AM', available: true },
    { time: '11:00', label: '11:00 AM', available: true },
    { time: '12:00', label: '12:00 PM', available: true },
    { time: '13:00', label: '1:00 PM', available: true },
    { time: '14:00', label: '2:00 PM', available: true },
    { time: '15:00', label: '3:00 PM', available: true },
    { time: '16:00', label: '4:00 PM', available: true },
    { time: '17:00', label: '5:00 PM', available: true },
  ];
  
  // Mark slots as unavailable if they overlap with events
  for (const event of events) {
    const startStr = event.start?.dateTime || `${date}T00:00:00`;
    const endStr = event.end?.dateTime || `${date}T23:59:59`;
    const eventStart = new Date(startStr);
    const eventEnd = new Date(endStr);
    
    for (const slot of slots) {
      const slotTime = new Date(`${date}T${slot.time}:00`);
      const slotEnd = new Date(slotTime.getTime() + 60 * 60 * 1000);
      
      // Check overlap
      if (slotTime < eventEnd && slotEnd > eventStart) {
        slot.available = false;
      }
    }
  }
  
  return c.json({
    date,
    slots: slots.filter(s => s.available),
    allDay: events.some(e => e.start?.date && !e.start?.dateTime),
  });
});

// Create calendar event for a booking
calendarApi.post('/events', async (c) => {
  const { booking_id, title, date, time, duration_hours, location, description, customer_name, customer_phone } = await c.req.json();
  
  const accessToken = await getAccessToken(c.env);
  if (!accessToken) {
    return c.json({ error: 'Calendar not configured' }, 500);
  }
  
  // Build event
  const startDateTime = time ? `${date}T${time}:00` : null;
  const endDateTime = startDateTime 
    ? new Date(new Date(startDateTime).getTime() + (duration_hours || 4) * 60 * 60 * 1000).toISOString()
    : null;
  
  const event = {
    summary: `🦫 ${title || 'Job'}${customer_name ? ` - ${customer_name}` : ''}`,
    location: location,
    description: [
      description,
      customer_name ? `Customer: ${customer_name}` : '',
      customer_phone ? `Phone: ${customer_phone}` : '',
      booking_id ? `Booking ID: ${booking_id}` : '',
    ].filter(Boolean).join('\n'),
    start: startDateTime ? { dateTime: startDateTime, timeZone: 'America/Chicago' } : { date },
    end: endDateTime ? { dateTime: endDateTime, timeZone: 'America/Chicago' } : { date },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 }, // 1 day before
      ],
    },
  };
  
  const calendarId = 'primary';
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  
  if (!res.ok) {
    const error = await res.text();
    console.error('Failed to create event:', error);
    return c.json({ error: 'Failed to create calendar event' }, 500);
  }
  
  const created = await res.json() as { id: string; htmlLink: string };
  
  // Update booking with calendar event ID if booking_id provided
  if (booking_id) {
    await c.env.DB.prepare(
      'UPDATE bookings SET notes = notes || ? WHERE id = ?'
    ).bind(`\n[Calendar Event: ${created.id}]`, booking_id).run();
  }
  
  return c.json({
    success: true,
    event_id: created.id,
    link: created.htmlLink,
  });
});

// Sync a booking to calendar
calendarApi.post('/sync/:booking_id', async (c) => {
  const bookingId = c.req.param('booking_id');
  
  // Get booking details
  const booking = await c.env.DB.prepare(`
    SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `).bind(bookingId).first<any>();
  
  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  
  // Create calendar event
  const result = await calendarApi.request(
    new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: booking.id,
        title: booking.title || booking.service_type,
        date: booking.scheduled_date,
        duration_hours: booking.estimated_hours || 4,
        location: booking.address,
        description: booking.description,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
      }),
    }),
    c.env
  );
  
  return result;
});

// Delete calendar event
calendarApi.delete('/events/:event_id', async (c) => {
  const eventId = c.req.param('event_id');
  
  const accessToken = await getAccessToken(c.env);
  if (!accessToken) {
    return c.json({ error: 'Calendar not configured' }, 500);
  }
  
  const calendarId = 'primary';
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!res.ok && res.status !== 404) {
    return c.json({ error: 'Failed to delete event' }, 500);
  }
  
  return c.json({ success: true });
});
