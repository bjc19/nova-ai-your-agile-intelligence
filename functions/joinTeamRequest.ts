Deno.serve(async (req) => {
  return Response.json({ 
    success: true, 
    message: 'joinTeamRequest function is running',
    timestamp: new Date().toISOString()
  });
});