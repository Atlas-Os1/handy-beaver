/**
 * VoiceLeadSyncWorkflow
 * Syncs ElevenLabs voice conversations → customers + leads in D1.
 * Runs every 30 min (triggered by main worker cron).
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  DB: D1Database;
  ELEVENLABS_API_KEY?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

type Params = { triggered_by?: string };

type ElevenLabsConv = {
  conversation_id: string;
  call_summary_title?: string;
  call_duration_secs: number;
  start_time_unix_secs: number;
};

export class VoiceLeadSyncWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {

    // Step 1: Fetch recent conversations from ElevenLabs
    const conversations = await step.do('fetch-elevenlabs-conversations', {
      retries: { limit: 3, delay: '15 seconds' },
      timeout: '1 minute',
    }, async () => {
      if (!this.env.ELEVENLABS_API_KEY) return [];

      const agentId = 'agent_6401kk7jr6ngey2ancnk6nf7kpwy';
      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}&page_size=10`,
        { headers: { 'xi-api-key': this.env.ELEVENLABS_API_KEY } }
      );
      if (!res.ok) return [];
      const data = await res.json() as { conversations: ElevenLabsConv[] };
      return data.conversations ?? [];
    });

    if (!conversations.length) return { synced: 0 };

    // Step 2: Process each new conversation
    let synced = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const conv of conversations) {
      // Skip old conversations (> 24 hrs)
      if (now - conv.start_time_unix_secs > 86400) continue;

      const alreadyExists = await step.do(`check-exists-${conv.conversation_id}`, async () => {
        const row = await this.env.DB.prepare(
          "SELECT id FROM leads WHERE notes LIKE ?"
        ).bind(`%${conv.conversation_id}%`).first();
        return !!row;
      });

      if (alreadyExists) continue;

      // Step: Fetch full transcript + create lead
      await step.do(`process-conv-${conv.conversation_id}`, {
        retries: { limit: 2, delay: '5 seconds' },
      }, async () => {
        if (!this.env.ELEVENLABS_API_KEY) return;

        const transcriptRes = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`,
          { headers: { 'xi-api-key': this.env.ELEVENLABS_API_KEY } }
        );
        if (!transcriptRes.ok) return;

        const convData = await transcriptRes.json() as { transcript: any[] };
        const transcript = convData.transcript ?? [];
        const transcriptText = transcript
          .map((m: any) => `${m.role === 'agent' ? 'Lil Beaver' : 'Caller'}: ${m.message ?? ''}`)
          .join('\n');

        // Extract name/phone from user messages
        const userText = transcript.filter((m: any) => m.role === 'user').map((m: any) => m.message ?? '').join(' ');
        let callerName = 'Voice Lead';
        const nameMatch = userText.match(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/);
        if (nameMatch) callerName = `${nameMatch[1]} ${nameMatch[2]}`;

        let phoneNumber = '';
        const digitWords: Record<string, string> = { zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9' };
        let normalized = userText.toLowerCase();
        for (const [w, d] of Object.entries(digitWords)) normalized = normalized.replace(new RegExp(w, 'g'), d);
        const phoneMatch = normalized.match(/(\d[\d\-\s,]{7,})/);
        if (phoneMatch) {
          phoneNumber = phoneMatch[1].replace(/[\s\-,]/g, '');
          if (phoneNumber.length === 10) phoneNumber = `${phoneNumber.slice(0,3)}-${phoneNumber.slice(3,6)}-${phoneNumber.slice(6)}`;
        }

        const email = phoneNumber ? `${phoneNumber.replace(/\D/g, '')}@voice.handybeaver.co` : `voice-${Date.now()}@voice.handybeaver.co`;

        const customerResult = await this.env.DB.prepare(
          'INSERT INTO customers (name, phone, email, source, created_at) VALUES (?, ?, ?, \'voice_call\', ?)'
        ).bind(callerName, phoneNumber, email, now).run();
        const customerId = customerResult.meta.last_row_id;

        await this.env.DB.prepare(
          'INSERT INTO leads (customer_id, source, content, notes, created_at) VALUES (?, \'voice_call\', ?, ?, ?)'
        ).bind(customerId, conv.call_summary_title ?? 'Voice Call', `[${conv.conversation_id}]\n\n${transcriptText.slice(0, 2000)}`, now).run();

        for (const msg of transcript) {
          await this.env.DB.prepare(
            'INSERT INTO messages (customer_id, sender, content, source, created_at) VALUES (?, ?, ?, \'voice\', ?)'
          ).bind(customerId, msg.role === 'agent' ? 'business' : 'customer', msg.message ?? '', now).run();
        }
      });

      synced++;
    }

    // Step 3: Notify if new leads captured
    if (synced > 0 && this.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
      await step.do('notify-discord', async () => {
        await fetch(this.env.DISCORD_WEBHOOK_NOTIFICATIONS!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `📞 Voice sync: ${synced} new lead(s) from ElevenLabs` }),
        });
      });
    }

    return { synced };
  }
}
