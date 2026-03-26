import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and contributors can view sync history
    if (!['admin', 'contributor'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: admin or contributor role required' }, { status: 403 });
    }

    const { project_code, limit = 50, offset = 0 } = await req.json() || {};

    let query = {};
    if (project_code) {
      query = { project_code };
    }

    // Fetch sync history
    const syncs = await base44.asServiceRole.entities.JiraAgileProjectSync.filter(
      query,
      '-created_date',
      limit,
      offset
    );

    // Fetch total count
    const allSyncs = await base44.asServiceRole.entities.JiraAgileProjectSync.filter(query);

    // Get unique projects
    const uniqueProjects = [...new Set(allSyncs.map(s => s.project_code))];

    return Response.json({
      success: true,
      total_syncs: allSyncs.length,
      syncs: syncs.map(s => ({
        id: s.id,
        project_code: s.project_code,
        board_id: s.board_id,
        sprint_number: s.sprint_number,
        issues_analyzed: s.issues_analyzed,
        risks_detected: s.risks_detected,
        markers_created: s.markers_created,
        anonymization_status: s.anonymization_status,
        sync_type: s.sync_type,
        status: s.status,
        error_message: s.error_message,
        sync_duration_ms: s.sync_duration_ms,
        created_date: s.created_date,
        metadata: s.metadata
      })),
      projects_available: uniqueProjects,
      pagination: {
        limit,
        offset,
        total: allSyncs.length
      }
    });
  } catch (error) {
    console.error('Error in getJiraProjectSyncHistory:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});