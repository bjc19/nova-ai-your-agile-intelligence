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
        
        // Fetch recent meetings from Microsoft Graph
        const meetingsResponse = await fetch(
          'https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=' + 
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() + 
          '&endDateTime=' + new Date().toISOString(),
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );

        if (!meetingsResponse.ok) {
          console.error('Failed to fetch meetings:', meetingsResponse.status);
          continue;
        }

        const meetingsData = await meetingsResponse.json();
        const meetings = meetingsData.value || [];

        for (const meeting of meetings) {
          try {
            // Check if meeting has Teams recording/transcript
            if (!meeting.isOnlineMeeting) continue;

            // Get meeting transcript
            const meetingId = meeting.id;
            const transcriptResponse = await fetch(
              `https://graph.microsoft.com/v1.0/me/events/${meetingId}/transcripts`,
              {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              }
            );

            if (!transcriptResponse.ok) continue;

            const transcriptData = await transcriptResponse.json();
            const transcripts = transcriptData.value || [];

            for (const transcript of transcripts) {
              // Get full transcript content
              const contentResponse = await fetch(
                `https://graph.microsoft.com/v1.0/me/events/${meetingId}/transcripts/${transcript.id}/content`,
                {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }
              );

              if (!contentResponse.ok) continue;

              const transcriptContent = await contentResponse.text();

              // ========== ANALYZE IN MEMORY ONLY ==========
              // Use LLM to detect patterns WITHOUT storing raw content
              const analysisResult = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this Teams meeting transcript for Agile/Scrum anti-patterns. Return ONLY a JSON object with:
{
  "detected_patterns": ["pattern1", "pattern2"],
  "ceremony_type": "daily_scrum|retrospective|planning|review|refinement|other",
  "problem_description": "Generic description without any names or quotes",
  "recommendations": ["Rec1", "Rec2"],
  "criticality": "basse|moyenne|haute|critique",
  "confidence": 0.0-1.0
}

Transcript:
${transcriptContent.substring(0, 4000)}`,
                response_json_schema: {
                  type: 'object',
                  properties: {
                    detected_patterns: { type: 'array', items: { type: 'string' } },
                    ceremony_type: { type: 'string' },
                    problem_description: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    criticality: { type: 'string' },
                    confidence: { type: 'number' }
                  }
                }
              });

              // ========== CLEAR RAW CONTENT FROM MEMORY ==========
              const rawTranscript = transcriptContent;
              transcriptContent = null; // Force garbage collection hint

              // ========== GENERATE ANONYMIZED MARKERS ==========
              if (analysisResult && analysisResult.detected_patterns.length > 0) {
                const issueId = generateUUID();
                const tenantId = sha256(user.email || 'unknown');
                const teamId = sha256(connection.team_id || 'unknown');
                const sessionId = generateUUID();

                await base44.asServiceRole.entities.GDPRMarkers.create({
                  issue_id: issueId,
                  tenant_id: tenantId,
                  team_id: teamId,
                  session_id: sessionId,
                  date: new Date().toISOString().split('T')[0],
                  type: analysisResult.ceremony_type || 'other',
                  probleme: analysisResult.problem_description,
                  recos: analysisResult.recommendations,
                  statut: 'ouvert',
                  recurrence: 1,
                  criticite: analysisResult.criticality,
                  slack_workspace_id: null,
                  confidence_score: analysisResult.confidence,
                  detection_source: 'teams_daily'
                });

                console.log(`Created GDPR marker: ${issueId}`);
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