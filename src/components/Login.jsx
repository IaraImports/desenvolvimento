import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Sparkles,
  ArrowRight,
  Shield,
  TrendingUp,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Zap,
  User,
  X,
  Plus
} from 'lucide-react';

// Ícones para animação flutuante
const floatingIcons = [
  { Icon: BarChart3, delay: 0 },
  { Icon: Package, delay: 0.5 },
  { Icon: ShoppingCart, delay: 1 },
  { Icon: Users, delay: 1.5 },
  { Icon: TrendingUp, delay: 2 },
  { Icon: Shield, delay: 2.5 },
  { Icon: Zap, delay: 3 },
  { Icon: Sparkles, delay: 3.5 }
];

// Níveis de usuário
const USER_LEVELS = [
  { value: 'ADMIN', label: 'Administrador', color: 'text-red-400', icon: Shield },
  { value: 'VENDEDOR', label: 'Vendedor', color: 'text-green-400', icon: ShoppingCart },
  { value: 'TECNICO', label: 'Técnico', color: 'text-blue-400', icon: Zap },
  { value: 'MARKETING', label: 'Marketing', color: 'text-purple-400', icon: TrendingUp },
  { value: 'POS_VENDA', label: 'Pós-Venda', color: 'text-orange-400', icon: Users }
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    level: 'VENDEDOR'
  });
  const [loading, setLoading] = useState(false);

  const { login, register, user } = useAuth();

  // Esconder botão de instalação se usuário estiver logado
  useEffect(() => {
    if (user) {
      setShowInstallButton(false);
    } else {
      // Verificar se é standalone (app já instalado)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (isStandalone) {
        setShowInstallButton(false);
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Esconder botão de instalação após login bem-sucedido
      setShowInstallButton(false);
    } catch (error) {
      console.error('Erro na autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await register(registerData.email, registerData.password, registerData.name, registerData.level);
      setShowRegisterModal(false);
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        level: 'VENDEDOR'
      });
    } catch (error) {
      console.error('Erro no cadastro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterInputChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };



  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* LADO ESQUERDO - PRETO - FORMULÁRIO */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Fundo preto sólido */}
        <div className="absolute inset-0 bg-dark-900" />
        
        {/* Padrão geométrico mais visível no fundo */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 44, 104, 0.3) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Botão de cadastro discreto */}
        <motion.button
          onClick={() => setShowRegisterModal(true)}
          className="absolute top-6 right-6 w-8 h-8 bg-dark-800/30 hover:bg-dark-700/50 rounded-lg flex items-center justify-center opacity-40 hover:opacity-70 transition-all duration-300 z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-4 h-4 text-dark-400" />
        </motion.button>

        {/* Container do formulário - CENTRALIZADO */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            className="w-full max-w-md relative z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Título de boas-vindas */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold text-white mb-2">
                Bem-vindo de volta
              </h1>
              <p className="text-gray-400 text-lg">
                Acesse sua conta IARA HUB
              </p>
            </motion.div>

            {/* Formulário */}
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-dark-600"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Senha"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-dark-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Botão principal */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-2" />
                  )}
                  {loading ? 'Carregando...' : 'Entrar'}
                  {!loading && (
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  )}
                </span>
                
                {/* Efeito shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
              </motion.button>



              {/* Link esqueci senha */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Esqueceu sua senha?
                </a>
              </motion.div>

              {/* Botão de instalação PWA - só aparece se não estiver logado */}
              {showInstallButton && (
                <motion.div 
                  className="text-center mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                <button
                  onClick={() => {
                    // Verificar se é standalone (já instalado)
                    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
                    
                    if (isStandalone) {
                      alert('App já está instalado! 🎉');
                      return;
                    }
                    
                    // Tentar usar o prompt nativo do navegador
                    if (window.deferredPrompt) {
                      window.deferredPrompt.prompt();
                      window.deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                          console.log('✅ PWA instalado');
                          alert('App instalado com sucesso! 🎉\nVerifique sua tela inicial.');
                        } else {
                          console.log('❌ Instalação cancelada');
                        }
                        window.deferredPrompt = null;
                      });
                      return;
                    }
                    
                    // Detectar ambiente e mostrar instruções específicas
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                    const isAndroid = /Android/.test(navigator.userAgent);
                    const isDesktop = !isIOS && !isAndroid;
                    const isChrome = /Chrome/.test(navigator.userAgent);
                    const isFirefox = /Firefox/.test(navigator.userAgent);
                    const isEdge = /Edg/.test(navigator.userAgent);
                    
                    let instructions;
                    
                    if (isDesktop) {
                      if (isChrome || isEdge) {
                        instructions = `Para instalar no ${isEdge ? 'Edge' : 'Chrome'} (PC):\n\n1. Clique nos 3 pontos (⋮) no canto superior direito\n2. Procure por "Instalar IARA HUB" ou "Aplicativos"\n3. Clique em "Instalar"\n\nOu pressione Ctrl+Shift+I, vá em Application > Manifest > Install`;
                      } else if (isFirefox) {
                        instructions = 'Firefox Desktop não suporta instalação de PWA.\n\nRecomendamos usar Chrome ou Edge para instalar o app.\n\nOu continue usando pelo navegador! 🌐';
                      } else {
                        instructions = 'Para instalar no PC:\n\n1. Use Chrome ou Edge\n2. Clique nos 3 pontos (⋮)\n3. Procure "Instalar app" ou "Aplicativos"\n4. Clique em "Instalar"';
                      }
                    } else if (isIOS) {
                      instructions = 'Para instalar no iPhone/iPad:\n\n1. Toque no botão de compartilhar ⬆️ (na barra inferior)\n2. Role para baixo e selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar" no canto superior direito\n\nO app aparecerá na sua tela inicial!';
                    } else if (isAndroid) {
                      instructions = 'Para instalar no Android:\n\n1. Toque nos 3 pontos (⋮) no canto superior direito\n2. Selecione "Adicionar à tela inicial" ou "Instalar app"\n3. Confirme tocando em "Instalar"\n\nO app será instalado no seu dispositivo!';
                    } else {
                      instructions = 'Para instalar:\n\nUse Chrome, Edge ou outro navegador compatível.\nProcure pela opção "Instalar app" no menu do navegador.';
                    }
                    
                    alert(instructions);
                  }}
                  className="group relative px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/25 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    📱 {window.deferredPrompt ? 'Instalar App' : 'Como Instalar'}
                  </span>
                  
                  {/* Efeito shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </div>
                </button>
              </motion.div>
              )}
            </motion.form>
          </motion.div>
        </div>

        {/* Footer com versão e direitos */}
        <motion.div 
          className="text-center text-gray-500 text-xs space-y-1 relative z-10 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p>IARA HUB v1.0.0</p>
          <p>© 2024 IARA. Todos os direitos reservados.</p>
          <p className="text-gray-600">Sistema Particular de Gestão Inteligente</p>
        </motion.div>
      </div>

      {/* LADO DIREITO - ROSA - LOGO E ANIMAÇÕES */}
      <div className="flex-1 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden flex items-center justify-center">
        {/* Animação de linhas entrelaçadas */}
        <div className="absolute inset-0">
          {/* Linhas entrelaçadas conectivas */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* Linhas diagonais entrelaçadas */}
            {[...Array(10)].map((_, i) => (
              <motion.line
                key={`d1-${i}`}
                x1={`${i * 12}%`}
                y1="0%"
                x2={`${(i * 12) + 40}%`}
                y2="100%"
                stroke="rgba(13,12,12,0.15)"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 3, delay: i * 0.2, repeat: Infinity, repeatType: "reverse" }}
              />
            ))}
            {/* Linhas diagonais opostas */}
            {[...Array(8)].map((_, i) => (
              <motion.line
                key={`d2-${i}`}
                x1={`${100 - (i * 15)}%`}
                y1="0%"
                x2={`${60 - (i * 15)}%`}
                y2="100%"
                stroke="rgba(13,12,12,0.12)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 3.5, delay: i * 0.3, repeat: Infinity, repeatType: "reverse" }}
              />
            ))}
            {/* Linhas curvas entrelaçadas */}
            {[...Array(6)].map((_, i) => (
              <motion.path
                key={`curve-${i}`}
                d={`M ${10 + i * 15},0 Q ${30 + i * 15},50 ${15 + i * 15},100`}
                stroke="rgba(13,12,12,0.18)"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 4, delay: i * 0.4, repeat: Infinity, repeatType: "reverse" }}
              />
            ))}
          </svg>
          
          {/* Ícones flutuantes mais visíveis */}
          {floatingIcons.map(({ Icon, delay }, index) => (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: `${10 + (index % 4) * 25}%`,
                top: `${15 + Math.floor(index / 4) * 20}%`,
              }}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.7, 0],
                scale: [0, 1.3, 0],
                rotate: [0, 180, 360],
                x: [0, 40, -40, 0],
                y: [0, -25, 25, 0]
              }}
              transition={{ 
                duration: 4,
                delay: delay,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <Icon className="w-12 h-12 text-black/40" />
            </motion.div>
          ))}

          {/* Bolinhas flutuantes mais visíveis */}
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-black/25 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, 25, -25, 0],
                scale: [1, 2.5, 1],
                opacity: [0.2, 0.8, 0.2]
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

        {/* Conteúdo principal */}
        <motion.div 
          className="relative z-10 text-center max-w-lg px-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Logo como Nome */}
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {/* Logo IARA HUB completo */}
            <motion.div 
              className="mb-6"
              animate={{ 
                rotate: [0, 1, -1, 0],
                scale: [1, 1.01, 1]
              }}
              transition={{ duration: 10, repeat: Infinity }}
            >
              <img 
                src="/logopreta.svg" 
                alt="IARA HUB" 
                className="w-80 h-auto mx-auto drop-shadow-lg"
              />
            </motion.div>
            <motion.p 
              className="text-black/70 text-xl font-medium mt-3 drop-shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              Sistema Particular de Gestão
            </motion.p>
          </motion.div>

          {/* Descrição */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <h3 className="text-2xl font-bold text-black/90 mb-6 drop-shadow-sm">
              Gestão Inteligente e Personalizada
            </h3>
            
            <div className="space-y-4 text-left">
              {[
                { icon: BarChart3, text: "Dashboard com métricas personalizadas" },
                { icon: Package, text: "Controle total de produtos e estoque" },
                { icon: ShoppingCart, text: "Sistema de vendas otimizado" },
                { icon: Users, text: "Gestão completa de clientes" }
              ].map(({ icon: Icon, text }, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 + (index * 0.1) }}
                >
                  <div className="w-12 h-12 bg-black/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-black/80" />
                  </div>
                  <span className="text-black/80 font-medium text-lg drop-shadow-sm">{text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="mt-8 p-6 bg-black/10 rounded-xl border border-black/15 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.7 }}
            >
              <p className="text-black/70 text-base drop-shadow-sm">
                <Sparkles className="inline w-5 h-5 mr-2" />
                Sistema exclusivo desenvolvido para máxima eficiência e controle total do seu negócio.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Modal de Cadastro */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div 
            className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div 
              className="bg-dark-800 rounded-2xl p-8 w-full max-w-md border border-dark-700 relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-dark-700/50 text-dark-400 hover:text-white hover:bg-dark-600/50 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold text-gradient mb-6">Cadastrar Usuário</h2>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Nome completo"
                    value={registerData.name}
                    onChange={handleRegisterInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={handleRegisterInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Senha"
                    value={registerData.password}
                    onChange={handleRegisterInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirmar senha"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nível de Acesso</label>
                  <select
                    name="level"
                    value={registerData.level}
                    onChange={handleRegisterInputChange}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {USER_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 