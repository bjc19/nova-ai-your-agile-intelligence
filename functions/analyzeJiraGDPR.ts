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

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { projectKey, projectSelectionId, autoTrigger } = await req.json();
    
    // Auto-triggered calls from triggerProjectAnalysis bypass admin check
    const isAutoTriggered = autoTrigger === true;
    
    if (!isAutoTriggered && user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Starting Jira GDPR analysis sync...');

    let jiraConnections;
    
    if (isAutoTriggered && projectKey) {
      // Single project analysis - get connection for this specific project
      console.log('Auto-triggered analysis for project:', projectKey);
      jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({
        is_active: true
      });
    } else {
      // Full admin analysis - all connections
      jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({
        is_active: true
      });
    }

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
          `https://api.atlassian.com/ex/jira/${connection.cloud_id}/rest/api/3/search?jql=type%20in%20(Story%2CEpic%2CTask)%20ORDER%20BY%20updated%20DESC&maxResults=100&fields=key%2Cissuetype%2Cstatus%2Cpriority%2Csummary%2Cdescription%2Cassignee`,
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

        // Load active anti-patterns
        const antiPatterns = await base44.asServiceRole.entities.AntiPattern.filter({
          is_active: true
        });

        const patternContext = antiPatterns
          .filter(p => p.source_type?.includes('jira'))
          .map(p => `${p.pattern_id} - ${p.name}: Marqueurs [${p.markers?.join(', ')}]`)
          .join('\n');

        // ========== ANALYZE IN MEMORY WITH ACTIONABLE CONTEXT ==========
        for (const issue of issues) {
          try {
            const assigneeFirstName = issue.fields.assignee?.displayName?.split(' ')[0] || null;
            const issueKey = issue.key;
            const summary = issue.fields.summary || '';
            const status = issue.fields.status.name;
            const isBlocked = status.toLowerCase().includes('blocked') || status.toLowerCase().includes('impediment');

            // Only analyze issues with potential problems
            if (!isBlocked && status !== 'In Progress' && status !== 'To Do') continue;

            const analysisPrompt = `Analyze this Jira issue using these anti-patterns:

${patternContext}

Issue: ${issueKey}
Summary: ${summary}
Status: ${status}
Assignee: ${assigneeFirstName || 'Unassigned'}
Priority: ${issue.fields.priority?.name || 'None'}

Detect anti-patterns and provide actionable recommendations WITH first names.

Return JSON:
{
  "has_issue": true|false,
  "detected_pattern_ids": ["A1", "B2"],
  "problem_description": "Specific description with first name (e.g. '${assigneeFirstName} bloqué sur ${issueKey} depuis 3 jours')",
  "recommendations": ["Actionable reco with name"],
  "criticality": "basse|moyenne|haute|critique",
  "confidence": 0.0-1.0
}`;

            const analysisResult = await base44.integrations.Core.InvokeLLM({
              prompt: analysisPrompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  has_issue: { type: 'boolean' },
                  detected_pattern_ids: { type: 'array', items: { type: 'string' } },
                  problem_description: { type: 'string' },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  criticality: { type: 'string' },
                  confidence: { type: 'number' }
                }
              }
            });

            // ========== GENERATE ACTIONABLE MARKERS ==========
            if (analysisResult?.has_issue) {
              const issueId = generateUUID();
              const teamId = sha256(connection.cloud_id);
              const sessionId = generateUUID();

              await base44.asServiceRole.entities.GDPRMarkers.create({
                issue_id: issueId,
                tenant_id: tenant_id,
                team_id: teamId,
                session_id: sessionId,
                date: new Date().toISOString().split('T')[0],
                type: 'other',
                probleme: analysisResult.problem_description,
                assignee_first_name: assigneeFirstName,
                jira_ticket_key: issueKey,
                recos: analysisResult.recommendations,
                statut: 'ouvert',
                recurrence: 1,
                criticite: analysisResult.criticality,
                confidence_score: analysisResult.confidence,
                detection_source: 'jira_backlog',
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
                      context: `${issueKey}: ${analysisResult.problem_description}`.substring(0, 500),
                      severity: analysisResult.criticality,
                      recommended_actions: analysisResult.recommendations,
                      status: 'detected'
                    });
                  }
                }
              }

              console.log(`Created actionable marker for ${issueKey}: ${analysisResult.problem_description}`);
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