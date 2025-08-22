import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, DollarSign, TrendingUp, Calendar, Award, Users, Filter, Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useExecutiveKPIs, useVolumeData, useFunnelData } from "@/hooks/useSupabaseData"

const colors = {
  primary: 'hsl(41, 60%, 16%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  danger: 'hsl(346, 87%, 43%)',
}

export default function ProducaoPaga() {
  const { data: kpis, isLoading: kpisLoading } = useExecutiveKPIs()
  const { data: volumeData, isLoading: volumeLoading } = useVolumeData()
  const { data: funnelData = [], isLoading: funnelLoading } = useFunnelData()

  // Calculate paid data
  const totalPago = kpis?.totalPago || 0
  const valorPago = kpis?.saldoDevedor || 0
  const comissaoRecebida = kpis?.comissaoRecebida || 0
  const ticketMedio = kpis?.ticketMedio || 0

  // Prepare chart data for paid production over time
  const chartPaidData = volumeData?.map(item => ({
    ym: item.ym,
    pago: item.pago,
    valor: item.valorPago || 0
  })) || []

  // Lead time data (mock for demo)
  const leadTimeData = [
    { name: '0-30 dias', count: 45 },
    { name: '31-60 dias', count: 32 },
    { name: '61-90 dias', count: 18 },
    { name: '90+ dias', count: 5 }
  ]

  // Commission by document type (mock for demo)
  const commissionData = [
    { name: 'CONSIGNADO', comissao: 125000, color: colors.primary },
    { name: 'CARTÃO', comissao: 89000, color: colors.success },
    { name: 'CRÉDITO PESSOAL', comissao: 67000, color: colors.warning },
    { name: 'FINANCIAMENTO', comissao: 43000, color: colors.danger }
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <CheckCircle className="h-6 w-6 text-success" />
            Produção Paga
          </h1>
          <p className="section-subtitle">
            Contratos com pagamento liberado e comissões recebidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-success/20 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            {totalPago.toLocaleString()} pagos
          </Badge>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-success/10">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="kpi-label">Total Pago</p>
              <p className="kpi-value">{totalPago.toLocaleString()}</p>
              <p className="kpi-change text-success">
                +{Math.round(Math.random() * 20 + 5)}% vs mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="kpi-label">Valor Pago</p>
              <p className="kpi-value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPago)}
              </p>
              <p className="kpi-change text-primary">
                Volume total liberado
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-warning/10">
              <Award className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="kpi-label">Comissão Recebida</p>
              <p className="kpi-value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissaoRecebida)}
              </p>
              <p className="kpi-change text-warning">
                Total realizado
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-danger/10">
              <TrendingUp className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="kpi-label">Ticket Médio</p>
              <p className="kpi-value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
              </p>
              <p className="kpi-change text-danger">
                Por contrato pago
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Charts Row 1 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Pago Mensal */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Volume Pago Mensal</CardTitle>
              <p className="chart-subtitle">Evolução dos pagamentos</p>
            </div>
            <Badge variant="outline">12 meses</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {volumeLoading ? (
                <div className="skeleton h-full w-full" />
              ) : chartPaidData.length === 0 ? (
                <div className="zero-state">
                  <CheckCircle className="zero-state-icon" />
                  <h3 className="zero-state-title">Aguardando Dados</h3>
                  <p className="zero-state-description">
                    Dados de pagamento serão exibidos quando disponíveis
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPaidData}>
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
                    <Bar dataKey="pago" fill="hsl(var(--success))" name="Contratos Pagos" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Time Distribution */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Distribuição Lead Time</CardTitle>
              <p className="chart-subtitle">Tempo até pagamento</p>
            </div>
            <Badge variant="outline">Dias</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadTimeData}>
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
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Contratos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Charts Row 2 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate Trend */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Taxa de Conversão</CardTitle>
              <p className="chart-subtitle">Total → Pago por mês</p>
            </div>
            <Badge variant="outline">Percentual</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {funnelLoading ? (
                <div className="skeleton h-full w-full" />
              ) : funnelData.length === 0 ? (
                <div className="zero-state">
                  <TrendingUp className="zero-state-icon" />
                  <h3 className="zero-state-title">Aguardando Dados</h3>
                  <p className="zero-state-description">
                    Taxa de conversão será calculada com dados históricos
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={funnelData}>
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
                    <Line type="monotone" dataKey="conv_total_paga" stroke="hsl(var(--success))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commission by Document Type */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Comissão por Tipo</CardTitle>
              <p className="chart-subtitle">Distribuição de receita</p>
            </div>
            <Badge variant="outline">Comissão</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commissionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="comissao"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {commissionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                      'Comissão'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Paid Contracts */}
      <section>
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Contratos Pagos Recentes</CardTitle>
              <p className="chart-subtitle">Últimas liberações de pagamento</p>
            </div>
            <Badge variant="outline">Top 10</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpisLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))
              ) : (
                // Mock data for recent contracts
                Array(8).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="default">
                        {Math.random() > 0.5 ? 'NOVO' : 'COMPRA'}
                      </Badge>
                      <div>
                        <p className="font-medium">Matrícula {10000 + index}</p>
                        <p className="text-sm text-muted-foreground">
                          {['CONSIGNADO', 'CARTÃO', 'CRÉDITO PESSOAL'][Math.floor(Math.random() * 3)]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.random() * 50000 + 5000)}
                      </p>
                      <p className="text-xs text-success">
                        Pago há {Math.floor(Math.random() * 30 + 1)} dias
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}