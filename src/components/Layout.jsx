import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  Wrench,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronDown,
  MessageCircle,
  DollarSign,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  CreditCard,
  FileText,
  Clipboard,
  ChevronUp
} from 'lucide-react';

// Ícones para animação flutuante no cabeçalho
const headerFloatingIcons = [
  { Icon: BarChart3, delay: 0 },
  { Icon: Package, delay: 0.8 },
  { Icon: ShoppingCart, delay: 1.6 },
  { Icon: Users, delay: 2.4 },
  { Icon: TrendingUp, delay: 3.2 },
  { Icon: Shield, delay: 4 },
  { Icon: Zap, delay: 4.8 },
  { Icon: Sparkles, delay: 5.6 }
];

const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'Produtos', icon: Package, path: '/produtos' },
  { name: 'Serviços', icon: Wrench, path: '/servicos' },
  { name: 'Vendas', icon: ShoppingCart, path: '/vendas' },
  { name: 'Financeiro', icon: DollarSign, path: '/financeiro' },
  { name: 'Clientes', icon: Users, path: '/clientes' },
  { name: 'Relatórios', icon: BarChart3, path: '/relatorios' },
  { name: 'Configurações', icon: Settings, path: '/configuracoes' }
];

const salesQuickOptions = [
  { name: 'Vender PDV', icon: CreditCard, path: '/vendas/pdv', color: 'text-green-400', desc: 'Venda direta no ponto de venda' },
  { name: 'Orçamento', icon: FileText, path: '/vendas/orcamento', color: 'text-blue-400', desc: 'Criar proposta de venda' },
  { name: 'Criar OS', icon: Clipboard, path: '/vendas/os', color: 'text-orange-400', desc: 'Ordem de serviço técnico' }
];

export default function Layout({ children }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSalesMenu, setShowSalesMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0D0C0C]">
      {/* CABEÇALHO LUXUOSO */}
      <motion.header 
        className="relative h-24 bg-[#FF2C68] overflow-hidden z-40"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animações de fundo do cabeçalho - igual ao login */}
        <div className="absolute inset-0">
          {/* Linhas entrelaçadas conectivas - MAIS VISÍVEIS */}
          <svg className="absolute inset-0 w-full h-full opacity-50" style={{ zIndex: 1 }}>
            {/* Linhas diagonais entrelaçadas */}
            {[...Array(8)].map((_, i) => (
              <motion.line
                key={`d1-${i}`}
                x1={`${i * 15}%`}
                y1="0%"
                x2={`${(i * 15) + 30}%`}
                y2="100%"
                stroke="#0D0C0C"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, repeatType: "reverse" }}
              />
            ))}
            {/* Linhas curvas entrelaçadas */}
            {[...Array(5)].map((_, i) => (
              <motion.path
                key={`curve-${i}`}
                d={`M ${5 + i * 20},0 Q ${15 + i * 20},40 ${10 + i * 20},100`}
                stroke="#0D0C0C"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 3, delay: i * 0.3, repeat: Infinity, repeatType: "reverse" }}
              />
            ))}
          </svg>
          
          {/* Ícones flutuantes MAIS VISÍVEIS para o cabeçalho */}
          {headerFloatingIcons.map(({ Icon, delay }, index) => (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: `${8 + (index % 4) * 25}%`,
                top: `${20 + Math.floor(index / 4) * 30}%`,
              }}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0, 1.2, 0],
                rotate: [0, 180, 360],
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
              <Icon className="w-8 h-8 text-[#0D0C0C]/60" />
            </motion.div>
          ))}

          {/* Bolinhas flutuantes MAIS VISÍVEIS */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-[#0D0C0C]/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, 25, -25, 0],
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

        {/* Conteúdo do cabeçalho */}
        <div className="relative z-10 h-full flex items-center justify-between px-8">
          {/* Logo centralizada */}
          <div className="flex-1" />
          
          <motion.div 
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Logo preta limpa sem fundo */}
            <motion.img 
              src="/logopreta.svg" 
              alt="IARA" 
              className="w-16 h-16 drop-shadow-2xl"
              animate={{ 
                rotate: [0, 3, -3, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </motion.div>

          <div className="flex-1 flex items-center justify-end space-x-4">
            {/* Botão de Vendas Rápido */}
            <div className="relative">
              <motion.button
                onClick={() => setShowSalesMenu(!showSalesMenu)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 group flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <CreditCard className="w-5 h-5" />
                <span>VENDER</span>
                {showSalesMenu ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </motion.button>

              {/* Dropdown de Vendas */}
              <AnimatePresence>
                {showSalesMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[99997]" 
                      onClick={() => setShowSalesMenu(false)}
                    />
                    <motion.div
                      className="absolute right-0 top-16 w-80 bg-[#0D0C0C] rounded-2xl border border-green-500 shadow-2xl overflow-hidden z-[99998]"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 bg-green-500/10 border-b border-green-500/30">
                        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-green-400" />
                          <span>Acesso Rápido de Vendas</span>
                        </h3>
                        <p className="text-white/60 text-sm mt-1">Escolha uma ação de venda</p>
                      </div>

                      <div className="p-2">
                        {salesQuickOptions.map((option, index) => (
                          <motion.button
                            key={option.name}
                            onClick={() => {
                              setShowSalesMenu(false);
                              navigate(option.path);
                            }}
                            className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-white/70 hover:text-white hover:bg-[#0D0C0C]/50 transition-all duration-200 group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-500/20 group-hover:bg-gray-500/30 transition-colors`}>
                              <option.icon className={`w-5 h-5 ${option.color}`} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-white group-hover:text-green-400 transition-colors">
                                {option.name}
                              </p>
                              <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
                                {option.desc}
                              </p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-white/30 rotate-[-90deg]" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Botão Chat Interno - Agora Roxo */}
            <motion.button
              onClick={() => setShowChatModal(true)}
              className="w-12 h-12 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl border border-purple-500/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <MessageCircle className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </motion.button>

            {/* Menu do usuário */}
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-[#0D0C0C]/20 hover:bg-[#0D0C0C]/30 border border-[#0D0C0C]/30 backdrop-blur-sm transition-all duration-300 group shadow-lg"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="w-8 h-8 bg-[#0D0C0C]/30 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-[#0D0C0C]/80" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-[#0D0C0C]/90">
                    {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  {userProfile?.level && (
                    <span className="text-xs px-2 py-1 bg-[#0D0C0C]/20 text-[#0D0C0C]/70 rounded-lg">
                      {userProfile.level}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-[#0D0C0C]/70 group-hover:text-[#0D0C0C] transition-colors" />
              </motion.button>

              {/* Dropdown do usuário */}
              <AnimatePresence>
                {showUserMenu && (
                  <>
                    {/* Overlay invisível para fechar o dropdown */}
                    <div 
                      className="fixed inset-0 z-[99998]" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      className="absolute right-0 top-16 w-64 bg-[#0D0C0C] rounded-2xl border border-[#FF2C68] shadow-2xl overflow-hidden z-[99999]"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                    {/* Perfil do usuário */}
                    <div className="p-4 bg-[#FF2C68]/10 border-b border-[#FF2C68]/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#FF2C68] rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {user?.displayName || 'Usuário'}
                          </p>
                          <p className="text-sm text-white/60">{user?.email}</p>
                          {userProfile?.level && (
                            <span className="inline-block mt-1 text-xs px-2 py-1 bg-[#FF2C68]/20 text-[#FF2C68] rounded-lg">
                              {userProfile.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Opções do menu */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/configuracoes');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-[#FF2C68]/20 transition-all duration-200"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Configurações</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-[#FF2C68] hover:text-white hover:bg-[#FF2C68]/20 transition-all duration-200"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      {/* MENU HORIZONTAL LUXUOSO */}
      <motion.nav 
        className="bg-[#0D0C0C]/50 backdrop-blur-xl border-b border-[#FF2C68]/30 shadow-2xl z-30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="px-8 py-4">
          <div className="flex items-center justify-center space-x-2">
            {menuItems.map((item, index) => {
              const isActiveItem = isActive(item.path);
              return (
                <motion.button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`
                    relative group flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden
                    ${isActiveItem 
                      ? 'bg-[#FF2C68] text-white shadow-lg scale-105' 
                      : 'text-white/70 hover:text-white hover:bg-[#0D0C0C]/30'
                    }
                  `}
                  whileHover={{ scale: isActiveItem ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  {/* Efeito shimmer para item ativo */}
                  {isActiveItem && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </div>
                  )}
                  
                  <item.icon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                  
                  {/* Indicador ativo */}
                  {isActiveItem && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full"
                      layoutId="activeIndicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* CONTEÚDO PRINCIPAL */}
      <motion.main 
        className="p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {children}
      </motion.main>

      {/* MODAL DO CHAT INTERNO */}
      <AnimatePresence>
        {showChatModal && (
          <motion.div 
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[50000] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChatModal(false)}
          >
            <motion.div 
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-2xl border border-[#FF2C68] relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowChatModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                ✕
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#FF2C68] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#FF2C68] mb-4">Chat Interno</h2>
                <p className="text-white/60 mb-6">
                  Sistema de comunicação interna em desenvolvimento.
                  <br />
                  Em breve você poderá conversar com outros usuários da equipe!
                </p>
                
                <div className="bg-[#FF2C68]/10 rounded-xl p-6 border border-[#FF2C68]/30">
                  <div className="flex items-center justify-center space-x-2 text-[#FF2C68]">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="font-medium">Funcionalidade em desenvolvimento</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 