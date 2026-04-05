import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { DemoSimulator } from "@/components/nova/DemoSimulator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function LayoutContent({ children }) {
  const { t } = useLanguage();
  const [showDemoSimulator, setShowDemoSimulator] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/9eb1d0f0e_IMG_0134.png"
              alt="Novagile AI"
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setShowDemoSimulator(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {t("tryDemo")}
            </button>
            <Link
              to="/Privacy"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Confidentialité
            </Link>
            <a
              href="https://novalive.ca"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-indigo-400 text-white"
              >
                Accéder à Nova →
              </Button>
            </a>
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
                  <SheetTitle className="flex items-center">
                    <img
                      src="https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/9eb1d0f0e_IMG_0134.png"
                      alt="Novagile AI"
                      className="h-8 w-auto object-contain"
                    />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setShowDemoSimulator(true);
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
                  >
                    {t("tryDemo")}
                  </button>
                  <Link
                    to="/Privacy"
                    className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Confidentialité
                  </Link>
                  <div className="pt-4 border-t border-slate-200">
                    <a
                      href="https://novalive.ca"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full bg-gradient-to-r from-teal-500 to-indigo-400 text-white">
                        Accéder à Nova →
                      </Button>
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Demo Simulator */}
      {showDemoSimulator && (
        <DemoSimulator
          onClose={() => setShowDemoSimulator(false)}
          onTriesUpdate={() => {}}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/9eb1d0f0e_IMG_0134.png"
                alt="Novagile AI"
                className="h-7 w-auto object-contain"
              />
              <span className="text-xs text-slate-400 ml-2">
                {t("Copyright © 2020 - 2026 - All Rights Reserved")}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/Privacy" className="text-xs text-slate-500 hover:text-slate-700">
                Confidentialité
              </Link>
              <a
                href="https://novalive.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                novalive.ca →
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} />
    </LanguageProvider>
  );
}