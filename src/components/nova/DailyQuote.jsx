import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const quotes = [
  {
    en: "A team without blockers is a myth. A team that removes blockers is a legend.",
    fr: "Une équipe sans blocages est un mythe. Une équipe qui élimine les blocages est une légende."
  },
  {
    en: "Sprint velocity isn't about speed, it's about predictability.",
    fr: "La vélocité du sprint n'est pas une question de rapidité, c'est une question de prévisibilité."
  },
  {
    en: "The best analytics tool is one your team actually uses.",
    fr: "Le meilleur outil d'analyse est celui que votre équipe utilise réellement."
  },
  {
    en: "Risks seen early are opportunities for innovation.",
    fr: "Les risques détectés tôt sont des opportunités d'innovation."
  },
  {
    en: "Transparency in standups reveals truth. Action on that truth creates value.",
    fr: "La transparence dans les standups révèle la vérité. L'action sur cette vérité crée de la valeur."
  },
  {
    en: "Your daily standup's quality is your sprint's health barometer.",
    fr: "La qualité de votre standup quotidien est le baromètre de la santé de votre sprint."
  },
  {
    en: "Data anonymized is trust maintained.",
    fr: "Les données anonymisées sont la confiance maintenue."
  },
  {
    en: "The most expensive blocker is the one nobody talks about.",
    fr: "Le blocage le plus coûteux est celui dont personne ne parle."
  }
];

export function DailyQuote({ lang = "en" }) {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="w-full my-8"
    >
      <div className="flex items-start gap-4 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md">
        <Quote className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
        <p className="text-lg italic text-slate-700 font-light">
          {randomQuote[lang]}
        </p>
      </div>
    </motion.div>
  );
}