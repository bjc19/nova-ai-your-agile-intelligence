import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, LogIn, Mail, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  // Valider le token au chargement
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Pas de token d'invitation fourni. Veuillez utiliser le lien reçu par email.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await base44.functions.invoke('validateInvitationToken', { token });
        if (response.data.valid) {
          setEmail(response.data.email);
          setTokenValid(true);
        } else {
          setError(response.data.error || "Invitation invalide ou expirée");
        }
      } catch (err) {
        setError("Erreur lors de la validation de l'invitation: " + (err.message || "Erreur inconnue"));
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!tokenValid) {
      setError("Token d'invitation invalide");
      return;
    }

    setIsSubmitting(true);

    try {
      // Utiliser le token
      const tokenResponse = await base44.functions.invoke('useInvitationToken', { token });

      if (tokenResponse.data.success) {
        setSuccess("Inscription réussie! Redirection...");
        
        // Rediriger vers login après 2 secondes
        setTimeout(() => {
          navigate(createPageUrl("Home"));
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Vérification de l'invitation...</p>
        </div>
      </div>
    );
  }

  // Pas de token ou token invalide
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-white">Invitation invalide</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-200">{error}</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-200">
                  Veuillez demander une nouvelle invitation à votre administrateur d'équipe.
                </p>
              </div>

              <Button
                onClick={() => navigate(createPageUrl("Home"))}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Formulaire d'inscription avec token valide
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl text-white">Créer votre compte</CardTitle>
            <CardDescription className="text-slate-300">
              Complétez votre inscription
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Erreur */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </motion.div>
            )}

            {/* Succès */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-200">{success}</p>
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Email (lecture seule) */}
              <div>
                <label className="text-sm font-medium text-slate-200 block mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 bg-slate-700/50 border-slate-600 text-slate-400 placeholder:text-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email associé à votre invitation</p>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="text-sm font-medium text-slate-200 block mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum 8 caractères</p>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="text-sm font-medium text-slate-200 block mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isSubmitting ? "Création du compte..." : "Créer mon compte"}
              </Button>
            </form>

            {/* Info */}
            <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600">
              <p className="text-xs text-slate-300">
                En créant votre compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Processus d'inscription sécurisé par invitation
        </p>
      </motion.div>
    </div>
  );
}