import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useJiraSprintPolling(jiraProjectSelectionId, pollIntervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    if (!jiraProjectSelectionId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('getJiraSprintAnalysis', {
        jiraProjectSelectionId
      });

      if (response?.data) {
        setData(response.data);
        setLastFetched(new Date());
        
        // Show toast if issues were detected
        if (response.data.issues?.length > 0) {
          toast.info(`Sprint "${response.data.sprint_name}": ${response.data.issues.length} issue(s) detected`, {
            duration: 4000
          });
        }
      }
    } catch (err) {
      const errorMsg = err?.message || 'Failed to fetch Jira sprint analysis';
      setError(errorMsg);
      toast.error(errorMsg, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, [jiraProjectSelectionId]);

  // Initial fetch
  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Set up polling interval
  useEffect(() => {
    if (!jiraProjectSelectionId) return;

    const interval = setInterval(() => {
      fetchAnalysis();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [jiraProjectSelectionId, pollIntervalMs, fetchAnalysis]);

  return {
    data,
    loading,
    error,
    lastFetched,
    refetch: fetchAnalysis
  };
}