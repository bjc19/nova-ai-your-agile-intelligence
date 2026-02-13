import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionData = await req.json();

    // Check if connection already exists using service role to bypass RLS
    const existingConns = await base44.asServiceRole.entities.JiraConnection.filter({
      user_email: connectionData.user_email
    });

    // Verify that if a connection exists, the current user created it
    if (existingConns.length > 0 && existingConns[0].created_by !== user.email) {
      return Response.json({ error: 'Forbidden - connection owned by another user' }, { status: 403 });
    }

    if (existingConns.length > 0) {
      // Update existing connection
      await base44.asServiceRole.entities.JiraConnection.update(existingConns[0].id, {
        access_token: connectionData.access_token,
        refresh_token: connectionData.refresh_token,
        expires_at: connectionData.expires_at,
        cloud_id: connectionData.cloud_id,
        is_active: true,
        scopes: connectionData.scopes,
        connected_at: connectionData.connected_at,
      });
    } else {
      // Create new connection with the Jira email provided
      await base44.entities.JiraConnection.create({
        user_email: connectionData.user_email,
        access_token: connectionData.access_token,
        refresh_token: connectionData.refresh_token,
        expires_at: connectionData.expires_at,
        cloud_id: connectionData.cloud_id,
        is_active: true,
        scopes: connectionData.scopes,
        connected_at: connectionData.connected_at,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving Jira connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});