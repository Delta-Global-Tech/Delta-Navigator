import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Zap,
  Target,
  Briefcase,
  PieChart,
  Lock,
  Menu,
  X,
  Activity,
  Bell,
  GitCompare,
  Users
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AnimatePresence, motion } from "framer-motion"
import { useSidebarContext } from "@/contexts/SidebarContext"
import "./sidebar-animations.css"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string
  variant?: "warning" | "default"
  emoji?: string
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Visão Geral",
    emoji: "📊"
  }
];

const treynoItems: NavItem[] = [
  {
    title: "Produção Analytics",
    url: "/producao/analytics",
    icon: FileText,
    description: "Análise Completa por Status",
    emoji: "📈"
  },
  {
    title: "Performance de Equipe",
    url: "/treynor/performance",
    icon: Users,
    description: "Análise de Performance de Equipes",
    emoji: "👥"
  }
];

const emModuleItems: NavItem[] = [
  {
    title: "Comparativo Desembolso",
    url: "/comparativo-desembolso",
    icon: TrendingDown,
    description: "Análise Comparativa de Desembolsos",
    emoji: "💰"
  },
  {
    title: "Comparativo por Contrato",
    url: "/comparativo-contrato",
    icon: TrendingDown,
    description: "Comparação entre Contratos",
    emoji: "📋"
  },
  {
    title: "A Desembolsar",
    url: "/a-desembolsar",
    icon: Clock,
    description: "Pendências de Desembolso",
    emoji: "⏰"
  },
  {
    title: "Desembolso",
    url: "/desembolso",
    icon: TrendingUp,
    description: "Análise de Desembolsos",
    emoji: "📊"
  },
  {
    title: "Posição Contratos",
    url: "/posicao-contratos",
    icon: Shield,
    description: "Status Geral de Contratos",
    emoji: "🔐"
  }
];

const deltaGlobalBankItems: NavItem[] = [
  {
    title: "Propostas Abertura",
    url: "/propostas-abertura",
    icon: UserPlus,
    description: "Abertura de Contas",
    emoji: "👤"
  },
  {
    title: "Contas Correntes",
    url: "/contas-correntes",
    icon: CreditCard,
    description: "Gestão de Contas Correntes",
    emoji: "🏦"
  },
  {
    title: "Saldo Conta Corrente",
    url: "/saldo-conta-corrente",
    icon: TrendingUp,
    description: "Posição de Saldos",
    emoji: "💰"
  },
  {
    title: "Extrato",
    url: "/extrato",
    icon: Receipt,
    description: "Extrato Clientes",
    emoji: "📄"
  },
  {
    title: "Ranking Extrato",
    url: "/extrato-ranking",
    icon: TrendingUp,
    description: "Ranking por Saldo",
    emoji: "🏆"
  },
  {
    title: "Faturas",
    url: "/faturas",
    icon: CreditCard,
    description: "Faturas Cartão",
    emoji: "💳"
  },
  {
    title: "Extrato Cartão Crédito",
    url: "/extrato-cartao-credito",
    icon: CreditCard,
    description: "Transações Cartão Crédito",
    emoji: "🏦"
  },
  {
    title: "Cadastral V3",
    url: "/cadastral-v3",
    icon: FileText,
    description: "Cadastral Completa",
    emoji: "📋"
  }
];

const fgtsItems: NavItem[] = [
  {
    title: "Funil",
    url: "/funil",
    icon: TrendingDown,
    description: "Funil de Conversão",
    emoji: "🔀"
  },
  {
    title: "Propostas",
    url: "/propostas",
    icon: FileText,
    description: "Gestão de Propostas",
    emoji: "📝"
  }
];

const comparativoNavItems: NavItem[] = [];

const averbadoraItems: NavItem[] = [
  {
    title: "Match Averbadora",
    url: "/match-averbadora",
    icon: GitCompare,
    description: "Análise de Matches por Região",
    emoji: "🔗"
  }
];

const financialNavItems: NavItem[] = [
  {
    title: "Fechamento Mês",
    url: "/admin/fechamento-mes",
    icon: PieChart,
    description: "Análise Financeira Mensal",
    emoji: "💰"
  },
  {
    title: "AI Intelligence",
    url: "/admin/ai-insights",
    icon: Sparkles,
    description: "Histórico de Análises IA",
    emoji: "🧠"
  },
  {
    title: "Auto-Alerts",
    url: "/admin/auto-alerts",
    icon: Bell,
    description: "Monitoramento Automático",
    emoji: "🚨"
  }
];

const productionNavItems: NavItem[] = [
  {
    title: "Backoffice",
    url: "/backoffice",
    icon: Shield,
    description: "Dashboard Admin",
    emoji: "⚙️"
  },
  {
    title: "Monitoramento DBA",
    url: "/admin/monitoring",
    icon: Activity,
    description: "Métricas e Requisições",
    emoji: "�"
  },
  {
    title: "Licitações",
    url: "/licitacoes",
    icon: FileText,
    description: "Gestão de Licitações",
    emoji: "🎯"
  },
  {
    title: "Licitações V2",
    url: "/licitacoes-v2",
    icon: FileText,
    description: "Licitações (IUGU Backend)",
    emoji: "✨"
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
  color?: "gold" | "blue" | "green" | "purple" | "red"
}

const colorMap = {
  gold: "from-[#C48A3F]/18 to-[#C48A3F]/8 border-[#C48A3F]/35 text-[#C48A3F] hover:from-[#C48A3F]/25 hover:to-[#C48A3F]/12",
  blue: "from-[#C48A3F]/18 to-[#C48A3F]/8 border-[#C48A3F]/35 text-[#C48A3F] hover:from-[#C48A3F]/25 hover:to-[#C48A3F]/12",
  green: "from-[#C48A3F]/18 to-[#C48A3F]/8 border-[#C48A3F]/35 text-[#C48A3F] hover:from-[#C48A3F]/25 hover:to-[#C48A3F]/12",
  purple: "from-[#C48A3F]/18 to-[#C48A3F]/8 border-[#C48A3F]/35 text-[#C48A3F] hover:from-[#C48A3F]/25 hover:to-[#C48A3F]/12",
  red: "from-[#C48A3F]/18 to-[#C48A3F]/8 border-[#C48A3F]/35 text-[#C48A3F] hover:from-[#C48A3F]/25 hover:to-[#C48A3F]/12"
}

const sectionEmojis: Record<string, string> = {
  "Principal": "🏠",
  "Treynor": "📚",
  "EM": "💼",
  "Delta Global Bank": "🏦",
  "FGTS": "💰",
  "Averbadora": "🔗",
  "Financeiro": "💰",
  "Administração": "⚙️"
}

const sectionColors: Record<string, "gold" | "blue" | "green" | "purple" | "red"> = {
  "Principal": "gold",
  "Treynor": "blue",
  "EM": "purple",
  "Delta Global Bank": "green",
  "FGTS": "red",
  "Averbadora": "blue",
  "Financeiro": "gold",
  "Administração": "purple"
}

function CollapsibleNavSection({ title, items, defaultOpen = true, color = "gold" }: CollapsibleNavSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  const activeCount = items.filter(item => location.pathname === item.url).length;

  return (
    <div className="mb-6 px-2 group">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
          "bg-gradient-to-r border relative overflow-hidden",
          "hover:scale-105 active:scale-95",
          colorMap[sectionColors[title] || "gold"],
          isOpen && "ring-2 ring-offset-2 ring-offset-[#06162B] ring-[#C48A3F]/40 shadow-lg shadow-[#C48A3F]/20",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#C48A3F]/0 before:via-[#C48A3F]/15 before:to-[#C48A3F]/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
        )}
      >
        <div className="flex items-center gap-2 relative z-10">
          <span className="text-lg transform transition-transform duration-300 group-hover:scale-125">
            {sectionEmojis[title] || "📌"}
          </span>
          <span className="text-[#C48A3F]">
            {title}
          </span>
          {activeCount > 0 && (
            <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#C48A3F]/20 text-[#C48A3F] border-[#C48A3F]/40 animate-pulse">
              {activeCount}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-all duration-500 font-bold transform relative z-10 text-[#C48A3F]",
            isOpen ? "rotate-0 scale-110" : "-rotate-90 scale-100",
            isHovered && "text-[#C48A3F] drop-shadow-lg"
          )}
        />
      </button>

      {/* Expandable Content with Advanced Animations */}
      <AnimatePresence>
        {isOpen && (
          <div className="space-y-3 mt-4 pl-1 overflow-hidden">
            {items.map((item, index) => {
              const isActive = location.pathname === item.url;
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className={({ isActive: linkActive }) => cn(
                    "group/item relative flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-300",
                    "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-gradient-to-b before:from-[#C48A3F] before:to-[#C48A3F]/40 before:rounded-full",
                    linkActive && "before:w-1 before:from-[#C48A3F] before:to-[#C48A3F]/30 pl-4",
                    linkActive
                      ? "bg-gradient-to-r from-[#C48A3F]/15 via-[#C48A3F]/10 to-[#C48A3F]/5 border-l-2 border-[#C48A3F]/40 shadow-md backdrop-blur-sm hover:shadow-lg hover:from-[#C48A3F]/20"
                      : "hover:bg-gradient-to-r hover:from-white/5 hover:via-white/3 hover:to-transparent border-l-2 border-transparent hover:border-white/20 hover:pl-4"
                  )}
                >
                  {/* Animated Dot */}
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 transition-all duration-300">
                    {isActive ? (
                      <>
                        <div className="h-2 w-2 bg-[#C48A3F] rounded-full animate-bounce" />
                        <div className="absolute inset-0 h-2 w-2 bg-[#C48A3F] rounded-full animate-pulse opacity-50" />
                      </>
                    ) : (
                      <div className="h-1.5 w-1.5 bg-white/30 rounded-full opacity-50 group-hover/item:opacity-100" />
                    )}
                  </div>

                  {/* Icon & Content */}
                  <div className="flex-1 min-w-0 transform transition-all duration-300 group-hover/item:translate-x-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg flex-shrink-0 transform transition-transform duration-300 group-hover/item:scale-125 group-hover/item:rotate-12">
                        {item.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold text-sm transition-all duration-300",
                            isActive ? "text-[#C48A3F] font-bold text-base" : "text-white/70 group-hover/item:text-white"
                          )}>
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-1 group-hover/item:text-white/60 transition-colors">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Icon - Active Indicator */}
                  {isActive && (
                    <div className="flex-shrink-0 ml-2 transform transition-transform duration-300 animate-spin">
                      <Zap className="h-4 w-4 text-[#C48A3F]" />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const { isMinimized: isCollapsed, setIsMinimized: setIsCollapsed } = useSidebarContext();
  const [mouseEnter, setMouseEnter] = useState(false);
  const location = useLocation();

  return (
    <motion.aside 
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      onMouseEnter={() => setMouseEnter(true)}
      onMouseLeave={() => setMouseEnter(false)}
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-[#06162B] via-[#0a1f38] to-[#051529] border-r border-[#C48A3F]/20 flex flex-col shadow-xl",
        "transition-all duration-200 ease-in-out will-change-[width]",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Premium Header */}
      <div className="relative p-4 border-b border-[#C48A3F]/15 bg-gradient-to-r from-[#C48A3F]/8 via-[#C48A3F]/3 to-transparent overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#C48A3F]/5 to-transparent opacity-50" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo with Glow */}
            <motion.div 
              className="relative"
              animate={{ scale: mouseEnter ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-primary to-primary-hover rounded-lg blur-lg opacity-50"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            <motion.div 
              className="relative w-10 h-10 bg-gradient-to-br from-[#C48A3F] to-[#B8793A] rounded-lg flex items-center justify-center shadow-lg border border-[#C48A3F]/50"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[#06162B] font-bold text-lg">Δ</span>
            </motion.div>
            </motion.div>

            {!isCollapsed && (
              <motion.div 
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="font-bold text-white truncate text-sm">Delta Navigator</h2>
                <p className="text-xs text-[#C48A3F]/70 truncate">🚀 v2.1.0</p>
              </motion.div>
            )}
          </div>

          {/* Collapse Toggle */}
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 rounded-lg hover:bg-[#C48A3F]/10 transition-all duration-200 text-[#C48A3F]/60 hover:text-[#C48A3F]"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </motion.button>
        </div>
      </div>

      {/* Main Navigation */}
      <motion.div 
        className={cn(
          "flex-1 overflow-y-auto py-6 px-3 space-y-6 scroll-smooth"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {!isCollapsed ? (
          <>
            <CollapsibleNavSection title="Principal" items={mainNavItems} defaultOpen={true} color="gold" />
            <CollapsibleNavSection title="Treynor" items={treynoItems} defaultOpen={false} color="blue" />
            <CollapsibleNavSection title="EM" items={emModuleItems} defaultOpen={false} color="purple" />
            <CollapsibleNavSection title="Delta Global Bank" items={deltaGlobalBankItems} defaultOpen={true} color="green" />
            <CollapsibleNavSection title="FGTS" items={fgtsItems} defaultOpen={true} color="red" />
            <CollapsibleNavSection title="Averbadora" items={averbadoraItems} defaultOpen={true} color="blue" />
            <CollapsibleNavSection title="Financeiro" items={financialNavItems} defaultOpen={false} color="gold" />
            <CollapsibleNavSection title="Administração" items={productionNavItems} defaultOpen={false} color="purple" />
          </>
        ) : (
          // Collapsed View - Icons Only
          <div className="space-y-3">
            {[mainNavItems, treynoItems, emModuleItems, deltaGlobalBankItems, fgtsItems, financialNavItems, productionNavItems].map((section, idx) =>
              section.map(item => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  title={item.title}
                  className={({ isActive }) => cn(
                    "flex items-center justify-center h-10 rounded-lg transition-all duration-300 relative group",
                    isActive
                      ? "bg-[#C48A3F]/20 text-[#C48A3F] shadow-lg border border-[#C48A3F]/30"
                      : "text-white/60 hover:bg-[#C48A3F]/10 hover:text-[#C48A3F]/80"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span className="text-lg">{item.emoji}</span>
                      {/* Tooltip on Hover */}
                      <div className="absolute left-16 bg-[#06162B] text-[#C48A3F] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg border border-[#C48A3F]/20">
                        {item.title}
                      </div>
                    </>
                  )}
                </NavLink>
              ))
            )}
          </div>
        )}
      </motion.div>

      {/* Premium Footer */}
      {!isCollapsed && (
        <motion.div 
          className="p-4 border-t border-[#C48A3F]/15 bg-gradient-to-t from-[#C48A3F]/5 via-[#C48A3F]/2 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="space-y-3">
            {/* Stats */}
            <motion.div className="grid grid-cols-3 gap-2 text-center text-xs">
              <motion.div 
                className="bg-[#C48A3F]/10 rounded-lg p-2 border border-[#C48A3F]/25"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="font-bold text-[#C48A3F]">23</div>
                <div className="text-white/60">Telas</div>
              </motion.div>
              <motion.div 
                className="bg-[#06162B]/50 rounded-lg p-2 border border-[#C48A3F]/15"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="font-bold text-[#C48A3F]/80">50+</div>
                <div className="text-white/60">Componentes</div>
              </motion.div>
              <motion.div 
                className="bg-[#C48A3F]/8 rounded-lg p-2 border border-[#C48A3F]/20"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="font-bold text-[#C48A3F]">100%</div>
                <div className="text-white/60">Online</div>
              </motion.div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                size="sm"
                className="w-full gap-2 bg-gradient-to-r from-[#C48A3F]/12 to-[#C48A3F]/5 border-[#C48A3F]/30 hover:from-[#C48A3F]/18 hover:to-[#C48A3F]/8 text-[#C48A3F] text-xs font-semibold cursor-pointer hover:text-[#C48A3F]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Explorar Dashboard
              </Button>
            </motion.div>

            {/* Footer Text */}
            <p className="text-xs text-center text-white/50">
              © 2024 <span className="font-semibold text-[#C48A3F]">Delta Global</span>
            </p>
          </div>
        </motion.div>
      )}
    </motion.aside>
  )
}