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
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { projectSelectionId } = await req.json();

    if (!projectSelectionId) {
      return Response.json({ error: 'projectSelectionId requis' }, { status: 400 });
    }

    console.log('🔍 Déclenchement analyse pour project:', projectSelectionId, 'par', user.email);

    // Vérifier le type de projet (Jira ou Trello)
    let jiraProject = null;
    let trelloProject = null;
    let analysisType = null;

    try {
      const jiraProjects = await base44.entities.JiraProjectSelection.filter({
        id: projectSelectionId,
        is_active: true
      });
      if (jiraProjects.length > 0) {
        jiraProject = jiraProjects[0];
        analysisType = 'jira';
        console.log('✅ Projet Jira trouvé:', jiraProject.jira_project_key);
      }
    } catch (e) {
      console.warn('⚠️ Erreur lors de la recherche Jira:', e.message);
    }

    if (!analysisType) {
      try {
        const trelloProjects = await base44.entities.TrelloProjectSelection.filter({
          id: projectSelectionId,
          is_active: true
        });
        if (trelloProjects.length > 0) {
          trelloProject = trelloProjects[0];
          analysisType = 'trello';
          console.log('✅ Projet Trello trouvé:', trelloProject.trello_board_name);
        }
      } catch (e) {
        console.warn('⚠️ Erreur lors de la recherche Trello:', e.message);
      }
    }

    if (!analysisType) {
      return Response.json({
        error: 'Projet non trouvé ou inactif',
        success: false
      }, { status: 404 });
    }

    // ========== ANALYZE JIRA DIRECTLY ==========
    if (analysisType === 'jira') {
      console.log('🔄 Analyse Jira directe pour', jiraProject.jira_project_key);
      
      const jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({
        user_email: user.email,
        is_active: true
      });

      if (jiraConnections.length === 0) {
        return Response.json({
          success: true,
          message: 'No Jira connections found',
          recordsProcessed: 0
        });
      }

      const tenant_id = sha256(user.email || 'unknown');
      let totalRecordsProcessed = 0;

      for (const connection of jiraConnections) {
        try {
          const projectSelections = await base44.asServiceRole.entities.JiraProjectSelection.filter({
            user_email: connection.user_email,
            is_active: true
          });

          if (projectSelections.length === 0) continue;

          const antiPatterns = await base44.asServiceRole.entities.AntiPattern.filter({
            is_active: true
          });

          const patternContext = antiPatterns
            .filter(p => p.source_type?.includes('jira'))
            .map(p => `${p.pattern_id} - ${p.name}: Marqueurs [${p.markers?.join(', ')}]`)
            .join('\n');

          for (const projectSelection of projectSelections) {
            try {
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

              for (const issue of issues) {
                try {
                  const isBlocked = issue.summary?.toLowerCase().includes('blocked') || 
                                    issue.summary?.toLowerCase().includes('bloqu') ||
                                    issue.description?.toLowerCase().includes('blocked') ||
                                    issue.description?.toLowerCase().includes('bloqu');
                  
                  const isInProgress = issue.status?.name?.toLowerCase().includes('progress') || 
                                       issue.status?.name?.toLowerCase().includes('cours');

                  if (!isBlocked && !isInProgress) continue;

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
  "problem_description": "Specific description with first name",
  "recommendations": ["Actionable reco"],
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
                      consent_given: true,
                      jira_project_selection_id: projectSelectionId
                    });

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
                            context: `Jira - ${issue.key}`.substring(0, 500),
                            severity: analysisResult.criticality,
                            recommended_actions: analysisResult.recommendations,
                            status: 'detected'
                          });
                        }
                      }
                    }

                    console.log(`Created marker for Jira issue: ${issue.key}`);
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

      // Create AnalysisHistory entry
      const analysisId = generateUUID();
      try {
        await base44.asServiceRole.entities.AnalysisHistory.create({
          title: `Jira Analysis - ${jiraProject.jira_project_name}`,
          source: 'jira_backlog',
          jira_project_selection_id: projectSelectionId,
          workspace_name: jiraProject.workspace_name,
          blockers_count: totalRecordsProcessed,
          risks_count: 0,
          analysis_data: {
            project_key: jiraProject.jira_project_key,
            project_id: jiraProject.jira_project_id,
            analyzed_at: new Date().toISOString(),
            total_issues_scanned: 0
          },
          transcript_preview: `Analysis of Jira project ${jiraProject.jira_project_key}`,
          contributing_sources: [{
            source: 'jira_backlog',
            confidence: 0.95,
            metadata: {
              project_key: jiraProject.jira_project_key
            }
          }],
          cross_source_confidence: 0.95,
          analysis_time: new Date().toISOString()
        });
        console.log('✅ AnalysisHistory created for Jira:', projectSelectionId);
      } catch (error) {
        console.error('Error creating AnalysisHistory:', error.message);
      }

      return Response.json({
        success: true,
        message: `Jira analysis completed - ${jiraProject.jira_project_name}`,
        recordsProcessed: totalRecordsProcessed,
        analysisId: analysisId
      });
    }

    // ========== ANALYZE TRELLO DIRECTLY ==========
    else if (analysisType === 'trello') {
      console.log('🔄 Analyse Trello directe pour', trelloProject.trello_board_id);
      
      const trelloConnections = await base44.asServiceRole.entities.TrelloConnection.filter({
        user_email: user.email,
        is_active: true
      });

      if (trelloConnections.length === 0) {
        return Response.json({
          success: true,
          message: 'No Trello connections found',
          recordsProcessed: 0
        });
      }

      const tenant_id = sha256(user.email || 'unknown');
      let totalRecordsProcessed = 0;

      for (const connection of trelloConnections) {
        try {
          const boardSelections = await base44.asServiceRole.entities.TrelloProjectSelection.filter({
            user_email: connection.user_email,
            is_active: true
          });

          if (boardSelections.length === 0) continue;

          const antiPatterns = await base44.asServiceRole.entities.AntiPattern.filter({
            is_active: true
          });

          const patternContext = antiPatterns
            .filter(p => p.source_type?.includes('trello'))
            .map(p => `${p.pattern_id} - ${p.name}`)
            .join('\n');

          for (const boardSelection of boardSelections) {
            try {
              const cardsResponse = await fetch(
                `https://api.trello.com/1/boards/${boardSelection.board_id}/cards?key=${connection.api_key}&token=${connection.access_token}&fields=id,name,desc,idList,due,idMembers`,
                { method: 'GET' }
              );

              if (!cardsResponse.ok) continue;

              const cards = await cardsResponse.json();
              const listsResponse = await fetch(
                `https://api.trello.com/1/boards/${boardSelection.board_id}/lists?key=${connection.api_key}&token=${connection.access_token}`,
                { method: 'GET' }
              );

              const lists = listsResponse.ok ? await listsResponse.json() : [];
              const listMap = Object.fromEntries(lists.map(l => [l.id, l.name]));

              for (const card of cards) {
                try {
                  const listName = listMap[card.idList] || 'Unknown';
                  const isBlocked = listName.toLowerCase().includes('blocked') || card.name.toLowerCase().includes('blocked');
                  const isInProgress = listName.toLowerCase().includes('progress') || listName.toLowerCase().includes('doing');

                  if (!isBlocked && !isInProgress && !card.due) continue;

                  let assigneeFirstName = null;
                  if (card.idMembers && card.idMembers.length > 0) {
                    try {
                      const memberResponse = await fetch(
                        `https://api.trello.com/1/members/${card.idMembers[0]}?key=${connection.api_key}&token=${connection.access_token}&fields=fullName`,
                        { method: 'GET' }
                      );
                      if (memberResponse.ok) {
                        const memberData = await memberResponse.json();
                        assigneeFirstName = memberData.fullName?.split(' ')[0] || null;
                      }
                    } catch (e) {
                      console.log('Could not fetch member info');
                    }
                  }

                  const analysisPrompt = `Analyze this Trello card for project management issues:
Card: ${card.name}
Status: ${listName}
Assignee: ${assigneeFirstName || 'Unassigned'}

Return JSON with: has_issue (bool), criticality (basse/moyenne/haute/critique), confidence (0-1)`;

                  const analysisResult = await base44.integrations.Core.InvokeLLM({
                    prompt: analysisPrompt,
                    response_json_schema: {
                      type: 'object',
                      properties: {
                        has_issue: { type: 'boolean' },
                        criticality: { type: 'string' },
                        confidence: { type: 'number' }
                      }
                    }
                  });

                  if (analysisResult?.has_issue) {
                    const issueId = generateUUID();
                    const teamId = sha256(boardSelection.board_id);

                    await base44.asServiceRole.entities.GDPRMarkers.create({
                      issue_id: issueId,
                      tenant_id: tenant_id,
                      team_id: teamId,
                      session_id: generateUUID(),
                      date: new Date().toISOString().split('T')[0],
                      type: 'other',
                      probleme: `Issue on card: ${card.name}`,
                      assignee_first_name: assigneeFirstName,
                      recos: [],
                      statut: 'ouvert',
                      recurrence: 1,
                      criticite: analysisResult.criticality,
                      confidence_score: analysisResult.confidence,
                      detection_source: 'manual_trigger',
                      consent_given: true
                    });

                    console.log(`Created marker for Trello card: ${card.name}`);
                    totalRecordsProcessed++;
                  }
                } catch (error) {
                  console.error('Error analyzing Trello card:', error.message);
                }
              }
            } catch (error) {
              console.error('Error processing Trello board:', error.message);
            }
          }
        } catch (error) {
          console.error('Error processing Trello connection:', error.message);
        }
      }

      // Create AnalysisHistory entry
      const analysisId = generateUUID();
      try {
        await base44.asServiceRole.entities.AnalysisHistory.create({
          title: `Trello Analysis - ${trelloProject.board_name}`,
          source: 'trello',
          trello_project_selection_id: projectSelectionId,
          workspace_name: trelloProject.board_name,
          blockers_count: totalRecordsProcessed,
          risks_count: 0,
          analysis_data: {
            board_id: trelloProject.board_id,
            board_name: trelloProject.trello_board_name,
            analyzed_at: new Date().toISOString(),
            total_cards_scanned: 0
          },
          transcript_preview: `Analysis of Trello board ${trelloProject.board_name}`,
          contributing_sources: [{
            source: 'trello',
            confidence: 0.95,
            metadata: {
              board_id: trelloProject.board_id
            }
          }],
          cross_source_confidence: 0.95,
          analysis_time: new Date().toISOString()
        });
        console.log('✅ AnalysisHistory created for Trello:', projectSelectionId);
      } catch (error) {
        console.error('Error creating AnalysisHistory:', error.message);
      }

      return Response.json({
        success: true,
        message: `Trello analysis completed - ${trelloProject.board_name}`,
        recordsProcessed: totalRecordsProcessed,
        analysisId: analysisId
      });
    }

  } catch (error) {
    const errorMessage = error?.message || 'Erreur inconnue';
    console.error('❌ Erreur:', errorMessage);
    return Response.json({
      error: errorMessage,
      success: false
    }, { status: 500 });
  }
});