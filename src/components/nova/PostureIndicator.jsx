import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { POSTURES } from "./PostureEngine";
import {
  AlertTriangle,
  Sparkles,
  Users,
  Network,
  Eye,
  LayoutList,
  Trophy
} from "lucide-react";

const iconMap = {
  AlertTriangle,
  Sparkles,
  Users,
  Network,
  Eye,
  LayoutList,
  Trophy
};

const colorMap = {
  red: {
    bg: "bg-red-100",
    border: "border-red-200",
    text: "text-red-700",
    icon: "text-red-600",
    gradient: "from-red-500 to-red-600"
  },
  emerald: {
    bg: "bg-emerald-100",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    gradient: "from-emerald-500 to-emerald-600"
  },
  blue: {
    bg: "bg-blue-100",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "text-blue-600",
    gradient: "from-blue-500 to-blue-600"
  },
  purple: {
    bg: "bg-purple-100",
    border: "border-purple-200",
    text: "text-purple-700",
    icon: "text-purple-600",
    gradient: "from-purple-500 to-purple-600"
  },
  slate: {
    bg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-700",
    icon: "text-slate-600",
    gradient: "from-slate-500 to-slate-600"
  },
  indigo: {
    bg: "bg-indigo-100",
    border: "border-indigo-200",
    text: "text-indigo-700",
    icon: "text-indigo-600",
    gradient: "from-indigo-500 to-indigo-600"
  },
  amber: {
    bg: "bg-amber-100",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: "text-amber-600",
    gradient: "from-amber-500 to-amber-600"
  }
};

export default function PostureIndicator({ postureId, size = "default", showDetails = false }) {
  const posture = POSTURES[postureId] || POSTURES.agile_coach;
  const colors = colorMap[posture.color] || colorMap.blue;
  const Icon = iconMap[posture.icon] || Sparkles;

  if (size === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`${colors.bg} ${colors.border} ${colors.text} gap-1.5 cursor-help`}
            >
              <Icon className="w-3 h-3" />
              {posture.name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium mb-1">{posture.name}</p>
            <p className="text-xs text-slate-500">{posture.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${colors.text}`}>
              Nova is in {posture.name} Mode
            </h4>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            {posture.description}
          </p>
          
          {showDetails && (
            <div className="space-y-1.5">
              {posture.characteristics.slice(0, 3).map((char, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.bg.replace('100', '500')}`} />
                  {char}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PostureBadge({ postureId }) {
  return <PostureIndicator postureId={postureId} size="compact" />;
}