import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Database, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

export default function JiraWorkspacesCard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const ws = await base44.entities.JiraWorkspace.list();
        setWorkspaces(ws);

        const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
        const plan = statusRes.data?.plan || 'starter';
        
        const quotaLimits = {
          'starter': 1,
          'growth': 3,
          'pro': 10,
          'enterprise': 999
        };

        setQuota({
          plan,
          limit: quotaLimits[plan.toLowerCase()] || 1,
          used: ws.length
        });
      } catch (error) {
        console.error('Error loading workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  const handleDelete = async (workspaceId) => {
    try {
      setDeleting(workspaceId);
      await base44.entities.JiraWorkspace.delete(workspaceId);
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
      setQuota(q => ({ ...q, used: q.used - 1 }));
    } catch (error) {
      console.error('Error deleting workspace:', error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Workspaces Jira</CardTitle>
              <CardDescription>Projets analysés</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Workspaces Jira</CardTitle>
              <CardDescription>
                {quota && `${quota.used} / ${quota.limit} projets`}
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(createPageUrl('JiraProjectSelector'))}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un projet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {workspaces.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-4">Aucun workspace configuré</p>
            <Button
              onClick={() => navigate(createPageUrl('JiraProjectSelector'))}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Sélectionner un projet
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws, index) => (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900">{ws.project_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {ws.project_key}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          ws.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {ws.status === 'active' ? 'Actif' : 'Analyse en cours'}
                      </Badge>
                    </div>
                    {ws.last_analysis_date && (
                      <p className="text-xs text-slate-500">
                        Dernière analyse: {new Date(ws.last_analysis_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(ws.id)}
                    disabled={deleting === ws.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting === ws.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}