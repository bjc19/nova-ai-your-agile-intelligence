import React, { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ContactSalesModal = lazy(() => import("@/components/nova/ContactSalesModal").then(m => ({ default: m.ContactSalesModal })));

const translations = {
  en: {
    subscribe: "Subscribe",
    contactTeam: "Contact Sales",
    subscribing: "Processing..."
  },
  fr: {
    subscribe: "Souscrire",
    contactTeam: "Contact Sales",
    subscribing: "En cours..."
  }
};

const plans = [
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
      "Equipe ≤ 5 membres ",
      "1 source externe au choix (Jira / Trello)",
      "≤ 5 projets Jira / Trello ",
      "20 analyses manuelles uniquement",
      "Insights contextualisés",
    ],
    limitations: [
      "Pas de rapports mensuels automatiques",
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
    users: "15 utilisateurs inclus",
    addOn: "+10 CAD/utilisateur/mois (max 25)",
    discount: "15% annuel",
    included: [
      "Equipe ≤ 15 membres ",
      "Intégrations Jira / Trello + Slack et/ou Confluence",
      "≤ 10 projets Jira / Trello ",
      "50 analyses manuelles",
      "Insights contextualisés avancés",
      "Rapports sommaires mensuels automatiques",
    ],
    limitations: [
      "Capacité d'equipe limitée à 15 membres ",
      "Pas de notifications instantanées",
      "Pas de coach/chatbot intelligent dédié",
      "Pas de module de gestion du changement",

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
      "Analyses illimitées",
      "+/- 20 projets Jira / Trello ",
      "Croisement complet multi-sources (Jira/Trello + Confluence + Slack + Teams, etc.)",
      "Module de gestion du changement & Transformation organisationnelle",
      "Chatbot Intelligent / Coach agile - 24/7",
      "Notifications intelligentes",
      "Recommandations courageuses contextualisées",
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

export function PricingSection() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [lang, setLang] = useState("en");
  const [subscribingPlan, setSubscribingPlan] = useState(null);

  React.useEffect(() => {
    const browserLang = navigator.language || navigator.userLanguage;
    setLang(browserLang.startsWith("fr") ? "fr" : "en");
  }, []);

  const t = (key) => translations[lang][key] || translations["en"][key];

  const handleSubscribe = async (plan) => {
    setSubscribingPlan(plan.id);
    try {
      // Vérifier si on est dans un iframe
      if (window.self !== window.top) {
        toast.error("Le paiement ne fonctionne que depuis l'application publiée, pas en aperçu");
        setSubscribingPlan(null);
        return;
      }

      const isAuth = await base44.auth.isAuthenticated();
      
      if (isAuth) {
        // Utilisateur authentifié
        const response = await base44.functions.invoke('createStripeCheckout', {
          plan: plan.id
        });

        if (response.data?.url) {
          window.location.href = response.data.url;
        } else {
          toast.error(response.data?.error || "Erreur lors de la création du paiement");
          setSubscribingPlan(null);
        }
      } else {
        // Utilisateur non authentifié - demander l'email
        const email = prompt("Entrez votre email pour continuer:");
        if (!email) {
          setSubscribingPlan(null);
          return;
        }

        try {
          const response = await base44.functions.invoke('createStripeCheckoutPublic', {
            plan: plan.id,
            email: email.trim()
          });

          console.log('[PricingSection] Checkout response:', response);

          if (response.data?.url) {
            window.location.href = response.data.url;
          } else {
            console.error('[PricingSection] No URL in response:', response.data);
            toast.error(response.data?.error || "Erreur lors de la création du paiement");
            setSubscribingPlan(null);
          }
        } catch (error) {
          console.error('[PricingSection] Checkout error:', error);
          toast.error(error?.message || "Erreur lors de la création du paiement");
          setSubscribingPlan(null);
        }
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(error?.message || "Erreur lors de la souscription");
      setSubscribingPlan(null);
    }
  };

  return (
    <div id="pricing-section" className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold text-slate-900">Plans et tarifs</h2>
        <p className="text-xl text-slate-600">Choisissez le plan adapté à votre équipe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => (
          <Card 
            key={plan.id} 
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
                  <span className="text-sm font-normal text-slate-500">/mois</span>
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
              {plan.highlight && (
                <p className="text-xs text-red-600 font-semibold text-center">
                  ⚠️ {plan.highlight}
                </p>
              )}

              <Button 
                onClick={() => plan.ctaKey === 'subscribe' ? handleSubscribe(plan) : setSelectedPlan(plan)}
                disabled={subscribingPlan === plan.id}
                className={`w-full ${
                  plan.id === 'pro' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : plan.id === 'starter' || plan.id === 'growth' || plan.id === 'enterprise'
                    ? 'bg-gradient-to-r from-teal-500 to-indigo-400 hover:from-teal-400 hover:to-indigo-300'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {subscribingPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('subscribing')}
                  </>
                ) : (
                  t(plan.ctaKey)
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
  );
}