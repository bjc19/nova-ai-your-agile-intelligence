import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function UserDailyFocus() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const fetchUserTasks = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) {
          setLoading(false);
          return;
        }

        setUserEmail(user.email);

        // Fetch tasks from Jira via backend (respects RLS)
        const response = await base44.functions.invoke('getUserJiraTasks', {
          assignee_email: user.email
        });

        const userTasks = response.data?.tasks || [];
        setTasks(userTasks);
      } catch (error) {
        console.error("Error fetching user tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTasks();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

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
              <span className="text-sm font-medium text-slate-700">
                {tasks.length} tâche{tasks.length !== 1 ? 's' : ''} aujourd'hui
              </span>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Aujourd'hui
              </Badge>
            </div>
            {tasks.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 text-center">
                <p className="text-sm text-slate-500">
                  Aucune tâche pour aujourd'hui
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Vous êtes à jour! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-sm font-medium text-slate-900">{task.key} - {task.summary}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-xs bg-blue-100 text-blue-700 border-0">
                        {task.status}
                      </Badge>
                      {task.priority && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 border-0">
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length > 5 && (
                  <p className="text-xs text-slate-500 pt-2">
                    +{tasks.length - 5} tâche(s) supplémentaire(s)
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}