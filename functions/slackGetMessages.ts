import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channel_id, limit = 100, oldest } = await req.json();

    if (!channel_id) {
      return Response.json({ error: 'channel_id is required' }, { status: 400 });
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

    // Fetch messages from Slack
    const params = new URLSearchParams({
      channel: channel_id,
      limit: limit.toString()
    });
    
    if (oldest) {
      params.append('oldest', oldest);
    }

    const response = await fetch(`https://slack.com/api/conversations.history?${params}`, {
      headers: {
        "Authorization": `Bearer ${connection.access_token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to fetch messages");
    }

    // Fetch user info for message authors
    const userIds = [...new Set(data.messages.map(m => m.user).filter(Boolean))];
    const users = {};

    for (const userId of userIds) {
      const userResponse = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
        headers: {
          "Authorization": `Bearer ${connection.access_token}`
        }
      });
      const userData = await userResponse.json();
      if (userData.ok) {
        users[userId] = userData.user.real_name || userData.user.name;
      }
    }

    // Format messages
    const messages = data.messages.map(msg => ({
      text: msg.text,
      user: users[msg.user] || 'Unknown',
      timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
      ts: msg.ts
    })).reverse();

    return Response.json({ messages });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});