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

    // Récupérer la connexion Jira
    const jiraConnections = await base44.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (jiraConnections.length === 0) {
      return Response.json({
        blockers: [],
        dependsOnMe: []
      });
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

    let projectFilter = projectKey ? `project = ${projectKey} AND` : '';

    // Récupérer les tickets bloqués (bloqués par d'autres)
    const blockedJql = `${projectFilter} assignee = currentUser() AND status = "Blocked"`;
    
    // Récupérer les tickets où l'utilisateur bloque d'autres
    const blockingJql = `${projectFilter} "Blocked By" = currentUser()`;

    const [blockedRes, blockingRes] = await Promise.all([
      fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(blockedJql)}&maxResults=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      ),
      fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(blockingJql)}&maxResults=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      )
    ]);

    const blockedData = blockedRes.ok ? await blockedRes.json() : { issues: [] };
    const blockingData = blockingRes.ok ? await blockingRes.json() : { issues: [] };

    // Transformer les données Jira
    const blockers = (blockedData.issues || []).map((issue, idx) => ({
      id: issue.id,
      title: issue.fields.summary,
      blockedBy: issue.fields.assignee?.displayName || "Equipe",
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || "Pas de description",
      urgency: issue.fields.priority?.name === "Highest" || issue.fields.priority?.name === "High" ? "high" : "medium",
      ticket: issue.key
    }));

    const dependsOnMe = (blockingData.issues || []).map((issue) => ({
      id: issue.id,
      person: issue.fields.assignee?.displayName || "Equipe",
      title: `Attend: ${issue.fields.summary}`,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || "Pas de description",
      ticket: issue.key
    }));

    return Response.json({
      blockers,
      dependsOnMe
    });
  } catch (error) {
    console.error('getBlockersAffectingUser error:', error.message);
    return Response.json({
      blockers: [],
      dependsOnMe: []
    });
  }
});