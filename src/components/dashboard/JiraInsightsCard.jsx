import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { AlertCircle, RefreshCw, CheckCircle2, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';

export default function JiraInsightsCard() {
  const { t } = useLanguage();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('analyzeJiraBacklog');
      if (response.data.success) {
        setInsights(response.data.insights);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (!insights && !loading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Jira Backlog Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        {error && (
          <CardContent>
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </CardContent>
        )}

        {insights && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <div className="text-sm font-medium text-slate-600">Total Issues</div>
                <div className="text-2xl font-bold text-blue-600">{insights.totalIssues}</div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-amber-100">
                <div className="text-sm font-medium text-slate-600">Not Updated</div>
                <div className="text-2xl font-bold text-amber-600">{insights.blockedIssues}</div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-red-100">
                <div className="text-sm font-medium text-slate-600">High Priority</div>
                <div className="text-2xl font-bold text-red-600">{insights.highPriorityIssues}</div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-orange-100">
                <div className="text-sm font-medium text-slate-600">Unassigned</div>
                <div className="text-2xl font-bold text-orange-600">{insights.unassignedIssues}</div>
              </div>
            </div>

            {insights.oldestIssue && (
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-start gap-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-600">Oldest Issue</div>
                    <div className="text-sm text-slate-700 font-semibold">{insights.oldestIssue.key}</div>
                    <div className="text-xs text-slate-500 mt-1">{insights.oldestIssue.daysOld} days old</div>
                  </div>
                </div>
              </div>
            )}

            {insights.recommendations.length > 0 && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <AlertCircle className="w-4 h-4" />
                  Recommendations
                </div>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}