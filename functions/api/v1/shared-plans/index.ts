import { getDB, generateId, rowToSharedPlan } from '../_lib/db';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = getDB(env);

    if (request.method === 'POST') {
      const body = await request.json();
      const id = generateId();
      const expires = new Date(Date.now() + 14 * 86400000).toISOString(); // 14 days

      await db.prepare(`
        INSERT INTO shared_plans (id, host_name, host_email, title, event_date, package_id, selected_items, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, body.hostName, body.hostEmail || null, body.title,
        body.eventDate || null, body.packageId || null,
        JSON.stringify(body.selectedItems || []), expires
      ).run();

      const row = await db.prepare('SELECT * FROM shared_plans WHERE id = ?').bind(id).first();
      return json(rowToSharedPlan(row), 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
