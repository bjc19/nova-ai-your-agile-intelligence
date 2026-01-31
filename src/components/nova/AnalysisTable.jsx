import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function AnalysisTable({ data }) {
  const { language } = useLanguage();

  const urgencyLabels = {
    high: language === 'fr' ? 'Élevée' : 'High',
    medium: language === 'fr' ? 'Moyenne' : 'Medium',
    low: language === 'fr' ? 'Basse' : 'Low',
  };

  const urgencyConfig = {
    high: { 
      label: urgencyLabels.high, 
      className: "bg-red-100 text-red-700 border-red-200",
      icon: AlertTriangle
    },
    medium: { 
      label: urgencyLabels.medium, 
      className: "bg-amber-100 text-amber-700 border-amber-200",
      icon: AlertCircle
    },
    low: { 
      label: urgencyLabels.low, 
      className: "bg-slate-100 text-slate-600 border-slate-200",
      icon: Info
    },
  };

  const columnLabels = {
    member: language === 'fr' ? 'Membre de l\'équipe' : 'Team Member',
    issue: language === 'fr' ? 'Problème identifié' : 'Identified Issue',
    urgency: language === 'fr' ? 'Urgence' : 'Urgency',
    action: language === 'fr' ? 'Action suggérée' : 'Suggested Action',
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Team Member
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Identified Issue
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Urgency
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Suggested Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => {
              const urgency = urgencyConfig[row.urgency];
              const UrgencyIcon = urgency.icon;
              
              return (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {row.member.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{row.member}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs">
                    {row.issue}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`${urgency.className} gap-1.5 font-medium`}>
                      <UrgencyIcon className="w-3 h-3" />
                      {urgency.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs">
                    {row.action}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}