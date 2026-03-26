import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Jira connections - RLS will filter by created_by automatically
    const allConns = await base44.entities.JiraConnection.list();
    const activeConns = allConns.filter(conn => conn.is_active === true);

    return Response.json({
      user_email: user.email,
      total_connections: allConns.length,
      active_connections: activeConns.length,
      connections: activeConns.map(c => ({
        id: c.id,
        user_email: c.user_email,
        cloud_id: c.cloud_id,
        is_active: c.is_active,
        created_at: c.created_date,
        expires_at: c.expires_at
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});