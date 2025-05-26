import React from 'react';
import { BarChart3, TrendingUp, PieChart, Users, DollarSign } from 'lucide-react';

export default function RelatoriosAvancados() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Relatórios Avançados</h1>
        <p className="text-white/60">Analytics e insights detalhados do seu negócio</p>
      </div>

      {/* Em Desenvolvimento */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-[#FF2C68]/10 to-[#FF2C68]/5 rounded-2xl p-8 border border-[#FF2C68]/20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <BarChart3 className="w-12 h-12 text-[#FF2C68]" />
              <TrendingUp className="w-12 h-12 text-blue-400" />
              <PieChart className="w-12 h-12 text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              🚧 Módulo em Desenvolvimento
            </h2>
            
            <p className="text-white/70 text-lg mb-6">
              Os relatórios avançados estão sendo desenvolvidos e estarão disponíveis em breve!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Analytics de Clientes</h3>
                <p className="text-white/60 text-sm">Comportamento e segmentação</p>
              </div>
              
              <div className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10">
                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Análise Financeira</h3>
                <p className="text-white/60 text-sm">Fluxo de caixa e projeções</p>
              </div>
              
              <div className="bg-[#0D0C0C]/30 rounded-xl p-4 border border-white/10">
                <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Tendências</h3>
                <p className="text-white/60 text-sm">Insights preditivos</p>
              </div>
            </div>
            
            <div className="bg-[#FF2C68]/10 rounded-lg p-4 border border-[#FF2C68]/30">
              <p className="text-[#FF2C68] font-semibold">
                💡 Funcionalidades planejadas: dashboards interativos, relatórios personalizados, 
                exportação em múltiplos formatos e muito mais!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 