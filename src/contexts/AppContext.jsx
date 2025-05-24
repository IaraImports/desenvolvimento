import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  addDocument, 
  getDocumentsByUser, 
  updateDocument, 
  deleteDocument 
} from '../config/firebase';
import toast from 'react-hot-toast';

const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
}

// Estado inicial
const initialState = {
  produtos: [],
  servicos: [],
  vendas: [],
  clientes: [],
  loading: false
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_PRODUTOS':
      return { ...state, produtos: action.payload };
    
    case 'ADD_PRODUTO':
      return { ...state, produtos: [...state.produtos, action.payload] };
    
    case 'UPDATE_PRODUTO':
      return {
        ...state,
        produtos: state.produtos.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };
    
    case 'DELETE_PRODUTO':
      return {
        ...state,
        produtos: state.produtos.filter(p => p.id !== action.payload)
      };
    
    case 'SET_SERVICOS':
      return { ...state, servicos: action.payload };
    
    case 'ADD_SERVICO':
      return { ...state, servicos: [...state.servicos, action.payload] };
    
    case 'UPDATE_SERVICO':
      return {
        ...state,
        servicos: state.servicos.map(s =>
          s.id === action.payload.id ? action.payload : s
        )
      };
    
    case 'DELETE_SERVICO':
      return {
        ...state,
        servicos: state.servicos.filter(s => s.id !== action.payload)
      };
    
    case 'SET_VENDAS':
      return { ...state, vendas: action.payload };
    
    case 'ADD_VENDA':
      return { ...state, vendas: [action.payload, ...state.vendas] };
    
    case 'SET_CLIENTES':
      return { ...state, clientes: action.payload };
    
    case 'ADD_CLIENTE':
      return { ...state, clientes: [...state.clientes, action.payload] };
    
    case 'UPDATE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.map(c =>
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Carregar dados do Firebase quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Carregar produtos
      const produtosSnapshot = await getDocumentsByUser('produtos', user.uid);
      const produtos = produtosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch({ type: 'SET_PRODUTOS', payload: produtos });

      // Carregar serviços
      const servicosSnapshot = await getDocumentsByUser('servicos', user.uid);
      const servicos = servicosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch({ type: 'SET_SERVICOS', payload: servicos });

      // Carregar vendas
      const vendasSnapshot = await getDocumentsByUser('vendas', user.uid);
      const vendas = vendasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch({ type: 'SET_VENDAS', payload: vendas });

      // Carregar clientes
      const clientesSnapshot = await getDocumentsByUser('clientes', user.uid);
      const clientes = clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch({ type: 'SET_CLIENTES', payload: clientes });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Funções para produtos
  const addProduto = async (produto) => {
    if (!user) return;
    
    try {
      const docRef = await addDocument('produtos', {
        ...produto,
        userId: user.uid
      });
      const novoProduto = { id: docRef.id, ...produto, userId: user.uid };
      dispatch({ type: 'ADD_PRODUTO', payload: novoProduto });
      toast.success('Produto adicionado com sucesso!');
      return novoProduto;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
      throw error;
    }
  };

  const updateProduto = async (id, produto) => {
    if (!user) return;
    
    try {
      await updateDocument('produtos', id, produto);
      const produtoAtualizado = { id, ...produto, userId: user.uid };
      dispatch({ type: 'UPDATE_PRODUTO', payload: produtoAtualizado });
      toast.success('Produto atualizado com sucesso!');
      return produtoAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
      throw error;
    }
  };

  const deleteProduto = async (id) => {
    try {
      await deleteDocument('produtos', id);
      dispatch({ type: 'DELETE_PRODUTO', payload: id });
      toast.success('Produto removido com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao remover produto');
      throw error;
    }
  };

  // Funções para serviços
  const addServico = async (servico) => {
    if (!user) return;
    
    try {
      const docRef = await addDocument('servicos', {
        ...servico,
        userId: user.uid
      });
      const novoServico = { id: docRef.id, ...servico, userId: user.uid };
      dispatch({ type: 'ADD_SERVICO', payload: novoServico });
      toast.success('Serviço adicionado com sucesso!');
      return novoServico;
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      toast.error('Erro ao adicionar serviço');
      throw error;
    }
  };

  const updateServico = async (id, servico) => {
    if (!user) return;
    
    try {
      await updateDocument('servicos', id, servico);
      const servicoAtualizado = { id, ...servico, userId: user.uid };
      dispatch({ type: 'UPDATE_SERVICO', payload: servicoAtualizado });
      toast.success('Serviço atualizado com sucesso!');
      return servicoAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast.error('Erro ao atualizar serviço');
      throw error;
    }
  };

  const deleteServico = async (id) => {
    try {
      await deleteDocument('servicos', id);
      dispatch({ type: 'DELETE_SERVICO', payload: id });
      toast.success('Serviço removido com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      toast.error('Erro ao remover serviço');
      throw error;
    }
  };

  // Funções para vendas
  const addVenda = async (venda) => {
    if (!user) return;
    
    try {
      const docRef = await addDocument('vendas', {
        ...venda,
        userId: user.uid
      });
      const novaVenda = { id: docRef.id, ...venda, userId: user.uid };
      dispatch({ type: 'ADD_VENDA', payload: novaVenda });
      toast.success('Venda registrada com sucesso!');
      return novaVenda;
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      toast.error('Erro ao registrar venda');
      throw error;
    }
  };

  // Funções para clientes
  const addCliente = async (cliente) => {
    if (!user) return;
    
    try {
      const docRef = await addDocument('clientes', {
        ...cliente,
        userId: user.uid
      });
      const novoCliente = { id: docRef.id, ...cliente, userId: user.uid };
      dispatch({ type: 'ADD_CLIENTE', payload: novoCliente });
      toast.success('Cliente adicionado com sucesso!');
      return novoCliente;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error('Erro ao adicionar cliente');
      throw error;
    }
  };

  const updateCliente = async (id, cliente) => {
    if (!user) return;
    
    try {
      await updateDocument('clientes', id, cliente);
      const clienteAtualizado = { id, ...cliente, userId: user.uid };
      dispatch({ type: 'UPDATE_CLIENTE', payload: clienteAtualizado });
      toast.success('Cliente atualizado com sucesso!');
      return clienteAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
      throw error;
    }
  };

  const value = {
    // Estado
    ...state,
    
    // Funções
    loadAllData,
    
    // Produtos
    addProduto,
    updateProduto,
    deleteProduto,
    
    // Serviços
    addServico,
    updateServico,
    deleteServico,
    
    // Vendas
    addVenda,
    
    // Clientes
    addCliente,
    updateCliente,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
} 