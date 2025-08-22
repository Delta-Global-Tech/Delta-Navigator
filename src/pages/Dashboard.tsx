import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target, DollarSign, LayoutDashboard } from "lucide-react"

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
              {volumeData.length === 0 ? (
                <div className="zero-state">
                  <TrendingUp className="zero-state-icon" />
                  <h3 className="zero-state-title">Aguardando Dados</h3>
                  <p className="zero-state-description">
                    Os dados de volume serão exibidos quando carregados
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
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
                    <Bar dataKey="total" fill={colors.primary} name="Total" />
                    <Bar dataKey="pago" fill={colors.success} name="Pago" />
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
              {conversionData.length === 0 ? (
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
                    <Line type="monotone" dataKey="conversion" stroke={colors.success} strokeWidth={3} />
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
              {documentTypes.length === 0 ? (
                <div className="zero-state">
                  <TrendingUp className="zero-state-icon" />
                  <h3 className="zero-state-title">Ranking Vazio</h3>
                  <p className="zero-state-description">
                    Ranking de documentos será exibido com dados
                  </p>
                </div>
              ) : (
                documentTypes.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{doc.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{doc.count}</span>
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
            <Badge variant="outline" className="border-warning/20 text-warning">
              Aguardando
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <div className="zero-state">
                <DollarSign className="zero-state-icon" />
                <h3 className="zero-state-title">Análise ABC Pendente</h3>
                <p className="zero-state-description">
                  Análise de receita será exibida com dados suficientes
                </p>
              </div>
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
                +0%
              </Badge>
              <Badge variant="outline" className="border-danger/20 text-danger">
                <TrendingDown className="h-3 w-3 mr-1" />
                -0%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <div className="zero-state">
                <Target className="zero-state-icon" />
                <h3 className="zero-state-title">Sem Tendências</h3>
                <p className="zero-state-description">
                  Tendências MoM serão calculadas com histórico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}