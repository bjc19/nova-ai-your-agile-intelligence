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

        const user = await base44.auth.me();
        
        // Redirect based on role
        if (user?.role === 'admin') {
          navigate(createPageUrl("Dashboard/admins"));
        } else if (user?.role === 'contributor') {
          navigate(createPageUrl("Dashboard/contributors"));
        } else if (user?.role === 'user') {
          navigate(createPageUrl("Dashboard/commonusers"));
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