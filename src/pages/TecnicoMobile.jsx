import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  MessageSquare,
  Paperclip,
  Phone,
  MapPin,
  User,
  Search,
  Filter,
  Upload,
  Eye,
  Edit3,
  Save,
  X,
  Image as ImageIcon,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc, addDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function TecnicoMobile() {
  const [osAssignadas, setOsAssignadas] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [osDetalhada, setOsDetalhada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [anexos, setAnexos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock do usuário técnico atual - em produção viria do contexto de autenticação
  const tecnicoAtual = {
    id: 'tecnico-001',
    nome: 'João Silva',
    email: 'joao@iarahub.com',
    nivel: 'TECNICO'
  };

  const statusOptions = [
    { value: 'todas', label: 'Todas as OS', color: 'bg-gray-500' },
    { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-500' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
    { value: 'aguardando_pecas', label: 'Aguardando Peças', color: 'bg-orange-500' },
    { value: 'finalizado', label: 'Finalizado', color: 'bg-green-500' },
    { value: 'entregue', label: 'Entregue', color: 'bg-purple-500' }
  ];

  const tiposEquipamento = [
    { value: 'smartphone', label: 'Smartphone' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'notebook', label: 'Notebook' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'smartwatch', label: 'Smartwatch' },
    { value: 'fone', label: 'Fone/Headset' },
    { value: 'outro', label: 'Outro' }
  ];

  useEffect(() => {
    loadOSAssignadas();
  }, []);

  useEffect(() => {
    if (osDetalhada) {
      loadComentarios(osDetalhada.id);
      loadAnexos(osDetalhada.id);
    }
  }, [osDetalhada]);

  const loadOSAssignadas = async () => {
    try {
      setLoading(true);
      
      // Carregar todas as OS atribuídas ao técnico atual
      const querySnapshot = await getDocs(collection(db, 'ordens_servico'));
      const osData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(os => 
          os.servico?.tecnico === tecnicoAtual.nome || 
          os.servico?.tecnico === tecnicoAtual.id ||
          os.tecnicoId === tecnicoAtual.id
        );
      
      setOsAssignadas(osData);
      toast.success(`${osData.length} OS carregadas`);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      toast.error('Erro ao carregar OS');
    } finally {
      setLoading(false);
    }
  };

  const loadComentarios = async (osId) => {
    try {
      const q = query(collection(db, 'os_comentarios'), where('osId', '==', osId));
      const querySnapshot = await getDocs(q);
      const comentariosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComentarios(comentariosData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const loadAnexos = async (osId) => {
    try {
      const q = query(collection(db, 'os_anexos'), where('osId', '==', osId));
      const querySnapshot = await getDocs(q);
      const anexosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnexos(anexosData);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    }
  };

  const filteredOS = osAssignadas.filter(os => {
    const matchSearch = searchTerm === '' || 
      os.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.equipamento?.marca?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filtroStatus === 'todas' || os.servico?.status === filtroStatus;
    
    return matchSearch && matchStatus;
  });

  const atualizarStatus = async (osId, novoStatus) => {
    try {
      await updateDoc(doc(db, 'ordens_servico', osId), {
        'servico.status': novoStatus,
        updatedAt: new Date(),
        updatedBy: tecnicoAtual.nome
      });
      
      toast.success('Status atualizado!');
      loadOSAssignadas();
      
      if (osDetalhada?.id === osId) {
        setOsDetalhada(prev => ({
          ...prev,
          servico: { ...prev.servico, status: novoStatus }
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const adicionarComentario = async () => {
    if (!novoComentario.trim() || !osDetalhada) return;

    try {
      await addDoc(collection(db, 'os_comentarios'), {
        osId: osDetalhada.id,
        comentario: novoComentario.trim(),
        autor: tecnicoAtual.nome,
        autorId: tecnicoAtual.id,
        createdAt: new Date(),
        tipo: 'tecnico'
      });

      setNovoComentario('');
      loadComentarios(osDetalhada.id);
      toast.success('Comentário adicionado!');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0 || !osDetalhada) return;

    setUploading(true);
    try {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          await addDoc(collection(db, 'os_anexos'), {
            osId: osDetalhada.id,
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            url: e.target.result, // Em produção seria URL do storage
            uploadedAt: new Date(),
            uploadedBy: tecnicoAtual.nome,
            uploadedById: tecnicoAtual.id
          });
        };
        reader.readAsDataURL(file);
      }
      
      setTimeout(() => {
        loadAnexos(osDetalhada.id);
        toast.success(`${files.length} arquivo(s) anexado(s)!`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao anexar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const salvarAlteracoes = async () => {
    if (!osDetalhada) return;

    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'ordens_servico', osDetalhada.id), {
        ...osDetalhada,
        updatedAt: new Date(),
        updatedBy: tecnicoAtual.nome
      });

      toast.success('Alterações salvas!');
      setEditando(false);
      loadOSAssignadas();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0C0C] via-[#1a1a1a] to-[#0D0C0C] p-4">
      {/* Header Mobile */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">📱 Técnico Mobile</h1>
            <p className="text-white/60">Olá, {tecnicoAtual.nome}</p>
          </div>
          <button
            onClick={() => {
              loadOSAssignadas();
              toast.success('Dados atualizados!');
            }}
            className="p-3 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-xl text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros Mobile */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por OS, cliente ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => setFiltroStatus(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filtroStatus === status.value
                    ? `${status.color} text-white`
                    : 'bg-[#0D0C0C]/50 text-white/60 border border-white/10'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de OS */}
      {!osDetalhada ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Carregando OS...</p>
            </div>
          ) : filteredOS.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma OS encontrada</p>
            </div>
          ) : (
            filteredOS.map((os) => (
              <motion.div
                key={os.id}
                className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOsDetalhada(os)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-white text-xs ${
                      statusOptions.find(s => s.value === os.servico?.status)?.color || 'bg-gray-500'
                    }`}>
                      {statusOptions.find(s => s.value === os.servico?.status)?.label || 'Indefinido'}
                    </span>
                    <h3 className="text-white font-bold">OS #{os.numero || os.servico?.numero}</h3>
                  </div>
                  <Eye className="w-5 h-5 text-[#FF2C68]" />
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">{os.cliente?.nome || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-green-400" />
                    <span className="text-white">
                      {tiposEquipamento.find(t => t.value === os.equipamento?.tipo)?.label || 'N/A'} - {os.equipamento?.marca || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-white/70">
                      Criado em: {formatDate(os.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-white/70 line-clamp-2">
                    {os.problema?.relatado || 'Sem descrição do problema'}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* Detalhes da OS */
        <div className="space-y-6">
          {/* Header Detalhes */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setOsDetalhada(null)}
              className="p-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white hover:bg-[#0D0C0C]/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditando(!editando)}
                className={`p-2 border rounded-xl transition-colors ${
                  editando 
                    ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                    : 'bg-[#FF2C68]/20 border-[#FF2C68]/30 text-[#FF2C68]'
                }`}
              >
                {editando ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
              </button>
              
              {editando && (
                <button
                  onClick={salvarAlteracoes}
                  disabled={loading}
                  className="px-4 py-2 bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white rounded-xl font-medium transition-colors"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              )}
            </div>
          </div>

          {/* Info da OS */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">OS #{osDetalhada.numero || osDetalhada.servico?.numero}</h2>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-white text-sm ${
                  statusOptions.find(s => s.value === osDetalhada.servico?.status)?.color || 'bg-gray-500'
                }`}>
                  {statusOptions.find(s => s.value === osDetalhada.servico?.status)?.label || 'Indefinido'}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#FF2C68]" />
                  <span>Cliente</span>
                </h3>
                <div className="bg-[#0D0C0C]/30 rounded-lg p-3 space-y-2">
                  <p className="text-white"><strong>Nome:</strong> {osDetalhada.cliente?.nome}</p>
                  {osDetalhada.cliente?.telefone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-green-400" />
                      <a href={`tel:${osDetalhada.cliente.telefone}`} className="text-green-400 hover:underline">
                        {osDetalhada.cliente.telefone}
                      </a>
                    </div>
                  )}
                  {osDetalhada.cliente?.endereco && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="text-white/70">{osDetalhada.cliente.endereco}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipamento */}
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-[#FF2C68]" />
                  <span>Equipamento</span>
                </h3>
                <div className="bg-[#0D0C0C]/30 rounded-lg p-3 space-y-2">
                  <p className="text-white">
                    <strong>Tipo:</strong> {tiposEquipamento.find(t => t.value === osDetalhada.equipamento?.tipo)?.label}
                  </p>
                  <p className="text-white"><strong>Marca:</strong> {osDetalhada.equipamento?.marca}</p>
                  <p className="text-white"><strong>Modelo:</strong> {osDetalhada.equipamento?.modelo}</p>
                  {osDetalhada.equipamento?.imei && (
                    <p className="text-white"><strong>IMEI/Série:</strong> {osDetalhada.equipamento.imei}</p>
                  )}
                  {osDetalhada.equipamento?.etiqueta && (
                    <p className="text-white"><strong>Etiqueta:</strong> {osDetalhada.equipamento.etiqueta}</p>
                  )}
                </div>
              </div>

              {/* Problema */}
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF2C68]" />
                  <span>Problema</span>
                </h3>
                <div className="bg-[#0D0C0C]/30 rounded-lg p-3">
                  {editando ? (
                    <textarea
                      value={osDetalhada.problema?.diagnostico || ''}
                      onChange={(e) => setOsDetalhada(prev => ({
                        ...prev,
                        problema: { ...prev.problema, diagnostico: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                      placeholder="Diagnóstico técnico..."
                      rows="4"
                    />
                  ) : (
                    <>
                      <p className="text-white mb-2"><strong>Relatado:</strong> {osDetalhada.problema?.relatado}</p>
                      {osDetalhada.problema?.diagnostico && (
                        <p className="text-white/70"><strong>Diagnóstico:</strong> {osDetalhada.problema.diagnostico}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Atualizar Status */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-white font-semibold mb-4">Atualizar Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions.filter(s => s.value !== 'todas').map((status) => (
                <button
                  key={status.value}
                  onClick={() => atualizarStatus(osDetalhada.id, status.value)}
                  className={`p-3 rounded-lg font-medium transition-colors ${
                    osDetalhada.servico?.status === status.value
                      ? `${status.color} text-white`
                      : 'bg-[#0D0C0C]/30 text-white/70 border border-white/10 hover:bg-[#0D0C0C]/50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comentários */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[#FF2C68]" />
              <span>Comentários ({comentarios.length})</span>
            </h3>
            
            {/* Adicionar Comentário */}
            <div className="mb-4">
              <div className="flex space-x-3">
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white placeholder-white/40 focus:border-[#FF2C68] focus:outline-none"
                  placeholder="Adicionar comentário..."
                  rows="3"
                />
                <button
                  onClick={adicionarComentario}
                  disabled={!novoComentario.trim()}
                  className="px-4 py-2 bg-[#FF2C68] hover:bg-[#FF2C68]/80 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
            
            {/* Lista de Comentários */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comentarios.map((comentario) => (
                <div key={comentario.id} className="bg-[#0D0C0C]/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#FF2C68] font-medium">{comentario.autor}</span>
                    <span className="text-white/60 text-xs">{formatDateTime(comentario.createdAt)}</span>
                  </div>
                  <p className="text-white/80">{comentario.comentario}</p>
                </div>
              ))}
              
              {comentarios.length === 0 && (
                <p className="text-white/60 text-center py-4">Nenhum comentário ainda</p>
              )}
            </div>
          </div>

          {/* Anexos */}
          <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
              <Paperclip className="w-5 h-5 text-[#FF2C68]" />
              <span>Anexos ({anexos.length})</span>
            </h3>
            
            {/* Upload */}
            <div className="mb-4">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-mobile"
              />
              <label
                htmlFor="file-upload-mobile"
                className="w-full p-4 border-2 border-dashed border-[#FF2C68]/30 rounded-lg cursor-pointer hover:border-[#FF2C68]/50 transition-colors flex flex-col items-center space-y-2"
              >
                <Upload className="w-6 h-6 text-[#FF2C68]" />
                <span className="text-white text-sm">Adicionar fotos ou documentos</span>
              </label>
              
              {uploading && (
                <div className="mt-2 flex items-center justify-center space-x-2 text-[#FF2C68]">
                  <div className="w-4 h-4 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin" />
                  <span>Enviando...</span>
                </div>
              )}
            </div>
            
            {/* Lista de Anexos */}
            <div className="space-y-2">
              {anexos.map((anexo) => (
                <div key={anexo.id} className="flex items-center justify-between p-3 bg-[#0D0C0C]/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {anexo.tipo?.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-green-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">{anexo.nome}</p>
                      <p className="text-white/60 text-xs">
                        Por {anexo.uploadedBy} - {formatDateTime(anexo.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-[#FF2C68]" />
                </div>
              ))}
              
              {anexos.length === 0 && (
                <p className="text-white/60 text-center py-4">Nenhum anexo ainda</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 