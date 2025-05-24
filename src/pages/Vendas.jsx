import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  Plus,
  Search,
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  Package,
  Wrench,
  Trash2,
  Eye,
  X,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Vendas() {
  const { vendas, produtos, servicos, clientes, addVenda, addCliente } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [cliente, setCliente] = useState('');
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: ''
  });
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
  const [showNovoCliente, setShowNovoCliente] = useState(false);

  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = venda.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venda.id.toString().includes(searchTerm);
    const matchesStatus = !filterStatus || venda.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const addItemCarrinho = (item, tipo) => {
    const itemExistente = carrinho.find(c => c.id === item.id && c.tipo === tipo);
    if (itemExistente) {
      setCarrinho(carrinho.map(c => 
        c.id === item.id && c.tipo === tipo 
          ? { ...c, quantidade: c.quantidade + 1 }
          : c
      ));
    } else {
      setCarrinho([...carrinho, {
        ...item,
        tipo,
        quantidade: 1
      }]);
    }
  };

  const removeItemCarrinho = (id, tipo) => {
    setCarrinho(carrinho.filter(item => !(item.id === id && item.tipo === tipo)));
  };

  const updateQuantidade = (id, tipo, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removeItemCarrinho(id, tipo);
      return;
    }
    setCarrinho(carrinho.map(item => 
      item.id === id && item.tipo === tipo 
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const handleFinalizarVenda = () => {
    if (carrinho.length === 0 || !cliente) {
      alert('Adicione itens ao carrinho e selecione um cliente');
      return;
    }

    const novaVenda = {
      cliente,
      itens: carrinho.map(item => ({
        tipo: item.tipo,
        id: item.id,
        nome: item.nome,
        quantidade: item.quantidade,
        preco: item.preco
      })),
      total: calcularTotal(),
      status: 'concluida',
      metodoPagamento
    };

    addVenda(novaVenda);
    setCarrinho([]);
    setCliente('');
    setMetodoPagamento('dinheiro');
    setShowModal(false);
    alert('Venda realizada com sucesso!');
  };

  const handleAddCliente = () => {
    if (!novoCliente.nome) {
      alert('Nome do cliente é obrigatório');
      return;
    }
    addCliente(novoCliente);
    setCliente(novoCliente.nome);
    setNovoCliente({ nome: '', email: '', telefone: '', endereco: '' });
    setShowNovoCliente(false);
  };

  const handleViewDetails = (venda) => {
    setSelectedVenda(venda);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendas</h2>
          <p className="text-gray-600">Gerencie suas vendas e faturamento</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Venda
        </button>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar vendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="">Todos os status</option>
            <option value="concluida">Concluída</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {filteredVendas.length} venda(s) encontrada(s)
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendas.map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{venda.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{venda.cliente}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(venda.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R$ {venda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venda.metodoPagamento === 'dinheiro' ? 'Dinheiro' :
                     venda.metodoPagamento === 'cartao' ? 'Cartão' :
                     venda.metodoPagamento === 'pix' ? 'PIX' : 'Outros'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      venda.status === 'concluida' 
                        ? 'bg-green-100 text-green-800'
                        : venda.status === 'pendente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {venda.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(venda)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Venda */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Nova Venda</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCarrinho([]);
                  setCliente('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Produtos e Serviços */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Produtos e Serviços</h4>
                
                {/* Produtos */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Produtos</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {produtos.filter(p => p.status === 'ativo' && p.estoque > 0).map(produto => (
                      <div key={produto.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{produto.nome}</div>
                          <div className="text-xs text-gray-500">
                            R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                            - Estoque: {produto.estoque}
                          </div>
                        </div>
                        <button
                          onClick={() => addItemCarrinho(produto, 'produto')}
                          className="btn-primary text-xs px-2 py-1"
                        >
                          Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Serviços */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Serviços</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {servicos.filter(s => s.status === 'ativo').map(servico => (
                      <div key={servico.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{servico.nome}</div>
                          <div className="text-xs text-gray-500">
                            R$ {servico.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            - {servico.duracao}
                          </div>
                        </div>
                        <button
                          onClick={() => addItemCarrinho(servico, 'servico')}
                          className="btn-primary text-xs px-2 py-1"
                        >
                          Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Carrinho */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Carrinho de Compras</h4>
                
                {/* Itens do Carrinho */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {carrinho.map(item => (
                    <div key={`${item.tipo}-${item.id}`} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center flex-1">
                        {item.tipo === 'produto' ? 
                          <Package className="h-4 w-4 text-blue-500 mr-2" /> :
                          <Wrench className="h-4 w-4 text-green-500 mr-2" />
                        }
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.nome}</div>
                          <div className="text-xs text-gray-500">
                            R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => updateQuantidade(item.id, item.tipo, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border rounded"
                        />
                        <button
                          onClick={() => removeItemCarrinho(item.id, item.tipo)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNovoCliente(true)}
                      className="btn-secondary"
                    >
                      Novo
                    </button>
                  </div>
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pagamento
                  </label>
                  <select
                    value={metodoPagamento}
                    onChange={(e) => setMetodoPagamento(e.target.value)}
                    className="input-field"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>

                {/* Botão Finalizar */}
                <button
                  onClick={handleFinalizarVenda}
                  className="w-full btn-primary"
                >
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showNovoCliente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Novo Cliente</h3>
              <button
                onClick={() => setShowNovoCliente(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={novoCliente.email}
                  onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={novoCliente.endereco}
                  onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNovoCliente(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCliente}
                  className="btn-primary"
                >
                  Adicionar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Venda */}
      {showDetails && selectedVenda && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detalhes da Venda #{selectedVenda.id}</h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedVenda(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Cliente</label>
                <p className="text-sm text-gray-900">{selectedVenda.cliente}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Data</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(selectedVenda.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Itens</label>
                <div className="space-y-2">
                  {selectedVenda.itens.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.nome} (x{item.quantidade})</span>
                      <span>R$ {(item.preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Método de Pagamento</label>
                <p className="text-sm text-gray-900">
                  {selectedVenda.metodoPagamento === 'dinheiro' ? 'Dinheiro' :
                   selectedVenda.metodoPagamento === 'cartao' ? 'Cartão' :
                   selectedVenda.metodoPagamento === 'pix' ? 'PIX' : 'Outros'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total</label>
                <p className="text-lg font-bold text-gray-900">
                  R$ {selectedVenda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedVenda.status === 'concluida' 
                    ? 'bg-green-100 text-green-800'
                    : selectedVenda.status === 'pendente'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedVenda.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 