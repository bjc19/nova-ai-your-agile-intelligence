import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Target, Layers, HelpCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TeamConfigurationSettings() {
  const [currentMode, setCurrentMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configs = await base44.entities.TeamConfiguration.list();
        if (configs.length > 0) {
          setCurrentMode(configs[0].project_mode);
        } else {
          setCurrentMode("auto_detect");
        }
      } catch (error) {
        console.error("Erreur chargement config:", error);
        toast.error("Impossible de charger la configuration");
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const modeOptions = [
    {
      id: "mono_project",
      title: "Un seul projet",
      description: "Votre équipe se concentre sur un seul produit ou projet à la fois",
      icon: Target,
      color: "from-green-500 to-emerald-600"
    },
    {
      id: "multi_projects",
      title: "Plusieurs projets",
      description: "Votre équipe gère plusieurs projets ou produits simultanément",
      icon: Layers,
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: "auto_detect",
      title: "Détection automatique",
      description: "Nova analysera vos données pour déterminer le mode optimal",
      icon: HelpCircle,
      color: "from-purple-500 to-pink-600"
    }
  ];

  const handleModeChange = async (mode) => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const configs = await base44.entities.TeamConfiguration.filter({
        user_email: user.email
      });
      
      if (configs.length > 0) {
        await base44.entities.TeamConfiguration.update(configs[0].id, {
          project_mode: mode,
          confirmed_by_admin: mode !== "auto_detect",
          user_email: user.email
        });
      } else {
        await base44.entities.TeamConfiguration.create({
          project_mode: mode,
          confirmed_by_admin: mode !== "auto_detect",
          user_email: user.email
        });
      }

      setCurrentMode(mode);
      toast.success("Configuration mise à jour avec succès");
    } catch (error) {
      console.error("Erreur mise à jour config:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mode de Gestion des Projets</CardTitle>
          <CardDescription>Configuration des analyses de Nova</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mode de Gestion des Projets</CardTitle>
        <CardDescription>
          Configurez comment Nova adapte ses analyses à votre contexte d'équipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {modeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = currentMode === option.id;

            return (
              <motion.button
                key={option.id}
                onClick={() => !isSaving && handleModeChange(option.id)}
                disabled={isSaving}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full text-left"
              >
                <Card
                  className={`cursor-pointer transition-all border-2 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {option.title}
                          </h3>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          💡 Nova adaptera ses analyses et recommandations en fonction du mode sélectionné.
        </div>
      </CardContent>
    </Card>
  );
}