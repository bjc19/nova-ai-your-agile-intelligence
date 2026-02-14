import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Send, Plus, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function BlockersAffectingMe() {
  const [blockers, setBlockers] = useState([]);
  const [dependsOnMe, setDependsOnMe] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllDependencies, setShowAllDependencies] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    blockedBy: "",
    urgency: "medium"
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadBlockers = async () => {
      try {
        setLoading(true);
        
        const storedWorkspaceId = sessionStorage.getItem("selectedWorkspaceId");
        const workspaceId = storedWorkspaceId ? JSON.parse(storedWorkspaceId) : null;

        const response = await base44.functions.invoke('getBlockersAffectingUser', {
          workspaceId: workspaceId
        });

        setBlockers(response.data.blockers || []);
        setDependsOnMe(response.data.dependsOnMe || []);
      } catch (error) {
        console.error("Erreur chargement blockers:", error);
        setBlockers([]);
        setDependsOnMe([]);
      } finally {
        setLoading(false);
      }
    };

    loadBlockers();
  }, []);

  const handleContactPerson = async (blocker) => {
    setSendingEmail(blocker.id);
    try {
      const user = await base44.auth.me();
      await base44.integrations.Core.SendEmail({
        to: "support@nova-agile.com",
        subject: `[Blocker] ${blocker.title} - Contact request from ${user?.full_name}`,
        body: `Une personne de votre équipe souhaite contacter ${blocker.blockedBy} pour : ${blocker.title}\n\nDétails: ${blocker.description}\nTicket: ${blocker.ticket}`
      });
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSubmitBlocker = async () => {
    if (!reportForm.title || !reportForm.blockedBy) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const storedWorkspaceId = sessionStorage.getItem("selectedWorkspaceId");
      const workspaceId = storedWorkspaceId ? JSON.parse(storedWorkspaceId) : null;

      await base44.functions.invoke('reportBlocker', {
        workspaceId,
        title: reportForm.title,
        description: reportForm.description,
        blockedBy: reportForm.blockedBy,
        urgency: reportForm.urgency
      });

      // Reset form and reload
      setReportForm({ title: "", description: "", blockedBy: "", urgency: "medium" });
      setShowReportDialog(false);
      
      // Reload blockers
      const response = await base44.functions.invoke('getBlockersAffectingUser', {
        workspaceId
      });
      setBlockers(response.data.blockers || []);
    } catch (error) {
      console.error("Erreur signalement blocker:", error);
      alert("Erreur lors du signalement du blocage");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Blocages qui te Concernent
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Blocages qui te Concernent
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Ce que tu dois savoir pour progresser - vue exclusive pour toi
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Blocked By */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">⏸️ Tu es bloqué par</h4>
            {blockers.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun blocage actuellement</p>
            ) : (
              <div className="space-y-2">
                {blockers.map((blocker) => (
                  <div key={blocker.id} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{blocker.title}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Bloqué par <span className="font-semibold text-slate-900">{blocker.blockedBy}</span>
                        </p>
                      </div>
                      <Badge className={`text-xs flex-shrink-0 ${blocker.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {blocker.urgency === 'high' ? '🔴 Urgent' : '⏱️ Moyen'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{blocker.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-white">
                        {blocker.ticket}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-100"
                        onClick={() => handleContactPerson(blocker)}
                        disabled={sendingEmail === blocker.id}
                      >
                        {sendingEmail === blocker.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3 mr-1" />
                        )}
                        {sendingEmail === blocker.id ? "Envoi..." : "Contacter"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Others depend on me */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">👥 Qui compte sur toi</h4>
            {dependsOnMe.length === 0 ? (
              <p className="text-xs text-slate-500">Personne ne dépend de toi en ce moment</p>
            ) : (
              <div className="space-y-2">
                {(showAllDependencies ? dependsOnMe : dependsOnMe.slice(0, 2)).map((dep) => (
                  <div key={dep.id} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm font-medium text-slate-900">{dep.person}</p>
                    <p className="text-xs text-slate-600 mt-1">{dep.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{dep.description}</p>
                    <Badge variant="outline" className="text-xs bg-white mt-2">
                      {dep.ticket}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            {dependsOnMe.length > 2 && (
              <button 
                onClick={() => setShowAllDependencies(!showAllDependencies)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                {showAllDependencies ? `Masquer (${dependsOnMe.length - 2} autres)` : `Voir tous les ${dependsOnMe.length}`}
              </button>
            )}
          </div>

          {/* Report Blocker */}
          <div className="pt-2 border-t border-slate-200 flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowReportDialog(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Signaler un Blocage
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={() => setShowAllDependencies(!showAllDependencies)}
            >
              Voir Dépendances ({dependsOnMe.length})
            </Button>
          </div>
          </CardContent>
          </Card>

          {/* Report Blocker Dialog */}
          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
           <DialogTitle>Signaler un Blocage</DialogTitle>
           <DialogDescription>
             Décris le blocage qui t'empêche de progresser
           </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
           <div>
             <label className="text-sm font-medium text-slate-900 mb-2 block">
               Titre du Blocage *
             </label>
             <Input
               placeholder="ex: En attente de review API"
               value={reportForm.title}
               onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
             />
           </div>
           <div>
             <label className="text-sm font-medium text-slate-900 mb-2 block">
               Qui te bloque? *
             </label>
             <Input
               placeholder="ex: Sarah D."
               value={reportForm.blockedBy}
               onChange={(e) => setReportForm({ ...reportForm, blockedBy: e.target.value })}
             />
           </div>
           <div>
             <label className="text-sm font-medium text-slate-900 mb-2 block">
               Description
             </label>
             <Textarea
               placeholder="Détails du blocage..."
               value={reportForm.description}
               onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
               className="h-24"
             />
           </div>
           <div>
             <label className="text-sm font-medium text-slate-900 mb-2 block">
               Urgence
             </label>
             <Select value={reportForm.urgency} onValueChange={(value) => setReportForm({ ...reportForm, urgency: value })}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="low">Basse</SelectItem>
                 <SelectItem value="medium">Moyenne</SelectItem>
                 <SelectItem value="high">Haute</SelectItem>
               </SelectContent>
             </Select>
           </div>
          </div>
          <div className="flex gap-2 justify-end">
           <Button 
             variant="outline" 
             onClick={() => setShowReportDialog(false)}
             disabled={submitting}
           >
             Annuler
           </Button>
           <Button 
             onClick={handleSubmitBlocker}
             disabled={submitting}
             className="bg-blue-600 hover:bg-blue-700 text-white"
           >
             {submitting ? (
               <>
                 <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                 Envoi...
               </>
             ) : (
               "Signaler"
             )}
           </Button>
          </div>
          </DialogContent>
          </Dialog>
          </motion.div>
          );
          }