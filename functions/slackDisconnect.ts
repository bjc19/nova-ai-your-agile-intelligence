import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find and deactivate user's connection
    const connections = await base44.entities.SlackConnection.filter({ 
      user_email: user.email 
    });

    if (connections.length > 0) {
      await base44.entities.SlackConnection.update(connections[0].id, {
        is_active: false
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});