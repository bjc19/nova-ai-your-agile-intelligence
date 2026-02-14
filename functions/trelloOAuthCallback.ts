Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const fragment = url.hash.substring(1);
    const params = new URLSearchParams(fragment);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'trello_error',
                  error: '${error}'
                }, '*');
                window.close();
              }
            </script>
            Erreur Trello: ${error}
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!token) {
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'trello_error',
                  error: 'No token received'
                }, '*');
                window.close();
              }
            </script>
            Erreur: token non reçu
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Fetch user info from Trello
    const apiKey = Deno.env.get('TRELLO_API_KEY');
    const userResponse = await fetch(`https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`);
    const userData = await userResponse.json();

    if (!userResponse.ok || !userData.id) {
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'trello_error',
                  error: 'Failed to fetch user data'
                }, '*');
                window.close();
              }
            </script>
            Erreur: impossible de récupérer les données utilisateur
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const connectionData = {
      trello_user_id: userData.id,
      trello_username: userData.username,
      access_token: token,
      api_key: apiKey
    };

    return new Response(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'trello_success',
                data: '${btoa(JSON.stringify(connectionData))}'
              }, '*');
              window.close();
            }
          </script>
          Connexion réussie, fermeture...
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
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
          Erreur: ${error.message}
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});