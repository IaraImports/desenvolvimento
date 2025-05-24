import React from 'react';
import { useApp } from '../contexts/AppContext';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
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
      name: 'Faturamento Total',
      value: `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total de Vendas',
      value: totalVendas,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Produtos Cadastrados',
      value: totalProdutos,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Clientes Ativos',
      value: totalClientes,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${stat.bgColor} rounded-md p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {produtosEstoqueBaixo.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Atenção: Produtos com estoque baixo
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {produtosEstoqueBaixo.length} produto(s) com estoque abaixo de 10 unidades:
                </p>
                <ul className="list-disc pl-5 mt-1">
                  {produtosEstoqueBaixo.map(produto => (
                    <li key={produto.id}>
                      {produto.nome} - {produto.estoque} unidades
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de Vendas */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Vendas dos Últimos 7 Dias
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="vendas"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Faturamento */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Faturamento dos Últimos 7 Dias
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
              />
              <Bar dataKey="faturamento" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Categorias */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Produtos por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosCategorias}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosCategorias.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo Rápido */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Resumo Rápido
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Serviços Cadastrados</span>
              <span className="text-sm font-medium text-gray-900">{totalServicos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ticket Médio</span>
              <span className="text-sm font-medium text-gray-900">
                R$ {totalVendas > 0 ? (faturamentoTotal / totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Produtos Ativos</span>
              <span className="text-sm font-medium text-gray-900">
                {produtos.filter(p => p.status === 'ativo').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Serviços Ativos</span>
              <span className="text-sm font-medium text-gray-900">
                {servicos.filter(s => s.status === 'ativo').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Vendas Recentes
        </h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendas.slice(0, 5).map((venda) => (
                <tr key={venda.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {venda.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(venda.data), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {venda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {venda.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 