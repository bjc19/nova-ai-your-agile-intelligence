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

    console.log('Starting Trello GDPR analysis sync...');

    // Get active Trello connections
    const trelloConnections = await base44.asServiceRole.entities.TrelloConnection.filter({
      is_active: true
    });

    if (trelloConnections.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No Trello connections found',
        recordsProcessed: 0 
      });
    }

    let totalRecordsProcessed = 0;
    const tenant_id = sha256(user.email || 'unknown');

    for (const connection of trelloConnections) {
      try {
        // Get selected boards
        const boardSelections = await base44.asServiceRole.entities.TrelloProjectSelection.filter({
          user_email: connection.user_email,
          is_active: true
        });

        if (boardSelections.length === 0) {
          console.log('No board selections found for this Trello connection');
          continue;
        }

        // Load active anti-patterns
        const antiPatterns = await base44.asServiceRole.entities.AntiPattern.filter({
          is_active: true
        });

        const patternContext = antiPatterns
          .filter(p => p.source_type?.includes('trello'))
          .map(p => `${p.pattern_id} - ${p.name}: Marqueurs [${p.markers?.join(', ')}]`)
          .join('\n');

        for (const boardSelection of boardSelections) {
          try {
            // Get cards from board
            const cardsResponse = await fetch(
              `https://api.trello.com/1/boards/${boardSelection.board_id}/cards?key=${connection.api_key}&token=${connection.access_token}&fields=id,name,desc,idList,due,idMembers`,
              {
                method: 'GET'
              }
            );

            if (!cardsResponse.ok) {
              console.log('Trello API error:', cardsResponse.status);
              continue;
            }

            const cards = await cardsResponse.json();

            // Get lists to determine card status
            const listsResponse = await fetch(
              `https://api.trello.com/1/boards/${boardSelection.board_id}/lists?key=${connection.api_key}&token=${connection.access_token}`,
              {
                method: 'GET'
              }
            );

            const lists = listsResponse.ok ? await listsResponse.json() : [];
            const listMap = Object.fromEntries(lists.map(l => [l.id, l.name]));

            // ========== ANALYZE IN MEMORY WITH ACTIONABLE CONTEXT ==========
            for (const card of cards) {
              try {
                const listName = listMap[card.idList] || 'Unknown';
                const isBlocked = listName.toLowerCase().includes('blocked') || 
                                  listName.toLowerCase().includes('bloqu') ||
                                  card.name.toLowerCase().includes('blocked') ||
                                  card.name.toLowerCase().includes('bloqu');
                
                const isInProgress = listName.toLowerCase().includes('progress') || 
                                     listName.toLowerCase().includes('doing') ||
                                     listName.toLowerCase().includes('cours');

                // Only analyze cards with potential problems
                if (!isBlocked && !isInProgress && !card.due) continue;

                // Get member info if assigned
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
                    console.log('Could not fetch member info:', e.message);
                  }
                }

                const analysisPrompt = `Analyze this Trello card using these anti-patterns:

${patternContext}

Card: ${card.name}
Description: ${card.desc || 'No description'}
List/Status: ${listName}
Assignee: ${assigneeFirstName || 'Unassigned'}
Due Date: ${card.due || 'None'}

Detect anti-patterns and provide actionable recommendations WITH first names.

Return JSON:
{
  "has_issue": true|false,
  "detected_pattern_ids": ["A1", "B2"],
  "problem_description": "Specific description with first name (e.g. '${assigneeFirstName || 'Member'} bloqué sur ${card.name} depuis plusieurs jours')",
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
                  const teamId = sha256(boardSelection.board_id);
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
                          context: `Trello - ${card.name}: ${analysisResult.problem_description}`.substring(0, 500),
                          severity: analysisResult.criticality,
                          recommended_actions: analysisResult.recommendations,
                          status: 'detected'
                        });
                      }
                    }
                  }

                  console.log(`Created actionable marker for Trello card: ${card.name}`);
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

    return Response.json({ 
      success: true,
      message: 'Trello GDPR analysis completed (zero retention of PII)',
      recordsProcessed: totalRecordsProcessed,
      markersCreated: totalRecordsProcessed
    });
  } catch (error) {
    console.error('Trello GDPR analysis error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});