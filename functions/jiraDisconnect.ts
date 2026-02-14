import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active Jira connection (RLS filters to user's records)
    const jiraConns = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });
    
    if (jiraConns.length === 0) {
      console.log('No active Jira connection found for user:', user.email);
      return Response.json({ 
        success: true,
        message: 'Already disconnected'
      });
    }

    const connection = jiraConns[0];
    
    // Mark connection as inactive instead of deleting it
    console.log('Disabling Jira connection:', connection.id, 'for user:', user.email);
    await base44.entities.JiraConnection.update(connection.id, { 
      is_active: false 
    });
    
    // Validation - verify it's now inactive
    const verifyConns = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (verifyConns.length > 0) {
      console.error('Validation failed: Still have', verifyConns.length, 'active Jira connections');
      throw new Error('Failed to deactivate Jira connection');
    }

    console.log('Validation passed: No active Jira connections remain');

    console.log('Jira connection successfully deactivated');
    return Response.json({ 
      success: true,
      message: 'Jira connection disconnected'
    });
  } catch (error) {
    console.error('Jira disconnect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});