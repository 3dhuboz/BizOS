import { getDB, generateId, rowToContract } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'ADMIN');

    const db = getDB(env);
    const body = await request.json();
    const id = generateId();

    await db.prepare(`
      INSERT INTO contracts (id, order_id, booking_id, customer_name, customer_email, terms_text)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.orderId || null, body.bookingId || null,
      body.customerName, body.customerEmail, body.termsText
    ).run();

    const row = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
    return json(rowToContract(row), 201);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
