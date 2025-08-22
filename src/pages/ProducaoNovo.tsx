import { TrendingUp, FileText, Target, Calendar, BarChart3, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/data/supabase"
import { useMemo } from "react"

export default function ProducaoNovo() {
  // Buscar dados de produção NOVO
  const { data: novoData, isLoading } = useQuery({
    queryKey: ['producao-novo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producao_total_novo')
        .select('*')
        .order('data_formalizacao', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Processar dados para análises
  const monthlyData = useMemo(() => {
    if (!novoData) return []
    
    const grouped = novoData.reduce((acc, item) => {
      const month = item.data_formalizacao?.slice(0, 7) || 'N/A'
      if (!acc[month]) {
        acc[month] = { ym: month, count: 0, valor: 0 }
      }
      acc[month].count += 1
      acc[month].valor += item.valor_parcela || 0
      return acc
    }, {} as Record<string, any>)
    
    return Object.values(grouped)
      .sort((a: any, b: any) => a.ym.localeCompare(b.ym))
      .slice(-12)
  }, [novoData])

  const documentData = useMemo(() => {
    if (!novoData) return []
    
    const grouped = novoData.reduce((acc, item) => {
      const doc = item.tipo_documento || 'Não informado'
      if (!acc[doc]) {
        acc[doc] = { name: doc, count: 0, valor: 0 }
      }
      acc[doc].count += 1
      acc[doc].valor += item.valor_parcela || 0
      return acc
    }, {} as Record<string, any>)
    
    return Object.values(grouped)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 8)
  }, [novoData])

  const prazoData = useMemo(() => {
    if (!novoData) return []
    
    const grouped = novoData.reduce((acc, item) => {
      const prazo = item.prazo ? `${item.prazo}m` : 'N/A'
      acc[prazo] = (acc[prazo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [novoData])

  const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--danger))', 'hsl(var(--info))']
  const totalValor = novoData?.reduce((sum, item) => sum + (item.valor_parcela || 0), 0) || 0
  const ticketMedio = novoData?.length ? totalValor / novoData.length : 0

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <TrendingUp className="h-6 w-6 text-primary" />
            Produção NOVO
          </h1>
          <p className="section-subtitle">
            Análise de contratos novos e performance por tipo de documento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/20 text-primary">
            <FileText className="h-3 w-3 mr-1" />
            Contratos Novos
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="kpi-card-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Total Contratos</p>
                <p className="metric-value">{novoData?.length.toLocaleString("pt-BR") || "0"}</p>
                <p className="metric-subtitle">Contratos NOVO</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Valor Total</p>
                <p className="metric-value">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValor)}
                </p>
                <p className="metric-subtitle">Soma das parcelas</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-warning">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Ticket Médio</p>
                <p className="metric-value">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ticketMedio)}
                </p>
                <p className="metric-subtitle">Por contrato</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-danger">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Tipos de Doc</p>
                <p className="metric-value">{documentData.length}</p>
                <p className="metric-subtitle">Diferentes tipos</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Volume */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Volume Mensal</CardTitle>
            <p className="chart-subtitle">Contratos NOVO por mês</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : monthlyData.length === 0 ? (
                <div className="zero-state">
                  <TrendingUp className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Dados</h3>
                  <p className="zero-state-description">Volume mensal será exibido aqui</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Contratos" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Type Performance */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Top Tipos de Documento</CardTitle>
            <p className="chart-subtitle">Ranking por volume</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : documentData.length === 0 ? (
                <div className="zero-state">
                  <FileText className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Dados</h3>
                  <p className="zero-state-description">Ranking de documentos será exibido aqui</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentData} layout="horizontal">
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
                    <Bar dataKey="count" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value Trend */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Evolução do Valor</CardTitle>
            <p className="chart-subtitle">Valor mensal dos contratos</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : monthlyData.length === 0 ? (
                <div className="zero-state">
                  <Target className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Dados</h3>
                  <p className="zero-state-description">Evolução de valor será exibida aqui</p>
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
                      formatter={(value: any) => [
                        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value),
                        "Valor"
                      ]}
                    />
                    <Line type="monotone" dataKey="valor" stroke="hsl(var(--warning))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
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
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : prazoData.length === 0 ? (
                <div className="zero-state">
                  <Clock className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Dados</h3>
                  <p className="zero-state-description">Distribuição por prazo será exibida aqui</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prazoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prazoData.map((entry, index) => (
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
    </div>
  )
}