import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getRelevantComponents, getComponentConfig } from "./dashboardComponentRegistry";

// Import all dashboard components
import SprintHealthCard from "./SprintHealthCard";
import MetricsRadarCard from "../nova/MetricsRadarCard";
import RealityMapCard from "../nova/RealityMapCard";
import SprintPerformanceChart from "./SprintPerformanceChart";
import KeyRecommendations from "./KeyRecommendations";
import RecentAnalyses from "./RecentAnalyses";
import IntegrationStatus from "./IntegrationStatus";

const COMPONENT_MAP = {
  sprintHealth: SprintHealthCard,
  metricsRadar: MetricsRadarCard,
  realityEngine: RealityMapCard,
  sprintPerformance: SprintPerformanceChart,
  keyRecommendations: KeyRecommendations,
  recentAnalyses: RecentAnalyses,
  integrationStatus: IntegrationStatus
};

export default function DynamicDashboard({ analysisHistory, userRole = "user", latestAnalysis = null }) {
  const [situationProfile, setSituationProfile] = useState(null);
  const [relevantComponents, setRelevantComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Compute situation profile and filter components
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Get situation profile from backend
        const response = await base44.functions.invoke('computeSituationProfile', {});
        const profile = response.data;
        setSituationProfile(profile);

        // Get relevant components for this role and situation
        const components = getRelevantComponents(profile, userRole);
        setRelevantComponents(components);
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [userRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Analyse de votre situation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Erreur lors du chargement</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (relevantComponents.length === 0) {
    return (
      <div className="p-8 rounded-lg bg-slate-50 border border-slate-200 text-center">
        <p className="text-slate-600 mb-2">Pas de données pertinentes à afficher actuellement</p>
        <p className="text-sm text-slate-500">
          Réalisez une première analyse pour voir un dashboard personnalisé
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs p-3 bg-slate-100 rounded text-slate-600 font-mono">
          <p>Situation Score: {relevantComponents.length} composants • Role: {userRole}</p>
          <p>Top composant: {relevantComponents[0]?.name} ({relevantComponents[0]?.relevance}%)</p>
        </div>
      )}

      {/* Render relevant components */}
      {relevantComponents.map((component, index) => {
        const ComponentClass = COMPONENT_MAP[component.id];

        if (!ComponentClass) return null;

        return (
          <motion.div
            key={component.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ComponentClass
              config={component.config}
              situationProfile={situationProfile}
              analysisHistory={analysisHistory}
              latestAnalysis={latestAnalysis}
              relevanceScore={component.relevance}
            />
          </motion.div>
        );
      })}
    </div>
  );
}