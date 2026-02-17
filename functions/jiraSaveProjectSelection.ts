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
      const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
      const planDetails = statusRes.data.planDetails;
      maxProjectsAllowed = planDetails?.max_jira_projects || 5;
      userPlan = statusRes.data.plan || 'starter';
      console.log('✅ Plan details:', { plan: userPlan, maxJiraProjects: maxProjectsAllowed });
    } catch (e) {
      console.log('❌ Could not fetch subscription status, using default quota');
      console.error('❌ Error details:', e);
    }

    // Quotas par plan (fallback si planDetails non disponible)
    const quotas = {
      'starter': 5,
      'growth': 15,
      'pro': 50,
      'enterprise': 999
    };
    maxProjectsAllowed = maxProjectsAllowed || quotas[userPlan] || 5;

    console.log('📋 Fetching ALL existing selections (active and inactive)...');
    // Get ALL Jira project selections using asServiceRole to bypass RLS
    const allExistingSelections = await base44.asServiceRole.entities.JiraProjectSelection.list();
    
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
    for (const projectId of selected_project_ids) {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        console.warn('⚠️ Project not found:', projectId);
        continue;
      }

      console.log('🔍 Checking existing for project:', projectId);
      const existing = await base44.entities.JiraProjectSelection.filter({
        jira_project_id: projectId
      });

      if (existing.length > 0) {
        console.log('♻️ Reactivating existing project:', projectId);
        await base44.entities.JiraProjectSelection.update(existing[0].id, {
          is_active: true
        });
      } else {
        console.log('➕ Creating new project selection:', projectId);
        const created = await base44.entities.JiraProjectSelection.create({
          jira_project_id: projectId,
          jira_project_key: project.key,
          jira_project_name: project.name,
          workspace_name: project.name,
          is_active: true,
          selected_date: new Date().toISOString()
        });
        console.log('✅ Created:', created.id);
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