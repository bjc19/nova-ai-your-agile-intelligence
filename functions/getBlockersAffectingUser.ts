import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId } = body;

    // Récupérer les GDPRMarkers où l'utilisateur est assigné ou bloqué
    let gdprFilter = {
      statut: { $in: ['ouvert', 'acknowledge', 'en_cours'] }
    };

    // Filtrer par workspace si fourni
    if (workspaceId) {
      const workspace = await base44.entities.JiraProjectSelection.get(workspaceId);
      if (workspace) {
        gdprFilter.session_id = workspace.id;
      }
    }

    const allMarkers = await base44.entities.GDPRMarkers.filter(gdprFilter);

    // Filtrer les blockers qui affectent l'utilisateur
    const blockers = allMarkers
      .filter(marker => {
        const firstName = user.full_name?.split(' ')[0] || '';
        return (
          marker.assignee_first_name?.toLowerCase() === firstName.toLowerCase() &&
          (marker.criticite === 'haute' || marker.criticite === 'critique')
        );
      })
      .slice(0, 10)
      .map((marker, idx) => ({
        id: marker.id,
        title: marker.probleme,
        blockedBy: marker.blocked_by_first_name || "Equipe",
        description: marker.recos?.[0] || "Pas de recommandation",
        urgency: marker.criticite === 'critique' ? 'high' : 'medium',
        ticket: marker.jira_ticket_key || 'N/A'
      }));

    // Trouver les tâches où d'autres dépendent de l'utilisateur
    const dependsOnMe = allMarkers
      .filter(marker => {
        const firstName = user.full_name?.split(' ')[0] || '';
        return (
          marker.blocked_by_first_name?.toLowerCase() === firstName.toLowerCase()
        );
      })
      .slice(0, 10)
      .map((marker) => ({
        id: marker.id,
        person: marker.assignee_first_name || "Equipe",
        title: `Attend: ${marker.probleme}`,
        description: marker.recos?.[0] || "Pas de recommandation",
        ticket: marker.jira_ticket_key || 'N/A'
      }));

    return Response.json({
      blockers,
      dependsOnMe
    });
  } catch (error) {
    console.error('getBlockersAffectingUser error:', error.message);
    return Response.json({
      blockers: [],
      dependsOnMe: []
    });
  }
});