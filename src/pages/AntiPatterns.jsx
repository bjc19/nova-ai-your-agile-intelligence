import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";
import {
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AntiPatterns() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  // Récupérer les métadonnées de sync
  const { data: syncMeta, isLoading: syncLoading } = useQuery({
    queryKey: ['syncMetadata'],
    queryFn: async () => {
      const meta = await base44.entities.SyncMetadata.filter({ source: "gist_antipatterns" });
      return meta.length > 0 ? meta[0] : null;
    },
    initialData: null,
  });

  // Récupérer tous les anti-patterns
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['antiPatterns'],
    queryFn: () => base44.entities.AntiPattern.list('-priority_weight', 200),
    initialData: [],
  });

  // Mutation pour synchroniser
  const syncMutation = useMutation({
    mutationFn: async (force = false) => {
      // Appeler la fonction backend
      const result = await base44.functions.syncAntiPatterns({ force });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncMetadata'] });
      queryClient.invalidateQueries({ queryKey: ['antiPatterns'] });
    },
  });

  // Filtrer les patterns
  const filteredPatterns = patterns.filter(p => {
    const matchSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchSeverity = selectedSeverity === "all" || p.severity === selectedSeverity;
    return matchSearch && matchCategory && matchSeverity;
  });

  // Compter patterns par catégorie
  const categoryCounts = patterns.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const categories = {
    "A": "Culture & Leadership",
    "B": "Product Management",
    "C": "Cérémonies",
    "D": "Technique & Qualité",
    "E": "Flux & Process",
    "F": "Collaboration",
    "G": "Metrics & Data",
    "H": "Scaling",
    "I": "Outils & Infrastructure",
    "J": "Formation & Coaching",
    "K": "Biais & Dynamiques Humaines"
  };

  const severityConfig = {
    critical: { label: "Critique", color: "bg-red-100 text-red-700 border-red-200" },
    high: { label: "Élevée", color: "bg-orange-100 text-orange-700 border-orange-200" },
    medium: { label: "Moyenne", color: "bg-amber-100 text-amber-700 border-amber-200" },
    low: { label: "Faible", color: "bg-blue-100 text-blue-700 border-blue-200" }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={createPageUrl("Dashboard")}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Référentiel Anti-Patterns Agile
          </h1>
          <p className="text-slate-600 mt-2">
            ~105 patterns organisés en 11 catégories pour détecter les dysfonctionnements
          </p>
        </div>

        {/* Sync Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Synchronisation du Référentiel
                </CardTitle>
                <CardDescription>
                  Source: GitHub Gist • Révision annuelle automatique
                </CardDescription>
              </div>
              <Button
                onClick={() => syncMutation.mutate(true)}
                disabled={syncMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Synchronisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Forcer la Sync
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                {syncMeta?.sync_status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : syncMeta?.sync_status === "failed" ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">Statut</p>
                  <p className="text-xs text-slate-600">
                    {syncMeta?.sync_status === "success" ? "Synchronisé" :
                     syncMeta?.sync_status === "failed" ? "Erreur" : "En attente"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Dernière Sync</p>
                <p className="text-xs text-slate-600">
                  {syncMeta?.last_sync_date 
                    ? new Date(syncMeta.last_sync_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : "Jamais"
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Patterns Stockés</p>
                <p className="text-xs text-slate-600">
                  {patterns.length} patterns locaux
                </p>
              </div>
            </div>
            {syncMutation.isSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ {syncMutation.data?.message || "Synchronisation réussie"}
                </p>
              </div>
            )}
            {syncMutation.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ✗ Erreur: {syncMutation.error?.message || "Échec de la synchronisation"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher un pattern..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories ({patterns.length})</SelectItem>
                {Object.entries(categories).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {key} - {name} ({categoryCounts[key] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes gravités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes gravités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Patterns List */}
        <div className="space-y-4">
          {filteredPatterns.map((pattern, index) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.03 * index }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {pattern.pattern_id}
                        </Badge>
                        <Badge variant="outline">
                          {pattern.category} - {categories[pattern.category]}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={severityConfig[pattern.severity]?.color}
                        >
                          {severityConfig[pattern.severity]?.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{pattern.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {pattern.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pattern.markers && pattern.markers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Marqueurs de détection:
                        </h4>
                        <ul className="space-y-1">
                          {pattern.markers.map((marker, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{marker}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {pattern.impact && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">
                          Impact:
                        </h4>
                        <p className="text-sm text-slate-600">{pattern.impact}</p>
                      </div>
                    )}

                    {pattern.quick_win && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-emerald-900 mb-1">
                          ⚡ Quick Win (≤ 48h):
                        </h4>
                        <p className="text-sm text-emerald-800">{pattern.quick_win}</p>
                      </div>
                    )}

                    {pattern.recommended_actions && pattern.recommended_actions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Actions recommandées:
                        </h4>
                        <ul className="space-y-1">
                          {pattern.recommended_actions.map((action, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-indigo-600 mt-1">→</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {filteredPatterns.length === 0 && !patternsLoading && (
            <div className="text-center py-12">
              <p className="text-slate-500">Aucun pattern trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}