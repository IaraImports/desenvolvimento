import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  DollarSign,
  Package,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Settings,
  Target,
  ShoppingCart,
  Activity,
  Clock,
  Zap,
  Database,
  FileText,
  Search,
  ArrowUp,
  ArrowDown,
  Star,
  Award,
  Lightbulb,
  Brain,
  ChevronRight,
  Plus,
  Play,
  Pause
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function RelatoriosAvancados() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  // Estados para dados reais
  const [vendasData, setVendasData] = useState([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const [categoriaData, setCategoriaData] = useState([]);
  const [clientesTopData, setClientesTopData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    loadAllData();
  }, [selectedPeriod]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadVendasData(),
        loadProdutosMaisVendidos(),
        loadCategoriaData(),
        loadClientesTop(),
        loadKPIData(),
        loadInsights()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do BI');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(selectedPeriod);
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return { startDate, endDate: now };
  };

  const loadVendasData = async () => {
    try {
      const { startDate } = getDateRange();
      
      // Consulta simples sem índice composto
      const snapshot = await getDocs(collection(db, 'vendas'));
      const todasVendas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Filtrar e ordenar no cliente
      const vendas = todasVendas
        .filter(venda => {
          if (venda.status !== 'concluida') return false;
          return venda.createdAt >= startDate;
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 100); // Limitar resultados

      // Agrupar vendas por mês
      const vendasPorMes = {};
      vendas.forEach(venda => {
        const mes = venda.createdAt.toLocaleDateString('pt-BR', { month: 'short' });
        if (!vendasPorMes[mes]) {
          vendasPorMes[mes] = { nome: mes, vendas: 0, lucro: 0, meta: 3500 };
        }
        vendasPorMes[mes].vendas += venda.total || 0;
        vendasPorMes[mes].lucro += (venda.total || 0) * 0.6; // 60% de margem
      });

      setVendasData(Object.values(vendasPorMes));
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      setVendasData([]);
    }
  };

  const loadProdutosMaisVendidos = async () => {
    try {
      const { startDate } = getDateRange();
      
      // Consulta simples sem índice composto
      const snapshot = await getDocs(collection(db, 'vendas'));
      const produtoStats = {};

      snapshot.docs.forEach(doc => {
        const venda = doc.data();
        const vendaDate = venda.createdAt?.toDate() || new Date(venda.createdAt || 0);
        
        // Filtrar no cliente
        if (venda.status === 'concluida' && vendaDate >= startDate) {
          if (venda.itens) {
            venda.itens.forEach(item => {
              if (!produtoStats[item.nome]) {
                produtoStats[item.nome] = {
                  nome: item.nome,
                  quantidade: 0,
                  valor: 0
                };
              }
              produtoStats[item.nome].quantidade += item.quantidade || 0;
              produtoStats[item.nome].valor += item.valorTotal || 0;
            });
          }
        }
      });

      const topProdutos = Object.values(produtoStats)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      setProdutosMaisVendidos(topProdutos);
    } catch (error) {
      console.error('Erro ao carregar produtos mais vendidos:', error);
      setProdutosMaisVendidos([]);
    }
  };

  const loadCategoriaData = async () => {
    try {
      const q = query(collection(db, 'produtos'), where('status', '==', 'ativo'));
      const snapshot = await getDocs(q);
      const categorias = {};

      snapshot.docs.forEach(doc => {
        const produto = doc.data();
        const categoria = produto.categoria || 'Outros';
        categorias[categoria] = (categorias[categoria] || 0) + 1;
      });

      const total = Object.values(categorias).reduce((acc, count) => acc + count, 0);
      const cores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'];
      
      const categoriaDataFormatted = Object.entries(categorias).map(([name, count], index) => ({
        name,
        value: Math.round((count / total) * 100),
        color: cores[index % cores.length]
      }));

      setCategoriaData(categoriaDataFormatted);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategoriaData([]);
    }
  };

  const loadClientesTop = async () => {
    try {
      const { startDate } = getDateRange();
      
      // Consulta simples sem índice composto
      const snapshot = await getDocs(collection(db, 'vendas'));
      const clienteStats = {};

      snapshot.docs.forEach(doc => {
        const venda = doc.data();
        const vendaDate = venda.createdAt?.toDate() || new Date(venda.createdAt || 0);
        
        // Filtrar no cliente
        if (venda.status === 'concluida' && vendaDate >= startDate) {
          const cliente = venda.cliente || 'Cliente não informado';
        
          if (!clienteStats[cliente]) {
            clienteStats[cliente] = {
              nome: cliente,
              total: 0,
              compras: 0
            };
          }
          clienteStats[cliente].total += venda.total || 0;
          clienteStats[cliente].compras += 1;
        }
      });

      const topClientes = Object.values(clienteStats)
        .filter(cliente => cliente.nome !== 'Cliente não informado')
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setClientesTopData(topClientes);
    } catch (error) {
      console.error('Erro ao carregar top clientes:', error);
      setClientesTopData([]);
    }
  };

  const loadKPIData = async () => {
    try {
      const { startDate } = getDateRange();
      const diasPeriodo = parseInt(selectedPeriod);
      const periodoAnteriorStart = new Date(startDate.getTime() - (diasPeriodo * 24 * 60 * 60 * 1000));
      
      // Consulta simples para todas as vendas
      const snapshot = await getDocs(collection(db, 'vendas'));
      const todasVendas = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(doc.data().createdAt || 0)
      }));

      // Filtrar vendas do período atual no cliente
      const vendasAtual = todasVendas.filter(venda => {
        return venda.status === 'concluida' && venda.createdAt >= startDate;
      });

      // Filtrar vendas do período anterior no cliente
      const vendasAnterior = todasVendas.filter(venda => {
        return venda.status === 'concluida' && 
               venda.createdAt >= periodoAnteriorStart && 
               venda.createdAt < startDate;
      });

      // Calcular métricas do período atual
      const receitaTotal = vendasAtual.reduce((acc, venda) => acc + (venda.total || 0), 0);
      const totalVendas = vendasAtual.length;
      const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;

      // Calcular métricas do período anterior
      const receitaAnterior = vendasAnterior.reduce((acc, venda) => acc + (venda.total || 0), 0);
      const vendasAnteriorTotal = vendasAnterior.length;
      const ticketMedioAnterior = vendasAnteriorTotal > 0 ? receitaAnterior / vendasAnteriorTotal : 0;

      // Carregar clientes únicos
      const clientesUnicos = new Set();
      vendasAtual.forEach(venda => {
        if (venda.cliente && venda.cliente !== 'Cliente não informado') {
          clientesUnicos.add(venda.cliente);
        }
      });

      const clientesAnteriores = new Set();
      vendasAnterior.forEach(venda => {
        if (venda.cliente && venda.cliente !== 'Cliente não informado') {
          clientesAnteriores.add(venda.cliente);
        }
      });

      // Calcular variações percentuais
      const calcularVariacao = (atual, anterior) => {
        if (anterior === 0) return atual > 0 ? '+100%' : '0%';
        const variacao = ((atual - anterior) / anterior) * 100;
        return `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%`;
      };

      const kpiCalculated = [
        {
          title: 'Receita Total',
          value: `R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          change: calcularVariacao(receitaTotal, receitaAnterior),
          trend: receitaTotal >= receitaAnterior ? 'up' : 'down',
          icon: DollarSign,
          color: 'green'
        },
        {
          title: 'Vendas do Período',
          value: totalVendas.toString(),
          change: calcularVariacao(totalVendas, vendasAnteriorTotal),
          trend: totalVendas >= vendasAnteriorTotal ? 'up' : 'down',
          icon: ShoppingCart,
          color: 'blue'
        },
        {
          title: 'Clientes Ativos',
          value: clientesUnicos.size.toString(),
          change: calcularVariacao(clientesUnicos.size, clientesAnteriores.size),
          trend: clientesUnicos.size >= clientesAnteriores.size ? 'up' : 'down',
          icon: Users,
          color: 'purple'
        },
        {
          title: 'Ticket Médio',
          value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          change: calcularVariacao(ticketMedio, ticketMedioAnterior),
          trend: ticketMedio >= ticketMedioAnterior ? 'up' : 'down',
          icon: Target,
          color: 'orange'
        }
      ];

      setKpiData(kpiCalculated);
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
      setKpiData([]);
    }
  };

  const loadInsights = async () => {
    try {
      const insightsCalculated = [];

      // Verificar produtos com baixo estoque - consulta simples
      const produtosSnapshot = await getDocs(collection(db, 'produtos'));
      const produtosBaixoEstoque = produtosSnapshot.docs.filter(doc => {
        const produto = doc.data();
        return produto.status === 'ativo' && (produto.estoque <= 5 || produto.quantidade <= 5);
      }).length;

      if (produtosBaixoEstoque > 0) {
        insightsCalculated.push({
          type: 'Alerta',
          title: 'Produtos com baixo estoque',
          description: `${produtosBaixoEstoque} produtos precisam de reposição urgente`,
          action: 'Ver produtos',
          priority: 'high',
          icon: Package
        });
      }

      // Analisar tendência de vendas - consulta simples
      const { startDate } = getDateRange();
      const vendasSnapshot = await getDocs(collection(db, 'vendas'));
      const vendas = vendasSnapshot.docs
        .map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt?.toDate() || new Date(doc.data().createdAt || 0) }))
        .filter(venda => venda.status === 'concluida' && venda.createdAt >= startDate)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);

      if (vendas.length > 10) {
        const vendasRecentes = vendas.slice(0, Math.floor(vendas.length / 2));
        const vendasAnteriores = vendas.slice(Math.floor(vendas.length / 2));
        
        const totalRecente = vendasRecentes.reduce((acc, v) => acc + (v.total || 0), 0);
        const totalAnterior = vendasAnteriores.reduce((acc, v) => acc + (v.total || 0), 0);
        
        if (totalRecente > totalAnterior) {
          const crescimento = Math.round(((totalRecente - totalAnterior) / totalAnterior) * 100);
          insightsCalculated.push({
            type: 'Tendência',
            title: 'Crescimento nas vendas',
            description: `Vendas cresceram ${crescimento}% recentemente`,
            action: 'Analisar',
            priority: 'medium',
            icon: TrendingUp
          });
        }
      }

      // Verificar clientes inativos
      const clientesSnapshot = await getDocs(collection(db, 'clientes'));
      const clientesAtivos = clientesSnapshot.docs.filter(doc => doc.data().status === 'ativo');
      const totalClientes = clientesAtivos.length;
      
      const clientesComCompras = new Set();
      vendas.forEach(venda => {
        if (venda.cliente && venda.cliente !== 'Cliente não informado') {
          clientesComCompras.add(venda.cliente);
        }
      });

      const clientesInativos = totalClientes - clientesComCompras.size;
      if (clientesInativos > 0) {
        insightsCalculated.push({
          type: 'Oportunidade',
          title: 'Reativação de clientes',
          description: `${clientesInativos} clientes não compraram recentemente`,
          action: 'Criar campanha',
          priority: 'medium',
          icon: Users
        });
      }

      // Insight sobre melhor dia da semana
      const vendasPorDia = {};
      vendas.forEach(venda => {
        if (venda.createdAt) {
          const dia = venda.createdAt.getDay();
          const nomeDia = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dia];
          vendasPorDia[nomeDia] = (vendasPorDia[nomeDia] || 0) + (venda.total || 0);
        }
      });

      const melhorDia = Object.entries(vendasPorDia).reduce((max, [dia, valor]) => 
        valor > max.valor ? { dia, valor } : max, { dia: '', valor: 0 }
      );

      if (melhorDia.dia) {
        insightsCalculated.push({
          type: 'Insight',
          title: `${melhorDia.dia} é seu melhor dia`,
          description: `${melhorDia.dia} tem as melhores vendas da semana`,
          action: 'Otimizar',
          priority: 'low',
          icon: Lightbulb
        });
      }

      setInsights(insightsCalculated);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
      setInsights([]);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setRefreshing(false);
    }
  };

  const exportData = (type) => {
    toast.success(`Iniciando exportação em formato ${type}...`);
    // Implementar exportação real aqui
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-white/60">Carregando dados do BI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Profissional */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-[#FF2C68]/20 blur-3xl"></div>
        <div className="relative bg-[#0D0C0C]/50 backdrop-blur-xl rounded-3xl border border-[#FF2C68]/50 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  📊 Business Intelligence
                </h1>
                <p className="text-white/70 text-lg mt-1">
                  Analytics avançado com dados reais do seu negócio
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Dados Reais</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Atualizado agora</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#FF2C68]">
                    <Database className="w-4 h-4" />
                    <span className="text-sm">Firebase Conectado</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-3 bg-[#0D0C0C]/50 border border-white/20 rounded-xl text-white focus:border-[#FF2C68] focus:ring-2 focus:ring-[#FF2C68]/20 focus:outline-none"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </select>
              
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="group px-6 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all border border-blue-500/30 flex items-center space-x-2"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
                <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
              
              <button
                onClick={() => exportData('PDF')}
                className="group px-6 py-3 bg-[#FF2C68]/20 text-[#FF2C68] rounded-xl hover:bg-[#FF2C68]/30 transition-all border border-[#FF2C68]/30 flex items-center space-x-2"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-2">
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'vendas', label: 'Análise de Vendas', icon: TrendingUp },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'insights', label: 'Insights IA', icon: Brain }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group p-4 rounded-xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-br from-[#FF2C68]/20 to-[#FF2C68]/10 border border-[#FF2C68]/50 text-[#FF2C68]' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'} transition-transform`} />
                <span className="font-medium">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Principal */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br from-${kpi.color}-500/20 to-${kpi.color}-600/20 backdrop-blur-xl rounded-2xl border border-${kpi.color}-500/30 p-6 hover:scale-105 transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${kpi.color}-500/30 rounded-xl flex items-center justify-center`}>
                    <kpi.icon className={`w-6 h-6 text-${kpi.color}-400`} />
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {kpi.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{kpi.change}</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
              </div>
            ))}
          </div>
          
          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vendas vs Meta */}
            <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">📈 Vendas vs Meta</h3>
                  <p className="text-white/60">Comparativo mensal</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#FF2C68] rounded-full"></div>
                  <span className="text-white/70 text-sm">Vendas</span>
                  <div className="w-3 h-3 bg-blue-500 rounded-full ml-4"></div>
                  <span className="text-white/70 text-sm">Meta</span>
                </div>
              </div>
              {vendasData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={vendasData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="nome" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="#FF2C68" 
                      fill="#FF2C68"
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="meta" 
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-white/60">
                  Sem dados de vendas no período selecionado
                </div>
              )}
            </div>
            
            {/* Distribuição por Categoria */}
            <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">🎯 Produtos por Categoria</h3>
                  <p className="text-white/60">Distribuição do catálogo</p>
                </div>
              </div>
              {categoriaData.length > 0 ? (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={categoriaData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}%`}
                      >
                        {categoriaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-white/60">
                  Sem dados de categorias disponíveis
                </div>
              )}
            </div>
          </div>

          {/* Top Products & Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Produtos Mais Vendidos */}
            <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">🏆 Top Produtos</h3>
                  <p className="text-white/60">Mais vendidos do período</p>
                </div>
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="space-y-4">
                {produtosMaisVendidos.length > 0 ? (
                  produtosMaisVendidos.map((produto, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#0D0C0C]/40 rounded-xl hover:bg-[#0D0C0C]/60 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{produto.nome}</p>
                          <p className="text-white/60 text-sm">{produto.quantidade} vendas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">R$ {produto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    Sem dados de produtos vendidos no período
                  </div>
                )}
              </div>
            </div>

            {/* Top Clientes */}
            <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">👑 Top Clientes</h3>
                  <p className="text-white/60">Maiores compradores</p>
                </div>
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="space-y-4">
                {clientesTopData.length > 0 ? (
                  clientesTopData.map((cliente, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#0D0C0C]/40 rounded-xl hover:bg-[#0D0C0C]/60 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{cliente.nome}</p>
                          <p className="text-white/60 text-sm">{cliente.compras} compras</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">R$ {cliente.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    Sem dados de clientes no período
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Análise de Vendas */}
      {activeTab === 'vendas' && (
        <div className="space-y-8">
          {/* Gráfico de Vendas Detalhado */}
          <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">📊 Evolução das Vendas</h3>
                <p className="text-white/60">Análise detalhada por período</p>
              </div>
            </div>
            {vendasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={vendasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="nome" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#FF2C68" 
                    strokeWidth={3}
                    dot={{ fill: '#FF2C68', strokeWidth: 2, r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lucro" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-white/60">
                Sem dados de vendas para o período selecionado
              </div>
            )}
          </div>
        </div>
      )}

      {/* Análise de Clientes */}
      {activeTab === 'clientes' && (
        <div className="space-y-8">
          <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-xl font-bold text-white mb-6">👥 Análise de Clientes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#0D0C0C]/40 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{clientesTopData.length}</div>
                <p className="text-white/70">Clientes Ativos</p>
              </div>
              <div className="bg-[#0D0C0C]/40 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {clientesTopData.reduce((acc, c) => acc + c.compras, 0)}
                </div>
                <p className="text-white/70">Total de Compras</p>
              </div>
              <div className="bg-[#0D0C0C]/40 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-[#FF2C68] mb-2">
                  R$ {clientesTopData.reduce((acc, c) => acc + c.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-white/70">Receita Total</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights com IA */}
      {activeTab === 'insights' && (
        <div className="space-y-8">
          <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">🤖 Insights Inteligentes</h3>
                <p className="text-white/60">Análises automáticas baseadas nos seus dados</p>
              </div>
            </div>

            <div className="grid gap-6">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <div key={index} className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${
                    insight.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                    insight.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-blue-500/10 border-blue-500/30'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          insight.priority === 'high' ? 'bg-red-500/20' :
                          insight.priority === 'medium' ? 'bg-yellow-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          <insight.icon className={`w-6 h-6 ${
                            insight.priority === 'high' ? 'text-red-400' :
                            insight.priority === 'medium' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-bold text-lg">{insight.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {insight.type}
                            </span>
                          </div>
                          <p className="text-white/70 mb-4">{insight.description}</p>
                        </div>
                      </div>
                      <button className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2 ${
                        insight.priority === 'high' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                        insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' :
                        'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      }`}>
                        <span>{insight.action}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Brain className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Gerando Insights...</h3>
                  <p className="text-white/60">
                    Precisa de mais dados para gerar insights inteligentes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    );
} 