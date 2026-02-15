import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Trash2, ShieldAlert, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AccountDeletionSection() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    loadDeletionRequest();
  }, []);

  useEffect(() => {
    if (!codeExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(codeExpiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        setShowCodeDialog(false);
        toast.error("Le code a expiré. Veuillez en demander un nouveau.");
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const loadDeletionRequest = async () => {
    try {
      const user = await base44.auth.me();
      const requests = await base44.entities.AccountDeletionRequest.filter({
        user_email: user?.email,
        status: 'confirmed'
      });

      if (requests.length > 0) {
        setDeletionRequest(requests[0]);
      } else {
        setDeletionRequest(null);
      }
    } catch (error) {
      console.error("Error loading deletion request:", error);
    }
  };

  const handleRequestDeletion = async () => {
    setIsRequesting(true);
    try {
      const response = await base44.functions.invoke('requestAccountDeletion', {});
      
      if (response.data.success) {
        setCodeExpiresAt(response.data.expiresAt);
        setShowConfirmDialog(false);
        setShowCodeDialog(true);
        toast.success("Code de vérification envoyé par email");
      } else {
        toast.error(response.data.error || "Erreur lors de la demande");
      }
    } catch (error) {
      console.error("Error requesting deletion:", error);
      toast.error("Erreur lors de la demande de suppression");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }

    setIsConfirming(true);
    try {
      const response = await base44.functions.invoke('confirmAccountDeletion', {
        verificationCode
      });

      if (response.data.success) {
        setShowCodeDialog(false);
        setVerificationCode("");
        await loadDeletionRequest();
        toast.success("Suppression confirmée. Vous avez 7 jours pour annuler.");
      } else {
        toast.error(response.data.error || "Code incorrect");
      }
    } catch (error) {
      console.error("Error confirming deletion:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la confirmation");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);
    try {
      const response = await base44.functions.invoke('cancelAccountDeletion', {});

      if (response.data.success) {
        setDeletionRequest(null);
        toast.success("Suppression annulée avec succès");
      } else {
        toast.error(response.data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Error cancelling deletion:", error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsCancelling(false);
    }
  };

  const getDaysRemaining = () => {
    if (!deletionRequest?.deletion_scheduled_at) return 0;
    const now = new Date();
    const deletionDate = new Date(deletionRequest.deletion_scheduled_at);
    const diff = deletionDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <Card className="border-2 border-red-200 bg-red-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base text-red-900">Zone dangereuse</CardTitle>
              <CardDescription className="text-xs text-red-700">
                Actions irréversibles sur votre compte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {deletionRequest ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-300">
                <div className="flex items-start gap-3 mb-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Suppression programmée dans {getDaysRemaining()} jour{getDaysRemaining() > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-800">
                      Date de suppression : {new Date(deletionRequest.deletion_scheduled_at).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-white/60 text-xs text-amber-800 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    Vous pouvez encore annuler. Après cette date, toutes vos données seront définitivement supprimées.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCancelDeletion}
                disabled={isCancelling}
                variant="outline"
                className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Annulation...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Annuler la suppression de mon compte
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-100 text-xs text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium mb-1">Cette action est définitive après 7 jours</p>
                  <p>La suppression entraînera la perte de toutes vos données, analyses, et configurations.</p>
                </div>
              </div>

              <Button
                onClick={() => setShowConfirmDialog(true)}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer mon compte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-900 font-medium mb-2">
                  Êtes-vous absolument certain ?
                </p>
                <ul className="space-y-1 text-xs text-red-800">
                  <li>• Toutes vos données seront supprimées</li>
                  <li>• Vos analyses et historiques seront perdus</li>
                  <li>• Vos intégrations seront déconnectées</li>
                  <li>• Cette action est irréversible après 7 jours</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-emerald-800">
                  <strong>Période de récupération :</strong> Vous aurez 7 jours pour 
                  annuler cette suppression.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleRequestDeletion}
              disabled={isRequesting}
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Envoi...
                </>
              ) : (
                "Continuer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              Code de vérification
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p className="text-sm text-slate-700">
                Un code à 6 chiffres a été envoyé à votre email.
              </p>
              {timeRemaining && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  <Clock className="w-4 h-4" />
                  Code valide : {timeRemaining}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCodeDialog(false);
                  setVerificationCode("");
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmDeletion}
                disabled={isConfirming || verificationCode.length !== 6}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isConfirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Vérification...
                  </>
                ) : (
                  "Confirmer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}