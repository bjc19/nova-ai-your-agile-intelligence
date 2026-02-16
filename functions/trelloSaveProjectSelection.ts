import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { selected_board_ids, boards } = await req.json();

    if (!selected_board_ids || !Array.isArray(selected_board_ids)) {
      return Response.json({ error: 'Invalid selected_board_ids' }, { status: 400 });
    }

    // Fetch user's subscription status to check quota
    let maxProjectsAllowed = 5;
    let userPlan = 'starter';
    try {
      const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
      maxProjectsAllowed = statusRes.data.maxProjectsAllowed || 5;
      userPlan = statusRes.data.plan || 'starter';
    } catch (e) {
      console.log('Could not fetch subscription status, using default quota');
    }

    // Check quota: count of new boards should not exceed maxProjectsAllowed
    if (selected_board_ids.length > maxProjectsAllowed) {
      const errorMsg = `Vous avez atteint la limite de ${maxProjectsAllowed} tableaux Trello pour votre plan ${userPlan}. Veuillez mettre à niveau.`;
      console.error('Quota exceeded:', selected_board_ids.length, '>', maxProjectsAllowed);
      return Response.json(
        { error: errorMsg, success: false },
        { status: 400 }
      );
    }

    // Get existing selections for this user (RLS filters by created_by automatically)
    const existingSelections = await base44.entities.TrelloProjectSelection.filter({
      is_active: true
    });

    // Deactivate selections that are no longer in the new selection
    const toDeactivate = existingSelections.filter(
      sel => !selected_board_ids.includes(sel.board_id)
    );

    for (const selection of toDeactivate) {
      await base44.entities.TrelloProjectSelection.update(selection.id, {
        is_active: false
      });
    }

    // Create or reactivate selections for new/existing boards
    const boardsMap = new Map(boards.map(b => [b.id, b]));

    for (const boardId of selected_board_ids) {
      const existing = existingSelections.find(sel => sel.board_id === boardId);
      
      if (existing) {
        // Reactivate if it was deactivated
        if (!existing.is_active) {
          await base44.entities.TrelloProjectSelection.update(existing.id, {
            is_active: true
          });
        }
      } else {
        // Create new selection
        const board = boardsMap.get(boardId);
        const boardName = board?.name || `Board ${boardId}`;
        const idOrganization = board?.idOrganization || null;
        
        await base44.entities.TrelloProjectSelection.create({
          user_email: user.email,
          board_id: boardId,
          board_name: boardName,
          idOrganization: idOrganization,
          is_active: true,
          connected_at: new Date().toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      message: `Successfully saved ${selected_board_ids.length} project(s)`
    });
  } catch (error) {
    console.error('Error saving Trello project selection:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});