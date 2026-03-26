import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify user is admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Step 1: Find the currently active workspace (Jira OR Trello, never both)
    // We use the user's own scope (not service role) to respect RLS
    const [activeJiraWorkspaces, activeTrelloWorkspaces] = await Promise.all([
      base44.entities.JiraProjectSelection.filter({ is_active: true }),
      base44.entities.TrelloProjectSelection.filter({ is_active: true }),
    ]);

    let activeWorkspaceId = null;
    let activeWorkspaceType = null;
    let activeWorkspaceName = null;

    if (activeJiraWorkspaces?.length > 0) {
      // Take the most recently selected active Jira workspace
      const sorted = activeJiraWorkspaces.sort((a, b) =>
        new Date(b.selected_date || b.created_date) - new Date(a.selected_date || a.created_date)
      );
      activeWorkspaceId = sorted[0].id;
      activeWorkspaceType = 'jira';
      activeWorkspaceName = sorted[0].workspace_name || sorted[0].jira_project_name;
    } else if (activeTrelloWorkspaces?.length > 0) {
      // Take the most recently connected active Trello workspace
      const sorted = activeTrelloWorkspaces.sort((a, b) =>
        new Date(b.connected_at || b.created_date) - new Date(a.connected_at || a.created_date)
      );
      activeWorkspaceId = sorted[0].id;
      activeWorkspaceType = 'trello';
      activeWorkspaceName = sorted[0].board_name;
    }

    if (!activeWorkspaceId) {
      return Response.json({
        success: true,
        message: 'No active workspace found. No reminder sent.',
        unresolvedCount: 0
      });
    }

    console.log(`Active workspace: ${activeWorkspaceName} (${activeWorkspaceType}, id: ${activeWorkspaceId})`);

    // Step 2: Fetch all AnalysisHistory linked to this active workspace
    const analysisFilter = activeWorkspaceType === 'jira'
      ? { jira_project_selection_id: activeWorkspaceId }
      : { trello_project_selection_id: activeWorkspaceId };

    const workspaceAnalyses = await base44.entities.AnalysisHistory.filter(analysisFilter);

    if (!workspaceAnalyses || workspaceAnalyses.length === 0) {
      return Response.json({
        success: true,
        message: `No analyses found for workspace "${activeWorkspaceName}". No reminder sent.`,
        unresolvedCount: 0
      });
    }

    const analysisIds = workspaceAnalyses.map(a => a.id);
    console.log(`Found ${analysisIds.length} analyses for this workspace`);

    // Step 3: Fetch all PatternDetection linked to these analyses
    // Filter in-memory since $in operator may not be available
    const allPatterns = await base44.entities.PatternDetection.list('-created_date', 500);
    const workspacePatterns = allPatterns.filter(p => analysisIds.includes(p.analysis_id));

    if (workspacePatterns.length === 0) {
      return Response.json({
        success: true,
        message: `No patterns detected for workspace "${activeWorkspaceName}". No reminder sent.`,
        unresolvedCount: 0
      });
    }

    console.log(`Found ${workspacePatterns.length} patterns for this workspace`);

    // Step 4: Fetch all ResolvedItems and build a set of resolved pattern IDs
    const resolvedItems = await base44.entities.ResolvedItem.filter({ source: 'pattern_detection' });
    const resolvedItemIds = new Set((resolvedItems || []).map(r => r.item_id));

    // Step 5: Filter out resolved patterns
    const unresolvedPatterns = workspacePatterns.filter(p => !resolvedItemIds.has(p.id));

    console.log(`Unresolved patterns: ${unresolvedPatterns.length} / ${workspacePatterns.length}`);

    if (unresolvedPatterns.length === 0) {
      return Response.json({
        success: true,
        message: `All patterns for workspace "${activeWorkspaceName}" are resolved. No reminder sent.`,
        unresolvedCount: 0
      });
    }

    // Step 6: Build and send the reminder email
    const subject = `Rappel Nova : ${unresolvedPatterns.length} pattern(s) non résolus – ${activeWorkspaceName}`;

    const patternLines = unresolvedPatterns
      .slice(0, 5)
      .map(p => `• ${p.pattern_name}${p.severity ? ` [${p.severity}]` : ''} – Confiance: ${Math.round((p.confidence_score || 0) * 100)}%`)
      .join('\n');

    const body = `Bonjour,

Vous avez actuellement ${unresolvedPatterns.length} pattern(s) non résolus dans votre workspace actif "${activeWorkspaceName}" (${activeWorkspaceType === 'jira' ? 'Jira' : 'Trello'}).

Marquer les résolutions est crucial pour :
✓ Améliorer la qualité des analyses prospectives
✓ Évaluer l'impact réel des solutions implémentées
✓ Construire un historique fiable pour les recommandations futures

Patterns non résolus :
${patternLines}${unresolvedPatterns.length > 5 ? `\n... et ${unresolvedPatterns.length - 5} autres` : ''}

Rendez-vous sur votre dashboard Nova pour marquer les éléments résolus et profiter d'analyses plus pertinentes.

Cordialement,
Nova`;

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject,
      body,
    });

    return Response.json({
      success: true,
      remindersSent: 1,
      unresolvedCount: unresolvedPatterns.length,
      workspaceName: activeWorkspaceName,
      workspaceType: activeWorkspaceType
    });

  } catch (error) {
    console.error('Error sending resolution reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});