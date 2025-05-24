import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Send, Phone, User, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WhatsAppModal({ isOpen, onClose, cliente, template = 'geral' }) {
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Templates de mensagem
  const templates = {
    geral: `Olá ${cliente?.nome || 'Cliente'}! 👋

Como podemos ajudá-lo hoje?

*IARA HUB* - Assistência Técnica Especializada
📱 Celulares | 💻 Notebooks | 🖥️ Desktops`,
    
    os_pronta: `🎉 *Ótima notícia!* 

Olá ${cliente?.nome || 'Cliente'}! Sua ordem de serviço está *PRONTA* para retirada! ✅

📍 Venha buscar na IARA HUB
⏰ Horário: Segunda a Sexta - 8h às 18h
🕘 Sábado: 8h às 12h

*IARA HUB* - Assistência Técnica`,
    
    orcamento: `📋 *Orçamento Pronto!*

Olá ${cliente?.nome || 'Cliente'}! Seu orçamento está pronto! 

Para consultar os valores e detalhes, entre em contato conosco.

*IARA HUB* - Assistência Técnica Especializada`,
    
    lembrete: `⏰ *Lembrete Importante*

Olá ${cliente?.nome || 'Cliente'}! 

Lembramos que você tem um equipamento para retirada na IARA HUB.

📍 Não esqueça de passar aqui para buscar!

*IARA HUB* - Assistência Técnica`,
    
    promocao: `🔥 *PROMOÇÃO ESPECIAL!*

Olá ${cliente?.nome || 'Cliente'}! 

Temos uma oferta especial só para você! 

💰 Descontos imperdíveis em:
• 📱 Troca de tela
• 🔋 Bateria
• 🔧 Serviços técnicos

*IARA HUB* - Assistência Técnica`
  };

  useState(() => {
    if (isOpen) {
      setMensagem(templates[template] || templates.geral);
    }
  }, [isOpen, template, cliente]);

  const enviarWhatsApp = () => {
    try {
      if (!cliente?.telefone) {
        toast.error('Cliente não possui telefone cadastrado');
        return;
      }

      setEnviando(true);
      
      // Formatar telefone (remover caracteres especiais)
      const telefoneFormatado = cliente.telefone.replace(/\D/g, '');
      
      // Criar URL do WhatsApp
      const mensagemCodificada = encodeURIComponent(mensagem);
      const urlWhatsApp = `https://wa.me/55${telefoneFormatado}?text=${mensagemCodificada}`;
      
      // Abrir WhatsApp
      window.open(urlWhatsApp, '_blank');
      
      toast.success('WhatsApp aberto com sucesso!');
      onClose();
      
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      toast.error('Erro ao abrir WhatsApp');
    } finally {
      setEnviando(false);
    }
  };

  const templateButtons = [
    { key: 'geral', label: 'Geral', icon: MessageCircle },
    { key: 'os_pronta', label: 'OS Pronta', icon: Clock },
    { key: 'orcamento', label: 'Orçamento', icon: Phone },
    { key: 'lembrete', label: 'Lembrete', icon: Clock },
    { key: 'promocao', label: 'Promoção', icon: MessageCircle }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68] w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#FF2C68]/30">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Enviar WhatsApp</h2>
                  <p className="text-white/60">Para: {cliente?.nome || 'Cliente'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dados do cliente */}
            <div className="p-6 border-b border-[#FF2C68]/30">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{cliente?.nome}</h3>
                  <div className="flex items-center space-x-2 text-white/60 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{cliente?.telefone || 'Telefone não informado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div className="p-6 border-b border-[#FF2C68]/30">
              <h3 className="text-white font-medium mb-3">Templates de Mensagem</h3>
              <div className="flex flex-wrap gap-2">
                {templateButtons.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMensagem(templates[key])}
                    className="px-3 py-2 bg-[#FF2C68]/20 text-[#FF2C68] rounded-lg hover:bg-[#FF2C68]/30 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de mensagem */}
            <div className="p-6">
              <label className="block text-white font-medium mb-3">Mensagem</label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors resize-none"
                placeholder="Digite sua mensagem..."
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-white/60 text-sm">
                  {mensagem.length} caracteres
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={enviarWhatsApp}
                    disabled={!mensagem.trim() || !cliente?.telefone || enviando}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center space-x-2"
                  >
                    {enviando ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{enviando ? 'Abrindo...' : 'Enviar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 