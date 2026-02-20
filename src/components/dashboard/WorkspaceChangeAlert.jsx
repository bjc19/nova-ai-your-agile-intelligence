import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

/**
 * Displays an alert when the user changes the active workspace,
 * informing them of which contributing sources (Slack, Teams, historical analyses)
 * are still relevant to the new workspace context.
 *
 * Props:
 *   newWorkspaceId: string | null
 *   newWorkspaceType: 'jira' | 'trello' | null
 *   onDismiss: () => void
 */
export default function WorkspaceChangeAlert({ newWorkspaceId, newWorkspaceType, onDismiss }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!newWorkspaceId || !newWorkspaceType) return;

    const run = async () => {
      setLoading(true);
      setResult(null);
      setError(null);
      try {
        const res = await base44.functions.invoke('reconcileContributorySources', {
          new_workspace_id: newWorkspaceId,
          new_workspace_type: newWorkspaceType
        });
        setResult(res.data);
      } catch (err) {
        console.error('WorkspaceChangeAlert error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [newWorkspaceId, newWorkspaceType]);

  // If no workspace given or no alert needed (and finished loading), do not show
  if (!newWorkspaceId) return null;

  // If done loading, result exists, and no alert needed → dismiss silently
  if (!loading && result && !result.should_alert && !error) {
    onDismiss?.();
    return null;
  }

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Changement de workspace détecté
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-slate-600">
              {loading ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Analyse de la pertinence des sources en cours...</span>
                </div>
              ) : error ? (
                <p className="text-red-500">Erreur lors de l'analyse des sources : {error}</p>
              ) : result ? (
                <>
                  <p>
                    Vous avez changé de projet principal vers{" "}
                    <strong>{result.workspace_name}</strong>.
                    Nova a évalué la pertinence de vos sources contributives pour ce nouveau contexte.
                  </p>

                  {result.total_sources_evaluated === 0 ? (
                    <p className="text-slate-500 italic">Aucune source contributive (Slack, Teams) configurée pour ce workspace.</p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {result.assessments?.map((assessment, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            assessment.is_relevant
                              ? 'bg-green-50 border-green-200'
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          {assessment.is_relevant
                            ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            : <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium capitalize text-slate-700">
                                {assessment.source === 'historical_analyses' ? 'Analyses historiques' : assessment.source}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  assessment.is_relevant
                                    ? 'border-green-400 text-green-700'
                                    : 'border-amber-400 text-amber-700'
                                }`}
                              >
                                {Math.round((assessment.relevance_score || 0) * 100)}% pertinent
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">{assessment.justification}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.irrelevant_sources > 0 && (
                    <p className="text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                      ⚠️ {result.irrelevant_sources} source(s) sur {result.total_sources_evaluated} semblent peu pertinentes pour ce nouveau contexte.
                      Leurs signaux seront pondérés en conséquence lors des prochaines analyses.
                    </p>
                  )}
                </>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!loading && (
          <AlertDialogAction
            onClick={onDismiss}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Compris
          </AlertDialogAction>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}