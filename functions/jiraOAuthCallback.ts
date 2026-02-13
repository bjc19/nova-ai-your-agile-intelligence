import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Initialize Base44 client
    const base44 = createClientFromRequest(req);
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // customer_id
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return new Response(`
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1>Jira OAuth Error</h1>
            <p>Error: ${error}</p>
            <script>
              window.opener?.postMessage({ error: '${error}' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 });
    }

    // Exchange code for access token
    const clientId = Deno.env.get('JIRA_CLIENT_ID');
    const clientSecret = Deno.env.get('JIRA_CLIENT_SECRET');
    const redirectUri = Deno.env.get('JIRA_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response('Jira OAuth not configured', { status: 500 });
    }

    const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return new Response('Token exchange failed', { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    // Get user's cloud ID to identify which Jira instances they have
    const cloudResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!cloudResponse.ok) {
      return new Response('Failed to get Jira instances', { status: 500 });
    }

    const instances = await cloudResponse.json();
    if (instances.length === 0) {
      return new Response('No Jira instances found', { status: 400 });
    }

    const cloudId = instances[0].id; // Use first instance

    // Return connection data to frontend (like Slack OAuth flow)
    const connectionData = btoa(JSON.stringify({
      user_email: state,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      cloud_id: cloudId,
      scopes: tokenData.scope ? tokenData.scope.split(' ') : ['read:jira-work', 'offline_access'],
      connected_at: new Date().toISOString(),
    }));

    return new Response(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 40px;">
          <h1>✅ Jira Connected Successfully</h1>
          <p>Your Jira account has been connected to Nova.</p>
          <p>You can now close this window.</p>
          <script>
            window.opener?.postMessage({ 
              type: 'jira_success',
              data: '${connectionData}'
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.error('Jira OAuth callback error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});