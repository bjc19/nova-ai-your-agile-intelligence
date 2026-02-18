import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const logs = [];
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger sync
    if (!user || user.role !== 'admin') {
      logs.push('❌ User is not admin');
      return Response.json({ error: 'Unauthorized: Admin access required', logs }, { status: 403 });
    }

    logs.push(`🔐 Admin user: ${user.email}`);

    // Get Jira connections (user-scoped, respects RLS)
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
    logs.push(`✅ Using connection: ${jiraConn.cloud_id}`);
    logs.push(`📋 Connection scopes: ${JSON.stringify(jiraConn.scopes)}`);
    
    // Refresh token if needed before attempting API calls
    logs.push('🔄 Calling refreshJiraAccessToken (via asServiceRole)...');
    let refreshResult;
    try {
      refreshResult = await base44.asServiceRole.functions.invoke('refreshJiraAccessToken', {
        connection_id: jiraConn.id
      });
      logs.push(`📊 Refresh result: success=${refreshResult.data.success}, status=${refreshResult.status}`);
    } catch (refreshError) {
      logs.push(`❌ refreshJiraAccessToken call failed: ${refreshError.message}`);
      logs.push(`❌ Error details: ${JSON.stringify(refreshError)}`);
      return Response.json({ 
        success: false, 
        message: `Token refresh failed: ${refreshError.message}`,
        logs
      }, { status: 500 });
    }

    if (!refreshResult.data.success) {
      logs.push('❌ Token refresh failed');
      return Response.json({ 
        success: false, 
        message: refreshResult.data.error || 'Token refresh failed',
        logs,
        requiresReconnection: refreshResult.data.requiresReconnection
      }, { status: 401 });
    }

    const refreshedAccessToken = refreshResult.data.access_token;
    logs.push(`✅ Token refreshed (expires: ${refreshResult.data.expires_at})`);
    
    // CRITICAL: Validate scopes before attempting API calls
    const requiredScopes = ['read:jira-work', 'read:jira-user', 'read:board-scope:jira-software', 'read:sprint:jira-software'];
    const storedScopes = jiraConn.scopes || [];
    const missingScopes = requiredScopes.filter(rs => !storedScopes.includes(rs));
    
    if (missingScopes.length > 0) {
      logs.push(`❌ SCOPE VALIDATION FAILED - Missing scopes: ${JSON.stringify(missingScopes)}`);
      logs.push(`⚠️ This will cause 401 errors when calling Jira API`);
      logs.push(`💡 SOLUTION: Disconnect Jira and reconnect, making sure to approve ALL requested permissions`);
      return Response.json({ 
        success: false, 
        message: `Jira connection has incomplete scopes. Missing: ${missingScopes.join(', ')}. Please reconnect Jira.`,
        logs,
        scopeError: true
      }, { status: 403 });
    }
    
    logs.push(`✅ All required scopes present`);

    const accessToken = refreshedAccessToken;
    if (!accessToken) {
     logs.push('❌ No Jira access token');
     return Response.json({ 
       success: false, 
       message: 'No Jira access token',
       logs
     }, { status: 400 });
    }

    // Diagnostic: fetch ALL project selections to check RLS filtering
    const allSelections = await base44.entities.JiraProjectSelection.list();
    logs.push(`📊 ALL JiraProjectSelection count: ${allSelections.length}`);
    if (allSelections.length > 0) {
      logs.push(`📊 First selection: ID=${allSelections[0].id}, is_active=${allSelections[0].is_active}`);
    }

    // Get project selections (admin-scoped for sync operations)
    // Add slight delay to ensure DB replication is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const jiraSelections = await base44.asServiceRole.entities.JiraProjectSelection.filter({ 
      is_active: true 
    });

    logs.push(`✅ Found ${jiraSelections.length} ACTIVE project selections`);

    if (jiraSelections.length === 0) {
      logs.push('❌ No active Jira project selections found');
      return Response.json({ 
        success: false, 
        message: 'No active Jira project selections found',
        logs
      }, { status: 400 });
    }

    let totalSynced = 0;

    // Sync each active project
    for (const selection of jiraSelections) {
      try {
        const projectKey = selection.jira_project_key || selection.jira_project_name;
        const boardId = selection.jira_board_id;

        logs.push(`📋 Syncing ${projectKey} - Board ID: ${boardId}`);

        // Fetch active sprint
        const sprintUrl = `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/board/${boardId}/sprint?state=active`;
        logs.push(`🔗 Sprint URL: ${sprintUrl}`);
        
        const sprintRes = await fetch(sprintUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` } 
        });

        logs.push(`📊 Sprint response: ${sprintRes.status} ${sprintRes.statusText}`);

        if (!sprintRes.ok) {
          const errorText = await sprintRes.text();
          logs.push(`❌ Could not fetch sprints for board ${boardId}: ${errorText}`);
          continue;
        }

        const sprintData = await sprintRes.json();
        const activeSprint = sprintData.values?.[0];

        logs.push(`🏃 Active sprints found: ${sprintData.values?.length || 0}`);

        if (!activeSprint) {
          logs.push(`⚠️ No active sprint for board ${boardId}`);
          continue;
        }

        logs.push(`✨ Sprint found: ${activeSprint.name} (ID: ${activeSprint.id})`);

        // Fetch issues in active sprint
        const issuesUrl = `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/search?jql=sprint=${activeSprint.id}&maxResults=100`;
        logs.push(`🔗 Issues URL: ${issuesUrl}`);

        const issuesRes = await fetch(issuesUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        logs.push(`📊 Issues response: ${issuesRes.status} ${issuesRes.statusText}`);

        if (!issuesRes.ok) {
          const errorText = await issuesRes.text();
          logs.push(`❌ Could not fetch issues for sprint ${activeSprint.id}: ${errorText}`);
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
        logs.push(`✅ Synced ${activeSprint.name} - ${issues.length} issues`);

        } catch (error) {
        logs.push(`❌ Error syncing project ${selection.jira_project_key}: ${error.message}`);
        }
        }

        return Response.json({ 
        success: true, 
        message: `Synced ${totalSynced} projects`,
        count: totalSynced,
        logs
        });

        } catch (error) {
        logs.push(`❌ Sync error: ${error.message}`);
        return Response.json({ error: error.message, logs }, { status: 500 });
        }
        });