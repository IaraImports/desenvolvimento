import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, ArrowRight } from 'lucide-react';

export default function Clientes() {
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
          Gestão de Clientes
        </h1>
        <p className="text-dark-300 text-lg">
          Construa relacionamentos duradouros com seus clientes
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
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Users className="w-12 h-12 text-white" />
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-4">
          CRM Inteligente
        </h2>
        
        <p className="text-dark-300 text-lg mb-8 max-w-2xl mx-auto">
          Em breve você terá acesso ao nosso sistema avançado de CRM para gerenciar 
          todos os seus clientes, histórico de compras, preferências e muito mais 
          em uma interface elegante e intuitiva.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            'Perfis Detalhados',
            'Histórico de Compras',
            'Segmentação Avançada',
            'Comunicação Integrada',
            'Fidelização',
            'Analytics de Cliente'
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
            Ser notificado no lançamento
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.button>
      </motion.div>

      {/* Feature preview cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            title: 'Base de Clientes',
            description: 'Centralize todos os dados dos seus clientes em um só lugar',
            icon: '👥'
          },
          {
            title: 'Comunicação 360°',
            description: 'WhatsApp, email e SMS integrados para melhor relacionamento',
            icon: '💬'
          },
          {
            title: 'Insights Poderosos',
            description: 'Descubra padrões de comportamento e oportunidades de venda',
            icon: '🧠'
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