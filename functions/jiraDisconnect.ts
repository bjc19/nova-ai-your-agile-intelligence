import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Jira connections (RLS will filter to user's records)
    const jiraConns = await base44.entities.JiraConnection.list();
    
    if (jiraConns.length === 0) {
      return Response.json({ error: 'No Jira connection found' }, { status: 400 });
    }

    const connection = jiraConns[0];
    
    // Log for debugging
    console.log('User:', user.email);
    console.log('Connection created_by:', connection.created_by);
    console.log('Connection data:', connection);
    
    // Update the connection
    await base44.entities.JiraConnection.update(connection.id, { is_active: false });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Jira:', error.message);
    console.error('Full error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});