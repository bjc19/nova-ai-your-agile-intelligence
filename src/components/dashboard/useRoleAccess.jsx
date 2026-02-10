import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook to manage role-based access control
 * Returns user info and permission checkers
 */
export function useRoleAccess() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const role = user?.role || 'user';

  return {
    user,
    role,
    loading,
    isAdmin: role === 'admin',
    isContributor: role === 'contributor',
    isUser: role === 'user',
    canManageSettings: role === 'admin' || role === 'contributor',
    canCreateAnalysis: role === 'admin' || role === 'contributor',
    canViewDetails: role === 'admin' || role === 'contributor',
    canViewPatterns: role === 'admin',
    canViewTechnicalData: role === 'admin',
    canViewMetrics: role === 'admin' || role === 'contributor',
    canAccessIntegrations: role === 'admin' || role === 'contributor',
  };
}

/**
 * Permission levels for different features
 */
export const PERMISSIONS = {
  // Pages
  SETTINGS_PAGE: ['admin', 'contributor'],
  DETAILS_PAGE: ['admin', 'contributor'],
  ANTIPATTERNS_PAGE: ['admin'],
  
  // Dashboard sections
  MULTI_PROJECT_ALERT: ['admin'],
  INTEGRATION_MANAGEMENT: ['admin', 'contributor'],
  SYNC_STATUS: ['admin'],
  
  // Technical data
  PATTERN_IDS: ['admin'],
  CONFIDENCE_SCORES: ['admin'],
  SOURCE_DETAILS: ['admin'],
  GDPR_NAMES: ['admin', 'contributor'],
  
  // Actions
  MANAGE_INTEGRATIONS: ['admin', 'contributor'],
  VIEW_EXTERNAL_LINKS: ['admin', 'contributor'],
  EXPAND_RECOMMENDATIONS: ['admin', 'contributor'],
  
  // Metrics
  DETAILED_METRICS: ['admin', 'contributor'],
  SPRINT_METRICS: ['admin', 'contributor'],
  HISTORICAL_DATA: ['admin'],
};

/**
 * Check if user has permission for a feature
 */
export function hasPermission(userRole, permissionKey) {
  const allowedRoles = PERMISSIONS[permissionKey];
  if (!allowedRoles) return true; // If not defined, allow by default
  return allowedRoles.includes(userRole);
}