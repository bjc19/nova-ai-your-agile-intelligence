Deno.serve(async (req) => {
  return Response.json({ 
    success: true, 
    message: 'Test OK',
    time: new Date().toISOString()
  });
});