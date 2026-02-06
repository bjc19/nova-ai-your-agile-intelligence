// PUBLIC ENDPOINT - No authentication required
export default async function teamsOAuthStartPublic(base44) {
  try {
    const customerId = base44.context?.query?.customer_id || 'nova_ai_dev';
    
    const clientId = process.env.TEAMS_CLIENT_ID;
    const redirectUri = process.env.TEAMS_REDIRECT_URI;
    
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
    return {
      statusCode: 302,
      headers: {
        'Location': authUrl
      },
      body: ''
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error: ${error.message}`
    };
  }
}