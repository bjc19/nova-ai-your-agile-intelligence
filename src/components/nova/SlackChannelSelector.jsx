import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Hash,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// This component will work once Slack is connected via backend functions
export default function SlackChannelSelector({ onChannelSelect, isConnected = false }) {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample channels for demo - in production, these would come from Slack API
  const sampleChannels = [
    { id: "C01", name: "daily-standup", members: 8, lastMessage: "2 hours ago" },
    { id: "C02", name: "sprint-planning", members: 12, lastMessage: "1 day ago" },
    { id: "C03", name: "dev-team", members: 6, lastMessage: "30 mins ago" },
    { id: "C04", name: "product-updates", members: 15, lastMessage: "3 hours ago" },
  ];

  const handleSelect = (channel) => {
    setSelectedChannel(channel);
    onChannelSelect(channel);
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl border border-slate-200 bg-slate-50/50"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Slack Integration</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Connect your Slack workspace to import standup messages directly.
        </p>
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>Requires backend functions to be enabled</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-100">
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </div>
          <span className="font-medium text-slate-900">Select Slack Channel</span>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500">
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-2">
        {sampleChannels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleSelect(channel)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedChannel?.id === channel.id
                ? 'border-purple-400 bg-purple-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{channel.name}</p>
                  <p className="text-xs text-slate-500">
                    {channel.members} members • Last message {channel.lastMessage}
                  </p>
                </div>
              </div>
              {selectedChannel?.id === channel.id && (
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedChannel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-purple-50 border border-purple-200"
        >
          <p className="text-sm text-purple-900">
            <strong>Selected:</strong> #{selectedChannel.name}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            Nova will analyze the last 24 hours of messages from this channel.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}