import { 
  LayoutDashboard, 
  UserPlus, 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  Search, 
  Shield,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string
  variant?: "warning" | "default"
}

const mainNavItems: NavItem[] = [
  {
    title: "Visão Geral",
    url: "/",
    icon: LayoutDashboard,
    description: "Dashboard Executivo"
  },
  {
    title: "Aquisição",
    url: "/aberturas",
    icon: UserPlus,
    description: "Abertura de Contas"
  }
];

const productionNavItems: NavItem[] = [
  {
    title: "Produção NOVO",
    url: "/producao/novo",
    icon: TrendingUp,
    description: "Contratos Novos"
  },
  {
    title: "Produção COMPRA",
    url: "/producao/compra", 
    icon: ShoppingCart,
    description: "Contratos Compra"
  },
  {
    title: "Fila de Pagamento",
    url: "/fila",
    icon: Clock,
    description: "Aguardando Pagamento",
    badge: "156"
  },
  {
    title: "Produção Paga",
    url: "/paga",
    icon: CheckCircle,
    description: "Contratos Pagos"
  }
];

const analysisNavItems: NavItem[] = [
  {
    title: "Explorador",
    url: "/explorar",
    icon: Search,
    description: "Análise de Dados"
  },
  {
    title: "Qualidade",
    url: "/qualidade",
    icon: Shield,
    description: "Qualidade dos Dados",
    badge: "3",
    variant: "warning" as const
  }
];

interface NavSectionProps {
  title: string
  items: NavItem[]
}

function NavSection({ title, items }: NavSectionProps) {
  const location = useLocation()
  
  return (
    <div className="mb-6">
      <h3 className="mb-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <nav className="space-y-1 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.url
          
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-sidebar-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <div className="flex flex-col">
                  <span className="leading-none">{item.title}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {item.badge && (
                  <Badge 
                    variant={item.variant === "warning" ? "destructive" : "secondary"}
                    className={cn(
                      "text-xs h-5 px-1.5",
                      item.variant === "warning" 
                        ? "bg-warning/10 text-warning border-warning/20" 
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-primary" />
                )}
              </div>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Δ</span>
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Command Center</h2>
            <p className="text-xs text-muted-foreground">v2.1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavSection title="Principal" items={mainNavItems} />
        <NavSection title="Produção" items={productionNavItems} />
        <NavSection title="Análise" items={analysisNavItems} />
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 p-3 bg-accent/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-warning" />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">Sistema Online</p>
            <p className="text-xs text-muted-foreground">Última sync: 15:32</p>
          </div>
        </div>
      </div>
    </aside>
  )
}