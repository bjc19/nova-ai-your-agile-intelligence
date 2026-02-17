import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlanLimitationsDisplay() {
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const response = await base44.functions.invoke('getUserSubscriptionStatus', {});
        const { planDetails, plan } = response.data;
        setPlanDetails({ ...planDetails, plan_name: plan });
      } catch (error) {
        console.error('Error fetching plan details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-lg" />;
  if (!planDetails) return null;

  const sourceCategories = [
    { label: 'Sources Primaires', items: planDetails.primary_sources || [] },
    { label: 'Sources Contributives', items: planDetails.contributive_sources || [] }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Plan: {planDetails.plan_name}
              </CardTitle>
              <CardDescription>Quota et limitations associés</CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">{planDetails.plan_name}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limites d'Utilisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planDetails.max_manual_analyses !== undefined && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Analyses Manuelles</p>
                <p className="text-2xl font-bold text-slate-900">{planDetails.max_manual_analyses}</p>
                <p className="text-xs text-slate-500 mt-1">par période</p>
              </div>
            )}
            {planDetails.max_auto_analyses !== undefined && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Analyses Automatiques</p>
                <p className="text-2xl font-bold text-slate-900">{planDetails.max_auto_analyses}</p>
                <p className="text-xs text-slate-500 mt-1">par mois</p>
              </div>
            )}
            {planDetails.max_team_members !== undefined && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Membres d'Équipe</p>
                <p className="text-2xl font-bold text-slate-900">{planDetails.max_team_members}</p>
                <p className="text-xs text-slate-500 mt-1">maximum</p>
              </div>
            )}
            {planDetails.max_jira_projects !== undefined && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Projets Jira/Trello</p>
                <p className="text-2xl font-bold text-slate-900">{planDetails.max_jira_projects}</p>
                <p className="text-xs text-slate-500 mt-1">simultanés</p>
              </div>
            )}
          </div>

          {/* Admin-only analyses warning */}
          {planDetails.manual_analysis_admin_only && (
            <Alert className="bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Les analyses manuelles sont réservées aux administrateurs sur ce plan
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Available Sources */}
      {sourceCategories.some(cat => cat.items.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Sources Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {sourceCategories.map((category, idx) => 
              category.items.length > 0 && (
                <div key={idx}>
                  <p className="text-sm font-medium text-slate-700 mb-3">{category.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map(source => (
                      <Badge 
                        key={source}
                        className="bg-emerald-100 text-emerald-700 border-emerald-200"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Features */}
      {planDetails.included_features && planDetails.included_features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fonctionnalités Incluses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planDetails.included_features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Limitations/Restrictions */}
      {planDetails.limitations && planDetails.limitations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <Lock className="w-5 h-5" />
              Limitations du Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planDetails.limitations.map((limitation, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">{limitation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}