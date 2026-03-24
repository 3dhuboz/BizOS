import { getDB, rowToTenant } from '../../_lib/db';
import { verifyAuth, requireAuth } from '../../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'DEV');
    const db = getDB(env);
    const tenantId = params.id;

    if (request.method === 'GET') {
      const row = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
      if (!row) return json({ error: 'Tenant not found' }, 404);
      return json(rowToTenant(row));
    }

    if (request.method === 'PUT') {
      const body = await request.json();

      // Build dynamic update fields
      const allowedFields: Record<string, string> = {
        businessName: 'business_name',
        status: 'status',
        subscriptionTier: 'subscription_tier',
        adminUsername: 'admin_username',
        adminPassword: 'admin_password',
        customDomain: 'custom_domain',
        settingsJson: 'settings_json',
      };

      const setClauses: string[] = [];
      const values: any[] = [];

      for (const [key, col] of Object.entries(allowedFields)) {
        if (body[key] !== undefined) {
          setClauses.push(`${col} = ?`);
          values.push(body[key]);
        }
      }

      if (setClauses.length === 0) {
        return json({ error: 'No valid fields to update' }, 400);
      }

      values.push(tenantId);
      await db.prepare(
        `UPDATE tenants SET ${setClauses.join(', ')} WHERE id = ?`
      ).bind(...values).run();

      const row = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
      return json(rowToTenant(row));
    }

    if (request.method === 'DELETE') {
      // Delete all tenant data from dependent tables
      const dependentTables = [
        'users', 'menu_items', 'orders', 'calendar_events', 'social_posts',
        'gallery_posts', 'settings', 'cook_days', 'customer_notes', 'bookings',
        'shared_plans', 'shared_plan_responses', 'contracts', 'payment_reminders',
      ];

      for (const table of dependentTables) {
        await db.prepare(`DELETE FROM ${table} WHERE tenant_id = ?`).bind(tenantId).run();
      }

      await db.prepare('DELETE FROM tenants WHERE id = ?').bind(tenantId).run();
      return json({ success: true, message: `Tenant ${tenantId} and all associated data deleted` });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
