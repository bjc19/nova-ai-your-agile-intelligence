import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, MessageSquare, Calendar, Zap } from 'lucide-react';

export default function AnalysisSourcesIndicator({ analysis }) {
  if (!analysis.contributing_sources || analysis.contributing_sources.length === 0) {
    return null;
  }

  const sourceIcons = {
    transcript: Calendar,
    slack: MessageSquare,
    jira_backlog: Database,
    jira_agile: Database,
    teams: MessageSquare,
    teams_transcript: Calendar
  };

  const sourceLabels = {
    transcript: 'Transcript',
    slack: 'Slack',
    jira_backlog: 'Jira Backlog',
    jira_agile: 'Jira Sprint',
    teams: 'Teams',
    teams_transcript: 'Teams'
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600">Sources:</span>
        <div className="flex items-center gap-1">
          {analysis.contributing_sources.map((contrib, idx) => {
            const Icon = sourceIcons[contrib.source] || Zap;
            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="gap-1 bg-white border-slate-200"
                  >
                    <Icon className="w-3 h-3" />
                    {sourceLabels[contrib.source]}
                    <span className="text-xs opacity-70">
                      {Math.round(contrib.confidence * 100)}%
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>{sourceLabels[contrib.source]} - {Math.round(contrib.confidence * 100)}% confidence</p>
                  {contrib.metadata?.channel_name && (
                    <p>Channel: #{contrib.metadata.channel_name}</p>
                  )}
                  {contrib.metadata?.message_count && (
                    <p>{contrib.metadata.message_count} relevant messages</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {analysis.cross_source_confidence !== undefined && (
          <span className="text-xs text-slate-500">
            Fusion: {Math.round(analysis.cross_source_confidence * 100)}%
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}