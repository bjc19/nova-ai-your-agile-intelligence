import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Get token from URL params
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");
    
    if (!resetToken) {
      setError("No reset token provided");
      setValidating(false);
      return;
    }

    setToken(resetToken);
    validateToken(resetToken);
  }, []);

  const validateToken = async (resetToken) => {
    try {
      const result = await base44.functions.invoke("resetPassword", {
        token: resetToken,
        newPassword: "temp" // Just for validation
      });

      if (result.data?.success && result.data?.email) {
        setEmail(result.data.email);
        setTokenValid(true);
      }
    } catch (err) {
      setError("Invalid or expired reset token");
    } finally {
      setValidating(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Validate token and mark as used
      await base44.functions.invoke("resetPassword", {
        token: token,
        newPassword: newPassword
      });

      // Update password via auth API
      try {
        await base44.auth.updateMe({ password: newPassword });
      } catch (authErr) {
        console.log("Auth update note:", authErr.message);
      }

      setSuccess(true);
      
      // Auto-login after 2 seconds
      setTimeout(async () => {
        try {
          await base44.auth.login(email, newPassword);
          window.location.href = createPageUrl("Dashboard");
        } catch (loginErr) {
          // If auto-login fails, redirect to Home
          navigate(createPageUrl("Home"));
        }
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Reset Link Invalid</h2>
            <p className="text-slate-600 mb-6">{error || "This reset link has expired or is invalid."}</p>
            <Button
              onClick={() => navigate(createPageUrl("Home"))}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-emerald-200">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Password Reset Successful</h2>
            <p className="text-slate-600 mb-6">Your password has been reset. Signing you in...</p>
            <p className="text-xs text-slate-500 mb-6">Redirecting to Dashboard in 2 seconds...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Nova</span>
          </div>
          <CardTitle>Reset Your Password</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}