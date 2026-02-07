import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ContactSalesModal({ plan, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    users_count: plan?.users?.match(/\d+/) ? parseInt(plan.users.match(/\d+/)[0]) : 5,
    message: plan?.name ? `Je suis intéressé par le plan ${plan.name}` : ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "users_count" ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.company) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('submitContactRequest', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        plan: plan.id,
        users_count: formData.users_count,
        message: formData.message,
        turnstile_token: "dev-token" // À remplacer par vrai Turnstile en prod
      });

      if (response.data.success) {
        toast.success("✅ Demande envoyée! Réponse sous 24h.");
        onClose();
      } else {
        toast.error("❌ " + (response.data.error || "Erreur lors de l'envoi"));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("❌ Erreur lors de l'envoi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Demande d'accès - {plan?.name}</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour accéder à Nova
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email professionnel *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="vous@entreprise.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="company">Entreprise *</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Nom de l'entreprise"
              required
            />
          </div>

          <div>
            <Label htmlFor="users_count">Nombre d'utilisateurs estimé</Label>
            <Input
              id="users_count"
              name="users_count"
              type="number"
              value={formData.users_count}
              onChange={handleChange}
              min="1"
              max="500"
            />
          </div>

          <div>
            <Label htmlFor="message">Message (optionnel)</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Décrivez vos besoins spécifiques..."
              rows={4}
            />
          </div>

          <div className="bg-slate-100 p-3 rounded text-xs text-slate-600">
            💡 Votre demande sera examinée et vous recevrez une réponse sous 24h.
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer demande"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}