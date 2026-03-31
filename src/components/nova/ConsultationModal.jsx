import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Calendar, Mail, User, MessageSquare } from "lucide-react";

export default function ConsultationModal({ isOpen, onClose, lang = "fr" }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "", honeypot: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const t = {
    fr: {
      title: "Réserver une consultation",
      subtitle: "Notre équipe vous répondra sous 24h à contact@novagile.ca",
      name: "Nom complet *",
      namePlaceholder: "Jean Dupont",
      email: "Email professionnel *",
      emailPlaceholder: "jean@entreprise.com",
      company: "Entreprise",
      companyPlaceholder: "Nom de votre entreprise",
      message: "Votre message",
      messagePlaceholder: "Décrivez vos besoins de transformation agile...",
      send: "Envoyer la demande",
      sending: "Envoi en cours...",
      successTitle: "Demande envoyée !",
      successMsg: "Nous avons bien reçu votre demande. Notre équipe vous contactera sous 24h.",
      close: "Fermer",
      errorMsg: "Une erreur est survenue. Veuillez réessayer.",
    },
    en: {
      title: "Book a Consultation",
      subtitle: "Our team will reply within 24h at contact@novagile.ca",
      name: "Full name *",
      namePlaceholder: "John Smith",
      email: "Professional email *",
      emailPlaceholder: "john@company.com",
      company: "Company",
      companyPlaceholder: "Your company name",
      message: "Your message",
      messagePlaceholder: "Describe your agile transformation needs...",
      send: "Send Request",
      sending: "Sending...",
      successTitle: "Request sent!",
      successMsg: "We received your request. Our team will contact you within 24h.",
      close: "Close",
      errorMsg: "An error occurred. Please try again.",
    }
  }[lang] || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.honeypot) return; // Bot detected
    if (!form.name.trim() || !form.email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("sendConsultationRequest", {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        message: form.message.trim(),
        honeypot: form.honeypot,
      });
      setSuccess(true);
    } catch (err) {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: "", email: "", company: "", message: "", honeypot: "" });
    setSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">{t.title}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">{t.subtitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{t.successTitle}</h3>
            <p className="text-slate-600 text-sm">{t.successMsg}</p>
            <Button onClick={handleClose} className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              {t.close}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Honeypot - hidden from humans, bots fill it */}
            <input
              type="text"
              name="website"
              value={form.honeypot}
              onChange={e => setForm({ ...form, honeypot: e.target.value })}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {t.name}
              </label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t.namePlaceholder}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {t.email}
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder={t.emailPlaceholder}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">{t.company}</label>
              <Input
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                placeholder={t.companyPlaceholder}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> {t.message}
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder={t.messagePlaceholder}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.sending}</>
              ) : (
                <><Calendar className="w-4 h-4 mr-2" /> {t.send}</>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}