/**
 * CF Email Service — replaces Gmail OAuth for sending transactional email.
 * Uses Cloudflare Email Routing's SEND_EMAIL binding (already in wrangler.toml).
 *
 * Falls back to Gmail OAuth if SEND_EMAIL isn't bound (local dev).
 */

type EmailEnv = {
  SEND_EMAIL?: any;              // CF Email Routing binding
  GOOGLE_CLIENT_ID?: string;     // Gmail OAuth fallback
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
};

/** Build a minimal RFC 2822 email string for CF Email Service */
function buildRFC2822(from: string, fromName: string, to: string, subject: string, html: string): string {
  const boundary = `boundary_${Date.now()}`;
  return [
    `From: ${fromName} <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ].join('\r\n');
}

export async function sendEmail(
  env: EmailEnv,
  to: string,
  subject: string,
  html: string,
  fromName = 'The Handy Beaver'
): Promise<{ success: boolean; method: string; error?: string }> {

  // ── 1. CF Email Service (preferred) ──────────────────────────────────────
  if (env.SEND_EMAIL) {
    try {
      const from = 'noreply@handybeaver.co';
      const raw = buildRFC2822(from, fromName, to, subject, html);

      // CF EmailMessage API
      const { EmailMessage } = await import('cloudflare:email');
      const msg = new EmailMessage(from, to, new Response(raw).body!);
      await env.SEND_EMAIL.send(msg);
      console.log('Email sent via CF Email Service to', to);
      return { success: true, method: 'cf-email' };
    } catch (err) {
      console.error('CF Email Service failed, trying fallback:', err);
    }
  }

  // ── 2. Gmail OAuth fallback (local dev / legacy) ──────────────────────────
  if (env.GOOGLE_REFRESH_TOKEN && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    try {
      const { sendGmail } = await import('./gmail');
      const result = await sendGmail(env as any, to, subject, html, fromName);
      return result.success
        ? { success: true, method: 'gmail-oauth' }
        : { success: false, method: 'gmail-oauth', error: result.error };
    } catch (err) {
      return { success: false, method: 'gmail-oauth', error: String(err) };
    }
  }

  console.warn('No email transport configured — logging magic link for', to);
  return { success: false, method: 'none', error: 'No email transport configured' };
}
