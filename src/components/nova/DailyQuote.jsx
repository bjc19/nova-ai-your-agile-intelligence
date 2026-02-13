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
  { en: "Launch early, iterate often.", fr: "Lancez tôt, itérez souvent.", author: "Reid Hoffman", tags: ["launch", "iteration"] },
  { en: "Fail fast, fail cheap, fail forward.", fr: "Échouez vite, échouez à moindre coût, échouez vers l'avant.", author: "Reid Hoffman", tags: ["failure", "learning"] },
  { en: "Speed is the new currency of business.", fr: "La vitesse est la nouvelle monnaie des affaires.", author: "Anon", tags: ["speed", "business"] },
  { en: "Move fast and break things.", fr: "Avancez vite et cassez des choses.", author: "Mark Zuckerberg", tags: ["speed", "innovation"] },
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
  { en: "Ship it like it's hot.", fr: "Livrez-le comme si c'était chaud.", author: "Anon", tags: ["shipping", "speed"] },
  { en: "Early birds get the feedback.", fr: "Les lève-tôt obtiennent les retours.", author: "Anon", tags: ["early", "feedback"] },
  { en: "Launch today, fix tomorrow.", fr: "Lancez aujourd'hui, corrigez demain.", author: "Anon", tags: ["launch", "iteration"] },
  { en: "Imperfect action beats perfect inaction.", fr: "L'action imparfaite bat l'inaction parfaite.", author: "Anon", tags: ["action", "perfection"] },
  { en: "Release early, release often, listen to feedback.", fr: "Publiez tôt, publiez souvent, écoutez les retours.", author: "Eric S. Raymond", tags: ["release", "feedback"] },
  { en: "Fast beats slow every time.", fr: "Le rapide bat le lent à chaque fois.", author: "Anon", tags: ["speed"] },
  { en: "Learning velocity is the only sustainable advantage.", fr: "La vélocité d'apprentissage est le seul avantage durable.", author: "Anon", tags: ["learning", "velocity"] },
  { en: "Ship or sink.", fr: "Livrez ou coulez.", author: "Anon", tags: ["shipping", "survival"] },
  { en: "The only way to go fast is to go well.", fr: "La seule façon d'aller vite est d'aller bien.", author: "Robert C. Martin", tags: ["quality", "speed"] },
  { en: "Perfection is achieved when there is nothing left to take away.", fr: "La perfection est atteinte quand il n'y a plus rien à enlever.", author: "Antoine de Saint-Exupéry", tags: ["perfection", "simplicity"] },
  { en: "Continuous attention to technical excellence and good design enhances agility.", fr: "L'attention continue à l'excellence technique et au bon design améliore l'agilité.", author: "Agile Manifesto", tags: ["quality", "agility"] },
  { en: "It always takes longer than you expect, even when you take into account Hofstadter's Law.", fr: "Ça prend toujours plus de temps que prévu, même quand on tient compte de la loi de Hofstadter.", author: "Douglas Hofstadter", tags: ["time", "estimation"] },
  { en: "Adding manpower to a late software project makes it later.", fr: "Ajouter de la main-d'œuvre à un projet en retard le retarde davantage.", author: "Fred Brooks", tags: ["resources", "delay"] },
  { en: "Work expands so as to fill the time available for its completion.", fr: "Le travail s'étend pour remplir le temps disponible pour son achèvement.", author: "C. Northcote Parkinson", tags: ["time", "scope"] },
  { en: "If anything can go wrong, it will.", fr: "Si quelque chose peut mal tourner, ça le fera.", author: "Edward A. Murphy Jr.", tags: ["risk", "murphy"] },
  { en: "Organizations which design systems produce designs which are copies of the communication structures.", fr: "Les organisations qui conçoivent des systèmes produisent des conceptions qui sont des copies de leurs structures de communication.", author: "Melvin E. Conway", tags: ["organization", "design"] },
  { en: "A bad idea executed to perfection is still a bad idea.", fr: "Une mauvaise idée exécutée à la perfection reste une mauvaise idée.", author: "Norman Augustine", tags: ["ideas", "execution"] },
  { en: "There is nothing so useless as doing efficiently that which should not be done at all.", fr: "Il n'y a rien d'aussi inutile que de faire efficacement ce qui ne devrait pas être fait du tout.", author: "Peter Drucker", tags: ["efficiency", "priority"] },
  { en: "Clean code always looks like it was written by someone who cares.", fr: "Le code propre semble toujours avoir été écrit par quelqu'un qui s'en soucie.", author: "Robert C. Martin", tags: ["quality", "care"] },
  { en: "Simplicity is prerequisite for reliability.", fr: "La simplicité est un prérequis pour la fiabilité.", author: "Edsger W. Dijkstra", tags: ["simplicity", "reliability"] },
  { en: "Premature optimization is the root of all evil.", fr: "L'optimisation prématurée est la racine de tous les maux.", author: "Donald Knuth", tags: ["optimization", "timing"] },
  { en: "Make it work, make it right, make it fast.", fr: "Faites-le fonctionner, faites-le bien, faites-le rapide.", author: "Kent Beck", tags: ["quality", "process"] },
  { en: "First, solve the problem. Then, write the code.", fr: "D'abord, résolvez le problème. Ensuite, écrivez le code.", author: "John Johnson", tags: ["problem", "solution"] },
  { en: "Code is like humor. When you have to explain it, it's bad.", fr: "Le code est comme l'humour. Quand vous devez l'expliquer, c'est mauvais.", author: "Cory House", tags: ["code", "clarity"] },
  { en: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", fr: "N'importe quel idiot peut écrire du code qu'un ordinateur peut comprendre. Les bons programmeurs écrivent du code que les humains peuvent comprendre.", author: "Martin Fowler", tags: ["code", "readability"] },
  { en: "Weeks of coding can save you hours of planning.", fr: "Des semaines de codage peuvent vous épargner des heures de planification.", author: "Anon", tags: ["planning", "coding"] },
  { en: "The most expensive blocker is the one nobody talks about.", fr: "Le blocage le plus coûteux est celui dont personne ne parle.", author: "Anon", tags: ["blockers", "communication"] },
  { en: "Risks seen early are opportunities for innovation.", fr: "Les risques détectés tôt sont des opportunités d'innovation.", author: "Anon", tags: ["risks", "opportunity"] },
  { en: "A problem well stated is a problem half solved.", fr: "Un problème bien énoncé est un problème à moitié résolu.", author: "Charles Kettering", tags: ["problem", "clarity"] },
  { en: "The best code is no code at all.", fr: "Le meilleur code est pas de code du tout.", author: "Jeff Atwood", tags: ["simplicity", "code"] },
  { en: "Technical debt is like a loan: it accrues interest.", fr: "La dette technique est comme un prêt : elle accumule des intérêts.", author: "Ward Cunningham", tags: ["debt", "technical"] },
  { en: "You can't improve what you don't measure.", fr: "Vous ne pouvez pas améliorer ce que vous ne mesurez pas.", author: "Peter Drucker", tags: ["metrics", "improvement"] },
  { en: "Culture eats strategy for breakfast.", fr: "La culture mange la stratégie au petit-déjeuner.", author: "Peter Drucker", tags: ["culture", "strategy"] },
  { en: "If you can't explain it simply, you don't understand it well enough.", fr: "Si vous ne pouvez pas l'expliquer simplement, vous ne le comprenez pas assez bien.", author: "Albert Einstein", tags: ["simplicity", "understanding"] },
  { en: "The worst enemy of a good plan is the dream of a perfect plan.", fr: "Le pire ennemi d'un bon plan est le rêve d'un plan parfait.", author: "Carl von Clausewitz", tags: ["planning", "perfection"] },
  { en: "Simplicity is the ultimate sophistication.", fr: "La simplicité est la sophistication ultime.", author: "Leonardo da Vinci", tags: ["simplicity"] },
  { en: "Good judgment comes from experience, and experience comes from bad judgment.", fr: "Le bon jugement vient de l'expérience, et l'expérience vient du mauvais jugement.", author: "Fred Brooks", tags: ["experience", "learning"] },
  { en: "Inspect what you expect.", fr: "Inspectez ce que vous attendez.", author: "W. Edwards Deming", tags: ["inspection", "quality"] },
  { en: "Quality is never an accident; it is always the result of intelligent effort.", fr: "La qualité n'est jamais un accident ; c'est toujours le résultat d'un effort intelligent.", author: "John Ruskin", tags: ["quality", "effort"] },
  { en: "Without data, you're just another person with an opinion.", fr: "Sans données, vous êtes juste une autre personne avec une opinion.", author: "W. Edwards Deming", tags: ["data", "opinion"] },
  { en: "People don't want to buy a quarter-inch drill, they want a quarter-inch hole.", fr: "Les gens ne veulent pas acheter une perceuse d'un quart de pouce, ils veulent un trou d'un quart de pouce.", author: "Theodore Levitt", tags: ["customer", "needs"] },
  { en: "Ideas are easy. Implementation is hard.", fr: "Les idées sont faciles. La mise en œuvre est difficile.", author: "Guy Kawasaki", tags: ["ideas", "execution"] },
  { en: "The best time to plant a tree was 20 years ago. The second best time is now.", fr: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.", author: "Chinese Proverb", tags: ["start", "timing"] },
  { en: "Don't find customers for your products, find products for your customers.", fr: "Ne cherchez pas de clients pour vos produits, cherchez des produits pour vos clients.", author: "Seth Godin", tags: ["customer", "product"] },
  { en: "Your most unhappy customers are your greatest source of learning.", fr: "Vos clients les plus mécontents sont votre plus grande source d'apprentissage.", author: "Bill Gates", tags: ["customer", "learning"] },
  { en: "Strive for progress, not perfection.", fr: "Visez le progrès, pas la perfection.", author: "Anon", tags: ["progress", "perfection"] },
  { en: "The bottleneck is always at the top of the bottle.", fr: "Le goulot d'étranglement est toujours en haut de la bouteille.", author: "Peter Drucker", tags: ["leadership", "bottleneck"] },
  { en: "What gets measured gets managed.", fr: "Ce qui est mesuré est géré.", author: "Peter Drucker", tags: ["metrics", "management"] },
  { en: "Focus is about saying no.", fr: "La concentration consiste à dire non.", author: "Steve Jobs", tags: ["focus", "priority"] },
  { en: "Stay hungry, stay foolish.", fr: "Restez affamé, restez fou.", author: "Steve Jobs", tags: ["ambition", "innovation"] },
  { en: "Innovation distinguishes between a leader and a follower.", fr: "L'innovation distingue un leader d'un suiveur.", author: "Steve Jobs", tags: ["innovation", "leadership"] },
  { en: "Simple can be harder than complex.", fr: "Le simple peut être plus difficile que le complexe.", author: "Steve Jobs", tags: ["simplicity", "complexity"] },
  { en: "Design is not just what it looks like, design is how it works.", fr: "Le design n'est pas seulement ce à quoi ça ressemble, le design c'est comment ça fonctionne.", author: "Steve Jobs", tags: ["design", "function"] },
  { en: "The customer's perception is your reality.", fr: "La perception du client est votre réalité.", author: "Kate Zabriskie", tags: ["customer", "perception"] },
  { en: "Fail often so you can succeed sooner.", fr: "Échouez souvent pour réussir plus tôt.", author: "Tom Kelley", tags: ["failure", "learning"] },
  { en: "Don't worry about failure; you only have to be right once.", fr: "Ne vous inquiétez pas de l'échec ; vous n'avez qu'à avoir raison une fois.", author: "Drew Houston", tags: ["failure", "success"] },
  { en: "Move fast with stable infra.", fr: "Avancez vite avec une infra stable.", author: "Mark Zuckerberg", tags: ["speed", "stability"] },
  { en: "Data beats opinions.", fr: "Les données battent les opinions.", author: "Jim Barksdale", tags: ["data", "decision"] },
  { en: "Strong opinions, weakly held.", fr: "Opinions fortes, faiblement maintenues.", author: "Paul Saffo", tags: ["opinion", "flexibility"] },
  { en: "Think big, start small, move fast.", fr: "Pensez grand, commencez petit, avancez vite.", author: "Anon", tags: ["vision", "execution"] },
  { en: "Execution is everything.", fr: "L'exécution est tout.", author: "Anon", tags: ["execution"] },
  { en: "The devil is in the details.", fr: "Le diable est dans les détails.", author: "Anon", tags: ["details", "quality"] },
  { en: "Good artists copy, great artists steal.", fr: "Les bons artistes copient, les grands artistes volent.", author: "Pablo Picasso", tags: ["innovation", "inspiration"] },
  { en: "Simplicity is about subtracting the obvious and adding the meaningful.", fr: "La simplicité consiste à soustraire l'évident et à ajouter le significatif.", author: "John Maeda", tags: ["simplicity", "meaning"] },
  { en: "Constraints liberate, liberties constrain.", fr: "Les contraintes libèrent, les libertés contraignent.", author: "Ruben Pater", tags: ["constraints", "creativity"] },
  { en: "Make mistakes faster.", fr: "Faites des erreurs plus rapidement.", author: "Andy Grove", tags: ["mistakes", "speed"] },
  { en: "The cost of being wrong is less than the cost of doing nothing.", fr: "Le coût d'avoir tort est inférieur au coût de ne rien faire.", author: "Seth Godin", tags: ["action", "risk"] },
  { en: "If you're not growing, you're dying.", fr: "Si vous ne grandissez pas, vous mourrez.", author: "Tony Robbins", tags: ["growth", "stagnation"] },
  { en: "The way to get started is to quit talking and begin doing.", fr: "La façon de commencer est d'arrêter de parler et de commencer à faire.", author: "Walt Disney", tags: ["start", "action"] },
  { en: "Problems are not stop signs, they are guidelines.", fr: "Les problèmes ne sont pas des panneaux d'arrêt, ce sont des lignes directrices.", author: "Robert H. Schuller", tags: ["problems", "guidance"] },
  { en: "A year from now you may wish you had started today.", fr: "Dans un an, vous souhaiterez peut-être avoir commencé aujourd'hui.", author: "Karen Lamb", tags: ["start", "timing"] },
  { en: "Don't let perfect be the enemy of good.", fr: "Ne laissez pas le parfait être l'ennemi du bien.", author: "Voltaire", tags: ["perfection", "good"] },
  { en: "Every expert was once a beginner.", fr: "Chaque expert était autrefois un débutant.", author: "Helen Hayes", tags: ["learning", "growth"] },
  { en: "Action is the foundational key to all success.", fr: "L'action est la clé fondamentale de tout succès.", author: "Pablo Picasso", tags: ["action", "success"] },
  { en: "You miss 100% of the shots you don't take.", fr: "Vous ratez 100% des tirs que vous ne prenez pas.", author: "Wayne Gretzky", tags: ["action", "opportunity"] },
  { en: "The secret of getting ahead is getting started.", fr: "Le secret pour avancer est de commencer.", author: "Mark Twain", tags: ["start"] },
  { en: "Don't wait for opportunity, create it.", fr: "N'attendez pas l'opportunité, créez-la.", author: "George Bernard Shaw", tags: ["opportunity", "action"] },
  { en: "Success is the sum of small efforts repeated day in and day out.", fr: "Le succès est la somme de petits efforts répétés jour après jour.", author: "Robert Collier", tags: ["consistency", "effort"] },
  { en: "Fall seven times, stand up eight.", fr: "Tombez sept fois, relevez-vous huit.", author: "Japanese Proverb", tags: ["resilience", "persistence"] },
  { en: "Everything you've ever wanted is on the other side of fear.", fr: "Tout ce que vous avez toujours voulu est de l'autre côté de la peur.", author: "George Addair", tags: ["fear", "courage"] },
  { en: "Dream big, start small, but most of all, start.", fr: "Rêvez grand, commencez petit, mais surtout, commencez.", author: "Simon Sinek", tags: ["start", "vision"] },
  { en: "Clarity precedes success.", fr: "La clarté précède le succès.", author: "Robin Sharma", tags: ["clarity", "success"] },
  { en: "Strategy without tactics is the slowest route to victory.", fr: "La stratégie sans tactique est la route la plus lente vers la victoire.", author: "Sun Tzu", tags: ["strategy", "tactics"] },
  { en: "If you can't measure it, you can't improve it.", fr: "Si vous ne pouvez pas le mesurer, vous ne pouvez pas l'améliorer.", author: "Peter Drucker", tags: ["metrics", "improvement"] },
  { en: "Don't be afraid to give up the good to go for the great.", fr: "N'ayez pas peur d'abandonner le bien pour aller vers le génial.", author: "John D. Rockefeller", tags: ["ambition", "improvement"] },
  { en: "The best revenge is massive success.", fr: "La meilleure revanche est un succès massif.", author: "Frank Sinatra", tags: ["success", "motivation"] },
  { en: "Only those who risk going too far can possibly find out how far one can go.", fr: "Seuls ceux qui risquent d'aller trop loin peuvent découvrir jusqu'où on peut aller.", author: "T.S. Eliot", tags: ["risk", "exploration"] },
  { en: "Do one thing every day that scares you.", fr: "Faites une chose chaque jour qui vous effraie.", author: "Eleanor Roosevelt", tags: ["courage", "growth"] },
  { en: "Believe you can and you're halfway there.", fr: "Croyez que vous pouvez et vous êtes à mi-chemin.", author: "Theodore Roosevelt", tags: ["belief", "mindset"] },
  { en: "Start where you are. Use what you have. Do what you can.", fr: "Commencez où vous êtes. Utilisez ce que vous avez. Faites ce que vous pouvez.", author: "Arthur Ashe", tags: ["start", "resources"] },
  { en: "Don't count the days, make the days count.", fr: "Ne comptez pas les jours, faites que les jours comptent.", author: "Muhammad Ali", tags: ["time", "impact"] },
  { en: "The harder you work for something, the greater you'll feel when you achieve it.", fr: "Plus vous travaillez dur pour quelque chose, mieux vous vous sentirez quand vous l'atteindrez.", author: "Anon", tags: ["effort", "achievement"] },
  { en: "Success is walking from failure to failure with no loss of enthusiasm.", fr: "Le succès consiste à passer d'échec en échec sans perte d'enthousiasme.", author: "Winston Churchill", tags: ["failure", "persistence"] },
  { en: "The only limit to our realization of tomorrow will be our doubts of today.", fr: "La seule limite à notre réalisation de demain sera nos doutes d'aujourd'hui.", author: "Franklin D. Roosevelt", tags: ["doubt", "potential"] },
  { en: "It's not about ideas. It's about making ideas happen.", fr: "Ce n'est pas une question d'idées. C'est une question de concrétiser les idées.", author: "Scott Belsky", tags: ["ideas", "execution"] },
  { en: "Challenges are what make life interesting; overcoming them is what makes life meaningful.", fr: "Les défis rendent la vie intéressante ; les surmonter rend la vie significative.", author: "Joshua J. Marine", tags: ["challenges", "meaning"] },
  { en: "In the middle of difficulty lies opportunity.", fr: "Au milieu de la difficulté se trouve l'opportunité.", author: "Albert Einstein", tags: ["difficulty", "opportunity"] },
  { en: "The expert in anything was once a beginner.", fr: "L'expert en quoi que ce soit était autrefois un débutant.", author: "Helen Hayes", tags: ["expertise", "learning"] },
  { en: "Ideas don't come out fully formed. They only become clear as you work on them.", fr: "Les idées ne sortent pas entièrement formées. Elles ne deviennent claires qu'en travaillant dessus.", author: "Mark Zuckerberg", tags: ["ideas", "work"] },
  { en: "Be stubborn on vision but flexible on details.", fr: "Soyez têtu sur la vision mais flexible sur les détails.", author: "Jeff Bezos", tags: ["vision", "flexibility"] },
  { en: "The biggest risk is not taking any risk.", fr: "Le plus grand risque est de ne prendre aucun risque.", author: "Mark Zuckerberg", tags: ["risk", "safety"] },
  { en: "Your work is going to fill a large part of your life, so do what you love.", fr: "Votre travail va remplir une grande partie de votre vie, alors faites ce que vous aimez.", author: "Steve Jobs", tags: ["passion", "work"] },
  { en: "Don't be busy, be productive.", fr: "Ne soyez pas occupé, soyez productif.", author: "Anon", tags: ["productivity", "focus"] },
  { en: "The distance between your dreams and reality is called action.", fr: "La distance entre vos rêves et la réalité s'appelle l'action.", author: "Anon", tags: ["dreams", "action"] },
  { en: "Stop managing your time. Start managing your focus.", fr: "Arrêtez de gérer votre temps. Commencez à gérer votre concentration.", author: "Robin Sharma", tags: ["focus", "time"] },
  { en: "Success doesn't come from what you do occasionally, it comes from what you do consistently.", fr: "Le succès ne vient pas de ce que vous faites occasionnellement, il vient de ce que vous faites régulièrement.", author: "Marie Forleo", tags: ["consistency", "success"] },
  { en: "The way to get started is to quit talking and begin doing.", fr: "La façon de commencer est d'arrêter de parler et de commencer à faire.", author: "Walt Disney", tags: ["start", "action"] },
  { en: "Don't be intimidated by what you don't know. That can be your greatest strength.", fr: "Ne soyez pas intimidé par ce que vous ne savez pas. Cela peut être votre plus grande force.", author: "Sara Blakely", tags: ["knowledge", "strength"] },
  { en: "Overthinking is the biggest cause of unhappiness.", fr: "La réflexion excessive est la plus grande cause du malheur.", author: "Anon", tags: ["overthinking", "action"] },
  { en: "Do not wait to strike till the iron is hot; but make it hot by striking.", fr: "N'attendez pas que le fer soit chaud pour frapper ; rendez-le chaud en frappant.", author: "William Butler Yeats", tags: ["action", "timing"] },
  { en: "A goal without a plan is just a wish.", fr: "Un objectif sans plan est juste un souhait.", author: "Antoine de Saint-Exupéry", tags: ["goals", "planning"] },
  { en: "The best way to predict the future is to create it.", fr: "La meilleure façon de prédire l'avenir est de le créer.", author: "Peter Drucker", tags: ["future", "creation"] },
  { en: "Opportunities don't happen. You create them.", fr: "Les opportunités n'arrivent pas. Vous les créez.", author: "Chris Grosser", tags: ["opportunity", "creation"] },
  { en: "Failure is not the opposite of success, it's part of success.", fr: "L'échec n'est pas le contraire du succès, il fait partie du succès.", author: "Arianna Huffington", tags: ["failure", "success"] },
  { en: "The difference between ordinary and extraordinary is that little extra.", fr: "La différence entre ordinaire et extraordinaire, c'est ce petit plus.", author: "Jimmy Johnson", tags: ["excellence", "effort"] },
  { en: "Don't let yesterday take up too much of today.", fr: "Ne laissez pas hier prendre trop de place aujourd'hui.", author: "Will Rogers", tags: ["past", "present"] },
  { en: "You don't have to be great to start, but you have to start to be great.", fr: "Vous n'avez pas besoin d'être génial pour commencer, mais vous devez commencer pour être génial.", author: "Zig Ziglar", tags: ["start", "greatness"] },
  { en: "The future belongs to those who believe in the beauty of their dreams.", fr: "L'avenir appartient à ceux qui croient en la beauté de leurs rêves.", author: "Eleanor Roosevelt", tags: ["future", "dreams"] },
  { en: "It does not matter how slowly you go as long as you do not stop.", fr: "Peu importe la lenteur avec laquelle vous allez tant que vous ne vous arrêtez pas.", author: "Confucius", tags: ["persistence", "progress"] },
  { en: "Everything you can imagine is real.", fr: "Tout ce que vous pouvez imaginer est réel.", author: "Pablo Picasso", tags: ["imagination", "possibility"] },
  { en: "If you want to lift yourself up, lift up someone else.", fr: "Si vous voulez vous élever, élevez quelqu'un d'autre.", author: "Booker T. Washington", tags: ["help", "growth"] },
  { en: "The mind is everything. What you think you become.", fr: "L'esprit est tout. Ce que vous pensez, vous le devenez.", author: "Buddha", tags: ["mindset", "belief"] },
  { en: "Whether you think you can or you think you can't, you're right.", fr: "Que vous pensiez pouvoir ou ne pas pouvoir, vous avez raison.", author: "Henry Ford", tags: ["belief", "mindset"] },
  { en: "Life is 10% what happens to you and 90% how you react to it.", fr: "La vie est à 10% ce qui vous arrive et à 90% comment vous y réagissez.", author: "Charles R. Swindoll", tags: ["attitude", "response"] },
  { en: "Change your thoughts and you change your world.", fr: "Changez vos pensées et vous changerez votre monde.", author: "Norman Vincent Peale", tags: ["thoughts", "change"] },
  { en: "The only person you are destined to become is the person you decide to be.", fr: "La seule personne que vous êtes destiné à devenir est la personne que vous décidez d'être.", author: "Ralph Waldo Emerson", tags: ["destiny", "choice"] },
  { en: "Go confidently in the direction of your dreams. Live the life you have imagined.", fr: "Allez avec confiance dans la direction de vos rêves. Vivez la vie que vous avez imaginée.", author: "Henry David Thoreau", tags: ["dreams", "confidence"] },
  { en: "Believe in yourself and all that you are.", fr: "Croyez en vous-même et en tout ce que vous êtes.", author: "Christian D. Larson", tags: ["belief", "self"] },
  { en: "The only impossible journey is the one you never begin.", fr: "Le seul voyage impossible est celui que vous ne commencez jamais.", author: "Tony Robbins", tags: ["journey", "start"] },
  { en: "Weak people revenge. Strong people forgive. Intelligent people ignore.", fr: "Les gens faibles se vengent. Les gens forts pardonnent. Les gens intelligents ignorent.", author: "Albert Einstein", tags: ["strength", "intelligence"] },
  { en: "If you tell the truth, you don't have to remember anything.", fr: "Si vous dites la vérité, vous n'avez rien à retenir.", author: "Mark Twain", tags: ["truth", "honesty"] },
  { en: "A person who never made a mistake never tried anything new.", fr: "Une personne qui n'a jamais fait d'erreur n'a jamais rien essayé de nouveau.", author: "Albert Einstein", tags: ["mistakes", "innovation"] },
  { en: "The successful warrior is the average man, with laser-like focus.", fr: "Le guerrier qui réussit est l'homme moyen, avec une concentration laser.", author: "Bruce Lee", tags: ["focus", "success"] },
  { en: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", fr: "Savoir ne suffit pas ; nous devons appliquer. Souhaiter ne suffit pas ; nous devons faire.", author: "Johann Wolfgang von Goethe", tags: ["action", "knowledge"] },
  { en: "Do what you can, with what you have, where you are.", fr: "Faites ce que vous pouvez, avec ce que vous avez, là où vous êtes.", author: "Theodore Roosevelt", tags: ["action", "resources"] },
  { en: "You are never too old to set another goal or to dream a new dream.", fr: "Vous n'êtes jamais trop vieux pour fixer un nouvel objectif ou rêver un nouveau rêve.", author: "C.S. Lewis", tags: ["goals", "dreams"] },
  { en: "To live a creative life, we must lose our fear of being wrong.", fr: "Pour vivre une vie créative, nous devons perdre notre peur d'avoir tort.", author: "Joseph Chilton Pearce", tags: ["creativity", "fear"] },
  { en: "The greatest glory in living lies not in never falling, but in rising every time we fall.", fr: "La plus grande gloire dans la vie ne réside pas dans le fait de ne jamais tomber, mais de se relever à chaque fois que nous tombons.", author: "Nelson Mandela", tags: ["resilience", "glory"] },
  { en: "Many of life's failures are people who did not realize how close they were to success when they gave up.", fr: "Beaucoup d'échecs dans la vie sont des gens qui ne réalisaient pas à quel point ils étaient proches du succès lorsqu'ils ont abandonné.", author: "Thomas Edison", tags: ["persistence", "success"] },
  { en: "If you look at what you have in life, you'll always have more.", fr: "Si vous regardez ce que vous avez dans la vie, vous en aurez toujours plus.", author: "Oprah Winfrey", tags: ["gratitude", "abundance"] },
  { en: "The journey of a thousand miles begins with one step.", fr: "Le voyage de mille lieues commence par un pas.", author: "Lao Tzu", tags: ["journey", "start"] },
  { en: "That which does not kill us makes us stronger.", fr: "Ce qui ne nous tue pas nous rend plus fort.", author: "Friedrich Nietzsche", tags: ["strength", "resilience"] },
  { en: "Life is what happens when you're busy making other plans.", fr: "La vie est ce qui se passe quand vous êtes occupé à faire d'autres plans.", author: "John Lennon", tags: ["life", "planning"] },
  { en: "When you reach the end of your rope, tie a knot in it and hang on.", fr: "Quand vous atteignez le bout de votre corde, faites-y un nœud et tenez bon.", author: "Franklin D. Roosevelt", tags: ["persistence", "hope"] },
  { en: "Always remember that you are absolutely unique. Just like everyone else.", fr: "Rappelez-vous toujours que vous êtes absolument unique. Comme tout le monde.", author: "Margaret Mead", tags: ["uniqueness", "individuality"] },
  { en: "Don't judge each day by the harvest you reap but by the seeds that you plant.", fr: "Ne jugez pas chaque jour par la récolte que vous récoltez mais par les graines que vous plantez.", author: "Robert Louis Stevenson", tags: ["progress", "planting"] },
  { en: "The future belongs to those who prepare for it today.", fr: "L'avenir appartient à ceux qui s'y préparent aujourd'hui.", author: "Malcolm X", tags: ["future", "preparation"] },
  { en: "You can never cross the ocean until you have the courage to lose sight of the shore.", fr: "Vous ne pouvez jamais traverser l'océan jusqu'à ce que vous ayez le courage de perdre de vue le rivage.", author: "Christopher Columbus", tags: ["courage", "adventure"] },
  { en: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", fr: "J'ai appris que les gens oublieront ce que vous avez dit, les gens oublieront ce que vous avez fait, mais les gens n'oublieront jamais comment vous les avez fait se sentir.", author: "Maya Angelou", tags: ["impact", "emotion"] },
  { en: "Either you run the day, or the day runs you.", fr: "Soit vous dirigez la journée, soit la journée vous dirige.", author: "Jim Rohn", tags: ["control", "proactive"] },
  { en: "The two most important days in your life are the day you are born and the day you find out why.", fr: "Les deux jours les plus importants de votre vie sont le jour où vous êtes né et le jour où vous découvrez pourquoi.", author: "Mark Twain", tags: ["purpose", "life"] },
  { en: "Whatever you are, be a good one.", fr: "Quoi que vous soyez, soyez-en un bon.", author: "Abraham Lincoln", tags: ["excellence", "character"] },
  { en: "Your time is limited, don't waste it living someone else's life.", fr: "Votre temps est limité, ne le gaspillez pas à vivre la vie de quelqu'un d'autre.", author: "Steve Jobs", tags: ["time", "authenticity"] },
  { en: "If life were predictable it would cease to be life, and be without flavor.", fr: "Si la vie était prévisible, elle cesserait d'être la vie et serait sans saveur.", author: "Eleanor Roosevelt", tags: ["life", "unpredictability"] },
  { en: "Life is really simple, but we insist on making it complicated.", fr: "La vie est vraiment simple, mais nous insistons pour la rendre compliquée.", author: "Confucius", tags: ["simplicity", "life"] },
  { en: "May you live every day of your life.", fr: "Puissiez-vous vivre chaque jour de votre vie.", author: "Jonathan Swift", tags: ["living", "presence"] },
  { en: "Life itself is the most wonderful fairy tale.", fr: "La vie elle-même est le conte de fées le plus merveilleux.", author: "Hans Christian Andersen", tags: ["life", "wonder"] },
  { en: "Do not let making a living prevent you from making a life.", fr: "Ne laissez pas gagner votre vie vous empêcher de faire une vie.", author: "John Wooden", tags: ["balance", "life"] },
  { en: "Life is ours to be spent, not to be saved.", fr: "La vie est à nous pour être dépensée, pas pour être économisée.", author: "D.H. Lawrence", tags: ["life", "living"] },
  { en: "Keep smiling, because life is a beautiful thing and there's so much to smile about.", fr: "Continuez à sourire, car la vie est une belle chose et il y a tant de raisons de sourire.", author: "Marilyn Monroe", tags: ["happiness", "positivity"] },
  { en: "Life is a long lesson in humility.", fr: "La vie est une longue leçon d'humilité.", author: "James M. Barrie", tags: ["life", "humility"] },
  { en: "In three words I can sum up everything I've learned about life: it goes on.", fr: "En trois mots, je peux résumer tout ce que j'ai appris sur la vie : elle continue.", author: "Robert Frost", tags: ["life", "continuity"] },
  { en: "Love the life you live. Live the life you love.", fr: "Aimez la vie que vous vivez. Vivez la vie que vous aimez.", author: "Bob Marley", tags: ["life", "love"] },
  { en: "Life is made of ever so many partings welded together.", fr: "La vie est faite de tant de séparations soudées ensemble.", author: "Charles Dickens", tags: ["life", "connections"] },
  { en: "Your life does not get better by chance, it gets better by change.", fr: "Votre vie ne s'améliore pas par hasard, elle s'améliore par le changement.", author: "Jim Rohn", tags: ["life", "change"] },
  { en: "Health is the greatest gift, contentment the greatest wealth, faithfulness the best relationship.", fr: "La santé est le plus grand cadeau, le contentement la plus grande richesse, la fidélité la meilleure relation.", author: "Buddha", tags: ["health", "wealth"] },
  { en: "Money and success don't change people; they merely amplify what is already there.", fr: "L'argent et le succès ne changent pas les gens ; ils amplifient simplement ce qui est déjà là.", author: "Will Smith", tags: ["money", "character"] },
  { en: "Not how long, but how well you have lived is the main thing.", fr: "Pas combien de temps, mais à quel point vous avez bien vécu est la chose principale.", author: "Seneca", tags: ["life", "quality"] },
  { en: "The greatest wealth is to live content with little.", fr: "La plus grande richesse est de vivre content avec peu.", author: "Plato", tags: ["wealth", "contentment"] },
  { en: "Happiness is not something ready made. It comes from your own actions.", fr: "Le bonheur n'est pas quelque chose de tout fait. Il vient de vos propres actions.", author: "Dalai Lama", tags: ["happiness", "action"] },
  { en: "Turn your wounds into wisdom.", fr: "Transformez vos blessures en sagesse.", author: "Oprah Winfrey", tags: ["wisdom", "growth"] },
  { en: "The only real mistake is the one from which we learn nothing.", fr: "La seule vraie erreur est celle dont nous n'apprenons rien.", author: "Henry Ford", tags: ["mistakes", "learning"] },
  { en: "Positive anything is better than negative nothing.", fr: "Quelque chose de positif vaut mieux que rien de négatif.", author: "Elbert Hubbard", tags: ["positivity", "attitude"] },
  { en: "The only way out is through.", fr: "La seule façon de sortir est de traverser.", author: "Robert Frost", tags: ["perseverance", "challenges"] },
  { en: "Nothing will work unless you do.", fr: "Rien ne fonctionnera à moins que vous ne le fassiez.", author: "Maya Angelou", tags: ["work", "effort"] },
  { en: "If you can dream it, you can do it.", fr: "Si vous pouvez le rêver, vous pouvez le faire.", author: "Walt Disney", tags: ["dreams", "possibility"] },
  { en: "Do what you feel in your heart to be right – for you'll be criticized anyway.", fr: "Faites ce que vous sentez dans votre cœur être juste – car vous serez critiqué de toute façon.", author: "Eleanor Roosevelt", tags: ["integrity", "criticism"] },
  { en: "Happiness is not by chance, but by choice.", fr: "Le bonheur n'est pas dû au hasard, mais au choix.", author: "Jim Rohn", tags: ["happiness", "choice"] },
  { en: "Act as if what you do makes a difference. It does.", fr: "Agissez comme si ce que vous faites faisait une différence. C'est le cas.", author: "William James", tags: ["action", "impact"] },
  { en: "What we think, we become.", fr: "Ce que nous pensons, nous le devenons.", author: "Buddha", tags: ["thoughts", "being"] },
  { en: "All our dreams can come true, if we have the courage to pursue them.", fr: "Tous nos rêves peuvent devenir réalité, si nous avons le courage de les poursuivre.", author: "Walt Disney", tags: ["dreams", "courage"] },
  { en: "Good things come to people who wait, but better things come to those who go out and get them.", fr: "Les bonnes choses arrivent à ceux qui attendent, mais les meilleures choses arrivent à ceux qui sortent et les obtiennent.", author: "Anon", tags: ["action", "proactive"] },
  { en: "The harder I work, the luckier I get.", fr: "Plus je travaille dur, plus j'ai de chance.", author: "Gary Player", tags: ["work", "luck"] },
  { en: "Never regret a day in your life. Good days give you happiness and bad days give you experience.", fr: "Ne regrettez jamais un jour de votre vie. Les bons jours vous donnent du bonheur et les mauvais jours vous donnent de l'expérience.", author: "Anon", tags: ["regret", "experience"] },
  { en: "It's not whether you get knocked down, it's whether you get up.", fr: "Ce n'est pas de savoir si vous êtes renversé, c'est de savoir si vous vous relevez.", author: "Vince Lombardi", tags: ["resilience", "recovery"] },
  { en: "Don't cry because it's over, smile because it happened.", fr: "Ne pleurez pas parce que c'est fini, souriez parce que c'est arrivé.", author: "Dr. Seuss", tags: ["endings", "gratitude"] },
  { en: "Be yourself; everyone else is already taken.", fr: "Soyez vous-même ; tout le monde est déjà pris.", author: "Oscar Wilde", tags: ["authenticity", "self"] },
  { en: "Live as if you were to die tomorrow. Learn as if you were to live forever.", fr: "Vivez comme si vous deviez mourir demain. Apprenez comme si vous deviez vivre éternellement.", author: "Mahatma Gandhi", tags: ["living", "learning"] },
  { en: "No one can make you feel inferior without your consent.", fr: "Personne ne peut vous faire sentir inférieur sans votre consentement.", author: "Eleanor Roosevelt", tags: ["self-esteem", "confidence"] },
  { en: "Life is 10% what happens to us and 90% how we react to it.", fr: "La vie est à 10% ce qui nous arrive et à 90% comment nous y réagissons.", author: "Dennis P. Kimbro", tags: ["attitude", "reaction"] },
  { en: "It is during our darkest moments that we must focus to see the light.", fr: "C'est pendant nos moments les plus sombres que nous devons nous concentrer pour voir la lumière.", author: "Aristotle", tags: ["darkness", "hope"] },
  { en: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", fr: "Le pessimiste voit la difficulté dans chaque opportunité. L'optimiste voit l'opportunité dans chaque difficulté.", author: "Winston Churchill", tags: ["optimism", "perspective"] },
  { en: "Don't watch the clock; do what it does. Keep going.", fr: "Ne regardez pas l'horloge ; faites ce qu'elle fait. Continuez.", author: "Sam Levenson", tags: ["persistence", "time"] },
  { en: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", fr: "Vous apprenez plus de l'échec que du succès. Ne le laissez pas vous arrêter. L'échec forge le caractère.", author: "Anon", tags: ["failure", "character"] },
  { en: "It's not what happens to you, but how you react to it that matters.", fr: "Ce n'est pas ce qui vous arrive, mais comment vous y réagissez qui compte.", author: "Epictetus", tags: ["reaction", "control"] },
  { en: "Resentment is like drinking poison and waiting for your enemies to die.", fr: "Le ressentiment, c'est comme boire du poison et attendre que vos ennemis meurent.", author: "Nelson Mandela", tags: ["forgiveness", "resentment"] },
  { en: "The only limit to our realization of tomorrow is our doubts of today.", fr: "La seule limite à notre réalisation de demain est nos doutes d'aujourd'hui.", author: "Franklin D. Roosevelt", tags: ["doubt", "future"] },
  { en: "Do not go where the path may lead, go instead where there is no path and leave a trail.", fr: "N'allez pas où le chemin peut mener, allez plutôt là où il n'y a pas de chemin et laissez une trace.", author: "Ralph Waldo Emerson", tags: ["innovation", "trail"] },
  { en: "Remember that not getting what you want is sometimes a wonderful stroke of luck.", fr: "Rappelez-vous que ne pas obtenir ce que vous voulez est parfois un merveilleux coup de chance.", author: "Dalai Lama", tags: ["luck", "perspective"] },
  { en: "Everything has beauty, but not everyone can see.", fr: "Tout a de la beauté, mais tout le monde ne peut pas le voir.", author: "Confucius", tags: ["beauty", "perception"] },
  { en: "How wonderful it is that nobody need wait a single moment before starting to improve the world.", fr: "Comme c'est merveilleux que personne n'ait besoin d'attendre un seul instant avant de commencer à améliorer le monde.", author: "Anne Frank", tags: ["action", "improvement"] },
  { en: "When I let go of what I am, I become what I might be.", fr: "Quand je lâche prise de ce que je suis, je deviens ce que je pourrais être.", author: "Lao Tzu", tags: ["growth", "potential"] },
  { en: "Life is 10% what happens to me and 90% of how I react to it.", fr: "La vie est à 10% ce qui m'arrive et à 90% comment j'y réagis.", author: "Charles Swindoll", tags: ["reaction", "attitude"] },
  { en: "An unexamined life is not worth living.", fr: "Une vie non examinée ne vaut pas la peine d'être vécue.", author: "Socrates", tags: ["reflection", "life"] },
  { en: "Eighty percent of success is showing up.", fr: "Quatre-vingts pour cent du succès, c'est se présenter.", author: "Woody Allen", tags: ["success", "presence"] },
  { en: "Your time is limited, so don't waste it living someone else's life.", fr: "Votre temps est limité, alors ne le gaspillez pas à vivre la vie de quelqu'un d'autre.", author: "Steve Jobs", tags: ["time", "authenticity"] },
  { en: "Winning isn't everything, but wanting to win is.", fr: "Gagner n'est pas tout, mais vouloir gagner l'est.", author: "Vince Lombardi", tags: ["winning", "desire"] },
  { en: "I am not a product of my circumstances. I am a product of my decisions.", fr: "Je ne suis pas un produit de mes circonstances. Je suis un produit de mes décisions.", author: "Stephen Covey", tags: ["decisions", "control"] },
  { en: "Every child is an artist. The problem is how to remain an artist once he grows up.", fr: "Chaque enfant est un artiste. Le problème est de savoir comment rester un artiste une fois qu'il grandit.", author: "Pablo Picasso", tags: ["creativity", "growth"] },
  { en: "You can never plan the future by the past.", fr: "Vous ne pouvez jamais planifier l'avenir par le passé.", author: "Edmund Burke", tags: ["future", "planning"] },
  { en: "Remember no one can make you feel inferior without your consent.", fr: "Rappelez-vous que personne ne peut vous faire sentir inférieur sans votre consentement.", author: "Eleanor Roosevelt", tags: ["inferiority", "consent"] },
  { en: "Life is what we make it, always has been, always will be.", fr: "La vie est ce que nous en faisons, ça l'a toujours été, ça le sera toujours.", author: "Grandma Moses", tags: ["life", "creation"] },
  { en: "The whole secret of a successful life is to find out what is one's destiny to do, and then do it.", fr: "Tout le secret d'une vie réussie est de découvrir ce que c'est que sa destinée de faire, puis de le faire.", author: "Henry Ford", tags: ["destiny", "success"] },
  { en: "In order to write about life first you must live it.", fr: "Pour écrire sur la vie, vous devez d'abord la vivre.", author: "Ernest Hemingway", tags: ["life", "experience"] },
  { en: "Life is not a problem to be solved, but a reality to be experienced.", fr: "La vie n'est pas un problème à résoudre, mais une réalité à vivre.", author: "Soren Kierkegaard", tags: ["life", "experience"] },
  { en: "The unexamined life is not worth living.", fr: "La vie non examinée ne vaut pas la peine d'être vécue.", author: "Socrates", tags: ["examination", "life"] },
  { en: "Turn your wounds into wisdom.", fr: "Transformez vos blessures en sagesse.", author: "Oprah Winfrey", tags: ["wounds", "wisdom"] },
  { en: "The way I see it, if you want the rainbow, you gotta put up with the rain.", fr: "Comme je le vois, si vous voulez l'arc-en-ciel, vous devez supporter la pluie.", author: "Dolly Parton", tags: ["challenges", "rewards"] },
  { en: "Everything you've ever wanted is on the other side of fear.", fr: "Tout ce que vous avez toujours voulu est de l'autre côté de la peur.", author: "George Addair", tags: ["fear", "desire"] },
  { en: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.", fr: "Nous pouvons facilement pardonner à un enfant qui a peur du noir ; la vraie tragédie de la vie, c'est quand les hommes ont peur de la lumière.", author: "Plato", tags: ["fear", "light"] },
  { en: "Nothing is impossible. The word itself says 'I'm possible!'", fr: "Rien n'est impossible. Le mot lui-même dit 'Je suis possible !'", author: "Audrey Hepburn", tags: ["possibility", "impossible"] },
  { en: "There are two ways of spreading light: to be the candle or the mirror that reflects it.", fr: "Il y a deux façons de répandre la lumière : être la bougie ou le miroir qui la reflète.", author: "Edith Wharton", tags: ["light", "reflection"] },
  { en: "When everything seems to be going against you, remember that the airplane takes off against the wind, not with it.", fr: "Quand tout semble aller contre vous, rappelez-vous que l'avion décolle contre le vent, pas avec lui.", author: "Henry Ford", tags: ["adversity", "success"] },
  { en: "Too many of us are not living our dreams because we are living our fears.", fr: "Trop d'entre nous ne vivent pas leurs rêves parce qu'ils vivent leurs peurs.", author: "Les Brown", tags: ["dreams", "fears"] },
  { en: "I have learned over the years that when one's mind is made up, this diminishes fear.", fr: "J'ai appris au fil des ans que lorsque l'esprit est décidé, cela diminue la peur.", author: "Rosa Parks", tags: ["decision", "fear"] },
  { en: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", fr: "Les défis sont ce qui rend la vie intéressante et les surmonter est ce qui rend la vie significative.", author: "Joshua J. Marine", tags: ["challenges", "meaning"] },
  { en: "If you want to lift yourself up, lift up someone else.", fr: "Si vous voulez vous élever, élevez quelqu'un d'autre.", author: "Booker T. Washington", tags: ["helping", "elevation"] },
  { en: "I have been impressed with the urgency of doing. Knowing is not enough; we must apply. Being willing is not enough; we must do.", fr: "J'ai été impressionné par l'urgence de faire. Savoir ne suffit pas ; nous devons appliquer. Être disposé ne suffit pas ; nous devons faire.", author: "Leonardo da Vinci", tags: ["action", "urgency"] },
  { en: "Limitations live only in our minds. But if we use our imaginations, our possibilities become limitless.", fr: "Les limitations ne vivent que dans nos esprits. Mais si nous utilisons notre imagination, nos possibilités deviennent illimitées.", author: "Jamie Paolinetti", tags: ["limitations", "imagination"] },
  { en: "The only person you are destined to become is the person you decide to be.", fr: "La seule personne que vous êtes destiné à devenir est la personne que vous décidez d'être.", author: "Ralph Waldo Emerson", tags: ["destiny", "decision"] },
  { en: "Believe you can and you're halfway there.", fr: "Croyez que vous pouvez et vous êtes à mi-chemin.", author: "Theodore Roosevelt", tags: ["belief", "progress"] },
  { en: "We become what we think about most of the time, and that's the strangest secret.", fr: "Nous devenons ce à quoi nous pensons la plupart du temps, et c'est le secret le plus étrange.", author: "Earl Nightingale", tags: ["thoughts", "becoming"] },
  { en: "The best time to plant a tree was 20 years ago. The second best time is now.", fr: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.", author: "Chinese Proverb", tags: ["timing", "action"] },
  { en: "An entrepreneur is someone who has a vision for something and a want to create.", fr: "Un entrepreneur est quelqu'un qui a une vision de quelque chose et le désir de créer.", author: "David Karp", tags: ["entrepreneurship", "vision"] },
  { en: "Life shrinks or expands in proportion to one's courage.", fr: "La vie rétrécit ou se dilate en proportion du courage de chacun.", author: "Anais Nin", tags: ["courage", "life"] },
  { en: "If you hear a voice within you say 'you cannot paint,' then by all means paint and that voice will be silenced.", fr: "Si vous entendez une voix en vous dire 'vous ne pouvez pas peindre', alors peignez à tout prix et cette voix sera réduite au silence.", author: "Vincent Van Gogh", tags: ["doubt", "action"] },
  { en: "There is only one way to avoid criticism: do nothing, say nothing, and be nothing.", fr: "Il n'y a qu'un seul moyen d'éviter la critique : ne rien faire, ne rien dire et n'être rien.", author: "Aristotle", tags: ["criticism", "action"] },
  { en: "Ask and it will be given to you; search, and you will find; knock and the door will be opened for you.", fr: "Demandez et il vous sera donné ; cherchez, et vous trouverez ; frappez et la porte vous sera ouverte.", author: "Jesus", tags: ["asking", "seeking"] },
  { en: "The only way to do great work is to love what you do.", fr: "La seule façon de faire un excellent travail est d'aimer ce que vous faites.", author: "Steve Jobs", tags: ["work", "passion"] },
  { en: "If you can dream it, you can achieve it.", fr: "Si vous pouvez le rêver, vous pouvez le réaliser.", author: "Zig Ziglar", tags: ["dreams", "achievement"] },
  { en: "Those who dare to fail miserably can achieve greatly.", fr: "Ceux qui osent échouer misérablement peuvent réussir grandement.", author: "John F. Kennedy", tags: ["failure", "success"] },
  { en: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", fr: "Ne vous laissez pas bousculer par les peurs dans votre esprit. Laissez-vous guider par les rêves dans votre cœur.", author: "Roy T. Bennett", tags: ["fear", "dreams"] },
  { en: "Do one thing every day that scares you.", fr: "Faites une chose chaque jour qui vous fait peur.", author: "Eleanor Roosevelt", tags: ["fear", "daily"] },
  { en: "It's not the years in your life that count. It's the life in your years.", fr: "Ce ne sont pas les années dans votre vie qui comptent. C'est la vie dans vos années.", author: "Abraham Lincoln", tags: ["life", "quality"] }
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