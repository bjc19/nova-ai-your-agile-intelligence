import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, ShieldCheck } from "lucide-react";

export default function PilotModeIndicator({ pilotMode, compact = false }) {
  if (!pilotMode?.isPilot) {
    return compact ? null : (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
        <ShieldCheck className="w-3 h-3 mr-1" />
        Données validées
      </Badge>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              🟡 PILOTE
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{pilotMode.reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-amber-900">🟡 MODE PILOTE</span>
          <Badge variant="outline" className="text-xs bg-white border-amber-300 text-amber-700">
            Confiance {pilotMode.confidence}%
          </Badge>
        </div>
        <p className="text-xs text-amber-700 mb-1">{pilotMode.reason}</p>
        <p className="text-xs text-amber-600 font-medium">
          ⚠️ Validation Coach requise pour toute action critique
        </p>
      </div>
    </div>
  );
}