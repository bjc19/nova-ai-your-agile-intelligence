/**
 * @public
 */
// PUBLIC ENDPOINT - No authentication required
import { createClient } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const customerId = url.searchParams.get('state') || 'nova_ai_dev';
    
    if (!code) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: system-ui; padding: 40px; text-align: center; }
            .error { background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h2>❌ Code d'autorisation manquant</h2>
          <div class="error">
            <p>Le code d'autorisation Microsoft n'a pas été reçu.</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const clientId = Deno.env.get("TEAMS_CLIENT_ID");
    const clientSecret = Deno.env.get("TEAMS_CLIENT_SECRET");
    const redirectUri = Deno.env.get("TEAMS_REDIRECT_URI");

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
      const errorMsg = tokens.error_description || tokens.error || 'Token exchange failed';
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: system-ui; padding: 40px; text-align: center; }
            .error { background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h2>❌ Échec de la connexion Teams</h2>
          <div class="error">
            <p>${errorMsg}</p>
          </div>
          <p>Cette fenêtre va se fermer automatiquement...</p>
          <script>
            window.opener.postMessage({
              type: 'teams_error',
              error: '${errorMsg}'
            }, '*');
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
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

    const encodedData = btoa(JSON.stringify(connectionData));

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
          }
          .success-icon { font-size: 60px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success-icon">✅</div>
          <h1>Teams Connecté !</h1>
          <p>Cette fenêtre va se fermer automatiquement...</p>
        </div>
        <script>
          window.opener.postMessage({
            type: 'teams_success',
            data: '${encodedData}'
          }, '*');
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: system-ui; padding: 40px; text-align: center; }
          .error { background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h2>❌ Erreur serveur</h2>
        <div class="error">
          <p>${error.message}</p>
        </div>
        <script>
          window.opener.postMessage({
            type: 'teams_error',
            error: '${error.message}'
          }, '*');
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
});