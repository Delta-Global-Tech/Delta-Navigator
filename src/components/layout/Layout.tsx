import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { useSidebarContext } from "@/contexts/SidebarContext"
import { usePageTracking } from "@/hooks/usePageTracking"
import { RequestNotifications } from "@/components/RequestNotifications"

interface LayoutProps {
  children: React.ReactNode
  lastSync?: string
  isRefreshing?: boolean
}

export function Layout({ children, lastSync, isRefreshing }: LayoutProps) {
  const { isMinimized } = useSidebarContext();
  usePageTracking(); // Rastrear mudanças de página para o AdminMonitoring

  // Memoiza para evitar recalcular a cada render
  const marginClass = useMemo(() => 
    isMinimized ? "md:ml-20" : "md:ml-72"
  , [isMinimized]);

  const contentClassName = useMemo(() => cn(
    "flex flex-col min-h-screen will-change-[margin-left]",
    marginClass,
    // Transição otimizada: 200ms em vez de 300ms para melhor performance
    "transition-[margin-left] duration-200 ease-in-out"
  ), [marginClass]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className={contentClassName}>
        <Header lastSync={lastSync} isRefreshing={isRefreshing} />
        <main className="flex-1 overflow-auto flex flex-col will-change-auto">
          {children}
        </main>
      </div>
      <RequestNotifications />
    </div>
  )
}