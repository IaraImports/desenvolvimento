import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  Clipboard,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function Vendas() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vendasHoje: 0,
    receitaHoje: 0,
    orcamentosAbertos: 0,
    osAndamento: 0
  });
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Data de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Inicializar com valores padrão
      let vendasHoje = 0;
      let receitaHoje = 0;
      let orcamentosAbertos = 0;
      let osAndamento = 0;
      let atividadesData = [];

      // Carregar vendas do dia com fallback
      try {
        // Consulta simples sem índice problemático
        const vendasQuery = query(
          collection(db, 'vendas'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const vendasSnap = await getDocs(vendasQuery);
        const todasVendas = vendasSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(venda => venda.status === 'concluida'); // Filtrar status localmente
        
        // Filtrar vendas de hoje localmente
        const vendasHojeData = todasVendas.filter(venda => {
          if (!venda.createdAt) return false;
          try {
            const vendaDate = venda.createdAt.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
            return vendaDate >= today && vendaDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          } catch (_error) { // eslint-disable-line no-unused-vars
            return false;
          }
        });
        
        vendasHoje = vendasHojeData.length;
        receitaHoje = vendasHojeData.reduce((acc, venda) => acc + (venda.total || 0), 0);
        
        // Usar as primeiras 5 vendas como atividades
        atividadesData = todasVendas.slice(0, 5).map(venda => ({
          ...venda,
          tipo: 'venda'
        }));
        
      } catch (_error) {
        console.warn('Erro ao carregar vendas:', _error);
        // Mantém valores padrão
      }

      // Carregar orçamentos com fallback
      try {
        const orcamentosQuery = query(collection(db, 'orcamentos'), limit(50));
        const orcamentosSnap = await getDocs(orcamentosQuery);
        const orcamentos = orcamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        orcamentosAbertos = orcamentos.filter(orc => orc.status === 'aberto').length;
      } catch (_error) {
        console.warn('Erro ao carregar orçamentos:', _error);
        orcamentosAbertos = 0;
      }

      // Carregar OS com fallback
      try {
        const osQuery = query(collection(db, 'ordens_servico'), limit(50));
        const osSnap = await getDocs(osQuery);
        const os = osSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        osAndamento = os.filter(ordem => 
          ['aberta', 'em_andamento', 'aguardando_peca'].includes(ordem.status)
        ).length;
      } catch (_error) {
        console.warn('Erro ao carregar ordens de serviço:', _error);
        osAndamento = 0;
      }

      setStats({
        vendasHoje,
        receitaHoje,
        orcamentosAbertos,
        osAndamento
      });
      
      setAtividades(atividadesData);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Sistema funcionando com dados limitados');
      
      // Definir dados padrão mesmo em caso de erro total
      setStats({
        vendasHoje: 0,
        receitaHoje: 0,
        orcamentosAbertos: 0,
        osAndamento: 0
      });
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  };



  const salesOptions = [
    {
      title: 'PDV - Ponto de Venda',
      description: 'Registre vendas diretas de produtos e serviços',
      icon: CreditCard,
      color: 'green',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500',
      path: '/vendas/pdv',
      features: ['Venda rápida', 'Pagamento à vista/parcelado', 'Controle de estoque', 'Emissão de cupons']
    },
    {
      title: 'Orçamentos',
      description: 'Crie propostas comerciais para clientes',
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
      path: '/vendas/orcamento',
      features: ['Propostas detalhadas', 'Validade definida', 'Conversão em venda', 'Envio por e-mail']
    },
    {
      title: 'Ordem de Serviço',
      description: 'Gerencie serviços técnicos e reparos',
      icon: Clipboard,
      color: 'orange',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-500',
      path: '/vendas/os',
      features: ['Diagnóstico técnico', 'Controle de status', 'Histórico de serviços', 'Garantia de serviços']
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF2C68]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Sistema de Vendas</h1>
        <p className="text-white/60 text-lg">
          Gerencie vendas, orçamentos e ordens de serviço de forma integrada
        </p>
      </div>

      {/* Dashboard de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Vendas Hoje</p>
              <p className="text-2xl font-bold text-white">{stats.vendasHoje}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#FF2C68]/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#FF2C68]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Receita Hoje</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.receitaHoje)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Orçamentos Abertos</p>
              <p className="text-2xl font-bold text-white">{stats.orcamentosAbertos}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Clipboard className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">OS em Andamento</p>
              <p className="text-2xl font-bold text-white">{stats.osAndamento}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Histórico de Orçamentos */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/vendas/historico-orcamentos')}
          className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4 hover:border-blue-500/50 transition-all duration-300 flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">📋 Histórico de Orçamentos</h3>
            <p className="text-white/60 text-sm">Visualizar orçamentos salvos e duplicar</p>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-400" />
        </button>
      </div>

      {/* Opções de Venda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {salesOptions.map((option) => (
          <div
            key={option.title}
            className={`bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border ${option.borderColor}/30 p-8 group cursor-pointer hover:border-${option.color}-500/50 transition-all duration-300`}
            onClick={() => navigate(option.path)}
          >
            {/* Header do Card */}
            <div className="flex items-center space-x-4 mb-6">
              <div className={`w-16 h-16 ${option.bgColor}/20 rounded-2xl flex items-center justify-center group-hover:${option.bgColor}/30 transition-colors`}>
                <option.icon className={`w-8 h-8 text-${option.color}-400`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{option.title}</h3>
                <p className="text-white/60 text-sm">{option.description}</p>
              </div>
              <ArrowRight className={`w-6 h-6 text-${option.color}-400 transform group-hover:translate-x-1 transition-transform`} />
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">Recursos principais:</h4>
              <div className="grid grid-cols-1 gap-2">
                {option.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 text-${option.color}-400`} />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                className={`w-full ${option.bgColor} hover:${option.bgColor}/80 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                <span>Acessar {option.title.split(' - ')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
                  ))}
        </div>

        {/* Atividades Recentes */}
        <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Vendas Recentes</h2>
          <BarChart3 className="w-6 h-6 text-[#FF2C68]" />
        </div>

        <div className="space-y-4">
          {atividades.length > 0 ? (
            atividades.map((atividade) => (
              <div
                key={atividade.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Venda #{atividade.id.substring(0, 8)}
                    </p>
                    <p className="text-white/60 text-sm">
                      Cliente: {atividade.cliente || 'Não informado'}
                    </p>
                    <p className="text-white/40 text-xs">
                      {atividade.itens?.length || 0} itens • {atividade.formaPagamento || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">
                    {formatCurrency(atividade.total)}
                  </p>
                  <p className="text-white/60 text-sm">
                    {formatDate(atividade.createdAt)}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    atividade.status === 'concluida' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {atividade.status === 'concluida' ? 'Concluída' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">Nenhuma venda encontrada</p>
              <p className="text-white/40 text-sm mt-2">
                As vendas realizadas no PDV aparecerão aqui automaticamente
              </p>
              <button 
                onClick={() => navigate('/vendas/pdv')}
                className="mt-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Realizar Primeira Venda
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/relatorios')}
            className="text-[#FF2C68] hover:text-[#FF2C68]/80 font-medium transition-colors"
          >
            Ver relatório completo de vendas →
          </button>
        </div>
      </div>

      {/* Histórico Completo de Vendas */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Histórico de Vendas</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDashboardData}
              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <HistoricoVendas />
      </div>
    </div>
  );
}

// Funções utilitárias globais
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

const formatDate = (date) => {
  if (!date) return '';
  
  // Se for Timestamp do Firestore
  if (date.toDate) {
    return date.toDate().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Se for Date normal
  if (date instanceof Date) {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return '';
};



// Componente para mostrar histórico completo de vendas
function HistoricoVendas() {
  const [vendas, setVendas] = useState([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [periodo, setPeriodo] = useState('7'); // Últimos 7 dias

  useEffect(() => {
    loadVendasHistorico();
  }, [periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Função para gerar PDF da venda
  const downloadVendaPDF = async (venda) => {
    try {
      toast.loading('Gerando PDF da venda...');
      
      // Importar dinamicamente as bibliotecas
      const jsPDF = (await import('jspdf')).default;
      
      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configurações
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const lineHeight = 7;
      let currentY = margin;

      // Função para adicionar nova página se necessário
      const checkPageBreak = (neededHeight) => {
        if (currentY + neededHeight > 280) {
          pdf.addPage();
          currentY = margin;
        }
      };

      // Resetar cor do texto para preto
      pdf.setTextColor(0, 0, 0);

      // Cabeçalho com Logo
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text('COMPROVANTE DE VENDA', margin, currentY);
      
      // Logo IARA HUB (moderno com gradiente simulado)
      pdf.setFillColor(255, 44, 104); // Cor principal #FF2C68
      pdf.rect(pageWidth - margin - 25, currentY - 10, 20, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('IARA', pageWidth - margin - 20, currentY - 2);
      
      pdf.setTextColor(255, 44, 104); // Cor #FF2C68
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text('IARA HUB', pageWidth - margin - 40, currentY + 15);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text('Assistência Técnica Especializada', pageWidth - margin - 60, currentY + 22);

      currentY += 35;

      // Resetar cor para preto
      pdf.setTextColor(0, 0, 0);

      // ID da Venda
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Venda #${venda.id.substring(0, 8)}`, margin, currentY);
      currentY += 10;

      // Data e Status
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Data: ${formatDate(venda.createdAt)}`, margin, currentY);
      pdf.text(`Status: ${venda.status === 'concluida' ? 'Concluída' : 'Pendente'}`, pageWidth - margin - 50, currentY);
      currentY += 15;

      // Dados do Cliente
      checkPageBreak(25);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text('DADOS DO CLIENTE', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Cliente: ${venda.cliente || 'Cliente não informado'}`, margin, currentY);
      currentY += lineHeight;
      if (venda.vendedor) {
        pdf.text(`Vendedor: ${venda.vendedor}`, margin, currentY);
        currentY += lineHeight;
      }
      currentY += 10;

      // Forma de Pagamento
      checkPageBreak(20);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text('FORMA DE PAGAMENTO', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Pagamento: ${venda.formaPagamento?.replace('_', ' ').toUpperCase() || 'Não informado'}`, margin, currentY);
      currentY += 15;

      // Itens da Venda
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text('ITENS DA VENDA', margin, currentY);
      currentY += 8;
      
      // Cabeçalho da tabela
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text('Item', margin, currentY);
      pdf.text('Qtd', margin + 100, currentY);
      pdf.text('Valor Unit.', margin + 125, currentY);
      pdf.text('Total', margin + 155, currentY);
      currentY += 5;
      
      // Linha separadora
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 5;
      
      pdf.setFont("helvetica", "normal");
      
      if (venda.itens && venda.itens.length > 0) {
        venda.itens.forEach((item) => {
          checkPageBreak(10);
          
          const nomeItem = pdf.splitTextToSize(item.nome || 'Item', 95);
          pdf.text(nomeItem, margin, currentY);
          pdf.text(item.quantidade?.toString() || '1', margin + 100, currentY);
          pdf.text(`R$ ${(item.valorUnitario || 0).toFixed(2)}`, margin + 125, currentY);
          pdf.text(`R$ ${(item.valorTotal || 0).toFixed(2)}`, margin + 155, currentY);
          
          currentY += lineHeight * Math.max(1, nomeItem.length);
        });
      } else {
        pdf.text('Nenhum item registrado', margin, currentY);
        currentY += lineHeight;
      }
      
      currentY += 10;

      // Totais
      checkPageBreak(30);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      if (venda.subtotal && venda.subtotal !== venda.total) {
        pdf.text(`Subtotal: R$ ${(venda.subtotal || 0).toFixed(2)}`, margin + 100, currentY);
        currentY += lineHeight;
      }
      
      if (venda.desconto && venda.desconto > 0) {
        pdf.text(`Desconto: R$ ${(venda.desconto || 0).toFixed(2)}`, margin + 100, currentY);
        currentY += lineHeight;
      }
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`TOTAL: R$ ${(venda.total || 0).toFixed(2)}`, margin + 100, currentY);
      currentY += 20;

      // Observações
      if (venda.observacoes) {
        checkPageBreak(25);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text('OBSERVAÇÕES', margin, currentY);
        currentY += 8;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const obsText = pdf.splitTextToSize(venda.observacoes, pageWidth - 2 * margin);
        pdf.text(obsText, margin, currentY);
        currentY += obsText.length * lineHeight + 10;
      }

      // Rodapé
      currentY = Math.max(currentY, 250);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text('IARA HUB - Assistência Técnica Especializada', margin, currentY);
      pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, currentY + 5);

      // Baixar o PDF
      const nomeArquivo = `Venda_${venda.id.substring(0, 8)}_${(venda.cliente || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(nomeArquivo);
      
      toast.dismiss();
      toast.success('PDF da venda gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF da venda:', error);
      toast.dismiss();
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

      const loadVendasHistorico = async () => {
      try {
        setLoadingVendas(true);
        
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
        
        let vendasData = [];
        
        // Primeira tentativa: consulta com orderBy
        try {
          const vendasQuery = query(
            collection(db, 'vendas'),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          
          const vendasSnap = await getDocs(vendasQuery);
          vendasData = vendasSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
        } catch (orderByError) {
          console.warn('Erro na consulta com orderBy, tentando consulta simples:', orderByError);
          
          // Segunda tentativa: consulta simples sem orderBy
          try {
            const vendasSnap = await getDocs(query(collection(db, 'vendas'), limit(50)));
            vendasData = vendasSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Ordenar localmente
            vendasData.sort((a, b) => {
              try {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
              } catch (_error) { // eslint-disable-line no-unused-vars
                return 0;
              }
            });
            
          } catch (simpleError) {
            console.warn('Erro na consulta simples:', simpleError);
            vendasData = [];
          }
        }
        
        // Filtrar por período localmente
        if (vendasData.length > 0) {
          vendasData = vendasData.filter(venda => {
            if (!venda.createdAt) return true; // Incluir vendas sem data
            try {
              const vendaDate = venda.createdAt?.toDate ? venda.createdAt.toDate() : new Date(venda.createdAt);
              return vendaDate >= dataLimite;
            } catch (_error) { // eslint-disable-line no-unused-vars
              return true; // Incluir em caso de erro de conversão
            }
          });
        }
        
        console.log('📊 Vendas carregadas:', vendasData.length);
        setVendas(vendasData);
        
      } catch (error) {
        console.error('Erro geral ao carregar histórico de vendas:', error);
        setVendas([]);
        // Não mostrar toast de erro para não incomodar o usuário
      } finally {
        setLoadingVendas(false);
      }
    };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <label className="text-white font-medium">Período:</label>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="bg-[#0D0C0C]/50 border border-blue-500/30 text-white rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Último mês</option>
          <option value="90">Últimos 3 meses</option>
        </select>
      </div>

      {/* Lista de Vendas */}
      {loadingVendas ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : vendas.length > 0 ? (
        <div className="space-y-3">
          {vendas.map((venda) => (
            <div
              key={venda.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 font-mono text-sm">
                      #{venda.id.substring(0, 8)}
                    </span>
                    <span className="text-white font-medium">
                      {venda.cliente || 'Cliente não informado'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      venda.status === 'concluida' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {venda.status}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-white/60">
                    <span>{venda.itens?.length || 0} itens</span>
                    {venda.formaPagamento && (
                      <span className="ml-3">• {venda.formaPagamento.replace('_', ' ')}</span>
                    )}
                    {venda.vendedor && (
                      <span className="ml-3">• Vendedor: {venda.vendedor}</span>
                    )}
                  </div>
                  
                  {/* Itens da venda */}
                  {venda.itens && venda.itens.length > 0 && (
                    <div className="mt-2 text-xs text-white/50">
                      {venda.itens.slice(0, 2).map((item, i) => (
                        <span key={i}>
                          {item.nome} (x{item.quantidade}){i < venda.itens.length - 1 && i < 1 ? ', ' : ''}
                        </span>
                      ))}
                      {venda.itens.length > 2 && (
                        <span> e mais {venda.itens.length - 2} itens</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">
                      {formatCurrency(venda.total)}
                    </div>
                    <div className="text-white/60 text-sm">
                      {formatDate(venda.createdAt)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => downloadVendaPDF(venda)}
                    className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors"
                    title="Baixar PDF da venda"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">Nenhuma venda encontrada no período</p>
          <p className="text-white/40 text-sm mt-2">
            Realize vendas no PDV para ver o histórico aqui
          </p>
        </div>
      )}
    </div>
  );
} 