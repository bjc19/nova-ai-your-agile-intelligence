import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code || !state) {
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'teams-error', error: 'missing_params' }, '*');
              window.close();
            </script>
            <p>Erreur: Paramètres manquants. Cette fenêtre va se fermer...</p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const clientId = Deno.env.get("TEAMS_CLIENT_ID");
    const clientSecret = Deno.env.get("TEAMS_CLIENT_SECRET");
    const redirectUri = Deno.env.get("TEAMS_REDIRECT_URI");

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
      console.error('Token error:', tokens);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'teams-error', error: 'token_failed' }, '*');
              window.close();
            </script>
            <p>Erreur d'authentification: ${tokens.error_description || 'Token non reçu'}. Cette fenêtre va se fermer...</p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const tenantId = JSON.parse(atob(tokens.access_token.split('.')[1])).tid;
    const base44 = createClientFromRequest(req);
    
    await base44.asServiceRole.entities.TeamsConnection.create({
      user_email: state,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tenant_id: tenantId,
      scopes: tokens.scope.split(' '),
      is_active: true
    });

    // Close popup and refresh parent
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({ type: 'teams-connected' }, '*');
            window.close();
          </script>
          <p>Connexion réussie ! Cette fenêtre va se fermer...</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Teams OAuth error:', error);
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({ type: 'teams-error', error: 'connection_failed' }, '*');
            window.close();
          </script>
          <p>Erreur de connexion: ${error.message}. Cette fenêtre va se fermer...</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});