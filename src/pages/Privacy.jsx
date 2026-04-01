import { useLanguage } from "@/components/LanguageContext";
import { Shield, Lock, Database, Eye, Mail, Users } from "lucide-react";

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-400 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Politique de confidentialité</h1>
          </div>
          <p className="text-slate-600 text-lg">Dernière mise à jour : 15 février 2026</p>
          
          <div className="mt-4 bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
            <p className="text-sm text-teal-900 font-medium mb-1">📋 Déclaration de Protection des Données</p>
            <p className="text-sm text-teal-800">
              Nova stocke les tokens d'accès OAuth et adresses email au-delà de 24h (conformément aux exigences de connexion persistante). 
              Cependant, <strong>aucune donnée brute de vos outils</strong> (Jira, Trello, Slack, Teams) n'est stockée — 
              seulement les résultats d'analyse anonymisés après traitement backend sécurisé.
            </p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <p className="text-slate-700 leading-relaxed mb-4">
            Nova Agile ("nous", "notre" ou "nos") s'engage à protéger et à respecter votre vie privée. 
            Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et 
            protégeons vos informations personnelles lorsque vous utilisez notre plateforme d'analyse agile.
          </p>
          <p className="text-slate-700 leading-relaxed">
            En utilisant Nova Agile, vous acceptez les pratiques décrites dans cette politique.
          </p>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Database className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Données collectées</h2>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">1.1 Informations d'identification</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Nom complet</li>
                <li>Adresse e-mail</li>
                <li>Rôle dans l'organisation (administrateur, contributeur, utilisateur)</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">1.2 Données d'intégration (Tokens uniquement)</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li><strong>Tokens OAuth chiffrés</strong> pour Slack, Jira, Trello et Microsoft Teams (AES-256)</li>
                <li>Identifiants de workspace, cloud_id et board_id</li>
                <li>Métadonnées d'intégration (dates de connexion, permissions accordées)</li>
              </ul>
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-4">
                <p className="text-sm font-semibold text-emerald-900 mb-1">✅ Architecture zéro-rétention des données tierces</p>
                <p className="text-sm text-emerald-800">
                  Nova n'extrait ni ne stocke les données brutes de vos outils externes (issues Jira, tableaux Trello, messages Slack, conversations Teams). 
                  Nous accédons à ces données en <strong>lecture seule uniquement</strong>, les analysons via notre moteur backend sécurisé, 
                  puis les supprimons <strong>immédiatement</strong> après génération des insights. L'anonymisation des données sensibles 
                  est effectuée en amont, côté backend, avant toute analyse.
                </p>
              </div>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">1.3 Résultats d'analyse anonymisés (GDPRMarkers)</h3>
              <p className="text-slate-700 mb-2">
                Nous stockons <strong>uniquement les résultats anonymisés</strong> de nos analyses :
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Marqueurs de risques et anti-patterns détectés (anonymisés via SHA256)</li>
                <li>Recommandations contextuelles d'amélioration</li>
                <li>Métriques de performance d'équipe agrégées</li>
                <li>Historique d'analyses et tendances</li>
              </ul>
              <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-4">
                <p className="text-sm font-semibold text-teal-900 mb-1">🔒 Anonymisation systématique backend (RGPD stricte)</p>
                <p className="text-sm text-teal-800">
                  Toutes les données sensibles provenant de Jira, Trello, Slack et Teams sont <strong>anonymisées côté backend</strong> 
                  avant toute persistance. Nos fonctions d'analyse appliquent des transformations de sécurité propriétaires 
                  pour garantir qu'aucun identifiant personnel direct n'est jamais stocké. Les prénoms des membres d'équipe 
                  sont conservés uniquement avec <strong>consentement explicite</strong> et peuvent être supprimés à tout moment.
                </p>
              </div>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">1.4 Données de paiement</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Informations d'abonnement via Stripe (nous ne stockons pas les données de carte bancaire)</li>
                <li>Historique de facturation et statut d'abonnement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Eye className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Utilisation des données</h2>
              
              <p className="text-slate-700 mb-4">Nous utilisons vos données personnelles pour :</p>
              
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Fournir et améliorer nos services d'analyse agile</li>
                <li>Générer des analyses et recommandations personnalisées</li>
                <li>Gérer votre compte et vos préférences</li>
                <li>Traiter vos paiements et gérer votre abonnement</li>
                <li>Communiquer avec vous (notifications, mises à jour, support)</li>
                <li>Respecter nos obligations légales et réglementaires</li>
                <li>Détecter et prévenir les fraudes ou abus</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Lock className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Sécurité et protection</h2>
              
              <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border-2 border-teal-300 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-teal-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  Architecture Privacy by Design
                </h3>
                <div className="space-y-2 text-sm text-teal-900">
                  <p><strong>✅ Accès lecture seule</strong> : Nova ne peut ni créer, ni modifier, ni supprimer vos données sources</p>
                  <p><strong>✅ Analyse en mémoire</strong> : Les données brutes sont traitées en temps réel et immédiatement supprimées</p>
                  <p><strong>✅ Stockage minimal</strong> : Seuls les tokens OAuth + résultats anonymisés (marqueurs, métriques) sont conservés</p>
                  <p><strong>✅ Anonymisation systématique</strong> : Hachage SHA256 de tous les identifiants personnels avant stockage</p>
                  <p><strong>✅ Révocation instantanée</strong> : Supprimez les accès OAuth en un clic depuis vos paramètres</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">3.1 Chiffrement de bout en bout</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li><strong>AES-256</strong> pour tous les tokens OAuth au repos</li>
                <li><strong>TLS 1.3</strong> pour toutes les communications réseau</li>
                <li>Aucune donnée sensible stockée en clair</li>
                <li>Clés de chiffrement rotées régulièrement</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">3.2 Conformité RGPD stricte</h3>
              <p className="text-slate-700 mb-2">
                Nova respecte les 7 principes fondamentaux du RGPD :
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li><strong>Minimisation</strong> : Collecte strictement limitée (tokens + email)</li>
                <li><strong>Limitation de finalité</strong> : Données utilisées uniquement pour l'analyse Agile</li>
                <li><strong>Limitation de conservation</strong> : Pas de stockage des données sources tierces</li>
                <li><strong>Exactitude</strong> : Vous contrôlez vos données via les paramètres</li>
                <li><strong>Intégrité et confidentialité</strong> : Chiffrement + accès restreints</li>
                <li><strong>Transparence</strong> : Cette politique détaille tout ce que nous faisons</li>
                <li><strong>Responsabilité</strong> : Audits réguliers et droit à l'oubli en 48h</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">3.3 Anonymisation backend RGPD-compliant</h3>
              <p className="text-slate-700 mb-2">
                Nova applique une politique d'anonymisation stricte <strong>avant</strong> la persistance de toute donnée d'analyse :
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Traitement sécurisé côté backend de toutes les données sources (Jira, Trello, Slack, Teams)</li>
                <li>Transformation automatique des identifiants sensibles avant stockage</li>
                <li>Prénoms conservés uniquement avec consentement explicite de l'équipe</li>
                <li>Pas de stockage de numéros de téléphone, adresses postales ou données bancaires</li>
                <li>Accès en lecture seule aux plateformes externes (aucune modification possible)</li>
                <li>Logs système anonymisés après 30 jours</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Users className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Partage des données</h2>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                <p className="text-sm font-semibold text-green-900 mb-1">✅ Engagement de non-revente</p>
                <p className="text-sm text-green-800">
                  Nous ne vendons <strong>jamais</strong> vos données personnelles ni vos résultats d'analyse à des tiers. 
                  Vos données vous appartiennent entièrement.
                </p>
              </div>

              <p className="text-slate-700 mb-4">
                Nous partageons vos informations uniquement avec :
              </p>
              
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li><strong>Prestataires certifiés :</strong> Base44 (hébergement RGPD), Stripe (paiements PCI-DSS), Resend (emails transactionnels)</li>
                <li><strong>OpenAI (analyses IA) :</strong> Données anonymisées uniquement, sans stockage permanent par OpenAI</li>
                <li><strong>Aucun partage avec vos outils :</strong> Nova ne transmet JAMAIS vos résultats d'analyse à Slack, Jira, Trello ou Teams (flux unidirectionnel lecture seule)</li>
                <li><strong>Obligations légales :</strong> Autorités compétentes si requis par la loi (dans le respect du RGPD)</li>
                <li><strong>Membres de votre workspace :</strong> Analyses partagées au sein de votre équipe Nova uniquement</li>
              </ul>
              
              <p className="text-slate-700 mt-4 text-sm">
                Tous les prestataires sont liés par des accords de confidentialité stricts (DPA) et n'ont accès qu'aux données strictement nécessaires.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Shield className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Vos droits (RGPD)</h2>
              
              <p className="text-slate-700 mb-4">
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous avez le droit de :
              </p>
              
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li><strong>Accès :</strong> Obtenir une copie de vos données personnelles</li>
                <li><strong>Rectification :</strong> Corriger des données inexactes ou incomplètes</li>
                <li><strong>Suppression :</strong> Demander l'effacement de vos données ("droit à l'oubli")</li>
                <li><strong>Limitation :</strong> Restreindre le traitement de vos données</li>
                <li><strong>Portabilité :</strong> Recevoir vos données dans un format structuré</li>
                <li><strong>Opposition :</strong> Vous opposer au traitement de vos données</li>
                <li><strong>Retrait du consentement :</strong> Retirer votre consentement à tout moment</li>
              </ul>
              
              <p className="text-slate-700 mt-4">
                Pour exercer ces droits, contactez-nous à <a href="mailto:privacy@novagile.ca" className="text-teal-600 hover:underline">privacy@novagile.ca</a>
              </p>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Database className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Conservation des données</h2>
              
              <p className="text-slate-700 mb-4">Nous conservons vos données :</p>
              
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Pendant toute la durée de votre abonnement actif</li>
                <li>Jusqu'à 30 jours après la suppression de votre compte (sauf obligations légales)</li>
                <li>Les données anonymisées d'analyses peuvent être conservées pour améliorer nos services</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 7 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Mail className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contact</h2>
              
              <p className="text-slate-700 mb-4">
                Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-700 font-medium">Nova Agile</p>
                <p className="text-slate-600">Email : <a href="mailto:privacy@novagile.ca" className="text-teal-600 hover:underline">privacy@novagile.ca</a></p>
                <p className="text-slate-600">Support : <a href="mailto:support@novagile.ca" className="text-teal-600 hover:underline">support@novagile.ca</a></p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8 */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Modifications</h2>
          
          <p className="text-slate-700">
            Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. 
            Nous vous informerons de tout changement significatif par e-mail ou via un avis sur notre plateforme. 
            La date de "Dernière mise à jour" en haut de cette page indique quand cette politique a été révisée pour la dernière fois.
          </p>
        </div>
      </div>
    </div>
  );
}