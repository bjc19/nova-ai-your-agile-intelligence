// PUBLIC ENDPOINT - No authentication required
import { createClient } from 'npm:@base44/sdk@0.8.6';

export default async function teamsOAuthCallback(base44) {
  try {
    const code = base44.context?.query?.code;
    const customerId = base44.context?.query?.state || 'nova_ai_dev';
    
    if (!code) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: '<html><body><h1>Missing authorization code</h1></body></html>'
      };
    }

    const clientId = process.env.TEAMS_CLIENT_ID;
    const clientSecret = process.env.TEAMS_CLIENT_SECRET;
    const redirectUri = process.env.TEAMS_REDIRECT_URI;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'teams_error',
                error: 'Token exchange failed'
              }, '*');
              window.close();
            </script>
          </body>
          </html>
        `
      };
    }

    // Store connection in database using service role
    const client = createClient();
    await client.asServiceRole.entities.TeamsConnection.create({
      user_email: customerId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tenant_id: tokens.id_token_claims?.tid || 'common',
      scopes: tokens.scope?.split(' ') || [],
      is_active: true
    });

    const connectionData = {
      customer_id: customerId,
      success: true
    };

    const encodedData = Buffer.from(JSON.stringify(connectionData)).toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'teams_success',
              data: '${encodedData}'
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
        </html>
      `
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'teams_error',
              error: '${error.message}'
            }, '*');
            window.close();
          </script>
        </body>
        </html>
      `
    };
  }
}