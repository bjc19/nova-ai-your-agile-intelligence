import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { buildTeamsMetaV11, validateTeamsMetaV11 } from './validateTeamsMetaSchema.js';
import crypto from 'npm:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      meeting_id,
      transcript_id,
      start_time,
      end_time,
      meeting_type,
      channel_id,
      organizer_prenom,
      transcript_text,
      participants
    } = await req.json();

    if (!meeting_id || !transcript_id || !transcript_text) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Récupérer la connexion Teams de l'utilisateur
    const teamsConnections = await base44.asServiceRole.entities.TeamsConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!teamsConnections || teamsConnections.length === 0) {
      return Response.json({ error: 'No active Teams connection found' }, { status: 403 });
    }

    // Analyser le transcript pour risques, décisions, action items
    const analysis = analyzeTranscriptText(transcript_text, participants);

    // Créer les marqueurs GDPRMarkers
    const markers = [];
    
    // Marqueur pour les risques
    if (analysis.risks.length > 0) {
      const riskMarker = buildTeamsMarker(
        {
          meeting_id,
          transcript_id,
          start_time,
          end_time,
          meeting_type,
          channel_id,
          organizer_prenom
        },
        analysis,
        user.email,
        'risk'
      );
      markers.push(riskMarker);
    }

    // Marqueur pour les décisions critiques
    if (analysis.decisions.length > 0 && analysis.decisions.some(d => d.critical)) {
      const decisionMarker = buildTeamsMarker(
        {
          meeting_id,
          transcript_id,
          start_time,
          end_time,
          meeting_type,
          channel_id,
          organizer_prenom
        },
        analysis,
        user.email,
        'decision'
      );
      markers.push(decisionMarker);
    }

    // Insérer les marqueurs
    const insertedMarkers = [];
    let failedMarkers = 0;
    for (const marker of markers) {
      try {
        const inserted = await base44.asServiceRole.entities.GDPRMarkers.create(marker);
        insertedMarkers.push(inserted);
      } catch (err) {
        console.error(`Failed to insert Teams marker: ${err.message}`);
        failedMarkers++;
      }
    }

    // Créer un log dans TeamsTranscriptSync
    try {
      await base44.asServiceRole.entities.TeamsTranscriptSync.create({
        user_email: user.email,
        meeting_id,
        transcript_id,
        meeting_type,
        channel_id: channel_id || null,
        start_time,
        end_time,
        participants_count: participants?.length || 0,
        transcript_analyzed: true,
        risks_detected: analysis.risks.length,
        decisions_detected: analysis.decisions.length,
        action_items_detected: analysis.action_items.length,
        markers_created: insertedMarkers.length,
        anonymization_status: 'anonymized',
        sync_type: 'manual',
        status: failedMarkers === 0 ? 'success' : 'partial_failure',
        error_message: failedMarkers > 0 ? `${failedMarkers} marker(s) failed` : null
      });
    } catch (err) {
      console.error(`Failed to log Teams sync: ${err.message}`);
    }

    return Response.json({
      success: true,
      meeting_id,
      transcript_analyzed: true,
      risks_detected: analysis.risks.length,
      decisions_detected: analysis.decisions.length,
      action_items_detected: analysis.action_items.length,
      markers_created: insertedMarkers.length,
      anonymization_status: 'anonymized',
      markers: insertedMarkers.map(m => ({
        id: m.id,
        type: m.type,
        criticite: m.criticite,
        detection_source: m.detection_source
      }))
    });
  } catch (error) {
    console.error('Error in analyzeTeamsTranscript:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeTranscriptText(text, participants = []) {
  const risks = [];
  const decisions = [];
  const action_items = [];

  // Patterns simples pour détection (production: LLM)
  const riskPatterns = [
    /bloqué|blocker|impasse|obstacle|dépendance externe/gi,
    /risque|problème|défaut|bug|incident/gi,
    /critique|urgent|doit être résolu/gi
  ];

  const decisionPatterns = [
    /décidé|décision|on va|allons|convenu|accord/gi,
    /approuvé|validé|confirmé/gi
  ];

  const actionPatterns = [
    /action item|à faire|todo|prochaine étape/gi,
    /qui va|responsable|propriétaire/gi
  ];

  for (const pattern of riskPatterns) {
    if (pattern.test(text)) {
      risks.push({
        type: 'blocker_or_obstacle',
        critical: riskPatterns[2].test(text)
      });
    }
  }

  for (const pattern of decisionPatterns) {
    if (pattern.test(text)) {
      decisions.push({
        type: 'decision',
        critical: /critique|urgent|immédiat/gi.test(text)
      });
    }
  }

  for (const pattern of actionPatterns) {
    if (pattern.test(text)) {
      action_items.push({
        type: 'action_item',
        assigned: true
      });
    }
  }

  // Anonymiser les prénoms
  const anonymizedParticipants = participants?.map(p => {
    const parts = p.split(' ');
    return parts[0] || 'Participant';
  }) || [];

  return {
    risks,
    decisions,
    action_items,
    participants: anonymizedParticipants,
    risk_level: risks.length > 3 ? 'high' : risks.length > 0 ? 'medium' : 'low'
  };
}

function buildTeamsMarker(meetingInfo, analysis, userEmail, markerType) {
  const now = new Date();
  const issueId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const hashedTenantId = crypto.createHash('sha256').update(userEmail).digest('hex');

  // Date au format YYYY-MM-DD
  const meetingDate = new Date(meetingInfo.start_time).toISOString().split('T')[0];
  const meetingHour = new Date(meetingInfo.start_time).getHours();

  // Déterminer le type et criticité
  let type, criticite, problemePrefix;
  if (markerType === 'risk') {
    type = 'teams:meeting_risk';
    criticite = analysis.risk_level === 'high' ? 'haute' : analysis.risk_level === 'medium' ? 'moyenne' : 'basse';
    problemePrefix = `Risque: ${analysis.risks.length} blockers identifiés`;
  } else {
    type = 'teams:meeting_decision';
    criticite = 'moyenne';
    problemePrefix = `${analysis.decisions.length} décisions identifiées`;
  }

  // Build probleme avec convention [TEAMS-v1]
  const probleme = `[TEAMS-v1] REUNION ${meetingDate} ${meetingHour}h - Meeting Ref: ${meetingInfo.meeting_id} - ${problemePrefix} dans le transcript`;

  // Build [TEAMS_META]
  const teamsMeta = buildTeamsMetaV11({
    meeting_id: meetingInfo.meeting_id,
    transcript_id: meetingInfo.transcript_id,
    meeting_type: meetingInfo.meeting_type,
    start_time: meetingInfo.start_time,
    end_time: meetingInfo.end_time,
    channel_id: meetingInfo.channel_id,
    organizer_prenom: meetingInfo.organizer_prenom,
    detection: {
      risk_count: analysis.risks.length,
      decision_count: analysis.decisions.length,
      action_item_count: analysis.action_items.length,
      risk_level: analysis.risk_level,
      speakers_count: analysis.participants.length
    }
  });

  // Build recos
  const recos = markerType === 'risk'
    ? `• Adresser les ${analysis.risks.length} risques identifiés\n• Planifier point de suivi\n\n[TEAMS_META]${JSON.stringify(teamsMeta)}`
    : `• Valider les ${analysis.decisions.length} décisions\n• Communiquer aux stakeholders\n\n[TEAMS_META]${JSON.stringify(teamsMeta)}`;

  return {
    issue_id: issueId,
    tenant_id: hashedTenantId,
    team_id: meetingInfo.meeting_id,
    session_id: sessionId,
    date: meetingDate,
    type,
    probleme,
    team_members_involved: JSON.stringify(analysis.participants),
    recos,
    statut: 'ouvert',
    criticite,
    confidence_score: 0.82,
    detection_source: 'teams_transcript:teams-v1',
    consent_given: true
  };
}