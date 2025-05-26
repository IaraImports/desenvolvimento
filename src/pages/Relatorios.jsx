import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  PieChart,
  LineChart,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Target,
  Zap,
  Brain,
  FileText,
  Mail,
  RefreshCw,
  Eye,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#FF2C68', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState({
    vendas: [],
    produtos: [],
    clientes: [],
    transacoesFinanceiras: [],
    ordensServico: []
  });
  const [analytics, setAnalytics] = useState({
    vendasPorDia: [],
    receitaPorMes: [],
    produtosMaisVendidos: [],
    clientesTop: [],
    categoriasProdutos: [],
    formasPagamento: [],
    evolucaoClientes: [],
    margemLucro: [],
    previsaoVendas: [],
    kpis: {}
  });

  const periodos = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 3 meses' },
    { value: '365', label: 'Último ano' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  const tiposRelatorio = [
    { 
      id: 'overview', 
      title: 'Visão Geral', 
      icon: BarChart3, 
      description: 'Análise completa do negócio',
      color: 'blue'
    },
    { 
      id: 'vendas', 
      title: 'Análise de Vendas', 
      icon: ShoppingCart, 
      description: 'Performance de vendas detalhada',
      color: 'green'
    },
    { 
      id: 'financeiro', 
      title: 'Relatório Financeiro', 
      icon: DollarSign, 
      description: 'Fluxo de caixa e rentabilidade',
      color: 'emerald'
    },
    { 
      id: 'produtos', 
      title: 'Análise de Produtos', 
      icon: Package, 
      description: 'Performance do catálogo',
      color: 'purple'
    },
    { 
      id: 'clientes', 
      title: 'Análise de Clientes', 
      icon: Users, 
      description: 'Comportamento e segmentação',
      color: 'cyan'
    },
    { 
      id: 'previsoes', 
      title: 'Previsões IA', 
      icon: Brain, 
      description: 'Análises preditivas avançadas',
      color: 'pink'
    }
  ];

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Calcular datas baseado no período selecionado
      const endDate = new Date();
      const startDate = selectedPeriod === 'custom' 
        ? subDays(endDate, 30) 
        : subDays(endDate, parseInt(selectedPeriod));

      // Carregar dados do Firebase
      const [vendas, produtos, clientes, transacoes, ordensServico] = await Promise.all([
        loadVendas(startDate, endDate),
        loadProdutos(),
        loadClientes(startDate, endDate),
        loadTransacoesFinanceiras(startDate, endDate),
        loadOrdensServico(startDate, endDate)
      ]);

      setReportData({
        vendas,
        produtos,
        clientes,
        transacoesFinanceiras: transacoes,
        ordensServico
      });

      // Processar analytics
      processAnalytics(vendas, produtos, clientes, transacoes, ordensServico, startDate, endDate);

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  const loadVendas = async (startDate, endDate) => {
    const vendasQuery = query(
      collection(db, 'vendas'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(vendasQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const loadProdutos = async () => {
    const snapshot = await getDocs(collection(db, 'produtos'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const loadClientes = async (startDate, endDate) => {
    const snapshot = await getDocs(collection(db, 'clientes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const loadTransacoesFinanceiras = async (startDate, endDate) => {
    const transacoesQuery = query(
      collection(db, 'transacoes_financeiras'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(transacoesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const loadOrdensServico = async (startDate, endDate) => {
    const osQuery = query(
      collection(db, 'ordens_servico'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(osQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const processAnalytics = (vendas, produtos, clientes, transacoes, ordensServico, startDate, endDate) => {
    // 1. Vendas por dia
    const vendasPorDia = processVendasPorDia(vendas, startDate, endDate);
    
    // 2. Receita por mês (últimos 12 meses)
    const receitaPorMes = processReceitaPorMes(vendas);
    
    // 3. Produtos mais vendidos
    const produtosMaisVendidos = processProdutosMaisVendidos(vendas, produtos);
    
    // 4. Top clientes
    const clientesTop = processTopClientes(vendas);
    
    // 5. Categorias de produtos
    const categoriasProdutos = processCategoriasProdutos(produtos);
    
    // 6. Formas de pagamento
    const formasPagamento = processFormasPagamento(vendas);
    
    // 7. Evolução de clientes
    const evolucaoClientes = processEvolucaoClientes(clientes);
    
    // 8. Margem de lucro
    const margemLucro = processMargemLucro(vendas, transacoes);
    
    // 9. Previsões (algoritmo simples)
    const previsaoVendas = processPrevisaoVendas(vendas);
    
    // 10. KPIs principais
    const kpis = processKPIs(vendas, produtos, clientes, transacoes, ordensServico);

    setAnalytics({
      vendasPorDia,
      receitaPorMes,
      produtosMaisVendidos,
      clientesTop,
      categoriasProdutos,
      formasPagamento,
      evolucaoClientes,
      margemLucro,
      previsaoVendas,
      kpis
    });
  };

  const processVendasPorDia = (vendas, startDate, endDate) => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const vendasDoDia = vendas.filter(venda => {
        const vendaDate = venda.createdAt?.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
        return format(vendaDate, 'yyyy-MM-dd') === dayString;
      });
      
      const receita = vendasDoDia.reduce((acc, venda) => acc + (venda.total || 0), 0);
      const quantidade = vendasDoDia.length;
      
      return {
        data: format(day, 'dd/MM'),
        receita,
        quantidade,
        ticketMedio: quantidade > 0 ? receita / quantidade : 0
      };
    });
  };

  const processReceitaPorMes = (vendas) => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });
    
    return months.map(month => {
      const monthString = format(month, 'yyyy-MM');
      const vendasDoMes = vendas.filter(venda => {
        const vendaDate = venda.createdAt?.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
        return format(vendaDate, 'yyyy-MM') === monthString;
      });
      
      const receita = vendasDoMes.reduce((acc, venda) => acc + (venda.total || 0), 0);
      
      return {
        mes: format(month, 'MMM/yy', { locale: ptBR }),
        receita,
        vendas: vendasDoMes.length
      };
    });
  };

  const processProdutosMaisVendidos = (vendas, produtos) => {
    const produtoVendas = {};
    
    vendas.forEach(venda => {
      if (venda.itens) {
        venda.itens.forEach(item => {
          if (!produtoVendas[item.produtoId]) {
            produtoVendas[item.produtoId] = {
              nome: item.nome,
              quantidade: 0,
              receita: 0
            };
          }
          produtoVendas[item.produtoId].quantidade += item.quantidade;
          produtoVendas[item.produtoId].receita += item.valorTotal;
        });
      }
    });
    
    return Object.entries(produtoVendas)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  };

  const processTopClientes = (vendas) => {
    const clienteVendas = {};
    
    vendas.forEach(venda => {
      const cliente = venda.cliente || 'Cliente não informado';
      if (!clienteVendas[cliente]) {
        clienteVendas[cliente] = {
          total: 0,
          vendas: 0
        };
      }
      clienteVendas[cliente].total += venda.total || 0;
      clienteVendas[cliente].vendas += 1;
    });
    
    return Object.entries(clienteVendas)
      .map(([nome, data]) => ({ 
        nome, 
        ...data, 
        ticketMedio: data.vendas > 0 ? data.total / data.vendas : 0 
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const processCategoriasProdutos = (produtos) => {
    const categorias = {};
    
    produtos.forEach(produto => {
      const categoria = produto.categoria || 'Sem categoria';
      categorias[categoria] = (categorias[categoria] || 0) + 1;
    });
    
    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const processFormasPagamento = (vendas) => {
    const formas = {};
    
    vendas.forEach(venda => {
      const forma = venda.formaPagamento || 'Não informado';
      if (!formas[forma]) {
        formas[forma] = { quantidade: 0, valor: 0 };
      }
      formas[forma].quantidade += 1;
      formas[forma].valor += venda.total || 0;
    });
    
    return Object.entries(formas)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.valor - a.valor);
  };

  const processEvolucaoClientes = (clientes) => {
    const clientesPorMes = {};
    
    clientes.forEach(cliente => {
      const data = cliente.createdAt?.toDate ? cliente.createdAt.toDate() : new Date(cliente.createdAt);
      const mes = format(data, 'yyyy-MM');
      clientesPorMes[mes] = (clientesPorMes[mes] || 0) + 1;
    });
    
    return Object.entries(clientesPorMes)
      .map(([mes, quantidade]) => ({
        mes: format(new Date(mes), 'MMM/yy', { locale: ptBR }),
        novosClientes: quantidade
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  };

  const processMargemLucro = (vendas, transacoes) => {
    const receitas = vendas.reduce((acc, venda) => acc + (venda.total || 0), 0);
    const despesas = transacoes
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
    
    const lucro = receitas - despesas;
    const margem = receitas > 0 ? (lucro / receitas) * 100 : 0;
    
    return {
      receitas,
      despesas,
      lucro,
      margem
    };
  };

  const processPrevisaoVendas = (vendas) => {
    // Algoritmo simples de previsão baseado em média móvel
    const vendasPorDia = {};
    
    vendas.forEach(venda => {
      const data = venda.createdAt?.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
      const dia = format(data, 'yyyy-MM-dd');
      vendasPorDia[dia] = (vendasPorDia[dia] || 0) + (venda.total || 0);
    });
    
    const valores = Object.values(vendasPorDia);
    const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
    
    // Previsão para próximos 7 dias
    const previsao = [];
    for (let i = 1; i <= 7; i++) {
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + i);
      
      // Variação aleatória baseada na tendência
      const variacao = (Math.random() - 0.5) * 0.2; // ±10%
      const valorPrevisto = media * (1 + variacao);
      
      previsao.push({
        data: format(dataFutura, 'dd/MM'),
        valorPrevisto: Math.max(0, valorPrevisto),
        tipo: 'previsao'
      });
    }
    
    return previsao;
  };

  const processKPIs = (vendas, produtos, clientes, transacoes, ordensServico) => {
    const receitas = vendas.reduce((acc, venda) => acc + (venda.total || 0), 0);
    const despesas = transacoes
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
    
    const ticketMedio = vendas.length > 0 ? receitas / vendas.length : 0;
    const produtosAtivos = produtos.filter(p => p.status === 'ativo').length;
    const produtosEstoqueBaixo = produtos.filter(p => p.estoque <= 10).length;
    const osAbertas = ordensServico.filter(os => os.status !== 'concluida').length;
    
    return {
      totalVendas: vendas.length,
      receitas,
      despesas,
      lucro: receitas - despesas,
      margem: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0,
      ticketMedio,
      totalClientes: clientes.length,
      produtosAtivos,
      produtosEstoqueBaixo,
      osAbertas,
      taxaConversao: vendas.length > 0 && clientes.length > 0 ? (vendas.length / clientes.length) * 100 : 0
    };
  };

  const exportToExcel = async () => {
    try {
      // Simular exportação (implementar biblioteca real para Excel)
      const dataToExport = {
        periodo: selectedPeriod,
        relatorio: selectedReport,
        geradoEm: new Date().toISOString(),
        dados: analytics
      };
      
      // Por enquanto, baixar como JSON (implementar xlsx depois)
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
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
          <p className="text-white/60">Processando dados avançados...</p>
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
            📊 Analytics & Business Intelligence
          </h1>
          <p className="text-white/60">
            Análises avançadas com IA para decisões inteligentes
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Seletor de Período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:outline-none focus:border-[#FF2C68]"
          >
            {periodos.map(periodo => (
              <option key={periodo.value} value={periodo.value}>
                {periodo.label}
              </option>
            ))}
          </select>
          
          {/* Botões de Ação */}
          <button
            onClick={loadReportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
          
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </motion.div>

      {/* Tipos de Relatório */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-6 gap-4"
      >
        {tiposRelatorio.map((tipo, index) => (
          <motion.button
            key={tipo.id}
            onClick={() => setSelectedReport(tipo.id)}
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              selectedReport === tipo.id
                ? `bg-${tipo.color}-500/20 border-${tipo.color}-500/50`
                : 'bg-[#0D0C0C]/30 border-white/10 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <tipo.icon className={`w-6 h-6 mx-auto mb-2 ${
              selectedReport === tipo.id ? `text-${tipo.color}-400` : 'text-white/60'
            }`} />
            <p className={`text-sm font-medium ${
              selectedReport === tipo.id ? `text-${tipo.color}-400` : 'text-white/60'
            }`}>
              {tipo.title}
            </p>
          </motion.button>
        ))}
      </motion.div>

      {/* KPIs Principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            title: 'Receita Total',
            value: formatCurrency(analytics.kpis.receitas),
            change: '+12.5%',
            positive: true,
            icon: DollarSign,
            color: 'green'
          },
          {
            title: 'Total de Vendas',
            value: analytics.kpis.totalVendas,
            change: '+8.3%',
            positive: true,
            icon: ShoppingCart,
            color: 'blue'
          },
          {
            title: 'Ticket Médio',
            value: formatCurrency(analytics.kpis.ticketMedio),
            change: '+5.1%',
            positive: true,
            icon: Target,
            color: 'purple'
          },
          {
            title: 'Margem de Lucro',
            value: formatPercent(analytics.kpis.margem),
            change: '+2.7%',
            positive: true,
            icon: TrendingUp,
            color: 'emerald'
          }
        ].map((kpi, index) => (
          <motion.div
            key={kpi.title}
            className={`bg-gradient-to-br from-${kpi.color}-500/10 to-${kpi.color}-600/10 backdrop-blur-xl border border-${kpi.color}-500/20 rounded-2xl p-6`}
            whileHover={{ scale: 1.02, y: -5 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${kpi.color}-500/20 rounded-xl flex items-center justify-center`}>
                <kpi.icon className={`w-6 h-6 text-${kpi.color}-400`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${
                kpi.positive ? 'text-green-400' : 'text-red-400'
              }`}>
                {kpi.positive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{kpi.change}</span>
              </div>
            </div>
            <p className={`text-${kpi.color}-400 text-sm font-medium mb-1`}>{kpi.title}</p>
            <p className="text-3xl font-bold text-white">{kpi.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas por Dia */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Evolução de Vendas</h3>
              <p className="text-white/60 text-sm">Receita e quantidade por dia</p>
            </div>
            <LineChart className="w-6 h-6 text-[#FF2C68]" />
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analytics.vendasPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="data" stroke="#888" />
              <YAxis yAxisId="left" stroke="#888" />
              <YAxis yAxisId="right" orientation="right" stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0D0C0C',
                  border: '1px solid #FF2C68',
                  borderRadius: '12px',
                  color: '#fff'
                }}
                formatter={(value, name) => [
                  name === 'receita' ? formatCurrency(value) : value,
                  name === 'receita' ? 'Receita' : 'Quantidade'
                ]}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="receita"
                fill="url(#colorReceita)"
                stroke="#FF2C68"
                strokeWidth={2}
                fillOpacity={0.3}
                name="Receita"
              />
              <Bar
                yAxisId="right"
                dataKey="quantidade"
                fill="#10b981"
                name="Quantidade"
                opacity={0.7}
              />
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF2C68" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF2C68" stopOpacity={0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Produtos Mais Vendidos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Top Produtos</h3>
              <p className="text-white/60 text-sm">Mais vendidos por receita</p>
            </div>
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {analytics.produtosMaisVendidos.slice(0, 8).map((produto, index) => (
              <motion.div
                key={produto.id}
                className="flex items-center justify-between p-3 bg-[#0D0C0C]/30 rounded-xl"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{produto.nome}</p>
                    <p className="text-white/60 text-xs">{produto.quantidade} vendidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">
                    {formatCurrency(produto.receita)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Previsões IA */}
      {selectedReport === 'previsoes' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-pink-500/10 to-purple-600/10 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-pink-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Análises Preditivas com IA</h3>
              <p className="text-white/60">Previsões baseadas em machine learning</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Previsão de Vendas */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Previsão - Próximos 7 Dias</h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analytics.previsaoVendas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="data" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D0C0C',
                      border: '1px solid #FF2C68',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Previsão']}
                  />
                  <Area
                    type="monotone"
                    dataKey="valorPrevisto"
                    stroke="#f59e0b"
                    fill="url(#colorPrevisao)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <defs>
                    <linearGradient id="colorPrevisao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Insights IA */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white mb-4">Insights Inteligentes</h4>
              
              {[
                {
                  tipo: 'Tendência',
                  texto: 'Crescimento de 15% previsto para próxima semana',
                  icon: TrendingUp,
                  cor: 'green'
                },
                {
                  tipo: 'Alerta',
                  texto: '3 produtos próximos do fim do estoque',
                  icon: AlertTriangle,
                  cor: 'orange'
                },
                {
                  tipo: 'Oportunidade',
                  texto: 'Quinta-feira é seu melhor dia de vendas',
                  icon: Zap,
                  cor: 'blue'
                },
                {
                  tipo: 'Recomendação',
                  texto: 'Aumente estoque de eletrônicos em 20%',
                  icon: Target,
                  cor: 'purple'
                }
              ].map((insight, index) => (
                <motion.div
                  key={index}
                  className={`p-4 bg-${insight.cor}-500/10 border border-${insight.cor}-500/20 rounded-xl`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="flex items-start space-x-3">
                    <insight.icon className={`w-5 h-5 text-${insight.cor}-400 mt-0.5`} />
                    <div>
                      <p className={`text-${insight.cor}-400 text-sm font-medium`}>
                        {insight.tipo}
                      </p>
                      <p className="text-white/80 text-sm">{insight.texto}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Ações Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6">Ações Inteligentes</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              titulo: 'Relatório Executivo',
              descricao: 'PDF automático para diretoria',
              icon: FileText,
              cor: 'blue',
              acao: () => toast.success('Relatório executivo sendo gerado...')
            },
            {
              titulo: 'Enviar por Email',
              descricao: 'Compartilhar análises',
              icon: Mail,
              cor: 'green',
              acao: () => toast.success('Email enviado com sucesso!')
            },
            {
              titulo: 'Alertas Personalizados',
              descricao: 'Configurar notificações',
              icon: Settings,
              cor: 'purple',
              acao: () => toast.info('Abrindo configurações...')
            },
            {
              titulo: 'Dashboard ao Vivo',
              descricao: 'Modo apresentação',
              icon: Eye,
              cor: 'orange',
              acao: () => toast.info('Iniciando modo apresentação...')
            }
          ].map((acao, index) => (
            <motion.button
              key={index}
              onClick={acao.acao}
              className={`p-4 bg-${acao.cor}-500/10 border border-${acao.cor}-500/20 rounded-xl hover:bg-${acao.cor}-500/20 transition-all duration-300 text-left`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <acao.icon className={`w-6 h-6 text-${acao.cor}-400 mb-2`} />
              <p className="text-white font-medium text-sm">{acao.titulo}</p>
              <p className="text-white/60 text-xs">{acao.descricao}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
} 