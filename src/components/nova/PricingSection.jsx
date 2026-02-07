import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { ContactSalesModal } from "@/components/nova/ContactSalesModal";

const translations = {
  en: {
    contactSales: "Contact Sales",
    contactTeam: "Contact Sales"
  },
  fr: {
    contactSales: "Contact Sales",
    contactTeam: "Contactez notre équipe commerciale"
  }
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    badge: "RECOMMANDÉ POUR DÉBUTER",
    badgeColor: "bg-green-100 text-green-800",
    subtitle: "Découvrez la puissance de Nova",
    price: "50",
    users: "Jusqu'à 5 utilisateurs inclus",
    addOn: "+10 CAD/utilisateur/mois (max 10)",
    included: [
      "Analyses manuelles uniquement",
      "10 analyses par mois",
      "Insights contextualisés",
      "1 source au choix (Slack, Jira ou Teams)",
      "Configuration guidée",
      "Vue basique avec tendances",
      "Visualisations simples",
      "Export PDF basique"
    ],
    limitations: [
      "Pas de rapports mensuels automatiques",
      "Pas de détection multi-projets",
      "Pas de croisement avec sources externes",
      "Pas d'alertes automatiques",
      "Pas de KPIs détaillés"
    ],
    highlight: "NON renouvelable - Upgrade vers Growth requis",
    ctaKey: "contactSales"
  },
  {
    id: "growth",
    name: "Growth",
    badge: "PLUS DE VALEUR",
    badgeColor: "bg-blue-100 text-blue-800",
    subtitle: "Idéal pour plus de volume d'analyses",
    price: "99",
    yearlyPrice: "84",
    users: "Jusqu'à 5 utilisateurs inclus",
    addOn: "+15 CAD/utilisateur/mois (max 10)",
    discount: "15% annuel",
    included: [
      "Analyses manuelles illimitées",
      "8 analyses post-réunion automatiques/mois",
      "Insights contextualisés avancés",
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
    ctaKey: "contactSales"
  },
  {
    id: "pro",
    name: "Pro",
    badge: "MEILLEUR RAPPORT QUALITÉ/PRIX",
    badgeColor: "bg-purple-100 text-purple-800",
    badge2: "⭐",
    subtitle: "ROI clair et mesurable",
    price: "199",
    yearlyPrice: "169",
    users: "Jusqu'à 10 utilisateurs inclus",
    addOn: "+20 CAD/utilisateur/mois (max 50)",
    discount: "15% annuel",
    addonOption: "AI Coach 24/7 : +10 CAD/utilisateur",
    included: [
      "Analyses post-réunion illimitées",
      "Croisement complet multi-sources",
      "Détection et adaptation multi-projets",
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
    ctaKey: "contactSales"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "SOLUTION SUR MESURE",
    badgeColor: "bg-yellow-100 text-yellow-800",
    badge2: "👑",
    subtitle: "Gouvernance, sécurité, insights systémiques",
    price: "Custom",
    priceNote: "À partir de 500 CAD/mois",
    structure: "Base + 25 CAD/utilisateur (min 50 utilisateurs)",
    degressiveNote: "≈15-20 CAD/utilisateur à 100+ utilisateurs",
    enterpriseIntro: "Tous les éléments de Pro, +",
    included: [
      "Analyses organisationnelles & systémiques",
      "Cartographie équipes/projets/dépendances",
      "Re-analyse historique complète sur demande",
      "Options sécurité avancées (on-prem/edge)",
      "Dashboards et reporting custom direction/PMO",
      "Support dédié + SLA",
      "KPIs personnalisés et exports exécutifs",
      "Add-ons usage-based (API calls, analyses)"
    ],
    target: "Entreprises, banques, grandes techs, organisations multi-produits",
    ctaKey: "contactTeam"
  }
];

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [lang, setLang] = useState("en");

  React.useEffect(() => {
    const browserLang = navigator.language || navigator.userLanguage;
    setLang(browserLang.startsWith("fr") ? "fr" : "en");
  }, []);

  const t = (key) => translations[lang][key] || translations["en"][key];

  return (
    <div className="space-y-8">
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
              <Button 
                onClick={() => setSelectedPlan(plan)}
                className={`w-full ${
                  plan.id === 'pro' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : plan.id === 'starter' || plan.id === 'growth' || plan.id === 'enterprise'
                    ? 'bg-[#197aed] hover:bg-[#1568d3]'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {t(plan.ctaKey)}
              </Button>

              {plan.highlight && (
                <p className="text-xs text-red-600 font-semibold text-center">
                  ⚠️ {plan.highlight}
                </p>
              )}

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
        <ContactSalesModal 
          plan={selectedPlan} 
          onClose={() => setSelectedPlan(null)} 
        />
      )}
    </div>
  );
}