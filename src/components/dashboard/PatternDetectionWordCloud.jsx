import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PatternDetectionWordCloud({ selectedWorkspaceId, selectedWorkspaceType }) {
  const [patterns, setPatterns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setIsLoading(true);
        const query = {
          status: { $in: ["detected", "acknowledged", "in_progress"] }
        };
        
        if (selectedWorkspaceId && selectedWorkspaceType) {
          if (selectedWorkspaceType === 'jira') {
            query.jira_project_selection_id = selectedWorkspaceId;
          } else if (selectedWorkspaceType === 'trello') {
            query.trello_project_selection_id = selectedWorkspaceId;
          }
        }

        const result = await base44.entities.PatternDetection.filter(query, '-created_date', 15);
        setPatterns(result || []);
      } catch (error) {
        console.error("Error fetching patterns:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatterns();
  }, [selectedWorkspaceId, selectedWorkspaceType]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!patterns || patterns.length === 0) {
    return null;
  }

  // Group patterns by category and count occurrences
  const patternCounts = {};
  patterns.forEach(p => {
    const key = p.pattern_name || p.category || 'Unknown';
    patternCounts[key] = (patternCounts[key] || 0) + 1;
  });

  const sortedPatterns = Object.entries(patternCounts)
    .filter(([_, count]) => count >= 5) // Only show patterns with 5+ occurrences
    .sort((a, b) => b[1] - a[1]);

  if (sortedPatterns.length === 0) {
    return null;
  }

  const maxCount = Math.max(...sortedPatterns.map(p => p[1]));
  const minCount = Math.min(...sortedPatterns.map(p => p[1]));
  const patternCount = sortedPatterns.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Patterns Détectés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center py-6">
            {sortedPatterns.map(([pattern, count], idx) => {
              // Scale from 0.85rem to 2.5rem based on count
              const normalizedCount = (count - minCount) / (maxCount - minCount);
              const size = 0.85 + normalizedCount * 1.65;
              
              const colors = [
                "bg-red-100 text-red-700",
                "bg-orange-100 text-orange-700",
                "bg-amber-100 text-amber-700",
                "bg-yellow-100 text-yellow-700",
                "bg-lime-100 text-lime-700",
                "bg-green-100 text-green-700"
              ];

              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.15 }}
                  className={`px-4 py-2 rounded-full font-semibold transition-all cursor-pointer ${colors[idx % colors.length]}`}
                  style={{ fontSize: `${size}rem` }}
                >
                  {pattern} <span className="text-xs opacity-60 font-normal">×{count}</span>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}