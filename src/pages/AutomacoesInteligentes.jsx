import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Bot,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Activity,
  Brain,
  Workflow,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Database,
  Filter,
  ArrowRight,
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  FileText,
  Search,
  Download,
  Upload,
  Cloud,
  Smartphone,
  Globe,
  Shield,
  Layers,
  GitBranch,
  Command,
  Cpu,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

const AUTOMATION_TYPES = [
  {
    id: 'sales',
    title: 'Automações de Vendas',
    icon: ShoppingCart,
    color: 'blue',
    gradient: 'from-blue-600 to-blue-800',
    description: 'Automatize processos de vendas e follow-up'
  },
  {
    id: 'marketing',
    title: 'Marketing Automation',
    icon: Target,
    color: 'purple',
    gradient: 'from-purple-600 to-purple-800',
    description: 'Campanhas e comunicação automatizada'
  },
  {
    id: 'customer',
    title: 'Atendimento ao Cliente',
    icon: Users,
    color: 'green',
    gradient: 'from-green-600 to-green-800',
    description: 'Suporte e relacionamento automatizado'
  },
  {
    id: 'finance',
    title: 'Automações Financeiras',
    icon: DollarSign,
    color: 'emerald',
    gradient: 'from-emerald-600 to-emerald-800',
    description: 'Gestão financeira inteligente'
  },
  {
    id: 'inventory',
    title: 'Gestão de Estoque',
    icon: Package,
    color: 'orange',
    gradient: 'from-orange-600 to-orange-800',
    description: 'Controle automático de inventário'
  },
  {
    id: 'ai',
    title: 'IA & Machine Learning',
    icon: Brain,
    color: 'pink',
    gradient: 'from-pink-600 to-pink-800',
    description: 'Automações inteligentes com IA'
  }
];

const TRIGGER_TYPES = [
  { id: 'schedule', name: 'Agendamento', icon: Clock },
  { id: 'event', name: 'Evento do Sistema', icon: Zap },
  { id: 'condition', name: 'Condição Específica', icon: Filter },
  { id: 'webhook', name: 'Webhook/API', icon: Globe },
  { id: 'manual', name: 'Trigger Manual', icon: Command }
];

const ACTION_TYPES = [
  { id: 'email', name: 'Enviar Email', icon: Mail },
  { id: 'sms', name: 'Enviar SMS', icon: MessageSquare },
  { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone },
  { id: 'notification', name: 'Notificação', icon: Bell },
  { id: 'database', name: 'Atualizar Dados', icon: Database },
  { id: 'report', name: 'Gerar Relatório', icon: FileText },
  { id: 'api', name: 'Chamar API', icon: Cloud },
  { id: 'ai', name: 'Processamento IA', icon: Brain }
];

export default function AutomacoesInteligentes() {
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('sales');
  const [automations, setAutomations] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    loadAutomations();
    loadExecutionLogs();
    loadStatistics();
  }, [selectedType]);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      // Consulta simples sem índice composto
      const snapshot = await getDocs(collection(db, 'automacoes'));
      const allAutomations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrar e ordenar no cliente
      const filteredAutomations = allAutomations
        .filter(automation => automation.type === selectedType)
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate - aDate;
        });
      
      setAutomations(filteredAutomations);
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
      toast.error('Erro ao carregar automações');
      // Fallback com dados de exemplo
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionLogs = async () => {
    try {
      // Consulta simples sem ordenação
      const snapshot = await getDocs(collection(db, 'automation_logs'));
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar no cliente e limitar a 50
      const sortedLogs = logs
        .sort((a, b) => {
          const aDate = a.timestamp?.toDate?.() || new Date(0);
          const bDate = b.timestamp?.toDate?.() || new Date(0);
          return bDate - aDate;
        })
        .slice(0, 50);
      
      setExecutionLogs(sortedLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setExecutionLogs([]);
    }
  };

  const loadStatistics = async () => {
    try {
      // Carregar estatísticas de execução das automações
      const stats = {
        totalAutomations: automations.length,
        activeAutomations: automations.filter(a => a.active).length,
        totalExecutions: executionLogs.length,
        successRate: calculateSuccessRate(executionLogs),
        timeSaved: calculateTimeSaved(executionLogs),
        costSavings: calculateCostSavings(executionLogs)
      };
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  const calculateSuccessRate = (logs) => {
    if (logs.length === 0) return 0;
    const successful = logs.filter(log => log.status === 'success').length;
    return Math.round((successful / logs.length) * 100);
  };

  const calculateTimeSaved = (logs) => {
    // Calcular tempo economizado baseado nas execuções
    return logs.reduce((total, log) => total + (log.timeSaved || 5), 0); // 5 min por execução
  };

  const calculateCostSavings = (logs) => {
    // Calcular economia de custos
    return logs.length * 15; // R$ 15 por execução automatizada
  };

  const createAutomation = async (automationData) => {
    try {
      const newAutomation = {
        ...automationData,
        type: selectedType,
        active: true,
        createdAt: Timestamp.fromDate(new Date()),
        executions: 0,
        lastExecution: null
      };

      await addDoc(collection(db, 'automacoes'), newAutomation);
      toast.success('Automação criada com sucesso!');
      setShowCreateModal(false);
      loadAutomations();
    } catch (error) {
      console.error('Erro ao criar automação:', error);
      toast.error('Erro ao criar automação');
    }
  };

  const toggleAutomation = async (automationId, currentState) => {
    try {
      await updateDoc(doc(db, 'automacoes', automationId), {
        active: !currentState
      });
      toast.success(currentState ? 'Automação pausada' : 'Automação ativada');
      loadAutomations();
    } catch (error) {
      console.error('Erro ao alterar automação:', error);
      toast.error('Erro ao alterar automação');
    }
  };

  const deleteAutomation = async (automationId) => {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) return;
    
    try {
      await deleteDoc(doc(db, 'automacoes', automationId));
      toast.success('Automação excluída com sucesso');
      loadAutomations();
    } catch (error) {
      console.error('Erro ao excluir automação:', error);
      toast.error('Erro ao excluir automação');
    }
  };

  const executeAutomation = async (automationId) => {
    try {
      // Simular execução da automação
      const log = {
        automationId,
        status: 'success',
        timestamp: Timestamp.fromDate(new Date()),
        timeSaved: Math.floor(Math.random() * 30) + 5,
        details: 'Execução manual realizada com sucesso'
      };

      await addDoc(collection(db, 'automation_logs'), log);
      
      // Atualizar contador de execuções
      const automation = automations.find(a => a.id === automationId);
      await updateDoc(doc(db, 'automacoes', automationId), {
        executions: (automation.executions || 0) + 1,
        lastExecution: Timestamp.fromDate(new Date())
      });

      toast.success('Automação executada com sucesso!');
      loadAutomations();
      loadExecutionLogs();
    } catch (error) {
      console.error('Erro ao executar automação:', error);
      toast.error('Erro ao executar automação');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#FF2C68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-black via-gray-900 to-black min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Automações Inteligentes
            </h1>
            <p className="text-gray-400 mt-2">
              Automatize processos com IA e workflows inteligentes
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#FF2C68] to-pink-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Nova Automação
          </motion.button>
        </div>
      </motion.div>

      {/* Statistics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {[
          {
            title: 'Automações Ativas',
            value: statistics.activeAutomations || 0,
            total: statistics.totalAutomations || 0,
            icon: Bot,
            color: 'blue',
            change: '+3 este mês'
          },
          {
            title: 'Taxa de Sucesso',
            value: `${statistics.successRate || 0}%`,
            icon: CheckCircle,
            color: 'green',
            change: '+2% vs mês anterior'
          },
          {
            title: 'Tempo Economizado',
            value: `${Math.floor((statistics.timeSaved || 0) / 60)}h`,
            subtitle: `${(statistics.timeSaved || 0) % 60}min`,
            icon: Clock,
            color: 'purple',
            change: '+45min esta semana'
          },
          {
            title: 'Economia de Custos',
            value: `R$ ${statistics.costSavings || 0}`,
            icon: DollarSign,
            color: 'emerald',
            change: '+R$ 120 este mês'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${
                stat.color === 'blue' ? 'text-blue-400' :
                stat.color === 'green' ? 'text-green-400' :
                stat.color === 'purple' ? 'text-purple-400' :
                stat.color === 'emerald' ? 'text-emerald-400' :
                'text-white'
              }`} />
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stat.value}
              {stat.total && <span className="text-gray-400 text-lg">/{stat.total}</span>}
            </div>
            <div className="text-sm text-gray-400">{stat.title}</div>
            {stat.subtitle && (
              <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Automation Types Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex overflow-x-auto gap-4 pb-4">
          {AUTOMATION_TYPES.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 min-w-fit ${
                selectedType === type.id
                  ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg`
                  : 'bg-black/40 text-gray-300 hover:bg-black/60 border border-white/10'
              }`}
            >
              <type.icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">{type.title}</div>
                <div className="text-xs opacity-80">{type.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Automations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <AnimatePresence>
          {automations.map((automation, index) => (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${automation.active ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Bot className={`w-5 h-5 ${automation.active ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{automation.name}</h3>
                    <p className="text-xs text-gray-400">{automation.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleAutomation(automation.id, automation.active)}
                    className={`p-2 rounded-lg ${
                      automation.active 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {automation.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => executeAutomation(automation.id)}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  >
                    <Zap className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingAutomation(automation)}
                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteAutomation(automation.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Automation Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    Trigger: {TRIGGER_TYPES.find(t => t.id === automation.trigger?.type)?.name || 'Manual'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    Ações: {automation.actions?.length || 0} configuradas
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Execuções:</span>
                  <span className="text-white font-semibold">{automation.executions || 0}</span>
                </div>

                {automation.lastExecution && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Última execução:</span>
                    <span className="text-gray-300">
                      {new Date(automation.lastExecution.toDate()).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className={`flex items-center gap-2 text-sm ${
                  automation.active ? 'text-green-400' : 'text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    automation.active ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  {automation.active ? 'Ativa' : 'Pausada'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add New Automation Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="bg-black/20 backdrop-blur-sm border border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-[#FF2C68] transition-all duration-300"
        >
                      <div className="p-4 bg-[#FF2C68]/20 rounded-full">
              <Plus className="w-8 h-8 text-[#FF2C68]" />
            </div>
          <div className="text-center">
            <h3 className="font-semibold text-white">Nova Automação</h3>
            <p className="text-sm text-gray-400">Clique para criar</p>
          </div>
        </motion.button>
      </div>

      {/* Recent Execution Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#FF2C68]" />
            <h3 className="text-xl font-bold text-white">Logs de Execução</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadExecutionLogs}
            className="bg-black/50 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-black/70 transition-all duration-300 border border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </motion.button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {executionLogs.slice(0, 10).map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  log.status === 'success' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {log.status === 'success' ? 
                    <CheckCircle className="w-4 h-4" /> : 
                    <AlertTriangle className="w-4 h-4" />
                  }
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    {automations.find(a => a.id === log.automationId)?.name || 'Automação Desconhecida'}
                  </p>
                  <p className="text-xs text-gray-400">{log.details}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-white">
                  {new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString('pt-BR')}
                </p>
                {log.timeSaved && (
                  <p className="text-xs text-green-400">+{log.timeSaved}min economizados</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Create/Edit Automation Modal */}
      <AnimatePresence>
        {(showCreateModal || editingAutomation) && (
          <AutomationModal
            automation={editingAutomation}
            onClose={() => {
              setShowCreateModal(false);
              setEditingAutomation(null);
            }}
            onSave={createAutomation}
            selectedType={selectedType}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Component for Creating/Editing Automations
function AutomationModal({ automation, onClose, onSave, selectedType }) {
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    trigger: automation?.trigger || { type: 'manual', config: {} },
    actions: automation?.actions || [{ type: 'email', config: {} }],
    conditions: automation?.conditions || []
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Nome da automação é obrigatório');
      return;
    }

    onSave(formData);
  };

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
        className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {automation ? 'Editar Automação' : 'Nova Automação'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-black/50 text-gray-300 hover:bg-black/70 transition-colors border border-white/20"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Automação
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
                placeholder="Ex: Lembrete de Follow-up"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/30 focus:outline-none"
                placeholder="Descrição da automação"
              />
            </div>
          </div>

          {/* Trigger Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Gatilho (Trigger)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {TRIGGER_TYPES.map((trigger) => (
                <button
                  key={trigger.id}
                  onClick={() => setFormData({
                    ...formData,
                    trigger: { type: trigger.id, config: {} }
                  })}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    formData.trigger.type === trigger.id
                      ? 'border-[#FF2C68] bg-[#FF2C68]/20 text-[#FF2C68]'
                      : 'border-gray-600 bg-black/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <trigger.icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{trigger.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Ações
            </h3>
            <div className="space-y-4">
              {formData.actions.map((action, index) => (
                <div key={index} className="bg-black/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">Ação {index + 1}</span>
                    {formData.actions.length > 1 && (
                      <button
                        onClick={() => {
                          const newActions = formData.actions.filter((_, i) => i !== index);
                          setFormData({ ...formData, actions: newActions });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ACTION_TYPES.map((actionType) => (
                      <button
                        key={actionType.id}
                        onClick={() => {
                          const newActions = [...formData.actions];
                          newActions[index] = { type: actionType.id, config: {} };
                          setFormData({ ...formData, actions: newActions });
                        }}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          action.type === actionType.id
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : 'border-gray-600 bg-black/50 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <actionType.icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs font-medium">{actionType.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    actions: [...formData.actions, { type: 'email', config: {} }]
                  });
                }}
                className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mx-auto mb-2" />
                Adicionar Ação
              </button>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/20">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-black/50 text-gray-300 rounded-lg hover:bg-black/70 transition-colors border border-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-[#FF2C68] to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              {automation ? 'Salvar Alterações' : 'Criar Automação'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 