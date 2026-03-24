import { getDB } from '../_lib/db';
import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'DEV');
    const db = getDB(env);

    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const [totalTenants, activeTenants, totalOrders, totalRevenue, totalCustomers, totalBookings] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM tenants').first(),
      db.prepare("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'").first(),
      db.prepare('SELECT COUNT(*) as count FROM orders').first(),
      db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status NOT IN ('Cancelled','Rejected')").first(),
      db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'").first(),
      db.prepare('SELECT COUNT(*) as count FROM bookings').first(),
    ]);

    return json({
      totalTenants: (totalTenants as any).count,
      activeTenants: (activeTenants as any).count,
      totalOrders: (totalOrders as any).count,
      totalRevenue: (totalRevenue as any).total,
      totalCustomers: (totalCustomers as any).count,
      totalBookings: (totalBookings as any).count,
    });
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
