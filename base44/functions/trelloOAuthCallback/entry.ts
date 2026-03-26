Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('TRELLO_API_KEY');
    
    // Serve HTML page that extracts token from URL hash (client-side)
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trello OAuth Callback</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            p { color: #666; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <p>Authentification Trello en cours...</p>
          </div>
          
          <script>
            // Extract token from URL hash (e.g., #token=ABCD1234)
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('token');
            const error = params.get('error');
            
            async function processAuth() {
              if (error) {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'trello_error',
                    error: error
                  }, '*');
                  window.close();
                }
                return;
              }
              
              if (!token) {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'trello_error',
                    error: 'No token received from Trello'
                  }, '*');
                  window.close();
                }
                return;
              }
              
              try {
                // Fetch user info from Trello
                const apiKey = '${apiKey}';
                const userResponse = await fetch(\`https://api.trello.com/1/members/me?key=\${apiKey}&token=\${token}\`);
                const userData = await userResponse.json();
                
                if (!userResponse.ok || !userData.id) {
                  throw new Error('Failed to fetch Trello user data');
                }
                
                const connectionData = {
                  trello_user_id: userData.id,
                  trello_username: userData.username,
                  access_token: token,
                  api_key: apiKey
                };
                
                // Send to parent window
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'trello_success',
                    data: btoa(JSON.stringify(connectionData))
                  }, '*');
                  window.close();
                }
              } catch (err) {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'trello_error',
                    error: err.message
                  }, '*');
                  window.close();
                }
              }
            }
            
            processAuth();
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    console.error('Error in Trello OAuth callback:', error);
    return new Response(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'trello_error',
                error: '${error.message}'
              }, '*');
              window.close();
            }
          </script>
          Erreur serveur: ${error.message}
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});