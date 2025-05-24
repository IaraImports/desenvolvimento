import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Minus,
  Search,
  Trash2,
  Calculator,
  DollarSign,
  Package,
  User,
  Calendar,
  Clock,
  Send,
  ArrowLeft,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  Building
} from 'lucide-react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Orcamento() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [itens, setItens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);

  // Dados do cliente
  const [cliente, setCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    empresa: ''
  });

  // Dados do orçamento
  const [orcamento, setOrcamento] = useState({
    numero: `ORC-${Date.now()}`,
    validade: 30,
    observacoes: '',
    desconto: 0,
    tipoDesconto: 'percentage'
  });

  const condicoesGerais = [
    'Orçamento válido por ' + orcamento.validade + ' dias',
    'Preços sujeitos a alteração sem aviso prévio',
    'Produto sujeito a disponibilidade de estoque',
    'Garantia conforme fabricante',
    'Pagamento: À vista ou conforme negociação'
  ];

  useEffect(() => {
    loadProdutos();
    loadClientes();
  }, []);

  const loadProdutos = async () => {
    try {
      const q = query(collection(db, 'produtos'), where('status', '==', 'ativo'));
      const querySnapshot = await getDocs(q);
      const produtosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProdutos(produtosData.filter(p => p.estoque > 0));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const loadClientes = async () => {
    try {
      // Carregar clientes diretamente da coleção clientes
      const clientesSnap = await getDocs(collection(db, 'clientes'));
      const clientesData = clientesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar apenas clientes ativos
      const clientesAtivos = clientesData.filter(cliente => 
        cliente.status === 'ativo' || !cliente.status
      );

      setClientes(clientesAtivos);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const filteredProdutos = produtos.filter(produto =>
    produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adicionarItem = (produto) => {
    const itemExistente = itens.find(item => item.id === produto.id);
    
    if (itemExistente) {
      setItens(itens.map(item =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
      toast.success('Quantidade atualizada');
    } else {
      setItens([...itens, {
        ...produto,
        quantidade: 1,
        valorPersonalizado: produto.valorFinal
      }]);
      toast.success('Item adicionado ao orçamento');
    }
  };

  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
    toast.success('Item removido');
  };

  const alterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerItem(id);
      return;
    }

    setItens(itens.map(item =>
      item.id === id
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  const alterarValor = (id, novoValor) => {
    setItens(itens.map(item =>
      item.id === id
        ? { ...item, valorPersonalizado: parseFloat(novoValor) || 0 }
        : item
    ));
  };

  const calcularTotais = () => {
    const subtotal = itens.reduce((acc, item) => acc + (item.valorPersonalizado * item.quantidade), 0);
    let valorDesconto = 0;
    
    if (orcamento.tipoDesconto === 'percentage') {
      valorDesconto = (subtotal * orcamento.desconto) / 100;
    } else {
      valorDesconto = orcamento.desconto;
    }
    
    const total = subtotal - valorDesconto;
    
    return { subtotal, valorDesconto, total };
  };

  const salvarOrcamento = async () => {
    if (itens.length === 0) {
      toast.error('Adicione itens ao orçamento');
      return;
    }

    if (!cliente.nome) {
      toast.error('Informe o nome do cliente');
      return;
    }

    try {
      setLoading(true);
      const { subtotal, valorDesconto, total } = calcularTotais();

      const orcamentoData = {
        numero: orcamento.numero,
        cliente: cliente,
        itens: itens.map(item => ({
          produtoId: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          valorUnitario: item.valorPersonalizado,
          valorTotal: item.valorPersonalizado * item.quantidade
        })),
        subtotal,
        desconto: valorDesconto,
        total,
        validade: orcamento.validade,
        observacoes: orcamento.observacoes,
        status: 'pendente',
        createdAt: new Date(),
        validoAte: new Date(Date.now() + (orcamento.validade * 24 * 60 * 60 * 1000)),
        vendedor: 'Usuário Atual'
      };

      await addDoc(collection(db, 'orcamentos'), orcamentoData);
      
      toast.success('Orçamento salvo com sucesso!');
      
      // Reset form
      setItens([]);
      setCliente({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        empresa: ''
      });
      setOrcamento({
        ...orcamento,
        numero: `ORC-${Date.now()}`,
        observacoes: '',
        desconto: 0
      });
      
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, valorDesconto, total } = calcularTotais();

  const PreviewOrcamento = () => (
    <div className="max-w-4xl mx-auto bg-white text-black p-8">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ORÇAMENTO</h1>
            <p className="text-lg text-gray-600">Nº {orcamento.numero}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-pink-600">IARA HUB</h2>
            <p className="text-gray-600">Sistema de Gestão</p>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">DADOS DO CLIENTE</h3>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <p><strong>Nome:</strong> {cliente.nome}</p>
            <p><strong>Email:</strong> {cliente.email || 'Não informado'}</p>
            <p><strong>Telefone:</strong> {cliente.telefone || 'Não informado'}</p>
          </div>
          <div>
            <p><strong>Empresa:</strong> {cliente.empresa || 'Não informado'}</p>
            <p><strong>Endereço:</strong> {cliente.endereco || 'Não informado'}</p>
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
            {itens.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-2">{item.nome}</td>
                <td className="border border-gray-300 p-2 text-center">{item.quantidade}</td>
                <td className="border border-gray-300 p-2 text-right">
                  R$ {item.valorPersonalizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  R$ {(item.valorPersonalizado * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {valorDesconto > 0 && (
              <div className="flex justify-between p-2 border-b border-gray-300 text-red-600">
                <span>Desconto:</span>
                <span>- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between p-2 bg-gray-100 font-bold text-lg">
              <span>Total:</span>
              <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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

      {/* Condições Gerais */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">CONDIÇÕES GERAIS</h3>
        <ul className="bg-gray-50 p-4 rounded space-y-1">
          {condicoesGerais.map((condicao, index) => (
            <li key={index} className="text-sm">• {condicao}</li>
          ))}
        </ul>
      </div>

      {/* Rodapé */}
      <div className="border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-600">
        <p>Este orçamento é válido até {new Date(Date.now() + (orcamento.validade * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}</p>
        <p className="mt-2">IARA HUB - Sistema de Gestão Comercial</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna Principal */}
      <div className="lg:col-span-2 space-y-6">
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Visualizar</span>
            </button>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-[#FF2C68]" />
            <span>Dados do Cliente</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-white font-medium mb-2">Nome *</label>
              <input
                type="text"
                value={cliente.nome}
                onChange={(e) => {
                  setCliente({...cliente, nome: e.target.value});
                  setShowClientesDropdown(true);
                }}
                onFocus={() => setShowClientesDropdown(true)}
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                placeholder="Nome do cliente"
              />
              
              {/* Dropdown de Clientes */}
              {showClientesDropdown && cliente.nome && (
                <div className="absolute z-50 w-full mt-1 bg-[#0D0C0C] border border-[#FF2C68]/30 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {clientes
                    .filter(c => c.nome?.toLowerCase().includes(cliente.nome.toLowerCase()))
                    .slice(0, 5)
                    .map((clienteObj, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCliente(clienteObj);
                          setShowClientesDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#FF2C68]/20 text-white border-b border-white/10 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">{clienteObj.nome}</p>
                          {clienteObj.telefone && (
                            <p className="text-xs text-white/60">{clienteObj.telefone}</p>
                          )}
                          {clienteObj.email && (
                            <p className="text-xs text-white/60">{clienteObj.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  
                  {clientes.filter(c => c.nome?.toLowerCase().includes(cliente.nome.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-white/60 text-sm">
                      Nenhum cliente encontrado
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowClientesDropdown(false)}
                    className="w-full px-3 py-2 text-[#FF2C68] text-sm border-t border-white/10 hover:bg-[#FF2C68]/10"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Email</label>
              <input
                type="email"
                value={cliente.email}
                onChange={(e) => setCliente({...cliente, email: e.target.value})}
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Telefone</label>
              <input
                type="tel"
                value={cliente.telefone}
                onChange={(e) => setCliente({...cliente, telefone: e.target.value})}
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Empresa</label>
              <input
                type="text"
                value={cliente.empresa}
                onChange={(e) => setCliente({...cliente, empresa: e.target.value})}
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                placeholder="Nome da empresa"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2">Endereço</label>
              <input
                type="text"
                value={cliente.endereco}
                onChange={(e) => setCliente({...cliente, endereco: e.target.value})}
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                placeholder="Endereço completo"
              />
            </div>
          </div>
        </div>

        {/* Busca de Produtos */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar produtos para adicionar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
          />
        </div>

        {/* Produtos Disponíveis */}
        {searchTerm && (
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6 max-h-60 overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Produtos Disponíveis</h3>
            
            <div className="space-y-2">
              {filteredProdutos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between p-3 bg-[#0D0C0C]/30 rounded-lg border border-white/10 hover:border-[#FF2C68]/30 transition-all cursor-pointer"
                  onClick={() => adicionarItem(produto)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#FF2C68]/20 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#FF2C68]" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{produto.nome}</h4>
                      <p className="text-white/60 text-sm">{produto.categoria}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">
                      R$ {produto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Plus className="w-4 h-4 text-green-400 ml-auto mt-1" />
                  </div>
                </div>
              ))}
              
              {filteredProdutos.length === 0 && (
                <p className="text-white/60 text-center py-4">Nenhum produto encontrado</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Coluna do Orçamento */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6 flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-[#FF2C68]" />
          <h2 className="text-xl font-bold text-white">Orçamento</h2>
        </div>

        {/* Configurações do Orçamento */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-white font-medium mb-2">Número</label>
            <input
              type="text"
              value={orcamento.numero}
              onChange={(e) => setOrcamento({...orcamento, numero: e.target.value})}
              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Validade (dias)</label>
            <input
              type="number"
              value={orcamento.validade}
              onChange={(e) => setOrcamento({...orcamento, validade: parseInt(e.target.value) || 30})}
              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Itens do Orçamento */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          <h3 className="text-white font-semibold">Itens ({itens.length})</h3>
          
          {itens.map((item) => (
            <div key={item.id} className="bg-[#0D0C0C]/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium text-sm">{item.nome}</h4>
                <button
                  onClick={() => removerItem(item.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-white/60 text-xs">Qtd</label>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      className="w-5 h-5 bg-red-500/20 rounded text-red-400 text-xs flex items-center justify-center"
                    >
                      <Minus className="w-2 h-2" />
                    </button>
                    <span className="text-white text-sm w-6 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="w-5 h-5 bg-green-500/20 rounded text-green-400 text-xs flex items-center justify-center"
                    >
                      <Plus className="w-2 h-2" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-white/60 text-xs">Valor Unit.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.valorPersonalizado}
                    onChange={(e) => alterarValor(item.id, e.target.value)}
                    className="w-full px-2 py-1 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded text-white text-sm focus:border-[#FF2C68] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-green-400 font-bold text-sm">
                  R$ {(item.valorPersonalizado * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}

          {itens.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-white/60 text-sm">Nenhum item adicionado</p>
            </div>
          )}
        </div>

        {/* Desconto */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-white font-medium mb-2">Desconto</label>
              <input
                type="number"
                value={orcamento.desconto}
                onChange={(e) => setOrcamento({...orcamento, desconto: parseFloat(e.target.value) || 0})}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Tipo</label>
              <select
                value={orcamento.tipoDesconto}
                onChange={(e) => setOrcamento({...orcamento, tipoDesconto: e.target.value})}
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
              >
                <option value="percentage">%</option>
                <option value="fixed">R$</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Observações</label>
            <textarea
              value={orcamento.observacoes}
              onChange={(e) => setOrcamento({...orcamento, observacoes: e.target.value})}
              placeholder="Observações adicionais..."
              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
              rows="3"
            />
          </div>
        </div>

        {/* Totais */}
        <div className="space-y-2 mb-6 p-4 bg-[#0D0C0C]/30 rounded-xl border border-white/10">
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
          <div className="flex justify-between text-green-400 font-bold text-lg border-t border-white/10 pt-2">
            <span>Total:</span>
            <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <button
            onClick={salvarOrcamento}
            disabled={itens.length === 0 || !cliente.nome || loading}
            className="w-full bg-[#FF2C68] hover:bg-[#FF2C68]/80 disabled:bg-gray-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Salvar Orçamento</span>
              </>
            )}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowPreview(true)}
              disabled={itens.length === 0}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white py-2 rounded-xl font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>Visualizar</span>
            </button>
            
            <button
              disabled={itens.length === 0}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-2 rounded-xl font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
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
                <h3 className="text-lg font-bold text-gray-800">Visualização do Orçamento</h3>
                <div className="flex items-center space-x-2">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg"
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