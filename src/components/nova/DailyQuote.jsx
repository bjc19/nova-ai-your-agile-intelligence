import { motion } from "framer-motion";
import { Quote } from "lucide-react";

// Quotes for when risks/blockers are detected
const riskQuotes = [
  { en: "Risks seen early are opportunities for innovation.", fr: "Les risques détectés tôt sont des opportunités d'innovation.", author: "Anon" },
  { en: "The most expensive blocker is the one nobody talks about.", fr: "Le blocage le plus coûteux est celui dont personne ne parle.", author: "Anon" },
  { en: "Adding manpower to a late software project makes it later.", fr: "Ajouter de la main-d'œuvre à un projet en retard le retarde davantage.", author: "Fred Brooks" },
  { en: "If anything can go wrong, it will.", fr: "Si quelque chose peut mal tourner, ça le fera.", author: "Edward A. Murphy Jr." }
];

// Quotes for general progress/momentum
const progressQuotes = [
  { en: "Done is better than perfect.", fr: "Fait est mieux que parfait.", author: "Sheryl Sandberg" },
  { en: "The only way to go fast is to go well.", fr: "La seule façon d'aller vite est d'aller bien.", author: "Robert C. Martin" },
  { en: "Ship early and ship often.", fr: "Lancez tôt, lancez souvent.", author: "Eric Ries" },
  { en: "Momentum beats perfection.", fr: "L'élan bat la perfection.", author: "John Cutler" },
  { en: "Imperfect action beats perfect inaction.", fr: "L'action imparfaite bat l'inaction parfaite.", author: "Anon" },
  { en: "Progress over polish.", fr: "La progression plutôt que le polissage.", author: "John Cutler" },
  { en: "Iterate or die.", fr: "Itérez ou mourez.", author: "Steve Blank" },
  { en: "The fastest way to learn is to ship.", fr: "Le moyen le plus rapide d'apprendre est de lancer.", author: "Marty Cagan" }
];

export default function DailyQuote({ lang = "fr" }) {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full my-6"
    >
      <div className="flex items-start gap-4 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md">
        <Quote className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <p className="text-lg italic text-slate-700 font-light mb-3">
            {randomQuote[lang]}
          </p>
          <p className="text-sm text-blue-600 font-semibold">
            — {randomQuote.author}
          </p>
        </div>
      </div>
    </motion.div>
  );
}