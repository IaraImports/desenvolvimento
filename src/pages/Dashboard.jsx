import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  RefreshCcw
} from 'lucide-react';
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
  const { user, userProfile } = useAuth();
  const { 
    canView,
    isAdmin,
    isVendedor,
    isTecnico
  } = usePermissions();

  const { vendas, produtos, servicos, clientes, loading, loadAllData } = useApp();

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleRefreshData = async () => {
    try {
      await loadAllData();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header do Dashboard */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
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
            <motion.div 
              className={`w-3 h-3 rounded-full animate-pulse ${loading ? 'bg-yellow-400' : 'bg-green-400'}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className={`text-sm font-medium ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
              {loading ? 'Carregando...' : 'Sistema Online'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Loading Indicator */}
      {loading && (
        <motion.div 
          variants={itemVariants}
          className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-center space-x-3">
            <motion.div
              className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-blue-400">Carregando dados do sistema...</span>
          </div>
        </motion.div>
      )}

      {/* Cards de Estatísticas Principais */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            className={`bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border ${stat.borderColor} p-6 hover:scale-105 transition-all duration-300 group`}
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
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
          </motion.div>
        ))}
      </motion.div>

      {/* Alertas de Estoque Baixo */}
      {produtosEstoqueBaixo.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6"
        >
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
        </motion.div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Vendas */}
        <motion.div 
          variants={itemVariants}
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6"
        >
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
        </motion.div>

        {/* Produtos por Categoria */}
        <motion.div 
          variants={itemVariants}
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6"
        >
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
                {dadosCategorias.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        </motion.div>
      </div>

      {/* Vendas Recentes */}
      <motion.div 
        variants={itemVariants}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6"
      >
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
          {vendasRecentes.length > 0 ? vendasRecentes.map((venda, index) => {
            const dataVenda = parseDate(venda.data || venda.createdAt || venda.timestamp);
            const valorVenda = parseFloat(venda.total) || parseFloat(venda.valor) || parseFloat(venda.valorTotal) || 0;
            
            return (
              <motion.div
                key={venda.id}
                className="flex items-center justify-between p-4 bg-[#0D0C0C]/30 rounded-xl hover:bg-[#0D0C0C]/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
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
              </motion.div>
            );
          }) : (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">Nenhuma venda registrada ainda</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Acesso Rápido */}
      <motion.div 
        variants={itemVariants}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Nova Venda', icon: ShoppingCart, path: '/vendas/pdv', color: 'green' },
            { name: 'Cadastrar Produto', icon: Package, path: '/produtos', color: 'blue' },
            { name: 'Novo Cliente', icon: Users, path: '/clientes', color: 'purple' },
            { name: 'Criar OS', icon: Wrench, path: '/vendas/os', color: 'orange' }
          ].map((item, index) => (
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
      </motion.div>

      {/* Debug de Permissões - Só para Admin */}
      {isAdmin && (
        <motion.div 
          variants={itemVariants}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6"
        >
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
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard; 