import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PlanAssignmentSection() {
  const [targetEmail, setTargetEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [isAssigning, setIsAssigning] = useState(false);

  const plans = [
    { value: "starter", label: "Starter", color: "bg-slate-100 text-slate-700" },
    { value: "growth", label: "Growth", color: "bg-blue-100 text-blue-700" },
    { value: "pro", label: "Pro", color: "bg-purple-100 text-purple-700" },
    { value: "enterprise", label: "Enterprise", color: "bg-amber-100 text-amber-700" }
  ];

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    
    if (!targetEmail) {
      toast.error("Veuillez saisir un email");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await base44.functions.invoke('assignUserPlan', {
        targetEmail: targetEmail.trim(),
        newPlan: selectedPlan
      });

      if (response.data?.success) {
        toast.success(response.data.message);
        setTargetEmail("");
      } else {
        toast.error(response.data?.error || "Erreur lors de l'attribution");
      }
    } catch (error) {
      console.error('Error assigning plan:', error);
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-100 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-medium mb-1">Mode développement uniquement</p>
            <p>Cette fonctionnalité permet de simuler différents plans pour tester les comportements spécifiques à chaque profil (Starter, Growth, Pro, Enterprise).</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleAssignPlan} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetEmail" className="text-sm font-medium text-slate-700 mb-2 block">
              Email de l'utilisateur
            </Label>
            <Input
              id="targetEmail"
              type="email"
              placeholder="utilisateur@example.com"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              disabled={isAssigning}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="plan" className="text-sm font-medium text-slate-700 mb-2 block">
              Plan à attribuer
            </Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan} disabled={isAssigning}>
              <SelectTrigger id="plan" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    <div className="flex items-center gap-2">
                      <span>{plan.label}</span>
                      <Badge className={plan.color}>
                        {plan.value}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isAssigning || !targetEmail}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isAssigning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Attribution en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Attribuer le plan
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-amber-200">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Plans disponibles</h4>
        <div className="grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.value}
              className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <Badge className={plan.color}>
                {plan.label}
              </Badge>
              <p className="text-xs text-slate-600 mt-2">
                {plan.value === 'starter' && 'Fonctionnalités de base'}
                {plan.value === 'growth' && 'Analyses avancées'}
                {plan.value === 'pro' && 'Toutes les fonctionnalités'}
                {plan.value === 'enterprise' && 'Sur mesure + support'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}