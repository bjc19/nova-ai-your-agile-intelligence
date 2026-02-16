import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function ContextualRecommendations({ item }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateRecommendations = async () => {
      setLoading(true);
      try {
        const prompt = `Basé sur ce problème détecté dans une équipe agile:

TITRE: ${item.title || 'Non spécifié'}
DESCRIPTION: ${item.description || 'Non spécifié'}
CAUSE RACINE: ${item.root_cause || item.cause || 'Non identifiée'}
IMPACT: ${item.impact || 'Non spécifié'}
URGENCE: ${item.urgency || item.criticite || 'Non spécifié'}

Génère EXACTEMENT 3 recommandations concrètes, pertinentes et actionnables SPÉCIFIQUES à ce problème exact (pas des recommandations génériques).

Format JSON strict:
[
  {"title": "Titre court", "description": "Description détaillée et spécifique au problème", "icon": "emoji"},
  {"title": "Titre court", "description": "Description détaillée et spécifique au problème", "icon": "emoji"},
  {"title": "Titre court", "description": "Description détaillée et spécifique au problème", "icon": "emoji"}
]`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                icon: { type: "string" }
              }
            }
          }
        });

        setRecommendations(response.data || []);
      } catch (error) {
        console.error("Error generating recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [item.id]);

  return (
    <div>
      <h4 className="font-semibold text-slate-900 text-sm mb-3">Recommandations Contextualisées</h4>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-slate-500">Génération des recommandations...</span>
          </div>
        ) : (
          recommendations.map((rec, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white hover:border-blue-200 transition-colors">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{rec.icon}</span>
                <div className="min-w-0 flex-1">
                  <h5 className="font-semibold text-slate-900 text-xs">
                    {rec.title}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1">
                    {rec.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}