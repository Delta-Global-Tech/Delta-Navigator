import { ShoppingCart, FileText, Target, Calendar, BarChart3, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/data/supabase"
import { useMemo } from "react"

export default function ProducaoCompra() {
  // Buscar dados de produção COMPRA
  const { data: compraData, isLoading } = useQuery({
    queryKey: ['producao-compra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producao_total_compra')
        .select('*')
        .order('data_formalizacao', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Processar dados para análises
  const monthlyData = useMemo(() => {
    if (!compraData) return []
    
    const grouped = compraData.reduce((acc, item) => {
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
  }, [compraData])

  const documentData = useMemo(() => {
    if (!compraData) return []
    
    const grouped = compraData.reduce((acc, item) => {
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
  }, [compraData])

  const liberacaoData = useMemo(() => {
    if (!compraData) return []
    
    const grouped = compraData.reduce((acc, item) => {
      const lib = item.tipo_liberacao || 'Não informado'
      acc[lib] = (acc[lib] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [compraData])

  const prazoData = useMemo(() => {
    if (!compraData) return []
    
    const grouped = compraData.reduce((acc, item) => {
      const prazo = item.prazo ? `${item.prazo}m` : 'N/A'
      acc[prazo] = (acc[prazo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [compraData])

  const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--danger))', 'hsl(var(--info))']
  const totalValor = compraData?.reduce((sum, item) => sum + (item.valor_parcela || 0), 0) || 0
  const ticketMedio = compraData?.length ? totalValor / compraData.length : 0

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Produção COMPRA
          </h1>
          <p className="section-subtitle">
            Análise de contratos de compra e performance por tipo de liberação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-success/20 text-success">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Contratos Compra
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="kpi-card-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">Total Contratos</p>
                <p className="metric-value">{compraData?.length.toLocaleString("pt-BR") || "0"}</p>
                <p className="metric-subtitle">Contratos COMPRA</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-primary">
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
                <p className="metric-label">Tipos Liberação</p>
                <p className="metric-value">{liberacaoData.length}</p>
                <p className="metric-subtitle">Modalidades</p>
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
            <p className="chart-subtitle">Contratos COMPRA por mês</p>
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
                    <Bar dataKey="count" fill="hsl(var(--success))" name="Contratos" />
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liberation Type Analysis */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="chart-title">Tipos de Liberação</CardTitle>
            <p className="chart-subtitle">Modalidades mais utilizadas</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : liberacaoData.length === 0 ? (
                <div className="zero-state">
                  <Target className="zero-state-icon" />
                  <h3 className="zero-state-title">Sem Dados</h3>
                  <p className="zero-state-description">Tipos de liberação serão exibidos aqui</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={liberacaoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {liberacaoData.map((entry, index) => (
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
                  <BarChart data={prazoData.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" fill="hsl(var(--warning))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Evolution */}
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="chart-title">Evolução do Valor</CardTitle>
          <p className="chart-subtitle">Valor mensal dos contratos COMPRA</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {isLoading ? (
              <div className="skeleton h-full w-full" />
            ) : monthlyData.length === 0 ? (
              <div className="zero-state">
                <TrendingUp className="zero-state-icon" />
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
                  <Line type="monotone" dataKey="valor" stroke="hsl(var(--success))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}