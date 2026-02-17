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
  { en: "Prioritization is painful.", fr: "La priorisation est douloureuse.", author: "Shreyas Doshi", tags: ["prioritization", "pain"] },
  { en: "The best product managers say no more than yes.", fr: "Les meilleurs chefs de produit disent non plus que oui.", author: "Marty Cagan", tags: ["saying-no", "prioritization"] },
  { en: "A great product is obvious in hindsight.", fr: "Un grand produit est évident avec le recul.", author: "Marty Cagan", tags: ["product", "hindsight"] },
  { en: "Discovery is not optional.", fr: "La découverte n'est pas optionnelle.", author: "Teresa Torres", tags: ["discovery", "mandatory"] },
  { en: "Assumptions kill products.", fr: "Les hypothèses tuent les produits.", author: "Teresa Torres", tags: ["assumptions", "risk"] },
  { en: "Talk to users every week.", fr: "Parlez aux utilisateurs chaque semaine.", author: "Teresa Torres", tags: ["users", "frequency"] },
  { en: "Continuous discovery beats sporadic research.", fr: "La découverte continue bat la recherche sporadique.", author: "Teresa Torres", tags: ["discovery", "continuous"] },
  { en: "Opportunity solution tree > feature factory.", fr: "Arbre opportunité-solution > usine à fonctionnalités.", author: "Teresa Torres", tags: ["discovery", "features"] },
  { en: "Stop building features, start solving problems.", fr: "Arrêtez de construire des fonctionnalités, commencez à résoudre des problèmes.", author: "John Cutler", tags: ["features", "problems"] },
  { en: "The product is the promises you keep.", fr: "Le produit, ce sont les promesses que vous tenez.", author: "John Cutler", tags: ["product", "promises"] },
  { en: "Good PMs ship features. Great PMs ship value.", fr: "Les bons PM livrent des fonctionnalités. Les grands PM livrent de la valeur.", author: "Shreyas Doshi", tags: ["value", "features"] },
  { en: "A great product manager has the brain of an engineer, the heart of a designer, and the speech of a diplomat.", fr: "Un grand chef de produit a le cerveau d'un ingénieur, le cœur d'un designer et la parole d'un diplomate.", author: "Deep Nishar", tags: ["product-manager", "skills"] },
  { en: "Good PMs deal with answers and data. Great PMs deal with questions and wisdom.", fr: "Les bons PM traitent de réponses et données. Les grands PM traitent de questions et sagesse.", author: "Shreyas Doshi", tags: ["questions", "wisdom"] },
  { en: "Prioritization is saying no to good ideas.", fr: "La priorisation c'est dire non aux bonnes idées.", author: "Shreyas Doshi", tags: ["saying-no", "ideas"] },
  { en: "Focus is saying no.", fr: "La concentration c'est dire non.", author: "Steve Jobs", tags: ["focus", "saying-no"] },
  { en: "The art of leadership is saying no, not yes.", fr: "L'art du leadership c'est dire non, pas oui.", author: "Tony Blair", tags: ["leadership", "saying-no"] },
  { en: "Customers first, always.", fr: "Les clients d'abord, toujours.", author: "Jeff Bezos", tags: ["customer", "priority"] },
  { en: "Obsess over customers.", fr: "Obsédez-vous des clients.", author: "Jeff Bezos", tags: ["customer", "obsession"] },
  { en: "Start with the customer and work backwards.", fr: "Commencez par le client et travaillez à rebours.", author: "Jeff Bezos", tags: ["customer", "backwards"] },
  { en: "Working backwards from the press release.", fr: "Travailler à rebours depuis le communiqué de presse.", author: "Amazon", tags: ["backwards", "press-release"] },
  { en: "Customer obsession is Day 1 forever.", fr: "L'obsession du client est le Jour 1 pour toujours.", author: "Jeff Bezos", tags: ["customer", "day-one"] },
  { en: "The voice of the customer is the voice of God.", fr: "La voix du client est la voix de Dieu.", author: "Anon", tags: ["customer", "voice"] },
  { en: "Listen more than you talk.", fr: "Écoutez plus que vous ne parlez.", author: "Anon", tags: ["listening", "communication"] },
  { en: "Empathy is the best product skill.", fr: "L'empathie est la meilleure compétence produit.", author: "Anon", tags: ["empathy", "skill"] },
  { en: "Solve real pain, not imaginary problems.", fr: "Résolvez une vraie douleur, pas des problèmes imaginaires.", author: "Anon", tags: ["pain", "problems"] },
  { en: "Painkiller > vitamin.", fr: "Antidouleur > vitamine.", author: "Anon", tags: ["painkiller", "vitamin"] },
  { en: "Build for delight, not just function.", fr: "Construisez pour le plaisir, pas juste la fonction.", author: "Anon", tags: ["delight", "function"] },
  { en: "User love is the best metric.", fr: "L'amour des utilisateurs est la meilleure métrique.", author: "Sam Altman", tags: ["love", "metric"] },
  { en: "Retention is the ultimate vanity metric killer.", fr: "La rétention est le tueur ultime des métriques de vanité.", author: "Anon", tags: ["retention", "metrics"] },
  { en: "Churn tells the truth.", fr: "Le taux d'attrition dit la vérité.", author: "Anon", tags: ["churn", "truth"] },
  { en: "NPS is useful, but love is better.", fr: "Le NPS est utile, mais l'amour c'est mieux.", author: "Anon", tags: ["nps", "love"] },
  { en: "The best products feel inevitable.", fr: "Les meilleurs produits semblent inévitables.", author: "Anon", tags: ["product", "inevitable"] },
  
  // 181-230: Stratégie, roadmap & priorisation
  { en: "Be stubborn on vision but flexible on details.", fr: "Soyez têtu sur la vision mais flexible sur les détails.", author: "Jeff Bezos", tags: ["vision", "flexibility"] },
  { en: "Roadmaps are evidence of strategy. Not a list of features.", fr: "Les feuilles de route sont la preuve de la stratégie. Pas une liste de fonctionnalités.", author: "Steve Johnson", tags: ["roadmap", "strategy"] },
  { en: "The essence of strategy is choosing what not to do.", fr: "L'essence de la stratégie est de choisir ce qu'il ne faut pas faire.", author: "Michael Porter", tags: ["strategy", "choice"] },
  { en: "It means saying no to the hundred other good ideas.", fr: "Cela signifie dire non aux cent autres bonnes idées.", author: "Steve Jobs", tags: ["saying-no", "ideas"] },
  { en: "Strategy without tactics is the slowest route to victory.", fr: "La stratégie sans tactique est le chemin le plus lent vers la victoire.", author: "Sun Tzu", tags: ["strategy", "tactics"] },
  { en: "Culture eats strategy for breakfast.", fr: "La culture mange la stratégie au petit-déjeuner.", author: "Peter Drucker", tags: ["culture", "strategy"] },
  { en: "Vision without execution is hallucination.", fr: "La vision sans exécution est une hallucination.", author: "Thomas Edison", tags: ["vision", "execution"] },
  { en: "A goal without a timeline is just a dream.", fr: "Un objectif sans échéance n'est qu'un rêve.", author: "Robert Herjavec", tags: ["goal", "timeline"] },
  { en: "By failing to prepare, you are preparing to fail.", fr: "En ne parvenant pas à vous préparer, vous vous préparez à échouer.", author: "Benjamin Franklin", tags: ["preparation", "failure"] },
  { en: "If you fail to plan, you are planning to fail.", fr: "Si vous ne parvenez pas à planifier, vous planifiez l'échec.", author: "Benjamin Franklin", tags: ["planning", "failure"] },
  { en: "Plans are worthless, but planning is everything.", fr: "Les plans ne valent rien, mais la planification est tout.", author: "Dwight D. Eisenhower", tags: ["planning", "plans"] },
  { en: "No battle plan survives contact with the enemy.", fr: "Aucun plan de bataille ne survit au contact avec l'ennemi.", author: "Helmuth von Moltke", tags: ["planning", "reality"] },
  { en: "Keep your roadmap simple and easy to understand.", fr: "Gardez votre feuille de route simple et facile à comprendre.", author: "Roman Pichler", tags: ["roadmap", "simplicity"] },
  { en: "Now, next, later.", fr: "Maintenant, ensuite, plus tard.", author: "Janna Bastow", tags: ["roadmap", "timing"] },
  { en: "Prioritize ruthlessly.", fr: "Priorisez impitoyablement.", author: "Anon", tags: ["prioritization", "ruthless"] },
  { en: "Focus on leverage points.", fr: "Concentrez-vous sur les points de levier.", author: "Anon", tags: ["focus", "leverage"] },
  { en: "The 80/20 rule rules.", fr: "La règle des 80/20 règne.", author: "Vilfredo Pareto", tags: ["pareto", "rule"] },
  { en: "Do less, better.", fr: "Faites moins, mais mieux.", author: "Anon", tags: ["less", "better"] },
  { en: "One thing at a time.", fr: "Une chose à la fois.", author: "Anon", tags: ["focus", "one-thing"] },
  { en: "Multitasking is a myth.", fr: "Le multitâche est un mythe.", author: "Anon", tags: ["multitasking", "myth"] },
  { en: "Strategy is sacrifice.", fr: "La stratégie est un sacrifice.", author: "Anon", tags: ["strategy", "sacrifice"] },
  { en: "Say no with grace.", fr: "Dites non avec grâce.", author: "Anon", tags: ["saying-no", "grace"] },
  { en: "Bet big on few bets.", fr: "Misez gros sur peu de paris.", author: "Anon", tags: ["bets", "focus"] },
  { en: "Theme-based roadmaps win.", fr: "Les feuilles de route thématiques gagnent.", author: "Anon", tags: ["roadmap", "themes"] },
  { en: "Outcomes > outputs.", fr: "Résultats > productions.", author: "Marty Cagan", tags: ["outcomes", "outputs"] },
  { en: "OKRs align strategy and execution.", fr: "Les OKR alignent stratégie et exécution.", author: "John Doerr", tags: ["okr", "alignment"] },
  { en: "Measure what matters.", fr: "Mesurez ce qui compte.", author: "John Doerr", tags: ["measurement", "matters"] },
  { en: "Moonshots require crazy goals.", fr: "Les moonshots nécessitent des objectifs fous.", author: "Google", tags: ["moonshots", "goals"] },
  { en: "10x better, not 10% better.", fr: "10x mieux, pas 10% mieux.", author: "Astro Teller", tags: ["10x", "improvement"] },
  { en: "Think big, start small.", fr: "Pensez grand, commencez petit.", author: "Anon", tags: ["thinking", "starting"] },
  { en: "Vision is the North Star.", fr: "La vision est l'étoile du Nord.", author: "Anon", tags: ["vision", "north-star"] },
  { en: "Align everyone around why.", fr: "Alignez tout le monde autour du pourquoi.", author: "Simon Sinek", tags: ["alignment", "why"] },
  { en: "Start with why.", fr: "Commencez par pourquoi.", author: "Simon Sinek", tags: ["why", "start"] },
  { en: "People don't buy what you do, they buy why you do it.", fr: "Les gens n'achètent pas ce que vous faites, ils achètent pourquoi vous le faites.", author: "Simon Sinek", tags: ["why", "buying"] },
  { en: "The golden circle.", fr: "Le cercle d'or.", author: "Simon Sinek", tags: ["golden-circle", "why"] },
  { en: "Purpose-driven products win.", fr: "Les produits guidés par un but gagnent.", author: "Anon", tags: ["purpose", "products"] },
  { en: "Strategy is pattern in decisions.", fr: "La stratégie est un motif dans les décisions.", author: "Henry Mintzberg", tags: ["strategy", "decisions"] },
  { en: "Emergent strategy beats deliberate sometimes.", fr: "La stratégie émergente bat parfois la délibérée.", author: "Henry Mintzberg", tags: ["strategy", "emergent"] },
  { en: "Pivot when data says so.", fr: "Pivotez quand les données le disent.", author: "Eric Ries", tags: ["pivot", "data"] },
  { en: "Persevere when conviction is high.", fr: "Persévérez quand la conviction est forte.", author: "Eric Ries", tags: ["perseverance", "conviction"] },
  
  // 231-310: Management & leadership
  { en: "Management is doing things right; leadership is doing the right things.", fr: "Le management c'est bien faire les choses ; le leadership c'est faire les bonnes choses.", author: "Peter Drucker", tags: ["management", "leadership"] },
  { en: "The best way to predict the future is to create it.", fr: "La meilleure façon de prédire l'avenir est de le créer.", author: "Peter Drucker", tags: ["future", "creation"] },
  { en: "The most important thing in communication is hearing what isn't said.", fr: "La chose la plus importante dans la communication est d'entendre ce qui n'est pas dit.", author: "Peter Drucker", tags: ["communication", "listening"] },
  { en: "Management by objectives works if you first think through the objectives.", fr: "La gestion par objectifs fonctionne si vous réfléchissez d'abord aux objectifs.", author: "Peter Drucker", tags: ["mbo", "objectives"] },
  { en: "What gets measured gets managed.", fr: "Ce qui est mesuré est géré.", author: "Peter Drucker", tags: ["measurement", "management"] },
  { en: "Effective leadership is not about making speeches; it is defined by results.", fr: "Le leadership efficace ne consiste pas à faire des discours ; il est défini par les résultats.", author: "Peter Drucker", tags: ["leadership", "results"] },
  { en: "Leadership is lifting a person's vision to high sights.", fr: "Le leadership consiste à élever la vision d'une personne vers de hauts objectifs.", author: "Peter Drucker", tags: ["leadership", "vision"] },
  { en: "Leadership is not about being in charge. It is about taking care of those in your charge.", fr: "Le leadership ne consiste pas à être aux commandes. Il s'agit de prendre soin de ceux qui sont sous votre responsabilité.", author: "Simon Sinek", tags: ["leadership", "care"] },
  { en: "Customers will never love a company until the employees love it first.", fr: "Les clients n'aimeront jamais une entreprise tant que les employés ne l'aiment pas d'abord.", author: "Simon Sinek", tags: ["employees", "customers"] },
  { en: "Leaders eat last.", fr: "Les leaders mangent en dernier.", author: "Simon Sinek", tags: ["leadership", "sacrifice"] },
  { en: "The function of leadership is to produce more leaders, not more followers.", fr: "La fonction du leadership est de produire plus de leaders, pas plus de suiveurs.", author: "Ralph Nader", tags: ["leadership", "leaders"] },
  { en: "A leader is best when people barely know he exists… they will say: we did it ourselves.", fr: "Un leader est au mieux quand les gens savent à peine qu'il existe... ils diront : nous l'avons fait nous-mêmes.", author: "Lao Tzu", tags: ["leadership", "invisible"] },
  { en: "To lead people, walk beside them.", fr: "Pour diriger les gens, marchez à leurs côtés.", author: "Lao Tzu", tags: ["leadership", "walking"] },
  { en: "The supreme quality for leadership is unquestionably integrity.", fr: "La qualité suprême du leadership est sans aucun doute l'intégrité.", author: "Dwight D. Eisenhower", tags: ["leadership", "integrity"] },
  { en: "Leadership is the capacity to translate vision into reality.", fr: "Le leadership est la capacité de traduire la vision en réalité.", author: "Warren Bennis", tags: ["leadership", "vision"] },
  { en: "A good leader inspires confidence in the leader. A great leader inspires confidence in themselves.", fr: "Un bon leader inspire confiance dans le leader. Un grand leader inspire confiance en eux-mêmes.", author: "Eleanor Roosevelt", tags: ["leadership", "confidence"] },
  { en: "To handle yourself, use your head; to handle others, use your heart.", fr: "Pour vous gérer vous-même, utilisez votre tête ; pour gérer les autres, utilisez votre cœur.", author: "Eleanor Roosevelt", tags: ["management", "heart"] },
  { en: "The key to successful leadership today is influence, not authority.", fr: "La clé du leadership réussi aujourd'hui est l'influence, pas l'autorité.", author: "Ken Blanchard", tags: ["leadership", "influence"] },
  { en: "A leader takes people where they want to go. A great leader takes people where they ought to be.", fr: "Un leader emmène les gens où ils veulent aller. Un grand leader emmène les gens où ils devraient être.", author: "Rosalynn Carter", tags: ["leadership", "direction"] },
  { en: "The greatest leader is not necessarily the one who does the greatest things.", fr: "Le plus grand leader n'est pas nécessairement celui qui fait les plus grandes choses.", author: "Ronald Reagan", tags: ["leadership", "greatness"] },
  { en: "Leadership is solving problems.", fr: "Le leadership c'est résoudre des problèmes.", author: "Colin Powell", tags: ["leadership", "problems"] },
  { en: "A leader is one who knows the way, goes the way, and shows the way.", fr: "Un leader est quelqu'un qui connaît le chemin, parcourt le chemin et montre le chemin.", author: "John C. Maxwell", tags: ["leadership", "way"] },
  { en: "If your actions inspire others to dream more you are a leader.", fr: "Si vos actions inspirent les autres à rêver davantage, vous êtes un leader.", author: "John Quincy Adams", tags: ["leadership", "inspiration"] },
  { en: "People ask the difference between a leader and a boss. The leader leads, the boss drives.", fr: "Les gens demandent la différence entre un leader et un patron. Le leader dirige, le patron conduit.", author: "Theodore Roosevelt", tags: ["leadership", "boss"] },
  { en: "It's not the critic who counts… The credit belongs to the man in the arena.", fr: "Ce n'est pas le critique qui compte... Le mérite appartient à l'homme dans l'arène.", author: "Theodore Roosevelt", tags: ["action", "criticism"] },
  { en: "The best leaders are those most interested in surrounding themselves with assistants smarter than they are.", fr: "Les meilleurs leaders sont ceux qui s'intéressent le plus à s'entourer d'assistants plus intelligents qu'eux.", author: "John C. Maxwell", tags: ["leadership", "smart"] },
  { en: "True leaders don't create followers, they create more leaders.", fr: "Les vrais leaders ne créent pas de suiveurs, ils créent plus de leaders.", author: "Tom Peters", tags: ["leadership", "creating"] },
  { en: "Leadership is not about titles, positions or flowcharts.", fr: "Le leadership ne concerne pas les titres, les positions ou les organigrammes.", author: "John C. Maxwell", tags: ["leadership", "titles"] },
  { en: "The task of leadership is not to put greatness into people, but to elicit it.", fr: "La tâche du leadership n'est pas de mettre la grandeur dans les gens, mais de la faire ressortir.", author: "John Buchan", tags: ["leadership", "greatness"] },
  { en: "A leader is like a shepherd. He stays behind the flock.", fr: "Un leader est comme un berger. Il reste derrière le troupeau.", author: "Nelson Mandela", tags: ["leadership", "shepherd"] },
  { en: "The greatest glory in living lies not in never falling, but in rising every time we fall.", fr: "La plus grande gloire dans la vie ne réside pas dans le fait de ne jamais tomber, mais de se relever à chaque fois que nous tombons.", author: "Nelson Mandela", tags: ["perseverance", "falling"] },
  { en: "It always seems impossible until it's done.", fr: "Cela semble toujours impossible jusqu'à ce que ce soit fait.", author: "Nelson Mandela", tags: ["impossible", "done"] },
  { en: "Change will not come if we wait for some other person… We are the change.", fr: "Le changement ne viendra pas si nous attendons une autre personne... Nous sommes le changement.", author: "Barack Obama", tags: ["change", "action"] },
  { en: "Do not wait; the time will never be just right.", fr: "N'attendez pas ; le moment ne sera jamais parfait.", author: "Napoleon Hill", tags: ["timing", "action"] },
  { en: "The journey of a thousand miles begins with one step.", fr: "Le voyage de mille lieues commence par un pas.", author: "Lao Tzu", tags: ["journey", "start"] },
  { en: "What you get by achieving your goals is not as important as what you become.", fr: "Ce que vous obtenez en atteignant vos objectifs n'est pas aussi important que ce que vous devenez.", author: "Zig Ziglar", tags: ["goals", "becoming"] },
  { en: "The only limit to our realization of tomorrow will be our doubts of today.", fr: "La seule limite à notre réalisation de demain sera nos doutes d'aujourd'hui.", author: "Franklin D. Roosevelt", tags: ["doubt", "tomorrow"] },
  { en: "In the middle of difficulty lies opportunity.", fr: "Au milieu de la difficulté se trouve l'opportunité.", author: "Albert Einstein", tags: ["difficulty", "opportunity"] },
  
  // 311-365: Mindset, persévérance & innovation
  { en: "Innovation distinguishes between a leader and a follower.", fr: "L'innovation distingue un leader d'un suiveur.", author: "Steve Jobs", tags: ["innovation", "leadership"] },
  { en: "Stay hungry, stay foolish.", fr: "Restez affamés, restez fous.", author: "Steve Jobs", tags: ["hunger", "foolishness"] },
  { en: "Whether you think you can or think you can't, you're right.", fr: "Que vous pensiez pouvoir ou ne pas pouvoir, vous avez raison.", author: "Henry Ford", tags: ["mindset", "belief"] },
  { en: "Failure is the opportunity to begin again more intelligently.", fr: "L'échec est l'opportunité de recommencer de manière plus intelligente.", author: "Henry Ford", tags: ["failure", "opportunity"] },
  { en: "If I had asked people what they wanted, they would have said faster horses.", fr: "Si j'avais demandé aux gens ce qu'ils voulaient, ils m'auraient répondu des chevaux plus rapides.", author: "Henry Ford", tags: ["innovation", "customers"] },
  { en: "You miss 100% of the shots you don't take.", fr: "Vous ratez 100% des tirs que vous ne tentez pas.", author: "Wayne Gretzky", tags: ["action", "trying"] },
  { en: "The only way to do great work is to love what you do.", fr: "La seule façon de faire un excellent travail est d'aimer ce que vous faites.", author: "Steve Jobs", tags: ["work", "love"] },
  { en: "Your time is limited, so don't waste it living someone else's life.", fr: "Votre temps est limité, alors ne le gaspillez pas en vivant la vie de quelqu'un d'autre.", author: "Steve Jobs", tags: ["time", "life"] },
  { en: "We're here to put a dent in the universe.", fr: "Nous sommes ici pour faire une entaille dans l'univers.", author: "Steve Jobs", tags: ["impact", "universe"] },
  { en: "Sometimes life hits you in the head with a brick. Don't lose faith.", fr: "Parfois la vie vous frappe à la tête avec une brique. Ne perdez pas la foi.", author: "Steve Jobs", tags: ["faith", "hardship"] },
  { en: "Have the courage to follow your heart and intuition.", fr: "Ayez le courage de suivre votre cœur et votre intuition.", author: "Steve Jobs", tags: ["courage", "intuition"] },
  { en: "Talent wins games, but teamwork and intelligence wins championships.", fr: "Le talent gagne des matchs, mais le travail d'équipe et l'intelligence gagnent des championnats.", author: "Michael Jordan", tags: ["teamwork", "talent"] },
  { en: "Sooner or later, those who win are those who think they can.", fr: "Tôt ou tard, ceux qui gagnent sont ceux qui pensent qu'ils peuvent.", author: "Paul Tournier", tags: ["winning", "belief"] },
  { en: "Believe you can and you're halfway there.", fr: "Croyez que vous pouvez et vous êtes à mi-chemin.", author: "Theodore Roosevelt", tags: ["belief", "progress"] },
  { en: "Act as if what you do makes a difference. It does.", fr: "Agissez comme si ce que vous faites faisait une différence. C'est le cas.", author: "William James", tags: ["action", "difference"] },
  { en: "Success usually comes to those who are too busy to be looking for it.", fr: "Le succès vient généralement à ceux qui sont trop occupés pour le chercher.", author: "Henry David Thoreau", tags: ["success", "busy"] },
  { en: "Don't be pushed around by the fears in your mind.", fr: "Ne vous laissez pas bousculer par les peurs dans votre esprit.", author: "Roy T. Bennett", tags: ["fear", "mind"] },
  { en: "If everyone is moving forward together, then success takes care of itself.", fr: "Si tout le monde avance ensemble, alors le succès se prend en charge lui-même.", author: "Henry Ford", tags: ["teamwork", "success"] },
  { en: "Intelligence is the ability to adapt to change.", fr: "L'intelligence est la capacité de s'adapter au changement.", author: "Stephen Hawking", tags: ["intelligence", "change"] },
  { en: "Failure is not fatal, but failure to change might be.", fr: "L'échec n'est pas fatal, mais l'échec à changer pourrait l'être.", author: "John Wooden", tags: ["failure", "change"] },
  { en: "Perfection is not attainable, but if we chase perfection we can catch excellence.", fr: "La perfection n'est pas atteignable, mais si nous poursuivons la perfection, nous pouvons attraper l'excellence.", author: "Vince Lombardi", tags: ["perfection", "excellence"] },
  { en: "All things are created twice; first mentally; then physically.", fr: "Toutes les choses sont créées deux fois ; d'abord mentalement ; puis physiquement.", author: "Stephen Covey", tags: ["creation", "mental"] },
  { en: "Even if you are on the right track, you will get run over if you just sit there.", fr: "Même si vous êtes sur la bonne voie, vous vous ferez écraser si vous restez simplement assis là.", author: "Will Rogers", tags: ["action", "progress"] },
  { en: "The only person you are destined to become is the person you decide to be.", fr: "La seule personne que vous êtes destiné à devenir est la personne que vous décidez d'être.", author: "Ralph Waldo Emerson", tags: ["destiny", "decision"] },
  { en: "The best way out is always through.", fr: "La meilleure issue est toujours de traverser.", author: "Robert Frost", tags: ["perseverance", "through"] },
  { en: "Courage is essential in a management context and, above all, in leadership.", fr: "Le courage est essentiel dans un contexte de gestion et, surtout, dans le leadership.", author: "Mitta Xinindlu", tags: ["courage", "leadership"] },
  { en: "Every project is an opportunity to learn, to figure out problems and challenges.", fr: "Chaque projet est une opportunité d'apprendre, de comprendre les problèmes et les défis.", author: "David Rockwell", tags: ["learning", "projects"] },
  { en: "Being a Project Manager is like being an artist.", fr: "Être chef de projet, c'est comme être un artiste.", author: "Greg Cimmarrusti", tags: ["project-manager", "artist"] },
  { en: "Management must manage!", fr: "La direction doit diriger !", author: "Harold Geneen", tags: ["management", "action"] },
  { en: "Plans are only good intentions unless they immediately degenerate into hard work.", fr: "Les plans ne sont que de bonnes intentions à moins qu'ils ne dégénèrent immédiatement en travail acharné.", author: "Peter Drucker", tags: ["plans", "work"] },
  { en: "Luck is not a factor. Hope is not a strategy.", fr: "La chance n'est pas un facteur. L'espoir n'est pas une stratégie.", author: "James Cameron", tags: ["luck", "hope"] },
  { en: "The people who are crazy enough to think they can change the world are the ones who do.", fr: "Les gens qui sont assez fous pour penser qu'ils peuvent changer le monde sont ceux qui le font.", author: "Steve Jobs", tags: ["crazy", "change"] },
  { en: "Design is how it works.", fr: "Le design c'est comment ça fonctionne.", author: "Steve Jobs", tags: ["design", "function"] },
  { en: "Simplicity is the ultimate sophistication.", fr: "La simplicité est la sophistication ultime.", author: "Leonardo da Vinci", tags: ["simplicity", "sophistication"] },
  { en: "Quality is more important than quantity.", fr: "La qualité est plus importante que la quantité.", author: "Steve Jobs", tags: ["quality", "quantity"] },
  { en: "I'm convinced that about half of what separates the successful entrepreneurs from the non-successful ones is pure perseverance.", fr: "Je suis convaincu qu'environ la moitié de ce qui sépare les entrepreneurs qui réussissent de ceux qui ne réussissent pas est la pure persévérance.", author: "Steve Jobs", tags: ["perseverance", "success"] },
  { en: "If you really look closely, most overnight successes took a long time.", fr: "Si vous regardez vraiment de près, la plupart des succès du jour au lendemain ont pris beaucoup de temps.", author: "Steve Jobs", tags: ["success", "time"] },
  { en: "Your work is going to fill a large part of your life.", fr: "Votre travail va occuper une grande partie de votre vie.", author: "Steve Jobs", tags: ["work", "life"] },
  { en: "Expect the best, plan for the worst, and prepare to be surprised.", fr: "Attendez-vous au meilleur, prévoyez le pire et préparez-vous à être surpris.", author: "Denis Waitley", tags: ["planning", "surprise"] },
  { en: "It's a bad plan that admits of no modification.", fr: "C'est un mauvais plan qui n'admet aucune modification.", author: "Publilius Syrus", tags: ["planning", "flexibility"] },
  { en: "Let our advance worrying become advance thinking and planning.", fr: "Que notre inquiétude anticipée devienne réflexion et planification anticipées.", author: "Winston Churchill", tags: ["planning", "worry"] },
  { en: "Operations keeps the lights on, strategy provides a light at the end of the tunnel.", fr: "Les opérations maintiennent les lumières allumées, la stratégie fournit une lumière au bout du tunnel.", author: "Joy Gumz", tags: ["operations", "strategy"] },
  { en: "All progress depends on the unreasonable man.", fr: "Tout progrès dépend de l'homme déraisonnable.", author: "George Bernard Shaw", tags: ["progress", "unreasonable"] },
  { en: "The reasonable man adapts himself to the world… the unreasonable one persists.", fr: "L'homme raisonnable s'adapte au monde... l'homme déraisonnable persiste.", author: "George Bernard Shaw", tags: ["reasonable", "persistence"] },
  { en: "Nothing great was ever achieved without enthusiasm.", fr: "Rien de grand n'a jamais été réalisé sans enthousiasme.", author: "Ralph Waldo Emerson", tags: ["enthusiasm", "greatness"] },
  { en: "Energy and persistence conquer all things.", fr: "L'énergie et la persévérance conquièrent toutes choses.", author: "Benjamin Franklin", tags: ["energy", "persistence"] },
  { en: "The secret of getting ahead is getting started.", fr: "Le secret pour avancer est de commencer.", author: "Mark Twain", tags: ["start", "ahead"] },
  { en: "Do or do not. There is no try.", fr: "Fais ou ne fais pas. Il n'y a pas d'essai.", author: "Yoda", tags: ["action", "commitment"] },
  { en: "May the force be with you.", fr: "Que la force soit avec vous.", author: "Star Wars", tags: ["force", "blessing"] }
];

export default function DailyQuote({ lang = "fr", blockerCount = 0, riskCount = 0, patterns = [] }) {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Récupère l'historique des quotes affichées depuis localStorage
  const getQuoteHistory = () => {
    try {
      const stored = localStorage.getItem('quoteHistory24h');
      if (!stored) return {};
      
      const history = JSON.parse(stored);
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      // Nettoie les entrées de plus de 24h
      const filtered = {};
      Object.entries(history).forEach(([quoteKey, timestamps]) => {
        const recent = timestamps.filter(t => now - t < oneDayMs);
        if (recent.length > 0) {
          filtered[quoteKey] = recent;
        }
      });
      
      return filtered;
    } catch (error) {
      console.error('Error reading quote history:', error);
      return {};
    }
  };

  // Ajoute une quote à l'historique
  const addToQuoteHistory = (quoteKey) => {
    try {
      const history = getQuoteHistory();
      if (!history[quoteKey]) {
        history[quoteKey] = [];
      }
      history[quoteKey].push(Date.now());
      localStorage.setItem('quoteHistory24h', JSON.stringify(history));
    } catch (error) {
      console.error('Error updating quote history:', error);
    }
  };

  // Vérifie si une quote a été affichée plus de 2 fois en 24h
  const canDisplayQuote = (quoteKey) => {
    const history = getQuoteHistory();
    const count = history[quoteKey]?.length || 0;
    return count < 2;
  };

  // Génère une clé unique pour une quote
  const getQuoteKey = (quote) => {
    return `${quote.en}_${quote.author}`.replace(/\s+/g, '_');
  };

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