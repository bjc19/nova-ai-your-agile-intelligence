import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PrioritizedBacklog() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async (workspaceId) => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('getBacklogPrioritizedTasks', {
          workspaceId: workspaceId
        });

        setTasks(response.data.tasks || []);
      } catch (error) {
        console.error("Erreur chargement backlog:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    const storedWorkspaceId = sessionStorage.getItem("selectedWorkspaceId");
    const workspaceId = storedWorkspaceId ? JSON.parse(storedWorkspaceId) : null;
    if (workspaceId) {
      loadTasks(workspaceId);
    }

    // Listener pour changements du workspace
    const handleStorageChange = () => {
      const newWorkspaceId = sessionStorage.getItem("selectedWorkspaceId");
      const parsedId = newWorkspaceId ? JSON.parse(newWorkspaceId) : null;
      if (parsedId) {
        loadTasks(parsedId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Tâches Prioritaires du Backlog
            </CardTitle>
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
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Tâches Prioritaires du Backlog
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Priorisées par le PO ou recommandées automatiquement
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <AlertCircle className="w-4 h-4" />
              Aucune tâche dans le backlog
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {task.key}
                        </span>
                        {task.isBacklogItem && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            📋 Backlog
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    </div>
                    <Badge
                      className={`text-xs flex-shrink-0 ${
                        task.priorityScore >= 4
                          ? 'bg-red-100 text-red-700'
                          : task.priorityScore >= 3
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{task.assignee}</span>
                    {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}