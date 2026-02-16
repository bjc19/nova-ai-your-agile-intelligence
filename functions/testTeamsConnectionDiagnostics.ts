import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== DIAGNOSTIC COMPLET ===');
    console.log('Utilisateur:', user.email);
    console.log('Role:', user.role);
    console.log('App Role:', user.app_role);
    
    // 1. Tester la création
    console.log('\n[TEST 1] Tentative de création...');
    const testData = {
      user_email: user.email,
      access_token: 'test_token_' + Date.now(),
      refresh_token: 'test_refresh_' + Date.now(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      tenant_id: 'test_tenant_' + Date.now(),
      is_active: true,
      scopes: ['test']
    };
    
    const created = await base44.entities.TeamsConnection.create(testData);
    console.log('✅ Création réussie - ID:', created?.id);
    const createdId = created?.id;
    
    // 2. Lire immédiatement
    console.log('\n[TEST 2] Lecture par ID immédiate...');
    try {
      const read = await base44.entities.TeamsConnection.get(createdId);
      console.log('✅ Lecture réussie:', read?.user_email);
    } catch (e) {
      console.log('❌ Lecture échouée:', e.message);
    }
    
    // 3. Lister tous les enregistrements
    console.log('\n[TEST 3] Liste de tous les enregistrements...');
    try {
      const all = await base44.entities.TeamsConnection.list();
      console.log('✅ Total enregistrements:', all.length);
      all.forEach((item, i) => {
        console.log(`  [${i}] ID: ${item.id}, email: ${item.user_email}, created_by: ${item.created_by}`);
      });
    } catch (e) {
      console.log('❌ Liste échouée:', e.message);
    }
    
    // 4. Filtrer par user_email
    console.log('\n[TEST 4] Filtre par user_email...');
    try {
      const filtered = await base44.entities.TeamsConnection.filter({ user_email: user.email });
      console.log('✅ Filtrés:', filtered.length);
      filtered.forEach((item, i) => {
        console.log(`  [${i}] ID: ${item.id}, email: ${item.user_email}`);
      });
    } catch (e) {
      console.log('❌ Filtre échoué:', e.message);
    }
    
    // 5. Attendre et réessayer
    console.log('\n[TEST 5] Attendre 2 secondes et réessayer...');
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const read2 = await base44.entities.TeamsConnection.get(createdId);
      console.log('✅ Lecture après délai réussie:', read2?.user_email);
    } catch (e) {
      console.log('❌ Lecture après délai échouée:', e.message);
    }
    
    try {
      const all2 = await base44.entities.TeamsConnection.list();
      console.log('✅ Liste après délai:', all2.length, 'enregistrements');
    } catch (e) {
      console.log('❌ Liste après délai échouée:', e.message);
    }
    
    // 6. Vérifier la structure de l'entité
    console.log('\n[TEST 6] Vérification de schema...');
    try {
      const schema = await base44.entities.TeamsConnection.schema();
      console.log('Schema disponible - Champs requis:', schema.required || 'Aucun');
    } catch (e) {
      console.log('Pas de schema API disponible:', e.message);
    }

    return Response.json({
      success: true,
      message: 'Diagnostic complété - vérifiez les logs'
    });
    
  } catch (error) {
    console.error('Erreur diagnostic:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});