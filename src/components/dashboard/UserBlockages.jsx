import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Link2, Flag, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function UserBlockages() {
  const [blockers, setBlockers] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockages = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) {
          setLoading(false);
          return;
        }

        // Fetch blockers affecting this user (respects RLS)
        const blockersResponse = await base44.functions.invoke('getBlockersAffectingUser', {
          user_email: user.email
        });

        setBlockers(blockersResponse.data?.blockers || []);
        setDependents(blockersResponse.data?.dependents || []);
      } catch (error) {
        console.error("Error fetching blockages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockages();
  }, []);

  const handleReportBlocker = async () => {
    const user = await base44.auth.me();
    if (!user) return;

    const description = prompt("Décrivez le blocage:");
    if (!description) return;

    try {
      await base44.functions.invoke('reportBlocker', {
        user_email: user.email,
        description: description
      });
      alert("Blocage signalé avec succès");
      // Refresh blockers list
      const response = await base44.functions.invoke('getBlockersAffectingUser', {
        user_email: user.email
      });
      setBlockers(response.data?.blockers || []);
    } catch (error) {
      console.error("Error reporting blocker:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
        </CardContent>
      </Card>
    );
  }

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
              {blockers.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Aucun blocage actuellement
                </p>
              ) : (
                <div className="space-y-2">
                  {blockers.map((blocker, idx) => (
                    <div key={idx} className="text-sm text-slate-600 p-2 bg-white rounded border border-amber-100">
                      {blocker.description || blocker.title}
                      <span className="block text-xs text-slate-400 mt-1">
                        Blocker: {blocker.blocked_by || "Unknown"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-blue-700 bg-blue-50">
                  👥 Qui compte sur toi
                </Badge>
              </div>
              {dependents.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Personne ne dépend de toi en ce moment
                </p>
              ) : (
                <div className="space-y-2">
                  {dependents.map((dep, idx) => (
                    <div key={idx} className="text-sm text-slate-600 p-2 bg-white rounded border border-blue-100">
                      {dep.name} attend: {dep.task}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={handleReportBlocker}
              >
                <Flag className="w-4 h-4" />
                Signaler un Blocage
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Link2 className="w-4 h-4" />
                Voir Dépendances ({dependents.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}