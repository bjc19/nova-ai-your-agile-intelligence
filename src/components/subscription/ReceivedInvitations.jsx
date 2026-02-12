import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function ReceivedInvitations() {
  const [selectedRoles, setSelectedRoles] = useState({});

  const { data: joinRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['joinRequests'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const requests = await base44.entities.JoinTeamRequest.filter({
        admin_email: user.email,
        status: 'pending'
      });
      return requests;
    }
  });

  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, action, role }) => {
      return await base44.functions.invoke('processJoinRequest', {
        requestId,
        action,
        role
      });
    },
    onSuccess: (response, variables) => {
      if (response.data.success) {
        toast.success(
          variables.action === 'approve' 
            ? 'Demande approuvée' 
            : 'Demande refusée'
        );
        refetch();
        setSelectedRoles(prev => {
          const newRoles = { ...prev };
          delete newRoles[variables.requestId];
          return newRoles;
        });
      } else {
        toast.error(response.data.error || "Erreur lors du traitement");
      }
    },
    onError: (error) => {
      toast.error("Erreur lors du traitement de la demande");
    }
  });

  const handleApprove = (requestId) => {
    const role = selectedRoles[requestId] || 'user';
    processRequestMutation.mutate({
      requestId,
      action: 'approve',
      role
    });
  };

  const handleReject = (requestId) => {
    processRequestMutation.mutate({
      requestId,
      action: 'reject'
    });
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

  if (joinRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitations reçues</CardTitle>
          <CardDescription>Gérez les demandes d'accès à votre équipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">
                Aucune demande en attente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invitations reçues</CardTitle>
            <CardDescription>Gérez les demandes d'accès à votre équipe</CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {joinRequests.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {joinRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">{request.requester_name}</p>
                <p className="text-sm text-slate-500">{request.requester_email}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Demande reçue le {new Date(request.created_date).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={selectedRoles[request.id] || 'user'}
                  onValueChange={(value) =>
                    setSelectedRoles(prev => ({
                      ...prev,
                      [request.id]: value
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="contributor">Contributeur</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => handleApprove(request.id)}
                  disabled={processRequestMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approuver
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleReject(request.id)}
                  disabled={processRequestMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Rejeter
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}