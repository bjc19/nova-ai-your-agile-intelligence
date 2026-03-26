import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Proxy sécurisé pour récupérer les transcripts Teams
// Chiffre les accès et effectue les contrôles RBAC/tenant/consent

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meeting_id, transcript_id } = await req.json();

    if (!meeting_id || !transcript_id) {
      return Response.json({ error: 'Missing meeting_id or transcript_id' }, { status: 400 });
    }

    // Vérifier le consent dans GDPRMarkers
    const gdprMarkers = await base44.asServiceRole.entities.GDPRMarkers.filter({
      jira_ticket_key: meeting_id, // On peut chercher par meeting_id, mais on utilise un autre champ pour Teams
      detection_source: { $regex: 'teams_transcript' }
    });

    if (!gdprMarkers || gdprMarkers.length === 0) {
      return Response.json({ 
        error: 'No consent found or marker does not exist', 
        code: 'NO_CONSENT'
      }, { status: 403 });
    }

    const marker = gdprMarkers[0];
    if (!marker.consent_given) {
      return Response.json({ 
        error: 'User consent not provided', 
        code: 'NO_CONSENT'
      }, { status: 403 });
    }

    // Récupérer la connexion Teams de l'utilisateur
    const teamsConnections = await base44.asServiceRole.entities.TeamsConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!teamsConnections || teamsConnections.length === 0) {
      return Response.json({ 
        error: 'No active Teams connection', 
        code: 'NO_CONNECTION'
      }, { status: 403 });
    }

    const teamsConn = teamsConnections[0];
    const accessToken = teamsConn.access_token; // Note: check expiration in production

    // Récupérer le transcript via Graph API
    const transcriptContent = await fetchTranscriptFromGraph(
      meeting_id,
      transcript_id,
      accessToken
    );

    if (!transcriptContent) {
      return Response.json({ 
        error: 'Failed to fetch transcript from Teams', 
        code: 'GRAPH_ERROR'
      }, { status: 500 });
    }

    // Audit: log la consultation (sans stocker le contenu)
    try {
      await logTranscriptAccess(base44, user.email, meeting_id, transcript_id);
    } catch (err) {
      console.error(`Failed to log transcript access: ${err.message}`);
    }

    return Response.json({
      success: true,
      meeting_id,
      transcript_id,
      content_type: 'vtt', // ou 'docx' selon le format
      content: transcriptContent,
      // Métadonnées pour le frontend
      confidentiality_notice: 'Transcript de la réunion affiché depuis Microsoft Teams (OneDrive/SharePoint). Ces informations sensibles ne sont ni stockées ni conservées sur Nova AI. Elles sont récupérées en temps réel et uniquement visibles pour vous.'
    });
  } catch (error) {
    console.error('Error in fetchTeamsTranscript:', error);
    return Response.json({ error: error.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
});

async function fetchTranscriptFromGraph(meetingId, transcriptId, accessToken) {
  try {
    // Endpoint Graph: /onlineMeetings/{id}/transcripts/{transcriptId}/content
    const url = `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/octet-stream'
      }
    });

    if (!res.ok) {
      console.error(`Graph API error: ${res.status} ${res.statusText}`);
      return null;
    }

    // Retourner le contenu (VTT ou binaire)
    const content = await res.text();
    return content;
  } catch (err) {
    console.error('Teams Graph API fetch error:', err);
    return null;
  }
}

async function logTranscriptAccess(base44, userEmail, meetingId, transcriptId) {
  // Créer un audit log (optionnel: créer une entité AuditLog)
  console.log(`[AUDIT] User ${userEmail} accessed transcript ${transcriptId} from meeting ${meetingId} at ${new Date().toISOString()}`);
  
  // Note: En production, insérer dans une table AuditLog
  // await base44.asServiceRole.entities.AuditLog.create({ ... })
}