import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Orcamento() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vendas')}
            className="p-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white hover:bg-[#0D0C0C]/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Orçamento</h1>
            <p className="text-white/60">Criar proposta comercial</p>
          </div>
        </div>
      </div>

      {/* Conteúdo em desenvolvimento */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-[#FF2C68] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Orçamento em Desenvolvimento</h2>
          <p className="text-white/60 mb-6">
            Esta funcionalidade está sendo aprimorada. Em breve você terá acesso completo ao sistema de orçamentos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-[#0D0C0C]/30 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">✅ Já Implementado</h3>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• Estrutura básica</li>
                <li>• Navegação</li>
                <li>• Interface responsiva</li>
              </ul>
            </div>
            <div className="bg-[#0D0C0C]/30 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">🚧 Em Desenvolvimento</h3>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• Seleção de produtos</li>
                <li>• Cálculos automáticos</li>
                <li>• Geração de PDF</li>
              </ul>
            </div>
            <div className="bg-[#0D0C0C]/30 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">🔮 Futuras Funcionalidades</h3>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• Envio automático</li>
                <li>• Modelos personalizados</li>
                <li>• Integração CRM</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => toast.success('Funcionalidade em desenvolvimento!')}
            className="mt-6 bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Começar Orçamento
          </button>
        </div>
      </div>
    </div>
  );
} 