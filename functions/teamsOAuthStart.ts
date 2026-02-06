import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get("TEAMS_CLIENT_ID");
    const redirectUri = `${req.headers.get('origin')}/api/functions/teamsOAuthCallback`;
    
    const scopes = [
      'Calendars.Read',
      'OnlineMeetingTranscript.Read.All',
      'offline_access'
    ].join(' ');

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${user.email}`;

    return Response.json({ authUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});