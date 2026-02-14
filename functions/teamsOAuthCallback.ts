import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    console.log('Teams OAuth Callback - Reçu:', { code: !!code, state, error });
    
    // Gestion des erreurs OAuth
    if (error) {
      console.error('OAuth error:', error);
      return new Response(`
        <html><body style="padding: 40px; text-align: center; font-family: Arial;">
          <h2 style="color: #d32f2f;">❌ Erreur d'authentification</h2>
          <p>${url.searchParams.get('error_description') || error}</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Fermer
          </button>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'teams-error', error }, '*');
            }
          </script>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }
    
    if (!code || !state) {
      console.error('Code ou state manquant:', { code: !!code, state });
      return new Response(`<html><body>Paramètres manquants</body></html>`, 
        { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    const clientId = Deno.env.get("TEAMS_CLIENT_ID");
    const clientSecret = Deno.env.get("TEAMS_CLIENT_SECRET");
    const redirectUri = Deno.env.get("TEAMS_REDIRECT_URI");

    console.log('Config check:', { clientId: !!clientId, clientSecret: !!clientSecret, redirectUri: !!redirectUri });

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId || '',
        client_secret: clientSecret || '',
        code: code,
        redirect_uri: redirectUri || '',
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();
    console.log('Token response:', { status: tokenResponse.status, hasToken: !!tokens.access_token, error: tokens.error });
    
    if (!tokens.access_token) {
      console.error('No access token received:', tokens);
      throw new Error(tokens.error_description || 'Échange de code échoué');
    }

    const tenantId = JSON.parse(atob(tokens.access_token.split('.')[1])).tid;
    const base44 = createClientFromRequest(req);

    const userEmail = state;
    console.log('Creating TeamsConnection for:', userEmail);

    await base44.asServiceRole.entities.TeamsConnection.create({
      user_email: userEmail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tenant_id: tenantId,
      scopes: tokens.scope ? tokens.scope.split(' ') : [],
      is_active: true
    });

    console.log('Teams connection created successfully for user:', userEmail);

    // Close popup and refresh parent
    return new Response(`
      <html>
        <head>
          <style>
            body { padding: 40px; text-align: center; font-family: Arial; background: #f0f7ff; }
            .box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: inline-block; }
            .icon { font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="icon">✅</div>
            <h2>Connexion réussie !</h2>
            <p>Microsoft Teams est maintenant connecté.</p>
            <p style="font-size: 12px; color: #666;">Cette fenêtre va se fermer...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'teams-connected' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Teams OAuth error:', error);
    return new Response(`
      <html><body style="padding: 40px; text-align: center; font-family: Arial;">
        <h2 style="color: #d32f2f;">❌ Erreur système</h2>
        <p>${error.message}</p>
        <button onclick="window.close()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Fermer
        </button>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'teams-error', error: '${error.message}' }, '*');
          }
        </script>
      </body></html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' } 
    });
  }
});