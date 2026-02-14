import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin for this operation
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all Jira connections with service role to check which one belongs to this user
    const jiraConns = await base44.asServiceRole.entities.JiraConnection.list();
    const userConnection = jiraConns.find(conn => conn.user_email === user.email || conn.created_by === user.email);
    
    if (!userConnection) {
      return Response.json({ error: 'No Jira connection found for this user' }, { status: 400 });
    }

    // Update with service role to bypass RLS (user is admin, so this is authorized)
    await base44.asServiceRole.entities.JiraConnection.update(userConnection.id, { is_active: false });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Jira:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});