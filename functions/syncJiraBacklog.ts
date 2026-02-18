import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger sync
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get active Jira connections
    const jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({ 
      is_active: true 
    });

    if (jiraConnections.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No active Jira connection found' 
      }, { status: 400 });
    }

    const jiraConn = jiraConnections[0];
    
    // Use the stored Jira access token from the connection
    const accessToken = jiraConn.access_token;
    
    if (!accessToken) {
      return Response.json({ 
        success: false, 
        message: 'No Jira access token available' 
      }, { status: 400 });
    }

    // Get active Jira project selections
    const jiraSelections = await base44.asServiceRole.entities.JiraProjectSelection.filter({ 
      is_active: true 
    });

    if (jiraSelections.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No active Jira project selections found' 
      }, { status: 400 });
    }

    let totalSynced = 0;

    // Sync each active project
    for (const selection of jiraSelections) {
      try {
        const projectKey = selection.jira_project_key || selection.jira_project_name;
        
        // Fetch active sprint
        const boardId = selection.jira_board_id;
        const sprintRes = await fetch(
          `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/board/${boardId}/sprint?state=active`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!sprintRes.ok) {
          console.log(`⚠️ Could not fetch sprints for board ${boardId}`);
          continue;
        }

        const sprintData = await sprintRes.json();
        const activeSprint = sprintData.values?.[0];

        if (!activeSprint) {
          console.log(`⚠️ No active sprint for board ${boardId}`);
          continue;
        }

        // Fetch issues in active sprint
        const issuesRes = await fetch(
          `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/search?jql=sprint=${activeSprint.id}&maxResults=100`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!issuesRes.ok) {
          console.log(`⚠️ Could not fetch issues for sprint ${activeSprint.id}`);
          continue;
        }

        const issuesData = await issuesRes.json();
        const issues = issuesData.issues || [];

        // Create or update analysis with Jira data
        const analysisData = {
          title: `Jira Sync - ${activeSprint.name}`,
          source: 'jira_agile',
          jira_project_selection_id: selection.id,
          workspace_name: selection.jira_project_name,
          blockers_count: issues.filter(i => i.fields?.customfield_10036 === 'Blocker').length,
          risks_count: issues.filter(i => ['High', 'Highest'].includes(i.fields?.priority?.name)).length,
          analysis_data: {
            sprint: {
              id: activeSprint.id,
              name: activeSprint.name,
              startDate: activeSprint.startDate,
              endDate: activeSprint.endDate
            },
            issues: issues.map(i => ({
              key: i.key,
              summary: i.fields?.summary,
              status: i.fields?.status?.name,
              assignee: i.fields?.assignee?.displayName,
              priority: i.fields?.priority?.name,
              type: i.fields?.issuetype?.name
            }))
          },
          transcript_preview: `Sprint: ${activeSprint.name} - ${issues.length} issues`,
          contributing_sources: [{
            source: 'jira_agile',
            confidence: 1.0,
            metadata: { sprint_id: activeSprint.id, board_id: boardId }
          }],
          cross_source_confidence: 1.0,
          analysis_time: new Date().toISOString()
        };

        // Create analysis record
        await base44.asServiceRole.entities.AnalysisHistory.create(analysisData);
        totalSynced++;
        console.log(`✅ Synced ${activeSprint.name} - ${issues.length} issues`);

      } catch (error) {
        console.error(`❌ Error syncing project ${selection.jira_project_key}:`, error.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Synced ${totalSynced} projects`,
      count: totalSynced
    });

  } catch (error) {
    console.error('❌ Sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});