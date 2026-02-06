import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(
        `<html><body><script>window.opener.postMessage({type:'slack_error',error:'${error}'},'*');window.close();</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !state) {
      return Response.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const { user_email } = JSON.parse(atob(state));
    const clientId = Deno.env.get("SLACK_CLIENT_ID");
    const clientSecret = Deno.env.get("SLACK_CLIENT_SECRET");
    const redirectUri = `${url.origin}/api/functions/slackOAuthCallback`;

    // Exchange code for token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      throw new Error(tokenData.error || "Failed to get access token");
    }

    // Use service role to store connection (OAuth callback is public endpoint)
    const appId = Deno.env.get("BASE44_APP_ID");
    const base44Url = Deno.env.get("BASE44_URL") || "https://api.base44.com";
    
    // Check if connection exists
    const checkResponse = await fetch(`${base44Url}/api/apps/${appId}/entities/SlackConnection?user_email=${user_email}&is_active=true`, {
      headers: {
        "Authorization": `Bearer ${Deno.env.get("BASE44_SERVICE_ROLE_KEY")}`
      }
    });
    
    const existing = await checkResponse.json();

    const connectionData = {
      user_email: user_email,
      access_token: tokenData.access_token,
      team_id: tokenData.team.id,
      team_name: tokenData.team.name,
      bot_user_id: tokenData.bot_user_id,
      is_active: true,
      scopes: tokenData.scope.split(","),
      connected_at: new Date().toISOString()
    };

    if (existing.length > 0) {
      // Update existing connection
      await fetch(`${base44Url}/api/apps/${appId}/entities/SlackConnection/${existing[0].id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("BASE44_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(connectionData)
      });
    } else {
      // Create new connection
      await fetch(`${base44Url}/api/apps/${appId}/entities/SlackConnection`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("BASE44_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(connectionData)
      });
    }

    // Return success page that closes popup
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'slack_success',team:'${tokenData.team.name}'},'*');window.close();</script><p>Connexion réussie! Vous pouvez fermer cette fenêtre.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'slack_error',error:'${error.message}'},'*');window.close();</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
});