import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion } from "framer-motion";

export default function JoinTeamRequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Fetch pending requests for this manager
        const pendingRequests = await base44.entities.JoinTeamRequest.filter({
          manager_email: currentUser.email,
          status: 'pending'
        });

        setRequests(pendingRequests);
      } catch (error) {
        console.error('Error loading join requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const handleApprove = async (request) => {
    try {
      // Get subscription
      const subs = await base44.asServiceRole.entities.Subscription.filter({
        id: request.subscription_id
      });

      if (subs.length === 0) return;

      const subscription = subs[0];

      // Create team member
      await base44.entities.TeamMember.create({
        user_email: request.requester_email,
        user_name: request.requester_name,
        subscription_id: subscription.id,
        manager_email: user.email,
        role: request.assigned_role || 'user',
        joined_at: new Date().toISOString()
      });

      // Update request status
      await base44.entities.JoinTeamRequest.update(request.id, {
        status: 'approved',
        processed_at: new Date().toISOString()
      });

      // Remove from UI
      setRequests(requests.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (request) => {
    try {
      await base44.entities.JoinTeamRequest.update(request.id, {
        status: 'rejected',
        processed_at: new Date().toISOString()
      });

      setRequests(requests.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Demandes d'adhésion à l'équipe
          </CardTitle>
          <CardDescription>Aucune demande en attente</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Demandes d'adhésion à l'équipe
        </CardTitle>
        <CardDescription>
          {requests.length} demande{requests.length > 1 ? 's' : ''} en attente d'approbation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">{request.requester_name}</p>
                <p className="text-sm text-slate-600">{request.requester_email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Rejeter
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(request)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approuver
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}