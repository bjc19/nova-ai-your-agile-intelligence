import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Slack connection
    const connections = await base44.asServiceRole.entities.SlackConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!connections || connections.length === 0) {
      return Response.json({
        connected: false,
        permissions_valid: false,
        missing_scopes: []
      });
    }

    const connection = connections[0];
    const accessToken = connection.access_token;

    // Test permissions by trying to list channels
    const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const channelsData = await channelsResponse.json();

    let missingScopes = [];

    // Check if we need channels:history
    if (!channelsData.ok && channelsData.error === 'missing_scope') {
      missingScopes.push('channels:history');
    }

    // Test if we can read private channels/groups
    if (channelsData.ok && channelsData.channels) {
      const hasPrivateChannels = channelsData.channels.some(c => c.is_private);
      
      if (hasPrivateChannels) {
        // Try to get history of a private channel
        const privateChannel = channelsData.channels.find(c => c.is_private && c.is_member);
        
        if (privateChannel) {
          const historyResponse = await fetch('https://slack.com/api/conversations.history', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channel: privateChannel.id, limit: 1 })
          });

          const historyData = await historyResponse.json();
          
          if (!historyData.ok && historyData.error === 'missing_scope') {
            if (!missingScopes.includes('groups:history')) {
              missingScopes.push('groups:history');
            }
          }
        }
      }
    }

    // Try public channel history
    if (channelsData.ok && channelsData.channels && missingScopes.length === 0) {
      const publicChannel = channelsData.channels.find(c => !c.is_private && c.is_member);
      
      if (publicChannel) {
        const historyResponse = await fetch('https://slack.com/api/conversations.history', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ channel: publicChannel.id, limit: 1 })
        });

        const historyData = await historyResponse.json();
        
        if (!historyData.ok && historyData.error === 'missing_scope') {
          missingScopes.push('channels:history');
        }
      }
    }

    return Response.json({
      connected: true,
      permissions_valid: missingScopes.length === 0,
      missing_scopes: missingScopes,
      required_scopes: ['channels:history', 'groups:history']
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      connected: false,
      permissions_valid: false
    }, { status: 500 });
  }
});