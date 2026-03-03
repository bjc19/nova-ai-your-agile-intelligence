import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { situationText, vocalMetrics, workspaceId, workspaceType } = await req.json();

    if (!situationText || !situationText.trim()) {
      return Response.json({ error: 'situationText is required' }, { status: 400 });
    }

    // 1. Fetch historical analyses for this workspace (last 20)
    let historicalAnalyses = [];
    try {
      if (workspaceId && workspaceType === 'trello') {
        historicalAnalyses = await base44.entities.AnalysisHistory.filter(
          { trello_project_selection_id: workspaceId },
          '-created_date',
          20
        );
      } else if (workspaceId && workspaceType === 'jira') {
        historicalAnalyses = await base44.entities.AnalysisHistory.filter(
          { jira_project_selection_id: workspaceId },
          '-created_date',
          20
        );
      } else {
        historicalAnalyses = await base44.entities.AnalysisHistory.list('-created_date', 20);
      }
    } catch (e) {
      console.warn('Could not fetch history:', e.message);
    }

    // 2. Summarize historical context
    const totalBlockers = historicalAnalyses.reduce((s, a) => s + (a.blockers_count || 0), 0);
    const totalRisks = historicalAnalyses.reduce((s, a) => s + (a.risks_count || 0), 0);
    const avgBlockers = historicalAnalyses.length > 0 ? (totalBlockers / historicalAnalyses.length).toFixed(1) : 0;
    const avgRisks = historicalAnalyses.length > 0 ? (totalRisks / historicalAnalyses.length).toFixed(1) : 0;
    const recentSources = [...new Set(historicalAnalyses.map(a => a.source))].join(', ');

    const historicalContext = historicalAnalyses.length > 0
      ? `Sur les ${historicalAnalyses.length} dernières analyses du projet :
- Moyenne de blockers par analyse : ${avgBlockers}
- Moyenne de risques par analyse : ${avgRisks}
- Sources de données utilisées : ${recentSources || 'transcript'}
- Dernière analyse : ${historicalAnalyses[0]?.analysis_time || historicalAnalyses[0]?.created_date || 'inconnue'}`
      : 'Aucun historique disponible pour ce projet. Première analyse.';

    // 3. Determine inferred vocal tone context
    let vocalContext = '';
    if (vocalMetrics) {
      const { inferredTone, wordsPerMinute, pauseCount, recordingDuration } = vocalMetrics;
      vocalContext = `
DONNÉES VOCALES (anonymisées) :
- Tonalité détectée : ${inferredTone}
- Débit : ${wordsPerMinute} mots/min (normale : 120-150 mots/min)
- Pauses : ${pauseCount} pauses détectées
- Durée d'enregistrement : ${recordingDuration}s
Interpréter ces signaux vocaux pour compléter l'analyse émotionnelle et comportementale de la personne.`;
    }

    // 4. Call LLM
    const prompt = `Tu es Nova, un assistant agile expert pour les équipes distantes (remote). Tu analyses la situation décrite par un Scrum Master ou Project Manager.

CONTEXTE HISTORIQUE DU PROJET :
${historicalContext}
${vocalContext}

SITUATION DÉCRITE (anonymisée par Nova) :
"${situationText.slice(0, 3000)}"

Analyse cette situation en intégrant l'historique du projet. Réponds UNIQUEMENT avec un JSON valide.

JSON attendu :
{
  "overall_health": "healthy" | "at_risk" | "critical",
  "detected_tone": "confident" | "anxious" | "uncertain" | "neutral",
  "tone_interpretation": "Interprétation courte du ressenti détecté (1-2 phrases, basée sur le texte ET les données vocales si disponibles)",
  "situational_assessment": "Évaluation contextuelle de 3-4 phrases : ce qui se passe vraiment, en ancrant sur l'historique",
  "historical_alignment": "Comment cette situation se compare aux analyses précédentes (tendance : amélioration, dégradation, stable)",
  "short_term_actions": ["Action 1 réalisable en 48h", "Action 2", "Action 3"],
  "long_term_actions": ["Action structurelle 1", "Action structurelle 2"]
}`;

    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_health: { type: "string" },
          detected_tone: { type: "string" },
          tone_interpretation: { type: "string" },
          situational_assessment: { type: "string" },
          historical_alignment: { type: "string" },
          short_term_actions: { type: "array", items: { type: "string" } },
          long_term_actions: { type: "array", items: { type: "string" } }
        }
      }
    });

    // 5. Save as AnalysisHistory
    try {
      const historyData = {
        title: `Situation - ${new Date().toLocaleDateString('fr-FR')}`,
        source: 'transcript',
        blockers_count: llmResult.overall_health === 'critical' ? 3 : llmResult.overall_health === 'at_risk' ? 1 : 0,
        risks_count: llmResult.overall_health !== 'healthy' ? 2 : 0,
        analysis_data: { ...llmResult, vocalMetrics: vocalMetrics || null, situationText: '[ANONYMISÉ]' },
        transcript_preview: situationText.slice(0, 200),
        analysis_time: new Date().toISOString(),
        contributing_sources: [{ source: 'transcript', confidence: 0.9 }],
        cross_source_confidence: 0.85
      };
      if (workspaceId && workspaceType === 'trello') historyData.trello_project_selection_id = workspaceId;
      if (workspaceId && workspaceType === 'jira') historyData.jira_project_selection_id = workspaceId;

      await base44.entities.AnalysisHistory.create(historyData);
    } catch (e) {
      console.warn('Could not save analysis history:', e.message);
    }

    return Response.json(llmResult);
  } catch (error) {
    console.error('analyzeContextualSituation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});