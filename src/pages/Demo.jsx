import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TranscriptInput from "@/components/nova/TranscriptInput";
import FileUpload from "@/components/nova/FileUpload";
import SlackChannelSelector from "@/components/nova/SlackChannelSelector";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles, 
  ArrowLeft, 
  Loader2,
  Wand2,
  AlertCircle,
  MessageSquare,
  Upload,
  FileText,
  Lock,
  UserPlus
} from "lucide-react";
import { Link } from "react-router-dom";

const DEMO_LIMIT = 2;
const DEMO_STORAGE_KEY = "nova_demo_count";

export default function Demo() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("transcript");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [demoCount, setDemoCount] = useState(0);

  useEffect(() => {
    // Check demo usage count
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    const count = stored ? parseInt(stored, 10) : 0;
    setDemoCount(count);
  }, []);

  const handleFileDataExtracted = (data) => {
    setTranscript(data);
    setActiveTab("transcript");
  };

  const handleSlackChannelSelect = (channel) => {
    const simulatedSlackMessages = `Slack Channel: #${channel.name}

@sarah_dev (9:02 AM):
Good morning! Yesterday I completed the auth module refactoring. Today I'm picking up the dashboard analytics. No blockers.

@mike_backend (9:04 AM):
Morning team. Still working on the database migration. Hit an issue with the legacy data format - need to write a custom transformer. Might need an extra day.

@lisa_qa (9:05 AM):
@mike_backend that might affect my testing timeline. Can we sync after standup?

@tom_fullstack (9:07 AM):
Wrapped up the API endpoints yesterday. Today starting on the mobile responsive fixes. Quick question - @sarah_dev are you changing any of the header components? Want to avoid conflicts.

@sarah_dev (9:08 AM):
@tom_fullstack yes, I'll be updating the nav. Let me share my branch with you.

@emma_pm (9:10 AM):
Thanks team. @mike_backend let's discuss the migration timeline - client demo is Thursday. We need a backup plan.`;
    
    setTranscript(simulatedSlackMessages);
  };

  const handleAnalyze = async () => {
    // Check demo limit
    if (demoCount >= DEMO_LIMIT) {
      setShowLimitModal(true);
      return;
    }

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

    // Increment demo count
    const newCount = demoCount + 1;
    localStorage.setItem(DEMO_STORAGE_KEY, newCount.toString());
    setDemoCount(newCount);

    // Store result in sessionStorage and navigate
    sessionStorage.setItem("novaAnalysis", JSON.stringify(result));
    sessionStorage.setItem("novaIsDemo", "true");
    navigate(createPageUrl("Results"));
    setIsAnalyzing(false);
  };

  const remainingDemos = Math.max(0, DEMO_LIMIT - demoCount);

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
            Back to Home
          </Link>
          
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-amber-50 border-amber-200 text-amber-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Demo Mode
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-slate-100 border-slate-200 text-slate-600">
              {remainingDemos} {remainingDemos === 1 ? 'analysis' : 'analyses'} remaining
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Try Nova — Free Demo
          </h1>
          <p className="text-slate-600">
            Experience how Nova analyzes your Daily Scrum. Import data or use our sample transcript.
          </p>
        </motion.div>

        {/* Demo Limit Warning */}
        {remainingDemos <= 1 && remainingDemos > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200"
          >
            <p className="text-sm text-amber-800">
              <strong>Last demo remaining!</strong> Register for free to get unlimited analyses and full dashboard access.
            </p>
          </motion.div>
        )}

        {/* Input Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl">
            <TabsTrigger 
              value="slack" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Slack
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger 
              value="transcript" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
            >
              <FileText className="w-4 h-4" />
              Paste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slack" className="mt-6">
            <SlackChannelSelector 
              onChannelSelect={handleSlackChannelSelect}
              isConnected={false}
            />
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Demo Mode:</strong> Slack integration is simulated. Register to connect your real Slack workspace.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <FileUpload onDataExtracted={handleFileDataExtracted} />
            <p className="text-xs text-slate-500 mt-3">
              Upload meeting transcripts, exported Jira reports, or any text file with standup notes.
            </p>
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">
            <TranscriptInput 
              value={transcript} 
              onChange={setTranscript} 
            />
          </TabsContent>
        </Tabs>

        {/* Analysis Section */}
        <div className="space-y-6 mt-6">
          {transcript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Data Ready for Analysis</span>
                <Badge variant="outline" className="text-xs">
                  {transcript.length.toLocaleString()} characters
                </Badge>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                {transcript.substring(0, 150)}...
              </p>
            </motion.div>
          )}

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
              disabled={isAnalyzing || !transcript.trim() || remainingDemos === 0}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Nova is analyzing the meeting...
                </>
              ) : remainingDemos === 0 ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Demo Limit Reached — Register to Continue
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Analyze with Nova ({remainingDemos} left)
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

        {/* Demo Limit Modal */}
        <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                Demo Limit Reached
              </DialogTitle>
              <DialogDescription className="pt-2">
                You've used all your free demo analyses. Register for free to unlock:
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 my-4">
              {[
                "Unlimited analyses",
                "Full dashboard with trends & history",
                "Slack integration",
                "Team collaboration features",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register for Free
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowLimitModal(false)}
              >
                Maybe Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}