async function fetchJiraBacklog(projectKey, cloudId, accessToken) {
    const response = await fetch(`https://your-domain.atlassian.net/rest/api/3/search?jql=project=${projectKey} AND Sprint is EMPTY`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`Error fetching backlog: ${response.statusText}`);
    }
    const data = await response.json();
    return data; // Assuming the response structure is compatible with your needs
}

// Example call
// fetchJiraBacklog('PROJECT_KEY', 'cloudId', 'accessToken');
