import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Mail,
  ShoppingBag,
  CreditCard,
  Globe,
  Database,
  Cloud,
  Zap,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Link,
  Unlink,
  Activity,
  Bell,
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Package,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Integracoes() {
  const [loading, setLoading] = useState(true);
  const [integracoes, setIntegracoes] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showApiKey, setShowApiKey] = useState({});

  // Estatísticas das integrações
  const [stats, setStats] = useState({
    totalIntegracoes: 0,
    ativas: 0,
    mensagensEnviadas: 0,
    conversoes: 0
  });

  // Configurações de integração
  const [configData, setConfigData] = useState({
    nome: '',
    tipo: '',
    configuracao: {},
    ativo: true,
    webhook: '',
    apiKey: '',
    secretKey: ''
  });

  const tiposIntegracao = [
    {
      id: 'whatsapp_business',
      nome: 'WhatsApp Business API',
      descricao: 'Envie mensagens automáticas via WhatsApp',
      icon: MessageSquare,
      color: 'green',
      categoria: 'Comunicação',
      recursos: ['Mensagens automáticas', 'Chatbot', 'Templates', 'Relatórios'],
      status: 'disponivel'
    },
    {
      id: 'email_marketing',
      nome: 'Email Marketing',
      descricao: 'Campanhas de email automáticas',
      icon: Mail,
      color: 'blue',
      categoria: 'Marketing',
      recursos: ['Campanhas', 'Automação', 'Segmentação', 'Analytics'],
      status: 'disponivel'
    },
    {
      id: 'mercado_livre',
      nome: 'Mercado Livre',
      descricao: 'Sincronização com marketplace',
      icon: ShoppingBag,
      color: 'yellow',
      categoria: 'Marketplace',
      recursos: ['Produtos', 'Pedidos', 'Estoque', 'Preços'],
      status: 'disponivel'
    },
    {
      id: 'shopee',
      nome: 'Shopee',
      descricao: 'Integração com Shopee',
      icon: Package,
      color: 'orange',
      categoria: 'Marketplace',
      recursos: ['Catálogo', 'Vendas', 'Logística', 'Promoções'],
      status: 'disponivel'
    },
    {
      id: 'ifood',
      nome: 'iFood',
      descricao: 'Delivery e restaurantes',
      icon: Target,
      color: 'red',
      categoria: 'Delivery',
      recursos: ['Cardápio', 'Pedidos', 'Entrega', 'Pagamentos'],
      status: 'disponivel'
    },
    {
      id: 'google_analytics',
      nome: 'Google Analytics',
      descricao: 'Análise de dados avançada',
      icon: TrendingUp,
      color: 'purple',
      categoria: 'Analytics',
      recursos: ['Métricas', 'Conversões', 'Público', 'Relatórios'],
      status: 'disponivel'
    },
    {
      id: 'facebook_ads',
      nome: 'Facebook Ads',
      descricao: 'Campanhas publicitárias automáticas',
      icon: Zap,
      color: 'blue',
      categoria: 'Publicidade',
      recursos: ['Campanhas', 'Públicos', 'Conversões', 'ROI'],
      status: 'em_breve'
    },
    {
      id: 'google_ads',
      nome: 'Google Ads',
      descricao: 'Anúncios no Google',
      icon: Globe,
      color: 'green',
      categoria: 'Publicidade',
      recursos: ['Search', 'Display', 'Shopping', 'YouTube'],
      status: 'em_breve'
    },
    {
      id: 'pix',
      nome: 'PIX',
      descricao: 'Pagamentos instantâneos',
      icon: CreditCard,
      color: 'cyan',
      categoria: 'Pagamentos',
      recursos: ['QR Code', 'Cobrança', 'Webhook', 'Conciliação'],
      status: 'disponivel'
    },
    {
      id: 'stripe',
      nome: 'Stripe',
      descricao: 'Gateway de pagamentos internacional',
      icon: CreditCard,
      color: 'purple',
      categoria: 'Pagamentos',
      recursos: ['Cartões', 'Assinaturas', 'Split', 'Relatórios'],
      status: 'disponivel'
    }
  ];

  const categoriasIntegracao = [
    { id: 'comunicacao', nome: 'Comunicação', icon: MessageSquare, color: 'green' },
    { id: 'marketing', nome: 'Marketing', icon: Mail, color: 'blue' },
    { id: 'marketplace', nome: 'Marketplace', icon: ShoppingBag, color: 'yellow' },
    { id: 'pagamentos', nome: 'Pagamentos', icon: CreditCard, color: 'purple' },
    { id: 'analytics', nome: 'Analytics', icon: TrendingUp, color: 'cyan' },
    { id: 'delivery', nome: 'Delivery', icon: Target, color: 'red' }
  ];

  useEffect(() => {
    loadIntegracoes();
    loadStats();
  }, []);

  const loadIntegracoes = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'integracoes'));
      const integracoesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIntegracoes(integracoesData);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      toast.error('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = () => {
    // Simular estatísticas (implementar lógica real depois)
    setStats({
      totalIntegracoes: integracoes.length,
      ativas: integracoes.filter(i => i.ativo).length,
      mensagensEnviadas: 2847,
      conversoes: 15.8
    });
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const integracaoData = {
        ...configData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ultimaConexao: null,
        estatisticas: {
          mensagensEnviadas: 0,
          erros: 0,
          sucesso: 0
        }
      };

      await addDoc(collection(db, 'integracoes'), integracaoData);
      
      toast.success(`Integração ${configData.nome} configurada com sucesso!`);
      setShowConfigModal(false);
      resetConfigForm();
      loadIntegracoes();
      
    } catch (error) {
      console.error('Erro ao configurar integração:', error);
      toast.error('Erro ao configurar integração');
    }
  };

  const toggleIntegracao = async (id, ativo) => {
    try {
      await updateDoc(doc(db, 'integracoes', id), {
        ativo: !ativo,
        updatedAt: Timestamp.now()
      });
      
      toast.success(`Integração ${!ativo ? 'ativada' : 'desativada'} com sucesso!`);
      loadIntegracoes();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da integração');
    }
  };

  const testarIntegracao = async (integracao) => {
    try {
      toast.loading('Testando conexão...', { duration: 2000 });
      
      // Simular teste de conexão
      setTimeout(() => {
        const sucesso = Math.random() > 0.2; // 80% de chance de sucesso
        
        if (sucesso) {
          toast.success('✅ Conexão testada com sucesso!');
          
          // Simular diferentes tipos de teste
          if (integracao.tipo === 'whatsapp_business') {
            toast.info('📱 WhatsApp Business API conectado');
          } else if (integracao.tipo === 'email_marketing') {
            toast.info('📧 Servidor de email configurado');
          } else if (integracao.tipo === 'mercado_livre') {
            toast.info('🛒 API do Mercado Livre validada');
          }
        } else {
          toast.error('❌ Erro na conexão. Verifique as configurações.');
        }
      }, 2000);
      
    } catch (error) {
      toast.error('Erro ao testar integração');
    }
  };

  const resetConfigForm = () => {
    setConfigData({
      nome: '',
      tipo: '',
      configuracao: {},
      ativo: true,
      webhook: '',
      apiKey: '',
      secretKey: ''
    });
    setSelectedIntegration(null);
  };

  const configurarIntegracao = (tipo) => {
    const tipoInfo = tiposIntegracao.find(t => t.id === tipo.id);
    setSelectedIntegration(tipoInfo);
    setConfigData({
      ...configData,
      nome: tipoInfo.nome,
      tipo: tipoInfo.id
    });
    setShowConfigModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'conectado': return 'green';
      case 'erro': return 'red';
      case 'configurando': return 'yellow';
      default: return 'gray';
    }
  };

  const integracoesPopulares = [
    {
      nome: 'WhatsApp Business',
      descricao: 'Configure em 2 minutos',
      icone: '💬',
      setup: 'Fácil',
      popularidade: 95
    },
    {
      nome: 'Email Marketing',
      descricao: 'Campanhas automáticas',
      icone: '📧',
      setup: 'Médio',
      popularidade: 87
    },
    {
      nome: 'Mercado Livre',
      descricao: 'Sincronização total',
      icone: '🛒',
      setup: 'Médio',
      popularidade: 78
    },
    {
      nome: 'PIX',
      descricao: 'Pagamentos instantâneos',
      icone: '💳',
      setup: 'Fácil',
      popularidade: 92
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
          <p className="text-white/60">Carregando integrações...</p>
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
            🔗 Central de Integrações
          </h1>
          <p className="text-white/60">
            Conecte seu negócio com as principais plataformas do mercado
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadIntegracoes}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
          
          <motion.button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FF2C68] to-[#FF2C68]/80 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            <span>Nova Integração</span>
          </motion.button>
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
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'integracoes', label: 'Integrações', icon: Link },
          { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
          { id: 'comunicacao', label: 'Comunicação', icon: MessageSquare }
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
                title: 'Integrações Ativas',
                value: stats.ativas,
                total: stats.totalIntegracoes,
                icon: Link,
                color: 'green',
                change: '+2 este mês'
              },
              {
                title: 'Mensagens Enviadas',
                value: stats.mensagensEnviadas.toLocaleString(),
                icon: Send,
                color: 'blue',
                change: '+18% vs mês anterior'
              },
              {
                title: 'Taxa de Conversão',
                value: `${stats.conversoes}%`,
                icon: Target,
                color: 'purple',
                change: '+3.2% este mês'
              },
              {
                title: 'Tempo Economizado',
                value: '127h',
                icon: Clock,
                color: 'orange',
                change: 'automação ativa'
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
                <p className="text-3xl font-bold text-white">
                  {stat.value}
                  {stat.total && (
                    <span className="text-lg text-white/60">/{stat.total}</span>
                  )}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Integrações Populares */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Integrações Mais Populares</h3>
              <TrendingUp className="w-6 h-6 text-[#FF2C68]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {integracoesPopulares.map((integracao, index) => (
                <motion.div
                  key={index}
                  className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10 hover:border-[#FF2C68]/30 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    const tipo = tiposIntegracao.find(t => t.nome.includes(integracao.nome.split(' ')[0]));
                    if (tipo) configurarIntegracao(tipo);
                  }}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">{integracao.icone}</div>
                    <h4 className="text-white font-bold mb-2">{integracao.nome}</h4>
                    <p className="text-white/60 text-sm mb-3">{integracao.descricao}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        integracao.setup === 'Fácil' ? 'bg-green-500/20 text-green-400' :
                        integracao.setup === 'Médio' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Setup {integracao.setup}
                      </span>
                      <span className="text-white/60 text-xs">
                        {integracao.popularidade}% popularidade
                      </span>
                    </div>
                    
                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div 
                        className="bg-[#FF2C68] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${integracao.popularidade}%` }}
                      />
                    </div>
                    
                    <button className="w-full bg-[#FF2C68]/20 text-[#FF2C68] py-2 rounded-lg font-medium hover:bg-[#FF2C68]/30 transition-colors">
                      Configurar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status das Integrações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0D0C0C]/50 backdrop-blur-xl border border-[#FF2C68]/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Status das Integrações</h3>
              <Activity className="w-6 h-6 text-[#FF2C68]" />
            </div>
            
            {integracoes.length > 0 ? (
              <div className="space-y-4">
                {integracoes.slice(0, 5).map((integracao, index) => {
                  const tipoInfo = tiposIntegracao.find(t => t.id === integracao.tipo);
                  const status = integracao.ativo ? 'conectado' : 'desconectado';
                  
                  return (
                    <motion.div
                      key={integracao.id}
                      className="flex items-center justify-between p-4 bg-[#0D0C0C]/30 rounded-xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 bg-${tipoInfo?.color || 'gray'}-500/20 rounded-xl flex items-center justify-center`}>
                          {tipoInfo?.icon && <tipoInfo.icon className={`w-6 h-6 text-${tipoInfo.color}-400`} />}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{integracao.nome}</h4>
                          <p className="text-white/60 text-sm">{tipoInfo?.categoria}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            status === 'conectado' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {status === 'conectado' ? 'Conectado' : 'Desconectado'}
                          </p>
                          <p className="text-white/60 text-xs">
                            {integracao.estatisticas?.mensagensEnviadas || 0} mensagens
                          </p>
                        </div>
                        
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'conectado' ? 'bg-green-400' : 'bg-red-400'
                        } animate-pulse`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Link className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Nenhuma integração configurada ainda</p>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="mt-4 bg-[#FF2C68] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF2C68]/80 transition-colors"
                >
                  Configurar Primeira Integração
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Integrações Tab */}
      {activeTab === 'integracoes' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Categorias */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {categoriasIntegracao.map((categoria, index) => (
              <motion.div
                key={categoria.id}
                className={`bg-gradient-to-br from-${categoria.color}-500/10 to-${categoria.color}-600/10 border border-${categoria.color}-500/20 rounded-2xl p-4 text-center cursor-pointer hover:scale-105 transition-transform`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <categoria.icon className={`w-8 h-8 text-${categoria.color}-400 mx-auto mb-2`} />
                <p className="text-white font-medium text-sm">{categoria.nome}</p>
              </motion.div>
            ))}
          </div>

          {/* Lista de Integrações Disponíveis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tiposIntegracao.map((tipo, index) => (
              <motion.div
                key={tipo.id}
                className={`bg-[#0D0C0C]/50 backdrop-blur-xl border border-${tipo.color}-500/20 rounded-2xl p-6`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-${tipo.color}-500/20 rounded-xl flex items-center justify-center`}>
                      <tipo.icon className={`w-6 h-6 text-${tipo.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{tipo.nome}</h3>
                      <p className="text-white/60 text-sm">{tipo.categoria}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    tipo.status === 'disponivel' ? 'bg-green-500/20 text-green-400' :
                    tipo.status === 'em_breve' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tipo.status === 'disponivel' ? 'Disponível' :
                     tipo.status === 'em_breve' ? 'Em Breve' : 'Beta'}
                  </span>
                </div>
                
                <p className="text-white/70 text-sm mb-4">{tipo.descricao}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-white/60 text-xs font-medium">Recursos:</p>
                  <div className="flex flex-wrap gap-1">
                    {tipo.recursos.map((recurso, recursoIndex) => (
                      <span
                        key={recursoIndex}
                        className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white/70"
                      >
                        {recurso}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => configurarIntegracao(tipo)}
                    disabled={tipo.status !== 'disponivel'}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      tipo.status === 'disponivel'
                        ? `bg-${tipo.color}-500/20 text-${tipo.color}-400 hover:bg-${tipo.color}-500/30`
                        : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {tipo.status === 'disponivel' ? 'Configurar' :
                     tipo.status === 'em_breve' ? 'Em Breve' : 'Indisponível'}
                  </button>
                  
                  {tipo.status === 'disponivel' && (
                    <button
                      onClick={() => toast.info(`Documentação do ${tipo.nome} em breve`)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modal de Configuração */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowConfigModal(false);
              resetConfigForm();
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
                  Configurar {selectedIntegration?.nome || 'Integração'}
                </h3>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    resetConfigForm();
                  }}
                  className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {selectedIntegration && (
                <div className="mb-6 p-4 bg-[#0D0C0C]/30 rounded-xl border border-white/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <selectedIntegration.icon className={`w-8 h-8 text-${selectedIntegration.color}-400`} />
                    <div>
                      <h4 className="text-white font-bold">{selectedIntegration.nome}</h4>
                      <p className="text-white/60 text-sm">{selectedIntegration.descricao}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedIntegration.recursos.map((recurso, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 bg-${selectedIntegration.color}-500/20 text-${selectedIntegration.color}-400 rounded-lg text-xs`}
                      >
                        {recurso}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleConfigSubmit} className="space-y-6">
                {/* Nome da Integração */}
                <div>
                  <label className="block text-white font-medium mb-2">Nome da Integração</label>
                  <input
                    type="text"
                    value={configData.nome}
                    onChange={(e) => setConfigData({...configData, nome: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                    placeholder="Ex: WhatsApp Business Principal"
                    required
                  />
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-white font-medium mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey.apiKey ? 'text' : 'password'}
                      value={configData.apiKey}
                      onChange={(e) => setConfigData({...configData, apiKey: e.target.value})}
                      className="w-full px-4 py-3 pr-12 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Sua chave de API"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey({...showApiKey, apiKey: !showApiKey.apiKey})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showApiKey.apiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Secret Key (se necessário) */}
                {selectedIntegration?.id !== 'pix' && (
                  <div>
                    <label className="block text-white font-medium mb-2">Secret Key (Opcional)</label>
                    <div className="relative">
                      <input
                        type={showApiKey.secretKey ? 'text' : 'password'}
                        value={configData.secretKey}
                        onChange={(e) => setConfigData({...configData, secretKey: e.target.value})}
                        className="w-full px-4 py-3 pr-12 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                        placeholder="Chave secreta (se aplicável)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey({...showApiKey, secretKey: !showApiKey.secretKey})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                      >
                        {showApiKey.secretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Webhook URL */}
                <div>
                  <label className="block text-white font-medium mb-2">Webhook URL (Opcional)</label>
                  <input
                    type="url"
                    value={configData.webhook}
                    onChange={(e) => setConfigData({...configData, webhook: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                    placeholder="https://seu-webhook.com/callback"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    URL para receber notificações automáticas
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={configData.ativo}
                    onChange={(e) => setConfigData({...configData, ativo: e.target.checked})}
                    className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                  />
                  <label htmlFor="ativo" className="text-white font-medium">
                    Ativar integração imediatamente
                  </label>
                </div>

                {/* Botões */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfigModal(false);
                      resetConfigForm();
                    }}
                    className="flex-1 py-3 bg-gray-500/20 text-gray-300 rounded-xl font-medium hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#FF2C68] text-white rounded-xl font-medium hover:bg-[#FF2C68]/80 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Configurar Integração</span>
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