import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useDebounce } from '../hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Phone,
  Package,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Printer,
  ExternalLink,
  Download,
  Share2,
  X
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Servicos() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { 
    canView, 
    canCreate, 
    canEdit, 
    canDelete,
    hasPermission,
    isTecnico
  } = usePermissions();
  
  // Verificar permissões de serviços
  const canViewServices = canView('services');
  const canCreateServices = canCreate('services');
  const canEditServices = canEdit('services');
  const canDeleteServices = canDelete('services');

  // Verificar se tem permissão para acessar esta página
  if (!canViewServices) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-white/60 mb-6">
            Você não tem permissão para visualizar serviços.
          </p>
          <p className="text-white/40 text-sm">
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  const [ordensServico, setOrdensServico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [tecnicoFilter, setTecnicoFilter] = useState('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todas');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list' ou 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedOS, setSelectedOS] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [draggedOS, setDraggedOS] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOnlineView, setShowOnlineView] = useState(false);
  const [printOS, setPrintOS] = useState(null);

  const statusOptions = [
    { value: 'todas', label: 'Todas', color: 'text-white' },
    { value: 'aguardando', label: 'Aguardando', color: 'text-yellow-400' },
    { value: 'diagnosticando', label: 'Diagnóstico', color: 'text-blue-400' },
    { value: 'orcamento', label: 'Orçamento', color: 'text-purple-400' },
    { value: 'aprovado', label: 'Aprovado', color: 'text-green-400' },
    { value: 'reparo', label: 'Em Reparo', color: 'text-orange-400' },
    { value: 'teste', label: 'Em Teste', color: 'text-cyan-400' },
    { value: 'pronto', label: 'Pronto', color: 'text-green-500' },
    { value: 'entregue', label: 'Entregue', color: 'text-gray-400' },
    { value: 'cancelado', label: 'Cancelado', color: 'text-red-400' }
  ];

  const statusColors = {
    aguardando: 'bg-yellow-500',
    diagnosticando: 'bg-blue-500',
    orcamento: 'bg-purple-500',
    aprovado: 'bg-green-500',
    reparo: 'bg-orange-500',
    teste: 'bg-cyan-500',
    pronto: 'bg-green-600',
    entregue: 'bg-gray-500',
    cancelado: 'bg-red-500'
  };

  const statusLabels = {
    aguardando: 'Aguardando',
    diagnosticando: 'Diagnóstico',
    orcamento: 'Orçamento',
    aprovado: 'Aprovado',
    reparo: 'Em Reparo',
    teste: 'Em Teste',
    pronto: 'Pronto',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  };

  const prioridadeOptions = [
    { value: 'todas', label: 'Todas', color: 'text-white' },
    { value: 'baixa', label: 'Baixa', color: 'text-green-400' },
    { value: 'normal', label: 'Normal', color: 'text-yellow-400' },
    { value: 'alta', label: 'Alta', color: 'text-orange-400' },
    { value: 'urgente', label: 'Urgente', color: 'text-red-400' }
  ];

  const loadOrdensServico = useCallback(async (limitDocs = 100) => {
    try {
      setLoading(true);
      
      // Limitar consulta para melhorar performance
      const q = query(
          collection(db, 'ordens_servico'),
        orderBy('createdAt', 'desc'),
        limit(limitDocs)
        );
      const querySnapshot = await getDocs(q);
      
      let osData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        previsaoEntrega: doc.data().servico?.previsaoEntrega ? new Date(doc.data().servico.previsaoEntrega) : null
      }));
      
      // Se for técnico, filtrar no lado do cliente
      if (userProfile?.level === 'TECNICO') {
        const tecnicoName = user?.displayName || user?.email?.split('@')[0];
        osData = osData.filter(os => os.servico?.tecnico === tecnicoName);
      }
      
      setOrdensServico(osData);
      
      // Log para debug de performance
      console.log(`📊 Carregadas ${osData.length} ordens de serviço`);
      
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço:', error);
      toast.error('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user && userProfile) {
      loadOrdensServico();
    }
  }, [user, userProfile, loadOrdensServico]);

  // Funções do calendário
  const updatePrevisaoEntrega = useCallback(async (osId, novaData) => {
    try {
      const osRef = doc(db, 'ordens_servico', osId);
      await updateDoc(osRef, {
        'servico.previsaoEntrega': novaData.toISOString().split('T')[0],
        updatedAt: new Date()
      });
      
      toast.success('Previsão de entrega atualizada!');
      loadOrdensServico();
    } catch (error) {
      console.error('Erro ao atualizar previsão:', error);
      toast.error('Erro ao atualizar previsão');
    }
  }, []);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getOSForDate = (day) => {
    if (!day) return [];
    
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return filteredOS.filter(os => {
      if (!os.previsaoEntrega) return false;
      
      const osDate = new Date(os.previsaoEntrega);
      return (
        osDate.getDate() === targetDate.getDate() &&
        osDate.getMonth() === targetDate.getMonth() &&
        osDate.getFullYear() === targetDate.getFullYear()
      );
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDragStart = (e, os) => {
    setDraggedOS(os);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, day) => {
    e.preventDefault();
    
    if (!draggedOS || !day) return;
    
    const novaData = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    updatePrevisaoEntrega(draggedOS.id, novaData);
    setDraggedOS(null);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Funções de impressão e visualização
  const openPrintModal = (os) => {
    setPrintOS(os);
    setShowPrintModal(true);
  };

  const openOnlineView = (os) => {
    setPrintOS(os);
    setShowOnlineView(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const generateOSLink = (os) => {
    // Gerar link público para visualização da OS
    const baseUrl = window.location.origin;
    return `${baseUrl}/os-publica/${os.id}`;
  };

  const copyOSLink = (os) => {
    const link = generateOSLink(os);
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copiado para a área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  };

  const downloadOSPDF = (os) => {
    // Esta função seria implementada com uma biblioteca de PDF como jsPDF
    toast('Funcionalidade de download PDF em desenvolvimento', {
      icon: 'ℹ️',
      style: {
        background: '#1e293b',
        color: '#ffffff',
        border: '1px solid #3b82f6',
      },
    });
  };

  // Usar debounce para otimizar busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredOS = useMemo(() => {
    return ordensServico.filter(os => {
      const matchSearch = !debouncedSearchTerm || 
        os.cliente?.nome?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        os.numero?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        os.equipamento?.marca?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        os.equipamento?.modelo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'todas' || os.servico?.status === statusFilter;
    const matchTecnico = tecnicoFilter === 'todos' || os.servico?.tecnico === tecnicoFilter;
    const matchPrioridade = prioridadeFilter === 'todas' || os.problema?.prioridade === prioridadeFilter;
    
    return matchSearch && matchStatus && matchTecnico && matchPrioridade;
  });
  }, [ordensServico, debouncedSearchTerm, statusFilter, tecnicoFilter, prioridadeFilter]);

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'text-gray-400';
  };

  const getPrioridadeColor = (prioridade) => {
    const prioridadeOption = prioridadeOptions.find(p => p.value === prioridade);
    return prioridadeOption?.color || 'text-gray-400';
  };

  const getStatusBg = (status) => {
    const colors = {
      aguardando: 'bg-yellow-500/20',
      diagnosticando: 'bg-blue-500/20',
      orcamento: 'bg-purple-500/20',
      aprovado: 'bg-green-500/20',
      reparo: 'bg-orange-500/20',
      teste: 'bg-cyan-500/20',
      pronto: 'bg-green-600/20',
      entregue: 'bg-gray-500/20',
      cancelado: 'bg-red-500/20'
    };
    return colors[status] || 'bg-gray-500/20';
  };

  const tecnicos = useMemo(() => 
    [...new Set(ordensServico.map(os => os.servico?.tecnico).filter(Boolean))], 
    [ordensServico]
  );

  const stats = useMemo(() => ({
    total: filteredOS.length,
    aguardando: filteredOS.filter(os => ['aguardando', 'diagnosticando'].includes(os.servico?.status)).length,
    andamento: filteredOS.filter(os => ['aprovado', 'reparo', 'teste'].includes(os.servico?.status)).length,
    finalizadas: filteredOS.filter(os => ['pronto', 'entregue'].includes(os.servico?.status)).length
  }), [filteredOS]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Gestão de Serviços</h1>
          <p className="text-white/60 text-lg">
            {userProfile?.level === 'TECNICO' 
              ? `Suas ordens de serviço - ${user?.displayName || 'Técnico'}`
              : 'Acompanhe todas as ordens de serviço'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#FF2C68] text-white' : 'text-white/60 hover:text-white'}`}
              title="Visualização em Grade"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#FF2C68] text-white' : 'text-white/60 hover:text-white'}`}
              title="Visualização em Lista"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-[#FF2C68] text-white' : 'text-white/60 hover:text-white'}`}
              title="Visualização em Calendário"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total de OS</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Aguardando</p>
              <p className="text-2xl font-bold text-white">{stats.aguardando}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Em Andamento</p>
              <p className="text-2xl font-bold text-white">{stats.andamento}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Finalizadas</p>
              <p className="text-2xl font-bold text-white">{stats.finalizadas}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Buscar por cliente, nº OS, equipamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value} className="bg-[#0D0C0C]">
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Técnico (só aparece se não for técnico) */}
          {userProfile?.level !== 'TECNICO' && (
            <div>
              <select
                value={tecnicoFilter}
                onChange={(e) => setTecnicoFilter(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
              >
                <option value="todos" className="bg-[#0D0C0C]">Todos os Técnicos</option>
                {tecnicos.map(tecnico => (
                  <option key={tecnico} value={tecnico} className="bg-[#0D0C0C]">
                    {tecnico}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Prioridade */}
          <div>
            <select
              value={prioridadeFilter}
              onChange={(e) => setPrioridadeFilter(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
            >
              {prioridadeOptions.map(prioridade => (
                <option key={prioridade.value} value={prioridade.value} className="bg-[#0D0C0C]">
                  {prioridade.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Visualizações */}
      {viewMode === 'calendar' ? (
        // Calendário
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6"
        >
          {/* Header do Calendário */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white hover:bg-[#0D0C0C]/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white hover:bg-[#0D0C0C]/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-white/60 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Dias do Mês */}
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((day, index) => {
              const osParaDia = getOSForDate(day);
              const isToday = day && 
                new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-white/10 rounded-lg transition-all ${
                    day ? 'bg-[#0D0C0C]/30 hover:bg-[#0D0C0C]/50' : ''
                  } ${isToday ? 'border-[#FF2C68] bg-[#FF2C68]/10' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${isToday ? 'text-[#FF2C68]' : 'text-white'}`}>
                        {day}
                      </div>
                      
                      <div className="space-y-1">
                        {osParaDia.map((os) => (
                          <div
                            key={os.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, os)}
                            onClick={() => {
                              setSelectedOS(os);
                              setShowDetails(true);
                            }}
                            className={`text-xs p-2 rounded cursor-pointer transition-all hover:scale-105 ${
                              statusColors[os.servico?.status] || 'bg-gray-500'
                            } text-white shadow-sm border border-white/10`}
                            title={`${os.numero} - ${os.cliente?.nome} - ${os.servico?.tecnico || 'Sem técnico'}`}
                          >
                            <div className="font-medium truncate mb-1">{os.numero}</div>
                            <div className="truncate opacity-90 text-[10px] mb-1">
                              👤 {os.cliente?.nome}
                            </div>
                            {os.servico?.tecnico && (
                              <div className="truncate opacity-80 text-[10px] mb-1">
                                🔧 {os.servico.tecnico}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] opacity-70">
                                {os.equipamento?.marca}
                              </span>
                              {os.servico?.valorTotal > 0 && (
                                <span className="text-[10px] font-medium">
                                  R$ {(os.servico.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Legenda de Status</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${color}`}></div>
                  <span className="text-white/80 text-sm">{statusLabels[status]}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-[#0D0C0C]/30 rounded-lg">
              <p className="text-white/60 text-sm">
                💡 <strong>Dica:</strong> Arraste e solte as OS para reagendar as datas de entrega
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        // Lista/Grid de OS
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {filteredOS.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60 text-lg">Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredOS.slice(0, 20).map((os, index) => (
                <motion.div
                  key={os.id}
                  className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-[#FF2C68]/30 transition-all duration-300 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Header da OS */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{os.numero}</h3>
                      <p className="text-white/60 text-sm">
                        {os.createdAt?.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusBg(os.servico?.status)} ${getStatusColor(os.servico?.status)}`}>
                        {statusOptions.find(s => s.value === os.servico?.status)?.label}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPrioridadeColor(os.problema?.prioridade)}`}>
                        {prioridadeOptions.find(p => p.value === os.problema?.prioridade)?.label}
                      </span>
                    </div>
                  </div>

                  {/* Info do Cliente */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-white/60" />
                      <span className="text-white">{os.cliente?.nome}</span>
                    </div>
                    {os.cliente?.telefone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-white/60" />
                        <span className="text-white/70">{os.cliente.telefone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Package className="w-4 h-4 text-white/60" />
                      <span className="text-white/70">
                        {os.equipamento?.marca} {os.equipamento?.modelo}
                      </span>
                    </div>
                  </div>

                  {/* Problema */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">Problema:</h4>
                    <p className="text-white/70 text-sm line-clamp-2">{os.problema?.relatado}</p>
                  </div>

                  {/* Técnico e Valor */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-xs">Técnico:</p>
                      <p className="text-white text-sm font-medium">
                        {os.servico?.tecnico || 'Não atribuído'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-xs">Valor Total:</p>
                      <p className="text-green-400 font-bold">
                        R$ {(os.servico?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedOS(os);
                          setShowDetails(true);
                        }}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Visualizar</span>
                      </button>
                      <button 
                        onClick={() => navigate(`/vendas/os?edit=${os.id}`)}
                        className="flex-1 bg-[#FF2C68]/20 hover:bg-[#FF2C68]/30 text-[#FF2C68] py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openPrintModal(os)}
                        className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir</span>
                      </button>
                      <button 
                        onClick={() => openOnlineView(os)}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Online</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
              
              {filteredOS.length > 20 && (
                <motion.div
                  className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-xl border border-[#FF2C68]/30 p-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-white/60">
                    📊 Mostrando 20 de {filteredOS.length} ordens de serviço
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    Use os filtros para refinar a busca
                  </p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {showDetails && selectedOS && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68]/30 p-6 w-full max-w-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Detalhes da OS</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Status e Número */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white">{selectedOS.numero}</h4>
                    <span className={`inline-block px-3 py-1 rounded-lg text-white text-sm font-medium ${
                      statusColors[selectedOS.servico?.status] || 'bg-gray-500'
                    }`}>
                      {statusLabels[selectedOS.servico?.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm">Criada em</p>
                    <p className="text-white">{selectedOS.createdAt?.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Cliente */}
                <div className="bg-[#0D0C0C]/30 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Cliente
                  </h5>
                  <p className="text-white/80">{selectedOS.cliente?.nome}</p>
                  {selectedOS.cliente?.telefone && (
                    <p className="text-white/60 text-sm">{selectedOS.cliente.telefone}</p>
                  )}
                </div>

                {/* Equipamento */}
                <div className="bg-[#0D0C0C]/30 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2 flex items-center">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Equipamento
                  </h5>
                  <p className="text-white/80">
                    {selectedOS.equipamento?.marca} {selectedOS.equipamento?.modelo}
                  </p>
                  {selectedOS.equipamento?.cor && (
                    <p className="text-white/60 text-sm">Cor: {selectedOS.equipamento.cor}</p>
                  )}
                </div>

                {/* Problema */}
                <div className="bg-[#0D0C0C]/30 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Problema
                  </h5>
                  <p className="text-white/80">{selectedOS.problema?.relatado}</p>
                </div>

                {/* Técnico e Previsão */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0D0C0C]/30 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-2 flex items-center">
                      <Wrench className="w-4 h-4 mr-2" />
                      Técnico
                    </h5>
                    <p className="text-white/80">{selectedOS.servico?.tecnico || 'Não atribuído'}</p>
                  </div>
                  
                  <div className="bg-[#0D0C0C]/30 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Previsão
                    </h5>
                    <p className="text-white/80">
                      {selectedOS.previsaoEntrega 
                        ? selectedOS.previsaoEntrega.toLocaleDateString('pt-BR')
                        : 'Não definida'
                      }
                    </p>
                  </div>
                </div>

                {/* Valor */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h5 className="text-green-400 font-medium mb-2">Valor Total</h5>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {(selectedOS.servico?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      navigate(`/vendas/os?edit=${selectedOS.id}`);
                    }}
                    className="flex-1 bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar OS</span>
                  </button>
                  
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Impressão */}
      <AnimatePresence>
        {showPrintModal && printOS && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPrintModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho - Não imprime */}
              <div className="flex items-center justify-between mb-6 print:hidden">
                <h3 className="text-2xl font-bold text-gray-800">Visualização para Impressão</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrint}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    onClick={() => downloadOSPDF(printOS)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Conteúdo da OS para impressão */}
              <div className="text-black">
                {/* Cabeçalho da empresa */}
                <div className="border-b-2 border-gray-300 pb-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800">ORDEM DE SERVIÇO</h1>
                      <p className="text-lg text-gray-600">Nº {printOS.numero}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold text-pink-600">IARA HUB</h2>
                      <p className="text-gray-600">Assistência Técnica</p>
                      <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {/* Status e informações básicas */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-bold text-gray-800 mb-2">STATUS</h3>
                    <p className="text-lg font-semibold text-blue-600">
                      {statusLabels[printOS.servico?.status] || 'Aguardando'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-bold text-gray-800 mb-2">PRIORIDADE</h3>
                    <p className="text-lg font-semibold text-orange-600">
                      {printOS.problema?.prioridade?.toUpperCase() || 'NORMAL'}
                    </p>
                  </div>
                </div>

                {/* Dados do cliente */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">DADOS DO CLIENTE</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Nome:</strong> {printOS.cliente?.nome}</p>
                        <p><strong>Telefone:</strong> {printOS.cliente?.telefone || 'Não informado'}</p>
                      </div>
                      <div>
                        <p><strong>Email:</strong> {printOS.cliente?.email || 'Não informado'}</p>
                        <p><strong>Endereço:</strong> {printOS.cliente?.endereco || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dados do equipamento */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">EQUIPAMENTO</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Tipo:</strong> {printOS.equipamento?.tipo}</p>
                        <p><strong>Marca:</strong> {printOS.equipamento?.marca}</p>
                        <p><strong>Modelo:</strong> {printOS.equipamento?.modelo}</p>
                      </div>
                      <div>
                        <p><strong>Cor:</strong> {printOS.equipamento?.cor || 'Não informado'}</p>
                        <p><strong>IMEI/Série:</strong> {printOS.equipamento?.imei || 'Não informado'}</p>
                        <p><strong>Senha:</strong> {printOS.equipamento?.senha || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Problema relatado */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">PROBLEMA RELATADO</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p>{printOS.problema?.relatado}</p>
                  </div>
                </div>

                {/* Diagnóstico técnico */}
                {printOS.problema?.diagnostico && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">DIAGNÓSTICO TÉCNICO</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p>{printOS.problema.diagnostico}</p>
                    </div>
                  </div>
                )}

                {/* Serviço e valores */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">SERVIÇO E VALORES</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Técnico:</strong> {printOS.servico?.tecnico || 'Não atribuído'}</p>
                        <p><strong>Previsão de Entrega:</strong> {
                          printOS.previsaoEntrega 
                            ? printOS.previsaoEntrega.toLocaleDateString('pt-BR')
                            : 'Não definida'
                        }</p>
                      </div>
                      <div>
                        <p><strong>Mão de Obra:</strong> R$ {(parseFloat(printOS.servico?.valorMaoObra) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Peças:</strong> R$ {(parseFloat(printOS.servico?.valorPecas) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-lg font-bold text-green-600">
                          <strong>Total:</strong> R$ {(printOS.servico?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações técnicas */}
                {printOS.servico?.observacoesTecnicas && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">OBSERVAÇÕES TÉCNICAS</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p>{printOS.servico.observacoesTecnicas}</p>
                    </div>
                  </div>
                )}

                {/* Assinaturas */}
                <div className="mt-12 pt-6 border-t border-gray-300">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2 h-12"></div>
                      <p className="text-sm text-gray-600">Assinatura do Cliente</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2 h-12"></div>
                      <p className="text-sm text-gray-600">Assinatura do Técnico</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Visualização Online */}
      <AnimatePresence>
        {showOnlineView && printOS && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOnlineView(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68]/30 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Compartilhar OS</h3>
                <button
                  onClick={() => setShowOnlineView(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0D0C0C]/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">OS: {printOS.numero}</h4>
                  <p className="text-white/60 text-sm">Cliente: {printOS.cliente?.nome}</p>
                  <p className="text-white/60 text-sm">Status: {statusLabels[printOS.servico?.status]}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => copyOSLink(printOS)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Copiar Link Público</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowOnlineView(false);
                      openPrintModal(printOS);
                    }}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Visualizar para Impressão</span>
                  </button>

                  <button
                    onClick={() => downloadOSPDF(printOS)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/60 text-xs text-center">
                    O link público permite que o cliente acompanhe o status da OS online
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 