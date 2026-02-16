import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Mail, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JoinRequestsManager } from "@/components/subscription/JoinRequestsManager";
import { PendingInvitationsManager } from "@/components/subscription/PendingInvitationsManager";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import WorkspaceMemberManager from "@/components/workspace/WorkspaceMemberManager";

export default function TeamManagement() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [sendingInvite, setSendingInvite] = useState(false);

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getUserSubscriptionStatus', {});
      return response.data;
    }
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      if (subscriptionStatus?.type === 'owner') {
        return await base44.entities.TeamMember.filter({ admin_email: (await base44.auth.me()).email });
      }
      return [];
    },
    enabled: !!subscriptionStatus
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Veuillez saisir un email");
      return;
    }

    setSendingInvite(true);
    try {
      const response = await base44.functions.invoke('sendTeamInvitation', {
        email: inviteEmail,
        role: inviteRole
      });

      if (response.data.success) {
        toast.success("Invitation envoyée avec succès");
        setInviteEmail("");
        queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      } else {
        toast.error(response.data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  if (!subscriptionStatus?.canInvite) {
    return (
      <SubscriptionGuard>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">Vous n'avez pas les permissions pour gérer l'équipe.</p>
            </CardContent>
          </Card>
        </div>
      </SubscriptionGuard>
    );
  }

  const currentMembers = teamMembers.length;
  const maxMembers = subscriptionStatus?.subscription?.max_users || 0;

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-8 h-8" />
                Gestion de l'équipe
              </h1>
              <p className="text-slate-600 mt-1">
                {currentMembers} / {maxMembers} membres utilisés
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {subscriptionStatus?.subscription?.plan?.toUpperCase() || 'N/A'}
            </Badge>
          </div>

          <PendingInvitationsManager />

          <JoinRequestsManager />

          <WorkspaceMemberManager />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Inviter un nouveau membre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="md:col-span-2"
                  disabled={currentMembers >= maxMembers}
                />
                
                <Select value={inviteRole} onValueChange={setInviteRole} disabled={currentMembers >= maxMembers}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentMembers >= maxMembers && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    ⚠️ Vous avez atteint la limite de membres pour votre plan. Mettez à niveau pour inviter plus de personnes.
                  </p>
                </div>
              )}

              <Button 
                onClick={handleInvite}
                disabled={sendingInvite || currentMembers >= maxMembers}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {sendingInvite ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membres de l'équipe</CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Aucun membre pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                     <div key={member.id} className="flex items-center justify-between border rounded-lg p-4">
                       <div>
                         <p className="font-semibold text-slate-900">{member.user_name}</p>
                         <p className="text-sm text-slate-600">{member.user_email}</p>
                       </div>
                       <Badge variant="outline">
                         {member.app_role === 'contributor' ? 'Contributeur' : member.app_role === 'admin' ? 'Admin' : 'Utilisateur'}
                       </Badge>
                     </div>
                   ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </SubscriptionGuard>
  );
}