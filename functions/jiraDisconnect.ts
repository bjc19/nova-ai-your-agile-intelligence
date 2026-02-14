import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Jira connection
    const jiraConns = await base44.entities.JiraConnection.list();
    
    if (jiraConns.length > 0) {
      await base44.entities.JiraConnection.update(jiraConns[0].id, { is_active: false });
      return Response.json({ success: true });
    }
    
    return Response.json({ error: 'No Jira connection found' }, { status: 400 });
  } catch (error) {
    console.error('Error disconnecting Jira:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});