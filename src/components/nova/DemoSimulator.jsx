import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { detectWorkshopType } from "@/components/nova/workshopDetection";

// Données simulées de démo
const DEMO_PATTERNS = [
  {
    name: "WIP Overload",
    severity: "high",
    description: "Trop de tickets en cours simultanément"
  },
  {
    name: "Context Switching",
    severity: "medium",
    description: "L'équipe change trop souvent de contexte"
  },
  {
    name: "Blocked Items",
    severity: "high",
    description: "Articles bloqués depuis plus de 48h"
  },
  {
    name: "Communication Gap",
    severity: "medium",
    description: "Désalignement dans les objectifs du sprint"
  }
];

const DEMO_RECOMMENDATIONS = [
  "Limiter le WIP à 5 max par développeur",
  "Organiser un synchronisme rapide pour débloquer les dépendances",
  "Clarifier les priorités du Sprint Goal",
  "Réduire les interruptions non planifiées"
];

export function DemoSimulator({ onClose, onTriesUpdate }) {
  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [tries, setTries] = useState(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier tries restantes
    const savedTries = localStorage.getItem("nova_demo_tries");
    const lastReset = localStorage.getItem("nova_demo_reset");
    const now = Date.now();
    const last = lastReset ? parseInt(lastReset) : 0;
    
    // Reset après 24h
    if (now - last > 24 * 60 * 60 * 1000) {
      localStorage.setItem("nova_demo_tries", "2");
      localStorage.setItem("nova_demo_reset", now.toString());
      setTries(2);
    } else {
      setTries(parseInt(savedTries || "2"));
    }
    setLoading(false);
  }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      toast.error("Remplissez le champ de texte");
      return;
    }

    if (tries <= 0) {
      toast.error("❌ Limite de démo atteinte. Choisissez un plan pour continuer.");
      onClose();
      return;
    }

    setAnalyzing(true);
    try {
      // Simuler délai d'analyse (1-2 secondes)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Déterminer le type de réunion (simulé)
      const lowerInput = input.toLowerCase();
      let meetingType = "Daily Scrum";
      if (lowerInput.includes("retro")) meetingType = "Retrospective";
      if (lowerInput.includes("planning")) meetingType = "Sprint Planning";
      if (lowerInput.includes("review")) meetingType = "Sprint Review";

      // Résultats simulés
      setResults({
        meetingType,
        patterns: DEMO_PATTERNS.slice(0, 2 + Math.floor(Math.random() * 2)),
        recommendations: DEMO_RECOMMENDATIONS.slice(0, 3 + Math.floor(Math.random() * 2)),
        confidence: 75 + Math.floor(Math.random() * 20),
        analysisNote: "Ces résultats sont simulés pour la démonstration"
      });

      // Décrémenter tries
      const newTries = tries - 1;
      setTries(newTries);
      localStorage.setItem("nova_demo_tries", newTries.toString());
      onTriesUpdate(newTries);

      toast.success("✅ Analyse complète!");
    } catch (error) {
      toast.error("❌ Erreur lors de l'analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎮 Simulateur d'Analyse Nova</DialogTitle>
          <DialogDescription>
            Mode démo • {tries} essai{tries > 1 ? 's' : ''} restant{tries > 1 ? 's' : ''} ({tries}/2 par 24h)
          </DialogDescription>
        </DialogHeader>

        {tries === 0 && !results ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Limite de démo atteinte</p>
                <p className="text-sm text-red-700 mt-1">Vous avez utilisé vos 2 essais de démo. Choisissez un plan pour continuer.</p>
              </div>
            </div>
            <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Voir les Plans Tarifaires
            </Button>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Analyse Complète ✅</p>
                  <p className="text-sm text-slate-600 mt-1">Type détecté: <strong>{results.meetingType}</strong></p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">🎮 SIMULÉ</Badge>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Confiance de l'analyse</p>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${results.confidence}%` }} />
              </div>
              <p className="text-xs text-slate-600 mt-1">{results.confidence}%</p>
            </div>

            {/* Patterns Detected */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Anti-patterns Détectés</p>
              <div className="space-y-2">
                {results.patterns.map((pattern, idx) => (
                  <Card key={idx} className="border-slate-200">
                    <CardContent className="p-3 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{pattern.name}</p>
                        <p className="text-sm text-slate-600">{pattern.description}</p>
                      </div>
                      <Badge className={`ml-2 ${
                        pattern.severity === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pattern.severity === 'high' ? '🔴' : '🟡'} {pattern.severity}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Recommandations</p>
              <ul className="space-y-2">
                {results.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Analysis Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> {results.analysisNote}
              </p>
            </div>

            {/* CTA */}
            {tries === 0 ? (
              <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
                Voir les Plans Tarifaires
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setInput("");
                    setResults(null);
                  }}
                  className="flex-1"
                >
                  Nouvelle Analyse
                </Button>
                <Button 
                  onClick={onClose}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Essayer le vrai produit
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">
                Collez un transcript de daily standup ou un autre type d'atelier
              </label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: Alice: Hier j'ai travaillé sur le formulaire de login. Aujourd'hui je vais continuer. Je suis bloquée par la validation email qui n'est pas prête. ..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 Astuce: Incluez des noms de tickets, des détails de blocages pour de meilleurs résultats simulés.
              </p>
            </div>

            {tries === 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Dernier essai de démo!</strong> Après celui-ci, vous devrez choisir un plan.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={analyzing}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={analyzing || !input.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>Analyser Maintenant</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}