import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User:', user.email, 'Role:', user.role);

    // Get Jira connections for this user using filter
    let userConns = [];
    try {
      userConns = await base44.asServiceRole.entities.JiraConnection.filter({
        user_email: user.email
      });
      console.log('Connections found:', userConns.length);
    } catch (e) {
      console.error('Error querying connections:', e.message);
      throw e;
    }
    
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