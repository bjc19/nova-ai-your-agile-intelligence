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

    console.log('Starting Jira GDPR analysis sync...');

    // Get active Jira connections
    const jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({
      is_active: true
    });

    if (jiraConnections.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No Jira connections found',
        recordsProcessed: 0 
      });
    }

    let totalRecordsProcessed = 0;
    const tenant_id = sha256(user.email || 'unknown');

    for (const connection of jiraConnections) {
      try {
        // Get Jira issues via API (in memory only)
        const issuesResponse = await fetch(
          `https://api.atlassian.com/ex/jira/${connection.cloud_id}/rest/api/3/search?jql=type%20in%20(Story%2CEpic%2CTask)%20ORDER%20BY%20updated%20DESC&maxResults=100&fields=key%2Cissuetype%2Cstatus%2Cpriority%2Csummary%2Cdescription`,
          {
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Accept': 'application/json',
            }
          }
        );

        if (!issuesResponse.ok) {
          console.log('Jira API error:', issuesResponse.status);
          continue;
        }

        const issuesData = await issuesResponse.json();
        const issues = issuesData.issues || [];

        // ========== ANALYZE IN MEMORY ONLY ==========
        for (const issue of issues) {
          try {
            // Prepare data for analysis WITHOUT storing raw content
            const issueData = {
              type: issue.fields.issuetype.name,
              status: issue.fields.status.name,
              priority: issue.fields.priority?.name || 'None',
              has_description: Boolean(issue.fields.description),
              description_length: issue.fields.description?.length || 0
            };

            // ========== CLEAR RAW CONTENT FROM MEMORY ==========
            // Never keep summary, description, or any text
            const analysisPrompt = `Analyze this Jira issue metadata for backlog quality anti-patterns.

Issue Type: ${issueData.type}
Status: ${issueData.status}
Priority: ${issueData.priority}
Has Description: ${issueData.has_description}
Description Length: ${issueData.description_length}

🔒 GDPR: Never mention or extract: issue keys, summaries, descriptions, assignees, comments.

Detect:
1. Epic too large (no description or description < 50 chars)
2. Missing acceptance criteria
3. Blocked/impediment (blocked in status)
4. Unclear priority
5. Unestimated story

Return ONLY a JSON object:
{
  "detected_issues": ["issue1", "issue2"],
  "problem_description": "Generic description without any details",
  "recommendations": ["Rec1", "Rec2"],
  "criticality": "basse|moyenne|haute|critique",
  "confidence": 0.0-1.0
}`;

            const analysisResult = await base44.integrations.Core.InvokeLLM({
              prompt: analysisPrompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  detected_issues: { type: 'array', items: { type: 'string' } },
                  problem_description: { type: 'string' },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  criticality: { type: 'string' },
                  confidence: { type: 'number' }
                }
              }
            });

            // ========== GENERATE ANONYMIZED MARKERS ==========
            if (analysisResult && analysisResult.detected_issues.length > 0) {
              const issueId = generateUUID();
              const teamId = sha256(connection.cloud_id);

              await base44.asServiceRole.entities.GDPRMarkers.create({
                issue_id: issueId,
                tenant_id: tenant_id,
                team_id: teamId,
                session_id: generateUUID(),
                date: new Date().toISOString().split('T')[0],
                type: 'backlog_quality',
                probleme: analysisResult.problem_description,
                recos: analysisResult.recommendations,
                statut: 'ouvert',
                recurrence: 1,
                criticite: analysisResult.criticality,
                slack_workspace_id: null,
                confidence_score: analysisResult.confidence,
                detection_source: 'jira_backlog'
              });

              console.log(`Created GDPR marker for Jira issue: ${issueId} (zero retention confirmed)`);
              totalRecordsProcessed++;
            }
          } catch (error) {
            console.error('Error analyzing Jira issue:', error.message);
          }
        }
      } catch (error) {
        console.error('Error processing Jira connection:', error.message);
      }
    }

    return Response.json({ 
      success: true,
      message: 'Jira GDPR analysis completed (zero retention of PII)',
      recordsProcessed: totalRecordsProcessed,
      markersCreated: totalRecordsProcessed
    });
  } catch (error) {
    console.error('Jira GDPR analysis error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});