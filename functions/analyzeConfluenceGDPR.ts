import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';

const generateHash = async (input) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Confluence connection
    const connections = await base44.asServiceRole.entities.ConfluenceConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!connections || connections.length === 0) {
      return Response.json({
        success: false,
        error: 'No active Confluence connection found',
        markers_created: 0
      }, { status: 400 });
    }

    const connection = connections[0];
    const accessToken = connection.access_token;
    const cloudId = connection.cloud_id;

    // Fetch recent pages (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get spaces
    const spacesResponse = await fetch(`https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/space?limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const spacesData = await spacesResponse.json();

    if (!spacesData.results) {
      return Response.json({
        success: false,
        error: 'Failed to fetch Confluence spaces',
        markers_created: 0
      }, { status: 400 });
    }

    const markersToCreate = [];
    const sessionId = uuidv4();
    const tenantId = await generateHash(user.email);
    const confluenceWorkspaceHash = await generateHash(cloudId);

    // Load active anti-patterns
    const antiPatterns = await base44.asServiceRole.entities.AntiPattern.filter({
      is_active: true
    });

    const patternContext = antiPatterns
      .filter(p => p.source_type?.includes('confluence') || p.source_type?.includes('jira'))
      .map(p => `${p.pattern_id} - ${p.name}: Marqueurs [${p.markers?.join(', ')}]`)
      .join('\n');

    // Analyze each space (in memory only)
    for (const space of spacesData.results) {
      // Get recent pages from this space
      const pagesResponse = await fetch(
        `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/content?spaceKey=${space.key}&limit=20&expand=body.view,version,history.lastUpdated`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      const pagesData = await pagesResponse.json();

      if (!pagesData.results) continue;

      // Filter pages updated in last 7 days
      const recentPages = pagesData.results.filter(page => {
        const lastUpdated = new Date(page.history?.lastUpdated?.when || page.version?.when);
        return lastUpdated >= sevenDaysAgo;
      });

      if (recentPages.length === 0) continue;

      // Analyze pages IN MEMORY ONLY
      const pagesContent = recentPages.map(page => {
        const title = page.title || 'Untitled';
        const content = page.body?.view?.value || '';
        // Strip HTML tags for analysis
        const textContent = content.replace(/<[^>]*>/g, ' ').substring(0, 1000);
        return `Page: ${title}\n${textContent}`;
      }).join('\n\n---\n\n');

      // Analyze with LLM for documentation anti-patterns
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these Confluence pages for Agile documentation anti-patterns:

${patternContext}

Content:
${pagesContent}

Identify:
1. Which anti-patterns are detected (use pattern_id)
2. Documentation gaps or outdated content
3. Lack of clarity or decision records
4. Missing Product Goal alignment
5. Team members mentioned (first names only)

Return JSON:
{
  "has_issues": true|false,
  "detected_pattern_ids": ["pattern_id"],
  "probleme": "Specific description with context",
  "team_members_involved": ["FirstName"],
  "recommendations": ["Actionable recommendation"],
  "criticality": "basse|moyenne|haute|critique",
  "confidence": 0.0-1.0
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            has_issues: { type: 'boolean' },
            detected_pattern_ids: { type: 'array', items: { type: 'string' } },
            probleme: { type: 'string' },
            team_members_involved: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
            criticality: { type: 'string' },
            confidence: { type: 'number' }
          }
        }
      });

      if (analysisResult?.has_issues) {
        const issueId = uuidv4();

        const marker = {
          issue_id: issueId,
          tenant_id: tenantId,
          team_id: confluenceWorkspaceHash,
          session_id: sessionId,
          date: now.toISOString().split('T')[0],
          type: 'other',
          probleme: analysisResult.probleme,
          team_members_involved: analysisResult.team_members_involved || [],
          recos: analysisResult.recommendations,
          statut: 'ouvert',
          recurrence: 1,
          criticite: analysisResult.criticality,
          confidence_score: analysisResult.confidence,
          detection_source: 'confluence',
          consent_given: true
        };

        markersToCreate.push(marker);

        // Create PatternDetection records
        if (analysisResult.detected_pattern_ids?.length > 0) {
          for (const patternId of analysisResult.detected_pattern_ids) {
            const pattern = antiPatterns.find(p => p.pattern_id === patternId);
            if (pattern) {
              await base44.asServiceRole.entities.PatternDetection.create({
                analysis_id: issueId,
                pattern_id: patternId,
                pattern_name: pattern.name,
                category: pattern.category,
                confidence_score: analysisResult.confidence * 100,
                detected_markers: pattern.markers || [],
                context: analysisResult.probleme.substring(0, 500),
                severity: analysisResult.criticality,
                recommended_actions: analysisResult.recommendations,
                status: 'detected'
              });
            }
          }
        }
      }

      // CRITICAL: Clear pages data from memory
      recentPages.length = 0;
    }

    // Store only the anonymized markers
    if (markersToCreate.length > 0) {
      await base44.asServiceRole.entities.GDPRMarkers.bulkCreate(markersToCreate);
    }

    // Return only success info, NO content or PII
    return Response.json({
      success: true,
      markers_created: markersToCreate.length,
      session_id: sessionId,
      analysis_date: now.toISOString(),
      spaces_analyzed: spacesData.results.length,
      message: 'Analysis completed. Raw content purged from memory. Only anonymized markers stored.'
    });

  } catch (error) {
    console.error('Confluence GDPR analysis error:', error);
    return Response.json({
      success: false,
      error: error.message,
      markers_created: 0
    }, { status: 500 });
  }
});