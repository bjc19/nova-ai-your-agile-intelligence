import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Users, Settings, Zap } from "lucide-react";

export default function TeamConfigOnboarding({ isOpen, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Bienvenue dans Nova",
      description: "Configurons votre espace d'équipe pour commencer",
      icon: Zap
    },
    {
      title: "Ajouter des membres",
      description: "Invitez votre équipe pour collaborer",
      icon: Users
    },
    {
      title: "Configuration complète",
      description: "Vous êtes prêt à analyser vos données",
      icon: CheckCircle2
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{currentStepData.title}</DialogTitle>
          <DialogDescription>{currentStepData.description}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Icon className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="flex gap-2 justify-center mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx <= currentStep ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onComplete}
            className="flex-1"
          >
            Passer
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? "Terminer" : "Suivant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}