import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import AgileCoachChat from '@/components/nova/AgileCoachChat';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AgileCoach() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        
        // Only admins can access the Agile Coach
        if (user?.role === 'admin' || user?.app_role === 'admin') {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Accès refusé</h1>
          <p className="text-slate-600 mb-6">
            Le Coach Agile est réservé aux administrateurs uniquement.
          </p>
          <Link
            to={createPageUrl('Dashboard')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={createPageUrl('Dashboard')}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Coach Agile Nova</h1>
          <p className="text-slate-600 mt-2">
            Discutez avec votre coach agile pour analyser la performance de votre équipe et obtenir des recommandations d'amélioration.
          </p>
        </div>

        {/* Chat Component */}
        <AgileCoachChat />
      </div>
    </div>
  );
}