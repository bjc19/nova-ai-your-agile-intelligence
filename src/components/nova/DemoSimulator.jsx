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
import { getAntiPatternsByCeremonyType, getPatternSuggestions } from "@/components/nova/antiPatternsByType";

export function DemoSimulator({ onClose, onTriesUpdate }) {
  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [tries, setTries] = useState(2);
  const [loading, setLoading] = useState(true);
  const [detection, setDetection] = useState(null);
  const [forceType, setForceType] = useState(null);
  const [expandedPattern, setExpandedPattern] = useState(null);

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
      // Détection sémantique du type d'atelier (côté client)
      const detected = detectWorkshopType(input);
      setDetection(detected);

      // Simuler délai d'analyse (1-2 secondes)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Déterminer le type de réunion (simulé ou forcé)
      const meetingType = forceType || detected.type;

      // Récupérer anti-patterns spécifiques au type d'atelier
      const ceremonyPatterns = getAntiPatternsByCeremonyType(meetingType);
      const selectedPatterns = ceremonyPatterns.patterns.slice(0, 2 + Math.floor(Math.random() * 2));

      // Résultats simulés
      setResults({
        meetingType,
        patterns: selectedPatterns,
        recommendations: selectedPatterns.flatMap(p => p.suggestions.slice(0, 2)),
        confidence: 75 + Math.floor(Math.random() * 20),
        analysisNote: "Ces résultats sont simulés pour la démonstration",
        detectionConfidence: detected.confidence,
        detectionJustifications: detected.justifications,
        detectionTags: detected.tags
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
                  <p className="text-sm text-slate-600 mt-1">Atelier détecté: <strong>{results.meetingType}</strong></p>
                  {results.detectionConfidence && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-600">Confiance de détection:</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600" 
                          style={{ width: `${results.detectionConfidence}%` }} 
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{results.detectionConfidence}%</span>
                    </div>
                  )}
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
              <p className="text-sm font-semibold text-slate-900 mb-3">Anti-patterns Détectés pour <span className="text-blue-600">{results.meetingType}</span></p>
              <div className="space-y-2">
                {results.patterns.map((pattern, idx) => (
                  <Card key={idx} className={`border-slate-200 cursor-pointer hover:shadow-md transition-all ${expandedPattern === idx ? 'ring-2 ring-blue-400' : ''}`}>
                    <button
                      onClick={() => setExpandedPattern(expandedPattern === idx ? null : idx)}
                      className="w-full text-left"
                    >
                      <CardContent className="p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{pattern.name}</p>
                          <p className="text-sm text-slate-600">{pattern.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`ml-2 ${
                            pattern.severity === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pattern.severity === 'high' ? '🔴' : '🟡'} {pattern.severity}
                          </Badge>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedPattern === idx ? 'rotate-180' : ''}`} />
                        </div>
                      </CardContent>
                    </button>
                    
                    {expandedPattern === idx && (
                      <div className="border-t border-slate-200 px-3 py-3 bg-blue-50">
                        <p className="text-xs font-semibold text-slate-900 mb-2">💡 Suggestions d'amélioration :</p>
                        <ul className="space-y-1.5">
                          {pattern.suggestions.map((suggestion, sidx) => (
                            <li key={sidx} className="flex gap-2 text-xs text-slate-700">
                              <span className="text-blue-600 font-bold">✓</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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

            {/* Detection Tags */}
            {results.detectionTags && results.detectionTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {results.detectionTags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

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
                onChange={(e) => {
                  const newValue = e.target.value;
                  setInput(newValue);
                  if (newValue.trim().length > 20) {
                    const result = detectWorkshopType(newValue);
                    setDetection(result);
                  } else {
                    setDetection(null);
                  }
                }}
                placeholder="Ex: Alice: Hier j'ai travaillé sur le formulaire de login. Aujourd'hui je vais continuer. Je suis bloquée par la validation email qui n'est pas prête. ..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 L'expertise en un clic ! Collez votre transcript d'atelier et laissez la magie s'operer!.
              </p>

              {/* Detection preview */}
              {detection && !analyzing && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Atelier détecté: <span className="text-blue-600">{detection.type}</span>
                        {detection.subtype && <span className="text-blue-500"> {detection.subtype}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden max-w-xs">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600" 
                            style={{ width: `${detection.confidence}%` }} 
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{detection.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Raisons de la détection:</p>
                    <ul className="text-xs text-slate-600 space-y-0.5">
                      {detection.justifications.map((just, idx) => (
                        <li key={idx}>• {just}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {detection.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs bg-white">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {detection.confidence < 70 && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      ⚠️ Confiance faible - Vous pouvez forcer le type d'atelier ci-dessous
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 font-medium">Ou choisissez:</label>
                    <select 
                      value={forceType || ''}
                      onChange={(e) => setForceType(e.target.value || null)}
                      className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                    >
                      <option value="">Auto-détecté</option>
                      <option value="Daily Scrum">Daily Scrum</option>
                      <option value="Sprint Planning">Sprint Planning</option>
                      <option value="Sprint Review">Sprint Review</option>
                      <option value="Retrospective">Retrospective</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>
              )}
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