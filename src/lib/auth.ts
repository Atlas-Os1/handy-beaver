import { Context, MiddlewareHandler } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

const ADMIN_COOKIE_TTL_SECONDS = 7 * 24 * 60 * 60;

interface AdminCookieParts {
  githubId: string;
  timestamp: number;
  signature: string;
}

// Types
export interface Admin {
  id: number;
  github_id: string;
  github_username: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface Customer {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  status: string;
  total_jobs: number;
  total_spent: number;
}

export interface Session {
  type: 'admin' | 'customer';
  user: Admin | Customer;
}

const MAGIC_LINK_TTL_SECONDS = 15 * 60;

interface MagicLinkRecord {
  customer_id: number;
  expires_at: number;
}

// Generate secure random token
export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  return token;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left[i] ^ right[i];
  }
  return diff === 0;
}

function parseAdminCookie(token: string): AdminCookieParts | null {
  const parts = token.split(':');
  if (parts.length !== 3) {
    return null;
  }

  const [githubId, timestampRaw, signature] = parts;
  if (!githubId || !timestampRaw || !signature || !/^\d+$/.test(timestampRaw)) {
    return null;
  }

  return {
    githubId,
    timestamp: Number(timestampRaw),
    signature,
  };
}

export async function createAdminCookieValue(
  githubId: string,
  timestamp: number,
  secret: string
): Promise<string> {
  const payload = `${githubId}:${timestamp}`;
  const signature = await hmacSha256Hex(payload, secret);
  return `${payload}:${signature}`;
}

export async function verifyAdminCookieValue(
  token: string,
  secret: string | undefined,
  maxAgeSeconds = ADMIN_COOKIE_TTL_SECONDS
): Promise<string | null> {
  if (!secret) {
    return null;
  }

  const parsed = parseAdminCookie(token);
  if (!parsed) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.timestamp > now || now - parsed.timestamp > maxAgeSeconds) {
    return null;
  }

  const expectedSignature = await hmacSha256Hex(`${parsed.githubId}:${parsed.timestamp}`, secret);
  const actualBytes = hexToBytes(parsed.signature);
  const expectedBytes = hexToBytes(expectedSignature);

  if (!actualBytes || !expectedBytes || !constantTimeEqual(actualBytes, expectedBytes)) {
    return null;
  }

  return parsed.githubId;
}

export async function getAdminFromCookie(
  db: D1Database,
  token: string,
  secret: string | undefined
): Promise<Admin | null> {
  const githubId = await verifyAdminCookieValue(token, secret);
  if (!githubId) {
    return null;
  }

  return db.prepare(`
    SELECT * FROM admins WHERE github_id = ?
  `).bind(githubId).first() as Promise<Admin | null>;
}

// Magic link auth
export async function createMagicLink(
  db: D1Database,
  customerId: number,
  expiresInMinutes = MAGIC_LINK_TTL_SECONDS / 60
): Promise<string> {
  const token = generateToken(48);
  const expiresAt = Math.floor(Date.now() / 1000) + (expiresInMinutes * 60);
  
  await db.prepare(`
    INSERT INTO magic_links (customer_id, token, expires_at)
    VALUES (?, ?, ?)
  `).bind(customerId, token, expiresAt).run();
  
  return token;
}

export async function verifyMagicLink(
  db: D1Database,
  token: string
): Promise<Customer | null> {
  const now = Math.floor(Date.now() / 1000);

  // Atomically consume the token only if it is still valid.
  const consumed = await db.prepare(`
    DELETE FROM magic_links
    WHERE token = ? AND expires_at > ?
    RETURNING customer_id, expires_at
  `).bind(token, now).first<MagicLinkRecord>();

  if (!consumed) {
    // Clean up expired or otherwise invalid tokens without allowing replay.
    await db.prepare(`
      DELETE FROM magic_links WHERE token = ?
    `).bind(token).run();
    return null;
  }

  const customer = await db.prepare(`
    SELECT * FROM customers WHERE id = ?
  `).bind(consumed.customer_id).first<Customer>();

  if (!customer) {
    return null;
  }

  // Upgrade customer status if still lead
  if (customer.status === 'lead') {
    await db.prepare(`
      UPDATE customers SET status = 'prospect' WHERE id = ?
    `).bind(customer.id).run();
    customer.status = 'prospect';
  }

  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    status: customer.status,
    total_jobs: customer.total_jobs || 0,
    total_spent: customer.total_spent || 0,
  };
}

// Session management
export async function createSession(
  db: D1Database,
  customerId: number,
  expiresInDays = 30
): Promise<string> {
  const token = generateToken(64);
  const expiresAt = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);
  
  await db.prepare(`
    INSERT INTO customer_sessions (customer_id, token, expires_at)
    VALUES (?, ?, ?)
  `).bind(customerId, token, expiresAt).run();
  
  return token;
}

export async function getSession(
  db: D1Database,
  token: string
): Promise<Customer | null> {
  const now = Math.floor(Date.now() / 1000);
  
  const result = await db.prepare(`
    SELECT c.*, cs.last_used
    FROM customer_sessions cs
    JOIN customers c ON cs.customer_id = c.id
    WHERE cs.token = ? AND cs.expires_at > ?
  `).bind(token, now).first<any>();
  
  if (!result) return null;
  
  // Update last used
  await db.prepare(`
    UPDATE customer_sessions SET last_used = ? WHERE token = ?
  `).bind(now, token).run();
  
  return {
    id: result.id,
    email: result.email,
    name: result.name,
    phone: result.phone,
    address: result.address,
    status: result.status,
    total_jobs: result.total_jobs || 0,
    total_spent: result.total_spent || 0,
  };
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare(`
    DELETE FROM customer_sessions WHERE token = ?
  `).bind(token).run();
}

// GitHub OAuth helpers
export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

export async function exchangeGitHubCode(
  clientId: string,
  clientSecret: string,
  code: string
): Promise<string | null> {
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    
    const data = await response.json() as any;
    return data.access_token || null;
  } catch (e) {
    console.error('GitHub OAuth error:', e);
    return null;
  }
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Handy-Beaver-App',
      },
    });
    
    if (!response.ok) return null;
    return response.json() as Promise<GitHubUser>;
  } catch (e) {
    console.error('GitHub user fetch error:', e);
    return null;
  }
}

export async function findOrCreateAdmin(
  db: D1Database,
  githubUser: GitHubUser
): Promise<Admin | null> {
  const now = Math.floor(Date.now() / 1000);
  
  // Try to find existing admin
  let admin = await db.prepare(`
    SELECT * FROM admins WHERE github_id = ?
  `).bind(String(githubUser.id)).first<Admin>();
  
  if (admin) {
    // Update last login
    await db.prepare(`
      UPDATE admins SET last_login = ?, avatar_url = ?, name = ?, email = ?
      WHERE github_id = ?
    `).bind(now, githubUser.avatar_url, githubUser.name, githubUser.email, String(githubUser.id)).run();
    
    return { ...admin, avatar_url: githubUser.avatar_url };
  }
  
  // Create new admin (only if first admin or authorized)
  const adminCount = await db.prepare('SELECT COUNT(*) as count FROM admins').first<{count: number}>();
  
  if (adminCount && adminCount.count === 0) {
    // First admin becomes owner
    await db.prepare(`
      INSERT INTO admins (github_id, github_username, email, name, avatar_url, role, last_login)
      VALUES (?, ?, ?, ?, ?, 'owner', ?)
    `).bind(
      String(githubUser.id),
      githubUser.login,
      githubUser.email,
      githubUser.name,
      githubUser.avatar_url,
      now
    ).run();
    
    return await db.prepare(`
      SELECT * FROM admins WHERE github_id = ?
    `).bind(String(githubUser.id)).first<Admin>();
  }
  
  return null; // Not authorized
}

// Middleware
export const requireCustomer: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, 'hb_session');
  
  if (!token) {
    return c.redirect('/login');
  }
  
  const customer = await getSession(c.env.DB, token);
  
  if (!customer) {
    deleteCookie(c, 'hb_session');
    return c.redirect('/login');
  }
  
  c.set('customer', customer);
  await next();
};

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, 'hb_admin');
  
  if (!token) {
    return c.redirect('/admin/login');
  }

  const secret = (c.env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY;
  const githubId = await verifyAdminCookieValue(token, secret);

  if (!githubId) {
    deleteCookie(c, 'hb_admin');
    return c.redirect('/admin/login');
  }

  const admin = await c.env.DB.prepare(`
    SELECT * FROM admins WHERE github_id = ?
  `).bind(githubId).first() as Promise<Admin | null>;
  
  if (!admin) {
    deleteCookie(c, 'hb_admin');
    return c.redirect('/admin/login');
  }
  
  c.set('admin', admin);
  await next();
};
