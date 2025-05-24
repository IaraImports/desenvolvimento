import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, AlertTriangle, Info, MessageCircle, 
  Package, Wrench, ShoppingBag, Users, DollarSign, Clock,
  Settings, Volume2, VolumeX
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Context para o sistema de notificações
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// Provider do sistema de notificações
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Escutar notificações em tempo real - REMOVENDO orderBy para evitar erro de índice
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = [];
      let unreadCounter = 0;

      snapshot.docs.forEach(doc => {
        const notification = { id: doc.id, ...doc.data() };
        notificationsList.push(notification);
        
        if (!notification.read) {
          unreadCounter++;
        }
      });

      // Ordenar no frontend por data de criação (mais recentes primeiro)
      notificationsList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      // Verificar se há novas notificações para tocar som
      if (notifications.length > 0 && notificationsList.length > notifications.length && soundEnabled) {
        playNotificationSound();
      }

      setNotifications(notificationsList);
      setUnreadCount(unreadCounter);
    });

    return () => unsubscribe();
  }, [user, soundEnabled]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Falha silenciosa se não conseguir tocar o som
      });
    } catch (error) {
      // Falha silenciosa
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true,
            readAt: new Date()
          })
        )
      );
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  const createNotification = async (type, title, message, data = {}) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    createNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Componente do painel de notificações
export function NotificationPanel() {
  const { 
    notifications, 
    unreadCount, 
    soundEnabled, 
    setSoundEnabled, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="w-4 h-4" />;
      case 'service': return <Wrench className="w-4 h-4" />;
      case 'sale': return <ShoppingBag className="w-4 h-4" />;
      case 'client': return <Users className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order': return 'text-blue-400 bg-blue-500/20';
      case 'service': return 'text-purple-400 bg-purple-500/20';
      case 'sale': return 'text-green-400 bg-green-500/20';
      case 'client': return 'text-cyan-400 bg-cyan-500/20';
      case 'payment': return 'text-yellow-400 bg-yellow-500/20';
      case 'system': return 'text-gray-400 bg-gray-500/20';
      case 'reminder': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-[#FF2C68] bg-[#FF2C68]/20';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Aqui você pode adicionar lógica para navegar para a página relacionada
    if (notification.data?.route) {
      // Navegar para a rota especificada
      window.location.hash = notification.data.route;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    const notificationDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return notificationDate.toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/60 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FF2C68] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#0D0C0C]/95 backdrop-blur-sm border border-[#FF2C68]/30 rounded-xl shadow-2xl z-[999999]"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-[#FF2C68]" />
                  <span>Notificações</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#FF2C68] text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-white/60" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                  
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-[#FF2C68] hover:text-[#FF2C68]/80 transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Lista de notificações */}
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-[#FF2C68]/50 ${
                        notification.read 
                          ? 'bg-[#0D0C0C]/30 border-white/10' 
                          : 'bg-[#FF2C68]/10 border-[#FF2C68]/30'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium text-sm ${
                              notification.read ? 'text-white/80' : 'text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-white/40">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                          
                          <p className={`text-xs mt-1 ${
                            notification.read ? 'text-white/60' : 'text-white/80'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#FF2C68] rounded-full mt-2" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #FF2C68 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #FF2C68;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #FF2C68;
        }
      `}</style>
    </div>
  );
}

// Hook para criar notificações facilmente
export const useCreateNotification = () => {
  const { createNotification } = useNotifications();
  
  return {
    notifyNewOrder: (orderData) => 
      createNotification('order', 'Nova Ordem de Serviço', 
        `OS ${orderData.numero} criada para ${orderData.cliente}`, 
        { route: '/ordens-servico', orderId: orderData.id }),
    
    notifyNewSale: (saleData) => 
      createNotification('sale', 'Nova Venda', 
        `Venda de R$ ${saleData.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} realizada`, 
        { route: '/vendas', saleId: saleData.id }),
    
    notifyNewClient: (clientData) => 
      createNotification('client', 'Novo Cliente', 
        `Cliente ${clientData.nome} cadastrado`, 
        { route: '/clientes', clientId: clientData.id }),
    
    notifyPaymentReceived: (paymentData) => 
      createNotification('payment', 'Pagamento Recebido', 
        `Pagamento de R$ ${paymentData.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido`, 
        { route: '/financeiro' }),
    
    notifyServiceCompleted: (serviceData) => 
      createNotification('service', 'Serviço Concluído', 
        `OS ${serviceData.numero} foi concluída`, 
        { route: '/ordens-servico', serviceId: serviceData.id }),
    
    notifySystemUpdate: (message) => 
      createNotification('system', 'Atualização do Sistema', message),
    
    notifyReminder: (title, message, data = {}) => 
      createNotification('reminder', title, message, data)
  };
};

export default NotificationPanel; 