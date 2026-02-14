import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { accessToken, refreshToken, tenantId, expiresIn, scopes } = body;

    if (!accessToken || !refreshToken || !tenantId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const teamsConn = await base44.entities.TeamsConnection.create({
      user_email: user.email,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      tenant_id: tenantId,
      scopes: scopes || [],
      is_active: true
    });

    console.log('✅ Teams connection created for user:', user.email, 'with ID:', teamsConn.id);
    
    return new Response(JSON.stringify({ success: true, id: teamsConn.id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating Teams connection:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});