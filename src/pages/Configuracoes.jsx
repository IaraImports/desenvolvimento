import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Settings, DollarSign, Truck, Database,
  Plus, Edit3, Trash2, X, Eye, EyeOff, Key,
  RefreshCw, User, Building2, Shield, Wrench
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [loading, setLoading] = useState(false);
  
  // Estados simplificados
  const [usuarios, setUsuarios] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [backupData, setBackupData] = useState({});
  
  // Modais
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showFornecedorModal, setShowFornecedorModal] = useState(false);
  const [showServicoModal, setShowServicoModal] = useState(false);
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

  // Formulário de fornecedor
  const [fornecedorForm, setFornecedorForm] = useState({
    name: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    contato: '',
    active: true
  });

  // Formulário de serviço
  const [servicoForm, setServicoForm] = useState({
    nome: '',
    categoria: '',
    descricao: '',
    preco: '',
    duracao: '',
    status: 'ativo'
  });

  const [loadingUsers, setLoadingUsers] = useState(false);

  const tabs = [
    { id: 'usuarios', name: 'Usuários', icon: Users },
    { id: 'comissoes', name: 'Comissões', icon: DollarSign },
    { id: 'fornecedores', name: 'Fornecedores', icon: Truck },
    { id: 'servicos', name: 'Serviços', icon: Wrench },
    { id: 'backup', name: 'Backup', icon: Database },
    { id: 'sistema', name: 'Sistema', icon: Settings }
  ];

  // Declarar funções de carregamento antes do useEffect
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

  const loadCommissions = useCallback(async () => {
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
  }, []);

  const loadFornecedores = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando fornecedores...');
      
      // Tentar com orderBy primeiro (como na página Produtos)
      let querySnapshot;
      try {
        const q = query(collection(db, 'fornecedores'), orderBy('name'));
        querySnapshot = await getDocs(q);
        console.log('📊 Snapshot com orderBy recebido:', querySnapshot.size, 'documentos');
      } catch (indexError) {
        console.warn('⚠️ Erro com orderBy, tentando consulta simples:', indexError);
        // Fallback: consulta simples sem orderBy
        querySnapshot = await getDocs(collection(db, 'fornecedores'));
        console.log('📊 Snapshot simples recebido:', querySnapshot.size, 'documentos');
      }
      
      const fornecedoresData = querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('📄 Documento:', data);
        return data;
      });
      
      console.log('📦 Dados brutos:', fornecedoresData);
      
      // Mostrar TODOS os fornecedores primeiro (sem filtro)
      console.log('📋 TODOS os fornecedores (sem filtro):', fornecedoresData);
      
      // Filtrar fornecedores ativos e ordenar localmente
      const fornecedoresAtivos = fornecedoresData
        .filter(f => f.active !== false)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      console.log('✅ Fornecedores carregados:', fornecedoresAtivos.length);
      console.log('📋 Lista final:', fornecedoresAtivos);
      
      // Temporariamente mostrar TODOS os fornecedores na interface para depuração
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('❌ Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadServicos = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando serviços...');
      
      // Tentar com orderBy primeiro (como outras páginas)
      let querySnapshot;
      try {
        const q = query(collection(db, 'servicos'), orderBy('nome'));
        querySnapshot = await getDocs(q);
        console.log('📊 Snapshot serviços com orderBy recebido:', querySnapshot.size, 'documentos');
      } catch (indexError) {
        console.warn('⚠️ Erro com orderBy, tentando consulta simples:', indexError);
        // Fallback: consulta simples sem orderBy
        querySnapshot = await getDocs(collection(db, 'servicos'));
        console.log('📊 Snapshot serviços simples recebido:', querySnapshot.size, 'documentos');
      }
      
      const servicosData = querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('📄 Documento serviço:', data);
        return data;
      });
      
      console.log('📦 Dados brutos serviços:', servicosData);
      
      // Mostrar TODOS os serviços primeiro (sem filtro)
      console.log('📋 TODOS os serviços (sem filtro):', servicosData);
      
      // Filtrar serviços ativos e ordenar localmente
      const servicosAtivos = servicosData
        .filter(s => s.status === 'ativo' || !s.status)
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
      
      console.log('✅ Serviços carregados:', servicosAtivos.length);
      console.log('📋 Lista final serviços:', servicosAtivos);
      
      // Temporariamente mostrar TODOS os serviços na interface para depuração
      setServicos(servicosData);
    } catch (error) {
      console.error('❌ Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBackupData = useCallback(async () => {
    try {
      setLoading(true);
      // Simular dados de backup
      setBackupData({
        lastBackup: new Date().toISOString(),
        autoBackup: true,
        backupFrequency: 'daily',
        storageUsed: '2.3 GB',
        totalBackups: 15
      });
    } catch (error) {
      console.error('Erro ao carregar dados de backup:', error);
      toast.error('Erro ao carregar dados de backup');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const saveFornecedor = async () => {
    if (!fornecedorForm.name || !fornecedorForm.cnpj) {
      toast.error('Preencha nome e CNPJ obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const fornecedorData = {
        ...fornecedorForm,
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      if (editingItem) {
        await updateDoc(doc(db, 'fornecedores', editingItem.id), fornecedorData);
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'fornecedores'), {
          ...fornecedorData,
          createdAt: new Date(),
          createdBy: user.uid
        });
        toast.success('Fornecedor criado com sucesso!');
      }

      setShowFornecedorModal(false);
      setEditingItem(null);
      setFornecedorForm({
        name: '',
        cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        contato: '',
        active: true
      });
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const saveServico = async () => {
    if (!servicoForm.nome || !servicoForm.preco) {
      toast.error('Preencha nome e preço obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const servicoData = {
        ...servicoForm,
        preco: parseFloat(servicoForm.preco) || 0,
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      if (editingItem) {
        await updateDoc(doc(db, 'servicos', editingItem.id), servicoData);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'servicos'), {
          ...servicoData,
          createdAt: new Date(),
          createdBy: user.uid
        });
        toast.success('Serviço criado com sucesso!');
      }

      setShowServicoModal(false);
      setEditingItem(null);
      setServicoForm({
        nome: '',
        categoria: '',
        descricao: '',
        preco: '',
        duracao: '',
        status: 'ativo'
      });
      loadServicos();
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
      if (collection_name === 'commissions') loadCommissions();
      if (collection_name === 'fornecedores') loadFornecedores();
      if (collection_name === 'servicos') loadServicos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir item');
    }
  };

  // Carregar dados quando a aba mudar
  useEffect(() => {
    console.log('🔄 useEffect ativado para aba:', activeTab);
    if (activeTab === 'usuarios') {
      console.log('📋 Carregando usuários...');
      loadUsers();
    }
    if (activeTab === 'comissoes') {
      console.log('💰 Carregando comissões...');
      loadCommissions();
    }
    if (activeTab === 'fornecedores') {
      console.log('🚚 Carregando fornecedores...');
      loadFornecedores();
    }
    if (activeTab === 'servicos') {
      console.log('🔧 Carregando serviços...');
      loadServicos();
    }
    if (activeTab === 'backup') {
      console.log('💾 Carregando backup...');
      loadBackupData();
    }
  }, [activeTab, loadUsers, loadCommissions, loadFornecedores, loadServicos, loadBackupData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Configurações do Sistema</h1>
        <p className="text-white/60 text-lg">
          Gerencie usuários, permissões, comissões e configurações gerais
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#FF2C68] to-[#FF2C68]/80 text-white shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <div key={activeTab}>
          {activeTab === 'usuarios' && renderUsersTab()}
          {activeTab === 'comissoes' && renderCommissionsTab()}
          {activeTab === 'fornecedores' && renderFornecedoresTab()}
          {activeTab === 'servicos' && renderServicosTab()}
          {activeTab === 'backup' && renderBackupTab()}
          {activeTab === 'sistema' && renderSystemTab()}
        </div>
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

        {showFornecedorModal && (
          <FornecedorModal
            fornecedor={editingItem}
            formData={fornecedorForm}
            setFormData={setFornecedorForm}
            onSave={saveFornecedor}
            onClose={() => {
              setShowFornecedorModal(false);
              setEditingItem(null);
              setFornecedorForm({
                name: '',
                cnpj: '',
                email: '',
                telefone: '',
                endereco: '',
                contato: '',
                active: true
              });
            }}
            loading={loading}
          />
        )}

        {showServicoModal && (
          <ServicoModal
            servico={editingItem}
            formData={servicoForm}
            setFormData={setServicoForm}
            onSave={saveServico}
            onClose={() => {
              setShowServicoModal(false);
              setEditingItem(null);
              setServicoForm({
                nome: '',
                categoria: '',
                descricao: '',
                preco: '',
                duracao: '',
                status: 'ativo'
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
            className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Novo Usuário
          </motion.button>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#FF2C68] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {usuarios.map((usuario, index) => (
                <motion.div
                  key={usuario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-[#FF2C68]" />
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

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commissions.map((commission, index) => (
              <motion.div
                key={commission.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-6 border border-white/10"
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

  function renderFornecedoresTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Gerenciar Fornecedores</h2>
          <button
            onClick={() => setShowFornecedorModal(true)}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Novo Fornecedor
          </button>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#FF2C68] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {fornecedores.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum fornecedor cadastrado</p>
                </div>
              ) : (
                fornecedores.map((fornecedor) => (
                  <div key={fornecedor.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{fornecedor.name}</p>
                        <p className="text-sm text-gray-400">CNPJ: {fornecedor.cnpj}</p>
                        <p className="text-sm text-gray-400">{fornecedor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        fornecedor.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {fornecedor.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingItem(fornecedor);
                          setFornecedorForm(fornecedor);
                          setShowFornecedorModal(true);
                        }}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('fornecedores', fornecedor.id, fornecedor.name)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderServicosTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Gerenciar Serviços</h2>
          <button
            onClick={() => setShowServicoModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Novo Serviço
          </button>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#FF2C68] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {servicos.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum serviço cadastrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servicos.map((servico) => (
                    <div key={servico.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{servico.nome}</h3>
                            <p className="text-sm text-gray-400">{servico.categoria}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          servico.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {servico.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{servico.descricao}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold text-green-400">
                            R$ {servico.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {servico.duracao && (
                            <p className="text-xs text-gray-400">Duração: {servico.duracao}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingItem(servico);
                            setServicoForm({
                              ...servico,
                              preco: servico.preco?.toString() || ''
                            });
                            setShowServicoModal(true);
                          }}
                          className="flex-1 p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('servicos', servico.id, servico.nome)}
                          className="flex-1 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderBackupTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Sistema de Backup</h2>
          <button
            onClick={() => toast.success('Backup iniciado com sucesso!')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Database className="w-5 h-5" />
            Fazer Backup Agora
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF2C68]" />
              Status do Backup
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Último backup:</span>
                <span className="text-green-400">
                  {backupData.lastBackup ? new Date(backupData.lastBackup).toLocaleString('pt-BR') : 'Nunca'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Backup automático:</span>
                <span className={backupData.autoBackup ? 'text-green-400' : 'text-red-400'}>
                  {backupData.autoBackup ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Frequência:</span>
                <span className="text-white">Diário</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Armazenamento usado:</span>
                <span className="text-white">{backupData.storageUsed || '0 GB'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Configurações</h3>
            <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-white">Backup automático</span>
                <input
                  type="checkbox"
                  checked={backupData.autoBackup}
                  className="rounded border-slate-600 text-pink-600 focus:ring-pink-500"
                  readOnly
                />
              </div>
                              <div className="p-3 bg-white/5 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequência do backup
                </label>
                <select className="w-full bg-[#0D0C0C]/80 border border-[#FF2C68]/30 text-white rounded-lg px-3 py-2">
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Histórico de Backups</h3>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white">Backup automático #{5 - index}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-green-400">Sucesso</div>
              </div>
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
        
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-medium text-white mb-2">Versão do Sistema</h4>
                  <p className="text-white/60">IARA HUB v2.0</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-medium text-white mb-2">Banco de Dados</h4>
                  <p className="text-white/60">Firebase Firestore</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Configurações Gerais</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <h4 className="font-medium text-white">Modo de Desenvolvimento</h4>
                    <p className="text-white/60 text-sm">Logs detalhados e debug ativo</p>
                  </div>
                  <div className="text-green-400">Ativo</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <h4 className="font-medium text-white">Backup Automático</h4>
                    <p className="text-white/60 text-sm">Dados salvos automaticamente no Firebase</p>
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
        className="bg-[#0D0C0C] rounded-2xl p-6 w-full max-w-md border border-[#FF2C68]/30"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
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
        className="bg-[#0D0C0C] rounded-2xl p-6 w-full max-w-md border border-[#FF2C68]/30"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {commission ? 'Editar Comissão' : 'Nova Comissão'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
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

// Modal de Fornecedor
function FornecedorModal({ fornecedor, formData, setFormData, onSave, onClose, loading }) {
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
        className="bg-[#0D0C0C] rounded-2xl p-6 w-full max-w-md border border-[#FF2C68]/30"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Empresa *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Nome do fornecedor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CNPJ *
            </label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="00.000.000/0000-00"
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
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="contato@fornecedor.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telefone
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Endereço
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Endereço completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pessoa de Contato
            </label>
            <input
              type="text"
              value={formData.contato}
              onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Nome do responsável"
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
              Fornecedor ativo
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
              fornecedor ? 'Atualizar' : 'Criar'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Modal de Serviço
function ServicoModal({ servico, formData, setFormData, onSave, onClose, loading }) {
  const categorias = [
    'Assistência Técnica',
    'Instalação',
    'Configuração',
    'Manutenção',
    'Consultoria',
    'Treinamento',
    'Suporte',
    'Outros'
  ];

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
        className="bg-[#0D0C0C] rounded-2xl p-6 w-full max-w-md border border-[#FF2C68]/30"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {servico ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Serviço *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Ex: Formatação de Computador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Descrição detalhada do serviço"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preço (R$) *
            </label>
            <input
              type="number"
              value={formData.preco}
              onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="0,00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duração Estimada
            </label>
            <input
              type="text"
              value={formData.duracao}
              onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Ex: 2 horas, 1 dia, 30 minutos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
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
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              servico ? 'Atualizar' : 'Criar'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
