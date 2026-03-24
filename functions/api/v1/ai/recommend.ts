import { getDB, parseJson } from '../_lib/db';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await request.json();
    const { menuItems = [], pastOrders = [], prefs } = body;

    const db = getDB(env);
    const settingsRow = await db.prepare("SELECT data FROM settings WHERE key = 'general'").first() as any;
    const settings = settingsRow ? JSON.parse(settingsRow.data) : {};
    const apiKey = settings.openrouterApiKey || settings.geminiApiKey || env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // Fallback: random selection
      const available = menuItems.filter((m: any) => m.available);
      const shuffled = available.sort(() => Math.random() - 0.5).slice(0, 3);
      return json({
        greeting: "Here are some picks for you!",
        recommendations: shuffled.map((m: any) => ({ itemId: m.id, name: m.name, reason: 'Popular choice' })),
      });
    }

    const menuList = menuItems
      .filter((m: any) => m.available)
      .map((m: any) => `${m.id}: ${m.name} ($${m.price}) - ${m.category}`)
      .join('\n');

    const pastItems = pastOrders
      .flatMap((o: any) => (o.items || []).map((i: any) => i.item?.name))
      .filter(Boolean);

    const prompt = `You are a friendly recommendation engine. Pick 3 items from this menu for a customer.

Menu:
${menuList}

${pastItems.length > 0 ? `They've previously ordered: ${pastItems.join(', ')}` : 'New customer.'}
${prefs ? `Dietary preferences: ${prefs}` : ''}

Reply with JSON only:
{"greeting": "short friendly message", "recommendations": [{"itemId": "id", "name": "name", "reason": "why this pick"}]}`;

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://universal-biz.pages.dev',
        'X-Title': settings.businessName || 'Business AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!aiRes.ok) {
      const available = menuItems.filter((m: any) => m.available);
      const shuffled = available.sort(() => Math.random() - 0.5).slice(0, 3);
      return json({
        greeting: "Here are some picks for you!",
        recommendations: shuffled.map((m: any) => ({ itemId: m.id, name: m.name, reason: 'Popular choice' })),
      });
    }

    const aiData = await aiRes.json() as any;
    const raw = aiData.choices?.[0]?.message?.content || '';

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return json(parsed);
      }
    } catch { /* fallback */ }

    return json({
      greeting: "Here are some picks for you!",
      recommendations: menuItems.filter((m: any) => m.available).slice(0, 3).map((m: any) => ({
        itemId: m.id, name: m.name, reason: 'Recommended',
      })),
    });
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
