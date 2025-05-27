import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  User,
  Search,
  Plus,
  Minus,
  Trash2,
  Calculator,
  Save,
  Eye,
  Package,
  Wrench,
  DollarSign,
  Calendar,
  Percent,
  ShoppingCart,
  Settings,
  CheckCircle,
  X,
  Download
} from 'lucide-react';
import {
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  query, 
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Orcamento() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados principais
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Dados de entrada
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  
  // Formulário do orçamento
  const [orcamento, setOrcamento] = useState({
    numero: `ORC-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
    cliente: null,
    itens: [],
    observacoes: '',
    validoAte: '',
    desconto: 0,
    tipoDesconto: 'percentage', // 'percentage' ou 'fixed'
    vendedor: 'Usuário Atual',
    condicoesPagamento: '30 dias',
    prazoEntrega: '5 dias úteis',
    garantia: '90 dias',
    impostos: 0,
    tipoImpostos: 'percentage'
  });
  
  // Estados da interface
  const [searchCliente, setSearchCliente] = useState('');
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [searchProdutos, setSearchProdutos] = useState('');
  const [activeTab, setActiveTab] = useState('produtos'); // 'produtos' ou 'servicos'
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadClientes();
    loadProdutos();
    loadServicos();
    
    // Se vier um orçamento base (duplicação), carrega os dados
    if (location.state?.orcamentoBase) {
      const orcamentoBase = location.state.orcamentoBase;
      setOrcamento(prev => ({
        ...prev,
        ...orcamentoBase,
        numero: `ORC-${Date.now()}`, // Novo número
        createdAt: null,
        validoAte: ''
      }));
      if (orcamentoBase.cliente) {
        setClienteSelecionado(orcamentoBase.cliente);
        setSearchCliente(orcamentoBase.cliente.nome);
      }
    }
    
    // Se vier um orçamento para edição, carrega os dados completos
    if (location.state?.editandoOrcamento) {
      const orcamentoEdit = location.state.editandoOrcamento;
      setOrcamento(prev => ({
        ...prev,
        ...orcamentoEdit,
        validoAte: orcamentoEdit.validoAte instanceof Date 
          ? orcamentoEdit.validoAte.toISOString().split('T')[0]
          : orcamentoEdit.validoAte
      }));
      if (orcamentoEdit.cliente) {
        setClienteSelecionado(orcamentoEdit.cliente);
        setSearchCliente(orcamentoEdit.cliente.nome);
      }
      toast.success(`Editando orçamento ${orcamentoEdit.numero}`);
    }
    
    // Definir data de validade padrão (30 dias)
    const dataValidade = new Date();
    dataValidade.setDate(dataValidade.getDate() + 30);
    setOrcamento(prev => ({
      ...prev,
      validoAte: dataValidade.toISOString().split('T')[0]
    }));
  }, [location.state]);

  const loadClientes = async () => {
    try {
      const clientesSnap = await getDocs(collection(db, 'clientes'));
      const clientesData = clientesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const clientesAtivos = clientesData.filter(cliente => 
        cliente.status === 'ativo' || !cliente.status
      );
      
      setClientes(clientesAtivos);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const loadProdutos = async () => {
    try {
      let querySnapshot;
      try {
        const q = query(collection(db, 'produtos'), orderBy('nome'));
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        querySnapshot = await getDocs(collection(db, 'produtos'));
      }
      
      const produtosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        tipo: 'produto',
        ...doc.data()
      }));
      
      const produtosAtivos = produtosData.filter(p => 
        (p.status === 'ativo' || !p.status) && (p.estoque > 0 || !p.estoque)
      );
      
      setProdutos(produtosAtivos);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const loadServicos = async () => {
    try {
      let querySnapshot;
      try {
        const q = query(collection(db, 'servicos'), orderBy('nome'));
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        querySnapshot = await getDocs(collection(db, 'servicos'));
      }
      
      const servicosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        tipo: 'servico',
        ...doc.data()
      }));
      
      const servicosAtivos = servicosData.filter(s => 
        s.status === 'ativo' || !s.status
      );
      
      setServicos(servicosAtivos);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    }
  };

  // Filtros
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome?.toLowerCase().includes(searchCliente.toLowerCase()) ||
    cliente.empresa?.toLowerCase().includes(searchCliente.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome?.toLowerCase().includes(searchProdutos.toLowerCase()) ||
    produto.categoria?.toLowerCase().includes(searchProdutos.toLowerCase())
  );

  const servicosFiltrados = servicos.filter(servico =>
    servico.nome?.toLowerCase().includes(searchProdutos.toLowerCase()) ||
    servico.categoria?.toLowerCase().includes(searchProdutos.toLowerCase()) ||
    servico.descricao?.toLowerCase().includes(searchProdutos.toLowerCase())
  );

  // Funções do carrinho
  const adicionarItem = (item) => {
    const itemExistente = orcamento.itens.find(i => i.id === item.id && i.tipo === item.tipo);
    
    if (itemExistente) {
      // Aumentar quantidade
      setOrcamento(prev => ({
        ...prev,
        itens: prev.itens.map(i => 
          i.id === item.id && i.tipo === item.tipo
            ? { ...i, quantidade: i.quantidade + 1, valorTotal: i.valorUnitario * (i.quantidade + 1) }
            : i
        )
      }));
    } else {
      // Adicionar novo item
      const novoItem = {
        id: item.id,
        tipo: item.tipo,
        nome: item.nome,
        descricao: item.descricao || '',
        categoria: item.categoria || '',
        quantidade: 1,
        valorUnitario: parseFloat(item.valorFinal || item.valor || 0),
        valorTotal: parseFloat(item.valorFinal || item.valor || 0)
      };
      
      setOrcamento(prev => ({
        ...prev,
        itens: [...prev.itens, novoItem]
      }));
    }
    
    toast.success(`${item.nome} adicionado ao orçamento`);
  };

  const alterarQuantidade = (itemId, tipo, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerItem(itemId, tipo);
      return;
    }
    
    setOrcamento(prev => ({
      ...prev,
      itens: prev.itens.map(item => 
        item.id === itemId && item.tipo === tipo
          ? { ...item, quantidade: novaQuantidade, valorTotal: item.valorUnitario * novaQuantidade }
          : item
      )
    }));
  };

  const removerItem = (itemId, tipo) => {
    setOrcamento(prev => ({
      ...prev,
      itens: prev.itens.filter(item => !(item.id === itemId && item.tipo === tipo))
    }));
    toast.success('Item removido do orçamento');
  };

  const alterarValorUnitario = (itemId, tipo, novoValor) => {
    const valor = parseFloat(novoValor) || 0;
    
    setOrcamento(prev => ({
      ...prev,
      itens: prev.itens.map(item => 
        item.id === itemId && item.tipo === tipo
          ? { ...item, valorUnitario: valor, valorTotal: valor * item.quantidade }
          : item
      )
    }));
  };

  // Cálculos
  const calcularTotais = useCallback(() => {
    const subtotal = orcamento.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    
    let valorDesconto = 0;
    if (orcamento.tipoDesconto === 'percentage') {
      valorDesconto = (subtotal * orcamento.desconto) / 100;
    } else {
      valorDesconto = orcamento.desconto;
    }
    
    const subtotalComDesconto = subtotal - valorDesconto;
    
    let valorImpostos = 0;
    if (orcamento.tipoImpostos === 'percentage') {
      valorImpostos = (subtotalComDesconto * orcamento.impostos) / 100;
    } else {
      valorImpostos = orcamento.impostos;
    }
    
    const total = subtotalComDesconto + valorImpostos;
    
    return { subtotal, valorDesconto, valorImpostos, total };
  }, [orcamento.itens, orcamento.desconto, orcamento.tipoDesconto, orcamento.impostos, orcamento.tipoImpostos]);

  const { subtotal, valorDesconto, valorImpostos, total } = calcularTotais();

  // Seleção de cliente
  const selecionarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setSearchCliente(cliente.nome);
    setShowClientesDropdown(false);
    setOrcamento(prev => ({ ...prev, cliente }));
  };

  // Função para baixar PDF do preview
  const downloadPDFPreview = () => {
    if (!clienteSelecionado || orcamento.itens.length === 0) {
      toast.error('Adicione um cliente e itens para gerar o PDF');
      return;
    }

    // Criar um elemento temporário para impressão com o design da prévia
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orçamento ${orcamento.numero}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; color: #000; background: white; line-height: 1.4; }
            .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
            
            /* Cabeçalho Profissional */
            .header { border-bottom: 3px solid #e91e63; padding-bottom: 30px; margin-bottom: 30px; }
            .header-content { display: flex; justify-content: space-between; align-items: start; }
            .title-section { flex: 1; }
            .gradient-title { background: linear-gradient(135deg, #e91e63, #c2185b); color: white; padding: 24px; border-radius: 12px; margin-bottom: 16px; }
            .gradient-title h1 { font-size: 36px; font-weight: bold; margin-bottom: 8px; }
            .title-info { display: flex; align-items: center; gap: 24px; color: rgba(255,255,255,0.9); font-size: 14px; }
            .status-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            
            .company-info { margin-left: 24px; background: #f5f5f5; padding: 24px; border-radius: 12px; border-left: 4px solid #e91e63; min-width: 280px; }
            .company-info h2 { font-size: 28px; font-weight: bold; color: #e91e63; margin-bottom: 8px; }
            .company-info p { color: #666; font-weight: 500; margin-bottom: 16px; }
            .contact-info { font-size: 13px; color: #666; }
            .contact-info p { margin-bottom: 4px; }
            .contact-info strong { color: #333; }
            
            /* Cliente */
            .cliente-section { background: linear-gradient(135deg, #e3f2fd, #e8f5e8); border-left: 4px solid #2196f3; padding: 24px; border-radius: 0 12px 12px 0; margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 16px; display: flex; align-items: center; }
            .section-icon { width: 32px; height: 32px; background: #2196f3; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; margin-right: 12px; }
            .cliente-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .cliente-item { display: flex; align-items: center; }
            .cliente-bullet { width: 8px; height: 8px; background: #2196f3; border-radius: 50%; margin-right: 12px; }
            .cliente-label { font-size: 13px; color: #666; display: block; }
            .cliente-value { font-weight: 600; color: #333; }
            
            /* Itens */
            .itens-section { background: white; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 30px; }
            .itens-header { background: linear-gradient(135deg, #f5f5f5, #eeeeee); padding: 16px 24px; border-bottom: 1px solid #e0e0e0; }
            .itens-title { font-size: 18px; font-weight: bold; color: #333; display: flex; align-items: center; }
            .itens-icon { width: 32px; height: 32px; background: #4caf50; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; margin-right: 12px; }
            
            table { width: 100%; border-collapse: collapse; }
            th { background: #f5f5f5; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
            th:nth-child(4) { text-align: right; }
            td { padding: 16px; border-bottom: 1px solid #f0f0f0; }
            tr:hover { background: #fafafa; }
            
            .item-info { display: flex; align-items: center; }
            .item-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px; }
            .item-icon.produto { background: #e8f5e8; color: #4caf50; }
            .item-icon.servico { background: #e3f2fd; color: #2196f3; }
            .item-name { font-weight: 500; color: #333; }
            .item-badge { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; margin-top: 4px; display: inline-block; }
            .item-category { font-size: 11px; color: #999; margin-top: 2px; }
            
            /* Totais */
            .totais-section { background: linear-gradient(135deg, #f5f5f5, #eeeeee); padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0; margin-bottom: 30px; }
            .totais-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 24px; display: flex; align-items: center; }
            .totais-icon { width: 32px; height: 32px; background: #ff9800; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; margin-right: 12px; }
            .totais-grid { display: grid; grid-template-columns: 1fr 300px; gap: 32px; }
            .totais-detalhes { display: flex; flex-direction: column; gap: 12px; }
            .total-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
            .total-label { color: #666; }
            .total-value { font-weight: 600; color: #333; }
            .desconto { color: #d32f2f !important; }
            .impostos { color: #ff9800 !important; }
            
            .total-final { background: white; padding: 24px; border-radius: 12px; border-left: 4px solid #4caf50; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
            .total-final-label { font-size: 13px; color: #666; margin-bottom: 8px; }
            .total-final-value { font-size: 32px; font-weight: bold; color: #4caf50; margin-bottom: 16px; }
            .condicoes { font-size: 12px; color: #666; }
            .condicoes p { margin-bottom: 4px; }
            .condicoes strong { color: #333; }
            
            /* Observações */
            .observacoes-section { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 24px; border-radius: 0 12px 12px 0; margin-bottom: 30px; }
            .obs-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 12px; display: flex; align-items: center; }
            .obs-icon { width: 24px; height: 24px; background: #2196f3; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 8px; }
            .obs-text { color: #666; line-height: 1.6; }
            
            /* Termos */
            .termos-section { background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
            .termos-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 16px; display: flex; align-items: center; }
            .termos-icon { width: 24px; height: 24px; background: #666; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 8px; }
            .termos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 13px; color: #666; }
            .termo-item { margin-bottom: 12px; }
            .termo-label { font-weight: 600; color: #333; }
            .termo-obs { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; line-height: 1.5; }
            
            /* Rodapé */
            .footer { border-top: 2px solid #e91e63; padding-top: 24px; }
            .footer-gradient { background: linear-gradient(135deg, #e91e63, #c2185b); color: white; padding: 24px; border-radius: 12px; text-align: center; }
            .footer-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
            .footer-subtitle { color: rgba(255,255,255,0.9); font-size: 13px; margin-bottom: 16px; }
            .footer-contacts { display: flex; justify-content: center; gap: 32px; font-size: 13px; margin-bottom: 16px; }
            .footer-generated { font-size: 11px; color: rgba(255,255,255,0.7); }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Cabeçalho Profissional -->
            <div class="header">
              <div class="header-content">
                <div class="title-section">
                  <div class="gradient-title">
                    <h1>PROPOSTA COMERCIAL</h1>
                    <div class="title-info">
                      <span>Nº ${orcamento.numero}</span>
                      <span>•</span>
                      <span>Válido até: ${new Date(orcamento.validoAte).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span class="status-badge">PENDENTE</span>
                    </div>
                  </div>
                </div>
                <div class="company-info">
                  <h2>IARA HUB</h2>
                  <p>Sistema de Gestão Comercial</p>
                  <div class="contact-info">
                    <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                    <p><strong>Vendedor:</strong> ${orcamento.vendedor}</p>
                    <p><strong>Contato:</strong> comercial@iarahub.com</p>
                    <p><strong>Telefone:</strong> (11) 9999-9999</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dados do Cliente -->
            <div class="cliente-section">
              <div class="section-title">
                <span class="section-icon">C</span>
                INFORMAÇÕES DO CLIENTE
              </div>
              <div class="cliente-grid">
                <div class="cliente-item">
                  <span class="cliente-bullet"></span>
                  <div>
                    <span class="cliente-label">Nome/Razão Social:</span>
                    <div class="cliente-value">${clienteSelecionado?.nome || 'Não informado'}</div>
                  </div>
                </div>
                <div class="cliente-item">
                  <span class="cliente-bullet"></span>
                  <div>
                    <span class="cliente-label">Empresa:</span>
                    <div class="cliente-value">${clienteSelecionado?.empresa || 'Não informado'}</div>
                  </div>
                </div>
                <div class="cliente-item">
                  <span class="cliente-bullet"></span>
                  <div>
                    <span class="cliente-label">E-mail:</span>
                    <div class="cliente-value">${clienteSelecionado?.email || 'Não informado'}</div>
                  </div>
                </div>
                <div class="cliente-item">
                  <span class="cliente-bullet"></span>
                  <div>
                    <span class="cliente-label">Endereço:</span>
                    <div class="cliente-value">${clienteSelecionado?.endereco || 'Não informado'}</div>
                  </div>
                </div>
                <div class="cliente-item">
                  <span class="cliente-bullet"></span>
                  <div>
                    <span class="cliente-label">Telefone:</span>
                    <div class="cliente-value">${clienteSelecionado?.telefone || 'Não informado'}</div>
                  </div>
                </div>
                <div class="cliente-item">
                  <span class="cliente-bullet"></span>
                  <div>
                    <span class="cliente-label">CNPJ/CPF:</span>
                    <div class="cliente-value">${clienteSelecionado?.documento || 'Não informado'}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Itens do Orçamento -->
            <div class="itens-section">
              <div class="itens-header">
                <div class="itens-title">
                  <span class="itens-icon">I</span>
                  ITENS DA PROPOSTA
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qtd</th>
                    <th>Valor Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orcamento.itens?.map((item, index) => `
                    <tr>
                      <td>
                        <div class="item-info">
                          <div class="item-icon ${item.tipo}">
                            ${item.tipo === 'servico' ? '🔧' : '📦'}
                          </div>
                          <div>
                            <div class="item-name">${item.nome}</div>
                            ${item.tipo === 'servico' ? '<span class="item-badge">SERVIÇO</span>' : ''}
                            ${item.categoria ? `<div class="item-category">${item.categoria}</div>` : ''}
                          </div>
                        </div>
                      </td>
                      <td class="text-center">${item.quantidade}</td>
                      <td class="text-center">R$ ${item.valorUnitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td class="text-right"><strong>R$ ${item.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                    </tr>
                  `).join('') || '<tr><td colspan="4" class="text-center">Nenhum item encontrado</td></tr>'}
                </tbody>
              </table>
            </div>

            <!-- Resumo Financeiro -->
            <div class="totais-section">
              <div class="totais-title">
                <span class="totais-icon">R$</span>
                RESUMO FINANCEIRO
              </div>
              <div class="totais-grid">
                <div class="totais-detalhes">
                  <div class="total-item">
                    <span class="total-label">Subtotal dos Itens:</span>
                    <span class="total-value">R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ${valorDesconto > 0 ? `
                  <div class="total-item">
                    <span class="total-label desconto">Desconto Aplicado:</span>
                    <span class="total-value desconto">- R$ ${valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ` : ''}
                  ${valorImpostos > 0 ? `
                  <div class="total-item">
                    <span class="total-label impostos">Impostos/Taxas:</span>
                    <span class="total-value impostos">+ R$ ${valorImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ` : ''}
                </div>
                <div class="total-final">
                  <div class="total-final-label">VALOR TOTAL DA PROPOSTA</div>
                  <div class="total-final-value">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div class="condicoes">
                    <p><strong>Condições:</strong> ${orcamento.condicoesPagamento}</p>
                    <p><strong>Prazo de Entrega:</strong> ${orcamento.prazoEntrega}</p>
                    <p><strong>Garantia:</strong> ${orcamento.garantia}</p>
                  </div>
                </div>
              </div>
            </div>

            ${orcamento.observacoes ? `
            <!-- Observações -->
            <div class="observacoes-section">
              <div class="obs-title">
                <span class="obs-icon">!</span>
                OBSERVAÇÕES IMPORTANTES
              </div>
              <div class="obs-text">${orcamento.observacoes}</div>
            </div>
            ` : ''}

            <!-- Termos e Condições -->
            <div class="termos-section">
              <div class="termos-title">
                <span class="termos-icon">T</span>
                TERMOS E CONDIÇÕES
              </div>
              <div class="termos-grid">
                <div>
                  <div class="termo-item">
                    <div class="termo-label">Validade da Proposta:</div>
                    <div>${new Date(orcamento.validoAte).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div class="termo-item">
                    <div class="termo-label">Condições de Pagamento:</div>
                    <div>${orcamento.condicoesPagamento}</div>
                  </div>
                  <div class="termo-item">
                    <div class="termo-label">Prazo de Entrega:</div>
                    <div>${orcamento.prazoEntrega}</div>
                  </div>
                </div>
                <div>
                  <div class="termo-item">
                    <div class="termo-label">Garantia:</div>
                    <div>${orcamento.garantia}</div>
                  </div>
                  <div class="termo-item">
                    <div class="termo-label">Forma de Entrega:</div>
                    <div>Conforme acordo comercial</div>
                  </div>
                  <div class="termo-item">
                    <div class="termo-label">Frete:</div>
                    <div>Por conta do cliente (CIF/FOB conforme negociação)</div>
                  </div>
                </div>
              </div>
              <div class="termo-obs">
                <strong>Observações Gerais:</strong> Esta proposta tem validade conforme data especificada. 
                Após este período, preços e condições estão sujeitos à reavaliação. Os valores incluem impostos conforme legislação vigente. 
                Eventuais despesas de instalação, treinamento ou customização serão orçadas separadamente.
              </div>
            </div>

            <!-- Rodapé Profissional -->
            <div class="footer">
              <div class="footer-gradient">
                <div class="footer-title">IARA HUB - Sistema de Gestão Comercial</div>
                <div class="footer-subtitle">Transformando a gestão do seu negócio com tecnologia e inovação</div>
                <div class="footer-contacts">
                  <span>📧 comercial@iarahub.com</span>
                  <span>📱 (11) 9999-9999</span>
                  <span>🌐 www.iarahub.com</span>
                </div>
                <div class="footer-generated">
                  Documento gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>
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

  // Salvar orçamento
  const salvarOrcamento = async () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (orcamento.itens.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento');
      return;
    }
    
    if (!orcamento.validoAte) {
      toast.error('Defina a data de validade');
      return;
    }

    try {
      setSaving(true);
      
      const orcamentoData = {
        numero: orcamento.numero,
        cliente: clienteSelecionado,
        itens: orcamento.itens,
        subtotal,
        desconto: valorDesconto,
        impostos: valorImpostos,
        total,
        observacoes: orcamento.observacoes,
        validoAte: Timestamp.fromDate(new Date(orcamento.validoAte)),
        vendedor: orcamento.vendedor,
        condicoesPagamento: orcamento.condicoesPagamento,
        prazoEntrega: orcamento.prazoEntrega,
        garantia: orcamento.garantia,
        status: orcamento.status || 'pendente'
      };

      // Se é uma edição (tem ID), atualiza; senão cria novo
      if (location.state?.editandoOrcamento?.id) {
        orcamentoData.updatedAt = Timestamp.now();
        await updateDoc(doc(db, 'orcamentos', location.state.editandoOrcamento.id), orcamentoData);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        orcamentoData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'orcamentos'), orcamentoData);
        toast.success('Orçamento salvo com sucesso!');
      }
      
      navigate('/vendas/historico-orcamentos');
      
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  };

  // Preview do orçamento
  const PreviewOrcamento = () => (
    <div className="max-w-5xl mx-auto bg-white text-black p-8">
      {/* Cabeçalho Profissional */}
      <div className="border-b-3 border-pink-600 pb-8 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 rounded-xl mb-4">
              <h1 className="text-4xl font-bold mb-2">PROPOSTA COMERCIAL</h1>
              <div className="flex items-center space-x-6 text-pink-100">
                <span className="text-lg font-semibold">Nº {orcamento.numero}</span>
                <span>•</span>
                <span>Válido até: {new Date(orcamento.validoAte).toLocaleDateString('pt-BR')}</span>
                <span>•</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">PENDENTE</span>
              </div>
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-pink-600">
              <h2 className="text-3xl font-bold text-pink-600 mb-2">IARA HUB</h2>
              <p className="text-gray-700 font-medium">Sistema de Gestão Comercial</p>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                <p><strong>Vendedor:</strong> {orcamento.vendedor}</p>
                <p><strong>Contato:</strong> comercial@iarahub.com</p>
                <p><strong>Telefone:</strong> (11) 9999-9999</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Cliente - Design Profissional */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">C</span>
            INFORMAÇÕES DO CLIENTE
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <div>
                  <span className="text-gray-600 text-sm">Nome/Razão Social:</span>
                  <p className="font-semibold text-gray-800">{clienteSelecionado?.nome}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <div>
                  <span className="text-gray-600 text-sm">E-mail:</span>
                  <p className="font-semibold text-gray-800">{clienteSelecionado?.email || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <div>
                  <span className="text-gray-600 text-sm">Telefone:</span>
                  <p className="font-semibold text-gray-800">{clienteSelecionado?.telefone || 'Não informado'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <div>
                  <span className="text-gray-600 text-sm">Empresa:</span>
                  <p className="font-semibold text-gray-800">{clienteSelecionado?.empresa || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <div>
                  <span className="text-gray-600 text-sm">Endereço:</span>
                  <p className="font-semibold text-gray-800">{clienteSelecionado?.endereco || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <div>
                  <span className="text-gray-600 text-sm">CNPJ/CPF:</span>
                  <p className="font-semibold text-gray-800">{clienteSelecionado?.documento || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Itens do Orçamento - Design Moderno */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">I</span>
              ITENS DA PROPOSTA
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qtd</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor Unit.</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orcamento.itens.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.tipo === 'servico' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {item.tipo === 'servico' ? '🔧' : '📦'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.nome}</div>
                          {item.tipo === 'servico' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              SERVIÇO
                            </span>
                          )}
                          {item.categoria && (
                            <div className="text-xs text-gray-500 mt-1">{item.categoria}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{item.quantidade}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        R$ {item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-green-600">
                        R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro Profissional */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">R$</span>
            RESUMO FINANCEIRO
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal dos Itens:</span>
                <span className="font-semibold text-gray-800">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {valorDesconto > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 text-red-600">
                  <span>Desconto Aplicado:</span>
                  <span className="font-semibold">- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {valorImpostos > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 text-orange-600">
                  <span>Impostos/Taxas:</span>
                  <span className="font-semibold">+ R$ {valorImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">VALOR TOTAL DA PROPOSTA</p>
                <p className="text-3xl font-bold text-green-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p><strong>Condições:</strong> {orcamento.condicoesPagamento}</p>
                  <p><strong>Prazo de Entrega:</strong> {orcamento.prazoEntrega}</p>
                  <p><strong>Garantia:</strong> {orcamento.garantia}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observações e Termos */}
      {orcamento.observacoes && (
        <div className="mb-8">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">!</span>
              OBSERVAÇÕES IMPORTANTES
            </h3>
            <p className="text-gray-700 leading-relaxed">{orcamento.observacoes}</p>
          </div>
        </div>
      )}

      {/* Termos e Condições Profissionais */}
      <div className="mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">T</span>
            TERMOS E CONDIÇÕES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div className="space-y-3">
              <div>
                <strong className="text-gray-800">Validade da Proposta:</strong>
                <p>{new Date(orcamento.validoAte).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <strong className="text-gray-800">Condições de Pagamento:</strong>
                <p>{orcamento.condicoesPagamento}</p>
              </div>
              <div>
                <strong className="text-gray-800">Prazo de Entrega:</strong>
                <p>{orcamento.prazoEntrega}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <strong className="text-gray-800">Garantia:</strong>
                <p>{orcamento.garantia}</p>
              </div>
              <div>
                <strong className="text-gray-800">Forma de Entrega:</strong>
                <p>Conforme acordo comercial</p>
              </div>
              <div>
                <strong className="text-gray-800">Frete:</strong>
                <p>Por conta do cliente (CIF/FOB conforme negociação)</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Observações Gerais:</strong> Esta proposta tem validade conforme data especificada. 
              Após este período, preços e condições estão sujeitos à reavaliação. Os valores incluem impostos conforme legislação vigente. 
              Eventuais despesas de instalação, treinamento ou customização serão orçadas separadamente.
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé Profissional */}
      <div className="border-t-2 border-pink-600 pt-6">
        <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 rounded-xl">
          <div className="text-center">
            <h4 className="text-lg font-bold mb-2">IARA HUB - Sistema de Gestão Comercial</h4>
            <p className="text-pink-100 text-sm mb-4">Transformando a gestão do seu negócio com tecnologia e inovação</p>
            <div className="flex justify-center space-x-8 text-sm">
              <span>📧 comercial@iarahub.com</span>
              <span>📱 (11) 9999-9999</span>
              <span>🌐 www.iarahub.com</span>
            </div>
            <p className="text-xs text-pink-200 mt-4">
              Documento gerado automaticamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
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
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF2C68] to-pink-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
          </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {location.state?.editandoOrcamento ? 'Editar Orçamento' : 'Proposta Comercial'}
                  </h1>
                  {location.state?.editandoOrcamento && (
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                      EDITANDO
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-white/60">
                  <span className="bg-[#FF2C68]/20 px-3 py-1 rounded-full text-sm font-medium">
                    {orcamento.numero}
                  </span>
                  <span>•</span>
                  <span className="text-sm">
                    {orcamento.itens.length} {orcamento.itens.length === 1 ? 'item' : 'itens'}
                  </span>
                  <span>•</span>
                  <span className="text-sm">
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
        </div>
      </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(true)}
            disabled={!clienteSelecionado || orcamento.itens.length === 0}
            className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          
          <button
            onClick={salvarOrcamento}
            disabled={saving || !clienteSelecionado || orcamento.itens.length === 0}
            className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saving 
                ? 'Salvando...' 
                : location.state?.editandoOrcamento 
                  ? 'Atualizar' 
                  : 'Salvar'
              }
            </span>
          </button>
        </div>
      </div>

      {/* Barra de Status Profissional */}
      <div className="bg-gradient-to-r from-gray-900/50 to-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className={`flex items-center space-x-2 ${clienteSelecionado ? 'text-green-400' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${clienteSelecionado ? 'bg-green-500' : 'bg-white/10'}`}>
                {clienteSelecionado ? '✓' : '1'}
              </div>
              <span className="font-medium">Cliente Selecionado</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${orcamento.itens.length > 0 ? 'text-green-400' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orcamento.itens.length > 0 ? 'bg-green-500' : 'bg-white/10'}`}>
                {orcamento.itens.length > 0 ? '✓' : '2'}
              </div>
              <span className="font-medium">Itens Adicionados</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${orcamento.validoAte ? 'text-green-400' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orcamento.validoAte ? 'bg-green-500' : 'bg-white/10'}`}>
                {orcamento.validoAte ? '✓' : '3'}
              </div>
              <span className="font-medium">Configurações</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-white/60 text-sm">Progresso do Orçamento</div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF2C68] to-pink-500 transition-all duration-500"
                  style={{ 
                    width: `${((clienteSelecionado ? 1 : 0) + (orcamento.itens.length > 0 ? 1 : 0) + (orcamento.validoAte ? 1 : 0)) * 33.33}%` 
                  }}
                />
              </div>
              <span className="text-white font-medium text-sm">
                {Math.round(((clienteSelecionado ? 1 : 0) + (orcamento.itens.length > 0 ? 1 : 0) + (orcamento.validoAte ? 1 : 0)) * 33.33)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Principal - Seleção de Produtos e Serviços */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção de Cliente */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-[#FF2C68]" />
              <span>Cliente</span>
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Buscar cliente por nome, empresa ou email..."
                value={searchCliente}
                onChange={(e) => {
                  setSearchCliente(e.target.value);
                  setShowClientesDropdown(true);
                }}
                onFocus={() => setShowClientesDropdown(true)}
                className="w-full pl-10 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
              />
              
              {/* Dropdown de clientes */}
              {showClientesDropdown && clientesFiltrados.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-[#0D0C0C] border border-[#FF2C68]/30 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => selecionarCliente(cliente)}
                      className="w-full text-left px-4 py-3 hover:bg-[#FF2C68]/10 transition-colors border-b border-white/10 last:border-b-0"
                    >
                      <div className="text-white font-medium">{cliente.nome}</div>
                      {cliente.empresa && (
                        <div className="text-white/60 text-sm">{cliente.empresa}</div>
                      )}
                      <div className="text-white/40 text-xs">{cliente.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cliente selecionado */}
            {clienteSelecionado && (
              <div className="mt-4 p-4 bg-[#FF2C68]/10 border border-[#FF2C68]/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{clienteSelecionado.nome}</p>
                    {clienteSelecionado.empresa && (
                      <p className="text-white/60 text-sm">{clienteSelecionado.empresa}</p>
                    )}
                    <p className="text-white/40 text-xs">{clienteSelecionado.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setClienteSelecionado(null);
                      setSearchCliente('');
                      setOrcamento(prev => ({ ...prev, cliente: null }));
                    }}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs - Produtos e Serviços */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('produtos')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'produtos'
                    ? 'bg-[#FF2C68] text-white'
                    : 'bg-[#0D0C0C]/50 text-white/60 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Produtos ({produtos.length})</span>
              </button>
              
              <button
                onClick={() => setActiveTab('servicos')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === 'servicos'
                    ? 'bg-[#FF2C68] text-white'
                    : 'bg-[#0D0C0C]/50 text-white/60 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Serviços ({servicos.length})</span>
              </button>
            </div>
            
            {/* Busca */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder={`Buscar ${activeTab}...`}
                value={searchProdutos}
                onChange={(e) => setSearchProdutos(e.target.value)}
                className="w-full pl-10 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
              />
            </div>
            
            {/* Lista de Produtos/Serviços */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeTab === 'produtos' ? (
                produtosFiltrados.length > 0 ? (
                  produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between p-4 bg-[#0D0C0C]/30 rounded-xl border border-white/10 hover:border-[#FF2C68]/30 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-medium">{produto.nome}</h4>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                            PRODUTO
                          </span>
                        </div>
                        <p className="text-white/60 text-sm mb-2">{produto.categoria}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-green-400 font-bold text-lg">
                            R$ {(produto.valorFinal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="text-right">
                            {produto.estoque && (
                              <p className="text-white/40 text-xs">
                                📦 {produto.estoque} {produto.estoque === 1 ? 'unidade' : 'unidades'}
                              </p>
                            )}
                            {produto.cor && (
                              <p className="text-white/40 text-xs">🎨 {produto.cor}</p>
                            )}
            </div>
            </div>
            </div>
                      
                      <button
                        onClick={() => adicionarItem(produto)}
                        className="p-2 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-lg text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
          </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">Nenhum produto encontrado</p>
                  </div>
                )
              ) : (
                servicosFiltrados.length > 0 ? (
                  servicosFiltrados.map((servico) => (
                    <div
                      key={servico.id}
                      className="flex items-center justify-between p-4 bg-[#0D0C0C]/30 rounded-xl border border-white/10 hover:border-[#FF2C68]/30 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-medium">{servico.nome}</h4>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                            SERVIÇO
                          </span>
                        </div>
                        <p className="text-white/60 text-sm mb-2">{servico.categoria}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-blue-400 font-bold text-lg">
                            R$ {(servico.valor || servico.valorFinal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="text-right">
                            {servico.duracao && (
                              <p className="text-white/40 text-xs">⏱️ {servico.duracao}</p>
                            )}
                            {servico.garantia && (
                              <p className="text-white/40 text-xs">🛡️ {servico.garantia}</p>
                            )}
                          </div>
                        </div>
                        {servico.descricao && (
                          <p className="text-white/40 text-xs mt-2 italic">"{servico.descricao}"</p>
                        )}
                      </div>
                      
          <button
                        onClick={() => adicionarItem(servico)}
                        className="p-2 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-lg text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors"
          >
                        <Plus className="w-4 h-4" />
          </button>
        </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Wrench className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">Nenhum serviço encontrado</p>
      </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Painel Lateral - Carrinho e Configurações */}
        <div className="space-y-6">
          {/* Carrinho */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-[#FF2C68]" />
              <span>Itens do Orçamento ({orcamento.itens.length})</span>
            </h3>
            
            {orcamento.itens.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {orcamento.itens.map((item, index) => (
                  <div
                    key={`${item.id}-${item.tipo}-${index}`}
                    className="p-4 bg-[#0D0C0C]/30 rounded-xl border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{item.nome}</h4>
                        {item.tipo === 'servico' && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded mt-1 inline-block">
                            SERVIÇO
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removerItem(item.id, item.tipo)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Quantidade */}
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => alterarQuantidade(item.id, item.tipo, item.quantidade - 1)}
                        className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-white font-medium w-8 text-center">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item.id, item.tipo, item.quantidade + 1)}
                        className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Valor unitário */}
                    <div className="mb-2">
                      <label className="text-white/60 text-xs">Valor Unitário:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.valorUnitario}
                        onChange={(e) => alterarValorUnitario(item.id, item.tipo, e.target.value)}
                        className="w-full px-2 py-1 bg-[#0D0C0C]/50 border border-white/20 rounded text-white text-sm focus:border-[#FF2C68] focus:outline-none"
                      />
                    </div>
                    
                    {/* Total do item */}
                    <div className="text-right">
                      <span className="text-green-400 font-bold">
                        R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-4">
                <ShoppingCart className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Nenhum item adicionado</p>
              </div>
            )}
            
            {/* Desconto */}
            <div className="border-t border-white/10 pt-4 mb-4">
              <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                <Percent className="w-4 h-4" />
                <span>Desconto:</span>
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={orcamento.tipoDesconto}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, tipoDesconto: e.target.value }))}
                  className="px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">R$</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={orcamento.desconto}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, desconto: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Impostos/Taxas */}
            <div className="border-t border-white/10 pt-4 mb-4">
              <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span>Impostos/Taxas:</span>
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={orcamento.tipoImpostos}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, tipoImpostos: e.target.value }))}
                  className="px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">R$</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={orcamento.impostos}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, impostos: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* Totais */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-white/60">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              
              {valorDesconto > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Desconto:</span>
                  <span>- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {valorImpostos > 0 && (
                <div className="flex justify-between text-orange-400">
                  <span>Impostos/Taxas:</span>
                  <span>+ R$ {valorImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              <div className="flex justify-between text-green-400 font-bold text-lg border-t border-white/10 pt-2">
                <span>Total:</span>
                <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Configurações do Orçamento */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-[#FF2C68]" />
              <span>Configurações</span>
            </h3>
            
            <div className="space-y-4">
              {/* Data de validade */}
              <div>
                <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Válido até:</span>
                </label>
                <input
                  type="date"
                  value={orcamento.validoAte}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, validoAte: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                />
              </div>
              
              {/* Observações */}
              <div>
                <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Observações:</span>
                </label>
                <textarea
                  value={orcamento.observacoes}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais do orçamento..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none resize-none"
                />
              </div>
              
              {/* Condições de Pagamento */}
              <div>
                <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Condições de Pagamento:</span>
                </label>
                <select
                  value={orcamento.condicoesPagamento}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, condicoesPagamento: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                >
                  <option value="À vista">À vista</option>
                  <option value="15 dias">15 dias</option>
                  <option value="30 dias">30 dias</option>
                  <option value="45 dias">45 dias</option>
                  <option value="60 dias">60 dias</option>
                  <option value="Parcelado em 2x">Parcelado em 2x</option>
                  <option value="Parcelado em 3x">Parcelado em 3x</option>
                  <option value="Parcelado em 6x">Parcelado em 6x</option>
                  <option value="Parcelado em 12x">Parcelado em 12x</option>
                </select>
              </div>
              
              {/* Prazo de Entrega */}
              <div>
                <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Prazo de Entrega:</span>
                </label>
                <select
                  value={orcamento.prazoEntrega}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, prazoEntrega: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                >
                  <option value="Imediato">Imediato</option>
                  <option value="1 dia útil">1 dia útil</option>
                  <option value="3 dias úteis">3 dias úteis</option>
                  <option value="5 dias úteis">5 dias úteis</option>
                  <option value="7 dias úteis">7 dias úteis</option>
                  <option value="10 dias úteis">10 dias úteis</option>
                  <option value="15 dias úteis">15 dias úteis</option>
                  <option value="30 dias úteis">30 dias úteis</option>
                  <option value="Conforme disponibilidade">Conforme disponibilidade</option>
                </select>
              </div>
              
              {/* Garantia */}
              <div>
                <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Garantia:</span>
                </label>
                <select
                  value={orcamento.garantia}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, garantia: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                >
                  <option value="30 dias">30 dias</option>
                  <option value="60 dias">60 dias</option>
                  <option value="90 dias">90 dias</option>
                  <option value="6 meses">6 meses</option>
                  <option value="1 ano">1 ano</option>
                  <option value="2 anos">2 anos</option>
                  <option value="Conforme fabricante">Conforme fabricante</option>
                  <option value="Sem garantia">Sem garantia</option>
                </select>
              </div>

              {/* Vendedor */}
              <div>
                <label className="text-white font-medium mb-2 block flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Vendedor:</span>
                </label>
                <input
                  type="text"
                  value={orcamento.vendedor}
                  onChange={(e) => setOrcamento(prev => ({ ...prev, vendedor: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-white/20 rounded text-white focus:border-[#FF2C68] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview */}
      <AnimatePresence>
        {showPreview && (
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
                  Preview - Orçamento {orcamento.numero}
                </h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={downloadPDFPreview}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
              
              <PreviewOrcamento />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 