import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get("SLACK_CLIENT_ID");
    const url = new URL(req.url);
    const redirectUri = `${url.origin}/api/functions/slackOAuthCallback`;
    
    const scopes = [
      "channels:history",
      "channels:read",
      "chat:write",
      "users:read"
    ].join(",");

    // Store user email in state for callback
    const state = btoa(JSON.stringify({ 
      user_email: user.email,
      timestamp: Date.now()
    }));

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return Response.json({ authUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});