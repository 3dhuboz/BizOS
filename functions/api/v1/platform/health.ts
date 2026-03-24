import { getDB } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'DEV');
    const db = getDB(env);

    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const tables = [
      'tenants', 'users', 'menu_items', 'orders', 'calendar_events',
      'social_posts', 'gallery_posts', 'settings', 'cook_days',
      'customer_notes', 'bookings', 'shared_plans', 'shared_plan_responses',
      'contracts', 'payment_reminders', 'tenant_audit_log',
    ];

    const startTime = Date.now();

    const counts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const result = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
        counts[table] = (result as any).count;
      } catch {
        counts[table] = -1; // Table may not exist
      }
    }

    const latencyMs = Date.now() - startTime;

    return json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      databaseLatencyMs: latencyMs,
      tables: counts,
    });
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
