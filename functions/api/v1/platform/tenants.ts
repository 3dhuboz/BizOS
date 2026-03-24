import { getDB, generateId, rowToTenant } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'DEV');
    const db = getDB(env);

    if (request.method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM tenants ORDER BY created_at DESC').all();
      return json(results.map(rowToTenant));
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { businessName, businessType, ownerEmail, adminUsername } = body;

      if (!businessName || !ownerEmail) {
        return json({ error: 'businessName and ownerEmail are required' }, 400);
      }

      // Auto-generate ID from business name if not provided
      const id = body.id || businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40) + '-' + generateId().slice(0, 6);

      // Generate random 8-char alphanumeric password if not provided
      const adminPassword = body.adminPassword || Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[b % 62])
        .join('');

      await db.prepare(`
        INSERT INTO tenants (id, business_name, business_type, owner_email, admin_username, admin_password)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        businessName,
        businessType || 'custom',
        ownerEmail,
        adminUsername || 'admin',
        adminPassword
      ).run();

      // Seed default settings row for the new tenant
      await db.prepare(
        "INSERT INTO settings (key, tenant_id, data) VALUES ('general', ?, '{}')"
      ).bind(id).run();

      const row = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
      const tenant = rowToTenant(row);
      return json({ ...tenant, generatedPassword: adminPassword }, 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
