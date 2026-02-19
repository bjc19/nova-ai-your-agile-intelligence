import { motion } from "framer-motion";
      import { useNavigate } from "react-router-dom";
      import { useEffect, useState, useRef } from "react";
      import { createPageUrl } from "@/utils";
      import { base44 } from "@/api/base44Client";
      import { getCacheService } from "@/components/hooks/useCacheService";
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

export default function QuickStats({ analysisHistory = [], currentPageName = "Dashboard", selectedWorkspaceId = null, gdprSignals: propGdprSignals = null }) {
   // CRITICAL: No rendering if no workspace selected OR workspace has zero data
   if (selectedWorkspaceId && analysisHistory.length === 0) {
     return null;
   }
   const { t, language } = useLanguage();
   const navigate = useNavigate();
   const [gdprSignals, setGdprSignals] = useState(propGdprSignals || []);
   const [teamsInsights, setTeamsInsights] = useState([]);
   const [resolvedItems, setResolvedItems] = useState([]);
   const [userRole, setUserRole] = useState('user');
   const [currentPage, setCurrentPage] = useState(0);
   const [translatedTooltips, setTranslatedTooltips] = useState({});
   const [lastDayDate, setLastDayDate] = useState(null);
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

   // Update gdprSignals when propGdprSignals changes
   useEffect(() => {
     if (propGdprSignals && propGdprSignals.length > 0) {
       setGdprSignals(propGdprSignals);
     }
   }, [propGdprSignals]);

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
      if (selectedWorkspaceId) {
        sessionStorage.setItem("selectedWorkspaceId", selectedWorkspaceId);
      }
      navigate(createPageUrl("Details"));
    }
  };
  
  // Helper: check if item is resolved
  const isItemResolved = (itemId) => resolvedItems.includes(itemId);

  // SYNC WITH BlockersRisksTrendTable: Calculate same TOTALS as "Totaux" row (sum over 5-day trend period)
   const getTotalsData = () => {
     if (gdprSignals.length === 0 && analysisHistory.length === 0) {
       return { blockers: 0, risks: 0 };
     }

     // Build same 5-day range as BlockersRisksTrendTable (lines 42-45)
     const allSignals = [
       ...gdprSignals.map(s => new Date(s.created_date)),
       ...analysisHistory.map(a => new Date(a.created_date))
     ];

     if (allSignals.length === 0) {
       return { blockers: 0, risks: 0 };
     }

     const maxDate = new Date(Math.max(...allSignals.map(d => d.getTime())));
     const minDate = new Date(maxDate);
     minDate.setDate(minDate.getDate() - 4);

     // Filter signals within this 5-day window
     const last5DaysSignals = gdprSignals.filter(s => {
       const sDate = new Date(s.created_date);
       sDate.setHours(0, 0, 0, 0);
       return sDate.getTime() >= minDate.getTime();
     });

     const last5DaysAnalysis = analysisHistory.filter(a => {
       const aDate = new Date(a.created_date);
       aDate.setHours(0, 0, 0, 0);
       return aDate.getTime() >= minDate.getTime();
     });

     // Count by criticite (matching BlockersRisksTrendTable line 59-60)
     const gdprBlockers = last5DaysSignals.filter(s => s.criticite === 'critique' || s.criticite === 'haute').length;
     const gdprRisks = last5DaysSignals.filter(s => s.criticite === 'moyenne' || s.criticite === 'basse').length;

     const analysisBlockers = last5DaysAnalysis.flatMap(a => (a.analysis_data?.blockers || [])).length;
     const analysisRisks = last5DaysAnalysis.flatMap(a => (a.analysis_data?.risks || [])).length;

     return {
       blockers: gdprBlockers + analysisBlockers,
       risks: gdprRisks + analysisRisks
     };
   };

   const totalsData = getTotalsData();
   const totalBlockers = totalsData.blockers;
   const totalRisks = totalsData.risks;
  
  // IST = Resolved count from last day / Total items ever detected (all data)
  const resolvedBlockers = resolvedItems.length;
  const totalInitialProblems = (gdprSignals.length + analysisHistory.flatMap(a => [...(a.analysis_data?.blockers || []), ...(a.analysis_data?.risks || [])]).length);
  const technicalHealthIndex = totalInitialProblems > 0 ? ((resolvedBlockers / totalInitialProblems) * 100).toFixed(0) : 0;
  const healthStatus = technicalHealthIndex >= 50 ? "healthy" : "critical";
  
  // Only show stats if we have real data
  const hasRealData = gdprSignals.length > 0 || analysisHistory.length > 0 || resolvedItems.length > 0;

  const stats = hasRealData ? [
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
   ] : [];





  // Helper to generate tooltip for technicalHealth
   const getTechnicalHealthTooltip = () => {
     if (language === 'fr') {
       return {
         title: "Indice de Santé Technique (IST)",
         formula: `Résolus (${resolvedBlockers}) ÷ Total détecté (${totalInitialProblems}) × 100 = ${technicalHealthIndex}%`,
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
         formula: `Resolved (${resolvedBlockers}) ÷ Total detected (${totalInitialProblems}) × 100 = ${technicalHealthIndex}%`,
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

  if (!hasRealData) {
    return null; // Don't render if no real data
  }

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