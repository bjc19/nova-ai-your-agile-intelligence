import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function ContextLabelInput({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load existing labels from history
  useEffect(() => {
    const load = async () => {
      try {
        const analyses = await base44.entities.AnalysisHistory.list('-created_date', 100);
        const labels = [...new Set(
          analyses.map(a => a.context_label).filter(l => l && l.trim())
        )];
        setAllLabels(labels);
        // Generate smart AI suggestions based on patterns
        generateAiSuggestions(analyses);
      } catch (e) { /* silent */ }
    };
    load();
  }, []);

  const generateAiSuggestions = (analyses) => {
    // Extract smart suggestions from patterns in titles and context_labels
    const sprints = analyses
      .map(a => a.context_label || a.title || "")
      .filter(Boolean)
      .join(" ");

    // Detect sprint numbers
    const sprintMatch = sprints.match(/sprint\s*(\d+)/gi) || [];
    const lastSprint = sprintMatch.length > 0
      ? parseInt(sprintMatch[0].replace(/sprint\s*/i, "")) + 1
      : null;

    // Detect project names from context labels
    const projectNames = [...new Set(
      analyses
        .map(a => a.context_label)
        .filter(Boolean)
        .map(l => l.split(/[-–,|]/)[0].trim())
        .filter(l => l.length > 2)
    )].slice(0, 3);

    const smart = [];
    if (lastSprint) smart.push(`Sprint ${lastSprint}`);
    projectNames.forEach(p => {
      if (lastSprint) smart.push(`${p} – Sprint ${lastSprint}`);
    });
    smart.push("Rétrospective", "Daily Scrum", "Sprint Review", "Backlog Refinement");

    setAiSuggestions([...new Set(smart)].slice(0, 6));
  };

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions(allLabels.slice(0, 5));
    } else {
      const filtered = allLabels.filter(l =>
        l.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    }
  }, [value, allLabels]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (label) => {
    onChange(label);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const allSuggestions = value.trim()
    ? suggestions
    : [...new Set([...suggestions, ...aiSuggestions])].slice(0, 8);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-1.5">
        <Tag className="w-3.5 h-3.5 text-slate-500" />
        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          Contexte de l'analyse
        </label>
        <span className="text-xs text-slate-400">(Projet, Sprint, Sujet...)</span>
        <Badge variant="outline" className="text-xs border-amber-200 text-amber-600 bg-amber-50 ml-auto">
          Recommandé
        </Badge>
      </div>

      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || "Ex : Projet Alpha – Sprint 3, Rétrospective Q1..."}
          className="text-sm border-slate-200 focus:border-blue-400 pr-8"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && allSuggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {allLabels.length > 0 && suggestions.length > 0 && (
              <div className="px-3 pt-2 pb-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Utilisés récemment
                </p>
              </div>
            )}
            {suggestions.map((label) => (
              <button
                key={label}
                onMouseDown={() => handleSelect(label)}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                {label}
              </button>
            ))}

            {aiSuggestions.filter(s => !allLabels.includes(s)).length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" /> Suggestions Nova
                  </p>
                </div>
                {aiSuggestions
                  .filter(s => !allLabels.includes(s) && (!value || s.toLowerCase().includes(value.toLowerCase())))
                  .map((label) => (
                    <button
                      key={label}
                      onMouseDown={() => handleSelect(label)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                      {label}
                    </button>
                  ))
                }
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!value.trim() && (
        <p className="text-xs text-slate-400 mt-1">
          💡 Un contexte rend les analyses comparables dans le temps et améliore le filtrage.
        </p>
      )}
    </div>
  );
}