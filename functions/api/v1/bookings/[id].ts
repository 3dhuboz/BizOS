import { getDB, rowToBooking } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = getDB(env);
    const id = params.id;

    if (request.method === 'GET') {
      const row = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
      if (!row) return json({ error: 'Not found' }, 404);
      return json(rowToBooking(row));
    }

    if (request.method === 'PUT') {
      const auth = await verifyAuth(request, env);
      requireAuth(auth, 'ADMIN');
      const body = await request.json();

      const fields: string[] = [];
      const values: any[] = [];
      for (const [key, val] of Object.entries(body)) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${col} = ?`);
        values.push(val);
      }
      values.push(id);
      await db.prepare(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

      const row = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
      return json(rowToBooking(row));
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
