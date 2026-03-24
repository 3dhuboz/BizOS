import { getDB, rowToTenant } from './_lib/db';

// Public endpoint: resolves tenant from Host header (custom domain)
// Called by the frontend on boot to determine which tenant's data to load
export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

    const host = request.headers.get('Host') || '';
    const cleanHost = host.split(':')[0];

    // Check if this is the platform's own domain
    const platformDomains = ['bizos-app.pages.dev', 'localhost', '127.0.0.1'];
    const isOwnDomain = platformDomains.some(d => cleanHost.includes(d));

    if (isOwnDomain) {
      return json({ tenantId: null, isPlatform: true });
    }

    // Look up tenant by custom domain
    const db = getDB(env);
    const tenant = await db.prepare(
      'SELECT * FROM tenants WHERE custom_domain = ? AND status = ?'
    ).bind(cleanHost, 'active').first();

    if (tenant) {
      return json({
        tenantId: (tenant as any).id,
        tenant: rowToTenant(tenant),
        isPlatform: false,
      });
    }

    // No tenant found for this domain
    return json({ tenantId: null, isPlatform: false, error: 'No tenant configured for this domain' });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
};
