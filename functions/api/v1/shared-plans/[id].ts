import { getDB, rowToSharedPlan, rowToSharedPlanResponse, parseJson } from '../_lib/db';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = getDB(env);
    const id = params.id;

    if (request.method === 'GET') {
      const row = await db.prepare('SELECT * FROM shared_plans WHERE id = ?').bind(id).first();
      if (!row) return json({ error: 'Not found' }, 404);
      const plan = rowToSharedPlan(row);

      // Fetch responses
      const { results: responseRows } = await db.prepare(
        'SELECT * FROM shared_plan_responses WHERE shared_plan_id = ? ORDER BY created_at ASC'
      ).bind(id).all();
      const responses = responseRows.map(rowToSharedPlanResponse);

      // Fetch menu items if selected
      let menuItems: any[] = [];
      const selectedIds = plan.selectedItems || [];
      if (selectedIds.length > 0) {
        const placeholders = selectedIds.map(() => '?').join(',');
        const { results } = await db.prepare(
          `SELECT id, name, price, description, image, category FROM menu_items WHERE id IN (${placeholders})`
        ).bind(...selectedIds).all();
        menuItems = results;
      }

      return json({ ...plan, responses, menuItems });
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      if (body.status) {
        await db.prepare('UPDATE shared_plans SET status = ? WHERE id = ?').bind(body.status, id).run();
      }
      const row = await db.prepare('SELECT * FROM shared_plans WHERE id = ?').bind(id).first();
      return json(rowToSharedPlan(row));
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
