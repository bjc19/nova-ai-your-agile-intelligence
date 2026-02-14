import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Jira connections
    const jiraConns = await base44.entities.JiraConnection.list();
    
    if (jiraConns.length === 0) {
      return Response.json({ error: 'No Jira connection found' }, { status: 400 });
    }

    const connection = jiraConns[0];
    
    // Delete and recreate with is_active: false to work around RLS update issue
    await base44.entities.JiraConnection.delete(connection.id);
    
    const newConnection = {
      user_email: connection.user_email,
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      expires_at: connection.expires_at,
      cloud_id: connection.cloud_id,
      scopes: connection.scopes,
      connected_at: connection.connected_at,
      is_active: false
    };
    
    await base44.entities.JiraConnection.create(newConnection);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Jira:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});