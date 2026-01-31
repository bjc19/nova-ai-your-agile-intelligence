import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";
import {
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  Users,
  Clock,
  Target
} from "lucide-react";

const recommendationIcons = {
  escalation: AlertTriangle,
  collaboration: Users,
  timeline: Clock,
  priority: Target,
  default: Lightbulb,
};

export default function KeyRecommendations({ latestAnalysis = null }) {
  const { t } = useLanguage();
  
  // Sample recommendations for demo
  const sampleRecommendations = [
    {
      type: "escalation",
      title: "Escalate API Integration Blocker",
      description: "Third-party API support delay affecting 2 team members. Consider reaching out to vendor management.",
      priority: "high",
    },
    {
      type: "collaboration",
      title: "Schedule Cross-Team Sync",
      description: "Multiple dependencies identified between frontend and backend tasks. A 15-min sync could prevent delays.",
      priority: "medium",
    },
    {
      type: "timeline",
      title: "Review Sprint Timeline",
      description: "3 tasks at risk of missing the demo deadline. Consider scope adjustment or resource reallocation.",
      priority: "high",
    },
    {
      type: "priority",
      title: "Reprioritize Backlog Items",
      description: "Low-priority tasks blocking critical path items. Suggest moving database indexes task to top.",
      priority: "medium",
    },
  ];

  const recommendations = latestAnalysis?.recommendations 
    ? latestAnalysis.recommendations.map((rec, i) => ({
        type: "default",
        title: rec.substring(0, 50) + (rec.length > 50 ? "..." : ""),
        description: rec,
        priority: i === 0 ? "high" : "medium",
      }))
    : sampleRecommendations;

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {t('keyRecommendations')}
              </CardTitle>
              <p className="text-sm text-slate-500">{t('basedOnLatestAnalysis')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {recommendations.slice(0, 4).map((rec, index) => {
              const Icon = recommendationIcons[rec.type] || recommendationIcons.default;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="group p-4 rounded-xl border border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-amber-100 transition-colors">
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-amber-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-900 truncate">
                          {rec.title}
                        </h4>
                        <Badge variant="outline" className={`text-xs shrink-0 ${priorityColors[rec.priority]}`}>
                          {t(rec.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {rec.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 shrink-0 transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}