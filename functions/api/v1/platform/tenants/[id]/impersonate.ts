import { getDB, generateId, rowToTenant } from '../../../_lib/db';
import { verifyAuth, requireAuth } from '../../../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'DEV');
    const db = getDB(env);

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const tenantId = params.id;

    // Look up the tenant
    const tenantRow = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
    if (!tenantRow) return json({ error: 'Tenant not found' }, 404);

    // Fetch tenant settings
    const settingsRow = await db.prepare(
      "SELECT data FROM settings WHERE tenant_id = ? AND key = 'general'"
    ).bind(tenantId).first();

    // Insert audit log entry
    const auditId = generateId();
    await db.prepare(
      'INSERT INTO tenant_audit_log (id, tenant_id, action, performed_by) VALUES (?, ?, ?, ?)'
    ).bind(auditId, tenantId, 'impersonated', auth.email || auth.userId).run();

    const tenant = rowToTenant(tenantRow);

    return json({
      tenant,
      settings: settingsRow ? JSON.parse((settingsRow as any).data || '{}') : {},
      adminUsername: tenant.adminUsername,
    });
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
