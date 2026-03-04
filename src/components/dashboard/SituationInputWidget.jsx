import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Shield, ChevronDown, ChevronUp, Loader2, Sparkles, RotateCcw, CheckCircle2, AlertTriangle, Activity, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const TONE_LABELS = {
  confident: { label: "Confiant·e", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  anxious: { label: "Anxieux·se", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  uncertain: { label: "Incertain·e", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  neutral: { label: "Neutre", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
};

function VoiceWaveform({ isRecording, energyLevel }) {
  const bars = 20;
  return (
    <div className="flex items-center justify-center gap-0.5 h-10">
      {Array.from({ length: bars }).map((_, i) => {
        const randomHeight = isRecording
          ? Math.max(4, (energyLevel * 36) * (0.4 + 0.6 * Math.sin((Date.now() / 200 + i * 0.7))))
          : 4;
        return (
          <motion.div
            key={i}
            animate={{ height: isRecording ? [4, randomHeight, 4] : 4 }}
            transition={{ duration: 0.4, repeat: isRecording ? Infinity : 0, delay: i * 0.05, ease: "easeInOut" }}
            className={`w-1 rounded-full ${isRecording ? "bg-blue-500" : "bg-slate-300"}`}
            style={{ minHeight: 4 }}
          />
        );
      })}
    </div>
  );
}

export default function SituationInputWidget({ selectedWorkspaceId, selectedWorkspaceType, analysisHistory = [], onAnalysisComplete }) {
  const [mode, setMode] = useState("text"); // "text" | "voice"
  const [text, setText] = useState("");
  const [contextLabel, setContextLabel] = useState("");
  const [skipContext, setSkipContext] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [vocalMetrics, setVocalMetrics] = useState(null);
  const [gdprCollapsed, setGdprCollapsed] = useState(true);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const recordingStartRef = useRef(null);
  const pauseCountRef = useRef(0);
  const wordTimestampsRef = useRef([]);
  const energySamplesRef = useRef([]);

  // Audio energy analysis
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      energySamplesRef.current = [];

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        energySamplesRef.current.push(rms);
        setEnergyLevel(Math.min(1, rms * 5));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.warn("Microphone non disponible:", err);
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    analyserRef.current = null;
    audioContextRef.current = null;
    micStreamRef.current = null;
  }, []);

  const computeVocalMetrics = useCallback((durationSeconds) => {
    const samples = energySamplesRef.current;
    if (!samples.length) return null;

    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / samples.length;
    const wordCount = transcript.split(" ").filter(Boolean).length;
    const wpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

    let inferredTone = "neutral";
    if (avg > 0.12 && variance < 0.005) inferredTone = "confident";
    else if (variance > 0.01) inferredTone = "anxious";
    else if (avg < 0.05 || pauseCountRef.current > 5) inferredTone = "uncertain";

    return {
      averageEnergy: parseFloat(avg.toFixed(4)),
      energyVariance: parseFloat(variance.toFixed(4)),
      pauseCount: pauseCountRef.current,
      wordsPerMinute: wpm,
      recordingDuration: Math.round(durationSeconds),
      inferredTone,
    };
  }, [transcript]);

  const startRecording = useCallback(async () => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale. Veuillez utiliser Chrome.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    pauseCountRef.current = 0;
    let lastResult = Date.now();

    recognition.onresult = (event) => {
      const now = Date.now();
      if (now - lastResult > 1500) pauseCountRef.current++;
      lastResult = now;
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim = t;
      }
      if (final) setTranscript((prev) => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (e) => { if (e.error !== "no-speech") console.warn("Speech error:", e.error); };
    recognitionRef.current = recognition;

    recordingStartRef.current = Date.now();
    await startAudioAnalysis();
    recognition.start();
    setIsRecording(true);
    setTranscript("");
    setInterimTranscript("");
    setVocalMetrics(null);
  }, [startAudioAnalysis]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const duration = (Date.now() - (recordingStartRef.current || Date.now())) / 1000;
    stopAudioAnalysis();
    const metrics = computeVocalMetrics(duration);
    setVocalMetrics(metrics);
    setIsRecording(false);
    setInterimTranscript("");
    setEnergyLevel(0);
  }, [stopAudioAnalysis, computeVocalMetrics]);

  useEffect(() => () => { stopRecording(); }, []);

  const finalText = mode === "voice" ? transcript : text;

  const handleAnalyze = async () => {
    if (!finalText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke("analyzeContextualSituation", {
        situationText: finalText,
        vocalMetrics: mode === "voice" ? vocalMetrics : null,
        workspaceId: selectedWorkspaceId,
        workspaceType: selectedWorkspaceType,
      });
      setResult(response.data);
      if (onAnalysisComplete) onAnalysisComplete(response.data);
    } catch (err) {
      console.error("Erreur analyse situationnelle:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setText("");
    setTranscript("");
    setVocalMetrics(null);
    setMode("text");
  };

  const toneInfo = vocalMetrics ? TONE_LABELS[vocalMetrics.inferredTone] : null;
  const currentText = mode === "voice" ? transcript + interimTranscript : text;

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Nouvelle Situation</span>
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-white">
                  {analysisHistory.length} analyses précédentes
                </Badge>
              </div>
              <p className="text-slate-600 text-sm">
                Décrivez ce que vous observez dans votre équipe aujourd'hui — blocages, tensions, progrès, doutes.
                Nova analyse en tenant compte de l'historique du projet.
              </p>
            </div>
            {/* GDPR Notice */}
            <button
              onClick={() => setGdprCollapsed(!gdprCollapsed)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              GDPR Protégé
              {gdprCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          <AnimatePresence>
            {!gdprCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                  <p>🔒 <strong>Aucun verbatim audio n'est enregistré.</strong> Seule la transcription texte est traitée.</p>
                  <p>🛡️ Les noms et données personnelles sont anonymisés automatiquement avant analyse.</p>
                  <p>📋 Conforme au RGPD — vos données restent sous votre contrôle.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        {!result && (
          <div className="p-6">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("voice")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === "voice" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                🎙️ Parler
              </button>
              <button
                onClick={() => { setMode("text"); if (isRecording) stopRecording(); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === "text" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                ✍️ Écrire
              </button>
            </div>

            {/* Text Mode */}
            {mode === "text" && (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex : L'équipe semble ralentir depuis lundi. Il y a des tensions entre deux devs autour de la PR non mergée. Le PO ne répond plus aux questions en daily..."
                className="min-h-[120px] text-sm border-slate-200 resize-none focus:border-blue-400 focus:ring-blue-100"
              />
            )}

            {/* Voice Mode */}
            {mode === "voice" && (
              <div className="space-y-4">
                {/* Recorder */}
                <div className={`rounded-xl border-2 transition-all p-4 ${isRecording ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex flex-col items-center gap-3">
                    <VoiceWaveform isRecording={isRecording} energyLevel={energyLevel} />
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                        isRecording
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <p className="text-xs text-slate-500">
                      {isRecording ? "Enregistrement en cours... Cliquez pour arrêter" : "Cliquez pour commencer"}
                    </p>
                  </div>
                </div>

                {/* Transcript */}
                {(transcript || interimTranscript) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Transcription (relisez avant d'envoyer)</span>
                      {toneInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${toneInfo.bg} ${toneInfo.color}`}>
                          <Activity className="w-3 h-3 inline mr-1" />
                          Tonalité : {toneInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 min-h-[80px] leading-relaxed">
                      {transcript}
                      {interimTranscript && (
                        <span className="text-slate-400 italic">{interimTranscript}</span>
                      )}
                    </div>
                    {vocalMetrics && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          ⏱ {vocalMetrics.recordingDuration}s
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          💬 {vocalMetrics.wordsPerMinute} mots/min
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          🤔 {vocalMetrics.pauseCount} pauses
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Send Button */}
            <div className="flex justify-end mt-4 gap-2">
              {currentText && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400">
                  <RotateCcw className="w-4 h-4 mr-1" /> Réinitialiser
                </Button>
              )}
              <Button
                onClick={handleAnalyze}
                disabled={!currentText.trim() || isAnalyzing || isRecording}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Analyser la situation</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 border-t border-slate-100 space-y-4"
            >
              {/* Health Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${
                    result.overall_health === "healthy" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                    result.overall_health === "at_risk" ? "bg-orange-50 border-orange-200 text-orange-700" :
                    "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    {result.overall_health === "healthy" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.overall_health === "healthy" ? "Situation saine" : result.overall_health === "at_risk" ? "À surveiller" : "Situation critique"}
                  </span>
                  {result.detected_tone && TONE_LABELS[result.detected_tone] && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${TONE_LABELS[result.detected_tone].bg} ${TONE_LABELS[result.detected_tone].color}`}>
                      <Activity className="w-3 h-3 inline mr-1" />
                      {TONE_LABELS[result.detected_tone].label}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400 text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" /> Nouvelle situation
                </Button>
              </div>

              {/* Assessment */}
              {result.situational_assessment && (
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-200">
                  <p className="font-medium text-slate-800 mb-1">📊 Évaluation situationnelle</p>
                  <p>{result.situational_assessment}</p>
                </div>
              )}

              {/* Tone interpretation */}
              {result.tone_interpretation && (
                <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800 border border-blue-200">
                  <p className="font-medium mb-0.5">🎙️ Ressenti détecté</p>
                  <p>{result.tone_interpretation}</p>
                </div>
              )}

              {/* Actions Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {result.short_term_actions?.length > 0 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">⚡ Court terme (48h)</p>
                    <ul className="space-y-1.5">
                      {result.short_term_actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-orange-900">
                          <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-orange-200 text-orange-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.long_term_actions?.length > 0 && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">🎯 Long terme</p>
                    <ul className="space-y-1.5">
                      {result.long_term_actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
                          <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Historical Alignment */}
              {result.historical_alignment && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                  <p className="font-medium text-slate-600 mb-0.5">📈 Par rapport aux analyses précédentes</p>
                  <p>{result.historical_alignment}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}