export default async function slackOAuthCallback(base44: any) {
  try {
    console.log('=== SLACK OAUTH CALLBACK START ===');
    
    const { code, error, state } = base44.context.query;
    
    if (error) {
      console.error('Slack returned error:', error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `<html><body><script>window.opener.postMessage({type:'slack_error',error:'${error}'},'*');window.close();</script></body></html>`
      };
    }
    
    if (!code || !state) {
      console.error('No authorization code received');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `<html><body><script>window.opener.postMessage({type:'slack_error',error:'Missing code'},'*');window.close();</script></body></html>`
      };
    }
    
    console.log('Slack authorization code received');
    
    const { user_email } = JSON.parse(Buffer.from(state, 'base64').toString());
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = `${base44.context.headers['x-forwarded-proto'] || 'https'}://${base44.context.headers.host}/api/functions/slackOAuthCallback`;
    
    console.log('Exchanging code for token...');
    
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Slack token response received');
    
    if (!tokenData.ok) {
      console.error('Failed to get access token:', tokenData.error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `<html><body><script>window.opener.postMessage({type:'slack_error',error:'${tokenData.error}'},'*');window.close();</script></body></html>`
      };
    }
    
    const connectionData = {
      user_email: user_email,
      access_token: tokenData.access_token,
      team_id: tokenData.team.id,
      team_name: tokenData.team.name,
      bot_user_id: tokenData.bot_user_id,
      scopes: tokenData.scope
    };
    
    const encodedData = Buffer.from(JSON.stringify(connectionData)).toString('base64');
    
    console.log('Connection successful for team:', tokenData.team.name);
    
    const successHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Slack Integration Successful</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      margin: 0;
    }
    
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
    
    .success-icon {
      font-size: 60px;
      color: #2EB67D;
      margin-bottom: 20px;
    }
    
    h1 {
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    
    .team-name {
      background: #f0f0f0;
      padding: 10px 15px;
      border-radius: 10px;
      display: inline-block;
      margin: 10px 0;
      font-weight: bold;
      color: #1a1a1a;
    }
    
    .info {
      background: #f8f9fa;
      border-left: 4px solid #4A154B;
      padding: 15px;
      margin: 20px 0;
      text-align: left;
      border-radius: 0 8px 8px 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="success-icon">✅</div>
    <h1>Successfully Connected to Slack!</h1>
    
    <div class="team-name">
      ${tokenData.team.name}
    </div>
    
    <p>Your workspace is now connected to Nova AI Scrum Master.</p>
    
    <div class="info">
      <strong>What happens next:</strong>
      <ul>
        <li>Configure which channels to analyze</li>
        <li>Set up automatic daily scrum analysis</li>
        <li>Receive anti-pattern detection reports</li>
      </ul>
    </div>
    
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
</html>`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: successHtml
    };
    
  } catch (error: any) {
    console.error('Unhandled error in slackOAuthCallback:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Connection Failed</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
    .error { color: #E01E5A; font-size: 24px; margin-bottom: 20px; }
    .message { color: #666; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="error">❌ Connection Failed</div>
  <div class="message">Error: ${error.message}</div>
  <script>
    window.opener.postMessage({type:'slack_error',error:'${error.message}'},'*');
    setTimeout(() => window.close(), 3000);
  </script>
</body>
</html>`;
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: errorHtml
    };
  }
}