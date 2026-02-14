Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      const errorDescription = url.searchParams.get('error_description') || 'Unknown error';
      return new Response(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'confluence_error',
                error: '${escapeHtml(errorDescription)}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code) {
      return new Response(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'confluence_error',
                error: 'No authorization code received'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const clientId = Deno.env.get('CONFLUENCE_CLIENT_ID');
    const clientSecret = Deno.env.get('CONFLUENCE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('CONFLUENCE_OAUTH_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('OAuth configuration missing');
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    // Get accessible resources to find cloudId
    const resourcesResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!resourcesResponse.ok) {
      const errorData = await resourcesResponse.text();
      throw new Error(`Failed to fetch accessible resources: ${errorData}`);
    }

    const resources = await resourcesResponse.json();
    if (!resources || resources.length === 0) {
      throw new Error('No accessible Atlassian resources found');
    }

    const cloudId = resources[0].id;
    if (!cloudId) {
      throw new Error('Could not extract cloud ID');
    }

    const connectionData = {
      access_token: accessToken,
      refresh_token: refreshToken,
      cloud_id: cloudId,
      account_email: null,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
    };

    const encodedData = btoa(JSON.stringify(connectionData));

    return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'confluence_success',
              data: '${encodedData}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'confluence_error',
              error: '${escapeHtml(error.message)}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});

function escapeHtml(text: string): string {
  const map: {[key: string]: string} = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}