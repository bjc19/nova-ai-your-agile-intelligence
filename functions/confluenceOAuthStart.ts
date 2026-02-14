import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('CONFLUENCE_CLIENT_ID');
    const redirectUri = Deno.env.get('CONFLUENCE_OAUTH_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return Response.json({ error: 'OAuth configuration missing' }, { status: 500 });
    }

    const scopes = 'read:confluence-content.summary read:confluence-user read:space:confluence';
    const state = crypto.getRandomValues(new Uint8Array(16)).toString();
    
    const authUrl = new URL('https://auth.atlassian.com/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'consent');

    return Response.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});