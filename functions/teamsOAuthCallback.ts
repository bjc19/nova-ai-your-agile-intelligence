Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      return new Response('Missing authorization code', { status: 400 });
    }

    const clientId = Deno.env.get("TEAMS_CLIENT_ID");
    const clientSecret = Deno.env.get("TEAMS_CLIENT_SECRET");
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/functions/teamsOAuthCallback`;

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
      // Send error to opener window
      return new Response(`
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
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Encode connection data and send to opener
    const connectionData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tenant_id: tokens.id_token_claims?.tid || 'common',
      scopes: tokens.scope?.split(' ') || []
    };

    const encodedData = btoa(JSON.stringify(connectionData));

    return new Response(`
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          window.opener.postMessage({
            type: 'teams_success',
            data: '${encodedData}'
          }, '*');
          window.close();
        </script>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    return new Response(`
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
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});