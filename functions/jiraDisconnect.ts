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
    
    // Delete the connection
    await base44.entities.JiraConnection.delete(connection.id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Jira:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});