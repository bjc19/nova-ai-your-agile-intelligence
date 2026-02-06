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
    const issueMap = {};

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

      // Analyze messages IN MEMORY ONLY (never store raw messages)
      const detectedPatterns = detectAntiPatterns(messages);

      if (Object.keys(detectedPatterns).length > 0) {
        const recos = generateRecommendations(detectedPatterns);
        const criticite = mapPatternsToSeverity(detectedPatterns);

        // Create anonymized marker
        const issueId = uuidv4();
        const channelHash = await generateHash(channel.id);
        const clusterKey = `${Object.keys(detectedPatterns).sort().join('_')}_${criticite}`;

        if (!issueMap[clusterKey]) {
          issueMap[clusterKey] = {
            issue_id: issueId,
            probleme_cluster_id: uuidv4(),
          };
        }

        const marker = {
          issue_id: issueId,
          tenant_id: tenantId,
          team_id: slackWorkspaceHash,
          session_id: sessionId,
          date: now.toISOString().split('T')[0],
          type: 'slack_analysis',
          probleme: `Pattern détecté: ${Object.keys(detectedPatterns).join(', ')}`,
          recos: recos,
          statut: 'ouvert',
          recurrence: 1,
          criticite: criticite,
          slack_workspace_id: slackWorkspaceHash,
          confidence_score: Math.min(1, Object.keys(detectedPatterns).length / 6),
          detection_source: 'slack_hourly',
          probleme_cluster_id: issueMap[clusterKey].probleme_cluster_id
        };

        markersToCreate.push(marker);
      }

      // CRITICAL: Explicitly clear message data from memory
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