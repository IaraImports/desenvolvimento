import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  ArrowDownRight
} from 'lucide-react';

const mockFinancialData = {
  receita: 45750.00,
  despesas: 18230.50,
  lucro: 27519.50,
  crescimento: 12.5
};

const mockTransactions = [
  { 
    id: 1, 
    type: 'receita', 
    description: 'Venda de Produto Premium', 
    amount: 2450.00, 
    date: '2024-01-15',
    category: 'Vendas'
  },
  { 
    id: 2, 
    type: 'despesa', 
    description: 'Fornecedor de Materiais', 
    amount: -850.00, 
    date: '2024-01-14',
    category: 'Fornecedores'
  },
  { 
    id: 3, 
    type: 'receita', 
    description: 'Prestação de Serviço', 
    amount: 1200.00, 
    date: '2024-01-13',
    category: 'Serviços'
  },
  { 
    id: 4, 
    type: 'despesa', 
    description: 'Marketing Digital', 
    amount: -450.00, 
    date: '2024-01-12',
    category: 'Marketing'
  },
  { 
    id: 5, 
    type: 'receita', 
    description: 'Venda Online', 
    amount: 3200.00, 
    date: '2024-01-11',
    category: 'E-commerce'
  }
];

export default function Financeiro() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
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
            {formatCurrency(mockFinancialData.receita)}
          </p>
          <p className="text-green-400 text-sm">
            +{mockFinancialData.crescimento}% este mês
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
            {formatCurrency(mockFinancialData.despesas)}
          </p>
          <p className="text-red-400 text-sm">
            -5.2% este mês
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
          <p className="text-3xl font-bold text-white mb-1">
            {formatCurrency(mockFinancialData.lucro)}
          </p>
          <p className="text-primary-400 text-sm">
            Margem: 60.1%
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
          <p className="text-3xl font-bold text-white mb-1">
            {formatCurrency(mockFinancialData.receita - mockFinancialData.despesas)}
          </p>
          <p className="text-blue-400 text-sm">
            Janeiro 2024
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
              {mockTransactions
                .filter(transaction => filterType === 'all' || transaction.type === filterType)
                .map((transaction, index) => (
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
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </span>
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
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 