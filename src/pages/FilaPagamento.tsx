import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle, Calendar, DollarSign, Users, TrendingUp, Filter } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { usePaymentQueue } from "@/hooks/useSupabaseData"

const colors = {
  primary: 'hsl(41, 60%, 16%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  danger: 'hsl(346, 87%, 43%)',
}

export default function FilaPagamento() {
  const { data: queueData, isLoading } = usePaymentQueue()

  // Calculate KPIs
  const totalNovo = queueData?.novo?.length || 0
  const totalCompra = queueData?.compra?.length || 0
  const totalFila = totalNovo + totalCompra

  const valorTotalNovo = queueData?.novo?.reduce((sum, item) => sum + (item.valor_parcela || 0), 0) || 0
  const valorTotalCompra = queueData?.compra?.reduce((sum, item) => sum + (item.valor_parcela || 0), 0) || 0
  const valorTotal = valorTotalNovo + valorTotalCompra

  const ticketMedio = totalFila > 0 ? valorTotal / totalFila : 0

  // Aging analysis
  const today = new Date()
  const getAging = (dataFormalizacao: string) => {
    const formDate = new Date(dataFormalizacao)
    const diffTime = today.getTime() - formDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const agingData = [
    { name: '0-30 dias', novo: 0, compra: 0 },
    { name: '31-60 dias', novo: 0, compra: 0 },
    { name: '61-90 dias', novo: 0, compra: 0 },
    { name: '90+ dias', novo: 0, compra: 0 },
  ]

  // Calculate aging distribution
  queueData?.novo?.forEach(item => {
    if (item.data_formalizacao) {
      const aging = getAging(item.data_formalizacao)
      if (aging <= 30) agingData[0].novo++
      else if (aging <= 60) agingData[1].novo++
      else if (aging <= 90) agingData[2].novo++
      else agingData[3].novo++
    }
  })

  queueData?.compra?.forEach(item => {
    if (item.data_formalizacao) {
      const aging = getAging(item.data_formalizacao)
      if (aging <= 30) agingData[0].compra++
      else if (aging <= 60) agingData[1].compra++
      else if (aging <= 90) agingData[2].compra++
      else agingData[3].compra++
    }
  })

  const tipoDistribution = [
    { name: 'NOVO', value: totalNovo, color: colors.primary },
    { name: 'COMPRA', value: totalCompra, color: colors.success }
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <Clock className="h-6 w-6 text-primary" />
            Fila de Pagamento
          </h1>
          <p className="section-subtitle">
            Contratos aguardando liberação de pagamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-warning/20 text-warning">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {totalFila} na fila
          </Badge>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="kpi-label">Total na Fila</p>
              <p className="kpi-value">{totalFila.toLocaleString()}</p>
              <p className="kpi-change text-muted-foreground">
                NOVO: {totalNovo} • COMPRA: {totalCompra}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="kpi-label">Valor Total</p>
              <p className="kpi-value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
              </p>
              <p className="kpi-change text-success">
                Aguardando liberação
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-warning/10">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="kpi-label">Ticket Médio</p>
              <p className="kpi-value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
              </p>
              <p className="kpi-change text-warning">
                Por contrato
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="kpi-content">
            <div className="kpi-icon bg-danger/10">
              <Calendar className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="kpi-label">Idade Média</p>
              <p className="kpi-value">
                {Math.round(
                  [...(queueData?.novo || []), ...(queueData?.compra || [])]
                    .filter(item => item.data_formalizacao)
                    .reduce((sum, item) => sum + getAging(item.data_formalizacao!), 0) / 
                  (totalFila || 1)
                )} dias
              </p>
              <p className="kpi-change text-danger">
                Desde formalização
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Analysis */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Análise de Aging</CardTitle>
              <p className="chart-subtitle">Distribuição por tempo de espera</p>
            </div>
            <Badge variant="outline">Dias</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingData}>
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
                    <Bar dataKey="novo" fill="hsl(var(--primary))" name="NOVO" />
                    <Bar dataKey="compra" fill="hsl(var(--success))" name="COMPRA" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Distribuição por Tipo</CardTitle>
              <p className="chart-subtitle">NOVO vs COMPRA</p>
            </div>
            <Badge variant="outline">Proporção</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="skeleton h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tipoDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {tipoDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Queue Items */}
      <section>
        <Card className="chart-container">
          <CardHeader className="chart-toolbar">
            <div>
              <CardTitle className="chart-title">Itens Recentes na Fila</CardTitle>
              <p className="chart-subtitle">Últimos contratos adicionados</p>
            </div>
            <Badge variant="outline">Top 10</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))
              ) : (
                [...(queueData?.novo || []), ...(queueData?.compra || [])]
                  .sort((a, b) => new Date(b.data_formalizacao || '').getTime() - new Date(a.data_formalizacao || '').getTime())
                  .slice(0, 10)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant={item.tipo_liberacao === 'NOVO' ? 'default' : 'secondary'}>
                          {item.tipo_liberacao || 'N/A'}
                        </Badge>
                        <div>
                          <p className="font-medium">{item.matricula || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{item.tipo_documento || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_parcela || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.data_formalizacao ? `${getAging(item.data_formalizacao)} dias` : 'N/A'}
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