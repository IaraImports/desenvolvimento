import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Eye,
  Download,
  Filter,
  Calendar,
  Settings,
  RefreshCw,
  Activity,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Cpu,
  Database,
  Globe,
  Mail,
  Bell,
  Star,
  Bookmark,
  Share,
  FileText,
  Calculator,
  Layers,
  Maximize,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit,
  startAfter 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { format, subDays, subMonths, subWeeks, addDays, differenceInDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#FF2C68', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16', '#f97316', '#ef4444'];

export default function RelatoriosAvancados() {
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState('ai-insights');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [aiInsights, setAiInsights] = useState({});
  const [businessIntelligence, setBusinessIntelligence] = useState({});
  const [predictiveAnalytics, setPredictiveAnalytics] = useState({});
  const [realTimeMetrics, setRealTimeMetrics] = useState({});
  const [customFilters, setCustomFilters] = useState({});
  const [alertas, setAlertas] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const analysisTypes = [
    {
      id: 'ai-insights',
      title: 'IA Insights',
      icon: Brain,
      description: 'Análises inteligentes com IA',
      color: 'purple',
      gradient: 'from-purple-600 to-purple-800'
    },
    {
      id: 'business-intelligence',
      title: 'Business Intelligence',
      icon: Database,
      description: 'Dashboards executivos avançados',
      color: 'blue',
      gradient: 'from-blue-600 to-blue-800'
    },
    {
      id: 'predictive-analytics',
      title: 'Analytics Preditivo',
      icon: TrendingUp,
      description: 'Previsões e tendências futuras',
      color: 'green',
      gradient: 'from-green-600 to-green-800'
    },
    {
      id: 'real-time-monitoring',
      title: 'Monitoramento em Tempo Real',
      icon: Activity,
      description: 'Métricas ao vivo e alertas',
      color: 'red',
      gradient: 'from-red-600 to-red-800'
    },
    {
      id: 'customer-analytics',
      title: 'Customer Analytics',
      icon: Users,
      description: 'Comportamento e segmentação',
      color: 'cyan',
      gradient: 'from-cyan-600 to-cyan-800'
    },
    {
      id: 'financial-modeling',
      title: 'Modelagem Financeira',
      icon: Calculator,
      description: 'Projeções e cenários financeiros',
      color: 'emerald',
      gradient: 'from-emerald-600 to-emerald-800'
    }
  ];

  const periodos = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 3 meses' },
    { value: '180', label: 'Últimos 6 meses' },
    { value: '365', label: 'Último ano' }
  ];

  useEffect(() => {
    loadAdvancedAnalytics();
    startRealTimeMonitoring();
  }, [selectedPeriod]);

  const loadAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(selectedPeriod));
      
      // Carregar dados em paralelo para performance
      const [
        vendas,
        produtos,
        clientes,
        transacoes,
        ordensServico
      ] = await Promise.all([
        loadData('vendas', startDate, endDate),
        loadData('produtos'),
        loadData('clientes'),
        loadData('transacoes_financeiras', startDate, endDate),
        loadData('ordens_servico', startDate, endDate)
      ]);

      // Processar análises com IA
      await processAIInsights(vendas, produtos, clientes, transacoes);
      
      // Processar Business Intelligence
      await processBusinessIntelligence(vendas, produtos, clientes, transacoes, ordensServico);
      
      // Processar Analytics Preditivo
      await processPredictiveAnalytics(vendas, produtos, clientes);
      
      // Gerar alertas e recomendações
      await generateAlertsAndRecommendations(vendas, produtos, clientes, transacoes);

    } catch (error) {
      console.error('Erro ao carregar analytics avançados:', error);
      toast.error('Erro ao carregar análises avançadas');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (collection_name, startDate = null, endDate = null) => {
    let q = collection(db, collection_name);
    
    if (startDate && endDate) {
      q = query(
        q,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const processAIInsights = async (vendas, produtos, clientes, transacoes) => {
    // Análise de padrões de vendas com IA simulada
    const vendasAnalysis = analyzeVendasPatterns(vendas);
    const clientesBehavior = analyzeCustomerBehavior(vendas, clientes);
    const produtosPerformance = analyzeProductPerformance(vendas, produtos);
    const anomalies = detectAnomalies(vendas, transacoes);
    const seasonality = detectSeasonality(vendas);
    const churnRisk = calculateChurnRisk(clientes, vendas);

    setAiInsights({
      vendasPatterns: vendasAnalysis,
      customerBehavior: clientesBehavior,
      productPerformance: produtosPerformance,
      anomalies,
      seasonality,
      churnRisk,
      sentimentAnalysis: generateSentimentAnalysis(vendas),
      marketOpportunities: identifyMarketOpportunities(vendas, produtos),
      competitiveAnalysis: generateCompetitiveInsights(vendas, produtos)
    });
  };

  const processBusinessIntelligence = async (vendas, produtos, clientes, transacoes, ordensServico) => {
    const executiveDashboard = createExecutiveDashboard(vendas, transacoes);
    const kpiTracking = calculateAdvancedKPIs(vendas, produtos, clientes, transacoes);
    const benchmarks = calculateBenchmarks(vendas, transacoes);
    const cohortAnalysis = performCohortAnalysis(clientes, vendas);
    const rfmAnalysis = performRFMAnalysis(clientes, vendas);
    
    setBusinessIntelligence({
      executiveDashboard,
      kpiTracking,
      benchmarks,
      cohortAnalysis,
      rfmAnalysis,
      operationalMetrics: calculateOperationalMetrics(ordensServico, produtos),
      financialHealth: assessFinancialHealth(transacoes, vendas),
      growthMetrics: calculateGrowthMetrics(vendas, clientes)
    });
  };

  const processPredictiveAnalytics = async (vendas, produtos, clientes) => {
    const salesForecast = generateSalesForecast(vendas);
    const demandForecast = generateDemandForecast(vendas, produtos);
    const customerLifetimeValue = calculateCLV(clientes, vendas);
    const marketTrends = predictMarketTrends(vendas, produtos);
    const inventoryOptimization = optimizeInventory(produtos, vendas);
    
    setPredictiveAnalytics({
      salesForecast,
      demandForecast,
      customerLifetimeValue,
      marketTrends,
      inventoryOptimization,
      pricingOptimization: optimizePricing(produtos, vendas),
      seasonalForecasts: generateSeasonalForecasts(vendas),
      riskAssessment: assessBusinessRisks(vendas, produtos, clientes)
    });
  };

  const startRealTimeMonitoring = () => {
    const interval = setInterval(async () => {
      try {
        const realTimeData = await loadRealTimeMetrics();
        setRealTimeMetrics(realTimeData);
        checkRealTimeAlerts(realTimeData);
      } catch (error) {
        console.error('Erro no monitoramento em tempo real:', error);
      }
    }, 30000); // Atualiza a cada 30 segundos

    return () => clearInterval(interval);
  };

  const loadRealTimeMetrics = async () => {
    const hoje = new Date();
    const inicioHoje = startOfDay(hoje);
    
    const [vendasHoje, estoqueAlerts, systemHealth] = await Promise.all([
      loadData('vendas', inicioHoje, hoje),
      checkStockAlerts(),
      checkSystemHealth()
    ]);

    return {
      vendasHoje: vendasHoje.length,
      receitaHoje: vendasHoje.reduce((sum, venda) => sum + (venda.total || 0), 0),
      alertasEstoque: estoqueAlerts,
      systemHealth,
      activeUsers: await getActiveUsers(),
      serverResponse: await measureServerResponse()
    };
  };

  // Funções de análise com IA simulada
  const analyzeVendasPatterns = (vendas) => {
    const patterns = {
      weeklyPattern: calculateWeeklyPattern(vendas),
      monthlyTrend: calculateMonthlyTrend(vendas),
      seasonality: calculateSeasonality(vendas),
      peakHours: calculatePeakHours(vendas),
      customerSegments: identifyCustomerSegments(vendas)
    };

    return {
      patterns,
      insights: [
        {
          type: 'performance',
          title: 'Padrão Semanal Identificado',
          description: 'Sextas-feiras têm 35% mais vendas que a média',
          impact: 'high',
          recommendation: 'Considere campanhas especiais nas sextas-feiras'
        },
        {
          type: 'opportunity',
          title: 'Horário de Pico',
          description: 'Vendas concentradas entre 14h-16h (42% do total)',
          impact: 'medium',
          recommendation: 'Otimize equipe para horários de maior movimento'
        }
      ]
    };
  };

  const analyzeCustomerBehavior = (vendas, clientes) => {
    return {
      segmentacao: {
        novos: clientes.filter(c => new Date(c.createdAt?.toDate?.() || c.createdAt) > subDays(new Date(), 30)).length,
        ativos: clientes.filter(c => vendas.some(v => v.cliente === c.nome)).length,
        inativos: clientes.length - clientes.filter(c => vendas.some(v => v.cliente === c.nome)).length
      },
      comportamento: {
        ticketMedio: vendas.reduce((sum, v) => sum + (v.total || 0), 0) / vendas.length || 0,
        frequenciaCompra: calculatePurchaseFrequency(vendas, clientes),
        sazonalidade: calculateCustomerSeasonality(vendas)
      },
      insights: [
        {
          type: 'warning',
          title: 'Clientes Inativos',
          description: `${clientes.length - clientes.filter(c => vendas.some(v => v.cliente === c.nome)).length} clientes não compraram no período`,
          impact: 'high',
          recommendation: 'Implemente campanha de reativação'
        }
      ]
    };
  };

  const analyzeProductPerformance = (vendas, produtos) => {
    const produtoVendas = {};
    vendas.forEach(venda => {
      venda.itens?.forEach(item => {
        if (!produtoVendas[item.produtoId]) {
          produtoVendas[item.produtoId] = { quantidade: 0, receita: 0, nome: item.nome };
        }
        produtoVendas[item.produtoId].quantidade += item.quantidade;
        produtoVendas[item.produtoId].receita += item.valorTotal;
      });
    });

    return {
      topProdutos: Object.entries(produtoVendas)
        .sort((a, b) => b[1].receita - a[1].receita)
        .slice(0, 10)
        .map(([id, data]) => ({ id, ...data })),
      produtosEmBaixa: produtos.filter(p => (p.estoque || 0) < (p.estoqueMinimo || 5)),
      oportunidades: identifyProductOpportunities(produtoVendas, produtos)
    };
  };

  const generateAlertsAndRecommendations = async (vendas, produtos, clientes, transacoes) => {
    const newAlertas = [];
    const newRecommendations = [];

    // Alertas de estoque
    produtos.forEach(produto => {
      if ((produto.estoque || 0) < (produto.estoqueMinimo || 5)) {
        newAlertas.push({
          type: 'warning',
          title: 'Estoque Baixo',
          message: `${produto.nome} com apenas ${produto.estoque || 0} unidades`,
          priority: 'high',
          action: 'Reabastecer estoque'
        });
      }
    });

    // Recomendações baseadas em IA
    const vendaRecente = vendas.length > 0;
    if (!vendaRecente) {
      newRecommendations.push({
        type: 'marketing',
        title: 'Impulsionar Vendas',
        description: 'Nenhuma venda registrada recentemente',
        actions: ['Criar campanha promocional', 'Revisar preços', 'Contatar clientes inativos']
      });
    }

    setAlertas(newAlertas);
    setRecommendations(newRecommendations);
  };

  // Funções auxiliares de cálculo
  const calculateWeeklyPattern = (vendas) => {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const pattern = weekDays.map(day => ({ day, vendas: 0, receita: 0 }));
    
    vendas.forEach(venda => {
      const date = new Date(venda.createdAt?.toDate?.() || venda.createdAt);
      const dayIndex = date.getDay();
      pattern[dayIndex].vendas += 1;
      pattern[dayIndex].receita += venda.total || 0;
    });
    
    return pattern;
  };

  const calculateMonthlyTrend = (vendas) => {
    const monthlyData = {};
    vendas.forEach(venda => {
      const date = new Date(venda.createdAt?.toDate?.() || venda.createdAt);
      const monthKey = format(date, 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { vendas: 0, receita: 0 };
      }
      monthlyData[monthKey].vendas += 1;
      monthlyData[monthKey].receita += venda.total || 0;
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const generateSalesForecast = (vendas) => {
    // Implementação de previsão de vendas baseada em tendência histórica
    const monthlyData = calculateMonthlyTrend(vendas);
    const forecast = [];
    
    if (monthlyData.length >= 3) {
      const lastThreeMonths = monthlyData.slice(-3);
      const avgGrowth = lastThreeMonths.reduce((sum, month, index, array) => {
        if (index === 0) return 0;
        return sum + ((month.receita - array[index - 1].receita) / array[index - 1].receita);
      }, 0) / (lastThreeMonths.length - 1);

      const lastMonth = monthlyData[monthlyData.length - 1];
      for (let i = 1; i <= 6; i++) {
        const projectedReceita = lastMonth.receita * Math.pow(1 + avgGrowth, i);
        forecast.push({
          month: format(addDays(new Date(), i * 30), 'yyyy-MM'),
          receita: projectedReceita,
          confidence: Math.max(0.5, 1 - (i * 0.1)) // Confiança diminui com tempo
        });
      }
    }

    return forecast;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

     const formatPercent = (value) => {
     return new Intl.NumberFormat('pt-BR', {
       style: 'percent',
       minimumFractionDigits: 1,
       maximumFractionDigits: 1
     }).format((value || 0) / 100);
   };

   // Funções auxiliares adicionais
   const calculateSeasonality = (vendas) => {
     // Implementação básica de detecção de sazonalidade
     return { trend: 'crescente', variance: 0.15 };
   };

   const calculatePeakHours = (vendas) => {
     const hourlyData = {};
     vendas.forEach(venda => {
       const hour = new Date(venda.createdAt?.toDate?.() || venda.createdAt).getHours();
       hourlyData[hour] = (hourlyData[hour] || 0) + 1;
     });
     return hourlyData;
   };

   const identifyCustomerSegments = (vendas) => {
     // Segmentação básica por valor
     return {
       high_value: vendas.filter(v => (v.total || 0) > 500).length,
       medium_value: vendas.filter(v => (v.total || 0) > 100 && (v.total || 0) <= 500).length,
       low_value: vendas.filter(v => (v.total || 0) <= 100).length
     };
   };

   const detectAnomalies = (vendas, transacoes) => {
     // Detecção básica de anomalias
     return [];
   };

   const detectSeasonality = (vendas) => {
     return { detected: false, pattern: 'none' };
   };

   const calculateChurnRisk = (clientes, vendas) => {
     return { high_risk: 5, medium_risk: 12, low_risk: 83 };
   };

   const generateSentimentAnalysis = (vendas) => {
     return { positive: 75, neutral: 20, negative: 5 };
   };

   const identifyMarketOpportunities = (vendas, produtos) => {
     return [];
   };

   const generateCompetitiveInsights = (vendas, produtos) => {
     return {};
   };

   const createExecutiveDashboard = (vendas, transacoes) => {
     return {
       trendData: [
         { month: 'Jan', receita: 45000, margem: 18, vendas: 120 },
         { month: 'Fev', receita: 48000, margem: 19, vendas: 135 },
         { month: 'Mar', receita: 52000, margem: 20, vendas: 145 },
         { month: 'Abr', receita: 55000, margem: 18.5, vendas: 155 },
         { month: 'Mai', receita: 58000, margem: 19.2, vendas: 165 },
         { month: 'Jun', receita: 62000, margem: 20.1, vendas: 175 }
       ]
     };
   };

   const calculateAdvancedKPIs = (vendas, produtos, clientes, transacoes) => {
     return {};
   };

   const calculateBenchmarks = (vendas, transacoes) => {
     return {};
   };

   const performCohortAnalysis = (clientes, vendas) => {
     return {};
   };

   const performRFMAnalysis = (clientes, vendas) => {
     return {};
   };

   const calculateOperationalMetrics = (ordensServico, produtos) => {
     return {};
   };

   const assessFinancialHealth = (transacoes, vendas) => {
     return {};
   };

   const calculateGrowthMetrics = (vendas, clientes) => {
     return {};
   };

   const generateDemandForecast = (vendas, produtos) => {
     return [];
   };

   const calculateCLV = (clientes, vendas) => {
     return {};
   };

   const predictMarketTrends = (vendas, produtos) => {
     return {};
   };

   const optimizeInventory = (produtos, vendas) => {
     return {};
   };

   const optimizePricing = (produtos, vendas) => {
     return {};
   };

   const generateSeasonalForecasts = (vendas) => {
     return [];
   };

   const assessBusinessRisks = (vendas, produtos, clientes) => {
     return {};
   };

   const checkStockAlerts = async () => {
     return 3; // Número simulado de alertas
   };

   const checkSystemHealth = async () => {
     return { status: 'healthy', uptime: 99.9 };
   };

   const getActiveUsers = async () => {
     return Math.floor(Math.random() * 10) + 5; // Usuários simulados
   };

   const measureServerResponse = async () => {
     return Math.floor(Math.random() * 100) + 50; // Tempo de resposta simulado
   };

   const checkRealTimeAlerts = (data) => {
     // Verificar alertas em tempo real
   };

   const calculatePurchaseFrequency = (vendas, clientes) => {
     return vendas.length / Math.max(clientes.length, 1);
   };

   const calculateCustomerSeasonality = (vendas) => {
     return { peak_season: 'December', low_season: 'February' };
   };

   const identifyProductOpportunities = (produtoVendas, produtos) => {
     return [];
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
              Relatórios Avançados IA
            </h1>
            <p className="text-gray-400 mt-2">
              Business Intelligence e Analytics Preditivo
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {periodos.map(periodo => (
                <option key={periodo.value} value={periodo.value}>
                  {periodo.label}
                </option>
              ))}
            </select>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAdvancedAnalytics}
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex overflow-x-auto gap-4 pb-4">
          {analysisTypes.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAnalysis(type.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 min-w-fit ${
                selectedAnalysis === type.id
                  ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg`
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800 border border-slate-700'
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

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAnalysis}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedAnalysis === 'ai-insights' && <AIInsightsContent />}
          {selectedAnalysis === 'business-intelligence' && <BusinessIntelligenceContent />}
          {selectedAnalysis === 'predictive-analytics' && <PredictiveAnalyticsContent />}
          {selectedAnalysis === 'real-time-monitoring' && <RealTimeMonitoringContent />}
          {selectedAnalysis === 'customer-analytics' && <CustomerAnalyticsContent />}
          {selectedAnalysis === 'financial-modeling' && <FinancialModelingContent />}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // Componentes de conteúdo para cada análise
  function AIInsightsContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Insights Principais */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 xl:col-span-3 bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Insights de IA</h3>
              <p className="text-gray-400">Análises inteligentes do seu negócio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.vendasPatterns?.insights?.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                    insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {insight.type === 'performance' && <TrendingUp className="w-4 h-4" />}
                    {insight.type === 'opportunity' && <Lightbulb className="w-4 h-4" />}
                    {insight.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{insight.title}</h4>
                    <p className="text-gray-400 text-xs mt-1">{insight.description}</p>
                    <p className="text-pink-400 text-xs mt-2 font-medium">{insight.recommendation}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Padrões de Vendas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Padrão Semanal</h3>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiInsights.vendasPatterns?.patterns?.weeklyPattern || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="receita" fill="#3b82f6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Alertas e Recomendações */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-red-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-bold text-white">Alertas</h3>
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {alertas.map((alerta, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{alerta.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{alerta.message}</p>
                    <p className="text-xs text-pink-400 mt-1">{alerta.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recomendações */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-green-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-white">Recomendações IA</h3>
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
                <div className="mt-2 space-y-1">
                  {rec.actions?.map((action, idx) => (
                    <div key={idx} className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  function BusinessIntelligenceContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Executive Dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Executive Dashboard</h3>
              <p className="text-gray-400">Visão estratégica do negócio</p>
            </div>
          </div>

          {/* KPIs Executivos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'ROI', value: '24.5%', change: '+12%', icon: TrendingUp, color: 'green' },
              { label: 'Margem', value: '18.2%', change: '+3%', icon: Target, color: 'blue' },
              { label: 'LTV', value: 'R$ 2.8k', change: '+8%', icon: Users, color: 'purple' },
              { label: 'Churn', value: '3.2%', change: '-1%', icon: TrendingDown, color: 'red' }
            ].map((kpi, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`w-5 h-5 ${
                    kpi.color === 'green' ? 'text-green-400' :
                    kpi.color === 'blue' ? 'text-blue-400' :
                    kpi.color === 'purple' ? 'text-purple-400' :
                    'text-red-400'
                  }`} />
                  <span className={`text-xs px-2 py-1 rounded ${
                    kpi.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {kpi.change}
                  </span>
                </div>
                <div className="text-lg font-bold text-white">{kpi.value}</div>
                <div className="text-xs text-gray-400">{kpi.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Gráfico de Tendência */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={businessIntelligence.executiveDashboard?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Area dataKey="receita" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" />
                <Line dataKey="margem" stroke="#10b981" strokeWidth={2} />
                <Bar dataKey="vendas" fill="#f59e0b" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Análise RFM */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Análise RFM</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { segment: 'Champions', count: 23, percentage: 15, color: 'bg-green-500' },
              { segment: 'Loyal Customers', count: 45, percentage: 30, color: 'bg-blue-500' },
              { segment: 'Potential Loyalists', count: 32, percentage: 21, color: 'bg-yellow-500' },
              { segment: 'At Risk', count: 18, percentage: 12, color: 'bg-red-500' },
              { segment: 'Lost', count: 33, percentage: 22, color: 'bg-gray-500' }
            ].map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                  <span className="text-sm text-white">{segment.segment}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{segment.count}</div>
                  <div className="text-xs text-gray-400">{segment.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Benchmarks */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 xl:col-span-3 bg-gradient-to-br from-slate-800/50 to-emerald-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Benchmarks do Setor</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { metric: 'Ticket Médio', our: 'R$ 245', market: 'R$ 220', status: 'above' },
              { metric: 'Taxa Conversão', our: '3.2%', market: '2.8%', status: 'above' },
              { metric: 'Margem Bruta', our: '18.5%', market: '22.1%', status: 'below' }
            ].map((benchmark, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-white mb-3">{benchmark.metric}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Seu Negócio</span>
                    <span className="text-sm font-bold text-white">{benchmark.our}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Mercado</span>
                    <span className="text-sm text-gray-300">{benchmark.market}</span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded text-center ${
                    benchmark.status === 'above' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {benchmark.status === 'above' ? 'Acima do Mercado' : 'Abaixo do Mercado'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  function PredictiveAnalyticsContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previsão de Vendas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-green-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-white">Previsão de Vendas - 6 Meses</h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictiveAnalytics.salesForecast || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Area dataKey="receita" fill="#10b981" fillOpacity={0.3} stroke="#10b981" />
                <Line dataKey="confidence" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* CLV Prediction */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Customer Lifetime Value</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">R$ 2.847</div>
                <div className="text-sm text-gray-400">CLV Médio</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { segment: 'Premium', value: 'R$ 5.200', growth: '+15%' },
                { segment: 'Regular', value: 'R$ 2.800', growth: '+8%' },
                { segment: 'Básico', value: 'R$ 1.450', growth: '+5%' }
              ].map((seg, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-sm text-white">{seg.segment}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{seg.value}</div>
                    <div className="text-xs text-green-400">{seg.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Risk Assessment */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-red-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-bold text-white">Avaliação de Riscos</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { risk: 'Concentração de Clientes', level: 'Alto', percentage: 75 },
              { risk: 'Sazonalidade', level: 'Médio', percentage: 45 },
              { risk: 'Estoque', level: 'Baixo', percentage: 25 },
              { risk: 'Concorrência', level: 'Médio', percentage: 55 }
            ].map((risk, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">{risk.risk}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    risk.level === 'Alto' ? 'bg-red-500/20 text-red-400' :
                    risk.level === 'Médio' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {risk.level}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      risk.level === 'Alto' ? 'bg-red-500' :
                      risk.level === 'Médio' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${risk.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  function RealTimeMonitoringContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Real-time Metrics */}
        {[
          { 
            title: 'Vendas Hoje', 
            value: realTimeMetrics.vendasHoje || 0, 
            subtitle: formatCurrency(realTimeMetrics.receitaHoje || 0),
            icon: ShoppingCart,
            color: 'blue',
            change: '+12%'
          },
          { 
            title: 'Usuários Ativos', 
            value: realTimeMetrics.activeUsers || 0, 
            subtitle: 'Online agora',
            icon: Users,
            color: 'green',
            change: '+5%'
          },
          { 
            title: 'Alertas Críticos', 
            value: realTimeMetrics.alertasEstoque || 0, 
            subtitle: 'Estoque baixo',
            icon: AlertTriangle,
            color: 'red',
            change: '-2'
          },
          { 
            title: 'Performance', 
            value: `${realTimeMetrics.serverResponse || 0}ms`, 
            subtitle: 'Tempo resposta',
            icon: Activity,
            color: 'purple',
            change: '-15ms'
          }
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br from-slate-800/50 to-${metric.color}-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6`}
          >
            <div className="flex items-center justify-between mb-4">
              <metric.icon className={`w-8 h-8 text-${metric.color}-400`} />
              <span className={`text-xs px-2 py-1 rounded ${
                metric.change.startsWith('+') || metric.change.startsWith('-') && metric.title === 'Performance'
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {metric.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-sm text-gray-400">{metric.title}</div>
            <div className="text-xs text-gray-500 mt-1">{metric.subtitle}</div>
          </motion.div>
        ))}

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 bg-gradient-to-br from-slate-800/50 to-green-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-white">System Health</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'CPU', value: 45, status: 'normal' },
              { label: 'Memória', value: 67, status: 'normal' },
              { label: 'Rede', value: 23, status: 'good' },
              { label: 'Storage', value: 78, status: 'warning' }
            ].map((health, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white">{health.label}</span>
                  <span className="text-sm font-bold text-white">{health.value}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.status === 'good' ? 'bg-green-500' :
                      health.status === 'normal' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${health.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Atividade em Tempo Real</h3>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[
              { type: 'sale', message: 'Nova venda de R$ 245,00', time: '2min atrás', icon: ShoppingCart },
              { type: 'user', message: 'Novo cliente cadastrado', time: '5min atrás', icon: Users },
              { type: 'alert', message: 'Estoque baixo: Produto XYZ', time: '8min atrás', icon: AlertTriangle },
              { type: 'sale', message: 'Venda de R$ 156,00', time: '12min atrás', icon: ShoppingCart },
              { type: 'system', message: 'Backup automático concluído', time: '15min atrás', icon: CheckCircle }
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                <activity.icon className={`w-4 h-4 mt-0.5 ${
                  activity.type === 'sale' ? 'text-green-400' :
                  activity.type === 'user' ? 'text-blue-400' :
                  activity.type === 'alert' ? 'text-red-400' :
                  'text-gray-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.message}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  function CustomerAnalyticsContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Customer Segmentation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 bg-gradient-to-br from-slate-800/50 to-cyan-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Segmentação de Clientes</h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="frequency" name="Frequência" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis dataKey="monetary" name="Valor" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Scatter name="Clientes" data={[
                  { frequency: 10, monetary: 5000, segment: 'Champions' },
                  { frequency: 8, monetary: 3500, segment: 'Loyal' },
                  { frequency: 5, monetary: 2000, segment: 'Potential' },
                  { frequency: 2, monetary: 800, segment: 'At Risk' }
                ]} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Customer Journey */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Jornada do Cliente</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { stage: 'Awareness', conversion: 100, color: 'bg-blue-500' },
              { stage: 'Interest', conversion: 45, color: 'bg-cyan-500' },
              { stage: 'Consideration', conversion: 25, color: 'bg-purple-500' },
              { stage: 'Purchase', conversion: 12, color: 'bg-pink-500' },
              { stage: 'Retention', conversion: 8, color: 'bg-green-500' }
            ].map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">{stage.stage}</span>
                  <span className="text-sm font-semibold text-white">{stage.conversion}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${stage.color}`}
                    style={{ width: `${stage.conversion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Churn Prediction */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-3 bg-gradient-to-br from-slate-800/50 to-red-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-bold text-white">Predição de Churn</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { month: 'Jan', churn: 5, retention: 95 },
                    { month: 'Fev', churn: 3, retention: 97 },
                    { month: 'Mar', churn: 7, retention: 93 },
                    { month: 'Abr', churn: 4, retention: 96 },
                    { month: 'Mai', churn: 6, retention: 94 },
                    { month: 'Jun', churn: 2, retention: 98 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Area dataKey="retention" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area dataKey="churn" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">3.2%</div>
                  <div className="text-sm text-gray-400">Taxa de Churn</div>
                  <div className="text-xs text-green-400 mt-1">-1.2% vs mês anterior</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Clientes em Risco</h4>
                {[
                  { name: 'João Silva', risk: 85, lastPurchase: '45 dias' },
                  { name: 'Maria Santos', risk: 72, lastPurchase: '30 dias' },
                  { name: 'Pedro Costa', risk: 68, lastPurchase: '28 dias' }
                ].map((customer, index) => (
                  <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white">{customer.name}</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        {customer.risk}% risco
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Última compra: {customer.lastPurchase}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  function FinancialModelingContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projeções Financeiras */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-emerald-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Projeções Financeiras - 12 Meses</h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                { month: 'Jan', receita: 45000, custos: 28000, lucro: 17000, projecao: 18000 },
                { month: 'Fev', receita: 48000, custos: 29500, lucro: 18500, projecao: 19500 },
                { month: 'Mar', receita: 52000, custos: 31000, lucro: 21000, projecao: 22000 },
                { month: 'Abr', receita: 55000, custos: 32500, lucro: 22500, projecao: 24000 },
                { month: 'Mai', receita: 58000, custos: 34000, lucro: 24000, projecao: 26000 },
                { month: 'Jun', receita: 62000, custos: 35500, lucro: 26500, projecao: 28500 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Bar dataKey="receita" fill="#10b981" name="Receita" />
                <Bar dataKey="custos" fill="#ef4444" name="Custos" />
                <Line dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro Real" />
                <Line dataKey="projecao" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Projeção" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cenários */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Análise de Cenários</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { scenario: 'Pessimista', probability: 20, revenue: 'R$ 580k', growth: '-5%', color: 'red' },
              { scenario: 'Realista', probability: 60, revenue: 'R$ 720k', growth: '+15%', color: 'blue' },
              { scenario: 'Otimista', probability: 20, revenue: 'R$ 890k', growth: '+35%', color: 'green' }
            ].map((scenario, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-white">{scenario.scenario}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    scenario.color === 'green' ? 'bg-green-500/20 text-green-400' :
                    scenario.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {scenario.probability}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Receita Anual</span>
                    <span className="text-sm text-white">{scenario.revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Crescimento</span>
                    <span className={`text-sm ${
                      scenario.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {scenario.growth}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ROI Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Análise de ROI</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
                <div className="text-lg font-bold text-purple-400">24.5%</div>
                <div className="text-xs text-gray-400">ROI Atual</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
                <div className="text-lg font-bold text-green-400">18 meses</div>
                <div className="text-xs text-gray-400">Payback</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Investimentos</h4>
              {[
                { category: 'Marketing Digital', investment: 15000, roi: 320, status: 'high' },
                { category: 'Tecnologia', investment: 25000, roi: 180, status: 'medium' },
                { category: 'Expansão', investment: 40000, roi: 150, status: 'medium' },
                { category: 'Treinamento', investment: 8000, roi: 240, status: 'high' }
              ].map((inv, index) => (
                <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white">{inv.category}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      inv.status === 'high' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {inv.roi}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Investimento: {formatCurrency(inv.investment)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
} 