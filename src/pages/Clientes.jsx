import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Filter, MapPin, Phone, Mail, Calendar,
  FileText, Camera, MessageCircle, Smartphone, Edit3, Trash2,
  Save, X, Upload, Download, Eye, Star, Clock, DollarSign,
  Package, Wrench, ShoppingBag, AlertTriangle, CheckCircle,
  User, Building, CreditCard, Archive, Paperclip, Image as ImageIcon,
  Grid, List, SlidersHorizontal, UserCheck, UserX, Users2
} from 'lucide-react';
import WhatsAppModal from '../components/WhatsAppModal';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { toast } from 'react-hot-toast';
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ, formatPhone, formatCEP } from '../utils/validators';
import { useCreateNotification } from '../components/NotificationSystem';

export default function Clientes() {
  const { user } = useAuth();
  const { notifyNewClient } = useCreateNotification();
  const { 
    canView, 
    canCreate, 
    canEdit, 
    canDelete,
    hasPermission,
    isTecnico
  } = usePermissions();
  
  // Verificar permissões de clientes
  const canViewClients = canView('clients');
  const canCreateClients = canCreate('clients');
  const canEditClients = canEdit('clients');
  const canDeleteClients = canDelete('clients');
  
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [activeTab, setActiveTab] = useState('dados');

  // Estados para visualização e filtros
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'todos',
    tipoDocumento: 'todos',
    cidade: '',
    estado: '',
    periodo: 'todos'
  });

  // Form states
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    tipoDocumento: 'cpf', // 'cpf' ou 'cnpj'
    cpf: '',
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    dataNascimento: '',
    profissao: '',
    observacoes: '',
    status: 'ativo'
  });

  // Estados para funcionalidades extras
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [equipamentos, setEquipamentos] = useState([]);
  const [novoEquipamento, setNovoEquipamento] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    cor: '',
    imei: '',
    observacoes: ''
  });
  const [documentos, setDocumentos] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState('geral');

  // Verificar se tem permissão para acessar esta página
  if (!canViewClients) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-white/60 mb-6">
            Você não tem permissão para visualizar clientes.
          </p>
          <p className="text-white/40 text-sm">
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      loadClienteData(selectedCliente.id);
    }
  }, [selectedCliente]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      // Removendo orderBy para evitar erro de índice
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      const clientesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar no frontend por data de criação (mais recentes primeiro)
      clientesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const loadClienteData = async (clienteId) => {
    try {
      // Carregar comentários - REMOVENDO orderBy para evitar erro de índice
      const comentariosSnap = await getDocs(
        query(
          collection(db, 'cliente_comentarios'), 
          where('clienteId', '==', clienteId)
        )
      );
      const comentariosList = comentariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar no frontend por enquanto
      comentariosList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setComentarios(comentariosList);

      // Carregar equipamentos
      const equipamentosSnap = await getDocs(
        query(
          collection(db, 'cliente_equipamentos'), 
          where('clienteId', '==', clienteId)
        )
      );
      setEquipamentos(equipamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Carregar documentos
      const documentosSnap = await getDocs(
        query(
          collection(db, 'cliente_documentos'), 
          where('clienteId', '==', clienteId)
        )
      );
      setDocumentos(documentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Carregar histórico (vendas, OS, orçamentos)
      await loadHistorico(clienteId);

    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    }
  };

  const loadHistorico = async (clienteId) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) return;

      const historicoItems = [];

      // Buscar vendas
      const vendasSnap = await getDocs(
        query(collection(db, 'vendas'), where('cliente', '==', cliente.nome))
      );
      vendasSnap.docs.forEach(doc => {
        const venda = doc.data();
        historicoItems.push({
          id: doc.id,
          tipo: 'venda',
          titulo: `Venda #${venda.numero || doc.id.substring(0, 6)}`,
          descricao: `${venda.produtos?.length || 0} produtos - R$ ${(venda.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          data: venda.createdAt?.toDate() || new Date(),
          status: venda.status || 'concluida',
          dados: venda
        });
      });

      // Buscar ordens de serviço
      const osSnap = await getDocs(
        query(collection(db, 'ordens_servico'), where('cliente.nome', '==', cliente.nome))
      );
      osSnap.docs.forEach(doc => {
        const os = doc.data();
        historicoItems.push({
          id: doc.id,
          tipo: 'os',
          titulo: `OS ${os.numero || os.servico?.numero}`,
          descricao: `${os.equipamento?.marca} ${os.equipamento?.modelo} - ${os.problema?.relatado?.substring(0, 50)}...`,
          data: os.createdAt?.toDate() || new Date(),
          status: os.servico?.status || 'aguardando',
          dados: os
        });
      });

      // Buscar orçamentos
      const orcamentosSnap = await getDocs(
        query(collection(db, 'orcamentos'), where('cliente.nome', '==', cliente.nome))
      );
      orcamentosSnap.docs.forEach(doc => {
        const orcamento = doc.data();
        historicoItems.push({
          id: doc.id,
          tipo: 'orcamento',
          titulo: `Orçamento #${doc.id.substring(0, 6)}`,
          descricao: `${orcamento.produtos?.length || 0} itens - R$ ${(orcamento.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          data: orcamento.createdAt?.toDate() || new Date(),
          status: orcamento.status || 'pendente',
          dados: orcamento
        });
      });

      // Ordenar por data
      historicoItems.sort((a, b) => b.data - a.data);
      setHistorico(historicoItems);

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const buscarCEP = async (cep) => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length === 8) {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast.error('CEP não encontrado');
          return;
        }

        setClienteForm(prev => ({
          ...prev,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        }));
        
        toast.success('CEP encontrado!');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    }
  };

  const salvarCliente = async () => {
    try {
      // Validações básicas
      if (clienteForm.tipoDocumento === 'cpf') {
        if (!clienteForm.nome || !clienteForm.telefone) {
          toast.error('Nome e telefone são obrigatórios');
          return;
        }
        if (clienteForm.cpf && !validateCPF(clienteForm.cpf)) {
          toast.error('CPF inválido');
          return;
        }
      } else {
        if (!clienteForm.razaoSocial || !clienteForm.telefone) {
          toast.error('Razão social e telefone são obrigatórios');
          return;
        }
        if (clienteForm.cnpj && !validateCNPJ(clienteForm.cnpj)) {
          toast.error('CNPJ inválido');
          return;
        }
      }

      setLoading(true);
      
      // Preparar dados para salvamento
      const clienteData = {
        ...clienteForm,
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      // Limpar campos não utilizados baseado no tipo de documento
      if (clienteForm.tipoDocumento === 'cpf') {
        delete clienteData.cnpj;
        delete clienteData.razaoSocial;
        delete clienteData.nomeFantasia;
        delete clienteData.inscricaoEstadual;
        delete clienteData.inscricaoMunicipal;
      } else {
        delete clienteData.cpf;
        delete clienteData.dataNascimento;
        delete clienteData.profissao;
        // Para empresas, o nome será a razão social ou nome fantasia
        clienteData.nome = clienteForm.nomeFantasia || clienteForm.razaoSocial;
      }

      if (editingCliente) {
        await updateDoc(doc(db, 'clientes', editingCliente.id), clienteData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const docRef = await addDoc(collection(db, 'clientes'), {
          ...clienteData,
          createdAt: new Date(),
          createdBy: user.uid
        });
        toast.success('Cliente cadastrado com sucesso!');
        
        // Criar notificação para novo cliente
        notifyNewClient({
          id: docRef.id,
          nome: clienteData.nome || clienteData.razaoSocial,
          ...clienteData
        });
      }

      setShowModal(false);
      setEditingCliente(null);
      resetForm();
      loadClientes();
      
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  const adicionarComentario = async () => {
    try {
      if (!novoComentario.trim()) {
        toast.error('Digite um comentário');
        return;
      }

      await addDoc(collection(db, 'cliente_comentarios'), {
        clienteId: selectedCliente.id,
        comentario: novoComentario.trim(),
        createdAt: new Date(),
        createdBy: user.uid,
        autor: user.displayName || user.email
      });

      setNovoComentario('');
      loadClienteData(selectedCliente.id);
      toast.success('Comentário adicionado!');
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  const adicionarEquipamento = async () => {
    try {
      if (!novoEquipamento.tipo || !novoEquipamento.marca) {
        toast.error('Tipo e marca são obrigatórios');
        return;
      }

      await addDoc(collection(db, 'cliente_equipamentos'), {
        clienteId: selectedCliente.id,
        ...novoEquipamento,
        createdAt: new Date(),
        createdBy: user.uid
      });

      setNovoEquipamento({
        tipo: '',
        marca: '',
        modelo: '',
        cor: '',
        imei: '',
        observacoes: ''
      });
      
      loadClienteData(selectedCliente.id);
      toast.success('Equipamento adicionado!');
      
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error);
      toast.error('Erro ao adicionar equipamento');
    }
  };

  const uploadArquivo = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }

      setUploadingFile(true);
      
      const fileRef = ref(storage, `clientes/${selectedCliente.id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'cliente_documentos'), {
        clienteId: selectedCliente.id,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        url: downloadURL,
        path: snapshot.ref.fullPath,
        createdAt: new Date(),
        createdBy: user.uid,
        autor: user.displayName || user.email
      });

      loadClienteData(selectedCliente.id);
      toast.success('Arquivo enviado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload');
    } finally {
      setUploadingFile(false);
    }
  };

  const resetForm = () => {
    setClienteForm({
      nome: '',
      tipoDocumento: 'cpf',
      cpf: '',
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      inscricaoEstadual: '',
      inscricaoMunicipal: '',
      telefone: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      dataNascimento: '',
      profissao: '',
      observacoes: '',
      status: 'ativo'
    });
  };

  // Filtrar e buscar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = !searchTerm || 
      cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone?.includes(searchTerm) ||
      cliente.cpf?.includes(searchTerm) ||
      cliente.cnpj?.includes(searchTerm);

    const matchesStatus = filters.status === 'todos' || cliente.status === filters.status;
    const matchesTipo = filters.tipoDocumento === 'todos' || cliente.tipoDocumento === filters.tipoDocumento;
    const matchesCidade = !filters.cidade || cliente.cidade?.toLowerCase().includes(filters.cidade.toLowerCase());
    const matchesEstado = !filters.estado || cliente.estado?.toLowerCase().includes(filters.estado.toLowerCase());

    return matchesSearch && matchesStatus && matchesTipo && matchesCidade && matchesEstado;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'text-green-400 bg-green-500/20';
      case 'inativo': return 'text-red-400 bg-red-500/20';
      case 'bloqueado': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'cpf': return <User className="w-4 h-4" />;
      case 'cnpj': return <Building className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'cpf': return 'text-blue-400 bg-blue-500/20';
      case 'cnpj': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  );

  const TipoBadge = ({ tipo }) => (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(tipo)}`}>
      {getTipoIcon(tipo)}
      <span>{tipo?.toUpperCase()}</span>
    </span>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF2C68] mx-auto mb-4"></div>
          <p className="text-white/60">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header responsivo */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center space-x-3">
              <Users className="w-6 md:w-8 h-6 md:h-8 text-[#FF2C68]" />
              <span>Clientes</span>
            </h1>
            <p className="text-white/60 mt-2 text-sm md:text-base">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {canCreateClients && (
              <motion.button
                onClick={() => {
                  resetForm();
                  setEditingCliente(null);
                  setShowModal(true);
                }}
                className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm md:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 md:w-5 h-4 md:h-5" />
                <span>Novo Cliente</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Controles de busca e filtros responsivos */}
        <div className="mt-4 md:mt-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone, CPF ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl px-10 md:px-12 py-2 md:py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#FF2C68] transition-colors text-sm md:text-base"
            />
          </div>

          {/* Controles responsivos */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            {/* Filtros e visualização */}
            <div className="flex flex-wrap gap-2">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white px-3 md:px-4 py-2 rounded-xl flex items-center space-x-2 hover:border-[#FF2C68]/50 transition-colors text-sm"
                whileHover={{ scale: 1.02 }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtros</span>
                {Object.values(filters).some(f => f !== 'todos' && f !== '') && (
                  <span className="w-2 h-2 bg-[#FF2C68] rounded-full"></span>
                )}
              </motion.button>

              {/* Toggle de visualização - apenas em desktop */}
              <div className="hidden md:flex bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-[#FF2C68] text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-[#FF2C68] text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">
                {clientes.filter(c => c.status === 'ativo').length} ativos
              </span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
                {clientes.filter(c => c.tipoDocumento === 'cpf').length} PF
              </span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg">
                {clientes.filter(c => c.tipoDocumento === 'cnpj').length} PJ
              </span>
            </div>
          </div>

          {/* Painel de filtros expansível */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-[#FF2C68]/20"
              >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF2C68]"
                  >
                    <option value="todos">Todos Status</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>

                  <select
                    value={filters.tipoDocumento}
                    onChange={(e) => setFilters(prev => ({ ...prev, tipoDocumento: e.target.value }))}
                    className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF2C68]"
                  >
                    <option value="todos">Todos Tipos</option>
                    <option value="cpf">Pessoa Física</option>
                    <option value="cnpj">Pessoa Jurídica</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Cidade"
                    value={filters.cidade}
                    onChange={(e) => setFilters(prev => ({ ...prev, cidade: e.target.value }))}
                    className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg px-3 py-2 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FF2C68]"
                  />

                  <input
                    type="text"
                    placeholder="Estado"
                    value={filters.estado}
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                    className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg px-3 py-2 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FF2C68]"
                  />

                  <button
                    onClick={() => setFilters({
                      status: 'todos',
                      tipoDocumento: 'todos',
                      cidade: '',
                      estado: '',
                      periodo: 'todos'
                    })}
                    className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-xs hover:bg-red-500/30 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lista de clientes responsiva */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-8 md:p-12 text-center">
          <Users className="w-16 md:w-20 h-16 md:h-20 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">
            {searchTerm || Object.values(filters).some(f => f !== 'todos' && f !== '') 
              ? 'Nenhum cliente encontrado' 
              : 'Nenhum cliente cadastrado'
            }
          </h3>
          <p className="text-white/60 mb-6 text-sm md:text-base">
            {searchTerm || Object.values(filters).some(f => f !== 'todos' && f !== '')
              ? 'Tente ajustar os filtros de busca'
              : 'Comece cadastrando seu primeiro cliente'
            }
          </p>
          {canCreateClients && !searchTerm && !Object.values(filters).some(f => f !== 'todos' && f !== '') && (
            <motion.button
              onClick={() => {
                resetForm();
                setEditingCliente(null);
                setShowModal(true);
              }}
              className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 mx-auto"
              whileHover={{ scale: 1.02 }}
            >
              <Plus className="w-5 h-5" />
              <span>Cadastrar Cliente</span>
            </motion.button>
          )}
        </div>
      ) : (
        <>
          {/* Grid/Cards para mobile e desktop */}
          <div className={`grid gap-4 md:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {clientesFiltrados.map((cliente, index) => (
              <motion.div
                key={cliente.id}
                className={`bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 hover:border-[#FF2C68]/50 transition-all duration-300 overflow-hidden ${
                  viewMode === 'list' ? 'flex flex-col md:flex-row md:items-center' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {viewMode === 'grid' ? (
                  /* Card Mode */
                  <div className="p-4 md:p-6">
                    {/* Header do card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">
                          {cliente.nome || cliente.razaoSocial}
                        </h3>
                        {cliente.nomeFantasia && cliente.nomeFantasia !== cliente.razaoSocial && (
                          <p className="text-sm text-white/60 truncate">
                            {cliente.nomeFantasia}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <StatusBadge status={cliente.status} />
                        <TipoBadge tipo={cliente.tipoDocumento} />
                      </div>
                    </div>

                    {/* Informações do card */}
                    <div className="space-y-3 mb-4">
                      {cliente.telefone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-[#FF2C68] flex-shrink-0" />
                          <span className="text-white/80 truncate">{cliente.telefone}</span>
                        </div>
                      )}
                      
                      {cliente.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-[#FF2C68] flex-shrink-0" />
                          <span className="text-white/80 truncate">{cliente.email}</span>
                        </div>
                      )}
                      
                      {(cliente.cidade || cliente.estado) && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-[#FF2C68] flex-shrink-0" />
                          <span className="text-white/80 truncate">
                            {[cliente.cidade, cliente.estado].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      {(cliente.cpf || cliente.cnpj) && (
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="w-4 h-4 text-[#FF2C68] flex-shrink-0" />
                          <span className="text-white/80 font-mono">
                            {cliente.tipoDocumento === 'cpf' ? formatCPF(cliente.cpf) : formatCNPJ(cliente.cnpj)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ações do card */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowDetailModal(true);
                          setActiveTab('dados');
                        }}
                        className="flex-1 bg-[#FF2C68]/20 hover:bg-[#FF2C68]/30 text-[#FF2C68] px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Detalhes</span>
                      </motion.button>

                      {cliente.telefone && (
                        <motion.button
                          onClick={() => {
                            setSelectedCliente(cliente);
                            setWhatsAppTemplate('geral');
                            setShowWhatsAppModal(true);
                          }}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* List Mode */
                  <div className="flex flex-col md:flex-row md:items-center w-full p-4 md:p-6">
                    {/* Informações principais */}
                    <div className="flex-1 min-w-0 mb-4 md:mb-0">
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                        <div className="flex-1 min-w-0 mb-2 md:mb-0">
                          <h3 className="text-lg font-bold text-white truncate">
                            {cliente.nome || cliente.razaoSocial}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <StatusBadge status={cliente.status} />
                            <TipoBadge tipo={cliente.tipoDocumento} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          {cliente.telefone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-[#FF2C68]" />
                              <span className="text-white/80">{cliente.telefone}</span>
                            </div>
                          )}
                          
                          {cliente.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-[#FF2C68]" />
                              <span className="text-white/80 truncate">{cliente.email}</span>
                            </div>
                          )}
                          
                          {(cliente.cidade || cliente.estado) && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-[#FF2C68]" />
                              <span className="text-white/80 truncate">
                                {[cliente.cidade, cliente.estado].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2 md:ml-4">
                      <motion.button
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowDetailModal(true);
                          setActiveTab('dados');
                        }}
                        className="bg-[#FF2C68]/20 hover:bg-[#FF2C68]/30 text-[#FF2C68] px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 text-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Detalhes</span>
                      </motion.button>

                      {cliente.telefone && (
                        <motion.button
                          onClick={() => {
                            setSelectedCliente(cliente);
                            setWhatsAppTemplate('geral');
                            setShowWhatsAppModal(true);
                          }}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 text-sm"
                          whileHover={{ scale: 1.02 }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Modal de Cadastro/Edição */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68] p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados Pessoais/Empresariais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Dados do Cliente</h3>
                  
                  {/* Tipo de Documento */}
                  <div>
                    <label className="block text-white font-medium mb-2">Tipo de Cliente *</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoDocumento"
                          value="cpf"
                          checked={clienteForm.tipoDocumento === 'cpf'}
                          onChange={(e) => setClienteForm({...clienteForm, tipoDocumento: e.target.value})}
                          className="text-[#FF2C68] focus:ring-[#FF2C68]"
                        />
                        <span className="text-white">Pessoa Física</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoDocumento"
                          value="cnpj"
                          checked={clienteForm.tipoDocumento === 'cnpj'}
                          onChange={(e) => setClienteForm({...clienteForm, tipoDocumento: e.target.value})}
                          className="text-[#FF2C68] focus:ring-[#FF2C68]"
                        />
                        <span className="text-white">Pessoa Jurídica</span>
                      </label>
                    </div>
                  </div>

                  {clienteForm.tipoDocumento === 'cpf' ? (
                    <>
                      <div>
                        <label className="block text-white font-medium mb-2">Nome Completo *</label>
                        <input
                          type="text"
                          value={clienteForm.nome}
                          onChange={(e) => setClienteForm({...clienteForm, nome: e.target.value})}
                          className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="Nome completo do cliente"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white font-medium mb-2">CPF *</label>
                          <input
                            type="text"
                            value={clienteForm.cpf}
                            onChange={(e) => {
                              const formatted = formatCPF(e.target.value);
                              setClienteForm({...clienteForm, cpf: formatted});
                            }}
                            className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            placeholder="000.000.000-00"
                            maxLength="14"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Data Nascimento</label>
                          <input
                            type="date"
                            value={clienteForm.dataNascimento}
                            onChange={(e) => setClienteForm({...clienteForm, dataNascimento: e.target.value})}
                            className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Profissão</label>
                        <input
                          type="text"
                          value={clienteForm.profissao}
                          onChange={(e) => setClienteForm({...clienteForm, profissao: e.target.value})}
                          className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="Profissão do cliente"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-white font-medium mb-2">Razão Social *</label>
                        <input
                          type="text"
                          value={clienteForm.razaoSocial}
                          onChange={(e) => setClienteForm({...clienteForm, razaoSocial: e.target.value})}
                          className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="Razão social da empresa"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Nome Fantasia</label>
                        <input
                          type="text"
                          value={clienteForm.nomeFantasia}
                          onChange={(e) => setClienteForm({...clienteForm, nomeFantasia: e.target.value})}
                          className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="Nome fantasia da empresa"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">CNPJ *</label>
                        <input
                          type="text"
                          value={clienteForm.cnpj}
                          onChange={(e) => {
                            const formatted = formatCNPJ(e.target.value);
                            setClienteForm({...clienteForm, cnpj: formatted});
                          }}
                          className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="00.000.000/0000-00"
                          maxLength="18"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white font-medium mb-2">Inscrição Estadual</label>
                          <input
                            type="text"
                            value={clienteForm.inscricaoEstadual}
                            onChange={(e) => setClienteForm({...clienteForm, inscricaoEstadual: e.target.value})}
                            className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            placeholder="Isento ou número da IE"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Inscrição Municipal</label>
                          <input
                            type="text"
                            value={clienteForm.inscricaoMunicipal}
                            onChange={(e) => setClienteForm({...clienteForm, inscricaoMunicipal: e.target.value})}
                            className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            placeholder="Número da IM"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Telefone *</label>
                      <input
                        type="tel"
                        value={clienteForm.telefone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setClienteForm({...clienteForm, telefone: formatted});
                        }}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="(11) 99999-9999"
                        maxLength="15"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={clienteForm.email}
                        onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Status</label>
                    <select
                      value={clienteForm.status}
                      onChange={(e) => setClienteForm({...clienteForm, status: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                    >
                      <option value="ativo" className="bg-[#0D0C0C]">Ativo</option>
                      <option value="inativo" className="bg-[#0D0C0C]">Inativo</option>
                      <option value="bloqueado" className="bg-[#0D0C0C]">Bloqueado</option>
                    </select>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Endereço</h3>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">CEP</label>
                    <input
                      type="text"
                      value={clienteForm.cep}
                      onChange={(e) => {
                        const formatted = formatCEP(e.target.value);
                        setClienteForm({...clienteForm, cep: formatted});
                      }}
                      onBlur={(e) => buscarCEP(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="00000-000"
                      maxLength="9"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Endereço</label>
                    <input
                      type="text"
                      value={clienteForm.endereco}
                      onChange={(e) => setClienteForm({...clienteForm, endereco: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Rua, Avenida..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Número</label>
                      <input
                        type="text"
                        value={clienteForm.numero}
                        onChange={(e) => setClienteForm({...clienteForm, numero: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Complemento</label>
                      <input
                        type="text"
                        value={clienteForm.complemento}
                        onChange={(e) => setClienteForm({...clienteForm, complemento: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="Apt, Bloco..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Bairro</label>
                    <input
                      type="text"
                      value={clienteForm.bairro}
                      onChange={(e) => setClienteForm({...clienteForm, bairro: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Cidade</label>
                      <input
                        type="text"
                        value={clienteForm.cidade}
                        onChange={(e) => setClienteForm({...clienteForm, cidade: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="Nome da cidade"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Estado</label>
                      <input
                        type="text"
                        value={clienteForm.estado}
                        onChange={(e) => setClienteForm({...clienteForm, estado: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="SP"
                        maxLength="2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Observações</label>
                    <textarea
                      value={clienteForm.observacoes}
                      onChange={(e) => setClienteForm({...clienteForm, observacoes: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Observações gerais sobre o cliente..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarCliente}
                  disabled={loading}
                  className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes do Cliente */}
      <AnimatePresence>
        {showDetailModal && selectedCliente && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68] w-full max-w-7xl max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#FF2C68]/30">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[#FF2C68] rounded-xl flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCliente.nome}</h2>
                    <p className="text-white/60">{selectedCliente.telefone} • {selectedCliente.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-[#FF2C68]/30">
                <div className="flex space-x-0">
                  {[
                    { id: 'dados', name: 'Dados', icon: User },
                    { id: 'historico', name: 'Histórico', icon: Clock },
                    { id: 'comentarios', name: 'Comentários', icon: MessageCircle },
                    { id: 'equipamentos', name: 'Equipamentos', icon: Smartphone },
                    { id: 'documentos', name: 'Documentos', icon: FileText }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                        activeTab === tab.id
                          ? 'text-[#FF2C68] border-[#FF2C68]'
                          : 'text-white/60 border-transparent hover:text-white'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conteúdo das tabs */}
              <div className="h-[60vh] overflow-y-auto p-6">
                {activeTab === 'dados' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white mb-4">Informações Pessoais</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Nome:</span>
                          <span className="text-white">{selectedCliente.nome}</span>
                        </div>
                        {selectedCliente.cpf && (
                          <div className="flex justify-between">
                            <span className="text-white/60">CPF:</span>
                            <span className="text-white">{selectedCliente.cpf}</span>
                          </div>
                        )}
                        {selectedCliente.cnpj && (
                          <div className="flex justify-between">
                            <span className="text-white/60">CNPJ:</span>
                            <span className="text-white">{selectedCliente.cnpj}</span>
                          </div>
                        )}
                        {selectedCliente.razaoSocial && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Razão Social:</span>
                            <span className="text-white">{selectedCliente.razaoSocial}</span>
                          </div>
                        )}
                        {selectedCliente.nomeFantasia && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Nome Fantasia:</span>
                            <span className="text-white">{selectedCliente.nomeFantasia}</span>
                          </div>
                        )}
                        {selectedCliente.inscricaoEstadual && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Inscrição Estadual:</span>
                            <span className="text-white">{selectedCliente.inscricaoEstadual}</span>
                          </div>
                        )}
                        {selectedCliente.inscricaoMunicipal && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Inscrição Municipal:</span>
                            <span className="text-white">{selectedCliente.inscricaoMunicipal}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-white/60">Telefone:</span>
                          <span className="text-white">{selectedCliente.telefone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email:</span>
                          <span className="text-white">{selectedCliente.email || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Nascimento:</span>
                          <span className="text-white">{selectedCliente.dataNascimento || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Profissão:</span>
                          <span className="text-white">{selectedCliente.profissao || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white mb-4">Endereço</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">CEP:</span>
                          <span className="text-white">{selectedCliente.cep || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Endereço:</span>
                          <span className="text-white">{selectedCliente.endereco || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Número:</span>
                          <span className="text-white">{selectedCliente.numero || 'S/N'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Bairro:</span>
                          <span className="text-white">{selectedCliente.bairro || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Cidade:</span>
                          <span className="text-white">{selectedCliente.cidade || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Estado:</span>
                          <span className="text-white">{selectedCliente.estado || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedCliente.observacoes && (
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-bold text-white mb-4">Observações</h3>
                        <div className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-4">
                          <p className="text-white">{selectedCliente.observacoes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'historico' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Histórico de Transações</h3>
                    
                    {historico.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/60">Nenhum histórico encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {historico.map((item) => {
                          const Icon = getTipoIcon(item.tipo);
                          return (
                            <div key={`${item.tipo}-${item.id}`} className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    item.tipo === 'venda' ? 'bg-green-500/20' :
                                    item.tipo === 'os' ? 'bg-blue-500/20' :
                                    'bg-yellow-500/20'
                                  }`}>
                                    <Icon className={`w-5 h-5 ${getTipoColor(item.tipo)}`} />
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium">{item.titulo}</h4>
                                    <p className="text-white/60 text-sm">{item.descricao}</p>
                                    <p className="text-white/40 text-xs mt-1">
                                      {item.data.toLocaleDateString('pt-BR')} às {item.data.toLocaleTimeString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  item.status === 'concluida' || item.status === 'entregue' ? 'bg-green-500/20 text-green-400' :
                                  item.status === 'pendente' || item.status === 'aguardando' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {item.status?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'comentarios' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Comentários</h3>
                    </div>

                    {/* Novo comentário - apenas para usuários com permissão */}
                    {canEditClients && (
                      <div className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-4">
                        <textarea
                          value={novoComentario}
                          onChange={(e) => setNovoComentario(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="Adicionar novo comentário..."
                          rows="3"
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={adicionarComentario}
                            className="px-4 py-2 bg-[#FF2C68] text-white rounded-lg hover:bg-[#FF2C68]/80 transition-colors flex items-center space-x-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Adicionar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mensagem para usuários sem permissão */}
                    {!canEditClients && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Eye className="w-5 h-5" />
                          <span>Você não tem permissão para adicionar comentários</span>
                        </div>
                      </div>
                    )}

                    {/* Mensagem para técnicos */}
                    {isTecnico && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Eye className="w-5 h-5" />
                          <span>Modo visualização - Técnicos não podem adicionar comentários</span>
                        </div>
                      </div>
                    )}

                    {/* Lista de comentários */}
                    {comentarios.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/60">Nenhum comentário adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {comentarios.map((comentario) => (
                          <div key={comentario.id} className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-[#FF2C68] font-medium">{comentario.autor}</span>
                              <span className="text-white/40 text-xs">
                                {comentario.createdAt?.toDate?.()?.toLocaleDateString('pt-BR')} às {comentario.createdAt?.toDate?.()?.toLocaleTimeString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-white">{comentario.comentario}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'equipamentos' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Equipamentos do Cliente</h3>
                    </div>

                    {/* Novo equipamento - apenas para usuários com permissão */}
                    {canEditClients && (
                      <div className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-4">
                        <h4 className="text-white font-medium mb-3">Adicionar Equipamento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <input
                              type="text"
                              placeholder="Tipo (ex: Smartphone)"
                              value={novoEquipamento.tipo}
                              onChange={(e) => setNovoEquipamento({...novoEquipamento, tipo: e.target.value})}
                              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Marca (ex: Apple)"
                              value={novoEquipamento.marca}
                              onChange={(e) => setNovoEquipamento({...novoEquipamento, marca: e.target.value})}
                              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Modelo (ex: iPhone 15)"
                              value={novoEquipamento.modelo}
                              onChange={(e) => setNovoEquipamento({...novoEquipamento, modelo: e.target.value})}
                              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Cor"
                              value={novoEquipamento.cor}
                              onChange={(e) => setNovoEquipamento({...novoEquipamento, cor: e.target.value})}
                              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="IMEI/Série"
                              value={novoEquipamento.imei}
                              onChange={(e) => setNovoEquipamento({...novoEquipamento, imei: e.target.value})}
                              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <button
                              onClick={adicionarEquipamento}
                              className="w-full px-3 py-2 bg-[#FF2C68] text-white rounded-lg hover:bg-[#FF2C68]/80 transition-colors flex items-center justify-center space-x-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Adicionar</span>
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <textarea
                            placeholder="Observações sobre o equipamento..."
                            value={novoEquipamento.observacoes}
                            onChange={(e) => setNovoEquipamento({...novoEquipamento, observacoes: e.target.value})}
                            className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                            rows="2"
                          />
                        </div>
                      </div>
                    )}

                    {/* Mensagem para usuários sem permissão */}
                    {!canEditClients && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Eye className="w-5 h-5" />
                          <span>Modo visualização - Técnicos podem visualizar mas não adicionar equipamentos</span>
                        </div>
                      </div>
                    )}

                    {/* Lista de equipamentos */}
                    {equipamentos.length === 0 ? (
                      <div className="text-center py-12">
                        <Smartphone className="w-12 h-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/60">Nenhum equipamento cadastrado</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {equipamentos.map((equipamento) => (
                          <div key={equipamento.id} className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                  <Smartphone className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">{equipamento.tipo}</h4>
                                  <p className="text-white/60 text-sm">{equipamento.marca} {equipamento.modelo}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              {equipamento.cor && (
                                <div className="flex justify-between">
                                  <span className="text-white/60">Cor:</span>
                                  <span className="text-white">{equipamento.cor}</span>
                                </div>
                              )}
                              {equipamento.imei && (
                                <div className="flex justify-between">
                                  <span className="text-white/60">IMEI:</span>
                                  <span className="text-white">{equipamento.imei}</span>
                                </div>
                              )}
                              {equipamento.observacoes && (
                                <div className="mt-2">
                                  <span className="text-white/60">Obs:</span>
                                  <p className="text-white text-xs mt-1">{equipamento.observacoes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'documentos' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Documentos e Arquivos</h3>
                      {canEditClients && (
                        <div>
                          <input
                            type="file"
                            id="fileUpload"
                            multiple
                            onChange={uploadArquivo}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                          />
                          <label
                            htmlFor="fileUpload"
                            className="px-4 py-2 bg-[#FF2C68] text-white rounded-lg hover:bg-[#FF2C68]/80 transition-colors flex items-center space-x-2 cursor-pointer"
                          >
                            {uploadingFile ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span>{uploadingFile ? 'Enviando...' : 'Upload'}</span>
                          </label>
                        </div>
                      )}
                      {!canEditClients && (
                        <div className="flex items-center space-x-2 text-white/60">
                          <Eye className="w-5 h-5" />
                          <span>Apenas Visualização</span>
                        </div>
                      )}
                    </div>

                    {documentos.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/60">Nenhum documento enviado</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documentos.map((doc) => (
                          <div key={doc.id} className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                  {doc.tipo?.startsWith('image/') ? (
                                    <ImageIcon className="w-5 h-5 text-purple-400" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-purple-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium truncate">{doc.nome}</h4>
                                  <p className="text-white/60 text-xs">
                                    {(doc.tamanho / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            </div>
                            <div className="text-xs text-white/40">
                              <p>Enviado por {doc.autor}</p>
                              <p>{doc.createdAt?.toDate?.()?.toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal WhatsApp */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        cliente={selectedCliente}
        template={whatsAppTemplate}
      />
    </div>
  );
} 