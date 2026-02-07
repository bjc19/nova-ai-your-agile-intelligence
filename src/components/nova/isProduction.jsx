/**
 * Détermine si l'app est en mode production (Published)
 * En production, les composants affichent seulement des données réelles
 * En développement/preview, ils peuvent utiliser des données de demo
 */
export const isProduction = () => {
  const isPreview = window.location.href.includes('base44.app') && 
                    window.location.href.includes('preview');
  const isDev = process.env.NODE_ENV === 'development';
  
  return !isPreview && !isDev;
};