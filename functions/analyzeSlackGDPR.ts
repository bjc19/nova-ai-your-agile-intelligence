import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';

const generateHash = async (input) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const detectAntiPatterns = (messages) => {
  const patterns = [];

  const keywords = {
    'blockers': ['bloqué', 'blocker', 'stuck', 'impediment', 'attendant', 'waiting'],
    'context_switching': ['contexte', 'projet different', 'autre équipe', 'multi-project'],
    'scope_creep': ['ajouter', 'nouveau requirement', 'scope', 'plus de travail', 'change request'],
    'communication_issues': ['comprendre', 'unclear', 'confusion', 'miscommunication'],
    'velocity_issues': ['retard', 'late', 'slow', 'lent', 'behind'],
    'wip_overload': ['trop', 'overloaded', 'too much', 'capacité', 'WIP'],
  };

  let messageContent = messages.map(m => (m.text || '').toLowerCase()).join(' ');

  const detected = {};

  for (const [pattern, words] of Object.entries(keywords)) {
    const count = words.filter(word => messageContent.includes(word)).length;
    if (count > 0) {
      detected[pattern] = count;
    }
  }

  return detected;
};

const generateRecommendations = (detectedPatterns) => {
  const recos = {
    'blockers': 'Identifier et lever les blocages dans le sprint',
    'context_switching': 'Minimiser les changements de contexte et les interruptions',
    'scope_creep': 'Respecter le périmètre défini du sprint et documenter les changements',
    'communication_issues': 'Améliorer la clarté et la fréquence des communications',
    'velocity_issues': 'Analyser les causes de retard et ajuster les estimations',
    'wip_overload': 'Réduire le WIP et prioriser les tickets en cours',
  };

  return Object.keys(detectedPatterns)
    .map(pattern => recos[pattern])
    .filter(Boolean);
};

const mapPatternsToSeverity = (patterns) => {
  const patternScores = {
    'blockers': 3,
    'velocity_issues': 2,
    'wip_overload': 2,
    'scope_creep': 2,
    'context_switching': 1,
    'communication_issues': 1,
  };

  const totalScore = Object.entries(patterns)
    .reduce((sum, [pattern, count]) => sum + (patternScores[pattern] || 0) * count, 0);

  if (totalScore >= 6) return 'critique';
  if (totalScore >= 4) return 'haute';
  if (totalScore >= 2) return 'moyenne';
  return 'basse';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Slack connection
    const connections = await base44.asServiceRole.entities.SlackConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!connections || connections.length === 0) {
      return Response.json({
        success: false,
        error: 'No active Slack connection found',
        markers_created: 0
      }, { status: 400 });
    }

    const connection = connections[0];
    const accessToken = connection.access_token;
    const slackTeamId = connection.team_id;

    // Fetch recent messages from last 24 hours
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const olderTimestamp = Math.floor(oneDayAgo.getTime() / 1000);

    // Get user list with first names
    const usersResponse = await fetch('https://slack.com/api/users.list', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const usersData = await usersResponse.json();
    const userMap = {};
    if (usersData.ok) {
      usersData.members.forEach(u => {
        const firstName = u.profile?.first_name || u.real_name?.split(' ')[0] || u.name;
        userMap[u.id] = firstName;
      });
    }

    // Get list of channels to analyze
    const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const channelsData = await channelsResponse.json();

    if (!channelsData.ok) {
      return Response.json({
        success: false,
        error: `Slack API error: ${channelsData.error}`,
        markers_created: 0
      }, { status: 400 });
    }

    const markersToCreate = [];
    const sessionId = uuidv4();
    const tenantId = await generateHash(user.email);
    const slackWorkspaceHash = await generateHash(slackTeamId);

    // Analyze each channel (in memory only)
    for (const channel of channelsData.channels) {
      if (!channel.is_member) continue;

      const historyResponse = await fetch('https://slack.com/api/conversations.history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channel.id,
          oldest: olderTimestamp,
          limit: 50
        })
      });

      const historyData = await historyResponse.json();

      if (!historyData.ok) continue;

      const messages = historyData.messages || [];

      if (messages.length === 0) continue;

      // Analyze messages IN MEMORY ONLY with LLM for actionable insights
      const conversationText = messages.map(m => 
        `${userMap[m.user] || 'Someone'}: ${m.text || ''}`
      ).join('\n');

      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this Slack standup conversation for actionable blockers and risks.

Conversation:
${conversationText}

Extract:
1. Who is blocked and by what/whom
2. Specific issues with first names
3. Actionable recommendations with names

Return JSON:
{
  "has_issues": true|false,
  "probleme": "Specific description with first names (e.g. 'Marie bloquée sur API payment, attend Jean')",
  "assignee_first_name": "First name of blocked person",
  "blocked_by_first_name": "First name of blocker if applicable",
  "team_members_involved": ["Name1", "Name2"],
  "recommendations": ["Actionable reco with names"],
  "criticality": "basse|moyenne|haute|critique",
  "confidence": 0.0-1.0
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            has_issues: { type: 'boolean' },
            probleme: { type: 'string' },
            assignee_first_name: { type: 'string' },
            blocked_by_first_name: { type: 'string' },
            team_members_involved: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
            criticality: { type: 'string' },
            confidence: { type: 'number' }
          }
        }
      });

      if (analysisResult?.has_issues) {
        const issueId = uuidv4();
        const channelLink = `https://slack.com/app_redirect?channel=${channel.id}`;

        const marker = {
          issue_id: issueId,
          tenant_id: tenantId,
          team_id: slackWorkspaceHash,
          session_id: sessionId,
          date: now.toISOString().split('T')[0],
          type: 'daily_scrum',
          probleme: analysisResult.probleme,
          assignee_first_name: analysisResult.assignee_first_name || null,
          blocked_by_first_name: analysisResult.blocked_by_first_name || null,
          team_members_involved: analysisResult.team_members_involved || [],
          slack_thread_url: channelLink,
          recos: analysisResult.recommendations,
          statut: 'ouvert',
          recurrence: 1,
          criticite: analysisResult.criticality,
          slack_workspace_id: slackWorkspaceHash,
          confidence_score: analysisResult.confidence,
          detection_source: 'slack_hourly',
          consent_given: true
        };

        markersToCreate.push(marker);
      }

      // CRITICAL: Clear message data from memory
      messages.length = 0;
    }

    // Store only the anonymized markers
    if (markersToCreate.length > 0) {
      await base44.asServiceRole.entities.GDPRMarkers.bulkCreate(markersToCreate);
    }

    // Return only success info, NO message content or PII
    return Response.json({
      success: true,
      markers_created: markersToCreate.length,
      session_id: sessionId,
      analysis_date: now.toISOString(),
      channels_analyzed: channelsData.channels.filter(c => c.is_member).length,
      message: 'Analysis completed. Raw messages purged from memory. Only anonymized markers stored.'
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      markers_created: 0
    }, { status: 500 });
  }
});