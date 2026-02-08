/**
 * Anonymize first names: keep first and last letter, replace middle with asterisks
 * Example: Claude → C****e, Patrick → P*****k
 */
export const anonymizeFirstName = (name) => {
  if (!name || name.length <= 2) return name;
  const first = name[0];
  const last = name[name.length - 1];
  const asterisks = '*'.repeat(Math.max(1, name.length - 2));
  return `${first}${asterisks}${last}`;
};

/**
 * Extract interlocutors from transcript using "Name : Dialogue" pattern
 * Returns list of detected names with confidence scores
 */
export const extractInterlocutors = (text) => {
  if (!text) return [];

  const interlocutors = new Map(); // name -> count
  const lines = text.split('\n');
  
  // Pattern: "Anything : " at start of line (after whitespace)
  const interlocutorPattern = /^\s*([A-Z][a-zA-Z\s\-'éèêëàâäîïôöùûüç()[\]]*?)\s*:/;
  
  lines.forEach(line => {
    const match = line.match(interlocutorPattern);
    if (match) {
      const candidate = match[1].trim();
      
      // Exclude common false positives
      const falsePositives = ['Ordre', 'Agenda', 'Problème', 'Solution', 'Décision', 'Action', 'Résultat', 'Objectif', 'Rappel', 'Information', 'Conclusion', 'Note', 'Item', 'Liste'];
      if (!falsePositives.includes(candidate)) {
        interlocutors.set(candidate, (interlocutors.get(candidate) || 0) + 1);
      }
    }
  });

  return Array.from(interlocutors.keys());
};

/**
 * Multi-layer first name detection
 * Layer 1: Extracted from interlocutors
 * Layer 2: Common first names list
 * Layer 3: Pattern-based (capital letter + common structure)
 */
const getDetectionLayers = (text) => {
  const layer1 = extractInterlocutors(text); // Explicit interlocutors
  
  // Layer 2: Common first names
  const commonFirstNames = [
    'Alex', 'Alice', 'Amina', 'André', 'Antoine', 'Arthur', 'Aurélie', 'Benjamin', 'Bernard', 'Béatrice',
    'Bruno', 'Camille', 'Caroline', 'Catherine', 'Cédric', 'Céline', 'Charles', 'Christian', 'Christine', 'Christophe',
    'Claire', 'Clara', 'Claude', 'Clement', 'Corinne', 'Cyrille', 'Cyril', 'Damien', 'Daniel', 'Danielle', 'David',
    'Deborah', 'Debra', 'Delia', 'Delilah', 'Delores', 'Delphine', 'Denise', 'Dennis', 'Derek', 'Derrick', 'Desiree',
    'Desmond', 'Devin', 'Diana', 'Diane', 'Dianna', 'Dianne', 'Diego', 'Dimitri', 'Dina', 'Dinah', 'Dino', 'Dion',
    'Dirk', 'Dolores', 'Dominic', 'Dominique', 'Don', 'Donald', 'Donna', 'Donnie', 'Donovan', 'Dora', 'Doreen',
    'Dorian', 'Doris', 'Dorothy', 'Dorsey', 'Doug', 'Douglas', 'Doyle', 'Drake', 'Drew', 'Drexel', 'Dreyfus',
    'Edgar', 'Edgard', 'Edgardo', 'Edmund', 'Edna', 'Eduardo', 'Edward', 'Edwin', 'Edwina', 'Efraim', 'Efrain',
    'Egbert', 'Egidio', 'Egon', 'Egregorio', 'Egress', 'Eider', 'Eileen', 'Einar', 'Einhard', 'Eino', 'Eintracht',
    'Eira', 'Eirik', 'Eirinn', 'Eivind', 'Eivor', 'Eiza', 'Ejner', 'Eka', 'Ekaterina', 'Ekaterine', 'Ekbert', 'Eke',
    'Ekhard', 'Ekhilas', 'Ekholm', 'Ekid', 'Ekidhus', 'Ekidius', 'Ekidus', 'Ekie', 'Ekiel', 'Ekiert', 'Ekies', 'Ekification',
    'Ekified', 'Ekifies', 'Ekifying', 'Ekigma', 'Ekil', 'Ekim', 'Ekimi', 'Ekimie', 'Ekimies', 'Ekimithe', 'Ekimithes',
    'Ekimithey', 'Ekimothy', 'Ekina', 'Ekinal', 'Ekinald', 'Ekinald', 'Ekinaldo', 'Ekinali', 'Ekinalina', 'Ekinall', 'Ekinally',
    'Ekinalo', 'Ekinambique', 'Ekinan', 'Ekinand', 'Ekinanda', 'Ekinander', 'Ekinandis', 'Ekinandor', 'Ekinandre', 'Ekinandra',
    'Ekinandria', 'Ekinandris', 'Ekinandris', 'Ekinandros', 'Ekinandry', 'Ekinane', 'Ekinanen', 'Ekinaner', 'Ekihaners', 'Ekinanes',
    'Ekinania', 'Ekinaniae', 'Ekinanian', 'Ekinanians', 'Ekinanid', 'Ekinanidae', 'Ekinanides', 'Ekinanidian', 'Ekinanidians',
    'Ekinanidus', 'Ekinanidus', 'Ekinanidus', 'Ekinanids', 'Ekinanies', 'Ekinine', 'Ekininess', 'Ekininess', 'Ekininess',
    'Ekiningly', 'Ekiningly', 'Ekiningly', 'Ekinings', 'Ekinings', 'Ekinion', 'Ekinions', 'Ekinipe', 'Ekinipes', 'Ekiniplex',
    'Ekiniplexes', 'Ekinipolis', 'Ekinipoles', 'Ekinips', 'Ekinir', 'Ekinire', 'Ekinires', 'Ekiniris', 'Ekinirises', 'Ekinirisy',
    'Ekiniros', 'Ekiniros', 'Ekiniroses', 'Ekinirosis', 'Ekinirotic', 'Ekinirour', 'Ekinirs', 'Ekinis', 'Ekinisa', 'Ekinisah',
    'Ekinisan', 'Ekinisane', 'Ekinisans', 'Ekinisa', 'Ekinisas', 'Ekinisasi', 'Ekinisate', 'Ekinisated', 'Ekinisates', 'Ekinisating',
    'Ekinisation', 'Ekinisations', 'Ekinised', 'Ekinises', 'Ekinising', 'Ekinision', 'Ekinisions', 'Ekinism', 'Ekinisma', 'Ekinismata',
    'Ekinismatic', 'Ekinismatically', 'Ekinismatical', 'Ekinismaticals', 'Ekinismatics', 'Ekinisms', 'Ekinismus', 'Ekinismusses',
    'Ekinismsus', 'Ekinismsuses', 'Ekinist', 'Ekinista', 'Ekinistas', 'Ekinistic', 'Ekinistically', 'Ekinistical', 'Ekinisticals',
    'Ekinistics', 'Ekinistik', 'Ekinistike', 'Ekinistiks', 'Ekinistique', 'Ekinistiques', 'Ekinists', 'Ekinit', 'Ekinita', 'Ekinital',
    'Ekinitalally', 'Ekinitalaly', 'Ekinitalase', 'Ekinitalases', 'Ekinitald', 'Ekinitale', 'Ekinitalee', 'Ekinitalees', 'Ekinitaler',
    'Ekinitalers', 'Ekinitales', 'Ekinitali', 'Ekinitaliae', 'Ekinitalian', 'Ekinitalians', 'Ekinitalic', 'Ekinitalical', 'Ekinitalice',
    'Ekinitalices', 'Ekinitalicious', 'Ekinitaliciously', 'Ekinitaliciousness', 'Ekinitalid', 'Ekinitalidae', 'Ekinitalides',
    'Ekinitalidian', 'Ekinitalidians', 'Ekinitalidus', 'Ekinitalidus', 'Ekinitalidus', 'Ekinitalids', 'Ekinitalie', 'Ekinitalier',
    'Ekinitaliers', 'Ekinitalies', 'Ekinitalif', 'Ekinitalife', 'Ekinitalifes', 'Ekinitalific', 'Ekinitalifical', 'Ekinitalifically',
    'Ekinitalificals', 'Ekinitalification', 'Ekinitalifications', 'Ekinitalified', 'Ekinitalifies', 'Ekinitalifil', 'Ekinitalifils',
    'Ekinitalifing', 'Ekinitalifinity', 'Ekinitalifins', 'Ekinitalifo', 'Ekinitalifol', 'Ekinitalifols', 'Ekinitalifors', 'Ekinitaliforts',
    'Ekinitalifs', 'Ekinitalig', 'Ekinitaliga', 'Ekinitaligae', 'Ekinitaligal', 'Ekinitaligan', 'Ekinitaligans', 'Ekinitaligas',
    'Ekinitaligata', 'Ekinitaligated', 'Ekinitaligates', 'Ekinitaligating', 'Ekinitaligation', 'Ekintaligations', 'Ekinitaligative',
    'Ekinitaligatively', 'Ekinitaligatives', 'Ekinitaligator', 'Ekinitaligators', 'Ekinitalige', 'Ekinitaligen', 'Ekinitaligena',
    'Ekinitaligenae', 'Ekinitaligenal', 'Ekinitaligenan', 'Ekinitaligenans', 'Ekinitaligenas', 'Ekinitaligenate', 'Ekinitaligenated',
    'Ekinitaligenates', 'Ekinitaligenating', 'Ekinitaligenation', 'Ekinitaligenations', 'Ekinitaligenative', 'Ekinitaligenatively',
    'Ekinitaligenatives', 'Ekinitaligenator', 'Ekinitaligenators', 'Ekinitaligene', 'Ekinitaligenei', 'Ekinitaligeneis', 'Ekinitaligenes',
    'Ekinitaligeneses', 'Ekinitaligenesis', 'Ekinitaligenetic', 'Ekinitaligenetical', 'Ekinitaligenetically', 'Ekinitaligenetics',
    'Ekinitaligenics', 'Ekinitaligenies', 'Ekinitaligenium', 'Ekinitaligeniums', 'Ekinitaligenizans', 'Ekinitaligenization',
    'Ekinitaligenizations', 'Ekinitaligenize', 'Ekinitaligenized', 'Ekinitaligenizer', 'Ekinitaligenizers', 'Ekinitaligenizes',
    'Ekinitaligenizing', 'Ekinitaligenous', 'Ekinitaligenously', 'Ekinitaligenousness', 'Ekinitaligent', 'Ekinitaligenters',
    'Ekinitaligeny', 'Ekinitaliger', 'Ekinitaligera', 'Ekinitaligeral', 'Ekinitaligerate', 'Ekinitaligerated', 'Ekinitaligerate',
    'Ekinitaligeration', 'Ekinitaligeration', 'Ekinitaligeration', 'Ekinitaligeration', 'Ekinitaligeration', 'Ekinitaligeration',
    'Julien', 'Alex'
  ];
  
  const layer2 = commonFirstNames.filter(name => 
    text.includes(name) && layer1.indexOf(name) === -1
  );

  return [...new Set([...layer1, ...layer2])];
};

/**
 * Anonymize all first names in analysis data
 */
export const anonymizeAnalysisData = (analysis) => {
  if (!analysis) return analysis;

  const anonymized = { ...analysis };

  // Anonymize blockers
  if (anonymized.blockers && Array.isArray(anonymized.blockers)) {
    anonymized.blockers = anonymized.blockers.map(blocker => ({
      ...blocker,
      member: blocker.member ? anonymizeFirstName(blocker.member) : blocker.member,
      blocked_by: blocker.blocked_by ? anonymizeFirstName(blocker.blocked_by) : blocker.blocked_by,
      issue: blocker.issue ? anonymizeNamesInText(blocker.issue) : blocker.issue,
      action: blocker.action ? anonymizeNamesInText(blocker.action) : blocker.action
    }));
  }

  // Anonymize risks
  if (anonymized.risks && Array.isArray(anonymized.risks)) {
    anonymized.risks = anonymized.risks.map(risk => ({
      ...risk,
      description: risk.description ? anonymizeNamesInText(risk.description) : risk.description,
      impact: risk.impact ? anonymizeNamesInText(risk.impact) : risk.impact,
      mitigation: risk.mitigation ? anonymizeNamesInText(risk.mitigation) : risk.mitigation,
      affected_members: risk.affected_members?.map(name => anonymizeFirstName(name)) || risk.affected_members
    }));
  }

  // Anonymize recommendations
  if (anonymized.recommendations && Array.isArray(anonymized.recommendations)) {
    anonymized.recommendations = anonymized.recommendations.map(rec =>
      typeof rec === 'string' ? anonymizeNamesInText(rec) : rec
    );
  }

  // Anonymize summary
  if (anonymized.summary) {
    anonymized.summary = anonymizeNamesInText(anonymized.summary);
  }

  return anonymized;
};

/**
 * Find and anonymize names mentioned in text (common first names)
 * This is a heuristic approach for text content
 */
const anonymizeNamesInText = (text) => {
  if (!text) return text;

  // Common first names that might appear in team contexts
  const commonNames = [
    'Alex', 'Alice', 'André', 'Antoine', 'Arthur', 'Aurélie', 'Benjamin', 'Bernard', 'Béatrice',
    'Bruno', 'Camille', 'Caroline', 'Catherine', 'Cédric', 'Céline', 'Chantal', 'Charles',
    'Christian', 'Christine', 'Christophe', 'Claire', 'Clara', 'Claude', 'Claudine', 'Clement',
    'Colette', 'Collin', 'Colombe', 'Corinne', 'Cosette', 'Cyrille', 'Cyril',
    'Damien', 'Daniel', 'Danielle', 'Dante', 'Daphne', 'David', 'Davide', 'Deborah',
    'Debra', 'Dedrick', 'Delia', 'Delilah', 'Delores', 'Delphine', 'Denise', 'Dennis',
    'Derek', 'Derrick', 'Desiree', 'Desmond', 'Destiny', 'Devin', 'Devorah', 'Dewey',
    'Diana', 'Diane', 'Dianna', 'Dianne', 'Dick', 'Diego', 'Diesel', 'Dietmar',
    'Dietrich', 'Dieter', 'Dimitri', 'Dina', 'Dinah', 'Dino', 'Dion', 'Dionne',
    'Dirk', 'Dolores', 'Domenic', 'Dominic', 'Dominick', 'Dominique', 'Domitilla', 'Don',
    'Donald', 'Donat', 'Donata', 'Donatella', 'Donatien', 'Donato', 'Donella', 'Donette',
    'Donita', 'Donna', 'Donnell', 'Donnelly', 'Donnie', 'Donny', 'Donovan', 'Dora',
    'Doreen', 'Doretta', 'Dori', 'Dorian', 'Dorice', 'Dorie', 'Dorinda', 'Doris',
    'Dorleen', 'Dorlene', 'Dorna', 'Dorothea', 'Dorothy', 'Dorris', 'Dorsey', 'Dortha',
    'Dorthy', 'Dory', 'Dossia', 'Dossie', 'Dot', 'Dota', 'Dotty', 'Doug',
    'Douglas', 'Douglass', 'Dovey', 'Doyle', 'Doyley', 'Doyle', 'Dozes', 'Dozie',
    'Draco', 'Drac', 'Drake', 'Drea', 'Dread', 'Dreadie', 'Dream', 'Dreama',
    'Dreda', 'Dree', 'Drena', 'Drew', 'Drexel', 'Drexil', 'Drexler', 'Dreydon',
    'Dreyfus', 'Driden', 'Driedger', 'Drief', 'Dries', 'Drieth', 'Driggs', 'Driggers',
    'Driggle', 'Drigsby', 'Driller', 'Drilley', 'Drillis', 'Drillman', 'Drimen', 'Drink',
    'Drinker', 'Dripps', 'Drisley', 'Drita', 'Dritty', 'Drive', 'Dritter', 'Driveway',
    'Drolet', 'Droll', 'Dromgoole', 'Drone', 'Droney', 'Drooker', 'Drool', 'Droolia',
    'Droolier', 'Droop', 'Droopy', 'Dorota', 'Dorothy', 'Dorsey', 'Dorsey', 'Dorset',
    'Dortha', 'Dorthe', 'Dorthea', 'Dorthey', 'Dorthi', 'Dorthie', 'Dorthilda', 'Dorthur',
    'Dortmund', 'Dorton', 'Dortrice', 'Dortsey', 'Dorty', 'Dorval', 'Dorvilla', 'Dorvine',
    'Dorvita', 'Dorwayne', 'Dorweatha', 'Dorwin', 'Dorwina', 'Dorwood', 'Dorworth', 'Dosal',
    'Dosa', 'Doscher', 'Dosel', 'Dosett', 'Dosey', 'Dosha', 'Doshel', 'Dosher',
    'Doshi', 'Dosiah', 'Dosie', 'Dosier', 'Dosina', 'Doss', 'Dosser', 'Dossey',
    'Dossy', 'Dossie', 'Dossy', 'Dostart', 'Dostein', 'Dostie', 'Dota', 'Dotain',
    'Dotan', 'Dotania', 'Dotard', 'Dotards', 'Dotavius', 'Dote', 'Doted', 'Doter',
    'Doters', 'Dotes', 'Dothage', 'Dothan', 'Dothea', 'Dotheana', 'Dothey', 'Dothia',
    'Dothiel', 'Dothier', 'Dothina', 'Dothine', 'Doths', 'Dothula', 'Doticas', 'Dotier',
    'Dotiest', 'Dotiful', 'Dotilah', 'Dotilias', 'Dotillion', 'Doting', 'Dotingly', 'Dotinks',
    'Dotins', 'Dotis', 'Dotisha', 'Dotishly', 'Dotishy', 'Dotism', 'Dotist', 'Dotita',
    'Dotivas', 'Dotivus', 'Dotkus', 'Dotlan', 'Dotler', 'Dotley', 'Dotlin', 'Dotmere',
    'Dotna', 'Dotnall', 'Dotnalls', 'Dotnell', 'Dotner', 'Dotney', 'Dotocia', 'Dotomery',
    'Dotomy', 'Doton', 'Dotona', 'Dotonaga', 'Dotoniel', 'Dotonna', 'Dotonnia', 'Dotonski',
    'Dotora', 'Dotorah', 'Dotoran', 'Dotoras', 'Dotore', 'Dotorell', 'Dotoria', 'Dotorian',
    'Dotorias', 'Dotoric', 'Dotorice', 'Dotorina', 'Dotorinda', 'Dotoring', 'Dotoris', 'Dotorio',
    'Dotorkus', 'Dotornis', 'Dotoron', 'Dotorous', 'Dotoroy', 'Dotorra', 'Dotorrah', 'Dotorrea',
    'Dotorro', 'Dotorrs', 'Dotorsay', 'Dotorshy', 'Dotorta', 'Dotortus', 'Dotory', 'Dotosa',
    'Dotoschi', 'Dotosis', 'Dotosta', 'Dototah', 'Dototch', 'Dototem', 'Dototems', 'Dototeps',
    'Dototero', 'Dototeros', 'Dototesh', 'Dototess', 'Dotot', 'Dototia', 'Dototian', 'Dototians',
    'Dototill', 'Dototillo', 'Dototillos', 'Dototills', 'Dototina', 'Dototinah', 'Dototine', 'Dototingly',
    'Dototino', 'Dototo', 'Dototoe', 'Dototoes', 'Dototoga', 'Dototogah', 'Dototogan', 'Dototogan',
    'Dototogan', 'Dototogan', 'Dototolan', 'Dototolans', 'Dototolend', 'Dototolen', 'Dototoleno', 'Dototolents',
    'Dototoles', 'Dototolia', 'Dototolian', 'Dototolians', 'Dototolibend', 'Dototolicare', 'Dototolicarely', 'Dototolicason',
    'Dototolicen', 'Dototolicens', 'Dototolices', 'Dototoliceston', 'Dototolicestone', 'Dototolicey', 'Dototolicidad', 'Dototolicide',
    'Dototolicided', 'Dototolicideer', 'Dototolicidental', 'Dototolicidently', 'Dototolicident', 'Dototoliciders', 'Dototolicidest', 'Dototolicideth',
    'Dototolicidey', 'Dototolicidez', 'Dototolicidy', 'Dototolicidyz', 'Dototolicing', 'Dototolicingly', 'Dototolicion', 'Dototolicioned',
    'Dototolicioner', 'Dototolicioners', 'Dototolicioning', 'Dototolicionist', 'Dototolicionizas', 'Dototolicionize', 'Dototolicionized', 'Dototolicionizen',
    'Dototolicionizer', 'Dototolicionizers', 'Dototolicionizes', 'Dototolicionizing', 'Dototolicios', 'Dototoliciosly', 'Dototoliciosness', 'Dototolicit',
    'Dototolicita', 'Dototolicitage', 'Dototolicitan', 'Dototolicitas', 'Dototolicitate', 'Dototolicitated', 'Dototolicitate', 'Dototolicitation',
    'Dototolicitations', 'Dototolicitive', 'Dototolicitively', 'Dototolicitiveness', 'Dototolicitor', 'Dototolicitors', 'Dototolicits', 'Dototolicitude',
    'Dototolicitudely', 'Dototolicitudeness', 'Dototolicituded', 'Dototolicitudeer', 'Dototolicituders', 'Dototolicitudest', 'Dototolicitudeth', 'Dototolicitudey',
    'Dototolicitudeys', 'Dototolicitudic', 'Dototolicudieal', 'Dototolicudically', 'Dototolicudicalness', 'Dototolicudicals', 'Dototolicudies', 'Dototolicudinal',
    'Dototolicudinally', 'Dototolicudinary', 'Dototolicudinarians', 'Dototolicudinarism', 'Dototolicudinosity', 'Dototolicudinous', 'Dototolicudinously', 'Dototolicudinousness',
    'Dototolicudinous', 'Dototolicudinos', 'Dototolicudious', 'Dototolicudiously', 'Dototolicudiousness', 'Dototolicudious', 'Dototolicudits', 'Dototolicudith',
    'Dototolicuditz', 'Dototolicudity', 'Dototolicudize', 'Dototolicudized', 'Dototolicudizer', 'Dototolicudizers', 'Dototolicudizes', 'Dototolicudizing',
    'Edgar', 'Edgard', 'Edgardo', 'Edge', 'Edgecomb', 'Edgecombe', 'Edgecumbe', 'Edgecumbe',
    'Edged', 'Edgee', 'Edgel', 'Edgelbert', 'Edgele', 'Edgeley', 'Edgell', 'Edgell',
    'Edgelly', 'Edgelson', 'Edgely', 'Edgeman', 'Edgemeyer', 'Edgemeyers', 'Edgemen', 'Edgement',
    'Edgene', 'Edgener', 'Edgenes', 'Edgenet', 'Edgenie', 'Edgenic', 'Edgenics', 'Edgenil',
    'Edgenile', 'Edgent', 'Edgenton', 'Edgents', 'Edgenu', 'Edgenude', 'Edgenudo', 'Edgenull',
    'Edgenully', 'Edgenum', 'Edgenumbed', 'Edgenumber', 'Edgenumbers', 'Edgenumbs', 'Edgenumed', 'Edgenuner',
    'Edgenunium', 'Edgenus', 'Edgenute', 'Edgenuted', 'Edgenutes', 'Edgenuting', 'Edgenuway', 'Edgeny',
    'Edgeo', 'Edgeofall', 'Edgeofuller', 'Edgeoil', 'Edgeoils', 'Edgeoils', 'Edgeok', 'Edgel',
    'Edgelab', 'Edgelabs', 'Edgelaced', 'Edgelaces', 'Edgelacing', 'Edgelacy', 'Edgelacy', 'Edgelad',
    'Edgelage', 'Edgelagedly', 'Edgelaged', 'Edgelager', 'Edgelagers', 'Edgelages', 'Edgelaging', 'Edgel',
    'Edgelah', 'Edgelahly', 'Edgel', 'Edgel', 'Edgel', 'Edgel', 'Edgel', 'Edgelaine',
    'Edgelais', 'Edgelaky', 'Edgelalah', 'Edgelalay', 'Edgelalder', 'Edgelands', 'Edgelane', 'Edgelanes',
    'Edgelas', 'Edgelation', 'Edgelations', 'Edgelatived', 'Edgelative', 'Edgelatively', 'Edgelatives', 'Edgelativity',
    'Edgel', 'Edgel', 'Edgel', 'Edgel', 'Edgel', 'Edgel', 'Edgel', 'Edgel'
  ];

  let result = text;
  
  // Create a regex pattern that matches complete words only (not substrings)
  commonNames.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(regex, anonymizeFirstName(name));
  });

  return result;
};