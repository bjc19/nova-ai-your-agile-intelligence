import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function OutOfContextResult({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-slate-900 mb-1">#HorsContexte</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-slate-600">Confiance:</span>
              <div className="flex-1 h-2.5 bg-red-200 rounded-full overflow-hidden max-w-xs">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-600" 
                  style={{ width: `${data.confidence}%` }} 
                />
              </div>
              <span className="text-sm font-bold text-red-600">{data.confidence}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analysis Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-5">
            {/* Raison Principale */}
            <div className="pb-4 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Raison Principale</p>
              <p className="text-sm font-medium text-slate-900">{data.reason || data.vetoType}</p>
            </div>

            {/* Analyse Lexicale */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Analyse Lexicale</p>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-slate-600 font-medium min-w-[140px]">Thème identifié :</span>
                  <span className="text-red-700 font-semibold">{data.theme}</span>
                </div>
                
                {data.detectedKeywords && data.detectedKeywords.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-slate-600 font-medium min-w-[140px]">Termes-clés :</span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.detectedKeywords.map((kw, idx) => (
                        <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <span className="text-slate-600 font-medium min-w-[140px]">Champ sémantique pro :</span>
                  <span className="text-slate-900">
                    {data.professionalFieldScore === 0 ? 'Absent' : `Trop faible (score: ${data.professionalFieldScore})`}
                  </span>
                </div>

                {data.professionalFieldScore === 0 && (
                  <div className="mt-2 pl-[148px]">
                    <p className="text-xs text-slate-600 italic">
                      • Absence des marqueurs attendus (ex: projet, équipe, tâche, réunion, livrable, décision...).
                    </p>
                  </div>
                )}

                {/* Détails des champs lexicaux si disponibles */}
                {(data.L1_count !== undefined) && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Détection par champ lexical :</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">L1 (Projet & Gestion):</span>
                        <span className="font-medium">{data.L1_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">L2 (Organisation):</span>
                        <span className="font-medium">{data.L2_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">L3 (Activités):</span>
                        <span className="font-medium">{data.L3_count + (data.L3_verbs_count || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">L4 (Problématiques):</span>
                        <span className="font-medium">{data.L4_count}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notre Périmètre */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="font-semibold text-slate-900 mb-2">🎯 Notre Périmètre</p>
              <p className="text-sm text-slate-700 mb-4">
                Nova analyse spécifiquement les <strong>conversations de travail d'équipe et de gestion de projet</strong>.
              </p>
              
              <p className="text-sm font-medium text-slate-900 mb-2">Exemples de textes adaptés :</p>
              <div className="space-y-2">
                <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-700 font-mono border border-blue-200">
                  "Daily : Hier j'ai corrigé le bug #123, aujourd'hui je travaille sur l'API de paiement."
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-700 font-mono border border-blue-200">
                  "Revue de sprint : La feature 'login' est terminée, mais le 'checkout' a un retard d'un jour."
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-700 font-mono border border-blue-200">
                  "Atelier risques : Risque identifié sur le fournisseur Cloud, plan d'action assigné à Marie."
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 italic text-center pt-2">
              Merci de rester sérieux et professionnel 🙂
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex gap-3"
      >
        <Button 
          variant="outline" 
          onClick={onClose}
          className="flex-1"
        >
          Nouvelle Analyse
        </Button>
        <Button 
          onClick={onClose}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Fermer
        </Button>
      </motion.div>
    </div>
  );
}