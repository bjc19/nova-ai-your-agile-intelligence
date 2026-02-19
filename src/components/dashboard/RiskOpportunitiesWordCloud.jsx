import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Cloud, RefreshCw, Loader2 } from "lucide-react";

export default function RiskOpportunitiesWordCloud({ selectedWorkspaceId, gdprSignals = [], analysisHistory = [] }) {
  const [wordCloud, setWordCloud] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState('combined'); // 'risks', 'opportunities', 'combined'

  const extractWordsFromData = useMemo(() => {
    if (!selectedWorkspaceId || (gdprSignals.length === 0 && analysisHistory.length === 0)) {
      return { risks: [], opportunities: [] };
    }

    // Mots-clés associés aux risques (de criticite élevée)
    const riskKeywords = {
      'blockers': ['blocage', 'bloqué', 'arrêt', 'stagnation', 'dépendance', 'attente'],
      'communication': ['communication', 'clarté', 'confusion', 'malentendus', 'feedback'],
      'capacity': ['surcharge', 'capacité', 'épuisement', 'burnout', 'WIP'],
      'quality': ['bugs', 'qualité', 'régression', 'dette technique', 'instabilité'],
      'planning': ['scope creep', 'planification', 'imprévus', 'imprévisibilité'],
    };

    const opportunityKeywords = {
      'optimization': ['optimisation', 'amélioration', 'efficacité', 'flow', 'lean'],
      'automation': ['automatisation', 'scripts', 'CI/CD', 'tests automatisés'],
      'collaboration': ['collaboration', 'synergy', 'partage', 'mentorat', 'pair programming'],
      'learning': ['apprentissage', 'croissance', 'rétro', 'expérience', 'formation'],
      'velocity': ['vélocité', 'throughput', 'débit', 'livraison', 'sprint velocity']
    };

    // Extraction des risques des signaux
    const risks = [];
    gdprSignals.forEach(signal => {
      if (signal.criticite === 'critique' || signal.criticite === 'haute') {
        const text = (signal.probleme || '').toLowerCase();
        riskKeywords.blockers.forEach(word => {
          if (text.includes(word)) risks.push({ word: word.toUpperCase(), frequency: Math.random() * 15 + 5, type: 'blocker' });
        });
        riskKeywords.communication.forEach(word => {
          if (text.includes(word)) risks.push({ word: word.toUpperCase(), frequency: Math.random() * 12 + 4, type: 'comm' });
        });
      }
    });

    // Extraction des opportunités de l'historique d'analyses
    const opportunities = [];
    analysisHistory.forEach(analysis => {
      const text = (analysis.title + ' ' + (analysis.analysis_data?.summary || '')).toLowerCase();
      opportunityKeywords.optimization.forEach(word => {
        if (text.includes(word)) opportunities.push({ word: word.toUpperCase(), frequency: Math.random() * 12 + 3, type: 'opt' });
      });
      opportunityKeywords.automation.forEach(word => {
        if (text.includes(word)) opportunities.push({ word: word.toUpperCase(), frequency: Math.random() * 10 + 2, type: 'auto' });
      });
      opportunityKeywords.collaboration.forEach(word => {
        if (text.includes(word)) opportunities.push({ word: word.toUpperCase(), frequency: Math.random() * 11 + 3, type: 'collab' });
      });
    });

    // Dédupliquer et fusionner les fréquences
    const riskMap = {};
    const opportunityMap = {};

    risks.forEach(r => {
      riskMap[r.word] = (riskMap[r.word] || 0) + r.frequency;
    });

    opportunities.forEach(o => {
      opportunityMap[o.word] = (opportunityMap[o.word] || 0) + o.frequency;
    });

    return {
      risks: Object.entries(riskMap).map(([word, freq]) => ({ word, frequency: freq })).sort((a, b) => b.frequency - a.frequency).slice(0, 15),
      opportunities: Object.entries(opportunityMap).map(([word, freq]) => ({ word, frequency: freq })).sort((a, b) => b.frequency - a.frequency).slice(0, 15)
    };
  }, [selectedWorkspaceId, gdprSignals, analysisHistory]);

  useEffect(() => {
    if (extractWordsFromData.risks.length > 0 || extractWordsFromData.opportunities.length > 0) {
      const data = displayMode === 'risks' ? extractWordsFromData.risks : displayMode === 'opportunities' ? extractWordsFromData.opportunities : [...extractWordsFromData.risks, ...extractWordsFromData.opportunities];
      setWordCloud(data);
    }
  }, [extractWordsFromData, displayMode]);

  const generateNewCloud = async () => {
    setLoading(true);
    // Simulation: la vraie génération se ferait via une fonction backend
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  if (!selectedWorkspaceId) {
    return (
      <Card className="p-6 bg-slate-50">
        <p className="text-sm text-slate-500">Sélectionnez un workspace pour générer le nuage</p>
      </Card>
    );
  }

  const getWordSize = (frequency, maxFreq) => {
    const minSize = 0.8;
    const maxSize = 2.2;
    return minSize + (frequency / maxFreq) * (maxSize - minSize);
  };

  const getWordColor = (word, mode) => {
    const riskColors = ['text-red-600', 'text-red-500', 'text-amber-600', 'text-orange-500'];
    const oppColors = ['text-green-600', 'text-emerald-500', 'text-teal-600', 'text-cyan-500'];
    const colors = mode === 'combined' ? [...riskColors, ...oppColors] : mode === 'risks' ? riskColors : oppColors;
    return colors[Math.abs(word.charCodeAt(0)) % colors.length];
  };

  const maxFreq = wordCloud?.length > 0 ? Math.max(...wordCloud.map(w => w.frequency)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <Card className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Nuage de Risques & Opportunités
          </h3>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'risks', label: '⚠️ Risques', color: 'bg-red-50 text-red-700' },
            { key: 'opportunities', label: '🎯 Opportunités', color: 'bg-green-50 text-green-700' },
            { key: 'combined', label: '🔄 Combiné', color: 'bg-blue-50 text-blue-700' }
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setDisplayMode(mode.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                displayMode === mode.key
                  ? mode.color + ' border-2'
                  : 'border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Word Cloud */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : wordCloud && wordCloud.length > 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-wrap gap-3 justify-center content-center">
              {wordCloud.map((item, idx) => {
                const size = getWordSize(item.frequency, maxFreq);
                const colorClass = getWordColor(item.word, displayMode);
                
                return (
                  <motion.span
                    key={`${item.word}-${idx}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`font-bold cursor-pointer hover:scale-110 transition-transform ${colorClass}`}
                    style={{ fontSize: `${size * 16}px` }}
                  >
                    {item.word}
                  </motion.span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-400">Pas de données pour générer le nuage</p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={generateNewCloud}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Régénérer
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}