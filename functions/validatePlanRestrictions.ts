import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { restriction_type, source_name, team_member_count, jira_project_count } = body;

    // Fetch user's subscription status and plan
    const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
    const { plan, maxManualAnalyses, manualAnalysesCount, maxTeamMembers, currentTeamMembers, maxJiraProjects, currentJiraProjects, maxAutoAnalyses, autoAnalysesCount, primarySources, contributiveSources, manualAnalysisAdminOnly } = statusRes.data;

    const response = {
      canProceed: true,
      reason: '',
      plan,
      currentUsage: {}
    };

    // 1. Manual Analysis Restriction
    if (restriction_type === 'manual_analysis') {
      if (manualAnalysisAdminOnly && user.role !== 'admin') {
        response.canProceed = false;
        response.reason = `Seuls les admins peuvent créer des analyses manuelles avec le plan ${plan}`;
      } else if (manualAnalysesCount >= maxManualAnalyses) {
        response.canProceed = false;
        response.reason = `Limite d'analyses manuelles atteinte (${manualAnalysesCount}/${maxManualAnalyses})`;
      }
      response.currentUsage = {
        used: manualAnalysesCount,
        max: maxManualAnalyses,
        type: 'manual_analyses'
      };
    }

    // 2. Auto Analysis Restriction
    if (restriction_type === 'auto_analysis') {
      if (autoAnalysesCount >= maxAutoAnalyses) {
        response.canProceed = false;
        response.reason = `Limite d'analyses automatiques atteinte (${autoAnalysesCount}/${maxAutoAnalyses}) ce mois-ci`;
      }
      response.currentUsage = {
        used: autoAnalysesCount,
        max: maxAutoAnalyses,
        type: 'auto_analyses'
      };
    }

    // 3. Source Restriction
    if (restriction_type === 'source') {
      const isPrimarySource = primarySources?.includes(source_name);
      const isContributiveSource = contributiveSources?.includes(source_name);

      if (!isPrimarySource && !isContributiveSource) {
        response.canProceed = false;
        response.reason = `La source "${source_name}" n'est pas disponible avec le plan ${plan}`;
      }
      response.currentUsage = {
        source: source_name,
        isPrimary: isPrimarySource,
        isContributive: isContributiveSource,
        availableSources: { primarySources, contributiveSources }
      };
    }

    // 4. Team Members Restriction
    if (restriction_type === 'team_members') {
      const totalMembers = (team_member_count || currentTeamMembers) + 1; // +1 for the user
      if (totalMembers > maxTeamMembers) {
        response.canProceed = false;
        response.reason = `Limite de membres d'équipe atteinte (${totalMembers}/${maxTeamMembers})`;
      }
      response.currentUsage = {
        used: totalMembers,
        max: maxTeamMembers,
        type: 'team_members'
      };
    }

    // 5. Jira/Trello Projects Restriction
    if (restriction_type === 'jira_projects' || restriction_type === 'trello_projects') {
      const totalProjects = (jira_project_count || currentJiraProjects) + 1;
      if (totalProjects > maxJiraProjects) {
        response.canProceed = false;
        response.reason = `Limite de projets atteinte (${totalProjects}/${maxJiraProjects})`;
      }
      response.currentUsage = {
        used: totalProjects,
        max: maxJiraProjects,
        type: 'jira_projects'
      };
    }

    return Response.json(response);
  } catch (error) {
    console.error('Plan restriction validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});