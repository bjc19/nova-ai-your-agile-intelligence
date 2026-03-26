// Valide et parse le bloc [TEAMS_META] selon la spec v1.1

export function validateTeamsMetaV11(metaJson) {
  try {
    const meta = typeof metaJson === 'string' ? JSON.parse(metaJson) : metaJson;

    // Champs obligatoires
    if (!meta.version || !meta.meeting_context?.meeting_id || !meta.meeting_context?.transcript_id) {
      return {
        valid: false,
        error: 'Missing required fields: version, meeting_context.meeting_id, or meeting_context.transcript_id'
      };
    }

    // Validation version
    if (!['1.1', '1.0'].includes(meta.version)) {
      return { valid: false, error: `Invalid version: ${meta.version}` };
    }

    // Validation meeting_context
    const ctx = meta.meeting_context;
    if (!['scheduled', 'ad-hoc', 'channel'].includes(ctx.meeting_type)) {
      return { valid: false, error: `Invalid meeting_type: ${ctx.meeting_type}` };
    }

    // Validation dates ISO 8601
    if (ctx.start_time && !isValidISODate(ctx.start_time)) {
      return { valid: false, error: `Invalid start_time format: ${ctx.start_time}` };
    }
    if (ctx.end_time && !isValidISODate(ctx.end_time)) {
      return { valid: false, error: `Invalid end_time format: ${ctx.end_time}` };
    }

    // Validation detection (si présent)
    if (meta.detection) {
      const d = meta.detection;
      if (d.risk_level && !['low', 'medium', 'high', 'critical'].includes(d.risk_level)) {
        return { valid: false, error: `Invalid risk_level: ${d.risk_level}` };
      }
      if (d.risk_count !== undefined && typeof d.risk_count !== 'number') {
        return { valid: false, error: `Invalid risk_count type` };
      }
      if (d.decision_count !== undefined && typeof d.decision_count !== 'number') {
        return { valid: false, error: `Invalid decision_count type` };
      }
      if (d.action_item_count !== undefined && typeof d.action_item_count !== 'number') {
        return { valid: false, error: `Invalid action_item_count type` };
      }
      if (d.speakers_count !== undefined && typeof d.speakers_count !== 'number') {
        return { valid: false, error: `Invalid speakers_count type` };
      }
    }

    // Validation taille
    const jsonStr = JSON.stringify(meta);
    if (jsonStr.length > 8000) {
      return { valid: false, error: `Metadata too large: ${jsonStr.length} > 8000 chars` };
    }

    return { valid: true, data: meta };
  } catch (err) {
    return { valid: false, error: `JSON parse error: ${err.message}` };
  }
}

export function isValidISODate(dateStr) {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

export function buildTeamsMetaV11(context) {
  // Helper pour construire le bloc [TEAMS_META] normalisé
  const startTime = new Date(context.start_time);
  const endTime = new Date(context.end_time);
  const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

  const meta = {
    version: '1.1',
    meeting_context: {
      meeting_id: context.meeting_id,
      transcript_id: context.transcript_id,
      meeting_type: context.meeting_type || 'scheduled',
      start_time: context.start_time,
      end_time: context.end_time,
      duration_minutes: durationMinutes,
      channel_id: context.channel_id || null,
      organizer_prenom: context.organizer_prenom || 'Organisateur'
    },
    detection: context.detection ? {
      risk_count: context.detection.risk_count || 0,
      decision_count: context.detection.decision_count || 0,
      action_item_count: context.detection.action_item_count || 0,
      risk_level: context.detection.risk_level || 'low',
      speakers_count: context.detection.speakers_count || 0,
      main_topics: context.detection.main_topics || []
    } : undefined,
    timestamps: {
      detected_at: new Date().toISOString(),
      teams_version: 'v1.1',
      graph_sync_version: '1.2.3'
    }
  };

  // Supprimer les champs undefined
  if (!meta.detection) delete meta.detection;

  const validation = validateTeamsMetaV11(meta);
  if (!validation.valid) {
    throw new Error(`Invalid TEAMS_META: ${validation.error}`);
  }

  return meta;
}

export function parseTeamsMetaFromRecos(recos) {
  // Extrait le bloc [TEAMS_META]...JSON du champ recos
  const match = recos.match(/\[TEAMS_META\](.+?)$/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function extractMeetingRefFromProbleme(probleme) {
  // Parse "[TEAMS-v1] REUNION ... - Meeting Ref: MS-ABC123 - ..."
  const match = probleme.match(/Meeting Ref: ([A-Z0-9-]+)/);
  return match ? match[1] : null;
}