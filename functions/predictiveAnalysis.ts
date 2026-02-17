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

    // Récupérer les données historiques
    const sprintHealthHistory = await base44.entities.SprintHealth.list('-created_date', 50);
    const analysisHistory = await base44.entities.AnalysisHistory.list('-created_date', 50);
    const patternDetections = await base44.entities.PatternDetection.list('-created_date', 100);
    const resolvedItems = await base44.entities.ResolvedItem.list('-created_date', 100);

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
        date: a.analysis_time || a.created_date
      })),
      patterns: patternDetections.reduce((acc, p) => {
        acc[p.pattern_name] = (acc[p.pattern_name] || 0) + 1;
        return acc;
      }, {}),
      resolutionRate: resolvedItems.length / (resolvedItems.length + patternDetections.filter(p => p.status !== 'resolved').length) * 100
    };

    // Analyse prédictive via IA
    const prompt = `Tu es un expert en analyse prédictive agile. Analyse les données historiques suivantes et fournis des prédictions détaillées :

Données historiques :
- ${historicalData.sprints.length} sprints analysés
- Score de risque moyen : ${(historicalData.sprints.reduce((sum, s) => sum + (s.risk_score || 0), 0) / historicalData.sprints.length).toFixed(1)}
- Taux de résolution : ${historicalData.resolutionRate.toFixed(1)}%
- Patterns récurrents : ${JSON.stringify(historicalData.patterns)}
- Tendances WIP : ${historicalData.sprints.map(s => s.wip_count).join(', ')}
- Tickets bloqués > 48h : ${historicalData.sprints.map(s => s.blocked_tickets_over_48h).join(', ')}

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
        data_points: historicalData.sprints.length + historicalData.analyses.length,
        analysis_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Predictive analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});