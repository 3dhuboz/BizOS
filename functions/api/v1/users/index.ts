import { getDB, rowToUser } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method === 'GET') {
      requireAuth(await verifyAuth(request, env), 'ADMIN');
      const { results } = await getDB(env).prepare('SELECT * FROM users ORDER BY name').all();
      return json(results.map(rowToUser));
    }

    if (request.method === 'POST') {
      requireAuth(await verifyAuth(request, env), 'ADMIN');
      const data = await request.json();
      const db = getDB(env);
      const id = data.id || `u${Date.now()}`;
      await db.prepare(
        `INSERT INTO users (id, name, email, phone, role, address, is_verified, stamps, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        id,
        data.name || '',
        data.email || '',
        data.phone || '',
        data.role || 'CUSTOMER',
        data.address || '',
        data.isVerified ? 1 : 0,
        data.stamps || 0
      ).run();
      const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
      return json(rowToUser(row), 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    const status = err.status || 500;
    return json({ error: err.message || 'Internal Server Error' }, status);
  }
};
