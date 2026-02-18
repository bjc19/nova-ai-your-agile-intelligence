import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get and delete old Jira connection
    const jiraConns = await base44.entities.JiraConnection.list();
    
    if (jiraConns.length === 0) {
      return Response.json({ success: true, message: 'No Jira connection found' });
    }

    for (const conn of jiraConns) {
      await base44.entities.JiraConnection.delete(conn.id);
      console.log(`✅ Deleted Jira connection: ${conn.id}`);
    }

    return Response.json({ 
      success: true, 
      message: `Deleted ${jiraConns.length} Jira connection(s)`,
      deleted_ids: jiraConns.map(c => c.id)
    });
  } catch (error) {
    console.error('Error deleting Jira connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});