import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tag } from 'lucide-react';
import { base44 } from "@/api/base44Client";

const WorkspaceSelector = ({ onWorkspaceChange, activeWorkspaceId }) => {
  const [selectedValue, setSelectedValue] = useState(activeWorkspaceId || 'all-contexts');
  const [contextLabels, setContextLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContextLabels = async () => {
      setLoading(true);
      try {
        const analyses = await base44.entities.AnalysisHistory.list('-created_date', 200);
        // Extract unique, non-empty context_labels
        const labels = [...new Set(
          analyses
            .map(a => a.context_label)
            .filter(label => label && label.trim() !== '')
        )];
        setContextLabels(labels);
      } catch (err) {
        console.error('WorkspaceSelector: error loading context labels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContextLabels();
  }, []);

  const handleValueChange = (value) => {
    setSelectedValue(value);
    if (value === 'all-contexts') {
      if (onWorkspaceChange) onWorkspaceChange(null, 'context');
    } else {
      if (onWorkspaceChange) onWorkspaceChange(value, 'context');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="text-xs shrink-0">
        <Tag className="w-3 h-3 mr-1" />
        Contexte
      </Badge>

      {loading ? (
        <div className="w-[220px] h-10 bg-slate-100 rounded-md animate-pulse" />
      ) : contextLabels.length === 0 ? (
        <div className="text-sm text-slate-400 italic">Aucun contexte défini</div>
      ) : (
        <Select value={selectedValue} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[220px] bg-white border-slate-200">
            <SelectValue placeholder="Filtrer par contexte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-contexts">
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span>Tous les contextes</span>
              </div>
            </SelectItem>
            {contextLabels.map((label) => (
              <SelectItem key={label} value={label}>
                <div className="flex items-center gap-2">
                  <span>🏷️</span>
                  <span>{label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default WorkspaceSelector;