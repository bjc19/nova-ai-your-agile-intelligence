import { motion } from "framer-motion";

export default function TranscriptInput({ value, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium text-slate-700">
          Contenu de l'atelier
        </label>
      </div>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Collez le contenu de votre atelier (transcription, notes ou messages Slack)..."
        className="min-h-[400px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all"
      />
      
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-900">
          <strong>⚠️ Important :</strong> Cette analyse affectera vos statistiques réelles et sera intégrée au cycle de développement de votre équipe. Les recommandations et patterns détectés influenceront vos métriques de performance.
        </p>
      </div>
    </motion.div>
  );
}