import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      console.log('[slackDisconnect] No user authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[slackDisconnect] User:', user.email);

    // Find and deactivate user's connection
    const connections = await base44.entities.SlackConnection.filter({ 
      user_email: user.email 
    });

    console.log('[slackDisconnect] Found connections:', connections.length);

    if (connections.length > 0) {
      console.log('[slackDisconnect] Deactivating connection:', connections[0].id);
      await base44.entities.SlackConnection.update(connections[0].id, {
        is_active: false
      });
      console.log('[slackDisconnect] Connection deactivated successfully');
    } else {
      console.log('[slackDisconnect] No active connection found');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[slackDisconnect] Error:', error.message, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});