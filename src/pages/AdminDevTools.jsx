import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

export default function AdminDevTools() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setIsAdmin(u?.role === "admin");
        if (u?.role === "admin") {
          loadData();
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loadData = async () => {
    try {
      const [reqData, clientData, logData] = await Promise.all([
        base44.entities.PendingRequest.list(),
        base44.entities.Client.list(),
        base44.entities.AuditLog.list()
      ]);
      setRequests(reqData || []);
      setClients(clientData || []);
      setLogs(logData || []);
    } catch (e) {
      console.error("Data load failed:", e);
      toast.error("Erreur lors du chargement des données");
    }
  };



  const approveRequest = async (requestId) => {
    try {
      const response = await base44.functions.invoke('approveClientRequest', {
        requestId
      });

      if (response.data.success) {
        toast.success("✅ Demande approuvée et email d'activation envoyé", {
          description: "Le client recevra un lien pour créer son compte.",
          duration: 5000
        });
        loadData();
      } else {
        toast.error("❌ " + (response.data.error || "Erreur approbation"));
      }
    } catch (e) {
      toast.error("❌ Erreur approbation: " + e.message);
    }
  };

  const rejectRequest = async (requestId, requestEmail) => {
    if (!window.confirm(`⚠️ Rejeter la demande de ${requestEmail}?`)) return;
    try {
      await base44.entities.PendingRequest.update(requestId, {
        status: "rejected",
        approved_by: user?.email
      });
      toast.success("✅ Demande rejetée");
      loadData();
    } catch (e) {
      toast.error("❌ Erreur rejet");
    }
  };

  const deleteRequest = async (requestId, requestEmail) => {
    if (!window.confirm(`⚠️ Supprimer définitivement la demande de ${requestEmail}? Cette action est irréversible.`)) return;
    try {
      await base44.entities.PendingRequest.delete(requestId);
      toast.success("✅ Demande supprimée");
      loadData();
    } catch (e) {
      toast.error("❌ Erreur suppression");
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchQuery === '' || 
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesPlan = planFilter === 'all' || req.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (loading) return <div className="p-8">Vérification authentification...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <Card className="border-red-300 bg-red-100">
          <CardHeader>
            <CardTitle className="text-red-900">❌ Accès refusé</CardTitle>
            <CardDescription className="text-red-800">
              Seuls les administrateurs peuvent accéder aux DevTools.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-800 border border-yellow-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">🛠️ Admin DevTools</h1>
          </div>
          <p className="text-slate-300">Authentifié : <Badge variant="outline" className="ml-2 bg-green-900/30 text-green-300">{user?.email}</Badge></p>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">⚡ Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={loadData} variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
              🔄 Rafraîchir les données
            </Button>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="requests" className="text-white data-[state=active]:bg-slate-700">
              📬 Demandes ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-white data-[state=active]:bg-slate-700">
              👥 Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-white data-[state=active]:bg-slate-700">
              📋 Audit ({logs.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests */}
          <TabsContent value="requests" className="space-y-4">
            {/* Filtres et recherche */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">🔍 Recherche</label>
                    <input
                      type="text"
                      placeholder="Nom, email, entreprise..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">📊 Statut</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="approved">Approuvées</option>
                      <option value="rejected">Rejetées</option>
                      <option value="spam">Spam</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">💼 Plan</label>
                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Tous les plans</option>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {filteredRequests.length} demande(s) trouvée(s) sur {requests.length} total
                </div>
              </CardContent>
            </Card>

            {filteredRequests.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-slate-400">Aucune demande trouvée</CardContent>
              </Card>
            ) : (
              filteredRequests.map(req => (
                <Card key={req.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <p className="text-white font-semibold">{req.name}</p>
                        <p className="text-slate-400 text-sm">{req.email}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge>{req.plan.toUpperCase()}</Badge>
                          <Badge variant="outline" className={`${
                            req.status === "pending" ? "bg-yellow-900/30 text-yellow-300" :
                            req.status === "approved" ? "bg-green-900/30 text-green-300" :
                            "bg-red-900/30 text-red-300"
                          }`}>{req.status}</Badge>
                          <Badge variant="outline">{req.users_count} users</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {req.status === "pending" && (
                          <>
                            <Button 
                              onClick={() => approveRequest(req.id)}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              ✅ Approuver
                            </Button>
                            <Button 
                              onClick={() => rejectRequest(req.id, req.email)}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              ❌ Rejeter
                            </Button>
                          </>
                        )}
                        <Button 
                          onClick={() => deleteRequest(req.id, req.email)}
                          className="bg-slate-600 hover:bg-slate-700"
                          size="sm"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Clients */}
          <TabsContent value="clients" className="space-y-3">
            {clients.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-slate-400">Aucun client</CardContent>
              </Card>
            ) : (
              clients.map(client => (
                <Card key={client.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-white font-semibold">{client.name}</p>
                      <p className="text-slate-400 text-sm">{client.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-purple-600">{client.plan.toUpperCase()}</Badge>
                        <Badge variant="outline" className={`${
                          client.status === "active" ? "bg-green-900/30 text-green-300" :
                          "bg-red-900/30 text-red-300"
                        }`}>{client.status}</Badge>
                        <Badge variant="outline" className="bg-slate-700">{client.max_users} max users</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Expire: {new Date(client.expires_at).toLocaleDateString('fr')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Audit Logs */}
          <TabsContent value="logs" className="space-y-3">
            {logs.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-slate-400">Aucun log</CardContent>
              </Card>
            ) : (
              logs.slice(0, 20).map(log => (
                <Card key={log.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="space-y-1">
                      <p className="text-white text-sm"><strong>{log.action}</strong> sur {log.entity_type}</p>
                      <p className="text-slate-400 text-xs">{new Date(log.created_date).toLocaleString('fr')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Info */}
        <Card className="bg-blue-950/30 border-blue-600/50">
          <CardContent className="pt-6 flex gap-3 text-blue-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Interface d'administration</p>
              <p className="text-xs mt-1">Gérez les demandes d'accès clients et approuvez/rejetez en temps réel. Accessible uniquement aux admins.</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}