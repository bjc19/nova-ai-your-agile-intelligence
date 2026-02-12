import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ContactSalesModal } from "@/components/nova/ContactSalesModal";

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
    included: [
      "30 analyses manuelles uniquement",
      "Insights contextualisés",
      "1 source au choix (Slack, Jira ou Teams)",
      "Configuration guidée",
      "Vue basique avec tendances",
      "Visualisations simples"
    ],
    limitations: [
      "Pas de rapports mensuels automatiques",
      "Pas de détection multi-projets",
      "Pas de croisement avec sources externes",
      "Pas d'alertes automatiques",
      "Pas de KPIs détaillés"
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
    included: [
      "70 analyses manuelles",
      "30 analyses post-réunion automatiques/mois",
      "Insights contextualisés avancés",
      "Intégrations Slack, Jira, Teams",
      "Croisement limité avec 2 sources externes",
      "Dashboard tendances complet",
      "Rapports sommaires mensuels automatiques",
      "Alertes basiques sur dérives"
    ],
    limitations: [
      "Max 30 analyses post-réunion automatiques/mois",
      "Pas de détection multi-projets avancée",
      "Pas de croisement complet",
      "Pas de KPIs détaillés",
      "Pas d'analyses organisationnelles"
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
    included: [
      "Analyses post-réunion illimitées",
      "Croisement complet multi-sources",
      "Détection et adaptation multi-projets & multi-équipes",
      "Recommandations courageuses contextualisées",
      "Stabilité Sprint Goal / Product Goal",
      "Risques capacité / focus",
      "Adoption recommandations (~65%)",
      "Cycle time & flow efficiency",
      "Dérives anticipées (~80%)",
      "Rapports mensuels détaillés automatiques",
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
    users: "50 utilisateurs inclus",
    priceNote: "À partir de 500 CAD/mois - Tarifs annuels sur mesure",
    structure: "+ 15 CAD/utilisateur",
    degressiveNote: "≈10-15 CAD/utilisateur à 100+ utilisateurs",
    enterpriseIntro: "Tous les éléments de Pro, +",
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
        toast.error(response.data?.error || "Erreur lors de la création du paiement");
        setSubscribingPlan(null);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(error?.message || "Erreur lors de la souscription");
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
            Plans de tarification
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins. Tous les plans incluent une période d'essai gratuite.
          </p>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl transition-all ${
                plan.recommended
                  ? "ring-2 ring-blue-600 scale-105 shadow-2xl"
                  : "border border-slate-200 shadow-lg"
              } bg-white overflow-hidden`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 text-center text-sm font-semibold">
                  ⭐ Plan Recommandé
                </div>
              )}

              <div className={`p-8 ${plan.recommended ? "pt-16" : ""}`}>
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-slate-600">€/{plan.billing}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Facturation mensuelle, sans engagement
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading}
                  className={`w-full mb-8 ${
                    plan.recommended
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                      : "border border-slate-300 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {plan.cta}
                </Button>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Questions fréquentes
          </h2>
          
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h4>
              <p className="text-slate-600">
                Oui, vous pouvez changer de plan à tout moment. Le changement prendra effet immédiatement et nous ajusterons votre facturation en conséquence.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-2">
                Y a-t-il une période d'essai gratuite ?
              </h4>
              <p className="text-slate-600">
                Oui, tous les plans incluent une période d'essai gratuite de 14 jours. Aucune carte de crédit requise.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-2">
                Avez-vous des plans personnalisés ?
              </h4>
              <p className="text-slate-600">
                Oui, pour les entreprises avec des besoins spécifiques. Veuillez nous contacter pour discuter d'un plan personnalisé.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-2">
                Quelle est votre politique de remboursement ?
              </h4>
              <p className="text-slate-600">
                Nous offrons un remboursement complet dans les 30 jours si vous n'êtes pas satisfait.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}