import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Automacoes() {
  const [loading, setLoading] = useState(true);
  const [automacoes, setAutomacoes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomacao, setEditingAutomacao] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'alerta_estoque',
    condicoes: {},
    acoes: [],
    ativo: true,
    frequencia: 'tempo_real'
  });

  const tiposAutomacao = [
    {
      id: 'alerta_estoque',
      nome: 'Alerta de Estoque',
      descricao: 'Notifica quando produtos estão com estoque baixo',
      icon: Package,
      color: 'orange'
    },
    {
      id: 'meta_vendas',
      nome: 'Meta de Vendas',
      descricao: 'Acompanha metas e envia relatórios de performance',
      icon: Target,
      color: 'green'
    },
    {
      id: 'cliente_inativo',
      nome: 'Cliente Inativo',
      descricao: 'Identifica clientes inativos para reativação',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'backup_automatico',
      nome: 'Backup Automático',
      descricao: 'Realiza backup dos dados periodicamente',
      icon: Database,
      color: 'purple'
    },
    {
      id: 'relatorio_diario',
      nome: 'Relatório Diário',
      descricao: 'Envia relatórios automáticos por período',
      icon: FileText,
      color: 'cyan'
    },
    {
      id: 'aniversario_cliente',
      nome: 'Aniversário de Cliente',
      descricao: 'Envia mensagens de aniversário automáticas',
      icon: Calendar,
      color: 'pink'
    }
  ];

  const canaisNotificacao = [
    { id: 'email', nome: 'Email', icon: Mail, color: 'blue' },
    { id: 'whatsapp', nome: 'WhatsApp', icon: MessageSquare, color: 'green' },
    { id: 'sms', nome: 'SMS', icon: Smartphone, color: 'purple' },
    { id: 'push', nome: 'Push', icon: Bell, color: 'orange' },
    { id: 'dashboard', nome: 'Dashboard', icon: BarChart3, color: 'cyan' }
  ];

  const frequencias = [
    { value: 'tempo_real', label: 'Tempo Real' },
    { value: 'diario', label: 'Diário' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'personalizado', label: 'Personalizado' }
  ];

  // Estatísticas de automações
  const [stats, setStats] = useState({
    totalAutomacoes: 0,
    ativas: 0,
    executadas: 0,
    economia: 0
  });

  useEffect(() => {
    loadAutomacoes();
    loadStats();
  }, []);

  const loadAutomacoes = async () => {
    try {
      setLoading(true);
      const automacoesQuery = query(
        collection(db, 'automacoes'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(automacoesQuery);
      const automacoesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAutomacoes(automacoesData);
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
      toast.error('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Simular estatísticas (implementar lógica real depois)
    setStats({
      totalAutomacoes: automacoes.length,
      ativas: automacoes.filter(a => a.ativo).length,
      executadas: 1247,
      economia: 85
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const automacaoData = {
        ...formData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        execucoes: 0,
        ultimaExecucao: null
      };

      if (editingAutomacao) {
        await updateDoc(doc(db, 'automacoes', editingAutomacao.id), {
          ...automacaoData,
          updatedAt: Timestamp.now()
        });
        toast.success('Automação atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'automacoes'), automacaoData);
        toast.success('Automação criada com sucesso!');
      }

      setShowCreateModal(false);
      setEditingAutomacao(null);
      resetForm();
      loadAutomacoes();
      
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
      toast.error('Erro ao salvar automação');
    }
  };

  const toggleAutomacao = async (id, ativo) => {
    try {
      await updateDoc(doc(db, 'automacoes', id), {
        ativo: !ativo,
        updatedAt: Timestamp.now()
      });
      
      toast.success(`Automação ${!ativo ? 'ativada' : 'desativada'} com sucesso!`);
      loadAutomacoes();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da automação');
    }
  };

  const deleteAutomacao = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) return;
    
    try {
      await deleteDoc(doc(db, 'automacoes', id));
      toast.success('Automação excluída com sucesso!');
      loadAutomacoes();
    } catch (error) {
      console.error('Erro ao excluir automação:', error);
      toast.error('Erro ao excluir automação');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'alerta_estoque',
      condicoes: {},
      acoes: [],
      ativo: true,
      frequencia: 'tempo_real'
    });
  };

  const executarTeste = async (automacao) => {
    try {
      // Simular execução de teste
      toast.loading('Executando teste da automação...', { duration: 2000 });
      
      setTimeout(() => {
        toast.success('✅ Teste executado com sucesso!');
        
        // Simular diferentes tipos de teste
        if (automacao.tipo === 'alerta_estoque') {
          toast.info('📦 3 produtos com estoque baixo detectados');
        } else if (automacao.tipo === 'meta_vendas') {
          toast.info('🎯 Meta atual: 78% concluída');
        } else if (automacao.tipo === 'cliente_inativo') {
          toast.info('👥 12 clientes inativos identificados');
        }
      }, 2000);
      
    } catch (error) {
      toast.error('Erro ao executar teste');
    }
  };

  const automacoesPreConfiguradas = [
    {
      nome: 'Alerta de Estoque Crítico',
      tipo: 'alerta_estoque',
      descricao: 'Notifica quando produtos têm menos de 5 unidades',
      condicoes: { limite: 5 },
      acoes: ['email', 'push'],
      icon: '📦',
      categoria: 'Estoque'
    },
    {
      nome: 'Relatório de Vendas Diário',
      tipo: 'relatorio_diario',
      descricao: 'Envia resumo de vendas todos os dias às 18h',
      condicoes: { horario: '18:00' },
      acoes: ['email'],
      icon: '📊',
      categoria: 'Relatórios'
    },
    {
      nome: 'Follow-up de Clientes',
      tipo: 'cliente_inativo',
      descricao: 'Contata clientes inativos há mais de 30 dias',
      condicoes: { diasInativo: 30 },
      acoes: ['whatsapp', 'email'],
      icon: '🤝',
      categoria: 'CRM'
    },
    {
      nome: 'Backup Semanal',
      tipo: 'backup_automatico',
      descricao: 'Backup completo dos dados toda segunda-feira',
      condicoes: { diaSemana: 1 },
      acoes: ['cloud'],
      icon: '☁️',
      categoria: 'Segurança'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white/60">Carregando automações...</p>
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
            🤖 Central de Automações
          </h1>
          <p className="text-white/60">
            Automatize processos e economize tempo com inteligência artificial
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FF2C68] to-[#FF2C68]/80 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            <span>Nova Automação</span>
          </motion.button>
          
          <button
            onClick={loadAutomacoes}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
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
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'automacoes', label: 'Automações', icon: Bot },
          { id: 'templates', label: 'Templates', icon: Workflow },
          { id: 'configuracoes', label: 'Configurações', icon: Settings }
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

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total de Automações',
                value: stats.totalAutomacoes,
                icon: Bot,
                color: 'blue',
                change: '+3 este mês'
              },
              {
                title: 'Automações Ativas',
                value: stats.ativas,
                icon: Zap,
                color: 'green',
                change: `${Math.round((stats.ativas / stats.totalAutomacoes) * 100) || 0}% ativas`
              },
              {
                title: 'Execuções Today',
                value: '47',
                icon: Play,
                color: 'purple',
                change: '+12% vs ontem'
              },
              {
                title: 'Tempo Economizado',
                value: `${stats.economia}h`,
                icon: Clock,
                color: 'orange',
                change: 'este mês'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                className={`bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/10 backdrop-blur-xl border border-${stat.color}-500/20 rounded-2xl p-6`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                  </div>
                  <span className={`text-${stat.color}-400 text-sm font-medium`}>
                    {stat.change}
                  </span>
                </div>
                <p className={`text-${stat.color}-400 text-sm font-medium mb-1`}>{stat.title}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Execuções Recentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Execuções Recentes</h3>
              <Activity className="w-6 h-6 text-[#FF2C68]" />
            </div>
            
            <div className="space-y-4">
              {[
                {
                  nome: 'Alerta de Estoque Crítico',
                  status: 'sucesso',
                  tempo: '2 min atrás',
                  resultado: '3 produtos alertados'
                },
                {
                  nome: 'Relatório Diário de Vendas',
                  status: 'sucesso',
                  tempo: '1 hora atrás',
                  resultado: 'Email enviado para 5 usuários'
                },
                {
                  nome: 'Backup Automático',
                  status: 'executando',
                  tempo: 'Em andamento',
                  resultado: '75% concluído'
                },
                {
                  nome: 'Follow-up de Clientes',
                  status: 'sucesso',
                  tempo: '3 horas atrás',
                  resultado: '12 mensagens enviadas'
                }
              ].map((execucao, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#0D0C0C]/30 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      execucao.status === 'sucesso' ? 'bg-green-500/20' :
                      execucao.status === 'executando' ? 'bg-blue-500/20' : 'bg-red-500/20'
                    }`}>
                      {execucao.status === 'sucesso' ? (
                        <CheckCircle className={`w-5 h-5 text-green-400`} />
                      ) : execucao.status === 'executando' ? (
                        <Clock className={`w-5 h-5 text-blue-400`} />
                      ) : (
                        <AlertTriangle className={`w-5 h-5 text-red-400`} />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{execucao.nome}</p>
                      <p className="text-white/60 text-sm">{execucao.resultado}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      execucao.status === 'sucesso' ? 'text-green-400' :
                      execucao.status === 'executando' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {execucao.status === 'sucesso' ? 'Sucesso' :
                       execucao.status === 'executando' ? 'Executando' : 'Erro'}
                    </p>
                    <p className="text-white/60 text-xs">{execucao.tempo}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Automações Tab */}
      {activeTab === 'automacoes' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {automacoes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {automacoes.map((automacao, index) => {
                const tipoInfo = tiposAutomacao.find(t => t.id === automacao.tipo);
                
                return (
                  <motion.div
                    key={automacao.id}
                    className={`bg-[#0D0C0C]/50 backdrop-blur-xl border rounded-2xl p-6 ${
                      automacao.ativo ? 'border-green-500/20' : 'border-gray-500/20'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-${tipoInfo?.color || 'gray'}-500/20 rounded-xl flex items-center justify-center`}>
                          {tipoInfo?.icon && <tipoInfo.icon className={`w-6 h-6 text-${tipoInfo.color}-400`} />}
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{automacao.nome}</h3>
                          <p className="text-white/60 text-sm">{tipoInfo?.nome}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAutomacao(automacao.id, automacao.ativo)}
                          className={`p-2 rounded-lg transition-colors ${
                            automacao.ativo 
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                          }`}
                        >
                          {automacao.ativo ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => executarTeste(automacao)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditingAutomacao(automacao);
                            setFormData(automacao);
                            setShowCreateModal(true);
                          }}
                          className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteAutomacao(automacao.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Status:</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          automacao.ativo 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {automacao.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Frequência:</span>
                        <span className="text-white text-sm">
                          {frequencias.find(f => f.value === automacao.frequencia)?.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Execuções:</span>
                        <span className="text-white text-sm">{automacao.execucoes || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Bot className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma automação configurada</h3>
              <p className="text-white/60 mb-6">Crie sua primeira automação para começar a economizar tempo</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#FF2C68] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF2C68]/80 transition-colors"
              >
                Criar Primeira Automação
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {automacoesPreConfiguradas.map((template, index) => (
              <motion.div
                key={index}
                className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{template.nome}</h3>
                    <p className="text-white/60 text-sm mb-2">{template.descricao}</p>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                      {template.categoria}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {template.acoes.map((acao, actionIndex) => {
                      const canal = canaisNotificacao.find(c => c.id === acao);
                      return canal ? (
                        <div
                          key={actionIndex}
                          className={`p-2 bg-${canal.color}-500/20 rounded-lg`}
                          title={canal.nome}
                        >
                          <canal.icon className={`w-4 h-4 text-${canal.color}-400`} />
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => {
                      setFormData({
                        nome: template.nome,
                        tipo: template.tipo,
                        condicoes: template.condicoes,
                        acoes: template.acoes,
                        ativo: true,
                        frequencia: 'tempo_real'
                      });
                      setShowCreateModal(true);
                    }}
                    className="bg-[#FF2C68] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#FF2C68]/80 transition-colors"
                  >
                    Usar Template
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modal de Criação/Edição */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowCreateModal(false);
              setEditingAutomacao(null);
              resetForm();
            }}
          >
            <motion.div
              className="bg-[#0D0C0C] border border-[#FF2C68]/30 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingAutomacao ? 'Editar Automação' : 'Nova Automação'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAutomacao(null);
                    resetForm();
                  }}
                  className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-white font-medium mb-2">Nome da Automação</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                    placeholder="Ex: Alerta de Estoque Baixo"
                    required
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-white font-medium mb-2">Tipo de Automação</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none"
                  >
                    {tiposAutomacao.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Frequência */}
                <div>
                  <label className="block text-white font-medium mb-2">Frequência</label>
                  <select
                    value={formData.frequencia}
                    onChange={(e) => setFormData({...formData, frequencia: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none"
                  >
                    {frequencias.map(freq => (
                      <option key={freq.value} value={freq.value}>{freq.label}</option>
                    ))}
                  </select>
                </div>

                {/* Canais de Notificação */}
                <div>
                  <label className="block text-white font-medium mb-2">Canais de Notificação</label>
                  <div className="grid grid-cols-2 gap-3">
                    {canaisNotificacao.map(canal => (
                      <label
                        key={canal.id}
                        className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                          formData.acoes?.includes(canal.id)
                            ? `border-${canal.color}-500 bg-${canal.color}-500/10`
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.acoes?.includes(canal.id) || false}
                          onChange={(e) => {
                            const newAcoes = e.target.checked
                              ? [...(formData.acoes || []), canal.id]
                              : (formData.acoes || []).filter(a => a !== canal.id);
                            setFormData({...formData, acoes: newAcoes});
                          }}
                          className="hidden"
                        />
                        <canal.icon className={`w-5 h-5 text-${canal.color}-400`} />
                        <span className="text-white">{canal.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                    className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                  />
                  <label htmlFor="ativo" className="text-white font-medium">
                    Ativar automação imediatamente
                  </label>
                </div>

                {/* Botões */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingAutomacao(null);
                      resetForm();
                    }}
                    className="flex-1 py-3 bg-gray-500/20 text-gray-300 rounded-xl font-medium hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#FF2C68] text-white rounded-xl font-medium hover:bg-[#FF2C68]/80 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingAutomacao ? 'Atualizar' : 'Criar'} Automação</span>
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