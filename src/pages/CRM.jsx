import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  User,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Filter,
  Search,
  Edit,
  Eye,
  MessageSquare,
  Star,
  Heart,
  ShoppingCart,
  DollarSign,
  Award,
  Gift,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  ArrowRight,
  ArrowDown,
  Plus,
  RefreshCw,
  Download,
  Tag,
  MapPin,
  Building,
  Briefcase,
  Globe,
  Smartphone,
  FileText,
  Camera,
  Send,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function CRM() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [filtros, setFiltros] = useState({
    status: 'todos',
    origem: 'todos',
    periodo: '30'
  });

  // Estados do funil
  const [funnelData, setFunnelData] = useState({
    leads: [],
    qualificados: [],
    proposta: [],
    negociacao: [],
    fechamento: []
  });

  // Estados de formulário
  const [leadForm, setLeadForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cargo: '',
    origem: 'website',
    status: 'lead',
    interesse: '',
    observacoes: '',
    valorPotencial: 0
  });

  const [clienteForm, setClienteForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    segmento: '',
    valorTotal: 0,
    ultimaCompra: null
  });

  const statusFunil = [
    { id: 'lead', nome: 'Lead', cor: 'blue', icon: UserPlus },
    { id: 'qualificado', nome: 'Qualificado', cor: 'yellow', icon: Star },
    { id: 'proposta', nome: 'Proposta', cor: 'orange', icon: FileText },
    { id: 'negociacao', nome: 'Negociação', cor: 'purple', icon: MessageSquare },
    { id: 'fechamento', nome: 'Fechamento', cor: 'green', icon: CheckCircle },
    { id: 'perdido', nome: 'Perdido', cor: 'red', icon: XCircle }
  ];

  const origensLead = [
    { id: 'website', nome: 'Website', icon: Globe },
    { id: 'social_media', nome: 'Redes Sociais', icon: Heart },
    { id: 'google_ads', nome: 'Google Ads', icon: Target },
    { id: 'indicacao', nome: 'Indicação', icon: Users },
    { id: 'evento', nome: 'Evento', icon: Calendar },
    { id: 'telefone', nome: 'Telefone', icon: Phone },
    { id: 'email', nome: 'Email', icon: Mail },
    { id: 'whatsapp', nome: 'WhatsApp', icon: MessageSquare }
  ];

  const [stats, setStats] = useState({
    totalLeads: 0,
    totalClientes: 0,
    taxaConversao: 0,
    valorPipeline: 0,
    leadsAtivos: 0,
    vendasMes: 0
  });

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      
      // Carregar leads
      const leadsSnapshot = await getDocs(collection(db, 'leads'));
      const leadsData = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeads(leadsData);

      // Carregar clientes
      const clientesSnapshot = await getDocs(collection(db, 'clientes'));
      const clientesData = clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(clientesData);

      // Organizar dados do funil
      organizarFunil(leadsData);
      calcularEstatisticas(leadsData, clientesData);

    } catch (error) {
      console.error('Erro ao carregar dados do CRM:', error);
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  };

  const organizarFunil = (leadsData) => {
    const funil = {
      lead: leadsData.filter(l => l.status === 'lead'),
      qualificado: leadsData.filter(l => l.status === 'qualificado'),
      proposta: leadsData.filter(l => l.status === 'proposta'),
      negociacao: leadsData.filter(l => l.status === 'negociacao'),
      fechamento: leadsData.filter(l => l.status === 'fechamento'),
      perdido: leadsData.filter(l => l.status === 'perdido')
    };
    setFunnelData(funil);
  };

  const calcularEstatisticas = (leadsData, clientesData) => {
    const totalLeads = leadsData.length;
    const totalClientes = clientesData.length;
    const leadsConvertidos = leadsData.filter(l => l.status === 'fechamento').length;
    const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
    const valorPipeline = leadsData.reduce((acc, lead) => acc + (lead.valorPotencial || 0), 0);
    const leadsAtivos = leadsData.filter(l => !['fechamento', 'perdido'].includes(l.status)).length;

    setStats({
      totalLeads,
      totalClientes,
      taxaConversao: Math.round(taxaConversao * 10) / 10,
      valorPipeline,
      leadsAtivos,
      vendasMes: 15 // Implementar cálculo real
    });
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const leadData = {
        ...leadForm,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        score: calcularScoreLead(leadForm),
        proximoContato: null,
        historico: [{
          acao: 'criado',
          data: Timestamp.now(),
          observacao: 'Lead criado no sistema'
        }]
      };

      await addDoc(collection(db, 'leads'), leadData);
      
      toast.success('Lead adicionado com sucesso!');
      setShowLeadModal(false);
      resetLeadForm();
      loadCRMData();
      
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  const handleClienteSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const clienteData = {
        ...clienteForm,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'ativo',
        historico: [{
          acao: 'criado',
          data: Timestamp.now(),
          observacao: 'Cliente adicionado ao sistema'
        }]
      };

      await addDoc(collection(db, 'clientes'), clienteData);
      
      toast.success('Cliente adicionado com sucesso!');
      setShowClienteModal(false);
      resetClienteForm();
      loadCRMData();
      
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const moverLead = async (leadId, novoStatus) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        status: novoStatus,
        updatedAt: Timestamp.now()
      });
      
      toast.success(`Lead movido para ${statusFunil.find(s => s.id === novoStatus)?.nome}`);
      loadCRMData();
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast.error('Erro ao mover lead');
    }
  };

  const calcularScoreLead = (lead) => {
    let score = 0;
    
    // Pontuação por origem
    const scorePorOrigem = {
      indicacao: 30,
      website: 20,
      google_ads: 25,
      social_media: 15,
      evento: 25,
      telefone: 20,
      email: 10,
      whatsapp: 15
    };
    
    score += scorePorOrijem[lead.origem] || 10;
    
    // Pontuação por empresa
    if (lead.empresa) score += 20;
    
    // Pontuação por cargo
    if (lead.cargo && ['diretor', 'gerente', 'ceo', 'proprietario'].some(c => 
      lead.cargo.toLowerCase().includes(c))) score += 25;
    
    // Pontuação por valor potencial
    if (lead.valorPotencial > 0) {
      if (lead.valorPotencial > 10000) score += 30;
      else if (lead.valorPotencial > 5000) score += 20;
      else if (lead.valorPotencial > 1000) score += 10;
    }
    
    return Math.min(score, 100);
  };

  const resetLeadForm = () => {
    setLeadForm({
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      cargo: '',
      origem: 'website',
      status: 'lead',
      interesse: '',
      observacoes: '',
      valorPotencial: 0
    });
  };

  const resetClienteForm = () => {
    setClienteForm({
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      segmento: '',
      valorTotal: 0,
      ultimaCompra: null
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getTempoDesdeContato = (data) => {
    if (!data) return '';
    
    const agora = new Date();
    const dataContato = data.toDate ? data.toDate() : new Date(data);
    const diff = Math.floor((agora - dataContato) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias atrás`;
    if (diff < 30) return `${Math.floor(diff / 7)} semanas atrás`;
    return `${Math.floor(diff / 30)} meses atrás`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white/60">Carregando CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            👥 CRM Avançado
          </h1>
          <p className="text-white/60">
            Gestão completa de relacionamento com clientes e pipeline de vendas
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadCRMData}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
          
          <motion.button
            onClick={() => setShowLeadModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FF2C68] to-[#FF2C68]/80 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus className="w-5 h-5" />
            <span>Novo Lead</span>
          </motion.button>
          
          <motion.button
            onClick={() => setShowClienteModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users className="w-5 h-5" />
            <span>Novo Cliente</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex space-x-1 bg-[#0D0C0C]/50 p-1 rounded-2xl border border-[#FF2C68]/20"
      >
        {[
          { id: 'pipeline', label: 'Pipeline', icon: Target },
          { id: 'leads', label: 'Leads', icon: UserPlus },
          { id: 'clientes', label: 'Clientes', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-[#FF2C68] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
      >
        {[
          {
            title: 'Total de Leads',
            value: stats.totalLeads,
            icon: UserPlus,
            color: 'blue',
            change: '+12 esta semana'
          },
          {
            title: 'Clientes Ativos',
            value: stats.totalClientes,
            icon: Users,
            color: 'green',
            change: '+3 este mês'
          },
          {
            title: 'Taxa de Conversão',
            value: `${stats.taxaConversao}%`,
            icon: TrendingUp,
            color: 'purple',
            change: '+2.1% vs mês anterior'
          },
          {
            title: 'Valor Pipeline',
            value: formatCurrency(stats.valorPipeline),
            icon: DollarSign,
            color: 'orange',
            change: '+15% este mês'
          },
          {
            title: 'Leads Ativos',
            value: stats.leadsAtivos,
            icon: Activity,
            color: 'cyan',
            change: 'em processo'
          },
          {
            title: 'Vendas/Mês',
            value: stats.vendasMes,
            icon: ShoppingCart,
            color: 'emerald',
            change: 'meta: 20'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            className={`bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/10 backdrop-blur-xl border border-${stat.color}-500/20 rounded-2xl p-6`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
            </div>
            <p className={`text-${stat.color}-400 text-sm font-medium mb-1`}>{stat.title}</p>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className={`text-${stat.color}-400 text-xs`}>{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Funil de Vendas</h3>
              <div className="flex items-center space-x-4">
                <span className="text-white/60 text-sm">
                  Total: {formatCurrency(stats.valorPipeline)}
                </span>
                <Target className="w-6 h-6 text-[#FF2C68]" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              {statusFunil.map((status, index) => {
                const leadsNoStatus = leads.filter(l => l.status === status.id);
                const valorTotal = leadsNoStatus.reduce((acc, lead) => acc + (lead.valorPotencial || 0), 0);
                
                return (
                  <motion.div
                    key={status.id}
                    className={`bg-gradient-to-br from-${status.cor}-500/10 to-${status.cor}-600/10 border border-${status.cor}-500/20 rounded-xl p-4`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <status.icon className={`w-6 h-6 text-${status.cor}-400`} />
                      <div>
                        <h4 className="text-white font-bold">{status.nome}</h4>
                        <p className={`text-${status.cor}-400 text-sm`}>
                          {leadsNoStatus.length} leads
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-white/60 text-sm mb-3">
                      Valor: {formatCurrency(valorTotal)}
                    </p>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {leadsNoStatus.map((lead, leadIndex) => (
                        <motion.div
                          key={lead.id}
                          className="p-3 bg-[#0D0C0C]/30 rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedLead(lead)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: leadIndex * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white font-medium text-sm">{lead.nome}</p>
                            <span className="text-xs text-white/60">
                              Score: {lead.score || 0}
                            </span>
                          </div>
                          
                          <p className="text-white/60 text-xs mb-2">{lead.empresa}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-green-400 text-xs font-medium">
                              {formatCurrency(lead.valorPotencial)}
                            </span>
                            <span className="text-white/40 text-xs">
                              {getTempoDesdeContato(lead.updatedAt)}
                            </span>
                          </div>
                          
                          {status.id !== 'perdido' && status.id !== 'fechamento' && (
                            <div className="flex space-x-1 mt-2">
                              {statusFunil.slice(statusFunil.findIndex(s => s.id === status.id) + 1).map((nextStatus) => (
                                <button
                                  key={nextStatus.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moverLead(lead.id, nextStatus.id);
                                  }}
                                  className={`text-xs px-2 py-1 bg-${nextStatus.cor}-500/20 text-${nextStatus.cor}-400 rounded hover:bg-${nextStatus.cor}-500/30 transition-colors`}
                                  title={`Mover para ${nextStatus.nome}`}
                                >
                                  {nextStatus.nome}
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                      
                      {leadsNoStatus.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-white/40 text-sm">Nenhum lead</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Filtros */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Filtros</h3>
              <Filter className="w-5 h-5 text-[#FF2C68]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="px-4 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:outline-none focus:border-[#FF2C68]"
              >
                <option value="todos">Todos os Status</option>
                {statusFunil.map(status => (
                  <option key={status.id} value={status.id}>{status.nome}</option>
                ))}
              </select>
              
              <select
                value={filtros.origem}
                onChange={(e) => setFiltros({...filtros, origem: e.target.value})}
                className="px-4 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:outline-none focus:border-[#FF2C68]"
              >
                <option value="todos">Todas as Origens</option>
                {origensLead.map(origem => (
                  <option key={origem.id} value={origem.id}>{origem.nome}</option>
                ))}
              </select>
              
              <select
                value={filtros.periodo}
                onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
                className="px-4 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:outline-none focus:border-[#FF2C68]"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 3 meses</option>
                <option value="365">Último ano</option>
              </select>
              
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-colors">
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Lista de Leads */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Lista de Leads</h3>
              <div className="flex items-center space-x-2">
                <button className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <UserPlus className="w-6 h-6 text-[#FF2C68]" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 font-medium pb-3">Lead</th>
                    <th className="text-left text-white/60 font-medium pb-3">Empresa</th>
                    <th className="text-left text-white/60 font-medium pb-3">Status</th>
                    <th className="text-left text-white/60 font-medium pb-3">Origem</th>
                    <th className="text-left text-white/60 font-medium pb-3">Valor</th>
                    <th className="text-left text-white/60 font-medium pb-3">Score</th>
                    <th className="text-left text-white/60 font-medium pb-3">Último Contato</th>
                    <th className="text-left text-white/60 font-medium pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => {
                    const statusInfo = statusFunil.find(s => s.id === lead.status);
                    const origemInfo = origensLead.find(o => o.id === lead.origem);
                    
                    return (
                      <motion.tr
                        key={lead.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="py-4">
                          <div>
                            <p className="text-white font-medium">{lead.nome}</p>
                            <p className="text-white/60 text-sm">{lead.email}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-white">{lead.empresa || '-'}</p>
                          <p className="text-white/60 text-sm">{lead.cargo || '-'}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-${statusInfo?.cor}-500/20 text-${statusInfo?.cor}-400`}>
                            {statusInfo?.nome}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            {origemInfo?.icon && <origemInfo.icon className="w-4 h-4 text-white/60" />}
                            <span className="text-white/60 text-sm">{origemInfo?.nome}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-green-400 font-medium">
                            {formatCurrency(lead.valorPotencial)}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              (lead.score || 0) >= 70 ? 'bg-green-400' :
                              (lead.score || 0) >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <span className="text-white">{lead.score || 0}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-white/60 text-sm">
                            {getTempoDesdeContato(lead.updatedAt)}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="p-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              
              {leads.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">Nenhum lead encontrado</p>
                  <button
                    onClick={() => setShowLeadModal(true)}
                    className="mt-4 bg-[#FF2C68] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF2C68]/80 transition-colors"
                  >
                    Adicionar Primeiro Lead
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de Novo Lead */}
      <AnimatePresence>
        {showLeadModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLeadModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] border border-[#FF2C68]/30 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Novo Lead</h3>
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome *</label>
                    <input
                      type="text"
                      value={leadForm.nome}
                      onChange={(e) => setLeadForm({...leadForm, nome: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={leadForm.telefone}
                      onChange={(e) => setLeadForm({...leadForm, telefone: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Empresa</label>
                    <input
                      type="text"
                      value={leadForm.empresa}
                      onChange={(e) => setLeadForm({...leadForm, empresa: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Cargo</label>
                    <input
                      type="text"
                      value={leadForm.cargo}
                      onChange={(e) => setLeadForm({...leadForm, cargo: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Cargo/função"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Origem</label>
                    <select
                      value={leadForm.origem}
                      onChange={(e) => setLeadForm({...leadForm, origem: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none"
                    >
                      {origensLead.map(origem => (
                        <option key={origem.id} value={origem.id}>{origem.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Valor Potencial</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={leadForm.valorPotencial}
                      onChange={(e) => setLeadForm({...leadForm, valorPotencial: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Status</label>
                    <select
                      value={leadForm.status}
                      onChange={(e) => setLeadForm({...leadForm, status: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none"
                    >
                      {statusFunil.filter(s => s.id !== 'perdido').map(status => (
                        <option key={status.id} value={status.id}>{status.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Interesse/Necessidade</label>
                  <textarea
                    value={leadForm.interesse}
                    onChange={(e) => setLeadForm({...leadForm, interesse: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                    placeholder="Descreva o interesse ou necessidade do lead..."
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Observações</label>
                  <textarea
                    value={leadForm.observacoes}
                    onChange={(e) => setLeadForm({...leadForm, observacoes: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                    placeholder="Observações adicionais..."
                    rows="3"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLeadModal(false)}
                    className="flex-1 py-3 bg-gray-500/20 text-gray-300 rounded-xl font-medium hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#FF2C68] text-white rounded-xl font-medium hover:bg-[#FF2C68]/80 transition-colors flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Adicionar Lead</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Novo Cliente */}
      <AnimatePresence>
        {showClienteModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClienteModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] border border-[#FF2C68]/30 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Novo Cliente</h3>
                <button
                  onClick={() => setShowClienteModal(false)}
                  className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleClienteSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome *</label>
                    <input
                      type="text"
                      value={clienteForm.nome}
                      onChange={(e) => setClienteForm({...clienteForm, nome: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={clienteForm.email}
                      onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={clienteForm.telefone}
                      onChange={(e) => setClienteForm({...clienteForm, telefone: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Empresa</label>
                    <input
                      type="text"
                      value={clienteForm.empresa}
                      onChange={(e) => setClienteForm({...clienteForm, empresa: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Endereço</label>
                  <input
                    type="text"
                    value={clienteForm.endereco}
                    onChange={(e) => setClienteForm({...clienteForm, endereco: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Cidade</label>
                    <input
                      type="text"
                      value={clienteForm.cidade}
                      onChange={(e) => setClienteForm({...clienteForm, cidade: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Cidade"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Estado</label>
                    <input
                      type="text"
                      value={clienteForm.estado}
                      onChange={(e) => setClienteForm({...clienteForm, estado: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="SP"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">CEP</label>
                    <input
                      type="text"
                      value={clienteForm.cep}
                      onChange={(e) => setClienteForm({...clienteForm, cep: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Segmento</label>
                    <select
                      value={clienteForm.segmento}
                      onChange={(e) => setClienteForm({...clienteForm, segmento: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none"
                    >
                      <option value="">Selecione um segmento</option>
                      <option value="varejo">Varejo</option>
                      <option value="atacado">Atacado</option>
                      <option value="servicos">Serviços</option>
                      <option value="industria">Indústria</option>
                      <option value="tecnologia">Tecnologia</option>
                      <option value="saude">Saúde</option>
                      <option value="educacao">Educação</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Valor Total Compras</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={clienteForm.valorTotal}
                      onChange={(e) => setClienteForm({...clienteForm, valorTotal: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowClienteModal(false)}
                    className="flex-1 py-3 bg-gray-500/20 text-gray-300 rounded-xl font-medium hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Adicionar Cliente</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 