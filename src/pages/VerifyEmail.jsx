import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Mail, Loader } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate(createPageUrl('Home'));
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('verifyEmailCode', {
        email,
        code
      });

      if (response.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(createPageUrl('Home'));
        }, 2000);
      } else {
        setError(response.data?.error || 'Erreur de vérification');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-center">Vérifiez votre email</CardTitle>
          <CardDescription className="text-center">
            Un code de vérification a été envoyé à <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Code de vérification
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                maxLength="6"
                disabled={loading || success}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-slate-500 mt-2">
                Le code expire dans 24 heures
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">Email vérifié! Redirection...</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || success || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Vérifier'
              )}
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            Vous ne trouvez pas le code? Vérifiez votre dossier spam.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}