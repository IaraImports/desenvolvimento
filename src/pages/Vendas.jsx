import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';

export default function Vendas() {
  const navigate = useNavigate();
  const [stats] = useState({
    vendasHoje: 12,
    receitaHoje: 15420.50,
    orcamentosAbertos: 8,
    osAndamento: 5
  });

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
                R$ {stats.receitaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <h2 className="text-2xl font-bold text-white">Atividades Recentes</h2>
          <BarChart3 className="w-6 h-6 text-[#FF2C68]" />
        </div>

        <div className="space-y-4">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">Nenhuma atividade recente encontrada</p>
            <p className="text-white/40 text-sm mt-2">As atividades aparecerão aqui conforme você usar o sistema</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="text-[#FF2C68] hover:text-[#FF2C68]/80 font-medium transition-colors">
            Ver todas as atividades →
          </button>
        </div>
      </motion.div>
    </div>
  );
} 