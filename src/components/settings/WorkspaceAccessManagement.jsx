import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, Trash2, Copy, CheckCircle2, AlertCircle, Eye, EyeOff, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PLANS = {
  starter: { name: "Starter", maxUsers: 5, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-100", icon: "🚀" },
  growth: { name: "Growth", maxUsers: 10, color: "from-emerald-500 to-emerald-600", bgColor: "bg-emerald-100", icon: "📈" },
  pro: { name: "Pro", maxUsers: 25, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-100", icon: "⭐" },
  custom: { name: "Custom", maxUsers: 50, color: "from-pink-500 to-rose-600", bgColor: "bg-pink-100", icon: "🎯" }
};

export default function WorkspaceAccessManagement({ currentRole }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('starter');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [hiddenEmails, setHiddenEmails] = useState(new Set());
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState(null);

  const canManage = currentRole === 'admin' || currentRole === 'contributor';
  const maxUsers = PLANS[currentPlan].maxUsers;
  const currentUsers = users.length;
  const canAddMore = currentUsers < maxUsers;

  // Load users and plan info
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Load all users (in real app, fetch actual user list)
        const allUsers = await base44.entities.User.list();
        setUsers(allUsers || []);
        
        // Initialize all emails as hidden by default
        const allHidden = new Set(allUsers?.map(u => u.id) || []);
        setHiddenEmails(allHidden);
        
        // Load plan from team config or assume starter
        const configs = await base44.entities.TeamConfiguration.list();
        if (configs.length > 0) {
          // Extract plan from config if stored, otherwise default to starter
          setCurrentPlan(configs[0].plan || 'starter');
        }
      } catch (error) {
        console.error('Error loading workspace data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) {
      setMessage({ type: 'error', text: 'Email requis' });
      return;
    }

    if (!canAddMore) {
      setMessage({ type: 'error', text: `Limite ${currentPlan} atteinte (${maxUsers} utilisateurs)` });
      return;
    }

    setInviting(true);
    try {
      // Invite user through Base44
      await base44.users.inviteUser(inviteEmail, inviteRole);
      
      setMessage({ type: 'success', text: `Invitation envoyée à ${inviteEmail}` });
      setInviteEmail('');
      setInviteRole('user');
      
      // Refresh users list
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'invitation' });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!canManage) return;
    
    const userToRemove = users.find(u => u.id === userId);
    
    // Contributeur ne peut pas supprimer les admins
    if (currentRole === 'contributor' && userToRemove?.role === 'admin') {
      setMessage({ type: 'error', text: 'Les contributeurs ne peuvent pas supprimer les admins' });
      return;
    }
    
    try {
      const confirmed = window.confirm('Confirmer la suppression de cet utilisateur?');
      if (confirmed) {
        setMessage({ type: 'success', text: 'Utilisateur supprimé' });
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const canToggleEmail = currentRole === 'admin' || currentRole === 'contributor';

  const canEditUserRole = (user) => {
    if (!canManage || user.email === currentUser?.email) return false;
    
    // Admin peut éditer tous les rôles
    if (currentRole === 'admin') return true;
    
    // Contributeur peut éditer seulement les membres simples
    if (currentRole === 'contributor' && user.role === 'user') return true;
    
    return false;
  };

  const handleEditRole = async () => {
    if (!editingUser || !newRole) return;
    
    try {
      // Update user role in Base44
      await base44.entities.User.update(editingUser.id, { role: newRole });
      
      // Update local state
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u));
      setMessage({ type: 'success', text: 'Rôle mis à jour avec succès' });
      setEditingUser(null);
      setNewRole(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du rôle' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const plan = PLANS[currentPlan];

  return (
    <div className="space-y-6">
      {/* Plan Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color} shadow-lg`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Gestion de l'espace de travail</CardTitle>
                <CardDescription className="text-xs">
                  Inviter et gérer les accès aux membres de votre équipe
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className={`bg-gradient-to-r ${plan.color} text-white text-sm px-3 py-1`}>
                  {plan.icon} {plan.name}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">Capacité d'utilisateurs</p>
                <p className="text-xs text-slate-500 mt-1">
                  {currentUsers} / {maxUsers} emplacements utilisés
                </p>
              </div>
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${plan.color}`}
                  style={{ width: `${Math.min((currentUsers / maxUsers) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Invite Section */}
      {canManage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inviter un nouveau membre</CardTitle>
              <CardDescription className="text-xs">
                {canAddMore 
                  ? `Vous pouvez ajouter ${maxUsers - currentUsers} utilisateur(s) de plus`
                  : `Limite d'utilisateurs atteinte pour le plan ${plan.name}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="Email de l'utilisateur..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={!canAddMore || inviting}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole} disabled={!canAddMore || inviting}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Membre</SelectItem>
                      <SelectItem value="contributor">Contributeur</SelectItem>
                      {currentRole === 'admin' && (
                        <SelectItem value="admin">Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleInvite}
                    disabled={!canAddMore || inviting || !inviteEmail}
                    className={`bg-gradient-to-r ${plan.color} text-white w-full sm:w-auto`}
                  >
                    {inviting ? 'Envoi...' : 'Inviter'}
                  </Button>
                </div>

                {message && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <p className="text-sm">{message.text}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membres de l'équipe ({users.length})</CardTitle>
            <CardDescription className="text-xs">
              Gérez les accès et les rôles des membres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Aucun membre pour le moment
                </p>
              ) : (
                users.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                        {user.full_name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-slate-500">
                            {hiddenEmails.has(user.id) ? '••••••••••' : user.email}
                          </p>
                          {canToggleEmail && (
                            <button
                              onClick={() => {
                                setHiddenEmails(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(user.id)) {
                                    newSet.delete(user.id);
                                  } else {
                                    newSet.add(user.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {hiddenEmails.has(user.id) ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {canEditUserRole(user) ? (
                         <button
                           onClick={() => {
                             setEditingUser(user);
                             setNewRole(user.role);
                           }}
                           className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                         >
                           <Badge variant="outline" className="text-xs">
                             {user.role === 'admin' ? '🔑 Admin' : user.role === 'contributor' ? '👤 Contributeur' : '👁️ Membre'}
                           </Badge>
                           <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                         </button>
                       ) : (
                         <Badge variant="outline" className="text-xs">
                           {user.role === 'admin' ? '🔑 Admin' : user.role === 'contributor' ? '👤 Contributeur' : '👁️ Membre'}
                         </Badge>
                       )}
                       {canManage && user.email !== currentUser?.email && (
                         <Button 
                           variant="ghost" 
                           size="icon"
                           onClick={() => handleRemoveUser(user.id)}
                           className="text-red-600 hover:text-red-700 hover:bg-red-50"
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       )}
                     </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="text-base">À propos des plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(PLANS).map(([key, plan]) => (
              <div key={key} className="flex items-start justify-between p-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{plan.icon} {plan.name}</p>
                  <p className="text-xs text-slate-500">Jusqu'à {plan.maxUsers} utilisateurs</p>
                </div>
                {currentPlan === key && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Actuel
                  </Badge>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
              <p>💡 <strong>Pour augmenter votre limite :</strong> Accédez à votre espace admin Base44 pour mettre à niveau votre plan</p>
            </div>
            </CardContent>
            </Card>
            </motion.div>

            {/* Edit Role Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent>
            <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
             Changer le rôle de {editingUser?.full_name}
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="user">Membre</SelectItem>
               <SelectItem value="contributor">Contributeur</SelectItem>
               {currentRole === 'admin' && (
                 <SelectItem value="admin">Admin</SelectItem>
               )}
             </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setEditingUser(null)}>
               Annuler
             </Button>
             <Button onClick={handleEditRole} className="bg-blue-600 hover:bg-blue-700 text-white">
               Confirmer
             </Button>
            </div>
            </div>
            </DialogContent>
            </Dialog>
            </div>
            );
            }