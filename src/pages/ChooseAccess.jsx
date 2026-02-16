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
  const [requestStatus, setRequestStatus] = useState(null);
  const [pendingRequestId, setPendingRequestId] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);

        try {
          const workspaceMembers = await base44.entities.WorkspaceMember.filter({
            user_email: u.email
          });

          if (workspaceMembers && workspaceMembers.length > 0) {
            navigate(createPageUrl("Dashboard"));
            return;
          }
        } catch (e) {
          console.log('No workspace members found');
        }

        const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
        if (statusRes.data.hasAccess) {
          navigate(createPageUrl("Dashboard"));
          return;
        }

        const requests = await base44.entities.JoinTeamRequest.filter({
          requester_email: u.email
        });

        if (requests.length > 0) {
          const latestRequest = requests[requests.length - 1];
          setRequestStatus(latestRequest.status);
          setPendingRequestId(latestRequest.id);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    const interval = setInterval(async () => {
      try {
        const u = await base44.auth.me();
        const requests = await base44.entities.JoinTeamRequest.filter({
          requester_email: u.email
        });

        if (requests.length > 0) {
          const latestRequest = requests[requests.length - 1];
          if (latestRequest.status !== requestStatus) {
            setRequestStatus(latestRequest.status);
            setPendingRequestId(latestRequest.id);

            if (latestRequest.status === 'approved') {
              setTimeout(() => {
                navigate(createPageUrl("Dashboard"));
              }, 1500);
            }
          }
        }
      } catch (e) {
        // Silently fail, user might not be authenticated
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate, requestStatus]);

  const handleSubscribe = () => {
    navigate(createPageUrl("Plans"));
  };

  const handleJoinTeam = async () => {
    if (!adminEmail.trim()) {
      toast.error("Veuillez saisir l'email de l'administrateur");
      return;
    }

    setSubmitting(true);
    try {
      const response = await base44.functions.invoke('joinTeamRequest', {
        managerEmail: adminEmail.trim()
      });

      if (response.data.success) {
        toast.success("Demande envoyée avec succès", { duration: 5000 });
        setRequestStatus("pending");
        setAdminEmail("");
      } else {
        const errMsg = response.data.error || "Erreur lors de l'envoi";
        const status = response.data.status || "unknown";
        toast.error(`${errMsg} [${status}]`);
      }
    } catch (error) {
      const msg = error?.message || "Erreur lors de l'envoi de la demande";
      toast.error(`${msg} [network_error]`);
      console.error('Join team error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectionConfirm = () => {
    setRequestStatus(null);
    setPendingRequestId(null);
    setAdminEmail("");
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
          <p className="text-lg text-slate-600">Accedez à Nova AI en tant qu'administrateur d'équipe en souscrivant à un plan :</p>
        </div>

        {requestStatus === "pending" && (
          <Card className="border-2 border-blue-500 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <div>
                  <CardTitle className="text-xl">Demande en attente</CardTitle>
                  <CardDescription>Votre demande a été envoyée avec succès</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                L'administrateur a reçu votre demande et peut l'approuver ou la rejeter. Vous recevrez un email de confirmation dès que votre demande sera traitée.
              </p>
              <p className="text-xs text-slate-500">
                Cet écran se met à jour automatiquement. Un accès instantané vous sera accordé dès que votre demande sera approuvée.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Loader2 className="w-3 h-3 animate-spin" />
                En attente d'approbation...
              </div>
            </CardContent>
          </Card>
        )}

        {requestStatus === "rejected" && (
          <Card className="border-2 border-red-500 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Demande refusée</CardTitle>
                  <CardDescription>Votre demande a été rejetée</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Malheureusement, votre demande pour rejoindre cette équipe a été refusée. Vous pouvez essayer avec un autre administrateur ou souscrire à votre propre plan.
              </p>
              <Button
                onClick={handleRejectionConfirm}
                className="w-full"
              >
                Je comprends
              </Button>
            </CardContent>
          </Card>
        )}

        {!requestStatus && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}