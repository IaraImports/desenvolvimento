import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Users,
  Wrench,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Eye,
  BarChart3,
  User,
  Award,
  Target,
  Percent
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Comissoes() {
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);
  const [periodo, setPeriodo] = useState('mes_atual');
  const [tipoRelatorio, setTipoRelatorio] = useState('vendedores'); // 'vendedores' ou 'tecnicos'
  const [comissoes, setComissoes] = useState([]);

  const periodos = [
    { value: 'mes_atual', label: 'Mês Atual' },
    { value: 'mes_anterior', label: 'Mês Anterior' },
    { value: 'trimestre', label: 'Último Trimestre' },
    { value: 'semestre', label: 'Último Semestre' },
    { value: 'ano', label: 'Ano Atual' }
  ];

  useEffect(() => {
    loadData();
  }, [periodo, tipoRelatorio]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar vendas
      const vendasSnap = await getDocs(collection(db, 'vendas'));
      const vendasData = vendasSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      // Carregar ordens de serviço
      const osSnap = await getDocs(collection(db, 'ordens_servico'));
      const osData = osSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setVendas(vendasData);
      setOrdensServico(osData);
      
      calcularComissoes(vendasData, osData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const hoje = new Date();
    let inicio, fim;

    switch (periodo) {
      case 'mes_atual':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      case 'mes_anterior':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        break;
      case 'trimestre':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        fim = hoje;
        break;
      case 'semestre':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);
        fim = hoje;
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = hoje;
        break;
      default:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = hoje;
    }

    return { inicio, fim };
  };

  const calcularComissoes = (vendasData, osData) => {
    const { inicio, fim } = getDateRange();
    
    if (tipoRelatorio === 'vendedores') {
      calcularComissoesVendedores(vendasData, inicio, fim);
    } else {
      calcularComissoesTecnicos(osData, inicio, fim);
    }
  };

  const calcularComissoesVendedores = (vendasData, inicio, fim) => {
    const vendedores = {};
    
    vendasData
      .filter(venda => venda.createdAt >= inicio && venda.createdAt <= fim)
      .forEach(venda => {
        const vendedor = venda.vendedor || 'Vendedor não informado';
        const total = venda.total || 0;
        const comissaoPercentual = 5; // 5% de comissão padrão
        const comissaoValor = (total * comissaoPercentual) / 100;

        if (!vendedores[vendedor]) {
          vendedores[vendedor] = {
            nome: vendedor,
            totalVendas: 0,
            quantidadeVendas: 0,
            comissaoTotal: 0,
            vendas: []
          };
        }

        vendedores[vendedor].totalVendas += total;
        vendedores[vendedor].quantidadeVendas += 1;
        vendedores[vendedor].comissaoTotal += comissaoValor;
        vendedores[vendedor].vendas.push({
          id: venda.id,
          data: venda.createdAt,
          valor: total,
          comissao: comissaoValor,
          cliente: venda.cliente
        });
      });

    const comissoesArray = Object.values(vendedores).sort((a, b) => b.comissaoTotal - a.comissaoTotal);
    setComissoes(comissoesArray);
  };

  const calcularComissoesTecnicos = (osData, inicio, fim) => {
    const tecnicos = {};
    
    osData
      .filter(os => os.createdAt >= inicio && os.createdAt <= fim && os.servico?.status === 'entregue')
      .forEach(os => {
        const tecnico = os.servico?.tecnico || 'Técnico não informado';
        const valorTotal = os.servico?.valorTotal || 0;
        const valorMaoObra = parseFloat(os.servico?.valorMaoObra) || 0;
        const comissaoPercentual = 15; // 15% sobre mão de obra
        const comissaoValor = (valorMaoObra * comissaoPercentual) / 100;

        if (!tecnicos[tecnico]) {
          tecnicos[tecnico] = {
            nome: tecnico,
            totalServicos: 0,
            quantidadeServicos: 0,
            comissaoTotal: 0,
            servicos: []
          };
        }

        tecnicos[tecnico].totalServicos += valorTotal;
        tecnicos[tecnico].quantidadeServicos += 1;
        tecnicos[tecnico].comissaoTotal += comissaoValor;
        tecnicos[tecnico].servicos.push({
          id: os.id,
          numero: os.numero,
          data: os.createdAt,
          valorTotal: valorTotal,
          valorMaoObra: valorMaoObra,
          comissao: comissaoValor,
          cliente: os.cliente?.nome
        });
      });

    const comissoesArray = Object.values(tecnicos).sort((a, b) => b.comissaoTotal - a.comissaoTotal);
    setComissoes(comissoesArray);
  };

  const getTotalGeral = () => {
    return comissoes.reduce((total, item) => total + item.comissaoTotal, 0);
  };

  const getQuantidadeTotal = () => {
    return comissoes.reduce((total, item) => total + (item.quantidadeVendas || item.quantidadeServicos), 0);
  };

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
          <h1 className="text-4xl font-bold text-white mb-4">Relatório de Comissões</h1>
          <p className="text-white/60 text-lg">
            Acompanhe as comissões de vendedores e técnicos
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Tipo de Relatório</label>
            <div className="flex bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-1">
              <button
                onClick={() => setTipoRelatorio('vendedores')}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  tipoRelatorio === 'vendedores' 
                    ? 'bg-[#FF2C68] text-white' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Vendedores</span>
              </button>
              <button
                onClick={() => setTipoRelatorio('tecnicos')}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  tipoRelatorio === 'tecnicos' 
                    ? 'bg-[#FF2C68] text-white' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Técnicos</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
            >
              {periodos.map(p => (
                <option key={p.value} value={p.value} className="bg-[#0D0C0C]">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Estatísticas Gerais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Comissões</p>
              <p className="text-2xl font-bold text-white">
                R$ {getTotalGeral().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">
                {tipoRelatorio === 'vendedores' ? 'Vendedores' : 'Técnicos'}
              </p>
              <p className="text-2xl font-bold text-white">{comissoes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">
                {tipoRelatorio === 'vendedores' ? 'Total Vendas' : 'Total Serviços'}
              </p>
              <p className="text-2xl font-bold text-white">{getQuantidadeTotal()}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Média por Pessoa</p>
              <p className="text-2xl font-bold text-white">
                R$ {comissoes.length > 0 ? (getTotalGeral() / comissoes.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lista de Comissões */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden"
      >
        <div className="p-6 border-b border-[#FF2C68]/30">
          <h2 className="text-2xl font-bold text-white">
            Ranking de {tipoRelatorio === 'vendedores' ? 'Vendedores' : 'Técnicos'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FF2C68]/10 border-b border-[#FF2C68]/30">
              <tr>
                <th className="text-left p-4 text-white font-medium">Posição</th>
                <th className="text-left p-4 text-white font-medium">Nome</th>
                <th className="text-left p-4 text-white font-medium">
                  {tipoRelatorio === 'vendedores' ? 'Vendas' : 'Serviços'}
                </th>
                <th className="text-left p-4 text-white font-medium">
                  {tipoRelatorio === 'vendedores' ? 'Total Vendido' : 'Total Serviços'}
                </th>
                <th className="text-left p-4 text-white font-medium">Comissão</th>
                <th className="text-left p-4 text-white font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((item, index) => (
                <tr key={item.nome} className="border-b border-[#FF2C68]/10 hover:bg-[#FF2C68]/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-[#FF2C68]/20 text-[#FF2C68]'
                      }`}>
                        {index + 1}
                      </div>
                      {index < 3 && <Award className="w-4 h-4 text-yellow-400" />}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#FF2C68] rounded-lg flex items-center justify-center">
                        {tipoRelatorio === 'vendedores' ? 
                          <ShoppingBag className="w-5 h-5 text-white" /> :
                          <Wrench className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.nome}</p>
                        <p className="text-white/60 text-sm">
                          {tipoRelatorio === 'vendedores' ? 'Vendedor' : 'Técnico'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-white">
                      {item.quantidadeVendas || item.quantidadeServicos}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-white font-medium">
                      R$ {(item.totalVendas || item.totalServicos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-green-400 font-bold text-lg">
                      R$ {item.comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="p-4">
                    <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Detalhes</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comissoes.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Nenhuma comissão encontrada para o período selecionado</p>
          </div>
        )}
      </motion.div>
    </div>
  );
} 