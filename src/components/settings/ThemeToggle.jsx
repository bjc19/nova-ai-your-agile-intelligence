import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ t }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{t('themeSettings') || 'Thème'}</CardTitle>
              <CardDescription className="text-xs">
                {t('chooseTheme') || 'Basculez entre mode clair et mode sombre'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                {isDarkMode ? 'Mode sombre' : 'Mode clair'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDarkMode
                  ? 'Interface optimisée pour la lecture nocturne'
                  : 'Interface optimisée pour la lecture diurne'}
              </p>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}