import { getDB, parseJson } from '../_lib/db';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await request.json();
    const { message, history = [], customerEmail, customerPhone } = body;

    const db = getDB(env);

    // Gather live context
    const settingsRow = await db.prepare("SELECT data FROM settings WHERE key = 'general'").first() as any;
    const settings = settingsRow ? JSON.parse(settingsRow.data) : {};

    // Available dates (next 30 days, exclude blocked)
    const today = new Date();
    const thirtyDaysOut = new Date(today.getTime() + 30 * 86400000);
    const { results: blockedEvents } = await db.prepare(
      "SELECT date FROM calendar_events WHERE type = 'BLOCKED'"
    ).all();
    const blockedDates = new Set(blockedEvents.map((e: any) => e.date));

    const availableDates: string[] = [];
    for (let d = new Date(today); d <= thirtyDaysOut; d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().split('T')[0];
      if (!blockedDates.has(ds)) availableDates.push(ds);
    }

    // Menu summary
    const { results: menuRows } = await db.prepare(
      'SELECT name, price, category, available_for_catering FROM menu_items WHERE available = 1 LIMIT 50'
    ).all();
    const menuSummary = menuRows.map((m: any) => `${m.name} ($${m.price})`).join(', ');

    // Packages
    const packages = settings.cateringPackages || [];
    const packageSummary = packages.map((p: any) => `${p.name}: $${p.price}/head, min ${p.minPax} guests`).join('\n');

    // Customer order history (if identified)
    let orderContext = '';
    if (customerEmail) {
      const { results: orders } = await db.prepare(
        'SELECT id, status, total, cook_day, type FROM orders WHERE customer_email = ? ORDER BY created_at DESC LIMIT 5'
      ).bind(customerEmail).all();
      if (orders.length > 0) {
        orderContext = 'Customer recent orders:\n' + orders.map((o: any) =>
          `- Order ${o.id.slice(0,8)}: ${o.status}, $${o.total}, ${o.type}, ${o.cook_day}`
        ).join('\n');
      }
    }

    // Build AI persona
    const aiPersona = settings.aiPersona || {
      name: 'Business AI',
      role: 'Business assistant',
      personality: 'Helpful, professional.',
      expertise: ['Booking', 'Pricing', 'Availability'],
    };

    const businessName = settings.businessName || 'Our Business';

    const systemPrompt = `You are ${aiPersona.name}, the AI receptionist for ${businessName}. ${aiPersona.personality}

Your job:
1. AVAILABILITY: Check if dates are available. Available dates (next 30 days): ${availableDates.slice(0, 14).join(', ')}${availableDates.length > 14 ? '...' : ''}
2. PACKAGES: Explain service packages:
${packageSummary || 'No packages configured yet.'}
3. PRICING: Calculate quotes (package price x guest count)
4. ORDER STATUS: Look up orders if the customer is identified
5. GENERAL: Answer questions about the business, menu, services

Menu/Services: ${menuSummary || 'Not configured yet.'}

${orderContext}

RULES:
- Be concise and friendly
- If you can provide a quote, include it
- If the request is complex, suggest they contact us directly
- Always be helpful

Respond with JSON: {"reply": "your message", "action": null}
If you can suggest a booking, use: {"reply": "message", "action": {"type": "SHOW_QUOTE", "data": {"packageName": "...", "guestCount": N, "total": N, "date": "YYYY-MM-DD"}}}
If you find an order status, use: {"reply": "message", "action": {"type": "SHOW_STATUS", "data": {"orderId": "...", "status": "...", "total": N}}}
If you need to hand off, use: {"reply": "message", "action": {"type": "HANDOFF", "data": {}}}`;

    // Call OpenRouter
    const apiKey = settings.openrouterApiKey || settings.geminiApiKey || env.OPENROUTER_API_KEY;
    if (!apiKey) return json({ reply: "I'm not fully set up yet. Please contact us directly!", action: null });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: any) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
      { role: 'user', content: message },
    ];

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://universal-biz.pages.dev',
        'X-Title': businessName,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiRes.ok) {
      return json({ reply: "I'm having trouble right now. Please try again or contact us directly.", action: null });
    }

    const aiData = await aiRes.json() as any;
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    // Try to parse JSON response
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return json({ reply: parsed.reply || rawContent, action: parsed.action || null });
      }
    } catch { /* fallback to plain text */ }

    return json({ reply: rawContent, action: null });
  } catch (err: any) {
    return json({ reply: "Something went wrong. Please try again.", action: null });
  }
};
