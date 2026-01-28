import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TranscriptInput, { SAMPLE_TRANSCRIPT } from "@/components/nova/TranscriptInput";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles, 
  ArrowLeft, 
  Loader2,
  Wand2,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Analysis() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError("Please enter a transcript to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const analysisPrompt = `You are Nova, an AI Scrum Master analyzing a Daily Scrum meeting transcript. Analyze the following transcript and identify:

1. Blockers - issues preventing team members from making progress
2. Risks - potential problems that could impact the sprint/project
3. Dependencies - tasks that depend on other team members or external factors
4. Recommended actions for each issue

Transcript:
${transcript}

Provide a detailed analysis in the following JSON format:`;

    const responseSchema = {
      type: "object",
      properties: {
        blockers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              member: { type: "string" },
              issue: { type: "string" },
              urgency: { type: "string", enum: ["high", "medium", "low"] },
              action: { type: "string" }
            }
          }
        },
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              impact: { type: "string" },
              mitigation: { type: "string" }
            }
          }
        },
        recommendations: {
          type: "array",
          items: { type: "string" }
        },
        summary: { type: "string" }
      }
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema
    });

    // Store result in sessionStorage and navigate
    sessionStorage.setItem("novaAnalysis", JSON.stringify(result));
    navigate(createPageUrl("Results"));
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link 
            to={createPageUrl("Home")}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-blue-50 border-blue-200 text-blue-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Simulation Mode
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Analyze Your Daily Scrum
          </h1>
          <p className="text-slate-600">
            Paste your meeting transcript below or use our sample data to see Nova in action.
          </p>
        </motion.div>

        {/* Input Section */}
        <div className="space-y-6">
          <TranscriptInput 
            value={transcript} 
            onChange={setTranscript} 
          />
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !transcript.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Nova is analyzing the meeting...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Analyze with Nova
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Loading State Overlay */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Analyzing Meeting...
              </h3>
              <p className="text-sm text-slate-500">
                Nova is detecting blockers, risks, and generating recommendations
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}