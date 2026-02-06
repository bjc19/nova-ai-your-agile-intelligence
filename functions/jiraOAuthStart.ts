import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get customer_id from query params
    const url = new URL(req.url);
    const customer_id = url.searchParams.get('customer_id');
    
    if (!customer_id) {
      return Response.json({ error: 'customer_id required' }, { status: 400 });
    }

    // Get Jira OAuth credentials from secrets
    const clientId = Deno.env.get('JIRA_CLIENT_ID');
    const redirectUri = Deno.env.get('JIRA_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return Response.json({ error: 'Jira OAuth not configured' }, { status: 500 });
    }

    // Construct Atlassian OAuth authorization URL
    const authorizationUrl = new URL('https://auth.atlassian.com/authorize');
    authorizationUrl.searchParams.append('client_id', clientId);
    authorizationUrl.searchParams.append('redirect_uri', redirectUri);
    authorizationUrl.searchParams.append('response_type', 'code');
    authorizationUrl.searchParams.append('scope', 'read:jira-work manage:jira-project-settings read:jira-user');
    authorizationUrl.searchParams.append('state', customer_id); // Pass customer_id as state
    authorizationUrl.searchParams.append('prompt', 'consent');

    return Response.json({
      authorizationUrl: authorizationUrl.toString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});