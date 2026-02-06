// PUBLIC ENDPOINT - No authentication required
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customer_id') || 'nova_ai_dev';
    
    const clientId = Deno.env.get("TEAMS_CLIENT_ID");
    const redirectUri = Deno.env.get("TEAMS_REDIRECT_URI");
    
    const scopes = [
      'Chat.Read',
      'ChannelMessage.Read.All',
      'Team.ReadBasic.All',
      'User.Read',
      'offline_access'
    ].join(' ');

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${customerId}` +
      `&response_mode=query` +
      `&prompt=select_account`;

    // Redirection 302 vers Microsoft OAuth
    return Response.redirect(authUrl, 302);
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
});