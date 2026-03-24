import { getDB, parseJson } from './_lib/db';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

    const db = getDB(env);
    const settingsRow = await db.prepare("SELECT data FROM settings WHERE key = 'general'").first() as any;
    const settings = settingsRow ? JSON.parse(settingsRow.data) : {};

    const { results: menuRows } = await db.prepare(
      'SELECT name, price, unit, category, available_for_catering FROM menu_items WHERE available = 1'
    ).all();

    const { results: galleryRows } = await db.prepare(
      'SELECT image_url, caption, likes FROM gallery_posts WHERE approved = 1 ORDER BY likes DESC LIMIT 6'
    ).all();

    return json({
      businessName: settings.businessName || 'Our Business',
      logoUrl: settings.logoUrl,
      address: settings.businessAddress,
      email: settings.emailSettings?.fromEmail,
      phone: settings.smsSettings?.fromNumber,
      packages: settings.cateringPackages || [],
      menuItems: menuRows,
      gallery: galleryRows,
      contractSettings: settings.contractSettings || {},
    });
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
