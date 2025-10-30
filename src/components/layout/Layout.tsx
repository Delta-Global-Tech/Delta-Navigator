import { Header } from "./Header"
import { SidebarEnhanced } from "./SidebarEnhanced"
import { useSidebarContext } from "@/contexts/SidebarContext"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface LayoutProps {
  children: React.ReactNode
  lastSync?: string
  isRefreshing?: boolean
}

export function Layout({ children, lastSync, isRefreshing }: LayoutProps) {
  const { isMinimized } = useSidebarContext();

  // Memoize className para evitar recálculos
  const contentClassName = useMemo(() => cn(
    "transition-[margin-left] duration-300 ease-in-out flex flex-col min-h-screen",
    isMinimized ? "md:ml-20" : "md:ml-64"
  ), [isMinimized]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SidebarEnhanced />
      <div className={contentClassName}>
        <Header lastSync={lastSync} isRefreshing={isRefreshing} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}