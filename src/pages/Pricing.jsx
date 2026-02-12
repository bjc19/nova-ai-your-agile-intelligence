import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const plans = [
    {
      name: "Starter",
      price: 49,
      description: "Pour les petites équipes",
      features: [
        "Jusqu'à 5 utilisateurs",
        "Analyses illimitées",
        "Intégrations Slack & Jira",
        "Support par email"
      ],
      priceId: "price_starter"
    },
    {
      name: "Growth",
      price: 99,
      description: "Pour les équipes en croissance",
      features: [
        "Jusqu'à 15 utilisateurs",
        "Analyses illimitées",
        "Toutes les intégrations",
        "Support prioritaire",
        "Rapports personnalisés"
      ],
      priceId: "price_growth",
      popular: true
    },
    {
      name: "Pro",
      price: 199,
      description: "Pour les grandes équipes",
      features: [
        "Jusqu'à 25 utilisateurs",
        "Analyses illimitées",
        "Toutes les intégrations",
        "Support 24/7",
        "Rapports avancés",
        "API personnalisée"
      ],
      priceId: "price_pro"
    }
  ];

  const handleSelectPlan = async (plan) => {
    try {
      const response = await base44.functions.invoke('createStripeCheckout', {
        plan: plan.name.toLowerCase()
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          to={createPageUrl("Dashboard")}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Retour au tableau de bord
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-slate-600">
            Accès illimité à toutes les analyses dès que vous vous abonnez
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl border-2 transition-all ${
                plan.popular
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl shadow-blue-500/20"
                  : "border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Populaire
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900">
                    ${plan.price}
                  </span>
                  <span className="text-slate-600 ml-2">/mois</span>
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full mb-8 ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Choisir ce plan
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Questions fréquentes
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Puis-je changer de plan à tout moment ?",
                a: "Oui, vous pouvez mettre à jour ou rétrograder votre plan à tout moment depuis vos paramètres."
              },
              {
                q: "Offrez-vous une période d'essai gratuit ?",
                a: "Nous offrons une démonstration gratuite. Pour un essai du plan, contactez notre équipe commerciale."
              },
              {
                q: "Que se passe-t-il à la fin de ma période de facturation ?",
                a: "Votre abonnement se renouvelle automatiquement chaque mois. Vous pouvez l'annuler à tout moment."
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}