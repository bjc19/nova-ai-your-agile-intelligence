import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function generateUUID() {
  return crypto.randomUUID();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Starting Teams GDPR sync...');

    // Get active Teams connections
    const teamsConnections = await base44.asServiceRole.entities.TeamsConnection.filter({
      is_active: true
    });

    if (teamsConnections.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No Teams connections found',
        recordsProcessed: 0 
      });
    }

    let totalRecordsProcessed = 0;

    for (const connection of teamsConnections) {
      try {
        // Get access token for this user
        const accessToken = connection.access_token;
        
        // Search OneDrive for Teams transcripts (*.vtt files saved by Teams)
        const searchResponse = await fetch(
          'https://graph.microsoft.com/v1.0/me/drive/root:/Microsoft Teams Chat Files/Transcripts:/children',
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );

        if (!searchResponse.ok) {
          console.log('Transcripts folder not found for user');
          continue;
        }

        const filesData = await searchResponse.json();
        const transcriptFiles = filesData.value || [];

        // Filter VTT/TXT transcript files from last 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const file of transcriptFiles) {
          if (!file.name.match(/\.(vtt|txt)$/i)) continue;
          if (new Date(file.lastModifiedDateTime) < oneDayAgo) continue;

          try {
            // Download transcript content from OneDrive
            const contentResponse = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`,
              {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              }
            );

            if (!contentResponse.ok) continue;

            const transcriptContent = await contentResponse.text();

              // Load active anti-patterns
              const antiPatterns = await base44.asServiceRole.entities.AntiPattern.filter({
                is_active: true
              });

              const patternContext = antiPatterns
                .filter(p => p.source_type?.includes('transcript') || p.source_type?.includes('teams'))
                .map(p => `${p.pattern_id} - ${p.name}: Marqueurs [${p.markers?.join(', ')}]`)
                .join('\n');

              // ========== ANALYZE WITH ACTIONABLE INSIGHTS ==========
              const analysisResult = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this Teams meeting transcript using these Scrum anti-patterns:

${patternContext}

Extract first names, detected patterns, and specific issues for actionable recommendations.

Return JSON:
{
  "has_issues": true|false,
  "detected_pattern_ids": ["A1", "B2"],
  "problem_description": "Specific description with first names (e.g. 'Marie bloquée sur API, Jean en retard sur PR')",
  "assignee_first_name": "First name of blocked person",
  "blocked_by_first_name": "First name of blocker if applicable",
  "team_members_involved": ["Name1", "Name2"],
  "ceremony_type": "daily_scrum|retrospective|planning|review|refinement|other",
  "recommendations": ["Actionable reco with names"],
  "criticality": "basse|moyenne|haute|critique",
  "confidence": 0.0-1.0
}

Transcript:
${transcriptContent.substring(0, 4000)}`,
                response_json_schema: {
                  type: 'object',
                  properties: {
                    has_issues: { type: 'boolean' },
                    detected_pattern_ids: { type: 'array', items: { type: 'string' } },
                    problem_description: { type: 'string' },
                    assignee_first_name: { type: 'string' },
                    blocked_by_first_name: { type: 'string' },
                    team_members_involved: { type: 'array', items: { type: 'string' } },
                    ceremony_type: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    criticality: { type: 'string' },
                    confidence: { type: 'number' }
                  }
                }
              });

              // ========== CLEAR RAW CONTENT FROM MEMORY ==========
              transcriptContent = null; // Force garbage collection

              // ========== GENERATE ACTIONABLE MARKERS ==========
              if (analysisResult?.has_issues) {
                const issueId = generateUUID();
                const tenantId = sha256(user.email || 'unknown');
                const teamId = sha256(connection.tenant_id || 'unknown');
                const sessionId = generateUUID();

                await base44.asServiceRole.entities.GDPRMarkers.create({
                   issue_id: issueId,
                   tenant_id: tenantId,
                   team_id: teamId,
                   session_id: sessionId,
                   date: new Date().toISOString().split('T')[0],
                   type: analysisResult.ceremony_type || 'daily_scrum',
                   probleme: analysisResult.problem_description,
                   assignee_first_name: analysisResult.assignee_first_name || null,
                   blocked_by_first_name: analysisResult.blocked_by_first_name || null,
                   team_members_involved: analysisResult.team_members_involved || [],
                   recos: analysisResult.recommendations,
                   statut: 'ouvert',
                   recurrence: 1,
                   criticite: analysisResult.criticality,
                   confidence_score: analysisResult.confidence,
                   detection_source: 'teams_daily',
                   consent_given: true
                 });

                // Create PatternDetection records
                if (analysisResult.detected_pattern_ids?.length > 0) {
                  for (const patternId of analysisResult.detected_pattern_ids) {
                    const pattern = antiPatterns.find(p => p.pattern_id === patternId);
                    if (pattern) {
                      await base44.asServiceRole.entities.PatternDetection.create({
                        analysis_id: issueId,
                        pattern_id: patternId,
                        pattern_name: pattern.name,
                        category: pattern.category,
                        confidence_score: analysisResult.confidence * 100,
                        detected_markers: pattern.markers || [],
                        context: analysisResult.problem_description.substring(0, 500),
                        severity: analysisResult.criticality,
                        recommended_actions: analysisResult.recommendations,
                        status: 'detected'
                      });
                    }
                  }
                }

                console.log(`Created actionable marker: ${analysisResult.problem_description}`);
                totalRecordsProcessed++;
              }
            }
          } catch (error) {
            console.error('Error processing meeting:', error.message);
          }
        }
      } catch (error) {
        console.error('Error processing Teams connection:', error.message);
      }
    }

    return Response.json({ 
      success: true,
      message: 'Teams GDPR sync completed',
      recordsProcessed: totalRecordsProcessed,
      markersCreated: totalRecordsProcessed
    });
  } catch (error) {
    console.error('Teams GDPR sync error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});