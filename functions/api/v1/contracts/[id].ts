import { getDB, rowToContract } from '../_lib/db';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = getDB(env);
    const id = params.id;

    if (request.method === 'GET') {
      const row = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
      if (!row) return json({ error: 'Not found' }, 404);
      return json(rowToContract(row));
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      if (body.signed) {
        const now = new Date().toISOString();
        await db.prepare(
          'UPDATE contracts SET signed = 1, signed_at = ?, signature_data = ? WHERE id = ?'
        ).bind(now, body.signatureData || 'acknowledged', id).run();
      }
      const row = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
      return json(rowToContract(row));
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
