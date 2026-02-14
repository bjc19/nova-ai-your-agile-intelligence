import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STEP 1: Fetch active Trello connection for this user
    console.log('Step 1: Fetching active Trello connection for user:', user.email);
    const activeConnections = await base44.entities.TrelloConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (activeConnections.length === 0) {
      console.log('No active Trello connection found for user:', user.email);
      return Response.json({ 
        error: 'No active Trello connection found. Please connect Trello first.',
        needsAuth: true 
      }, { status: 401 });
    }

    const connection = activeConnections[0];
    const apiKey = connection.api_key;
    const accessToken = connection.access_token;

    // Validation: Check that tokens are not empty
    if (!apiKey || !accessToken) {
      console.error('Invalid Trello tokens for connection:', connection.id);
      return Response.json({ 
        error: 'Trello connection has invalid tokens' 
      }, { status: 500 });
    }

    // STEP 2: Fetch boards from Trello API using user's tokens
    console.log('Step 2: Fetching boards from Trello API for user:', user.email);
    const response = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${accessToken}&fields=id,name,idOrganization`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Trello API error:', response.status, errorData);
      
      // If token is invalid (401), notify user to reconnect
      if (response.status === 401) {
        console.log('Trello token expired or invalid for user:', user.email);
        return Response.json(
          { 
            error: 'Trello token expired. Please reconnect.',
            needsAuth: true 
          },
          { status: 401 }
        );
      }
      
      return Response.json(
        { error: 'Failed to fetch Trello boards' },
        { status: response.status }
      );
    }

    const boards = await response.json();
    
    // STEP 3: Validate response
    if (!Array.isArray(boards)) {
      console.error('Unexpected response format from Trello API');
      return Response.json(
        { error: 'Unexpected response from Trello API' },
        { status: 500 }
      );
    }

    console.log('Successfully fetched', boards.length, 'boards for user:', user.email);

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