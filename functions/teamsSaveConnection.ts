import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { access_token, refresh_token, expires_in, tenant_id, scopes } = await req.json();

    if (!access_token || !refresh_token || !tenant_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    console.log('Saving Teams connection for user:', user.email);

    // Create connection with authenticated user context - respects RLS
    const result = await base44.entities.TeamsConnection.create({
      user_email: user.email,
      access_token,
      refresh_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      tenant_id,
      scopes: scopes || [],
      is_active: true
    });

    console.log('Teams connection created:', result?.id);

    return new Response(JSON.stringify({ success: true, connection_id: result?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Teams save connection error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});