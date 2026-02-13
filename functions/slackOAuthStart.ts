import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');
    
    // CAS 1: Callback de Slack (avec code ou erreur)
    if (code || error) {
      console.log('📞 Slack OAuth callback received');
      
      if (error) {
        console.log('❌ Slack OAuth error:', error);
        return new Response(`
          <html>
            <body>
              <script>
                window.opener.postMessage({type:'slack_error',error:'${error}'},'*');
                window.close();
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      const clientId = Deno.env.get("SLACK_CLIENT_ID");
      const clientSecret = Deno.env.get("SLACK_CLIENT_SECRET");
      const redirectUri = `${url.origin}/api/functions/slackOAuthStart`;
      
      // Échanger le code contre un token
      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri
        })
      });
      
      const tokenData = await tokenResponse.json();
      console.log('Slack token response:', tokenData.ok ? 'success' : tokenData.error);
      
      if (!tokenData.ok) {
        return new Response(`
          <html>
            <body>
              <script>
                window.opener.postMessage({type:'slack_error',error:'${tokenData.error}'},'*');
                window.close();
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      // Décoder le state pour récupérer l'email
      let userEmail = null;
      if (state) {
        try {
          const stateData = JSON.parse(atob(state));
          userEmail = stateData.user_email;
        } catch (e) {
          console.error('Failed to decode state:', e);
        }
      }
      
      // Préparer les données de connexion
      const connectionData = {
        user_email: userEmail,
        access_token: tokenData.access_token,
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        bot_user_id: tokenData.bot_user_id,
        scopes: tokenData.scope
      };
      
      const encodedData = btoa(JSON.stringify(connectionData));
      
      console.log('✅ Connection successful for team:', tokenData.team.name);
      
      // Retourner une page HTML de succès
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Slack Connected</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            .success-icon {
              font-size: 60px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1a1a1a;
              margin-bottom: 10px;
            }
            .team-name {
              background: #f0f0f0;
              padding: 10px 15px;
              border-radius: 10px;
              display: inline-block;
              margin: 10px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✅</div>
            <h1>Successfully Connected to Slack!</h1>
            <div class="team-name">${tokenData.team.name}</div>
            <p>You can now close this window and return to the application.</p>
          </div>
          
          <script>
            window.opener.postMessage({
              type: 'slack_success',
              team: '${tokenData.team.name}',
              data: '${encodedData}'
            }, '*');
            
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      // CAS 2: Début du flux OAuth (sans code)
      const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get("SLACK_CLIENT_ID");
    const redirectUri = `${url.origin}/api/functions/slackOAuthStart`;
    
    const scopes = [
      "channels:history",
      "channels:read",
      "chat:write",
      "users:read"
    ].join(",");

    // Store user email in state for callback
    const stateData = btoa(JSON.stringify({ 
      user_email: user.email,
      timestamp: Date.now()
    }));

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateData}`;

    return Response.json({ authUrl });
    }
  } catch (error) {
    console.error('Error in slackOAuthStart:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});