import { getDB, rowToBooking } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = getDB(env);

    if (request.method === 'GET') {
      // Return bookings/orders with outstanding balances
      const auth = await verifyAuth(request, env);
      requireAuth(auth, 'ADMIN');

      const { results: bookings } = await db.prepare(
        "SELECT * FROM bookings WHERE balance_due > 0 AND status NOT IN ('cancelled', 'completed') ORDER BY event_date ASC"
      ).all();

      return json(bookings.map(rowToBooking));
    }

    if (request.method === 'POST') {
      // Trigger payment reminders for upcoming/overdue bookings
      const auth = await verifyAuth(request, env);
      requireAuth(auth, 'ADMIN');

      const today = new Date().toISOString().split('T')[0];
      const sevenDaysOut = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      // Find bookings with balance due within 7 days or overdue
      const { results: upcoming } = await db.prepare(
        "SELECT * FROM bookings WHERE balance_due > 0 AND event_date <= ? AND event_date >= ? AND status NOT IN ('cancelled', 'completed')"
      ).bind(sevenDaysOut, today).all();

      const { results: overdue } = await db.prepare(
        "SELECT * FROM bookings WHERE balance_due > 0 AND event_date < ? AND status NOT IN ('cancelled', 'completed')"
      ).bind(today).all();

      // In a full implementation, this would send emails/SMS
      // For now, return the counts
      return json({
        upcoming: upcoming.length,
        overdue: overdue.length,
        message: `Found ${upcoming.length} upcoming and ${overdue.length} overdue payment reminders.`,
      });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
