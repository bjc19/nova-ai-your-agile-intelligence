import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trello_user_id, trello_username, access_token, api_key } = await req.json();

    if (!trello_user_id || !access_token || !api_key) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete existing connection if any
    const existingConns = await base44.entities.TrelloConnection.filter({
      user_email: user.email
    });

    if (existingConns.length > 0) {
      await base44.entities.TrelloConnection.delete(existingConns[0].id);
    }

    // Create new connection
    await base44.entities.TrelloConnection.create({
      user_email: user.email,
      trello_user_id: trello_user_id,
      trello_username: trello_username,
      access_token: access_token,
      api_key: api_key,
      is_active: true,
      connected_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving Trello connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});