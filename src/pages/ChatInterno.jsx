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
  
  // Estados para novas funcionalidades
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileCaption, setFileCaption] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video'); // 'video' ou 'audio'
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  
  // Estados mobile
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Estados para grupos
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      }))
      .filter(conv => !conv.deleted) // Filtrar conversas deletadas
      .sort((a, b) => {
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

  // 📎 Função de upload de arquivo com preview
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('📁 Arquivo muito grande. Máximo 25MB');
      return;
    }

    setSelectedFile(file);
    setShowFilePreview(true);
    setFileCaption('');
  };

  // 📤 Enviar arquivo com legenda
  const sendFileWithCaption = async () => {
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      const type = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      
      // Upload do arquivo
      const fileRef = ref(storage, `chat/${selectedConversation.id}/${Date.now()}_${selectedFile.name}`);
      const snapshot = await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const fileData = {
        name: selectedFile.name,
        url: downloadURL,
        type: selectedFile.type,
        size: selectedFile.size
      };

      const messageData = {
        conversationId: selectedConversation.id,
        text: fileCaption.trim() || (type === 'image' ? '🖼️ Imagem' : '📁 Arquivo'),
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

      // Atualizar última mensagem da conversa
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: fileCaption.trim() || (type === 'image' ? '🖼️ Imagem' : `📁 ${selectedFile.name}`),
        lastMessageAt: serverTimestamp()
      });

      setShowFilePreview(false);
      setSelectedFile(null);
      setFileCaption('');
      setReplyingTo(null);
      setUploadingFile(false);
      toast.success('📤 Arquivo enviado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('❌ Erro ao enviar arquivo');
      setUploadingFile(false);
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

  // 🗑️ Função para deletar conversa
  const deleteConversation = async (conversationId) => {
    if (!window.confirm('❌ Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: user.uid
      });
      
      setSelectedConversation(null);
      toast.success('🗑️ Conversa excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      toast.error('❌ Erro ao excluir conversa');
    }
  };

  // 📁 Função para arquivar conversa
  const archiveConversation = async (conversationId) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedBy: user.uid
      });
      
      toast.success('📁 Conversa arquivada com sucesso!');
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error);
      toast.error('❌ Erro ao arquivar conversa');
    }
  };

  // 🔔 Função para toggle de notificações
  const toggleNotifications = async (conversationId) => {
    try {
      const newStatus = !notificationsEnabled;
      setNotificationsEnabled(newStatus);
      
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`notifications.${user.uid}`]: newStatus
      });
      
      toast.success(newStatus ? '🔔 Notificações ativadas!' : '🔕 Notificações desativadas!');
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
      toast.error('❌ Erro ao atualizar notificações');
    }
  };

  // 🎤 Função para gravar áudio CORRIGIDA
  const [audioStream, setAudioStream] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTimer, setRecordingTimer] = useState(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Criar um objeto File-like sem usar constructor File
        const audioFile = {
          name: `audio_${Date.now()}.webm`,
          type: 'audio/webm',
          size: audioBlob.size,
          blob: audioBlob
        };
        
        setIsRecordingAudio(false);
        setRecordingTime(0);
        setAudioStream(null);
        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop());
        
        // Enviar o áudio
        await sendAudioMessage(audioFile);
      };

      setAudioRecorder(recorder);
      setAudioStream(stream);
      setAudioChunks(chunks);
      setIsRecordingAudio(true);
      recorder.start();

      // Timer para gravação
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

      toast.success('🎤 Gravação iniciada! Clique novamente para parar e enviar.');

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('❌ Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorder && audioRecorder.state === 'recording') {
      audioRecorder.stop();
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      toast.success('🎵 Áudio enviado com sucesso!');
    }
  };

  const cancelAudioRecording = () => {
    if (audioRecorder && audioRecorder.state === 'recording') {
      audioRecorder.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    
    setIsRecordingAudio(false);
    setRecordingTime(0);
    setAudioStream(null);
    setAudioChunks([]);
    setAudioRecorder(null);
    toast.info('🚫 Gravação cancelada');
  };

  // Função para enviar áudio
  const sendAudioMessage = async (audioFile) => {
    try {
      setUploadingFile(true);
      const fileRef = ref(storage, `chat/${selectedConversation.id}/audio_${Date.now()}.webm`);
      const snapshot = await uploadBytes(fileRef, audioFile.blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const fileData = {
        name: audioFile.name,
        url: downloadURL,
        type: audioFile.type,
        size: audioFile.size
      };

      const messageData = {
        conversationId: selectedConversation.id,
        text: '🎤 Mensagem de áudio',
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderAvatar: user.photoURL || null,
        type: 'audio',
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

      // Atualizar última mensagem da conversa
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: '🎤 Mensagem de áudio',
        lastMessageAt: serverTimestamp()
      });

      setUploadingFile(false);
      
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      toast.error('❌ Erro ao enviar áudio');
      setUploadingFile(false);
    }
  };

  // 📞 Funções de chamada
  const startCall = (type) => {
    setCallType(type);
    setShowCallModal(true);
    toast.success(`📞 Iniciando chamada de ${type === 'video' ? 'vídeo' : 'áudio'}...`);
  };

  // 📍 Função para enviar localização
  const sendLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('❌ Geolocalização não suportada pelo navegador');
      return;
    }

    toast.loading('📍 Obtendo localização...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationText = `📍 Localização compartilhada\n🌐 Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
        const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
        
        try {
          await sendMessage(null, `${locationText}\n🗺️ Ver no mapa: ${mapsUrl}`, 'location');
          toast.success('📍 Localização enviada!');
        } catch (error) {
          toast.error('❌ Erro ao enviar localização');
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        toast.error('❌ Erro ao obter localização. Verifique as permissões.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // 📷 Função para abrir câmera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setCameraStream(stream);
      setShowCameraModal(true);
      toast.success('📷 Câmera ativada!');
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      toast.error('❌ Erro ao acessar câmera. Verifique as permissões.');
    }
  };

  // 📸 Função para tirar foto
  const takePhoto = () => {
    if (!cameraStream) return;

    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const photoFile = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Fechar câmera
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setShowCameraModal(false);
      
      // Abrir preview da foto
      setSelectedFile(photoFile);
      setShowFilePreview(true);
      setFileCaption('');
      
      toast.success('📸 Foto capturada!');
    }, 'image/jpeg', 0.9);
  };

  // ❌ Fechar câmera
  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
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
    <div className="h-[calc(100vh-120px)] flex bg-[#0D0C0C] rounded-2xl border border-[#FF2C68]/30 overflow-hidden chat-container">
      {/* Botão Menu Mobile */}
      {isMobile && (
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="mobile-menu-btn"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Overlay Mobile */}
      {isMobile && showMobileSidebar && (
        <div
          className="mobile-overlay active"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar - Lista de Conversas */}
      <div className={`w-1/3 min-w-[320px] border-r border-[#FF2C68]/30 flex flex-col chat-sidebar ${
        isMobile ? (showMobileSidebar ? 'mobile-active' : '') : ''
      }`}>
        {/* Header da Sidebar PREMIUM */}
        <div className="p-4 border-b border-[#FF2C68]/30 bg-gradient-to-r from-[#0D0C0C] to-purple-900/10">
          <div className="flex items-center justify-between mb-4">
            {/* Botão fechar mobile */}
            {isMobile && (
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 text-white/60 hover:text-white transition-colors md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
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
                 onClick={() => setShowConfigModal(true)}
                 className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-600/20 text-purple-400 rounded-xl hover:from-purple-500/30 hover:to-pink-600/30 transition-all border border-purple-500/30"
                 title="⚙️ Configurações do Chat"
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
      <div className="flex-1 flex flex-col min-w-0 chat-main">
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-[#FF2C68]/30 flex items-center justify-between chat-header">
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
                {/* Ações do header FUNCIONAIS */}
                <motion.button 
                  onClick={() => startCall('audio')}
                  className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                  title="📞 Chamada de áudio"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Phone className="w-5 h-5" />
                </motion.button>
                <motion.button 
                  onClick={() => startCall('video')}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                  title="📹 Chamada de vídeo"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Video className="w-5 h-5" />
                </motion.button>
                <motion.button 
                  onClick={() => setShowConversationInfo(!showConversationInfo)}
                  className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                  title="ℹ️ Informações da conversa"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Info className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
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

                        <div className={`rounded-2xl px-4 py-3 relative group message-bubble ${
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

                          {message.type === 'audio' && message.file && (
                            <div className="flex items-center space-x-3 mb-2 p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/30">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <Headphones className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm flex items-center space-x-2">
                                  <span>🎤 Mensagem de Áudio</span>
                                </p>
                                <audio 
                                  controls 
                                  className="w-full mt-2 rounded-lg"
                                  style={{ 
                                    filter: 'hue-rotate(300deg) contrast(1.2)',
                                    height: '40px'
                                  }}
                                  preload="metadata"
                                >
                                  <source src={message.file.url} type="audio/webm" />
                                  <source src={message.file.url} type="audio/wav" />
                                  <source src={message.file.url} type="audio/mp3" />
                                  <p className="text-white/60 text-xs">
                                    🔊 Seu navegador não suporta reprodução de áudio.
                                  </p>
                                </audio>
                                <div className="text-white/40 text-xs mt-1 flex items-center justify-between">
                                  <span>💾 {(message.file.size / 1024).toFixed(1)} KB</span>
                                  <span>🎵 Mensagem de voz</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {message.type === 'file' && message.file && (
                            <div className="flex items-center space-x-3 mb-2 p-2 bg-black/20 rounded-lg">
                              <File className="w-8 h-8 text-white/80" />
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">{message.file.name}</p>
                                <p className="text-white/60 text-xs">
                                  📁 {(message.file.size / 1024 / 1024).toFixed(2)} MB
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
            <div className="p-4 border-t border-[#FF2C68]/30 bg-gradient-to-r from-[#0D0C0C] to-purple-900/10 message-input-container">
              {/* Barra de ferramentas */}
              <div className="flex items-center justify-between mb-3 message-input-toolbar">
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
                    onClick={openCamera}
                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                    title="📷 Tirar foto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera className="w-4 h-4" />
                  </motion.button>
                  
                  {/* Botão de áudio com controles avançados */}
                  {!isRecordingAudio ? (
                    <motion.button
                      onClick={startAudioRecording}
                      className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                      title="🎤 Gravar mensagem de áudio"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Mic className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={stopAudioRecording}
                        className="p-2 bg-green-500/30 text-green-400 rounded-lg hover:bg-green-500/40 transition-all"
                        title="✅ Parar e enviar áudio"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                      
                      <div className="bg-red-500/20 px-3 py-2 rounded-lg border border-red-500/30">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                          <span className="text-red-400 text-xs font-medium">
                            🔴 REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={cancelAudioRecording}
                        className="p-2 bg-red-500/30 text-red-400 rounded-lg hover:bg-red-500/40 transition-all"
                        title="❌ Cancelar gravação"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                  
                  <motion.button
                    onClick={sendLocation}
                    className="p-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all"
                    title="📍 Enviar localização"
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
                      className="w-full px-4 py-4 pr-16 bg-gradient-to-r from-[#0D0C0C]/60 to-purple-900/20 border border-[#FF2C68]/30 rounded-2xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none focus:ring-2 focus:ring-[#FF2C68]/20 transition-all resize-none message-input-field"
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
            {/* Ações FUNCIONAIS */}
            <div className="space-y-2">
              <motion.button 
                onClick={() => toggleNotifications(selectedConversation.id)}
                className={`w-full p-3 rounded-lg transition-all flex items-center space-x-3 ${
                  notificationsEnabled 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                <span>{notificationsEnabled ? '🔔 Notificações Ativas' : '🔕 Notificações Desativadas'}</span>
              </motion.button>
              
              <motion.button 
                onClick={() => archiveConversation(selectedConversation.id)}
                className="w-full p-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all flex items-center space-x-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Archive className="w-5 h-5" />
                <span>📁 Arquivar conversa</span>
              </motion.button>

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

              <motion.button 
                onClick={() => deleteConversation(selectedConversation.id)}
                className="w-full p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center space-x-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-5 h-5" />
                <span>🗑️ Excluir conversa</span>
              </motion.button>
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

      {/* Modal de Preview de Arquivo */}
      <AnimatePresence>
        {showFilePreview && selectedFile && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-[#0D0C0C] to-purple-900/20 rounded-2xl border border-[#FF2C68]/50 p-6 w-full max-w-lg shadow-2xl modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Paperclip className="w-5 h-5 text-[#FF2C68]" />
                  <span>📎 Enviar Arquivo</span>
                </h2>
                <button
                  onClick={() => setShowFilePreview(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview do arquivo */}
              <div className="mb-6">
                {selectedFile.type.startsWith('image/') ? (
                  <div className="relative">
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-xl border border-[#FF2C68]/30"
                    />
                    <div className="absolute top-2 right-2 bg-[#0D0C0C]/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <span className="text-white/80 text-xs">🖼️ Imagem</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-6 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
                      <File className="w-6 h-6 text-[#FF2C68]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-white/60 text-sm">
                        📁 {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Campo de legenda */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  📝 Adicionar uma mensagem (opcional)
                </label>
                <textarea
                  value={fileCaption}
                  onChange={(e) => setFileCaption(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none focus:ring-2 focus:ring-[#FF2C68]/20 transition-all resize-none"
                  placeholder="💬 Digite uma mensagem para acompanhar o arquivo..."
                  rows="3"
                />
              </div>

              {/* Botões de ação */}
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setShowFilePreview(false)}
                  className="flex-1 px-4 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ❌ Cancelar
                </motion.button>
                <motion.button
                  onClick={sendFileWithCaption}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF2C68] to-pink-600 hover:from-[#FF2C68]/80 hover:to-pink-600/80 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#FF2C68]/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🚀 Enviar Arquivo
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Chamada */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-[#0D0C0C] to-purple-900/20 rounded-2xl border border-[#FF2C68]/50 p-8 w-full max-w-md text-center shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF2C68] to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                {callType === 'video' ? (
                  <Video className="w-10 h-10 text-white" />
                ) : (
                  <Phone className="w-10 h-10 text-white" />
                )}
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                {callType === 'video' ? '📹 Chamada de Vídeo' : '📞 Chamada de Áudio'}
              </h2>
              
              <p className="text-white/60 mb-6">
                Iniciando chamada com {selectedConversation?.isGroup 
                  ? selectedConversation.name 
                  : users.find(u => 
                      selectedConversation?.participants.includes(u.id) && u.id !== user.uid
                    )?.displayName || 'Usuário'
                }...
              </p>

              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-3 h-3 bg-[#FF2C68] rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-[#FF2C68] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-[#FF2C68] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setShowCallModal(false)}
                  className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ❌ Cancelar
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowCallModal(false);
                    toast.success(`📞 Chamada de ${callType} conectada!`);
                  }}
                  className="flex-1 px-4 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ✅ Conectar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal da Câmera */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/95 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-[#0D0C0C] to-purple-900/20 rounded-2xl border border-[#FF2C68]/50 p-6 w-full max-w-lg shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-[#FF2C68]" />
                  <span>📷 Câmera</span>
                </h2>
                <button
                  onClick={closeCamera}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview da câmera */}
              <div className="relative mb-6">
                <video
                  id="camera-preview"
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl border border-[#FF2C68]/30"
                  ref={(video) => {
                    if (video && cameraStream) {
                      video.srcObject = cameraStream;
                    }
                  }}
                />
                <div className="absolute top-2 left-2 bg-[#0D0C0C]/80 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <span className="text-white/80 text-xs">📹 Ao vivo</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex space-x-3">
                <motion.button
                  onClick={closeCamera}
                  className="flex-1 px-4 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ❌ Cancelar
                </motion.button>
                <motion.button
                  onClick={takePhoto}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF2C68] to-pink-600 hover:from-[#FF2C68]/80 hover:to-pink-600/80 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#FF2C68]/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📸 Tirar Foto
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Configurações */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-[#0D0C0C] to-purple-900/20 rounded-2xl border border-[#FF2C68]/50 p-6 w-full max-w-md shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-[#FF2C68]" />
                  <span>⚙️ Configurações</span>
                </h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Configurações de notificação */}
                <div className="p-4 bg-[#0D0C0C]/30 rounded-xl border border-[#FF2C68]/20">
                  <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-[#FF2C68]" />
                    <span>🔔 Notificações</span>
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Sons de notificação</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Notificações desktop</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>

                {/* Configurações de privacidade */}
                <div className="p-4 bg-[#0D0C0C]/30 rounded-xl border border-[#FF2C68]/20">
                  <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-[#FF2C68]" />
                    <span>🔒 Privacidade</span>
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Mostrar "visto por último"</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Confirmação de leitura</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>

                {/* Configurações de tema */}
                <div className="p-4 bg-[#0D0C0C]/30 rounded-xl border border-[#FF2C68]/20">
                  <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-[#FF2C68]" />
                    <span>🎨 Aparência</span>
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Modo escuro</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Animações</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <motion.button
                  onClick={() => {
                    setShowConfigModal(false);
                    toast.success('⚙️ Configurações salvas!');
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#FF2C68] to-pink-600 hover:from-[#FF2C68]/80 hover:to-pink-600/80 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#FF2C68]/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💾 Salvar Configurações
                </motion.button>
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