import React, { useState } from 'react';
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
  ChevronRight,
  TrendingDown,
  FileText,
  Receipt,
  CreditCard,
  ChevronDown
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
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Visão Geral"
  }
];

const treynoItems: NavItem[] = [
  {
    title: "Produção Analytics",
    url: "/producao/analytics",
    icon: FileText,
    description: "Análise Completa por Status"
  }
];

const emModuleItems: NavItem[] = [
  {
    title: "Comparativo Desembolso",
    url: "/comparativo-desembolso",
    icon: TrendingDown,
    description: "Análise Comparativa de Desembolsos"
  },
  {
    title: "Comparativo por Contrato",
    url: "/comparativo-contrato",
    icon: TrendingDown,
    description: "Comparação entre Contratos"
  },
  {
    title: "A Desembolsar",
    url: "/a-desembolsar",
    icon: Clock,
    description: "Pendências de Desembolso"
  },
  {
    title: "Desembolso",
    url: "/desembolso",
    icon: TrendingUp,
    description: "Análise de Desembolsos"
  },
  {
    title: "Posição Contratos",
    url: "/posicao-contratos",
    icon: Shield,
    description: "Status Geral de Contratos"
  }
];

const deltaGlobalBankItems: NavItem[] = [
  {
    title: "Propostas Abertura",
    url: "/propostas-abertura",
    icon: UserPlus,
    description: "Abertura de Contas"
  },
  {
    title: "Cadastral",
    url: "/cadastral",
    icon: Search,
    description: "Gestão Cadastral"
  },
  {
    title: "Cadastral V2",
    url: "/cadastral-v2",
    icon: Search,
    description: "Cadastral Nova"
  },
  {
    title: "Extrato",
    url: "/extrato",
    icon: Receipt,
    description: "Extrato Clientes"
  },
  {
    title: "Ranking Extrato",
    url: "/extrato-ranking",
    icon: TrendingUp,
    description: "Ranking por Saldo"
  },
  {
    title: "Faturas",
    url: "/faturas",
    icon: CreditCard,
    description: "Faturas Cartão"
  }
];

const fgtsItems: NavItem[] = [
  {
    title: "Funil",
    url: "/funil",
    icon: TrendingDown,
    description: "Funil de Conversão"
  },
  {
    title: "Propostas",
    url: "/propostas",
    icon: FileText,
    description: "Gestão de Propostas"
  }
];

const comparativoNavItems: NavItem[] = [];

const productionNavItems: NavItem[] = [
  {
    title: "Backoffice",
    url: "/backoffice",
    icon: Shield,
    description: "Dashboard Admin"
  },
  {
    title: "Licitações",
    url: "/licitacoes",
    icon: FileText,
    description: "Gestão de Licitações"
  },
  {
    title: "Licitações V2",
    url: "/licitacoes-v2",
    icon: FileText,
    description: "Licitações (IUGU Backend)"
  }
];

const analysisNavItems: NavItem[] = [];

interface NavSectionProps {
  title: string
  items: NavItem[]
}

interface CollapsibleNavSectionProps {
  title: string
  items: NavItem[]
  defaultOpen?: boolean
}

function CollapsibleNavSection({ title, items, defaultOpen = true }: CollapsibleNavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/30 rounded-md transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      {isOpen && (
        <nav className="space-y-1 px-2 mt-2">
          {items.map((item) => {
            const isActive = location.pathname === item.url;
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
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-primary" />
                )}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 w-64 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Δ</span>
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Delta Global Center</h2>
            <p className="text-xs text-muted-foreground">v2.1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <CollapsibleNavSection title="Principal" items={mainNavItems} />
        <CollapsibleNavSection title="Treyno" items={treynoItems} />
        <CollapsibleNavSection title="EM" items={emModuleItems} />
        <CollapsibleNavSection title="Delta Global Bank" items={deltaGlobalBankItems} />
        <CollapsibleNavSection title="FGTS" items={fgtsItems} />
        <CollapsibleNavSection title="Administração" items={productionNavItems} />
      </div>


    </aside>
  )
}