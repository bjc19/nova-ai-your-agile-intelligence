import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1️⃣ Récupérer toutes les sources de données brutes
    const [jiraMarkers, slackMarkers, teamsInsights] = await Promise.all([
      base44.entities.GDPRMarkers.filter({ 
        tenant_id: user.email,
        detection_source: 'jira'
      }, '-created_date', 10),
      base44.entities.GDPRMarkers.filter({ 
        tenant_id: user.email,
        detection_source: 'slack'
      }, '-created_date', 10),
      base44.entities.TeamsInsight.filter({ 
        user_email: user.email
      }, '-created_date', 10)
    ]);

    // 2️⃣ Charger la config équipe pour contexte
    const teamConfigs = await base44.entities.TeamConfiguration.list();
    const teamConfig = teamConfigs.length > 0 ? teamConfigs[0] : null;

    // 3️⃣ Charger les patterns canoniques pour matching
    const antiPatterns = await base44.entities.AntiPattern.filter({ is_active: true });

    // 4️⃣ Analyse croisée via LLM
    const analysisPrompt = `
Analyse ces données multi-sources et fournis insights holistiques :

${jiraMarkers.length > 0 ? `**Données Jira** (${jiraMarkers.length} signaux) :
${jiraMarkers.map(m => `- ${m.probleme} (criticité: ${m.criticite})`).join('\n')}
` : '**Données Jira** : [Non disponible]\n'}

${slackMarkers.length > 0 ? `**Données Slack** (${slackMarkers.length} signaux) :
${slackMarkers.map(m => `- ${m.probleme} (type: ${m.type})`).join('\n')}
` : '**Données Slack** : [Non disponible]\n'}

${teamsInsights.length > 0 ? `**Données Teams** (${teamsInsights.length} meetings) :
${teamsInsights.map(m => `- ${m.probleme} (criticité: ${m.criticite})`).join('\n')}
` : '**Données Teams** : [Non disponible]\n'}

**Contexte équipe** :
- Mode: ${teamConfig?.project_mode || 'auto'}
- Patterns à matcher: ${antiPatterns.map(p => p.pattern_id).join(', ')}

Fournis :
1. Posture Nova détectée (crisis_facilitator/agile_coach/etc)
2. Signaux faibles émergents (niveau 2)
3. Tendances confirmées (niveau 3)
4. Top 3 recommandations contextuelles (croisées)
5. Vanity metrics détectées
6. VSM bottlenecks identifiés

Format JSON strict.
`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          posture: { type: "string" },
          weak_signals: { 
            type: "array",
            items: { 
              type: "object",
              properties: {
                type: { type: "string" },
                description: { type: "string" },
                confidence: { type: "number" }
              }
            }
          },
          emerging_trends: {
            type: "array",
            items: { type: "object" }
          },
          recommendations: {
            type: "array",
            items: { type: "object" }
          },
          vanity_metrics: { type: "array", items: { type: "string" } },
          vsm_bottlenecks: { type: "array", items: { type: "string" } }
        }
      }
    });

    // 5️⃣ Pattern matching - déterminer anti-patterns actifs
    const detectedPatterns = matchPatternsAgainstData(
      [...jiraMarkers, ...slackMarkers, ...teamsInsights],
      antiPatterns
    );

    // 6️⃣ Stocker les insights croisés
    const crossAnalysisResult = {
      user_email: user.email,
      analysis_timestamp: new Date().toISOString(),
      sources_count: {
        jira: jiraMarkers.length,
        slack: slackMarkers.length,
        teams: teamsInsights.length
      },
      posture: llmResponse.posture,
      weak_signals: llmResponse.weak_signals,
      emerging_trends: llmResponse.emerging_trends,
      recommendations: llmResponse.recommendations,
      detected_patterns: detectedPatterns,
      vanity_metrics: llmResponse.vanity_metrics,
      vsm_bottlenecks: llmResponse.vsm_bottlenecks
    };

    return Response.json(crossAnalysisResult);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Matcher les patterns canoniques avec les données brutes
function matchPatternsAgainstData(allMarkers, antiPatterns) {
  // Garder seulement les markers valides (même si certaines sources manquent)
  const validMarkers = allMarkers.filter(m => m && m.probleme);
  
  if (validMarkers.length === 0) {
    return [];
  }

  const detected = [];
  
  antiPatterns.forEach(pattern => {
    const matchingMarkers = validMarkers.filter(marker => 
      pattern.markers?.some(m => 
        marker.probleme?.toLowerCase().includes(m.toLowerCase())
      )
    );

    if (matchingMarkers.length > 0) {
      detected.push({
        pattern_id: pattern.pattern_id,
        name: pattern.name,
        occurrences: matchingMarkers.length,
        severity: pattern.severity,
        confidence: calculateConfidence(matchingMarkers.length, pattern.source_type?.length || 1),
        sources: [...new Set(matchingMarkers.map(m => m.detection_source || 'unknown'))]
      });
    }
  });

  return detected.sort((a, b) => b.confidence - a.confidence);
}

function calculateConfidence(occurrences, sourceCount) {
  // Confiance basée sur nombre de sources + récurrence
  return Math.min(100, (occurrences / 5) * 100 * (sourceCount / 3));
}