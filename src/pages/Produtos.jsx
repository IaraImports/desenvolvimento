import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Package, Filter, Eye, X, Save,
  Upload, Smartphone, Battery, Palette, Cpu, Building2, Gift,
  HardDrive, DollarSign, Truck, Calculator, Percent, RefreshCw,
  Image, Zap, Grid, List, Settings, FileText, Layers
} from 'lucide-react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { usePermissions } from '../hooks/usePermissions';
import { toast } from 'react-hot-toast';

export default function Produtos() {
  const { 
    canView, 
    canCreate, 
    canEdit, 
    canDelete,
    hasPermission
  } = usePermissions();
  
  // Verificar permissões de produtos
  const canViewProducts = canView('products');
  const canCreateProducts = canCreate('products');
  const canEditProducts = canEdit('products');
  const canDeleteProducts = canDelete('products');

  // Verificar se tem permissão para acessar esta página
  if (!canViewProducts) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-white/60 mb-6">
            Você não tem permissão para visualizar produtos.
          </p>
          <p className="text-white/40 text-sm">
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterFornecedor, setFilterFornecedor] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [bulkAddText, setBulkAddText] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [customChips, setCustomChips] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showChipModal, setShowChipModal] = useState(false);
  const [novoChip, setNovoChip] = useState('');

  // Estados para o formulário expandido
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    descricao: '',
    status: 'ativo',
    
    // Especificações técnicas
    nivelBateria: '',
    cor: '',
    chip: '',
    modoChip: '',
    armazenamento: '',
    
    // Comercial
    fornecedorId: '',
    temBrinde: false,
    brinde: '',
    
    // Financeiro
    valorCusto: '',
    valorFrete: '',
    tipoLucro: 'percentage',
    lucroPercentual: '',
    lucroFixo: '',
    valorFinal: 0,
    
    // Outros
    estoque: '',
    imagem: ''
  });

  const categorias = customCategories.length > 0 ? customCategories : [
    'Smartphone',
    'Tablet',
    'Notebook',
    'Desktop',
    'Acessórios',
    'Peças',
    'Outros'
  ];

  const modosChip = [
    { value: 'fisico+esim', label: 'Chip Físico + E-SIM' },
    { value: 'fisico', label: 'Chip Físico' },
    { value: 'esim', label: 'E-SIM' }
  ];

  const niveisChipBase = [
    // Snapdragon
    'Snapdragon 8 Gen 3',
    'Snapdragon 8 Gen 2', 
    'Snapdragon 8 Gen 1',
    'Snapdragon 888',
    'Snapdragon 870',
    'Snapdragon 865',
    'Snapdragon 7 Gen 3',
    'Snapdragon 7 Gen 1',
    'Snapdragon 6 Gen 1',
    'Snapdragon 695',
    'Snapdragon 680',
    'Snapdragon 662',
    'Snapdragon 460',
    
    // MediaTek
    'MediaTek Dimensity 9300',
    'MediaTek Dimensity 9000',
    'MediaTek Dimensity 8200',
    'MediaTek Dimensity 8000',
    'MediaTek Dimensity 7200',
    'MediaTek Dimensity 7000',
    'MediaTek Dimensity 6000',
    'MediaTek Helio G99',
    'MediaTek Helio G96',
    'MediaTek Helio G88',
    'MediaTek Helio G85',
    'MediaTek Helio P95',
    
    // Apple
    'Apple A17 Pro',
    'Apple A16 Bionic',
    'Apple A15 Bionic',
    'Apple A14 Bionic',
    'Apple A13 Bionic',
    'Apple A12 Bionic',
    'Apple A11 Bionic',
    
    // Samsung Exynos
    'Exynos 2400',
    'Exynos 2200',
    'Exynos 2100',
    'Exynos 990',
    'Exynos 980',
    'Exynos 9611',
    
    // Google
    'Google Tensor G3',
    'Google Tensor G2',
    'Google Tensor G1',
    
    // Outros
    'Intel Core i5',
    'Intel Core i7',
    'AMD Ryzen 5',
    'AMD Ryzen 7'
  ];

  const niveisChip = [...niveisChipBase, ...customChips, 'Outro (especificar)'];

  const opcoesArmazenamento = [
    '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'
  ];

  // Função para parser do cadastro rápido
  const parseQuickAddText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    let produto = { ...formData };

    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Extrair nome do produto (linha com 📲)
      if (cleanLine.includes('📲')) {
        const nome = cleanLine.replace(/📲|🚀|🔥|PEÇA ÚNICA/g, '').trim();
        produto.nome = nome;
        
        // Extrair armazenamento
        const storageMatch = nome.match(/(\d+GB|\d+TB)/i);
        if (storageMatch) {
          produto.armazenamento = storageMatch[1];
        }
        
        // Extrair categoria baseado no nome
        if (nome.toUpperCase().includes('IPHONE')) {
          produto.categoria = 'Smartphone';
        }
      }
      
      // Extrair cor e bateria
      if (cleanLine.includes('🖤') || cleanLine.includes('🤍') || cleanLine.includes('🔋')) {
        const corMatch = cleanLine.match(/(PRETO|BRANCO|AZUL|ROSA|DOURADO|PRATA|VERMELHO|VERDE)/i);
        if (corMatch) {
          produto.cor = corMatch[1];
        }
        
        const bateriaMatch = cleanLine.match(/🔋(\d+)%/);
        if (bateriaMatch) {
          produto.nivelBateria = `${bateriaMatch[1]}%`;
        }
      }
      
      // Extrair preço
      if (cleanLine.includes('R$')) {
        const precoMatch = cleanLine.match(/R\$\s*([\d.,]+)/);
        if (precoMatch) {
          const preco = parseFloat(precoMatch[1].replace(/\./g, '').replace(',', '.'));
          produto.valorFinal = preco;
          produto.valorCusto = (preco * 0.7).toFixed(2);
          produto.lucroPercentual = '30';
          produto.tipoLucro = 'percentage';
        }
      }
    }
    
    produto.status = 'ativo';
    produto.estoque = '1';
    
    return produto;
  };

  // Função para parser do cadastro em lote (corrigida)
  const parseBulkAddText = (text) => {
    const produtos = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      if (cleanLine.includes('📲') && cleanLine.includes('R$')) {
        let produto = { 
          nome: '', categoria: '', descricao: '', status: 'ativo',
          nivelBateria: '', cor: '', chip: '', modoChip: '', armazenamento: '',
          fornecedorId: '', temBrinde: false, brinde: '',
          valorCusto: '', valorFrete: '', tipoLucro: 'percentage',
          lucroPercentual: '', lucroFixo: '', valorFinal: 0,
          estoque: '', imagem: ''
        };
        
        // Extrair nome do produto
        const nomeMatch = cleanLine.match(/📲\*?(.*?)\*/);
        if (nomeMatch) {
          produto.nome = nomeMatch[1].trim();
          
          // Extrair armazenamento
          const storageMatch = produto.nome.match(/(\d+GB|\d+TB)/i);
          if (storageMatch) {
            produto.armazenamento = storageMatch[1];
          }
          
          // Extrair modo do chip
          if (produto.nome.toUpperCase().includes('ESIM')) {
            produto.modoChip = 'esim';
          } else if (produto.nome.toUpperCase().includes('CHIP')) {
            produto.modoChip = 'fisico';
          }
          
          // Categoria baseada no nome
          if (produto.nome.toUpperCase().includes('IPHONE')) {
            produto.categoria = 'Smartphone';
          }
        }
        
        // Extrair preço
        const precoMatch = cleanLine.match(/R\$\s*([\d.,]+)/);
        if (precoMatch) {
          const preco = parseFloat(precoMatch[1].replace(/\./g, '').replace(',', '.'));
          produto.valorFinal = preco;
          produto.valorCusto = (preco * 0.7).toFixed(2);
          produto.lucroPercentual = '30';
          produto.tipoLucro = 'percentage';
        }
        
        // Extrair cor
        const corMatch = cleanLine.match(/-(.*?)(?:🤎|🖤|🤍|$)/);
        if (corMatch) {
          produto.cor = corMatch[1].trim();
        }
        
        produto.status = 'ativo';
        produto.estoque = '1';
        
        if (produto.nome && produto.valorFinal) {
          produtos.push(produto);
        }
      }
    }
    
    return produtos;
  };

  // Upload de imagem para Firebase Storage
  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `produtos/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData({...formData, imagem: downloadURL});
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadProdutos();
    loadFornecedores();
    loadCustomCategories();
    loadCustomChips();
  }, []);

  // Calcular estatísticas dos produtos
  const calcularEstatisticas = () => {
    const totalProdutos = produtos.reduce((acc, p) => acc + (p.estoque || 0), 0);
    const valorTotalCusto = produtos.reduce((acc, p) => acc + ((p.valorCusto || 0) * (p.estoque || 0)), 0);
    const valorTotalVenda = produtos.reduce((acc, p) => acc + ((p.valorFinal || 0) * (p.estoque || 0)), 0);
    const lucroTotal = valorTotalVenda - valorTotalCusto;
    
    return {
      totalProdutos,
      valorTotalCusto,
      valorTotalVenda,
      lucroTotal,
      quantidadeItens: produtos.length
    };
  };

  const stats = calcularEstatisticas();

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'produtos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const produtosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProdutos(produtosData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const loadFornecedores = async () => {
    try {
      const q = query(collection(db, 'suppliers'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const fornecedoresData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFornecedores(fornecedoresData.filter(f => f.active));
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadCustomCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => doc.data().name);
      if (categoriesData.length > 0) {
        setCustomCategories(categoriesData);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const saveCustomCategories = async (categories) => {
    try {
      const q = query(collection(db, 'categories'));
      const querySnapshot = await getDocs(q);
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(doc(db, 'categories', docSnapshot.id));
      }
      
      for (const category of categories) {
        await addDoc(collection(db, 'categories'), { name: category });
      }
      
      setCustomCategories(categories);
      toast.success('Categorias salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
      toast.error('Erro ao salvar categorias');
    }
  };

  const loadCustomChips = async () => {
    try {
      const q = query(collection(db, 'chips'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const chipsData = querySnapshot.docs.map(doc => doc.data().name);
      setCustomChips(chipsData);
    } catch (error) {
      console.error('Erro ao carregar chips:', error);
    }
  };

  const saveCustomChip = async (chipName) => {
    try {
      await addDoc(collection(db, 'chips'), { name: chipName });
      setCustomChips(prev => [...prev, chipName]);
      toast.success('Chip adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar chip:', error);
      toast.error('Erro ao salvar chip');
    }
  };

  const handleAdicionarChip = async () => {
    if (novoChip.trim()) {
      await saveCustomChip(novoChip.trim());
      setNovoChip('');
      setShowChipModal(false);
    }
  };

  const handleQuickAdd = () => {
    const produto = parseQuickAddText(quickAddText);
    setFormData(produto);
    setQuickAddText('');
    setShowQuickAdd(false);
    setShowModal(true);
  };

  const handleBulkAdd = async () => {
    const produtos = parseBulkAddText(bulkAddText);
    
    if (produtos.length === 0) {
      toast.error('Nenhum produto válido encontrado no texto');
      return;
    }

    try {
      setLoading(true);
      
      for (const produto of produtos) {
        const produtoData = {
          ...produto,
          valorCusto: parseFloat(produto.valorCusto) || 0,
          valorFrete: parseFloat(produto.valorFrete) || 0,
          lucroPercentual: parseFloat(produto.lucroPercentual) || 0,
          lucroFixo: parseFloat(produto.lucroFixo) || 0,
          estoque: parseInt(produto.estoque) || 0,
          createdAt: new Date()
        };

        await addDoc(collection(db, 'produtos'), produtoData);
      }

      toast.success(`${produtos.length} produtos criados com sucesso!`);
      setBulkAddText('');
      setShowBulkAdd(false);
      loadProdutos();
    } catch (error) {
      console.error('Erro ao criar produtos em lote:', error);
      toast.error('Erro ao criar produtos em lote');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular valor final automaticamente
  const calcularValorFinal = (dados = formData) => {
    const custo = parseFloat(dados.valorCusto) || 0;
    const frete = parseFloat(dados.valorFrete) || 0;
    
    let lucro = 0;
    if (dados.tipoLucro === 'percentage') {
      const percentual = parseFloat(dados.lucroPercentual) || 0;
      lucro = (custo * percentual) / 100;
    } else {
      lucro = parseFloat(dados.lucroFixo) || 0;
    }
    
    return custo + frete + lucro;
  };

  // Atualizar valor final sempre que os valores relevantes mudarem
  useEffect(() => {
    const novoValorFinal = calcularValorFinal();
    if (novoValorFinal !== formData.valorFinal) {
      setFormData(prev => ({ ...prev, valorFinal: novoValorFinal }));
    }
  }, [formData.valorCusto, formData.valorFrete, formData.tipoLucro, formData.lucroPercentual, formData.lucroFixo]);

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.chip?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !filterCategoria || produto.categoria === filterCategoria;
    const matchesFornecedor = !filterFornecedor || produto.fornecedorId === filterFornecedor;
    return matchesSearch && matchesCategoria && matchesFornecedor;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const produtoData = {
        ...formData,
        valorCusto: parseFloat(formData.valorCusto) || 0,
        valorFrete: parseFloat(formData.valorFrete) || 0,
        lucroPercentual: parseFloat(formData.lucroPercentual) || 0,
        lucroFixo: parseFloat(formData.lucroFixo) || 0,
        valorFinal: calcularValorFinal(),
        estoque: parseInt(formData.estoque) || 0,
        updatedAt: new Date()
      };

      if (selectedProduto) {
        await updateDoc(doc(db, 'produtos', selectedProduto.id), produtoData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'produtos'), {
          ...produtoData,
          createdAt: new Date()
        });
        toast.success('Produto criado com sucesso!');
      }

      setShowModal(false);
      setSelectedProduto(null);
      resetForm();
      loadProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '', categoria: '', descricao: '', status: 'ativo',
      nivelBateria: '', cor: '', chip: '', modoChip: '', armazenamento: '',
      fornecedorId: '', temBrinde: false, brinde: '',
      valorCusto: '', valorFrete: '', tipoLucro: 'percentage',
      lucroPercentual: '', lucroFixo: '', valorFinal: 0,
      estoque: '', imagem: ''
    });
  };

  const handleEdit = (produto) => {
    setSelectedProduto(produto);
    setFormData({
      nome: produto.nome || '',
      categoria: produto.categoria || '',
      descricao: produto.descricao || '',
      status: produto.status || 'ativo',
      nivelBateria: produto.nivelBateria || '',
      cor: produto.cor || '',
      chip: produto.chip || '',
      modoChip: produto.modoChip || '',
      armazenamento: produto.armazenamento || '',
      fornecedorId: produto.fornecedorId || '',
      temBrinde: produto.temBrinde || false,
      brinde: produto.brinde || '',
      valorCusto: produto.valorCusto?.toString() || '',
      valorFrete: produto.valorFrete?.toString() || '',
      tipoLucro: produto.tipoLucro || 'percentage',
      lucroPercentual: produto.lucroPercentual?.toString() || '',
      lucroFixo: produto.lucroFixo?.toString() || '',
      valorFinal: produto.valorFinal || 0,
      estoque: produto.estoque?.toString() || '',
      imagem: produto.imagem || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) return;

    try {
      await deleteDoc(doc(db, 'produtos', id));
      toast.success('Produto excluído com sucesso!');
      loadProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  // Componente para editor de categorias
  const CategoryEditor = ({ categories, onSave, onClose }) => {
    const [editCategories, setEditCategories] = useState(categories.join('\n'));

    const handleSave = () => {
      const newCategories = editCategories
        .split('\n')
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);
      
      onSave(newCategories);
      onClose();
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-white font-medium mb-2">
            Categorias (uma por linha)
          </label>
          <textarea
            value={editCategories}
            onChange={(e) => setEditCategories(e.target.value)}
            className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
            placeholder="Smartphone\nTablet\nNotebook\nDesktop\nAcessórios\nPeças\nOutros"
            rows="8"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Categorias</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Produtos</h1>
          <p className="text-white/60 mt-2">Gerencie seu catálogo completo de produtos</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={() => setShowCategoryEditor(true)}
            className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white px-4 py-3 rounded-xl hover:bg-[#0D0C0C]/70 transition-all duration-200 flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-4 h-4" />
            <span>Categorias</span>
          </motion.button>
          
          <motion.button
            onClick={() => setShowQuickAdd(true)}
            className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-xl hover:bg-blue-500/30 transition-all duration-200 flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText className="w-4 h-4" />
            <span>Cadastro Rápido</span>
          </motion.button>
          
          <motion.button
            onClick={() => setShowBulkAdd(true)}
            className="bg-purple-500/20 border border-purple-500/30 text-purple-400 px-4 py-3 rounded-xl hover:bg-purple-500/30 transition-all duration-200 flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Layers className="w-4 h-4" />
            <span>Cadastro em Lote</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              setSelectedProduto(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Novo Produto</span>
          </motion.button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-xl border border-[#FF2C68]/30 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Itens Cadastrados</p>
              <p className="text-white font-bold text-xl">{stats.quantidadeItens}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-xl border border-[#FF2C68]/30 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total em Estoque</p>
              <p className="text-white font-bold text-xl">{stats.totalProdutos}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-xl border border-[#FF2C68]/30 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Valor Total Custo</p>
              <p className="text-white font-bold text-xl">R$ {stats.valorTotalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-xl border border-[#FF2C68]/30 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Valor Total Venda</p>
              <p className="text-white font-bold text-xl">R$ {stats.valorTotalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-xl border border-[#FF2C68]/30 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#FF2C68]/20 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#FF2C68]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Lucro Total</p>
              <p className={`font-bold text-xl ${stats.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                R$ {stats.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
          >
            <option value="" className="bg-[#0D0C0C]">Todas as categorias</option>
            {categorias.map(categoria => (
              <option key={categoria} value={categoria} className="bg-[#0D0C0C]">{categoria}</option>
            ))}
          </select>

          <select
            value={filterFornecedor}
            onChange={(e) => setFilterFornecedor(e.target.value)}
            className="px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
          >
            <option value="" className="bg-[#0D0C0C]">Todos os fornecedores</option>
            {fornecedores.map(fornecedor => (
              <option key={fornecedor.id} value={fornecedor.id} className="bg-[#0D0C0C]">{fornecedor.name}</option>
            ))}
          </select>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white/60">
              <Filter className="w-4 h-4" />
              <span className="text-sm">{filteredProdutos.length} produto(s)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-[#FF2C68]/20 text-[#FF2C68]' : 'text-white/60 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-[#FF2C68]/20 text-[#FF2C68]' : 'text-white/60 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      {viewMode === 'table' ? (
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FF2C68]/10">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-medium">Produto</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Especificações</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Financeiro</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Estoque</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Status</th>
                  <th className="px-6 py-4 text-center text-white font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF2C68]/20">
                {filteredProdutos.map((produto) => {
                  const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
                  return (
                    <tr key={produto.id} className="hover:bg-[#FF2C68]/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#FF2C68] rounded-xl flex items-center justify-center overflow-hidden">
                            {produto.imagem ? (
                              <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{produto.nome}</p>
                            <p className="text-white/60 text-sm">{produto.categoria}</p>
                            {fornecedor && (
                              <p className="text-[#FF2C68] text-xs">{fornecedor.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          {produto.chip && (
                            <div className="flex items-center space-x-1">
                              <Cpu className="w-3 h-3 text-blue-400" />
                              <span className="text-white/80">{produto.chip}</span>
                            </div>
                          )}
                          {produto.modoChip && (
                            <div className="flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-cyan-400" />
                              <span className="text-white/80">
                                {modosChip.find(m => m.value === produto.modoChip)?.label || produto.modoChip}
                              </span>
                            </div>
                          )}
                          {produto.armazenamento && (
                            <div className="flex items-center space-x-1">
                              <HardDrive className="w-3 h-3 text-green-400" />
                              <span className="text-white/80">{produto.armazenamento}</span>
                            </div>
                          )}
                          {produto.nivelBateria && (
                            <div className="flex items-center space-x-1">
                              <Battery className="w-3 h-3 text-yellow-400" />
                              <span className="text-white/80">{produto.nivelBateria}</span>
                            </div>
                          )}
                          {produto.cor && (
                            <div className="flex items-center space-x-1">
                              <Palette className="w-3 h-3 text-purple-400" />
                              <span className="text-white/80">{produto.cor}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <p className="text-white font-medium">
                            R$ {produto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                          </p>
                          <p className="text-white/60">
                            Custo: R$ {produto.valorCusto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                          </p>
                          {produto.valorFrete > 0 && (
                            <p className="text-white/60">
                              Frete: R$ {produto.valorFrete?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          produto.estoque < 10 ? 'bg-red-500/20 text-red-400' :
                          produto.estoque < 20 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {produto.estoque || 0} unidades
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          produto.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {produto.status}
                        </span>
                        {produto.temBrinde && (
                          <div className="mt-1">
                            <span className="px-2 py-1 bg-[#FF2C68]/20 text-[#FF2C68] rounded text-xs flex items-center space-x-1">
                              <Gift className="w-3 h-3" />
                              <span>Brinde</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduto(produto);
                              setShowDetails(true);
                            }}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(produto)}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(produto.id, produto.nome)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredProdutos.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visualização em Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProdutos.map((produto) => {
            const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
            return (
              <motion.div
                key={produto.id}
                className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6 hover:border-[#FF2C68]/50 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                layout
              >
                {/* Imagem do produto */}
                <div className="relative mb-4">
                  {produto.imagem ? (
                    <img 
                      src={produto.imagem} 
                      alt={produto.nome}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-[#FF2C68]/10 rounded-xl flex items-center justify-center">
                      <Package className="w-12 h-12 text-[#FF2C68]/50" />
                    </div>
                  )}
                  
                  {/* Status e badges */}
                  <div className="absolute top-2 right-2 flex flex-col space-y-1">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      produto.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {produto.status}
                    </span>
                    {produto.temBrinde && (
                      <span className="px-2 py-1 bg-[#FF2C68]/20 text-[#FF2C68] rounded-lg text-xs flex items-center space-x-1">
                        <Gift className="w-3 h-3" />
                        <span>Brinde</span>
                      </span>
                    )}
                  </div>
                  
                  {/* Estoque */}
                  <div className="absolute bottom-2 left-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      produto.estoque < 10 ? 'bg-red-500/20 text-red-400' :
                      produto.estoque < 20 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {produto.estoque || 0} un.
                    </span>
                  </div>
                </div>

                {/* Informações do produto */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{produto.nome}</h3>
                    <p className="text-white/60 text-sm">{produto.categoria}</p>
                    {fornecedor && (
                      <p className="text-[#FF2C68] text-xs">{fornecedor.name}</p>
                    )}
                  </div>

                  {/* Especificações */}
                  <div className="space-y-1">
                    {produto.chip && (
                      <div className="flex items-center space-x-1 text-xs">
                        <Cpu className="w-3 h-3 text-blue-400" />
                        <span className="text-white/80">{produto.chip}</span>
                      </div>
                    )}
                    {produto.modoChip && (
                      <div className="flex items-center space-x-1 text-xs">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span className="text-white/80">
                          {modosChip.find(m => m.value === produto.modoChip)?.label || produto.modoChip}
                        </span>
                      </div>
                    )}
                    {produto.armazenamento && (
                      <div className="flex items-center space-x-1 text-xs">
                        <HardDrive className="w-3 h-3 text-green-400" />
                        <span className="text-white/80">{produto.armazenamento}</span>
                      </div>
                    )}
                    {produto.cor && (
                      <div className="flex items-center space-x-1 text-xs">
                        <Palette className="w-3 h-3 text-purple-400" />
                        <span className="text-white/80">{produto.cor}</span>
                      </div>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="border-t border-[#FF2C68]/20 pt-3">
                    <p className="text-white/60 text-sm">
                      Custo: R$ {produto.valorCusto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                    <p className="text-white font-bold text-xl">
                      R$ {produto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                    <p className="text-green-400 text-sm font-medium">
                      Lucro: R$ {((produto.valorFinal || 0) - (produto.valorCusto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setSelectedProduto(produto);
                        setShowDetails(true);
                      }}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(produto)}
                      className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(produto.id, produto.nome)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {filteredProdutos.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Produto */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-6xl border border-[#FF2C68] relative max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">
                  {selectedProduto ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <p className="text-white/60">Configure todos os detalhes do produto</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informações Básicas */}
                <div className="bg-[#0D0C0C]/30 border border-[#FF2C68]/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-[#FF2C68]" />
                    <span>Informações Básicas</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Nome do Produto *</label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="Ex: iPhone 15 Pro Max"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Categoria *</label>
                      <select
                        required
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-[#0D0C0C]">Selecione uma categoria</option>
                        {categorias.map(categoria => (
                          <option key={categoria} value={categoria} className="bg-[#0D0C0C]">{categoria}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Cor</label>
                      <input
                        type="text"
                        value={formData.cor}
                        onChange={(e) => setFormData({...formData, cor: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="Ex: Azul Titânio"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Fornecedor</label>
                      <select
                        value={formData.fornecedorId}
                        onChange={(e) => setFormData({...formData, fornecedorId: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-[#0D0C0C]">Selecione um fornecedor</option>
                        {fornecedores.map(fornecedor => (
                          <option key={fornecedor.id} value={fornecedor.id} className="bg-[#0D0C0C]">{fornecedor.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-white font-medium mb-2">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Descrição detalhada do produto"
                      rows="3"
                    />
                  </div>
                </div>

                {/* Especificações Técnicas */}
                <div className="bg-[#0D0C0C]/30 border border-[#FF2C68]/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-[#FF2C68]" />
                    <span>Especificações Técnicas</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Chip/Processador</label>
                      <div className="flex space-x-2">
                        <select
                          value={formData.chip}
                          onChange={(e) => {
                            if (e.target.value === 'Outro (especificar)') {
                              setShowChipModal(true);
                            } else {
                              setFormData({...formData, chip: e.target.value});
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                        >
                          <option value="" className="bg-[#0D0C0C]">Selecione o chip</option>
                          {niveisChip.map(chip => (
                            <option key={chip} value={chip} className="bg-[#0D0C0C]">{chip}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowChipModal(true)}
                          className="px-3 py-3 bg-[#FF2C68]/20 border border-[#FF2C68]/30 text-[#FF2C68] rounded-xl hover:bg-[#FF2C68]/30 transition-colors"
                          title="Adicionar novo chip"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Modo do Chip</label>
                      <select
                        value={formData.modoChip}
                        onChange={(e) => setFormData({...formData, modoChip: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-[#0D0C0C]">Selecione o modo</option>
                        {modosChip.map(modo => (
                          <option key={modo.value} value={modo.value} className="bg-[#0D0C0C]">{modo.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Armazenamento</label>
                      <select
                        value={formData.armazenamento}
                        onChange={(e) => setFormData({...formData, armazenamento: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-[#0D0C0C]">Selecione o armazenamento</option>
                        {opcoesArmazenamento.map(opcao => (
                          <option key={opcao} value={opcao} className="bg-[#0D0C0C]">{opcao}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Nível de Bateria</label>
                      <input
                        type="text"
                        value={formData.nivelBateria}
                        onChange={(e) => setFormData({...formData, nivelBateria: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="Ex: 4500mAh"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Imagem do Produto</label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="url"
                          value={formData.imagem}
                          onChange={(e) => setFormData({...formData, imagem: e.target.value})}
                          className="flex-1 px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="URL da imagem ou cole aqui"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0])}
                            className="hidden"
                          />
                          <div className="p-3 bg-[#FF2C68]/20 border border-[#FF2C68]/30 text-[#FF2C68] rounded-xl hover:bg-[#FF2C68]/30 transition-colors flex items-center space-x-2">
                            {uploading ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                            <span>{uploading ? 'Carregando...' : 'Upload'}</span>
                          </div>
                        </label>
                      </div>
                      {formData.imagem && (
                        <div className="flex items-center space-x-4">
                          <img 
                            src={formData.imagem} 
                            alt="Preview" 
                            className="w-20 h-20 object-cover rounded-lg border border-[#FF2C68]/30"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, imagem: ''})}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sistema Financeiro */}
                <div className="bg-[#0D0C0C]/30 border border-[#FF2C68]/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-[#FF2C68]" />
                    <span>Sistema Financeiro</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Valor de Custo *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.valorCusto}
                        onChange={(e) => setFormData({...formData, valorCusto: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Valor do Frete</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valorFrete}
                        onChange={(e) => setFormData({...formData, valorFrete: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Tipo de Lucro</label>
                      <select
                        value={formData.tipoLucro}
                        onChange={(e) => setFormData({...formData, tipoLucro: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                      >
                        <option value="percentage" className="bg-[#0D0C0C]">Percentual (%)</option>
                        <option value="fixed" className="bg-[#0D0C0C]">Valor Fixo (R$)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        {formData.tipoLucro === 'percentage' ? 'Lucro Percentual (%)' : 'Lucro Fixo (R$)'}
                      </label>
                      {formData.tipoLucro === 'percentage' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={formData.lucroPercentual}
                          onChange={(e) => setFormData({...formData, lucroPercentual: e.target.value, lucroFixo: ''})}
                          className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="Ex: 25.5"
                        />
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={formData.lucroFixo}
                          onChange={(e) => setFormData({...formData, lucroFixo: e.target.value, lucroPercentual: ''})}
                          className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                          placeholder="0.00"
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Valor Final Calculado</label>
                      <div className="w-full px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-bold text-lg flex items-center space-x-2">
                        <Calculator className="w-5 h-5" />
                        <span>R$ {formData.valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Breakdown dos cálculos */}
                  {(formData.valorCusto || formData.valorFrete || formData.lucroPercentual || formData.lucroFixo) && (
                    <div className="bg-[#FF2C68]/10 border border-[#FF2C68]/30 rounded-xl p-4">
                      <h4 className="text-[#FF2C68] font-medium mb-2">Detalhamento do Cálculo:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">Custo:</span>
                          <p className="text-white font-medium">R$ {(parseFloat(formData.valorCusto) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Frete:</span>
                          <p className="text-white font-medium">R$ {(parseFloat(formData.valorFrete) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-white/60">Lucro:</span>
                          <p className="text-white font-medium">
                            R$ {(() => {
                              const custo = parseFloat(formData.valorCusto) || 0;
                              if (formData.tipoLucro === 'percentage') {
                                return ((custo * (parseFloat(formData.lucroPercentual) || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                              } else {
                                return (parseFloat(formData.lucroFixo) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                              }
                            })()}
                          </p>
                        </div>
                        <div>
                          <span className="text-white/60">Total:</span>
                          <p className="text-green-400 font-bold">R$ {formData.valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estoque e Extras */}
                <div className="bg-[#0D0C0C]/30 border border-[#FF2C68]/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Package className="w-5 h-5 text-[#FF2C68]" />
                    <span>Estoque e Extras</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Quantidade em Estoque *</label>
                      <input
                        type="number"
                        required
                        value={formData.estoque}
                        onChange={(e) => setFormData({...formData, estoque: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                      >
                        <option value="ativo" className="bg-[#0D0C0C]">Ativo</option>
                        <option value="inativo" className="bg-[#0D0C0C]">Inativo</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-8">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.temBrinde}
                          onChange={(e) => setFormData({...formData, temBrinde: e.target.checked})}
                          className="w-5 h-5 text-[#FF2C68] bg-[#0D0C0C] border-[#FF2C68]/30 rounded focus:ring-[#FF2C68] focus:ring-2"
                        />
                        <span className="text-white flex items-center space-x-1">
                          <Gift className="w-4 h-4" />
                          <span>Tem brinde</span>
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  {formData.temBrinde && (
                    <div className="mt-4">
                      <label className="block text-white font-medium mb-2">Descrição do Brinde</label>
                      <input
                        type="text"
                        value={formData.brinde}
                        onChange={(e) => setFormData({...formData, brinde: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                        placeholder="Ex: Capinha + Película + Carregador"
                      />
                    </div>
                  )}
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{loading ? 'Salvando...' : (selectedProduto ? 'Atualizar' : 'Criar')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {showDetails && selectedProduto && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-4xl border border-[#FF2C68] relative max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">Detalhes do Produto</h2>
                <p className="text-white/60">Informações completas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Imagem do produto */}
                {selectedProduto.imagem && (
                  <div className="col-span-full mb-6">
                    <img 
                      src={selectedProduto.imagem} 
                      alt={selectedProduto.nome}
                      className="w-full max-w-md mx-auto h-64 object-cover rounded-xl border border-[#FF2C68]/30"
                    />
                  </div>
                )}

                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-[#FF2C68]/30 pb-2">Informações Básicas</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60 text-sm">Nome:</span>
                      <p className="text-white font-medium">{selectedProduto.nome}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Categoria:</span>
                      <p className="text-white">{selectedProduto.categoria}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Descrição:</span>
                      <p className="text-white">{selectedProduto.descricao || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Fornecedor:</span>
                      <p className="text-white">
                        {fornecedores.find(f => f.id === selectedProduto.fornecedorId)?.name || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Especificações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-[#FF2C68]/30 pb-2">Especificações</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60 text-sm">Chip:</span>
                      <p className="text-white">{selectedProduto.chip || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Modo do Chip:</span>
                      <p className="text-white">
                        {selectedProduto.modoChip 
                          ? modosChip.find(m => m.value === selectedProduto.modoChip)?.label || selectedProduto.modoChip
                          : 'Não informado'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Armazenamento:</span>
                      <p className="text-white">{selectedProduto.armazenamento || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Bateria:</span>
                      <p className="text-white">{selectedProduto.nivelBateria || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Cor:</span>
                      <p className="text-white">{selectedProduto.cor || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Financeiro */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-[#FF2C68]/30 pb-2">Financeiro</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60 text-sm">Valor de Custo:</span>
                      <p className="text-white">R$ {selectedProduto.valorCusto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Valor do Frete:</span>
                      <p className="text-white">R$ {selectedProduto.valorFrete?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Lucro:</span>
                      <p className="text-white">
                        {selectedProduto.tipoLucro === 'percentage' 
                          ? `${selectedProduto.lucroPercentual}%` 
                          : `R$ ${selectedProduto.lucroFixo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Valor Final:</span>
                      <p className="text-green-400 font-bold text-lg">R$ {selectedProduto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                    </div>
                  </div>
                </div>

                {/* Estoque e Extras */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-[#FF2C68]/30 pb-2">Estoque e Extras</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60 text-sm">Estoque:</span>
                      <p className="text-white">{selectedProduto.estoque || 0} unidades</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Status:</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        selectedProduto.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedProduto.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Brinde:</span>
                      <p className="text-white">
                        {selectedProduto.temBrinde ? selectedProduto.brinde || 'Sim' : 'Não'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Editor de Categorias */}
      <AnimatePresence>
        {showCategoryEditor && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCategoryEditor(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-2xl border border-[#FF2C68] relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCategoryEditor(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">Editor de Categorias</h2>
                <p className="text-white/60">Personalize as categorias de produtos</p>
              </div>

              <CategoryEditor 
                categories={categorias}
                onSave={saveCustomCategories}
                onClose={() => setShowCategoryEditor(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Cadastro Rápido */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickAdd(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-3xl border border-[#FF2C68] relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQuickAdd(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">Cadastro Rápido</h2>
                <p className="text-white/60">Cole o texto do produto para preenchimento automático</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Texto do Produto</label>
                  <textarea
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder={`Cole aqui o texto do produto:\n\n🚀 PEÇA ÚNICA🔥🔥\n📲IPHONE 14 128GB\ncom detalhes\nPRETO 🖤🔋82%\nPor Apenas ⤵️\nR$2.790,00 🔥🤩`}
                    rows="8"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowQuickAdd(false)}
                    className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleQuickAdd}
                    disabled={!quickAddText.trim()}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Processar e Abrir Formulário</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Cadastro em Lote */}
      <AnimatePresence>
        {showBulkAdd && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBulkAdd(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-4xl border border-[#FF2C68] relative max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowBulkAdd(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#FF2C68]">Cadastro em Lote</h2>
                <p className="text-white/60">Cole o texto com vários produtos para criação automática</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Lista de Produtos</label>
                  <textarea
                    value={bulkAddText}
                    onChange={(e) => setBulkAddText(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder={`Cole aqui a lista de produtos:\n\n📲*IPHONE 16 PRO 128GB ESIM*\nR$6.669,00 - DESERT🤎\n\n📲*IPHONE 16 PRO 256GB ESIM*\nR$7.510,00 - DESERT🤎\n\n📲*IPHONE 16 PRO 512GB ESIM*\nR$9.579,00- PRETO🖤\nR$9.579,00 - DESERT🤎`}
                    rows="12"
                  />
                </div>

                {bulkAddText && (
                  <div className="bg-[#FF2C68]/10 border border-[#FF2C68]/30 rounded-xl p-4">
                    <h4 className="text-[#FF2C68] font-medium mb-2">Preview dos Produtos:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {parseBulkAddText(bulkAddText).map((produto, index) => (
                        <div key={index} className="text-sm text-white/80 bg-[#0D0C0C]/30 p-2 rounded">
                          <strong>{produto.nome}</strong> - R$ {produto.valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {produto.cor && ` - ${produto.cor}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowBulkAdd(false)}
                    className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    disabled={!bulkAddText.trim() || loading}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                    <span>{loading ? 'Criando...' : 'Criar Todos os Produtos'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
                  )}
        </AnimatePresence>

        {/* Modal para Adicionar Chip */}
        <AnimatePresence>
          {showChipModal && (
            <motion.div
              className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChipModal(false)}
            >
              <motion.div
                className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-md border border-[#FF2C68] relative"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowChipModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-[#FF2C68]/20 text-white/60 hover:text-white hover:bg-[#FF2C68]/30 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#FF2C68]">Adicionar Novo Chip</h2>
                  <p className="text-white/60">Digite o nome do novo processador/chip</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome do Chip/Processador</label>
                    <input
                      type="text"
                      value={novoChip}
                      onChange={(e) => setNovoChip(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Ex: Snapdragon 8 Gen 4, Apple A18, etc."
                      onKeyPress={(e) => e.key === 'Enter' && handleAdicionarChip()}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowChipModal(false)}
                      className="px-6 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 text-white rounded-xl hover:bg-[#0D0C0C]/70 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAdicionarChip}
                      disabled={!novoChip.trim()}
                      className="px-6 py-3 bg-[#FF2C68] text-white rounded-xl hover:bg-[#FF2C68]/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  } 