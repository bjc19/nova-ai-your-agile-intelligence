import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const quotes = [
  {
    en: "A team without blockers is a myth. A team that removes blockers is a legend.",
    fr: "Une équipe sans blocages est un mythe. Une équipe qui élimine les blocages est une légende.",
    author: "Nova Team"
  },
  {
    en: "Sprint velocity isn't about speed, it's about predictability.",
    fr: "La vélocité du sprint n'est pas une question de rapidité, c'est une question de prévisibilité.",
    author: "Jeff Sutherland"
  },
  {
    en: "The best analytics tool is one your team actually uses.",
    fr: "Le meilleur outil d'analyse est celui que votre équipe utilise réellement.",
    author: "Agile Principle"
  },
  {
    en: "Risks seen early are opportunities for innovation.",
    fr: "Les risques détectés tôt sont des opportunités d'innovation.",
    author: "Project Management"
  },
  {
    en: "Transparency in standups reveals truth. Action on that truth creates value.",
    fr: "La transparence dans les standups révèle la vérité. L'action sur cette vérité crée de la valeur.",
    author: "Agile Coach Wisdom"
  },
  {
    en: "Your daily standup's quality is your sprint's health barometer.",
    fr: "La qualité de votre standup quotidien est le baromètre de la santé de votre sprint.",
    author: "Scrum Master"
  },
  {
    en: "Data anonymized is trust maintained.",
    fr: "Les données anonymisées sont la confiance maintenue.",
    author: "Privacy by Design"
  },
  {
    en: "The most expensive blocker is the one nobody talks about.",
    fr: "Le blocage le plus coûteux est celui dont personne ne parle.",
    author: "Team Lead"
  }
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