import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionData = await req.json();

    // Verify the connection belongs to this user
    if (connectionData.user_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // CRITICAL: Disable any Trello connections first (mutual exclusivity)
    const trelloConns = await base44.asServiceRole.entities.TrelloConnection.list();
    if (trelloConns.length > 0) {
      for (const trelloConn of trelloConns) {
        await base44.asServiceRole.entities.TrelloConnection.update(trelloConn.id, {
          is_active: false
        });
      }
      console.log('Disabled Trello connections due to Jira connection');
    }

    // Check if connection already exists
    let allConns = [];
    try {
      allConns = await base44.entities.JiraConnection.list();
      console.log('Found connections:', allConns.length);
    } catch (e) {
      console.error('Error listing connections:', e);
    }

    if (allConns.length > 0) {
      // Update existing connection
      console.log('Updating existing Jira connection:', allConns[0].id);
      try {
        await base44.entities.JiraConnection.update(allConns[0].id, {
          user_email: connectionData.user_email,
          access_token: connectionData.access_token,
          refresh_token: connectionData.refresh_token,
          expires_at: connectionData.expires_at,
          cloud_id: connectionData.cloud_id,
          is_active: true,
          scopes: connectionData.scopes,
          connected_at: connectionData.connected_at,
        });
        console.log('Connection updated successfully');
      } catch (updateError) {
        console.error('Error updating connection:', updateError);
        throw updateError;
      }
    } else {
      // Create new connection
      console.log('Creating new Jira connection');
      try {
        const newConn = await base44.entities.JiraConnection.create({
          user_email: connectionData.user_email,
          access_token: connectionData.access_token,
          refresh_token: connectionData.refresh_token,
          expires_at: connectionData.expires_at,
          cloud_id: connectionData.cloud_id,
          is_active: true,
          scopes: connectionData.scopes,
          connected_at: connectionData.connected_at,
        });
        console.log('Connection created successfully:', newConn.id);
      } catch (createError) {
        console.error('Error creating connection:', createError);
        throw createError;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving Jira connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});