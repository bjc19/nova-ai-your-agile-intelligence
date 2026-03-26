import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { context_text, voice_metrics, workspace_id, workspace_type } = await req.json();

    if (!context_text || context_text.trim().length < 5) {
      return Response.json({ error: 'context_text is required' }, { status: 400 });
    }

    // Récupérer l'historique des analyses pour ce workspace
    let recentAnalyses = [];
    try {
      if (workspace_id && workspace_type === 'trello') {
        recentAnalyses = await base44.entities.AnalysisHistory.filter(
          { trello_project_selection_id: workspace_id }, '-created_date', 15
        );
      } else if (workspace_id && workspace_type === 'jira') {
        recentAnalyses = await base44.entities.AnalysisHistory.filter(
          { jira_project_selection_id: workspace_id }, '-created_date', 15
        );
      } else {
        recentAnalyses = await base44.entities.AnalysisHistory.list('-created_date', 15);
      }
    } catch (e) {
      console.warn('Could not fetch analysis history:', e.message);
    }

    // Résumé historique enrichi
    const historicalSummary = recentAnalyses.length > 0
      ? recentAnalyses.slice(0, 10).map((a, i) => {
          const date = new Date(a.created_date).toLocaleDateString('fr-FR');
          const preview = a.transcript_preview ? ` | "${a.transcript_preview.substring(0, 60)}..."` : '';
          return `[${i + 1}] ${date} — ${a.blockers_count || 0} bloquants, ${a.risks_count || 0} risques, source: ${a.source}${preview}`;
        }).join('\n')
      : 'Aucun historique disponible pour ce projet.';

    // Contexte de l'analyse vocale
    let voiceContext = '';
    if (voice_metrics) {
      const wpm = voice_metrics.wordsPerMinute;
      const speedLabel = wpm > 160 ? 'Rapide (possible urgence/anxiété)' : wpm < 80 ? 'Lent (possible réflexion/incertitude)' : 'Normal';
      const anxietyLevel = voice_metrics.hesitationsCount > 5 || voice_metrics.pauseCount > 8 ? 'Élevé'
        : voice_metrics.hesitationsCount > 2 ? 'Modéré' : 'Faible';

      voiceContext = `\n## Indicateurs vocaux de l'enregistrement:
- Débit: ${wpm} mots/min (${speedLabel})
- Hésitations: ${voice_metrics.hesitationsCount} occurrences détectées
- Pauses: ${voice_metrics.pauseCount}
- Indice d'anxiété vocal: ${anxietyLevel}
- Durée: ${voice_metrics.durationSeconds}s — ${voice_metrics.totalWords} mots
`;
    }

    const prompt = `Tu es Nova, une IA d'intelligence agile pour équipes en remote. Un Scrum Master ou Project Manager te décrit sa situation actuelle.

## Contexte fourni par l'utilisateur:
"${context_text}"
${voiceContext}
## Historique des ${recentAnalyses.length} dernières analyses du projet:
${historicalSummary}

## Instructions:
1. Analyse le contexte actuel — signaux explicites ET implicites
2. Compare avec l'historique pour détecter des patterns récurrents ou des dégradations
3. Si données vocales disponibles: intègre le ressenti émotionnel dans l'analyse (débit rapide = urgence, hésitations = incertitude, etc.)
4. Sois concret et actionnable — pas de généralités

Réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks):
{
  "emotional_context": {
    "detected_tone": "confident|anxious|confused|uncertain|frustrated|neutral",
    "tone_label_fr": "string",
    "tone_description": "string (1 phrase max)",
    "confidence_level": 0.0
  },
  "immediate_insights": [
    {"title": "string", "description": "string", "severity": "high|medium|low", "is_new": true}
  ],
  "historical_patterns": [
    {"pattern": "string", "occurrences": 0, "trend": "improving|worsening|stable"}
  ],
  "short_term_actions": [
    {"action": "string", "deadline": "24h|48h|this_sprint", "owner": "scrum_master|team|po"}
  ],
  "long_term_actions": [
    {"action": "string", "horizon": "next_sprint|next_month|strategic", "rationale": "string"}
  ],
  "risk_level": "low|medium|high|critical",
  "summary": "string (2-3 phrases)"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          emotional_context: { type: "object" },
          immediate_insights: { type: "array" },
          historical_patterns: { type: "array" },
          short_term_actions: { type: "array" },
          long_term_actions: { type: "array" },
          risk_level: { type: "string" },
          summary: { type: "string" }
        }
      }
    });

    // Sauvegarder dans AnalysisHistory
    try {
      const saveData = {
        title: `Situation contextuelle — ${new Date().toLocaleDateString('fr-FR')}`,
        source: 'transcript',
        blockers_count: result.immediate_insights?.filter(i => i.severity === 'high').length || 0,
        risks_count: result.immediate_insights?.filter(i => i.severity === 'medium').length || 0,
        analysis_data: result,
        transcript_preview: context_text.substring(0, 200),
        analysis_time: new Date().toISOString()
      };
      if (workspace_type === 'jira' && workspace_id) saveData.jira_project_selection_id = workspace_id;
      if (workspace_type === 'trello' && workspace_id) saveData.trello_project_selection_id = workspace_id;

      await base44.entities.AnalysisHistory.create(saveData);
    } catch (saveErr) {
      console.warn('Could not save to AnalysisHistory:', saveErr.message);
    }

    return Response.json(result);

  } catch (error) {
    console.error('analyzeSituationalContext error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});