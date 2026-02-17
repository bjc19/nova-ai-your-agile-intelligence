import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { ContactSalesModal } from "@/components/nova/ContactSalesModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: "RECOMMANDÉ POUR DÉBUTER",
    badgeColor: "bg-green-100 text-green-800",
    subtitle: "Embarquez et découvrez la puissance de Nova",
    price: "49",
    users: "5 utilisateurs inclus",
    addOn: "+15 CAD/utilisateur/mois (max 10)",
    max_manual_analyses: 20,
    max_team_members: 5,
    max_jira_projects: 5,
    primary_sources: ["jira", "trello"],
    contributive_sources: [],
    locked_sources: ["slack", "confluence", "teams", "azuredevops", "zoom"],
    included: [
      "20 analyses manuelles uniquement",
      "1 source au choix (Jira OU Trello)",
      "≤ 5 projets Jira / Tableaux Trello",
      "Insights contextualisés",
      "Vue basique avec tendances"
    ],
    limitations: [
      "Pas de sources contributives (Slack, Confluence, Teams) - disponibles à partir de Growth",
      "Pas de rapports mensuels automatiques",
      "Pas de croisement multi-sources",
      "Pas d'alertes automatiques"
    ],
    ctaKey: "subscribe"
  },
  {
    id: "growth",
    name: "Growth",
    badge: "PLUS DE VALEUR",
    badgeColor: "bg-blue-100 text-blue-800",
    subtitle: "Idéal pour les equipes qui veulent plus de volume d'analyses",
    price: "99",
    yearlyPrice: "84",
    users: "10 utilisateurs inclus",
    addOn: "+10 CAD/utilisateur/mois (max 25)",
    discount: "15% annuel",
    max_manual_analyses: 50,
    max_team_members: 15,
    max_jira_projects: 10,
    primary_sources: ["jira", "trello"],
    contributive_sources: ["slack", "confluence"],
    locked_sources: ["teams", "azuredevops", "zoom"],
    included: [
      "50 analyses manuelles",
      "Équipe ≤ 15 membres",
      "Jira OU Trello (source autoritaire) + Slack + Confluence",
      "≤ 10 projets Jira / Tableaux Trello",
      "Croisement limité multi-sources",
      "Dashboard tendances complet",
      "Rapports sommaires mensuels automatiques (ADMIN ONLY)",
      "Alertes basiques sur dérives"
    ],
    limitations: [
      "Teams, Azure DevOps, Zoom - disponibles uniquement pour les plans Pro",
      "Pas de notifications instantanées",
      "Pas de coach/chatbot intelligent dédié",
      "Pas de module de gestion du changement"
    ],
    ctaKey: "subscribe"
  },
  {
    id: "pro",
    name: "Pro",
    badge: "RAPPORT QUALITÉ/PRIX",
    badgeColor: "bg-purple-100 text-purple-800",
    badge2: "⭐",
    subtitle: "Insights actionnables, ROI clair et mesurable",
    price: "199",
    yearlyPrice: "169",
    users: "25 utilisateurs inclus",
    addOn: "+10 CAD/utilisateur/mois (max 50)",
    discount: "15% annuel",
    addonOption: "AI Coach 24/7 : +10 CAD/utilisateur",
    max_manual_analyses: Infinity,
    max_team_members: 50,
    max_jira_projects: 20,
    primary_sources: ["jira", "trello"],
    contributive_sources: ["slack", "confluence", "teams", "zoom"],
    locked_sources: [],
    included: [
      "Analyses manuelles illimitées (ADMIN ONLY)",
      "Analyses prédictives",
      "≤ 20 projets Jira / Trello",
      "Croisement complet multi-sources: Jira/Trello (autoritaires) + Slack + Confluence + Teams + Zoom",
      "Module de gestion du changement & Transformation organisationnelle (ADMIN ONLY)",
      "Chatbot Intelligent / Coach agile - 24/7",
      "Rapports mensuels détaillés automatiques (ADMIN ONLY)",
      "Notifications intelligentes (ADMIN ONLY)",
      "Exports avancés (PDF, Excel, PowerPoint)",
      "Support prioritaire"
    ],
    roiValue: "ROI mesurable : anticipation dérives, optimisation capacité",
    ctaKey: "subscribe"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "SOLUTION SUR MESURE",
    badgeColor: "bg-yellow-100 text-yellow-800",
    badge2: "👑",
    subtitle: "Gouvernance, sécurité, insights systémiques",
    price: "Custom",
    users: "50+ utilisateurs inclus",
    priceNote: "À partir de 500 CAD/mois - Tarifs annuels sur mesure",
    structure: "+ 15 CAD/utilisateur",
    degressiveNote: "≈10-15 CAD/utilisateur à 100+ utilisateurs",
    enterpriseIntro: "Tous les éléments de Pro, +",
    max_manual_analyses: Infinity,
    max_team_members: Infinity,
    max_jira_projects: Infinity,
    primary_sources: ["jira", "trello"],
    contributive_sources: ["slack", "confluence", "teams", "azuredevops", "zoom"],
    locked_sources: [],
    included: [
      "Analyses organisationnelles & systémiques",
      "Cartographie équipes/projets/dépendances",
      "Re-analyse historique complète sur demande",
      "Options sécurité avancées (on-prem/edge)",
      "Dashboards et reporting custom direction/PMO",
      "Support dédié + SLA",
      "KPIs personnalisés et exports exécutifs",
      "Add-ons usage-based (API calls, analyses)",
      "Consultations et coaching d'experts à la demande"
    ],
    target: "Entreprises, banques, grandes techs, organisations multi-produits",
    ctaKey: "contactTeam"
  }
];

export default function Plans() {
  const navigate = useNavigate();
  const [subscribingPlan, setSubscribingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    checkAuth();
  }, []);

  const handleSubscribe = async (plan) => {
    setSubscribingPlan(plan.id);
    try {
      // Vérifier si on est dans un iframe
      if (window.self !== window.top) {
        toast.error("Le paiement ne fonctionne que depuis l'application publiée, pas en aperçu");
        setSubscribingPlan(null);
        return;
      }

      if (!isAuthenticated) {
        await base44.auth.redirectToLogin(createPageUrl("Plans"));
        setSubscribingPlan(null);
        return;
      }

      const response = await base44.functions.invoke('createStripeCheckout', {
        plan: plan.id
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        const errMsg = response.data?.error || "Erreur lors de la création du paiement";
        const status = response.data?.status || "unknown";
        const details = response.data?.details ? ` - ${JSON.stringify(response.data.details)}` : "";
        toast.error(`${errMsg} [${status}]${details}`);
        setSubscribingPlan(null);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      const msg = error?.message || "Erreur lors de la souscription";
      toast.error(`${msg} [network_error]`);
      setSubscribingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Plans et tarifs
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choisissez le plan adapté à votre équipe
          </p>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card 
                className={`flex flex-col h-full ${plan.id === 'pro' ? 'border-2 border-purple-500 shadow-lg' : 'border-slate-200'}`}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={plan.badgeColor}>
                        {plan.badge}
                      </Badge>
                      {plan.badge2 && <span className="ml-2 text-xl">{plan.badge2}</span>}
                    </div>
                  </div>
                  
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.subtitle}</CardDescription>
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="text-3xl font-bold">
                      {plan.price === 'Custom' ? 'Custom' : `${plan.price} CAD`}
                      {plan.price !== 'Custom' && <span className="text-sm font-normal text-slate-500">/mois</span>}
                    </div>
                    
                    {plan.priceNote && <p className="text-xs text-slate-600">{plan.priceNote}</p>}
                    {plan.yearlyPrice && (
                      <p className="text-xs text-green-600">
                        💰 {plan.yearlyPrice} CAD/mois avec {plan.discount}
                      </p>
                    )}
                    {plan.structure && <p className="text-xs text-slate-600">{plan.structure}</p>}
                    {plan.degressiveNote && <p className="text-xs text-slate-600">{plan.degressiveNote}</p>}

                    <p className="text-sm text-slate-600 pt-2">{plan.users}</p>
                    <p className="text-xs text-slate-500">{plan.addOn}</p>
                    {plan.addonOption && <p className="text-xs text-slate-500 italic">{plan.addonOption}</p>}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  <Button 
                    onClick={() => plan.ctaKey === 'subscribe' ? handleSubscribe(plan) : setSelectedPlan(plan)}
                    disabled={subscribingPlan === plan.id}
                    className={`w-full ${
                      plan.id === 'pro' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : plan.id === 'starter' || plan.id === 'growth' || plan.id === 'enterprise'
                        ? 'bg-[#197aed] hover:bg-[#1568d3]'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {subscribingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Souscription...
                      </>
                    ) : (
                      plan.ctaKey === 'subscribe' ? 'S\'abonner' : 'Contacter'
                    )}
                  </Button>

                  {plan.roiValue && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-sm text-green-800">{plan.roiValue}</p>
                    </div>
                  )}

                  {plan.target && (
                    <div className="bg-amber-50 p-3 rounded border border-amber-200">
                      <p className="text-xs text-amber-800"><strong>Cible:</strong> {plan.target}</p>
                    </div>
                  )}

                  {/* Included Features */}
                  <div>
                    <p className="font-semibold text-sm mb-3">Ce qui est inclus:</p>
                    {plan.enterpriseIntro && (
                      <p className="text-sm text-slate-700 mb-3 font-medium italic">{plan.enterpriseIntro}</p>
                    )}
                    <ul className="space-y-2">
                      {plan.included.map((feature, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {plan.limitations && (
                    <div>
                      <p className="font-semibold text-sm mb-3 text-red-700">Limitations:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limit, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-slate-600">
                            <X className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                            <span>{limit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Sales Modal */}
        {selectedPlan && (
          <Suspense fallback={<div>Loading...</div>}>
            <ContactSalesModal 
              plan={selectedPlan} 
              onClose={() => setSelectedPlan(null)} 
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}