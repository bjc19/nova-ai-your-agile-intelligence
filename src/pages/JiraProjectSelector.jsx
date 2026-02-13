import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function JiraProjectSelector() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [existingWorkspaces, setExistingWorkspaces] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [replacingWorkspaceId, setReplacingWorkspaceId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const res = await base44.functions.invoke('getJiraProjects', {});
        setProjects(res.data.projects || []);
        setExistingWorkspaces(res.data.existingWorkspaces || []);
        setQuota(res.data.quota);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Impossible de charger les projets Jira. Vérifiez votre connexion.');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setReplacingWorkspaceId(null);
    setError(null);
  };

  const handleCreate = async (action = 'add') => {
    if (!selectedProject) return;

    try {
      setCreating(true);
      setError(null);
      
      const payload = {
        projectId: selectedProject.id,
        projectKey: selectedProject.key,
        projectName: selectedProject.name,
        projectType: selectedProject.type,
        cloudId: quota.plan ? 'will-be-fetched' : null,
        action: action,
        workspaceIdToReplace: replacingWorkspaceId
      };

      const res = await base44.functions.invoke('createJiraWorkspace', payload);

      if (res.data?.success) {
        // Redirect to dashboard
        navigate(createPageUrl('Dashboard'));
      } else if (res.data?.error === 'quota_exceeded') {
        setError(`Quota atteint pour le plan ${quota.plan}. Vous avez ${quota.used}/${quota.limit} projets.`);
      } else {
        setError(res.data?.message || 'Erreur lors de la création du workspace');
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError('Erreur lors de la création du workspace');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement des projets Jira...</p>
        </div>
      </div>
    );
  }

  const canAdd = quota && quota.remaining > 0;
  const planColors = {
    'starter': 'bg-blue-100 text-blue-800',
    'growth': 'bg-purple-100 text-purple-800',
    'pro': 'bg-emerald-100 text-emerald-800',
    'enterprise': 'bg-indigo-100 text-indigo-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to={createPageUrl('Dashboard')}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour au Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Sélectionner des projets Jira</h1>
              <p className="text-slate-600 mt-1">Choisissez les projets à analyser selon votre plan</p>
            </div>
          </div>
        </motion.div>

        {/* Quota Info */}
        {quota && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-1">Votre plan Nova</p>
                    <div className="flex items-center gap-2">
                      <Badge className={planColors[quota.plan.toLowerCase()]}>
                        {quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1)}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {quota.used} / {quota.limit} projets utilisés
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{quota.remaining}</p>
                    <p className="text-xs text-slate-500">slot(s) disponible(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Projects List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-2"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Projets disponibles</h2>
            <div className="space-y-3">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectProject(project)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProject?.id === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {project.avatarUrl && (
                        <img
                          src={project.avatarUrl}
                          alt={project.name}
                          className="w-8 h-8 rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-500">{project.key}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {project.type === 'software' ? 'Software' : 'Team-Managed'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Selection Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1"
          >
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProject ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">
                        {selectedProject.name}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">{selectedProject.key}</p>
                    </div>

                    {canAdd ? (
                      <Button
                        onClick={() => handleCreate('add')}
                        disabled={creating}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {creating ? 'Création...' : 'Ajouter ce projet'}
                      </Button>
                    ) : (
                      <div className="text-xs text-slate-600 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="font-medium text-amber-900">Quota atteint</p>
                        <p>Vous pouvez remplacer un projet existant.</p>
                      </div>
                    )}

                    {existingWorkspaces.length > 0 && (
                      <>
                        <div className="border-t pt-4">
                          <p className="text-xs font-medium text-slate-700 mb-2">Remplacer un projet existant:</p>
                          <div className="space-y-2">
                            {existingWorkspaces.map((ws) => (
                              <button
                                key={ws.id}
                                onClick={() => setReplacingWorkspaceId(replacingWorkspaceId === ws.id ? null : ws.id)}
                                className={`w-full p-2 text-left text-xs rounded border transition-all ${
                                  replacingWorkspaceId === ws.id
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <p className="font-medium text-slate-900">{ws.project_name}</p>
                                <p className="text-slate-500">{ws.project_key}</p>
                              </button>
                            ))}
                          </div>
                          {replacingWorkspaceId && (
                            <Button
                              onClick={() => handleCreate('replace')}
                              disabled={creating}
                              className="w-full mt-3 bg-amber-600 hover:bg-amber-700"
                            >
                              {creating ? 'Remplacement...' : 'Remplacer ce projet'}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600">Sélectionnez un projet pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}