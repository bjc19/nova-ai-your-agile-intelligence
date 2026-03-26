import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, title, description, blockedBy, urgency } = body;

    // Récupérer la connexion Jira
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

    // Déterminer le projet
    let projectKey = null;
    if (workspaceId) {
      const workspace = await base44.entities.JiraProjectSelection.get(workspaceId);
      if (workspace) {
        projectKey = workspace.jira_project_key;
      }
    }

    if (!projectKey) {
      return Response.json({ error: 'No project selected' }, { status: 400 });
    }

    // Créer un ticket Jira pour le blocage
    const createIssueResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary: `[BLOCKER] ${title}`,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: description || 'Pas de description fournie'
                    }
                  ]
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Signalé par: ${user.full_name}\nBloqué par: ${blockedBy}`
                    }
                  ]
                }
              ]
            },
            issuetype: { name: 'Task' },
            assignee: { name: user.email },
            priority: { name: urgency === 'high' ? 'Highest' : urgency === 'medium' ? 'High' : 'Medium' },
            labels: ['blocker', 'reported-from-dashboard']
          }
        })
      }
    );

    if (!createIssueResponse.ok) {
      const errorData = await createIssueResponse.json();
      console.error('Jira error:', errorData);
      return Response.json({ error: 'Failed to create Jira issue' }, { status: 500 });
    }

    const issue = await createIssueResponse.json();

    return Response.json({
      success: true,
      issueKey: issue.key,
      message: `Blocage signalé avec succès: ${issue.key}`
    });
  } catch (error) {
    console.error('reportBlocker error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});