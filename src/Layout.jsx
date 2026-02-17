import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, LogIn, Users, Menu, X, Bell } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { ThemeProvider } from "@/components/ThemeContext";
                  import { LoginDialog } from "@/components/LoginDialog";
                  import { DemoSimulator } from "@/components/nova/DemoSimulator";
                  import { JoinRequestsManager } from "@/components/subscription/JoinRequestsManager";
                  import AgileCoachWidget from "@/components/nova/AgileCoachWidget";
                  import AdminNotificationsPanel from "@/components/AdminNotificationsPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function LayoutContent({ children, currentPageName }) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showDemoSimulator, setShowDemoSimulator] = useState(false);
    const [user, setUser] = useState(null);
    const [canInvite, setCanInvite] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pendingAlerts, setPendingAlerts] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
        if (auth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);

          try {
            const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
            setCanInvite(statusRes.data.canInvite || false);
          } catch (e) {
            setCanInvite(false);
          }

          // Fetch pending alerts for admins
           if (currentUser?.role === 'admin') {
            try {
              const sprintAlerts = await base44.entities.SprintHealth.filter({ 
                status: "critical" 
              });

              // Fetch connection errors from all integration sources
              const jiraErrors = await base44.entities.JiraConnection.filter({ 
                connection_status_error: true 
              });
              const trelloErrors = await base44.entities.TrelloConnection.filter({ 
                connection_status_error: true 
              });
              const confluenceErrors = await base44.entities.ConfluenceConnection.filter({ 
                connection_status_error: true 
              });
              const slackErrors = await base44.entities.SlackConnection.filter({ 
                connection_status_error: true 
              });
              const teamsErrors = await base44.entities.TeamsConnection.filter({ 
                connection_status_error: true 
              });

              const totalConnectionErrors = (jiraErrors?.length || 0) + 
                                            (trelloErrors?.length || 0) + 
                                            (confluenceErrors?.length || 0) + 
                                            (slackErrors?.length || 0) + 
                                            (teamsErrors?.length || 0);

              setPendingAlerts((sprintAlerts?.length || 0) + totalConnectionErrors);
            } catch (e) {
              setPendingAlerts(0);
            }
          }
        } else {
          setCanInvite(false);
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
          {isAuthenticated ? (
            <button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Nova
              </span>
            </button>
          ) : (
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
            )}

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {isLoading ? (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
              ) : isAuthenticated ? (
                <>
                  <Link 
                     to={createPageUrl("Dashboard")}
                     className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                   >
                     {t('dashboard')}
                   </Link>
                   {((user?.role === 'admin') || canInvite) && (
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
                   {canInvite && (
                    <Link 
                      to={createPageUrl("TeamManagement")}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      Équipe
                    </Link>
                   )}
                   {user?.role === 'admin' && (
                    <AdminNotificationsPanel pendingAlerts={pendingAlerts} />
                   )}
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={async () => {
                       setIsAuthenticated(false);
                       await base44.auth.logout();
                       window.location.href = createPageUrl("Home");
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
                  <Link 
                    to={createPageUrl("Privacy")}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Confidentialité
                  </Link>
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

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      Nova
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4">
                    {isAuthenticated ? (
                      <>
                        <Link 
                           to={createPageUrl("Dashboard")}
                           className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
                           onClick={() => setMobileMenuOpen(false)}
                         >
                           {t('dashboard')}
                         </Link>
                         {((user?.role === 'admin') || canInvite) && (
                           <Link 
                             to={createPageUrl("Analysis")}
                            className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {t('analyze')}
                          </Link>
                         )}
                        <Link 
                          to={createPageUrl("Settings")}
                          className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {t('settings')}
                        </Link>
                        {canInvite && (
                          <Link 
                            to={createPageUrl("TeamManagement")}
                            className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 flex items-center gap-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Users className="w-4 h-4" />
                            Équipe
                          </Link>
                        )}
                        <div className="pt-4 border-t border-slate-200">
                          <Button 
                            onClick={async () => {
                              setIsAuthenticated(false);
                              await base44.auth.logout();
                              window.location.href = createPageUrl("Home");
                              setMobileMenuOpen(false);
                            }}
                            className="w-full text-slate-600 hover:text-slate-700"
                            variant="outline"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Déconnexion
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setShowDemoSimulator(true);
                            setMobileMenuOpen(false);
                          }}
                          className="text-left text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
                        >
                          {t('tryDemo')}
                        </button>
                        <Link 
                          to={createPageUrl("Privacy")}
                          className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Confidentialité
                        </Link>
                        <div className="pt-4 border-t border-slate-200">
                          <Button 
                            onClick={() => {
                              setShowLoginDialog(true);
                              setMobileMenuOpen(false);
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          >
                            <LogIn className="w-4 h-4 mr-2" />
                            {t('signIn')}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
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
              <DemoSimulator 
                onClose={() => setShowDemoSimulator(false)} 
                onTriesUpdate={(remaining) => {
                  // Optionnel: gérer le compteur ici si nécessaire
                }} 
              />
            )}

            {/* Agile Coach Widget */}
            {isAuthenticated && (
              <AgileCoachWidget />
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
              <span className="text-xs text-slate-400 ml-2">{t('Your Agile Intelligence')}</span>
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