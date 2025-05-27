import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Receipt,
  Calendar,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Financeiro() {
  const [financialData, setFinancialData] = useState({
    receita: 0,
    despesas: 0,
    lucro: 0,
    crescimento: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Estados do formulário de nova transação
  const [formData, setFormData] = useState({
    type: 'receita',
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categoriesReceita = ['Vendas', 'Serviços', 'E-commerce', 'Comissões', 'Outros'];
  const categoriesDespesa = ['Fornecedores', 'Marketing', 'Salários', 'Aluguel', 'Utilidades', 'Outros'];

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Período atual (mês atual)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Carregar vendas (receitas automáticas) - consulta simples sem índice composto
      const vendasSnap = await getDocs(collection(db, 'vendas'));
      const todasVendas = vendasSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrar e ordenar vendas no cliente
      const vendas = todasVendas
        .filter(venda => {
          if (venda.status !== 'concluida') return false;
          
          try {
            const vendaDate = venda.createdAt?.toDate?.() || new Date(venda.createdAt || 0);
            return vendaDate >= startOfMonth && vendaDate <= endOfMonth;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate - aDate;
        })
        .slice(0, 100) // Limitar resultados
        .map(venda => ({
          id: venda.id,
          type: 'receita',
          description: `Venda #${venda.id.substring(0, 8)} - ${venda.cliente || 'Cliente não informado'}`,
          amount: venda.total || 0,
          date: venda.createdAt,
          category: 'Vendas',
          source: 'venda',
          ...venda
        }));

      // Carregar transações manuais - consulta simples
      const transacoesSnap = await getDocs(collection(db, 'transacoes_financeiras'));
      const todasTransacoes = transacoesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrar e ordenar transações no cliente
      const transacoes = todasTransacoes
        .filter(transacao => {
          try {
            const transacaoDate = transacao.date?.toDate?.() || new Date(transacao.date || 0);
            return transacaoDate >= startOfMonth && transacaoDate <= endOfMonth;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const aDate = a.date?.toDate?.() || new Date(0);
          const bDate = b.date?.toDate?.() || new Date(0);
          return bDate - aDate;
        })
        .slice(0, 100) // Limitar resultados
        .map(transacao => ({
          id: transacao.id,
          source: 'manual',
          ...transacao
        }));

      // Combinar todas as transações
      const allTransactions = [...vendas, ...transacoes];
      
      // Calcular totais
      const receita = allTransactions
        .filter(t => t.type === 'receita')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

      const despesas = allTransactions
        .filter(t => t.type === 'despesa')
        .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

      const lucro = receita - despesas;
      
      // Calcular crescimento (comparar com mês anterior) - usar filtro no cliente
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      
      const vendasMesAnterior = todasVendas
        .filter(venda => {
          if (venda.status !== 'concluida') return false;
          
          try {
            const vendaDate = venda.createdAt?.toDate?.() || new Date(venda.createdAt || 0);
            return vendaDate >= prevMonth && vendaDate <= endPrevMonth;
          } catch {
            return false;
          }
        });
      
      const prevReceita = vendasMesAnterior.reduce((acc, venda) => acc + (venda.total || 0), 0);
      const crescimento = prevReceita > 0 ? ((receita - prevReceita) / prevReceita) * 100 : 0;

      setFinancialData({
        receita,
        despesas,
        lucro,
        crescimento: Math.round(crescimento * 10) / 10
      });

      setTransactions(allTransactions);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
      
      // Em caso de erro, definir dados padrão
      setFinancialData({
        receita: 0,
        despesas: 0,
        lucro: 0,
        crescimento: 0
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const transactionData = {
        type: formData.type,
        description: formData.description,
        amount: formData.type === 'despesa' ? -Math.abs(parseFloat(formData.amount)) : parseFloat(formData.amount),
        category: formData.category,
        date: Timestamp.fromDate(new Date(formData.date)),
        createdAt: Timestamp.now(),
        source: 'manual'
      };

      await addDoc(collection(db, 'transacoes_financeiras'), transactionData);
      
      toast.success(`${formData.type === 'receita' ? 'Receita' : 'Despesa'} adicionada com sucesso!`);
      
      setShowAddModal(false);
      setFormData({
        type: 'receita',
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Recarregar dados
      loadFinancialData();
      
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    // Se for Timestamp do Firestore
    if (date.toDate) {
      return date.toDate().toLocaleDateString('pt-BR');
    }
    
    // Se for Date normal
    if (date instanceof Date) {
      return date.toLocaleDateString('pt-BR');
    }
    
    return '';
  };

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

  const filteredTransactions = transactions.filter(transaction => 
    filterType === 'all' || transaction.type === filterType
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF2C68]"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Financeiro</h1>
          <p className="text-dark-400">Controle total das suas finanças</p>
        </div>
        
        <motion.button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary-500/25 flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>Nova Transação</span>
        </motion.button>
      </motion.div>

      {/* Cards de Resumo */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Receita */}
        <motion.div 
          className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 luxury-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-green-400 text-sm font-medium mb-1">Receita Total</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatCurrency(financialData.receita)}
          </p>
          <p className={`text-sm ${financialData.crescimento >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {financialData.crescimento >= 0 ? '+' : ''}{financialData.crescimento}% este mês
          </p>
        </motion.div>

        {/* Despesas */}
        <motion.div 
          className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 luxury-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-red-400 text-sm font-medium mb-1">Despesas Totais</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatCurrency(financialData.despesas)}
          </p>
          <p className="text-red-400 text-sm">
            Fixas + Variáveis
          </p>
        </motion.div>

        {/* Lucro */}
        <motion.div 
          className="bg-gradient-to-br from-primary-500/10 to-primary-600/10 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 luxury-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-400" />
            </div>
            <PiggyBank className="w-5 h-5 text-primary-400" />
          </div>
          <p className="text-primary-400 text-sm font-medium mb-1">Lucro Líquido</p>
          <p className={`text-3xl font-bold mb-1 ${financialData.lucro >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(financialData.lucro)}
          </p>
          <p className="text-primary-400 text-sm">
            Margem: {financialData.receita > 0 ? Math.round((financialData.lucro / financialData.receita) * 100) : 0}%
          </p>
        </motion.div>

        {/* Fluxo de Caixa */}
        <motion.div 
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 luxury-card"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-blue-400 text-sm font-medium mb-1">Fluxo Mensal</p>
          <p className={`text-3xl font-bold mb-1 ${financialData.lucro >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(financialData.lucro)}
          </p>
          <p className="text-blue-400 text-sm">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </motion.div>
      </motion.div>

      {/* Filtros e Transações */}
      <motion.div variants={itemVariants} className="space-y-6">
        {/* Filtros */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Transações Recentes</h2>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-dark-800/50 rounded-xl p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterType === 'all' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterType('receita')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterType === 'receita' 
                    ? 'bg-green-500 text-white' 
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => setFilterType('despesa')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterType === 'despesa' 
                    ? 'bg-red-500 text-white' 
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Despesas
              </button>
            </div>
            
            <button className="flex items-center space-x-2 bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700 rounded-xl px-4 py-2 text-dark-300 hover:text-white transition-all duration-200">
              <Filter className="w-4 h-4" />
              <span>Filtrar</span>
            </button>
          </div>
        </div>

        {/* Lista de Transações */}
        <motion.div 
          className="bg-dark-800/30 backdrop-blur-xl border border-dark-700 rounded-2xl overflow-hidden"
          variants={itemVariants}
        >
          <div className="p-6">
            <div className="space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-xl hover:bg-dark-700/50 transition-all duration-200 group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'receita' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'receita' ? (
                          <TrendingUp className="w-6 h-6" />
                        ) : (
                          <TrendingDown className="w-6 h-6" />
                        )}
                      </div>
                      
                      <div>
                        <p className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                          {transaction.description}
                        </p>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-dark-400">{transaction.category}</span>
                          <span className="text-sm text-dark-500">•</span>
                          <span className="text-sm text-dark-400">
                            {formatDate(transaction.date)}
                          </span>
                          {transaction.source === 'venda' && (
                            <>
                              <span className="text-sm text-dark-500">•</span>
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                Automático
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        transaction.type === 'receita' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'receita' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <Receipt className="w-4 h-4 text-dark-500 ml-auto mt-1" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">Nenhuma transação encontrada</p>
                  <p className="text-white/40 text-sm mt-2">
                    {filterType === 'all' 
                      ? 'Adicione sua primeira transação' 
                      : `Nenhuma ${filterType === 'receita' ? 'receita' : 'despesa'} encontrada`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal de Nova Transação */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="bg-dark-800 rounded-2xl p-8 w-full max-w-md border border-dark-700"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Nova Transação</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'receita', category: ''})}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.type === 'receita'
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : 'bg-dark-700 border-dark-600 text-dark-400 hover:border-dark-500'
                      }`}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'despesa', category: ''})}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.type === 'despesa'
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-dark-700 border-dark-600 text-dark-400 hover:border-dark-500'
                      }`}
                    >
                      Despesa
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Descrição *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Descreva a transação..."
                    required
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-primary-500 focus:outline-none"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {(formData.type === 'receita' ? categoriesReceita : categoriesDespesa).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>

                {/* Botões */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-dark-700 text-dark-300 rounded-xl font-medium hover:bg-dark-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar</span>
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