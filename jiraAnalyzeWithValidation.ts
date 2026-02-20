async function fetchJiraBacklog(projectKey) {
    const response = await fetch(`https://your-jira-instance/rest/api/3/search?jql=project=${projectKey} AND Sprint is EMPTY`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('your-email:your-api-token')}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return data.issues;
}

async function fetchActiveSprintIssues(projectKey) {
    const response = await fetch(`https://your-jira-instance/rest/api/3/search?jql=project=${projectKey} AND Sprint in openSprints()`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('your-email:your-api-token')}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return data.issues;
}