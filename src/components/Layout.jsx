import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationProvider, NotificationPanel } from './NotificationSystem';
import SystemMonitor from './SystemMonitor';
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
  TrendingUp,
  Shield,
  Zap,
  CreditCard,
  FileText,
  Clipboard,
  ChevronUp,
  Menu,
  X,
  ChevronRight
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
  { Icon: MessageCircle, delay: 5.6 }
];

const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'Produtos', icon: Package, path: '/produtos' },
  { name: 'Serviços', icon: Wrench, path: '/servicos' },
  { name: 'Vendas', icon: ShoppingCart, path: '/vendas' },
  { name: 'Financeiro', icon: DollarSign, path: '/financeiro' },
  { name: 'Clientes', icon: Users, path: '/clientes' },
  { name: 'Chat Interno', icon: MessageCircle, path: '/chat' },
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
  const [showSalesMenu, setShowSalesMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [userDropdownPosition, setUserDropdownPosition] = useState({ top: 0, right: 0 });
  const salesButtonRef = useRef(null);
  const userButtonRef = useRef(null);

  return (
    <NotificationProvider>
      <LayoutContent 
        user={user}
        userProfile={userProfile}
        logout={logout}
        navigate={navigate}
        location={location}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        showSalesMenu={showSalesMenu}
        setShowSalesMenu={setShowSalesMenu}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        dropdownPosition={dropdownPosition}
        setDropdownPosition={setDropdownPosition}
        userDropdownPosition={userDropdownPosition}
        setUserDropdownPosition={setUserDropdownPosition}
        salesButtonRef={salesButtonRef}
        userButtonRef={userButtonRef}
        children={children}
      />
    </NotificationProvider>
  );
}

function LayoutContent({ 
  user, userProfile, logout, navigate, location, showUserMenu, setShowUserMenu,
  showSalesMenu, setShowSalesMenu, showMobileMenu, setShowMobileMenu,
  dropdownPosition, setDropdownPosition, userDropdownPosition, setUserDropdownPosition,
  salesButtonRef, userButtonRef, children
}) {

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const toggleSalesMenu = () => {
    if (!showSalesMenu && salesButtonRef.current) {
      const rect = salesButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setShowSalesMenu(!showSalesMenu);
  };

  const toggleUserMenu = () => {
    if (!showUserMenu && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setShowUserMenu(!showUserMenu);
  };

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0D0C0C]">
      {/* CABEÇALHO RESPONSIVO */}
      <motion.header 
        className="relative h-16 md:h-24 bg-[#FF2C68] overflow-hidden z-[9999990]"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animações de fundo do cabeçalho - responsivas */}
        <div className="absolute inset-0">
          {/* Versão desktop das animações */}
          <div className="hidden md:block">
            <svg className="absolute inset-0 w-full h-full opacity-50" style={{ zIndex: 1 }}>
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
            </svg>
            
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
                <Icon className="w-6 md:w-8 h-6 md:h-8 text-[#0D0C0C]/60" />
              </motion.div>
            ))}
          </div>

          {/* Versão mobile simplificada */}
          <div className="md:hidden">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-[#0D0C0C]/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, -10, 0],
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.6, 0.2]
                }}
                transition={{
                  duration: 2 + Math.random() * 1,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo do cabeçalho responsivo */}
        <div className="relative z-10 h-full flex items-center justify-between px-4 md:px-8">
          {/* Mobile: Menu Hambúrguer + Logo */}
          <div className="flex items-center space-x-4 md:hidden">
            <motion.button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg bg-[#0D0C0C]/20 text-[#0D0C0C]/80 hover:bg-[#0D0C0C]/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>

            <motion.img 
              src="/logopreta.svg" 
              alt="IARA" 
              className="w-8 h-8"
              animate={{ 
                rotate: [0, 2, -2, 0],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>

          {/* Desktop: Logo centralizada */}
          <div className="hidden md:flex flex-1" />
          
          <motion.div 
            className="hidden md:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
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

          {/* Actions responsivas */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Desktop: Botões completos */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Botão de Vendas */}
              <div className="relative">
                <motion.button
                  ref={salesButtonRef}
                  onClick={toggleSalesMenu}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold shadow-lg transition-all duration-300 group flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CreditCard className="w-4 lg:w-5 h-4 lg:h-5" />
                  <span className="text-sm lg:text-base">VENDER</span>
                  {showSalesMenu ? (
                    <ChevronUp className="w-3 lg:w-4 h-3 lg:h-4" />
                  ) : (
                    <ChevronDown className="w-3 lg:w-4 h-3 lg:h-4" />
                  )}
                </motion.button>
              </div>

              {/* Chat Interno */}
              <motion.button
                onClick={() => navigate('/chat')}
                className={`rounded-xl border flex items-center space-x-2 px-3 lg:px-4 py-2 lg:py-3 transition-all duration-300 group shadow-lg ${
                  isActive('/chat') 
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-4 lg:w-5 h-4 lg:h-5" />
                <span className="hidden lg:block font-medium">Chat</span>
              </motion.button>
            </div>

            {/* Mobile: Botões compactos */}
            <div className="flex md:hidden items-center space-x-1">
              <motion.button
                onClick={() => navigate('/vendas/pdv')}
                className="bg-green-500 text-white p-2 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CreditCard className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={() => navigate('/chat')}
                className={`p-2 rounded-lg ${
                  isActive('/chat') 
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-600/20 text-purple-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Notificações */}
            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <NotificationPanel />
            </motion.div>

            {/* Menu do usuário */}
            <div className="relative">
              <motion.button
                ref={userButtonRef}
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 md:space-x-3 px-2 md:px-4 py-2 md:py-3 rounded-xl bg-[#0D0C0C]/20 hover:bg-[#0D0C0C]/30 border border-[#0D0C0C]/30 backdrop-blur-sm transition-all duration-300 group shadow-lg"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-6 md:w-8 h-6 md:h-8 bg-[#0D0C0C]/30 rounded-lg flex items-center justify-center">
                  <User className="w-3 md:w-4 h-3 md:h-4 text-[#0D0C0C]/80" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs md:text-sm font-medium text-[#0D0C0C]/90">
                    {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  {userProfile?.level && (
                    <span className="text-xs px-2 py-1 bg-[#0D0C0C]/20 text-[#0D0C0C]/70 rounded-lg">
                      {userProfile.level}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3 md:w-4 h-3 md:h-4 text-[#0D0C0C]/70 group-hover:text-[#0D0C0C] transition-colors" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* MENU HORIZONTAL - APENAS DESKTOP */}
      <motion.nav 
        className="hidden md:block bg-[#0D0C0C]/50 backdrop-blur-xl border-b border-[#FF2C68]/30 shadow-2xl z-[9999989]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-center space-x-1 lg:space-x-2 overflow-x-auto">
            {menuItems.map((item, index) => {
              const isActiveItem = isActive(item.path);
              return (
                <motion.button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`
                    relative group flex items-center space-x-2 lg:space-x-3 px-3 lg:px-6 py-2 lg:py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden whitespace-nowrap
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
                  <item.icon className="w-4 lg:w-5 h-4 lg:h-5 relative z-10" />
                  <span className="relative z-10 text-sm lg:text-base">{item.name}</span>
                  
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

      {/* MENU MOBILE FULLSCREEN */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            className="fixed inset-0 z-[99999999] bg-[#0D0C0C]/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col h-full">
              {/* Header do menu mobile */}
              <div className="flex items-center justify-between p-4 border-b border-[#FF2C68]/30">
                <div className="flex items-center space-x-3">
                  <img src="/logopreta.svg" alt="IARA" className="w-8 h-8" />
                  <h2 className="text-lg font-bold text-white">IARA HUB</h2>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg bg-[#FF2C68]/20 text-[#FF2C68] hover:bg-[#FF2C68]/30"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Perfil do usuário no mobile */}
              <div className="p-4 border-b border-[#FF2C68]/30">
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

              {/* Ações rápidas mobile */}
              <div className="p-4 border-b border-[#FF2C68]/30">
                <h3 className="text-sm font-medium text-white/60 mb-3">Ações Rápidas</h3>
                <div className="grid grid-cols-3 gap-3">
                  {salesQuickOptions.map((option) => (
                    <motion.button
                      key={option.name}
                      onClick={() => {
                        navigate(option.path);
                        setShowMobileMenu(false);
                      }}
                      className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-[#0D0C0C]/50 border border-[#FF2C68]/30 hover:border-[#FF2C68]/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <option.icon className={`w-6 h-6 ${option.color}`} />
                      <span className="text-xs text-white font-medium text-center">{option.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Menu principal mobile */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-medium text-white/60 mb-3">Navegação</h3>
                <div className="space-y-2">
                  {menuItems.map((item, index) => {
                    const isActiveItem = isActive(item.path);
                    return (
                      <motion.button
                        key={item.name}
                        onClick={() => {
                          navigate(item.path);
                          setShowMobileMenu(false);
                        }}
                        className={`
                          w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300
                          ${isActiveItem 
                            ? 'bg-[#FF2C68] text-white shadow-lg' 
                            : 'text-white/70 hover:text-white hover:bg-[#0D0C0C]/50'
                          }
                        `}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer do menu mobile */}
              <div className="p-4 border-t border-[#FF2C68]/30">
                <motion.button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEÚDO PRINCIPAL RESPONSIVO */}
      <motion.main 
        className="p-4 md:p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {children}
      </motion.main>

      {/* DROPDOWN DE VENDAS - APENAS DESKTOP */}
      <AnimatePresence>
        {showSalesMenu && (
          <>
            <div 
              className="fixed inset-0 z-[99999990]" 
              onClick={() => setShowSalesMenu(false)}
            />
            <motion.div
              className="fixed w-80 bg-[#0D0C0C] rounded-2xl border border-green-500 shadow-2xl overflow-hidden z-[99999991]"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left
              }}
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

      {/* DROPDOWN DO USUÁRIO */}
      <AnimatePresence>
        {showUserMenu && (
          <>
            <div 
              className="fixed inset-0 z-[99999988]" 
              onClick={() => setShowUserMenu(false)}
            />
            <motion.div
              className="fixed w-64 bg-[#0D0C0C] rounded-2xl border border-[#FF2C68] shadow-2xl overflow-hidden z-[99999989]"
              style={{
                top: userDropdownPosition.top,
                right: userDropdownPosition.right
              }}
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
                    navigate('/configuracoes');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-[#0D0C0C]/50 transition-all duration-200"
                >
                  <Settings className="w-5 h-5" />
                  <span>Configurações</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sistema de monitoramento - apenas desktop */}
      <div className="hidden lg:block">
        <SystemMonitor />
      </div>
    </div>
  );
} 