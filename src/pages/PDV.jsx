import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ShoppingCart,
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
  CheckCircle,
  ArrowLeft,
  Percent,
  Hash,
  Receipt,
  Wrench
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function PDV() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cliente, setCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('percentage');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('produtos'); // 'produtos' ou 'servicos'

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
    { value: 'pix', label: 'PIX', icon: Hash }
  ];

  useEffect(() => {
    loadProdutos();
    loadServicos();
    loadClientes();
  }, []);

  const loadProdutos = async () => {
    try {
      const q = query(collection(db, 'produtos'), where('status', '==', 'ativo'));
      const querySnapshot = await getDocs(q);
      const produtosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        tipo: 'produto',
        ...doc.data()
      }));
      setProdutos(produtosData.filter(p => p.estoque > 0));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const loadServicos = async () => {
    try {
      console.log('🔧 PDV: Carregando serviços...');
      
      // Tentar com orderBy primeiro, com fallback para consulta simples
      let querySnapshot;
      try {
        const q = query(collection(db, 'servicos'), orderBy('nome'));
        querySnapshot = await getDocs(q);
        console.log('📊 PDV: Snapshot com orderBy:', querySnapshot.size, 'documentos');
      } catch (indexError) {
        console.warn('⚠️ PDV: Erro com orderBy, usando consulta simples:', indexError);
        querySnapshot = await getDocs(collection(db, 'servicos'));
        console.log('📊 PDV: Snapshot simples:', querySnapshot.size, 'documentos');
      }
      
      const servicosData = querySnapshot.docs.map(doc => {
        const data = {
          id: doc.id,
          tipo: 'servico',
          ...doc.data()
        };
        console.log('📄 PDV: Serviço:', data);
        return data;
      });
      
      console.log('📦 PDV: Todos os serviços:', servicosData);
      
      const servicosAtivos = servicosData.filter(s => s.status === 'ativo' || !s.status);
      console.log('✅ PDV: Serviços ativos:', servicosAtivos.length);
      
      setServicos(servicosAtivos);
    } catch (error) {
      console.error('❌ PDV: Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
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

  const filteredServicos = servicos.filter(servico =>
    servico.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = activeTab === 'produtos' ? filteredProdutos : filteredServicos;

  const adicionarAoCarrinho = (item) => {
    const itemExistente = carrinho.find(carrinhoItem => carrinhoItem.id === item.id);
    
    if (itemExistente) {
      // Para produtos, verificar estoque; para serviços, permitir múltiplas unidades
      if (item.tipo === 'produto' && itemExistente.quantidade >= item.estoque) {
        toast.error('Estoque insuficiente');
        return;
      }
      
      setCarrinho(carrinho.map(carrinhoItem =>
        carrinhoItem.id === item.id
          ? { ...carrinhoItem, quantidade: carrinhoItem.quantidade + 1 }
          : carrinhoItem
      ));
      toast.success('Quantidade atualizada');
    } else {
      const valorInicial = item.tipo === 'servico' ? item.preco : item.valorFinal;
      setCarrinho([...carrinho, {
        ...item,
        quantidade: 1,
        valorFinal: valorInicial,
        valorPersonalizado: valorInicial // Valor editável
      }]);
      toast.success(`${item.tipo === 'servico' ? 'Serviço' : 'Produto'} adicionado ao carrinho`);
    }
  };

  const alterarValor = (id, novoValor) => {
    setCarrinho(carrinho.map(item =>
      item.id === id
        ? { ...item, valorPersonalizado: parseFloat(novoValor) || 0 }
        : item
    ));
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
    toast.success('Produto removido');
  };

  const alterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(id);
      return;
    }

    const itemCarrinho = carrinho.find(item => item.id === id);
    
    // Para produtos, verificar estoque
    if (itemCarrinho?.tipo === 'produto') {
      const produto = produtos.find(p => p.id === id);
      if (produto && novaQuantidade > produto.estoque) {
        toast.error('Estoque insuficiente');
        return;
      }
    }

    setCarrinho(carrinho.map(item =>
      item.id === id
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  const calcularTotais = () => {
    const subtotal = carrinho.reduce((acc, item) => acc + ((item.valorPersonalizado || item.valorFinal) * item.quantidade), 0);
    let valorDesconto = 0;
    
    if (tipoDesconto === 'percentage') {
      valorDesconto = (subtotal * desconto) / 100;
    } else {
      valorDesconto = desconto;
    }
    
    const total = subtotal - valorDesconto;
    
    return { subtotal, valorDesconto, total };
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast.error('Adicione produtos ou serviços ao carrinho');
      return;
    }

    if (!cliente || cliente.trim() === '') {
      toast.error('Selecione um cliente para finalizar a venda');
      return;
    }

    try {
      setLoading(true);
      const { subtotal, valorDesconto, total } = calcularTotais();
      const dataVenda = Timestamp.now();

      // 1. Criar a venda
      const vendaData = {
        itens: carrinho.map(item => ({
          produtoId: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          valorUnitario: item.valorPersonalizado || item.valorFinal,
          valorTotal: (item.valorPersonalizado || item.valorFinal) * item.quantidade
        })),
        cliente: cliente || 'Cliente não informado',
        subtotal,
        desconto: valorDesconto,
        total,
        formaPagamento,
        status: 'concluida',
        createdAt: dataVenda,
        vendedor: 'Usuário Atual' // Aqui você pode pegar do contexto de auth
      };

      const vendaRef = await addDoc(collection(db, 'vendas'), vendaData);

      // 2. Atualizar estoque apenas dos produtos (não dos serviços)
      const estoquePromises = carrinho
        .filter(item => item.tipo === 'produto')
        .map(async (item) => {
          const produtoRef = doc(db, 'produtos', item.id);
          const novoEstoque = item.estoque - item.quantidade;
          
          return updateDoc(produtoRef, {
            estoque: novoEstoque,
            updatedAt: dataVenda
          });
        });

      await Promise.all(estoquePromises);

      // 3. Registrar automaticamente no financeiro (receita)
      if (total > 0) {
        const transacaoFinanceira = {
          type: 'receita',
          description: `Venda #${vendaRef.id.substring(0, 8)} - ${cliente || 'Cliente não informado'}`,
          amount: total,
          category: 'Vendas',
          date: dataVenda,
          createdAt: dataVenda,
          source: 'venda',
          vendaId: vendaRef.id,
          formaPagamento
        };

        await addDoc(collection(db, 'transacoes_financeiras'), transacaoFinanceira);
      }

      toast.success('Venda realizada com sucesso!', {
        duration: 4000,
      });
      
      // Mostrar resumo da venda
      toast.success(`Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${formaPagamento.replace('_', ' ').toUpperCase()}`, {
        duration: 6000,
      });

      setCarrinho([]);
      setCliente('');
      setDesconto(0);
      
      // Recarregar produtos para atualizar estoque
      loadProdutos();
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error('Erro ao finalizar venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setShowClientesDropdown(false);
    };

    if (showClientesDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showClientesDropdown]);

  const { subtotal, valorDesconto, total } = calcularTotais();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
      {/* Coluna de Produtos */}
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
              <h1 className="text-3xl font-bold text-white">PDV - Ponto de Venda</h1>
              <p className="text-white/60">Venda direta de produtos e serviços</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Abas Produtos/Serviços */}
        <div className="flex bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('produtos')}
            className={`flex-1 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'produtos' 
                ? 'bg-[#FF2C68] text-white' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos ({filteredProdutos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex-1 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'servicos' 
                ? 'bg-[#FF2C68] text-white' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Serviços ({filteredServicos.length})</span>
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder={`Buscar ${activeTab === 'produtos' ? 'produtos' : 'serviços'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
          />
        </div>

        {/* Lista de Produtos/Serviços */}
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6 h-[60vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-4">
            {activeTab === 'produtos' ? 'Produtos Disponíveis' : 'Serviços Disponíveis'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10 hover:border-[#FF2C68]/30 transition-all cursor-pointer hover:scale-105"
                onClick={() => adicionarAoCarrinho(item)}
              >
                <div className="flex items-center space-x-4">
                  {item.imagem ? (
                    <img 
                      src={item.imagem} 
                      alt={item.nome}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-lg flex items-center justify-center">
                      {item.tipo === 'servico' ? (
                        <Wrench className="w-6 h-6 text-[#FF2C68]" />
                      ) : (
                        <Package className="w-6 h-6 text-[#FF2C68]" />
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{item.nome}</h3>
                    <p className="text-white/60 text-sm">{item.categoria}</p>
                    {item.tipo === 'servico' && item.descricao && (
                      <p className="text-white/40 text-xs mt-1 line-clamp-2">{item.descricao}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-green-400 font-bold">
                        R$ {(item.tipo === 'servico' ? item.preco : item.valorFinal)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {item.tipo === 'produto' && (
                        <span className="text-white/60 text-sm">
                          Estoque: {item.estoque}
                        </span>
                      )}
                      {item.tipo === 'servico' && item.duracao && (
                        <span className="text-blue-400 text-sm">
                          {item.duracao}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Plus className="w-5 h-5 text-green-400" />
                </div>
              </div>
            ))}
          </div>
          
          {currentItems.length === 0 && (
            <div className="text-center py-8">
              {activeTab === 'produtos' ? (
                <Package className="w-12 h-12 text-white/30 mx-auto mb-4" />
              ) : (
                <Wrench className="w-12 h-12 text-white/30 mx-auto mb-4" />
              )}
              <p className="text-white/60">
                Nenhum {activeTab === 'produtos' ? 'produto' : 'serviço'} encontrado
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna do Carrinho */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6 flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-[#FF2C68]" />
          <h2 className="text-xl font-bold text-white">Carrinho ({carrinho.length})</h2>
        </div>

        {/* Itens do Carrinho */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          {carrinho.map((item) => (
            <div key={item.id} className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {item.tipo === 'servico' ? (
                    <Wrench className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Package className="w-4 h-4 text-green-400" />
                  )}
                  <h4 className="text-white font-medium text-sm">{item.nome}</h4>
                </div>
                <button
                  onClick={() => removerDoCarrinho(item.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                    className="w-6 h-6 bg-red-500/20 rounded text-red-400 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white w-8 text-center">{item.quantidade}</span>
                  <button
                    onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                    className="w-6 h-6 bg-green-500/20 rounded text-green-400 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <span className="text-white/60 text-xs">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.valorPersonalizado || item.valorFinal}
                      onChange={(e) => alterarValor(item.id, e.target.value)}
                      className="w-16 px-1 py-0 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded text-white text-xs text-right focus:border-[#FF2C68] focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-green-400 font-bold">
                    R$ {((item.valorPersonalizado || item.valorFinal) * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {item.tipo === 'servico' && (
                    <p className="text-blue-400 text-xs">Serviço</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {carrinho.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-white/60 text-sm">Carrinho vazio</p>
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <label className="block text-white font-medium mb-2">Cliente</label>
            <input
              type="text"
              value={clienteSearch}
              onChange={(e) => {
                setClienteSearch(e.target.value);
                setShowClientesDropdown(true);
                setCliente(e.target.value);
              }}
              onFocus={() => setShowClientesDropdown(true)}
              placeholder="Digite o nome do cliente..."
              className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
            />
            
            {/* Dropdown de Clientes */}
            {showClientesDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-[#0D0C0C] border border-[#FF2C68]/30 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                {clientes
                  .filter(c => c.nome?.toLowerCase().includes(clienteSearch.toLowerCase()))
                  .slice(0, 5)
                  .map((clienteObj, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCliente(clienteObj.nome);
                        setClienteSearch(clienteObj.nome);
                        setShowClientesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#FF2C68]/20 text-white border-b border-white/10 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">{clienteObj.nome}</p>
                        {clienteObj.telefone && (
                          <p className="text-xs text-white/60">{clienteObj.telefone}</p>
                        )}
                      </div>
                    </button>
                  ))}
                
                {clientes.filter(c => c.nome?.toLowerCase().includes(clienteSearch.toLowerCase())).length === 0 && clienteSearch && (
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

          {/* Desconto */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-white font-medium mb-2">Desconto</label>
              <input
                type="number"
                value={desconto}
                onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Tipo</label>
              <select
                value={tipoDesconto}
                onChange={(e) => setTipoDesconto(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
              >
                <option value="percentage">%</option>
                <option value="fixed">R$</option>
              </select>
            </div>
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

        {/* Forma de Pagamento */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-2">Forma de Pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {formasPagamento.map((forma) => (
              <button
                key={forma.value}
                onClick={() => setFormaPagamento(forma.value)}
                className={`p-3 rounded-lg border transition-all ${
                  formaPagamento === forma.value
                    ? 'border-[#FF2C68] bg-[#FF2C68]/20 text-[#FF2C68]'
                    : 'border-white/20 text-white/60 hover:border-white/40'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <forma.icon className="w-5 h-5" />
                  <span className="text-xs">{forma.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Botão Finalizar */}
        <button
          onClick={finalizarVenda}
          disabled={carrinho.length === 0 || loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processando...</span>
            </>
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              <span>Finalizar Venda</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 