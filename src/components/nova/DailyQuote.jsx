import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ALL_QUOTES = [
  // 1-60: Lancement, itération & MVP
  { en: "If you are not embarrassed by the first version of your product, you've launched too late.", fr: "Si vous n'êtes pas gêné par la première version de votre produit, vous avez lancé trop tard.", author: "Reid Hoffman", tags: ["launch", "mvp"] },
  { en: "Done is better than perfect.", fr: "Fait est mieux que parfait.", author: "Sheryl Sandberg", tags: ["progress", "perfection"] },
  { en: "Products that survive ship early and ship often.", fr: "Les produits qui survivent lancent tôt et lancent souvent.", author: "Eric Ries", tags: ["launch", "iteration"] },
  { en: "Build less, start sooner.", fr: "Construisez moins, commencez plus tôt.", author: "Jim Highsmith", tags: ["mvp", "launch"] },
  { en: "The best way to get a project done faster is to start sooner.", fr: "La meilleure façon de terminer un projet plus rapidement est de commencer plus tôt.", author: "Jim Highsmith", tags: ["start", "speed"] },
  { en: "The only way to win is to learn faster than anyone else.", fr: "La seule façon de gagner est d'apprendre plus vite que les autres.", author: "Eric Ries", tags: ["learning", "speed"] },
  { en: "A startup is a human institution designed to create a new product or service under conditions of extreme uncertainty.", fr: "Une startup est une institution humaine conçue pour créer un nouveau produit ou service dans des conditions d'incertitude extrême.", author: "Eric Ries", tags: ["startup", "uncertainty"] },
  { en: "The goal of a startup is to figure out the right thing to build — the thing customers want and will pay for — as quickly as possible.", fr: "L'objectif d'une startup est de déterminer la bonne chose à construire — ce que les clients veulent et pour quoi ils paieront — le plus rapidement possible.", author: "Eric Ries", tags: ["startup", "speed"] },
  { en: "Shipping something imperfect is better than not shipping at all.", fr: "Livrer quelque chose d'imparfait vaut mieux que ne rien livrer du tout.", author: "Growth.design", tags: ["shipping", "perfection"] },
  { en: "The minimum viable product is that version of a new product which allows a team to collect the maximum amount of validated learning about customers with the least effort.", fr: "Le produit minimum viable est cette version d'un nouveau produit qui permet à une équipe de collecter le maximum d'apprentissage validé sur les clients avec le moins d'effort.", author: "Eric Ries", tags: ["mvp", "learning"] },
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
  { en: "The market rewards fast learners.", fr: "Le marché récompense les apprenants rapides.", author: "Anon", tags: ["learning", "speed"] },
  { en: "Ship it like it's hot.", fr: "Lancez-le comme si c'était chaud.", author: "Anon", tags: ["shipping", "speed"] },
  { en: "Early birds get the feedback.", fr: "Les lève-tôt obtiennent les retours.", author: "Anon", tags: ["feedback", "early"] },
  { en: "Launch today, fix tomorrow.", fr: "Lancez aujourd'hui, corrigez demain.", author: "Anon", tags: ["launch", "iteration"] },
  { en: "Imperfect action beats perfect inaction.", fr: "L'action imparfaite bat l'inaction parfaite.", author: "Anon", tags: ["action", "perfection"] },
  { en: "The MVP is not the smallest product, it's the fastest way to learn.", fr: "Le MVP n'est pas le plus petit produit, c'est le moyen le plus rapide d'apprendre.", author: "Eric Ries", tags: ["mvp", "learning"] },
  { en: "Release early, release often, listen to feedback.", fr: "Livrez tôt, livrez souvent, écoutez les retours.", author: "Eric S. Raymond", tags: ["release", "feedback"] },
  { en: "Fast beats slow every time.", fr: "Le rapide bat le lent à chaque fois.", author: "Anon", tags: ["speed", "competition"] },
  { en: "Learning velocity is the only sustainable advantage.", fr: "La vélocité d'apprentissage est le seul avantage durable.", author: "Anon", tags: ["learning", "advantage"] },
  { en: "Ship or sink.", fr: "Livrez ou coulez.", author: "Anon", tags: ["shipping", "survival"] },
  
  // 61-110: Qualité, craft, vitesse & lois réalistes
  { en: "The only way to go fast is to go well.", fr: "La seule façon d'aller vite est d'aller bien.", author: "Robert C. Martin", tags: ["quality", "speed"] },
  { en: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.", fr: "La perfection est atteinte, non pas lorsqu'il n'y a plus rien à ajouter, mais lorsqu'il n'y a plus rien à retirer.", author: "Antoine de Saint-Exupéry", tags: ["perfection", "simplicity"] },
  { en: "Continuous attention to technical excellence and good design enhances agility.", fr: "L'attention continue à l'excellence technique et au bon design améliore l'agilité.", author: "Agile Manifesto", tags: ["technical", "excellence"] },
  { en: "It always takes longer than you expect, even when you take into account Hofstadter's Law.", fr: "Cela prend toujours plus de temps que prévu, même quand on tient compte de la loi de Hofstadter.", author: "Douglas Hofstadter", tags: ["time", "estimation"] },
  { en: "Software is getting slower more rapidly than hardware becomes faster.", fr: "Le logiciel ralentit plus rapidement que le matériel n'accélère.", author: "Niklaus Wirth", tags: ["software", "performance"] },
  { en: "Adding manpower to a late software project makes it later.", fr: "Ajouter des ressources à un projet logiciel en retard le retarde davantage.", author: "Fred Brooks", tags: ["resources", "delay"] },
  { en: "Work expands so as to fill the time available for its completion.", fr: "Le travail s'étend pour remplir le temps disponible pour son achèvement.", author: "C. Northcote Parkinson", tags: ["time", "work"] },
  { en: "If anything can go wrong, it will.", fr: "Si quelque chose peut mal tourner, ça arrivera.", author: "Edward A. Murphy Jr.", tags: ["murphy", "risk"] },
  { en: "Organizations which design systems produce designs which are copies of the communication structures of these organizations.", fr: "Les organisations qui conçoivent des systèmes produisent des conceptions qui sont des copies de leurs structures de communication.", author: "Melvin E. Conway", tags: ["conway", "organization"] },
  { en: "A bad idea executed to perfection is still a bad idea.", fr: "Une mauvaise idée exécutée à la perfection reste une mauvaise idée.", author: "Norman Augustine", tags: ["idea", "execution"] },
  { en: "There is nothing so useless as doing efficiently that which should not be done at all.", fr: "Il n'y a rien de plus inutile que de faire efficacement ce qui ne devrait pas être fait du tout.", author: "Peter Drucker", tags: ["efficiency", "priority"] },
  { en: "Clean code always looks like it was written by someone who cares.", fr: "Le code propre a toujours l'air d'avoir été écrit par quelqu'un qui s'en soucie.", author: "Robert C. Martin", tags: ["code", "quality"] },
  { en: "Simplicity is prerequisite for reliability.", fr: "La simplicité est un prérequis pour la fiabilité.", author: "Edsger W. Dijkstra", tags: ["simplicity", "reliability"] },
  { en: "Premature optimization is the root of all evil.", fr: "L'optimisation prématurée est la racine de tous les maux.", author: "Donald Knuth", tags: ["optimization", "evil"] },
  { en: "Make it work, make it right, make it fast.", fr: "Faites-le fonctionner, faites-le bien, faites-le vite.", author: "Kent Beck", tags: ["work", "progression"] },
  { en: "Good code is its own best documentation.", fr: "Le bon code est sa propre meilleure documentation.", author: "Steve McConnell", tags: ["code", "documentation"] },
  { en: "Code is read much more than it is written.", fr: "Le code est lu beaucoup plus qu'il n'est écrit.", author: "Guido van Rossum", tags: ["code", "readability"] },
  { en: "Debugging is twice as hard as writing the code in the first place.", fr: "Le débogage est deux fois plus difficile que d'écrire le code en premier lieu.", author: "Brian W. Kernighan", tags: ["debugging", "difficulty"] },
  { en: "The best error message is the one that never shows up.", fr: "Le meilleur message d'erreur est celui qui n'apparaît jamais.", author: "Thomas Fuchs", tags: ["error", "prevention"] },
  { en: "Refactor mercilessly.", fr: "Refactorisez sans pitié.", author: "Martin Fowler", tags: ["refactor", "quality"] },
  { en: "You aren't gonna need it.", fr: "Vous n'en aurez pas besoin.", author: "Extreme Programming", tags: ["yagni", "simplicity"] },
  { en: "Do the simplest thing that could possibly work.", fr: "Faites la chose la plus simple qui pourrait fonctionner.", author: "Kent Beck", tags: ["simplicity", "pragmatism"] },
  { en: "Technical debt is like financial debt.", fr: "La dette technique est comme la dette financière.", author: "Ward Cunningham", tags: ["debt", "technical"] },
  { en: "Quality is free. It's not a gift, but it's free.", fr: "La qualité est gratuite. Ce n'est pas un cadeau, mais c'est gratuit.", author: "Philip Crosby", tags: ["quality", "cost"] },
  { en: "The bitterness of poor quality remains long after the sweetness of low price is forgotten.", fr: "L'amertume de la mauvaise qualité demeure longtemps après que la douceur du prix bas soit oubliée.", author: "Benjamin Franklin", tags: ["quality", "price"] },
  { en: "Fast, cheap, good — pick two.", fr: "Rapide, bon marché, bien — choisissez-en deux.", author: "Project Management Triangle", tags: ["tradeoff", "triangle"] },
  { en: "Scope creep is the silent killer of projects.", fr: "La dérive du périmètre est le tueur silencieux des projets.", author: "Anon", tags: ["scope", "creep"] },
  { en: "Late projects are late from day one.", fr: "Les projets en retard le sont depuis le premier jour.", author: "Fred Brooks", tags: ["delay", "planning"] },
  { en: "The bearing of a child takes nine months, no matter how many women are assigned.", fr: "Porter un enfant prend neuf mois, peu importe le nombre de femmes assignées.", author: "Fred Brooks", tags: ["time", "resources"] },
  { en: "Nine women can't make a baby in one month.", fr: "Neuf femmes ne peuvent pas faire un bébé en un mois.", author: "Fred Brooks", tags: ["time", "parallelism"] },
  { en: "Plan to throw one away; you will, anyhow.", fr: "Prévoyez d'en jeter un ; vous le ferez de toute façon.", author: "Fred Brooks", tags: ["prototype", "iteration"] },
  { en: "The second system is the most dangerous system a man ever designs.", fr: "Le deuxième système est le système le plus dangereux qu'un homme conçoive jamais.", author: "Fred Brooks", tags: ["system", "danger"] },
  { en: "When a project is late, adding people makes it later.", fr: "Quand un projet est en retard, ajouter des gens le retarde davantage.", author: "Fred Brooks", tags: ["resources", "delay"] },
  { en: "Hope is not a strategy.", fr: "L'espoir n'est pas une stratégie.", author: "Anon", tags: ["hope", "strategy"] },
  { en: "Estimates are always optimistic.", fr: "Les estimations sont toujours optimistes.", author: "Anon", tags: ["estimates", "optimism"] },
  { en: "Underpromise, overdeliver.", fr: "Sous-promettez, sur-livrez.", author: "Tom Peters", tags: ["promise", "delivery"] },
  { en: "Murphy was an optimist.", fr: "Murphy était un optimiste.", author: "Anon", tags: ["murphy", "pessimism"] },
  { en: "Everything takes longer than you think.", fr: "Tout prend plus de temps qu'on ne le pense.", author: "Hofstadter", tags: ["time", "estimation"] },
  { en: "The first 90% of the code takes 90% of the time. The last 10% takes the other 90%.", fr: "Les premiers 90% du code prennent 90% du temps. Les derniers 10% prennent les 90% restants.", author: "Tom Cargill", tags: ["time", "completion"] },
  { en: "Good artists copy, great artists steal.", fr: "Les bons artistes copient, les grands artistes volent.", author: "Pablo Picasso", tags: ["inspiration", "creativity"] },
  { en: "Simplicity–the art of maximizing the amount of work not done–is essential.", fr: "La simplicité — l'art de maximiser le travail non fait — est essentielle.", author: "Agile Manifesto", tags: ["simplicity", "efficiency"] },
  { en: "Working software is the primary measure of progress.", fr: "Le logiciel fonctionnel est la principale mesure du progrès.", author: "Agile Manifesto", tags: ["software", "progress"] },
  { en: "Deliver working software frequently.", fr: "Livrez fréquemment des logiciels fonctionnels.", author: "Agile Manifesto", tags: ["delivery", "frequency"] },
  { en: "Welcome changing requirements, even late in development.", fr: "Accueillez les changements de besoins, même tard dans le développement.", author: "Agile Manifesto", tags: ["change", "requirements"] },
  { en: "The best architectures emerge from self-organizing teams.", fr: "Les meilleures architectures émergent d'équipes auto-organisées.", author: "Agile Manifesto", tags: ["architecture", "teams"] },
  { en: "Build projects around motivated individuals.", fr: "Construisez des projets autour d'individus motivés.", author: "Agile Manifesto", tags: ["motivation", "individuals"] },
  { en: "The most efficient method is face-to-face conversation.", fr: "La méthode la plus efficace est la conversation en face à face.", author: "Agile Manifesto", tags: ["communication", "efficiency"] },
  { en: "At regular intervals, the team reflects on how to become more effective.", fr: "À intervalles réguliers, l'équipe réfléchit à comment devenir plus efficace.", author: "Agile Manifesto", tags: ["reflection", "improvement"] },
  { en: "Sustainable pace.", fr: "Rythme soutenable.", author: "Agile Manifesto", tags: ["pace", "sustainability"] },
  { en: "Technical excellence.", fr: "Excellence technique.", author: "Agile Manifesto", tags: ["technical", "excellence"] },
  
  // 111-180: Produit & customer-centric
  { en: "Great products are engineered when product managers truly understand their customers' problems.", fr: "Les grands produits sont conçus quand les chefs de produit comprennent vraiment les problèmes de leurs clients.", author: "Marty Cagan", tags: ["product", "customer"] },
  { en: "Product management is responsible for discovering a product that is valuable, usable, and feasible.", fr: "La gestion de produit est responsable de découvrir un produit qui est précieux, utilisable et faisable.", author: "Marty Cagan", tags: ["product", "discovery"] },
  { en: "Your most unhappy customers are your greatest source of learning.", fr: "Vos clients les plus mécontents sont votre plus grande source d'apprentissage.", author: "Bill Gates", tags: ["customer", "learning"] },
  { en: "Ideas are like ice cream and discovery is like broccoli.", fr: "Les idées sont comme de la glace et la découverte est comme du brocoli.", author: "Teresa Torres", tags: ["ideas", "discovery"] },
  { en: "We often treat prioritization as a math problem, but in reality, it is a negotiation of anxiety.", fr: "Nous traitons souvent la priorisation comme un problème mathématique, mais en réalité, c'est une négociation d'anxiété.", author: "John Cutler", tags: ["prioritization", "anxiety"] },
  { en: "Until you've built a great product, almost nothing else matters.", fr: "Tant que vous n'avez pas construit un grand produit, presque rien d'autre n'a d'importance.", author: "Sam Altman", tags: ["product", "priority"] },
  { en: "Step 1 is to build something that users love.", fr: "L'étape 1 est de construire quelque chose que les utilisateurs adorent.", author: "Sam Altman", tags: ["users", "love"] },
  { en: "Love the problem, not your solution.", fr: "Aimez le problème, pas votre solution.", author: "Marty Cagan", tags: ["problem", "solution"] },
  { en: "Fall in love with the problem, not the solution.", fr: "Tombez amoureux du problème, pas de la solution.", author: "Uri Levine", tags: ["problem", "solution"] },
  { en: "The job of the product manager is to discover what the customers actually need.", fr: "Le travail du chef de produit est de découvrir ce dont les clients ont réellement besoin.", author: "Marty Cagan", tags: ["product", "discovery"] },
  { en: "Outcomes over output.", fr: "Les résultats plutôt que la production.", author: "John Cutler", tags: ["outcomes", "output"] },
  { en: "Impact over activity.", fr: "L'impact plutôt que l'activité.", author: "John Cutler", tags: ["impact", "activity"] },
  { en: "Customers don't buy products, they hire them to do jobs.", fr: "Les clients n'achètent pas des produits, ils les embauchent pour faire des travaux.", author: "Clayton Christensen", tags: ["jobs", "customer"] },
  { en: "Jobs to be Done framework.", fr: "Le cadre Jobs to be Done.", author: "Clayton Christensen", tags: ["jtbd", "framework"] },
  { en: "People don't want a quarter-inch drill, they want a quarter-inch hole.", fr: "Les gens ne veulent pas une perceuse d'un quart de pouce, ils veulent un trou d'un quart de pouce.", author: "Theodore Levitt", tags: ["needs", "wants"] },
  { en: "Get closer than ever to your customers.", fr: "Rapprochez-vous plus que jamais de vos clients.", author: "Steve Jobs", tags: ["customer", "proximity"] },
  { en: "Sometimes the customers are wrong.", fr: "Parfois les clients ont tort.", author: "Marty Cagan", tags: ["customer", "judgment"] },
  { en: "Build what matters, not what's requested.", fr: "Construisez ce qui compte, pas ce qui est demandé.", author: "Marty Cagan", tags: ["priority", "requests"] },
  { en: "Prioritization is painful.", fr: "La priorisation est douloureuse.", author: "Shreyas Doshi", tags: ["prioritization", "pain"] }
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