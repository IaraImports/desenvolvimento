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
    <div className="space-y-4 md:space-y-6">
      {/* Header responsivo */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center space-x-3">
              <Package className="w-6 md:w-8 h-6 md:h-8 text-[#FF2C68]" />
              <span>Produtos</span>
            </h1>
            <p className="text-white/60 mt-2 text-sm md:text-base">
              Gerencie seu estoque de produtos
            </p>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
            <div className="bg-[#0D0C0C]/30 rounded-xl p-3">
              <p className="text-blue-400 font-bold text-lg md:text-xl">{produtos.length}</p>
              <p className="text-white/60 text-xs md:text-sm">Produtos</p>
            </div>
            <div className="bg-[#0D0C0C]/30 rounded-xl p-3">
              <p className="text-green-400 font-bold text-lg md:text-xl">{stats.totalProdutos}</p>
              <p className="text-white/60 text-xs md:text-sm">Estoque</p>
            </div>
            <div className="bg-[#0D0C0C]/30 rounded-xl p-3">
              <p className="text-purple-400 font-bold text-lg md:text-xl">
                R$ {(stats.valorTotalCusto / 1000).toFixed(0)}k
              </p>
              <p className="text-white/60 text-xs md:text-sm">Custo</p>
            </div>
            <div className="bg-[#0D0C0C]/30 rounded-xl p-3">
              <p className="text-orange-400 font-bold text-lg md:text-xl">
                R$ {(stats.valorTotalVenda / 1000).toFixed(0)}k
              </p>
              <p className="text-white/60 text-xs md:text-sm">Venda</p>
            </div>
          </div>
        </div>

        {/* Controles responsivos */}
        <div className="mt-4 md:mt-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl px-10 md:px-12 py-2 md:py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#FF2C68] transition-colors text-sm md:text-base"
            />
          </div>

          {/* Controles inferiores */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg px-3 py-2 text-white text-xs md:text-sm focus:outline-none focus:border-[#FF2C68]"
              >
                <option value="">Todas Categorias</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterFornecedor}
                onChange={(e) => setFilterFornecedor(e.target.value)}
                className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg px-3 py-2 text-white text-xs md:text-sm focus:outline-none focus:border-[#FF2C68]"
              >
                <option value="">Todos Fornecedores</option>
                {fornecedores.map(forn => (
                  <option key={forn.id} value={forn.id}>{forn.name}</option>
                ))}
              </select>

              {/* Toggle de visualização - apenas desktop */}
              <div className="hidden md:flex bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-[#FF2C68] text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-[#FF2C68] text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {canCreateProducts && (
                <>
                  {/* Mobile: Dropdown de ações */}
                  <div className="md:hidden relative">
                    <motion.button
                      onClick={() => setShowModal(true)}
                      className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo</span>
                    </motion.button>
                  </div>

                  {/* Desktop: Botões completos */}
                  <div className="hidden md:flex gap-2">
                    <motion.button
                      onClick={() => setShowModal(true)}
                      className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Produto</span>
                    </motion.button>

                    <motion.button
                      onClick={() => setShowQuickAdd(true)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Cadastro Rápido</span>
                    </motion.button>

                    <motion.button
                      onClick={() => setShowBulkAdd(true)}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Lote</span>
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de produtos responsiva */}
      {filteredProdutos.length === 0 ? (
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-8 md:p-12 text-center">
          <Package className="w-16 md:w-20 h-16 md:h-20 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">
            {searchTerm || filterCategoria || filterFornecedor 
              ? 'Nenhum produto encontrado' 
              : 'Nenhum produto cadastrado'
            }
          </h3>
          <p className="text-white/60 mb-6 text-sm md:text-base">
            {searchTerm || filterCategoria || filterFornecedor
              ? 'Tente ajustar os filtros de busca'
              : 'Comece cadastrando seus produtos'
            }
          </p>
          {canCreateProducts && !searchTerm && !filterCategoria && !filterFornecedor && (
            <motion.button
              onClick={() => setShowModal(true)}
              className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 mx-auto"
              whileHover={{ scale: 1.02 }}
            >
              <Plus className="w-5 h-5" />
              <span>Cadastrar Produto</span>
            </motion.button>
          )}
        </div>
      ) : (
        <>
          {/* Grid de produtos para mobile e desktop */}
          <div className={`grid gap-4 md:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProdutos.map((produto, index) => (
              <motion.div
                key={produto.id}
                className={`bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 hover:border-[#FF2C68]/50 transition-all duration-300 overflow-hidden ${
                  viewMode === 'table' ? 'flex flex-col md:flex-row md:items-center' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {viewMode === 'grid' ? (
                  /* Card Mode */
                  <div className="p-4 md:p-6">
                    {/* Imagem do produto */}
                    <div className="relative mb-4">
                      <div className="w-full h-32 md:h-40 bg-[#0D0C0C]/30 rounded-xl overflow-hidden">
                        {produto.imagem ? (
                          <img 
                            src={produto.imagem} 
                            alt={produto.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 md:w-12 h-8 md:h-12 text-white/20" />
                          </div>
                        )}
                      </div>
                      
                      {/* Badge de categoria */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-[#FF2C68]/20 text-[#FF2C68] rounded-lg text-xs font-medium">
                          {produto.categoria}
                        </span>
                      </div>

                      {/* Badge de estoque */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          produto.estoque > 5 
                            ? 'bg-green-500/20 text-green-400' 
                            : produto.estoque > 0 
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}>
                          {produto.estoque} un.
                        </span>
                      </div>
                    </div>

                    {/* Informações do produto */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-white line-clamp-2">
                        {produto.nome}
                      </h3>

                      {/* Especificações técnicas compactas */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {produto.armazenamento && (
                          <div className="flex items-center space-x-1">
                            <HardDrive className="w-3 h-3 text-[#FF2C68]" />
                            <span className="text-white/60">{produto.armazenamento}</span>
                          </div>
                        )}
                        {produto.cor && (
                          <div className="flex items-center space-x-1">
                            <Palette className="w-3 h-3 text-[#FF2C68]" />
                            <span className="text-white/60">{produto.cor}</span>
                          </div>
                        )}
                        {produto.nivelBateria && (
                          <div className="flex items-center space-x-1">
                            <Battery className="w-3 h-3 text-[#FF2C68]" />
                            <span className="text-white/60">{produto.nivelBateria}</span>
                          </div>
                        )}
                        {produto.chip && (
                          <div className="flex items-center space-x-1">
                            <Cpu className="w-3 h-3 text-[#FF2C68]" />
                            <span className="text-white/60 truncate">{produto.chip}</span>
                          </div>
                        )}
                      </div>

                      {/* Preços */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">Custo:</span>
                          <span className="text-white font-medium">
                            R$ {produto.valorCusto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">Venda:</span>
                          <span className="text-green-400 font-bold text-lg">
                            R$ {produto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Ações do card */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#FF2C68]/20">
                        <motion.button
                          onClick={() => {
                            setSelectedProduto(produto);
                            setShowDetails(true);
                          }}
                          className="flex-1 bg-[#FF2C68]/20 hover:bg-[#FF2C68]/30 text-[#FF2C68] px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </motion.button>

                        {canEditProducts && (
                          <motion.button
                            onClick={() => handleEdit(produto)}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar</span>
                          </motion.button>
                        )}

                        {canDeleteProducts && (
                          <motion.button
                            onClick={() => handleDelete(produto.id, produto.nome)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Excluir</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* List Mode */
                  <div className="flex flex-col md:flex-row md:items-center w-full p-4 md:p-6">
                    {/* Imagem miniatura */}
                    <div className="w-full md:w-16 h-16 bg-[#0D0C0C]/30 rounded-xl overflow-hidden mb-3 md:mb-0 md:mr-4 flex-shrink-0">
                      {produto.imagem ? (
                        <img 
                          src={produto.imagem} 
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Informações principais */}
                    <div className="flex-1 min-w-0 mb-4 md:mb-0">
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                        <div className="flex-1 min-w-0 mb-2 md:mb-0">
                          <h3 className="text-lg font-bold text-white truncate">
                            {produto.nome}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-[#FF2C68]/20 text-[#FF2C68] rounded-lg text-xs">
                              {produto.categoria}
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-xs ${
                              produto.estoque > 5 
                                ? 'bg-green-500/20 text-green-400' 
                                : produto.estoque > 0 
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}>
                              {produto.estoque} un.
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-white/60 text-xs">Custo</p>
                            <p className="text-white font-medium">
                              R$ {produto.valorCusto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-white/60 text-xs">Venda</p>
                            <p className="text-green-400 font-bold">
                              R$ {produto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="text-center md:block hidden">
                            <p className="text-white/60 text-xs">Lucro</p>
                            <p className="text-blue-400 font-medium">
                              R$ {((produto.valorFinal || 0) - (produto.valorCusto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2 md:ml-4">
                      <motion.button
                        onClick={() => {
                          setSelectedProduto(produto);
                          setShowDetails(true);
                        }}
                        className="bg-[#FF2C68]/20 hover:bg-[#FF2C68]/30 text-[#FF2C68] px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 text-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </motion.button>

                      {canEditProducts && (
                        <motion.button
                          onClick={() => handleEdit(produto)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 text-sm"
                          whileHover={{ scale: 1.02 }}
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </motion.button>
                      )}

                      {canDeleteProducts && (
                        <motion.button
                          onClick={() => handleDelete(produto.id, produto.nome)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 text-sm"
                          whileHover={{ scale: 1.02 }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Excluir</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Modal de Detalhes do Produto */}
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
              className="bg-[#0D0C0C] rounded-2xl p-6 md:p-8 w-full max-w-2xl border border-[#FF2C68] relative max-h-[90vh] overflow-y-auto"
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
              </div>

              <div className="space-y-6">
                {/* Imagem principal */}
                {selectedProduto.imagem && (
                  <div className="w-full h-48 md:h-64 bg-[#0D0C0C]/30 rounded-xl overflow-hidden">
                    <img 
                      src={selectedProduto.imagem} 
                      alt={selectedProduto.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Informações básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">{selectedProduto.nome}</h3>
                    <div className="space-y-2">
                      <p><span className="text-white/60">Categoria:</span> <span className="text-white">{selectedProduto.categoria}</span></p>
                      <p><span className="text-white/60">Status:</span> <span className={`font-medium ${selectedProduto.status === 'ativo' ? 'text-green-400' : 'text-red-400'}`}>{selectedProduto.status}</span></p>
                      <p><span className="text-white/60">Estoque:</span> <span className="text-white">{selectedProduto.estoque} unidades</span></p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-white">Financeiro</h4>
                    <p><span className="text-white/60">Custo:</span> <span className="text-white">R$ {selectedProduto.valorCusto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><span className="text-white/60">Frete:</span> <span className="text-white">R$ {selectedProduto.valorFrete?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><span className="text-white/60">Preço Final:</span> <span className="text-green-400 font-bold">R$ {selectedProduto.valorFinal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><span className="text-white/60">Lucro:</span> <span className="text-blue-400 font-medium">R$ {((selectedProduto.valorFinal || 0) - (selectedProduto.valorCusto || 0) - (selectedProduto.valorFrete || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                  </div>
                </div>

                {/* Especificações técnicas */}
                {(selectedProduto.armazenamento || selectedProduto.cor || selectedProduto.nivelBateria || selectedProduto.chip) && (
                  <div>
                    <h4 className="font-semibold text-white mb-3">Especificações Técnicas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedProduto.armazenamento && (
                        <p><span className="text-white/60">Armazenamento:</span> <span className="text-white">{selectedProduto.armazenamento}</span></p>
                      )}
                      {selectedProduto.cor && (
                        <p><span className="text-white/60">Cor:</span> <span className="text-white">{selectedProduto.cor}</span></p>
                      )}
                      {selectedProduto.nivelBateria && (
                        <p><span className="text-white/60">Bateria:</span> <span className="text-white">{selectedProduto.nivelBateria}</span></p>
                      )}
                      {selectedProduto.chip && (
                        <p><span className="text-white/60">Processador:</span> <span className="text-white">{selectedProduto.chip}</span></p>
                      )}
                      {selectedProduto.modoChip && (
                        <p><span className="text-white/60">Tipo Chip:</span> <span className="text-white">{selectedProduto.modoChip}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Descrição */}
                {selectedProduto.descricao && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Descrição</h4>
                    <p className="text-white/80">{selectedProduto.descricao}</p>
                  </div>
                )}

                {/* Brinde */}
                {selectedProduto.temBrinde && selectedProduto.brinde && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Brinde Incluso</h4>
                    <p className="text-green-400">{selectedProduto.brinde}</p>
                  </div>
                )}
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
              className="bg-[#0D0C0C] rounded-2xl p-8 w-full max-w-md border border-[#FF2C68] relative"
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
                <h2 className="text-2xl font-bold text-[#FF2C68]">Adicionar Nova Categoria</h2>
                <p className="text-white/60">Digite o nome da nova categoria</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Nome da Categoria</label>
                  <input
                    type="text"
                    value={novoChip}
                    onChange={(e) => setNovoChip(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Ex: Smartphone, Notebook, etc."
                    onKeyPress={(e) => e.key === 'Enter' && handleAdicionarChip()}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowCategoryEditor(false)}
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