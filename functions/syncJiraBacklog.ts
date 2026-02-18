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
    
    // Refresh token inline if needed
    logs.push('🔄 Checking token expiry...');
    const expiresAt = new Date(jiraConn.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    let accessToken = jiraConn.access_token;

    if (timeUntilExpiry < 5 * 60 * 1000) {
      logs.push('🔄 Token expiring soon, refreshing...');
      const clientId = Deno.env.get('JIRA_CLIENT_ID');
      const clientSecret = Deno.env.get('JIRA_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        logs.push('❌ Jira OAuth credentials not configured');
        return Response.json({ error: 'Jira OAuth not configured' }, { status: 500 });
      }

      if (!jiraConn.refresh_token || jiraConn.refresh_token === 'none') {
        logs.push('❌ No refresh token available');
        await base44.asServiceRole.entities.JiraConnection.update(jiraConn.id, {
          connection_status_error: true,
          connection_error_message: 'Refresh token not available. Please reconnect Jira.',
          connection_error_timestamp: new Date().toISOString(),
          is_active: false
        });
        return Response.json({ 
          error: 'No refresh token available. Please reconnect Jira.',
          requiresReconnection: true
        }, { status: 401 });
      }

      const refreshResponse = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: jiraConn.refresh_token,
        }),
      });

      logs.push(`📊 Refresh response status: ${refreshResponse.status}`);

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        logs.push(`❌ Token refresh failed: ${errorText.substring(0, 200)}`);
        await base44.asServiceRole.entities.JiraConnection.update(jiraConn.id, {
          connection_status_error: true,
          connection_error_message: 'Token refresh failed. Please reconnect Jira.',
          connection_error_timestamp: new Date().toISOString(),
          is_active: false
        });
        return Response.json({ 
          error: 'Token refresh failed. Please reconnect Jira.',
          requiresReconnection: true
        }, { status: 401 });
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
      const newRefreshToken = refreshData.refresh_token || jiraConn.refresh_token;

      logs.push('✅ Token refreshed successfully');

      await base44.asServiceRole.entities.JiraConnection.update(jiraConn.id, {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_at: newExpiresAt,
        connection_status_error: false,
        connection_error_message: null,
        connection_error_timestamp: null,
        is_active: true
      });
    } else {
      logs.push('✅ Token still valid');
    }
    
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