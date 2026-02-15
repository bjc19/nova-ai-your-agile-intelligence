import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function PendingInvitationsManager() {
  const queryClient = useQueryClient();

  const { data: pendingInvitations = [], isLoading } = useQuery({
    queryKey: ['pendingInvitations'],
    queryFn: async () => {
      const result = await base44.entities.InvitationToken.filter({ status: 'pending' });
      return result;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (invitationId) => {
      return await base44.functions.invoke('deleteInvitation', { invitationId });
    },
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success("Invitation annulée");
        queryClient.invalidateQueries({ queryKey: ['pendingInvitations'] });
      } else {
        toast.error(response.data.error || "Erreur");
      }
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  const handleDelete = (invitationId) => {
    if (window.confirm("Confirmer l'annulation de cette invitation ?")) {
      deleteMutation.mutate(invitationId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invitations en attente ({pendingInvitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingInvitations.map((invitation) => (
          <div key={invitation.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{invitation.invitee_email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  En attente
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {invitation.role === 'contributor' ? 'Contributeur' : 'Utilisateur'}
                </Badge>
                <span className="text-xs text-slate-500">
                  Invité le {new Date(invitation.created_date).toLocaleDateString('fr')}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(invitation.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Annuler
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}