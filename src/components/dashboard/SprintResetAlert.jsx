import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function SprintResetAlert() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <CardTitle className="text-lg text-amber-900">Reset Sprint 14</CardTitle>
          </div>
          <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            potential_drift 95%
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Confiance</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-amber-400 to-amber-500" />
              </div>
              <span className="text-xs text-slate-500">75%</span>
            </div>
            <p className="text-sm text-amber-800">
              💪 L'équipe travaille sur quelques défis
            </p>
            <p className="text-sm text-amber-700 font-medium">
              Votre collaboration et soutien sont importants en ce moment
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}