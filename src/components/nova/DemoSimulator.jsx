import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { detectWorkshopType } from "@/components/nova/workshopDetection";
import { getAntiPatternsByCeremonyType, getPatternSuggestions } from "@/components/nova/antiPatternsByType";

export function DemoSimulator({ onClose, onTriesUpdate }) {
  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [tries, setTries] = useState(2);
  const [loading, setLoading] = useState(true);
  const [detection, setDetection] = useState(null);
  const [forceType, setForceType] = useState(null);
  const [expandedPattern, setExpandedPattern] = useState(null);

  useEffect(() => {
    // Charger le compteur depuis le backend
    const loadTries = async () => {
      try {
        const trackResponse = await base44.functions.invoke('trackDemoAttempt', { checkOnly: true });
        const trackData = trackResponse.data;
        
        if (trackData.blocked) {
          setTries(0);
        } else {
          setTries(trackData.remaining || 0);
        }
      } catch (error) {
        console.error('Failed to load demo tries:', error);
        setTries(2); // Fallback
      }
      setLoading(false);
    };
    loadTries();
  }, []);

  const detectOutOfContext = (text) => {
    // Normaliser le texte: minuscules et retrait des accents
    const normalizeText = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const lowerText = normalizeText(text);
    
    // ========== COUCHE 1: VETOS THÉMATIQUES ABSOLUS ==========
    
    // VETO 1: Domaine du Sport (Explicite - Football, Hockey, Basketball, etc.)
    const sportsProperNouns = [
      // Football/Soccer
      'real madrid', 'barcelone', 'barca', 'psg', 'bayern munich', 
      'cristiano ronaldo', 'lionel messi', 'mbappe', 'clasico',
      'liverpool fc', 'manchester united', 'arsenal fc', 'chelsea fc', 'juventus', 'ac milan',
      // Hockey (équipes NHL communes)
      'canadiens de montreal', 'boston bruins', 'maple leafs', 'penguins', 'blackhawks',
      // Basketball
      'los angeles lakers', 'boston celtics', 'chicago bulls', 'golden state warriors', 'lebron james', 'stephen curry', 'michael jordan'
    ].map(normalizeText);
    
    const sportsLexicon = [
      // Football/Soccer - Termes SPÉCIFIQUES uniquement
      'match de football', 'marquer un but', 'joueur de football', 'gardien de but', 
      'frappe au but', 'terrain de football', 'arbitre de football',
      'penalty football', 'corner', 'coup franc', 'finition football', 
      'ballon rond', 'dribble football', 'tacle', 'sortir le ballon',
      'scorer un but', 'remontada', 'prolongation match', 'carton rouge',
      'carton jaune', 'hors-jeu', 'but egalise', 'but gagnant',
      // Hockey - Termes SPÉCIFIQUES
      'rondelle', 'patinoire', 'arena hockey', 'mise en echec hockey', 
      'desavantage numerique', 'avantage numerique', 'filet desert', 
      'zone offensive hockey', 'zone defensive hockey', 'tir au but hockey',
      'mises en echec',
      // Basketball - Termes SPÉCIFIQUES
      'panier basket', 'dunk', 'trois points basket', 'rebond basket',
      'quart-temps', 'temps mort basket', 'faute personnelle basket',
      // Général sport - Termes TRÈS SPÉCIFIQUES
      'entraineur sportif', 'coach sportif', 'championnat sportif', 'ligue sportive',
      'classement ligue', 'supporter equipe', 'match sportif'
    ].map(normalizeText);
    
    const teamBuildingTerms = [
      'team building', 'evenement d\'entreprise', 'sponsoring', 'partenariat commercial'
    ].map(normalizeText);
    
    let sportsNounsCount = 0;
    let sportsLexiconCount = 0;
    let teamBuildingContext = false;
    const detectedSportsNouns = [];
    const detectedSportsLexicon = [];
    
    sportsProperNouns.forEach(term => { 
      if (lowerText.includes(term)) {
        sportsNounsCount++; 
        detectedSportsNouns.push(term);
      }
    });
    sportsLexicon.forEach(term => { 
      if (lowerText.includes(term)) {
        sportsLexiconCount++; 
        detectedSportsLexicon.push(term);
      }
    });
    teamBuildingTerms.forEach(term => { if (lowerText.includes(term)) teamBuildingContext = true; });
    
    console.log('🔍 VETO 1 Sport Detection:', {
      textLength: text.length,
      sportsNounsFound: sportsNounsCount,
      sportsLexiconFound: sportsLexiconCount,
      teamBuildingContext,
      nounsDetected: detectedSportsNouns,
      lexiconDetected: detectedSportsLexicon.slice(0, 8),
      willTrigger: (sportsNounsCount >= 1 && sportsLexiconCount >= 2 && !teamBuildingContext)
    });
    
    if (sportsNounsCount >= 1 && sportsLexiconCount >= 2 && !teamBuildingContext) {
      console.log('✅ VETO 1 TRIGGERED - Returning #HorsContexte');
      return {
        isOutOfContext: true,
        confidence: 99,
        vetoType: 'VETO 1: Domaine du Sport',
        theme: 'Sport',
        detectedKeywords: [...detectedSportsNouns.slice(0, 3), ...detectedSportsLexicon.slice(0, 4)],
        professionalFieldScore: 0
      };
    }
    
    // VETO 2: Divertissement & Loisirs Purs
    const entertainmentThemes = [
      'film', 'série', 'cinéma', 'acteur', 'actrice', 'réalisateur',
      'netflix', 'disney', 'marvel', 'star wars', 'game of thrones',
      'concert', 'spectacle', 'streaming', 'jeu vidéo', 'gaming'
    ];
    const professionalEntertainmentContext = [
      'projet de développement', 'campagne marketing', 'client', 'produit',
      'développement de jeu', 'production', 'projet film'
    ];
    
    let entertainmentCount = 0;
    let proProdContext = false;
    
    entertainmentThemes.forEach(term => { if (lowerText.includes(term)) entertainmentCount++; });
    professionalEntertainmentContext.forEach(term => { if (lowerText.includes(term)) proProdContext = true; });
    
    if (entertainmentCount >= 2 && !proProdContext) {
      return {
        isOutOfContext: true,
        confidence: 98,
        vetoType: 'VETO 2: Divertissement & Loisirs',
        theme: 'Divertissement',
        detectedKeywords: entertainmentThemes.filter(t => lowerText.includes(t)).slice(0, 4),
        professionalFieldScore: 0
      };
    }
    
    // VETO 3: Vie Personnelle & Sociale
    const personalThemes = [
      'vacances', 'week-end', 'famille', 'enfants', 'anniversaire',
      'restaurant', 'cuisine', 'recette', 'shopping', 'achats',
      'médecin', 'santé personnelle', 'voyage personnel', 'tourisme'
    ];
    const professionalPersonalContext = [
      'déplacement professionnel', 'politique rh', 'télétravail',
      'congé maladie', 'absence justifiée', 'réunion client'
    ];
    
    let personalCount = 0;
    let proPersonalContext = false;
    
    personalThemes.forEach(term => { if (lowerText.includes(term)) personalCount++; });
    professionalPersonalContext.forEach(term => { if (lowerText.includes(term)) proPersonalContext = true; });
    
    if (personalCount >= 2 && !proPersonalContext) {
      return {
        isOutOfContext: true,
        confidence: 97,
        vetoType: 'VETO 3: Vie Personnelle & Sociale',
        theme: 'Vie Personnelle',
        detectedKeywords: personalThemes.filter(t => lowerText.includes(t)).slice(0, 3),
        professionalFieldScore: 0
      };
    }
    
    // ========== COUCHE 2: ANALYSE DU CHAMP SÉMANTIQUE PROFESSIONNEL ==========

    // Champ L1: PROJET & GESTION (Management de Projet/Programme)
    const L1_terms = [
      'projet', 'programme', 'portefeuille', 'mission', 'initiative',
      'livrable', 'jalon', 'delai', 'echeance', 'budget', 'ressource',
      'perimetre', 'scope', 'cahier des charges', 'specification',
      'objectif', 'kpi', 'indicateur', 'suivi', 'reporting', 'roadmap',
      'milestone', 'iteration', 'release', 'increment', 'deliverable',
      'gouvernance', 'pilotage', 'coordination', 'arbitrage', 'priorisation',
      'partie prenante', 'stakeholder', 'sponsor', 'comite de pilotage',
      'risque projet', 'dependance projet', 'contrainte projet',
      'change request', 'scope creep', 'hypothese projet', 'business case'
    ].map(normalizeText);

    // Champ L2: ORGANISATION & ÉQUIPE (Rôles Pro)
    const L2_terms = [
      'product owner', 'scrum master', 'developpeur', 'testeur',
      'po', 'sm', 'dev', 'qa', 'tech lead', 'architect',
      'client projet', 'utilisateur final', 'user', 'product manager',
      'project manager', 'chef de projet', 'responsable produit',
      'manager projet', 'facilitateur', 'coach agile'
    ].map(normalizeText);

    // Champ L3: ACTIVITÉS & PROCESSUS AGILE/SCRUM (Cérémonies & Artéfacts)
    const L3_terms = [
      'daily scrum', 'daily standup', 'stand-up', 'standup',
      'sprint planning', 'planning', 'sprint review', 'revue de sprint',
      'retrospective', 'retro', 'refinement', 'grooming',
      'demo', 'sprint', 'iteration', 'increment', 'ceremony',
      'backlog', 'product backlog', 'sprint backlog',
      'user story', 'story', 'epic', 'feature', 'task', 'subtask',
      'ticket jira', 'ticket', 'issue jira', 'pr', 'pull request',
      'merge', 'commit', 'code review', 'definition of done',
      'acceptance criteria', 'story point', 'velocite', 'burndown',
      'kanban', 'wip', 'limite wip', 'flux', 'lead time', 'cycle time'
    ].map(normalizeText);

    const L3_verbs = [
      'planifier', 'estimer', 'prioriser', 'developper', 'coder',
      'tester', 'debugger', 'corriger', 'deployer', 'livrer',
      'valider', 'accepter', 'implementer', 'concevoir', 'designer',
      'reviewer', 'merger', 'commiter', 'refactoriser',
      'documenter', 'reporter', 'escalader', 'resoudre blocage',
      'analyser besoin', 'specifier', 'faciliter ceremonie',
      'animer atelier', 'piloter projet'
    ].map(normalizeText);

    // Champ L4: PROBLÉMATIQUES PROJET (Issues Techniques)
    const L4_terms = [
      'blocage', 'bloque', 'impediment', 'blocker',
      'risque projet', 'issue technique', 'bug', 'anomalie',
      'incident production', 'dette technique', 'technical debt',
      'dependance technique',
      'retard livraison', 'retard sprint', 'scope change',
      'changement perimetre', 'besoin client', 'feedback client',
      'resolution', 'correctif', 'solution technique', 'workaround',
      'mitigation risque', 'plan d\'action', 'action corrective'
    ].map(normalizeText);
    
    // Compter les occurrences
    let L1_count = 0, L2_count = 0, L3_count = 0, L3_verbs_count = 0, L4_count = 0;
    const detectedL1 = [], detectedL2 = [], detectedL3 = [], detectedL3V = [], detectedL4 = [];
    
    L1_terms.forEach(term => { if (lowerText.includes(term)) { L1_count++; detectedL1.push(term); } });
    L2_terms.forEach(term => { if (lowerText.includes(term)) { L2_count++; detectedL2.push(term); } });
    L3_terms.forEach(term => { if (lowerText.includes(term)) { L3_count++; detectedL3.push(term); } });
    L3_verbs.forEach(term => { if (lowerText.includes(term)) { L3_verbs_count++; detectedL3V.push(term); } });
    L4_terms.forEach(term => { if (lowerText.includes(term)) { L4_count++; detectedL4.push(term); } });
    
    const L1L2_density = L1_count + L2_count;
    const L3L4_density = L3_count + L3_verbs_count + L4_count;
    const totalProScore = L1_count + L2_count + L3_count + L3_verbs_count + L4_count;
    
    console.log('🔍 COUCHE 2 Semantic Analysis:', {
      L1_count, L2_count, L3_count, L3_verbs_count, L4_count,
      totalProScore,
      L1L2_density, L3L4_density,
      detectedL1: detectedL1.slice(0, 3),
      detectedL2: detectedL2.slice(0, 3),
      detectedL3: detectedL3.slice(0, 3),
      detectedL3V: detectedL3V.slice(0, 3),
      detectedL4: detectedL4.slice(0, 3)
    });
    
    // RÈGLE DE DÉCISION SÉMANTIQUE RENFORCÉE (RDS-3)
    // PRINCIPE DE PRÉCAUTION: Le texte doit CLAIREMENT appartenir au domaine du management de projet
    // Pas seulement "quelques mots ambigus", mais une DENSITÉ SIGNIFICATIVE de termes spécifiques

    const fieldsWithTerms = [
      L1_count > 0,
      L2_count > 0,
      L3_count > 0,
      L3_verbs_count > 0,
      L4_count > 0
    ].filter(Boolean).length;

    // EXIGENCES DURCIES:
    // 1. Au moins 3 champs lexicaux différents (pas juste 2)
    // 2. Score pro total minimum de 5 (pas juste 3)
    // 3. OBLIGATOIREMENT: L1 (Projet) OU L3 (Scrum/Agile) avec score >= 2
    //    → Si le texte ne parle ni de "projet/programme/livrable" ni de "sprint/daily/backlog", c'est suspect

    const hasProjectManagementCore = (L1_count >= 2 || L3_count >= 2);

    const hasProfessionalContext = (
      fieldsWithTerms >= 3 &&           // Au moins 3 champs lexicaux différents (DURCI)
      totalProScore >= 5 &&              // Au moins 5 termes pro au total (DURCI)
      hasProjectManagementCore &&        // OBLIGATOIRE: noyau projet/agile (NOUVEAU)
      (L1L2_density >= 2 || L3L4_density >= 3)  // Densité minimale (DURCI)
    );
    
    console.log('📊 Professional Context Check (RDS-3):', {
      fieldsWithTerms,
      totalProScore,
      hasProjectManagementCore,
      L1L2_density,
      L3L4_density,
      hasProfessionalContext
    });

    if (!hasProfessionalContext) {
      console.log('❌ COUCHE 2 TRIGGERED - Insufficient professional PM/Agile context');

      // Diagnostic précis de la raison du rejet
      let rejectionReason = 'COUCHE 2: Lexique Management de Projet/Agile insuffisant';
      if (!hasProjectManagementCore) {
        rejectionReason = 'COUCHE 2: Absence de noyau Projet/Agile (pas de sprint/daily/backlog/livrable/objectif projet)';
      } else if (fieldsWithTerms < 3) {
        rejectionReason = 'COUCHE 2: Trop peu de champs lexicaux couverts (< 3)';
      } else if (totalProScore < 5) {
        rejectionReason = 'COUCHE 2: Densité terminologique trop faible (< 5 termes)';
      }

      // PRINCIPE DE PRÉCAUTION RENFORCÉ: En l'absence de preuve forte -> #HorsContexte
      return {
        isOutOfContext: true,
        confidence: totalProScore === 0 ? 98 : Math.max(85, 95 - totalProScore * 2),
        vetoType: rejectionReason,
        theme: 'Conversation Générale / Hors Périmètre PM',
        detectedKeywords: [...detectedL1.slice(0, 2), ...detectedL2.slice(0, 2), ...detectedL3.slice(0, 2)],
        professionalFieldScore: totalProScore,
        L1_count, L2_count, L3_count, L3_verbs_count, L4_count
      };
    }
    
    console.log('✅ COUCHE 2 PASSED - Professional context validated');
    // PASSER: Le texte a un contexte professionnel suffisant
    return { 
      isOutOfContext: false,
      professionalFieldScore: totalProScore
    };
  };

  const handleAnalyze = async () => {
    if (!input.trim()) {
      toast.error("Remplissez le champ de texte");
      return;
    }

    if (tries <= 0) {
      toast.error("❌ Limite de démo atteinte. Choisissez un plan pour continuer.");
      onClose();
      return;
    }

    setAnalyzing(true);
    try {
      console.log('🚀 Starting analysis for text:', input.substring(0, 100) + '...');

      // ÉTAPE 0: Vérifier et décrémenter les essais via backend (IP-based)
      const trackResponse = await base44.functions.invoke('trackDemoAttempt', { checkOnly: false });
      const trackData = trackResponse.data;

      if (!trackData.allowed || trackData.blocked) {
        toast.error(`❌ ${trackData.message}`);
        setAnalyzing(false);
        onClose();
        return;
      }

      // Synchroniser le compteur local avec le serveur
      setTries(trackData.remaining);
      onTriesUpdate(trackData.remaining);

      // ÉTAPE 1: Vérifier si le contenu est hors contexte (VETO)
      const outOfContextCheck = detectOutOfContext(input);

      console.log('📊 Out of context check result:', outOfContextCheck);

      if (outOfContextCheck.isOutOfContext) {
        console.log('🚫 Content detected as OUT OF CONTEXT - Skipping workshop detection');
        // Les essais ont déjà été décrémentés par trackDemoAttempt côté serveur

        // Reset detection (important pour éviter confusion UI)
        setDetection(null);

        // Simuler délai d'analyse
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

        setResults({
          isOutOfContext: true,
          confidence: outOfContextCheck.confidence,
          vetoType: outOfContextCheck.vetoType,
          theme: outOfContextCheck.theme,
          detectedKeywords: outOfContextCheck.detectedKeywords,
          professionalFieldScore: outOfContextCheck.professionalFieldScore,
          L1_count: outOfContextCheck.L1_count,
          L2_count: outOfContextCheck.L2_count,
          L3_count: outOfContextCheck.L3_count,
          L3_verbs_count: outOfContextCheck.L3_verbs_count,
          L4_count: outOfContextCheck.L4_count
        });

        setAnalyzing(false);
        return;
      }

      console.log('✅ Content passed out-of-context check, proceeding with workshop detection');

      // ÉTAPE 2: Détection sémantique du type d'atelier (seulement si contexte pro validé)
      const detected = detectWorkshopType(input);
      setDetection(detected);

      // Simuler délai d'analyse (1-2 secondes)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Déterminer le type de réunion (simulé ou forcé)
      const meetingType = forceType || detected.type;

      // Récupérer anti-patterns spécifiques au type d'atelier
      const ceremonyPatterns = getAntiPatternsByCeremonyType(meetingType);
      const selectedPatterns = ceremonyPatterns.patterns.slice(0, 2 + Math.floor(Math.random() * 2));

      // Résultats simulés
      setResults({
        meetingType,
        patterns: selectedPatterns,
        recommendations: selectedPatterns.flatMap(p => p.suggestions.slice(0, 2)),
        confidence: 75 + Math.floor(Math.random() * 20),
        analysisNote: "Ces résultats sont simulés pour la démonstration",
        detectionConfidence: detected.confidence,
        detectionJustifications: detected.justifications,
        detectionTags: detected.tags
      });

      // Les essais ont déjà été décrémentés par trackDemoAttempt côté serveur
      toast.success("✅ Analyse complète!");
    } catch (error) {
      toast.error("❌ Erreur lors de l'analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎮 Simulateur d'Analyse Nova</DialogTitle>
          <DialogDescription>
            Mode démo • {tries} essai{tries > 1 ? 's' : ''} restant{tries > 1 ? 's' : ''} ({tries}/2 par 24h)
          </DialogDescription>
        </DialogHeader>

        {tries === 0 && !results ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Limite de démo atteinte</p>
                <p className="text-sm text-red-700 mt-1">Vous avez utilisé vos 2 essais de démo. Choisissez un plan pour continuer.</p>
              </div>
            </div>
            <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Voir les Plans Tarifaires
            </Button>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* Out of Context Result */}
            {results.isOutOfContext ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-bold text-slate-900 mb-1">#HorsContexte</p>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm text-slate-600">Confiance:</span>
                        <div className="flex-1 h-2.5 bg-red-200 rounded-full overflow-hidden max-w-xs">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-red-600" 
                            style={{ width: `${results.confidence}%` }} 
                          />
                        </div>
                        <span className="text-sm font-bold text-red-600">{results.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Details */}
                <Card className="border-slate-200">
                  <CardContent className="p-6 space-y-5">
                    {/* Raison Principale */}
                    <div className="pb-4 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Raison Principale</p>
                      <p className="text-sm font-medium text-slate-900">{results.vetoType}</p>
                    </div>

                    {/* Analyse Lexicale */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Analyse Lexicale</p>
                      <div className="space-y-3 text-sm">
                        <div className="flex gap-2">
                          <span className="text-slate-600 font-medium min-w-[140px]">Thème identifié :</span>
                          <span className="text-red-700 font-semibold">{results.theme}</span>
                        </div>
                        
                        {results.detectedKeywords && results.detectedKeywords.length > 0 && (
                          <div className="flex gap-2">
                            <span className="text-slate-600 font-medium min-w-[140px]">Termes-clés :</span>
                            <div className="flex flex-wrap gap-1.5">
                              {results.detectedKeywords.map((kw, idx) => (
                                <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <span className="text-slate-600 font-medium min-w-[140px]">Champ sémantique pro :</span>
                          <span className="text-slate-900">
                            {results.professionalFieldScore === 0 ? 'Absent' : `Trop faible (score: ${results.professionalFieldScore})`}
                          </span>
                        </div>
                        
                        {results.professionalFieldScore === 0 && (
                          <div className="mt-2 pl-[148px]">
                            <p className="text-xs text-slate-600 italic">
                              • Absence des marqueurs attendus (ex: projet, équipe, tâche, réunion, livrable, décision...).
                            </p>
                          </div>
                        )}

                        {/* Détails des champs lexicaux si disponibles */}
                        {(results.L1_count !== undefined) && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-2">Détection par champ lexical :</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-600">L1 (Projet & Gestion):</span>
                                <span className="font-medium">{results.L1_count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">L2 (Organisation):</span>
                                <span className="font-medium">{results.L2_count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">L3 (Activités):</span>
                                <span className="font-medium">{results.L3_count + results.L3_verbs_count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">L4 (Problématiques):</span>
                                <span className="font-medium">{results.L4_count}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notre Périmètre */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="font-semibold text-slate-900 mb-2">🎯 Notre Périmètre</p>
                      <p className="text-sm text-slate-700 mb-4">
                        Nova analyse spécifiquement les <strong>conversations de travail d'équipe et de gestion de projet</strong>.
                      </p>
                      
                      <p className="text-sm font-medium text-slate-900 mb-2">Exemples de textes adaptés :</p>
                      <div className="space-y-2">
                        <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-700 font-mono border border-blue-200">
                          "Daily : Hier j'ai corrigé le bug #123, aujourd'hui je travaille sur l'API de paiement."
                        </div>
                        <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-700 font-mono border border-blue-200">
                          "Revue de sprint : La feature 'login' est terminée, mais le 'checkout' a un retard d'un jour."
                        </div>
                        <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-700 font-mono border border-blue-200">
                          "Atelier risques : Risque identifié sur le fournisseur Cloud, plan d'action assigné à Marie."
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 italic text-center pt-2">
                      Merci de rester sérieux et professionnel 🙂
                    </p>
                  </CardContent>
                </Card>

                {/* CTA */}
                {tries === 0 ? (
                  <Button 
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        const pricingSection = document.getElementById('pricing-section');
                        if (pricingSection) {
                          pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Voir les Plans Tarifaires
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setInput("");
                        setResults(null);
                      }}
                      className="flex-1"
                    >
                      Nouvelle Analyse
                    </Button>
                    <Button 
                      onClick={onClose}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Fermer
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Analyse Complète ✅</p>
                      <p className="text-sm text-slate-600 mt-1">Atelier détecté: <strong>{results.meetingType}</strong></p>
                      {results.detectionConfidence && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-slate-600">Confiance de détection:</span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-600" 
                              style={{ width: `${results.detectionConfidence}%` }} 
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{results.detectionConfidence}%</span>
                        </div>
                      )}
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">🎮 SIMULÉ</Badge>
                  </div>
                </div>

            {/* Confidence */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Confiance de l'analyse</p>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${results.confidence}%` }} />
              </div>
              <p className="text-xs text-slate-600 mt-1">{results.confidence}%</p>
            </div>

            {/* Patterns Detected */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Anti-patterns Détectés pour <span className="text-blue-600">{results.meetingType}</span></p>
              <div className="space-y-2">
                {results.patterns.map((pattern, idx) => (
                  <Card key={idx} className={`border-slate-200 cursor-pointer hover:shadow-md transition-all ${expandedPattern === idx ? 'ring-2 ring-blue-400' : ''}`}>
                    <button
                      onClick={() => setExpandedPattern(expandedPattern === idx ? null : idx)}
                      className="w-full text-left"
                    >
                      <CardContent className="p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{pattern.name}</p>
                          <p className="text-sm text-slate-600">{pattern.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`ml-2 ${
                            pattern.severity === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pattern.severity === 'high' ? '🔴' : '🟡'} {pattern.severity}
                          </Badge>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedPattern === idx ? 'rotate-180' : ''}`} />
                        </div>
                      </CardContent>
                    </button>
                    
                    {expandedPattern === idx && (
                      <div className="border-t border-slate-200 px-3 py-3 bg-blue-50">
                        <p className="text-xs font-semibold text-slate-900 mb-2">💡 Suggestions d'amélioration :</p>
                        <ul className="space-y-1.5">
                          {pattern.suggestions.map((suggestion, sidx) => (
                            <li key={sidx} className="flex gap-2 text-xs text-slate-700">
                              <span className="text-blue-600 font-bold">✓</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Recommandations</p>
              <ul className="space-y-2">
                {results.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detection Tags */}
            {results.detectionTags && results.detectionTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {results.detectionTags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Analysis Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> {results.analysisNote}
              </p>
            </div>

            {/* CTA */}
            {tries === 0 ? (
              <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
                Voir les Plans Tarifaires
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setInput("");
                    setResults(null);
                  }}
                  className="flex-1"
                >
                  Nouvelle Analyse
                </Button>
                <Button 
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      const pricingSection = document.getElementById('pricing-section');
                      if (pricingSection) {
                        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Voir les Plans Tarifaires
                </Button>
              </div>
            )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-900 block mb-2">
                Collez un transcript de daily standup ou un autre type d'atelier
              </label>
              <Textarea
                value={input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setInput(newValue);
                  // Seulement détecter le type d'atelier si le contenu est professionnel
                  if (newValue.trim().length > 20) {
                    const outOfContextCheck = detectOutOfContext(newValue);
                    if (!outOfContextCheck.isOutOfContext) {
                      const result = detectWorkshopType(newValue);
                      setDetection(result);
                    } else {
                      setDetection(null);
                    }
                  } else {
                    setDetection(null);
                  }
                }}
                onKeyDown={(e) => {
                  // Bloquer toute saisie clavier sauf Ctrl+V / Cmd+V et touches Effacer
                  const allowedKeys = ['Tab', 'Escape', 'Enter', 'Backspace', 'Delete'];
                  const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';

                  if (!isPaste && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="Collez uniquement (Ctrl+V ou Cmd+V) - Saisie clavier désactivée"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 L'expertise en un clic ! Collez votre transcript d'atelier et laissez la magie s'operer.
              </p>

              {/* Detection preview */}
              {input.trim().length > 20 && !analyzing && (() => {
                const outOfContextCheck = detectOutOfContext(input);

                if (outOfContextCheck.isOutOfContext) {
                  return (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">#HorsContexte détecté</p>
                          <p className="text-xs text-red-700 mt-1">
                            {outOfContextCheck.vetoType} • Thème: <strong>{outOfContextCheck.theme}</strong>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden max-w-xs">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-red-600" 
                                style={{ width: `${outOfContextCheck.confidence}%` }} 
                              />
                            </div>
                            <span className="text-xs font-medium text-red-600">{outOfContextCheck.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-red-700 italic">
                        ⚠️ Veuillez coller uniquement une conversation professionnelle en contexte de gestion de projets agile ou autres ( Scrum, Kanban, SAFe, Disciplined Agile, etc.)
                      </p>
                    </div>
                  );
                }

                // Si contexte professionnel validé, montrer la détection d'atelier
                if (detection) {
                  return (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Atelier détecté: <span className="text-blue-600">{detection.type}</span>
                            {detection.subtype && <span className="text-blue-500"> {detection.subtype}</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden max-w-xs">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600" 
                                style={{ width: `${detection.confidence}%` }} 
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{detection.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-600 font-medium mb-1">Raisons de la détection:</p>
                        <ul className="text-xs text-slate-600 space-y-0.5">
                          {detection.justifications.map((just, idx) => (
                            <li key={idx}>• {just}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {detection.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs bg-white">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {detection.confidence < 70 && (
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                          ⚠️ Confiance faible - Vous pouvez forcer le type d'atelier ci-dessous
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-600 font-medium">Ou choisissez:</label>
                        <select 
                          value={forceType || ''}
                          onChange={(e) => setForceType(e.target.value || null)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="">Auto-détecté</option>
                          <option value="Daily Scrum">Daily Scrum</option>
                          <option value="Sprint Planning">Sprint Planning</option>
                          <option value="Sprint Review">Sprint Review</option>
                          <option value="Retrospective">Retrospective</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {tries === 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Dernier essai de démo!</strong> Après celui-ci, vous devrez choisir un plan.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={analyzing}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={analyzing || !input.trim() || (input.trim().length > 20 && detectOutOfContext(input).isOutOfContext)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>Analyser Maintenant</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}