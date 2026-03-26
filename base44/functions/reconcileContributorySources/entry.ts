import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { new_workspace_id, new_workspace_type } = await req.json();

    if (!new_workspace_id || !new_workspace_type) {
      return Response.json({ error: 'Missing new_workspace_id or new_workspace_type' }, { status: 400 });
    }

    console.log(`🔄 Reconciling sources for workspace: ${new_workspace_id} (${new_workspace_type})`);

    // Step 1: Fetch context of the NEW workspace
    let workspaceContext = null;
    if (new_workspace_type === 'jira') {
      const ws = await base44.entities.JiraProjectSelection.filter({ id: new_workspace_id, is_active: true });
      if (ws?.length > 0) {
        workspaceContext = {
          name: ws[0].jira_project_name || ws[0].workspace_name,
          key: ws[0].jira_project_key,
          type: 'jira'
        };
      }
    } else {
      const ws = await base44.entities.TrelloProjectSelection.filter({ id: new_workspace_id, is_active: true });
      if (ws?.length > 0) {
        workspaceContext = {
          name: ws[0].board_name,
          type: 'trello'
        };
      }
    }

    if (!workspaceContext) {
      return Response.json({ error: 'Workspace not found or inactive' }, { status: 404 });
    }

    console.log(`📦 Workspace context: ${workspaceContext.name}`);

    // Step 2: Collect recent contributing sources data (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const sourceAssessments = [];

    // --- Slack sources ---
    try {
      const slackMappings = new_workspace_type === 'jira'
        ? await base44.entities.SlackChannelMapping.filter({ jira_project_selection_id: new_workspace_id, is_active: true })
        : [];

      if (slackMappings.length > 0) {
        const recentSlackMarkers = await base44.entities.GDPRMarkers.filter({ detection_source: 'slack_hourly' });
        const recent = recentSlackMarkers.filter(m => m.created_date >= thirtyDaysAgo);

        const sampleProblems = recent.slice(0, 5).map(m => m.probleme).filter(Boolean).join('; ');

        if (sampleProblems) {
          const relevanceResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Tu es un assistant qui évalue la pertinence de données Slack pour un projet donné.

Projet actif: "${workspaceContext.name}" (${workspaceContext.type})
${workspaceContext.key ? `Clé du projet: ${workspaceContext.key}` : ''}

Voici des exemples de problèmes détectés dans Slack récemment :
"${sampleProblems}"

Évalue sur une échelle de 0 à 1 (0 = totalement hors sujet, 1 = très pertinent) si ces données Slack sont pertinentes pour le projet "${workspaceContext.name}".
Justifie brièvement ta réponse en 1 phrase.`,
            response_json_schema: {
              type: 'object',
              properties: {
                relevance_score: { type: 'number' },
                justification: { type: 'string' }
              }
            }
          });

          sourceAssessments.push({
            source: 'slack',
            channel_count: slackMappings.length,
            message_count: recent.length,
            relevance_score: relevanceResult?.relevance_score ?? 0.5,
            justification: relevanceResult?.justification ?? 'Non évalué',
            is_relevant: (relevanceResult?.relevance_score ?? 0.5) >= 0.4
          });

          console.log(`📊 Slack relevance score: ${relevanceResult?.relevance_score}`);
        } else {
          sourceAssessments.push({
            source: 'slack',
            channel_count: slackMappings.length,
            message_count: 0,
            relevance_score: 0,
            justification: 'Aucune donnée Slack récente disponible',
            is_relevant: false
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ Slack assessment failed:', err.message);
    }

    // --- Teams sources ---
    try {
      const teamsMappings = new_workspace_type === 'jira'
        ? await base44.entities.TeamsProjectMapping.filter({ jira_project_selection_id: new_workspace_id, is_active: true })
        : [];

      if (teamsMappings.length > 0) {
        const recentTeamsInsights = await base44.entities.TeamsInsight.filter({ user_email: user.email });
        const recent = recentTeamsInsights.filter(t => t.created_date >= thirtyDaysAgo);

        const sampleProblems = recent.slice(0, 5).map(t => t.probleme).filter(Boolean).join('; ');

        if (sampleProblems) {
          const relevanceResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Tu es un assistant qui évalue la pertinence de données Microsoft Teams pour un projet donné.

Projet actif: "${workspaceContext.name}" (${workspaceContext.type})
${workspaceContext.key ? `Clé du projet: ${workspaceContext.key}` : ''}

Voici des exemples de problèmes détectés dans Teams récemment :
"${sampleProblems}"

Évalue sur une échelle de 0 à 1 (0 = totalement hors sujet, 1 = très pertinent) si ces données Teams sont pertinentes pour le projet "${workspaceContext.name}".
Justifie brièvement ta réponse en 1 phrase.`,
            response_json_schema: {
              type: 'object',
              properties: {
                relevance_score: { type: 'number' },
                justification: { type: 'string' }
              }
            }
          });

          sourceAssessments.push({
            source: 'teams',
            transcript_count: recent.length,
            relevance_score: relevanceResult?.relevance_score ?? 0.5,
            justification: relevanceResult?.justification ?? 'Non évalué',
            is_relevant: (relevanceResult?.relevance_score ?? 0.5) >= 0.4
          });

          console.log(`📊 Teams relevance score: ${relevanceResult?.relevance_score}`);
        } else {
          sourceAssessments.push({
            source: 'teams',
            transcript_count: 0,
            relevance_score: 0,
            justification: 'Aucune donnée Teams récente disponible',
            is_relevant: false
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ Teams assessment failed:', err.message);
    }

    // --- GDPRMarkers from previous workspace analyses ---
    try {
      const allAnalyses = await base44.entities.AnalysisHistory.list('-analysis_time', 20);
      // Filter analyses NOT linked to the new workspace
      const otherAnalyses = allAnalyses.filter(a => {
        if (new_workspace_type === 'jira') return a.jira_project_selection_id !== new_workspace_id;
        return a.trello_project_selection_id !== new_workspace_id;
      });

      const recentOtherAnalyses = otherAnalyses.filter(a => (a.analysis_time || a.created_date) >= thirtyDaysAgo);

      if (recentOtherAnalyses.length > 0) {
        const sampleTitles = recentOtherAnalyses.slice(0, 5).map(a => a.title).join(', ');
        const relevanceResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Tu es un assistant qui évalue si des analyses historiques d'autres projets sont encore pertinentes pour un nouveau projet actif.

Nouveau projet actif: "${workspaceContext.name}"

Titres d'analyses récentes issues d'autres projets/workspaces :
"${sampleTitles}"

Évalue sur une échelle de 0 à 1 si ces analyses d'autres projets apportent une valeur pertinente pour "${workspaceContext.name}".
Justifie brièvement en 1 phrase.`,
          response_json_schema: {
            type: 'object',
            properties: {
              relevance_score: { type: 'number' },
              justification: { type: 'string' }
            }
          }
        });

        sourceAssessments.push({
          source: 'historical_analyses',
          analyses_count: recentOtherAnalyses.length,
          relevance_score: relevanceResult?.relevance_score ?? 0.3,
          justification: relevanceResult?.justification ?? 'Non évalué',
          is_relevant: (relevanceResult?.relevance_score ?? 0.3) >= 0.4
        });

        console.log(`📊 Historical analyses relevance score: ${relevanceResult?.relevance_score}`);
      }
    } catch (err) {
      console.warn('⚠️ Historical analyses assessment failed:', err.message);
    }

    // Step 3: Compute overall impact
    const totalSources = sourceAssessments.length;
    const irrelevantSources = sourceAssessments.filter(s => !s.is_relevant);
    const relevantSources = sourceAssessments.filter(s => s.is_relevant);
    const impactPercentage = totalSources > 0
      ? Math.round((irrelevantSources.length / totalSources) * 100)
      : 0;

    const shouldAlert = irrelevantSources.length > 0;

    console.log(`✅ Reconciliation complete: ${relevantSources.length} relevant, ${irrelevantSources.length} irrelevant sources`);

    return Response.json({
      success: true,
      workspace_name: workspaceContext.name,
      workspace_type: new_workspace_type,
      total_sources_evaluated: totalSources,
      relevant_sources: relevantSources.length,
      irrelevant_sources: irrelevantSources.length,
      impact_percentage: impactPercentage,
      should_alert: shouldAlert,
      assessments: sourceAssessments
    });

  } catch (error) {
    console.error('❌ Reconcile sources error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});