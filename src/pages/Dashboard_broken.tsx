import React, { useState, useEffect, useRef } from 'react';
import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target, DollarSign, LayoutDashboard, Zap, Activity, Cpu, Rocket, Star } from "lucide-react"
import { useFunnelData, useVolumeData, useExecutiveKPIs, useABCRevenue, useDocumentPerformance } from "@/hooks/useSupabaseData"
import { useAutoRefresh } from "@/hooks/useAutoRefresh"
import { useSync } from "@/providers/sync-provider"

// Adicionando estilos futurísticos dinamicamente
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes matrix-rain {
      0% { transform: translateY(-100vh); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
    
    @keyframes hologram-flicker {
      0%, 100% { opacity: 1; filter: hue-rotate(0deg); }
      25% { opacity: 0.8; filter: hue-rotate(90deg); }
      50% { opacity: 1; filter: hue-rotate(180deg); }
      75% { opacity: 0.9; filter: hue-rotate(270deg); }
    }
    
    @keyframes data-stream {
      0% { transform: translateX(-100%); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes cyber-pulse {
      0%, 100% { 
        box-shadow: 0 0 20px rgba(192, 134, 58, 0.3), 
                    0 0 40px rgba(192, 134, 58, 0.1),
                    inset 0 0 20px rgba(192, 134, 58, 0.05);
      }
      50% { 
        box-shadow: 0 0 30px rgba(192, 134, 58, 0.6), 
                    0 0 60px rgba(192, 134, 58, 0.2),
                    inset 0 0 30px rgba(192, 134, 58, 0.1);
      }
    }
    
    @keyframes neural-network {
      0% { 
        background-position: 0% 0%;
        filter: hue-rotate(0deg);
      }
      25% { 
        background-position: 100% 0%;
        filter: hue-rotate(90deg);
      }
      50% { 
        background-position: 100% 100%;
        filter: hue-rotate(180deg);
      }
      75% { 
        background-position: 0% 100%;
        filter: hue-rotate(270deg);
      }
      100% { 
        background-position: 0% 0%;
        filter: hue-rotate(360deg);
      }
    }
    
    .cyber-grid {
      background-image: 
        linear-gradient(rgba(192, 134, 58, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(192, 134, 58, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
      animation: neural-network 20s ease-in-out infinite;
    }
    
    .hologram-card {
      animation: cyber-pulse 4s ease-in-out infinite;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(192, 134, 58, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .hologram-card::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, transparent, rgba(192, 134, 58, 0.4), transparent);
      z-index: -1;
      border-radius: inherit;
      animation: data-stream 3s linear infinite;
    }
    
    .matrix-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -2;
      opacity: 0.03;
    }
    
    .floating-particles {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }
    
    .particle {
      position: absolute;
      width: 2px;
      height: 2px;
      background: linear-gradient(45deg, #C0863A, rgba(192, 134, 58, 0.8));
      border-radius: 50%;
      animation: matrix-rain 8s linear infinite;
    }
    
    .neural-link {
      background: linear-gradient(135deg, 
        rgba(3, 18, 38, 0.95) 0%,
        rgba(10, 27, 51, 0.95) 25%,
        rgba(20, 43, 74, 0.95) 50%,
        rgba(10, 27, 51, 0.95) 75%,
        rgba(3, 18, 38, 0.95) 100%);
      background-size: 400% 400%;
      animation: neural-network 15s ease-in-out infinite;
    }
  `;
  document.head.appendChild(styleSheet);
}

// Formatação
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

// Componente de Loading Futurístico
const CyberLoading = () => (
  <div 
    className="flex flex-col items-center justify-center h-64 relative"
    style={{
      background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.9) 0%, rgba(20, 43, 74, 0.9) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(192, 134, 58, 0.3)'
    }}
  >
    {/* Partículas flutuantes */}
    <div className="floating-particles">
      {Array.from({length: 20}).map((_, i) => (
        <div 
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${4 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
    
    <div className="relative">
      <Cpu 
        className="h-16 w-16 animate-spin mx-auto mb-4" 
        style={{ 
          color: '#C0863A',
          filter: 'drop-shadow(0 0 20px rgba(192, 134, 58, 0.8))'
        }}
      />
      <div 
        className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full animate-spin"
        style={{ animation: 'spin 1s linear infinite reverse' }}
      />
    </div>
    
    <h3 
      className="text-xl font-bold mb-2"
      style={{ 
        color: '#C0863A',
        textShadow: '0 0 20px rgba(192, 134, 58, 0.8)'
      }}
    >
      PROCESSANDO DADOS
    </h3>
    <p 
      className="text-sm"
      style={{ 
        color: 'rgba(255, 255, 255, 0.8)',
        textShadow: '0 0 10px rgba(192, 134, 58, 0.6)'
      }}
    >
      Neural Network carregando...
    </p>
  </div>
);

// Componente KPI Futurístico
const CyberKPI = ({ title, value, subtitle, icon: Icon, trend = null, color = "#C0863A" }) => {
  return (
    <div 
      className="hologram-card relative p-6 rounded-2xl overflow-hidden transition-all duration-700 hover:scale-105"
      style={{ 
        background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.9) 0%, rgba(20, 43, 74, 0.9) 100%)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Efeito holográfico */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(192, 134, 58, 0.2) 50%, transparent 70%)',
          animation: 'hologram-flicker 4s ease-in-out infinite'
        }}
      />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p 
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 0 10px rgba(192, 134, 58, 0.5)'
            }}
          >
            {title}
          </p>
          <p 
            className="text-3xl font-bold mb-1"
            style={{ 
              color: color,
              textShadow: '0 0 15px rgba(192, 134, 58, 0.8)',
              background: `linear-gradient(45deg, ${color}, rgba(192, 134, 58, 0.8))`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p 
              className="text-xs"
              style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                textShadow: '0 0 5px rgba(192, 134, 58, 0.4)'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="relative">
          <Icon 
            className="h-12 w-12 transition-all duration-300 hover:scale-125" 
            style={{ 
              color: color,
              filter: 'drop-shadow(0 0 15px rgba(192, 134, 58, 0.6))'
            }} 
          />
          <div 
            className="absolute -inset-2 rounded-full opacity-30 animate-ping"
            style={{ 
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`
            }}
          />
        </div>
      </div>
      
      {trend && (
        <div className="absolute bottom-2 right-2">
          <Badge 
            className="text-xs"
            style={{
              background: trend > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: trend > 0 ? '#22c55e' : '#ef4444',
              border: '1px solid ' + (trend > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)')
            }}
          >
            {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(trend)}%
          </Badge>
        </div>
      )}
    </div>
  );
};

import { StaggeredContainer } from "@/components/motion/StaggeredContainer"
export default function Dashboard() {
  const { updateSync, setRefreshing } = useSync()
  const [loading, setLoading] = useState(true)
  
  // Ref para armazenar dados anteriores para comparação
  const previousDataRef = useRef<any>(null)

  // Carregar dados do Supabase
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis, isFetching: isFetchingKpis } = useExecutiveKPIs()
  const { data: volumeData, isLoading: volumeLoading, refetch: refetchVolume, isFetching: isFetchingVolume } = useVolumeData()
  const { data: funnelData = [], isLoading: funnelLoading, refetch: refetchFunnel, isFetching: isFetchingFunnel } = useFunnelData()
  const { data: abcData = [], isLoading: abcLoading, refetch: refetchAbc, isFetching: isFetchingAbc } = useABCRevenue()
  const { data: docData = [], isLoading: docLoading, refetch: refetchDoc, isFetching: isFetchingDoc } = useDocumentPerformance()

  // Flag para saber se alguma query está fazendo fetch
  const isAnyFetching = isFetchingKpis || isFetchingVolume || isFetchingFunnel || isFetchingAbc || isFetchingDoc
  
  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Função para atualizar todos os dados
  const refreshAllData = async () => {
    setRefreshing(true)
    try {
      const results = await Promise.all([
        refetchKpis(),
        refetchVolume(),
        refetchFunnel(),
        refetchAbc(),
        refetchDoc()
      ])
      
      // Combinar todos os dados para comparação
      const newData = {
        kpis: results[0].data,
        volume: results[1].data,
        funnel: results[2].data,
        abc: results[3].data,
        doc: results[4].data
      }
      
      // Comparar com dados anteriores
      const hasNewData = !previousDataRef.current || 
        JSON.stringify(previousDataRef.current) !== JSON.stringify(newData)
      
      if (hasNewData) {
        previousDataRef.current = newData
        const now = new Date()
        updateSync(now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }))
      }
      
      return { hasNewData }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
      return { hasNewData: false }
    } finally {
      setRefreshing(false)
    }
  }

  // Auto-refresh configurado para 30 segundos
  useAutoRefresh({
    onRefresh: refreshAllData,
    interval: 30000, // 30 segundos
    enabled: true
  })

  // Preparar dados para gráficos
  const chartVolumeData = volumeData?.reduce((acc, item) => {
    const existing = acc.find(a => a.ym === item.ym)
    if (existing) {
      existing.total += item.total
      existing.pago += item.pago
    } else {
      acc.push({ ym: item.ym, total: item.total, pago: item.pago })
    }
    return acc
  }, [] as any[]) || []

  const conversionData = funnelData?.map(item => ({
    ym: item.ym,
    conversion: item.conv_total_paga
  })) || []

  // Loading Screen Futurístico
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center cyber-grid"
        style={{
          background: 'linear-gradient(135deg, #031226 0%, #0a1b33 30%, #1a4a4a 60%, #031226 100%)'
        }}
      >
        <div className="matrix-bg cyber-grid" />
        <CyberLoading />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen cyber-grid"
      style={{
        background: 'linear-gradient(135deg, #031226 0%, #0a1b33 30%, #1a4a4a 60%, #031226 100%)',
        paddingTop: '2rem'
      }}
    >
      {/* Matrix Background */}
      <div className="matrix-bg cyber-grid" />
      
      <div className="relative z-10 p-6 space-y-8">
        {/* Header Futurístico Supreme */}
        <div 
          className="relative p-8 rounded-3xl overflow-hidden hologram-card"
          style={{ 
            background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.95) 0%, rgba(20, 43, 74, 0.95) 50%, rgba(3, 18, 38, 0.95) 100%)',
            border: '2px solid #C0863A',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Efeitos de luz de fundo */}
          <div 
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #C0863A 0%, rgba(192, 134, 58, 0.8) 50%, transparent 100%)',
              animation: 'neural-network 10s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #C0863A 0%, rgba(192, 134, 58, 0.8) 50%, transparent 100%)',
              animation: 'neural-network 15s ease-in-out infinite reverse'
            }}
          />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(45deg, #C0863A, rgba(192, 134, 58, 0.8))',
                  boxShadow: '0 0 40px rgba(192, 134, 58, 0.8)'
                }}
              >
                <Rocket className="h-10 w-10 text-black" />
                <div 
                  className="absolute -inset-2 rounded-full opacity-50 animate-ping"
                  style={{ 
                    background: 'radial-gradient(circle, #C0863A 0%, transparent 70%)'
                  }}
                />
              </div>
              
              <div>
                <h1 
                  className="text-5xl font-black tracking-wider mb-2"
                  style={{ 
                    color: 'white',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                    background: 'linear-gradient(45deg, #FFFFFF, #C0863A, #C0863A)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  COMMAND CENTER
                </h1>
                <p 
                  className="text-xl"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    textShadow: '0 0 10px rgba(192, 134, 58, 0.6)'
                  }}
                >
                  🚀 Dashboard Neural de Alta Performance
                  {isAnyFetching && (
                    <span className="ml-3">
                      <Activity className="inline h-5 w-5 animate-pulse" style={{ color: '#C0863A' }} />
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                className="px-4 py-2 text-sm font-bold"
                style={{
                  background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                SISTEMA ONLINE
              </Badge>
              
              <Badge 
                className="px-4 py-2 text-sm font-bold"
                style={{
                  background: 'linear-gradient(45deg, rgba(192, 134, 58, 0.2), rgba(192, 134, 58, 0.1))',
                  color: '#C0863A',
                  border: '1px solid rgba(192, 134, 58, 0.3)',
                  boxShadow: '0 0 20px rgba(192, 134, 58, 0.2)'
                }}
              >
                <Star className="h-4 w-4 mr-2" />
                NEURAL ACTIVE
              </Badge>
            </div>
          </div>
        </div>

        {/* KPIs Futurísticos */}
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <CyberKPI
            title="Registros Total"
            value={formatNumber(kpis?.totalRegistros || 0)}
            subtitle="Contratos processados"
            icon={Target}
            trend={5.2}
          />
          <CyberKPI
            title="Comissão Prevista"
            value={formatCurrency(kpis?.comissaoPrevista || 0)}
            subtitle="Faturamento período"
            icon={DollarSign}
            trend={8.7}
          />
          <CyberKPI
            title="Taxa Conversão"
            value={`${(kpis?.conversaoTotal || 0).toFixed(1)}%`}
            subtitle="Performance atual"
            icon={TrendingUp}
            trend={-2.1}
          />
          <CyberKPI
            title="Ticket Médio"
            value={formatCurrency(kpis?.ticketMedio || 0)}
            subtitle="Valor médio"
            icon={CheckCircle}
            trend={12.3}
          />
        </StaggeredContainer>

        {/* Seção de Gráficos Futurísticos */}
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Volume Chart */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Volume Mensal</CardTitle>
              <p className="chart-subtitle">Total vs Pago por mês</p>
            </StaggeredContainer>
            <Badge variant="outline">12 meses</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {volumeLoading ? (
                <div className="zero-state">
                  <div className="skeleton h-[280px] w-full" />
                </div>
              ) : chartVolumeData.length === 0 ? (
                <div className="zero-state">
                  <TrendingUp className="zero-state-icon" />
                  <h3 className="zero-state-title">Aguardando Dados</h3>
                  <p className="zero-state-description">
                    Os dados de volume serão exibidos quando carregados
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="ym" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" />
                    <Bar dataKey="pago" fill="hsl(var(--success))" name="Pago" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Chart */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Taxa de Conversão</CardTitle>
              <p className="chart-subtitle">Conversão mensal (%)</p>
            </div>
            <Badge variant="outline">Tendência</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {funnelLoading ? (
                <div className="zero-state">
                  <div className="skeleton h-[280px] w-full" />
                </div>
              ) : conversionData.length === 0 ? (
                <div className="zero-state">
                  <Target className="zero-state-icon" />
                  <h3 className="zero-state-title">Aguardando Dados</h3>
                  <p className="zero-state-description">
                    As taxas de conversão serão calculadas quando os dados estiverem disponíveis
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="ym" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="conversion" stroke="hsl(var(--success))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* L3 - Analysis Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Analysis */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Funil de Conversão</CardTitle>
            <p className="chart-subtitle">Total → Fila → Pago</p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <div className="zero-state">
                <AlertTriangle className="zero-state-icon" />
                <h3 className="zero-state-title">Funil Vazio</h3>
                <p className="zero-state-description">
                  Dados do funil serão exibidos após carregamento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Types Ranking */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Top 5 Documentos</CardTitle>
            <p className="chart-subtitle">Por volume</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {docLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="skeleton h-12 w-full" />
                ))
              ) : docData.length === 0 ? (
                <div className="zero-state">
                  <TrendingUp className="zero-state-icon" />
                  <h3 className="zero-state-title">Ranking Vazio</h3>
                  <p className="zero-state-description">
                    Ranking de documentos será exibido com dados
                  </p>
                </div>
              ) : (
                docData.slice(0, 5).map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{doc.tipo_documento || 'N/A'}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{doc.total_registros}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prazo Distribution */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Distribuição por Prazo</CardTitle>
            <p className="chart-subtitle">Meses de financiamento</p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <div className="zero-state">
                <Clock className="zero-state-icon" />
                <h3 className="zero-state-title">Sem Distribuição</h3>
                <p className="zero-state-description">
                  Distribuição de prazos será calculada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* L4 - Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ABC Revenue Analysis */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">ABC de Receita</CardTitle>
              <p className="chart-subtitle">Análise Pareto 80/20</p>
            </div>
            <Badge variant="outline" className={abcData.length === 0 ? "border-warning/20 text-warning" : "border-success/20 text-success"}>
              {abcData.length === 0 ? "Aguardando" : "Ativo"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {abcLoading ? (
                <div className="skeleton h-full w-full" />
              ) : abcData.length === 0 ? (
                <div className="zero-state">
                  <DollarSign className="zero-state-icon" />
                  <h3 className="zero-state-title">Análise ABC Pendente</h3>
                  <p className="zero-state-description">
                    Análise de receita será exibida com dados suficientes
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {abcData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/10 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${index < 2 ? 'bg-success' : index < 4 ? 'bg-warning' : 'bg-danger'}`} />
                        <span className="text-sm font-medium">{item.tipo_documento}</span>
                      </div>
                      <span className="text-sm font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.comissao_total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MoM Conversion Trends */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Conversão MoM</CardTitle>
              <p className="chart-subtitle">Variação mensal</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-success/20 text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{funnelData?.slice(-1)[0]?.conv_total_paga?.toFixed(1) || 0}%
              </Badge>
              <Badge variant="outline" className="border-primary/20 text-primary">
                <Target className="h-3 w-3 mr-1" />
                Meta: 15%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {funnelLoading ? (
                <div className="skeleton h-full w-full" />
              ) : funnelData.length === 0 ? (
                <div className="zero-state">
                  <Target className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Tendências</h3>
                  <p className="zero-state-description">
                    Tendências MoM serão calculadas com histórico
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={funnelData.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="ym" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="conv_total_paga" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="fila_sobre_total" stroke="hsl(var(--warning))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
