import { getDB } from '../_lib/db';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

    const url = new URL(request.url);
    const month = url.searchParams.get('month'); // e.g. "2026-03"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return json({ error: 'Provide ?month=YYYY-MM' }, 400);
    }

    const db = getDB(env);
    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    // Fetch blocked dates and existing bookings for this month
    const { results: blockedEvents } = await db.prepare(
      "SELECT date FROM calendar_events WHERE type = 'BLOCKED' AND date LIKE ?"
    ).bind(`${month}%`).all();
    const blockedDates = new Set(blockedEvents.map((e: any) => e.date));

    const { results: existingBookings } = await db.prepare(
      "SELECT event_date, COUNT(*) as cnt FROM bookings WHERE event_date LIKE ? AND status NOT IN ('cancelled') GROUP BY event_date"
    ).bind(`${month}%`).all();
    const bookingCounts: Record<string, number> = {};
    for (const b of existingBookings) {
      bookingCounts[(b as any).event_date] = (b as any).cnt;
    }

    // Also check catering orders
    const { results: cateringOrders } = await db.prepare(
      "SELECT cook_day, COUNT(*) as cnt FROM orders WHERE cook_day LIKE ? AND type = 'CATERING' AND status NOT IN ('Cancelled', 'Rejected') GROUP BY cook_day"
    ).bind(`${month}%`).all();
    for (const o of cateringOrders) {
      const day = (o as any).cook_day;
      bookingCounts[day] = (bookingCounts[day] || 0) + (o as any).cnt;
    }

    const today = new Date().toISOString().split('T')[0];
    const availability: { date: string; available: boolean }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateStr <= today;
      const isBlocked = blockedDates.has(dateStr);
      const isFull = (bookingCounts[dateStr] || 0) >= 2; // Max 2 bookings per day
      availability.push({ date: dateStr, available: !isPast && !isBlocked && !isFull });
    }

    return json(availability);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
