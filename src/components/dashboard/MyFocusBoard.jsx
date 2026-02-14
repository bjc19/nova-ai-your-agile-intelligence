import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, AlertCircle, Plus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MyFocusBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  // Récupérer le workspace sélectionné et charger les tâches
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        
        // Récupérer le workspace sélectionné depuis sessionStorage
        const storedPeriod = sessionStorage.getItem("selectedWorkspaceId");
        const workspaceId = storedPeriod ? JSON.parse(storedPeriod) : null;
        setSelectedWorkspaceId(workspaceId);

        // Appeler la fonction backend pour récupérer les tâches
        const response = await base44.functions.invoke('getUserJiraTasks', {
          workspaceId: workspaceId
        });

        setTasks(response.data.tasks || []);
      } catch (error) {
        console.error("Erreur chargement tâches Jira:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const statusConfig = {
    todo: { icon: Circle, color: "text-slate-400", bg: "bg-slate-50" },
    in_progress: { icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50" },
    blocked: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
    done: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
  };

  const priorityColor = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-700"
  };

  const todayTasks = tasks.filter(t => t.dueToday);
  const completionRate = Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Votre Focus du Jour</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Votre Focus du Jour</CardTitle>
              <CardDescription className="text-xs mt-1">
                Juste vos tâches prioritaires - vue exclusive pour vous
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{todayTasks.length}</p>
              <p className="text-xs text-slate-500">tâches aujourd'hui</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">Aucune tâche pour aujourd'hui</p>
            </div>
          ) : (
            <>
              {todayTasks.map((task) => {
                const StatusIcon = statusConfig[task.status].icon;
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border border-slate-200 flex items-start gap-3 ${statusConfig[task.status].bg} transition-all hover:shadow-sm`}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusConfig[task.status].color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs bg-white">
                          {task.ticket}
                        </Badge>
                        <Badge className={`text-xs ${priorityColor[task.priority]}`}>
                          {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                        </Badge>
                      </div>
                    </div>
                    {task.status === 'blocked' && (
                      <div className="flex-shrink-0">
                        <span className="text-xs font-semibold text-red-600">BLOQUÉ</span>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all" 
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{completionRate}%</span>
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50">
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}