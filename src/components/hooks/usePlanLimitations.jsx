import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function usePlanLimitations() {
  const [planLimitations, setPlanLimitations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchLimitations = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const response = await base44.functions.invoke('getUserSubscriptionStatus', {});
        const { planDetails } = response.data;

        setPlanLimitations(planDetails);
      } catch (error) {
        console.error('Error fetching plan limitations:', error);
        setPlanLimitations(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLimitations();
  }, []);

  const canCreateManualAnalysis = async () => {
    if (!planLimitations || !user) return false;

    if (planLimitations.manual_analysis_admin_only && user?.role !== 'admin') {
      return { allowed: false, reason: 'manual_analysis_admin_only' };
    }

    // Count existing manual analyses for this user
    if (planLimitations.max_manual_analyses) {
      const existingAnalyses = await base44.entities.AnalysisHistory.filter({
        source: { $in: ['transcript', 'file_upload'] }
      });

      if (existingAnalyses.length >= planLimitations.max_manual_analyses) {
        return { allowed: false, reason: 'max_manual_analyses_reached', limit: planLimitations.max_manual_analyses };
      }
    }

    return { allowed: true };
  };

  const canUsePrimarySource = (source) => {
    if (!planLimitations) return true;
    return planLimitations.primary_sources?.includes(source) ?? true;
  };

  const canUseContributiveSource = (source) => {
    if (!planLimitations) return true;
    return planLimitations.contributive_sources?.includes(source) ?? true;
  };

  return {
    planLimitations,
    loading,
    user,
    canCreateManualAnalysis,
    canUsePrimarySource,
    canUseContributiveSource
  };
}