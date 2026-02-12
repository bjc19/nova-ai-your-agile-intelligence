import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";

export function SignupModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email requis");
      return;
    }
    if (!fullName.trim()) {
      setError("Nom complet requis");
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

    setLoading(true);
    try {
      // Utiliser Base44 pour créer un compte
      await base44.auth.createEmailPasswordUser({
        email,
        password,
        full_name: fullName
      });

      // Après création réussie, rediriger vers ChooseAccess
      setEmail("");
      setFullName("");
      setPassword("");
      setConfirmPassword("");
      onClose();
      setTimeout(() => {
        window.location.href = createPageUrl("ChooseAccess");
      }, 100);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 -mt-2 -ml-2 px-2 py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>
          <DialogTitle className="text-2xl font-bold text-center mt-4">
            Create your account
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}