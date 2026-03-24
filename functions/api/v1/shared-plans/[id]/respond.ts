import { getDB, generateId, rowToSharedPlanResponse } from '../../_lib/db';

export const onRequest = async (context: any) => {
  const { request, env, params } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const db = getDB(env);
    const planId = params.id;

    // Verify plan exists and is open
    const plan = await db.prepare('SELECT status FROM shared_plans WHERE id = ?').bind(planId).first() as any;
    if (!plan) return json({ error: 'Plan not found' }, 404);
    if (plan.status !== 'open') return json({ error: 'This plan is no longer accepting responses' }, 400);

    const body = await request.json();
    const id = generateId();

    await db.prepare(`
      INSERT INTO shared_plan_responses (id, shared_plan_id, respondent_name, respondent_email, dietary_preferences, headcount, item_votes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, planId, body.respondentName, body.respondentEmail || null,
      body.dietaryPreferences || null, body.headcount || 1,
      JSON.stringify(body.itemVotes || {}), body.notes || null
    ).run();

    const row = await db.prepare('SELECT * FROM shared_plan_responses WHERE id = ?').bind(id).first();
    return json(rowToSharedPlanResponse(row), 201);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
