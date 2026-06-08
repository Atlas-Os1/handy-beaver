/**
 * CalendarSyncWorkflow
 * Syncs Google Calendar changes back to bookings DB.
 * Runs every 30 min (triggered by main worker cron).
 * Each step is checkpointed — failure in one step doesn't restart from scratch.
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { backSyncGoogleCalendarToBookings } from '../routes/calendar-api';

type Env = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_ACCESS_TOKEN?: string;
  GOOGLE_CALENDAR_ID?: string;
  CALENDAR_WEBHOOK_SECRET?: string;
  DISCORD_WEBHOOK_NOTIFICATIONS?: string;
};

type Params = { triggered_by?: string };

export class CalendarSyncWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {

    // Step 1: Sync Google Calendar → bookings
    const syncResult = await step.do('sync-google-calendar', {
      retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' },
      timeout: '2 minutes',
    }, async () => {
      const result = await backSyncGoogleCalendarToBookings(this.env as any);
      return result;
    });

    // Step 2: Notify Discord if something synced
    if (syncResult.synced > 0 && this.env.DISCORD_WEBHOOK_NOTIFICATIONS) {
      await step.do('notify-discord', { retries: { limit: 2, delay: '5 seconds' } }, async () => {
        await fetch(this.env.DISCORD_WEBHOOK_NOTIFICATIONS!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📅 Calendar sync: ${syncResult.synced} booking(s) updated from Google Calendar`,
          }),
        });
      });
    }

    return { synced: syncResult.synced, error: syncResult.error };
  }
}
