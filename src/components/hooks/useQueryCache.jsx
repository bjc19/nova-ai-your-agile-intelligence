import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import React from 'react';

// Hook pour les patterns détectés avec caching 10 min
export const useDetectedRisks = (workspaceId) => {
  return useQuery({
    queryKey: ['detectedRisks', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const patterns = await base44.entities.PatternDetection.filter({
        status: { $ne: 'resolved' }
      }, '-updated_date', 100);
      return patterns || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes pour garder en mémoire
    refetchOnMount: 'stale', // Refetch si stale au retour
    enabled: !!workspaceId
  });
};

// Hook pour la santé des sprints
export const useSprintHealth = (workspaceId) => {
  return useQuery({
    queryKey: ['sprintHealth', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const sprints = await base44.entities.SprintHealth.filter({}, '-updated_date', 50);
      return sprints || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: 'stale',
    enabled: !!workspaceId
  });
};

// Hook pour le contexte team
export const useTeamContext = (workspaceId) => {
  return useQuery({
    queryKey: ['teamContext', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const contexts = await base44.entities.TeamContext.filter({}, '-updated_date', 1);
      return contexts?.[0] || null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: 'stale',
    enabled: !!workspaceId
  });
};

// Hook pour les analyses
export const useAnalysisHistory = (workspaceId) => {
  return useQuery({
    queryKey: ['analysisHistory', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const analyses = await base44.entities.AnalysisHistory.filter({}, '-updated_date', 20);
      return analyses || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: 'stale',
    enabled: !!workspaceId
  });
};

// Hook pour les anti-patterns
export const useAntiPatterns = () => {
  return useQuery({
    queryKey: ['antiPatterns'],
    queryFn: async () => {
      const patterns = await base44.entities.AntiPattern.filter(
        { is_active: true },
        'category',
        100
      );
      return patterns || [];
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 120 * 60 * 1000, // Plus long car change rarement
    refetchOnMount: 'stale'
  });
};

// Hook avec debouncing pour les changements de sélection
export const useDebouncedValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  const timeoutRef = useRef(null);

  React.useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);

  return debouncedValue;
};

// Hook combiné pour Workspace selection avec debounce
export const useDebouncedWorkspaceQuery = (workspaceId, delay = 500) => {
  const debouncedWorkspaceId = useDebouncedValue(workspaceId, delay);
  
  return {
    risks: useDetectedRisks(debouncedWorkspaceId),
    sprintHealth: useSprintHealth(debouncedWorkspaceId),
    teamContext: useTeamContext(debouncedWorkspaceId),
    analysisHistory: useAnalysisHistory(debouncedWorkspaceId)
  };
};