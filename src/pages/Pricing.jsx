import { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const PricingSection = lazy(() => import("@/components/nova/PricingSection").then(m => ({ default: m.PricingSection })));

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-teal-300 text-sm font-semibold uppercase tracking-widest mb-3">Tarification</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Plans & Tarifs</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Choisissez le plan adapté à votre équipe et commencez votre transformation agile dès aujourd'hui.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" /></div>}>
          <PricingSection />
        </Suspense>
      </div>
    </div>
  );
}