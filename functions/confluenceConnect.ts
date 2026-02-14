import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain } = await req.json();

    if (!domain) {
      return Response.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Test connection to Confluence
    const token = Deno.env.get('CONFLUENCE_API_TOKEN');
    if (!token) {
      return Response.json({ error: 'Confluence API token not configured' }, { status: 500 });
    }

    // Test API call
    const testResponse = await fetch(`https://${domain}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!testResponse.ok) {
      return Response.json({ 
        error: 'Failed to connect to Confluence. Check domain and token.' 
      }, { status: 400 });
    }

    // Delete existing connection if any
    const existing = await base44.entities.ConfluenceConnection.filter({
      user_email: user.email
    });

    if (existing.length > 0) {
      await base44.entities.ConfluenceConnection.delete(existing[0].id);
    }

    // Create new connection
    const connection = await base44.entities.ConfluenceConnection.create({
      user_email: user.email,
      domain: domain,
      is_active: true,
      connected_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      message: 'Connected to Confluence',
      connection 
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});