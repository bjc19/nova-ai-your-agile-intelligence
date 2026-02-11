import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

const QUOTES = [
  // 1–60 : Lancement, itération & MVP
  "If you are not embarrassed by the first version of your product, you've launched too late. — Reid Hoffman",
  "Done is better than perfect. — Sheryl Sandberg",
  "Products that survive ship early and ship often. — Eric Ries",
  "Build less, start sooner. — Jim Highsmith",
  "The best way to get a project done faster is to start sooner. — Jim Highsmith",
  "The only way to win is to learn faster than anyone else. — Eric Ries",
  "Shipping something imperfect is better than not shipping at all. — Growth.design",
  "The minimum viable product is that version of a new product which allows a team to collect the maximum amount of validated learning about customers with the least effort. — Eric Ries",
  "Build-Measure-Learn feedback loop is at the core of the Lean Startup model. — Eric Ries",
  "Validated learning is the unit of progress in a startup. — Eric Ries",
  "Launch early, iterate often. — Reid Hoffman",
  "Fail fast, fail cheap, fail forward. — Reid Hoffman",
  "Speed is the new currency of business. — Anon",
  "Move fast and break things. — Mark Zuckerberg",
  "Prototype early, prototype often. — Tom & David Kelley",
  "The purpose of a prototype is to prove a point, not create a product. — Tom & David Kelley",
  "Ship early and ship often. — Eric Ries",
  "Perfection is the enemy of progress. — Voltaire",
  "Launching is learning. — Marty Cagan",
  "The fastest way to learn is to ship. — Marty Cagan",
  "Iterate or die. — Steve Blank",
  "Get out of the building. — Steve Blank",
  "Customer development is as important as product development. — Steve Blank",
  "No plan survives first contact with customers. — Steve Blank",
  "Test your assumptions early and often. — Ash Maurya",
  "Problem-solution fit before product-market fit. — Dan Olsen",
  "Build features users actually need, not what you think they need. — Marty Cagan",
  "The best way to predict what customers want is to watch what they do. — Marty Cagan",
  "Discovery is continuous. — Teresa Torres",
  "Opportunity solution tree over roadmap. — Teresa Torres",
  "Continuous discovery habits win. — Teresa Torres",
  "Assume you know nothing about the customer — then prove it wrong. — Teresa Torres",
  "The best ideas come from talking to users. — Teresa Torres",
  "Ship to learn, not to be right. — John Cutler",
  "Momentum beats perfection. — John Cutler",
  "Progress over polish. — John Cutler",
  "Start stupid, get smart later. — John Cutler",
  "Launching is an act of courage. — Anon",
  "Better ugly and shipped than beautiful and stuck. — Anon",
  "Version 1.0 is just the beginning. — Anon",
  "Iterate relentlessly. — Anon",
  "Speed wins in uncertain markets. — Anon",
  "The market rewards fast learners. — Anon",
  "Ship it like it's hot. — Anon",
  "Early birds get the feedback. — Anon",
  "Launch today, fix tomorrow. — Anon",
  "Imperfect action beats perfect inaction. — Anon",
  "Release early, release often, listen to feedback. — Eric S. Raymond",
  "Fast beats slow every time. — Anon",
  "Learning velocity is the only sustainable advantage. — Anon",
  "Ship or sink. — Anon",
  
  // 61–110 : Qualité, craft, vitesse & lois réalistes
  "The only way to go fast is to go well. — Robert C. Martin",
  "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away. — Antoine de Saint-Exupéry",
  "Continuous attention to technical excellence and good design enhances agility. — Agile Manifesto",
  "It always takes longer than you expect, even when you take into account Hofstadter's Law. — Douglas Hofstadter",
  "Adding manpower to a late software project makes it later. — Fred Brooks",
  "Work expands so as to fill the time available for its completion. — C. Northcote Parkinson",
  "If anything can go wrong, it will. — Edward A. Murphy Jr.",
  "There is nothing so useless as doing efficiently that which should not be done at all. — Peter Drucker",
  "Clean code always looks like it was written by someone who cares. — Robert C. Martin",
  "Simplicity is prerequisite for reliability. — Edsger W. Dijkstra",
  "Premature optimization is the root of all evil. — Donald Knuth",
  "Make it work, make it right, make it fast. — Kent Beck",
  "Good code is its own best documentation. — Steve McConnell",
  "Code is read much more than it is written. — Guido van Rossum",
  "Debugging is twice as hard as writing the code in the first place. — Brian W. Kernighan",
  "The best error message is the one that never shows up. — Thomas Fuchs",
  "Refactor mercilessly. — Martin Fowler",
  "You aren't gonna need it. — Extreme Programming",
  "Do the simplest thing that could possibly work. — Kent Beck",
  "Technical debt is like financial debt. — Ward Cunningham",
  "Quality is free. It's not a gift, but it's free. — Philip Crosby",
  "The bitterness of poor quality remains long after the sweetness of low price is forgotten. — Benjamin Franklin",
  "Scope creep is the silent killer of projects. — Anon",
  "Hope is not a strategy. — Anon",
  "Estimates are always optimistic. — Anon",
  "Underpromise, overdeliver. — Tom Peters",
  "Murphy was an optimist. — Anon",
  "Everything takes longer than you think. — Hofstadter",
  "The first 90% of the code takes 90% of the time. The last 10% takes the other 90%. — Tom Cargill",
  "Good artists copy, great artists steal. — Pablo Picasso",
  "Simplicity–the art of maximizing the amount of work not done–is essential. — Agile Manifesto",
  "Working software is the primary measure of progress. — Agile Manifesto",
  "Deliver working software frequently. — Agile Manifesto",
  "Welcome changing requirements, even late in development. — Agile Manifesto",
  "Build projects around motivated individuals. — Agile Manifesto",
  "The most efficient method is face-to-face conversation. — Agile Manifesto",
  "At regular intervals, the team reflects on how to become more effective. — Agile Manifesto",
  "Sustainable pace. — Agile Manifesto",
  
  // 111–180 : Produit & customer-centric
  "Great products are engineered when product managers truly understand their customers' problems. — Marty Cagan",
  "Product management is responsible for discovering a product that is valuable, usable, and feasible. — Marty Cagan",
  "Your most unhappy customers are your greatest source of learning. — Bill Gates",
  "Until you've built a great product, almost nothing else matters. — Sam Altman",
  "Step 1 is to build something that users love. — Sam Altman",
  "Love the problem, not your solution. — Marty Cagan",
  "Fall in love with the problem, not the solution. — Uri Levine",
  "The job of the product manager is to discover what the customers actually need. — Marty Cagan",
  "Outcomes over output. — John Cutler",
  "Impact over activity. — John Cutler",
  "Customers don't buy products, they hire them to do jobs. — Clayton Christensen",
  "People don't want a quarter-inch drill, they want a quarter-inch hole. — Theodore Levitt",
  "Get closer than ever to your customers. — Steve Jobs",
  "Sometimes the customers are wrong. — Marty Cagan",
  "Build what matters, not what's requested. — Marty Cagan",
  "Prioritization is painful. — Shreyas",
  "Data beats gut feel. — Marty Cagan",
  "User research is not optional. — Marty Cagan",
];

// Catégories de citations selon le contexte
const QUOTE_CATEGORIES = {
  launch: [0, 1, 2, 3, 4, 8, 9, 10, 11, 13, 16, 17, 25, 33, 42, 45],
  quality: [51, 52, 53, 54, 55, 58, 59, 60, 61, 62, 64, 65, 66, 69, 76],
  speed: [5, 12, 14, 26, 27, 39, 40, 41, 43, 44],
  product: [75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86],
};

export default function DailyQuote({ blockerCount = 0, riskCount = 0, healthIndex = 0 }) {
  const [quote, setQuote] = useState("");
  const [category, setCategory] = useState("launch");

  useEffect(() => {
    // Sélectionner la citation du jour (déterministe basée sur la date)
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const quoteIndex = dayOfYear % QUOTES.length;

    // Déterminer la catégorie selon le contexte
    let selectedCategory = "launch";
    if (blockerCount > 3 || riskCount > 3) {
      selectedCategory = "quality";
    } else if (healthIndex > 1) {
      selectedCategory = "speed";
    } else if (blockerCount === 0 && riskCount === 0) {
      selectedCategory = "product";
    }

    setCategory(selectedCategory);
    setQuote(QUOTES[quoteIndex]);
  }, [blockerCount, riskCount, healthIndex]);

  if (!quote) return null;

  const categoryColors = {
    launch: "from-blue-500/10 to-blue-500/5 border-blue-200",
    quality: "from-amber-500/10 to-amber-500/5 border-amber-200",
    speed: "from-emerald-500/10 to-emerald-500/5 border-emerald-200",
    product: "from-indigo-500/10 to-indigo-500/5 border-indigo-200",
  };

  const categoryIcons = {
    launch: "text-blue-600",
    quality: "text-amber-600",
    speed: "text-emerald-600",
    product: "text-indigo-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`rounded-xl border bg-gradient-to-br p-5 mb-6 ${categoryColors[category]}`}
    >
      <div className="flex gap-3">
        <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${categoryIcons[category]}`} />
        <p className="text-sm text-slate-700 leading-relaxed italic">
          "{quote}"
        </p>
      </div>
    </motion.div>
  );
}