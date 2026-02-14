import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trelloConns = await base44.entities.TrelloConnection.filter({
      user_email: user.email
    });

    if (trelloConns.length > 0) {
      await base44.entities.TrelloConnection.delete(trelloConns[0].id);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Trello:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});