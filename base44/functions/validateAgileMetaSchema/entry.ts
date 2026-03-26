// Valide et parse le bloc [AGILE_META] selon la spec v1.1

export function validateAgileMetaV11(metaJson) {
  try {
    const meta = typeof metaJson === 'string' ? JSON.parse(metaJson) : metaJson;

    // Champs obligatoires
    if (!meta.version || !meta.agile_context?.item_ref) {
      return { valid: false, error: 'Missing required fields: version or agile_context.item_ref' };
    }

    // Validation version
    if (!['1.1', '1.0'].includes(meta.version)) {
      return { valid: false, error: `Invalid version: ${meta.version}` };
    }

    // Validation agile_context
    const ctx = meta.agile_context;
    if (!['scrum', 'kanban', 'hybrid'].includes(ctx.type)) {
      return { valid: false, error: `Invalid agile type: ${ctx.type}` };
    }

    // Validation dates ISO 8601
    if (ctx.iteration?.start_date && !isValidISODate(ctx.iteration.start_date)) {
      return { valid: false, error: `Invalid start_date format: ${ctx.iteration.start_date}` };
    }
    if (ctx.iteration?.end_date && !isValidISODate(ctx.iteration.end_date)) {
      return { valid: false, error: `Invalid end_date format: ${ctx.iteration.end_date}` };
    }

    // Validation metrics (si présent)
    if (meta.metrics) {
      const m = meta.metrics;
      if (m.completion_rate !== undefined && (typeof m.completion_rate !== 'number' || m.completion_rate < 0 || m.completion_rate > 1)) {
        return { valid: false, error: `Invalid completion_rate: ${m.completion_rate}` };
      }
      if (m.blocked_count !== undefined && typeof m.blocked_count !== 'number') {
        return { valid: false, error: `Invalid blocked_count type` };
      }
      if (m.risk_level && !['low', 'medium', 'high', 'critical'].includes(m.risk_level)) {
        return { valid: false, error: `Invalid risk_level: ${m.risk_level}` };
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
  return date instanceof Date && !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
}

export function buildAgileMetaV11(context) {
  // Helper pour construire le bloc [AGILE_META] normalisé
  const meta = {
    version: '1.1',
    agile_context: {
      type: context.type || 'scrum',
      iteration: {
        number: context.iteration_number,
        type: context.iteration_type || 'sprint',
        start_date: context.start_date,
        end_date: context.end_date,
        days_remaining: context.days_remaining
      },
      project: context.project_code || undefined,
      item_ref: context.item_ref,
      board_id: context.board_id
    },
    metrics: context.metrics ? {
      completion_rate: context.metrics.completion_rate,
      blocked_count: context.metrics.blocked_count,
      unstarted_count: context.metrics.unstarted_count,
      risk_level: context.metrics.risk_level,
      velocity_trend: context.metrics.velocity_trend
    } : undefined,
    tenant_context: context.tenant_context ? {
      projects_connected: context.tenant_context.projects_connected,
      total_projects: context.tenant_context.total_projects,
      license_tier: context.tenant_context.license_tier
    } : undefined,
    timestamps: {
      detected_at: new Date().toISOString(),
      agile_version: '1.1',
      jira_sync_version: context.jira_sync_version || '2.4.1'
    }
  };

  // Supprimer les champs undefined
  JSON.parse(JSON.stringify(meta));
  
  const validation = validateAgileMetaV11(meta);
  if (!validation.valid) {
    throw new Error(`Invalid AGILE_META: ${validation.error}`);
  }

  return meta;
}

export function parseAgileMetaFromRecos(recos) {
  // Extrait le bloc [AGILE_META]...JSON du champ recos
  const match = recos.match(/\[AGILE_META\](.+?)$/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}