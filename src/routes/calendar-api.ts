import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_ACCESS_TOKEN?: string;
  GOOGLE_CALENDAR_ID?: string;
  CALENDAR_WEBHOOK_SECRET?: string;
};

type GoogleEventMeta = {
  id: string | null;
  link: string | null;
};

type CreateEventInput = {
  booking_id?: number;
  title?: string;
  date: string;
  time?: string;
  duration_hours?: number;
  location?: string;
  description?: string;
  customer_name?: string;
  customer_phone?: string;
};

type CalendarConflict = {
  source: 'app' | 'google';
  id: string;
  title: string;
  start?: string;
  end?: string;
};

export const calendarApi = new Hono<{ Bindings: Bindings }>();

function getCalendarId(env: Bindings): string {
  return env.GOOGLE_CALENDAR_ID || 'primary';
}

function parseGoogleEventMeta(notes?: string | null): GoogleEventMeta {
  if (!notes) return { id: null, link: null };

  const idMatch = notes.match(/\[GoogleCalendarEventId:\s*([^\]]+)\]/i);
  const linkMatch = notes.match(/\[GoogleCalendarEventLink:\s*([^\]]+)\]/i);

  return {
    id: idMatch?.[1]?.trim() || null,
    link: linkMatch?.[1]?.trim() || null,
  };
}

async function getAccessToken(env: Bindings): Promise<string | null> {
  // Always use refresh flow - static GOOGLE_ACCESS_TOKEN expires after 1hr
  // if (env.GOOGLE_ACCESS_TOKEN) return env.GOOGLE_ACCESS_TOKEN;
  if (!env.GOOGLE_REFRESH_TOKEN || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;

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
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch (e) {
    console.error('Failed to refresh token:', e);
    return null;
  }
}

async function listGoogleEvents(env: Bindings, from: string, to: string) {
  const accessToken = await getAccessToken(env);
  if (!accessToken) return { error: 'Calendar not configured' as const };

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(getCalendarId(env))}/events`);
  url.searchParams.set('timeMin', `${from}T00:00:00Z`);
  url.searchParams.set('timeMax', `${to}T23:59:59Z`);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('showDeleted', 'true');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Calendar API error:', res.status, error);
    return { error: `Calendar error: ${res.status}` as const };
  }

  const data = (await res.json()) as { items?: any[] };
  return { events: data.items || [] };
}

export async function detectSchedulingConflicts(env: Bindings, bookingId: number, date: string): Promise<CalendarConflict[]> {
  const conflicts: CalendarConflict[] = [];

  const appConflicts = await env.DB.prepare(`
    SELECT id, title, scheduled_date
    FROM bookings
    WHERE id != ?
      AND status IN ('confirmed', 'in_progress')
      AND scheduled_date = ?
  `).bind(bookingId, date).all<any>();

  for (const booking of appConflicts.results || []) {
    conflicts.push({
      source: 'app',
      id: String(booking.id),
      title: booking.title || 'Scheduled job',
      start: booking.scheduled_date,
      end: booking.scheduled_date,
    });
  }

  const googleRes = await listGoogleEvents(env, date, date);
  if (!('error' in googleRes)) {
    for (const event of googleRes.events) {
      if (event.status === 'cancelled') continue;
      conflicts.push({
        source: 'google',
        id: event.id,
        title: event.summary || 'Google Calendar event',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
      });
    }
  }

  return conflicts;
}

async function createGoogleEvent(env: Bindings, input: CreateEventInput) {
  const accessToken = await getAccessToken(env);
  if (!accessToken) {
    return { error: 'Calendar not configured' as const };
  }

  const startDateTime = input.time ? `${input.date}T${input.time}:00` : null;
  const endDateTime = startDateTime
    ? new Date(new Date(startDateTime).getTime() + (input.duration_hours || 4) * 60 * 60 * 1000).toISOString()
    : null;

  const event = {
    summary: `🦫 ${input.title || 'Job'}${input.customer_name ? ` - ${input.customer_name}` : ''}`,
    location: input.location,
    description: [
      input.description,
      input.customer_name ? `Customer: ${input.customer_name}` : '',
      input.customer_phone ? `Phone: ${input.customer_phone}` : '',
      input.booking_id ? `Booking ID: ${input.booking_id}` : '',
    ].filter(Boolean).join('\n'),
    start: startDateTime ? { dateTime: startDateTime, timeZone: 'America/Chicago' } : { date: input.date },
    end: endDateTime ? { dateTime: endDateTime, timeZone: 'America/Chicago' } : { date: input.date },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 },
      ],
    },
  };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(getCalendarId(env))}/events`, {
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
    return { error: 'Failed to create calendar event' as const };
  }

  const created = (await res.json()) as { id: string; htmlLink: string };

  if (input.booking_id) {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(`
      UPDATE bookings
      SET google_event_id = ?,
          google_event_link = ?,
          calendar_sync_status = 'synced',
          calendar_last_synced_at = ?,
          notes = COALESCE(notes, '') || ?
      WHERE id = ?
    `).bind(
      created.id,
      created.htmlLink,
      now,
      `\n[GoogleCalendarEventId: ${created.id}]\n[GoogleCalendarEventLink: ${created.htmlLink}]`,
      input.booking_id,
    ).run();
  }

  return {
    event_id: created.id,
    link: created.htmlLink,
  };
}

export async function backSyncGoogleCalendarToBookings(env: Bindings) {
  const from = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const eventRes = await listGoogleEvents(env, from, to);

  if ('error' in eventRes) {
    return { success: false, synced: 0, error: eventRes.error };
  }

  let synced = 0;
  const now = Math.floor(Date.now() / 1000);

  for (const event of eventRes.events) {
    if (!event.id) continue;

    const booking = await env.DB.prepare(
      'SELECT id, scheduled_date, status FROM bookings WHERE google_event_id = ?'
    ).bind(event.id).first<any>();

    if (!booking) continue;

    if (event.status === 'cancelled') {
      await env.DB.prepare(`
        UPDATE bookings
        SET calendar_sync_status = 'cancelled',
            calendar_last_synced_at = ?,
            notes = COALESCE(notes, '') || ?
        WHERE id = ?
      `).bind(now, `\n[Google calendar event cancelled: ${event.id}]`, booking.id).run();
      synced += 1;
      continue;
    }

    const eventDate = (event.start?.dateTime || event.start?.date || '').split('T')[0] || booking.scheduled_date;

    await env.DB.prepare(`
      UPDATE bookings
      SET scheduled_date = ?,
          calendar_sync_status = 'synced',
          calendar_last_synced_at = ?
      WHERE id = ?
    `).bind(eventDate, now, booking.id).run();

    synced += 1;
  }

  return { success: true, synced };
}

calendarApi.post('/webhook/google', async (c) => {
  const secret = c.req.query('secret') || c.req.header('x-calendar-webhook-secret');
  if (!c.env.CALENDAR_WEBHOOK_SECRET || secret !== c.env.CALENDAR_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized webhook' }, 401);
  }

  const result = await backSyncGoogleCalendarToBookings(c.env);
  return c.json(result);
});

calendarApi.post('/sync/run', async (c) => {
  const secret = c.req.query('secret') || c.req.header('x-calendar-webhook-secret');
  if (c.env.CALENDAR_WEBHOOK_SECRET && secret !== c.env.CALENDAR_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized sync trigger' }, 401);
  }

  const result = await backSyncGoogleCalendarToBookings(c.env);
  return c.json(result);
});

calendarApi.get('/bookings', async (c) => {
  const from = c.req.query('from') || new Date().toISOString().split('T')[0];
  const to = c.req.query('to') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const rows = await c.env.DB.prepare(`
    SELECT b.id, b.title, b.service_type, b.scheduled_date,
           b.google_event_id, b.google_event_link, b.calendar_sync_status, b.calendar_last_synced_at, b.notes,
           c.name as customer_name, c.address
    FROM bookings b
    JOIN customers c ON c.id = b.customer_id
    WHERE b.scheduled_date IS NOT NULL
      AND b.scheduled_date >= ?
      AND b.scheduled_date <= ?
    ORDER BY b.scheduled_date ASC
  `).bind(from, to).all<any>();

  return c.json({
    bookings: (rows.results || []).map((booking: any) => {
      const legacyMeta = parseGoogleEventMeta(booking.notes);
      return {
        id: booking.id,
        title: booking.title,
        service_type: booking.service_type,
        scheduled_date: booking.scheduled_date,
        customer_name: booking.customer_name,
        address: booking.address,
        google_event_id: booking.google_event_id || legacyMeta.id,
        google_event_link: booking.google_event_link || legacyMeta.link,
        calendar_sync_status: booking.calendar_sync_status || (booking.google_event_id || legacyMeta.id ? 'synced' : 'not_synced'),
        calendar_last_synced_at: booking.calendar_last_synced_at,
      };
    }),
  });
});

calendarApi.get('/events', async (c) => {
  const from = c.req.query('from') || new Date().toISOString().split('T')[0];
  const to = c.req.query('to') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const result = await listGoogleEvents(c.env, from, to);
  if ('error' in result) return c.json({ error: result.error }, 500);

  return c.json({
    events: result.events.map((e) => ({
      id: e.id,
      title: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location,
      description: e.description,
      status: e.status,
    })),
  });
});

calendarApi.get('/availability', async (c) => {
  const date = c.req.query('date');
  if (!date) return c.json({ error: 'Date required (YYYY-MM-DD)' }, 400);

  const result = await listGoogleEvents(c.env, date, date);
  if ('error' in result) return c.json({ error: result.error }, 500);

  const events = result.events.filter((e) => e.status !== 'cancelled');
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

  for (const event of events) {
    const eventStart = new Date(event.start?.dateTime || `${date}T00:00:00`);
    const eventEnd = new Date(event.end?.dateTime || `${date}T23:59:59`);

    for (const slot of slots) {
      const slotTime = new Date(`${date}T${slot.time}:00`);
      const slotEnd = new Date(slotTime.getTime() + 60 * 60 * 1000);
      if (slotTime < eventEnd && slotEnd > eventStart) slot.available = false;
    }
  }

  return c.json({
    date,
    slots: slots.filter((s) => s.available),
    allDay: events.some((e) => e.start?.date && !e.start?.dateTime),
  });
});

calendarApi.post('/events', async (c) => {
  const payload = (await c.req.json()) as CreateEventInput;
  if (!payload.date) return c.json({ error: 'date is required' }, 400);

  const result = await createGoogleEvent(c.env, payload);
  if ('error' in result) return c.json({ error: result.error }, 500);

  return c.json({ success: true, ...result });
});

calendarApi.post('/sync/:booking_id', async (c) => {
  const bookingId = c.req.param('booking_id');

  const booking = await c.env.DB.prepare(`
    SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.address
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `).bind(bookingId).first<any>();

  if (!booking) return c.json({ error: 'Booking not found' }, 404);
  if (!booking.scheduled_date) return c.json({ error: 'Booking has no scheduled date' }, 400);

  const existingGoogleEvent = booking.google_event_id || parseGoogleEventMeta(booking.notes).id;
  if (existingGoogleEvent) {
    return c.json({ success: true, event_id: existingGoogleEvent, message: 'Booking is already synced' });
  }

  const result = await createGoogleEvent(c.env, {
    booking_id: booking.id,
    title: booking.title || booking.service_type,
    date: booking.scheduled_date,
    duration_hours: booking.estimated_hours || 4,
    location: booking.address,
    description: booking.description,
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone,
  });

  if ('error' in result) return c.json({ error: result.error }, 500);

  return c.json({ success: true, ...result });
});

calendarApi.delete('/events/:event_id', async (c) => {
  const eventId = c.req.param('event_id');

  const accessToken = await getAccessToken(c.env);
  if (!accessToken) return c.json({ error: 'Calendar not configured' }, 500);

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(getCalendarId(c.env))}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) return c.json({ error: 'Failed to delete event' }, 500);
  return c.json({ success: true });
});

// Debug endpoint to check calendar config
calendarApi.get('/status', async (c) => {
  const hasClientId = !!c.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!c.env.GOOGLE_CLIENT_SECRET;
  const hasRefreshToken = !!c.env.GOOGLE_REFRESH_TOKEN;
  const hasAccessToken = !!c.env.GOOGLE_ACCESS_TOKEN;
  const calendarId = c.env.GOOGLE_CALENDAR_ID || 'primary';
  
  // Try to get access token
  let tokenStatus = 'not_configured';
  let tokenError = null;
  
  if (hasRefreshToken && hasClientId && hasClientSecret) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: c.env.GOOGLE_CLIENT_ID!,
          client_secret: c.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: c.env.GOOGLE_REFRESH_TOKEN!,
          grant_type: 'refresh_token',
        }),
      });
      const data = await res.json() as any;
      if (data.access_token) {
        tokenStatus = 'valid';
      } else {
        tokenStatus = 'invalid';
        tokenError = data.error_description || data.error;
      }
    } catch (e: any) {
      tokenStatus = 'error';
      tokenError = e.message;
    }
  } else if (hasAccessToken) {
    tokenStatus = 'static_token';
  }
  
  return c.json({
    config: {
      hasClientId,
      hasClientSecret,
      hasRefreshToken,
      hasAccessToken,
      calendarId,
    },
    tokenStatus,
    tokenError,
  });
});
