import ChartSuggestionGenerator from './ChartSuggestionGenerator';
import RiskOpportunitiesWordCloud from './RiskOpportunitiesWordCloud';

export default function AnalyticsInsightsBlock({ selectedWorkspaceId, gdprSignals = [], analysisHistory = [] }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <ChartSuggestionGenerator 
        selectedWorkspaceId={selectedWorkspaceId}
        gdprSignals={gdprSignals}
        analysisHistory={analysisHistory}
      />
      <RiskOpportunitiesWordCloud 
        selectedWorkspaceId={selectedWorkspaceId}
        gdprSignals={gdprSignals}
        analysisHistory={analysisHistory}
      />
    </div>
  );
}