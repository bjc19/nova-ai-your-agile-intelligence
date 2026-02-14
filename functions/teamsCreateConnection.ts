import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('❌ Not authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { accessToken, refreshToken, tenantId, expiresIn, scopes } = body;

    if (!accessToken || !refreshToken || !tenantId) {
      console.error('❌ Missing required fields:', { accessToken: !!accessToken, refreshToken: !!refreshToken, tenantId });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.log('📝 Creating Teams connection for:', user.email);
    const connection = await base44.entities.TeamsConnection.create({
      user_email: user.email,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      tenant_id: tenantId,
      is_active: true,
      scopes: scopes || []
    });

    console.log('✅ Teams connection created:', connection.id);
    return Response.json({ success: true, connection });
  } catch (error) {
    console.error('❌ Error creating Teams connection:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});