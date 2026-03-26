import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Traite les patterns détectés de sources multiples et crée des PatternDetections
 * Sources: Manuelles (transcripts), Jira, Trello, Slack, Teams, Confluence
 * Stratégie: Croiser les patterns selon la disponibilité des sources
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      analysisId, 
      analysisData, 
      workspaceId,
      source, // 'transcript', 'slack', 'jira', 'teams', 'confluence', etc.
      blockersData = [], 
      risksData = [] 
    } = await req.json();

    if (!analysisId || !analysisData) {
      return Response.json({ error: 'Missing analysisId or analysisData' }, { status: 400 });
    }

    // Récupérer tous les AntiPatterns pour enrichissement
    const antiPatterns = await base44.entities.AntiPattern.filter({ is_active: true });

    // Créer des PatternDetections à partir des données d'analyse
    const patternDetections = [];
    const detectedPatternIds = new Set();

    // ===== BLOCKERS -> PATTERNS =====
    if (blockersData && blockersData.length > 0) {
      blockersData.forEach(blocker => {
        // Utiliser pattern_ids si disponibles (sources manuelles)
        const patternIds = blocker.pattern_ids || [];
        
        patternIds.forEach(patternId => {
          if (!detectedPatternIds.has(patternId)) {
            const pattern = antiPatterns.find(p => p.pattern_id === patternId);
            if (pattern) {
              detectedPatternIds.add(patternId);
              patternDetections.push({
                analysis_id: analysisId,
                pattern_id: patternId,
                pattern_name: pattern.name,
                category: pattern.category,
                confidence_score: blocker.confidence || 75,
                detected_markers: pattern.markers || [],
                context: blocker.issue || blocker.description || '',
                severity: blocker.urgency === 'high' ? 'critical' : blocker.urgency === 'medium' ? 'high' : 'medium',
                recommended_actions: [blocker.action || blocker.mitigation || ''],
                metrics_current: [],
                status: 'detected'
              });
            }
          }
        });
      });
    }

    // ===== RISKS -> PATTERNS =====
    if (risksData && risksData.length > 0) {
      risksData.forEach(risk => {
        const patternIds = risk.pattern_ids || [];
        
        patternIds.forEach(patternId => {
          if (!detectedPatternIds.has(patternId)) {
            const pattern = antiPatterns.find(p => p.pattern_id === patternId);
            if (pattern) {
              detectedPatternIds.add(patternId);
              patternDetections.push({
                analysis_id: analysisId,
                pattern_id: patternId,
                pattern_name: pattern.name,
                category: pattern.category,
                confidence_score: risk.confidence || 65,
                detected_markers: pattern.markers || [],
                context: risk.description || risk.impact || '',
                severity: risk.urgency === 'high' ? 'high' : 'medium',
                recommended_actions: [risk.mitigation || ''],
                metrics_current: [],
                status: 'detected'
              });
            }
          }
        });
      });
    }

    // ===== SOURCES NON-MANUELLES: Détection automatique par mots-clés =====
    // Si pas de pattern_ids explicites (sources Slack/Teams/Jira/Trello/Confluence)
    if (patternDetections.length === 0 && (source === 'slack' || source === 'teams' || source === 'jira' || source === 'trello' || source === 'confluence')) {
      const analysisText = [
        analysisData.summary,
        ...blockersData.map(b => b.issue),
        ...risksData.map(r => r.description)
      ].join(' ');

      // Matching par marqueurs
      antiPatterns.forEach(pattern => {
        if (pattern.markers && pattern.markers.length > 0) {
          const matchCount = pattern.markers.filter(marker => 
            analysisText.toLowerCase().includes(marker.toLowerCase())
          ).length;

          if (matchCount > 0) {
            const confidence = Math.min(40 + (matchCount * 15), 79); // N2-N3 range
            patternDetections.push({
              analysis_id: analysisId,
              pattern_id: pattern.pattern_id,
              pattern_name: pattern.name,
              category: pattern.category,
              confidence_score: confidence,
              detected_markers: pattern.markers.filter(m => 
                analysisText.toLowerCase().includes(m.toLowerCase())
              ),
              context: analysisText.substring(0, 500),
              severity: pattern.severity || 'medium',
              recommended_actions: pattern.recommended_actions || [],
              metrics_current: [],
              status: 'detected',
              detection_level: confidence >= 80 ? 'level_1' : confidence >= 60 ? 'level_2' : 'level_3'
            });
          }
        }
      });
    }

    // Créer tous les PatternDetections en parallèle
    const createdPatterns = [];
    if (patternDetections.length > 0) {
      const results = await Promise.all(
        patternDetections.slice(0, 20).map(pattern =>
          base44.asServiceRole.entities.PatternDetection.create(pattern)
            .then(created => createdPatterns.push(created))
            .catch(err => {
              console.error(`Erreur création pattern ${pattern.pattern_id}:`, err);
              return null;
            })
        )
      );
    }

    return Response.json({
      analysis_id: analysisId,
      patterns_created: createdPatterns.length,
      source,
      workspace_id: workspaceId,
      success: true
    });

  } catch (error) {
    console.error('Pattern processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});