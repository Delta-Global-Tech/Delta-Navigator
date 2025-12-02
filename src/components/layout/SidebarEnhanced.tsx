import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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
  ChevronDown,
  Menu,
  X,
  Zap
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebarContext } from "@/contexts/SidebarContext"

// Debounce helper
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

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

const contaCorrenteItems: NavItem[] = [
  {
    title: "Contas Correntes",
    url: "/contas-correntes",
    icon: CreditCard,
    description: "Gestão de Contas Correntes"
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
    title: "Cadastral V3",
    url: "/cadastral-v3",
    icon: Search,
    description: "Cadastral Completa"
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
  },
  {
    title: "Extrato Cartão Crédito",
    url: "/extrato-cartao-credito",
    icon: CreditCard,
    description: "Transações Cartão Crédito"
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

interface CollapsibleNavSectionProps {
  title: string
  items: NavItem[]
  defaultOpen?: boolean
  isMinimized?: boolean
}

function CollapsibleNavSection({ title, items, defaultOpen = false, isMinimized = false }: CollapsibleNavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 rounded-md transition-all duration-200 group"
      >
        <span className={cn(
          "transition-opacity duration-300",
          isMinimized ? "opacity-0 w-0" : "opacity-100"
        )}>
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-all duration-300 ml-auto",
            isOpen ? "rotate-0" : "-rotate-90",
            isMinimized && "mx-auto"
          )}
        />
      </button>

      {isOpen && !isMinimized && (
        <nav className="space-y-1 px-2 mt-2 animate-in slide-in-from-top-2 duration-200">
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30 shadow-sm"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <div className="flex flex-col min-w-0">
                    <span className="leading-none truncate">{item.title}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.description}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-primary flex-shrink-0 ml-2" />
                )}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export function SidebarEnhanced() {
  const { isMinimized, setIsMinimized } = useSidebarContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Principal: true,
    Treyno: false,
    "Conta Corrente": true,
    EM: false,
    "Delta Global Bank": false,
    FGTS: false,
    Administração: false
  });

  // Debounced resize handler para evitar lag
  const debouncedHandleResize = useDebounce(() => {
    const isSmall = window.innerWidth < 768;
    setIsMinimized(isSmall);
  }, 150);

  useEffect(() => {
    // Verificar uma vez na montagem
    if (window.innerWidth < 768) {
      setIsMinimized(true);
    }

    // Listener com debounce
    window.addEventListener('resize', debouncedHandleResize);
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, [debouncedHandleResize, setIsMinimized]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized, setIsMinimized]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-0 left-0 z-50 md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 text-foreground hover:bg-accent/50 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-sidebar-background to-sidebar-background/95 border-r border-sidebar-border flex flex-col transition-[width] duration-300 ease-in-out",
        isMinimized ? "w-20" : "w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Sidebar Header with Gradient */}
        <div className="relative p-4 border-b border-sidebar-border/50 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <div className={cn(
            "flex items-center gap-3 transition-[justify-content] duration-300",
            isMinimized ? "justify-center" : "justify-between"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <Zap className="text-primary-foreground font-bold text-lg" size={20} />
              </div>
              {!isMinimized && (
                <div className="min-w-0">
                  <h2 className="font-bold text-sidebar-foreground text-sm truncate">Delta Global</h2>
                  <p className="text-xs text-muted-foreground">v2.1.0</p>
                </div>
              )}
            </div>
            
            {!isMinimized && (
              <button
                onClick={handleToggleMinimize}
                className="p-1.5 rounded-lg hover:bg-accent/50 transition-all duration-200 text-muted-foreground hover:text-foreground"
                title="Minimizar sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Minimize Button when minimized */}
        {isMinimized && (
          <button
            onClick={handleToggleMinimize}
            className="p-3 mx-2 mt-2 rounded-lg hover:bg-accent/50 transition-all duration-200 text-muted-foreground hover:text-foreground flex items-center justify-center"
            title="Expandir sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
          {/* Principal Section - Always visible and first */}
          <div
            onClick={() => toggleSection('Principal')}
            className={cn(
              "mb-4 rounded-lg cursor-pointer transition-all duration-200 group",
              expandedSections['Principal'] 
                ? "bg-gradient-to-r from-primary/15 to-primary/5 shadow-sm" 
                : "hover:bg-accent/30"
            )}
          >
            <CollapsibleNavSection 
              title="Principal" 
              items={mainNavItems}
              defaultOpen={expandedSections['Principal']}
              isMinimized={isMinimized}
            />
          </div>

          {/* Conta Corrente Section */}
          <div
            onClick={() => toggleSection('Conta Corrente')}
            className={cn(
              "mb-4 rounded-lg cursor-pointer transition-all duration-200 group",
              expandedSections['Conta Corrente'] 
                ? "bg-gradient-to-r from-cyan-500/15 to-cyan-500/5 shadow-sm" 
                : "hover:bg-accent/30"
            )}
          >
            <CollapsibleNavSection 
              title="Conta Corrente" 
              items={contaCorrenteItems}
              defaultOpen={expandedSections['Conta Corrente']}
              isMinimized={isMinimized}
            />
          </div>

          {/* Treyno Section */}
          <div
            onClick={() => toggleSection('Treyno')}
            className={cn(
              "mb-4 rounded-lg cursor-pointer transition-all duration-200 group",
              expandedSections['Treyno'] 
                ? "bg-gradient-to-r from-blue-500/15 to-blue-500/5 shadow-sm" 
                : "hover:bg-accent/30"
            )}
          >
            <CollapsibleNavSection 
              title="Treyno" 
              items={treynoItems}
              defaultOpen={expandedSections['Treyno']}
              isMinimized={isMinimized}
            />
          </div>

          {/* EM Section */}
          <div
            onClick={() => toggleSection('EM')}
            className={cn(
              "mb-4 rounded-lg cursor-pointer transition-all duration-200 group",
              expandedSections['EM'] 
                ? "bg-gradient-to-r from-green-500/15 to-green-500/5 shadow-sm" 
                : "hover:bg-accent/30"
            )}
          >
            <CollapsibleNavSection 
              title="EM" 
              items={emModuleItems}
              defaultOpen={expandedSections['EM']}
              isMinimized={isMinimized}
            />
          </div>

          {/* Delta Global Bank Section */}
          <div
            onClick={() => toggleSection('Delta Global Bank')}
            className={cn(
              "mb-4 rounded-lg cursor-pointer transition-all duration-200 group",
              expandedSections['Delta Global Bank'] 
                ? "bg-gradient-to-r from-purple-500/15 to-purple-500/5 shadow-sm" 
                : "hover:bg-accent/30"
            )}
          >
            <CollapsibleNavSection 
              title="Delta Global Bank" 
              items={deltaGlobalBankItems}
              defaultOpen={expandedSections['Delta Global Bank']}
              isMinimized={isMinimized}
            />
          </div>

          {/* FGTS Section */}
          <div
            onClick={() => toggleSection('FGTS')}
            className={cn(
              "mb-4 rounded-lg cursor-pointer transition-all duration-200 group",
              expandedSections['FGTS'] 
                ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 shadow-sm" 
                : "hover:bg-accent/30"
            )}
          >
            <CollapsibleNavSection 
              title="FGTS" 
              items={fgtsItems}
              defaultOpen={expandedSections['FGTS']}
              isMinimized={isMinimized}
            />
          </div>

          {/* Administration Section */}
          <div
            onClick={() => toggleSection('Administração')}
            className={cn(
              "mb-4 rounded-lg cursor-pointer transition-all duration-200 group",
              expandedSections['Administração'] 
                ? "bg-gradient-to-r from-red-500/15 to-red-500/5 shadow-sm" 
                : "hover:bg-accent/30"
            )}
          >
            <CollapsibleNavSection 
              title="Administração" 
              items={productionNavItems}
              defaultOpen={expandedSections['Administração']}
              isMinimized={isMinimized}
            />
          </div>
        </div>

        {/* Footer */}
        {!isMinimized && (
          <div className="p-4 border-t border-sidebar-border/50 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 Delta Navigator
            </p>
          </div>
        )}
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </>
  )
}
