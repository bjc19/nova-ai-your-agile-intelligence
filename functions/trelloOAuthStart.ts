import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('TRELLO_API_KEY');
    const appName = 'Nova';
    const scope = 'read,write';
    const responseType = 'token';
    const redirectUrl = `${Deno.env.get('APP_URL')}/callback/trello`;

    const authUrl = `https://trello.com/1/oauth/authorize?expiration=never&name=${encodeURIComponent(appName)}&oauth_token=&permission_level=read&key=${apiKey}&scope=${scope}&response_type=${responseType}&return_url=${encodeURIComponent(redirectUrl)}`;

    return Response.json({ authUrl });
  } catch (error) {
    console.error('Error starting Trello OAuth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});