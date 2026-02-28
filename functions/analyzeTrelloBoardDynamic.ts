import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, startDate, endDate } = await req.json();
    
    if (!workspaceId) {
      return Response.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const trelloApiKey = Deno.env.get('TRELLO_API_KEY');
    const trelloApiToken = Deno.env.get('TRELLO_API_TOKEN');

    if (!trelloApiKey || !trelloApiToken) {
      return Response.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    // Récupérer la sélection du projet Trello (avec RLS: seul user peut accéder à ses données)
    const trelloProjectSelections = await base44.entities.TrelloProjectSelection.filter({
      id: workspaceId
    });

    if (!trelloProjectSelections || trelloProjectSelections.length === 0) {
      console.error(`TrelloProjectSelection not found for workspaceId: ${workspaceId}`);
      return Response.json({ error: 'Workspace Trello non trouvé', detail: `Aucun workspace avec l'ID: ${workspaceId}` }, { status: 404 });
    }

    const projectSelection = trelloProjectSelections[0];
    const boardId = projectSelection.board_id;

    if (!boardId) {
      console.error(`board_id not found in projectSelection:`, projectSelection);
      return Response.json({ error: 'Board ID manquant', detail: 'La configuration du workspace Trello est incomplète' }, { status: 400 });
    }

    console.log(`Fetching Trello board: ${boardId} for workspace: ${workspaceId}`);

    // Récupérer les listes du board
    const listsResponse = await fetch(
      `https://api.trello.com/1/boards/${boardId}/lists?key=${trelloApiKey}&token=${trelloApiToken}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!listsResponse.ok) {
      const errorText = await listsResponse.text();
      console.error(`Trello API error getting lists - Status: ${listsResponse.status}`, errorText);
      throw new Error(`Erreur API Trello (${listsResponse.status}): Vérifiez que vos credentials Trello sont valides et que le board existe`);
    }

    const lists = await listsResponse.json();

    // Récupérer toutes les cartes du board
    const cardsResponse = await fetch(
      `https://api.trello.com/1/boards/${boardId}/cards?key=${trelloApiKey}&token=${trelloApiToken}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!cardsResponse.ok) {
      const errorText = await cardsResponse.text();
      console.error(`Trello API error getting cards - Status: ${cardsResponse.status}`, errorText);
      throw new Error(`Erreur API Trello (${cardsResponse.status}): Impossible de récupérer les cartes`);
    }

    const cards = await cardsResponse.json();
    
    const parseStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const parseEndDate = endDate ? new Date(endDate) : new Date();
    parseEndDate.setHours(23, 59, 59, 999);

    // Analyse des données
    const now = new Date();
    const stagnantCards = [];
    const blockedCards = [];
    const allRecentCards = [];
    const cardsByList = {};

    for (const card of cards) {
      const cardDate = new Date(card.dateLastActivity);
      
      // Vérifier si la carte est dans la période
      if (cardDate >= parseStartDate && cardDate <= parseEndDate) {
        allRecentCards.push(card);
      }

      // Récupérer l'historique des actions pour détecter le statut
      const actionsResponse = await fetch(
        `https://api.trello.com/1/cards/${card.id}/actions?key=${trelloApiKey}&token=${trelloApiToken}&filter=createCard,updateCard&limit=100`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!actionsResponse.ok) {
        console.warn(`Could not fetch actions for card ${card.id}`);
        continue;
      }

      const actions = await actionsResponse.json();
      const listName = lists.find(l => l.id === card.idList)?.name || 'Unknown';
      
      // Compter par liste
      cardsByList[listName] = (cardsByList[listName] || 0) + 1;

      // Détecter les cartes stagnantes (en cours depuis plus de 3 jours)
      let movedToInProgress = null;
      for (const action of actions) {
        if (action.type === 'updateCard' && action.data.listAfter) {
          const listNameAfter = lists.find(l => l.id === action.data.listAfter.id)?.name || '';
          if (listNameAfter.includes('In Progress') || listNameAfter.includes('En Cours')) {
            movedToInProgress = new Date(action.date);
            break;
          }
        }
      }

      if (movedToInProgress) {
        const daysSinceInProgress = (now - movedToInProgress) / (1000 * 60 * 60 * 24);
        if (daysSinceInProgress > 3) {
          stagnantCards.push({
            id: card.id,
            name: card.name,
            list: listName,
            daysSinceInProgress: Math.round(daysSinceInProgress * 10) / 10,
            url: card.url,
            lastUpdated: card.dateLastActivity
          });
        }
      }

      // Détecter les cartes bloquées (avec le label "blocked" ou dans une liste "Blocked")
      const isBlocked = (card.labels || []).some(l => l.name && l.name.toLowerCase().includes('block')) ||
                        listName.toLowerCase().includes('block');
      if (isBlocked) {
        blockedCards.push({
          id: card.id,
          name: card.name,
          list: listName,
          url: card.url,
          lastUpdated: card.dateLastActivity
        });
      }
    }

    // Calculer les statistiques
    const analysis = {
      workspace_id: workspaceId,
      workspace_name: projectSelection.board_name,
      period: {
        start: parseStartDate.toISOString(),
        end: parseEndDate.toISOString()
      },
      summary: {
        total_cards_in_period: allRecentCards.length,
        stagnant_cards_count: stagnantCards.length,
        blocked_cards_count: blockedCards.length,
        cards_by_list: cardsByList
      },
      stagnant_cards: stagnantCards.sort((a, b) => b.daysSinceInProgress - a.daysSinceInProgress),
      blocked_cards: blockedCards,
      patterns: {
        high_wip: Object.values(cardsByList).some((count) => count > 8),
        stagnation_rate: allRecentCards.length > 0 ? (stagnantCards.length / allRecentCards.length) * 100 : 0
      },
      generated_at: new Date().toISOString()
    };

    return Response.json(analysis);
  } catch (error) {
    console.error('Error in analyzeTrelloBoardDynamic:', error.message);
    console.error('Full error:', error);
    return Response.json({ 
      error: error.message || 'Erreur inconnue lors de l\'analyse Trello',
      debug: error.message 
    }, { status: 500 });
  }
});