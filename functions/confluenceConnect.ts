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

    const apiToken = Deno.env.get('CONFLUENCE_API_TOKEN');
    if (!apiToken) {
      return Response.json({ error: 'API token not configured' }, { status: 500 });
    }

    // Clean domain (remove https:// if present)
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    
    // Test connection
    const testUrl = `https://${cleanDomain}/rest/api/3/myself`;
    const testResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.text();
      return Response.json({ 
        error: 'Failed to connect to Confluence. Check domain and token.' 
      }, { status: 400 });
    }

    // Delete existing connection if any
    const existingConns = await base44.entities.ConfluenceConnection.filter({
      user_email: user.email
    });

    if (existingConns.length > 0) {
      await base44.entities.ConfluenceConnection.delete(existingConns[0].id);
    }

    // Create new connection
    await base44.entities.ConfluenceConnection.create({
      user_email: user.email,
      domain: domain,
      is_active: true,
      connected_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});