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

    // Store connection in database
    const base44 = createClientFromRequest(req);
    
    // Check if connection exists
    const existing = await base44.asServiceRole.entities.SlackConnection.filter({ 
      user_email: user_email 
    });

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
      await base44.asServiceRole.entities.SlackConnection.update(existing[0].id, connectionData);
    } else {
      await base44.asServiceRole.entities.SlackConnection.create(connectionData);
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