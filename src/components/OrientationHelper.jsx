import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, X, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrientationHelper() {
  const [showNotification, setShowNotification] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    // Detectar se é mobile
    const checkIfMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      return isMobileDevice || isSmallScreen;
    };

    // Verificar orientação
    const checkOrientation = () => {
      const isCurrentlyPortrait = window.innerHeight > window.innerWidth;
      const isCurrentlyMobile = checkIfMobile();
      
      setIsPortrait(isCurrentlyPortrait);
      setIsMobile(isCurrentlyMobile);
      
      // Mostrar notificação se for mobile em portrait e ainda não mostrou
      if (isCurrentlyMobile && isCurrentlyPortrait && !hasShownToast) {
        setShowNotification(true);
        
        // Toast sugerindo virar a tela
        toast((t) => (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <RotateCw className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">📱 Melhor experiência</p>
              <p className="text-sm text-gray-600">Vire seu dispositivo para modo paisagem</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ), {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            padding: '12px'
          }
        });
        
        setHasShownToast(true);
      }
      
      // Esconder notificação se mudou para landscape
      if (!isCurrentlyPortrait || !isCurrentlyMobile) {
        setShowNotification(false);
      }
    };

    // Verificação inicial
    checkOrientation();

    // Listener para mudanças de orientação
    const handleOrientationChange = () => {
      setTimeout(checkOrientation, 100); // Pequeno delay para aguardar a mudança
    };

    const handleResize = () => {
      setTimeout(checkOrientation, 100);
    };

    // Event listeners
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    // Verificar periodicamente (fallback)
    const interval = setInterval(checkOrientation, 2000);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [hasShownToast]);

  // Função para mostrar instruções detalhadas
  const showInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions;
    
    if (isIOS) {
      instructions = `📱 iPhone/iPad - Como virar a tela:

1. 🔓 Certifique-se que o "Bloqueio de Orientação" está DESATIVADO
   • Deslize de baixo para cima (Central de Controle)
   • Procure o ícone de cadeado com seta circular
   • Se estiver vermelho, toque para desativar

2. 🔄 Vire fisicamente o dispositivo para o lado

3. ⚙️ Se não funcionar:
   • Vá em Ajustes > Tela e Brilho
   • Certifique-se que "Rotação da Tela" está ativada`;
    } else if (isAndroid) {
      instructions = `📱 Android - Como virar a tela:

1. 🔓 Ative a rotação automática:
   • Deslize de cima para baixo (painel de notificações)
   • Procure o ícone "Rotação Automática" ou "Girar tela"
   • Toque para ativar (fica azul/colorido)

2. 🔄 Vire fisicamente o dispositivo para o lado

3. ⚙️ Se não funcionar:
   • Vá em Configurações > Tela
   • Ative "Rotação automática da tela"`;
    } else {
      instructions = `📱 Como virar a tela:

1. 🔓 Certifique-se que a rotação automática está ativada
2. 🔄 Vire fisicamente o dispositivo para o lado
3. ⚙️ Verifique as configurações de tela do seu dispositivo`;
    }
    
    alert(instructions);
  };

  // Reset do toast após algum tempo
  useEffect(() => {
    if (hasShownToast) {
      const resetTimer = setTimeout(() => {
        setHasShownToast(false);
      }, 30000); // Reset após 30 segundos
      
      return () => clearTimeout(resetTimer);
    }
  }, [hasShownToast]);

  return (
    <AnimatePresence>
      {showNotification && isMobile && isPortrait && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 z-[9999999] flex justify-center"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 max-w-sm mx-auto border border-white/20 backdrop-blur-xl">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <RotateCw className="w-5 h-5 text-white animate-spin" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">🔄 Melhor Experiência</p>
                <p className="text-xs text-white/80 mt-1">
                  Vire seu dispositivo para modo paisagem para uma melhor experiência
                </p>
                
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={showInstructions}
                    className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Como fazer?</span>
                  </button>
                  
                  <button
                    onClick={() => setShowNotification(false)}
                    className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
                  >
                    <X className="w-3 h-3" />
                    <span>Fechar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 