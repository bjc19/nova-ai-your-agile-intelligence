import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Vérifier que c'est un événement update
    if (payload.event?.type !== 'update') {
      return Response.json({ success: true });
    }

    const emergingTrend = payload.data;
    if (!emergingTrend) {
      return Response.json({ error: 'No emerging trend data' }, { status: 400 });
    }

    // Notifier seulement si la tendance a été promue en tendance confirmée
    if (emergingTrend.status !== 'confirmed') {
      return Response.json({ success: true });
    }

    // Récupérer les signaux faibles sources pour trouver les analyses associées
    if (!emergingTrend.source_signals || emergingTrend.source_signals.length === 0) {
      console.warn('No source signals for emerging trend');
      return Response.json({ success: true });
    }

    // Récupérer le premier signal faible pour identifier le workspace
    const weakSignal = await base44.asServiceRole.entities.WeakSignal.get(emergingTrend.source_signals[0]);
    if (!weakSignal || !weakSignal.analysis_ids || weakSignal.analysis_ids.length === 0) {
      console.warn('No analysis found from weak signal');
      return Response.json({ success: true });
    }

    // Récupérer l'analyse pour trouver le workspace
    const analysis = await base44.asServiceRole.entities.AnalysisHistory.get(weakSignal.analysis_ids[0]);
    if (!analysis) {
      console.warn('Analysis not found');
      return Response.json({ success: true });
    }

    // Trouver l'admin responsable
    let adminEmail = null;
    if (analysis.jira_project_selection_id) {
      const jiraProject = await base44.asServiceRole.entities.JiraProjectSelection.get(analysis.jira_project_selection_id);
      if (jiraProject) {
        adminEmail = jiraProject.created_by;
      }
    }

    if (!adminEmail) {
      console.warn('No admin email found for emerging trend notification');
      return Response.json({ success: true });
    }

    // Construire le message de notification
    const subject = `[Nova] Nouvelle tendance émergente confirmée: ${emergingTrend.name}`;
    
    const body = `
Bonjour,

Une **tendance émergente** a été **confirmée** et promue au statut de tendance établie.

**Tendance:** ${emergingTrend.name}
**Confiance:** ${emergingTrend.confidence_score}%
**Nombre de sprints observés:** ${emergingTrend.sprint_count}

**Hypothèse d'évolution:**
${emergingTrend.hypothesis || 'Non disponible'}

**Description:**
${emergingTrend.description || 'Aucune description'}

**Recommandations d'observation:**
${emergingTrend.recommended_observation || 'Continuer à monitorer'}

**Évolution de la tendance:**
${emergingTrend.evolution_data?.map((e) => `- Sprint ${e.sprint}: valeur ${e.value}`).join('\n') || 'Données non disponibles'}

Cette tendance mérite une attention particulière et doit être intégrée dans votre stratégie d'amélioration continue.

Cordialement,
Nova - Votre coach Agile
    `.trim();

    // Envoyer l'email
    await base44.integrations.Core.SendEmail({
      to: adminEmail,
      subject: subject,
      body: body,
      from_name: 'Nova'
    });

    console.log(`Emerging trend notification sent to ${adminEmail} for ${emergingTrend.name}`);
    return Response.json({ success: true, notified: adminEmail });

  } catch (error) {
    console.error('Error in notifyAdminEmergingTrend:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});