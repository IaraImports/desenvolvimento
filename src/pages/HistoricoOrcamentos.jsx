import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Eye,
  Download,
  Search,
  Calendar,
  DollarSign,
  User,
  Package,
  Wrench,
  Clock,
  Filter,
  Trash2,
  Edit,
  Copy
} from 'lucide-react';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function HistoricoOrcamentos() {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [showPreview, setShowPreview] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);

  useEffect(() => {
    loadOrcamentos();
  }, []);

  const loadOrcamentos = async () => {
    try {
      setLoading(true);
      console.log('📋 HISTÓRICO: Carregando orçamentos...');
      
      let querySnapshot;
      try {
        const q = query(collection(db, 'orcamentos'), orderBy('createdAt', 'desc'));
        querySnapshot = await getDocs(q);
        console.log('📊 HISTÓRICO: Snapshot com orderBy:', querySnapshot.size, 'documentos');
      } catch (indexError) {
        console.warn('⚠️ HISTÓRICO: Erro com orderBy, usando consulta simples:', indexError);
        querySnapshot = await getDocs(collection(db, 'orcamentos'));
        console.log('📊 HISTÓRICO: Snapshot simples:', querySnapshot.size, 'documentos');
      }
      
      const orcamentosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        validoAte: doc.data().validoAte?.toDate?.() || new Date(doc.data().validoAte)
      }));
      
      // Ordenar por data (mais recente primeiro) se não conseguiu usar orderBy
      orcamentosData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('✅ HISTÓRICO: Orçamentos carregados:', orcamentosData.length);
      setOrcamentos(orcamentosData);
    } catch (error) {
      console.error('❌ HISTÓRICO: Erro ao carregar orçamentos:', error);
      toast.error('Erro ao carregar histórico de orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrcamentos = orcamentos.filter(orcamento => {
    const matchSearch = 
      orcamento.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orcamento.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orcamento.cliente?.empresa?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || orcamento.status === filtroStatus;
    
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500';
      case 'aprovado': return 'bg-green-500';
      case 'rejeitado': return 'bg-red-500';
      case 'expirado': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'expirado': return 'Expirado';
      default: return 'Desconhecido';
    }
  };

  const isOrcamentoExpirado = (validoAte) => {
    return validoAte && new Date() > new Date(validoAte);
  };

  const duplicarOrcamento = (orcamento) => {
    // Navegar para a página de orçamento com os dados preenchidos
    navigate('/orcamento', { 
      state: { 
        orcamentoBase: {
          ...orcamento,
          numero: `ORC-${Date.now()}`, // Novo número
          status: 'pendente',
          createdAt: null,
          validoAte: null
        }
      }
    });
    toast.success('Orçamento duplicado! Edite os dados conforme necessário.');
  };

  const deletarOrcamento = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
    
    try {
      await deleteDoc(doc(db, 'orcamentos', id));
      toast.success('Orçamento excluído com sucesso!');
      loadOrcamentos(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast.error('Erro ao excluir orçamento');
    }
  };

  // Função para gerar PDF do orçamento
  const downloadOrcamentoPDF = async (orcamento) => {
    try {
      toast.loading('Gerando PDF do orçamento...');
      
      // Importar dinamicamente as bibliotecas
      const jsPDF = (await import('jspdf')).default;
      
      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configurações
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const lineHeight = 7;
      let currentY = margin;

      // Função para adicionar nova página se necessário
      const checkPageBreak = (neededHeight) => {
        if (currentY + neededHeight > 280) {
          pdf.addPage();
          currentY = margin;
        }
      };

      // Resetar cor do texto para preto
      pdf.setTextColor(0, 0, 0);

      // Cabeçalho com Logo
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text('ORÇAMENTO', margin, currentY);
      
      // Logo IARA HUB
      pdf.setFillColor(255, 44, 104); // Cor principal #FF2C68
      pdf.rect(pageWidth - margin - 25, currentY - 10, 20, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('IARA', pageWidth - margin - 20, currentY - 2);
      
      pdf.setTextColor(255, 44, 104); // Cor #FF2C68
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text('IARA HUB', pageWidth - margin - 40, currentY + 15);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text('Assistência Técnica Especializada', pageWidth - margin - 60, currentY + 22);

      currentY += 35;

      // Resetar cor para preto
      pdf.setTextColor(0, 0, 0);

      // Número do Orçamento
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Orçamento Nº: ${orcamento.numero}`, margin, currentY);
      currentY += 10;

      // Data e Status
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Data: ${orcamento.createdAt?.toLocaleDateString('pt-BR')}`, margin, currentY);
      pdf.text(`Status: ${getStatusText(orcamento.status)}`, pageWidth - margin - 50, currentY);
      currentY += 15;

      // Dados do Cliente
      checkPageBreak(25);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text('DADOS DO CLIENTE', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Nome: ${orcamento.cliente?.nome || 'N/A'}`, margin, currentY);
      currentY += lineHeight;
      if (orcamento.cliente?.telefone) {
        pdf.text(`Telefone: ${orcamento.cliente.telefone}`, margin, currentY);
        currentY += lineHeight;
      }
      if (orcamento.cliente?.email) {
        pdf.text(`Email: ${orcamento.cliente.email}`, margin, currentY);
        currentY += lineHeight;
      }
      if (orcamento.cliente?.empresa) {
        pdf.text(`Empresa: ${orcamento.cliente.empresa}`, margin, currentY);
        currentY += lineHeight;
      }
      currentY += 10;

      // Itens do Orçamento
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text('ITENS DO ORÇAMENTO', margin, currentY);
      currentY += 8;
      
      // Cabeçalho da tabela
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text('Item', margin, currentY);
      pdf.text('Qtd', margin + 100, currentY);
      pdf.text('Valor Unit.', margin + 125, currentY);
      pdf.text('Total', margin + 155, currentY);
      currentY += 5;
      
      // Linha separadora
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 5;
      
      pdf.setFont("helvetica", "normal");
      
      if (orcamento.itens && orcamento.itens.length > 0) {
        orcamento.itens.forEach((item) => {
          checkPageBreak(10);
          
          const nomeItem = pdf.splitTextToSize(item.nome || 'Item', 95);
          pdf.text(nomeItem, margin, currentY);
          pdf.text(item.quantidade?.toString() || '1', margin + 100, currentY);
          pdf.text(`R$ ${(item.valorUnitario || 0).toFixed(2)}`, margin + 125, currentY);
          pdf.text(`R$ ${(item.valorTotal || 0).toFixed(2)}`, margin + 155, currentY);
          
          currentY += lineHeight * Math.max(1, nomeItem.length);
        });
      } else {
        pdf.text('Nenhum item registrado', margin, currentY);
        currentY += lineHeight;
      }
      
      currentY += 10;

      // Totais
      checkPageBreak(30);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      if (orcamento.subtotal && orcamento.subtotal !== orcamento.total) {
        pdf.text(`Subtotal: R$ ${(orcamento.subtotal || 0).toFixed(2)}`, margin + 100, currentY);
        currentY += lineHeight;
      }
      
      if (orcamento.desconto && orcamento.desconto > 0) {
        pdf.text(`Desconto: R$ ${(orcamento.desconto || 0).toFixed(2)}`, margin + 100, currentY);
        currentY += lineHeight;
      }
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`TOTAL: R$ ${(orcamento.total || 0).toFixed(2)}`, margin + 100, currentY);
      currentY += 20;

      // Validade
      checkPageBreak(25);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text('VALIDADE', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Válido até: ${orcamento.validoAte?.toLocaleDateString('pt-BR')}`, margin, currentY);
      currentY += lineHeight;
      
      if (isOrcamentoExpirado(orcamento.validoAte)) {
        pdf.setTextColor(255, 0, 0);
        pdf.text('⚠️ Este orçamento está EXPIRADO', margin, currentY);
        pdf.setTextColor(0, 0, 0);
        currentY += lineHeight;
      }
      currentY += 10;

      // Observações
      if (orcamento.observacoes) {
        checkPageBreak(25);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text('OBSERVAÇÕES', margin, currentY);
        currentY += 8;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const obsText = pdf.splitTextToSize(orcamento.observacoes, pageWidth - 2 * margin);
        pdf.text(obsText, margin, currentY);
        currentY += obsText.length * lineHeight + 10;
      }

      // Rodapé
      currentY = Math.max(currentY, 250);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text('IARA HUB - Assistência Técnica Especializada', margin, currentY);
      pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, currentY + 5);

      // Baixar o PDF
      const nomeArquivo = `Orcamento_${orcamento.numero}_${orcamento.cliente?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'cliente'}.pdf`;
      pdf.save(nomeArquivo);
      
      toast.dismiss();
      toast.success('PDF do orçamento gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF do orçamento:', error);
      toast.dismiss();
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const PreviewOrcamento = ({ orcamento }) => (
    <div className="max-w-4xl mx-auto bg-white text-black p-8">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ORÇAMENTO</h1>
            <p className="text-lg text-gray-600">Nº {orcamento.numero}</p>
            <p className="text-sm text-gray-500">
              Status: <span className={`px-2 py-1 rounded text-white text-xs ${getStatusColor(orcamento.status)}`}>
                {getStatusText(orcamento.status)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-pink-600">IARA HUB</h2>
            <p className="text-gray-600">Sistema de Gestão</p>
            <p className="text-sm text-gray-500">{orcamento.createdAt?.toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">DADOS DO CLIENTE</h3>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <p><strong>Nome:</strong> {orcamento.cliente?.nome}</p>
            <p><strong>Email:</strong> {orcamento.cliente?.email || 'Não informado'}</p>
            <p><strong>Telefone:</strong> {orcamento.cliente?.telefone || 'Não informado'}</p>
          </div>
          <div>
            <p><strong>Empresa:</strong> {orcamento.cliente?.empresa || 'Não informado'}</p>
            <p><strong>Endereço:</strong> {orcamento.cliente?.endereco || 'Não informado'}</p>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">ITENS DO ORÇAMENTO</h3>
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left">Item</th>
              <th className="border border-gray-300 p-2 text-center">Qtd</th>
              <th className="border border-gray-300 p-2 text-right">Valor Unit.</th>
              <th className="border border-gray-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itens?.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    {item.tipo === 'servico' && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">SERVIÇO</span>
                    )}
                    <span>{item.nome}</span>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center">{item.quantidade}</td>
                <td className="border border-gray-300 p-2 text-right">
                  R$ {item.valorUnitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  R$ {item.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="mb-6">
        <div className="ml-auto w-64">
          <div className="border border-gray-300">
            <div className="flex justify-between p-2 border-b border-gray-300">
              <span>Subtotal:</span>
              <span>R$ {orcamento.subtotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {orcamento.desconto > 0 && (
              <div className="flex justify-between p-2 border-b border-gray-300 text-red-600">
                <span>Desconto:</span>
                <span>- R$ {orcamento.desconto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between p-2 bg-gray-100 font-bold text-lg">
              <span>Total:</span>
              <span>R$ {orcamento.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observações */}
      {orcamento.observacoes && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">OBSERVAÇÕES</h3>
          <p className="bg-gray-50 p-4 rounded">{orcamento.observacoes}</p>
        </div>
      )}

      {/* Validade */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">VALIDADE</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p>Válido até: <strong>{orcamento.validoAte?.toLocaleDateString('pt-BR')}</strong></p>
          {isOrcamentoExpirado(orcamento.validoAte) && (
            <p className="text-red-600 font-bold mt-2">⚠️ Este orçamento está EXPIRADO</p>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-600">
        <p>IARA HUB - Sistema de Gestão Comercial</p>
      </div>
    </div>
  );

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
            <h1 className="text-3xl font-bold text-white">Histórico de Orçamentos</h1>
            <p className="text-white/60">Visualizar e gerenciar orçamentos salvos</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/orcamento')}
            className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-white/60">Total: {filteredOrcamentos.length} orçamentos</span>
          </div>
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-white/30 border-t-[#FF2C68] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Carregando orçamentos...</p>
          </div>
        ) : filteredOrcamentos.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">
              {searchTerm || filtroStatus !== 'todos' 
                ? 'Nenhum orçamento encontrado com os filtros aplicados' 
                : 'Nenhum orçamento encontrado'}
            </p>
            <button
              onClick={() => navigate('/orcamento')}
              className="mt-4 bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Criar Primeiro Orçamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrcamentos.map((orcamento) => (
              <div
                key={orcamento.id}
                className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10 hover:border-[#FF2C68]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#FF2C68]" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-bold">{orcamento.numero}</h3>
                        <span className={`px-2 py-1 rounded text-white text-xs ${getStatusColor(orcamento.status)}`}>
                          {getStatusText(orcamento.status)}
                        </span>
                        {isOrcamentoExpirado(orcamento.validoAte) && (
                          <span className="px-2 py-1 rounded bg-red-500 text-white text-xs">
                            EXPIRADO
                          </span>
                        )}
                      </div>
                      <p className="text-white/80 font-medium">{orcamento.cliente?.nome}</p>
                      {orcamento.cliente?.empresa && (
                        <p className="text-white/60 text-sm">{orcamento.cliente.empresa}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{orcamento.createdAt?.toLocaleDateString('pt-BR')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Válido até {orcamento.validoAte?.toLocaleDateString('pt-BR')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Package className="w-3 h-3" />
                          <span>{orcamento.itens?.length || 0} itens</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">
                        R$ {orcamento.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/60 text-sm">
                        {orcamento.vendedor || 'Vendedor não informado'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setOrcamentoSelecionado(orcamento);
                          setShowPreview(true);
                        }}
                        className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => downloadOrcamentoPDF(orcamento)}
                        className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors"
                        title="Baixar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => duplicarOrcamento(orcamento)}
                        className="p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deletarOrcamento(orcamento.id)}
                        className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Preview */}
      <AnimatePresence>
        {showPreview && orcamentoSelecionado && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  Orçamento {orcamentoSelecionado.numero}
                </h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => downloadOrcamentoPDF(orcamentoSelecionado)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
              
              <PreviewOrcamento orcamento={orcamentoSelecionado} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 