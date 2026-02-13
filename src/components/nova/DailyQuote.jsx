import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ALL_QUOTES = [
  { en: "If you are not embarrassed by the first version of your product, you've launched too late.", fr: "Si vous n'êtes pas gêné par la première version de votre produit, vous avez lancé trop tard.", author: "Reid Hoffman", tags: ["launch", "mvp"] },
  { en: "Done is better than perfect.", fr: "Fait est mieux que parfait.", author: "Sheryl Sandberg", tags: ["progress", "perfection"] },
  { en: "Products that survive ship early and ship often.", fr: "Les produits qui survivent lancent tôt et lancent souvent.", author: "Eric Ries", tags: ["launch", "iteration"] },
  { en: "Build less, start sooner.", fr: "Construisez moins, commencez plus tôt.", author: "Jim Highsmith", tags: ["mvp", "launch"] },
  { en: "The best way to get a project done faster is to start sooner.", fr: "La meilleure façon de finir un projet plus rapidement est de commencer plus tôt.", author: "Jim Highsmith", tags: ["start", "speed"] },
  { en: "The only way to win is to learn faster than anyone else.", fr: "La seule façon de gagner est d'apprendre plus vite que les autres.", author: "Eric Ries", tags: ["learning", "speed"] },
  { en: "A startup is a human institution designed to create a new product or service under conditions of extreme uncertainty.", fr: "Une startup est une institution humaine conçue pour créer un nouveau produit ou service dans des conditions d'incertitude extrême.", author: "Eric Ries", tags: ["startup", "uncertainty"] },
  { en: "The goal of a startup is to figure out the right thing to build as quickly as possible.", fr: "L'objectif d'une startup est de déterminer la bonne chose à construire le plus rapidement possible.", author: "Eric Ries", tags: ["startup", "speed"] },
  { en: "Shipping something imperfect is better than not shipping at all.", fr: "Livrer quelque chose d'imparfait vaut mieux que ne rien livrer du tout.", author: "Growth.design", tags: ["shipping", "perfection"] },
  { en: "The minimum viable product allows a team to collect the maximum amount of validated learning with the least effort.", fr: "Le produit minimum viable permet à une équipe de collecter le maximum d'apprentissage validé avec le moins d'effort.", author: "Eric Ries", tags: ["mvp", "learning"] },
  { en: "Build-Measure-Learn feedback loop is at the core of the Lean Startup model.", fr: "La boucle Construire-Mesurer-Apprendre est au cœur du modèle Lean Startup.", author: "Eric Ries", tags: ["lean", "feedback"] },
  { en: "Validated learning is the unit of progress in a startup.", fr: "L'apprentissage validé est l'unité de progrès dans une startup.", author: "Eric Ries", tags: ["learning", "progress"] },
  { en: "Innovation accounting is the rigorous method for demonstrating progress when innovating.", fr: "La comptabilité de l'innovation est la méthode rigoureuse pour démontrer les progrès lors de l'innovation.", author: "Eric Ries", tags: ["innovation", "metrics"] },
  { en: "Pivot or persevere — every startup must decide.", fr: "Pivoter ou persévérer — chaque startup doit décider.", author: "Eric Ries", tags: ["pivot", "decision"] },
  { en: "The lean startup method teaches you how to drive a startup.", fr: "La méthode lean startup vous apprend à piloter une startup.", author: "Eric Ries", tags: ["lean", "startup"] },
  { en: "Launch early, iterate often.", fr: "Lancez tôt, itérez souvent.", author: "Reid Hoffman", tags: ["launch", "iteration"] },
  { en: "Fail fast, fail cheap, fail forward.", fr: "Échouez vite, échouez à moindre coût, échouez vers l'avant.", author: "Reid Hoffman", tags: ["failure", "learning"] },
  { en: "Speed is the new currency of business.", fr: "La vitesse est la nouvelle monnaie des affaires.", author: "Anon", tags: ["speed", "business"] },
  { en: "Move fast and break things.", fr: "Avancez vite et cassez des choses.", author: "Mark Zuckerberg", tags: ["speed", "innovation"] },
  { en: "If you're not embarrassed when you ship, you've waited too long.", fr: "Si vous n'êtes pas gêné quand vous lancez, vous avez attendu trop longtemps.", author: "Avinash Kaushik", tags: ["launch", "timing"] },
  { en: "Prototype early, prototype often.", fr: "Prototypez tôt, prototypez souvent.", author: "Tom & David Kelley", tags: ["prototype", "iteration"] },
  { en: "The purpose of a prototype is to prove a point, not create a product.", fr: "Le but d'un prototype est de prouver un point, pas de créer un produit.", author: "Tom & David Kelley", tags: ["prototype", "learning"] },
  { en: "Ship early and ship often.", fr: "Lancez tôt, lancez souvent.", author: "Eric Ries", tags: ["shipping", "iteration"] },
  { en: "Perfection is the enemy of progress.", fr: "La perfection est l'ennemie du progrès.", author: "Voltaire", tags: ["perfection", "progress"] },
  { en: "Launching is learning.", fr: "Lancer c'est apprendre.", author: "Marty Cagan", tags: ["launch", "learning"] },
  { en: "The fastest way to learn is to ship.", fr: "Le moyen le plus rapide d'apprendre est de livrer.", author: "Marty Cagan", tags: ["shipping", "learning"] },
  { en: "Iterate or die.", fr: "Itérez ou mourez.", author: "Steve Blank", tags: ["iteration", "survival"] },
  { en: "Get out of the building.", fr: "Sortez du bâtiment.", author: "Steve Blank", tags: ["customer", "validation"] },
  { en: "Customer development is as important as product development.", fr: "Le développement client est aussi important que le développement produit.", author: "Steve Blank", tags: ["customer", "development"] },
  { en: "No plan survives first contact with customers.", fr: "Aucun plan ne survit au premier contact avec les clients.", author: "Steve Blank", tags: ["customer", "planning"] },
  { en: "Test your assumptions early and often.", fr: "Testez vos hypothèses tôt et souvent.", author: "Ash Maurya", tags: ["testing", "assumptions"] },
  { en: "Problem-solution fit before product-market fit.", fr: "L'adéquation problème-solution avant l'adéquation produit-marché.", author: "Dan Olsen", tags: ["fit", "problem"] },
  { en: "Build features users actually need, not what you think they need.", fr: "Construisez les fonctionnalités dont les utilisateurs ont réellement besoin, pas ce que vous pensez qu'ils ont besoin.", author: "Marty Cagan", tags: ["features", "customer"] },
  { en: "The best way to predict what customers want is to watch what they do.", fr: "La meilleure façon de prédire ce que veulent les clients est d'observer ce qu'ils font.", author: "Marty Cagan", tags: ["customer", "observation"] },
  { en: "Discovery is continuous.", fr: "La découverte est continue.", author: "Teresa Torres", tags: ["discovery", "continuous"] },
  { en: "Opportunity solution tree over roadmap.", fr: "L'arbre opportunité-solution plutôt que la feuille de route.", author: "Teresa Torres", tags: ["planning", "discovery"] },
  { en: "Continuous discovery habits win.", fr: "Les habitudes de découverte continue gagnent.", author: "Teresa Torres", tags: ["discovery", "habits"] },
  { en: "Assume you know nothing about the customer — then prove it wrong.", fr: "Supposez que vous ne savez rien sur le client — puis prouvez le contraire.", author: "Teresa Torres", tags: ["customer", "assumptions"] },
  { en: "The best ideas come from talking to users.", fr: "Les meilleures idées viennent des conversations avec les utilisateurs.", author: "Teresa Torres", tags: ["users", "ideas"] },
  { en: "Ship to learn, not to be right.", fr: "Livrez pour apprendre, pas pour avoir raison.", author: "John Cutler", tags: ["shipping", "learning"] },
  { en: "Momentum beats perfection.", fr: "L'élan bat la perfection.", author: "John Cutler", tags: ["momentum", "perfection"] },
  { en: "Progress over polish.", fr: "La progression plutôt que le polissage.", author: "John Cutler", tags: ["progress", "perfection"] },
  { en: "Start stupid, get smart later.", fr: "Commencez stupide, devenez intelligent plus tard.", author: "John Cutler", tags: ["start", "learning"] },
  { en: "The first 80% is easy, the last 20% is hell.", fr: "Les premiers 80% sont faciles, les derniers 20% sont l'enfer.", author: "Anon", tags: ["completion", "difficulty"] },
  { en: "Launching is an act of courage.", fr: "Lancer est un acte de courage.", author: "Anon", tags: ["launch", "courage"] },
  { en: "Better ugly and shipped than beautiful and stuck.", fr: "Mieux vaut laid et livré que beau et bloqué.", author: "Anon", tags: ["shipping", "blockers"] },
  { en: "Version 1.0 is just the beginning.", fr: "La version 1.0 n'est que le début.", author: "Anon", tags: ["version", "start"] },
  { en: "Iterate relentlessly.", fr: "Itérez sans relâche.", author: "Anon", tags: ["iteration", "persistence"] },
  { en: "Speed wins in uncertain markets.", fr: "La vitesse gagne dans les marchés incertains.", author: "Anon", tags: ["speed", "uncertainty"] },
  { en: "The market rewards fast learners.", fr: "Le marché récompense les apprenants rapides.", author: "Anon", tags: ["learning", "speed"] }
];

export default function DailyQuote({ lang = "fr", blockerCount = 0, riskCount = 0, patterns = [] }) {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    selectOrGenerateQuote();
  }, [blockerCount, riskCount, patterns]);

  const selectOrGenerateQuote = async () => {
    // Analyse du contexte
    const hasBlockers = blockerCount > 0;
    const hasRisks = riskCount > 0;
    const hasPatterns = patterns && patterns.length > 0;

    // Tags pertinents selon contexte
    let relevantTags = [];
    if (hasBlockers) relevantTags.push("blockers", "risks", "challenges", "problems");
    if (hasRisks) relevantTags.push("risks", "uncertainty", "murphy", "failure");
    if (hasPatterns) {
      patterns.forEach(p => {
        if (p.toLowerCase().includes("scope")) relevantTags.push("scope", "planning");
        if (p.toLowerCase().includes("delay")) relevantTags.push("delay", "time");
        if (p.toLowerCase().includes("quality")) relevantTags.push("quality", "technical");
      });
    }

    // Chercher quotes matchantes
    let matchingQuotes = ALL_QUOTES.filter(q => 
      q.tags && q.tags.some(tag => relevantTags.includes(tag))
    );

    // Si pas de match ou contexte très spécifique, générer via LLM
    if (matchingQuotes.length === 0 || (hasBlockers && hasRisks && hasPatterns)) {
      await generateCustomQuote();
    } else {
      // Sélection aléatoire parmi les quotes matchantes
      const randomQuote = matchingQuotes[Math.floor(Math.random() * matchingQuotes.length)];
      setSelectedQuote(randomQuote);
    }
  };

  const generateCustomQuote = async () => {
    setIsGenerating(true);
    try {
      const context = {
        blockers: blockerCount,
        risks: riskCount,
        patterns: patterns
      };

      const prompt = `Tu es un expert agile. Génère UNE citation motivante et pertinente basée sur ce contexte d'équipe :
- Blockers détectés: ${context.blockers}
- Risques identifiés: ${context.risks}
- Anti-patterns: ${context.patterns.join(", ")}

La citation doit être courte, percutante, et pertinente. Retourne un JSON avec:
{
  "en": "citation en anglais",
  "fr": "citation en français"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            en: { type: "string" },
            fr: { type: "string" }
          }
        }
      });

      setSelectedQuote({
        en: response.en,
        fr: response.fr,
        author: "Nova Team"
      });
    } catch (error) {
      console.error("Error generating custom quote:", error);
      // Fallback vers quote générique
      setSelectedQuote({
        en: "Progress over perfection, always.",
        fr: "Le progrès plutôt que la perfection, toujours.",
        author: "Nova Team"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm w-fit">
          <Quote className="w-4 h-4 text-blue-500 flex-shrink-0 animate-pulse" />
          <p className="text-sm italic text-slate-500">Génération d'une citation personnalisée...</p>
        </div>
      </motion.div>
    );
  }

  if (!selectedQuote) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm w-fit">
        <Quote className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm italic text-slate-700 font-light">
            "{selectedQuote[lang]}" — <span className="font-semibold text-blue-600">{selectedQuote.author}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}