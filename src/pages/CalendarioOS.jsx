import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Wrench,
  Eye,
  Edit,
  Plus,
  Filter
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';

export default function CalendarioOS() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [draggedOS, setDraggedOS] = useState(null);

  const statusOptions = [
    { value: 'todas', label: 'Todas as OS', color: 'bg-gray-500' },
    { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-500' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
    { value: 'aguardando_pecas', label: 'Aguardando Peças', color: 'bg-orange-500' },
    { value: 'finalizado', label: 'Finalizado', color: 'bg-green-500' },
    { value: 'entregue', label: 'Entregue', color: 'bg-purple-500' }
  ];

  useEffect(() => {
    loadOrdens();
  }, []);

  const loadOrdens = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'ordens_servico'));
      const ordensData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrdens(ordensData);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      toast.error('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  const moveOSToDate = async (osId, newDate) => {
    try {
      await updateDoc(doc(db, 'ordens_servico', osId), {
        'servico.previsaoEntrega': newDate.toISOString().split('T')[0],
        updatedAt: new Date()
      });
      
      setOrdens(prev => prev.map(os => 
        os.id === osId 
          ? { ...os, servico: { ...os.servico, previsaoEntrega: newDate.toISOString().split('T')[0] } }
          : os
      ));
      
      toast.success('Previsão de entrega atualizada!');
    } catch (error) {
      console.error('Erro ao mover OS:', error);
      toast.error('Erro ao atualizar previsão');
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Começar no domingo

    const days = [];
    for (let i = 0; i < 42; i++) { // 6 semanas
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getOSForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return ordens.filter(os => {
      if (selectedFilter !== 'todas' && os.servico?.status !== selectedFilter) {
        return false;
      }
      return os.servico?.previsaoEntrega === dateString;
    });
  };

  const handleDragStart = (e, os) => {
    setDraggedOS(os);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, date) => {
    e.preventDefault();
    if (draggedOS) {
      moveOSToDate(draggedOS.id, date);
      setDraggedOS(null);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vendas/os')}
            className="p-2 bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-xl text-white hover:bg-[#0D0C0C]/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Calendário de OS</h1>
            <p className="text-white/60">Visualizar e organizar ordens de serviço</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-[#0D0C0C]/50 border border-[#FF2C68]/30 rounded-lg text-white px-3 py-2 focus:border-[#FF2C68] focus:outline-none"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value} className="bg-[#0D0C0C]">
                {status.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => navigate('/vendas/os')}
            className="bg-[#FF2C68] hover:bg-[#FF2C68]/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* Controles do Calendário */}
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-lg text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-white">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 bg-[#FF2C68]/20 border border-[#FF2C68]/30 rounded-lg text-[#FF2C68] hover:bg-[#FF2C68]/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Grade do Calendário */}
        <div className="grid grid-cols-7 gap-2">
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-white/60 font-medium py-2">
              {day}
            </div>
          ))}
          
          {/* Dias do mês */}
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === today.toDateString();
            const osForDay = getOSForDate(day);
            
            return (
              <motion.div
                key={index}
                className={`min-h-[120px] p-2 border rounded-lg transition-all ${
                  isCurrentMonth 
                    ? 'bg-[#0D0C0C]/30 border-white/10' 
                    : 'bg-[#0D0C0C]/10 border-white/5'
                } ${
                  isToday ? 'ring-2 ring-[#FF2C68]/50' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentMonth ? 'text-white' : 'text-white/40'
                } ${
                  isToday ? 'text-[#FF2C68]' : ''
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {osForDay.map((os) => (
                    <motion.div
                      key={os.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, os)}
                      className={`p-2 rounded-md text-xs cursor-move transition-all ${
                        statusOptions.find(s => s.value === os.servico?.status)?.color || 'bg-gray-500'
                      } text-white hover:scale-105`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          #{os.numero || os.servico?.numero}
                        </span>
                        <Eye className="w-3 h-3" />
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{os.cliente?.nome}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Wrench className="w-3 h-3" />
                          <span className="truncate">{os.equipamento?.marca}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
        <h3 className="text-blue-400 font-semibold mb-2">💡 Como usar:</h3>
        <ul className="text-white/70 space-y-1 text-sm">
          <li>• Arraste e solte as OS para reorganizar as datas de entrega</li>
          <li>• Use os filtros para visualizar apenas OS com status específico</li>
          <li>• Clique em uma OS para ver mais detalhes</li>
          <li>• Navegue pelos meses usando as setas</li>
        </ul>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Carregando ordens de serviço...</p>
        </div>
      )}
    </div>
  );
} 