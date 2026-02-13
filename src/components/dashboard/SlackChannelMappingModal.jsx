import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Search, Zap } from 'lucide-react';

export default function SlackChannelMappingModal({ workspaceId, workspaceName, isOpen, onClose }) {
  const [slackChannels, setSlackChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mappingInProgress, setMappingInProgress] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSlackChannels();
    }
  }, [isOpen]);

  const loadSlackChannels = async () => {
    try {
      setLoading(true);
      // Fetch Slack channels via your Slack connection
      const user = await base44.auth.me();
      const slackConns = await base44.entities.SlackConnection.list();
      
      if (slackConns.length === 0) {
        console.log('No Slack connection found');
        return;
      }

      // Here you'd call a backend function to fetch actual Slack channels
      // For now, showing structure
      setSlackChannels([
        { id: 'C123456', name: 'nova-project', desc: 'Nova Project team' },
        { id: 'C789012', name: 'general', desc: 'General discussions' }
      ]);
    } catch (error) {
      console.error('Error loading Slack channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapChannel = async () => {
    if (!selectedChannel) return;

    try {
      setMappingInProgress(true);

      // Create mapping
      await base44.entities.SlackChannelMapping.create({
        slack_channel_id: selectedChannel.id,
        slack_channel_name: selectedChannel.name,
        jira_project_selection_id: workspaceId,
        workspace_name: workspaceName,
        mapped_by: 'user_declared',
        confidence_score: 1.0,
        mapped_date: new Date().toISOString(),
        is_active: true
      });

      setSelectedChannel(null);
      onClose();
    } catch (error) {
      console.error('Error mapping channel:', error);
    } finally {
      setMappingInProgress(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
      >
        <CardHeader>
          <CardTitle>Link Slack Channel to {workspaceName}</CardTitle>
          <CardDescription>
            Select which Slack channel belongs to this workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {slackChannels.map(channel => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all ${
                      selectedChannel?.id === channel.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">#{channel.name}</p>
                          <p className="text-xs text-slate-500">{channel.desc}</p>
                        </div>
                        {selectedChannel?.id === channel.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex gap-2">
                <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                  When you analyze in this workspace, Nova will include messages from the mapped Slack channel.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMapChannel}
                  disabled={!selectedChannel || mappingInProgress}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {mappingInProgress ? 'Linking...' : 'Link Channel'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </motion.div>
    </div>
  );
}