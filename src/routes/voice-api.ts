import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
  VOICE_AGENT_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
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
  // Handle both query params (ElevenLabs) and body params
  const url = new URL(c.req.url);
  const queryParams = Object.fromEntries(url.searchParams);
  
  // ElevenLabs sends query params with extra quotes like "\"John Smith\"" - strip them
  const stripQuotes = (val: string | undefined) => val?.replace(/^"|"$/g, '');
  
  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    // No body, use query params only
  }
  
  // Merge query params + body, handle ElevenLabs field name variations
  const name = stripQuotes(body.name || queryParams.name || queryParams.caller_name || queryParams.customer_name);
  const phone = stripQuotes(body.phone || queryParams.phone || queryParams.Phone);
  const email = stripQuotes(body.email || queryParams.email);
  const project_type = stripQuotes(body.project_type || queryParams.project_type);
  const description = stripQuotes(body.description || queryParams.description);
  const address = stripQuotes(body.address || queryParams.address);
  
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
    // Email is required, generate placeholder if not provided
    const customerEmail = email || `${phone.replace(/\D/g, '')}@phone.handybeaver.co`;
    
    await c.env.DB.prepare(`
      INSERT INTO customers (name, phone, email, address, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'lead', ?, ?)
    `).bind(name, phone, customerEmail, address || null, now, now).run();
    
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
  // Handle both query params (ElevenLabs) and body params
  const url = new URL(c.req.url);
  const queryParams = Object.fromEntries(url.searchParams);
  
  // ElevenLabs sends query params with extra quotes - strip them
  const stripQuotes = (val: string | undefined) => val?.replace(/^"|"$/g, '');
  
  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    // No body, use query params only
  }
  
  // Merge query params + body
  const customer_name = stripQuotes(body.customer_name || queryParams.customer_name || queryParams.name || queryParams.caller_name);
  const phone = stripQuotes(body.phone || queryParams.phone || queryParams.Phone);
  const date = stripQuotes(body.date || queryParams.date);
  const time = stripQuotes(body.time || queryParams.time);
  const project_type = stripQuotes(body.project_type || queryParams.project_type);
  const address = stripQuotes(body.address || queryParams.address);
  
  if (!customer_name || !phone || !date || !project_type) {
    return c.json({ error: 'customer_name, phone, date, and project_type required' }, 400);
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  // Find or create customer
  let customer = await c.env.DB.prepare(
    'SELECT * FROM customers WHERE phone = ?'
  ).bind(phone).first<any>();
  
  if (!customer) {
    const customerEmail = `${phone.replace(/\D/g, '')}@phone.handybeaver.co`;
    
    await c.env.DB.prepare(`
      INSERT INTO customers (name, phone, email, address, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'prospect', ?, ?)
    `).bind(customer_name, phone, customerEmail, address || null, now, now).run();
    
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

// ============ LOG CONVERSATION ============
voiceApi.post('/log', async (c) => {
  const { customer_id, customer_phone, messages, source } = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  // Find or create customer
  let custId = customer_id;
  if (!custId && customer_phone) {
    const customer = await c.env.DB.prepare(
      'SELECT id FROM customers WHERE phone = ?'
    ).bind(customer_phone).first<{ id: number }>();
    custId = customer?.id;
  }
  
  if (!custId) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  // Log each message
  for (const msg of messages || []) {
    await c.env.DB.prepare(`
      INSERT INTO messages (customer_id, sender, content, source, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      custId,
      msg.role === 'assistant' ? 'business' : 'customer',
      msg.content,
      source || 'voice',
      now
    ).run();
  }
  
  return c.json({ success: true, logged: messages?.length || 0 });
});

// ============ WEBHOOK: ElevenLabs events ============
voiceApi.post('/webhook', async (c) => {
  const event = await c.req.json();
  const now = Math.floor(Date.now() / 1000);
  
  console.log('ElevenLabs webhook:', JSON.stringify(event));
  
  // Handle conversation end - log the transcript
  if (event.type === 'conversation.ended' || event.type === 'call.ended') {
    const transcript = event.data?.transcript || event.transcript || [];
    const phoneNumber = event.data?.phone_number || event.phone_number || 'Unknown';
    const callDuration = event.data?.duration || event.duration || 0;
    const conversationId = event.conversation_id || event.data?.conversation_id || `call-${now}`;
    
    // Build transcript text
    const transcriptText = transcript.map((msg: any) => 
      `${msg.role === 'agent' ? 'Lil Beaver' : 'Caller'}: ${msg.text || msg.content || ''}`
    ).join('\n');
    
    // Find customer by phone
    let customer = await c.env.DB.prepare(
      'SELECT id, name FROM customers WHERE phone LIKE ?'
    ).bind(`%${phoneNumber.slice(-10)}%`).first<{ id: number; name: string }>();
    
    let isNewLead = false;
    
    if (!customer) {
      // Create a new lead from this call
      isNewLead = true;
      
      // Try to extract name from transcript (look for "my name is" or "this is")
      let callerName = 'Voice Lead';
      const nameMatch = transcriptText.match(/(?:my name is|this is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      if (nameMatch) {
        callerName = nameMatch[1];
      }
      
      // Create customer record
      const email = phoneNumber ? `${phoneNumber.replace(/\D/g, '').slice(-10)}@voice.handybeaver.co` : `voice-${now}@voice.handybeaver.co`;
      const result = await c.env.DB.prepare(`
        INSERT INTO customers (name, phone, email, source, created_at)
        VALUES (?, ?, ?, 'voice_call', ?)
      `).bind(callerName, phoneNumber, email, now).run();
      
      customer = { id: result.meta.last_row_id as number, name: callerName };
      
      // Create lead
      await c.env.DB.prepare(`
        INSERT INTO leads (customer_id, source, content, notes, created_at)
        VALUES (?, 'voice_call', 'Voice Call', ?)
      `).bind(customer.id, `Voice call transcript:\n${transcriptText.slice(0, 1000)}`, now).run();
    }
    
    // Log transcript messages
    if (customer && transcript.length > 0) {
      for (const msg of transcript) {
        await c.env.DB.prepare(`
          INSERT INTO messages (customer_id, sender, content, source, created_at)
          VALUES (?, ?, ?, 'voice', ?)
        `).bind(
          customer.id,
          msg.role === 'agent' ? 'business' : 'customer',
          msg.text || msg.content,
          now
        ).run();
      }
    }
    
    // Send Discord notification
    if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
      const embed = {
        title: isNewLead ? '📞 New Voice Lead!' : '📞 Voice Call Received',
        color: isNewLead ? 0x22c55e : 0x3b82f6,
        fields: [
          { name: 'Caller', value: customer?.name || 'Unknown', inline: true },
          { name: 'Phone', value: phoneNumber, inline: true },
          { name: 'Duration', value: `${Math.round(callDuration / 60)} min`, inline: true },
          { name: 'Transcript Preview', value: transcriptText.slice(0, 500) || 'No transcript', inline: false },
        ],
        footer: { text: `Conversation ID: ${conversationId}` },
        timestamp: new Date().toISOString(),
      };
      
      await fetch(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      }).catch(err => console.error('Discord notify failed:', err));
    }
  }
  
  return c.json({ received: true });
});

// ============ Manual conversation sync ============
voiceApi.post('/sync', async (c) => {
  if (!c.env.ELEVENLABS_API_KEY) {
    return c.json({ error: 'ElevenLabs not configured' }, 500);
  }
  
  const agentId = 'agent_6401kk7jr6ngey2ancnk6nf7kpwy'; // Lil Beaver
  
  try {
    // Fetch recent conversations
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}&page_size=10`, {
      headers: { 'xi-api-key': c.env.ELEVENLABS_API_KEY },
    });
    
    if (!res.ok) {
      return c.json({ error: 'ElevenLabs API error', status: res.status }, 500);
    }
    
    const data = await res.json() as { conversations: any[] };
    const now = Math.floor(Date.now() / 1000);
    const results: any[] = [];
    
    for (const conv of data.conversations || []) {
      // Skip if already processed
      const existing = await c.env.DB.prepare(
        "SELECT id FROM leads WHERE notes LIKE ?"
      ).bind(`%${conv.conversation_id}%`).first();
      
      if (existing) {
        results.push({ id: conv.conversation_id, status: 'skipped', reason: 'already_synced' });
        continue;
      }
      
      // Skip very old conversations (> 24 hours)
      if (now - conv.start_time_unix_secs > 86400) {
        results.push({ id: conv.conversation_id, status: 'skipped', reason: 'too_old' });
        continue;
      }
      
      // Fetch full transcript
      const transcriptRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`, {
        headers: { 'xi-api-key': c.env.ELEVENLABS_API_KEY },
      });
      
      if (!transcriptRes.ok) {
        results.push({ id: conv.conversation_id, status: 'error', reason: 'transcript_fetch_failed' });
        continue;
      }
      
      const convData = await transcriptRes.json() as { transcript: any[] };
      const transcript = convData.transcript || [];
      
      // Build transcript text
      const transcriptText = transcript.map((msg: any) => 
        `${msg.role === 'agent' ? 'Lil Beaver' : 'Caller'}: ${msg.message || ''}`
      ).join('\n');
      
      // Only look at USER messages for name/phone extraction
      const userMessages = transcript
        .filter((msg: any) => msg.role === 'user')
        .map((msg: any) => msg.message || '')
        .join(' ');
      
      // Extract name from user messages
      let callerName = 'Voice Lead';
      // Look for "John Smith" pattern - two capitalized words together in user speech
      const nameMatch = userMessages.match(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/);
      if (nameMatch) {
        callerName = `${nameMatch[1]} ${nameMatch[2]}`;
      } else {
        // Fallback: look for "my name is X" or "this is X"
        const altNameMatch = userMessages.match(/(?:my name is|this is|i'm|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
        if (altNameMatch) callerName = altNameMatch[1];
      }
      
      // Extract phone - look for spoken digit sequences like "five-eight-zero, three-nine-two"
      let phoneNumber = '';
      const digitWords: Record<string, string> = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
      };
      
      // Convert spoken numbers to digits
      let normalizedUserMsg = userMessages.toLowerCase();
      for (const [word, digit] of Object.entries(digitWords)) {
        normalizedUserMsg = normalizedUserMsg.replace(new RegExp(word, 'g'), digit);
      }
      
      // Find longest digit sequence
      const phoneMatch = normalizedUserMsg.match(/(\d[\d\-\s,]{7,})/);
      if (phoneMatch) {
        phoneNumber = phoneMatch[1].replace(/[\s\-,]/g, '');
        if (phoneNumber.length === 10) {
          phoneNumber = `${phoneNumber.slice(0,3)}-${phoneNumber.slice(3,6)}-${phoneNumber.slice(6)}`;
        }
      }
      
      // Create customer and lead
      const email = phoneNumber ? `${phoneNumber.replace(/\D/g, '')}@voice.handybeaver.co` : `voice-${Date.now()}@voice.handybeaver.co`;
      const customerResult = await c.env.DB.prepare(`
        INSERT INTO customers (name, phone, email, source, created_at)
        VALUES (?, ?, ?, 'voice_call', ?)
      `).bind(callerName, phoneNumber, email, now).run();
      
      const customerId = customerResult.meta.last_row_id;
      
      await c.env.DB.prepare(`
        INSERT INTO leads (customer_id, source, content, notes, created_at)
        VALUES (?, 'voice_call', ?, ?, ?)
      `).bind(customerId, conv.call_summary_title || 'Voice Call', `[${conv.conversation_id}]\n\nTranscript:\n${transcriptText.slice(0, 2000)}`, now).run();
      
      // Log transcript messages
      for (const msg of transcript) {
        await c.env.DB.prepare(`
          INSERT INTO messages (customer_id, sender, content, source, created_at)
          VALUES (?, ?, ?, 'voice', ?)
        `).bind(customerId, msg.role === 'agent' ? 'business' : 'customer', msg.message || '', now).run();
      }
      
      // Send Discord notification
      if (c.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
        await fetch(c.env.DISCORD_WEBHOOK_NOTIFICATIONS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '📞 New Voice Lead!',
              color: 0x22c55e,
              fields: [
                { name: 'Name', value: callerName, inline: true },
                { name: 'Phone', value: phoneNumber || 'Not captured', inline: true },
                { name: 'Topic', value: conv.call_summary_title || 'General inquiry', inline: true },
                { name: 'Duration', value: `${Math.round(conv.call_duration_secs / 60)} min`, inline: true },
                { name: 'Transcript', value: transcriptText.slice(0, 500) || 'No transcript', inline: false },
              ],
              timestamp: new Date(conv.start_time_unix_secs * 1000).toISOString(),
            }],
          }),
        }).catch(err => console.error('Discord notify failed:', err));
      }
      
      results.push({ 
        id: conv.conversation_id, 
        status: 'synced', 
        customer: callerName,
        phone: phoneNumber,
        topic: conv.call_summary_title 
      });
    }
    
    return c.json({ success: true, results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});
