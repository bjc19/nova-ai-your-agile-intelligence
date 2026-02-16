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

export default function QuickStats({ analysisHistory = [] }) {
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
        setUserRole(user.role || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchSignals = async () => {
      const cacheKey = 'gdpr_markers_stats';
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
      
      if (cached && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < 5 * 60 * 1000) {
          const { slack, teams, jira } = JSON.parse(cached);
          setGdprSignals(slack);
          setTeamsInsights(teams);
          setGdprSignals(prev => [...slack, ...jira]);
          return;
        }
      }
      
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const allMarkers = await base44.entities.GDPRMarkers.list('-created_date', 100);
        
        // Separate by source
        const slackMarkers = allMarkers.filter(m => 
          m.detection_source === 'slack_hourly' || m.detection_source === 'slack_daily' || m.detection_source === 'manual_trigger'
        );
        
        const teamsMarkers = allMarkers.filter(m => 
          m.detection_source === 'teams_daily'
        );

        const jiraMarkers = allMarkers.filter(m => 
          m.detection_source === 'jira_backlog'
        );
        
        // Filter by period if available
        const selectedPeriod = sessionStorage.getItem("selectedPeriod");
        let filteredSlack = slackMarkers.filter(m => new Date(m.created_date) >= sevenDaysAgo);
        let filteredTeams = teamsMarkers.filter(m => new Date(m.created_date) >= sevenDaysAgo);
        let filteredJira = jiraMarkers.filter(m => new Date(m.created_date) >= sevenDaysAgo);
        
        if (selectedPeriod) {
          const period = JSON.parse(selectedPeriod);
          const startDate = new Date(period.start);
          const endDate = new Date(period.end);
          endDate.setHours(23, 59, 59, 999);
          
          filteredSlack = slackMarkers.filter(m => {
            const markerDate = new Date(m.created_date);
            return markerDate >= startDate && markerDate <= endDate;
          });
          
          filteredTeams = teamsMarkers.filter(m => {
            const markerDate = new Date(m.created_date);
            return markerDate >= startDate && markerDate <= endDate;
          });

          filteredJira = jiraMarkers.filter(m => {
            const markerDate = new Date(m.created_date);
            return markerDate >= startDate && markerDate <= endDate;
          });
        }
        
        setGdprSignals(filteredSlack);
        setTeamsInsights(filteredTeams);
        // Store Jira data in gdprSignals too (will be separated by detection_source)
        setGdprSignals(prev => [...filteredSlack, ...filteredJira]);
        
        // Cache results
        sessionStorage.setItem(cacheKey, JSON.stringify({
          slack: filteredSlack,
          teams: filteredTeams,
          jira: filteredJira
        }));
        sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      } catch (error) {
        console.error("Erreur chargement signaux:", error);
      }
    };

    fetchSignals();
  }, []);

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
      navigate(createPageUrl("Details"));
    }
  };
  
  // Count items (match Details page logic)
  const analysisBlockers = analysisHistory.flatMap((a) => 
    (a.analysis_data?.blockers || []).filter(b => b.urgency)
  ).length;
  const analysisRisks = analysisHistory.flatMap((a) => 
    (a.analysis_data?.risks || [])
  ).length;
  
  // Count GDPR markers (Slack): critique/haute → blockers, moyenne → risks
  const slackBlockers = gdprSignals.filter(s => s.detection_source === 'slack_hourly' || s.detection_source === 'slack_daily').filter(s => s.criticite === 'critique' || s.criticite === 'haute').length;
  const slackRisks = gdprSignals.filter(s => s.detection_source === 'slack_hourly' || s.detection_source === 'slack_daily').filter(s => s.criticite === 'moyenne' || s.criticite === 'basse').length;
  
  // Count Jira markers: critique/haute → blockers, moyenne/basse → risks
  const jiraBlockers = gdprSignals.filter(s => s.detection_source === 'jira_backlog').filter(s => s.criticite === 'critique' || s.criticite === 'haute').length;
  const jiraRisks = gdprSignals.filter(s => s.detection_source === 'jira_backlog').filter(s => s.criticite === 'moyenne' || s.criticite === 'basse').length;
  
  // Count Teams markers: critique/haute → blockers, moyenne/basse → risks
  const teamsBlockers = teamsInsights.filter(i => i.criticite === 'critique' || i.criticite === 'haute').length;
  const teamsRisks = teamsInsights.filter(i => i.criticite === 'moyenne' || i.criticite === 'basse').length;
  
  const totalBlockers = (analysisBlockers || 0) + slackBlockers + jiraBlockers + teamsBlockers;
  const totalRisks = (analysisRisks || 0) + slackRisks + jiraRisks + teamsRisks;
  const resolvedBlockers = Math.floor(totalBlockers * 0.6); // Simulated
  
  // Calculate Technical Health Index (IST) = Resolved / (Blockers + Risks)
  const denominator = totalBlockers + totalRisks;
  const technicalHealthIndex = denominator > 0 ? (resolvedBlockers / denominator).toFixed(1) : 0;
  const healthStatus = technicalHealthIndex > 1 ? "healthy" : "critical";
  
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
    const cacheKey = `tooltip-${language}`;
    
    if (translatedTooltips[cacheKey]) {
      return translatedTooltips[cacheKey];
    }
    
    if (language === 'fr') {
      const tooltip = {
        title: "Indice de Santé Technique (IST)",
        formula: `Résolus (${resolvedBlockers}) ÷ (Bloquants + Risques) = ${resolvedBlockers} ÷ ${denominator} = ${technicalHealthIndex}`,
        interpretation: technicalHealthIndex > 1 
          ? `✓ Excellent : Vous résolvez plus de problèmes que vous n'en créez.`
          : `⚠ À améliorer : Vous avez plus de problèmes que de résolutions.`,
        tips: technicalHealthIndex > 1
          ? "Continuez à résoudre les bloquants et risques détectés."
          : "Priorisez la résolution des bloquants avant d'ajouter de nouvelles tâches.",
      };
      setTranslatedTooltips(prev => ({...prev, [cacheKey]: tooltip}));
      return tooltip;
    } else {
      const tooltip = {
        title: "Technical Health Index (IST)",
        formula: `Resolved (${resolvedBlockers}) ÷ (Blockers + Risks) = ${resolvedBlockers} ÷ ${denominator} = ${technicalHealthIndex}`,
        interpretation: technicalHealthIndex > 1
          ? `✓ Excellent: You're resolving more problems than you're creating.`
          : `⚠ Needs improvement: You have more problems than resolutions.`,
        tips: technicalHealthIndex > 1
          ? "Keep resolving detected blockers and risks."
          : "Prioritize resolving blockers before adding new tasks.",
      };
      setTranslatedTooltips(prev => ({...prev, [cacheKey]: tooltip}));
      return tooltip;
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
                   <p className="text-3xl font-bold text-slate-900">{stat.value}{stat.suffix || ''}</p>
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