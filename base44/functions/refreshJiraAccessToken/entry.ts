import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connection_id } = await req.json();

    if (!connection_id) {
      return Response.json({ error: 'connection_id is required' }, { status: 400 });
    }

    // Fetch the connection
    const connections = await base44.entities.JiraConnection.filter({});
    const jiraConn = connections.find(c => c.id === connection_id);

    if (!jiraConn) {
      return Response.json({ error: 'Jira connection not found' }, { status: 404 });
    }

    // Check if token is expired
    const expiresAt = new Date(jiraConn.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    console.log(`⏰ Token expires at: ${jiraConn.expires_at}`);
    console.log(`⏰ Current time: ${now.toISOString()}`);
    console.log(`⏰ Time until expiry: ${Math.floor(timeUntilExpiry / 1000)} seconds`);

    // If token expires within 5 minutes, refresh it
    if (timeUntilExpiry < 5 * 60 * 1000) {
      console.log('🔄 Token expiring soon or already expired, refreshing...');

      if (!jiraConn.refresh_token || jiraConn.refresh_token === 'none') {
        console.error('❌ No refresh token available');
        await base44.entities.JiraConnection.update(connection_id, {
          connection_status_error: true,
          connection_error_message: 'Refresh token not available. Please reconnect Jira.',
          connection_error_timestamp: new Date().toISOString(),
          is_active: false
        });
        return Response.json({ 
          error: 'No refresh token available. Please reconnect Jira.',
          requiresReconnection: true
        }, { status: 401 });
      }

      // Exchange refresh token for new access token
      const clientId = Deno.env.get('JIRA_CLIENT_ID');
      const clientSecret = Deno.env.get('JIRA_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        console.error('❌ Jira OAuth credentials not configured');
        return Response.json({ error: 'Jira OAuth not configured' }, { status: 500 });
      }

      console.log('🔐 Attempting token refresh with Atlassian...');
      console.log(`📝 Client ID: ${clientId.substring(0, 10)}...`);
      console.log(`🔑 Refresh token present: ${!!jiraConn.refresh_token}`);
      console.log(`📋 Refresh token starts with: ${jiraConn.refresh_token?.substring(0, 20)}...`);
      
      const requestBody = {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: jiraConn.refresh_token,
      };

      console.log(`📤 Request body keys: ${Object.keys(requestBody).join(', ')}`);
      console.log(`🔍 Refresh token length: ${jiraConn.refresh_token?.length}`);

      const refreshResponse = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📊 Refresh response status: ${refreshResponse.status}`);
      const responseText = await refreshResponse.text();
      console.log(`📨 Full response body: ${responseText}`);

      if (!refreshResponse.ok) {
        console.error('❌ Token refresh failed:', responseText);
        
        // Mark connection as having error
        await base44.entities.JiraConnection.update(connection_id, {
          connection_status_error: true,
          connection_error_message: 'Token refresh failed. Please reconnect Jira.',
          connection_error_timestamp: new Date().toISOString(),
          is_active: false
        });

        return Response.json({ 
          error: 'Token refresh failed. Please reconnect Jira.',
          requiresReconnection: true
        }, { status: 401 });
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.access_token;
      const newRefreshToken = refreshData.refresh_token || jiraConn.refresh_token;
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

      console.log('✅ Token refreshed successfully');
      console.log(`📅 New expiry: ${newExpiresAt}`);

      // Update connection with new tokens
      await base44.entities.JiraConnection.update(connection_id, {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_at: newExpiresAt,
        connection_status_error: false,
        connection_error_message: null,
        connection_error_timestamp: null,
        is_active: true
      });

      return Response.json({ 
        success: true,
        access_token: newAccessToken,
        expires_at: newExpiresAt,
        message: 'Token refreshed successfully'
      });
    } else {
      console.log('✅ Token still valid');
      return Response.json({ 
        success: true,
        access_token: jiraConn.access_token,
        expires_at: jiraConn.expires_at,
        message: 'Token still valid'
      });
    }

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});