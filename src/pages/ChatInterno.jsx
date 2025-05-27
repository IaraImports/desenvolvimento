import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, Paperclip, Smile, Phone, Video, 
  MoreVertical, Search, Users, Plus, Settings, Image as ImageIcon,
  File, Mic, X, Edit, Trash2, Download, Copy, Reply, Forward,
  UserPlus, UserMinus, Crown, Shield, User, Camera, Mic as MicIcon,
  Clock, Check, CheckCheck, Volume2, VolumeX, Archive, Star,
  Heart, ThumbsUp, Laugh, AlertCircle, Info, Bell, BellOff, 
  Zap, Sparkles, Coffee, Gift, MapPin, Calendar, Music, 
  Gamepad2, BookOpen, Briefcase, Car, Home, ShoppingBag,
  Headphones, Globe, Wifi, Battery, Signal, Moon, Sun,
  Filter, Pin, Hash, AtSign, Bookmark, Share2, Eye, EyeOff,
  VolumeOff, Volume1, Volume2Icon, Maximize2, Minimize2,
  RotateCcw, Palette, Type, Bold, Italic, Underline, Code,
  Link2, Quote, List, CheckSquare, Circle, Square, Triangle
} from 'lucide-react';
import { 
  collection, addDoc, onSnapshot, query, orderBy, where, 
  updateDoc, doc, deleteDoc, getDocs, serverTimestamp, 
  limit, startAfter, getDoc
} from 'firebase/firestore';
import { 
  ref, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

// Hook para notificações desktop
const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, [permission]);

  const showNotification = useCallback((title, options = {}) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }, [permission]);

  return { showNotification, permission };
};

// Componente de Status de Mensagem PREMIUM
const MessageStatus = ({ message, isMyMessage }) => {
  if (!isMyMessage) return null;

  const getStatusInfo = () => {
    switch (message.status) {
      case 'sending':
        return { icon: Clock, color: 'text-amber-400', title: '⏱️ Enviando...' };
      case 'sent':
        return { icon: Check, color: 'text-gray-400', title: '✅ Enviado' };
      case 'delivered':
        return { icon: CheckCheck, color: 'text-blue-400', title: '📨 Entregue' };
      case 'read':
        return { icon: CheckCheck, color: 'text-green-400', title: '👁️ Lido' };
      default:
        return { icon: Clock, color: 'text-gray-400', title: '⏳ Processando' };
    }
  };

  const { icon: Icon, color, title } = getStatusInfo();

  return (
    <div className="flex items-center ml-1" title={title}>
      <Icon className={`w-3 h-3 ${color} transition-colors`} />
      {message.status === 'sending' && (
        <div className="ml-1">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Reações AVANÇADAS 🎭
const MessageReactions = ({ message, onReact, currentUserId }) => {
  const reactions = message.reactions || {};
  const reactionTypes = [
    '👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '⭐', '🎉', '💯', 
    '👏', '🙌', '💪', '🤔', '😍', '🤗', '😎', '🚀', '⚡', '💎',
    '🎯', '🏆', '💡', '☕', '🎵', '📱', '💰', '🎊', '🌟', '💝'
  ];
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleReact = (emoji) => {
    onReact(message.id, emoji);
    setShowReactionPicker(false);
  };

  const myReaction = Object.entries(reactions).find(([emoji, users]) => 
    users.includes(currentUserId)
  );

  return (
    <div className="relative">
      {/* Botão de reação */}
      <button
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        className="text-white/60 hover:text-white transition-colors p-1 rounded"
        title="Reagir"
      >
        {myReaction ? myReaction[0] : <Heart className="w-4 h-4" />}
      </button>

      {/* Picker de reações PREMIUM */}
      {showReactionPicker && (
        <motion.div
          className="absolute bottom-full left-0 mb-2 bg-gradient-to-br from-[#0D0C0C] via-purple-900/20 to-[#0D0C0C] border border-[#FF2C68]/50 rounded-2xl p-3 z-50 backdrop-blur-xl shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center mb-2">
            <Sparkles className="w-4 h-4 text-[#FF2C68] mr-2" />
            <span className="text-white/80 text-xs font-medium">Reações Rápidas</span>
          </div>
          <div className="grid grid-cols-10 gap-1 max-w-[300px]">
            {reactionTypes.map((emoji, index) => (
              <motion.button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="hover:bg-[#FF2C68]/20 p-2 rounded-lg text-lg transition-all hover:scale-110 hover:shadow-lg"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                title={`Reagir com ${emoji}`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-[#FF2C68]/20">
            <button className="text-[#FF2C68] text-xs hover:text-[#FF2C68]/80 transition-colors flex items-center">
              <Plus className="w-3 h-3 mr-1" />
              Mais reações
            </button>
          </div>
        </motion.div>
      )}

      {/* Exibir reações existentes */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(reactions).map(([emoji, users]) => (
            <span
              key={emoji}
              className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-full px-2 py-1 text-xs flex items-center space-x-1"
            >
              <span>{emoji}</span>
              <span className="text-white/60">{users.length}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de Indicador de Digitação
const TypingIndicator = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-white/60">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-[#FF2C68] rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-[#FF2C68] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-[#FF2C68] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-sm">
        {typingUsers.length === 1 
          ? `${typingUsers[0]} está digitando...`
          : `${typingUsers.length} pessoas estão digitando...`
        }
      </span>
    </div>
  );
};

// Componente principal do Chat
export default function ChatInterno() {
  const { user, userProfile } = useAuth();
  const { showNotification } = useNotifications();
  
  // Estados principais
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Estados para grupos
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Efeitos principais
  useEffect(() => {
    if (user) {
      loadUsers();
      loadConversations();
      updateUserOnlineStatus(true);
      startTypingListener();
    }

    return () => {
      if (user) {
        updateUserOnlineStatus(false);
        stopTyping();
      }
    };
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listener de digitação
  useEffect(() => {
    if (selectedConversation) {
      const typingRef = collection(db, 'typing');
      const q = query(
        typingRef,
        where('conversationId', '==', selectedConversation.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const typingData = snapshot.docs.map(doc => doc.data());
        const activeTyping = typingData
          .filter(t => t.userId !== user.uid && Date.now() - t.timestamp < 3000)
          .map(t => t.userName);
        setTypingUsers(activeTyping);
      });

      return unsubscribe;
    }
  }, [selectedConversation, user.uid]);

  // Funções de carregamento
  const loadUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData.filter(u => u.id !== user.uid));

      // Monitorar status online
      const onlineQ = query(collection(db, 'users'), where('isOnline', '==', true));
      onSnapshot(onlineQ, (snapshot) => {
        const online = new Set(snapshot.docs.map(doc => doc.id));
        setOnlineUsers(online);
      });
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadConversations = () => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    return onSnapshot(q, (snapshot) => {
      const conversationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        // Ordenar pelo timestamp da última mensagem (mais recente primeiro)
        const aTime = a.lastMessageAt?.toDate?.() || new Date(0);
        const bTime = b.lastMessageAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setConversations(conversationsData);
      setLoading(false);
    });
  };

  const loadMessages = (conversationId) => {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        // Ordenar por timestamp de criação (mais antigo primeiro)
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return aTime - bTime;
      });
      
      // Notificar sobre novas mensagens
      const newMessages = messagesData.filter(msg => 
        msg.senderId !== user.uid && 
        !messages.find(oldMsg => oldMsg.id === msg.id)
      );
      
      if (newMessages.length > 0 && messages.length > 0) {
        newMessages.forEach(msg => {
          showNotification(`Nova mensagem de ${msg.senderName}`, {
            body: msg.text || 'Arquivo enviado',
            tag: `message-${msg.id}`
          });
        });
      }

      setMessages(messagesData);
    });
  };

  // Funções de status
  const updateUserOnlineStatus = async (isOnline) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar status online:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation || !user) return;

    try {
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== user.uid && 
        msg.status !== 'read'
      );

      for (const message of unreadMessages) {
        await updateDoc(doc(db, 'messages', message.id), {
          status: 'read',
          readAt: serverTimestamp(),
          readBy: [...(message.readBy || []), user.uid]
        });
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Funções de digitação
  const startTypingListener = () => {
    const handleTyping = () => {
      if (!isTyping && selectedConversation) {
        setIsTyping(true);
        addDoc(collection(db, 'typing'), {
          conversationId: selectedConversation.id,
          userId: user.uid,
          userName: user.displayName || user.email,
          timestamp: Date.now()
        });
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, 2000);
    };

    if (messageInputRef.current) {
      messageInputRef.current.addEventListener('input', handleTyping);
    }
  };

  const stopTyping = async () => {
    if (isTyping && selectedConversation) {
      setIsTyping(false);
      
      try {
        const typingSnap = await getDocs(
          query(
            collection(db, 'typing'),
            where('userId', '==', user.uid)
          )
        );

        typingSnap.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } catch (error) {
        console.error('Erro ao parar digitação:', error);
      }
    }
  };

  // Funções de conversa
  const createConversation = async (participantId, isGroup = false, groupData = null) => {
    try {
      const conversationData = {
        participants: isGroup ? groupData.participants : [user.uid, participantId],
        isGroup,
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        settings: {
          notifications: true,
          archived: false
        }
      };

      if (isGroup) {
        conversationData.name = groupData.name;
        conversationData.description = groupData.description;
        conversationData.admins = [user.uid];
        conversationData.avatar = groupData.avatar || null;
      }

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      
      if (isGroup) {
        await sendMessage(docRef.id, `Grupo "${groupData.name}" criado`, 'system');
      }

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast.error('Erro ao criar conversa');
    }
  };

  // Função de envio de mensagem melhorada
  const sendMessage = async (conversationId = null, messageText = null, type = 'text', file = null) => {
    const targetConversationId = conversationId || selectedConversation?.id;
    const text = messageText || newMessage.trim();
    
    if (!text && !file) return;
    if (!targetConversationId) return;

    stopTyping();

    try {
      let fileData = null;
      
      if (file) {
        setUploadingFile(true);
        const fileRef = ref(storage, `chat/${targetConversationId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        fileData = {
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size
        };
      }

      const messageData = {
        conversationId: targetConversationId,
        text: text || '',
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderAvatar: user.photoURL || null,
        type,
        file: fileData,
        createdAt: serverTimestamp(),
        status: 'sending',
        edited: false,
        reactions: {},
        replyTo: replyingTo,
        readBy: [user.uid]
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Atualizar status para 'sent'
      setTimeout(async () => {
        await updateDoc(doc(db, 'messages', docRef.id), {
          status: 'sent'
        });
      }, 500);

      // Simular entrega após 1 segundo
      setTimeout(async () => {
        await updateDoc(doc(db, 'messages', docRef.id), {
          status: 'delivered'
        });
      }, 1000);

      // Atualizar última mensagem da conversa
      await updateDoc(doc(db, 'conversations', targetConversationId), {
        lastMessage: type === 'file' ? `📎 ${file?.name}` : text,
        lastMessageAt: serverTimestamp()
      });

      if (!conversationId) {
        setNewMessage('');
        setShowEmojiPicker(false);
        setReplyingTo(null);
      }
      setUploadingFile(false);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      setUploadingFile(false);
    }
  };

  // Função de reação a mensagens
  const handleReactToMessage = async (messageId, emoji) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);
      const messageData = messageSnap.data();
      
      const reactions = messageData.reactions || {};
      
      if (reactions[emoji]) {
        if (reactions[emoji].includes(user.uid)) {
          // Remover reação
          reactions[emoji] = reactions[emoji].filter(uid => uid !== user.uid);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          // Adicionar reação
          reactions[emoji].push(user.uid);
        }
      } else {
        // Nova reação
        reactions[emoji] = [user.uid];
      }

      await updateDoc(messageRef, { reactions });
    } catch (error) {
      console.error('Erro ao reagir à mensagem:', error);
    }
  };

  // Função de upload de arquivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 25MB');
      return;
    }

    if (file.type.startsWith('image/')) {
      sendMessage(null, null, 'image', file);
    } else {
      sendMessage(null, null, 'file', file);
    }
  };

  // Função para iniciar chat direto
  const startDirectChat = async (userId) => {
    const existingConversation = conversations.find(conv => 
      !conv.isGroup && 
      conv.participants.includes(userId) && 
      conv.participants.length === 2
    );

    if (existingConversation) {
      setSelectedConversation(existingConversation);
    } else {
      const conversationId = await createConversation(userId);
    }
    setShowNewChatModal(false);
  };

  // Função para criar grupo
  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Preencha o nome do grupo e selecione participantes');
      return;
    }

    try {
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        participants: [user.uid, ...selectedUsers],
        avatar: null
      };

      await createConversation(null, true, groupData);
      
      setShowGroupModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      toast.success('Grupo criado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast.error('Erro ao criar grupo');
    }
  };

  // Funções auxiliares
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Filtros
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    if (conv.isGroup) {
      return conv.name?.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const otherParticipant = users.find(u => 
        conv.participants.includes(u.id) && u.id !== user.uid
      );
      return otherParticipant?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             otherParticipant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const filteredMessages = messages.filter(msg => {
    if (!messageSearchTerm) return true;
    return msg.text?.toLowerCase().includes(messageSearchTerm.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-120px)] flex bg-[#0D0C0C] rounded-2xl border border-[#FF2C68]/30 overflow-hidden">
      {/* Sidebar - Lista de Conversas */}
      <div className="w-1/3 min-w-[320px] border-r border-[#FF2C68]/30 flex flex-col">
        {/* Header da Sidebar PREMIUM */}
        <div className="p-4 border-b border-[#FF2C68]/30 bg-gradient-to-r from-[#0D0C0C] to-purple-900/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF2C68] to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0D0C0C] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  💬 Chat Interno
                </h1>
                <p className="text-white/60 text-xs">Sistema de comunicação avançado</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <motion.button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 bg-gradient-to-br from-[#FF2C68]/20 to-purple-600/20 text-[#FF2C68] rounded-xl hover:from-[#FF2C68]/30 hover:to-purple-600/30 transition-all border border-[#FF2C68]/30"
                title="💬 Nova conversa"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => setShowGroupModal(true)}
                className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 text-blue-400 rounded-xl hover:from-blue-500/30 hover:to-cyan-600/30 transition-all border border-blue-500/30"
                title="👥 Criar grupo"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="w-4 h-4" />
              </motion.button>
              <motion.button
                className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-600/20 text-purple-400 rounded-xl hover:from-purple-500/30 hover:to-pink-600/30 transition-all border border-purple-500/30"
                title="⚙️ Configurações"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Busca */}
          {/* Busca PREMIUM */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#FF2C68] transition-colors" />
            <input
              type="text"
              placeholder="🔍 Buscar conversas, pessoas ou mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gradient-to-r from-[#0D0C0C]/50 to-purple-900/10 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none focus:ring-2 focus:ring-[#FF2C68]/20 transition-all text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF2C68]/10 to-purple-600/10 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10"></div>
          </div>

          {/* Status do usuário */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white/60 text-xs">🟢 Online agora</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-white/40 text-xs">Conectado</span>
            </div>
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8">
              <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => {
                const otherParticipant = conversation.isGroup ? null : users.find(u => 
                  conversation.participants.includes(u.id) && u.id !== user.uid
                );

                const unreadCount = messages.filter(msg => 
                  msg.conversationId === conversation.id &&
                  msg.senderId !== user.uid &&
                  msg.status !== 'read'
                ).length;

                return (
                  <motion.div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all relative ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-[#FF2C68]/20 border border-[#FF2C68]/50' 
                        : 'hover:bg-[#0D0C0C]/50'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FF2C68] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          {conversation.isGroup ? (
                            <div className="relative">
                              <Users className="w-6 h-6 text-white" />
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-[10px] text-white font-bold">{conversation.participants.length}</span>
                              </div>
                            </div>
                          ) : otherParticipant?.photoURL ? (
                            <img 
                              src={otherParticipant.photoURL} 
                              alt={otherParticipant.displayName}
                              className="w-12 h-12 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="relative">
                              <User className="w-6 h-6 text-white" />
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Status online PREMIUM */}
                        {!conversation.isGroup && onlineUsers.has(otherParticipant?.id) && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0D0C0C] flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                          </div>
                        )}
                        
                        {/* Indicador de mensagens não lidas */}
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-r from-[#FF2C68] to-pink-500 rounded-full border-2 border-[#0D0C0C] flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info da conversa */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-medium truncate">
                                {conversation.isGroup 
                                  ? `👥 ${conversation.name}` 
                                  : `💬 ${otherParticipant?.displayName || otherParticipant?.email || 'Usuário'}`
                                }
                              </h3>
                              {conversation.isGroup && conversation.admins?.includes(user.uid) && (
                                <Crown className="w-3 h-3 text-yellow-500" title="Admin do grupo" />
                              )}
                              {!conversation.isGroup && onlineUsers.has(otherParticipant?.id) && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white/40 text-xs flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(conversation.lastMessageAt)}</span>
                              </span>
                              {conversation.isGroup && (
                                <div className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded-full">
                                  {conversation.participants.length} 👥
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-white/60 text-sm truncate">
                          {conversation.lastMessage || 'Nenhuma mensagem'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Área Principal do Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-[#FF2C68]/30 flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 bg-[#FF2C68] rounded-full flex items-center justify-center">
                  {selectedConversation.isGroup ? (
                    <Users className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold truncate">
                    {selectedConversation.isGroup 
                      ? selectedConversation.name 
                      : users.find(u => 
                          selectedConversation.participants.includes(u.id) && u.id !== user.uid
                        )?.displayName || 'Usuário'
                    }
                  </h2>
                  <p className="text-white/60 text-sm">
                    {selectedConversation.isGroup 
                      ? `${selectedConversation.participants.length} participantes`
                      : typingUsers.length > 0 ? 'digitando...' : 'Online'
                    }
                  </p>
                </div>
              </div>

              {/* Busca de mensagens */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar mensagens..."
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    className="w-48 pl-10 pr-4 py-1 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors text-sm"
                  />
                </div>
                
                {/* Ações do header */}
                <button className="p-2 text-white/60 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-white/60 hover:text-white transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowConversationInfo(!showConversationInfo)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredMessages.map((message, index) => {
                const isMyMessage = message.senderId === user.uid;
                const showDate = index === 0 || 
                  formatDate(filteredMessages[index - 1]?.createdAt) !== formatDate(message.createdAt);

                return (
                  <div key={message.id}>
                    {/* Separador de data */}
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-[#0D0C0C]/50 px-3 py-1 rounded-full">
                          <span className="text-white/60 text-xs">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mensagem */}
                    <motion.div
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                        {/* Nome do remetente */}
                        {selectedConversation.isGroup && !isMyMessage && (
                          <p className="text-[#FF2C68] text-xs mb-1 px-3">
                            {message.senderName}
                          </p>
                        )}

                        <div className={`rounded-2xl px-4 py-3 relative group ${
                          isMyMessage 
                            ? 'bg-[#FF2C68] text-white' 
                            : 'bg-[#0D0C0C]/50 text-white border border-[#FF2C68]/30'
                        }`}>
                          {/* Resposta referenciada */}
                          {message.replyTo && (
                            <div className="bg-black/20 border-l-2 border-[#FF2C68] pl-3 py-2 mb-2 rounded">
                              <p className="text-white/80 text-sm">
                                {messages.find(m => m.id === message.replyTo.id)?.text || 'Mensagem original'}
                              </p>
                            </div>
                          )}

                          {/* Conteúdo da mensagem */}
                          {message.type === 'image' && message.file && (
                            <div className="mb-2">
                              <img 
                                src={message.file.url} 
                                alt={message.file.name}
                                className="max-w-full max-h-64 rounded-lg cursor-pointer"
                                onClick={() => window.open(message.file.url, '_blank')}
                              />
                            </div>
                          )}

                          {message.type === 'file' && message.file && (
                            <div className="flex items-center space-x-3 mb-2 p-2 bg-black/20 rounded-lg">
                              <File className="w-8 h-8 text-white/80" />
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">{message.file.name}</p>
                                <p className="text-white/60 text-xs">
                                  {(message.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <a 
                                href={message.file.url} 
                                download={message.file.name}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}

                          {message.text && (
                            <p className="break-words">{message.text}</p>
                          )}

                          {/* Reações */}
                          <MessageReactions 
                            message={message}
                            onReact={handleReactToMessage}
                            currentUserId={user.uid}
                          />

                          {/* Hora e status da mensagem */}
                          <div className={`flex items-center justify-between mt-2 ${
                            isMyMessage ? 'text-white/70' : 'text-white/40'
                          }`}>
                            <span className="text-xs">
                              {formatTime(message.createdAt)}
                              {message.edited && ' (editada)'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <MessageStatus message={message} isMyMessage={isMyMessage} />
                              {/* Botões de ação (aparecem no hover) */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <button
                                  onClick={() => setReplyingTo(message)}
                                  className="p-1 hover:bg-white/10 rounded"
                                  title="Responder"
                                >
                                  <Reply className="w-3 h-3" />
                                </button>
                                <button className="p-1 hover:bg-white/10 rounded" title="Encaminhar">
                                  <Forward className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              
              {/* Indicador de digitação */}
              <TypingIndicator typingUsers={typingUsers} />
              
              <div ref={messagesEndRef} />
            </div>

            {/* Área de resposta */}
            {replyingTo && (
              <div className="px-4 py-2 bg-[#FF2C68]/10 border-l-2 border-[#FF2C68] flex items-center justify-between">
                <div>
                  <p className="text-[#FF2C68] text-sm font-medium">
                    Respondendo a {replyingTo.senderName}
                  </p>
                  <p className="text-white/60 text-sm truncate">
                    {replyingTo.text || 'Arquivo'}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input de mensagem PREMIUM */}
            <div className="p-4 border-t border-[#FF2C68]/30 bg-gradient-to-r from-[#0D0C0C] to-purple-900/10">
              {/* Barra de ferramentas */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <motion.button
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                    title="📎 Anexar arquivo"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                    title="📷 Enviar imagem"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                    title="🎤 Gravar áudio"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mic className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    className="p-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all"
                    title="📍 Localização"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MapPin className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="bg-[#0D0C0C]/30 px-3 py-1 rounded-full text-white/60 text-xs flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>🟢 Conectado</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end space-x-3">

                {/* Campo de texto */}
                {/* Campo de texto PREMIUM */}
                <div className="flex-1 relative group">
                  <div className="relative">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="✍️ Digite sua mensagem aqui... (Enter para enviar)"
                      className="w-full px-4 py-4 pr-16 bg-gradient-to-r from-[#0D0C0C]/60 to-purple-900/20 border border-[#FF2C68]/30 rounded-2xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none focus:ring-2 focus:ring-[#FF2C68]/20 transition-all resize-none"
                    />
                    
                    {/* Indicador de digitação */}
                    {newMessage && (
                      <div className="absolute bottom-1 left-4">
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-[#FF2C68] rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-[#FF2C68] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-[#FF2C68] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão emoji */}
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-50">
                      <EmojiPicker
                        onEmojiClick={(emojiObject) => {
                          setNewMessage(prev => prev + emojiObject.emoji);
                          setShowEmojiPicker(false);
                          messageInputRef.current?.focus();
                        }}
                        theme="dark"
                        width={300}
                        height={400}
                      />
                    </div>
                  )}
                </div>

                {/* Botão enviar PREMIUM */}
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim() && !uploadingFile}
                  className={`p-3 rounded-xl font-medium transition-all duration-300 ${
                    newMessage.trim() 
                      ? 'bg-gradient-to-r from-[#FF2C68] to-pink-600 hover:from-[#FF2C68]/80 hover:to-pink-600/80 text-white shadow-lg shadow-[#FF2C68]/25' 
                      : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  }`}
                  title={newMessage.trim() ? '🚀 Enviar mensagem' : '📝 Digite algo primeiro'}
                  whileHover={newMessage.trim() ? { scale: 1.05, rotate: 2 } : {}}
                  whileTap={newMessage.trim() ? { scale: 0.95 } : {}}
                >
                  {uploadingFile ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : newMessage.trim() ? (
                    <div className="flex items-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span className="text-sm">Enviar</span>
                    </div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Input de arquivo (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            />
          </>
        ) : (
          /* Estado inicial */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Sistema de Chat Interno</h2>
              <p className="text-white/60">Selecione uma conversa para começar a comunicação</p>
            </div>
          </div>
        )}
      </div>

      {/* Painel de informações da conversa */}
      {showConversationInfo && selectedConversation && (
        <div className="w-80 border-l border-[#FF2C68]/30 bg-[#0D0C0C] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Informações</h3>
            <button
              onClick={() => setShowConversationInfo(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Info básica */}
            <div className="text-center">
              <div className="w-20 h-20 bg-[#FF2C68] rounded-full flex items-center justify-center mx-auto mb-4">
                {selectedConversation.isGroup ? (
                  <Users className="w-10 h-10 text-white" />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              <h4 className="text-white font-semibold text-lg">
                {selectedConversation.isGroup 
                  ? selectedConversation.name 
                  : users.find(u => 
                      selectedConversation.participants.includes(u.id) && u.id !== user.uid
                    )?.displayName || 'Usuário'
                }
              </h4>
              {selectedConversation.description && (
                <p className="text-white/60 text-sm mt-2">{selectedConversation.description}</p>
              )}
            </div>

            {/* Participantes do grupo */}
            {selectedConversation.isGroup && (
              <div>
                <h5 className="text-white font-medium mb-2">
                  Participantes ({selectedConversation.participants.length})
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedConversation.participants.map(participantId => {
                    const participant = users.find(u => u.id === participantId) || 
                      (participantId === user.uid ? user : null);
                    
                    return (
                      <div key={participantId} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#FF2C68] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {participant?.displayName || participant?.email || 'Usuário'}
                            {participantId === user.uid && ' (Você)'}
                          </p>
                          {selectedConversation.admins?.includes(participantId) && (
                            <p className="text-[#FF2C68] text-xs">Admin</p>
                          )}
                        </div>
                        {onlineUsers.has(participantId) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-2">
              <button className="w-full p-3 bg-[#0D0C0C]/50 text-white rounded-lg hover:bg-[#0D0C0C]/70 transition-colors flex items-center space-x-3">
                <Bell className="w-5 h-5" />
                <span>Notificações</span>
              </button>
              
              <button className="w-full p-3 bg-[#0D0C0C]/50 text-white rounded-lg hover:bg-[#0D0C0C]/70 transition-colors flex items-center space-x-3">
                <Archive className="w-5 h-5" />
                <span>Arquivar conversa</span>
              </button>

              {selectedConversation.isGroup && selectedConversation.admins?.includes(user.uid) && (
                <>
                  <button className="w-full p-3 bg-[#0D0C0C]/50 text-white rounded-lg hover:bg-[#0D0C0C]/70 transition-colors flex items-center space-x-3">
                    <UserPlus className="w-5 h-5" />
                    <span>Adicionar participante</span>
                  </button>
                  
                  <button className="w-full p-3 bg-[#0D0C0C]/50 text-white rounded-lg hover:bg-[#0D0C0C]/70 transition-colors flex items-center space-x-3">
                    <Settings className="w-5 h-5" />
                    <span>Configurações do grupo</span>
                  </button>
                </>
              )}

              <button className="w-full p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-3">
                <Trash2 className="w-5 h-5" />
                <span>Excluir conversa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Conversa */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68] p-6 w-full max-w-md max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Nova Conversa</h2>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {users.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => startDirectChat(usr.id)}
                    className="flex items-center space-x-3 p-3 hover:bg-[#0D0C0C]/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-[#FF2C68] rounded-full flex items-center justify-center">
                        {usr.photoURL ? (
                          <img 
                            src={usr.photoURL} 
                            alt={usr.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      {onlineUsers.has(usr.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-[#0D0C0C]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{usr.displayName || usr.email}</p>
                      <p className="text-white/60 text-sm">{usr.email}</p>
                      {onlineUsers.has(usr.id) && (
                        <p className="text-green-400 text-xs">Online</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Criar Grupo */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68] p-6 w-full max-w-lg max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Criar Grupo</h2>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Nome do Grupo *</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Digite o nome do grupo"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Descrição</label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors resize-none"
                    placeholder="Descrição opcional do grupo"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Participantes ({selectedUsers.length} selecionados)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {users.map((usr) => (
                      <label
                        key={usr.id}
                        className="flex items-center space-x-3 p-2 hover:bg-[#0D0C0C]/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(usr.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, usr.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== usr.id));
                            }
                          }}
                          className="rounded border-[#FF2C68]/30 text-[#FF2C68] focus:ring-[#FF2C68]"
                        />
                        <div className="relative">
                          <div className="w-8 h-8 bg-[#FF2C68] rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          {onlineUsers.has(usr.id) && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#0D0C0C]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{usr.displayName || usr.email}</p>
                          {onlineUsers.has(usr.id) && (
                            <p className="text-green-400 text-xs">Online</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowGroupModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createGroup}
                    disabled={!groupName.trim() || selectedUsers.length === 0}
                    className="flex-1 px-4 py-3 bg-[#FF2C68] hover:bg-[#FF2C68]/80 disabled:bg-gray-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Criar Grupo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 