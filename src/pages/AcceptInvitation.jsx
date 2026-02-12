import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setError('Token d\'invitation manquant');
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, []);

  const validateToken = async (tokenValue) => {
    try {
      // Check if user is already authenticated
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        setError('Vous êtes déjà connecté. Invitation déjà acceptée.');
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('validateInvitationToken', {
        token: tokenValue
      });

      if (!response.data.valid) {
        setError(response.data.error || 'Token invalide ou expiré');
        setLoading(false);
        return;
      }

      setInvitation(response.data);
      setFormData(prev => ({
        ...prev,
        email: response.data.inviteeEmail
      }));
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erreur lors de la validation du token');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Le nom complet est requis');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);

    try {
      const registerResponse = await base44.functions.invoke('registerInvitedUser', {
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        invitationId: invitation.id,
        token: token
      });

      if (registerResponse.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(createPageUrl('VerifyEmail') + '?email=' + encodeURIComponent(formData.email));
        }, 2000);
      } else {
        setError(registerResponse.data.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600">Validation de votre invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-600">Invitation invalide</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{error}</p>
            <Button 
              onClick={() => navigate(createPageUrl('Home'))}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-emerald-600">Compte créé avec succès!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Votre compte Nova a été créé.
            </p>
            <p className="text-xs text-slate-500">
              Redirection vers la vérification d'email...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Nova</span>
          </div>
          <CardTitle>Créer votre compte</CardTitle>
          <CardDescription>Acceptez votre invitation et rejoignez Nova</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <Input 
                type="email"
                value={formData.email}
                disabled
                className="bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom complet
              </label>
              <Input 
                type="text"
                placeholder="Votre nom complet"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <Input 
                type="password"
                placeholder="Au moins 8 caractères"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmer le mot de passe
              </label>
              <Input 
                type="password"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                disabled={submitting}
              />
            </div>

            <Button 
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              En créant un compte, vous acceptez nos conditions d'utilisation
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}