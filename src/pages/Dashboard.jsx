import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectBasedOnRole = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        
        if (!authenticated) {
          navigate(createPageUrl("Home"));
          return;
        }

        const currentUser = await base44.auth.me();
        
        // Redirect based on role - with optional chaining for safety
        if (currentUser?.role === 'admin') {
          navigate(createPageUrl("DashboardAdmins"));
        } else if (currentUser?.role === 'contributor') {
          navigate(createPageUrl("DashboardContributors"));
        } else if (currentUser?.role === 'user') {
          navigate(createPageUrl("DashboardCommonUsers"));
        } else {
          navigate(createPageUrl("Home"));
        }
      } catch (error) {
        console.error("Error redirecting:", error);
        navigate(createPageUrl("Home"));
      }
    };

    redirectBasedOnRole();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );
}