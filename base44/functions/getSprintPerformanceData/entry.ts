import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Identifier le workspace principal actif (Jira ou Trello)
    const [activeJiraWorkspaces, activeTrelloWorkspaces] = await Promise.all([
      base44.entities.JiraProjectSelection.filter({ is_active: true }),
      base44.entities.TrelloProjectSelection.filter({ is_active: true }),
    ]);

    const hasActiveJira = activeJiraWorkspaces?.length > 0;
    const hasActiveTrello = activeTrelloWorkspaces?.length > 0;

    if (!hasActiveJira && !hasActiveTrello) {
      return Response.json({ data: [], message: 'No active workspace found' });
    }

    // Si Trello actif uniquement → pas de sprint Jira, retourner vide
    if (!hasActiveJira && hasActiveTrello) {
      return Response.json({ data: [], message: 'Active workspace is Trello — no Jira sprint data available' });
    }

    // Récupérer la connexion Jira active
    const jiraConnections = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (jiraConnections.length === 0) {
      return Response.json({ 
        data: [],
        message: 'No active Jira connection'
      });
    }

    const jiraConnection = jiraConnections[0];
    const accessToken = jiraConnection.access_token;
    const cloudId = jiraConnection.cloud_id;

    // Récupérer le sprint actif depuis SprintContext
    const sprintContexts = await base44.entities.SprintContext.filter({
      is_active: true
    });

    let sprintData = [];

    if (sprintContexts.length > 0) {
      const sprintContext = sprintContexts[0];
      const startDate = new Date(sprintContext.start_date);
      const endDate = new Date(sprintContext.end_date);

      // Fetch issues depuis Jira pour ce sprint
      const jiraUrl = `https://api.atlassian.com/sites/${cloudId}/issues?jql=sprint="${sprintContext.sprint_name}" ORDER BY created ASC`;
      
      const jiraRes = await fetch(jiraUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!jiraRes.ok) {
        return Response.json({ 
          data: [],
          message: 'Failed to fetch Jira data'
        });
      }

      const jiraData = await jiraRes.json();
      const issues = jiraData.issues || [];

      // Grouper les issues par jour
      const dayMap = new Map();
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayKey = d.toISOString().split('T')[0];
        dayMap.set(dayKey, { day: dayKey, blockers: 0, risks: 0, blockersData: [], risksData: [] });
      }

      // Compter blockers et risks par jour
      issues.forEach(issue => {
        const createdDate = new Date(issue.fields.created).toISOString().split('T')[0];
        const dayData = dayMap.get(createdDate);
        
        if (dayData) {
          const status = issue.fields.status?.name?.toLowerCase() || '';
          const priority = issue.fields.priority?.name?.toLowerCase() || '';
          
          // Classifier en blocker ou risk
          if (status.includes('blocked') || issue.fields.labels?.includes('blocked')) {
            dayData.blockers++;
            dayData.blockersData.push({
              member: issue.fields.assignee?.displayName || 'Unassigned',
              issue: issue.fields.summary
            });
          } else if (priority === 'high' || priority === 'critical') {
            dayData.risks++;
            dayData.risksData.push({
              description: `[${priority.toUpperCase()}] ${issue.fields.summary}`
            });
          }
        }
      });

      sprintData = Array.from(dayMap.values())
        .map((item, idx) => ({
          ...item,
          dayLabel: `Day ${idx + 1}`
        }));
    }

    return Response.json({ data: sprintData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});