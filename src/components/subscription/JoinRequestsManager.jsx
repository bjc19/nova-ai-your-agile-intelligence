import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function JoinRequestsManager() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['joinRequests'],
    queryFn: async () => {
      const result = await base44.entities.JoinTeamRequest.filter({ status: 'pending' });
      return result;
    }
  });

  const processMutation = useMutation({
    mutationFn: async ({ requestId, action, role }) => {
      return await base44.functions.invoke('processJoinRequest', {
        requestId,
        action,
        role
      });
    },
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success(response.data.message);
        queryClient.invalidateQueries({ queryKey: ['joinRequests'] });
      } else {
        toast.error(response.data.error || "Erreur");
      }
    },
    onError: () => {
      toast.error("Erreur lors du traitement");
    }
  });

  const handleApprove = (requestId) => {
    const role = selectedRole[requestId] || 'user';
    processMutation.mutate({ requestId, action: 'approve', role });
  };

  const handleReject = (requestId) => {
    if (window.confirm("Confirmer le rejet de cette demande ?")) {
      processMutation.mutate({ requestId, action: 'reject' });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Demandes d'accès en attente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Aucune demande en attente pour le moment
          </p>
        ) : (
          requests.map((request) => (
          <div key={request.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{request.requester_name}</p>
                <p className="text-sm text-slate-600">{request.requester_email}</p>
                <Badge variant="outline" className="mt-2">
                  {new Date(request.created_date).toLocaleDateString('fr')}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={selectedRole[request.id] || 'user'}
                onValueChange={(value) => setSelectedRole({ ...selectedRole, [request.id]: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="contributor">Contributeur</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(request.id)}
                disabled={processMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approuver
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => handleReject(request.id)}
                disabled={processMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeter
              </Button>
            </div>
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}