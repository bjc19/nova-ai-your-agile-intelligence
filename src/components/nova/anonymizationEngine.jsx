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
 * Common French/English words that should NOT be anonymized
 * (prevents falsely anonymizing "Le", "De", "And", etc.)
 */
const COMMON_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc', 'car',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'ce', 'cet', 'cette',
  'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'quel', 'quelle', 'quels', 'quelles',
  'qui', 'que', 'quoi', 'où', 'quand', 'comment', 'pourquoi',
  'pour', 'par', 'avec', 'sans', 'sous', 'sur', 'à', 'en', 'au', 'aux', 'aussi',
  'très', 'plus', 'moins', 'bien', 'mal', 'peu', 'beaucoup', 'assez',
  'oui', 'non', 'merci', 'bonjour', 'bonsoir', 'au revoir', 'salut', 'hello', 'hi',
  'mr', 'mme', 'mlle', 'dr', 'pr', 'etc', 'vs', 'vs.',
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'if', 'this', 'that', 'these', 'those',
  'is', 'are', 'be', 'been', 'being', 'have', 'has', 'do', 'does', 'did',
  'by', 'from', 'in', 'to', 'of', 'as', 'up', 'out', 'off', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over',
  'here', 'there', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'some', 'any', 'many', 'much', 'no', 'nor', 'only', 'own', 'same', 'so',
  'such', 'than', 'too', 'very', 'just', 'should', 'now'
]);

/**
 * Multi-layer name detection:
 * Layer 1: Interlocutors from "Name :" pattern
 * Layer 2: Contextual capitalization (proper nouns mid-sentence)
 */
const getDetectionLayers = (text) => {
  const layer1 = extractInterlocutors(text);
  
  // Layer 2: Detect proper nouns via capitalization patterns
  // Matches capitalized words NOT at sentence start and NOT common words
  const properNounPattern = /(?:^|\s|:\s)([A-Z][a-zéèêëàâäîïôöùûüçœæ\-']+)/gm;
  const layer2Set = new Set();
  
  let match;
  while ((match = properNounPattern.exec(text)) !== null) {
    const word = match[1].trim();
    if (word.length > 0 && !COMMON_WORDS.has(word.toLowerCase()) && !layer1.includes(word)) {
      layer2Set.add(word);
    }
  }
  
  return [...new Set([...layer1, ...Array.from(layer2Set)])];
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