import { motion } from 'framer-motion';
import { useJiraSprintPolling } from '@/components/hooks/useJiraSprintPolling';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Loader2, RefreshCw, AlertTriangle, Clock, Zap } from 'lucide-react';

export default function JiraSprintAnalysisDisplay({ jiraProjectSelectionId }) {
  const { data, loading, error, lastFetched, refetch } = useJiraSprintPolling(
    jiraProjectSelectionId,
    30000 // 30 second polling interval
  );

  if (!jiraProjectSelectionId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-600">Select a Jira project to view sprint analysis</p>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-600">Loading sprint analysis...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Failed to load sprint analysis</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="mt-3 gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || !data.sprint_name) {
    return (
      <Card className="p-6 border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">No active sprint</p>
            <p className="text-xs text-amber-700 mt-1">
              There is no active sprint for the selected Jira project
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getPriorityColor = (priority) => {
    if (!priority) return 'slate';
    if (priority.includes('Highest') || priority.includes('High')) return 'red';
    if (priority.includes('Medium')) return 'amber';
    return 'slate';
  };

  const getStatusColor = (status) => {
    if (!status) return 'slate';
    if (status.includes('To Do') || status.includes('Backlog')) return 'slate';
    if (status.includes('In Progress')) return 'blue';
    if (status.includes('Done')) return 'green';
    return 'slate';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Sprint Analysis</h3>
              <p className="text-sm text-slate-600 mt-1">{data.sprint_name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">Blockers</span>
              </div>
              <p className="text-xl font-bold text-red-900">{data.stats.blockers}</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Risks</span>
              </div>
              <p className="text-xl font-bold text-amber-900">{data.stats.risks}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Stagnant</span>
              </div>
              <p className="text-xl font-bold text-blue-900">{data.stats.stagnant}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">High Priority</span>
              </div>
              <p className="text-xl font-bold text-purple-900">{data.stats.high_priority}</p>
            </div>
          </div>

          {/* Issues List */}
          {data.issues && data.issues.length > 0 && (
            <>
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Problematic Issues ({data.issues.length})
                </h4>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {data.issues.map((issue, idx) => (
                    <a
                      key={idx}
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-blue-600 group-hover:text-blue-700 font-semibold">
                            {issue.key}
                          </p>
                          <p className="text-xs text-slate-700 mt-0.5 line-clamp-2">
                            {issue.summary}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs flex-shrink-0 bg-${getPriorityColor(issue.priority)}-50 border-${getPriorityColor(issue.priority)}-200 text-${getPriorityColor(issue.priority)}-700`}
                        >
                          {issue.category === 'blocker' ? 'Blocker' : issue.category === 'risk' ? 'Risk' : 'Stagnant'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs bg-${getStatusColor(issue.status)}-50 border-${getStatusColor(issue.status)}-200 text-${getStatusColor(issue.status)}-700`}
                        >
                          {issue.status}
                        </Badge>
                        {issue.days_in_status && (
                          <span className="text-xs text-slate-500">
                            {issue.days_in_status}d
                          </span>
                        )}
                        {issue.assignee && (
                          <span className="text-xs text-slate-600 truncate">
                            {issue.assignee}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {(!data.issues || data.issues.length === 0) && (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">No problematic issues detected 🎉</p>
            </div>
          )}

          {/* Last Updated */}
          {lastFetched && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Last updated: {lastFetched.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}