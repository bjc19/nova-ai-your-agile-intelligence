import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger sync
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get Jira connections - try both user and service role
    let jiraConnections = await base44.entities.JiraConnection.filter({ 
      is_active: true 
    });

    console.log(`🔍 User-scoped: Found ${jiraConnections.length} active Jira connections`);

    if (jiraConnections.length === 0) {
      jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({ 
        is_active: true 
      });
      console.log(`🔍 Service-scoped: Found ${jiraConnections.length} active Jira connections`);
    }

    if (jiraConnections.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No active Jira connection found' 
      }, { status: 400 });
    }

    const jiraConn = jiraConnections[0];
    console.log(`✅ Using Jira connection - Cloud ID: ${jiraConn.cloud_id}, User: ${jiraConn.user_email}`);
    
    const accessToken = jiraConn.access_token;
    if (!accessToken) {
      return Response.json({ 
        success: false, 
        message: 'No Jira access token available' 
      }, { status: 400 });
    }

    // Get Jira project selections - try both user and service role
    let jiraSelections = await base44.entities.JiraProjectSelection.list();
    console.log(`🔍 User-scoped: Found ${jiraSelections.length} total JiraProjectSelection`);

    if (jiraSelections.length === 0) {
      jiraSelections = await base44.asServiceRole.entities.JiraProjectSelection.list();
      console.log(`🔍 Service-scoped: Found ${jiraSelections.length} total JiraProjectSelection`);
    }

    jiraSelections.forEach((sel, i) => {
      console.log(`  [${i}] ${sel.jira_project_name} - Board: ${sel.jira_board_id}, is_active: ${sel.is_active}, ID: ${sel.id}`);
    });

    jiraSelections = jiraSelections.filter(s => s.is_active === true);
    console.log(`✅ Found ${jiraSelections.length} ACTIVE selections`);

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
        const boardId = selection.jira_board_id;
        
        console.log(`📋 Syncing ${projectKey} - Board ID: ${boardId}`);
        
        // Fetch active sprint
        const sprintUrl = `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/board/${boardId}/sprint?state=active`;
        console.log(`🔗 Sprint URL: ${sprintUrl}`);
        
        const sprintRes = await fetch(sprintUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` } 
        });

        console.log(`📊 Sprint response: ${sprintRes.status} ${sprintRes.statusText}`);

        if (!sprintRes.ok) {
          const errorText = await sprintRes.text();
          console.error(`❌ Could not fetch sprints for board ${boardId}: ${errorText}`);
          continue;
        }

        const sprintData = await sprintRes.json();
        const activeSprint = sprintData.values?.[0];

        console.log(`🏃 Active sprints found: ${sprintData.values?.length || 0}`);

        if (!activeSprint) {
          console.log(`⚠️ No active sprint for board ${boardId}`);
          continue;
        }

        console.log(`✨ Sprint found: ${activeSprint.name} (ID: ${activeSprint.id})`);

        // Fetch issues in active sprint
        const issuesUrl = `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/search?jql=sprint=${activeSprint.id}&maxResults=100`;
        console.log(`🔗 Issues URL: ${issuesUrl}`);
        
        const issuesRes = await fetch(issuesUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        console.log(`📊 Issues response: ${issuesRes.status} ${issuesRes.statusText}`);

        if (!issuesRes.ok) {
          const errorText = await issuesRes.text();
          console.error(`❌ Could not fetch issues for sprint ${activeSprint.id}: ${errorText}`);
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