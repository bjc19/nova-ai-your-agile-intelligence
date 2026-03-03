import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Loader2, ChevronDown, ChevronUp,
  Shield, Sparkles, AlertTriangle, CheckCircle2, TrendingUp,
  Clock, RefreshCw, Volume2
} from "lucide-react";

const TONE_CONFIG = {
  confident:    { color: "text-green-600",  bg: "bg-green-50 border-green-200",  icon: "💪", label: "Confiant" },
  anxious:      { color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",  icon: "😰", label: "Anxieux" },
  confused:     { color: "text-purple-600", bg: "bg-purple-50 border-purple-200",icon: "🤔", label: "Confus" },
  uncertain:    { color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",    icon: "❓", label: "Incertain" },
  frustrated:   { color: "text-red-600",    bg: "bg-red-50 border-red-200",      icon: "😤", label: "Frustré" },
  neutral:      { color: "text-slate-600",  bg: "bg-slate-50 border-slate-200",  icon: "😐", label: "Neutre" },
};

const RISK_CONFIG = {
  low:      { color: "text-green-700",  bg: "bg-green-100",  label: "Risque faible" },
  medium:   { color: "text-amber-700",  bg: "bg-amber-100",  label: "Risque modéré" },
  high:     { color: "text-orange-700", bg: "bg-orange-100", label: "Risque élevé" },
  critical: { color: "text-red-700",    bg: "bg-red-100",    label: "Risque critique" },
};

export default function SituationalContextInput({ workspaceId, workspaceType, onAnalysisDone }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [voiceMetrics, setVoiceMetrics] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const hesitationWordsRef = useRef(0);
  const pauseCountRef = useRef(0);
  const lastSpeechRef = useRef(null);
  const wordCountRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    hesitationWordsRef.current = 0;
    pauseCountRef.current = 0;
    wordCountRef.current = 0;
    startTimeRef.current = Date.now();
    lastSpeechRef.current = Date.now();
    setRecordingDuration(0);
    setText("");

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
      // Détecter les pauses (silence > 2s)
      if (lastSpeechRef.current && Date.now() - lastSpeechRef.current > 2000) {
        pauseCountRef.current += 1;
        lastSpeechRef.current = Date.now();
      }
    }, 1000);

    recognition.onresult = (event) => {
      lastSpeechRef.current = Date.now();
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const segment = event.results[i][0].transcript;
          finalText += segment + " ";
          // Compter les hésitations
          const hésitations = (segment.match(/\beuh\b|\bem\b|\bhmm\b|\buh\b|\behm\b|\bbon\b/gi) || []).length;
          hesitationWordsRef.current += hésitations;
          wordCountRef.current += segment.split(/\s+/).filter(Boolean).length;
        }
      }
      if (finalText.trim()) {
        setText(prev => (prev + " " + finalText).trim());
      }
    };

    recognition.onend = () => {
      clearInterval(timerRef.current);
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const wpm = duration > 0 ? Math.round((wordCountRef.current / duration) * 60) : 0;
      setVoiceMetrics({
        wordsPerMinute: wpm,
        hesitationsCount: hesitationWordsRef.current,
        pauseCount: pauseCountRef.current,
        durationSeconds: Math.round(duration),
        totalWords: wordCountRef.current
      });
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() || text.trim().length < 5) return;
    setIsAnalyzing(true);
    setShowResult(false);

    try {
      const res = await base44.functions.invoke('analyzeSituationalContext', {
        context_text: text.trim(),
        voice_metrics: voiceMetrics || null,
        workspace_id: workspaceId || null,
        workspace_type: workspaceType || null
      });
      setResult(res.data);
      setShowResult(true);
      setText("");
      setVoiceMetrics(null);
      if (onAnalysisDone) onAnalysisDone(res.data);
    } catch (err) {
      console.error("Erreur analyse situationnelle:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tone = result?.emotional_context?.detected_tone;
  const toneConfig = tone ? (TONE_CONFIG[tone] || TONE_CONFIG.neutral) : null;
  const riskConfig = result?.risk_level ? (RISK_CONFIG[result.risk_level] || RISK_CONFIG.medium) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Nouvelle situation contextuelle</h3>
            <p className="text-xs text-slate-500">Partagez ce que vous observez dans votre équipe aujourd'hui</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
            <Shield className="w-3 h-3 mr-1" /> RGPD protégé
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 border-t border-slate-100">

              {/* Privacy note */}
              <div className="mt-4 mb-3 flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Vos données vocales ne sont <strong>jamais enregistrées</strong>. Seule la transcription anonymisée est analysée. Parlez librement.
                </p>
              </div>

              {/* Text area */}
              <Textarea
                placeholder="Décrivez la situation actuelle de votre projet... Qu'est-ce qui vous préoccupe ? Y a-t-il des tensions dans l'équipe ? Des blocages non visibles dans Trello ?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px] text-sm resize-none border-slate-200 focus:border-blue-300"
                disabled={isRecording || isAnalyzing}
              />

              {/* Recording indicator */}
              {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Enregistrement en cours — {recordingDuration}s — Parlez librement
                </div>
              )}

              {/* Voice metrics preview */}
              {voiceMetrics && !isRecording && (
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  <Volume2 className="w-3 h-3" />
                  <span>{voiceMetrics.totalWords} mots</span>
                  <span>·</span>
                  <span>{voiceMetrics.wordsPerMinute} mots/min</span>
                  <span>·</span>
                  <span>{voiceMetrics.durationSeconds}s</span>
                  <span className="ml-auto text-green-600">✓ Analyse vocale prête</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-3 gap-3">
                <div className="flex items-center gap-2">
                  {speechSupported && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isAnalyzing}
                      className={isRecording ? "border-red-300 text-red-600 hover:bg-red-50" : "border-slate-300 text-slate-600"}
                    >
                      {isRecording ? (
                        <><MicOff className="w-4 h-4 mr-2" /> Arrêter</>
                      ) : (
                        <><Mic className="w-4 h-4 mr-2" /> Parler</>
                      )}
                    </Button>
                  )}
                  {voiceMetrics && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setVoiceMetrics(null); }}
                      className="text-xs text-slate-400"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Réenregistrer
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!text.trim() || text.trim().length < 5 || isAnalyzing || isRecording}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Analyser</>
                  )}
                </Button>
              </div>
            </div>

            {/* Result */}
            <AnimatePresence>
              {showResult && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4"
                >
                  {/* Tone + Risk */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {toneConfig && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${toneConfig.bg} ${toneConfig.color}`}>
                        {toneConfig.icon} Tonalité: {toneConfig.label}
                        {result.emotional_context?.tone_description && (
                          <span className="font-normal opacity-75">— {result.emotional_context.tone_description}</span>
                        )}
                      </span>
                    )}
                    {riskConfig && (
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${riskConfig.bg} ${riskConfig.color}`}>
                        ⚠ {riskConfig.label}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  {result.summary && (
                    <p className="text-sm text-slate-700 italic border-l-4 border-blue-400 pl-3">
                      {result.summary}
                    </p>
                  )}

                  {/* Immediate insights */}
                  {result.immediate_insights?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Signaux détectés</h4>
                      <div className="space-y-2">
                        {result.immediate_insights.map((insight, i) => (
                          <div key={i} className={`text-xs rounded-lg p-2.5 flex gap-2 border ${insight.severity === 'high' ? 'bg-red-50 border-red-200' : insight.severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${insight.severity === 'high' ? 'text-red-500' : insight.severity === 'medium' ? 'text-amber-500' : 'text-green-500'}`} />
                            <div>
                              <strong>{insight.title}</strong> — {insight.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short-term actions */}
                  {result.short_term_actions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Actions à court terme</h4>
                      <div className="space-y-1.5">
                        {result.short_term_actions.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <Clock className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                            <span><strong>{a.deadline}</strong> — {a.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Long-term actions */}
                  {result.long_term_actions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ajustements stratégiques</h4>
                      <div className="space-y-1.5">
                        {result.long_term_actions.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <TrendingUp className="w-3 h-3 mt-0.5 text-indigo-500 flex-shrink-0" />
                            <span><strong>{a.horizon}</strong> — {a.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historical patterns */}
                  {result.historical_patterns?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Patterns historiques</h4>
                      <div className="space-y-1.5">
                        {result.historical_patterns.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className={p.trend === 'worsening' ? 'text-red-500' : p.trend === 'improving' ? 'text-green-500' : 'text-slate-400'}>
                              {p.trend === 'worsening' ? '↓' : p.trend === 'improving' ? '↑' : '→'}
                            </span>
                            {p.pattern} ({p.occurrences}x)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Analyse sauvegardée dans l'historique du projet
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}