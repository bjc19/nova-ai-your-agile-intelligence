import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Vérifier que c'est un événement update
    if (payload.event?.type !== 'update') {
      return Response.json({ success: true });
    }

    const patternDetection = payload.data;
    if (!patternDetection) {
      return Response.json({ error: 'No pattern detection data' }, { status: 400 });
    }

    // Filtrer pour les anti-patterns majeurs (score de confiance > 75 et sévérité high/critical)
    const isMajor = patternDetection.confidence_score > 75 && 
                    ['high', 'critical'].includes(patternDetection.severity);

    if (!isMajor) {
      return Response.json({ success: true });
    }

    // Récupérer l'analyse associée pour trouver le workspace
    const analysis = await base44.asServiceRole.entities.AnalysisHistory.get(patternDetection.analysis_id);
    if (!analysis) {
      console.warn('Analysis not found for pattern detection');
      return Response.json({ success: true });
    }

    // Trouver l'admin responsable du workspace
    let adminEmail = null;
    if (analysis.jira_project_selection_id) {
      const jiraProject = await base44.asServiceRole.entities.JiraProjectSelection.get(analysis.jira_project_selection_id);
      if (jiraProject) {
        adminEmail = jiraProject.created_by;
      }
    }

    if (!adminEmail) {
      console.warn('No admin email found for pattern detection notification');
      return Response.json({ success: true });
    }

    // Construire le message de notification
    const subject = `[Nova] Anti-pattern majeur détecté: ${patternDetection.pattern_name}`;
    
    const body = `
Bonjour,

Un **anti-pattern majeur** a été détecté lors de votre dernière analyse.

**Pattern:** ${patternDetection.pattern_name}
**Catégorie:** ${patternDetection.category}
**Sévérité:** ${patternDetection.severity.toUpperCase()}
**Confiance:** ${patternDetection.confidence_score}%

**Description du problème:**
${patternDetection.context || 'Aucun contexte disponible'}

**Actions recommandées:**
${patternDetection.recommended_actions?.slice(0, 3).map((a) => `- ${a}`).join('\n') || '- Examiner l\'anti-pattern en détail'}

**Quick Win (réalisable en < 48h):**
${patternDetection.quick_win || 'Non disponible'}

Consultez votre tableau de bord pour les détails complets et la contexte de détection.

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

    console.log(`Pattern detection notification sent to ${adminEmail} for ${patternDetection.pattern_name}`);
    return Response.json({ success: true, notified: adminEmail });

  } catch (error) {
    console.error('Error in notifyAdminAntiPattern:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});