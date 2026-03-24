import { getDB } from '../../_lib/db';
import { verifyAuth, requireAuth } from '../../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'ADMIN');

    const db = getDB(env);
    const userId = params.id;

    // Aggregate order stats
    const statsRow = await db.prepare(`
      SELECT
        COALESCE(SUM(total), 0) as lifetime_value,
        COUNT(*) as order_count,
        MAX(created_at) as last_order_date,
        CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*) ELSE 0 END as avg_value
      FROM orders WHERE user_id = ? AND status NOT IN ('Cancelled', 'Rejected')
    `).bind(userId).first() as any;

    // Favorite items (parse JSON items from each order)
    const { results: orderRows } = await db.prepare(
      'SELECT items FROM orders WHERE user_id = ? AND status NOT IN (?, ?)'
    ).bind(userId, 'Cancelled', 'Rejected').all();

    const itemCounts: Record<string, number> = {};
    for (const row of orderRows) {
      try {
        const items = JSON.parse((row as any).items || '[]');
        for (const entry of items) {
          const name = entry.item?.name || 'Unknown';
          itemCounts[name] = (itemCounts[name] || 0) + (entry.quantity || 1);
        }
      } catch { /* skip malformed */ }
    }

    const favoriteItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Days since last order
    const lastDate = statsRow?.last_order_date;
    let daysSinceLastOrder: number | null = null;
    if (lastDate) {
      daysSinceLastOrder = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
    }

    // Tier calculation
    const lv = statsRow?.lifetime_value || 0;
    const tier = lv >= 500 ? 'gold' : lv >= 200 ? 'silver' : 'bronze';

    return json({
      lifetimeValue: lv,
      orderCount: statsRow?.order_count || 0,
      lastOrderDate: lastDate || null,
      daysSinceLastOrder,
      averageOrderValue: statsRow?.avg_value || 0,
      favoriteItems,
      tier,
    });
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
