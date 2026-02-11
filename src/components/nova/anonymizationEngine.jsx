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
  
  // Pattern: "Name (Optional Title) : " at start of line - captures ONLY the name part
   const interlocutorPattern = /^\s*([A-Z][a-zéèêëàâäîïôöùûüç\-']*)\s*(?:\([^)]*\))?\s*:/;
  
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
 * Whitelist: Terms that should NOT be anonymized
 * Includes common language words + agile/technical ecosystem terms
 */
const COMMON_WORDS = new Set([
  // Common French/English grammar words
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
  'such', 'than', 'too', 'very', 'just', 'should', 'now',
  
  // Agile Rituals & Ceremonies
  'daily', 'standup', 'scrum', 'sprint', 'planning', 'review', 'retrospective', 'retro',
  'grooming', 'refinement', 'demo', 'kickoff', 'workshop', 'sync', 'catchup', 'post-mortem',
  'iteration', 'increment', 'pi', 'innovation', 'milestone', 'deadline',
  
  // Artifacts & Structure
  'backlog', 'portfolio', 'solution', 'item', 'story', 'user', 'epic', 'feature', 'capability',
  'enabler', 'task', 'subtask', 'spike', 'bug', 'defect', 'ticket', 'roadmap', 'vision',
  'charter', 'scope', 'requirement', 'specification', 'spec', 'deliverable',
  
  // Roles & Governance
  'owner', 'master', 'lead', 'manager', 'director', 'sponsor', 'stakeholder', 'architect',
  'engineer', 'developer', 'dev', 'qa', 'ux', 'ui', 'designer', 'coach', 'rte', 'ste', 'pmo',
  'project', 'program', 'business', 'squad', 'tribe', 'train',
  
  // Metrics & Tools
  'kpi', 'okr', 'velocity', 'capacity', 'burnup', 'burndown', 'throughput', 'wip', 'kanban',
  'board', 'workflow', 'jira', 'confluence', 'trello', 'slack', 'teams', 'figma', 'miro',
  'mural', 'github', 'gitlab', 'azure', 'devops',
  
  // Status & Technical
  'todo', 'doing', 'done', 'progress', 'blocked', 'ready', 'definition', 'acceptance',
  'criteria', 'staging', 'production', 'prod', 'hotfix', 'patch', 'release'
  ]);

/**
 * Name detection from dialogue format:
 * Only interlocutors (names before ":" at start of line) are considered proper names
 * No other name detection - no false positives on common words
 */
const getDetectionLayers = (text) => {
   // ONLY detect names from dialogue format (Name : ...)
   return extractInterlocutors(text);
};

/**
 * Anonymize all first names in analysis data
 * Extracts known names from blockers/risks and transcript interlocutors to ensure they're anonymized everywhere
 */
export const anonymizeAnalysisData = (analysis) => {
  if (!analysis) return analysis;

  const anonymized = { ...analysis };
  
  // Extract all known names: from transcript interlocutors + blockers + risks
  // This ensures consistent anonymization everywhere
  const knownNames = new Set();
  
  // FIRST: Extract interlocutors from transcript (primary source)
  if (anonymized.transcript || typeof anonymized === 'string') {
    const transcriptText = anonymized.transcript || anonymized;
    const interlocutors = extractInterlocutors(transcriptText);
    interlocutors.forEach(name => knownNames.add(name));
  }

  // Anonymize blockers
  if (anonymized.blockers && Array.isArray(anonymized.blockers)) {
    anonymized.blockers = anonymized.blockers.map(blocker => {
      if (blocker.member) knownNames.add(blocker.member);
      if (blocker.blocked_by) knownNames.add(blocker.blocked_by);

      return {
        ...blocker,
        member: blocker.member ? anonymizeFirstName(blocker.member) : blocker.member,
        blocked_by: blocker.blocked_by ? anonymizeFirstName(blocker.blocked_by) : blocker.blocked_by,
        issue: blocker.issue ? anonymizeNamesInText(blocker.issue, Array.from(knownNames)) : blocker.issue,
        action: blocker.action ? anonymizeNamesInText(blocker.action, Array.from(knownNames)) : blocker.action
      };
      });
      }

      // Anonymize risks
  if (anonymized.risks && Array.isArray(anonymized.risks)) {
    anonymized.risks = anonymized.risks.map(risk => {
      if (risk.affected_members) {
        risk.affected_members.forEach(name => knownNames.add(name));
      }
      
      return {
        ...risk,
        description: risk.description ? anonymizeNamesInText(risk.description, Array.from(knownNames)) : risk.description,
        impact: risk.impact ? anonymizeNamesInText(risk.impact, Array.from(knownNames)) : risk.impact,
        mitigation: risk.mitigation ? anonymizeNamesInText(risk.mitigation, Array.from(knownNames)) : risk.mitigation,
        affected_members: risk.affected_members?.map(name => anonymizeFirstName(name)) || risk.affected_members
      };
    });
  }

  // Anonymize recommendations with known names context
  if (anonymized.recommendations && Array.isArray(anonymized.recommendations)) {
    anonymized.recommendations = anonymized.recommendations.map(rec =>
      typeof rec === 'string' ? anonymizeNamesInText(rec, Array.from(knownNames)) : rec
    );
  }

  // Anonymize summary with known names context
  if (anonymized.summary) {
    anonymized.summary = anonymizeNamesInText(anonymized.summary, Array.from(knownNames));
  }

  return anonymized;
};

/**
 * Find and anonymize names mentioned in text using multi-layer detection
 * Layer 1: Interlocutors extracted from "Name :" pattern
 * Layer 2: Common first names found in text
 * Layer 3: Known names passed via context (for recommendations, etc.)
 */
const anonymizeNamesInText = (text, knownNames = []) => {
  if (!text) return text;

  // Get detected names from multi-layer detection + add known names
  const detectedNames = getDetectionLayers(text);
  const allNames = [...new Set([...detectedNames, ...knownNames])];

  let result = text;
  
  // Anonymize all detected names
  // Use lookahead/lookbehind to handle accented characters (word boundaries fail with accents)
  allNames.forEach(name => {
    // Match: name surrounded by non-letter boundaries (spaces, punctuation, start/end)
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-zéèêëàâäîïôöùûüçœæ])${escapedName}(?![a-zéèêëàâäîïôöùûüçœæ])`, 'gi');
    result = result.replace(regex, anonymizeFirstName(name));
  });

  return result;
};