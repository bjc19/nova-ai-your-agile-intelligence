import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles } from "lucide-react";

export default function Layout({ children }) {
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
            <Link 
              to={createPageUrl("Home")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to={createPageUrl("Analysis")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Analyze
            </Link>
            <Link 
              to={createPageUrl("Settings")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900">Nova</span>
              <span className="text-xs text-slate-400 ml-2">AI Scrum Master</span>
            </div>
            <p className="text-xs text-slate-500">
              Demo Version • Simulation Mode • No real integrations
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}