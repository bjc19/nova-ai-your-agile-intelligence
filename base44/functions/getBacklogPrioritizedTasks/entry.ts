import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return Response.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Récupérer le workspace et la clé du projet
    const workspace = await base44.entities.JiraProjectSelection.get(workspaceId);
    if (!workspace) {
      return Response.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const projectKey = workspace.jira_project_key;

    // Récupérer la connexion Jira active
    const jiraConnections = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (jiraConnections.length === 0) {
      return Response.json({ error: 'Jira not connected' }, { status: 400 });
    }

    const jiraConnection = jiraConnections[0];
    const accessToken = jiraConnection.access_token;
    const cloudId = jiraConnection.cloud_id;

    // Récupérer les tâches du backlog non résolues, ordonnées par priorité
    const jqlQuery = `project = "${projectKey}" AND (status = Backlog OR type = Story) AND resolution = Unresolved ORDER BY priority DESC, updated DESC`;

    const backlogResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jqlQuery)}&maxResults=20&fields=key,summary,priority,labels,assignee,duedate,status`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!backlogResponse.ok) {
      throw new Error('Failed to fetch backlog from Jira');
    }

    const backlogData = await backlogResponse.json();
    const issues = backlogData.issues || [];

    // Formatter et enrichir les tâches
    const tasks = issues.map((issue) => {
      const priority = issue.fields.priority?.name || 'Medium';
      const priorityScore = {
        'Highest': 5,
        'High': 4,
        'Medium': 3,
        'Low': 2,
        'Lowest': 1
      }[priority] || 3;

      return {
        id: issue.key,
        key: issue.key,
        title: issue.fields.summary,
        priority: priority,
        priorityScore: priorityScore,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        dueDate: issue.fields.duedate,
        status: issue.fields.status?.name,
        isBacklogItem: issue.fields.status?.name === 'Backlog',
        recommendation: priorityScore >= 4 ? 'high' : priorityScore >= 3 ? 'medium' : 'low'
      };
    });

    // Trier: d'abord les priorités explicites du PO, puis les recommandations intelligentes
    const sortedTasks = tasks.sort((a, b) => {
      // Priorités explicites du PO (Highest, High)
      if (a.priorityScore >= 4 && b.priorityScore < 4) return -1;
      if (a.priorityScore < 4 && b.priorityScore >= 4) return 1;
      // Si même priorité, par score descendant
      return b.priorityScore - a.priorityScore;
    });

    return Response.json({
      tasks: sortedTasks.slice(0, 10),
      totalCount: sortedTasks.length,
      projectKey: projectKey,
      source: 'jira_backlog'
    });
  } catch (error) {
    console.error('getBacklogPrioritizedTasks error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});