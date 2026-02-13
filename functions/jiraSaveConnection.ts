import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionData = await req.json();

    // Verify the connection belongs to this user
    if (connectionData.user_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if connection already exists (by created_by, since any user can own multiple connections)
    const allConns = await base44.asServiceRole.entities.JiraConnection.filter({
      created_by: user.email,
      is_active: true
    });

    if (allConns.length > 0) {
      // Update existing connection
      await base44.entities.JiraConnection.update(allConns[0].id, {
        user_email: connectionData.user_email,
        access_token: connectionData.access_token,
        refresh_token: connectionData.refresh_token,
        expires_at: connectionData.expires_at,
        cloud_id: connectionData.cloud_id,
        is_active: true,
        scopes: connectionData.scopes,
        connected_at: connectionData.connected_at,
      });
    } else {
      // Create new connection
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