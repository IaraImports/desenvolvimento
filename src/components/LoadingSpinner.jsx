import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap 
} from 'lucide-react';

// Ícones para animação flutuante
const floatingIcons = [
  { Icon: BarChart3, delay: 0, color: 'text-primary-400' },
  { Icon: Package, delay: 0.3, color: 'text-primary-300' },
  { Icon: ShoppingCart, delay: 0.6, color: 'text-primary-500' },
  { Icon: Users, delay: 0.9, color: 'text-primary-400' },
  { Icon: TrendingUp, delay: 1.2, color: 'text-primary-300' },
  { Icon: Shield, delay: 1.5, color: 'text-primary-500' },
  { Icon: Zap, delay: 1.8, color: 'text-primary-400' },
  { Icon: Sparkles, delay: 2.1, color: 'text-primary-300' }
];

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-luxury flex items-center justify-center relative overflow-hidden">
      {/* Grid de linhas de fundo animadas */}
      <div className="absolute inset-0">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {/* Linhas horizontais */}
          {[...Array(12)].map((_, i) => (
            <motion.line
              key={`h-${i}`}
              x1="0%"
              y1={`${5 + i * 8}%`}
              x2="100%"
              y2={`${5 + i * 8}%`}
              stroke="rgba(255, 44, 104, 0.3)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 2, 
                delay: i * 0.1, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
            />
          ))}
          {/* Linhas verticais */}
          {[...Array(8)].map((_, i) => (
            <motion.line
              key={`v-${i}`}
              x1={`${10 + i * 12}%`}
              y1="0%"
              x2={`${10 + i * 12}%`}
              y2="100%"
              stroke="rgba(255, 44, 104, 0.2)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 2.5, 
                delay: i * 0.15, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
            />
          ))}
        </svg>

        {/* Ícones flutuantes */}
        {floatingIcons.map(({ Icon, delay, color }, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: `${15 + (index % 4) * 20}%`,
              top: `${20 + Math.floor(index / 4) * 25}%`,
            }}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 360],
              x: [0, 30, -30, 0],
              y: [0, -20, 20, 0]
            }}
            transition={{ 
              duration: 4,
              delay: delay,
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            <Icon className={`w-8 h-8 ${color}`} />
          </motion.div>
        ))}

        {/* Partículas flutuantes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary-400/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, 20, -20, 0],
              scale: [1, 2, 1],
              opacity: [0.2, 0.7, 0.2]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        ))}
      </div>

      {/* Main loading content */}
      <motion.div 
        className="flex flex-col items-center space-y-8 relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="relative"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            {/* Logo sem fundo */}
            <img 
              src="/logorosa.svg" 
              alt="IARA" 
              className="w-16 h-16 drop-shadow-xl"
            />
            
            {/* Anel de luz ao redor da logo */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-400/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold text-gradient">IARA HUB</h1>
            <p className="text-dark-300">Sistema Inteligente</p>
          </div>
        </motion.div>

        {/* Loading animation complexa */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Anel externo */}
          <motion.div
            className="w-24 h-24 border-4 border-primary-500/30 border-t-primary-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Anel meio */}
          <motion.div
            className="absolute inset-3 w-18 h-18 border-4 border-primary-400/30 border-r-primary-400 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Anel interno */}
          <motion.div
            className="absolute inset-6 w-12 h-12 border-4 border-primary-300/30 border-b-primary-300 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Centro com sparkle */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              scale: { duration: 2, repeat: Infinity },
              rotate: { duration: 3, repeat: Infinity, ease: "linear" }
            }}
          >
            <Sparkles className="w-8 h-8 text-primary-400" />
          </motion.div>

          {/* Pontos orbitantes */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-primary-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-6px',
                marginTop: '-6px',
              }}
              animate={{
                rotate: [0, 360],
                x: [0, 40 * Math.cos((i * 60) * Math.PI / 180)],
                y: [0, 40 * Math.sin((i * 60) * Math.PI / 180)]
              }}
              transition={{
                duration: 3,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </motion.div>

        {/* Loading text */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-white text-xl font-medium mb-2">Carregando Sistema...</p>
          <p className="text-dark-400 text-sm">Preparando sua experiência premium</p>
        </motion.div>

        {/* Animated dots */}
        <motion.div 
          className="flex space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-4 h-4 bg-primary-500 rounded-full"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div 
          className="w-64 h-2 bg-dark-800 rounded-full overflow-hidden"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 256 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
            animate={{
              x: [-256, 256]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
} 