import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Filter, Download, Calendar, Clock, User, 
  Activity, Shield, AlertTriangle, Search, RefreshCw,
  FileText, Database, Settings, Users, TrendingUp,
  BarChart3, PieChart, List, Grid, ChevronDown,
  CheckCircle, XCircle, AlertCircle, Info,
  Lock, Unlock, Edit, Trash2, Plus, ExternalLink
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  addDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart as RechartsPieChart, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// Configurações de cores para diferentes tipos de auditoria
const AUDIT_COLORS = {
  'CREATE': '#10B981', // Verde
  'UPDATE': '#F59E0B', // Amarelo
  'DELETE': '#EF4444', // Vermelho
  'VIEW': '#3B82F6',   // Azul
  'LOGIN': '#8B5CF6',  // Roxo
  'LOGOUT': '#6B7280', // Cinza
  'ERROR': '#DC2626',  // Vermelho escuro
  'SYSTEM': '#06B6D4'  // Ciano
};

const AUDIT_TYPES = [
  { value: 'all', label: 'Todas as Atividades', icon: Activity },
  { value: 'user', label: 'Ações de Usuário', icon: User },
  { value: 'system', label: 'Sistema', icon: Settings },
  { value: 'security', label: 'Segurança', icon: Shield },
  { value: 'data', label: 'Dados', icon: Database },
  { value: 'login', label: 'Autenticação', icon: Lock }
];

const RISK_LEVELS = {
  'LOW': { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Baixo' },
  'MEDIUM': { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Médio' },
  'HIGH': { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Alto' },
  'CRITICAL': { color: 'text-red-600', bg: 'bg-red-600/30', label: 'Crítico' }
};

export default function SistemaAuditoria() {
  const { user, userProfile } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('list'); // list, analytics, timeline
  const [selectedUser, setSelectedUser] = useState('all');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalActivities: 0,
    criticalEvents: 0,
    uniqueUsers: 0,
    systemHealth: 'good'
  });
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Carregar logs de auditoria
  useEffect(() => {
    loadAuditLogs();
    loadUsers();
    
    // Configurar listener em tempo real se habilitado
    let unsubscribe;
    if (realTimeUpdates) {
      const q = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date()
        }));
        setAuditLogs(logs);
        calculateAnalytics(logs);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [realTimeUpdates]);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [auditLogs, searchTerm, selectedType, selectedRisk, dateRange, selectedUser]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));
      
      setAuditLogs(logs);
      calculateAnalytics(logs);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const calculateAnalytics = (logs) => {
    const uniqueUsers = new Set(logs.map(log => log.userId)).size;
    const criticalEvents = logs.filter(log => 
      log.riskLevel === 'HIGH' || log.riskLevel === 'CRITICAL'
    ).length;
    
    const systemHealth = criticalEvents > 10 ? 'critical' : 
                        criticalEvents > 5 ? 'warning' : 'good';

    setAnalytics({
      totalActivities: logs.length,
      criticalEvents,
      uniqueUsers,
      systemHealth
    });
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(log => log.category === selectedType);
    }

    // Filtro por nível de risco
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(log => log.riskLevel === selectedRisk);
    }

    // Filtro por usuário
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.userId === selectedUser);
    }

    // Filtro por data
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(log => log.timestamp >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.timestamp <= endDate);
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-4 h-4" />;
      case 'UPDATE': return <Edit className="w-4 h-4" />;
      case 'DELETE': return <Trash2 className="w-4 h-4" />;
      case 'VIEW': return <Eye className="w-4 h-4" />;
      case 'LOGIN': return <Lock className="w-4 h-4" />;
      case 'LOGOUT': return <Unlock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'LOW': return <CheckCircle className="w-4 h-4" />;
      case 'MEDIUM': return <AlertCircle className="w-4 h-4" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4" />;
      case 'CRITICAL': return <XCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const exportAuditReport = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Descrição', 'Nível de Risco', 'IP', 'User Agent'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp.toLocaleString('pt-BR'),
        log.userEmail || 'Sistema',
        log.action,
        log.resource || '',
        `"${log.description}"`,
        log.riskLevel,
        log.ipAddress || '',
        `"${log.userAgent || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Relatório de auditoria exportado!');
  };

  // Dados para gráficos
  const activityByDay = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR');
      
      const dayLogs = filteredLogs.filter(log => 
        log.timestamp.toLocaleDateString('pt-BR') === dateStr
      );
      
      last7Days.push({
        date: dateStr,
        atividades: dayLogs.length,
        criticas: dayLogs.filter(log => 
          log.riskLevel === 'HIGH' || log.riskLevel === 'CRITICAL'
        ).length
      });
    }
    return last7Days;
  }, [filteredLogs]);

  const actionDistribution = useMemo(() => {
    const distribution = {};
    filteredLogs.forEach(log => {
      distribution[log.action] = (distribution[log.action] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([action, count]) => ({
      name: action,
      value: count,
      color: AUDIT_COLORS[action] || '#6B7280'
    }));
  }, [filteredLogs]);

  const riskDistribution = useMemo(() => {
    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    filteredLogs.forEach(log => {
      if (log.riskLevel) {
        distribution[log.riskLevel]++;
      }
    });
    
    return Object.entries(distribution).map(([risk, count]) => ({
      name: RISK_LEVELS[risk]?.label || risk,
      value: count,
      color: risk === 'LOW' ? '#10B981' : 
             risk === 'MEDIUM' ? '#F59E0B' :
             risk === 'HIGH' ? '#EF4444' : '#DC2626'
    }));
  }, [filteredLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2C68]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FF2C68] rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sistema de Auditoria</h1>
            <p className="text-white/60">Monitoramento e rastreamento de atividades</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              realTimeUpdates 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-700 text-white border border-gray-600'
            }`}
          >
            {realTimeUpdates ? 'Tempo Real ON' : 'Tempo Real OFF'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportAuditReport}
            className="bg-[#FF2C68] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#FF2C68]/80 transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Exportar
          </motion.button>
        </div>
      </motion.div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total de Atividades</p>
              <p className="text-2xl font-bold text-white">{analytics.totalActivities.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Eventos Críticos</p>
              <p className="text-2xl font-bold text-red-400">{analytics.criticalEvents}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Usuários Únicos</p>
              <p className="text-2xl font-bold text-green-400">{analytics.uniqueUsers}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Status do Sistema</p>
              <p className={`text-lg font-bold ${
                analytics.systemHealth === 'good' ? 'text-green-400' :
                analytics.systemHealth === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {analytics.systemHealth === 'good' ? 'Saudável' :
                 analytics.systemHealth === 'warning' ? 'Atenção' : 'Crítico'}
              </p>
            </div>
            <Shield className={`w-8 h-8 ${
              analytics.systemHealth === 'good' ? 'text-green-400' :
              analytics.systemHealth === 'warning' ? 'text-yellow-400' : 'text-red-400'
            }`} />
          </div>
        </motion.div>
      </div>

      {/* Filtros e Controles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Busca */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
              />
            </div>
          </div>

          {/* Tipo de Atividade */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none"
            >
              {AUDIT_TYPES.map(type => (
                <option key={type.value} value={type.value} className="bg-[#0D0C0C]">
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nível de Risco */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none"
            >
              <option value="all" className="bg-[#0D0C0C]">Todos os Riscos</option>
              {Object.entries(RISK_LEVELS).map(([key, value]) => (
                <option key={key} value={key} className="bg-[#0D0C0C]">
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          {/* Usuário */}
          <div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none"
            >
              <option value="all" className="bg-[#0D0C0C]">Todos os Usuários</option>
              {users.map(user => (
                <option key={user.id} value={user.uid} className="bg-[#0D0C0C]">
                  {user.displayName || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de Visualização */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-[#FF2C68] text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <List className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex-1 p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'analytics' 
                  ? 'bg-[#FF2C68] text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>

        {/* Data Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Data Início</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Conteúdo Principal */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Log de Atividades ({filteredLogs.length.toLocaleString()})
                </h3>
                <button
                  onClick={loadAuditLogs}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">Nenhuma atividade encontrada</p>
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg`} style={{ 
                          backgroundColor: `${AUDIT_COLORS[log.action] || '#6B7280'}20`,
                          color: AUDIT_COLORS[log.action] || '#6B7280'
                        }}>
                          {getActionIcon(log.action)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{log.description}</p>
                            {log.riskLevel && (
                              <span className={`px-2 py-1 rounded-full text-xs ${RISK_LEVELS[log.riskLevel]?.bg} ${RISK_LEVELS[log.riskLevel]?.color}`}>
                                {RISK_LEVELS[log.riskLevel]?.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <span>{log.userEmail || 'Sistema'}</span>
                            <span>{log.resource}</span>
                            <span>{log.timestamp.toLocaleString('pt-BR')}</span>
                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getRiskIcon(log.riskLevel)}
                        {log.details && (
                          <button
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            <ExternalLink className="w-4 h-4 text-white/40" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Atividades por Dia */}
            <div className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Atividades por Dia</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityByDay}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF2C68" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF2C68" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="atividades" 
                    stroke="#FF2C68" 
                    fillOpacity={1}
                    fill="url(#activityGradient)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="criticas" 
                    stroke="#EF4444" 
                    fill="#EF4444"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Distribuição por Ação */}
            <div className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Distribuição por Ação</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={actionDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {actionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribuição por Risco */}
            <div className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Distribuição por Nível de Risco</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#FF2C68" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Usuários Mais Ativos */}
            <div className="bg-[#0D0C0C]/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Usuários Mais Ativos</h3>
              <div className="space-y-3">
                {Object.entries(
                  filteredLogs.reduce((acc, log) => {
                    const email = log.userEmail || 'Sistema';
                    acc[email] = (acc[email] || 0) + 1;
                    return acc;
                  }, {})
                )
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([email, count], index) => (
                  <motion.div
                    key={email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#FF2C68] rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">{email}</span>
                    </div>
                    <span className="text-[#FF2C68] font-bold">{count}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #FF2C68 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #FF2C68;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #FF2C68;
        }
      `}</style>
    </div>
  );
} 