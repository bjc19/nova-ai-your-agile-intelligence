import { detectWorkshopType, CEREMONY_SPECIFIC_VERBS, DETECTION_PATTERNS } from '@/components/nova/workshopDetection';

export function debugDetection(text) {
  console.log('=== DETECTION DEBUG ===\n');
  
  // Transcript reference
  console.log('📝 TRANSCRIPT:', text.substring(0, 100) + '...\n');
  
  // Count verbs for each ceremony
  const verbCounts = {
    RETROSPECTIVE: 0,
    SPRINT_PLANNING: 0,
    DAILY_SCRUM: 0,
    SPRINT_REVIEW: 0
  };
  
  const verbMatches = {
    RETROSPECTIVE: [],
    SPRINT_PLANNING: [],
    DAILY_SCRUM: [],
    SPRINT_REVIEW: []
  };
  
  Object.entries(CEREMONY_SPECIFIC_VERBS).forEach(([ceremonyType, config]) => {
    if (config.patterns) {
      config.patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        if (matches.length > 0) {
          verbCounts[ceremonyType] += matches.length;
          verbMatches[ceremonyType].push(...matches);
        }
      });
    }
  });
  
  console.log('🔍 VERB COUNTS:');
  Object.entries(verbCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} verbes`);
    if (verbMatches[type].length > 0) {
      console.log(`    → ${verbMatches[type].slice(0, 3).join(', ')}...`);
    }
  });
  
  // Check key markers
  console.log('\n📊 KEY MARKERS:');
  
  // Retrospective markers
  const retroMarkers = {
    'Amélioration': /amélioration|améliorer/gi.test(text),
    'Ce qu\'on a bien': /qu'est-ce qui|bien fonctionné|went well/gi.test(text),
    'Actions concrètes': /action|résolution|responsable/gi.test(text),
    'Fin de cycle': /ce sprint|dernier sprint|cycle/gi.test(text)
  };
  
  // Planning markers
  const planningMarkers = {
    'Estimation': /estim|points?|story point/gi.test(text),
    'Sprint goal': /sprint goal|objectif.*sprint/gi.test(text),
    'Engagement/Commit': /engagement|commit|assigner|assigned/gi.test(text),
    'Future horizon': /prochain|next|sera|will be/gi.test(text)
  };
  
  console.log('  RETROSPECTIVE:');
  Object.entries(retroMarkers).forEach(([marker, found]) => {
    console.log(`    ${found ? '✅' : '❌'} ${marker}`);
  });
  
  console.log('  PLANNING:');
  Object.entries(planningMarkers).forEach(([marker, found]) => {
    console.log(`    ${found ? '✅' : '❌'} ${marker}`);
  });
  
  // Temporal focus
  console.log('\n⏰ TEMPORAL FOCUS:');
  const pastRefs = (text.match(/s'est|a été|a fonctionné|on a|nous avons|lors du|au cours/gi) || []).length;
  const futureRefs = (text.match(/sera|will be|va|going to|planning|prochain|next/gi) || []).length;
  console.log(`  PAST references: ${pastRefs}`);
  console.log(`  FUTURE references: ${futureRefs}`);
  console.log(`  → Dominant: ${pastRefs > futureRefs ? 'PAST (Retro signal)' : futureRefs > pastRefs ? 'FUTURE (Planning signal)' : 'BALANCED'}`);
  
  // Run actual detection
  console.log('\n🎯 DETECTION RESULT:');
  const result = detectWorkshopType(text);
  console.log(`  Type: ${result.type}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log(`  Justifications: ${result.justifications.join(', ')}`);
  console.log(`  Tags: ${result.tags.join(', ')}`);
  
  // All scores
  if (result.allScores) {
    console.log('\n📈 ALL SCORES:');
    result.allScores.forEach(s => {
      console.log(`  ${s.type}: ${s.score}`);
    });
  }
  
  return result;
}

// Pour tester: appelle debugDetection(transcript) dans la console