import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all Jira connections and filter client-side (RLS safeguard)
    let allConns = [];
    try {
      allConns = await base44.entities.JiraConnection.list();
      console.log('Total Jira connections in DB:', allConns.length);
    } catch (e) {
      console.log('Error listing connections:', e.message);
      allConns = [];
    }

    // Find user's active connection (client-side filter with RLS protection)
    const userActiveConns = allConns.filter(c => 
      c.user_email === user.email && c.is_active === true
    );
    
    if (userActiveConns.length === 0) {
      console.log('No active Jira connection found for user:', user.email);
      return Response.json({ 
        success: true,
        message: 'Already disconnected'
      });
    }

    const connection = userActiveConns[0];
    
    // Mark connection as inactive
    console.log('Disabling Jira connection:', connection.id, 'for user:', user.email);
    await base44.entities.JiraConnection.update(connection.id, { 
      is_active: false 
    });
    
    // Verification - get all and filter again
    const verifyAllConns = await base44.entities.JiraConnection.list();
    const stillActive = verifyAllConns.filter(c => 
      c.user_email === user.email && c.is_active === true
    );

    console.log('Verification: User still has', stillActive.length, 'active connections');

    if (stillActive.length > 0) {
      console.error('Validation failed: Connection still active after update');
      throw new Error('Failed to deactivate Jira connection');
    }

    console.log('Validation passed: Jira connection successfully deactivated');
    return Response.json({ 
      success: true,
      message: 'Jira connection disconnected'
    });
  } catch (error) {
    console.error('Jira disconnect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});