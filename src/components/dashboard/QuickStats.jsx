import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
   AlertOctagon,
   ShieldAlert,
   CheckCircle2,
   Activity,
   HelpCircle
 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { adaptMessage } from "./RoleBasedMessaging";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { anonymizeFirstName } from "@/components/nova/anonymizationEngine";

export default function QuickStats({ analysisHistory = [], currentPageName = "Dashboard", selectedWorkspaceId = null }) {
   const { t, language } = useLanguage();
   const navigate = useNavigate();
  const [gdprSignals, setGdprSignals] = useState([]);
  const [teamsInsights, setTeamsInsights] = useState([]);
  const [resolvedItems, setResolvedItems] = useState([]);
  const [userRole, setUserRole] = useState('user');
  const [currentPage, setCurrentPage] = useState(0);
  const [translatedTooltips, setTranslatedTooltips] = useState({});
  const itemsPerPage = 10;

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await base44.auth.me();
        setUserRole(user?.app_role || user?.role || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
     const fetchSignals = async () => {
       try {
         const sevenDaysAgo = new Date();
         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

         const allMarkers = await base44.entities.GDPRMarkers.list('-created_date', 10000);
         const resolvedEntities = await base44.entities.ResolvedItem.list('-resolved_date', 10000);

         // Filter by workspace if selected
         let workspaceMarkers = allMarkers;
         let workspaceResolved = resolvedEntities;

         if (selectedWorkspaceId) {
           workspaceMarkers = allMarkers.filter(m => m.team_id === selectedWorkspaceId || m.jira_project_selection_id === selectedWorkspaceId);
           workspaceResolved = resolvedEntities.filter(r => r.workspace_id === selectedWorkspaceId || r.jira_project_selection_id === selectedWorkspaceId);
         }

         const slackMarkers = workspaceMarkers.filter(m => 
           m.detection_source === 'slack_hourly' || m.detection_source === 'slack_daily' || m.detection_source === 'manual_trigger'
         );

         const teamsMarkers = workspaceMarkers.filter(m => 
           m.detection_source === 'teams_daily'
         );

         const jiraMarkers = workspaceMarkers.filter(m => 
           m.detection_source === 'jira_backlog'
         );

         const selectedPeriod = sessionStorage.getItem("selectedPeriod");
         let filteredSlack = slackMarkers.filter(m => new Date(m.created_date) >= sevenDaysAgo);
         let filteredTeams = teamsMarkers.filter(m => new Date(m.created_date) >= sevenDaysAgo);
         let filteredJira = jiraMarkers.filter(m => new Date(m.created_date) >= sevenDaysAgo);
         let filteredResolved = workspaceResolved;

         if (selectedPeriod) {
           const period = JSON.parse(selectedPeriod);
           const startDate = new Date(period.start);
           const endDate = new Date(period.end);
           endDate.setHours(23, 59, 59, 999);

           filteredSlack = slackMarkers.filter(m => new Date(m.created_date) >= startDate && new Date(m.created_date) <= endDate);
           filteredTeams = teamsMarkers.filter(m => new Date(m.created_date) >= startDate && new Date(m.created_date) <= endDate);
           filteredJira = jiraMarkers.filter(m => new Date(m.created_date) >= startDate && new Date(m.created_date) <= endDate);
           filteredResolved = workspaceResolved.filter(r => {
             const resolvedDate = new Date(r.data?.resolved_date || r.resolved_date);
             return resolvedDate >= startDate && resolvedDate <= endDate;
           });
         }

         setGdprSignals([...filteredSlack, ...filteredJira]);
         setTeamsInsights(filteredTeams);
         setResolvedItems(filteredResolved.map(item => item.item_id));
       } catch (error) {
         console.error("Erreur chargement signaux:", error);
       }
     };

     fetchSignals();

     const handleFocus = () => {
       fetchSignals();
     };
     window.addEventListener('focus', handleFocus);

     // Listen for resolved count changes in sessionStorage
     const handleStorageChange = () => {
       fetchSignals();
     };
     window.addEventListener('storage', handleStorageChange);

     return () => {
       window.removeEventListener('focus', handleFocus);
       window.removeEventListener('storage', handleStorageChange);
     };
     }, [selectedWorkspaceId]);

  // Anonymize names in text
  const anonymizeNamesInText = (text) => {
    if (!text) return text;

    // Extract potential names (capitalized words) and anonymize them
    const namePattern = /\b([A-ZÀ-ÿ][a-zà-ÿ]+)\b/g;
    return text.replace(namePattern, (match) => {
      // Don't anonymize common words, articles, etc.
      const commonWords = ['Vous', 'Excellent', 'À', 'Continuez', 'Priorisez', 'You', 'Needs', 'Keep', 'Prioritize', 'Resolved', 'Blockers', 'Risks', 'IST'];
      if (commonWords.includes(match)) return match;
      return anonymizeFirstName(match);
    });
  };

  const handleStatClick = (labelKey) => {
     let detailType = null;
     if (labelKey === "totalBlockers") {
       detailType = "blockers";
     } else if (labelKey === "risksIdentified") {
       detailType = "risks";
     } else if (labelKey === "resolved") {
       detailType = "resolved";
     }

    if (detailType) {
      sessionStorage.setItem("detailsType", detailType);
      sessionStorage.setItem("previousDashboard", currentPageName);
      navigate(createPageUrl("Details"));
    }
  };
  
  // Helper: check if item is resolved
  const isItemResolved = (itemId) => resolvedItems.includes(itemId);

  // Count UNRESOLVED items (for display purposes)
  const analysisBlockers = analysisHistory.flatMap((a, idx) => 
    (a.analysis_data?.blockers || []).filter((b, bidx) => 
      b.urgency && !isItemResolved(`${idx}-${bidx}`)
    )
  ).length;
  const analysisRisks = analysisHistory.flatMap((a, idx) => 
    (a.analysis_data?.risks || []).filter((r, ridx) => 
      !isItemResolved(`${idx}-${ridx}`)
    )
  ).length;

  // Count GDPR markers (Slack): critique/haute → blockers, moyenne → risks - EXCLUDING resolved
  const slackBlockers = gdprSignals
    .filter(s => s.detection_source === 'slack_hourly' || s.detection_source === 'slack_daily')
    .filter(s => s.criticite === 'critique' || s.criticite === 'haute')
    .filter(s => !isItemResolved(`gdpr-blocker-${s.id}`))
    .length;
  const slackRisks = gdprSignals
    .filter(s => s.detection_source === 'slack_hourly' || s.detection_source === 'slack_daily')
    .filter(s => s.criticite === 'moyenne' || s.criticite === 'basse')
    .filter(s => !isItemResolved(`gdpr-risk-${s.id}`))
    .length;

  // Count Jira markers: critique/haute → blockers, moyenne/basse → risks - EXCLUDING resolved
  const jiraBlockers = gdprSignals
    .filter(s => s.detection_source === 'jira_backlog')
    .filter(s => s.criticite === 'critique' || s.criticite === 'haute')
    .filter(s => !isItemResolved(`jira-blocker-${s.id}`))
    .length;
  const jiraRisks = gdprSignals
    .filter(s => s.detection_source === 'jira_backlog')
    .filter(s => s.criticite === 'moyenne' || s.criticite === 'basse')
    .filter(s => !isItemResolved(`jira-risk-${s.id}`))
    .length;

  // Count Teams markers: critique/haute → blockers, moyenne/basse → risks - EXCLUDING resolved
  const teamsBlockers = teamsInsights
    .filter(i => i.criticite === 'critique' || i.criticite === 'haute')
    .filter(i => !isItemResolved(`teams-blocker-${i.id}`))
    .length;
  const teamsRisks = teamsInsights
    .filter(i => i.criticite === 'moyenne' || i.criticite === 'basse')
    .filter(i => !isItemResolved(`teams-risk-${i.id}`))
    .length;

  const totalBlockers = (analysisBlockers || 0) + slackBlockers + jiraBlockers + teamsBlockers;
  const totalRisks = (analysisRisks || 0) + slackRisks + jiraRisks + teamsRisks;
  
  // Count ALL items (including resolved) for IST calculation
  const allAnalysisBlockers = analysisHistory.flatMap((a) => 
    (a.analysis_data?.blockers || []).filter((b) => b.urgency)
  ).length;
  const allAnalysisRisks = analysisHistory.flatMap((a) => 
    (a.analysis_data?.risks || [])
  ).length;
  
  const allSlackBlockers = gdprSignals
    .filter(s => s.detection_source === 'slack_hourly' || s.detection_source === 'slack_daily')
    .filter(s => s.criticite === 'critique' || s.criticite === 'haute')
    .length;
  const allSlackRisks = gdprSignals
    .filter(s => s.detection_source === 'slack_hourly' || s.detection_source === 'slack_daily')
    .filter(s => s.criticite === 'moyenne' || s.criticite === 'basse')
    .length;
  
  const allJiraBlockers = gdprSignals
    .filter(s => s.detection_source === 'jira_backlog')
    .filter(s => s.criticite === 'critique' || s.criticite === 'haute')
    .length;
  const allJiraRisks = gdprSignals
    .filter(s => s.detection_source === 'jira_backlog')
    .filter(s => s.criticite === 'moyenne' || s.criticite === 'basse')
    .length;
  
  const allTeamsBlockers = teamsInsights
    .filter(i => i.criticite === 'critique' || i.criticite === 'haute')
    .length;
  const allTeamsRisks = teamsInsights
    .filter(i => i.criticite === 'moyenne' || i.criticite === 'basse')
    .length;
  
  const totalAllBlockers = (allAnalysisBlockers || 0) + allSlackBlockers + allJiraBlockers + allTeamsBlockers;
  const totalAllRisks = (allAnalysisRisks || 0) + allSlackRisks + allJiraRisks + allTeamsRisks;
  
  const resolvedBlockers = resolvedItems.length;
  
  // Calculate Technical Health Index (IST) = Resolved / (All Problems Ever Detected)
  // Total = ALL blockers + ALL risks (including those now resolved)
  const totalInitialProblems = totalAllBlockers + totalAllRisks;
  const technicalHealthIndex = totalInitialProblems > 0 ? ((resolvedBlockers / totalInitialProblems) * 100).toFixed(0) : 0;
  const healthStatus = technicalHealthIndex >= 50 ? "healthy" : "critical";
  
  const stats = [
     {
       labelKey: "totalBlockers",
       value: totalBlockers,
       icon: AlertOctagon,
       color: "from-blue-500 to-blue-600",
       bgColor: "bg-blue-500/10",
       textColor: "text-blue-600",
     },
     {
       labelKey: "risksIdentified",
       value: totalRisks,
       icon: ShieldAlert,
       color: "from-amber-500 to-amber-600",
       bgColor: "bg-amber-500/10",
       textColor: "text-amber-600",
     },
     {
      labelKey: "resolved",
      value: resolvedBlockers,
      icon: CheckCircle2,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-600",
    },
    {
      labelKey: "technicalHealth",
      value: technicalHealthIndex,
      icon: Activity,
      color: healthStatus === "healthy" ? "from-green-500 to-green-600" : "from-red-500 to-red-600",
      bgColor: healthStatus === "healthy" ? "bg-green-500/10" : "bg-red-500/10",
      textColor: healthStatus === "healthy" ? "text-green-600" : "text-red-600",
    },
  ];





  // Helper to generate tooltip for technicalHealth
  const getTechnicalHealthTooltip = () => {
    const totalAllProblems = totalAllBlockers + totalAllRisks;
    
    if (language === 'fr') {
      return {
        title: "Indice de Santé Technique (IST)",
        formula: `Résolus (${resolvedBlockers}) ÷ (Bloquants + Risques détectés) (${totalAllProblems}) × 100 = ${technicalHealthIndex}%`,
        interpretation: technicalHealthIndex >= 50
          ? `✓ Excellent : ${technicalHealthIndex}% des problèmes détectés ont été résolus.`
          : `⚠ À améliorer : Seulement ${technicalHealthIndex}% des problèmes détectés ont été résolus.`,
        tips: technicalHealthIndex >= 50
          ? "Continuez à résoudre les bloquants et risques détectés."
          : "Priorisez la résolution des bloquants avant d'ajouter de nouvelles tâches.",
      };
    } else {
      return {
        title: "Technical Health Index (IST)",
        formula: `Resolved (${resolvedBlockers}) ÷ (Blockers + Risks detected) (${totalAllProblems}) × 100 = ${technicalHealthIndex}%`,
        interpretation: technicalHealthIndex >= 50
          ? `✓ Excellent: ${technicalHealthIndex}% of detected problems have been resolved.`
          : `⚠ Needs improvement: Only ${technicalHealthIndex}% of detected problems have been resolved.`,
        tips: technicalHealthIndex >= 50
          ? "Keep resolving detected blockers and risks."
          : "Prioritize resolving blockers before adding new tasks.",
      };
    }
  };

  const paginatedStats = stats.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const totalPages = Math.ceil(stats.length / itemsPerPage);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {paginatedStats.map((stat, index) => {
             const isHealthCard = stat.labelKey === "technicalHealth";
             const healthTooltip = isHealthCard ? getTechnicalHealthTooltip() : null;

             return (
               <motion.div
                 key={stat.labelKey}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.4, delay: 0.1 * index }}
                 onClick={() => handleStatClick(stat.labelKey)}
                 className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all"
               >
                 <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${stat.bgColor} -translate-y-1/2 translate-x-1/2`} />
                 <div className="relative">
                   <div className="flex items-center gap-2 mb-3">
                     <div className={`inline-flex p-2 rounded-xl ${stat.bgColor}`}>
                       <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                     </div>
                     {isHealthCard && (
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
                         </TooltipTrigger>
                         <TooltipContent className="max-w-xs" side="top">
                           <div className="space-y-2 text-xs">
                             <p className="font-semibold text-slate-100">{healthTooltip?.title}</p>
                             <p className="text-slate-300">{healthTooltip?.formula}</p>
                             <p className="text-slate-300 italic">{healthTooltip?.interpretation}</p>
                             <p className="text-slate-400 border-t border-slate-600 pt-2">{healthTooltip?.tips}</p>
                           </div>
                         </TooltipContent>
                       </Tooltip>
                     )}
                   </div>
                   <p className="text-3xl font-bold text-slate-900">{stat.value}{isHealthCard ? '%' : (stat.suffix || '')}</p>
                   <p className="text-sm text-slate-500 mt-1">{adaptMessage(stat.labelKey, userRole)}</p>
                 </div>
               </motion.div>
             );
           })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            {Array.from({ length: totalPages }).map((_, page) => (
              <motion.button
                key={page}
                onClick={() => setCurrentPage(page)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentPage === page ? 'bg-slate-900 w-8' : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Page ${page + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}