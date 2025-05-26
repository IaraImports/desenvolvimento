import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Download,
  Upload,
  Cloud,
  Server,
  HardDrive,
  Archive,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
  Database,
  FileText,
  Folder,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Globe,
  Lock,
  Unlock,
  Eye,
  Filter,
  Search,
  Copy,
  Trash2,
  Plus,
  Edit,
  BarChart3,
  Activity,
  Users,
  Package,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where, 
  Timestamp,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKUP_TYPES = [
  {
    id: 'full',
    name: 'Backup Completo',
    icon: Database,
    description: 'Backup de todos os dados do sistema',
    color: 'blue',
    estimatedTime: '15-30 min',
    frequency: 'Semanal'
  },
  {
    id: 'incremental',
    name: 'Backup Incremental',
    icon: Archive,
    description: 'Apenas dados modificados',
    color: 'green',
    estimatedTime: '2-5 min',
    frequency: 'Diário'
  },
  {
    id: 'differential',
    name: 'Backup Diferencial',
    icon: Copy,
    description: 'Mudanças desde o último backup completo',
    color: 'yellow',
    estimatedTime: '5-10 min',
    frequency: 'Bi-diário'
  },
  {
    id: 'selective',
    name: 'Backup Seletivo',
    icon: Filter,
    description: 'Módulos específicos do sistema',
    color: 'purple',
    estimatedTime: '1-3 min',
    frequency: 'Sob demanda'
  }
];

const BACKUP_MODULES = [
  { id: 'vendas', name: 'Vendas', icon: ShoppingCart, priority: 'high' },
  { id: 'produtos', name: 'Produtos', icon: Package, priority: 'high' },
  { id: 'clientes', name: 'Clientes', icon: Users, priority: 'high' },
  { id: 'financeiro', name: 'Financeiro', icon: DollarSign, priority: 'high' },
  { id: 'servicos', name: 'Serviços', icon: Settings, priority: 'medium' },
  { id: 'relatorios', name: 'Relatórios', icon: BarChart3, priority: 'medium' },
  { id: 'configuracoes', name: 'Configurações', icon: Settings, priority: 'low' },
  { id: 'logs', name: 'Logs do Sistema', icon: FileText, priority: 'low' }
];

const STORAGE_LOCATIONS = [
  {
    id: 'firebase',
    name: 'Firebase Storage',
    icon: Cloud,
    status: 'active',
    capacity: '500 GB',
    used: '45 GB',
    type: 'cloud'
  },
  {
    id: 'local',
    name: 'Armazenamento Local',
    icon: HardDrive,
    status: 'active',
    capacity: '1 TB',
    used: '120 GB',
    type: 'local'
  },
  {
    id: 'external',
    name: 'Drive Externo',
    icon: Server,
    status: 'inactive',
    capacity: '2 TB',
    used: '0 GB',
    type: 'external'
  }
];

export default function SistemaBackup() {
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [backups, setBackups] = useState([]);
  const [backupJobs, setBackupJobs] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [currentBackupProgress, setCurrentBackupProgress] = useState(0);

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: Monitor },
    { id: 'backups', name: 'Backups', icon: Archive },
    { id: 'schedule', name: 'Agendamentos', icon: Calendar },
    { id: 'restore', name: 'Restauração', icon: RotateCcw },
    { id: 'settings', name: 'Configurações', icon: Settings }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBackups(),
        loadBackupJobs(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema de backup');
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      // Simular carregamento de backups do Firebase/Storage
      const mockBackups = [
        {
          id: '1',
          type: 'full',
          status: 'completed',
          size: '2.5 GB',
          modules: ['vendas', 'produtos', 'clientes', 'financeiro'],
          createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
          duration: '18 min',
          location: 'firebase'
        },
        {
          id: '2',
          type: 'incremental',
          status: 'completed',
          size: '45 MB',
          modules: ['vendas', 'clientes'],
          createdAt: new Date(Date.now() - 3600000), // 1 hora atrás
          duration: '3 min',
          location: 'firebase'
        },
        {
          id: '3',
          type: 'selective',
          status: 'failed',
          size: '0 MB',
          modules: ['relatorios'],
          createdAt: new Date(Date.now() - 7200000), // 2 horas atrás
          duration: '0 min',
          location: 'local',
          error: 'Falha na conexão com o storage'
        }
      ];
      setBackups(mockBackups);
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    }
  };

  const loadBackupJobs = async () => {
    try {
      // Simular jobs agendados
      const mockJobs = [
        {
          id: '1',
          name: 'Backup Diário Incremental',
          type: 'incremental',
          schedule: '0 2 * * *', // 2:00 AM diariamente
          modules: ['vendas', 'clientes', 'produtos'],
          active: true,
          lastRun: new Date(Date.now() - 86400000),
          nextRun: new Date(Date.now() + 3600000)
        },
        {
          id: '2',
          name: 'Backup Semanal Completo',
          type: 'full',
          schedule: '0 1 * * 0', // 1:00 AM aos domingos
          modules: BACKUP_MODULES.map(m => m.id),
          active: true,
          lastRun: new Date(Date.now() - 604800000),
          nextRun: new Date(Date.now() + 518400000)
        }
      ];
      setBackupJobs(mockJobs);
    } catch (error) {
      console.error('Erro ao carregar jobs:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = {
        totalBackups: backups.length,
        successfulBackups: backups.filter(b => b.status === 'completed').length,
        failedBackups: backups.filter(b => b.status === 'failed').length,
        totalSize: '3.2 GB',
        lastBackup: backups.length > 0 ? backups[0].createdAt : null,
        storageUsed: 45,
        storageTotal: 500,
        avgBackupTime: '8 min',
        dataIntegrity: 99.8
      };
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  const startBackup = async (type, modules = []) => {
    try {
      setIsRunningBackup(true);
      setCurrentBackupProgress(0);
      
      // Simular progresso do backup
      const progressInterval = setInterval(() => {
        setCurrentBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsRunningBackup(false);
            toast.success('Backup realizado com sucesso!');
            loadData();
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Simular criação do backup
      const newBackup = {
        type,
        status: 'running',
        modules: modules.length > 0 ? modules : BACKUP_MODULES.map(m => m.id),
        createdAt: new Date(),
        location: 'firebase'
      };

      // Aqui seria a lógica real de backup
      toast.success('Backup iniciado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao iniciar backup:', error);
      toast.error('Erro ao iniciar backup');
      setIsRunningBackup(false);
    }
  };

  const restoreBackup = async (backupId) => {
    if (!confirm('Tem certeza que deseja restaurar este backup? Esta ação substituirá os dados atuais.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Simular processo de restauração
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('Backup restaurado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup');
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!confirm('Tem certeza que deseja excluir este backup?')) {
      return;
    }

    try {
      setBackups(backups.filter(b => b.id !== backupId));
      toast.success('Backup excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir backup:', error);
      toast.error('Erro ao excluir backup');
    }
  };

  const toggleJob = async (jobId) => {
    try {
      const updatedJobs = backupJobs.map(job => 
        job.id === jobId ? { ...job, active: !job.active } : job
      );
      setBackupJobs(updatedJobs);
      toast.success('Agendamento atualizado!');
    } catch (error) {
      console.error('Erro ao alterar job:', error);
      toast.error('Erro ao alterar agendamento');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Sistema de Backup
            </h1>
            <p className="text-gray-400 mt-2">
              Backup automatizado e recuperação de dados
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startBackup('full')}
              disabled={isRunningBackup}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Backup Manual
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadData}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-600 transition-all duration-300"
            >
              <RefreshCw className="w-5 h-5" />
              Atualizar
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar (if backup is running) */}
      <AnimatePresence>
        {isRunningBackup && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 bg-gradient-to-r from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Backup em Progresso</h3>
                <p className="text-gray-400">Realizando backup dos dados...</p>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentBackupProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-right mt-2">
              <span className="text-sm text-blue-400">{Math.round(currentBackupProgress)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex overflow-x-auto gap-4 pb-4">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 min-w-fit ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-semibold">{tab.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && <OverviewContent statistics={statistics} backups={backups} />}
          {selectedTab === 'backups' && <BackupsContent backups={backups} onRestore={restoreBackup} onDelete={deleteBackup} />}
          {selectedTab === 'schedule' && <ScheduleContent backupJobs={backupJobs} onToggle={toggleJob} />}
          {selectedTab === 'restore' && <RestoreContent backups={backups} onRestore={restoreBackup} />}
          {selectedTab === 'settings' && <SettingsContent />}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // Overview Tab Content
  function OverviewContent({ statistics, backups }) {
    return (
      <div className="space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total de Backups',
              value: statistics.totalBackups || 0,
              subtitle: `${statistics.successfulBackups || 0} bem-sucedidos`,
              icon: Archive,
              color: 'blue'
            },
            {
              title: 'Último Backup',
              value: statistics.lastBackup ? format(statistics.lastBackup, 'dd/MM', { locale: ptBR }) : 'Nunca',
              subtitle: statistics.lastBackup ? format(statistics.lastBackup, 'HH:mm', { locale: ptBR }) : '',
              icon: Clock,
              color: 'green'
            },
            {
              title: 'Armazenamento',
              value: `${statistics.storageUsed || 0}%`,
              subtitle: `${statistics.totalSize || '0 GB'} usados`,
              icon: HardDrive,
              color: 'purple'
            },
            {
              title: 'Integridade',
              value: `${statistics.dataIntegrity || 0}%`,
              subtitle: 'Dados verificados',
              icon: Shield,
              color: 'emerald'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br from-slate-800/50 to-${stat.color}-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  ●
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.title}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>
            </motion.div>
          ))}
        </div>

        {/* Storage Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Cloud className="w-6 h-6 text-blue-400" />
            Locais de Armazenamento
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STORAGE_LOCATIONS.map((location, index) => (
              <div key={location.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <location.icon className={`w-6 h-6 ${
                    location.status === 'active' ? 'text-green-400' : 'text-gray-400'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-white">{location.name}</h4>
                    <p className="text-xs text-gray-400 capitalize">{location.type}</p>
                  </div>
                  <div className={`ml-auto w-3 h-3 rounded-full ${
                    location.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Usado:</span>
                    <span className="text-white">{location.used}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Capacidade:</span>
                    <span className="text-white">{location.capacity}</span>
                  </div>
                  
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                      style={{ width: `${(parseInt(location.used) / parseInt(location.capacity)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            Ações Rápidas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BACKUP_TYPES.map((type, index) => (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startBackup(type.id)}
                disabled={isRunningBackup}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-700/50 transition-all duration-300 disabled:opacity-50"
              >
                <type.icon className={`w-8 h-8 text-${type.color}-400 mb-3`} />
                <h4 className="font-semibold text-white mb-2">{type.name}</h4>
                <p className="text-xs text-gray-400 mb-3">{type.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tempo:</span>
                  <span className="text-gray-300">{type.estimatedTime}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Backups Tab Content  
  function BackupsContent({ backups, onRestore, onDelete }) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Histórico de Backups</h3>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Buscar backups..."
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-600">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {backups.map((backup, index) => (
            <motion.div
              key={backup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    backup.status === 'completed' ? 'bg-green-500/20' : 
                    backup.status === 'failed' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                  }`}>
                    {backup.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : backup.status === 'failed' ? (
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-400" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white capitalize">
                      Backup {BACKUP_TYPES.find(t => t.id === backup.type)?.name || backup.type}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {format(backup.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Tamanho: {backup.size}</span>
                      <span>Duração: {backup.duration}</span>
                      <span>Local: {backup.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {backup.status === 'completed' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onRestore(backup.id)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        title="Restaurar"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(backup.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Módulos incluídos no backup */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-gray-400 mb-2">Módulos incluídos:</p>
                <div className="flex flex-wrap gap-2">
                  {backup.modules.map(moduleId => {
                    const module = BACKUP_MODULES.find(m => m.id === moduleId);
                    return module ? (
                      <span
                        key={moduleId}
                        className="px-3 py-1 bg-slate-700/50 text-gray-300 rounded-full text-xs flex items-center gap-1"
                      >
                        <module.icon className="w-3 h-3" />
                        {module.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Erro (se houver) */}
              {backup.error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{backup.error}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Schedule Tab Content
  function ScheduleContent({ backupJobs, onToggle }) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Agendamentos Automáticos</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateSchedule(true)}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </motion.button>
        </div>

        <div className="space-y-4">
          {backupJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${job.active ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Calendar className={`w-6 h-6 ${job.active ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white">{job.name}</h4>
                    <p className="text-sm text-gray-400">
                      Tipo: {BACKUP_TYPES.find(t => t.id === job.type)?.name || job.type}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Último: {format(job.lastRun, 'dd/MM HH:mm', { locale: ptBR })}</span>
                      <span>Próximo: {format(job.nextRun, 'dd/MM HH:mm', { locale: ptBR })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onToggle(job.id)}
                    className={`p-2 rounded-lg ${
                      job.active 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    title={job.active ? 'Pausar' : 'Ativar'}
                  >
                    {job.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Módulos do agendamento */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-gray-400 mb-2">Módulos configurados:</p>
                <div className="flex flex-wrap gap-2">
                  {job.modules.map(moduleId => {
                    const module = BACKUP_MODULES.find(m => m.id === moduleId);
                    return module ? (
                      <span
                        key={moduleId}
                        className="px-3 py-1 bg-slate-700/50 text-gray-300 rounded-full text-xs flex items-center gap-1"
                      >
                        <module.icon className="w-3 h-3" />
                        {module.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Restore Tab Content
  function RestoreContent({ backups, onRestore }) {
    const completedBackups = backups.filter(b => b.status === 'completed');
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-sm border border-yellow-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Aviso Importante</h3>
          </div>
          <p className="text-gray-300">
            A restauração de backup substituirá todos os dados atuais do sistema. 
            Certifique-se de que deseja prosseguir antes de confirmar a operação.
          </p>
        </div>

        <h3 className="text-xl font-bold text-white">Backups Disponíveis para Restauração</h3>

        <div className="space-y-4">
          {completedBackups.map((backup, index) => (
            <motion.div
              key={backup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Archive className="w-6 h-6 text-green-400" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white">
                      Backup {BACKUP_TYPES.find(t => t.id === backup.type)?.name || backup.type}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Criado em {format(backup.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Tamanho: {backup.size}</span>
                      <span>Módulos: {backup.modules.length}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onRestore(backup.id)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </motion.button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-gray-400 mb-2">Dados que serão restaurados:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {backup.modules.map(moduleId => {
                    const module = BACKUP_MODULES.find(m => m.id === moduleId);
                    return module ? (
                      <div
                        key={moduleId}
                        className="bg-slate-700/50 rounded-lg p-3 text-center"
                      >
                        <module.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-300">{module.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Settings Tab Content
  function SettingsContent() {
    return (
      <div className="space-y-8">
        <h3 className="text-xl font-bold text-white">Configurações de Backup</h3>

        {/* Configurações Gerais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            Configurações Gerais
          </h4>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Retenção de Backups (dias)
                </label>
                <input
                  type="number"
                  defaultValue={30}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Compressão
                </label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="high">Alta (mais lenta)</option>
                  <option value="medium">Média (recomendado)</option>
                  <option value="low">Baixa (mais rápida)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <h5 className="font-medium text-white">Verificação de Integridade</h5>
                <p className="text-sm text-gray-400">Verificar integridade dos dados após backup</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <h5 className="font-medium text-white">Notificações</h5>
                <p className="text-sm text-gray-400">Receber notificações sobre status dos backups</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Configurações de Módulos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <Package className="w-5 h-5 text-gray-400" />
            Configurações por Módulo
          </h4>

          <div className="space-y-4">
            {BACKUP_MODULES.map((module, index) => (
              <div key={module.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <module.icon className="w-5 h-5 text-blue-400" />
                  <div>
                    <h5 className="font-medium text-white">{module.name}</h5>
                    <p className="text-sm text-gray-400">Prioridade: {module.priority}</p>
                  </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4">
          <button className="px-6 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors">
            Cancelar
          </button>
          <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300">
            Salvar Configurações
          </button>
        </div>
      </div>
    );
  }
} 