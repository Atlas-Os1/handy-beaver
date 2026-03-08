import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
  VOICE_AGENT_API_KEY?: string;
};

export const voiceApi = new Hono<{ Bindings: Bindings }>();

// Auth middleware for ElevenLabs webhook calls
voiceApi.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  
  // Allow if API key matches or if coming from ElevenLabs (check agent header)
  const agentId = c.req.header('X-Agent-ID');
  
  if (c.env.VOICE_AGENT_API_KEY && apiKey !== c.env.VOICE_AGENT_API_KEY && !agentId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
});

// ============ TOOL: lookup_customer ============
voiceApi.post('/lookup', async (c) => {
  const { search } = await c.req.json();
  
  if (!search) {
    return c.json({ found: false, error: 'Search term required' });
  }
  
  // Search by name or phone
  const customer = await c.env.DB.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as project_count
    FROM customers c
    WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?
    LIMIT 1
  `).bind(`%${search}%`, `%${search}%`, `%${search}%`).first<any>();
  
  if (!customer) {
    return c.json({ found: false });
  }
  
  // Get recent projects
  const projects = await c.env.DB.prepare(`
    SELECT id, title, status, scheduled_date, notes
    FROM bookings
    WHERE customer_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).bind(customer.id).all<any>();
  
  return c.json({
    found: true,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      projects: projects.results,
    },
  });
});

// ============ TOOL: get_project_status ============
voiceApi.post('/project', async (c) => {
  const { customer_id, project_id } = await c.req.json();
  
  let query = `
    SELECT b.*, c.name as customer_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
  `;
  
  if (project_id) {
    query += ` WHERE b.id = ?`;
    const project = await c.env.DB.prepare(query).bind(project_id).first<any>();
    return c.json({ project });
  }
  
  if (customer_id) {
    query += ` WHERE b.customer_id = ? ORDER BY b.created_at DESC LIMIT 1`;
    const project = await c.env.DB.prepare(query).bind(customer_id).first<any>();
    return c.json({ project });
  }
  
  return c.json({ error: 'customer_id or project_id required' }, 400);
});

// ============ TOOL: create_lead ============
voiceApi.post('/lead', async (c) => {
  const { name, phone, email, project_type, description, address } = await c.req.json();
  
  if (!name || !phone || !project_type) {
    return c.json({ error: 'name, phone, and project_type required' }, 400);
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  // Check if customer exists
  let customer = await c.env.DB.prepare(
    'SELECT * FROM customers WHERE phone = ? OR email = ?'
  ).bind(phone, email || '').first<any>();
  
  // Create customer if new
  if (!customer) {
    await c.env.DB.prepare(`
      INSERT INTO customers (name, phone, email, address, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'lead', ?, ?)
    `).bind(name, phone, email || null, address || null, now, now).run();
    
    customer = await c.env.DB.prepare(
      'SELECT * FROM customers WHERE phone = ?'
    ).bind(phone).first<any>();
  }
  
  // Create lead/booking
  const result = await c.env.DB.prepare(`
    INSERT INTO bookings (customer_id, title, description, service_type, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `).bind(
    customer.id,
    `${project_type} - Phone inquiry`,
    description || '',
    project_type,
    now,
    now
  ).run();
  
  // Notify Discord
  if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
    await fetch(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '📞 New Lead from Phone Call',
          color: 0x8B4513,
          fields: [
            { name: 'Name', value: name, inline: true },
            { name: 'Phone', value: phone, inline: true },
            { name: 'Project Type', value: project_type, inline: true },
            { name: 'Description', value: description || 'None provided' },
          ],
          footer: { text: 'Via Lil Beaver Voice Agent' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  }
  
  return c.json({
    success: true,
    lead_id: result.meta.last_row_id,
    customer_id: customer.id,
    message: 'Lead created successfully',
  });
});

// ============ TOOL: check_availability ============
voiceApi.post('/availability', async (c) => {
  const { week_offset = 0 } = await c.req.json().catch(() => ({}));
  
  const now = new Date();
  now.setDate(now.getDate() + (week_offset * 7));
  
  // Get next 7 days
  const slots: Array<{ date: string; day: string; slots: string[] }> = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    const dayOfWeek = date.getDay();
    
    // Skip Sunday
    if (dayOfWeek === 0) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check for existing bookings on this date
    const bookings = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE scheduled_date = ? AND status IN ('confirmed', 'in_progress')
    `).bind(dateStr).first<{ count: number }>();
    
    // If no bookings, show as available
    if (!bookings?.count) {
      slots.push({
        date: dateStr,
        day: daysOfWeek[dayOfWeek],
        slots: ['9:00 AM', '2:00 PM'],
      });
    }
  }
  
  return c.json({ available_slots: slots });
});

// ============ TOOL: schedule_consultation ============
voiceApi.post('/schedule', async (c) => {
  const { customer_name, phone, date, time, project_type, address } = await c.req.json();
  
  if (!customer_name || !phone || !date || !project_type) {
    return c.json({ error: 'customer_name, phone, date, and project_type required' }, 400);
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  // Find or create customer
  let customer = await c.env.DB.prepare(
    'SELECT * FROM customers WHERE phone = ?'
  ).bind(phone).first<any>();
  
  if (!customer) {
    await c.env.DB.prepare(`
      INSERT INTO customers (name, phone, address, status, created_at, updated_at)
      VALUES (?, ?, ?, 'prospect', ?, ?)
    `).bind(customer_name, phone, address || null, now, now).run();
    
    customer = await c.env.DB.prepare(
      'SELECT * FROM customers WHERE phone = ?'
    ).bind(phone).first<any>();
  }
  
  // Create consultation booking
  const result = await c.env.DB.prepare(`
    INSERT INTO bookings (customer_id, title, description, service_type, status, scheduled_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?)
  `).bind(
    customer.id,
    `Consultation - ${project_type}`,
    `Scheduled via phone at ${time || 'TBD'}. Address: ${address || 'TBD'}`,
    project_type,
    date,
    now,
    now
  ).run();
  
  // Format confirmation
  const dateObj = new Date(date);
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][dateObj.getMonth()];
  const dayNum = dateObj.getDate();
  
  const confirmation = `Consultation scheduled for ${dayName}, ${monthName} ${dayNum}${time ? ` at ${time}` : ''}`;
  
  // Notify Discord
  if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
    await fetch(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '📅 Consultation Scheduled via Phone',
          color: 0x00FF00,
          fields: [
            { name: 'Customer', value: customer_name, inline: true },
            { name: 'Phone', value: phone, inline: true },
            { name: 'Date', value: `${date} ${time || ''}`, inline: true },
            { name: 'Project', value: project_type },
            { name: 'Address', value: address || 'TBD' },
          ],
          footer: { text: 'Via Lil Beaver Voice Agent' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  }
  
  return c.json({
    success: true,
    booking_id: result.meta.last_row_id,
    confirmation,
  });
});

// ============ TOOL: send_notification ============
voiceApi.post('/notify', async (c) => {
  const { type, message, caller_name, caller_phone } = await c.req.json();
  
  if (!c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
    return c.json({ success: false, error: 'Notifications not configured' });
  }
  
  const colors: Record<string, number> = {
    new_lead: 0x8B4513,
    callback_request: 0xFFA500,
    urgent: 0xFF0000,
  };
  
  await fetch(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: type === 'urgent' ? '🚨 Urgent Call' : type === 'callback_request' ? '📞 Callback Requested' : '📋 Notification',
        description: message,
        color: colors[type] || 0x808080,
        fields: [
          ...(caller_name ? [{ name: 'Caller', value: caller_name, inline: true }] : []),
          ...(caller_phone ? [{ name: 'Phone', value: caller_phone, inline: true }] : []),
        ],
        footer: { text: 'Via Lil Beaver Voice Agent' },
        timestamp: new Date().toISOString(),
      }],
    }),
  });
  
  return c.json({ success: true, notified: ['discord'] });
});

// ============ WEBHOOK: ElevenLabs events ============
voiceApi.post('/webhook', async (c) => {
  const event = await c.req.json();
  
  // Log all events for debugging
  console.log('ElevenLabs webhook:', JSON.stringify(event));
  
  // Handle different event types
  if (event.type === 'call.started') {
    // Call started
  } else if (event.type === 'call.ended') {
    // Call ended - could log call duration, etc.
  }
  
  return c.json({ received: true });
});
