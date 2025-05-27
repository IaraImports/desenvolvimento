import React, { useState, useEffect } from 'react';
import {
  Zap,
  Bot,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Smartphone,
  Users,
  Package,
  DollarSign,
  FileText,
  BarChart3,
  Target,
  Shield,
  Workflow,
  Cpu,
  Database,
  Cloud,
  RefreshCw,
  Activity,
  Timer,
  Filter,
  Search,
  Brain,
  Cog,
  Star,
  Lightbulb
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Automacoes() {
  const [loading, setLoading] = useState(true);
  const [automacoes, setAutomacoes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomacao, setEditingAutomacao] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'alerta_estoque',
    descricao: '',
    condicoes: {
      valorLimite: 5,
      operador: 'menor_igual',
      campo: 'estoque'
    },
    acoes: ['notificacao_sistema'],
    ativo: true,
    frequencia: 'tempo_real',
    canaisNotificacao: ['dashboard'],
    prioridade: 'media'
  });

  const tiposAutomacao = [
    {
      id: 'alerta_estoque',
      nome: 'Controle de Estoque',
      descricao: 'Monitor automático de níveis de estoque com alertas inteligentes',
      icon: Package,
      categoria: 'Operacional'
    },
    {
      id: 'meta_vendas',
      nome: 'Performance de Vendas',
      descricao: 'Acompanhamento de metas com relatórios automáticos',
      icon: Target,
      categoria: 'Comercial'
    },
    {
      id: 'cliente_inativo',
      nome: 'Reativação de Clientes',
      descricao: 'Identifica e engaja clientes inativos automaticamente',
      icon: Users,
      categoria: 'CRM'
    },
    {
      id: 'backup_automatico',
      nome: 'Backup Inteligente',
      descricao: 'Sistema de backup automático com verificação de integridade',
      icon: Database,
      categoria: 'Segurança'
    },
    {
      id: 'relatorio_financeiro',
      nome: 'Relatórios Financeiros',
      descricao: 'Análises financeiras automáticas e alertas de fluxo de caixa',
      icon: DollarSign,
      categoria: 'Financeiro'
    },
    {
      id: 'aniversario_cliente',
      nome: 'Marketing Personalizado',
      descricao: 'Campanhas automáticas baseadas em datas especiais',
      icon: Calendar,
      categoria: 'Marketing'
    }
  ];

  const canaisNotificacao = [
    { id: 'email', nome: 'Email', icon: Mail },
    { id: 'whatsapp', nome: 'WhatsApp', icon: MessageSquare },
    { id: 'sms', nome: 'SMS', icon: Smartphone },
    { id: 'push', nome: 'Push', icon: Bell },
    { id: 'dashboard', nome: 'Dashboard', icon: BarChart3 }
  ];

  const frequencias = [
    { value: 'tempo_real', label: 'Tempo Real', icon: Clock },
    { value: 'diario', label: 'Diário', icon: Calendar },
    { value: 'semanal', label: 'Semanal', icon: Calendar },
    { value: 'mensal', label: 'Mensal', icon: Calendar }
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ];

  // Estatísticas de automações
  const [stats, setStats] = useState({
    totalAutomacoes: 0,
    ativas: 0,
    executadas: 0,
    economia: 0
  });

  const loadAutomacoes = async () => {
    try {
      setLoading(true);
      const automacaoCollection = collection(db, 'automacoes');
      const q = query(automacaoCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const automacoesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAutomacoes(automacoesList);
      
      // Calcular estatísticas
      setStats({
        totalAutomacoes: automacoesList.length,
        ativas: automacoesList.filter(a => a.ativo).length,
        executadas: automacoesList.reduce((acc, a) => acc + (a.execucoes || 0), 0),
        economia: 75
      });
      
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
      toast.error('Erro ao carregar automações');
      
      // Fallback para dados de exemplo
      setAutomacoes(exemploAutomacoes);
      setStats({
        totalAutomacoes: exemploAutomacoes.length,
        ativas: exemploAutomacoes.filter(a => a.ativo).length,
        executadas: exemploAutomacoes.reduce((acc, a) => acc + a.execucoes, 0),
        economia: 75
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomacoes();
  }, []);

  // Dados de exemplo para demonstração (fallback)
  const exemploAutomacoes = [
    {
      id: '1',
      nome: 'Alerta Estoque Baixo',
      tipo: 'alerta_estoque',
      descricao: 'Monitora produtos com estoque abaixo de 5 unidades',
      ativo: true,
      frequencia: 'tempo_real',
      execucoes: 45,
      ultimaExecucao: new Date().toLocaleDateString(),
      prioridade: 'alta',
      economia: 25
    },
    {
      id: '2',
      nome: 'Relatório Vendas Diário',
      tipo: 'meta_vendas',
      descricao: 'Envia relatório automático de vendas às 18h',
      ativo: true,
      frequencia: 'diario',
      execucoes: 127,
      ultimaExecucao: new Date().toLocaleDateString(),
      prioridade: 'media',
      economia: 15
    },
    {
      id: '3',
      nome: 'Reativação Cliente 90 dias',
      tipo: 'cliente_inativo',
      descricao: 'Identifica clientes inativos há mais de 90 dias',
      ativo: false,
      frequencia: 'semanal',
      execucoes: 23,
      ultimaExecucao: '15/12/2024',
      prioridade: 'media',
      economia: 35
    }
  ];

  const filteredAutomacoes = automacoes.filter(automacao => {
    const matchesSearch = automacao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         automacao.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filtroStatus === 'todos' || 
                         (filtroStatus === 'ativas' && automacao.ativo) ||
                         (filtroStatus === 'inativas' && !automacao.ativo);
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAutomacao) {
        // Atualizar automação existente
        const automacaoRef = doc(db, 'automacoes', editingAutomacao.id);
        await updateDoc(automacaoRef, {
          ...formData,
          updatedAt: Timestamp.now()
        });
        toast.success('Automação atualizada com sucesso!');
      } else {
        // Criar nova automação
        await addDoc(collection(db, 'automacoes'), {
          ...formData,
          createdAt: Timestamp.now(),
          execucoes: 0,
          ultimaExecucao: null,
          economia: Math.floor(Math.random() * 50) + 10 // Economia simulada
        });
        toast.success('Automação criada com sucesso!');
      }

      setShowCreateModal(false);
      setEditingAutomacao(null);
      resetForm();
      loadAutomacoes(); // Recarregar lista
      
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
      toast.error('Erro ao salvar automação');
    }
  };

  const toggleAutomacao = async (id) => {
    try {
      const automacao = automacoes.find(a => a.id === id);
      const automacaoRef = doc(db, 'automacoes', id);
      
      await updateDoc(automacaoRef, {
        ativo: !automacao.ativo,
        updatedAt: Timestamp.now()
      });
      
      toast.success(`Automação ${!automacao.ativo ? 'ativada' : 'desativada'}!`);
      loadAutomacoes(); // Recarregar lista
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da automação');
    }
  };

  const deleteAutomacao = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta automação?')) {
      try {
        await deleteDoc(doc(db, 'automacoes', id));
        toast.success('Automação excluída com sucesso!');
        loadAutomacoes(); // Recarregar lista
      } catch (error) {
        console.error('Erro ao excluir automação:', error);
        toast.error('Erro ao excluir automação');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'alerta_estoque',
      descricao: '',
      condicoes: {
        valorLimite: 5,
        operador: 'menor_igual',
        campo: 'estoque'
      },
      acoes: ['notificacao_sistema'],
      ativo: true,
      frequencia: 'tempo_real',
      canaisNotificacao: ['dashboard'],
      prioridade: 'media'
    });
  };

  const executarTeste = async (automacao) => {
    toast.loading('Executando teste da automação...', { duration: 2000 });
    
    try {
      // Simular execução e atualizar no Firebase
      const automacaoRef = doc(db, 'automacoes', automacao.id);
      await updateDoc(automacaoRef, {
        execucoes: (automacao.execucoes || 0) + 1,
        ultimaExecucao: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      setTimeout(() => {
        toast.success('Teste executado com sucesso! ✅');
        loadAutomacoes(); // Recarregar lista
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao executar teste:', error);
      toast.error('Erro ao executar teste');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Profissional */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2C68]/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>
        <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF2C68] to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                  🤖 Automações Inteligentes
                </h1>
                <p className="text-gray-400 text-lg mt-1">
                  Sistema avançado de automação para otimizar processos
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">{stats.ativas} Ativas</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">{stats.executadas} Execuções</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#FF2C68]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{stats.economia}% Economia</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="group px-8 py-4 bg-gradient-to-r from-[#FF2C68] to-pink-600 rounded-2xl text-white font-bold hover:from-[#FF2C68]/80 hover:to-pink-600/80 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-[#FF2C68]/25 flex items-center space-x-3"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span>Nova Automação</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Automações</p>
              <p className="text-3xl font-bold text-white">{stats.totalAutomacoes}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Workflow className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-green-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Automações Ativas</p>
              <p className="text-3xl font-bold text-green-400">{stats.ativas}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Execuções</p>
              <p className="text-3xl font-bold text-blue-400">{stats.executadas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-[#FF2C68]/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Economia de Tempo</p>
              <p className="text-3xl font-bold text-[#FF2C68]">{stats.economia}%</p>
            </div>
            <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#FF2C68]" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar automações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-white/60" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
            >
              <option value="todos">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="inativas">Inativas</option>
            </select>
            
            <button
              onClick={loadAutomacoes}
              disabled={loading}
              className="px-4 py-3 bg-black/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors border border-gray-600 flex items-center space-x-2 disabled:opacity-50"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Automações */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">🔧 Suas Automações</h2>
          <p className="text-gray-400 mt-1">{filteredAutomacoes.length} automações encontradas</p>
        </div>
        
        <div className="p-6">
          <div className="grid gap-6">
            {filteredAutomacoes.map((automacao) => {
              const tipoInfo = tiposAutomacao.find(t => t.id === automacao.tipo);
              const IconComponent = tipoInfo?.icon || Bot;
              
              return (
                <div
                  key={automacao.id}
                  className={`group bg-black/30 rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] ${
                    automacao.ativo 
                      ? 'border-green-500/30 hover:border-green-500/50' 
                      : 'border-gray-600/50 hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                                              <div className={`w-16 h-16 bg-gradient-to-br ${
                          automacao.tipo === 'alerta_estoque' ? 'from-orange-500 to-orange-600' :
                          automacao.tipo === 'meta_vendas' ? 'from-green-500 to-green-600' :
                          automacao.tipo === 'cliente_inativo' ? 'from-blue-500 to-blue-600' :
                          automacao.tipo === 'backup_automatico' ? 'from-purple-500 to-purple-600' :
                          automacao.tipo === 'relatorio_financeiro' ? 'from-cyan-500 to-cyan-600' :
                          automacao.tipo === 'aniversario_cliente' ? 'from-pink-500 to-pink-600' :
                          'from-gray-500 to-gray-600'
                        } rounded-2xl flex items-center justify-center shadow-lg`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-[#FF2C68] transition-colors">
                            {automacao.nome}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            automacao.ativo 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {automacao.ativo ? 'Ativa' : 'Inativa'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            automacao.prioridade === 'critica' ? 'bg-red-500/20 text-red-400' :
                            automacao.prioridade === 'alta' ? 'bg-orange-500/20 text-orange-400' :
                            automacao.prioridade === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {prioridades.find(p => p.value === automacao.prioridade)?.label || 'Média'}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 mb-4">{automacao.descricao}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-black/50 rounded-xl p-3">
                            <div className="flex items-center space-x-2 text-blue-400 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">Frequência</span>
                            </div>
                            <p className="text-white font-bold">
                              {frequencias.find(f => f.value === automacao.frequencia)?.label || 'Tempo Real'}
                            </p>
                          </div>
                          
                          <div className="bg-black/50 rounded-xl p-3">
                            <div className="flex items-center space-x-2 text-green-400 mb-1">
                              <Activity className="w-4 h-4" />
                              <span className="text-xs font-medium">Execuções</span>
                            </div>
                            <p className="text-white font-bold">{automacao.execucoes || 0}</p>
                          </div>
                          
                          <div className="bg-black/50 rounded-xl p-3">
                            <div className="flex items-center space-x-2 text-purple-400 mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs font-medium">Última Execução</span>
                            </div>
                            <p className="text-white font-bold text-sm">
                              {automacao.ultimaExecucao ? 
                                new Date(automacao.ultimaExecucao.toDate()).toLocaleDateString() : 
                                'Nunca'
                              }
                            </p>
                          </div>
                          
                          <div className="bg-black/50 rounded-xl p-3">
                            <div className="flex items-center space-x-2 text-[#FF2C68] mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-medium">Economia</span>
                            </div>
                            <p className="text-white font-bold">{automacao.economia || 25}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => executarTeste(automacao)}
                        className="p-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors"
                        title="Executar Teste"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => toggleAutomacao(automacao.id)}
                        className={`p-3 rounded-xl transition-colors ${
                          automacao.ativo 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                        title={automacao.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {automacao.ativo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingAutomacao(automacao);
                          setFormData(automacao);
                          setShowCreateModal(true);
                        }}
                        className="p-3 bg-[#FF2C68]/20 text-[#FF2C68] rounded-xl hover:bg-[#FF2C68]/30 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => deleteAutomacao(automacao.id)}
                        className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredAutomacoes.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Bot className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Nenhuma automação encontrada</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Crie sua primeira automação para começar'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-[#FF2C68]/20 text-[#FF2C68] rounded-xl hover:bg-[#FF2C68]/30 transition-colors"
              >
                Criar Primeira Automação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FF2C68] to-pink-600 rounded-2xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editingAutomacao ? 'Editar Automação' : 'Nova Automação'}
                    </h2>
                    <p className="text-gray-400">Configure sua automação inteligente</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAutomacao(null);
                    resetForm();
                  }}
                  className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informações Básicas */}
                <div className="bg-black/30 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📋 Informações Básicas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Nome da Automação</label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
                        placeholder="Ex: Alerta de Estoque Baixo"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Tipo de Automação</label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
                      >
                        {tiposAutomacao.map(tipo => (
                          <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-white font-medium mb-2">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
                      placeholder="Descreva o que esta automação fará..."
                      rows="3"
                    />
                  </div>
                </div>

                {/* Configurações */}
                <div className="bg-black/30 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-6">⚙️ Configurações</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Frequência</label>
                      <select
                        value={formData.frequencia}
                        onChange={(e) => setFormData({ ...formData, frequencia: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
                      >
                        {frequencias.map(freq => (
                          <option key={freq.value} value={freq.value}>{freq.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Prioridade</label>
                      <select
                        value={formData.prioridade}
                        onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
                      >
                        {prioridades.map(prio => (
                          <option key={prio.value} value={prio.value}>{prio.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-white font-medium mb-4">Canais de Notificação</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {canaisNotificacao.map(canal => (
                        <button
                          key={canal.id}
                          type="button"
                          onClick={() => {
                            const canais = formData.canaisNotificacao.includes(canal.id)
                              ? formData.canaisNotificacao.filter(c => c !== canal.id)
                              : [...formData.canaisNotificacao, canal.id];
                            setFormData({ ...formData, canaisNotificacao: canais });
                          }}
                          className={`p-4 rounded-xl border transition-all ${
                            formData.canaisNotificacao.includes(canal.id)
                              ? 'border-[#FF2C68] bg-[#FF2C68]/20 text-[#FF2C68]'
                              : 'border-white/20 text-white/60 hover:border-white/40'
                          }`}
                        >
                          <canal.icon className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-xs font-medium">{canal.nome}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingAutomacao(null);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-[#FF2C68] to-pink-600 text-white font-bold rounded-xl hover:from-[#FF2C68]/80 hover:to-pink-600/80 transition-all"
                  >
                    {editingAutomacao ? 'Atualizar' : 'Criar'} Automação
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 