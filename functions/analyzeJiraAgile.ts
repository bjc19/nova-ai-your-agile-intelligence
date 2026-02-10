import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { buildAgileMetaV11, validateAgileMetaV11 } from './validateAgileMetaSchema.js';
import crypto from 'npm:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jira_cloud_id, board_id, sprint_id } = await req.json();

    if (!jira_cloud_id || !board_id) {
      return Response.json({ error: 'Missing jira_cloud_id or board_id' }, { status: 400 });
    }

    // Récupérer la connexion Jira de l'utilisateur
    const jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!jiraConnections || jiraConnections.length === 0) {
      return Response.json({ error: 'No active Jira connection found' }, { status: 403 });
    }

    const jiraConn = jiraConnections[0];
    const accessToken = jiraConn.access_token; // In production, refresh if expired

    // Fetch sprint/iteration data from Jira
    const sprintData = await fetchJiraSprintData(jira_cloud_id, board_id, sprint_id, accessToken);
    if (!sprintData) {
      return Response.json({ error: 'Failed to fetch Jira sprint data' }, { status: 500 });
    }

    // Fetch issues from Jira
    const issues = await fetchJiraIssues(jira_cloud_id, board_id, sprint_id, accessToken);
    if (!issues) {
      return Response.json({ error: 'Failed to fetch Jira issues' }, { status: 500 });
    }

    // Analyze for risks and blockers
    const analysis = analyzeJiraIssues(issues, sprintData);

    // Create GDPRMarkers according to [AGILE-v1] convention
    const markers = [];
    for (const risk of analysis.risks) {
      const marker = buildAgileRiskMarker(
        risk,
        sprintData,
        board_id,
        user.email,
        jiraConn.tenant_id || null
      );
      markers.push(marker);
    }

    // Insert markers into GDPRMarkers (via service role, no schema change)
    const insertedMarkers = [];
    for (const marker of markers) {
      try {
        const inserted = await base44.asServiceRole.entities.GDPRMarkers.create({
          issue_id: marker.issue_id,
          tenant_id: marker.tenant_id,
          team_id: marker.team_id,
          session_id: marker.session_id,
          date: marker.date,
          type: marker.type,
          probleme: marker.probleme,
          jira_ticket_key: marker.jira_ticket_key,
          recos: marker.recos,
          statut: marker.statut,
          criticite: marker.criticite,
          confidence_score: marker.confidence_score,
          detection_source: marker.detection_source,
          consent_given: true
        });
        insertedMarkers.push(inserted);
      } catch (err) {
        console.error(`Failed to insert marker: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      analyzed_issues: issues.length,
      risks_detected: analysis.risks.length,
      markers_created: insertedMarkers.length,
      markers: insertedMarkers.map(m => ({
        id: m.id,
        type: m.type,
        criticite: m.criticite,
        jira_ticket_key: m.jira_ticket_key
      }))
    });
  } catch (error) {
    console.error('Error in analyzeJiraAgile:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchJiraSprintData(cloudId, boardId, sprintId, token) {
  try {
    const url = `https://api.atlassian.com/sites/${cloudId}/v2/boards/${boardId}/sprints/${sprintId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Jira sprint fetch error:', err);
    return null;
  }
}

async function fetchJiraIssues(cloudId, boardId, sprintId, token) {
  try {
    const url = `https://api.atlassian.com/sites/${cloudId}/v2/boards/${boardId}/sprints/${sprintId}/issues`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.issues || [];
  } catch (err) {
    console.error('Jira issues fetch error:', err);
    return null;
  }
}

function analyzeJiraIssues(issues, sprintData) {
  const risks = [];
  let blockedCount = 0;
  let unstartedCount = 0;
  let completedCount = 0;

  for (const issue of issues) {
    // Check for blocked status
    if (issue.status === 'Blocked' || issue.labels?.includes('blocked')) {
      blockedCount++;
      risks.push({
        item_ref: issue.key,
        summary: issue.summary,
        status: issue.status,
        severity: 'high',
        type: 'blocked'
      });
    }

    // Check for unstarted
    if (!issue.status || issue.status === 'To Do') {
      unstartedCount++;
    }

    // Check if completed
    if (issue.status === 'Done') {
      completedCount++;
    }
  }

  const completionRate = issues.length > 0 ? completedCount / issues.length : 0;

  // Detect cross-project dependencies
  const crossProjectDeps = detectCrossProjectDeps(issues);
  if (crossProjectDeps.length > 0) {
    risks.push({
      item_ref: 'MULTI-PROJECT-DEP',
      summary: `Cross-project dependencies detected: ${crossProjectDeps.join(', ')}`,
      severity: 'high',
      type: 'cross_project_dependency'
    });
  }

  return {
    risks,
    metrics: {
      blocked_count: blockedCount,
      unstarted_count: unstartedCount,
      completion_rate: completionRate,
      velocity_trend: detectVelocityTrend(issues)
    }
  };
}

function detectCrossProjectDeps(issues) {
  const projectCodes = new Set();
  for (const issue of issues) {
    const projectCode = issue.key.split('-')[0];
    projectCodes.add(projectCode);
  }
  return Array.from(projectCodes);
}

function detectVelocityTrend(issues) {
  const closedRecently = issues.filter(i => i.status === 'Done').length;
  if (closedRecently > 5) return 'up';
  if (closedRecently < 2) return 'down';
  return 'stable';
}

function buildAgileRiskMarker(risk, sprintData, boardId, userEmail, tenantId) {
  const now = new Date();
  const issueId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();

  // Anonymize tenant_id (SHA256 hash of user email)
  const hashedTenantId = crypto.createHash('sha256').update(userEmail).digest('hex');

  // Extract sprint/iteration info
  const iterationNumber = sprintData.id?.split('-')[1] || 0;
  const startDate = sprintData.startDate;
  const endDate = sprintData.endDate;
  const daysRemaining = Math.max(0, Math.ceil((new Date(endDate) - now) / (1000 * 60 * 60 * 24)));

  // Extract project code from item_ref (e.g., DEV from DEV-123)
  const projectCode = risk.item_ref.split('-')[0];

  // Build [AGILE_META] block
  const agileMetadata = buildAgileMetaV11({
    type: 'scrum',
    iteration_number: iterationNumber,
    iteration_type: 'sprint',
    start_date: startDate,
    end_date: endDate,
    days_remaining: daysRemaining,
    project_code: projectCode,
    item_ref: risk.item_ref,
    board_id: boardId,
    metrics: {
      blocked_count: 1,
      completion_rate: 0.0,
      risk_level: risk.severity === 'high' ? 'high' : 'medium',
      velocity_trend: 'down'
    },
    jira_sync_version: '2.4.1'
  });

  // Build probleme with [AGILE-v1] convention
  const probleme = `[AGILE-v1] ITER ${iterationNumber} (${daysRemaining} jours restants) - Item Ref: ${risk.item_ref} - ${risk.type.replace('_', ' ').toUpperCase()}: ${risk.summary}`;

  // Build recos
  const recos = `• Adresser le ${risk.type === 'blocked' ? 'ticket bloqué' : 'risque'} ${risk.item_ref} en priorité\n• Réévaluer l'impact sur le sprint goal\n\n[AGILE_META]${JSON.stringify(agileMetadata)}`;

  return {
    issue_id: issueId,
    tenant_id: hashedTenantId,
    team_id: boardId,
    session_id: sessionId,
    date: now.toISOString().split('T')[0],
    type: `jira:agile_${risk.type}`,
    probleme,
    jira_ticket_key: risk.item_ref,
    recos,
    statut: 'ouvert',
    criticite: risk.severity === 'high' ? 'haute' : 'moyenne',
    confidence_score: 0.85,
    detection_source: 'jira_hourly:agile-v1',
    consent_given: true
  };
}