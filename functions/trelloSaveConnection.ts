import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionData = await req.json();

    // Validate required fields
    if (!connectionData.access_token || !connectionData.api_key) {
      return Response.json({ 
        error: 'Missing required fields: access_token and api_key' 
      }, { status: 400 });
    }

    // Verify the connection belongs to this user
    if (connectionData.user_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // STEP 1: Disable all active Jira connections for this user (exclusivity)
    console.log('Step 1: Disabling all active Jira connections for user:', user.email);
    try {
      const activeJiraConns = await base44.entities.JiraConnection.filter({
        user_email: user.email,
        is_active: true
      });
      
      for (const conn of activeJiraConns) {
        await base44.entities.JiraConnection.update(conn.id, { is_active: false });
        console.log('Disabled Jira connection:', conn.id);
      }
    } catch (e) {
      console.warn('Warning: Could not disable Jira connections:', e.message);
      // Don't fail the whole operation if Jira disable fails
    }

    // STEP 2: Get or create Trello connection
    console.log('Step 2: Saving Trello connection for user:', user.email);
    let allConns = [];
    try {
      allConns = await base44.entities.TrelloConnection.filter({
        user_email: user.email
      });
      console.log('Found existing Trello connections:', allConns.length);
    } catch (e) {
      console.error('Error listing Trello connections:', e);
    }

    if (allConns.length > 0) {
      // Update existing connection and mark as active
      console.log('Updating existing Trello connection:', allConns[0].id);
      await base44.entities.TrelloConnection.update(allConns[0].id, {
        user_email: connectionData.user_email,
        access_token: connectionData.access_token,
        api_key: connectionData.api_key,
        is_active: true,
        connected_at: new Date().toISOString(),
      });
      console.log('Trello connection updated successfully and marked as active');
    } else {
      // Create new connection
      console.log('Creating new Trello connection');
      const newConn = await base44.entities.TrelloConnection.create({
        user_email: connectionData.user_email,
        access_token: connectionData.access_token,
        api_key: connectionData.api_key,
        is_active: true,
        connected_at: new Date().toISOString(),
      });
      console.log('Trello connection created successfully:', newConn.id);
    }

    // STEP 3: Validation - verify Trello is now active and Jira is disabled
    const verifyTrello = await base44.entities.TrelloConnection.filter({
      user_email: user.email,
      is_active: true
    });
    
    const verifyJira = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    console.log('Validation: Active Trello connections:', verifyTrello.length, ', Active Jira connections:', verifyJira.length);

    if (verifyTrello.length === 0) {
      throw new Error('Trello connection failed to activate');
    }

    if (verifyJira.length > 0) {
      console.warn('Warning: Jira connections were not fully disabled');
    }

    return Response.json({ 
      success: true,
      message: 'Trello connection saved and activated. Jira connections disabled.'
    });
  } catch (error) {
    console.error('Error saving Trello connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});