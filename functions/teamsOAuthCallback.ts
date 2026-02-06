import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code || !state) {
      return Response.redirect(`${url.origin}/settings?error=missing_params`);
    }

    const clientId = Deno.env.get("TEAMS_CLIENT_ID");
    const clientSecret = Deno.env.get("TEAMS_CLIENT_SECRET");
    const redirectUri = `${url.origin}/api/functions/teamsOAuthCallback`;

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
      return Response.redirect(`${url.origin}/settings?error=token_failed`);
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

    return Response.redirect(`${url.origin}/settings?teams=connected`);
  } catch (error) {
    console.error('Teams OAuth error:', error);
    const url = new URL(req.url);
    return Response.redirect(`${url.origin}/settings?error=connection_failed`);
  }
});