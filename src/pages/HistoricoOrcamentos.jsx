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
    navigate('/vendas/orcamento', { 
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

  const editarOrcamento = (orcamento) => {
    // Navegar para a página de orçamento com os dados para edição
    navigate('/vendas/orcamento', { 
      state: { 
        editandoOrcamento: orcamento
      }
    });
    toast.success('Redirecionando para edição do orçamento...');
  };

  const downloadPDF = (orcamento) => {
    // Criar um elemento temporário para impressão
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orçamento ${orcamento.numero}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #000; background: white; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: start; }
            .logo { text-align: right; }
            .logo h2 { color: #e91e63; font-size: 24px; margin-bottom: 5px; }
            .title h1 { font-size: 28px; color: #333; margin-bottom: 5px; }
            .status { background: ${getStatusColor(orcamento.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-block; }
            .section { margin-bottom: 20px; }
            .section h3 { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .cliente-info { background: #f5f5f5; padding: 15px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .cliente-info p { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 250px; }
            .totals table { width: 100%; }
            .total-row { background: #f5f5f5; font-weight: bold; font-size: 16px; }
            .footer { border-top: 2px solid #ccc; padding-top: 15px; text-align: center; color: #666; font-size: 12px; }
            .observacoes { background: #f5f5f5; padding: 15px; border-radius: 8px; }
            .validade { background: #f5f5f5; padding: 15px; border-radius: 8px; }
            .expired { color: #d32f2f; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Cabeçalho -->
            <div class="header">
              <div class="title">
                <h1>ORÇAMENTO</h1>
                <p>Nº ${orcamento.numero}</p>
                <span class="status">${getStatusText(orcamento.status)}</span>
              </div>
              <div class="logo">
                <h2>IARA HUB</h2>
                <p>Sistema de Gestão</p>
                <p>${orcamento.createdAt?.toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <!-- Dados do Cliente -->
            <div class="section">
              <h3>DADOS DO CLIENTE</h3>
              <div class="cliente-info">
                <div>
                  <p><strong>Nome:</strong> ${orcamento.cliente?.nome || 'Não informado'}</p>
                  <p><strong>Email:</strong> ${orcamento.cliente?.email || 'Não informado'}</p>
                  <p><strong>Telefone:</strong> ${orcamento.cliente?.telefone || 'Não informado'}</p>
                </div>
                <div>
                  <p><strong>Empresa:</strong> ${orcamento.cliente?.empresa || 'Não informado'}</p>
                  <p><strong>Endereço:</strong> ${orcamento.cliente?.endereco || 'Não informado'}</p>
                </div>
              </div>
            </div>

            <!-- Itens -->
            <div class="section">
              <h3>ITENS DO ORÇAMENTO</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="text-center">Qtd</th>
                    <th class="text-right">Valor Unit.</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orcamento.itens?.map(item => `
                    <tr>
                      <td>
                        ${item.tipo === 'servico' ? '<span style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 8px;">SERVIÇO</span>' : ''}
                        ${item.nome}
                      </td>
                      <td class="text-center">${item.quantidade}</td>
                      <td class="text-right">R$ ${item.valorUnitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td class="text-right">R$ ${item.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="4">Nenhum item encontrado</td></tr>'}
                </tbody>
              </table>
            </div>

            <!-- Totais -->
            <div class="totals">
              <table>
                <tr>
                  <td>Subtotal:</td>
                  <td class="text-right">R$ ${orcamento.subtotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                ${orcamento.desconto > 0 ? `
                <tr style="color: #d32f2f;">
                  <td>Desconto:</td>
                  <td class="text-right">- R$ ${orcamento.desconto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td>Total:</td>
                  <td class="text-right">R$ ${orcamento.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              </table>
            </div>

            ${orcamento.observacoes ? `
            <!-- Observações -->
            <div class="section">
              <h3>OBSERVAÇÕES</h3>
              <div class="observacoes">
                <p>${orcamento.observacoes}</p>
              </div>
            </div>
            ` : ''}

            <!-- Validade -->
            <div class="section">
              <h3>VALIDADE</h3>
              <div class="validade">
                <p>Válido até: <strong>${orcamento.validoAte?.toLocaleDateString('pt-BR')}</strong></p>
                ${isOrcamentoExpirado(orcamento.validoAte) ? '<p class="expired">⚠️ Este orçamento está EXPIRADO</p>' : ''}
              </div>
            </div>

            <!-- Rodapé -->
            <div class="footer">
              <p>IARA HUB - Sistema de Gestão Comercial</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };

    toast.success('Abrindo orçamento para impressão/PDF...');
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
            onClick={() => navigate('/vendas/orcamento')}
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
              onClick={() => navigate('/vendas/orcamento')}
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
                        onClick={() => editarOrcamento(orcamento)}
                        className="p-2 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-lg text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors"
                        title="Editar Orçamento"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => downloadPDF(orcamento)}
                        className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
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
                    onClick={() => downloadPDF(orcamentoSelecionado)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar PDF</span>
                  </button>
                  <button
                    onClick={() => editarOrcamento(orcamentoSelecionado)}
                    className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
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