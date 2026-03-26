import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Check connections
    const conns = await base44.entities.JiraConnection.list();
    const selections = await base44.entities.JiraProjectSelection.list();

    const result = {
      connections: conns.map(c => ({
        id: c.id,
        user_email: c.user_email,
        is_active: c.is_active,
        cloud_id: c.cloud_id,
        has_token: !!c.access_token
      })),
      selections: selections.map(s => ({
        id: s.id,
        name: s.jira_project_name,
        key: s.jira_project_key,
        board_id: s.jira_board_id,
        is_active: s.is_active
      }))
    };

    return Response.json(result);
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});