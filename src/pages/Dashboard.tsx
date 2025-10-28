import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard } from "lucide-react"
import { useSync } from "@/providers/sync-provider"
import { usePageXP } from "@/components/gamification"
import { StaggeredContainer } from "@/components/motion/StaggeredContainer"

export default function Dashboard() {
  // Gamification
  usePageXP('page_visit');
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
            <p className="text-muted-foreground">
              Visão geral dos principais indicadores de performance
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <LayoutDashboard className="h-3 w-3 mr-1" />
            Sistema Online
          </Badge>
        </div>

        <ExecutiveKPIs />

        <StaggeredContainer stagger={0.1} delay={0.2} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <p>Gráfico de volume será carregado em breve</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <p>Gráfico de conversão será carregado em breve</p>
              </div>
            </CardContent>
          </Card>
        </StaggeredContainer>
      </div>
    </div>
  )
}
