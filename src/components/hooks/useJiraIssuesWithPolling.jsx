import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export const useJiraIssuesWithPolling = (jiraProjectKey, filterType = 'all', pollingInterval = 30) => {
  const [issues, setIssues] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingIntervalRef = useRef(null);
  const isActiveRef = useRef(true);

  const fetchIssues = async () => {
    if (!jiraProjectKey) {
      setError('Missing jiraProjectKey');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('getJiraIssuesByJQL', {
        jiraProjectKey,
        jqlFilter: filterType
      });

      if (response.data && response.data.success) {
        setIssues(response.data.issues || []);
        setStatistics(response.data.statistics || null);
        setLastUpdated(new Date());
        console.log(`✅ Fetched ${response.data.total_issues} issues from Jira`);
      } else {
        setError(response.data?.error || 'Failed to fetch issues');
      }
    } catch (err) {
      console.error('Error fetching Jira issues:', err);
      setError(err.message || 'Failed to fetch Jira issues');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchIssues();
  }, [jiraProjectKey, filterType]);

  // Auto-polling setup
  useEffect(() => {
    if (!jiraProjectKey) return;

    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set up polling at focus
    const handleFocus = () => {
      isActiveRef.current = true;
      console.log('📊 Dashboard focused - starting polling');
      pollingIntervalRef.current = setInterval(() => {
        if (isActiveRef.current) {
          fetchIssues();
        }
      }, pollingInterval * 1000);
    };

    const handleBlur = () => {
      isActiveRef.current = false;
      console.log('📊 Dashboard blurred - stopping polling');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };

    // Check if tab is already focused
    if (document.visibilityState === 'visible') {
      isActiveRef.current = true;
      pollingIntervalRef.current = setInterval(() => {
        if (isActiveRef.current) {
          fetchIssues();
        }
      }, pollingInterval * 1000);
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        isActiveRef.current = true;
        console.log('📊 Tab visible - resuming polling');
        pollingIntervalRef.current = setInterval(() => {
          if (isActiveRef.current) {
            fetchIssues();
          }
        }, pollingInterval * 1000);
      } else {
        isActiveRef.current = false;
        console.log('📊 Tab hidden - pausing polling');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      }
    });
    window.addEventListener('blur', handleBlur);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleFocus);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [jiraProjectKey, filterType, pollingInterval]);

  return {
    issues,
    statistics,
    loading,
    error,
    lastUpdated,
    refetch: fetchIssues
  };
};