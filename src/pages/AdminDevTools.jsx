import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, Database, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminDevTools() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [logs, setLogs] = useState([]);

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

  const createTestRequest = async () => {
    try {
      await base44.entities.PendingRequest.create({
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        company: "Test Company",
        plan: "starter",
        users_count: 3,
        message: "Test request from DevTools",
        turnstile_score: 0.9,
        ip_address: "127.0.0.1",
        status: "pending"
      });
      toast.success("✅ Demande test créée");
      loadData();
    } catch (e) {
      toast.error("❌ Erreur création");
    }
  };

  const createTestClient = async () => {
    try {
      await base44.entities.Client.create({
        name: `Test Client ${Date.now()}`,
        email: `client${Date.now()}@example.com`,
        plan: "pro",
        max_users: 10,
        status: "active",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        admin_email: user?.email || "admin@test.com"
      });
      toast.success("✅ Client test créé");
      loadData();
    } catch (e) {
      toast.error("❌ Erreur création");
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

  const deleteAllTestData = async () => {
    if (!window.confirm("⚠️ Supprimer TOUTES les données test? Cette action est irréversible.")) return;
    try {
      // Supprimer en cascade
      await Promise.all([
        base44.entities.PendingRequest.delete({ status: "pending" }),
        base44.entities.AuditLog.delete({})
      ]);
      toast.success("✅ Données test supprimées");
      loadData();
    } catch (e) {
      toast.error("❌ Erreur suppression");
    }
  };

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
            <CardTitle className="text-white">⚡ Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={createTestRequest} className="bg-blue-600 hover:bg-blue-700">
                ➕ Demande test
              </Button>
              <Button onClick={createTestClient} className="bg-green-600 hover:bg-green-700">
                ➕ Client test
              </Button>
              <Button onClick={loadData} variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                🔄 Rafraîchir
              </Button>
              <Button onClick={deleteAllTestData} className="bg-red-600 hover:bg-red-700">
                🗑️ Supprimer test
              </Button>
            </div>
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
          <TabsContent value="requests" className="space-y-3">
            {requests.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-slate-400">Aucune demande en attente</CardContent>
              </Card>
            ) : (
              requests.map(req => (
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
                      {req.status === "pending" && (
                        <Button 
                          onClick={() => approveRequest(req.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          ✅ Approuver
                        </Button>
                      )}
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

        {/* Warning */}
        <Card className="bg-amber-950/30 border-amber-600/50">
          <CardContent className="pt-6 flex gap-3 text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mode développement uniquement</p>
              <p className="text-xs mt-1">Cette page doit être supprimée avant production. Masquez-la avec une vérification d'environnement.</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}