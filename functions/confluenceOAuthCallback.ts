import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Handle OAuth errors from Atlassian
  if (error) {
    const errorDescription = url.searchParams.get('error_description') || error;
    return new Response(
      `<html>
        <head><title>Confluence Connection Error</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>❌ Connection Failed</h1>
          <p>${escapeHtml(errorDescription)}</p>
          <p>You can close this window and try again.</p>
          <script>
            window.opener?.postMessage({ type: 'confluence_error', error: '${escapeHtml(errorDescription)}' }, '*');
          </script>
        </body>
      </html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new Response(
      `<html>
        <head><title>Confluence Connection Error</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>❌ Missing Authorization Code</h1>
          <p>No authorization code received from Atlassian.</p>
          <script>
            window.opener?.postMessage({ type: 'confluence_error', error: 'No authorization code' }, '*');
          </script>
        </body>
      </html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const clientId = Deno.env.get('CONFLUENCE_CLIENT_ID');
    const clientSecret = Deno.env.get('CONFLUENCE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('CONFLUENCE_OAUTH_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('OAuth configuration missing');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Get user's cloud ID to get their site domain
    const meResponse = await fetch('https://api.atlassian.com/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!meResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const meData = await meResponse.json();
    const cloudId = meData.account_id; // This is the cloud ID for API calls

    // Encode connection data as base64
    const connectionData = JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      cloud_id: cloudId,
      account_email: meData.email
    });
    const encodedData = btoa(connectionData);

    return new Response(
      `<html>
        <head><title>Confluence Connection Success</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>✅ Connection Successful</h1>
          <p>Your Confluence account has been connected successfully.</p>
          <p>This window will close automatically...</p>
          <script>
            window.opener?.postMessage({ 
              type: 'confluence_success', 
              data: '${encodedData}'
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Confluence OAuth error:', error);
    return new Response(
      `<html>
        <head><title>Confluence Connection Error</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>❌ Connection Error</h1>
          <p>${escapeHtml(error.message)}</p>
          <p>You can close this window and try again.</p>
          <script>
            window.opener?.postMessage({ type: 'confluence_error', error: '${escapeHtml(error.message)}' }, '*');
          </script>
        </body>
      </html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
});

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}