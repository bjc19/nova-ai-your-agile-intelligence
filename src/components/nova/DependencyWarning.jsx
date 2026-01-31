import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, XCircle } from "lucide-react";

export default function DependencyWarning({ warning, compact = false }) {
  if (!warning) return null;

  const severityConfig = {
    critical: {
      icon: XCircle,
      color: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    info: {
      icon: Info,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  };

  const config = severityConfig[warning.severity] || severityConfig.warning;
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge variant="outline" className={`${config.bgColor} ${config.color} border-amber-300 text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        {warning.confidence}
      </Badge>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${config.color} mb-1`}>{warning.title}</p>
          <p className="text-sm text-slate-700 mb-1">{warning.message}</p>
          <p className="text-xs font-medium text-slate-600 mb-2">{warning.confidence}</p>

          {warning.missingEnablers && warning.missingEnablers.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-slate-600 mb-1">Données manquantes :</p>
              <ul className="space-y-1">
                {warning.missingEnablers.map((enabler, index) => (
                  <li key={index} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-red-500">•</span>
                    <span><strong>{enabler.name}</strong> – {enabler.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warning.partialEnablers && warning.partialEnablers.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-slate-600 mb-1">Données partielles :</p>
              <ul className="space-y-1">
                {warning.partialEnablers.map((enabler, index) => (
                  <li key={index} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-amber-500">•</span>
                    <span><strong>{enabler.name}</strong> – {enabler.confidence}% disponible</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warning.alternativeAction && (
            <div className="mt-2 p-2 rounded-lg bg-white border border-slate-200">
              <p className="text-xs text-slate-700">
                <strong>Action alternative :</strong> {warning.alternativeAction}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}