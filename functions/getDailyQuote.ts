import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Map signals to quote categories
const signalToCategory = {
  "lancement lent": "strategy",
  "manque de discovery client": "product",
  "validation utilisateur": "product",
  "priorisation chaotique": "strategy",
  "trop de features": "strategy",
  "manque de focus client": "product",
  "besoin de persévérance": "mindset",
  "qualité code": "craft",
  "problème de priorisation": "strategy",
  "incident": "mindset",
  "dette technique": "craft",
  "première utilisation": "mindset"
};

const categoryRanges = {
  product: { min: 111, max: 180 },
  strategy: { min: 181, max: 230 },
  mindset: { min: 1, max: 50 },
  craft: { min: 51, max: 110 },
  leadership: { min: 231, max: 280 },
  default: { min: 1, max: 365 }
};

// Fetch quotes from Gist
const fetchQuotesFromGist = async () => {
  try {
    const response = await fetch('https://gist.githubusercontent.com/bjc19/c47d3e80da18d42a7c8c3d3f7b69ac49/raw/');
    const text = await response.text();
    
    // Parse CSV/text format (adjust based on actual format)
    const lines = text.split('\n').filter(line => line.trim());
    const quotes = [];
    
    lines.forEach((line, idx) => {
      if (line.trim() && !line.startsWith('#')) {
        // Format: "number. text — author" or similar
        const parts = line.split(' — ');
        if (parts.length >= 2) {
          const textPart = parts[0].trim();
          const author = parts[1]?.trim() || 'Unknown';
          
          // Extract number if exists
          const numberMatch = textPart.match(/^(\d+)\.\s*(.*)/);
          if (numberMatch) {
            quotes.push({
              number: parseInt(numberMatch[1]),
              text: numberMatch[2],
              author: author
            });
          } else {
            quotes.push({
              number: idx + 1,
              text: textPart,
              author: author
            });
          }
        }
      }
    });
    
    return quotes;
  } catch (error) {
    console.error('Error fetching Gist:', error);
    return [];
  }
};

// Get last strong signal from analyses
const getLastStrongSignal = async (base44) => {
  try {
    // Fetch recent analyses and GDPR markers
    const analyses = await base44.entities.AnalysisHistory.list('-created_date', 5);
    const markers = await base44.entities.GDPRMarkers.list('-created_date', 10);
    
    // Extract signals from analyses
    let signal = null;
    
    // Check for blockers/risks patterns
    for (const analysis of analyses) {
      const blockers = analysis.analysis_data?.blockers || [];
      const risks = analysis.analysis_data?.risks || [];
      
      if (blockers.length > 0) {
        const firstBlocker = blockers[0];
        if (firstBlocker.issue?.toLowerCase().includes('discovery')) signal = "manque de discovery client";
        if (firstBlocker.issue?.toLowerCase().includes('priorit')) signal = "priorisation chaotique";
        if (firstBlocker.issue?.toLowerCase().includes('qualité')) signal = "qualité code";
      }
      
      if (risks.length > 0 && !signal) {
        const firstRisk = risks[0];
        if (firstRisk.description?.toLowerCase().includes('lent')) signal = "lancement lent";
        if (firstRisk.description?.toLowerCase().includes('client')) signal = "manque de focus client";
      }
    }
    
    // Check GDPR markers for additional signals
    if (markers.length > 0 && !signal) {
      const firstMarker = markers[0];
      if (firstMarker.probleme?.toLowerCase().includes('découverte')) signal = "manque de discovery client";
      if (firstMarker.probleme?.toLowerCase().includes('priorit')) signal = "priorisation chaotique";
    }
    
    return signal || "première utilisation";
  } catch (error) {
    console.error('Error getting last signal:', error);
    return "première utilisation";
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Check today's quote in session/local storage
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `daily_quote_${today}`;
    
    // Fetch all quotes
    const quotes = await fetchQuotesFromGist();
    if (quotes.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Could not load quotes',
        quote: {
          number: 1,
          text: "Start before you're ready.",
          author: "Unknown"
        },
        signal: "première utilisation"
      }), { status: 200 });
    }
    
    // Get last strong signal
    const signal = await getLastStrongSignal(base44);
    
    // Determine category from signal
    const category = signalToCategory[signal] || "default";
    const range = categoryRanges[category];
    
    // Filter quotes by category
    const categoryQuotes = quotes.filter(q => 
      q.number >= range.min && q.number <= range.max
    );
    
    // Select quote: use deterministic hash based on date to ensure same quote all day
    const dateHash = today.split('-').reduce((acc, part) => acc + parseInt(part), 0);
    const quoteIndex = dateHash % Math.max(1, categoryQuotes.length);
    const selectedQuote = categoryQuotes[quoteIndex] || quotes[dateHash % quotes.length];
    
    return new Response(JSON.stringify({
      quote: selectedQuote,
      signal: signal,
      date: today,
      category: category
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in getDailyQuote:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      quote: {
        number: 1,
        text: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb"
      },
      signal: "première utilisation"
    }), { status: 200 });
  }
});