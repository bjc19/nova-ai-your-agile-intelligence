import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('TRELLO_API_KEY');
    const apiToken = Deno.env.get('TRELLO_API_TOKEN');

    if (!apiKey || !apiToken) {
      return Response.json({ error: 'Trello credentials not configured' }, { status: 500 });
    }

    // Fetch boards from Trello API
    const response = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${apiToken}&fields=id,name,idOrganization`,
      {
        method: 'GET'
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Trello API error:', response.status, errorData);
      return Response.json(
        { error: 'Failed to fetch Trello boards' },
        { status: response.status }
      );
    }

    const boards = await response.json();
    
    // Format response to match expected structure
    const formattedBoards = boards.map(board => ({
      id: board.id,
      name: board.name,
      idOrganization: board.idOrganization
    }));

    return Response.json({ boards: formattedBoards });
  } catch (error) {
    console.error('Error fetching Trello projects:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});