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

    // STEP 1: Disable all active Trello connections for this user (exclusivity)
    console.log('Step 1: Disabling all active Trello connections for user:', user.email);
    try {
      const activeTrelloConns = await base44.entities.TrelloConnection.filter({
        user_email: user.email,
        is_active: true
      });
      
      for (const conn of activeTrelloConns) {
        await base44.entities.TrelloConnection.update(conn.id, { is_active: false });
        console.log('Disabled Trello connection:', conn.id);
      }
    } catch (e) {
      console.warn('Warning: Could not disable Trello connections:', e.message);
      // Don't fail the whole operation if Trello disable fails
    }

    // STEP 2: Get or create Jira connection
    console.log('Step 2: Saving Jira connection for user:', user.email);
    let allConns = [];
    try {
      allConns = await base44.entities.JiraConnection.filter({
        user_email: user.email
      });
      console.log('Found existing Jira connections:', allConns.length);
    } catch (e) {
      console.error('Error listing Jira connections:', e);
    }

    if (allConns.length > 0) {
      // Update existing connection and mark as active
      console.log('Updating existing Jira connection:', allConns[0].id);
      await base44.entities.JiraConnection.update(allConns[0].id, {
        user_email: connectionData.user_email,
        access_token: connectionData.access_token,
        refresh_token: connectionData.refresh_token,
        expires_at: connectionData.expires_at,
        cloud_id: connectionData.cloud_id,
        is_active: true,
        scopes: connectionData.scopes,
        connected_at: new Date().toISOString(),
      });
      console.log('Jira connection updated successfully and marked as active');
    } else {
      // Create new connection
      console.log('Creating new Jira connection');
      const newConn = await base44.entities.JiraConnection.create({
        user_email: connectionData.user_email,
        access_token: connectionData.access_token,
        refresh_token: connectionData.refresh_token,
        expires_at: connectionData.expires_at,
        cloud_id: connectionData.cloud_id,
        is_active: true,
        scopes: connectionData.scopes,
        connected_at: new Date().toISOString(),
      });
      console.log('Jira connection created successfully:', newConn.id);
    }

    // STEP 3: Validation - verify Jira is now active and Trello is disabled
    const verifyJira = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });
    
    const verifyTrello = await base44.entities.TrelloConnection.filter({
      user_email: user.email,
      is_active: true
    });

    console.log('Validation: Active Jira connections:', verifyJira.length, ', Active Trello connections:', verifyTrello.length);

    if (verifyJira.length === 0) {
      throw new Error('Jira connection failed to activate');
    }

    if (verifyTrello.length > 0) {
      console.warn('Warning: Trello connections were not fully disabled');
    }

    return Response.json({ 
      success: true,
      message: 'Jira connection saved and activated. Trello connections disabled.'
    });
  } catch (error) {
    console.error('Error saving Jira connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});