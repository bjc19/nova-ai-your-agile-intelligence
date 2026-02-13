import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      workspace_id,
      primary_source,
      analysis_time,
      analysis_data
    } = await req.json();

    if (!workspace_id || !primary_source) {
      return Response.json({ error: 'Missing workspace_id or primary_source' }, { status: 400 });
    }

    // Résoudre les sources contributives
    const contributingSources = await resolveContributingSources(
      base44,
      workspace_id,
      primary_source,
      analysis_time || new Date().toISOString()
    );

    // Fusionner les données
    const mergedAnalysis = await mergeSourceData(
      base44,
      workspace_id,
      primary_source,
      analysis_data,
      contributingSources,
      analysis_time
    );

    // Calculer confiance globale
    const crossSourceConfidence = calculateCrossSourceConfidence(contributingSources);

    return Response.json({
      success: true,
      contributing_sources: contributingSources,
      merged_analysis: mergedAnalysis,
      cross_source_confidence: crossSourceConfidence
    });
  } catch (error) {
    console.error('Multi-source analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function resolveContributingSources(base44, workspaceId, primarySource, analysisTime) {
  const sources = [];
  const analysisDate = new Date(analysisTime);

  // 1. SOURCE PRIMAIRE
  sources.push({
    source: primarySource,
    confidence: 1.0,
    metadata: { is_primary: true }
  });

  // 2. SLACK - Rechercher canal mappé
  try {
    const slackMappings = await base44.entities.SlackChannelMapping.filter({
      jira_project_selection_id: workspaceId,
      is_active: true
    });

    for (const mapping of slackMappings) {
      // Chercher messages Slack de ±6h
      const slackMessages = await base44.asServiceRole.entities.GDPRMarkers.filter({
        slack_workspace_id: mapping.slack_channel_id,
        detection_source: 'slack_hourly'
      });

      const relevantMessages = slackMessages.filter(m => {
        const msgDate = new Date(m.created_date);
        const hourDiff = Math.abs((analysisDate - msgDate) / (1000 * 60 * 60));
        return hourDiff <= 6;
      });

      if (relevantMessages.length > 0) {
        sources.push({
          source: 'slack',
          confidence: Math.min(0.95, 0.7 + (relevantMessages.length * 0.05)),
          metadata: {
            channel_id: mapping.slack_channel_id,
            channel_name: mapping.slack_channel_name,
            message_count: relevantMessages.length,
            time_window_hours: 6,
            mapped_confidence: mapping.confidence_score
          }
        });
      }
    }
  } catch (err) {
    console.log('Slack resolution skipped:', err.message);
  }

  // 3. TEAMS - Rechercher équipe mappée
  try {
    const teamsMappings = await base44.entities.TeamsProjectMapping.filter({
      jira_project_selection_id: workspaceId,
      is_active: true
    });

    for (const mapping of teamsMappings) {
      // Chercher transcripts Teams de ±24h
      const teamsTranscripts = await base44.asServiceRole.entities.TeamsInsight.filter({
        team_id: mapping.teams_team_id
      });

      const relevantTranscripts = teamsTranscripts.filter(t => {
        const tDate = new Date(t.created_date);
        const dayDiff = Math.abs((analysisDate - tDate) / (1000 * 60 * 60 * 24));
        return dayDiff <= 1;
      });

      if (relevantTranscripts.length > 0) {
        sources.push({
          source: 'teams_transcript',
          confidence: Math.min(0.90, 0.65 + (relevantTranscripts.length * 0.1)),
          metadata: {
            team_id: mapping.teams_team_id,
            team_name: mapping.teams_team_name,
            transcript_count: relevantTranscripts.length,
            time_window_hours: 24,
            mapped_confidence: mapping.confidence_score
          }
        });
      }
    }
  } catch (err) {
    console.log('Teams resolution skipped:', err.message);
  }

  // 4. JIRA - Chercher backlog/sprints du même jour
  try {
    const jiraAnalyses = await base44.asServiceRole.entities.AnalysisHistory.filter({
      jira_project_selection_id: workspaceId,
      source: { '$in': ['jira_backlog', 'jira_agile'] }
    });

    const relevantJira = jiraAnalyses.filter(j => {
      const jDate = new Date(j.analysis_time);
      const hourDiff = Math.abs((analysisDate - jDate) / (1000 * 60 * 60));
      return hourDiff <= 12;
    });

    if (relevantJira.length > 0) {
      const jiraSource = relevantJira.find(j => j.source === 'jira_agile') || relevantJira[0];
      sources.push({
        source: jiraSource.source,
        confidence: 0.95,
        metadata: {
          blockers: jiraSource.blockers_count || 0,
          risks: jiraSource.risks_count || 0,
          time_window_hours: 12
        }
      });
    }
  } catch (err) {
    console.log('Jira resolution skipped:', err.message);
  }

  return sources;
}

async function mergeSourceData(base44, workspaceId, primarySource, primaryData, contributingSources, analysisTime) {
  const merged = {
    ...primaryData,
    source_fusion: {
      primary: primarySource,
      contributors: contributingSources.filter(s => s.source !== primarySource),
      fusion_timestamp: new Date().toISOString()
    }
  };

  // Agréger les problèmes/risques/blockers
  let aggregatedBlockers = primaryData?.blockers || [];
  let aggregatedRisks = primaryData?.risks || [];

  for (const contrib of contributingSources) {
    if (contrib.source === 'slack' && contrib.metadata?.message_count > 0) {
      aggregatedRisks.push({
        source: 'slack',
        description: `${contrib.metadata.message_count} relevant Slack messages from #${contrib.metadata.channel_name}`,
        severity: 'medium'
      });
    }

    if (contrib.source === 'teams_transcript' && contrib.metadata?.transcript_count > 0) {
      aggregatedRisks.push({
        source: 'teams',
        description: `${contrib.metadata.transcript_count} relevant Teams transcript(s)`,
        severity: 'medium'
      });
    }

    if ((contrib.source === 'jira_backlog' || contrib.source === 'jira_agile')) {
      if (contrib.metadata?.blockers > 0) {
        aggregatedBlockers.push(...Array(contrib.metadata.blockers).fill({
          source: 'jira',
          type: 'blocked_ticket'
        }));
      }
      if (contrib.metadata?.risks > 0) {
        aggregatedRisks.push(...Array(contrib.metadata.risks).fill({
          source: 'jira',
          type: 'risk'
        }));
      }
    }
  }

  merged.aggregated = {
    total_blockers: aggregatedBlockers.length,
    total_risks: aggregatedRisks.length,
    blocker_sources: [...new Set(aggregatedBlockers.map(b => b.source))],
    risk_sources: [...new Set(aggregatedRisks.map(r => r.source))]
  };

  return merged;
}

function calculateCrossSourceConfidence(contributingSources) {
  if (contributingSources.length === 1) return 1.0;

  // Moyenne pondérée : plus on a de sources concordantes, plus la confiance monte
  const confidenceSum = contributingSources.reduce((sum, s) => sum + s.confidence, 0);
  const baseConfidence = confidenceSum / contributingSources.length;

  // Bonus pour concordance multi-sources
  const sourceTypes = new Set(contributingSources.map(s => s.source.split('_')[0]));
  const diversityBonus = Math.min(0.15, (sourceTypes.size - 1) * 0.05);

  return Math.min(1.0, baseConfidence + diversityBonus);
}