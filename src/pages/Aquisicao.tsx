import { UserPlus, TrendingUp, Users, Calendar, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useAccountOpenings } from "@/hooks/useSupabaseData"
import { useMemo } from "react"

export default function Aquisicao() {
  const { data: openingsData, isLoading } = useAccountOpenings()

  // Processar dados para gráficos
  const monthlyData = useMemo(() => {
    if (!openingsData) return []
    
    const grouped = openingsData.reduce((acc, item) => {
      const month = item.data_formalizacao?.slice(0, 7) || 'N/A'
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(grouped)
      .map(([ym, count]) => ({ ym, count }))
      .sort((a, b) => a.ym.localeCompare(b.ym))
      .slice(-12)
  }, [openingsData])

  const channelData = useMemo(() => {
    if (!openingsData) return []
    
    const grouped = openingsData.reduce((acc, item) => {
      const channel = item.canal || 'Não informado'
      acc[channel] = (acc[channel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [openingsData])

  const segmentData = useMemo(() => {
    if (!openingsData) return []
    
    const grouped = openingsData.reduce((acc, item) => {
      const segment = item.segmento || 'Não informado'
      acc[segment] = (acc[segment] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [openingsData])

  const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--danger))', 'hsl(var(--info))']

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <UserPlus className="h-6 w-6 text-primary" />
            Aquisição - Abertura de Contas
          </h1>
          <p className="section-subtitle">
            Análise de novas contas e canais de aquisição
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/20 text-primary">
            <Calendar className="h-3 w-3 mr-1" />
            Últimos 12 meses
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="kpi-card-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Total de Contas</p>
                <p className="metric-value">{openingsData?.length.toLocaleString("pt-BR") || "0"}</p>
                <p className="metric-subtitle">Abertas no período</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Média Mensal</p>
                <p className="metric-value">{Math.round((openingsData?.length || 0) / 12).toLocaleString("pt-BR")}</p>
                <p className="metric-subtitle">Contas/mês</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-warning">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Canais Ativos</p>
                <p className="metric-value">{channelData.length}</p>
                <p className="metric-subtitle">Fontes de aquisição</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-danger">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Segmentos</p>
                <p className="metric-value">{segmentData.length}</p>
                <p className="metric-subtitle">Perfis de clientes</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Evolução Mensal</CardTitle>
            <p className="chart-subtitle">Abertura de contas por mês</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : monthlyData.length === 0 ? (
                <div className="zero-state">
                  <TrendingUp className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Dados</h3>
                  <p className="zero-state-description">Dados de abertura serão exibidos aqui</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
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
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Distribuição por Canal</CardTitle>
            <p className="chart-subtitle">Fontes de aquisição</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : channelData.length === 0 ? (
                <div className="zero-state">
                  <BarChart3 className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Dados de Canal</h3>
                  <p className="zero-state-description">Distribuição por canal será exibida aqui</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Analysis */}
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="chart-title">Análise por Segmento</CardTitle>
          <p className="chart-subtitle">Perfil dos clientes adquiridos</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {isLoading ? (
              <div className="skeleton h-full w-full" />
            ) : segmentData.length === 0 ? (
              <div className="zero-state">
                <Users className="zero-state-icon" />
                <h3 className="zero-state-title">Sem Dados de Segmento</h3>
                <p className="zero-state-description">Análise por segmento será exibida aqui</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData.slice(0, 8)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}