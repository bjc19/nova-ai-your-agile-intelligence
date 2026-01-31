import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecommendationCard({ recommendations, sourceUrl, sourceName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-amber-100">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Improvement Recommendations
        </h3>
      </div>
      <ul className="space-y-3">
        {recommendations.map((rec, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            className="flex items-start gap-3 text-slate-700"
          >
            <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm leading-relaxed">{rec}</span>
          </motion.li>
        ))}
      </ul>
      
      {sourceUrl && (
        <div className="mt-5 pt-5 border-t border-amber-200">
          <Button
            onClick={() => window.open(sourceUrl, '_blank')}
            variant="outline"
            className="w-full bg-white hover:bg-amber-50 border-amber-300 text-amber-700 hover:text-amber-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Voir dans {sourceName || 'la source'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}