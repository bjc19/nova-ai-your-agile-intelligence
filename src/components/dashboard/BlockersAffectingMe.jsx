import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Send, Plus } from "lucide-react";

export default function BlockersAffectingMe() {
  const [blockers] = useState([
    {
      id: 1,
      title: "En attente de review API",
      blockedBy: "Sarah D.",
      description: "L'endpoint paiement attend ta review depuis 24h",
      urgency: "high",
      ticket: "US-123",
      actions: ["Contacter Sarah", "Voir ticket"]
    },
    {
      id: 2,
      title: "Dépendance: Design system",
      blockedBy: "Alex M.",
      description: "Tu dois avoir les composants UI avant vendredi",
      urgency: "medium",
      ticket: "DESIGN-42",
      actions: ["Voir deadline", "Escalader"]
    }
  ]);

  const dependsOnMe = [
    {
      id: 1,
      person: "Tom F.",
      title: "Attend tes changements API",
      description: "Pour intégrer sur le frontend",
      ticket: "FE-234"
    },
    {
      id: 2,
      person: "Lisa Q.",
      title: "Attends la doc des endpoints",
      description: "Besoin pour les tests d'intégration",
      ticket: "QA-567"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Blocages qui te Concernent
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Ce que tu dois savoir pour progresser - vue exclusive pour toi
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Blocked By */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">⏸️ Tu es bloqué par</h4>
            {blockers.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun blocage actuellement</p>
            ) : (
              <div className="space-y-2">
                {blockers.map((blocker) => (
                  <div key={blocker.id} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{blocker.title}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Bloqué par <span className="font-semibold text-slate-900">{blocker.blockedBy}</span>
                        </p>
                      </div>
                      <Badge className={`text-xs flex-shrink-0 ${blocker.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {blocker.urgency === 'high' ? '🔴 Urgent' : '⏱️ Moyen'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{blocker.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-white">
                        {blocker.ticket}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-100"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Contacter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Others depend on me */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">👥 Qui compte sur toi</h4>
            {dependsOnMe.length === 0 ? (
              <p className="text-xs text-slate-500">Personne ne dépend de toi en ce moment</p>
            ) : (
              <div className="space-y-2">
                {dependsOnMe.map((dep) => (
                  <div key={dep.id} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm font-medium text-slate-900">{dep.person}</p>
                    <p className="text-xs text-slate-600 mt-1">{dep.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{dep.description}</p>
                    <Badge variant="outline" className="text-xs bg-white mt-2">
                      {dep.ticket}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Blocker */}
          <div className="pt-2 border-t border-slate-200 flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              Signaler un Blocage
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 h-8 text-xs"
            >
              Voir Dépendances
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}