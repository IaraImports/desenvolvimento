import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Receipt
} from 'lucide-react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function PDV() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
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
  const [showFinalizacao, setShowFinalizacao] = useState(false);

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
    { value: 'pix', label: 'PIX', icon: Hash }
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

  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade < produto.estoque) {
        setCarrinho(carrinho.map(item =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        ));
        toast.success('Quantidade atualizada');
      } else {
        toast.error('Estoque insuficiente');
      }
    } else {
      setCarrinho([...carrinho, {
        ...produto,
        quantidade: 1
      }]);
      toast.success('Produto adicionado ao carrinho');
    }
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

    const produto = produtos.find(p => p.id === id);
    if (novaQuantidade > produto.estoque) {
      toast.error('Estoque insuficiente');
      return;
    }

    setCarrinho(carrinho.map(item =>
      item.id === id
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  const calcularTotais = () => {
    const subtotal = carrinho.reduce((acc, item) => acc + (item.valorFinal * item.quantidade), 0);
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
      toast.error('Adicione produtos ao carrinho');
      return;
    }

    try {
      setLoading(true);
      const { subtotal, valorDesconto, total } = calcularTotais();

      const vendaData = {
        itens: carrinho.map(item => ({
          produtoId: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          valorUnitario: item.valorFinal,
          valorTotal: item.valorFinal * item.quantidade
        })),
        cliente: cliente || 'Cliente não informado',
        subtotal,
        desconto: valorDesconto,
        total,
        formaPagamento,
        status: 'concluida',
        createdAt: new Date(),
        vendedor: 'Usuário Atual' // Aqui você pode pegar do contexto de auth
      };

      await addDoc(collection(db, 'vendas'), vendaData);
      
      toast.success('Venda realizada com sucesso!');
      setCarrinho([]);
      setCliente('');
      setDesconto(0);
      setShowFinalizacao(false);
      
      // Recarregar produtos para atualizar estoque
      loadProdutos();
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error('Erro ao finalizar venda');
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
              <p className="text-white/60">Venda direta de produtos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
          />
        </div>

        {/* Lista de Produtos */}
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6 h-[60vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-4">Produtos Disponíveis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProdutos.map((produto) => (
              <motion.div
                key={produto.id}
                className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10 hover:border-[#FF2C68]/30 transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => adicionarAoCarrinho(produto)}
              >
                <div className="flex items-center space-x-4">
                  {produto.imagem ? (
                    <img 
                      src={produto.imagem} 
                      alt={produto.nome}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#FF2C68]" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{produto.nome}</h3>
                    <p className="text-white/60 text-sm">{produto.categoria}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-green-400 font-bold">
                        R$ {produto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-white/60 text-sm">
                        Estoque: {produto.estoque}
                      </span>
                    </div>
                  </div>
                  
                  <Plus className="w-5 h-5 text-green-400" />
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredProdutos.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhum produto encontrado</p>
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
                <h4 className="text-white font-medium text-sm">{item.nome}</h4>
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
                  <p className="text-white/60 text-xs">
                    R$ {item.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} un.
                  </p>
                  <p className="text-green-400 font-bold">
                    R$ {(item.valorFinal * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
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