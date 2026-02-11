import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Sparkles, Lightbulb, Loader2 } from "lucide-react";

export default function DailyQuoteCard() {
  const { t, language } = useLanguage();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signal, setSignal] = useState(null);

  useEffect(() => {
    const fetchDailyQuote = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('getDailyQuote', {});
        
        if (response.data?.quote) {
          setQuote(response.data.quote);
          setSignal(response.data.signal);
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
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 h-full flex items-center justify-center"
      >
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
      </motion.div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-6 h-full flex flex-col justify-between overflow-hidden group hover:border-amber-300/70 transition-all duration-300"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/10 -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gradient-to-tr from-amber-100/10 to-transparent -translate-y-1/2 -translate-x-1/2 blur-2xl" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Citation du jour</h3>
            <p className="text-xs text-amber-700">Inspirée par votre contexte</p>
          </div>
        </div>

        {/* Quote */}
        <div className="space-y-3">
          <blockquote className="text-lg font-serif italic text-slate-800 leading-relaxed">
            "{quote.text}"
          </blockquote>

          <div className="flex items-end justify-between pt-2 border-t border-amber-200/50">
            <div>
              <p className="text-sm font-semibold text-slate-700">— {quote.author}</p>
              {quote.number && (
                <p className="text-xs text-slate-500">#{quote.number}</p>
              )}
            </div>
          </div>

          {/* Signal link */}
          {signal && signal !== "première utilisation" && (
            <div className="mt-3 pt-3 border-t border-amber-100">
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Contexte: <span className="font-medium">{signal}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="relative text-xs text-slate-500 italic pt-2">
        Nouvelle citation chaque jour civil
      </div>
    </motion.div>
  );
}