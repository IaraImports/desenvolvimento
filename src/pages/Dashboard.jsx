import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  BadgeCheck,
  Activity,
  RefreshCcw,
  Calendar
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useApp } from '../contexts/AppContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, eachDayOfInterval, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#FF2C68', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
  const { userProfile } = useAuth();
  const { 
    isAdmin,
    isVendedor,
    isTecnico
  } = usePermissions();

  const { vendas, produtos, servicos, clientes, loading, loadAllData } = useApp();

  // Estados para dados em tempo real
  const [realTimeStats, setRealTimeStats] = useState({
    vendasHoje: 0,
    receitaHoje: 0,
    vendasMes: 0,
    receitaMes: 0,
    clientesNovos: 0,
    produtosEstoqueBaixo: 0,
    osAbertas: 0,
    orcamentosAbertos: 0
  });
  const [loadingRealTime, setLoadingRealTime] = useState(true);

  // Carregar dados em tempo real
  const loadRealTimeData = async () => {
    try {
      setLoadingRealTime(true);
      
      // Datas para filtros
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Carregar vendas com fallback para evitar erros de índice
      let todasVendas = [];
      let vendasHoje = 0;
      let receitaHoje = 0;
      let vendasMes = 0;
      let receitaMes = 0;
      
      try {
        // Tentar consulta com status primeiro
        const vendasQuery = query(
          collection(db, 'vendas'),
          where('status', '==', 'concluida'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const vendasSnap = await getDocs(vendasQuery);
        todasVendas = vendasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.warn('Erro na consulta de vendas com índice, tentando consulta simples:', error);
        
        try {
          // Fallback: consulta sem where para status
          const vendasQuery = query(
            collection(db, 'vendas'),
            orderBy('createdAt', 'desc'),
            limit(100)
          );
          const vendasSnap = await getDocs(vendasQuery);
          todasVendas = vendasSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(venda => venda.status === 'concluida'); // Filtrar localmente
        } catch (fallbackError) {
          console.warn('Fallback de vendas também falhou:', fallbackError);
          todasVendas = [];
        }
      }
      
      // Filtrar vendas de hoje localmente
      const vendasHojeData = todasVendas.filter(venda => {
        if (!venda.createdAt) return false;
        try {
          const vendaDate = venda.createdAt.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
          return vendaDate >= today && vendaDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        } catch {
          return false;
        }
      });
      
      vendasHoje = vendasHojeData.length;
      receitaHoje = vendasHojeData.reduce((acc, venda) => acc + (venda.total || 0), 0);

      // Filtrar vendas do mês localmente
      const vendasMesData = todasVendas.filter(venda => {
        if (!venda.createdAt) return false;
        try {
          const vendaDate = venda.createdAt.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
          return vendaDate >= startOfMonth;
        } catch {
          return false;
        }
      });
      
      vendasMes = vendasMesData.length;
      receitaMes = vendasMesData.reduce((acc, venda) => acc + (venda.total || 0), 0);

      // Carregar clientes com tratamento de erro
      let clientesNovos = 0;
      try {
        const clientesQuery = query(
          collection(db, 'clientes'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const clientesSnap = await getDocs(clientesQuery);
        const todosClientes = clientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        clientesNovos = todosClientes.filter(cliente => {
          if (!cliente.createdAt) return false;
          try {
            const clienteDate = cliente.createdAt.toDate ? cliente.createdAt.toDate() : new Date(cliente.createdAt);
            return clienteDate >= startOfMonth;
          } catch {
            return false;
          }
        }).length;
      } catch (clienteError) {
        console.warn('Erro ao carregar clientes:', clienteError);
        clientesNovos = 0;
      }

      // Produtos com estoque baixo (consulta simples sem índice)
      let produtosEstoqueBaixo = 0;
      try {
        const produtosQuery = query(collection(db, 'produtos'), limit(100));
        const produtosSnap = await getDocs(produtosQuery);
        const produtosData = produtosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        produtosEstoqueBaixo = produtosData.filter(produto => 
          (produto.estoque <= 10 || produto.quantidade <= 10) && 
          produto.status !== 'inativo'
        ).length;
      } catch (produtoError) {
        console.warn('Erro ao carregar produtos:', produtoError);
        produtosEstoqueBaixo = 0;
      }

      // OS abertas (consulta simplificada)
      let osAbertas = 0;
      try {
        const osQuery = query(collection(db, 'ordens_servico'), limit(50));
        const osSnap = await getDocs(osQuery);
        const osData = osSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        osAbertas = osData.filter(os => 
          ['aberta', 'em_andamento', 'aguardando_peca'].includes(os.status)
        ).length;
      } catch (osError) {
        console.warn('Erro ao carregar ordens de serviço:', osError);
        osAbertas = 0;
      }

      // Orçamentos abertos (consulta simplificada)
      let orcamentosAbertos = 0;
      try {
        const orcamentosQuery = query(collection(db, 'orcamentos'), limit(50));
        const orcamentosSnap = await getDocs(orcamentosQuery);
        const orcamentosData = orcamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        orcamentosAbertos = orcamentosData.filter(orc => orc.status === 'aberto').length;
      } catch (orcamentoError) {
        console.warn('Erro ao carregar orçamentos:', orcamentoError);
        orcamentosAbertos = 0;
      }

      setRealTimeStats({
        vendasHoje,
        receitaHoje,
        vendasMes,
        receitaMes,
        clientesNovos,
        produtosEstoqueBaixo,
        osAbertas,
        orcamentosAbertos
      });

    } catch (error) {
      console.error('Erro ao carregar dados em tempo real:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoadingRealTime(false);
    }
  };

  useEffect(() => {
    loadRealTimeData();
    
    // Atualizar dados a cada 5 minutos
    const interval = setInterval(loadRealTimeData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Verificar se os dados estão carregados
  const isDataLoaded = !loading && vendas && produtos && clientes;

  // Função para converter data do Firebase
  const parseDate = (dateValue) => {
    if (!dateValue) return new Date();
    
    // Se for timestamp do Firebase
    if (dateValue?.seconds) {
      return new Date(dateValue.seconds * 1000);
    }
    
    // Se for string ISO
    if (typeof dateValue === 'string') {
      const parsed = parseISO(dateValue);
      return isValid(parsed) ? parsed : new Date();
    }
    
    // Se for Date
    if (dateValue instanceof Date) {
      return isValid(dateValue) ? dateValue : new Date();
    }
    
    return new Date();
  };

  // Calcular estatísticas apenas se os dados estiverem carregados
  const stats = React.useMemo(() => {
    if (!isDataLoaded) {
      return [
        { name: 'Faturamento Total', value: 'R$ 0,00', icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30', desc: 'Carregando...' },
        { name: 'Total de Vendas', value: '0', icon: ShoppingCart, color: 'text-[#FF2C68]', bgColor: 'bg-[#FF2C68]/20', borderColor: 'border-[#FF2C68]/30', desc: 'Carregando...' },
        { name: 'Produtos Ativos', value: '0', icon: Package, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30', desc: 'Carregando...' },
        { name: 'Clientes Ativos', value: '0', icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30', desc: 'Carregando...' }
      ];
    }

  const totalVendas = vendas.length;
    const faturamentoTotal = vendas.reduce((acc, venda) => {
      const valor = parseFloat(venda.total) || parseFloat(venda.valor) || parseFloat(venda.valorTotal) || 0;
      return acc + valor;
    }, 0);
  const totalProdutos = produtos.length;
    const produtosAtivos = produtos.filter(p => p.status !== 'inativo').length;
  const totalClientes = clientes.length;

    return [
      {
        name: 'Faturamento Total',
        value: `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: DollarSign,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        desc: 'Total de receitas'
      },
      {
        name: 'Total de Vendas',
        value: totalVendas,
        icon: ShoppingCart,
        color: 'text-[#FF2C68]',
        bgColor: 'bg-[#FF2C68]/20',
        borderColor: 'border-[#FF2C68]/30',
        desc: `Vendas realizadas`
      },
      {
        name: 'Produtos Ativos',
        value: produtosAtivos,
        icon: Package,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        desc: `${totalProdutos} total`
      },
      {
        name: 'Clientes Ativos',
        value: totalClientes,
        icon: Users,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/30',
        desc: 'Base de clientes'
      }
    ];
  }, [isDataLoaded, vendas, produtos, clientes]);
  
  // Produtos com estoque baixo
  const produtosEstoqueBaixo = React.useMemo(() => {
    if (!isDataLoaded) return [];
    return produtos.filter(produto => {
      const estoque = parseInt(produto.estoque) || parseInt(produto.quantidade) || 0;
      return estoque < 10;
    });
  }, [isDataLoaded, produtos]);

  // Preparar dados para gráficos
  const vendasPorDia = React.useMemo(() => {
    if (!isDataLoaded) return [];

  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

    return last7Days.map(day => {
    const dayString = format(day, 'yyyy-MM-dd');
      const vendasDoDia = vendas.filter(venda => {
        const vendaDate = parseDate(venda.data || venda.createdAt || venda.timestamp);
        return format(vendaDate, 'yyyy-MM-dd') === dayString;
      });
      
      const faturamentoDia = vendasDoDia.reduce((acc, venda) => {
        const valor = parseFloat(venda.total) || parseFloat(venda.valor) || parseFloat(venda.valorTotal) || 0;
        return acc + valor;
      }, 0);

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      vendas: vendasDoDia.length,
        faturamento: faturamentoDia
    };
  });
  }, [isDataLoaded, vendas]);

  const dadosCategorias = React.useMemo(() => {
    if (!isDataLoaded) return [];

  const categoriasProdutos = produtos.reduce((acc, produto) => {
      const categoria = produto.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + 1;
    return acc;
  }, {});

    return Object.entries(categoriasProdutos).map(([categoria, quantidade]) => ({
    name: categoria,
    value: quantidade
  }));
  }, [isDataLoaded, produtos]);

  const vendasRecentes = React.useMemo(() => {
    if (!isDataLoaded) return [];
    
    return vendas
      .sort((a, b) => {
        const dateA = parseDate(a.data || a.createdAt || a.timestamp);
        const dateB = parseDate(b.data || b.createdAt || b.timestamp);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [isDataLoaded, vendas]);

  // Removidas as variantes do motion que não são mais utilizadas

  const handleRefreshData = async () => {
    try {
      await loadAllData();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  return (
    <div className="space-y-8">
              {/* Header do Dashboard */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">Visão geral do seu negócio em tempo real</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-xl text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${loading ? 'bg-yellow-400' : 'bg-green-400'}`} />
            <span className={`text-sm font-medium ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
              {loading ? 'Carregando...' : 'Sistema Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-blue-400">Carregando dados do sistema...</span>
          </div>
        </div>
      )}

      {/* Métricas em Tempo Real */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Métricas em Tempo Real</h2>
          <div className="flex items-center space-x-2 text-white/60">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Vendas Hoje */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                Hoje
              </span>
            </div>
            <p className="text-green-400 text-sm font-medium mb-1">Vendas Realizadas</p>
            <p className="text-3xl font-bold text-white mb-1">
              {loadingRealTime ? '-' : realTimeStats.vendasHoje}
            </p>
            <p className="text-green-400 text-sm">
              {loadingRealTime ? 'Carregando...' : formatCurrency(realTimeStats.receitaHoje)}
            </p>
          </div>

          {/* Receita do Mês */}
          <motion.div
            className="bg-gradient-to-br from-[#FF2C68]/10 to-[#FF2C68]/20 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#FF2C68]" />
              </div>
              <span className="text-xs bg-[#FF2C68]/20 text-[#FF2C68] px-2 py-1 rounded-full">
                Este Mês
              </span>
            </div>
            <p className="text-[#FF2C68] text-sm font-medium mb-1">Receita Total</p>
            <p className="text-3xl font-bold text-white mb-1">
              {loadingRealTime ? '-' : formatCurrency(realTimeStats.receitaMes)}
            </p>
            <p className="text-[#FF2C68] text-sm">
              {loadingRealTime ? 'Carregando...' : `${realTimeStats.vendasMes} vendas`}
            </p>
          </motion.div>

          {/* Clientes Novos */}
          <motion.div
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                Novos
              </span>
            </div>
            <p className="text-blue-400 text-sm font-medium mb-1">Clientes</p>
            <p className="text-3xl font-bold text-white mb-1">
              {loadingRealTime ? '-' : realTimeStats.clientesNovos}
            </p>
            <p className="text-blue-400 text-sm">
              Este mês
            </p>
          </motion.div>

          {/* Alertas Gerais */}
          <motion.div
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                Alerta
              </span>
            </div>
            <p className="text-orange-400 text-sm font-medium mb-1">Estoque Baixo</p>
            <p className="text-3xl font-bold text-white mb-1">
              {loadingRealTime ? '-' : realTimeStats.produtosEstoqueBaixo}
            </p>
            <p className="text-orange-400 text-sm">
              Produtos críticos
            </p>
          </motion.div>
        </div>

        {/* Resumo de Atividades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ordens de Serviço</h3>
                <p className="text-white/60 text-sm">Status atual</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Abertas/Em Andamento:</span>
                <span className="text-orange-400 font-bold">
                  {loadingRealTime ? '-' : realTimeStats.osAbertas}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Orçamentos</h3>
                <p className="text-white/60 text-sm">Aguardando aprovação</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Em Aberto:</span>
                <span className="text-blue-400 font-bold">
                  {loadingRealTime ? '-' : realTimeStats.orcamentosAbertos}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border ${stat.borderColor} p-6 hover:scale-105 transition-all duration-300 group`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <p className="text-white/60 text-sm mt-1">{stat.name}</p>
              <p className="text-white/40 text-xs mt-2">{stat.desc}</p>
          </div>
          </div>
        ))}
      </div>

      {/* Alertas de Estoque Baixo */}
      {produtosEstoqueBaixo.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-400 mb-2">
                Alerta de Estoque Baixo
              </h3>
              <p className="text-white/60 mb-4">
                {produtosEstoqueBaixo.length} produto(s) com estoque crítico (abaixo de 10 unidades)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {produtosEstoqueBaixo.slice(0, 6).map(produto => (
                  <div key={produto.id} className="bg-[#0D0C0C]/30 rounded-lg p-3">
                    <p className="text-white font-medium text-sm">{produto.nome || produto.name}</p>
                    <p className="text-orange-400 text-xs">
                      {produto.estoque || produto.quantidade || 0} unidades restantes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Vendas */}
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Vendas - Últimos 7 dias</h3>
              <p className="text-white/60 text-sm">Evolução das vendas</p>
            </div>
            <div className="w-10 h-10 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#FF2C68]" />
            </div>
          </div>
          {vendasPorDia.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={vendasPorDia}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2C68" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF2C68" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="data" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D0C0C', 
                    border: '1px solid #FF2C68',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Area
                type="monotone"
                dataKey="vendas"
                  stroke="#FF2C68"
                  fillOpacity={1}
                  fill="url(#colorVendas)"
                strokeWidth={2}
              />
              </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60">Nenhuma venda nos últimos 7 dias</p>
              </div>
        </div>
          )}
        </div>

        {/* Produtos por Categoria */}
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Produtos por Categoria</h3>
              <p className="text-white/60 text-sm">Distribuição do catálogo</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
        </div>
          {dadosCategorias.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosCategorias}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                  stroke="none"
              >
                {dadosCategorias.map((entry, entryIndex) => (
                  <Cell key={`cell-${entryIndex}`} fill={COLORS[entryIndex % COLORS.length]} />
                ))}
              </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D0C0C', 
                    border: '1px solid #3b82f6',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
            </PieChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Package className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60">Nenhum produto cadastrado</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vendas Recentes */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Vendas Recentes</h3>
            <p className="text-white/60 text-sm">Últimas transações</p>
          </div>
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-green-400" />
          </div>
        </div>
        <div className="space-y-3">
          {vendasRecentes.length > 0 ? vendasRecentes.map((venda) => {
            const dataVenda = parseDate(venda.data || venda.createdAt || venda.timestamp);
            const valorVenda = parseFloat(venda.total) || parseFloat(venda.valor) || parseFloat(venda.valorTotal) || 0;
            
            return (
              <div
                key={venda.id}
                className="flex items-center justify-between p-4 bg-[#0D0C0C]/30 rounded-xl hover:bg-[#0D0C0C]/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}

              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#FF2C68]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{venda.cliente || venda.nomeCliente || 'Cliente não informado'}</p>
                    <p className="text-white/60 text-sm">
                      {format(dataVenda, 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
            </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    R$ {valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-green-500/20 text-green-400">
                    {venda.status || 'Concluída'}
              </span>
            </div>
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">Nenhuma venda registrada ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Acesso Rápido */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
        <h3 className="text-xl font-bold text-white mb-6">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Nova Venda', icon: ShoppingCart, path: '/vendas/pdv', color: 'green' },
            { name: 'Cadastrar Produto', icon: Package, path: '/produtos', color: 'blue' },
            { name: 'Novo Cliente', icon: Users, path: '/clientes', color: 'purple' },
            { name: 'Criar OS', icon: Wrench, path: '/vendas/os', color: 'orange' }
          ].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="p-4 bg-[#0D0C0C]/30 border border-white/10 rounded-xl hover:bg-[#0D0C0C]/50 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5 text-[#FF2C68]" />
              </div>
              <p className="text-white font-medium text-sm">{item.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Debug de Permissões - Só para Admin */}
      {isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center space-x-2">
            <BadgeCheck className="w-5 h-5" />
            <span>Debug de Permissões (Admin)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Usuário Atual</h4>
              <div className="space-y-1 text-sm">
                <p className="text-white/60">Email: <span className="text-white">{userProfile?.email}</span></p>
                <p className="text-white/60">Nível: <span className="text-white">{userProfile?.level}</span></p>
                <p className="text-white/60">Status: <span className="text-white">{userProfile?.isActive ? '✅ Ativo' : '❌ Inativo'}</span></p>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Dados Carregados</h4>
              <div className="space-y-1 text-xs">
                <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                  Produtos: {produtos?.length || 0}
                </div>
                <div className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                  Vendas: {vendas?.length || 0}
                </div>
                <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                  Clientes: {clientes?.length || 0}
                </div>
                <div className="px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                  Serviços: {servicos?.length || 0}
          </div>
        </div>
      </div>

            <div>
              <h4 className="text-white font-medium mb-2">Roles</h4>
              <div className="space-y-1 text-xs">
                {[
                  { name: 'Admin', active: isAdmin },
                  { name: 'Vendedor', active: isVendedor },
                  { name: 'Técnico', active: isTecnico }
                ].map(role => (
                  <div key={role.name} className={`px-2 py-1 rounded ${role.active ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {role.name}: {role.active ? '✅' : '❌'}
                  </div>
                ))}
        </div>
      </div>
    </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
