import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2 } from "lucide-react";

export default function DailyQuoteCard() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyQuote = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('getDailyQuote', {});
        
        if (response.data?.quote) {
          setQuote(response.data.quote);
        }
      } catch (error) {
        console.error("Error fetching daily quote:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyQuote();
  }, []);

  if (loading) {
    return null;
  }

  if (!quote) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
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
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 overflow-hidden hover:border-amber-300 transition-colors"
    >
      <div className="flex gap-3">
        <div className="shrink-0 p-1.5 rounded-lg bg-amber-100">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Citation du jour</p>
          <blockquote className="text-sm italic text-slate-700 leading-snug">
            "{quote.text}"
          </blockquote>
          <p className="text-xs text-slate-500">— {quote.author}</p>
        </div>
      </div>
    </motion.div>
  );
}