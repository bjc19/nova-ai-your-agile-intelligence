import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Target, TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

/**
 * Composant d'affichage de risque adapté automatiquement au rôle
 * @param {Object} risk - Risque transformé selon le rôle
 * @param {String} role - Rôle de l'utilisateur (pour affichage indicateur)
 */
export default function RoleBasedRiskDisplay({ risk, role }) {
  const { language } = useLanguage();
  
  if (!risk) return null;
  
  const presentationLevel = risk.presentation_level;
  
  if (presentationLevel === 'admin_technical') {
    return <AdminTechnicalView risk={risk} language={language} />;
  } else if (presentationLevel === 'contributor_actionable') {
    return <ContributorActionableView risk={risk} language={language} />;
  } else if (presentationLevel === 'user_constructive') {
    return <MemberConstructiveView risk={risk} language={language} />;
  }
  
  return null;
}

// ============================================================================
// ADMIN VIEW COMPONENT
// ============================================================================

function AdminTechnicalView({ risk, language }) {
  const { t } = useLanguage();
  return (
    <Card className="border-l-4 border-l-red-500 bg-red-50/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
              {risk.title}
            </CardTitle>
            <p className="text-sm text-slate-600">{risk.content}</p>
          </div>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 ml-4">
            {t('technicalView')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Technical Details */}
        {risk.technical_details && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t('technicalDetails')}
            </h4>
            
            {risk.technical_details.pattern_ids?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t('patterns')}:</span>
                {risk.technical_details.pattern_ids.map((id, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    {id}
                  </Badge>
                ))}
              </div>
            )}
            
            {risk.technical_details.urgency_level && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t('urgency')}:</span>
                <Badge className={getUrgencyColor(risk.technical_details.urgency_level)}>
                  {risk.technical_details.urgency_level}
                </Badge>
              </div>
            )}
            
            {risk.technical_details.confidence_score && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t('confidence')}:</span>
                <span className="text-sm font-medium text-slate-700">
                  {risk.technical_details.confidence_score}%
                </span>
              </div>
            )}
            
            {risk.technical_details.affected_members?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t('affectedMembers')}:</span>
                <span className="text-sm text-slate-700">
                  {risk.technical_details.affected_members.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Expert Actions */}
        {risk.expert_actions?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              {t('expertActions')}
            </h4>
            <ul className="space-y-2">
              {risk.expert_actions.map((action, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Impact Analysis */}
        {risk.impact_analysis && (
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-800 mb-1">{t('sprintImpact')}</p>
            <p className="text-sm text-amber-700">{risk.impact_analysis.sprint_impact}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONTRIBUTOR VIEW COMPONENT
// ============================================================================

function ContributorActionableView({ risk, language }) {
  const { t } = useLanguage();
  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
              {risk.title}
            </CardTitle>
            <p className="text-sm text-slate-600">{risk.content}</p>
          </div>
          <Badge variant="outline" className="bg-orange-100 text-orange-700 ml-4">
            {t('teamView')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Simplified */}
        {risk.context_simplified && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-slate-500 min-w-[60px]">{t('what')}:</span>
              <span className="text-sm text-slate-700">{risk.context_simplified.what}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-slate-500 min-w-[60px]">{t('impact')}:</span>
              <span className="text-sm text-slate-700">{risk.context_simplified.impact}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-slate-500 min-w-[60px]">{t('importance')}:</span>
              <span className="text-sm text-slate-700">{risk.context_simplified.why_matters}</span>
            </div>
          </div>
        )}
        
        {/* Actionable Steps */}
        {risk.actionable_steps?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t('actionableSteps')}
            </h4>
            {risk.actionable_steps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(step.priority)}>
                    {step.priority}
                  </Badge>
                  <span className="text-xs text-slate-500">{step.time}</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{step.action}</p>
                <p className="text-xs text-slate-500">
                  {t('responsible')}: <span className="font-medium">{step.who}</span>
                </p>
              </div>
            ))}
          </div>
        )}
        
        {/* Conversation Starters */}
        {risk.conversation_starters?.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-semibold text-blue-800 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              {t('teamQuestions')}
            </h4>
            {risk.conversation_starters.map((question, idx) => (
              <p key={idx} className="text-sm text-blue-700 italic">"{question}"</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MEMBER VIEW COMPONENT
// ============================================================================

function MemberConstructiveView({ risk, language }) {
  const { t } = useLanguage();
  return (
    <Card className="border-l-4 border-l-green-500 bg-green-50/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
              {risk.title}
            </CardTitle>
            <p className="text-sm text-slate-600">{risk.content}</p>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-700 ml-4">
            {t('businessView')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Context */}
        {risk.business_context && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{t('situation')}</p>
                  <p className="text-sm text-slate-700">{risk.business_context.situation}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{t('need')}</p>
                  <p className="text-sm text-slate-700">{risk.business_context.need}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{t('expectedOutcome')}</p>
                  <p className="text-sm text-slate-700">{risk.business_context.outcome_desired}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Constructive Framing */}
        {risk.constructive_framing && (
          <div className="space-y-2">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✓ {risk.constructive_framing.positive}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                → {risk.constructive_framing.forward_looking}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUrgencyColor(urgency) {
  const colors = {
    'high': 'bg-red-100 text-red-800 border-red-300',
    'medium': 'bg-orange-100 text-orange-800 border-orange-300',
    'low': 'bg-blue-100 text-blue-800 border-blue-300'
  };
  return colors[urgency?.toLowerCase()] || colors.medium;
}

function getPriorityColor(priority) {
  const colors = {
    'HIGH': 'bg-red-100 text-red-800',
    'MEDIUM': 'bg-orange-100 text-orange-800',
    'LOW': 'bg-blue-100 text-blue-800'
  };
  return colors[priority] || colors.MEDIUM;
}