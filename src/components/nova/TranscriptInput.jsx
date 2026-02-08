import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

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
      
      {!value ? (
        <div className="min-h-[400px] rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Collez le contenu de votre atelier</p>
            <p className="text-sm text-slate-500">Transcription, notes ou messages Slack</p>
          </div>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[400px] w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
        />
      )}
      
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-900">
          <strong>⚠️ Important :</strong> Cette analyse affectera vos statistiques réelles et sera intégrée au cycle de développement de votre équipe. Les recommandations et patterns détectés influenceront vos métriques de performance.
        </p>
      </div>
    </motion.div>
  );
}