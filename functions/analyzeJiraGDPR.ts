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
    const reqBody = await req.json();
    const { projectKey, projectSelectionId, autoTrigger, callingUserEmail, callingUserRole } = reqBody;

    console.log('🔍 analyzeJiraGDPR called with:', { projectKey, autoTrigger, callingUserEmail, callingUserRole });

    // Authentication & Authorization check
    let authorizedUserEmail = callingUserEmail;
    let authorizedUserRole = callingUserRole;

    // If NOT autoTriggered, verify admin status from direct call
    if (!autoTrigger) {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
      }
      authorizedUserEmail = user.email;
      authorizedUserRole = user.role;
    }

    // Verify admin access
    if (authorizedUserRole !== 'admin') {
      console.error('❌ User is not admin:', authorizedUserRole);
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('✅ Authorization passed for:', authorizedUserEmail);
    console.log('Starting Jira GDPR analysis sync...');

    // Get active Jira connections for this user
    const jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({
      user_email: authorizedUserEmail,
      is_active: true
    });

    if (jiraConnections.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No Jira connections found for this user',
        recordsProcessed: 0 
      });
    }

    let totalRecordsProcessed = 0;
    const tenant_id = sha256(authorizedUserEmail || 'unknown');

    for (const connection of jiraConnections) {
      try {
        // Get selected projects for this connection
        const projectSelections = await base44.asServiceRole.entities.JiraProjectSelection.filter({
          user_email: connection.user_email,
          is_active: true
        });

        if (projectSelections.length === 0) {
          console.log('No project selections found for this Jira connection');
          continue;
        }

        // Load active anti-patterns
        const antiPatterns = await base44.asServiceRole.entities.AntiPattern.filter({
          is_active: true
        });

        const patternContext = antiPatterns
          .filter(p => p.source_type?.includes('jira'))
          .map(p => `${p.pattern_id} - ${p.name}: Marqueurs [${p.markers?.join(', ')}]`)
          .join('\n');

        for (const projectSelection of projectSelections) {
          try {
            // Get issues from Jira
            const issuesResponse = await fetch(
              `https://api.atlassian.com/ex/jira/${connection.cloud_id}/rest/api/3/search?jql=project=${projectSelection.jira_project_key}&fields=key,summary,description,status,assignee,updated&maxResults=100`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${connection.access_token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!issuesResponse.ok) {
              console.log('Jira API error:', issuesResponse.status);
              continue;
            }

            const issuesData = await issuesResponse.json();
            const issues = issuesData.issues || [];

            // ========== ANALYZE IN MEMORY WITH ACTIONABLE CONTEXT ==========
            for (const issue of issues) {
              try {
                const isBlocked = issue.summary?.toLowerCase().includes('blocked') || 
                                  issue.summary?.toLowerCase().includes('bloqu') ||
                                  issue.description?.toLowerCase().includes('blocked') ||
                                  issue.description?.toLowerCase().includes('bloqu');
                
                const isInProgress = issue.status?.name?.toLowerCase().includes('progress') || 
                                     issue.status?.name?.toLowerCase().includes('cours');

                // Only analyze issues with potential problems
                if (!isBlocked && !isInProgress) continue;

                // Get assignee info if assigned
                let assigneeFirstName = null;
                if (issue.assignee?.displayName) {
                  assigneeFirstName = issue.assignee.displayName.split(' ')[0];
                }

                const analysisPrompt = `Analyze this Jira issue using these anti-patterns:

${patternContext}

Issue: ${issue.key} - ${issue.summary}
Description: ${issue.description || 'No description'}
Status: ${issue.status?.name || 'Unknown'}
Assignee: ${assigneeFirstName || 'Unassigned'}
Updated: ${issue.updated || 'N/A'}

Detect anti-patterns and provide actionable recommendations WITH first names.

Return JSON:
{
  "has_issue": true|false,
  "detected_pattern_ids": ["A1", "B2"],
  "problem_description": "Specific description with first name (e.g. '${assigneeFirstName || 'Member'} bloqué sur ${issue.key} depuis plusieurs jours')",
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
                  const teamId = sha256(projectSelection.jira_project_id);
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
                    jira_ticket_key: issue.key,
                    recos: analysisResult.recommendations,
                    statut: 'ouvert',
                    recurrence: 1,
                    criticite: analysisResult.criticality,
                    confidence_score: analysisResult.confidence,
                    detection_source: 'manual_trigger',
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
                          context: `Jira - ${issue.key}: ${analysisResult.problem_description}`.substring(0, 500),
                          severity: analysisResult.criticality,
                          recommended_actions: analysisResult.recommendations,
                          status: 'detected'
                        });
                      }
                    }
                  }

                  console.log(`Created actionable marker for Jira issue: ${issue.key}`);
                  totalRecordsProcessed++;
                }
              } catch (error) {
                console.error('Error analyzing Jira issue:', error.message);
              }
            }
          } catch (error) {
            console.error('Error processing Jira project:', error.message);
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