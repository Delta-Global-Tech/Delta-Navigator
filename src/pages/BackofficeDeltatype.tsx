import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  CreditCard,
  Clock,
  Settings,
  Shield,
  TrendingUp,
  Zap,
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import { StaggeredContainer } from "@/components/motion/StaggeredContainer"
export default function BackofficeDelta() {
  const [activeTab, setActiveTab] = useState('alterar-limite');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #06162B 0%, #0a1f3d 50%, #05101d 100%)'
      }}
    >
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #C48A3F 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #C48A3F 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite 2s' }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-down {
          animation: slideInDown 0.6s ease-out;
        }
        .animate-slide-in-up {
          animation: slideInUp 0.6s ease-out;
        }
      `}</style>

      <div className="w-full px-4 py-12 space-y-12 relative z-10">

        {/* Header com Gradient Premium */}
        <div 
          className={`flex items-center justify-between pt-8 pb-12 px-8 rounded-2xl border-2 backdrop-blur-md transition-all duration-700 ${
            isLoaded ? 'animate-slide-in-down' : ''
          }`}
          style={{ 
            borderColor: '#C48A3F',
            background: 'linear-gradient(135deg, rgba(196, 138, 63, 0.15) 0%, rgba(196, 138, 63, 0.05) 100%)',
            boxShadow: '0 8px 32px rgba(196, 138, 63, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div 
                className="p-4 rounded-xl shadow-2xl"
                style={{ 
                  background: 'linear-gradient(135deg, #C48A3F 0%, #d49a50 100%)',
                  boxShadow: '0 8px 24px rgba(196, 138, 63, 0.4)'
                }}
              >
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">
                  Backoffice <span style={{ color: '#C48A3F' }}>Delta</span>
                </h1>
                <p className="text-base md:text-lg text-gray-300 mt-1 flex items-center gap-2">
                  <Zap className="h-4 w-4" style={{ color: '#C48A3F' }} />
                  Gestão Avançada de Limites PIX
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0 ml-6">
            <Badge 
              className="px-5 py-3 h-fit text-base flex-shrink-0 border-2 font-semibold"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: '#C48A3F',
                color: '#C48A3F'
              }}
            >
              <Lock className="h-4 w-4 mr-2" />
              Sistema Seguro
            </Badge>
            <Badge 
              className="px-5 py-3 h-fit text-base flex-shrink-0 border-2 font-semibold"
              style={{ 
                backgroundColor: '#10b981',
                borderColor: '#059669',
                color: '#FFF'
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Online
            </Badge>
          </div>
        </div>

        {/* Quick Stats Premium */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 px-2 transition-all duration-700 ${
          isLoaded ? 'animate-slide-in-up' : 'opacity-0'
        }`} style={{ animationDelay: '0.2s' }}>
          {/* Stat 1: Funcionalidades */}
          <div 
            className="group relative px-6 py-8 rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              borderColor: '#ff8c00',
              background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(255, 140, 0, 0.02) 100%)',
              boxShadow: '0 4px 15px rgba(255, 140, 0, 0.1)'
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Funcionalidades</p>
                <p className="text-4xl font-black text-white mt-3" style={{ color: '#ff8c00' }}>2</p>
                <p className="text-xs text-gray-500 mt-2">Ativas e operacionais</p>
              </div>
              <div 
                className="p-4 rounded-xl group-hover:scale-110 transition-transform duration-300"
                style={{ background: 'rgba(255, 140, 0, 0.2)' }}
              >
                <TrendingUp className="h-6 w-6" style={{ color: '#ff8c00' }} />
              </div>
            </div>
          </div>

          {/* Stat 2: Status */}
          <div 
            className="group relative px-6 py-8 rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              borderColor: '#10b981',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Status</p>
                <p className="text-4xl font-black text-white mt-3" style={{ color: '#10b981' }}>Ativo</p>
                <p className="text-xs text-gray-500 mt-2">Sistema funcionando normalmente</p>
              </div>
              <div 
                className="p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 animate-pulse"
                style={{ background: 'rgba(16, 185, 129, 0.2)' }}
              >
                <Zap className="h-6 w-6" style={{ color: '#10b981' }} />
              </div>
            </div>
          </div>

          {/* Stat 3: Versão */}
          <div 
            className="group relative px-6 py-8 rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              borderColor: '#3b82f6',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Versão</p>
                <p className="text-4xl font-black text-white mt-3" style={{ color: '#3b82f6' }}>1.0.0</p>
                <p className="text-xs text-gray-500 mt-2">Produção</p>
              </div>
              <div 
                className="p-4 rounded-xl group-hover:scale-110 transition-transform duration-300"
                style={{ background: 'rgba(59, 130, 246, 0.2)' }}
              >
                <Sparkles className="h-6 w-6" style={{ color: '#3b82f6' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Premium com Funcionalidades */}
        <div className={`px-2 transition-all duration-700 ${
          isLoaded ? 'animate-slide-in-up' : 'opacity-0'
        }`} style={{ animationDelay: '0.4s' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList 
              className="grid w-full grid-cols-2 p-1 rounded-xl border-2"
              style={{ 
                background: 'rgba(15, 23, 42, 0.8)',
                borderColor: '#C48A3F',
                backdropFilter: 'blur(10px)'
              }}
            >
              <TabsTrigger 
                value="alterar-limite"
                className="rounded-lg data-[state=active]:shadow-lg data-[state=active]:font-bold transition-all duration-300"
                style={{
                  color: activeTab === 'alterar-limite' ? '#C48A3F' : '#9ca3af'
                }}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Alterar Limite</span>
                <span className="sm:hidden">Limite</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gerenciar-solicitacoes"
                className="rounded-lg data-[state=active]:shadow-lg data-[state=active]:font-bold transition-all duration-300"
                style={{
                  color: activeTab === 'gerenciar-solicitacoes' ? '#3b82f6' : '#9ca3af'
                }}
              >
                <Clock className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Solicitações</span>
                <span className="sm:hidden">Requets</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Alterar Limite PIX */}
            <TabsContent value="alterar-limite" className="space-y-6 mt-8 animate-fade-in">
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-orange-400 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Funcionalidade PIX
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">
                    Funcionalidade PIX removida. Será reimplementada em breve.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Gerenciar Solicitações */}
            <TabsContent value="gerenciar-solicitacoes" className="space-y-6 mt-8 animate-fade-in">
              <Card className="border-orange-500/20 bg-gradient-to-br from-gray-900/50 to-orange-900/10">
                <CardHeader>
                  <CardTitle className="text-orange-400">🚧 Em Desenvolvimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    Funcionalidade de gerenciar solicitações PIX será implementada em breve.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Info Cards Premium */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 px-2 transition-all duration-700 ${
          isLoaded ? 'animate-slide-in-up' : 'opacity-0'
        }`} style={{ animationDelay: '0.6s' }}>
          {/* Card 1: Sobre Limites */}
          <div 
            className="p-8 rounded-2xl border-2 backdrop-blur-md hover:scale-105 transition-all duration-300 group overflow-hidden relative"
            style={{
              borderColor: '#C48A3F',
              background: 'linear-gradient(135deg, rgba(196, 138, 63, 0.1) 0%, rgba(196, 138, 63, 0.02) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(196, 138, 63, 0.2)' }}
                >
                  <CreditCard className="h-6 w-6" style={{ color: '#C48A3F' }} />
                </div>
                <h3 className="text-xl font-bold text-white">Sobre Limites PIX</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Configure limites de transferência em três categorias distintas:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#C48A3F' }} />
                  <span className="text-gray-300"><strong className="text-white">PIX Interno:</strong> Entre contas internas</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#C48A3F' }} />
                  <span className="text-gray-300"><strong className="text-white">PIX Externo:</strong> Para outras instituições</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#C48A3F' }} />
                  <span className="text-gray-300"><strong className="text-white">Saque PIX:</strong> Saques diretos</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-4 italic">
                ⏱️ Horários diurnos e noturnos com limites separados
              </p>
            </div>
          </div>

          {/* Card 2: Gerenciar Solicitações */}
          <div 
            className="p-8 rounded-2xl border-2 backdrop-blur-md hover:scale-105 transition-all duration-300 group overflow-hidden relative"
            style={{
              borderColor: '#3b82f6',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(59, 130, 246, 0.2)' }}
                >
                  <Clock className="h-6 w-6" style={{ color: '#3b82f6' }} />
                </div>
                <h3 className="text-xl font-bold text-white">Gerenciar Solicitações</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Análise e aprovação de solicitações de aumento:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0 text-green-500" />
                  <span className="text-gray-300">Visualizar solicitações <strong className="text-white">pendentes</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0 text-green-500" />
                  <span className="text-gray-300"><strong className="text-white">Aprovar</strong> ou <strong className="text-white">recusar</strong> requisições</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0 text-green-500" />
                  <span className="text-gray-300">Adicionar <strong className="text-white">justificativas</strong></span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-4 italic">
                🔐 Todas as ações são registradas para auditoria
              </p>
            </div>
          </div>
        </div>

        {/* Help Section Premium */}
        <div 
          className={`rounded-2xl border-2 backdrop-blur-md p-8 mx-2 mb-12 transition-all duration-700 ${
            isLoaded ? 'animate-slide-in-up' : 'opacity-0'
          }`}
          style={{ 
            background: 'linear-gradient(135deg, rgba(196, 138, 63, 0.15) 0%, rgba(196, 138, 63, 0.05) 100%)',
            borderColor: '#C48A3F',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(196, 138, 63, 0.15)',
            animationDelay: '0.8s'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6" style={{ color: '#C48A3F' }} />
            <h3 className="text-2xl font-black text-white">Dicas de Uso</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <li className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(196, 138, 63, 0.1)' }}>
              <Badge style={{ backgroundColor: '#C48A3F', color: '#FFF' }} className="mt-0.5 flex-shrink-0">1</Badge>
              <span className="text-gray-300"><strong className="text-white">Alterar Limite:</strong> Selecione a conta e configure os limites desejados</span>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Badge style={{ backgroundColor: '#3b82f6', color: '#FFF' }} className="mt-0.5 flex-shrink-0">2</Badge>
              <span className="text-gray-300"><strong className="text-white">Revisar Solicitações:</strong> Processe todas as requisições pendentes</span>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Badge style={{ backgroundColor: '#10b981', color: '#FFF' }} className="mt-0.5 flex-shrink-0">3</Badge>
              <span className="text-gray-300"><strong className="text-white">Justifique Recusas:</strong> Sempre explique ao rejeitar uma solicitação</span>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(196, 138, 63, 0.1)' }}>
              <Badge style={{ backgroundColor: '#C48A3F', color: '#FFF' }} className="mt-0.5 flex-shrink-0">4</Badge>
              <span className="text-gray-300"><strong className="text-white">Limites Horários:</strong> Configure períodos diurnos e noturnos separadamente</span>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Badge style={{ backgroundColor: '#3b82f6', color: '#FFF' }} className="mt-0.5 flex-shrink-0">5</Badge>
              <span className="text-gray-300"><strong className="text-white">Salva Automaticamente:</strong> Todas as mudanças entram em vigor imediatamente</span>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Badge style={{ backgroundColor: '#10b981', color: '#FFF' }} className="mt-0.5 flex-shrink-0">6</Badge>
              <span className="text-gray-300"><strong className="text-white">Categorias:</strong> PIX Interno, Externo e Saque PIX independentes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
