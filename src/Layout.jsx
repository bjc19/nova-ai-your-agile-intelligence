import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, LogIn } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { LoginDialog } from "@/components/LoginDialog";
import { DemoSimulator } from "@/components/nova/DemoSimulator";

function LayoutContent({ children, currentPageName }) {
    const { t } = useLanguage();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showDemoSimulator, setShowDemoSimulator] = useState(false);
    const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
        if (auth) {
          const user = await base44.auth.me();
          setUserRole(user?.role);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const isPublicPage = currentPageName === "Home" || currentPageName === "Demo" || currentPageName === "AcceptInvitation";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            to={createPageUrl("Home")}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Nova
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <button 
                   onClick={() => window.location.href = createPageUrl("Dashboard")}
                   className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                 >
                   {t('dashboard')}
                 </button>
                 {(userRole === 'admin' || userRole === 'contributor') && (
                   <Link 
                     to={createPageUrl("Analysis")}
                     className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                   >
                     {t('analyze')}
                   </Link>
                 )}
                <Link 
                  to={createPageUrl("Settings")}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('settings')}
                </Link>
                <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => {
                     base44.auth.logout("/Home");
                   }}
                   className="text-slate-500 hover:text-slate-700"
                 >
                   <LogOut className="w-4 h-4" />
                 </Button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setShowDemoSimulator(true)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('tryDemo')}
                </button>
                <Button 
                  size="sm"
                  onClick={() => setShowLoginDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('signIn')}
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Login Dialog */}
      <LoginDialog 
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />

      {/* Demo Simulator */}
      {showDemoSimulator && (
        <DemoSimulator onClose={() => setShowDemoSimulator(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900">Nova</span>
              <span className="text-xs text-slate-400 ml-2">{t('AI Agile Expert')}</span>
              <span className="text-xs text-slate-400 ml-2">{t('Copyright © 2026 - All Rights Reserved')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    );
    }

    export default function Layout({ children, currentPageName }) {
    return (
    <LanguageProvider>
    <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
    );
    }