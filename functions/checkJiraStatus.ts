import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all Jira connections for this user
    const allConns = await base44.asServiceRole.entities.JiraConnection.list();
    
    // Filter by created_by (user qui a créé la connexion)
    const userConns = allConns.filter(conn => conn.created_by === user.email);
    
    // Filter active ones
    const activeConns = userConns.filter(conn => conn.is_active === true);

    return Response.json({
      user_email: user.email,
      total_connections: userConns.length,
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