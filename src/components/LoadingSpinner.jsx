import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0D0C0C] flex items-center justify-center relative overflow-hidden">
      {/* Conteúdo principal centrado */}
      <motion.div 
        className="flex flex-col items-center space-y-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo rosa com leve animação */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.img 
            src="/logorosa.svg" 
            alt="IARA" 
            className="w-20 h-20 drop-shadow-xl"
            animate={{ 
              scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
              }}
            />
          </motion.div>

        {/* Título */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-[#FF2C68] mb-2">IARA HUB</h1>
          <p className="text-white/60 text-sm">GESTÃO INTELIGENTE</p>
        </motion.div>

        {/* Loading simples */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Anel de carregamento simples */}
          <motion.div
            className="w-12 h-12 border-3 border-white/20 border-t-[#FF2C68] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Texto de carregamento */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-white/40 text-sm">Carregando...</p>
        </motion.div>
      </motion.div>
    </div>
  );
} 