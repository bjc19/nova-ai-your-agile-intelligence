import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar } from "lucide-react";

export default function UserDailyFocus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Votre Focus du Jour</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Juste vos tâches prioritaires - vue exclusive pour vous
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">0 tâches aujourd'hui</span>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Aujourd'hui
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 text-center">
              <p className="text-sm text-slate-500">
                Aucune tâche pour aujourd'hui
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Vous êtes à jour! 🎉
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}