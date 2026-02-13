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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Politique de confidentialité</h1>
          </div>
          <p className="text-slate-600 text-lg">Dernière mise à jour : 13 février 2026</p>
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
            <Database className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Données collectées</h2>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">1.1 Informations d'identification</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Nom complet</li>
                <li>Adresse e-mail</li>
                <li>Rôle dans l'organisation (administrateur, contributeur, utilisateur)</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">1.2 Données d'intégration</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Tokens d'accès chiffrés pour Slack, Jira et Microsoft Teams</li>
                <li>Identifiants de workspace et d'équipe</li>
                <li>Métadonnées d'intégration (dates de connexion, permissions accordées)</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">1.3 Données d'analyse</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Transcriptions de réunions (anonymisées)</li>
                <li>Données de projet Jira (issues, sprints, métriques)</li>
                <li>Messages Slack de canaux connectés</li>
                <li>Analyses générées et recommandations</li>
                <li>Marqueurs de risques et anti-patterns détectés</li>
              </ul>

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
            <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
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
            <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Sécurité et protection</h2>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">3.1 Mesures de sécurité</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Chiffrement des tokens d'accès et données sensibles</li>
                <li>Connexions HTTPS sécurisées</li>
                <li>Contrôles d'accès basés sur les rôles (RLS)</li>
                <li>Authentification sécurisée</li>
                <li>Surveillance continue et audits de sécurité</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-800 mb-2">3.2 Anonymisation</h3>
              <p className="text-slate-700 mb-2">
                Conformément au RGPD et aux meilleures pratiques :
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Les transcriptions sont anonymisées (prénoms uniquement)</li>
                <li>Les identifiants d'équipe et tenant sont hashés (SHA256)</li>
                <li>Les données sensibles sont stockées avec chiffrement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Partage des données</h2>
              
              <p className="text-slate-700 mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :
              </p>
              
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li><strong>Prestataires de services :</strong> Stripe (paiements), Base44 (infrastructure), OpenAI (analyses IA)</li>
                <li><strong>Services intégrés :</strong> Slack, Jira, Microsoft Teams (selon vos connexions)</li>
                <li><strong>Obligations légales :</strong> Autorités compétentes si requis par la loi</li>
                <li><strong>Membres de votre équipe :</strong> Analyses partagées au sein de votre workspace</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
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
                Pour exercer ces droits, contactez-nous à <a href="mailto:privacy@novagile.ca" className="text-blue-600 hover:underline">privacy@novagile.ca</a>
              </p>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Database className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
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
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contact</h2>
              
              <p className="text-slate-700 mb-4">
                Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-700 font-medium">Nova Agile</p>
                <p className="text-slate-600">Email : <a href="mailto:privacy@novagile.ca" className="text-blue-600 hover:underline">privacy@novagile.ca</a></p>
                <p className="text-slate-600">Support : <a href="mailto:support@novagile.ca" className="text-blue-600 hover:underline">support@novagile.ca</a></p>
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