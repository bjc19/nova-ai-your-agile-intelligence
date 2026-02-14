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

    // Récupérer la connexion Jira de l'utilisateur
    const jiraConnections = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (jiraConnections.length === 0) {
      return Response.json({ tasks: [] });
    }

    const jiraConnection = jiraConnections[0];
    const accessToken = jiraConnection.access_token;
    const cloudId = jiraConnection.cloud_id;

    // Déterminer le projet à utiliser
    let projectKey = null;
    if (workspaceId) {
      const workspace = await base44.entities.JiraProjectSelection.get(workspaceId);
      if (workspace) {
        projectKey = workspace.jira_project_key;
      }
    }

    // Construire la requête Jira
    let jql = `assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC`;
    if (projectKey) {
      jql = `project = ${projectKey} AND assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC`;
    }

    // Appeler l'API Jira
    const jiraResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=20&fields=summary,status,priority,duedate,key`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!jiraResponse.ok) {
      console.error('Jira API error:', jiraResponse.status, await jiraResponse.text());
      return Response.json({ tasks: [] });
    }

    const jiraData = await jiraResponse.json();
    const today = new Date().toDateString();

    // Formater les tâches pour le composant
    const tasks = jiraData.issues.map((issue) => {
      const dueDate = issue.fields.duedate ? new Date(issue.fields.duedate).toDateString() : null;
      
      return {
        id: issue.id,
        title: issue.fields.summary,
        ticket: issue.key,
        status: issue.fields.status.name.toLowerCase().replace(/\s+/g, '_'),
        priority: (issue.fields.priority?.name || 'low').toLowerCase(),
        dueToday: dueDate === today
      };
    });

    return Response.json({ tasks });
  } catch (error) {
    console.error('getUserJiraTasks error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});