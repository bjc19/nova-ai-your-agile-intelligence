import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreditCard, Users, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

export default function ChooseAccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);

        // Exception pour les admins - ils ont toujours accès
        if (u.role === 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }

        const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
        if (statusRes.data.hasAccess) {
          navigate(createPageUrl("Dashboard"));
          return;
        }

        // Check for pending requests
        setHasPendingRequest(statusRes.data.pendingRequests || false);
      } catch (e) {
        // User not authenticated, stay on this page to allow sign up
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubscribe = () => {
    navigate(createPageUrl("Home"));
    setTimeout(() => {
      const pricingSection = document.getElementById("pricing");
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleJoinTeam = async () => {
    if (!adminEmail.trim()) {
      toast.error("Veuillez saisir l'email de l'administrateur");
      return;
    }

    setSubmitting(true);
    try {
      const response = await base44.functions.invoke('joinTeamRequest', {
        adminEmail: adminEmail.trim()
      });

      if (response.data.success) {
        toast.success(response.data.message, { duration: 5000 });
        setAdminEmail("");
        // Force le changement d'état pour afficher le pending
        setHasPendingRequest(true);
      } else {
        toast.error(response.data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Join team error:", error);
      toast.error("Erreur lors de l'envoi de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">
            {user ? `Bienvenue ${user.full_name} 👋` : "Bienvenue 👋"}
          </h1>
          <p className="text-lg text-slate-600">Pour accéder à Nova AI, choisissez l'une des options ci-dessous :</p>
        </div>

        {hasPendingRequest && (
          <Card className="border-2 border-amber-500 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Demande en attente d'approbation</h3>
                  <p className="text-sm text-amber-700">
                    Votre demande pour rejoindre une équipe a été envoyée. Vous recevrez un email dès qu'un administrateur l'approuvera.
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    Une fois approuvée, vous aurez automatiquement accès au Dashboard de l'équipe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          
          <Card className="border-2 hover:border-blue-500 transition-all cursor-pointer" onClick={handleSubscribe}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Souscrire à un plan</CardTitle>
              <CardDescription>Créez votre propre équipe et invitez vos collaborateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-sm text-slate-600">Accès immédiat à toutes les fonctionnalités</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-sm text-slate-600">Invitez jusqu'à 25 membres selon le plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-sm text-slate-600">Plans à partir de 49$/mois</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                Voir les plans
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-500 transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Rejoindre une équipe</CardTitle>
              <CardDescription>Vous avez été invité par un administrateur ?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email de l'administrateur</label>
                <Input 
                  type="email"
                  placeholder="admin@entreprise.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={submitting || hasPendingRequest}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900">
                    Saisissez l'email de l'administrateur qui vous a invité. Il recevra votre demande d'accès et pourra l'approuver depuis son tableau de bord.
                  </p>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={handleJoinTeam}
                disabled={submitting || hasPendingRequest}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {hasPendingRequest ? 'Demande déjà envoyée' : 'Envoyer la demande'}
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}