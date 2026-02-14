import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Link2, Flag } from "lucide-react";

export default function UserBlockages() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Tâches Prioritaires du Backlog</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Blocages qui te Concernent - Ce que tu dois savoir pour progresser
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-amber-700 bg-amber-50">
                  ⏸️ Tu es bloqué par
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                Aucun blocage actuellement
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-blue-700 bg-blue-50">
                  👥 Qui compte sur toi
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                Personne ne dépend de toi en ce moment
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Flag className="w-4 h-4" />
                Signaler un Blocage
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Link2 className="w-4 h-4" />
                Voir Dépendances (0)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}