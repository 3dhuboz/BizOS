import { getDB, generateId, rowToBooking } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = getDB(env);

    if (request.method === 'GET') {
      const auth = await verifyAuth(request, env);
      requireAuth(auth, 'ADMIN');
      const { results } = await db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
      return json(results.map(rowToBooking));
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const id = generateId();
      const depositAmount = body.depositAmount || Math.ceil((body.estimatedTotal || 0) * 0.3);
      const balanceDue = (body.estimatedTotal || 0) - depositAmount;

      await db.prepare(`
        INSERT INTO bookings (id, customer_name, customer_email, customer_phone, event_date, service_type, guest_count, package_id, package_name, estimated_total, deposit_amount, balance_due, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, body.customerName, body.customerEmail, body.customerPhone || null,
        body.eventDate, body.serviceType || null, body.guestCount || null,
        body.packageId || null, body.packageName || null,
        body.estimatedTotal, depositAmount, balanceDue, body.notes || null
      ).run();

      const row = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
      return json(rowToBooking(row), 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
