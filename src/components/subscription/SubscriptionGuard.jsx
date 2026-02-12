import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export function SubscriptionGuard({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate(createPageUrl("Home"));
          return;
        }

        const response = await base44.functions.invoke('getUserSubscriptionStatus', {});
        
        if (!response.data.hasAccess && !response.data.pendingRequests) {
          navigate(createPageUrl("ChooseAccess"));
          return;
        }

        setStatus(response.data);
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!status?.hasAccess && status?.pendingRequests) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Demande en attente</h2>
          <p className="text-slate-600">
            Votre demande pour rejoindre une équipe est en cours de traitement. 
            Vous recevrez un email dès que l'administrateur aura traité votre demande.
          </p>
        </div>
      </div>
    );
  }

  return children;
}