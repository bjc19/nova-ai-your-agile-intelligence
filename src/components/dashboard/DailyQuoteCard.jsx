import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2 } from "lucide-react";

export default function DailyQuoteCard() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await base44.functions.invoke('getDailyQuote', {});
        setQuote(response.data);
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4"
      >
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
          <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Citation du jour</p>
        </div>
      </motion.div>
    );
  }

  if (!quote) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4"
      >
        <div className="flex gap-3">
          <div className="shrink-0 p-1.5 rounded-lg bg-amber-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Citation du jour</p>
            <p className="text-sm text-slate-500 mt-1">Prête dans un instant...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 hover:border-amber-300 transition-colors"
    >
      <div className="flex gap-3">
        <div className="shrink-0 p-1.5 rounded-lg bg-amber-100">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Citation du jour</p>
          <p className="text-sm text-slate-700 mt-2 italic">"{quote.text}"</p>
          {quote.author && (
            <p className="text-xs text-slate-500 mt-2">— {quote.author}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}