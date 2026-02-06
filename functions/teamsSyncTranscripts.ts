import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const connections = await base44.asServiceRole.entities.TeamsConnection.filter({ is_active: true });
    
    let processedCount = 0;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    for (const conn of connections) {
      try {
        const meetingsResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/onlineMeetings?$filter=endDateTime ge ${twoHoursAgo}`,
          {
            headers: {
              'Authorization': `Bearer ${conn.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!meetingsResponse.ok) continue;
        
        const meetings = await meetingsResponse.json();

        for (const meeting of meetings.value || []) {
          const transcriptResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meeting.id}/transcripts`,
            { headers: { 'Authorization': `Bearer ${conn.access_token}` } }
          );

          if (!transcriptResponse.ok) continue;

          const transcripts = await transcriptResponse.json();
          
          for (const transcript of transcripts.value || []) {
            const contentResponse = await fetch(transcript.contentUrl, {
              headers: { 'Authorization': `Bearer ${conn.access_token}` }
            });

            const transcriptText = await contentResponse.text();

            const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `Analyze this Teams meeting transcript and extract anonymized insights.

Transcript:
${transcriptText}

Detect problems, blockers, risks and provide recommendations WITHOUT any PII.
Assign criticality: critique/haute for blockers, moyenne for risks, basse for minor issues.`,
              response_json_schema: {
                type: "object",
                properties: {
                  probleme: { type: "string" },
                  recos: {
                    type: "array",
                    items: { type: "string" }
                  },
                  criticite: {
                    type: "string",
                    enum: ["basse", "moyenne", "haute", "critique"]
                  },
                  patterns: {
                    type: "array",
                    items: { type: "string" }
                  },
                  metadata: {
                    type: "object",
                    properties: {
                      duration_minutes: { type: "number" },
                      participants_count: { type: "number" }
                    }
                  }
                }
              }
            });

            const encoder = new TextEncoder();
            const data = encoder.encode(`${meeting.id}${meeting.startDateTime}`);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const meeting_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            await base44.asServiceRole.entities.TeamsInsight.create({
              user_email: conn.user_email,
              meeting_hash,
              probleme: analysis.probleme,
              recos: analysis.recos || [],
              criticite: analysis.criticite,
              patterns: analysis.patterns || [],
              meeting_metadata: analysis.metadata || {},
              statut: 'ouvert'
            });

            processedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing user ${conn.user_email}:`, error);
      }
    }

    return Response.json({ 
      success: true,
      transcripts_processed: processedCount,
      message: 'Transcripts analyzed, only anonymized insights stored'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});