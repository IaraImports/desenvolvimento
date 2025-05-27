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
  Wrench,
  X
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
    <div className="space-y-8">
      {/* Header Profissional */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-[#FF2C68]/20 to-blue-500/20 blur-3xl"></div>
        <div className="relative bg-[#0D0C0C]/50 backdrop-blur-xl rounded-3xl border border-[#FF2C68]/50 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/vendas')}
                className="group p-4 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-2xl text-white hover:from-gray-500/30 hover:to-gray-600/30 transition-all duration-200 hover:scale-105 border border-gray-500/30"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent">
                    🏪 PDV - Ponto de Venda
                  </h1>
                  <p className="text-white/70 text-lg mt-1">
                    Sistema profissional de vendas diretas
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Sistema Ativo</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{new Date().toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#FF2C68]">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Operador Ativo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats de Performance */}
            <div className="flex space-x-4">
              <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{carrinho.length}</div>
                <div className="text-green-300 text-sm">Itens</div>
              </div>
              <div className="bg-[#FF2C68]/20 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 text-center">
                <div className="text-2xl font-bold text-[#FF2C68]">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="text-[#FF2C68] text-sm">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-300px)]">
        {/* Coluna de Produtos */}
        <div className="lg:col-span-2 space-y-6">

        {/* Abas Produtos/Serviços Profissionais */}
        <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('produtos')}
              className={`group relative p-6 rounded-xl transition-all duration-300 ${
                activeTab === 'produtos' 
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/50 shadow-lg' 
                  : 'bg-[#0D0C0C]/50 border-white/10 hover:border-green-500/30 hover:bg-green-500/10'
              } border`}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === 'produtos'
                    ? 'bg-green-500/30 text-green-300 scale-110'
                    : 'bg-green-500/20 text-green-400 group-hover:scale-105'
                }`}>
                  <Package className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className={`font-bold text-lg ${
                    activeTab === 'produtos' ? 'text-green-300' : 'text-white group-hover:text-green-300'
                  }`}>
                    Produtos
                  </div>
                  <div className={`text-sm ${
                    activeTab === 'produtos' ? 'text-green-400' : 'text-white/60'
                  }`}>
                    {filteredProdutos.length} disponíveis
                  </div>
                </div>
              </div>
              {activeTab === 'produtos' && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl blur-xl -z-10"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('servicos')}
              className={`group relative p-6 rounded-xl transition-all duration-300 ${
                activeTab === 'servicos' 
                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/50 shadow-lg' 
                  : 'bg-[#0D0C0C]/50 border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10'
              } border`}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === 'servicos'
                    ? 'bg-blue-500/30 text-blue-300 scale-110'
                    : 'bg-blue-500/20 text-blue-400 group-hover:scale-105'
                }`}>
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className={`font-bold text-lg ${
                    activeTab === 'servicos' ? 'text-blue-300' : 'text-white group-hover:text-blue-300'
                  }`}>
                    Serviços
                  </div>
                  <div className={`text-sm ${
                    activeTab === 'servicos' ? 'text-blue-400' : 'text-white/60'
                  }`}>
                    {filteredServicos.length} disponíveis
                  </div>
                </div>
              </div>
              {activeTab === 'servicos' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl blur-xl -z-10"></div>
              )}
            </button>
          </div>
        </div>

        {/* Busca Avançada */}
        <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF2C68] to-pink-600 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Buscar Itens</h3>
              <p className="text-white/60">Encontre {activeTab === 'produtos' ? 'produtos' : 'serviços'} rapidamente</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder={`Digite o nome ${activeTab === 'produtos' ? 'do produto' : 'do serviço'} ou categoria...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#0D0C0C]/50 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FF2C68] focus:ring-2 focus:ring-[#FF2C68]/20 focus:outline-none transition-all duration-200 hover:border-white/30"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {searchTerm && (
            <div className="mt-3 text-sm text-white/60">
              {currentItems.length} {activeTab === 'produtos' ? 'produto(s)' : 'serviço(s)'} encontrado(s) para "{searchTerm}"
            </div>
          )}
        </div>

        {/* Lista de Produtos/Serviços Profissional */}
        <div className="bg-[#0D0C0C]/30 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'produtos' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {activeTab === 'produtos' ? (
                    <Package className="w-5 h-5" />
                  ) : (
                    <Wrench className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {activeTab === 'produtos' ? '📦 Catálogo de Produtos' : '🔧 Catálogo de Serviços'}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {currentItems.length} {activeTab === 'produtos' ? 'produtos' : 'serviços'} disponíveis
                  </p>
                </div>
              </div>
              
              <div className="text-white/60 text-sm">
                Clique para adicionar ao carrinho
              </div>
            </div>
          </div>
          
          <div className="h-[55vh] overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-gradient-to-br from-[#0D0C0C]/50 to-[#0D0C0C]/30 rounded-2xl p-6 border border-white/10 hover:border-[#FF2C68]/50 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-2xl"
                  onClick={() => adicionarAoCarrinho(item)}
                >
                  <div className="flex items-start space-x-4">
                    {item.imagem ? (
                      <div className="relative">
                        <img 
                          src={item.imagem} 
                          alt={item.nome}
                          className="w-16 h-16 object-cover rounded-xl border-2 border-white/10 group-hover:border-[#FF2C68]/30 transition-colors"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${
                        item.tipo === 'servico' 
                          ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30' 
                          : 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30'
                      }`}>
                        {item.tipo === 'servico' ? (
                          <Wrench className="w-8 h-8 text-blue-400" />
                        ) : (
                          <Package className="w-8 h-8 text-green-400" />
                        )}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg group-hover:text-[#FF2C68] transition-colors">
                        {item.nome}
                      </h3>
                      <p className="text-white/60 text-sm mb-2">{item.categoria}</p>
                      
                      {item.tipo === 'servico' && item.descricao && (
                        <p className="text-white/50 text-xs mb-3 line-clamp-2 leading-relaxed">
                          {item.descricao}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-green-400 font-bold text-xl">
                            R$ {(item.tipo === 'servico' ? item.preco : item.valorFinal)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {item.tipo === 'produto' && (
                            <span className={`text-xs font-medium ${
                              item.estoque > 10 ? 'text-green-400' : item.estoque > 0 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {item.estoque > 0 ? `${item.estoque} em estoque` : 'Sem estoque'}
                            </span>
                          )}
                          {item.tipo === 'servico' && item.duracao && (
                            <span className="text-blue-400 text-xs">
                              ⏱️ {item.duracao}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {item.tipo === 'servico' && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
                              Serviço
                            </span>
                          )}
                          {item.tipo === 'produto' && item.estoque <= 5 && item.estoque > 0 && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
                              Baixo Estoque
                            </span>
                          )}
                          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                            <Plus className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {currentItems.length === 0 && (
              <div className="text-center py-16">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center ${
                  activeTab === 'produtos' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {activeTab === 'produtos' ? (
                    <Package className="w-12 h-12" />
                  ) : (
                    <Wrench className="w-12 h-12" />
                  )}
                </div>
                <h3 className="text-white font-bold text-xl mb-2">
                  Nenhum {activeTab === 'produtos' ? 'produto' : 'serviço'} encontrado
                </h3>
                <p className="text-white/60 mb-6">
                  {searchTerm 
                    ? `Nenhum resultado para "${searchTerm}"`
                    : `Nenhum ${activeTab === 'produtos' ? 'produto' : 'serviço'} disponível no momento`
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-3 bg-[#FF2C68]/20 text-[#FF2C68] rounded-xl hover:bg-[#FF2C68]/30 transition-colors"
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coluna do Carrinho Profissional */}
      <div className="bg-gradient-to-br from-[#0D0C0C]/60 via-[#0D0C0C]/50 to-[#0D0C0C]/60 backdrop-blur-xl rounded-3xl border border-[#FF2C68]/50 overflow-hidden flex flex-col shadow-2xl">
        {/* Header do Carrinho */}
        <div className="bg-gradient-to-r from-[#FF2C68]/20 via-[#FF2C68]/10 to-[#FF2C68]/20 p-6 border-b border-[#FF2C68]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF2C68] to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  🛒 Carrinho de Vendas
                </h2>
                <p className="text-white/70">
                  {carrinho.length} {carrinho.length === 1 ? 'item selecionado' : 'itens selecionados'}
                </p>
              </div>
            </div>
            
            {carrinho.length > 0 && (
              <button
                onClick={() => setCarrinho([])}
                className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                title="Limpar carrinho"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Itens do Carrinho */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {carrinho.map((item, index) => (
            <div key={item.id} className="group bg-gradient-to-br from-[#0D0C0C]/40 to-[#0D0C0C]/20 rounded-2xl p-5 border border-white/10 hover:border-[#FF2C68]/30 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.tipo === 'servico' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {item.tipo === 'servico' ? (
                      <Wrench className="w-5 h-5" />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-base group-hover:text-[#FF2C68] transition-colors">
                      {item.nome}
                    </h4>
                    <p className="text-white/60 text-sm">{item.categoria}</p>
                    {item.tipo === 'servico' && (
                      <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium mt-1">
                        Serviço
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removerDoCarrinho(item.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all hover:scale-105"
                  title="Remover item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Controles de Quantidade */}
                <div>
                  <label className="block text-white/70 text-xs mb-2 font-medium">Quantidade</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 flex items-center justify-center transition-colors hover:scale-105"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-white font-bold text-lg">{item.quantidade}</span>
                      <p className="text-white/60 text-xs">
                        {item.quantidade === 1 ? 'unidade' : 'unidades'}
                      </p>
                    </div>
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="w-8 h-8 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 flex items-center justify-center transition-colors hover:scale-105"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Preço Unitário e Total */}
                <div>
                  <label className="block text-white/70 text-xs mb-2 font-medium">Valor Unitário</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-white/60 text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.valorPersonalizado || item.valorFinal}
                        onChange={(e) => alterarValor(item.id, e.target.value)}
                        className="flex-1 px-2 py-1 bg-[#0D0C0C]/50 border border-white/20 rounded-lg text-white text-sm text-right focus:border-[#FF2C68] focus:ring-1 focus:ring-[#FF2C68]/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">
                        R$ {((item.valorPersonalizado || item.valorFinal) * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/60 text-xs">Total do item</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Número do item */}
              <div className="absolute top-3 right-14 w-6 h-6 bg-[#FF2C68]/20 text-[#FF2C68] rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
            </div>
          ))}

          {carrinho.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#FF2C68]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-[#FF2C68]" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Carrinho Vazio</h3>
              <p className="text-white/60 text-sm mb-6">
                Adicione produtos ou serviços para começar uma venda
              </p>
              <div className="flex items-center justify-center space-x-2 text-white/40 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Aguardando itens...</span>
              </div>
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="bg-[#0D0C0C]/30 rounded-2xl border border-white/10 p-6 space-y-4">
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

        {/* Totais Profissionais */}
        <div className="bg-gradient-to-br from-[#0D0C0C]/50 to-[#0D0C0C]/30 rounded-2xl border border-[#FF2C68]/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Resumo da Venda</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#0D0C0C]/40 rounded-xl">
              <span className="text-white/70 font-medium">Subtotal:</span>
              <span className="text-white font-bold text-lg">
                R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {valorDesconto > 0 && (
              <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">Desconto:</span>
                </div>
                <span className="text-red-400 font-bold text-lg">
                  - R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold text-lg">TOTAL A PAGAR:</span>
              </div>
              <span className="text-green-400 font-bold text-2xl">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {carrinho.length > 0 && (
              <div className="text-center text-white/60 text-sm pt-2">
                {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'} • 
                Economia: R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="bg-[#0D0C0C]/30 rounded-2xl border border-white/10 p-6">
          <label className="block text-white font-medium mb-4">Forma de Pagamento</label>
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

        {/* Botão Finalizar Profissional */}
        <div className="space-y-4 p-6">
          {carrinho.length > 0 && (
            <div className="bg-blue-500/10 rounded-2xl border border-blue-500/30 p-4">
              <div className="flex items-center space-x-2 text-blue-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Pronto para finalizar</span>
              </div>
              <p className="text-white/70 text-sm">
                Verifique os itens e clique em finalizar para processar a venda
              </p>
            </div>
          )}
          
          <button
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || loading}
            className={`w-full py-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 border-2 ${
              carrinho.length === 0 
                ? 'bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed' 
                : loading
                ? 'bg-[#FF2C68]/30 border-[#FF2C68]/50 text-[#FF2C68]'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-green-500 text-white hover:scale-105 shadow-lg hover:shadow-green-500/25'
            }`}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin" />
                <span>Processando Venda...</span>
              </>
            ) : carrinho.length === 0 ? (
              <>
                <ShoppingCart className="w-6 h-6" />
                <span>Adicione Itens ao Carrinho</span>
              </>
            ) : (
              <>
                <Receipt className="w-6 h-6" />
                <span>🚀 Finalizar Venda - R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <CheckCircle className="w-6 h-6" />
              </>
            )}
          </button>
          
          {carrinho.length > 0 && !loading && (
            <div className="text-center">
              <p className="text-white/60 text-sm">
                💳 Pagamento via {formasPagamento.find(f => f.value === formaPagamento)?.label}
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
} 