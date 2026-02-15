import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, Trash2, Copy, CheckCircle2, AlertCircle, Eye, EyeOff, Edit2, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const PLANS = {
  starter: { name: "Starter", maxUsers: 5, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-100", icon: "🚀", price: "$49/mois" },
  growth: { name: "Growth", maxUsers: 10, color: "from-emerald-500 to-emerald-600", bgColor: "bg-emerald-100", icon: "📈", price: "$99/mois" },
  pro: { name: "Pro", maxUsers: 25, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-100", icon: "⭐", price: "$199/mois" },
  custom: { name: "Custom", maxUsers: 50, color: "from-pink-500 to-rose-600", bgColor: "bg-pink-100", icon: "🎯", price: "Sur mesure" }
};

const PLAN_ORDER = ['starter', 'growth', 'pro', 'custom'];

export default function WorkspaceAccessManagement({ currentRole }) {
  const [users, setUsers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('pro');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [hiddenEmails, setHiddenEmails] = useState(new Set());
   const [editingUser, setEditingUser] = useState(null);
   const [newRole, setNewRole] = useState(null);
   const [userToDelete, setUserToDelete] = useState(null);
   const [changingPlan, setChangingPlan] = useState(false);

  const canManage = currentRole === 'admin' || currentRole === 'contributor';
  const maxUsers = PLANS[currentPlan].maxUsers;
  const currentUsers = users.length;
  const canAddMore = currentUsers < maxUsers;

  // Load users and plan info
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Load active users from User entity
        const allUsers = await base44.entities.User.list();
        setUsers(allUsers || []);

        // Load pending invitations
        const invitations = await base44.entities.InvitationToken.filter({
          status: 'pending'
        });
        setPendingInvitations(invitations || []);

         // Initialize emails as visible by default
         setHiddenEmails(new Set());
        
        // Load plan from team config or assume pro for testing
        const configs = await base44.entities.TeamConfiguration.list();
        if (configs.length > 0) {
          setCurrentPlan(configs[0].plan || 'pro');
        } else {
          setCurrentPlan('pro');
        }
      } catch (error) {
        console.error('Error loading workspace data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentRole]);

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
      // Generate invitation token and send email
      await base44.functions.invoke('generateInvitationToken', {
        inviteeEmail: inviteEmail,
        inviteRole: inviteRole
      });
      
      setMessage({ type: 'success', text: `Invitation envoyée à ${inviteEmail}` });
      setInviteEmail('');
      setInviteRole('user');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'invitation' });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = (userId) => {
    if (!canManage) return;

    const userToRemove = users.find(u => u.id === userId);

    // Contributeur ne peut pas supprimer les admins
    if (currentRole === 'contributor' && userToRemove?.role === 'admin') {
      toast.error('Les contributeurs ne peuvent pas supprimer les admins');
      return;
    }

    setUserToDelete(userToRemove);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await base44.functions.invoke('deleteUser', { userId: userToDelete.id });
      setUsers(users.filter(u => u.id !== userToDelete.id));
      toast.success('Utilisateur supprimé avec succès');
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const canToggleEmail = currentRole === 'admin' || currentRole === 'contributor';

  const canEditUserRole = (user) => {
    // Only true platform admins can edit roles
    if (currentRole !== 'admin') return false;
    if (user.email === currentUser?.email) return false;

    return true;
  };

  const handleEditRole = async () => {
    if (!editingUser || !newRole) return;

    try {
      const response = await base44.functions.invoke('updateUserRole', { 
        userId: editingUser.id, 
        userEmail: editingUser.email,
        newRole 
      });

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      // Update local state
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u));
      toast.success('Rôle mis à jour avec succès');
      setEditingUser(null);
      setNewRole(null);
      
      // Force refresh from database to ensure persistence
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Update role error:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour du rôle');
    }
  };

  const handleChangePlan = async (newPlan) => {
    if (currentRole !== 'admin') {
      toast.error('Seuls les admins peuvent changer de plan');
      return;
    }

    if (newPlan === currentPlan) return;

    setChangingPlan(true);
    try {
      const response = await base44.functions.invoke('changePlanCheckout', { newPlan });
      
      if (response.data.requiresPayment) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        // Plan changed immediately
        toast.success(response.data.message);
        setCurrentPlan(newPlan);
        
        // Reload data to reflect changes
        const configs = await base44.entities.TeamConfiguration.list();
        if (configs.length > 0) {
          setCurrentPlan(configs[0].plan || 'pro');
        }
      }
    } catch (error) {
      console.error('Change plan error:', error);
      toast.error('Erreur lors du changement de plan');
    } finally {
      setChangingPlan(false);
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
                  {currentUsers} / {maxUsers} collaborateurs embarqués
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
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        if (canToggleEmail) {
                          setHiddenEmails(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(user.id)) {
                              newSet.delete(user.id);
                            } else {
                              newSet.add(user.id);
                            }
                            return newSet;
                          });
                        }
                      }}
                    >
                       <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                         {user.email?.charAt(0).toUpperCase() || '?'}
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {user.role === 'admin' ? '🔑 Admin' : user.role === 'contributor' ? '👤 Contributeur' : '👁️ Membre'}
                          </p>
                        </div>
                     </div>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-xs">
                         {user.role === 'admin' ? '🔑 Admin' : user.role === 'contributor' ? '👤 Contributeur' : '👁️ Membre'}
                       </Badge>
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
            {Object.entries(PLANS).map(([key, plan]) => {
              const currentIndex = PLAN_ORDER.indexOf(currentPlan);
              const planIndex = PLAN_ORDER.indexOf(key);
              const isUpgrade = planIndex > currentIndex;
              const isDowngrade = planIndex < currentIndex;
              const isCurrent = currentPlan === key;
              const isCustom = key === 'custom';

              return (
                <div key={key} className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">{plan.icon} {plan.name}</p>
                      {isCurrent && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Actuel
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Jusqu'à {plan.maxUsers} utilisateurs</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">{plan.price}</p>
                  </div>
                  {currentRole === 'admin' && !isCurrent && !isCustom && (
                    <Button
                      size="sm"
                      onClick={() => handleChangePlan(key)}
                      disabled={changingPlan}
                      variant={isUpgrade ? "default" : "outline"}
                      className={isUpgrade ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white" : ""}
                    >
                      {changingPlan ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {isUpgrade ? (
                            <>
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Upgrade
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-4 h-4 mr-1" />
                              Downgrade
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  )}
                  {isCustom && (
                    <Badge variant="outline" className="text-xs">
                      Nous contacter
                    </Badge>
                  )}
                </div>
              );
            })}
            </CardContent>
            </Card>
            </motion.div>

            {/* Edit Role Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => {
              if (!open) {
                setEditingUser(null);
                setNewRole(null);
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le rôle</DialogTitle>
                  <DialogDescription>
                    Changer le rôle de {editingUser?.full_name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={newRole || ''} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
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
                    <Button variant="outline" onClick={() => {
                      setEditingUser(null);
                      setNewRole(null);
                    }}>
                      Annuler
                    </Button>
                    <Button onClick={handleEditRole} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Confirmer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete User Alert Dialog */}
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer <strong>{userToDelete?.full_name}</strong> ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2">
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
                    Supprimer
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
            </div>
            );
            }