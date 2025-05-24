import React, { useContext, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Calendar, 
  Clock,
  RefreshCw,
  ShoppingCart,
  Wrench,
  FileText,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  BadgeCheck,
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  PieChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useApp } from '../contexts/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const { 
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    userLevel,
    isAdmin,
    isVendedor,
    isTecnico,
    isMarketing,
    isPosVenda
  } = usePermissions();

  const { vendas, produtos, servicos, clientes } = useApp();

  // Calcular estatísticas
  const totalVendas = vendas.length;
  const faturamentoTotal = vendas.reduce((acc, venda) => acc + venda.total, 0);
  const totalProdutos = produtos.length;
  const totalServicos = servicos.length;
  const totalClientes = clientes.length;
  
  // Produtos com estoque baixo
  const produtosEstoqueBaixo = produtos.filter(produto => produto.estoque < 10);

  // Preparar dados para gráficos
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const vendasPorDia = last7Days.map(day => {
    const dayString = format(day, 'yyyy-MM-dd');
    const vendasDoDia = vendas.filter(venda => 
      format(new Date(venda.data), 'yyyy-MM-dd') === dayString
    );
    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      vendas: vendasDoDia.length,
      faturamento: vendasDoDia.reduce((acc, venda) => acc + venda.total, 0)
    };
  });

  const categoriasProdutos = produtos.reduce((acc, produto) => {
    acc[produto.categoria] = (acc[produto.categoria] || 0) + 1;
    return acc;
  }, {});

  const dadosCategorias = Object.entries(categoriasProdutos).map(([categoria, quantidade]) => ({
    name: categoria,
    value: quantidade
  }));

  const stats = [
    {
      name: 'Faturamento',
      value: `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      shortValue: `R$ ${(faturamentoTotal / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      change: '+12%',
      trend: 'up'
    },
    {
      name: 'Vendas',
      value: totalVendas,
      shortValue: totalVendas,
      icon: ShoppingCart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      change: '+8%',
      trend: 'up'
    },
    {
      name: 'Produtos',
      value: totalProdutos,
      shortValue: totalProdutos,
      icon: Package,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      change: '+5%',
      trend: 'up'
    },
    {
      name: 'Clientes',
      value: totalClientes,
      shortValue: totalClientes,
      icon: Users,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      change: '+15%',
      trend: 'up'
    }
  ];

  // Debug de Permissões - Mostrar apenas para administradores
  const renderPermissionsDebug = () => {
    if (!isAdmin) return null;

    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 md:p-6 mb-6">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center space-x-2">
          <BadgeCheck className="w-5 h-5" />
          <span>Debug de Permissões</span>
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-white/60">Usuário:</span>
              <p className="text-white font-medium text-xs md:text-sm truncate">{userProfile?.email}</p>
            </div>
            <div>
              <span className="text-white/60">Nível:</span>
              <p className="text-white font-medium">{userProfile?.level}</p>
            </div>
            <div>
              <span className="text-white/60">Permissões:</span>
              <p className="text-white font-medium">{userProfile?.permissions?.length || 0}</p>
            </div>
            <div>
              <span className="text-white/60">Status:</span>
              <p className="text-white font-medium">
                {userProfile?.isActive ? '✅ Ativo' : '❌ Inativo'}
              </p>
            </div>
          </div>
          
          <div className="border-t border-yellow-500/30 pt-3">
            <p className="text-white/60 text-sm mb-2">Verificações de Permissão:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className={`px-2 py-1 rounded ${canView('clients') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                Clientes: {canView('clients') ? '✅' : '❌'}
              </div>
              <div className={`px-2 py-1 rounded ${canCreate('clients') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                Criar Clientes: {canCreate('clients') ? '✅' : '❌'}
              </div>
              <div className={`px-2 py-1 rounded ${canView('products') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                Produtos: {canView('products') ? '✅' : '❌'}
              </div>
              <div className={`px-2 py-1 rounded ${canView('services') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                Serviços: {canView('services') ? '✅' : '❌'}
              </div>
              <div className={`px-2 py-1 rounded ${canView('sales') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                Vendas: {canView('sales') ? '✅' : '❌'}
              </div>
              <div className={`px-2 py-1 rounded ${isTecnico ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                É Técnico: {isTecnico ? '✅' : '❌'}
              </div>
            </div>
          </div>
          
          {userProfile?.isFallback && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <p className="text-orange-400 text-sm">
                ⚠️ Este usuário está usando um perfil de fallback. Verifique as configurações no sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header responsivo */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60 mt-2 text-sm md:text-base">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Cards de estatísticas responsivos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 md:p-6 hover:border-[#FF2C68]/50 transition-all duration-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className={`w-10 md:w-12 h-10 md:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 md:w-6 h-5 md:h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center space-x-1 text-xs ${
                stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span className="hidden md:inline">{stat.change}</span>
              </div>
            </div>
            <div>
              <h3 className="text-white/60 text-xs md:text-sm font-medium mb-1">
                {stat.name}
              </h3>
              <p className="text-white font-bold text-lg md:text-2xl">
                <span className="md:hidden">{stat.shortValue}</span>
                <span className="hidden md:inline">{stat.value}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alertas responsivos */}
      {produtosEstoqueBaixo.length > 0 && (
        <motion.div 
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-bold text-yellow-400 mb-2">
                ⚠️ Estoque Baixo
              </h3>
              <p className="text-yellow-300 text-sm mb-3">
                {produtosEstoqueBaixo.length} produto(s) com estoque abaixo de 10 unidades
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {produtosEstoqueBaixo.slice(0, 5).map(produto => (
                  <div key={produto.id} className="text-xs text-yellow-200 bg-yellow-500/10 rounded-lg p-2">
                    <span className="font-medium">{produto.nome}</span> - 
                    <span className="text-yellow-400 ml-1">{produto.estoque} unidades</span>
                  </div>
                ))}
                {produtosEstoqueBaixo.length > 5 && (
                  <p className="text-xs text-yellow-300">
                    +{produtosEstoqueBaixo.length - 5} produtos...
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gráficos responsivos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Gráfico de Vendas */}
        <motion.div 
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-4 md:mb-6">
            <BarChart className="w-5 h-5 text-[#FF2C68]" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              Vendas - 7 Dias
            </h3>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FF2C68/20" />
                <XAxis 
                  dataKey="data" 
                  stroke="#ffffff60"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#ffffff60"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0D0C0C',
                    border: '1px solid #FF2C68',
                    borderRadius: '12px',
                    color: '#ffffff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="#FF2C68"
                  strokeWidth={3}
                  dot={{ fill: '#FF2C68', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#FF2C68', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Faturamento */}
        <motion.div 
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="flex items-center space-x-2 mb-4 md:mb-6">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              Faturamento - 7 Dias
            </h3>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FF2C68/20" />
                <XAxis 
                  dataKey="data" 
                  stroke="#ffffff60"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#ffffff60"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                  contentStyle={{
                    backgroundColor: '#0D0C0C',
                    border: '1px solid #10b981',
                    borderRadius: '12px',
                    color: '#ffffff'
                  }}
                />
                <Bar dataKey="faturamento" fill="#10b981" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Categorias */}
        <motion.div 
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-4 md:mb-6">
            <PieChart className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              Produtos por Categoria
            </h3>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={dadosCategorias}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={window.innerWidth < 768 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={12}
                >
                  {dadosCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0D0C0C',
                    border: '1px solid #FF2C68',
                    borderRadius: '12px',
                    color: '#ffffff'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Resumo Rápido */}
        <motion.div 
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="flex items-center space-x-2 mb-4 md:mb-6">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              Resumo Rápido
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#0D0C0C]/50 rounded-xl">
              <span className="text-white/60 text-sm">Serviços Cadastrados</span>
              <span className="text-white font-bold">{totalServicos}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0D0C0C]/50 rounded-xl">
              <span className="text-white/60 text-sm">Ticket Médio</span>
              <span className="text-green-400 font-bold">
                R$ {totalVendas > 0 ? (faturamentoTotal / totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0D0C0C]/50 rounded-xl">
              <span className="text-white/60 text-sm">Produtos Ativos</span>
              <span className="text-blue-400 font-bold">
                {produtos.filter(p => p.status === 'ativo').length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0D0C0C]/50 rounded-xl">
              <span className="text-white/60 text-sm">Serviços Ativos</span>
              <span className="text-purple-400 font-bold">
                {servicos.filter(s => s.status === 'ativo').length}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Atividade Recente - Responsiva */}
      <motion.div 
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <div className="p-4 md:p-6 border-b border-[#FF2C68]/30">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#FF2C68]" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              Vendas Recentes
            </h3>
          </div>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden p-4 space-y-3">
          {vendas.slice(0, 5).map((venda, index) => (
            <motion.div
              key={venda.id || index}
              className="bg-[#0D0C0C]/50 rounded-xl p-4 border border-[#FF2C68]/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium text-sm">{venda.cliente}</h4>
                <span className="text-green-400 font-bold text-sm">
                  R$ {venda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-xs">
                  {format(new Date(venda.data), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                  {venda.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop: Tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FF2C68]/10">
              <tr>
                <th className="px-6 py-4 text-left text-white font-medium">Cliente</th>
                <th className="px-6 py-4 text-left text-white font-medium">Data</th>
                <th className="px-6 py-4 text-left text-white font-medium">Total</th>
                <th className="px-6 py-4 text-left text-white font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF2C68]/10">
              {vendas.slice(0, 5).map((venda, index) => (
                <motion.tr 
                  key={venda.id || index}
                  className="hover:bg-[#FF2C68]/5 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <td className="px-6 py-4 text-white font-medium">
                    {venda.cliente}
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {format(new Date(venda.data), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 text-green-400 font-bold">
                    R$ {venda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                      {venda.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {vendas.length === 0 && (
          <div className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">Nenhuma venda encontrada</p>
          </div>
        )}
      </motion.div>

      {/* Debug de Permissões */}
      {renderPermissionsDebug()}
    </div>
  );
};

export default Dashboard; 