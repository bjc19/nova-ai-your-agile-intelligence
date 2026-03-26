import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.role || (user.role !== 'admin' && user.role !== 'contributor')) {
      return Response.json({ error: 'Forbidden: Admin or Contributor access required' }, { status: 403 });
    }

    const { workspaceId, days = 30 } = await req.json();
    
    if (!workspaceId) {
      return Response.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const trelloApiKey = Deno.env.get('TRELLO_API_KEY');
    const trelloApiToken = Deno.env.get('TRELLO_API_TOKEN');

    if (!trelloApiKey || !trelloApiToken) {
      return Response.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    // Récupérer la sélection du projet Trello
    const trelloProjectSelections = await base44.asServiceRole.entities.TrelloProjectSelection.filter({
      id: workspaceId
    });

    if (!trelloProjectSelections || trelloProjectSelections.length === 0) {
      return Response.json({ error: 'No Trello project selection found' }, { status: 404 });
    }

    const projectSelection = trelloProjectSelections[0];
    const boardId = projectSelection.board_id;

    if (!boardId) {
      return Response.json({ error: 'board_id not found in project selection' }, { status: 400 });
    }

    // Récupérer les listes du board
    const listsResponse = await fetch(
      `https://api.trello.com/1/boards/${boardId}/lists?key=${trelloApiKey}&token=${trelloApiToken}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!listsResponse.ok) {
      return Response.json({ error: `Trello API error: ${listsResponse.status}` }, { status: listsResponse.status });
    }

    const lists = await listsResponse.json();

    // Récupérer les cartes avec actions
    const cardsResponse = await fetch(
      `https://api.trello.com/1/boards/${boardId}/cards?key=${trelloApiKey}&token=${trelloApiToken}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!cardsResponse.ok) {
      return Response.json({ error: `Trello API error: ${cardsResponse.status}` }, { status: cardsResponse.status });
    }

    const cards = await cardsResponse.json();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Pour chaque carte, récupérer l'historique des actions
    const metricsData = {
      workspace_id: workspaceId,
      workspace_type: 'trello',
      cards_processed: cards.length,
      lists: lists.map(l => ({ id: l.id, name: l.name })),
      cycle_times: [],
      cards_by_status: {},
      card_movements: []
    };

    for (const card of cards) {
      const cardDate = new Date(card.dateLastActivity);
      if (cardDate < startDate) continue;

      // Récupérer les actions de la carte
      const actionsResponse = await fetch(
        `https://api.trello.com/1/cards/${card.id}/actions?key=${trelloApiKey}&token=${trelloApiToken}&filter=createCard,updateCard`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!actionsResponse.ok) {
        console.warn(`Could not fetch actions for card ${card.id}`);
        continue;
      }

      const actions = await actionsResponse.json();
      
      let cardCreatedDate = new Date(card.dateLastActivity);
      let movedToInProgress = null;
      let movedToDone = null;
      const movements = [];

      // Analyser les mouvements entre listes
      for (const action of actions) {
        if (action.type === 'updateCard' && action.data.listAfter) {
          const listName = lists.find(l => l.id === action.data.listAfter.id)?.name || '';
          movements.push({
            date: new Date(action.date),
            fromListId: action.data.listBefore?.id,
            toListId: action.data.listAfter.id,
            toListName: listName
          });

          // Identifier le passage "En Cours"
          if (!movedToInProgress && (listName.includes('In Progress') || listName.includes('En Cours'))) {
            movedToInProgress = new Date(action.date);
          }

          // Identifier le passage "Terminé"
          if (!movedToDone && (listName.includes('Done') || listName.includes('Terminé'))) {
            movedToDone = new Date(action.date);
          }
        }
      }

      // Calculer le cycle time
      if (movedToInProgress && movedToDone) {
        const cycleTime = (movedToDone - movedToInProgress) / (1000 * 60 * 60 * 24);
        metricsData.cycle_times.push({
          card_id: card.id,
          card_name: card.name,
          cycle_time: parseFloat(cycleTime.toFixed(2)),
          created: card.dateLastActivity,
          started: movedToInProgress.toISOString(),
          completed: movedToDone.toISOString()
        });
      }

      // Tracker les mouvements
      metricsData.card_movements.push({
        card_id: card.id,
        card_name: card.name,
        movements: movements
      });

      // Compter par statut (liste actuelle)
      const listName = lists.find(l => l.id === card.idList)?.name || 'Unknown';
      metricsData.cards_by_status[listName] = (metricsData.cards_by_status[listName] || 0) + 1;
    }

    return Response.json(metricsData);
  } catch (error) {
    console.error('Error in getTrelloMetricsData:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});