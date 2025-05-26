import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clipboard,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Smartphone,
  Wrench,
  Clock,
  DollarSign,
  Camera,
  AlertTriangle,
  CheckCircle,
  FileText,
  Save,
  Eye,
  Calendar,
  Tag,
  Activity,
  Zap,
  Battery,
  Wifi,
  Volume2,
  Settings,
  Plus,
  Trash2,
  X,
  Download,
  Printer,
  Upload,
  Image as ImageIcon,
  Paperclip,
  QrCode,
  Monitor,
  Laptop,
  Tablet,
  Watch,
  Headphones
} from 'lucide-react';
import { addDoc, collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function OrdemServico() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [showAddCategoria, setShowAddCategoria] = useState(false);
  const [customCategorias, setCustomCategorias] = useState([]);
  const [customTecnicos, setCustomTecnicos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [osExistentes, setOsExistentes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editandoOS, setEditandoOS] = useState(null);
  const [novoEquipamento, setNovoEquipamento] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    cor: '',
    numeroSerie: ''
  });
  const [showAddEquipamento, setShowAddEquipamento] = useState(false);
  const [anexos, setAnexos] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Dados do cliente
  const [cliente, setCliente] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: ''
  });

  // Dados do equipamento
  const [equipamento, setEquipamento] = useState({
    tipo: 'smartphone',
    marca: '',
    modelo: '',
    cor: '',
    imei: '',
    senha: '',
    observacoes: '',
    etiqueta: ''
  });

  // Dados do problema
  const [problema, setProblema] = useState({
    relatado: '',
    diagnostico: '',
    categoria: '',
    prioridade: 'normal',
    fotos: []
  });

  // Dados do serviço
  const [servico, setServico] = useState({
    numero: `OS-${Date.now()}`,
    tecnico: '',
    servicoSelecionado: '',
    previsaoEntrega: '',
    valorOrcamento: '',
    valorMaoObra: '',
    valorPecas: '',
    status: 'aguardando',
    observacoesTecnicas: '',
    comentarios: [],
    anexos: []
  });

  const statusOptions = [
    { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-500' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
    { value: 'aguardando_pecas', label: 'Aguardando Peças', color: 'bg-orange-500' },
    { value: 'finalizado', label: 'Finalizado', color: 'bg-green-500' },
    { value: 'entregue', label: 'Entregue', color: 'bg-purple-500' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500' }
  ];

  const tiposEquipamento = [
    { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'notebook', label: 'Notebook', icon: Laptop },
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'smartwatch', label: 'Smartwatch', icon: Watch },
    { value: 'fone', label: 'Fone/Headset', icon: Headphones },
    { value: 'outro', label: 'Outro', icon: Settings }
  ];

  useEffect(() => {
    loadClientes();
    loadCustomCategorias();
    loadCustomTecnicos();
    loadServicos();
    loadOsExistentes();
  }, []);

  const loadOsExistentes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'ordens_servico'));
      const osData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOsExistentes(osData);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    }
  };

  const gerarEtiquetaEquipamento = () => {
    const prefixo = equipamento.tipo.toUpperCase().slice(0, 3);
    const numeroSerie = Date.now().toString().slice(-6);
    const etiqueta = `${prefixo}-${numeroSerie}`;
    
    setEquipamento(prev => ({
      ...prev,
      etiqueta
    }));
    
    toast.success(`Etiqueta gerada: ${etiqueta}`);
    return etiqueta;
  };

  const adicionarEquipamentoAoCliente = async () => {
    if (!equipamento.tipo) {
      toast.error('Selecione um tipo de equipamento');
      return;
    }

    try {
      const etiqueta = equipamento.etiqueta || gerarEtiquetaEquipamento();
      
      const equipamentoData = {
        ...equipamento,
        etiqueta,
        clienteNome: cliente.nome || 'Cliente não identificado',
        clienteId: cliente.id || null,
        createdAt: new Date(),
        ativo: true
      };

      await addDoc(collection(db, 'equipamentos'), equipamentoData);
      toast.success('Equipamento registrado com sucesso!');
      
      return etiqueta;
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error);
      toast.error('Erro ao adicionar equipamento');
    }
  };

  const cancelarOS = async (osId) => {
    try {
      await updateDoc(doc(db, 'ordens_servico', osId), {
        status: 'cancelado',
        canceladoEm: new Date(),
        canceladoPor: 'Usuário Atual'
      });
      
      toast.success('OS cancelada com sucesso!');
      loadOsExistentes();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao cancelar OS:', error);
      toast.error('Erro ao cancelar OS');
    }
  };

  const deletarOS = async (osId) => {
    try {
      await deleteDoc(doc(db, 'ordens_servico', osId));
      toast.success('OS deletada com sucesso!');
      loadOsExistentes();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao deletar OS:', error);
      toast.error('Erro ao deletar OS');
    }
  };

  const editarOS = (os) => {
    setEditandoOS(os.id);
    setCliente(os.cliente || {});
    setEquipamento(os.equipamento || {});
    setProblema(os.problema || {});
    setServico(os.servico || {});
    setAnexos(os.anexos || []);
  };

  const salvarEdicaoOS = async () => {
    if (!editandoOS) return;

    if (!equipamento.tipo || !problema.relatado) {
      toast.error('Preencha o tipo de equipamento e o problema relatado');
      return;
    }

    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'ordens_servico', editandoOS), {
        cliente,
        equipamento,
        problema,
        servico,
        anexos,
        updatedAt: new Date()
      });

      toast.success('OS atualizada com sucesso!');
      setEditandoOS(null);
      loadOsExistentes();
      limparFormulario();
    } catch (error) {
      console.error('Erro ao atualizar OS:', error);
      toast.error('Erro ao atualizar OS');
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setCliente({ nome: '', telefone: '', email: '', endereco: '' });
    setEquipamento({ tipo: 'smartphone', marca: '', modelo: '', cor: '', imei: '', senha: '', observacoes: '', etiqueta: '' });
    setProblema({ relatado: '', diagnostico: '', categoria: '', prioridade: 'normal', fotos: [] });
    setServico({ 
      numero: `OS-${Date.now()}`, 
      tecnico: '', 
      servicoSelecionado: '', 
      previsaoEntrega: '', 
      valorOrcamento: '', 
      valorMaoObra: '', 
      valorPecas: '', 
      status: 'aguardando', 
      observacoesTecnicas: '',
      comentarios: [],
      anexos: []
    });
    setAnexos([]);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Aqui você implementaria o upload real para storage
      // Por enquanto, vou simular com base64 para anexos locais
      const newAnexos = await Promise.all(files.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: Date.now() + Math.random(),
              nome: file.name,
              tipo: file.type,
              tamanho: file.size,
              url: e.target.result, // Em produção, seria a URL do storage
              uploadedAt: new Date(),
              uploadedBy: 'Usuário Atual'
            });
          };
          reader.readAsDataURL(file);
        });
      }));

      setAnexos(prev => [...prev, ...newAnexos]);
      toast.success(`${files.length} arquivo(s) anexado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao anexar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const removerAnexo = (anexoId) => {
    setAnexos(prev => prev.filter(a => a.id !== anexoId));
    toast.success('Anexo removido');
  };

  const imprimirOS = () => {
    setShowPreview(true);
    // Simular impressão após um pequeno delay
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const downloadPDF = async () => {
    if (!problema.relatado) {
      toast.error('Preencha os dados obrigatórios antes de gerar o PDF');
      return;
    }

    try {
      // Importar dinamicamente as bibliotecas
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Criar elemento temporário com o conteúdo da OS
      const elemento = document.createElement('div');
      elemento.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: black;">
          <!-- Cabeçalho com Logo -->
          <div style="border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h1 style="font-size: 28px; font-weight: bold; color: #333; margin: 0;">ORDEM DE SERVIÇO</h1>
                <p style="font-size: 18px; color: #666; margin: 5px 0;">Nº ${servico.numero}</p>
                <div style="margin-top: 10px;">
                  <span style="background: #FF2C68; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                    ${statusOptions.find(s => s.value === servico.status)?.label || servico.status}
                  </span>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FF2C68, #FF6B9D); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; margin-left: auto; box-shadow: 0 4px 15px rgba(255, 44, 104, 0.3);">
                  <span style="color: white; font-weight: bold; font-size: 16px; letter-spacing: 1px;">IARA</span>
                </div>
                <h2 style="font-size: 24px; font-weight: bold; color: #FF2C68; margin: 0;">IARA HUB</h2>
                <p style="color: #666; margin: 5px 0; font-weight: 500;">Assistência Técnica Especializada</p>
                <p style="font-size: 12px; color: #999;">${new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <!-- Status e Prioridade -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="font-weight: bold; color: #333; margin: 0 0 8px 0;">STATUS</h3>
              <p style="font-size: 16px; font-weight: 600; color: #007bff; margin: 0;">
                ${statusOptions.find(s => s.value === servico.status)?.label || 'Aguardando'}
              </p>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="font-weight: bold; color: #333; margin: 0 0 8px 0;">PRIORIDADE</h3>
              <p style="font-size: 16px; font-weight: 600; color: #fd7e14; margin: 0;">
                ${prioridadeOptions.find(p => p.value === problema.prioridade)?.label || 'Normal'}
              </p>
            </div>
          </div>

          <!-- Dados do Cliente -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">DADOS DO CLIENTE</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <p style="margin: 5px 0;"><strong>Nome:</strong> ${cliente.nome || 'Cliente não informado'}</p>
                  <p style="margin: 5px 0;"><strong>Telefone:</strong> ${cliente.telefone || 'Não informado'}</p>
                </div>
                <div>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${cliente.email || 'Não informado'}</p>
                  <p style="margin: 5px 0;"><strong>Endereço:</strong> ${cliente.endereco || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Dados do Equipamento -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">EQUIPAMENTO</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <p style="margin: 5px 0;"><strong>Tipo:</strong> ${tiposEquipamento.find(t => t.value === equipamento.tipo)?.label || equipamento.tipo}</p>
                  <p style="margin: 5px 0;"><strong>Marca:</strong> ${equipamento.marca || 'Não informado'}</p>
                  <p style="margin: 5px 0;"><strong>Modelo:</strong> ${equipamento.modelo || 'Não informado'}</p>
                </div>
                <div>
                  <p style="margin: 5px 0;"><strong>Cor:</strong> ${equipamento.cor || 'Não informado'}</p>
                  <p style="margin: 5px 0;"><strong>IMEI/Série:</strong> ${equipamento.imei || 'Não informado'}</p>
                  <p style="margin: 5px 0;"><strong>Senha:</strong> ${equipamento.senha ? '••••••' : 'Não informado'}</p>
                </div>
              </div>
              ${equipamento.observacoes ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
                  <p style="margin: 0;"><strong>Observações:</strong> ${equipamento.observacoes}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Problema Relatado -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">PROBLEMA RELATADO</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <p style="margin: 5px 0;"><strong>Categoria:</strong> ${categoriesProblema.find(c => c.value === problema.categoria)?.label || 'Não categorizado'}</p>
              <p style="margin: 5px 0;"><strong>Descrição:</strong> ${problema.relatado}</p>
              ${problema.diagnostico ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
                  <p style="margin: 0;"><strong>Diagnóstico Técnico:</strong> ${problema.diagnostico}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Valores -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">VALORES</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <div style="space-y: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Mão de Obra:</span>
                  <span>R$ ${(parseFloat(servico.valorMaoObra) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Peças/Componentes:</span>
                  <span>R$ ${(parseFloat(servico.valorPecas) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 8px; font-weight: bold; font-size: 18px;">
                  <span>Total:</span>
                  <span>R$ ${calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Informações do Serviço -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">INFORMAÇÕES DO SERVIÇO</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <p style="margin: 5px 0;"><strong>Técnico Responsável:</strong> ${servico.tecnico || 'Não atribuído'}</p>
                  <p style="margin: 5px 0;"><strong>Previsão de Entrega:</strong> ${servico.previsaoEntrega ? new Date(servico.previsaoEntrega).toLocaleDateString('pt-BR') : 'A definir'}</p>
                </div>
              </div>
              ${servico.observacoesTecnicas ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
                  <p style="margin: 0;"><strong>Observações Técnicas:</strong> ${servico.observacoesTecnicas}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Termos e Condições -->
          <div style="border-top: 2px solid #ddd; padding-top: 15px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px;">TERMOS E CONDIÇÕES</h3>
            <div style="font-size: 12px; color: #666; line-height: 1.5;">
              <p style="margin: 5px 0;">• O prazo de garantia do serviço é de 90 dias a partir da data de entrega</p>
              <p style="margin: 5px 0;">• O cliente tem 30 dias para retirar o equipamento após a conclusão do serviço</p>
              <p style="margin: 5px 0;">• Equipamentos não retirados após 60 dias serão considerados abandonados</p>
              <p style="margin: 5px 0;">• A empresa não se responsabiliza por dados perdidos durante o serviço</p>
            </div>
          </div>

          <!-- Assinaturas -->
          <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 8px; margin-top: 50px;">
                <p style="margin: 0; font-size: 12px; color: #666;">Assinatura do Cliente</p>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 8px; margin-top: 50px;">
                <p style="margin: 0; font-size: 12px; color: #666;">Assinatura do Técnico</p>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(elemento);

      // Configurar html2canvas
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remover elemento temporário
      document.body.removeChild(elemento);

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Baixar o PDF
      const nomeArquivo = `OS_${servico.numero}_${cliente.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'cliente'}.pdf`;
      pdf.save(nomeArquivo);
      
      toast.success('PDF gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const loadCustomCategorias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categorias_problemas'));
      const categorias = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomCategorias(categorias);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadCustomTecnicos = async () => {
    try {
      // Carregar técnicos da coleção de usuários filtrados por level 'TECNICO'
      const querySnapshot = await getDocs(collection(db, 'users'));
      const tecnicos = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.level === 'TECNICO' && user.active === true) // Só técnicos ativos
        .map(user => ({
          id: user.id,
          nome: user.displayName,
          email: user.email,
          ativo: user.active,
          createdAt: user.createdAt
        }));
      setCustomTecnicos(tecnicos);
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
    }
  };

  const loadServicos = async () => {
    try {
      console.log('🔧 ORDEM SERVIÇO: Carregando serviços...');
      
      // Primeiro tenta carregar da coleção 'servicos' (em português)
      let querySnapshot = await getDocs(collection(db, 'servicos'));
      console.log('📊 ORDEM SERVIÇO: Snapshot da coleção servicos recebido:', querySnapshot.size, 'documentos');
      
      // Se não encontrar nada, tenta 'services' (em inglês)
      if (querySnapshot.docs.length === 0) {
        console.log('⚠️ ORDEM SERVIÇO: Nenhum documento em "servicos", tentando "services"...');
        querySnapshot = await getDocs(collection(db, 'services'));
        console.log('📊 ORDEM SERVIÇO: Snapshot da coleção services recebido:', querySnapshot.size, 'documentos');
      }
      
      const servicosData = querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('📄 ORDEM SERVIÇO: Documento serviço:', data);
        return data;
      });
      
      console.log('📦 ORDEM SERVIÇO: Dados brutos dos serviços:', servicosData);
      
      const servicosAtivos = servicosData.filter(servico => {
        const isActive = servico.status === 'ativo' || servico.active || !servico.status;
        console.log(`🔍 ORDEM SERVIÇO: Serviço "${servico.nome || servico.name}" - Status: ${servico.status} - Ativo: ${isActive}`);
        return isActive;
      });
      
      console.log('✅ ORDEM SERVIÇO: Serviços ativos carregados:', servicosAtivos.length);
      console.log('📋 ORDEM SERVIÇO: Lista final de serviços:', servicosAtivos);
      
      setServicos(servicosAtivos);
    } catch (error) {
      console.error('❌ ORDEM SERVIÇO: Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    }
  };

  const salvarCategoria = async () => {
    if (!novaCategoria.trim()) {
      toast.error('Digite o nome da categoria');
      return;
    }

    try {
      await addDoc(collection(db, 'categorias_problemas'), {
        nome: novaCategoria.trim(),
        createdAt: new Date()
      });
      
      toast.success('Categoria adicionada com sucesso!');
      setNovaCategoria('');
      setShowAddCategoria(false);
      loadCustomCategorias();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleServicoSelect = (servicoId) => {
    const servicoSelecionado = servicos.find(s => s.id === servicoId);
    if (servicoSelecionado) {
      // Suporte a múltiplos formatos de dados (português primeiro, inglês como fallback)
      const nome = servicoSelecionado.nome || servicoSelecionado.name || servicoSelecionado.titulo || 'Serviço';
      const preco = servicoSelecionado.preco || servicoSelecionado.price || servicoSelecionado.valor || 0;
      const maoObra = servicoSelecionado.maoObra || servicoSelecionado.labor || servicoSelecionado.valorMaoObra || preco;
      const pecas = servicoSelecionado.valorPecas || servicoSelecionado.cost || servicoSelecionado.custo || 0;
      
      setServico(prev => ({
        ...prev,
        servicoSelecionado: servicoId,
        valorMaoObra: maoObra.toString(),
        valorPecas: pecas.toString(),
        valorOrcamento: preco.toString()
      }));
      
      toast.success(`Serviço "${nome}" selecionado! Valores atualizados.`);
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

  const categoriesProblema = [
    { value: 'tela', label: 'Tela/Display', icon: Smartphone },
    { value: 'bateria', label: 'Bateria', icon: Battery },
    { value: 'carregamento', label: 'Carregamento', icon: Zap },
    { value: 'audio', label: 'Áudio/Som', icon: Volume2 },
    { value: 'wifi', label: 'Wi-Fi/Conectividade', icon: Wifi },
    { value: 'software', label: 'Software/Sistema', icon: Settings },
    { value: 'hardware', label: 'Hardware Geral', icon: Wrench },
    { value: 'outros', label: 'Outros', icon: AlertTriangle },
    ...customCategorias.map(cat => ({
      value: cat.id,
      label: cat.nome,
      icon: Tag,
      custom: true
    }))
  ];

  const prioridadeOptions = [
    { value: 'baixa', label: 'Baixa', color: 'text-green-400' },
    { value: 'normal', label: 'Normal', color: 'text-yellow-400' },
    { value: 'alta', label: 'Alta', color: 'text-orange-400' },
    { value: 'urgente', label: 'Urgente', color: 'text-red-400' }
  ];

  const calcularTotal = () => {
    const maoObra = parseFloat(servico.valorMaoObra) || 0;
    const pecas = parseFloat(servico.valorPecas) || 0;
    return maoObra + pecas;
  };

  const salvarOS = async () => {
    if (!cliente.nome || cliente.nome.trim() === '') {
      toast.error('Selecione um cliente para criar a OS');
      return;
    }

    if (!equipamento.tipo || !problema.relatado) {
      toast.error('Preencha o tipo de equipamento e o problema relatado');
      return;
    }

    try {
      setLoading(true);
      
      const osData = {
        numero: servico.numero,
        cliente: cliente,
        equipamento: equipamento,
        problema: problema,
        servico: {
          ...servico,
          valorTotal: calcularTotal()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'ordens_servico'), osData);
      
      toast.success('OS criada com sucesso!');
      
      // Reset form
      setCliente({ nome: '', telefone: '', email: '', endereco: '' });
      setEquipamento({ tipo: 'smartphone', marca: '', modelo: '', cor: '', imei: '', senha: '', observacoes: '' });
      setProblema({ relatado: '', diagnostico: '', categoria: '', prioridade: 'normal', fotos: [] });
      setServico({
        numero: `OS-${Date.now()}`,
        tecnico: '',
        servicoSelecionado: '',
        previsaoEntrega: '',
        valorOrcamento: '',
        valorMaoObra: '',
        valorPecas: '',
        status: 'aguardando',
        observacoesTecnicas: ''
      });
      
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      toast.error('Erro ao salvar OS');
    } finally {
      setLoading(false);
    }
  };

  const PreviewOS = () => (
    <div className="max-w-4xl mx-auto bg-white text-black p-8">
      {/* Cabeçalho com Logo Preta */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ORDEM DE SERVIÇO</h1>
            <p className="text-lg text-gray-600">Nº {servico.numero}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-white text-sm ${statusOptions.find(s => s.value === servico.status)?.color || 'bg-gray-500'}`}>
                {statusOptions.find(s => s.value === servico.status)?.label || servico.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            {/* Logo Moderna do IARA HUB */}
            <div className="mb-4 flex justify-end">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF2C68] to-[#FF6B9D] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm tracking-wider">IARA</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#FF2C68]">IARA HUB</h2>
            <p className="text-gray-600 font-medium">Assistência Técnica Especializada</p>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Status e Prioridade */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-bold text-gray-800 mb-2">STATUS</h3>
          <p className="text-lg font-semibold text-blue-600">
            {statusOptions.find(s => s.value === servico.status)?.label}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-bold text-gray-800 mb-2">PRIORIDADE</h3>
          <p className="text-lg font-semibold text-orange-600">
            {prioridadeOptions.find(p => p.value === problema.prioridade)?.label}
          </p>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">DADOS DO CLIENTE</h3>
        <div className="bg-gray-50 p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Nome:</strong> {cliente.nome || 'Cliente não informado'}</p>
              <p><strong>Telefone:</strong> {cliente.telefone || 'Não informado'}</p>
            </div>
            <div>
              <p><strong>Email:</strong> {cliente.email || 'Não informado'}</p>
              <p><strong>Endereço:</strong> {cliente.endereco || 'Não informado'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Equipamento */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">EQUIPAMENTO</h3>
        <div className="bg-gray-50 p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Tipo:</strong> {tiposEquipamento.find(t => t.value === equipamento.tipo)?.label}</p>
              <p><strong>Marca:</strong> {equipamento.marca || 'Não informado'}</p>
              <p><strong>Modelo:</strong> {equipamento.modelo || 'Não informado'}</p>
            </div>
            <div>
              <p><strong>Cor:</strong> {equipamento.cor || 'Não informado'}</p>
              <p><strong>IMEI/Série:</strong> {equipamento.imei || 'Não informado'}</p>
              <p><strong>Senha:</strong> {equipamento.senha ? '••••••' : 'Não informado'}</p>
            </div>
          </div>
          {equipamento.observacoes && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p><strong>Observações:</strong> {equipamento.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Problema Relatado */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">PROBLEMA RELATADO</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>Categoria:</strong> {categoriesProblema.find(c => c.value === problema.categoria)?.label || 'Não categorizado'}</p>
          <p><strong>Descrição:</strong> {problema.relatado}</p>
          {problema.diagnostico && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p><strong>Diagnóstico Técnico:</strong> {problema.diagnostico}</p>
            </div>
          )}
        </div>
      </div>

      {/* Valores */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">VALORES</h3>
        <div className="bg-gray-50 p-4 rounded">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Mão de Obra:</span>
              <span>R$ {(parseFloat(servico.valorMaoObra) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Peças/Componentes:</span>
              <span>R$ {(parseFloat(servico.valorPecas) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-lg">
              <span>Total:</span>
              <span>R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Serviço */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">INFORMAÇÕES DO SERVIÇO</h3>
        <div className="bg-gray-50 p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Técnico Responsável:</strong> {servico.tecnico || 'Não atribuído'}</p>
              <p><strong>Previsão de Entrega:</strong> {servico.previsaoEntrega ? new Date(servico.previsaoEntrega).toLocaleDateString('pt-BR') : 'A definir'}</p>
            </div>
          </div>
          {servico.observacoesTecnicas && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p><strong>Observações Técnicas:</strong> {servico.observacoesTecnicas}</p>
            </div>
          )}
        </div>
      </div>

      {/* Termos e Condições */}
      <div className="border-t-2 border-gray-300 pt-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">TERMOS E CONDIÇÕES</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• O prazo de garantia do serviço é de 90 dias a partir da data de entrega</p>
          <p>• O cliente tem 30 dias para retirar o equipamento após a conclusão do serviço</p>
          <p>• Não nos responsabilizamos por dados perdidos durante o reparo</p>
          <p>• Recomenda-se fazer backup dos dados antes do serviço</p>
          <p>• Peças substituídas ficam com a empresa</p>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-gray-400 mt-8 pt-2">
              <p className="text-sm">Assinatura do Cliente</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 mt-8 pt-2">
              <p className="text-sm">Assinatura do Técnico</p>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>IARA HUB - Assistência Técnica Especializada</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
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
            <h1 className="text-3xl font-bold text-white">Ordem de Serviço</h1>
            <p className="text-white/60">Gerenciar serviços técnicos</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/vendas/os/calendario')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendário</span>
          </button>
          
          <button
            onClick={() => {
              window.open('/tecnico-mobile', '_blank');
              toast.success('Página do técnico mobile aberta!');
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>📱 Técnico Mobile</span>
          </button>
          
          <button
            onClick={() => setShowPreview(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna Esquerda */}
        <div className="space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-[#FF2C68]" />
              <span>Dados do Cliente</span>
            </h2>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-white font-medium mb-2">Nome</label>
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

          {/* Dados do Equipamento */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-[#FF2C68]" />
              <span>Equipamento</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Tipo de Equipamento *</label>
                <select
                  value={equipamento.tipo}
                  onChange={(e) => setEquipamento({...equipamento, tipo: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                >
                  {tiposEquipamento.map(tipo => (
                    <option key={tipo.value} value={tipo.value} className="bg-[#0D0C0C]">{tipo.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Marca</label>
                  <input
                    type="text"
                    value={equipamento.marca}
                    onChange={(e) => setEquipamento({...equipamento, marca: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Ex: Apple"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Modelo</label>
                  <input
                    type="text"
                    value={equipamento.modelo}
                    onChange={(e) => setEquipamento({...equipamento, modelo: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Ex: iPhone 15"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Cor</label>
                  <input
                    type="text"
                    value={equipamento.cor}
                    onChange={(e) => setEquipamento({...equipamento, cor: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Ex: Preto"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">IMEI/Série</label>
                  <input
                    type="text"
                    value={equipamento.imei}
                    onChange={(e) => setEquipamento({...equipamento, imei: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Número de série"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Senha/PIN</label>
                <input
                  type="password"
                  value={equipamento.senha}
                  onChange={(e) => setEquipamento({...equipamento, senha: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                  placeholder="Senha de desbloqueio"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Observações do Equipamento</label>
                <textarea
                  value={equipamento.observacoes}
                  onChange={(e) => setEquipamento({...equipamento, observacoes: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                  placeholder="Riscos, acessórios, etc..."
                  rows="3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          {/* Problema e Diagnóstico */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-[#FF2C68]" />
              <span>Problema e Diagnóstico</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Categoria do Problema</label>
                <div className="flex space-x-2">
                  <select
                    value={problema.categoria}
                    onChange={(e) => setProblema({...problema, categoria: e.target.value})}
                    className="flex-1 px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                  >
                    <option value="" className="bg-[#0D0C0C]">Selecione a categoria</option>
                    {categoriesProblema.map(cat => (
                      <option key={cat.value} value={cat.value} className="bg-[#0D0C0C]">{cat.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoria(true)}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center"
                    title="Adicionar Nova Categoria"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Prioridade</label>
                <select
                  value={problema.prioridade}
                  onChange={(e) => setProblema({...problema, prioridade: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                >
                  {prioridadeOptions.map(pri => (
                    <option key={pri.value} value={pri.value} className="bg-[#0D0C0C]">{pri.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Problema Relatado pelo Cliente *</label>
                <textarea
                  value={problema.relatado}
                  onChange={(e) => setProblema({...problema, relatado: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                  placeholder="Descreva o problema relatado pelo cliente..."
                  rows="4"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Diagnóstico Técnico</label>
                <textarea
                  value={problema.diagnostico}
                  onChange={(e) => setProblema({...problema, diagnostico: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                  placeholder="Diagnóstico após análise técnica..."
                  rows="4"
                />
              </div>
            </div>
          </div>

          {/* Informações do Serviço */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-[#FF2C68]" />
              <span>Serviço</span>
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Número OS</label>
                  <input
                    type="text"
                    value={servico.numero}
                    onChange={(e) => setServico({...servico, numero: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Status</label>
                  <select
                    value={servico.status}
                    onChange={(e) => setServico({...servico, status: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value} className="bg-[#0D0C0C]">{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Seleção de Serviço */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <label className="block text-white font-medium mb-3 flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-green-400" />
                  <span>Serviço Técnico (Opcional)</span>
                </label>
                <select
                  value={servico.servicoSelecionado}
                  onChange={(e) => handleServicoSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-green-500/30 rounded-lg text-white focus:border-green-500 focus:outline-none transition-colors"
                >
                  <option value="" className="bg-[#0D0C0C]">Selecione um serviço cadastrado</option>
                  {servicos.map(servicoItem => (
                    <option key={servicoItem.id} value={servicoItem.id} className="bg-[#0D0C0C]">
                      {servicoItem.nome || servicoItem.name} - R$ {(servicoItem.preco || servicoItem.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                {servico.servicoSelecionado && (
                  <div className="mt-2 text-sm text-green-400">
                    ✅ Valores preenchidos automaticamente
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Técnico Responsável</label>
                  <select
                    value={servico.tecnico}
                    onChange={(e) => setServico({...servico, tecnico: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                  >
                    <option value="" className="bg-[#0D0C0C]">Selecione o técnico</option>
                    {customTecnicos.map(tecnico => (
                      <option key={tecnico.id} value={tecnico.nome} className="bg-[#0D0C0C]">
                        {tecnico.nome} ({tecnico.email})
                      </option>
                    ))}
                  </select>
                  {customTecnicos.length === 0 && (
                    <p className="text-yellow-400 text-sm mt-1">
                      ⚠️ Nenhum técnico cadastrado. Cadastre técnicos em Configurações → Usuários
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Previsão de Entrega</label>
                  <input
                    type="date"
                    value={servico.previsaoEntrega}
                    onChange={(e) => setServico({...servico, previsaoEntrega: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white focus:border-[#FF2C68] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Valor Mão de Obra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={servico.valorMaoObra}
                    onChange={(e) => setServico({...servico, valorMaoObra: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="0.00"
                  />
                  <p className="text-yellow-400 text-xs mt-1">
                    💡 Valor editável - pode ajustar conforme necessário
                  </p>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Valor das Peças</label>
                  <input
                    type="number"
                    step="0.01"
                    value={servico.valorPecas}
                    onChange={(e) => setServico({...servico, valorPecas: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="0.00"
                  />
                  <p className="text-yellow-400 text-xs mt-1">
                    💡 Valor editável - pode ajustar conforme necessário
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Valor Total</label>
                <div className="w-full px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 font-bold text-lg">
                  R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Observações Técnicas</label>
                <textarea
                  value={servico.observacoesTecnicas}
                  onChange={(e) => setServico({...servico, observacoesTecnicas: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                  placeholder="Observações sobre o reparo, peças utilizadas, etc..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Sistema de Anexos */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Paperclip className="w-5 h-5 text-[#FF2C68]" />
              <span>Anexos ({anexos.length})</span>
            </h2>
            
            <div className="space-y-4">
              {/* Upload de Arquivos */}
              <div>
                <label className="block text-white font-medium mb-2">Adicionar Arquivos</label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="w-full p-4 border-2 border-dashed border-[#FF2C68]/30 rounded-lg cursor-pointer hover:border-[#FF2C68]/50 transition-colors flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-[#FF2C68]" />
                    <span className="text-white">Clique para adicionar fotos ou documentos</span>
                    <span className="text-white/60 text-sm">Suporta: imagens, PDF, DOC, TXT</span>
                  </label>
                </div>
                {uploading && (
                  <div className="mt-2 flex items-center space-x-2 text-[#FF2C68]">
                    <div className="w-4 h-4 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin" />
                    <span>Enviando arquivos...</span>
                  </div>
                )}
              </div>
              
              {/* Lista de Anexos */}
              {anexos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white font-medium">Arquivos anexados:</p>
                  {anexos.map((anexo) => (
                    <div key={anexo.id} className="flex items-center justify-between p-3 bg-[#0D0C0C]/30 rounded-lg border border-white/10">
                      <div className="flex items-center space-x-3">
                        {anexo.tipo.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5 text-blue-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-green-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">{anexo.nome}</p>
                          <p className="text-white/60 text-sm">
                            {(anexo.tamanho / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removerAnexo(anexo.id)}
                        className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção de Equipamentos */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-[#FF2C68]" />
              <span>Equipamento</span>
            </h2>
            
            <div className="space-y-4">
              {/* Etiqueta do Equipamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Etiqueta</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={equipamento.etiqueta}
                      onChange={(e) => setEquipamento({...equipamento, etiqueta: e.target.value})}
                      className="flex-1 px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                      placeholder="Ex: SMT-123456"
                    />
                    <button
                      onClick={gerarEtiquetaEquipamento}
                      className="px-4 py-2 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-lg text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors"
                      title="Gerar etiqueta automática"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Ações</label>
                  <button
                    onClick={adicionarEquipamentoAoCliente}
                    disabled={!equipamento.tipo}
                    className="w-full px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar Equipamento</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            {editandoOS ? (
              <>
                              <button
                onClick={salvarEdicaoOS}
                disabled={!equipamento.tipo || !problema.relatado || loading}
                className="w-full bg-[#FF2C68] hover:bg-[#FF2C68]/80 disabled:bg-gray-500 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
              >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando Edição...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setEditandoOS(null);
                    limparFormulario();
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar Edição
                </button>
              </>
            ) : (
              <button
                onClick={salvarOS}
                disabled={!equipamento.tipo || !problema.relatado || loading}
                className="w-full bg-[#FF2C68] hover:bg-[#FF2C68]/80 disabled:bg-gray-500 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Salvar OS</span>
                  </>
                )}
              </button>
            )}
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!problema.relatado}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Visualizar</span>
              </button>
              
              <button
                onClick={imprimirOS}
                disabled={!problema.relatado}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
              
              <button
                onClick={downloadPDF}
                disabled={!problema.relatado}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de OS Existentes */}
      {osExistentes.length > 0 && (
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Clipboard className="w-5 h-5 text-[#FF2C68]" />
            <span>Ordens de Serviço Existentes ({osExistentes.length})</span>
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {osExistentes.map((os) => (
              <div key={os.id} className="bg-[#0D0C0C]/30 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-white text-xs ${statusOptions.find(s => s.value === os.servico?.status)?.color || 'bg-gray-500'}`}>
                      {statusOptions.find(s => s.value === os.servico?.status)?.label || os.servico?.status || 'Indefinido'}
                    </span>
                    <h3 className="text-white font-medium">OS #{os.numero || os.servico?.numero}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => editarOS(os)}
                      className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Editar OS"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(os.id)}
                      className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Cancelar/Deletar OS"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-white/60">Cliente:</p>
                    <p className="text-white">{os.cliente?.nome || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Equipamento:</p>
                    <p className="text-white">{tiposEquipamento.find(t => t.value === os.equipamento?.tipo)?.label || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Problema:</p>
                    <p className="text-white line-clamp-2">{os.problema?.relatado || 'N/A'}</p>
                  </div>
                </div>
                
                {os.servico?.valorTotal && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-green-400 font-bold">
                      Total: R$ {parseFloat(os.servico.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelar/Deletar */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68]/30 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Gerenciar OS</h3>
              <p className="text-white/70 mb-6">
                O que você gostaria de fazer com esta OS?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => cancelarOS(showDeleteConfirm)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar OS (manter histórico)</span>
                </button>
                
                <button
                  onClick={() => deletarOS(showDeleteConfirm)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Deletar OS (remover completamente)</span>
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Adicionar Categoria */}
      <AnimatePresence>
        {showAddCategoria && (
          <motion.div
            className="fixed inset-0 bg-[#0D0C0C]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddCategoria(false)}
          >
            <motion.div
              className="bg-[#0D0C0C] rounded-2xl border border-[#FF2C68]/30 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Adicionar Nova Categoria</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Nome da Categoria</label>
                  <input
                    type="text"
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none transition-colors"
                    placeholder="Ex: Camera Frontal"
                    onKeyPress={(e) => e.key === 'Enter' && salvarCategoria()}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={salvarCategoria}
                    className="flex-1 bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategoria(false);
                      setNovaCategoria('');
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <h3 className="text-lg font-bold text-gray-800">Visualização da OS</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  Fechar
                </button>
              </div>
              
              <PreviewOS />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 