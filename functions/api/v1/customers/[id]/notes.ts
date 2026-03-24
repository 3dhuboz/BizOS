import { getDB, generateId, rowToCustomerNote } from '../../_lib/db';
import { verifyAuth, requireAuth } from '../../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = getDB(env);
    const userId = params.id;

    if (request.method === 'GET') {
      const auth = await verifyAuth(request, env);
      requireAuth(auth, 'ADMIN');
      const { results } = await db.prepare('SELECT * FROM customer_notes WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
      return json(results.map(rowToCustomerNote));
    }

    if (request.method === 'POST') {
      const auth = await verifyAuth(request, env);
      requireAuth(auth, 'ADMIN');
      const body = await request.json();
      const id = generateId();
      await db.prepare(
        'INSERT INTO customer_notes (id, user_id, note, created_by) VALUES (?, ?, ?, ?)'
      ).bind(id, userId, body.note, auth!.userId).run();
      const row = await db.prepare('SELECT * FROM customer_notes WHERE id = ?').bind(id).first();
      return json(rowToCustomerNote(row), 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
