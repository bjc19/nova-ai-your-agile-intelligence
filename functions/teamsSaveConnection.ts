import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionData = await req.json();

    // Save Teams connection
    await base44.entities.TeamsConnection.create({
      user_email: user.email,
      access_token: connectionData.access_token,
      refresh_token: connectionData.refresh_token,
      expires_at: connectionData.expires_at,
      tenant_id: connectionData.tenant_id,
      scopes: connectionData.scopes,
      is_active: true
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});