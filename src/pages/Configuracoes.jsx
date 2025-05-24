import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { PERFORMANCE_CONFIG } from '../config/performance';
import { 
  Users, Settings, Shield, Database, DollarSign, Building2,
  Plus, Edit3, Trash2, Save, X, Eye, EyeOff, Key, Download,
  Upload, RefreshCw, AlertTriangle, Check, Star, UserCheck,
  Lock, Unlock, Search, Filter, MoreVertical, Crown, UserX, Copy
} from 'lucide-react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { toast } from 'react-hot-toast';

const USER_LEVELS = ['ADMIN', 'VENDEDOR', 'TECNICO', 'MARKETING', 'POS_VENDA'];

const PERMISSIONS = {
  'dashboard': 'Acessar Dashboard',
  'products.view': 'Visualizar Produtos',
  'products.create': 'Criar Produtos',
  'products.edit': 'Editar Produtos',
  'products.delete': 'Excluir Produtos',
  'services.view': 'Visualizar Serviços',
  'services.create': 'Criar Serviços',
  'services.edit': 'Editar Serviços',
  'services.delete': 'Excluir Serviços',
  'sales.view': 'Visualizar Vendas',
  'sales.create': 'Criar Vendas',
  'sales.edit': 'Editar Vendas',
  'sales.delete': 'Excluir Vendas',
  'clients.view': 'Visualizar Clientes',
  'clients.create': 'Criar Clientes',
  'clients.edit': 'Editar Clientes',
  'clients.delete': 'Excluir Clientes',
  'financial.view': 'Visualizar Financeiro',
  'financial.edit': 'Editar Financeiro',
  'reports.view': 'Visualizar Relatórios',
  'reports.export': 'Exportar Relatórios',
  'settings.view': 'Visualizar Configurações',
  'settings.edit': 'Editar Configurações',
  'users.manage': 'Gerenciar Usuários',
  'commissions.manage': 'Gerenciar Comissões',
  'suppliers.manage': 'Gerenciar Fornecedores',
  'backup.manage': 'Gerenciar Backup/Segurança'
};

export default function Configuracoes() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [loading, setLoading] = useState(false);
  
  // Estados para cada seção
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [services, setServices] = useState([]);
  const [backupSettings, setBackupSettings] = useState({});
  
  // Modais
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Formulários
  const [userForm, setUserForm] = useState({
    email: '',
    displayName: '',
    password: '',
    level: 'VENDEDOR',
    permissions: [],
    active: true
  });
  const [passwordMode, setPasswordMode] = useState('manual'); // 'manual' ou 'auto'
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para o sistema de permissões
  const [selectedUser, setSelectedUser] = useState(null);
  const [tempPermissions, setTempPermissions] = useState([]);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    cnpj: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    products: [],
    active: true
  });

  const [commissionForm, setCommissionForm] = useState({
    level: 'VENDEDOR',
    percentage: 0,
    minValue: 0,
    maxValue: 0,
    type: 'percentage', // percentage, fixed
    active: true
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    cost: 0,
    labor: 0,
    estimatedTime: '',
    warranty: '',
    active: true
  });

  const tabs = [
    { id: 'usuarios', name: 'Usuários', icon: Users, color: 'text-blue-400' },
    { id: 'permissoes', name: 'Permissões', icon: Shield, color: 'text-green-400' },
    { id: 'servicos', name: 'Serviços', icon: Settings, color: 'text-orange-400' },
    { id: 'comissoes', name: 'Comissões', icon: DollarSign, color: 'text-yellow-400' },
    { id: 'fornecedores', name: 'Fornecedores', icon: Building2, color: 'text-purple-400' },
    { id: 'seguranca', name: 'Segurança', icon: Lock, color: 'text-red-400' },
    { id: 'backup', name: 'Backup', icon: Database, color: 'text-cyan-400' }
  ];

  // Carregar dados
  useEffect(() => {
    if (activeTab === 'usuarios') loadUsers();
    if (activeTab === 'fornecedores') loadSuppliers();
    if (activeTab === 'comissoes') loadCommissions();
    if (activeTab === 'servicos') loadServices();
  }, [activeTab]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'users'), 
        orderBy('createdAt', 'desc'),
        limit(PERFORMANCE_CONFIG.MAX_FIREBASE_QUERY_LIMIT)
      );
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      console.log(`👥 Carregados ${usersData.length} usuários`);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'suppliers'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const suppliersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

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

  const loadServices = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'services'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesData);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar senha automática
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm(prev => ({ ...prev, password }));
    setShowPassword(true);
    toast.success('Senha gerada automaticamente!');
  };

  // Funções para o sistema de permissões
  const selectAllPermissions = () => {
    setTempPermissions(Object.keys(PERMISSIONS));
  };

  const clearAllPermissions = () => {
    setTempPermissions([]);
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', selectedUser.id), {
        permissions: tempPermissions,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      // Atualizar lista local
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, permissions: tempPermissions }
          : u
      ));
      
      toast.success('Permissões atualizadas com sucesso!');
      setSelectedUser(null);
      setTempPermissions([]);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setLoading(false);
    }
  };

  // Função para garantir comissão ao criar usuário
  const createUserCommission = async (userId, userLevel) => {
    try {
      // Verificar se já existe comissão para este nível
      const existingCommission = commissions.find(c => c.level === userLevel);
      
      if (!existingCommission) {
        // Criar comissão padrão baseada no nível
        const defaultCommissions = {
          'VENDEDOR': { percentage: 5, type: 'percentage' },
          'TECNICO': { percentage: 10, type: 'percentage' },
          'ADMIN': { percentage: 0, type: 'percentage' },
          'MARKETING': { percentage: 3, type: 'percentage' },
          'POS_VENDA': { percentage: 2, type: 'percentage' }
        };

        const defaultComm = defaultCommissions[userLevel] || { percentage: 0, type: 'percentage' };
        
        await addDoc(collection(db, 'commissions'), {
          level: userLevel,
          userId: userId,
          percentage: defaultComm.percentage,
          type: defaultComm.type,
          minValue: 0,
          maxValue: 10000,
          active: true,
          createdAt: new Date(),
          createdBy: user.uid
        });
        
        toast.success(`Comissão padrão criada para ${userLevel}: ${defaultComm.percentage}%`);
      }
    } catch (error) {
      console.error('Erro ao criar comissão do usuário:', error);
    }
  };

  // Funções CRUD para usuários
  const saveUser = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Iniciando criação de usuário:', {
        email: userForm.email,
        displayName: userForm.displayName,
        level: userForm.level,
        isEditing: !!editingItem
      });
      
      // Validações
      if (!userForm.email || !userForm.displayName) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (!editingItem && !userForm.password) {
        toast.error('Senha é obrigatória para novos usuários');
        return;
      }

      let savedUserId;

      if (editingItem) {
        // Editando usuário existente - apenas atualizar Firestore
        const userData = {
          ...userForm,
          updatedAt: new Date(),
          updatedBy: user.uid
        };
        
        // Remover senha do update se estiver vazia (não alterar)
        if (!userData.password) {
          delete userData.password;
        }
        
        await updateDoc(doc(db, 'users', editingItem.id), userData);
        savedUserId = editingItem.id;
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criando novo usuário - primeiro criar no Firebase Auth
        console.log('🔄 Criando usuário no Firebase Auth:', userForm.email);
        
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userForm.email, 
          userForm.password
        );
        
        console.log('✅ Usuário criado no Firebase Auth:', userCredential.user.uid);
        
        // Depois salvar no Firestore com o UID do Auth
        const userData = {
          uid: userCredential.user.uid,
          email: userForm.email,
          displayName: userForm.displayName,
          level: userForm.level,
          permissions: userForm.permissions || [],
          active: userForm.active,
          createdAt: new Date(),
          createdBy: user.uid,
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), userData);
        savedUserId = userCredential.user.uid;
        
        console.log('✅ Dados salvos no Firestore');
        toast.success('Usuário criado com sucesso! Agora pode fazer login.');
        
        // Criar comissão automática para vendedores e técnicos
        if (['VENDEDOR', 'TECNICO'].includes(userForm.level)) {
          await createUserCommission(savedUserId, userForm.level);
        }
      }

      setShowUserModal(false);
      setEditingItem(null);
      setUserForm({
        email: '',
        displayName: '',
        password: '',
        level: 'VENDEDOR',
        permissions: [],
        active: true
      });
      setPasswordMode('manual');
      setShowPassword(false);
      loadUsers();
      
      // Recarregar comissões se necessário
      if (['VENDEDOR', 'TECNICO'].includes(userForm.level)) {
        loadCommissions();
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      
      let message = 'Erro ao salvar usuário';
      
      // Tratar erros específicos do Firebase Auth
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            message = 'Este email já está em uso no sistema';
            break;
          case 'auth/invalid-email':
            message = 'Email inválido';
            break;
          case 'auth/weak-password':
            message = 'A senha deve ter pelo menos 6 caracteres';
            break;
          case 'auth/operation-not-allowed':
            message = 'Operação não permitida. Verifique as configurações do Firebase';
            break;
          default:
            message = `Erro do Firebase: ${error.message}`;
        }
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Funções CRUD para fornecedores
  const saveSupplier = async () => {
    try {
      setLoading(true);
      const supplierData = {
        ...supplierForm,
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      if (editingItem) {
        await updateDoc(doc(db, 'suppliers', editingItem.id), supplierData);
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'suppliers'), {
          ...supplierData,
          createdAt: new Date(),
          createdBy: user.uid
        });
        toast.success('Fornecedor criado com sucesso!');
      }

      setShowSupplierModal(false);
      setEditingItem(null);
      setSupplierForm({
        name: '',
        cnpj: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        products: [],
        active: true
      });
      loadSuppliers();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  // Funções CRUD para comissões
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
        percentage: 0,
        minValue: 0,
        maxValue: 0,
        type: 'percentage',
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

  // Funções CRUD para serviços
  const saveService = async () => {
    try {
      setLoading(true);
      
      // Calcular margem de lucro
      const profit = serviceForm.price - serviceForm.cost;
      const profitMargin = serviceForm.price > 0 ? (profit / serviceForm.price) * 100 : 0;
      
      const serviceData = {
        ...serviceForm,
        profit,
        profitMargin,
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      if (editingItem) {
        await updateDoc(doc(db, 'services', editingItem.id), serviceData);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: new Date(),
          createdBy: user.uid
        });
        toast.success('Serviço criado com sucesso!');
      }

      setShowServiceModal(false);
      setEditingItem(null);
      setServiceForm({
        name: '',
        description: '',
        category: '',
        price: 0,
        cost: 0,
        labor: 0,
        estimatedTime: '',
        warranty: '',
        active: true
      });
      loadServices();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast.error('Erro ao salvar serviço');
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
      if (collection_name === 'suppliers') loadSuppliers();
      if (collection_name === 'commissions') loadCommissions();
      if (collection_name === 'services') loadServices();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Header com botão adicionar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
          <p className="text-white/60">Controle total dos usuários do sistema</p>
        </div>
        <motion.button
          onClick={() => {
            setEditingItem(null);
            setUserForm({
              email: '',
              displayName: '',
              password: '',
              level: 'VENDEDOR',
              permissions: [],
              active: true
            });
            setPasswordMode('manual');
            setShowPassword(false);
            setShowUserModal(true);
          }}
          className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Usuário</span>
        </motion.button>
      </div>

      {/* Lista de usuários */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FF2C68]/10">
              <tr>
                <th className="px-6 py-4 text-left text-white font-medium">Usuário</th>
                <th className="px-6 py-4 text-left text-white font-medium">Nível</th>
                <th className="px-6 py-4 text-left text-white font-medium">Status</th>
                <th className="px-6 py-4 text-left text-white font-medium">Criado em</th>
                <th className="px-6 py-4 text-center text-white font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF2C68]/20">
              {users.slice(0, PERFORMANCE_CONFIG.MAX_ITEMS_PER_PAGE).map((user_item) => (
                <tr key={user_item.id} className="hover:bg-[#FF2C68]/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#FF2C68] rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user_item.displayName}</p>
                        <p className="text-white/60 text-sm">{user_item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      user_item.level === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                      user_item.level === 'VENDEDOR' ? 'bg-green-500/20 text-green-400' :
                      user_item.level === 'TECNICO' ? 'bg-blue-500/20 text-blue-400' :
                      user_item.level === 'MARKETING' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {user_item.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      user_item.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user_item.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {user_item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(user_item);
                          setUserForm({...user_item, password: ''}); // Limpar senha para edição
                          setPasswordMode('manual');
                          setShowPassword(false);
                          setShowUserModal(true);
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('users', user_item.id, user_item.displayName)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhum usuário encontrado</p>
            </div>
          )}
          
          {users.length > PERFORMANCE_CONFIG.MAX_ITEMS_PER_PAGE && (
            <div className="p-4 border-t border-[#FF2C68]/20 text-center">
              <p className="text-white/60 text-sm">
                📊 Mostrando {PERFORMANCE_CONFIG.MAX_ITEMS_PER_PAGE} de {users.length} usuários
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPermissionsTab = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Sistema de Permissões</h2>
            <p className="text-white/60">Configure permissões detalhadas por usuário</p>
          </div>
          
          {selectedUser && (
            <div className="flex items-center space-x-3">
              <button
                onClick={selectAllPermissions}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all duration-200"
              >
                Selecionar Todas
              </button>
              <button
                onClick={clearAllPermissions}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200"
              >
                Limpar Todas
              </button>
              <button
                onClick={savePermissions}
                disabled={loading}
                className="px-4 py-2 bg-[#FF2C68] text-white rounded-lg hover:bg-[#FF2C68]/80 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setTempPermissions([]);
                }}
                className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Seletor de usuário */}
        {!selectedUser ? (
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Selecione um usuário para editar permissões</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((userItem) => (
                <motion.button
                  key={userItem.id}
                  onClick={() => {
                    setSelectedUser(userItem);
                    setTempPermissions(userItem.permissions || []);
                  }}
                  className="p-4 bg-[#0D0C0C]/30 border border-[#FF2C68]/20 rounded-xl hover:border-[#FF2C68]/50 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#FF2C68] rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{userItem.displayName}</p>
                      <p className="text-white/60 text-sm">{userItem.level}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Usuário selecionado */}
            <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-[#FF2C68] rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUser.displayName}</h3>
                  <p className="text-white/60">{selectedUser.email} • {selectedUser.level}</p>
                </div>
              </div>
              
              <p className="text-white/80 mb-4">
                Permissões selecionadas: {tempPermissions.length} de {Object.keys(PERMISSIONS).length}
              </p>
            </div>

            {/* Grid de permissões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(PERMISSIONS).map(([key, description]) => (
                <motion.label
                  key={key}
                  className={`
                    flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                    ${tempPermissions.includes(key) 
                      ? 'bg-[#FF2C68]/10 border-[#FF2C68]/50' 
                      : 'bg-[#0D0C0C]/30 border-[#FF2C68]/20 hover:border-[#FF2C68]/40'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                >
                  <input
                    type="checkbox"
                    checked={tempPermissions.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempPermissions(prev => [...prev, key]);
                      } else {
                        setTempPermissions(prev => prev.filter(p => p !== key));
                      }
                    }}
                    className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-[#FF2C68]" />
                      <span className="text-white font-medium">{description}</span>
                    </div>
                    <p className="text-white/60 text-sm mt-1">{key}</p>
                  </div>
                </motion.label>
              ))}
            </div>
                      </div>
          )}
        </div>
      );

  const renderCommissionsTab = () => {
    // Filtrar usuários que são vendedores ou técnicos
    const vendedores = users.filter(u => u.level === 'VENDEDOR' && u.active);
    const tecnicos = users.filter(u => u.level === 'TECNICO' && u.active);
    
    return (
      <div className="space-y-6">
        {/* Header com botão adicionar */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Sistema de Comissões</h2>
            <p className="text-white/60">Configure comissões por nível de usuário</p>
          </div>
          <motion.button
            onClick={() => {
              setEditingItem(null);
              setCommissionForm({
                level: 'VENDEDOR',
                percentage: 0,
                minValue: 0,
                maxValue: 0,
                type: 'percentage',
                active: true
              });
              setShowCommissionModal(true);
            }}
            className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Nova Comissão</span>
          </motion.button>
        </div>

        {/* Cards informativos dos usuários ativos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendedores */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Vendedores Ativos</h3>
                <p className="text-green-400 text-sm">{vendedores.length} usuários • Comissão sobre vendas</p>
              </div>
            </div>
            
            {vendedores.length > 0 ? (
              <div className="space-y-2">
                {vendedores.map(vendedor => {
                  const comissao = commissions.find(c => c.level === 'VENDEDOR');
                  return (
                    <div key={vendedor.id} className="flex items-center justify-between p-3 bg-[#0D0C0C]/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{vendedor.displayName}</p>
                        <p className="text-white/60 text-sm">{vendedor.email}</p>
                      </div>
                      <div className="text-right">
                        {comissao ? (
                          <span className="text-green-400 font-medium">
                            {comissao.percentage}%
                          </span>
                        ) : (
                          <span className="text-yellow-400 text-sm">Sem comissão</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/60 text-center py-4">Nenhum vendedor ativo cadastrado</p>
            )}
          </div>

          {/* Técnicos */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Técnicos Ativos</h3>
                <p className="text-blue-400 text-sm">{tecnicos.length} usuários • Comissão sobre serviços</p>
              </div>
            </div>
            
            {tecnicos.length > 0 ? (
              <div className="space-y-2">
                {tecnicos.map(tecnico => {
                  const comissao = commissions.find(c => c.level === 'TECNICO');
                  return (
                    <div key={tecnico.id} className="flex items-center justify-between p-3 bg-[#0D0C0C]/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{tecnico.displayName}</p>
                        <p className="text-white/60 text-sm">{tecnico.email}</p>
                      </div>
                      <div className="text-right">
                        {comissao ? (
                          <span className="text-blue-400 font-medium">
                            {comissao.percentage}%
                          </span>
                        ) : (
                          <span className="text-yellow-400 text-sm">Sem comissão</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/60 text-center py-4">Nenhum técnico ativo cadastrado</p>
            )}
          </div>
        </div>

      {/* Lista de comissões */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FF2C68]/10">
              <tr>
                <th className="px-6 py-4 text-left text-white font-medium">Nível</th>
                <th className="px-6 py-4 text-left text-white font-medium">Tipo</th>
                <th className="px-6 py-4 text-left text-white font-medium">Percentual</th>
                <th className="px-6 py-4 text-left text-white font-medium">Valor Mín/Máx</th>
                <th className="px-6 py-4 text-left text-white font-medium">Status</th>
                <th className="px-6 py-4 text-center text-white font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF2C68]/20">
              {commissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-[#FF2C68]/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#FF2C68] rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        commission.level === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                        commission.level === 'VENDEDOR' ? 'bg-green-500/20 text-green-400' :
                        commission.level === 'TECNICO' ? 'bg-blue-500/20 text-blue-400' :
                        commission.level === 'MARKETING' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {commission.level}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      commission.type === 'percentage' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {commission.type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {commission.percentage}%
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    R$ {commission.minValue} - R$ {commission.maxValue}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      commission.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {commission.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(commission);
                          setCommissionForm(commission);
                          setShowCommissionModal(true);
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('commissions', commission.id, `Comissão ${commission.level}`)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {commissions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma comissão configurada</p>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  const renderSuppliersTab = () => (
    <div className="space-y-6">
      {/* Header com botão adicionar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Fornecedores</h2>
          <p className="text-white/60">Controle de parceiros e fornecedores</p>
        </div>
        <motion.button
          onClick={() => {
            setEditingItem(null);
            setSupplierForm({
              name: '',
              cnpj: '',
              contact: '',
              email: '',
              phone: '',
              address: '',
              products: [],
              active: true
            });
            setShowSupplierModal(true);
          }}
          className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          <span>Novo Fornecedor</span>
        </motion.button>
      </div>

      {/* Lista de fornecedores */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FF2C68]/10">
              <tr>
                <th className="px-6 py-4 text-left text-white font-medium">Fornecedor</th>
                <th className="px-6 py-4 text-left text-white font-medium">CNPJ</th>
                <th className="px-6 py-4 text-left text-white font-medium">Contato</th>
                <th className="px-6 py-4 text-left text-white font-medium">Status</th>
                <th className="px-6 py-4 text-center text-white font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF2C68]/20">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-[#FF2C68]/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#FF2C68] rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{supplier.name}</p>
                        <p className="text-white/60 text-sm">{supplier.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60">{supplier.cnpj}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white text-sm">{supplier.contact}</p>
                      <p className="text-white/60 text-xs">{supplier.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      supplier.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {supplier.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(supplier);
                          setSupplierForm(supplier);
                          setShowSupplierModal(true);
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('suppliers', supplier.id, supplier.name)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {suppliers.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhum fornecedor cadastrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-6">
      {/* Header com botão adicionar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Serviços</h2>
          <p className="text-white/60">Configure serviços técnicos, custos e lucros</p>
        </div>
        <motion.button
          onClick={() => {
            setEditingItem(null);
            setServiceForm({
              name: '',
              description: '',
              category: '',
              price: 0,
              cost: 0,
              labor: 0,
              estimatedTime: '',
              warranty: '',
              active: true
            });
            setShowServiceModal(true);
          }}
          className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Serviço</span>
        </motion.button>
      </div>

      {/* Lista de serviços */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6 hover:border-[#FF2C68]/50 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
          >
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{service.name}</h3>
                {service.category && (
                  <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded mt-1">
                    {service.category}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${service.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingItem(service);
                      setServiceForm(service);
                      setShowServiceModal(true);
                    }}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteItem('services', service.id, service.name)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {service.description && (
              <p className="text-white/60 text-sm mb-4 line-clamp-2">{service.description}</p>
            )}

            {/* Informações */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/60">Tempo:</span>
                  <p className="text-white">{service.estimatedTime || 'Não definido'}</p>
                </div>
                <div>
                  <span className="text-white/60">Garantia:</span>
                  <p className="text-white">{service.warranty || 'Não definido'}</p>
                </div>
              </div>

              {/* Valores */}
              <div className="bg-[#0D0C0C]/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Preço:</span>
                  <span className="text-green-400 font-medium">
                    R$ {(service.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Custo:</span>
                  <span className="text-red-400 font-medium">
                    R$ {(service.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Mão de Obra:</span>
                  <span className="text-blue-400 font-medium">
                    R$ {(service.labor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-white font-medium">Lucro:</span>
                  <span className="text-[#FF2C68] font-bold">
                    R$ {((service.price || 0) - (service.cost || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Margem:</span>
                  <span className="text-yellow-400 font-medium">
                    {service.price > 0 ? (((service.price - service.cost) / service.price) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 text-lg">Nenhum serviço cadastrado</p>
          <p className="text-white/40 text-sm mt-2">Comece criando seu primeiro serviço técnico</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
          <p className="text-white/60 mt-2">Gerencie todos os aspectos do IARA HUB</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#FF2C68] rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#FF2C68] text-white'
                : 'bg-[#0D0C0C]/30 text-white/70 hover:text-white hover:bg-[#0D0C0C]/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
                      {activeTab === 'usuarios' && renderUsersTab()}
            {activeTab === 'permissoes' && renderPermissionsTab()}
            {activeTab === 'servicos' && renderServicesTab()}
            {activeTab === 'comissoes' && renderCommissionsTab()}
            {activeTab === 'fornecedores' && renderSuppliersTab()}
          {activeTab === 'seguranca' && (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 text-[#FF2C68] mx-auto mb-4" />
              <p className="text-white">Seção de Segurança em desenvolvimento...</p>
            </div>
          )}
          {activeTab === 'backup' && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-[#FF2C68] mx-auto mb-4" />
              <p className="text-white">Seção de Backup em desenvolvimento...</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal de Fornecedor */}
      <AnimatePresence>
        {showSupplierModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSupplierModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-2xl border border-[#FF2C68] relative max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSupplierModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">
                  {editingItem ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h2>
                <p className="text-white/60">Configure os dados do fornecedor</p>
              </div>

              <div className="space-y-6">
                {/* Dados básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome da Empresa</label>
                    <input
                      type="text"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">CNPJ</label>
                    <input
                      type="text"
                      value={supplierForm.cnpj}
                      onChange={(e) => setSupplierForm({...supplierForm, cnpj: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Pessoa de Contato</label>
                    <input
                      type="text"
                      value={supplierForm.contact}
                      onChange={(e) => setSupplierForm({...supplierForm, contact: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Telefone</label>
                    <input
                      type="text"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="email@fornecedor.com"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Endereço</label>
                  <textarea
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Endereço completo"
                    rows="3"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supplierForm.active}
                      onChange={(e) => setSupplierForm({...supplierForm, active: e.target.checked})}
                      className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                    />
                    <span className="text-white">Fornecedor ativo</span>
                  </label>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setShowSupplierModal(false)}
                    className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveSupplier}
                    disabled={loading}
                    className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Comissão */}
      <AnimatePresence>
        {showCommissionModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommissionModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-lg border border-[#FF2C68] relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCommissionModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">
                  {editingItem ? 'Editar Comissão' : 'Nova Comissão'}
                </h2>
                <p className="text-white/60">Configure as regras de comissão</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Nível do Usuário</label>
                  <select
                    value={commissionForm.level}
                    onChange={(e) => setCommissionForm({...commissionForm, level: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                  >
                    {USER_LEVELS.map(level => (
                      <option key={level} value={level} className="bg-[#0D0C0C]">{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Tipo de Comissão</label>
                  <select
                    value={commissionForm.type}
                    onChange={(e) => setCommissionForm({...commissionForm, type: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                  >
                    <option value="percentage" className="bg-[#0D0C0C]">Percentual</option>
                    <option value="fixed" className="bg-[#0D0C0C]">Valor Fixo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    {commissionForm.type === 'percentage' ? 'Percentual (%)' : 'Valor Fixo (R$)'}
                  </label>
                  <input
                    type="number"
                    value={commissionForm.percentage}
                    onChange={(e) => setCommissionForm({...commissionForm, percentage: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Valor Mínimo (R$)</label>
                    <input
                      type="number"
                      value={commissionForm.minValue}
                      onChange={(e) => setCommissionForm({...commissionForm, minValue: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Valor Máximo (R$)</label>
                    <input
                      type="number"
                      value={commissionForm.maxValue}
                      onChange={(e) => setCommissionForm({...commissionForm, maxValue: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={commissionForm.active}
                      onChange={(e) => setCommissionForm({...commissionForm, active: e.target.checked})}
                      className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                    />
                    <span className="text-white">Comissão ativa</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setShowCommissionModal(false)}
                    className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveCommission}
                    disabled={loading}
                    className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Usuário */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-2xl border border-[#FF2C68] relative max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowUserModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">
                  {editingItem ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <p className="text-white/60">Configure os dados e permissões do usuário</p>
              </div>

              <div className="space-y-6">
                {/* Dados básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome</label>
                    <input
                      type="text"
                      value={userForm.displayName}
                      onChange={(e) => setUserForm({...userForm, displayName: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Nome do usuário"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                {/* Sistema de Senha */}
                <div className="bg-[#0D0C0C]/30 border border-[#FF2C68]/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#FF2C68]" />
                    <span>Configuração de Senha</span>
                  </h3>
                  
                  {editingItem && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        💡 Deixe o campo senha vazio para manter a senha atual
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="passwordMode"
                        value="manual"
                        checked={passwordMode === 'manual'}
                        onChange={(e) => setPasswordMode(e.target.value)}
                        className="w-4 h-4 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30"
                      />
                      <span className="text-white">Senha manual</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="passwordMode"
                        value="auto"
                        checked={passwordMode === 'auto'}
                        onChange={(e) => setPasswordMode(e.target.value)}
                        className="w-4 h-4 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30"
                      />
                      <span className="text-white">Gerar automática</span>
                    </label>
                  </div>

                  {passwordMode === 'manual' ? (
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        className="w-full px-4 py-3 pr-12 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder={editingItem ? "Nova senha (deixe vazio para manter)" : "Digite a senha"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="w-full px-4 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Gerar Nova Senha</span>
                      </button>
                      
                      {userForm.password && (
                        <div className="p-4 bg-[#FF2C68]/10 border border-[#FF2C68]/30 rounded-xl">
                          <p className="text-[#FF2C68] text-sm font-medium mb-2">Senha gerada:</p>
                          <div className="flex items-center space-x-2">
                            <code className="flex-1 text-white bg-[#0D0C0C]/50 px-3 py-2 rounded text-sm font-mono">
                              {showPassword ? userForm.password : '••••••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-2 text-white/60 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(userForm.password);
                                toast.success('Senha copiada!');
                              }}
                              className="p-2 text-white/60 hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-white/60 text-xs mt-2">
                            ⚠️ Copie e envie esta senha para o usuário. Ela não será exibida novamente.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Informação sobre o processo */}
                {!editingItem && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Processo de Criação de Usuário
                    </h4>
                    <div className="text-blue-300 text-sm space-y-1">
                      <p>• ✅ Cria conta no Firebase Authentication</p>
                      <p>• ✅ Salva perfil e permissões no Firestore</p>
                      <p>• ✅ Configura comissões automáticas (se aplicável)</p>
                      <p>• ✅ Usuário pode fazer login imediatamente</p>
                    </div>
                  </div>
                )}

                {/* Nível e Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Nível</label>
                    <select
                      value={userForm.level}
                      onChange={(e) => setUserForm({...userForm, level: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                    >
                      {USER_LEVELS.map(level => (
                        <option key={level} value={level} className="bg-[#0D0C0C]">{level}</option>
                      ))}
                    </select>
                    {(['VENDEDOR', 'TECNICO'].includes(userForm.level)) && (
                      <p className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>Comissão será criada automaticamente</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 pt-8">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userForm.active}
                        onChange={(e) => setUserForm({...userForm, active: e.target.checked})}
                        className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                      />
                      <span className="text-white">Usuário ativo</span>
                    </label>
                  </div>
                </div>

                {/* Permissões */}
                <div>
                  <label className="block text-white font-medium mb-4">Permissões Específicas</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto bg-[#0D0C0C]/30 p-4 rounded-xl border border-[#FF2C68]/20">
                    {Object.entries(PERMISSIONS).map(([key, description]) => (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userForm.permissions?.includes(key) || false}
                          onChange={(e) => {
                            const permissions = userForm.permissions || [];
                            if (e.target.checked) {
                              setUserForm({
                                ...userForm,
                                permissions: [...permissions, key]
                              });
                            } else {
                              setUserForm({
                                ...userForm,
                                permissions: permissions.filter(p => p !== key)
                              });
                            }
                          }}
                          className="w-4 h-4 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                        />
                        <span className="text-white text-sm">{description}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveUser}
                    disabled={loading}
                    className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Serviço */}
      <AnimatePresence>
        {showServiceModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowServiceModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-3xl border border-[#FF2C68] relative max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowServiceModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">
                  {editingItem ? 'Editar Serviço' : 'Novo Serviço'}
                </h2>
                <p className="text-white/60">Configure os dados do serviço técnico</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna 1 - Dados Básicos */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome do Serviço *</label>
                    <input
                      type="text"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Ex: Troca de Tela"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Categoria</label>
                    <input
                      type="text"
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Ex: Tela, Bateria, Software"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Descrição</label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Descrição detalhada do serviço"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Tempo Estimado</label>
                    <input
                      type="text"
                      value={serviceForm.estimatedTime}
                      onChange={(e) => setServiceForm({...serviceForm, estimatedTime: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Ex: 2 horas, 1 dia"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Garantia</label>
                    <input
                      type="text"
                      value={serviceForm.warranty}
                      onChange={(e) => setServiceForm({...serviceForm, warranty: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Ex: 90 dias, 6 meses"
                    />
                  </div>
                </div>

                {/* Coluna 2 - Valores */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Preço de Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({...serviceForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Custo de Peças (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceForm.cost}
                      onChange={(e) => setServiceForm({...serviceForm, cost: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Mão de Obra (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceForm.labor}
                      onChange={(e) => setServiceForm({...serviceForm, labor: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Cálculos Automáticos */}
                  <div className="bg-[#0D0C0C]/30 border border-[#FF2C68]/20 rounded-xl p-4 space-y-2">
                    <h4 className="text-white font-medium mb-3">Cálculos Automáticos</h4>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Lucro Bruto:</span>
                      <span className="text-green-400 font-medium">
                        R$ {(serviceForm.price - serviceForm.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Margem de Lucro:</span>
                      <span className="text-blue-400 font-medium">
                        {serviceForm.price > 0 ? (((serviceForm.price - serviceForm.cost) / serviceForm.price) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                      <span className="text-white font-medium">Total do Serviço:</span>
                      <span className="text-[#FF2C68] font-bold">
                        R$ {serviceForm.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={serviceForm.active}
                      onChange={(e) => setServiceForm({...serviceForm, active: e.target.checked})}
                      className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                    />
                    <span className="text-white">Serviço ativo</span>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveService}
                  disabled={loading}
                  className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 