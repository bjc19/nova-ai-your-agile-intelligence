import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Slack connection
    const connections = await base44.entities.SlackConnection.filter({ 
      user_email: user.email,
      is_active: true
    });

    if (connections.length === 0) {
      return Response.json({ error: 'No Slack connection found' }, { status: 404 });
    }

    const connection = connections[0];

    // Fetch channels from Slack
    const response = await fetch("https://slack.com/api/conversations.list", {
      headers: {
        "Authorization": `Bearer ${connection.access_token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to fetch channels");
    }

    // Filter to public channels and format
    const channels = data.channels
      .filter(ch => !ch.is_private && !ch.is_archived)
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        purpose: ch.purpose?.value || '',
        num_members: ch.num_members || 0
      }));

    return Response.json({ channels, team_name: connection.team_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});