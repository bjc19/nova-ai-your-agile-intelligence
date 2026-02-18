import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { base44 } from "@/api/base44Client";

export default function TimePeriodSelector({ deliveryMode, onPeriodChange }) {
  const [selectedPeriod, setSelectedPeriod] = useState("default");
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("Sélectionner une période");
  const [detectedMode, setDetectedMode] = useState(null);

  // Options communes
  const commonOptions = [
    { value: "current_month", label: "Mois en cours" },
    { value: "last_quarter", label: "Trimestre écoulé" },
  ];

  // Options Scrum
  const scrumOptions = [
    { value: "current_sprint", label: "Sprint en cours" },
    { value: "last_3_sprints", label: "3 derniers sprints" },
    { value: "previous_sprint", label: "Sprint précédent" },
    ...commonOptions,
    { value: "custom", label: "Personnalisée" },
  ];

  // Options Kanban et Autre
  const kanbanAndOtherOptions = [
    { value: "current_week", label: "En cours (semaine active)" },
    { value: "last_3_weeks", label: "3 dernières semaines" },
    { value: "previous_week", label: "Semaine précédente" },
    ...commonOptions,
    { value: "custom", label: "Personnalisée" },
  ];

  // Détection du mode de livraison
  useEffect(() => {
    const detectMode = async () => {
      try {
        let detected = "Autre";
        const jiraSelections = await base44.entities.JiraProjectSelection.filter({ is_active: true });
        const trelloSelections = await base44.entities.TrelloProjectSelection.filter({ is_active: true });

        if (jiraSelections.length > 0) {
          const boardName = jiraSelections[0].board_name?.toLowerCase() || "";
          if (boardName.includes("scrum") || boardName.includes("sprint")) {
            detected = "Scrum";
          } else if (boardName.includes("kanban") || boardName.includes("flow")) {
            detected = "Kanban";
          }
        } else if (trelloSelections.length > 0) {
          const boardName = trelloSelections[0].board_name?.toLowerCase() || "";
          if (boardName.includes("scrum") || boardName.includes("sprint")) {
            detected = "Scrum";
          } else if (boardName.includes("kanban") || boardName.includes("flow")) {
            detected = "Kanban";
          }
        }
        setDetectedMode(detected);
      } catch (error) {
        console.error("Error detecting delivery mode:", error);
        setDetectedMode("Autre");
      }
    };

    detectMode();
  }, []);

  // Initialiser la période : restaurer depuis sessionStorage ou utiliser la période par défaut
  useEffect(() => {
    if (detectedMode) {
      // Vérifier si une période a été sauvegardée dans sessionStorage
      const savedPeriod = sessionStorage.getItem("selectedPeriod");
      
      if (savedPeriod) {
        try {
          const parsed = JSON.parse(savedPeriod);
          // Récupérer le type de période pour restaurer la sélection du Select
          const periodType = parsed.type || "current_sprint";
          setSelectedPeriod(periodType);
          // Recalculer pour mettre à jour le label et appeler onPeriodChange
          calculatePeriod(periodType);
        } catch (error) {
          console.error("Erreur restauration période:", error);
          // Fallback à la période par défaut
          const defaultPeriodForMode = detectedMode === "Scrum" ? "current_sprint" : "current_week";
          setSelectedPeriod(defaultPeriodForMode);
          calculatePeriod(defaultPeriodForMode);
        }
      } else {
        // Aucune période sauvegardée, utiliser la défaut
        const defaultPeriodForMode = detectedMode === "Scrum" ? "current_sprint" : "current_week";
        setSelectedPeriod(defaultPeriodForMode);
        calculatePeriod(defaultPeriodForMode);
      }
    }
  }, [detectedMode]);

  // Déterminer les options selon la méthodologie détectée
  const options = detectedMode === "Scrum" ? scrumOptions : kanbanAndOtherOptions;

  const calculateCompleteness = (start, end) => {
    const now = new Date();
    const daysInMonth = getDaysInMonth(now);
    const dayOfMonth = now.getDate();
    return { dayOfMonth, daysInMonth };
  };

  const getCompletenessColor = (percentage) => {
    if (percentage < 25) return "bg-orange-100 text-orange-700 border-orange-200";
    if (percentage < 75) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const calculatePeriod = (periodType) => {
    const now = new Date();
    let start, end, label = "";

    switch (periodType) {
      case "current_sprint":
        start = subWeeks(now, 1);
        end = now;
        label = "Sprint en cours";
        break;

      case "last_3_sprints":
        start = subWeeks(now, 6);
        end = now;
        label = "3 derniers sprints";
        break;

      case "previous_sprint":
        start = subWeeks(now, 3);
        end = subWeeks(now, 1);
        label = "Sprint précédent";
        break;

      case "last_3_weeks":
        start = subWeeks(now, 3);
        end = now;
        label = "3 dernières semaines";
        break;

      case "previous_week":
        start = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1);
        end = subWeeks(endOfWeek(now, { weekStartsOn: 1 }), 1);
        label = "Semaine précédente";
        break;

      case "current_week":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        label = "En cours (semaine active)";
        break;

      case "current_month":
        start = startOfMonth(now);
        end = now;
        const { dayOfMonth, daysInMonth } = calculateCompleteness(start, end);
        const monthName = format(now, "MMMM", { locale: fr });
        label = `${monthName} (1-${dayOfMonth}) - ${dayOfMonth}/${daysInMonth} jours`;
        break;

      case "last_quarter":
        start = subMonths(now, 3);
        end = now;
        label = "Trimestre écoulé";
        break;

      default:
        start = now;
        end = now;
    }

    setPeriodLabel(label);
    onPeriodChange({ start, end, type: periodType, label });
  };

  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);

    if (value === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      calculatePeriod(value);
    }
  };

  const applyCustomPeriod = () => {
    if (customStart && customEnd) {
      const diffMonths = (customEnd - customStart) / (1000 * 60 * 60 * 24 * 30);
      if (diffMonths > 6) {
        alert("La période ne peut pas dépasser 6 mois");
        return;
      }

      onPeriodChange({ start: customStart, end: customEnd, type: "custom" });
      setShowCustom(false);
    }
  };

  const getPeriodLabel = () => {
    return periodLabel;
  };

  const isCurrentMonth = selectedPeriod === "current_month";
  const now = new Date();
  const { dayOfMonth = 0, daysInMonth = 0 } = isCurrentMonth 
    ? calculateCompleteness(startOfMonth(now), now)
    : {};
  const completenessPercentage = isCurrentMonth ? (dayOfMonth / daysInMonth) * 100 : 0;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          #{detectedMode || "..."}
        </Badge>

        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[280px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder={getPeriodLabel()} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isCurrentMonth && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`${getCompletenessColor(completenessPercentage)} border`}
                >
                  🔸 {dayOfMonth}/{daysInMonth}
                </Badge>
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      completenessPercentage < 25 ? 'bg-orange-400' :
                      completenessPercentage < 75 ? 'bg-blue-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${completenessPercentage}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                Analyse basée sur les données disponibles ({dayOfMonth} jours sur {daysInMonth})
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sélectionner une période personnalisée</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date de début</label>
              <CalendarComponent
                mode="single"
                selected={customStart}
                onSelect={setCustomStart}
                disabled={(date) => date > new Date()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date de fin</label>
              <CalendarComponent
                mode="single"
                selected={customEnd}
                onSelect={setCustomEnd}
                disabled={(date) => date > new Date() || (customStart && date < customStart)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={applyCustomPeriod} className="flex-1" disabled={!customStart || !customEnd}>
              Appliquer
            </Button>
            <Button variant="outline" onClick={() => setShowCustom(false)}>
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}