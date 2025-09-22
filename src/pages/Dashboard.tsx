import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target, DollarSign, LayoutDashboard } from "lucide-react"
import { useFunnelData, useVolumeData, useExecutiveKPIs, useABCRevenue, useDocumentPerformance } from "@/hooks/useSupabaseData"
import { useAutoRefresh } from "@/hooks/useAutoRefresh"
import { useSync } from "@/providers/sync-provider"
import { useEffect, useRef } from "react"

// Mock data for zero state
const volumeData = []
const conversionData = []
const funnelData = [
  { name: 'Total', novo: 0, compra: 0 },
  { name: 'Fila', novo: 0, compra: 0 },
  { name: 'Pago', novo: 0, compra: 0 },
]

const documentTypes = []
const prazoDistribution = []

const colors = {
  primary: 'hsl(41, 60%, 16%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  danger: 'hsl(346, 87%, 43%)',
}

export default function Dashboard() {
  const { updateSync, setRefreshing } = useSync()
  
  // Ref para armazenar dados anteriores para comparação
  const previousDataRef = useRef<any>(null)

  // Carregar dados do Supabase
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useExecutiveKPIs()
  const { data: volumeData, isLoading: volumeLoading, refetch: refetchVolume } = useVolumeData()
  const { data: funnelData = [], isLoading: funnelLoading, refetch: refetchFunnel } = useFunnelData()
  const { data: abcData = [], isLoading: abcLoading, refetch: refetchAbc } = useABCRevenue()
  const { data: docData = [], isLoading: docLoading, refetch: refetchDoc } = useDocumentPerformance()

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

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Visão Geral Executiva
          </h1>
          <p className="section-subtitle">
            Dashboard empresarial com métricas de produção e conversão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-success/20 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sistema Online
          </Badge>
          <Badge variant="outline" className="border-warning/20 text-warning">
            <Clock className="h-3 w-3 mr-1" />
            Sem Dados
          </Badge>
        </div>
      </div>

      {/* L1 - Executive KPIs */}
      <section>
        <ExecutiveKPIs />
      </section>

      {/* L2 - Core Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Volume Mensal</CardTitle>
              <p className="chart-subtitle">Total vs Pago por mês</p>
            </div>
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
  )
}