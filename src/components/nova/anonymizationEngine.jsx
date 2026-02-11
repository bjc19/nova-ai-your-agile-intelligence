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
  
  // Pattern: "Name (Optional Title) : " at start of line
  // Using \p{L} with 'u' flag for robust Unicode letter matching (handles ALL accents)
  const interlocutorPattern = /^(\s*)(\p{Lu}\p{Ll}+)(\s*(?:\([^)]*\))?)\s*:/u;
  
  lines.forEach(line => {
    const match = line.match(interlocutorPattern);
    if (match) {
      const candidate = match[2].trim();
      
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
 * Detect if a word is likely a verb (French or English)
 * Checks infinitive forms and common endings
 */
const isVerb = (word) => {
  const lowerWord = word.toLowerCase();

  // French verb infinitive endings
  const frenchVerbEndings = ['er', 'ir', 're', 'oir'];
  for (const ending of frenchVerbEndings) {
    if (lowerWord.endsWith(ending) && lowerWord.length > 3) return true;
  }

  // Common French verb conjugation patterns
  const frenchVerbPatterns = /^(je|tu|il|elle|on|nous|vous|ils|elles)?\s*(ai|as|a|avons|avez|ont|suis|es|est|sommes|êtes|sont|fais|fait|faisons|faites|vais|vas|va|allons|allez|vont|dois|doit|devons|devez|doivent|peux|peut|pouvons|pouvez|peuvent|veux|veut|voulons|voulez|veulent|sais|sait|savons|savez|savent|vois|voit|voyons|voyez|voient)/i;
  if (frenchVerbPatterns.test(lowerWord)) return true;

  // English verb forms and common verbs
  const englishVerbEndings = ['ing', 'ed'];
  for (const ending of englishVerbEndings) {
    if (lowerWord.endsWith(ending) && lowerWord.length > 4) return true;
  }

  // Common English verbs
  const commonEnglishVerbs = ['waiting', 'need', 'important', 'trying', 'working', 'running', 'walking', 'talking', 'knowing', 'understanding', 'thinking', 'coming', 'going', 'doing', 'making', 'taking', 'getting', 'giving', 'asking', 'telling', 'hearing', 'seeing'];
  if (commonEnglishVerbs.includes(lowerWord)) return true;

  return false;
};

/**
 * Detect if a word is likely an adjective based on context
 * Checks if word precedes a noun (common pattern: Adjective + Noun)
 * Examples: "communication claire" → "claire" is adjective
 */
const isAdjectiveByContext = (word, text) => {
  if (!text || !word) return false;

  const lowerWord = word.toLowerCase();

  // Common French adjectives that can appear before nouns
  const commonAdjectives = ['claire', 'clair', 'clairs', 'claires', 'bon', 'bonne', 'bons', 'bonnes', 'mauvais', 'mauvaise', 'meilleur', 'meilleure', 'grand', 'grande', 'petit', 'petite', 'nouveau', 'nouvelle', 'ancien', 'ancienne', 'haut', 'haute', 'bas', 'basse'];

  if (commonAdjectives.includes(lowerWord)) {
    // Check if word is followed by a noun (word + space + capitalized word or known noun)
    const pattern = new RegExp(`\\b${word}\\s+\\p{Lu}\\p{Ll}+`, 'u');
    if (pattern.test(text)) return true;
  }

  return false;
};

/**
 * Whitelist: Terms that should NOT be anonymized
 * Includes common language words + agile/technical ecosystem terms
 * CRITICAL: Includes state words, results, and generic technical terms
 */
const COMMON_WORDS = new Set([
  // Status & State words (CRITICAL - never anonymize)
  'waiting', 'need', 'pending', 'blocked', 'done', 'progress', 'ready', 'scheduled',
  'delayed', 'completed', 'resolved', 'reopened', 'verified', 'validated', 'approved',
  'rejected', 'failed', 'passed', 'active', 'inactive', 'enabled', 'disabled',
  'open', 'closed', 'archived', 'draft', 'published', 'delay',
  'important', 'urgent', 'critical', 'high', 'medium', 'low', 'trying', 'working',

  // Results & Outputs
  'results', 'result', 'outcome', 'output', 'findings', 'finding', 'data', 'report',
  'summary', 'analysis', 'assessment', 'evaluation', 'insights', 'insight', 'conclusion',
  'interruption', 'interruptions', 'delay', 'delays', 'may', 'might', 'could', 'encourage',
  'établir', 'establish', 'ensure', 'provide', 'maintenir', 'maintain',

  // Generic nouns (not proper names)
  'issue', 'problem', 'blocker', 'risk', 'impact', 'action', 'task', 'item', 'comment',
  'note', 'feedback', 'suggestion', 'recommendation', 'improvement', 'enhancement',
  'need', 'needs', 'requirement', 'requirements', 'constraint', 'constraints',
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

  // French verbs (infinitive and conjugated forms)
  'chercher', 'travailler', 'faire', 'aller', 'pouvoir', 'vouloir', 'devoir', 'avoir', 'être',
  'dire', 'donner', 'prendre', 'venir', 'voir', 'savoir', 'croire', 'mettre', 'trouver',
  'entendre', 'laisser', 'tenir', 'montrer', 'utiliser', 'servir', 'appeler', 'passer',
  'demander', 'parler', 'arriver', 'rester', 'sortir', 'entrer', 'suivre', 'produire',
  'comparer', 'commencer', 'continuer', 'développer', 'organiser', 'planifier', 'analyser',

  // Agile Rituals & Ceremonies & Team Terms
  'daily', 'standup', 'scrum', 'sprint', 'planning', 'review', 'retrospective', 'retro',
  'grooming', 'refinement', 'demo', 'kickoff', 'workshop', 'sync', 'catchup', 'post-mortem',
  'iteration', 'increment', 'pi', 'innovation', 'milestone', 'deadline',
  'team', 'équipe', 'member', 'membre', 'members', 'membres', 'group', 'groupe',

  // Management Methodologies & Practices (CRITICAL - never anonymize)
  'agile', 'lean', 'kanban', 'waterfall', 'framework', 'methodology', 'process',
  'ceremony', 'ceremonies', 'ritual', 'rituals', 'practice', 'practices',
  'workflow', 'workflows', 'pipeline', 'pipelines', 'cadence', 'cadences',
  'stakeholder', 'stakeholders', 'backlog', 'portfolio', 'capability', 'capabilities',
  'enabler', 'enablers', 'epic', 'epics', 'feature', 'features', 'story', 'stories',
  'maturity', 'velocity', 'throughput', 'capacity', 'planning',

  // External Tools & Platforms (CRITICAL - never anonymize)
  'slack', 'jira', 'microsoft', 'teams', 'github', 'gitlab', 'confluence', 'trello',
  'devops', 'azure', 'zoom',

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
  'criteria', 'staging', 'production', 'prod', 'hotfix', 'patch', 'release',

  // Infrastructure & Environment Variables
  'environment', 'variable', 'variables', 'config', 'configuration', 'secret', 'secrets',
  'api', 'endpoint', 'database', 'server', 'client', 'host', 'port', 'url', 'ssl', 'https',
  'authentication', 'authorization', 'token', 'key', 'password', 'username', 'user',
  'deployment', 'docker', 'container', 'kubernetes', 'aws', 'gcp', 'azure', 'heroku',
  'ci', 'cd', 'pipeline', 'build', 'test', 'deploy', 'release', 'version',
  'error', 'warning', 'log', 'debug', 'trace', 'info', 'exception', 'crash',
  'performance', 'memory', 'cpu', 'latency', 'throughput', 'bandwidth'
  ]);

/**
 * CRITICAL: Detect if a capitalized word is a REAL NAME vs. a common word/phrase start
 * 
 * Rules:
 * 1. If word is in COMMON_WORDS → NOT a name
 * 2. If word is a verb or adjective → NOT a name
 * 3. If word appears at sentence start with lowercase following → NOT a name (sentence start)
 * 4. If word is followed by action (verb conjugation) → NOT a name
 * 5. Only names preceded by dialogue colon or in true dialogue format → IS a name
 */
const isRealPersonName = (word, text, position) => {
  if (!word) return false;

  const lowerWord = word.toLowerCase();

  // Rule 1: Blacklist check (COMMON_WORDS)
  if (COMMON_WORDS.has(lowerWord)) return false;

  // Rule 2: Verb check
  if (isVerb(word)) return false;

  // Rule 3: Adjective check
  if (isAdjectiveByContext(word, text)) return false;

  // Rule 4: Check if this looks like sentence start with normal prose
  // Pattern: Word at position 0 or after period/newline, followed by lowercase
  const beforeWord = position > 0 ? text[position - 1] : '\n';
  const isAtLineStart = beforeWord === '\n' || beforeWord === '.' || position === 0;
  
  if (isAtLineStart) {
    // Look for what follows - if it's normal prose (lowercase + space + lowercase), it's a sentence start
    const afterMatch = text.substring(position + word.length, position + word.length + 50);
    const normalProsePattern = /^\s+[a-zàâäéèêëïîôùûüœæç]/;
    
    if (normalProsePattern.test(afterMatch)) {
      return false; // Looks like normal sentence start
    }
  }

  // Rule 5: TRUE name only if followed by dialogue marker (:) or in dialogue pattern
  const dialoguePattern = new RegExp(`${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\\([^)]*\\))?\\s*:`, 'i');
  return dialoguePattern.test(text);
};

/**
 * Extract names from text using capitalized word pattern
 * Extracts ONLY:
 * 1. Dialogue format (Name :)
 * 2. Names at START of sentence (not followed by Majuscule = not start of normal sentence)
 * Avoids false positives from capitalized adjectives or inline verbs
 * Returns array of detected names (not common words, not verbs, not adjectives)
 */
const extractNamesFromText = (text) => {
  if (!text) return [];

  const names = new Set();

  // Pattern: Name at START of line/sentence (beginning or after period+space or newline)
  // Followed by: comma, colon, space+lowercase/action verb, or end
  // NOT followed by: capital letter (would be normal sentence start)
  const nameStartPattern = /(?:^|\n|\.[\s\n])\s*(\p{Lu}\p{Ll}+)(?=[\s,:]|$)/gu;

  for (const match of text.matchAll(nameStartPattern)) {
    const word = match[1];
    const position = match.index + (match[0].length - word.length);

    // CRITICAL: Use new isRealPersonName function instead of simple checks
    if (!isRealPersonName(word, text, position)) {
      continue;
    }

    names.add(word);
  }

  return Array.from(names);
};

/**
 * Name detection from dialogue format + sentence-start detection:
 * Layer 1: Interlocutors (names before ":" at start of line)
 * Layer 2: Names at sentence starts (not followed by another capital = not a normal sentence start)
 * Filters out verbs, adjectives, and common words
 */
const getDetectionLayers = (text) => {
   // Layer 1: Dialogue format (Name : ...)
   const interlocutors = extractInterlocutors(text);
   
   // Layer 2: Names at sentence starts (better for titles and descriptions)
   const sentenceStartNames = extractNamesFromText(text);
   
   // Combine both layers, removing duplicates
   return Array.from(new Set([...interlocutors, ...sentenceStartNames]));
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

  // CRITICAL: Extract names from recommendations BEFORE anonymizing them
  // This catches names that appear in recommendations but not in transcript
  if (anonymized.recommendations && Array.isArray(anonymized.recommendations)) {
    anonymized.recommendations.forEach(rec => {
      const recText = typeof rec === 'string' ? rec : rec?.action || rec?.description || '';
      if (recText) {
        const namesInRec = extractNamesFromText(recText);
        namesInRec.forEach(name => knownNames.add(name));
      }
    });
  }

  // Anonymize recommendations with ALL known names (including from recommendations themselves)
  if (anonymized.recommendations && Array.isArray(anonymized.recommendations)) {
    anonymized.recommendations = anonymized.recommendations.map(rec =>
      typeof rec === 'string' ? anonymizeNamesInText(rec, Array.from(knownNames)) : rec
    );
  }

  // Anonymize summary with known names context
  if (anonymized.summary) {
    anonymized.summary = anonymizeNamesInText(anonymized.summary, Array.from(knownNames));
  }

  // Anonymize transcript itself with all known names
  if (anonymized.transcript) {
    anonymized.transcript = anonymizeTranscript(anonymized.transcript, Array.from(knownNames));
  }

  return anonymized;
};

/**
 * CRITICAL: Check if word is a conjugated action verb at sentence start
 * Action verbs used to formulate recommendations (e.g., "Escalade", "Schedule", "Organise")
 * Should NEVER be anonymized even if they start with capital letter
 */
const isActionVerbAtStart = (word, text, position) => {
  if (!word || word.length <= 2) return false;

  const lowerWord = word.toLowerCase();

  // French action verbs (imperative/conjugated forms common in recommendations)
  const frenchActionVerbs = [
    'escalade', 'escalader', 'communiquer', 'organiser', 'planifier', 'revoir', 'prioriser',
    'réduire', 'augmenter', 'améliorer', 'analyser', 'simplifier', 'clarifier', 'définir',
    'créer', 'mettre', 'établir', 'identifier', 'documenter', 'valider', 'confirmer',
    'relancer', 'synchroniser', 'regrouper', 'consolider', 'ajouter', 'retirer',
    'considérer', 'proposer', 'suggérer', 'demander', 'vérifier', 'tester', 'évaluer'
  ];

  // English action verbs
  const englishActionVerbs = [
    'escalate', 'schedule', 'organize', 'plan', 'review', 'prioritize', 'reduce',
    'increase', 'improve', 'analyze', 'simplify', 'clarify', 'define', 'create',
    'set', 'establish', 'identify', 'document', 'validate', 'confirm', 'reach',
    'sync', 'consolidate', 'add', 'remove', 'consider', 'propose', 'suggest',
    'ask', 'check', 'verify', 'test', 'evaluate', 'gather', 'align', 'coordinate'
  ];

  // Check if at sentence start (after period, colon, or start of text)
  const isAtStart = position === 0 || text[position - 1] === '.' || text[position - 1] === ':';

  return isAtStart && (frenchActionVerbs.includes(lowerWord) || englishActionVerbs.includes(lowerWord));
};

/**
 * Anonymize names in dialogue transcript
 * Replaces names ONLY before ":" at line start, leaving all other occurrences unchanged
 */
const anonymizeTranscript = (text, knownNames = []) => {
  if (!text || knownNames.length === 0) return text;

  let result = text;
  const lines = result.split('\n');

  // Process each line
  const processedLines = lines.map(line => {
    // Match "Name (Title) :" at start of line - using Unicode-safe pattern
    const interlocutorPattern = /^(\s*)(\p{Lu}\p{Ll}+)(\s*(?:\([^)]*\))?)\s*(:)/u;
    const match = line.match(interlocutorPattern);

    if (match) {
      const [fullMatch, leadingSpace, name, titlePart, colon] = match;
      // Check if this name should be anonymized
      if (knownNames.includes(name)) {
        const anonymized = anonymizeFirstName(name);
        return `${leadingSpace}${anonymized}${titlePart}${colon}${line.slice(fullMatch.length)}`;
      }
    }

    return line;
  });

  return processedLines.join('\n');
};

/**
 * Find and anonymize names mentioned in text using multi-layer detection
 * Layer 1: Interlocutors extracted from "Name :" pattern
 * Layer 2: Common first names found in text
 * Layer 3: Known names passed via context (for recommendations, etc.)
 * CRITICAL: Never anonymize verbs OR adjectives (detected by context)
 */
export const anonymizeNamesInText = (text, knownNames = []) => {
  if (!text) return text;

  // Get detected names from multi-layer detection + add known names
  const detectedNames = getDetectionLayers(text);
  const allNames = [...new Set([...detectedNames, ...knownNames])];

  let result = text;

  // Anonymize all detected names
  // Use Unicode-safe word boundaries with \p{L} (matches any letter in any language)
  allNames.forEach(name => {
    // CRITICAL: Never anonymize if it's a verb
    if (isVerb(name)) return;

    // CRITICAL: Never anonymize if it's an adjective (detected by context)
    if (isAdjectiveByContext(name, text)) return;

    // CRITICAL: Never anonymize action verbs at sentence start (recommendations)
    let searchPos = 0;
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\p{L})${escapedName}(?!\\p{L})`, 'giu');

    result = result.replace(regex, (match, offset) => {
      // Check if this occurrence is an action verb at sentence start
      if (isActionVerbAtStart(match, text, offset)) {
        return match; // Don't anonymize action verbs
      }
      return anonymizeFirstName(name);
    });
  });

  return result;
};