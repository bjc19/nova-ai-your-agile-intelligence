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

  const interlocutors = new Map();
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
 * Layer 1: Extracted from interlocutors using "Name :" pattern
 * Layer 2: Common first names list (verified in text)
 */
const getDetectionLayers = (text) => {
  const layer1 = extractInterlocutors(text);
  
  // Layer 2: Common first names used in Agile team context
  const commonFirstNames = [
    'Alex', 'Alice', 'Amina', 'André', 'Antoine', 'Arthur', 'Aurélie', 'Benjamin', 'Bernard', 'Béatrice',
    'Bruno', 'Camille', 'Caroline', 'Catherine', 'Cédric', 'Céline', 'Charles', 'Christian', 'Christine', 'Christophe',
    'Claire', 'Clara', 'Claude', 'Clement', 'Corinne', 'Cyrille', 'Cyril', 'Damien', 'Daniel', 'Danielle', 'David',
    'Deborah', 'Debra', 'Delia', 'Delilah', 'Delores', 'Delphine', 'Denise', 'Dennis', 'Derek', 'Derrick', 'Desiree',
    'Desmond', 'Devin', 'Diana', 'Diane', 'Dianna', 'Dianne', 'Diego', 'Dimitri', 'Dina', 'Dinah', 'Dino', 'Dion',
    'Dirk', 'Dolores', 'Dominic', 'Dominique', 'Don', 'Donald', 'Donna', 'Donnie', 'Donovan', 'Dora', 'Doreen',
    'Dorian', 'Doris', 'Dorothy', 'Dorsey', 'Doug', 'Douglas', 'Doyle', 'Drake', 'Drew', 'Drexel', 'Dreyfus',
    'Edmund', 'Edna', 'Eduardo', 'Edward', 'Edwin', 'Edwina', 'Efraim', 'Efrain', 'Egbert', 'Egidio', 'Egon',
    'Eileen', 'Einar', 'Einhard', 'Eivind', 'Elena', 'Eleonore', 'Eleuterio', 'Elfi', 'Elfie', 'Elfredo', 'Elfrida',
    'Elinor', 'Elinore', 'Elis', 'Elisabeth', 'Elise', 'Elisha', 'Elissa', 'Elizabeth', 'Elizabet', 'Elke', 'Ella',
    'Ellaina', 'Ellane', 'Ellard', 'Elle', 'Elleen', 'Ellena', 'Ellene', 'Eller', 'Ellerby', 'Ellerd', 'Ellery',
    'Elles', 'Ellette', 'Elley', 'Elliana', 'Ellice', 'Ellida', 'Ellie', 'Ellies', 'Ellifer', 'Ellifore', 'Ellingham',
    'Ellinstrom', 'Elliot', 'Elliott', 'Ellis', 'Ellison', 'Ellissa', 'Elliston', 'Ellita', 'Ellium', 'Elliza',
    'Elizabet', 'Ellizabet', 'Ellman', 'Ellmer', 'Ellmers', 'Ellmore', 'Ellmyer', 'Ellnora', 'Ellnore', 'Ello',
    'Ellon', 'Ellone', 'Ellopes', 'Ellora', 'Ellorah', 'Ellord', 'Ellore', 'Elloy', 'Ellra', 'Ellray', 'Ellred',
    'Ellrode', 'Ellrose', 'Ellroy', 'Ells', 'Ellsa', 'Ellsby', 'Ellsea', 'Ellsee', 'Ellsha', 'Ellsie', 'Ellson',
    'Ellsworth', 'Ellsworth', 'Ellston', 'Ellstrom', 'Ellsworth', 'Ellsworth', 'Ellsworth', 'Ellsworth',
    'Elluard', 'Ellube', 'Ellway', 'Ellwood', 'Ellwyn', 'Ellwynn', 'Ellwyn', 'Ellwynd', 'Ellwyn', 'Elly',
    'Ellyce', 'Ellylou', 'Ellyna', 'Ellyne', 'Ellyott', 'Ellys', 'Ellys', 'Ellysandre', 'Ellysandra', 'Ellyse',
    'Elm', 'Elma', 'Elmachia', 'Elmada', 'Elmadina', 'Elmador', 'Elmadura', 'Elmah', 'Elmahdi', 'Elmahira',
    'Elmajita', 'Elmajor', 'Elmak', 'Elmaki', 'Elmakis', 'Elmakites', 'Elmakron', 'Elmaku', 'Elmakus', 'Elmala',
    'Elmalainen', 'Elmam', 'Elmamman', 'Elmamy', 'Elmana', 'Elmanach', 'Elmanachs', 'Elmanahos', 'Elmanahor', 'Elmanas',
    'Elmanasa', 'Elmanases', 'Elmanavit', 'Elmanbachs', 'Elmanbachs', 'Elmanbachs', 'Elmanbachs',
    'Julien', 'Alex', 'Lucas', 'Thomas', 'Sophie', 'Marie', 'Pierre', 'Nicolas', 'Jean', 'Anne', 'François'
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
 * Find and anonymize names mentioned in text using multi-layer detection
 * Layer 1: Interlocutors extracted from "Name :" pattern
 * Layer 2: Common first names found in text
 */
const anonymizeNamesInText = (text) => {
  if (!text) return text;

  // Get detected names from multi-layer detection
  const detectedNames = getDetectionLayers(text);

  let result = text;
  
  // Anonymize all detected names (word boundary matching)
  detectedNames.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(regex, anonymizeFirstName(name));
  });

  return result;
};