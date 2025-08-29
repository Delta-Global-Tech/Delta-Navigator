import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Upload as UploadIcon, Search, Shield, TrendingUp, FileSpreadsheet, Menu, X, ShoppingCart } from "lucide-react"

import { MetricsGrid } from "./dashboard/MetricsGrid"
import { ChartsSection } from "./dashboard/ChartsSection"
import ProducaoNovo from "@/pages/ProducaoNovo"
import ProducaoCompra from "@/pages/ProducaoCompra"

const DADOS_DASHBOARD = {
  totalRegistros: 1247,
  saldoDevedor: 226_244.99,
  comissaoPrevista: 28_000.00,
  comissaoRecebida: 2_289.03,
  status: "Sistema Online",
  ultimaSync: new Date().toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }),
}

const tabs = [
  { id: "producao-novo", label: "Produção Novo", icon: <TrendingUp className="h-4 w-4" />, description: "Contratos Novos" },
  { id: "producao-compra", label: "Produção Compra", icon: <ShoppingCart className="h-4 w-4" />, description: "Contratos Compra" },
]

export function SinglePageApp() {
  const [activeTab, setActiveTab] = useState("producao-novo")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Corban Navigator</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">Dashboard Completo de Análise Financeira</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-success text-success hidden sm:flex">{DADOS_DASHBOARD.status}</Badge>
              <Badge variant="secondary" className="hidden md:flex">
                {DADOS_DASHBOARD.totalRegistros.toLocaleString("pt-BR")} registros
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border/50 transform transition-transform duration-300 ease-in-out lg:transform-none
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} pt-16 lg:pt-0`}
        >
          <div className="p-4 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Módulos</h2>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
                  ${activeTab === tab.id ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                <div className="flex-shrink-0 mt-0.5">{tab.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{tab.label}</p>
                  <p className="text-xs opacity-70 truncate">{tab.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Status Panel */}
          <div className="p-4 mt-6">
            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-success">Online</span>
                </div>
                <p className="text-xs text-success/80">
                  Última sincronização:<br />{DADOS_DASHBOARD.ultimaSync}
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Renderização das telas de produção */}
            {activeTab === "producao-novo" && <div className="animate-fade-in"><ProducaoNovo /></div>}
            {activeTab === "producao-compra" && <div className="animate-fade-in"><ProducaoCompra /></div>}
          </div>
        </main>
      </div>
    </div>
  )
}