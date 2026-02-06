import { useState, useEffect } from "react";
import { Calendar, ChevronDown, AlertCircle } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TimePeriodSelector({ deliveryMode, onPeriodChange }) {
  const [selectedPeriod, setSelectedPeriod] = useState("default");
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("Sélectionner une période");

  // Options communes
  const commonOptions = [
    { value: "current_month", label: "Mois en cours" },
    { value: "last_quarter", label: "Trimestre écoulé (13 sem.)" },
  ];

  // Options Scrum
  const scrumOptions = [
    { value: "current_sprint", label: "Sprint en cours" },
    { value: "last_3_sprints", label: "3 derniers sprints" },
    { value: "previous_sprint", label: "Sprint précédent" },
    ...commonOptions,
    { value: "custom", label: "Personnalisé..." },
  ];

  // Options Kanban
  const kanbanOptions = [
    { value: "last_4_weeks", label: "4 dernières semaines" },
    { value: "since_retro", label: "Depuis le dernier rétro" },
    { value: "current_week", label: "Semaine en cours" },
    ...commonOptions,
    { value: "custom", label: "Personnalisé..." },
  ];

  // Déterminer les options selon la méthodologie
  const options = deliveryMode === "scrum" ? scrumOptions : kanbanOptions;

  // Définir la période par défaut
  const defaultPeriod = deliveryMode === "scrum" ? "current_sprint" : "last_4_weeks";

  useEffect(() => {
    setSelectedPeriod(defaultPeriod);
    calculatePeriod(defaultPeriod);
  }, [deliveryMode]);

  const calculatePeriod = (periodType) => {
    const now = new Date();
    let start, end;

    switch (periodType) {
      case "current_sprint":
        // Approximation: 2 semaines
        start = subWeeks(now, 1);
        end = now;
        break;

      case "last_3_sprints":
        // Approximation: 6 semaines (3 sprints de 2 semaines)
        start = subWeeks(now, 6);
        end = now;
        break;

      case "previous_sprint":
        start = subWeeks(now, 3);
        end = subWeeks(now, 1);
        break;

      case "last_4_weeks":
        start = subWeeks(now, 4);
        end = now;
        break;

      case "current_week":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;

      case "current_month":
        start = startOfMonth(now);
        end = now; // Until today, not end of month
        break;

      case "last_quarter":
        start = subWeeks(now, 13);
        end = now;
        break;

      case "since_retro":
        // Approximation: 2 semaines
        start = subWeeks(now, 2);
        end = now;
        break;

      default:
        start = now;
        end = now;
    }

    onPeriodChange({ start, end, type: periodType });
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
      // Vérifier que la période ne dépasse pas 6 mois
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
    const option = options.find(opt => opt.value === selectedPeriod);
    return option?.label || "Sélectionner une période";
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="text-xs">
        {deliveryMode === "scrum" ? "Scrum" : "Kanban"}
      </Badge>

      <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[220px]">
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
    </div>
  );
}