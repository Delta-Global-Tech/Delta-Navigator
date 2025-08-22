import { TrendingUp, TrendingDown, DollarSign, Users, Target, Percent } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: {
    value: string
    positive: boolean
  }
  icon: React.ElementType
  variant?: "primary" | "success" | "warning" | "danger"
}

function KPICard({ title, value, subtitle, trend, icon: Icon, variant = "primary" }: KPICardProps) {
  const cardClass = `kpi-card-${variant}`
  
  return (
    <Card className={cardClass}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="metric-label">{title}</p>
            <p className="metric-value">{value}</p>
            {subtitle && (
              <p className="metric-subtitle">{subtitle}</p>
            )}
            {trend && (
              <div className={`metric-trend ${trend.positive ? 'text-success' : 'text-danger'}`}>
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <Icon className="h-8 w-8 text-muted-foreground/60" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExecutiveKPIs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <KPICard
        title="Registros Totais"
        value="0"
        subtitle="Contratos ativos"
        trend={{ value: "—", positive: true }}
        icon={Users}
        variant="primary"
      />
      
      <KPICard
        title="Saldo Devedor"
        value="R$ 0,00"
        subtitle="Total em carteira"
        trend={{ value: "—", positive: true }}
        icon={DollarSign}
        variant="success"
      />
      
      <KPICard
        title="Comissão Prevista"
        value="R$ 0,00"
        subtitle="Receita esperada"
        trend={{ value: "—", positive: false }}
        icon={Target}
        variant="warning"
      />
      
      <KPICard
        title="Comissão Recebida"
        value="R$ 0,00"
        subtitle="Receita realizada"
        trend={{ value: "—", positive: true }}
        icon={DollarSign}
        variant="success"
      />
      
      <KPICard
        title="Ticket Médio"
        value="R$ 0,00"
        subtitle="Valor médio/contrato"
        trend={{ value: "—", positive: false }}
        icon={TrendingUp}
        variant="primary"
      />
      
      <KPICard
        title="Conversão Total"
        value="0%"
        subtitle="Total → Pago"
        trend={{ value: "—", positive: true }}
        icon={Percent}
        variant="success"
      />
    </div>
  )
}