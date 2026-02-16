import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Vérifier que c'est un événement update
    if (payload.event?.type !== 'update') {
      return Response.json({ success: true });
    }

    const sprintHealth = payload.data;
    if (!sprintHealth) {
      return Response.json({ error: 'No sprint health data' }, { status: 400 });
    }

    // Vérifier si le statut est critique ou at_risk
    const criticalStatuses = ['critical', 'at_risk'];
    if (!criticalStatuses.includes(sprintHealth.status)) {
      return Response.json({ success: true });
    }

    // Déterminer quel workspace est concerné et trouver l'admin responsable
    let adminEmail = null;

    if (sprintHealth.jira_project_selection_id) {
      const jiraProject = await base44.asServiceRole.entities.JiraProjectSelection.get(sprintHealth.jira_project_selection_id);
      if (jiraProject) {
        adminEmail = jiraProject.created_by;
      }
    } else if (sprintHealth.trello_project_selection_id) {
      const trelloProject = await base44.asServiceRole.entities.TrelloProjectSelection.get(sprintHealth.trello_project_selection_id);
      if (trelloProject) {
        adminEmail = trelloProject.user_email;
      }
    }

    if (!adminEmail) {
      console.warn('No admin email found for sprint health notification');
      return Response.json({ success: true });
    }

    // Construire le message de notification
    const severity = sprintHealth.status === 'critical' ? 'CRITIQUE' : 'À RISQUE';
    const subject = `[Nova] Alerte Sprint ${sprintHealth.status === 'critical' ? 'CRITIQUE' : 'À RISQUE'}: ${sprintHealth.sprint_name}`;
    
    const problemDetails = sprintHealth.problematic_tickets?.slice(0, 3)
      .map((t) => `- ${t.ticket_id}: ${t.title} (${t.days_in_status}j dans le status)`)
      .join('\n') || 'Aucun détail disponible';

    const body = `
Bonjour,

La santé du sprint ${sprintHealth.sprint_name} s'est **dégradée** et nécessite votre attention immédiate.

**Statut:** ${severity}
**Score de risque:** ${sprintHealth.risk_score}/100
**Tickets en cours > 3j:** ${sprintHealth.tickets_in_progress_over_3d}
**Tickets bloqués > 48h:** ${sprintHealth.blocked_tickets_over_48h}

**Tickets problématiques:**
${problemDetails}

**Recommandations:**
${sprintHealth.recommendations?.slice(0, 2).map((r) => `- ${r}`).join('\n') || '- Examiner les tickets bloqués'}

Veuillez consulter votre tableau de bord pour plus de détails et prendre les actions nécessaires.

Cordialement,
Nova - Votre coach Agile
    `.trim();

    // Envoyer l'email via l'intégration Core
    await base44.integrations.Core.SendEmail({
      to: adminEmail,
      subject: subject,
      body: body,
      from_name: 'Nova'
    });

    // Mettre à jour le flag alert_sent
    await base44.asServiceRole.entities.SprintHealth.update(payload.event.entity_id, {
      alert_sent: true,
      alert_sent_date: new Date().toISOString()
    });

    console.log(`Sprint health notification sent to ${adminEmail} for ${sprintHealth.sprint_name}`);
    return Response.json({ success: true, notified: adminEmail });

  } catch (error) {
    console.error('Error in notifyAdminSprintHealth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});