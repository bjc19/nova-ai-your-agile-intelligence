import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Synchronise les anti-patterns depuis le Gist GitHub
 * URL: https://gist.github.com/bjc19/765ffdcc3c067b0cb1333a72a3d99476
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const GIST_URL = "https://gist.githubusercontent.com/bjc19/765ffdcc3c067b0cb1333a72a3d99476/raw";
  
  try {
    // Récupérer le paramètre force depuis le body ou query
    const url = new URL(req.url);
    const forceParam = url.searchParams.get('force') === 'true';
    
    // 1. Récupérer les métadonnées de sync existantes
    const syncMeta = await base44.asServiceRole.entities.SyncMetadata.filter({
      source: "gist_antipatterns"
    });
    
    const currentMeta = syncMeta.length > 0 ? syncMeta[0] : null;
    
    // 2. Vérifier si une sync annuelle est nécessaire
    const now = new Date();
    if (currentMeta?.last_sync_date) {
      const lastSync = new Date(currentMeta.last_sync_date);
      const daysSinceSync = Math.floor((now - lastSync) / (1000 * 60 * 60 * 24));
      
      // Si < 365 jours (± 7 jours), pas de sync sauf si forcée
      if (daysSinceSync < 358 && !forceParam) {
        return Response.json({
          status: "skipped",
          message: `Dernière sync il y a ${daysSinceSync} jours. Prochaine sync dans ${365 - daysSinceSync} jours.`,
          patterns_count: currentMeta.patterns_count
        });
      }
    }
    
    // 3. Marquer la sync comme "in_progress"
    if (currentMeta) {
      await base44.asServiceRole.entities.SyncMetadata.update(currentMeta.id, {
        sync_status: "in_progress"
      });
    } else {
      await base44.asServiceRole.entities.SyncMetadata.create({
        source: "gist_antipatterns",
        sync_status: "in_progress"
      });
    }
    
    // 4. Récupérer le contenu du Gist
    const response = await fetch(GIST_URL);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const gistContent = await response.text();
    const checksum = hashContent(gistContent);
    
    // 5. Vérifier si le contenu a changé
    if (currentMeta?.checksum === checksum) {
      await base44.asServiceRole.entities.SyncMetadata.update(currentMeta.id, {
        sync_status: "success",
        last_sync_date: now.toISOString(),
        next_sync_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        sync_log: [
          ...(currentMeta.sync_log || []),
          {
            date: now.toISOString(),
            status: "no_changes",
            message: "Aucune modification détectée dans le Gist",
            patterns_synced: currentMeta.patterns_count
          }
        ]
      });
      
      return Response.json({
        status: "no_changes",
        message: "Aucune modification détectée. Référentiel à jour.",
        patterns_count: currentMeta.patterns_count
      });
    }
    
    // 6. Parser le contenu du Gist et extraire les patterns
    const patterns = parseGistContent(gistContent);
    
    // 7. Nettoyer les anciens patterns et insérer les nouveaux
    const existingPatterns = await base44.asServiceRole.entities.AntiPattern.list();
    
    // Supprimer les anciens patterns
    for (const pattern of existingPatterns) {
      await base44.asServiceRole.entities.AntiPattern.delete(pattern.id);
    }
    
    // Créer les nouveaux patterns
    await base44.asServiceRole.entities.AntiPattern.bulkCreate(patterns);
    
    // 8. Mettre à jour les métadonnées de sync
    const metaToUpdate = currentMeta || (await base44.asServiceRole.entities.SyncMetadata.filter({
      source: "gist_antipatterns"
    }))[0];
    
    await base44.asServiceRole.entities.SyncMetadata.update(metaToUpdate.id, {
      sync_status: "success",
      last_sync_date: now.toISOString(),
      next_sync_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      patterns_count: patterns.length,
      checksum: checksum,
      sync_log: [
        ...(metaToUpdate.sync_log || []),
        {
          date: now.toISOString(),
          status: "success",
          message: "Synchronisation réussie",
          patterns_synced: patterns.length
        }
      ]
    });
    
    return Response.json({
      status: "success",
      message: `${patterns.length} anti-patterns synchronisés avec succès`,
      patterns_count: patterns.length,
      patterns_by_category: getCategoryCounts(patterns)
    });
    
  } catch (error) {
    // Enregistrer l'erreur
    const syncMeta = await base44.asServiceRole.entities.SyncMetadata.filter({
      source: "gist_antipatterns"
    });
    
    if (syncMeta.length > 0) {
      await base44.asServiceRole.entities.SyncMetadata.update(syncMeta[0].id, {
        sync_status: "failed",
        error_message: error.message,
        sync_log: [
          ...(syncMeta[0].sync_log || []),
          {
            date: new Date().toISOString(),
            status: "failed",
            message: error.message,
            patterns_synced: 0
          }
        ]
      });
    }
    
    return Response.json({
      status: "error",
      message: `Erreur lors de la synchronisation: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
});

/**
 * Parse le contenu du Gist et extrait les anti-patterns
 */
function parseGistContent(content) {
  const patterns = [];
  
  const lines = content.split('\n');
  let currentCategory = null;
  let currentCategoryName = null;
  let currentPattern = null;
  let patternCounter = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détecter une nouvelle catégorie
    const categoryMatch = line.match(/##\s*Catégorie\s+([A-K])\s*[:-]\s*(.+?)$/i);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].toUpperCase();
      currentCategoryName = categoryMatch[2].trim();
      patternCounter[currentCategory] = patternCounter[currentCategory] || 0;
      continue;
    }
    
    // Détecter un nouveau pattern
    const patternMatch = line.match(/###\s*(.+?)$/);
    if (patternMatch && currentCategory) {
      // Sauvegarder le pattern précédent
      if (currentPattern) {
        patterns.push(currentPattern);
      }
      
      patternCounter[currentCategory]++;
      
      // Créer un nouveau pattern
      currentPattern = {
        pattern_id: `${currentCategory}${patternCounter[currentCategory]}`,
        category: currentCategory,
        category_name: currentCategoryName,
        name: patternMatch[1].trim(),
        description: "",
        markers: [],
        impact: "",
        recommended_actions: [],
        quick_win: "",
        metrics: [],
        severity: "medium",
        source_type: ["transcript"],
        ceremony_type: ["daily_scrum", "retrospective", "sprint_planning", "sprint_review"],
        is_active: true,
        priority_weight: 50
      };
      continue;
    }
    
    // Extraire les informations du pattern
    if (currentPattern && line) {
      if (line.startsWith('**Description:**') || line.startsWith('Description:')) {
        currentPattern.description = line.replace(/\*\*Description:\*\*|Description:/i, '').trim();
      } else if (line.startsWith('**Marqueurs:**') || line.startsWith('Marqueurs:')) {
        let markerText = line.replace(/\*\*Marqueurs:\*\*|Marqueurs:/i, '').trim();
        if (markerText) {
          currentPattern.markers.push(markerText);
        }
      } else if (line.startsWith('**Impact:**') || line.startsWith('Impact:')) {
        currentPattern.impact = line.replace(/\*\*Impact:\*\*|Impact:/i, '').trim();
      } else if (line.startsWith('**Actions:**') || line.startsWith('Actions recommandées:')) {
        let actionText = line.replace(/\*\*Actions:\*\*|Actions recommandées:/i, '').trim();
        if (actionText) {
          currentPattern.recommended_actions.push(actionText);
        }
      } else if (line.startsWith('**Quick win:**') || line.startsWith('Quick win:')) {
        currentPattern.quick_win = line.replace(/\*\*Quick win:\*\*|Quick win:/i, '').trim();
      } else if (line.startsWith('-') || line.startsWith('•')) {
        const bulletText = line.replace(/^[-•]\s*/, '').trim();
        if (bulletText && currentPattern.markers.length < 5) {
          currentPattern.markers.push(bulletText);
        } else if (bulletText) {
          currentPattern.recommended_actions.push(bulletText);
        }
      }
    }
  }
  
  // Ajouter le dernier pattern
  if (currentPattern) {
    patterns.push(currentPattern);
  }
  
  // Si le parsing n'a pas fonctionné, créer des patterns d'exemple
  if (patterns.length === 0) {
    patterns.push(...getDefaultPatterns());
  }
  
  return patterns;
}

/**
 * Patterns par défaut si le Gist ne peut pas être parsé
 */
function getDefaultPatterns() {
  return [
    {
      pattern_id: "C1",
      category: "C",
      category_name: "Cérémonies",
      name: "Daily marathon",
      description: "Daily Scrum qui dépasse régulièrement 15 minutes",
      markers: ["Durée > 20 minutes", "Discussions techniques prolongées", "Tour de table passif"],
      impact: "Perte de productivité, fatigue de l'équipe, réunions perçues comme inutiles",
      recommended_actions: ["Timebox strict de 15 minutes avec timer visible", "Reporter les discussions techniques après le Daily", "Format stand-up physique pour dynamiser"],
      quick_win: "Mettre un timer de 15 minutes visible par tous dès le prochain Daily",
      metrics: [
        { name: "Durée moyenne du Daily", threshold: "15", unit: "minutes" },
        { name: "Taux de respect du timebox", threshold: "80", unit: "%" }
      ],
      severity: "high",
      source_type: ["transcript", "teams", "zoom"],
      ceremony_type: ["daily_scrum"],
      is_active: true,
      priority_weight: 85
    },
    {
      pattern_id: "A6",
      category: "A",
      category_name: "Culture & Leadership",
      name: "Command & control déguisé",
      description: "Manager qui demande des rapports individuels et assigne des tâches pendant le Daily",
      markers: ["Manager demande 'rapportez-moi votre avancement'", "> 3 assignations directes par le manager", "Équipe regarde le manager au lieu de se parler"],
      impact: "Perte d'autonomie, dépendance hiérarchique, équipe passive",
      recommended_actions: ["Manager en mode observateur uniquement", "Scrum Master rappelle le cadre du Daily", "Équipe s'adresse aux pairs, pas au manager"],
      quick_win: "Manager communique dès demain qu'il ne parlera plus pendant les Dailys sauf exception",
      metrics: [
        { name: "Interventions du manager", threshold: "2", unit: "par Daily" },
        { name: "Autonomie de l'équipe", threshold: "80", unit: "score sur 100" }
      ],
      severity: "critical",
      source_type: ["transcript", "teams", "zoom"],
      ceremony_type: ["daily_scrum"],
      is_active: true,
      priority_weight: 95
    },
    {
      pattern_id: "K5",
      category: "K",
      category_name: "Biais & Dynamiques Humaines",
      name: "Bikeshedding",
      description: "Débat disproportionné sur des détails triviaux vs temps minimal sur sujets critiques",
      markers: ["Débat > 15 min sur détail trivial", "< 5 min sur sujet critique", "Ratio temps débat > 3:1"],
      impact: "Perte de temps sur l'accessoire, vrais problèmes non traités, frustration",
      recommended_actions: ["Timeboxer les discussions de détails", "Prioriser explicitement les sujets critiques", "Parking lot pour les détails"],
      quick_win: "Créer un 'parking lot' visuel dès la prochaine réunion pour capturer les détails",
      metrics: [
        { name: "Temps sur détails vs critiques", threshold: "1", unit: "ratio max" },
        { name: "Sujets critiques traités", threshold: "90", unit: "%" }
      ],
      severity: "medium",
      source_type: ["transcript", "teams", "zoom"],
      ceremony_type: ["sprint_planning", "retrospective", "backlog_refinement"],
      is_active: true,
      priority_weight: 70
    }
  ];
}

/**
 * Génère un hash simple du contenu pour détecter les changements
 */
function hashContent(content) {
  const sample = content.substring(0, 1000) + content.substring(content.length - 1000);
  return `${content.length}-${sample.length}`;
}

/**
 * Compte les patterns par catégorie
 */
function getCategoryCounts(patterns) {
  const counts = {};
  patterns.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return counts;
}