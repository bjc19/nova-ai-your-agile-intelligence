import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Pour les petites équipes",
    price: 99,
    currency: "EUR",
    billing: "month",
    features: [
      "Jusqu'à 5 analyses par mois",
      "Support par email",
      "Tableau de bord basique",
      "Un utilisateur"
    ],
    cta: "Commencer",
    recommended: false
  },
  {
    id: "growth",
    name: "Growth",
    description: "Pour les équipes en croissance",
    price: 299,
    currency: "EUR",
    billing: "month",
    features: [
      "Analyses illimitées",
      "Intégrations Slack & Jira",
      "Tableau de bord avancé",
      "Jusqu'à 10 utilisateurs",
      "Support prioritaire",
      "Recommandations personnalisées"
    ],
    cta: "Choisir",
    recommended: true
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les entreprises",
    price: 999,
    currency: "EUR",
    billing: "month",
    features: [
      "Tout de Growth +",
      "Intégrations Teams & Azure DevOps",
      "Utilisateurs illimités",
      "API personnalisée",
      "Support 24/7",
      "SLA garanti",
      "Rapports mensuels"
    ],
    cta: "Contacter",
    recommended: false
  }
];

export default function Plans() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
        if (auth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    checkAuth();
  }, []);

  const handleSelectPlan = async (planId) => {
    setIsLoading(true);
    try {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        await base44.auth.redirectToLogin(createPageUrl("Plans"));
        return;
      }

      // Create checkout session
      const response = await base44.functions.invoke('createStripeCheckout', {
        plan: planId,
        user_email: user.email,
        user_name: user.full_name
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        console.error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
    } finally {
      setIsLoading(false);
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