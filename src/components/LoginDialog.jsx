import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";

export function LoginDialog({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await base44.auth.loginViaEmailPassword(email, password);
      setEmail("");
      setPassword("");
      onClose();
      setTimeout(() => {
        window.location.href = createPageUrl("Dashboard");
      }, 100);
    } catch (err) {
      console.error("Login error:", err);
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError("");

    try {
      await base44.functions.invoke('sendPasswordResetEmail', {
        email: forgotEmail
      });
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail("");
        setForgotSuccess(false);
      }, 3000);
    } catch (err) {
      setError("Une erreur est survenue. Vérifiez votre email.");
      setForgotLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {
         setShowForgotPassword(false);
         setForgotEmail("");
         setForgotSuccess(false);
         setError("");
         onClose();
       }}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Reset Password</DialogTitle>
           </DialogHeader>

          {forgotSuccess ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                Check your email for password reset instructions.
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  disabled={forgotLoading}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-sm text-blue-600 hover:text-blue-700"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot Password?
            </button>
          </div>

          <div className="text-center text-sm text-slate-600 mt-4">
            Don't have an account yet?{" "}
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = "/ChooseAccess";
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}