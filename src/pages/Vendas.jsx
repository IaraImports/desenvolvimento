import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  Clipboard,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Vendas() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vendasHoje: 0,
    receitaHoje: 0,
    orcamentosAbertos: 0,
    osAndamento: 0
  });
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Data de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Carregar vendas do dia
      const vendasQuery = query(
        collection(db, 'vendas'),
        where('createdAt', '>=', today),
        where('createdAt', '<', tomorrow),
        where('status', '==', 'concluida')
      );
      const vendasSnap = await getDocs(vendasQuery);
      const vendas = vendasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const vendasHoje = vendas.length;
      const receitaHoje = vendas.reduce((acc, venda) => acc + (venda.total || 0), 0);

      // Carregar orçamentos em aberto
      const orcamentosQuery = query(
        collection(db, 'orcamentos'),
        where('status', '==', 'aberto')
      );
      const orcamentosSnap = await getDocs(orcamentosQuery);
      const orcamentosAbertos = orcamentosSnap.size;

      // Carregar OS em andamento
      const osQuery = query(
        collection(db, 'ordens_servico'),
        where('status', 'in', ['aberta', 'em_andamento', 'aguardando_peca'])
      );
      const osSnap = await getDocs(osQuery);
      const osAndamento = osSnap.size;

      // Carregar atividades recentes
      const atividadesQuery = query(
        collection(db, 'vendas'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const atividadesSnap = await getDocs(atividadesQuery);
      const atividadesData = atividadesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'venda'
      }));

      setStats({
        vendasHoje,
        receitaHoje,
        orcamentosAbertos,
        osAndamento
      });
      
      setAtividades(atividadesData);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    // Se for Timestamp do Firestore
    if (date.toDate) {
      return date.toDate().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Se for Date normal
    if (date instanceof Date) {
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return '';
  };

  const salesOptions = [
    {
      title: 'PDV - Ponto de Venda',
      description: 'Registre vendas diretas de produtos e serviços',
      icon: CreditCard,
      color: 'green',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500',
      path: '/vendas/pdv',
      features: ['Venda rápida', 'Pagamento à vista/parcelado', 'Controle de estoque', 'Emissão de cupons']
    },
    {
      title: 'Orçamentos',
      description: 'Crie propostas comerciais para clientes',
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
      path: '/vendas/orcamento',
      features: ['Propostas detalhadas', 'Validade definida', 'Conversão em venda', 'Envio por e-mail']
    },
    {
      title: 'Ordem de Serviço',
      description: 'Gerencie serviços técnicos e reparos',
      icon: Clipboard,
      color: 'orange',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-500',
      path: '/vendas/os',
      features: ['Diagnóstico técnico', 'Controle de status', 'Histórico de serviços', 'Garantia de serviços']
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF2C68]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">Sistema de Vendas</h1>
        <p className="text-white/60 text-lg">
          Gerencie vendas, orçamentos e ordens de serviço de forma integrada
        </p>
      </motion.div>

      {/* Dashboard de Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Vendas Hoje</p>
              <p className="text-2xl font-bold text-white">{stats.vendasHoje}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#FF2C68]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Receita Hoje</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.receitaHoje)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Orçamentos Abertos</p>
              <p className="text-2xl font-bold text-white">{stats.orcamentosAbertos}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Clipboard className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">OS em Andamento</p>
              <p className="text-2xl font-bold text-white">{stats.osAndamento}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Opções de Venda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {salesOptions.map((option, index) => (
          <motion.div
            key={option.title}
            className={`bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border ${option.borderColor}/30 p-8 group cursor-pointer hover:border-${option.color}-500/50 transition-all duration-300`}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(option.path)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            {/* Header do Card */}
            <div className="flex items-center space-x-4 mb-6">
              <div className={`w-16 h-16 ${option.bgColor}/20 rounded-2xl flex items-center justify-center group-hover:${option.bgColor}/30 transition-colors`}>
                <option.icon className={`w-8 h-8 text-${option.color}-400`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{option.title}</h3>
                <p className="text-white/60 text-sm">{option.description}</p>
              </div>
              <ArrowRight className={`w-6 h-6 text-${option.color}-400 transform group-hover:translate-x-1 transition-transform`} />
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Recursos principais:</h4>
              <div className="grid grid-cols-1 gap-2">
                {option.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 text-${option.color}-400`} />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <motion.button
                className={`w-full ${option.bgColor} hover:${option.bgColor}/80 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Acessar {option.title.split(' - ')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Atividades Recentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Vendas Recentes</h2>
          <BarChart3 className="w-6 h-6 text-[#FF2C68]" />
        </div>

        <div className="space-y-4">
          {atividades.length > 0 ? (
            atividades.map((atividade, index) => (
              <motion.div
                key={atividade.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Venda #{atividade.id.substring(0, 8)}
                    </p>
                    <p className="text-white/60 text-sm">
                      Cliente: {atividade.cliente || 'Não informado'}
                    </p>
                    <p className="text-white/40 text-xs">
                      {atividade.itens?.length || 0} itens • {atividade.formaPagamento || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">
                    {formatCurrency(atividade.total)}
                  </p>
                  <p className="text-white/60 text-sm">
                    {formatDate(atividade.createdAt)}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    atividade.status === 'concluida' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {atividade.status === 'concluida' ? 'Concluída' : 'Pendente'}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma venda encontrada</p>
              <p className="text-white/40 text-sm mt-2">
                As vendas realizadas no PDV aparecerão aqui automaticamente
              </p>
              <button 
                onClick={() => navigate('/vendas/pdv')}
                className="mt-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Realizar Primeira Venda
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/relatorios')}
            className="text-[#FF2C68] hover:text-[#FF2C68]/80 font-medium transition-colors"
          >
            Ver relatório completo de vendas →
          </button>
        </div>
      </motion.div>

      {/* Histórico Completo de Vendas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Histórico de Vendas</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDashboardData}
              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <HistoricoVendas />
      </motion.div>
    </div>
  );
}

// Componente para mostrar histórico completo de vendas
function HistoricoVendas() {
  const [vendas, setVendas] = useState([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [periodo, setPeriodo] = useState('7'); // Últimos 7 dias

  useEffect(() => {
    loadVendasHistorico();
  }, [periodo]);

      const loadVendasHistorico = async () => {
      try {
        setLoadingVendas(true);
        
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
        
        // Primeiro tentar carregar sem filtro de data para ver se há vendas
        let vendasQuery = query(
          collection(db, 'vendas'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        
        let vendasSnap = await getDocs(vendasQuery);
        let vendasData = vendasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('📊 Total de vendas no banco:', vendasData.length);
        
        // Se existem vendas, filtrar por período
        if (vendasData.length > 0) {
          vendasData = vendasData.filter(venda => {
            const vendaDate = venda.createdAt?.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
            return vendaDate >= dataLimite;
          });
          console.log('📊 Vendas no período selecionado:', vendasData.length);
        }
        
        setVendas(vendasData);
        
      } catch (error) {
        console.error('Erro ao carregar histórico de vendas:', error);
        
        // Fallback: tentar carregar sem orderBy se der erro
        try {
          const vendasSnap = await getDocs(collection(db, 'vendas'));
          const vendasData = vendasSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('📊 Vendas carregadas (fallback):', vendasData.length);
          setVendas(vendasData.slice(0, 20));
        } catch (fallbackError) {
          console.error('Erro no fallback:', fallbackError);
          toast.error('Erro ao carregar histórico de vendas');
        }
      } finally {
        setLoadingVendas(false);
      }
    };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <label className="text-white font-medium">Período:</label>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="bg-[#0D0C0C]/50 border border-blue-500/30 text-white rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Último mês</option>
          <option value="90">Últimos 3 meses</option>
        </select>
      </div>

      {/* Lista de Vendas */}
      {loadingVendas ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : vendas.length > 0 ? (
        <div className="space-y-3">
          {vendas.map((venda, index) => (
            <motion.div
              key={venda.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 font-mono text-sm">
                      #{venda.id.substring(0, 8)}
                    </span>
                    <span className="text-white font-medium">
                      {venda.cliente || 'Cliente não informado'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      venda.status === 'concluida' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {venda.status}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-white/60">
                    <span>{venda.itens?.length || 0} itens</span>
                    {venda.formaPagamento && (
                      <span className="ml-3">• {venda.formaPagamento.replace('_', ' ')}</span>
                    )}
                    {venda.vendedor && (
                      <span className="ml-3">• Vendedor: {venda.vendedor}</span>
                    )}
                  </div>
                  
                  {/* Itens da venda */}
                  {venda.itens && venda.itens.length > 0 && (
                    <div className="mt-2 text-xs text-white/50">
                      {venda.itens.slice(0, 2).map((item, i) => (
                        <span key={i}>
                          {item.nome} (x{item.quantidade}){i < venda.itens.length - 1 && i < 1 ? ', ' : ''}
                        </span>
                      ))}
                      {venda.itens.length > 2 && (
                        <span> e mais {venda.itens.length - 2} itens</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">
                    {formatCurrency(venda.total)}
                  </div>
                  <div className="text-white/60 text-sm">
                    {formatDate(venda.createdAt)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">Nenhuma venda encontrada no período</p>
          <p className="text-white/40 text-sm mt-2">
            Realize vendas no PDV para ver o histórico aqui
          </p>
        </div>
      )}
    </div>
  );
} 