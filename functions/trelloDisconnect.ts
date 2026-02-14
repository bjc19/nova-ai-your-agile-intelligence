import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active Trello connection (RLS filters to user's records)
    const trelloConns = await base44.entities.TrelloConnection.filter({
      user_email: user.email,
      is_active: true
    });
    
    if (trelloConns.length === 0) {
      console.log('No active Trello connection found for user:', user.email);
      return Response.json({ 
        success: true,
        message: 'Already disconnected'
      });
    }

    const connection = trelloConns[0];
    
    // Mark connection as inactive instead of deleting it
    console.log('Disabling Trello connection:', connection.id, 'for user:', user.email);
    await base44.entities.TrelloConnection.update(connection.id, { 
      is_active: false 
    });
    
    // Validation - verify it's now inactive
    const verifyConns = await base44.entities.TrelloConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (verifyConns.length > 0) {
      throw new Error('Failed to deactivate Trello connection');
    }

    console.log('Trello connection successfully deactivated');
    return Response.json({ 
      success: true,
      message: 'Trello connection disconnected'
    });
  } catch (error) {
    console.error('Trello disconnect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});