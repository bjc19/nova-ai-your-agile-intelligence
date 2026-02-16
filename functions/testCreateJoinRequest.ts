import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Test direct creation
    const result = await base44.entities.JoinTeamRequest.create({
      requester_email: 'test@example.com',
      manager_email: 'manager@example.com',
      status: 'pending'
    });
    
    return Response.json({ 
      success: true, 
      result,
      message: 'Request created'
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});