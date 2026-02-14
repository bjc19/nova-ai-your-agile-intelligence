import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function UserContributions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Tes Contributions Cette Semaine</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Vois ton impact et ta progression - vue exclusive pour toi
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-green-50 text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <p className="text-xs text-slate-500 mt-1">Tâches Complétées</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-xs text-slate-500 mt-1">Contributions</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-center">
                <div className="text-2xl font-bold text-purple-600">0%</div>
                <p className="text-xs text-slate-500 mt-1">Progression</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Aucune donnée pour cette semaine
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}