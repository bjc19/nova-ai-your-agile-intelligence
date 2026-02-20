import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function validateJiraToken(accessToken, cloudId, attempt = 1) {
  try {
    // Test with board API (requires read:jira-work)
    const testUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board?maxResults=1`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Token invalid or expired. Scope mismatch or token revoked.');
    }

    if (response.status === 403) {
      throw new Error('Forbidden: Missing required scopes (read:jira-work required).');
    }

    if (response.status === 404) {
      throw new Error('Not Found: Cloud ID invalid.');
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${JSON.stringify(data)}`);
    }

    return { valid: true, statusCode: response.status };

  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.log(`Validation attempt ${attempt} failed, retrying...`);
      await delay(RETRY_DELAY * attempt);
      return validateJiraToken(accessToken, cloudId, attempt + 1);
    }
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active Jira connection
    const allConnections = await base44.asServiceRole.entities.JiraConnection.list();
    const connections = allConnections.filter(c => 
      c.data.user_email === user.email && 
      c.data.is_active === true
    );

    if (!connections || connections.length === 0) {
      return Response.json({ 
        valid: false,
        reason: 'No active Jira connection',
        action: 'Connect Jira via Settings'
      }, { status: 400 });
    }

    const connection = connections[0];
    const accessToken = connection.data.access_token;
    const cloudId = connection.data.cloud_id;
    const expiresAt = new Date(connection.data.expires_at);
    const now = new Date();

    // Check if token is expired
    if (now >= expiresAt) {
      return Response.json({
        valid: false,
        reason: 'Token expired',
        expires_at: expiresAt,
        action: 'Token will auto-refresh on next API call'
      }, { status: 400 });
    }

    // Validate token with API
    const validation = await validateJiraToken(accessToken, cloudId);

    return Response.json({
      valid: true,
      user_email: user.email,
      cloud_id: cloudId,
      token_expires_at: expiresAt,
      time_until_expiry_seconds: Math.floor((expiresAt - now) / 1000),
      scopes: connection.data.scopes,
      validation_status: validation.statusCode
    });

  } catch (error) {
    console.error('jiraValidateConnection error:', error);
    return Response.json({
      valid: false,
      error: error.message,
      action: 'Reconnect Jira - token may be corrupted'
    }, { status: 400 });
  }
});