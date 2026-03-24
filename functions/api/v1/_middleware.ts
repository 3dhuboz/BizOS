// Tenant-aware middleware for all API v1 endpoints
// Resolves tenant from: X-Tenant-ID header, OR custom domain (Host header)
export const onRequest = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const isPlatformApi = url.pathname.includes('/api/v1/platform');

    // Platform APIs skip tenant validation (they require DEV auth instead)
    if (isPlatformApi) {
      context.tenantId = null;
      return await context.next();
    }

    const db = context.env.DB;
    let tenantId = context.request.headers.get('X-Tenant-ID') || null;

    // If no explicit tenant header, try resolving from custom domain (Host header)
    if (!tenantId && db) {
      const host = context.request.headers.get('Host') || '';
      // Skip domain lookup for the platform's own domain
      const platformDomains = ['bizos-app.pages.dev', 'localhost', '127.0.0.1'];
      const isOwnDomain = platformDomains.some(d => host.includes(d));

      if (!isOwnDomain && host) {
        // Strip port number if present
        const cleanHost = host.split(':')[0];
        const tenant = await db.prepare(
          'SELECT id, status FROM tenants WHERE custom_domain = ? AND status = ?'
        ).bind(cleanHost, 'active').first();

        if (tenant) {
          tenantId = (tenant as any).id;
        }
      }
    }

    // Default to 'default' tenant
    context.tenantId = tenantId || 'default';

    // For non-default tenants, validate they exist and are active
    if (context.tenantId !== 'default' && db) {
      const tenant = await db.prepare(
        'SELECT id, status FROM tenants WHERE id = ?'
      ).bind(context.tenantId).first();

      if (!tenant) {
        return new Response(JSON.stringify({ error: 'Tenant not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if ((tenant as any).status === 'suspended') {
        return new Response(JSON.stringify({ error: 'Tenant suspended' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update last_active_at (fire and forget)
      db.prepare('UPDATE tenants SET last_active_at = datetime(?) WHERE id = ?')
        .bind(new Date().toISOString(), context.tenantId).run().catch(() => {});
    }

    return await context.next();
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
