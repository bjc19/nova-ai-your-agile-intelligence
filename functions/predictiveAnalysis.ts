import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.app_role || user.role;
    if (userRole !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Récupérer le workspaceId depuis le body
    const body = await req.json().catch(() => ({}));
    const workspaceId = body.workspaceId || null;

    // Récupérer les données historiques filtrées par workspace si fourni
    let analysisHistory;
    let sprintHealthHistory;

    if (workspaceId) {
      // Déterminer si le workspace est Jira ou Trello
      const [jiraWs, trelloWs] = await Promise.all([
        base44.entities.JiraProjectSelection.filter({ id: workspaceId, is_active: true }),
        base44.entities.TrelloProjectSelection.filter({ id: workspaceId, is_active: true }),
      ]);
      const isJira = jiraWs?.length > 0;

      const wsFilter = isJira
        ? { jira_project_selection_id: workspaceId }
        : { trello_project_selection_id: workspaceId };

      [analysisHistory, sprintHealthHistory] = await Promise.all([
        base44.entities.AnalysisHistory.filter(wsFilter, '-created_date', 50),
        base44.entities.SprintHealth.filter(wsFilter, '-created_date', 50),
      ]);
    } else {
      analysisHistory = await base44.entities.AnalysisHistory.list('-created_date', 50);
      sprintHealthHistory = await base44.entities.SprintHealth.list('-created_date', 50);
    }

    const resolvedItems = await base44.entities.ResolvedItem.list('-created_date', 100);

    // Pas assez de données réelles → refuser de générer une prédiction fictive
    if (analysisHistory.length === 0) {
      return Response.json({
        success: false,
        error: 'Données insuffisantes pour générer une analyse prédictive. Effectuez au moins une analyse pour ce workspace.'
      }, { status: 422 });
    }

    const totalBlockers = analysisHistory.reduce((sum, a) => sum + (a.blockers_count || 0), 0);
    const totalRisks = analysisHistory.reduce((sum, a) => sum + (a.risks_count || 0), 0);
    const avgRiskScore = sprintHealthHistory.length > 0
      ? (sprintHealthHistory.reduce((sum, s) => sum + (s.risk_score || 0), 0) / sprintHealthHistory.length)
      : null;

    // Préparer le contexte pour l'IA
    const historicalData = {
      sprints: sprintHealthHistory.map(s => ({
        name: s.sprint_name,
        risk_score: s.risk_score,
        status: s.status,
        wip_count: s.wip_count,
        tickets_in_progress_over_3d: s.tickets_in_progress_over_3d,
        blocked_tickets_over_48h: s.blocked_tickets_over_48h,
        date: s.created_date
      })),
      analyses: analysisHistory.map(a => ({
        source: a.source,
        blockers_count: a.blockers_count,
        risks_count: a.risks_count,
        workspace: a.workspace_name,
        date: a.analysis_time || a.created_date
      })),
      resolutionRate: resolvedItems.length > 0
        ? (resolvedItems.length / (resolvedItems.length + totalBlockers + totalRisks) * 100)
        : 0
    };

    // Analyse prédictive via IA
    const prompt = `Tu es un expert en analyse prédictive agile. Analyse les données historiques RÉELLES suivantes et fournis des prédictions basées UNIQUEMENT sur ces données. Ne génère rien qui ne soit pas fondé sur les données fournies.

Workspace analysé : ${workspaceId ? `ID ${workspaceId}` : 'tous les workspaces'}
Données historiques réelles :
- ${historicalData.analyses.length} analyses effectuées
- Total blockers détectés : ${totalBlockers}
- Total risques détectés : ${totalRisks}
- ${sprintHealthHistory.length} sprints enregistrés${avgRiskScore !== null ? `, score de risque moyen : ${avgRiskScore.toFixed(1)}` : ''}
- Taux de résolution : ${historicalData.resolutionRate.toFixed(1)}%
- Tendances WIP : ${historicalData.sprints.map(s => s.wip_count).filter(Boolean).join(', ') || 'aucune donnée'}
- Tickets bloqués > 48h : ${historicalData.sprints.map(s => s.blocked_tickets_over_48h).filter(v => v !== undefined).join(', ') || 'aucune donnée'}
- Sources d'analyses : ${[...new Set(historicalData.analyses.map(a => a.source))].join(', ')}

Fournis une analyse prédictive structurée incluant :
1. Les goulots d'étranglement probables dans les 2 prochaines semaines
2. Les risques potentiels à surveiller
3. Une estimation des délais de livraison basée sur les tendances
4. Des recommandations préventives
5. Un score de confiance de chaque prédiction (0-100)`;

    const prediction = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                area: { type: "string" },
                probability: { type: "number" },
                impact: { type: "string", enum: ["low", "medium", "high"] },
                timeframe: { type: "string" },
                confidence: { type: "number" }
              }
            }
          },
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                likelihood: { type: "string", enum: ["low", "medium", "high"] },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                early_warning_signs: { type: "array", items: { type: "string" } },
                confidence: { type: "number" }
              }
            }
          },
          delivery_forecast: {
            type: "object",
            properties: {
              estimated_completion: { type: "string" },
              confidence_level: { type: "string" },
              factors: { type: "array", items: { type: "string" } },
              velocity_trend: { type: "string" }
            }
          },
          preventive_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] },
                expected_impact: { type: "string" }
              }
            }
          },
          overall_health_trend: {
            type: "string",
            enum: ["improving", "stable", "declining"]
          },
          confidence_score: { type: "number" }
        }
      }
    });

    return Response.json({
      success: true,
      prediction,
      metadata: {
        workspace_id: workspaceId,
      analyses_count: historicalData.analyses.length,
      sprints_count: historicalData.sprints.length,
      data_points: historicalData.sprints.length + historicalData.analyses.length,
        analysis_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Predictive analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});