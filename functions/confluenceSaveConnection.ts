import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { access_token, refresh_token, expires_at, cloud_id, account_email } = await req.json();

    if (!access_token || !cloud_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete existing connection if any
    const existingConns = await base44.entities.ConfluenceConnection.filter({
      user_email: user.email
    });

    if (existingConns.length > 0) {
      await base44.entities.ConfluenceConnection.delete(existingConns[0].id);
    }

    // Create new connection
    await base44.entities.ConfluenceConnection.create({
      user_email: user.email,
      cloud_id: cloud_id,
      account_email: account_email,
      access_token: access_token,
      refresh_token: refresh_token,
      expires_at: expires_at,
      is_active: true,
      connected_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving Confluence connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});