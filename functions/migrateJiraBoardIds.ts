import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const logs = [];
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger migration
    if (!user || user.role !== 'admin') {
      logs.push('❌ User is not admin');
      return Response.json({ error: 'Unauthorized: Admin access required', logs }, { status: 403 });
    }

    logs.push(`🔐 Admin user: ${user.email}`);

    // Get active Jira connection
    const jiraConnections = await base44.entities.JiraConnection.filter({ 
      is_active: true 
    });

    logs.push(`🔍 Found ${jiraConnections.length} active Jira connections`);

    if (jiraConnections.length === 0) {
      logs.push('❌ No active Jira connection found');
      return Response.json({ 
        success: false, 
        message: 'No active Jira connection found',
        logs
      }, { status: 400 });
    }

    const jiraConn = jiraConnections[0];
    const accessToken = jiraConn.access_token;
    logs.push(`✅ Using connection: ${jiraConn.cloud_id}`);

    // Get ALL JiraProjectSelection records
    const allSelections = await base44.asServiceRole.entities.JiraProjectSelection.list();
    logs.push(`📊 Found ${allSelections.length} total JiraProjectSelection records`);

    // Filter those with missing board IDs
    const selectionsWithoutBoardId = allSelections.filter(s => !s.jira_board_id);
    logs.push(`⚠️ Found ${selectionsWithoutBoardId.length} records with missing jira_board_id`);

    if (selectionsWithoutBoardId.length === 0) {
      logs.push('✅ No records to migrate');
      return Response.json({ 
        success: true, 
        message: 'All records already have board IDs',
        migrated: 0,
        logs
      });
    }

    let migratedCount = 0;

    // Fetch board IDs for each project
    for (const selection of selectionsWithoutBoardId) {
      try {
        const projectKey = selection.jira_project_key;
        logs.push(`🔄 Fetching board ID for project: ${projectKey}`);

        const boardUrl = `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`;
        
        const boardRes = await fetch(boardUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!boardRes.ok) {
          const errorText = await boardRes.text();
          logs.push(`❌ Failed to fetch boards for ${projectKey}: ${boardRes.status} ${errorText}`);
          continue;
        }

        const boardData = await boardRes.json();
        
        if (!boardData.values || boardData.values.length === 0) {
          logs.push(`⚠️ No boards found for project ${projectKey}`);
          continue;
        }

        const boardId = boardData.values[0].id.toString();
        logs.push(`✅ Found board ID ${boardId} for project ${projectKey}`);

        // Update the record
        await base44.asServiceRole.entities.JiraProjectSelection.update(selection.id, {
          jira_board_id: boardId
        });
        
        logs.push(`💾 Updated record ${selection.id} with board ID ${boardId}`);
        migratedCount++;

      } catch (error) {
        logs.push(`❌ Error processing ${selection.jira_project_key}: ${error.message}`);
      }
    }

    logs.push(`🎉 Migration complete: ${migratedCount}/${selectionsWithoutBoardId.length} records updated`);

    return Response.json({ 
      success: true, 
      message: `Successfully migrated ${migratedCount} records`,
      migrated: migratedCount,
      total: selectionsWithoutBoardId.length,
      logs
    });

  } catch (error) {
    logs.push(`❌ Migration error: ${error.message}`);
    return Response.json({ error: error.message, logs }, { status: 500 });
  }
});