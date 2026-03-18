import { Hono } from 'hono';
import { siteConfig } from '../../config/site.config';

const { subscriptionPlans, serviceBlocks } = siteConfig;

type Bindings = {
  DB: D1Database;
  SQUARE_ACCESS_TOKEN?: string;
};

export const subscriptionApi = new Hono<{ Bindings: Bindings }>();

// ============ PUBLIC ENDPOINTS ============

// Get available subscription plans
subscriptionApi.get('/plans', async (c) => {
  return c.json({
    plans: Object.entries(subscriptionPlans).map(([key, plan]) => ({
      id: key,
      ...plan,
    })),
  });
});

// Get service blocks (one-time purchases)
subscriptionApi.get('/blocks', async (c) => {
  return c.json({
    blocks: Object.entries(serviceBlocks).map(([key, block]) => ({
      id: key,
      ...block,
    })),
  });
});

// ============ CUSTOMER ENDPOINTS ============

// Get customer's active subscription
subscriptionApi.get('/my-subscription', async (c) => {
  const customerId = c.req.header('X-Customer-ID');
  if (!customerId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const subscription = await c.env.DB.prepare(`
    SELECT 
      cs.*,
      sp.display_name as plan_name,
      sp.hours_per_month,
      sp.monthly_price,
      sp.features
    FROM customer_subscriptions cs
    JOIN subscription_plans sp ON cs.plan_id = sp.id
    WHERE cs.customer_id = ? AND cs.status = 'active'
    ORDER BY cs.created_at DESC
    LIMIT 1
  `).bind(customerId).first();

  if (!subscription) {
    return c.json({ subscription: null });
  }

  // Calculate remaining hours
  const hoursRemaining = (subscription.hours_per_month as number) - (subscription.hours_used_this_period as number || 0);

  return c.json({
    subscription: {
      ...subscription,
      hours_remaining: hoursRemaining,
      features: subscription.features ? JSON.parse(subscription.features as string) : [],
    },
  });
});

// Get customer's task queue
subscriptionApi.get('/my-tasks', async (c) => {
  const customerId = c.req.header('X-Customer-ID');
  if (!customerId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const tasks = await c.env.DB.prepare(`
    SELECT * FROM subscription_tasks
    WHERE customer_id = ?
    ORDER BY 
      CASE urgency
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at DESC
  `).bind(customerId).all();

  return c.json({
    tasks: tasks.results?.map(task => ({
      ...task,
      photos: task.photos ? JSON.parse(task.photos as string) : [],
    })) || [],
  });
});

// Add task to queue (for subscribers)
subscriptionApi.post('/tasks', async (c) => {
  const customerId = c.req.header('X-Customer-ID');
  if (!customerId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const body = await c.req.json<{
    description: string;
    urgency?: 'urgent' | 'high' | 'normal' | 'low';
    estimated_hours?: number;
    photos?: string[];
  }>();

  if (!body.description) {
    return c.json({ error: 'Description is required' }, 400);
  }

  // Verify customer has active subscription
  const subscription = await c.env.DB.prepare(`
    SELECT id FROM customer_subscriptions
    WHERE customer_id = ? AND status = 'active'
    LIMIT 1
  `).bind(customerId).first();

  if (!subscription) {
    return c.json({ error: 'Active subscription required to add tasks' }, 403);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO subscription_tasks 
    (subscription_id, customer_id, description, urgency, estimated_hours, photos, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    subscription.id,
    customerId,
    body.description,
    body.urgency || 'normal',
    body.estimated_hours || null,
    body.photos ? JSON.stringify(body.photos) : null
  ).run();

  return c.json({
    success: true,
    task_id: result.meta.last_row_id,
    message: 'Task added to your queue',
  });
});

// ============ ADMIN ENDPOINTS ============

// List all subscriptions (admin)
subscriptionApi.get('/admin/subscriptions', async (c) => {
  const subscriptions = await c.env.DB.prepare(`
    SELECT 
      cs.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      sp.display_name as plan_name,
      sp.hours_per_month,
      sp.monthly_price
    FROM customer_subscriptions cs
    JOIN customers c ON cs.customer_id = c.id
    JOIN subscription_plans sp ON cs.plan_id = sp.id
    ORDER BY cs.created_at DESC
  `).all();

  return c.json({
    subscriptions: subscriptions.results || [],
  });
});

// List all pending tasks (admin)
subscriptionApi.get('/admin/tasks', async (c) => {
  const status = c.req.query('status') || 'pending';
  
  const tasks = await c.env.DB.prepare(`
    SELECT 
      st.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      c.address as customer_address,
      sp.display_name as plan_name
    FROM subscription_tasks st
    JOIN customers c ON st.customer_id = c.id
    JOIN customer_subscriptions cs ON st.subscription_id = cs.id
    JOIN subscription_plans sp ON cs.plan_id = sp.id
    WHERE st.status = ?
    ORDER BY 
      CASE st.urgency
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      st.created_at ASC
  `).bind(status).all();

  return c.json({
    tasks: tasks.results?.map(task => ({
      ...task,
      photos: task.photos ? JSON.parse(task.photos as string) : [],
    })) || [],
  });
});

// Update task status (admin)
subscriptionApi.patch('/admin/tasks/:id', async (c) => {
  const taskId = c.req.param('id');
  const body = await c.req.json<{
    status?: string;
    scheduled_date?: string;
    hours_spent?: number;
    notes?: string;
  }>();

  const updates: string[] = [];
  const values: any[] = [];

  if (body.status) {
    updates.push('status = ?');
    values.push(body.status);
    
    if (body.status === 'completed') {
      updates.push('completed_at = ?');
      values.push(Math.floor(Date.now() / 1000));
    }
  }
  if (body.scheduled_date) {
    updates.push('scheduled_date = ?');
    values.push(body.scheduled_date);
  }
  if (body.hours_spent !== undefined) {
    updates.push('hours_spent = ?');
    values.push(body.hours_spent);
  }
  if (body.notes) {
    updates.push('notes = ?');
    values.push(body.notes);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }

  values.push(taskId);

  await c.env.DB.prepare(`
    UPDATE subscription_tasks 
    SET ${updates.join(', ')}
    WHERE id = ?
  `).bind(...values).run();

  // If completed, update hours used on subscription
  if (body.status === 'completed' && body.hours_spent) {
    const task = await c.env.DB.prepare(`
      SELECT subscription_id FROM subscription_tasks WHERE id = ?
    `).bind(taskId).first();

    if (task) {
      await c.env.DB.prepare(`
        UPDATE customer_subscriptions 
        SET hours_used_this_period = hours_used_this_period + ?
        WHERE id = ?
      `).bind(body.hours_spent, task.subscription_id).run();
    }
  }

  return c.json({ success: true });
});

// Create subscription for customer (admin)
subscriptionApi.post('/admin/subscriptions', async (c) => {
  const body = await c.req.json<{
    customer_id: number;
    plan_id: number;
    square_subscription_id?: string;
  }>();

  if (!body.customer_id || !body.plan_id) {
    return c.json({ error: 'customer_id and plan_id are required' }, 400);
  }

  // Get plan details
  const plan = await c.env.DB.prepare(`
    SELECT * FROM subscription_plans WHERE id = ?
  `).bind(body.plan_id).first();

  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404);
  }

  // Cancel any existing active subscription
  await c.env.DB.prepare(`
    UPDATE customer_subscriptions 
    SET status = 'cancelled', cancelled_at = ?
    WHERE customer_id = ? AND status = 'active'
  `).bind(Math.floor(Date.now() / 1000), body.customer_id).run();

  // Create new subscription
  const now = Math.floor(Date.now() / 1000);
  const periodEnd = now + (30 * 24 * 60 * 60); // 30 days

  const result = await c.env.DB.prepare(`
    INSERT INTO customer_subscriptions 
    (customer_id, plan_id, status, square_subscription_id, current_period_start, current_period_end, hours_used_this_period)
    VALUES (?, ?, 'active', ?, ?, ?, 0)
  `).bind(
    body.customer_id,
    body.plan_id,
    body.square_subscription_id || null,
    now,
    periodEnd
  ).run();

  return c.json({
    success: true,
    subscription_id: result.meta.last_row_id,
  });
});

// Seed initial subscription plans (run once)
subscriptionApi.post('/admin/seed-plans', async (c) => {
  // Check if plans already exist
  const existing = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM subscription_plans
  `).first();

  if (existing && (existing.count as number) > 0) {
    return c.json({ message: 'Plans already seeded', count: existing.count });
  }

  // Insert plans from config
  for (const [key, plan] of Object.entries(subscriptionPlans)) {
    await c.env.DB.prepare(`
      INSERT INTO subscription_plans (name, display_name, hours_per_month, monthly_price, features, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(
      key,
      plan.label,
      plan.hours,
      plan.price,
      JSON.stringify(plan.features)
    ).run();
  }

  return c.json({ success: true, message: 'Plans seeded' });
});
