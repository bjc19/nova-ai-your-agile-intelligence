import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Target, 
  Layers, 
  HelpCircle,
  CheckCircle2 
} from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Questionnaire onboarding pour configuration initiale multi-projets
 */
export default function TeamConfigOnboarding({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModeSelect = async (mode) => {
    setSelectedMode(mode);
    setIsSubmitting(true);

    try {
      // Créer ou mettre à jour la configuration
      const existingConfigs = await base44.entities.TeamConfiguration.list();
      
      if (existingConfigs.length > 0) {
        await base44.entities.TeamConfiguration.update(existingConfigs[0].id, {
          project_mode: mode,
          confirmed_by_admin: mode !== "auto_detect",
          onboarding_completed: true
        });
      } else {
        await base44.entities.TeamConfiguration.create({
          project_mode: mode,
          confirmed_by_admin: mode !== "auto_detect",
          onboarding_completed: true,
          project_count: mode === "multi_projects" ? 2 : 1
        });
      }

      // Animation de succès
      setStep(2);
      setTimeout(() => {
        onComplete(mode);
      }, 1500);

    } catch (error) {
      console.error("Erreur configuration:", error);
      setIsSubmitting(false);
    }
  };

  const modeOptions = [
    {
      id: "mono_project",
      title: "Un seul projet",
      description: "Votre équipe se concentre sur un seul produit ou projet à la fois",
      icon: Target,
      color: "from-green-500 to-emerald-600",
      benefits: ["Focus maximal", "Métriques standards", "Analyse classique"]
    },
    {
      id: "multi_projects",
      title: "Plusieurs projets",
      description: "Votre équipe gère plusieurs projets ou produits simultanément",
      icon: Layers,
      color: "from-blue-500 to-indigo-600",
      benefits: ["Ajustements capacité", "Alertes dispersion", "Métriques adaptées"]
    },
    {
      id: "auto_detect",
      title: "Pas sûr - Détecter automatiquement",
      description: "Nova analysera vos données pour déterminer le mode optimal",
      icon: HelpCircle,
      color: "from-purple-500 to-pink-600",
      benefits: ["Détection intelligente", "Notification confirmation", "Adaptation continue"]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm p-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader className="pb-3">
               <DialogTitle className="text-lg">Bienvenue sur Nova !</DialogTitle>
               <DialogDescription className="text-sm">
                 Configuration rapide
               </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto">
               <p className="text-sm text-slate-700 mb-4">
                 Votre équipe gère-t-elle <strong>un seul projet</strong> ou <strong>plusieurs projets</strong> ?
               </p>

               <div className="grid gap-3">
                  {modeOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !isSubmitting && handleModeSelect(option.id)}
                      disabled={isSubmitting}
                      className="w-full text-left"
                    >
                      <Card 
                        className={`cursor-pointer transition-all border-2 hover:border-blue-400 ${
                          selectedMode === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0`}>
                              <option.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                                {option.title}
                              </h3>
                              <p className="text-xs text-slate-600 mb-2">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  💡 Modifiable à tout moment dans les Paramètres
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Configuration enregistrée !
              </h3>
              <p className="text-slate-600">
                Nova va maintenant adapter ses analyses à votre contexte.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}