import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Settings, DollarSign,
  Plus, Edit3, Trash2, X, Eye, EyeOff, Key,
  RefreshCw, User
} from 'lucide-react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { toast } from 'react-hot-toast';

const USER_LEVELS = ['ADMIN', 'VENDEDOR', 'TECNICO'];

export default function Configuracoes() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [loading, setLoading] = useState(false);
  
  // Estados simplificados
  const [usuarios, setUsuarios] = useState([]);
  const [commissions, setCommissions] = useState([]);
  
  // Modais
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Formulário de usuário simplificado
  const [userForm, setUserForm] = useState({
    email: '',
    displayName: '',
    password: '',
    level: 'VENDEDOR',
    active: true
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Formulário de comissão simplificado
  const [commissionForm, setCommissionForm] = useState({
    level: 'VENDEDOR',
    percentage: 5,
    active: true
  });

  const [loadingUsers, setLoadingUsers] = useState(false);

  const tabs = [
    { id: 'usuarios', name: 'Usuários', icon: Users },
    { id: 'comissoes', name: 'Comissões', icon: DollarSign },
    { id: 'sistema', name: 'Sistema', icon: Settings }
  ];

  // Carregar dados
  useEffect(() => {
    if (activeTab === 'usuarios') loadUsers();
    if (activeTab === 'comissoes') loadCommissions();
  }, [activeTab]);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(usersList);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'commissions'), orderBy('level'));
      const querySnapshot = await getDocs(q);
      const commissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommissions(commissionsData);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm({ ...userForm, password });
  };

  const saveUser = async () => {
    if (!userForm.email || !userForm.displayName || (!userForm.password && !editingItem)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Salvando usuário:', userForm.email);

      if (editingItem) {
        // Editando usuário existente
        const userData = {
          displayName: userForm.displayName,
          level: userForm.level,
          active: userForm.active,
          updatedAt: new Date(),
          updatedBy: user.uid
        };
        
        await updateDoc(doc(db, 'users', editingItem.id), userData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criando novo usuário
        console.log('🔄 Criando usuário no Firebase Auth:', userForm.email);
        
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userForm.email, 
          userForm.password
        );
        
        console.log('✅ Usuário criado no Firebase Auth:', userCredential.user.uid);
        
        const userData = {
          uid: userCredential.user.uid,
          email: userForm.email,
          displayName: userForm.displayName,
          level: userForm.level,
          active: userForm.active,
          createdAt: new Date(),
          createdBy: user.uid,
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), userData);
        
        console.log('✅ Dados salvos no Firestore');
        toast.success('Usuário criado com sucesso!');
      }

      setShowUserModal(false);
      setEditingItem(null);
      setUserForm({
        email: '',
        displayName: '',
        password: '',
        level: 'VENDEDOR',
        active: true
      });
      setShowPassword(false);
      loadUsers();
      
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está em uso');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Senha muito fraca. Use pelo menos 6 caracteres');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('E-mail inválido');
      } else {
        toast.error('Erro ao salvar usuário: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCommission = async () => {
    try {
      setLoading(true);
      const commissionData = {
        ...commissionForm,
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      if (editingItem) {
        await updateDoc(doc(db, 'commissions', editingItem.id), commissionData);
        toast.success('Comissão atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'commissions'), {
          ...commissionData,
          createdAt: new Date(),
          createdBy: user.uid
        });
        toast.success('Comissão criada com sucesso!');
      }

      setShowCommissionModal(false);
      setEditingItem(null);
      setCommissionForm({
        level: 'VENDEDOR',
        percentage: 5,
        active: true
      });
      loadCommissions();
    } catch (error) {
      console.error('Erro ao salvar comissão:', error);
      toast.error('Erro ao salvar comissão');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (collection_name, id, itemName) => {
    if (!confirm(`Tem certeza que deseja excluir ${itemName}?`)) return;

    try {
      await deleteDoc(doc(db, collection_name, id));
      toast.success('Item excluído com sucesso!');
      
      if (collection_name === 'users') loadUsers();
      if (collection_name === 'commissions') loadCommissions();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir item');
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Configurações do Sistema
        </h1>
        <p className="text-gray-400 mt-2">
          Gerencie usuários e configurações gerais
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-8"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'usuarios' && renderUsersTab()}
          {activeTab === 'comissoes' && renderCommissionsTab()}
          {activeTab === 'sistema' && renderSystemTab()}
        </motion.div>
      </AnimatePresence>

      {/* Modais */}
      <AnimatePresence>
        {showUserModal && (
          <UserModal
            user={editingItem}
            formData={userForm}
            setFormData={setUserForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSave={saveUser}
            onClose={() => {
              setShowUserModal(false);
              setEditingItem(null);
              setUserForm({
                email: '',
                displayName: '',
                password: '',
                level: 'VENDEDOR',
                active: true
              });
            }}
            generatePassword={generatePassword}
            loading={loading}
          />
        )}

        {showCommissionModal && (
          <CommissionModal
            commission={editingItem}
            formData={commissionForm}
            setFormData={setCommissionForm}
            onSave={saveCommission}
            onClose={() => {
              setShowCommissionModal(false);
              setEditingItem(null);
              setCommissionForm({
                level: 'VENDEDOR',
                percentage: 5,
                active: true
              });
            }}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  );

  function renderUsersTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Novo Usuário
          </motion.button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-pink-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {usuarios.map((usuario, index) => (
                <motion.div
                  key={usuario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{usuario.displayName}</h3>
                      <p className="text-sm text-gray-400">{usuario.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          usuario.level === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                          usuario.level === 'VENDEDOR' ? 'bg-green-500/20 text-green-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {usuario.level}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          usuario.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {usuario.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(usuario);
                        setUserForm({
                          email: usuario.email,
                          displayName: usuario.displayName,
                          password: '',
                          level: usuario.level,
                          active: usuario.active
                        });
                        setShowUserModal(true);
                      }}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem('users', usuario.id, usuario.displayName)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderCommissionsTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Comissões por Função</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCommissionModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Nova Comissão
          </motion.button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commissions.map((commission, index) => (
              <motion.div
                key={commission.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-700/50 rounded-lg p-6 border border-slate-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">{commission.level}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(commission);
                        setCommissionForm(commission);
                        setShowCommissionModal(true);
                      }}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem('commissions', commission.id, commission.level)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {commission.percentage}%
                </div>
                <p className="text-gray-400 text-sm">Comissão por venda</p>
                <div className={`mt-3 text-xs px-2 py-1 rounded inline-block ${
                  commission.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {commission.active ? 'Ativa' : 'Inativa'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderSystemTab() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Versão do Sistema</h4>
                  <p className="text-gray-400">IARA HUB v2.0</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Banco de Dados</h4>
                  <p className="text-gray-400">Firebase Firestore</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Configurações Gerais</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">Modo de Desenvolvimento</h4>
                    <p className="text-gray-400 text-sm">Logs detalhados e debug ativo</p>
                  </div>
                  <div className="text-green-400">Ativo</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">Backup Automático</h4>
                    <p className="text-gray-400 text-sm">Dados salvos automaticamente no Firebase</p>
                  </div>
                  <div className="text-green-400">Ativo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Modal de Usuário Simplificado
function UserModal({ user, formData, setFormData, showPassword, setShowPassword, onSave, onClose, generatePassword, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Nome do usuário"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!user}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
              placeholder="email@exemplo.com"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Key className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Função
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {USER_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-600 text-pink-600 focus:ring-pink-500"
            />
            <label htmlFor="active" className="text-sm text-gray-300">
              Usuário ativo
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              user ? 'Atualizar' : 'Criar'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Modal de Comissão Simplificado
function CommissionModal({ commission, formData, setFormData, onSave, onClose, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {commission ? 'Editar Comissão' : 'Nova Comissão'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Função
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {USER_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Percentual de Comissão (%)
            </label>
            <input
              type="number"
              value={formData.percentage}
              onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="5"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-600 text-pink-600 focus:ring-pink-500"
            />
            <label htmlFor="active" className="text-sm text-gray-300">
              Comissão ativa
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              commission ? 'Atualizar' : 'Criar'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}