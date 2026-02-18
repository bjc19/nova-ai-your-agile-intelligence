import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    console.log('🔍 User authenticated:', user?.email, 'Role:', user?.role, 'App Role:', user?.app_role);

    if (!user) {
      console.error('❌ User not authenticated');
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { selected_project_ids, projects } = await req.json();
    console.log('📥 Received data:', { selected_project_ids, projectCount: projects?.length });

    if (!Array.isArray(selected_project_ids) || !Array.isArray(projects)) {
      return Response.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Fetch user's subscription status to check quota
    let maxProjectsAllowed = 5;
    let userPlan = 'starter';
    
    try {
      // Get subscription from database directly
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        user_email: user.email
      });
      
      if (subscriptions.length > 0) {
        userPlan = subscriptions[0].plan;
        console.log('✅ Found subscription plan:', userPlan);
        
        // Get plan details
        const planDetails = await base44.asServiceRole.entities.Plan.filter({
          plan_id: userPlan
        });
        
        if (planDetails.length > 0) {
          maxProjectsAllowed = planDetails[0].max_jira_projects || 5;
          console.log('✅ Plan quota:', maxProjectsAllowed);
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch subscription, using default quota');
      console.error('Error:', e.message);
    }

    // Quotas par plan (fallback)
    const quotas = {
      'starter': 5,
      'growth': 15,
      'pro': 50,
      'enterprise': 999
    };
    maxProjectsAllowed = maxProjectsAllowed || quotas[userPlan] || 5;
    console.log('📊 Final quota:', maxProjectsAllowed, 'for plan:', userPlan);

    console.log('📋 Fetching ALL existing selections (active and inactive)...');
    // Get ALL Jira project selections for the current user
    const allExistingSelections = await base44.entities.JiraProjectSelection.list();
    
    console.log('✅ Found', allExistingSelections.length, 'total existing selections');

    // Check quota: count of new projects should not exceed maxProjectsAllowed
    if (selected_project_ids.length > maxProjectsAllowed) {
      const errorMsg = `Vous avez atteint la limite de ${maxProjectsAllowed} projets Jira pour votre plan ${userPlan}. Veuillez mettre à niveau.`;
      console.error('❌ Quota exceeded:', selected_project_ids.length, '>', maxProjectsAllowed);
      return Response.json({ 
        error: errorMsg,
        success: false 
      }, { status: 400 });
    }

    console.log('✅ Quota check passed. Proceeding with deactivation and creation...');
    // Deactivate ALL Jira project selections that are NOT in the current selection
    const selectedProjectIdSet = new Set(selected_project_ids);

    for (const selection of allExistingSelections) {
      if (!selectedProjectIdSet.has(selection.jira_project_id)) {
        console.log('🔄 Deactivating project:', selection.jira_project_id, '(id:', selection.id, ')');
        await base44.entities.JiraProjectSelection.update(selection.id, {
          is_active: false
        });
      }
    }

    // Create or reactivate selected projects
    console.log('💾 Processing', selected_project_ids.length, 'selected projects...');
    
    // Get Jira connection to fetch board info
    const jiraConnections = await base44.entities.JiraConnection.filter({
      is_active: true
    });
    
    if (jiraConnections.length === 0) {
      console.warn('⚠️ No active Jira connection found');
      return Response.json({ 
        error: 'Connexion Jira non trouvée ou inactivée',
        success: false 
      }, { status: 400 });
    }
    
    const jiraConn = jiraConnections[0];
    
    // Refresh token inline if needed
    const expiresAt = new Date(jiraConn.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    let accessToken = jiraConn.access_token;

    if (timeUntilExpiry < 5 * 60 * 1000) {
      console.log('🔄 Token expiring soon, refreshing...');
      const clientId = Deno.env.get('JIRA_CLIENT_ID');
      const clientSecret = Deno.env.get('JIRA_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        return Response.json({ error: 'Jira OAuth not configured' }, { status: 500 });
      }

      if (!jiraConn.refresh_token || jiraConn.refresh_token === 'none') {
        return Response.json({ 
          error: 'No refresh token available. Please reconnect Jira.',
          success: false,
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

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error('❌ Token refresh failed:', errorText);
        return Response.json({ 
          error: 'Token refresh failed. Please reconnect Jira.',
          success: false,
          requiresReconnection: true
        }, { status: 401 });
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
      const newRefreshToken = refreshData.refresh_token || jiraConn.refresh_token;

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
       console.log('✅ Token still valid');
     }

     console.log(`🔄 Starting board fetch for ${selected_project_ids.length} projects...`);

     for (const projectId of selected_project_ids) {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        console.warn('⚠️ Project not found:', projectId);
        continue;
      }

      console.log('🔍 Processing project:', projectId, 'with key:', project.key);
      console.log('📋 Jira connection cloud_id:', jiraConn.cloud_id);
      const existing = await base44.entities.JiraProjectSelection.filter({
        jira_project_id: projectId
      });

      // Fetch board ID for this project
      let boardId = null;
      try {
        const boardUrl = `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/board?projectKeyOrId=${project.key}`;
        console.log('📡 Fetching boards from:', boardUrl);
        console.log(`🔐 Using access token (expires: ${jiraConn.expires_at})`);

        const boardRes = await fetch(boardUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        console.log(`📊 Board response status: ${boardRes.status}`);

        if (boardRes.ok) {
          const boardData = await boardRes.json();
          console.log(`📋 Board response data:`, JSON.stringify(boardData).substring(0, 500));
          if (boardData.values && boardData.values.length > 0) {
            boardId = boardData.values[0].id.toString();
            console.log('✅ Found board ID:', boardId, 'for project:', project.key);
          } else {
            console.warn('⚠️ No boards found in response for project', project.key);
          }
        } else {
          const boardErrorText = await boardRes.text();
          console.warn('⚠️ Could not fetch boards for project', project.key, '- Status:', boardRes.status, '- Error:', boardErrorText.substring(0, 300));
        }
      } catch (boardError) {
        console.warn('⚠️ Error fetching board info:', boardError.message);
      }

      if (existing.length > 0) {
        console.log('♻️ Reactivating existing project:', projectId);
        await base44.entities.JiraProjectSelection.update(existing[0].id, {
          is_active: true,
          jira_board_id: boardId
        });
      } else {
        console.log('➕ Creating new project selection:', projectId);
        const created = await base44.entities.JiraProjectSelection.create({
          jira_project_id: projectId,
          jira_project_key: project.key,
          jira_project_name: project.name,
          workspace_name: project.name,
          jira_board_id: boardId,
          is_active: true,
          selected_date: new Date().toISOString()
        });
        console.log('✅ Created:', created.id, 'with board ID:', boardId);
      }
    }

    console.log('✅ All projects saved successfully');
    
    // Synchronize team configuration if multiple projects selected
    if (selected_project_ids.length > 1) {
      try {
        console.log('🔄 Synchronizing team configuration for multi-project mode...');
        await base44.functions.invoke('updateTeamConfigFromProjectSelection', {});
      } catch (syncError) {
        console.warn('⚠️ Team config sync failed (non-critical):', syncError.message);
      }
    }
    
    return Response.json({
      success: true,
      message: `${selected_project_ids.length} projet(s) Jira sauvegardé(s)`
    });

  } catch (error) {
    console.error('❌ Error saving Jira project selection:', error);
    console.error('❌ Error stack:', error.stack);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});