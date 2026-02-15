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

    // Fetch user's team configuration to check quota
    const configs = await base44.entities.TeamConfiguration.list();
    const config = configs.length > 0 ? configs[0] : null;

    // Get plan info - for now assume a default quota of 10 projects
    // This can be extended to use actual plan data
    const maxProjectsAllowed = 10;

    if (selected_board_ids.length > maxProjectsAllowed) {
      return Response.json(
        { error: `Quota exceeded. Maximum ${maxProjectsAllowed} projects allowed.` },
        { status: 400 }
      );
    }

    // Get existing selections for this user
    const existingSelections = await base44.entities.TrelloProjectSelection.filter({
      user_email: user.email
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
    const selectedBoardsMap = new Map(boards.map(b => [b.id, b.name]));

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
        const boardName = selectedBoardsMap.get(boardId) || `Board ${boardId}`;
        await base44.entities.TrelloProjectSelection.create({
          user_email: user.email,
          board_id: boardId,
          board_name: boardName,
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