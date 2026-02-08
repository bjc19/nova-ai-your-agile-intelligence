/**
 * Out of Context Detection Logic
 * Extracted from DemoSimulator for reuse across the app
 */

export function detectOutOfContext(text) {
  if (!text || text.trim().length < 20) {
    return {
      isOutOfContext: false,
      confidence: 0,
      reason: 'Texte trop court'
    };
  }

  const normalizeText = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lowerText = normalizeText(text);
  
  // ========== VETOS THÉMATIQUES ABSOLUS ==========
  
  const sportsProperNouns = [
    'real madrid', 'real', 'barcelone', 'barca', 'psg', 'bayern', 
    'cristiano', 'messi', 'ronaldo', 'neymar', 'mbappe', 'clasico',
    'liverpool', 'manchester', 'arsenal', 'chelsea', 'juventus', 'milan',
    'canadiens', 'bruins', 'maple leafs', 'rangers', 'penguins', 'blackhawks',
    'lakers', 'celtics', 'bulls', 'warriors', 'lebron', 'curry', 'jordan'
  ].map(normalizeText);
  
  const sportsLexicon = [
    'match', 'but', 'joueur', 'mi-temps', 'gardien', 'frappe', 'terrain',
    'arbitre', 'penalty', 'corner', 'coup franc', 'finition', 'defense',
    'attaque', 'transition', 'ligne defensive', 'egalisation', 
    'ballon', 'dribble', 'tacle', 'sortir le ballon', 'marquer', 'scorer',
    'remontada', 'prolongation', 'carton', 'hors-jeu',
    'rondelle', 'patinoire', 'arena', 'mise en echec', 'penalite', 
    'desavantage numerique', 'avantage numerique', 'filet desert', 
    'zone offensive', 'zone defensive', 'zone neutre', 'tir au but',
    'arret', 'lancer', 'passe', 'periode', 'mises en echec',
    'panier', 'dunk', 'trois points', 'rebond', 'passe decisive',
    'quart-temps', 'temps mort', 'faute personnelle',
    'entraineur', 'coach sportif', 'championnat', 'ligue', 'classement',
    'victoire', 'defaite', 'egalite', 'score', 'adversaire', 'supporter'
  ].map(normalizeText);
  
  const teamBuildingTerms = [
    'team building', 'evenement d\'entreprise', 'sponsoring', 'partenariat commercial'
  ].map(normalizeText);
  
  let sportsNounsCount = 0;
  let sportsLexiconCount = 0;
  let teamBuildingContext = false;
  
  sportsProperNouns.forEach(term => { if (lowerText.includes(term)) sportsNounsCount++; });
  sportsLexicon.forEach(term => { if (lowerText.includes(term)) sportsLexiconCount++; });
  teamBuildingTerms.forEach(term => { if (lowerText.includes(term)) teamBuildingContext = true; });
  
  if (sportsNounsCount >= 1 && sportsLexiconCount >= 2 && !teamBuildingContext) {
    return {
      isOutOfContext: true,
      confidence: 99,
      reason: 'VETO 1: Domaine du Sport',
      theme: 'Sport'
    };
  }
  
  // VETO 2: Divertissement & Loisirs
  const entertainmentThemes = [
    'film', 'série', 'cinéma', 'acteur', 'actrice', 'réalisateur',
    'netflix', 'disney', 'marvel', 'star wars', 'game of thrones',
    'concert', 'spectacle', 'streaming', 'jeu vidéo', 'gaming'
  ];
  const professionalEntertainmentContext = [
    'projet de développement', 'campagne marketing', 'client', 'produit',
    'développement de jeu', 'production', 'projet film'
  ];
  
  let entertainmentCount = 0;
  let proProdContext = false;
  
  entertainmentThemes.forEach(term => { if (lowerText.includes(term)) entertainmentCount++; });
  professionalEntertainmentContext.forEach(term => { if (lowerText.includes(term)) proProdContext = true; });
  
  if (entertainmentCount >= 2 && !proProdContext) {
    return {
      isOutOfContext: true,
      confidence: 98,
      reason: 'VETO 2: Divertissement & Loisirs',
      theme: 'Divertissement'
    };
  }
  
  // VETO 3: Vie Personnelle
  const personalThemes = [
    'vacances', 'week-end', 'famille', 'enfants', 'anniversaire',
    'restaurant', 'cuisine', 'recette', 'shopping', 'achats',
    'médecin', 'santé personnelle', 'voyage personnel', 'tourisme'
  ];
  const professionalPersonalContext = [
    'déplacement professionnel', 'politique rh', 'télétravail',
    'congé maladie', 'absence justifiée', 'réunion client'
  ];
  
  let personalCount = 0;
  let proPersonalContext = false;
  
  personalThemes.forEach(term => { if (lowerText.includes(term)) personalCount++; });
  professionalPersonalContext.forEach(term => { if (lowerText.includes(term)) proPersonalContext = true; });
  
  if (personalCount >= 2 && !proPersonalContext) {
    return {
      isOutOfContext: true,
      confidence: 97,
      reason: 'VETO 3: Vie Personnelle & Sociale',
      theme: 'Vie Personnelle'
    };
  }
  
  // ========== ANALYSE DU CHAMP SÉMANTIQUE PROFESSIONNEL ==========

  const L1_terms = [
    'projet', 'programme', 'portefeuille', 'mission', 'initiative',
    'livrable', 'jalon', 'delai', 'echeance', 'budget', 'ressource',
    'perimetre', 'scope', 'cahier des charges', 'specification',
    'objectif', 'kpi', 'indicateur', 'suivi', 'reporting', 'roadmap',
    'milestone', 'iteration', 'release', 'increment', 'deliverable',
    'gouvernance', 'pilotage', 'coordination', 'arbitrage', 'priorisation',
    'partie prenante', 'stakeholder', 'sponsor', 'comite de pilotage',
    'risque projet', 'dependance projet', 'contrainte projet',
    'change request', 'scope creep', 'hypothese projet', 'business case',
    'engagement', 'capacite', 'feedback utilisateur', 'amelioration', 'item'
  ].map(normalizeText);

  const L2_terms = [
    'equipe projet', 'equipe scrum', 'equipe agile', 'equipe dev',
    'product owner', 'scrum master', 'developpeur', 'testeur',
    'po', 'sm', 'dev', 'qa', 'tech lead', 'architect',
    'client projet', 'utilisateur final', 'user', 'product manager',
    'project manager', 'chef de projet', 'responsable produit',
    'manager projet', 'facilitateur', 'coach agile'
  ].map(normalizeText);

  const L3_terms = [
    'daily scrum', 'daily standup', 'stand-up', 'standup',
    'sprint planning', 'planning', 'sprint review', 'revue de sprint',
    'retrospective', 'retro', 'refinement', 'grooming',
    'demo', 'sprint', 'iteration', 'increment', 'ceremony',
    'backlog', 'product backlog', 'sprint backlog',
    'user story', 'story', 'epic', 'feature', 'task', 'subtask',
    'ticket jira', 'ticket', 'issue jira', 'pr', 'pull request',
    'merge', 'commit', 'code review', 'definition of done',
    'acceptance criteria', 'story point', 'velocite', 'burndown',
    'kanban', 'wip', 'limite wip', 'flux', 'lead time', 'cycle time',
    'item', 'items', 'prise en compte', 'transversal', 'coordinateur'
  ].map(normalizeText);

  const L3_verbs = [
    'planifier', 'estimer', 'prioriser', 'developper', 'coder',
    'tester', 'debugger', 'corriger', 'deployer', 'livrer',
    'valider', 'accepter', 'implementer', 'concevoir', 'designer',
    'reviewer', 'merger', 'commiter', 'refactoriser',
    'documenter', 'reporter', 'escalader', 'resoudre blocage',
    'analyser besoin', 'specifier', 'faciliter ceremonie',
    'animer atelier', 'coordonner equipe', 'piloter projet'
  ].map(normalizeText);

  const L4_terms = [
    'blocage', 'bloque', 'impediment', 'blocker',
    'risque projet', 'issue technique', 'bug', 'anomalie',
    'incident production', 'dette technique', 'technical debt',
    'dependance technique', 'dependance equipe',
    'retard livraison', 'retard sprint', 'scope change',
    'changement perimetre', 'besoin client', 'feedback client',
    'resolution', 'correctif', 'solution technique', 'workaround',
    'mitigation risque', 'plan d\'action', 'action corrective'
  ].map(normalizeText);
  
  let L1_count = 0, L2_count = 0, L3_count = 0, L3_verbs_count = 0, L4_count = 0;
  
  L1_terms.forEach(term => { if (lowerText.includes(term)) L1_count++; });
  L2_terms.forEach(term => { if (lowerText.includes(term)) L2_count++; });
  L3_terms.forEach(term => { if (lowerText.includes(term)) L3_count++; });
  L3_verbs.forEach(term => { if (lowerText.includes(term)) L3_verbs_count++; });
  L4_terms.forEach(term => { if (lowerText.includes(term)) L4_count++; });
  
  const L1L2_density = L1_count + L2_count;
  const L3L4_density = L3_count + L3_verbs_count + L4_count;
  const totalProScore = L1_count + L2_count + L3_count + L3_verbs_count + L4_count;
  
  const fieldsWithTerms = [
    L1_count > 0,
    L2_count > 0,
    L3_count > 0,
    L3_verbs_count > 0,
    L4_count > 0
  ].filter(Boolean).length;

  const hasProjectManagementCore = (L1_count >= 2 || L3_count >= 2);

  const hasProfessionalContext = (
    fieldsWithTerms >= 3 &&
    totalProScore >= 5 &&
    hasProjectManagementCore &&
    (L1L2_density >= 2 || L3L4_density >= 3)
  );

  if (!hasProfessionalContext) {
    return {
      isOutOfContext: true,
      confidence: totalProScore === 0 ? 98 : Math.max(85, 95 - totalProScore * 2),
      reason: 'COUCHE 2: Lexique Management de Projet/Agile insuffisant',
      theme: 'Conversation Générale / Hors Périmètre PM',
      professionalFieldScore: totalProScore
    };
  }
  
  return { 
    isOutOfContext: false,
    confidence: 100,
    professionalFieldScore: totalProScore
  };
}