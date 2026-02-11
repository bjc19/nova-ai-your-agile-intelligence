import { base44 } from "@/api/base44Client";

export async function invokeLLMWithAutoTranslate(prompt, responseSchema, language) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: responseSchema
  });

  // Auto-translate if language is French
  if (language === 'fr' && typeof result === 'string') {
    const translationPrompt = `Traduis le texte suivant en français de manière concise et claire.

RÈGLE ABSOLUE D'ANONYMISATION : Si le texte contient des noms au format anonymisé (première lettre + astérisques + dernière lettre, exemple: A*****e, I**s, S****l), tu DOIS les conserver EXACTEMENT tels quels. NE JAMAIS les dé-anonymiser ou les remplacer par des noms complets.

Texte:\n\n${result}`;
    const translated = await base44.integrations.Core.InvokeLLM({
      prompt: translationPrompt
    });
    return translated;
  }

  // For objects, translate text fields
  if (language === 'fr' && typeof result === 'object') {
    const translateObject = async (obj) => {
      const translated = { ...obj };
      
      for (const [key, value] of Object.entries(translated)) {
        if (typeof value === 'string' && value.length > 20) {
          const translationPrompt = `Traduis le texte suivant en français de manière concise et claire.

RÈGLE ABSOLUE D'ANONYMISATION : Si le texte contient des noms au format anonymisé (première lettre + astérisques + dernière lettre, exemple: A*****e, I**s, S****l), tu DOIS les conserver EXACTEMENT tels quels. NE JAMAIS les dé-anonymiser ou les remplacer par des noms complets.

Texte:\n\n${value}`;
          translated[key] = await base44.integrations.Core.InvokeLLM({
            prompt: translationPrompt
          });
        } else if (Array.isArray(value)) {
          translated[key] = await Promise.all(
            value.map(async (item) => {
              if (typeof item === 'string' && item.length > 20) {
                const translationPrompt = `Traduis le texte suivant en français de manière concise et claire.

RÈGLE ABSOLUE D'ANONYMISATION : Si le texte contient des noms au format anonymisé (première lettre + astérisques + dernière lettre, exemple: A*****e, I**s, S****l), tu DOIS les conserver EXACTEMENT tels quels. NE JAMAIS les dé-anonymiser ou les remplacer par des noms complets.

Texte:\n\n${item}`;
                return await base44.integrations.Core.InvokeLLM({
                  prompt: translationPrompt
                });
              }
              return item;
            })
          );
        }
      }
      
      return translated;
    };
    
    return await translateObject(result);
  }

  return result;
}