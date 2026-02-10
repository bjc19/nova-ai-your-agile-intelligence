import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Shield, Users, RefreshCw } from "lucide-react";

export default function AdminRoles() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user.role === 'admin') {
        const users = await base44.entities.User.list();
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMyRole = async (newRole) => {
    setUpdating('me');
    try {
      await base44.auth.updateMe({ role: newRole });
      alert(`Rôle changé en "${newRole}". Rechargez la page pour voir la nouvelle vue.`);
      window.location.reload();
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await base44.entities.User.update(userId, { role: newRole });
      await loadData();
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Accès Refusé</h2>
            <p className="text-slate-600 mb-4">Cette page est réservée aux administrateurs.</p>
            <Link to={createPageUrl("Home")}>
              <Button>Retour</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={createPageUrl("Home")}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestion des Rôles
          </h1>
          <p className="text-slate-600">
            Changez les rôles pour tester les différentes vues d'analyse
          </p>
        </div>

        {/* Mon Rôle */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Mon Rôle Actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Email</p>
                <p className="font-medium text-slate-900">{currentUser.email}</p>
              </div>
              <Badge className={
                currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                currentUser.role === 'contributor' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }>
                {currentUser.role}
              </Badge>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Changer mon rôle pour tester :</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => changeMyRole('admin')}
                  disabled={currentUser.role === 'admin' || updating === 'me'}
                  variant={currentUser.role === 'admin' ? 'default' : 'outline'}
                  size="sm"
                >
                  👨‍💼 Admin (Vue Technique)
                </Button>
                <Button
                  onClick={() => changeMyRole('contributor')}
                  disabled={currentUser.role === 'contributor' || updating === 'me'}
                  variant={currentUser.role === 'contributor' ? 'default' : 'outline'}
                  size="sm"
                >
                  👷 Contributor (Vue Équipe)
                </Button>
                <Button
                  onClick={() => changeMyRole('user')}
                  disabled={currentUser.role === 'user' || updating === 'me'}
                  variant={currentUser.role === 'user' ? 'default' : 'outline'}
                  size="sm"
                >
                  👤 User (Vue Business)
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                ⚠️ La page se rechargera automatiquement après le changement
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Légende des Vues */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">📊 Description des Vues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-purple-900">👨‍💼 Admin - Vue Technique</p>
              <p className="text-slate-700">Détails complets, patterns détectés, contexte technique, actions expertes</p>
            </div>
            <div>
              <p className="font-semibold text-blue-900">👷 Contributor - Vue Équipe</p>
              <p className="text-slate-700">Actions concrètes, contexte simplifié, priorisation, conversation starters</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">👤 User - Vue Business</p>
              <p className="text-slate-700">Vision business, situation/besoin/résultat, framing constructif</p>
            </div>
          </CardContent>
        </Card>

        {/* Tous les Utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tous les Utilisateurs ({allUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{user.full_name || user.email}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'contributor' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }>
                      {user.role}
                    </Badge>
                    {user.id !== currentUser.id && (
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user.id, e.target.value)}
                        disabled={updating === user.id}
                        className="text-xs border border-slate-300 rounded px-2 py-1"
                      >
                        <option value="admin">Admin</option>
                        <option value="contributor">Contributor</option>
                        <option value="user">User</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}