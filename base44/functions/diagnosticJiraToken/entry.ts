import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const logs = [];
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized', logs }, { status: 403 });
    }

    logs.push(`🔐 Checking Jira connection for: ${user.email}`);

    // Get active Jira connection
    const jiraConnections = await base44.entities.JiraConnection.filter({ 
      is_active: true 
    });

    if (jiraConnections.length === 0) {
      logs.push('❌ No active Jira connection found');
      return Response.json({ 
        valid: false,
        message: 'No active Jira connection',
        logs
      });
    }

    const jiraConn = jiraConnections[0];
    logs.push(`✅ Found connection: ${jiraConn.cloud_id}`);
    logs.push(`📅 Token created: ${jiraConn.created_date}`);
    logs.push(`🔑 Token present: ${!!jiraConn.access_token}`);

    // Test 1: Verify token by calling user API
    logs.push('\n🧪 Test 1: Verifying token with /myself endpoint...');
    const myselfRes = await fetch('https://api.atlassian.com/ex/jira/1.0/user/myself', {
      headers: { 'Authorization': `Bearer ${jiraConn.access_token}` }
    });

    logs.push(`   Response: ${myselfRes.status} ${myselfRes.statusText}`);
    
    if (myselfRes.ok) {
      const myselfData = await myselfRes.json();
      logs.push(`   ✅ Token is VALID. User: ${myselfData.email}`);
    } else {
      const errorText = await myselfRes.text();
      logs.push(`   ❌ Token validation FAILED: ${errorText}`);
    }

    // Test 2: Check scope with board API
    logs.push('\n🧪 Test 2: Testing board API (requires read:jira-work scope)...');
    const boardRes = await fetch(`https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/board`, {
      headers: { 'Authorization': `Bearer ${jiraConn.access_token}` }
    });

    logs.push(`   Response: ${boardRes.status} ${boardRes.statusText}`);
    
    if (boardRes.ok) {
      const boardData = await boardRes.json();
      logs.push(`   ✅ Board API accessible. Found ${boardData.values?.length || 0} boards`);
    } else {
      const errorText = await boardRes.text();
      logs.push(`   ❌ Board API FAILED: ${errorText}`);
      logs.push(`   ⚠️ This indicates missing 'read:jira-work' scope`);
    }

    // Test 3: Check user scope
    logs.push('\n🧪 Test 3: Testing user API (requires read:jira-user scope)...');
    const usersRes = await fetch(`https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/users`, {
      headers: { 'Authorization': `Bearer ${jiraConn.access_token}` }
    });

    logs.push(`   Response: ${usersRes.status} ${usersRes.statusText}`);
    
    if (usersRes.ok) {
      logs.push(`   ✅ User API accessible`);
    } else {
      const errorText = await usersRes.text();
      logs.push(`   ❌ User API FAILED: ${errorText}`);
      logs.push(`   ⚠️ This indicates missing 'read:jira-user' scope`);
    }

    return Response.json({ 
      valid: myselfRes.ok,
      hasBoardScope: boardRes.ok,
      hasUserScope: usersRes.ok,
      logs
    });

  } catch (error) {
    logs.push(`❌ Error: ${error.message}`);
    return Response.json({ error: error.message, logs }, { status: 500 });
  }
});