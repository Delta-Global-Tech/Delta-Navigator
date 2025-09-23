import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";
import { SyncProvider, useSync } from "@/providers/sync-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import ProducaoAnalyticsSimple from "./pages/ProducaoAnalyticsSimple";
import Funil from "./pages/Funil";
import Propostas from "./pages/Propostas";
import Statement from './pages/Statement';
import Faturas from './pages/Faturas';
import NotFound from "./pages/NotFound";
import ExtratoRanking from "./pages/ExtratoRanking";
import NetworkTest from "./pages/NetworkTest";

const queryClient = new QueryClient();

function AppContent() {
  const { lastSync, isRefreshing } = useSync();

  return (
    <BrowserRouter>
      <ProtectedRoute>
        <Layout lastSync={lastSync} isRefreshing={isRefreshing}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/producao/analytics" element={<ProducaoAnalyticsSimple />} />
            <Route path="/funil" element={<Funil />} />
            <Route path="/propostas" element={<Propostas />} />
            <Route path="/extrato" element={<Statement />} />
            <Route path="/extrato-ranking" element={<ExtratoRanking />} />
            <Route path="/faturas" element={<Faturas />} />
            <Route path="/network-test" element={<NetworkTest />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ProtectedRoute>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SyncProvider>
        <ThemeProvider defaultTheme="dark" storageKey="delta-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </SyncProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
