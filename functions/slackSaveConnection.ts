import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[slackSaveConnection] Received data:', JSON.stringify(body, null, 2));
    
    const { access_token, team_id, team_name, bot_user_id, scopes } = body;

    if (!access_token || !team_id) {
      console.error('[slackSaveConnection] Missing required fields:', { access_token: !!access_token, team_id: !!team_id });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if connection exists
    const existing = await base44.entities.SlackConnection.filter({ 
      user_email: user.email 
    });

    const connectionData = {
      user_email: user.email,
      access_token: access_token,
      team_id: team_id,
      team_name: team_name || 'Unknown',
      bot_user_id: bot_user_id || null,
      is_active: true,
      scopes: scopes ? (Array.isArray(scopes) ? scopes : scopes.split(",")) : [],
      connected_at: new Date().toISOString()
    };
    
    console.log('[slackSaveConnection] Saving connection:', { user_email: user.email, team_id, team_name });

    if (existing.length > 0) {
      await base44.entities.SlackConnection.update(existing[0].id, connectionData);
    } else {
      await base44.entities.SlackConnection.create(connectionData);
    }

    return Response.json({ success: true, team_name });
  } catch (error) {
    console.error('[slackSaveConnection] Error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});