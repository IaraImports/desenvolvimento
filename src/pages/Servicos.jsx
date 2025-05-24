import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Sparkles, ArrowRight } from 'lucide-react';

export default function Servicos() {
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold text-gradient mb-4">
          Gestão de Serviços
        </h1>
        <p className="text-dark-300 text-lg">
          Administre todos os seus serviços com elegância e eficiência
        </p>
      </motion.div>

      {/* Main card */}
      <motion.div 
        className="card-luxury max-w-4xl mx-auto text-center py-16"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 bg-gradient-pink rounded-2xl shadow-luxury mb-8"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Wrench className="w-12 h-12 text-white" />
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-4">
          Em Desenvolvimento
        </h2>
        
        <p className="text-dark-300 text-lg mb-8 max-w-2xl mx-auto">
          Nossa equipe está trabalhando em uma experiência incrível para a gestão de serviços. 
          Em breve você terá acesso a ferramentas avançadas para organizar, acompanhar e 
          otimizar todos os seus serviços.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            'Cadastro de Serviços',
            'Categorização Inteligente',
            'Controle de Preços',
            'Relatórios Avançados',
            'Agendamento',
            'Histórico Completo'
          ].map((feature, index) => (
            <motion.div
              key={feature}
              className="badge-primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {feature}
            </motion.div>
          ))}
        </div>

        <motion.button
          className="btn-primary group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex items-center">
            Notificar quando estiver pronto
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.button>
      </motion.div>

      {/* Feature preview cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            title: 'Gestão Inteligente',
            description: 'Organize seus serviços com categorias personalizadas e busca avançada',
            icon: '🎯'
          },
          {
            title: 'Precificação Dinâmica',
            description: 'Defina preços flexíveis e promoções baseadas em demanda',
            icon: '💰'
          },
          {
            title: 'Analytics Premium',
            description: 'Acompanhe performance e insights dos seus serviços mais solicitados',
            icon: '📊'
          }
        ].map((card, index) => (
          <motion.div
            key={card.title}
            className="card hover-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 + (index * 0.2) }}
          >
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
            <p className="text-dark-300">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 