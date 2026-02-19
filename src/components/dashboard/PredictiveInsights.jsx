import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  Target,
  RefreshCw,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function PredictiveInsights({ selectedWorkspaceId }) {
   const { t } = useLanguage();
   const [prediction, setPrediction] = useState(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(null);

   const loadPredictions = async () => {
     setIsLoading(true);
     setError(null);
     try {
       const response = await base44.functions.invoke('predictiveAnalysis', {
         workspaceId: selectedWorkspaceId || null
       });
      if (!response.data.success) {
        setError(response.data.error || 'Données insuffisantes');
        return;
      }
      setPrediction(response.data.prediction);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [selectedWorkspaceId]);

  const getImpactColor = (impact) => {
    switch(impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const translateImpact = (impact) => {
    const impactMap = {
      'high': t('high'),
      'medium': t('medium'),
      'low': t('low')
    };
    return impactMap[impact] || impact;
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <ArrowRight className="w-5 h-5 text-slate-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Sparkles className="w-5 h-5" />
            {t('predictiveAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-600">{t('analyzingTrends')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPredictions}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  return (
    <div className="space-y-4">
      {/* Overall Health Trend */}
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="w-5 h-5" />
              {t('predictiveAnalysis')}
              <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                {t('confidenceScore')}: {prediction.confidence_score}%
              </Badge>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={loadPredictions}
              className="text-indigo-600 hover:text-indigo-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-indigo-100">
            {getTrendIcon(prediction.overall_health_trend)}
            <div className="flex-1">
              <p className="font-medium text-slate-900">
                {t('healthTrend')}: {
                  prediction.overall_health_trend === 'improving' ? t('improving') :
                  prediction.overall_health_trend === 'declining' ? t('declining') : t('stable')
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks Prediction */}
      {prediction.bottlenecks && prediction.bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              {t('probableBottlenecks')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prediction.bottlenecks.map((bottleneck, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{bottleneck.area}</h4>
                  <Badge className={getImpactColor(bottleneck.impact)}>
                    {translateImpact(bottleneck.impact)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {bottleneck.timeframe}
                  </div>
                  <div>
                    {t('probability')}: {bottleneck.probability}%
                  </div>
                  <div>
                    {t('confidence')}: {bottleneck.confidence}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risks Prediction */}
      {prediction.risks && prediction.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Target className="w-5 h-5 text-red-600" />
              {t('potentialRisks')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prediction.risks.map((risk, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                 <p className="font-medium text-slate-900">{risk.description}</p>
                 <div className="flex gap-2">
                   <Badge className={getImpactColor(risk.likelihood)}>
                     {translateImpact(risk.likelihood)}
                   </Badge>
                   <Badge className={getImpactColor(risk.severity)}>
                     {translateImpact(risk.severity)}
                   </Badge>
                 </div>
                </div>
                {risk.early_warning_signs && risk.early_warning_signs.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-600 mb-1">{t('earlyWarningSigns')}:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {risk.early_warning_signs.map((sign, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {sign}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                   {t('confidence')}: {risk.confidence}%
                 </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delivery Forecast */}
      {prediction.delivery_forecast && (
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Clock className="w-5 h-5" />
              {t('deliveryForecast')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <p className="text-sm text-slate-600 mb-1">{t('estimatedDelivery')}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {prediction.delivery_forecast.estimated_completion}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                   {t('confidence')}: {prediction.delivery_forecast.confidence_level}
                 </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">{t('influencingFactors')}:</p>
                <div className="flex flex-wrap gap-2">
                  {prediction.delivery_forecast.factors?.map((factor, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>

              {prediction.delivery_forecast.velocity_trend && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">{t('velocityTrend')}:</span> {prediction.delivery_forecast.velocity_trend}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preventive Actions */}
      {prediction.preventive_actions && prediction.preventive_actions.length > 0 && (
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Target className="w-5 h-5" />
              {t('preventiveActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prediction.preventive_actions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Badge className={getImpactColor(action.priority)}>
                  {translateImpact(action.priority)}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{action.action}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {t('expectedImpact')}: {action.expected_impact}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}