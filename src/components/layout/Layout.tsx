import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

interface LayoutProps {
  children: React.ReactNode
  lastSync?: string
  isRefreshing?: boolean
}

export function Layout({ children, lastSync, isRefreshing }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header lastSync={lastSync} isRefreshing={isRefreshing} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}