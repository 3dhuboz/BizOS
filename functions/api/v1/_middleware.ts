// Tenant-aware middleware for all API v1 endpoints
// Extracts X-Tenant-ID header and validates tenant exists
export const onRequest = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const isPlatformApi = url.pathname.includes('/api/v1/platform');

    // Platform APIs skip tenant validation (they require DEV auth instead)
    if (isPlatformApi) {
      context.tenantId = null;
      return await context.next();
    }

    // Extract tenant ID from header
    const tenantId = context.request.headers.get('X-Tenant-ID') || 'default';
    context.tenantId = tenantId;

    // For non-default tenants, validate they exist and are active
    if (tenantId !== 'default') {
      const db = context.env.DB;
      if (db) {
        const tenant = await db.prepare(
          'SELECT id, status FROM tenants WHERE id = ?'
        ).bind(tenantId).first();

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
          .bind(new Date().toISOString(), tenantId).run().catch(() => {});
      }
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
