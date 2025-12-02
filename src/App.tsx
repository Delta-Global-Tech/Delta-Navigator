import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { SyncProvider, useSync } from "@/providers/sync-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { GamificationProvider } from "@/components/gamification";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { Layout } from "@/components/layout/Layout";
import GlobalAIChat from "@/components/layout/GlobalAIChat";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { initializeRequestMonitoring } from "@/services/requestMonitoring";
import { testInterception } from "@/utils/testInterception";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { supabase } from "@/data/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { UsersManager } from "./pages/admin/UsersManager";
import { PermissionsManager } from "./pages/admin/PermissionsManager";
import AuditLog from "./pages/AuditLog";
import ProducaoAnalyticsSimple from "./pages/ProducaoAnalyticsSimple";
import ProducaoNovo from "./pages/ProducaoNovo";
import ProducaoCompra from "./pages/ProducaoCompra";
import Funil from "./pages/Funil";
import Propostas from "./pages/Propostas";
import PropostasAbertura from "./pages/PropostasAbertura";
import Statement from './pages/Statement';
import ContasCorrentes from './pages/ContasCorrentes';
import SaldoContaCorrente from './pages/SaldoContaCorrente';
import Faturas from './pages/Faturas';
import ExtratoCartaoCredito from './pages/ExtratoCartaoCredito';
import NotFound from "./pages/NotFound";
import ExtratoRanking from "./pages/ExtratoRanking";
import NetworkTest from "./pages/NetworkTest";
import ADesembolsar from "./pages/ADesembolsar";
import Desembolso from "./pages/Desembolso";
import Licitacoes from "./pages/Licitacoes";
import LicitacoesV2 from "./pages/LicitacoesV2";
import ComparativoDesembolso from "./pages/ComparativoDesembolso";
import ComparativoPorContrato from "./pages/ComparativoPorContrato";
import Cadastral from "./pages/Cadastral";
import CadastralV2 from "./pages/CadastralV2";
import CadastralV3 from "./pages/CadastralV3";
import BackofficeDeltatype from "./pages/BackofficeDeltatype";
import PosicaoContratosCompleta from "./pages/PosicaoContratosCompleta";
import AdminMonitoring from "./pages/AdminMonitoring";
import FechamentoMes from "./pages/admin/FechamentoMes";
import AIInsights from "./pages/admin/AIInsights";
import AutoAlerts from "./pages/admin/AutoAlerts";
import MatchAverbadora from "./pages/MatchAverbadora";
import TeamPerformance from "./pages/TeamPerformance";

// Inicializar o serviço de monitoramento global
initializeRequestMonitoring();

// Listener global para processar recovery tokens do Supabase
const setupAuthListener = () => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth event:', event);
    if (event === 'PASSWORD_RECOVERY' && session) {
      console.log('✅ Recovery token detectado - Redirecionando para reset-password');
      // O React Router já deve estar em /reset-password, Supabase completará a validação
    }
  });
  return subscription;
};

const queryClient = new QueryClient();

function AppContent() {
  const { lastSync, isRefreshing } = useSync();

  // Setup de listener para eventos de autenticação (recovery, etc)
  useEffect(() => {
    const subscription = setupAuthListener();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas (sem proteção) */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        
        {/* Rotas protegidas */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout lastSync={lastSync} isRefreshing={isRefreshing}>
              <Routes>
            <Route path="/" element={
              <PermissionRoute screenId="093d8178-f801-4db4-951d-c3eb1d42439b">
                <Dashboard />
              </PermissionRoute>
            } />
            <Route path="/producao/analytics" element={
              <PermissionRoute screenId="a8f109b6-ab42-4e0a-8f65-f2c8485c7199">
                <ProducaoAnalyticsSimple />
              </PermissionRoute>
            } />
            <Route path="/producao-novo" element={
              <PermissionRoute screenId="52719b49-719f-4941-b43d-d2f7d0c293b8">
                <ProducaoNovo />
              </PermissionRoute>
            } />
            <Route path="/producao-compra" element={
              <PermissionRoute screenId="5eed3e8b-858e-419a-ab55-e10b14b0558b">
                <ProducaoCompra />
              </PermissionRoute>
            } />
            <Route path="/funil" element={
              <PermissionRoute screenId="a386495d-34a5-4ee4-8a5e-f74fab465469">
                <Funil />
              </PermissionRoute>
            } />
            <Route path="/propostas" element={
              <PermissionRoute screenId="0a961e52-c460-4e54-bf5e-7cc2c66d5403">
                <Propostas />
              </PermissionRoute>
            } />
            <Route path="/propostas-abertura" element={
              <PermissionRoute screenId="9e53eb28-809d-47e8-8a40-503b72374537">
                <PropostasAbertura />
              </PermissionRoute>
            } />
            <Route path="/extrato" element={
              <PermissionRoute screenId="7c551f45-d522-4243-8bdd-9b5c2e032535">
                <Statement />
              </PermissionRoute>
            } />
            <Route path="/contas-correntes" element={
              <PermissionRoute screenId="7c551f45-d522-4243-8bdd-9b5c2e032535">
                <ContasCorrentes />
              </PermissionRoute>
            } />
            <Route path="/saldo-conta-corrente" element={
              <PermissionRoute screenId="7c551f45-d522-4243-8bdd-9b5c2e032535">
                <SaldoContaCorrente />
              </PermissionRoute>
            } />
            <Route path="/extrato-ranking" element={
              <PermissionRoute screenId="32151c8b-b961-4d51-8b1e-c0ed895fa988">
                <ExtratoRanking />
              </PermissionRoute>
            } />
            <Route path="/faturas" element={
              <PermissionRoute screenId="de735972-0368-48c2-8839-bdf4ea89e45b">
                <Faturas />
              </PermissionRoute>
            } />
            <Route path="/extrato-cartao-credito" element={
              <PermissionRoute screenId="de735972-0368-48c2-8839-bdf4ea89e45b">
                <ExtratoCartaoCredito />
              </PermissionRoute>
            } />
            <Route path="/a-desembolsar" element={
              <PermissionRoute screenId="9ccd37ac-fc88-4d90-9108-b3032b387d0b">
                <ADesembolsar />
              </PermissionRoute>
            } />
            <Route path="/desembolso" element={
              <PermissionRoute screenId="48cd1ba8-639e-4cf4-9dca-74cacd336da0">
                <Desembolso />
              </PermissionRoute>
            } />
            <Route path="/licitacoes" element={
              <PermissionRoute screenId="fec477cc-59cc-4bb5-85c7-ac333b1b0669">
                <Licitacoes />
              </PermissionRoute>
            } />
            <Route path="/licitacoes-v2" element={
              <PermissionRoute screenId="3d0edc45-7b1b-4633-9ab4-185da1f6eef6">
                <LicitacoesV2 />
              </PermissionRoute>
            } />
            <Route path="/comparativo-desembolso" element={
              <PermissionRoute screenId="8e80be1e-293b-4324-acdf-448f15aedc3a">
                <ComparativoDesembolso />
              </PermissionRoute>
            } />
            <Route path="/comparativo-contrato" element={
              <PermissionRoute screenId="0eb7b05b-099e-486e-b2b7-37a44ec29b8b">
                <ComparativoPorContrato />
              </PermissionRoute>
            } />
            <Route path="/posicao-contratos" element={
              <PermissionRoute screenId="f38aa3ec-7fa4-4248-ad44-d649a558b371">
                <PosicaoContratosCompleta />
              </PermissionRoute>
            } />
            <Route path="/cadastral" element={
              <PermissionRoute screenId="50ca95cd-4828-423a-9634-78bc35df0624">
                <Cadastral />
              </PermissionRoute>
            } />
            <Route path="/cadastral-v2" element={
              <PermissionRoute screenId="1eb74ccf-b49e-43b0-9483-e7d6b11a0cb3">
                <CadastralV2 />
              </PermissionRoute>
            } />
            <Route path="/cadastral-v3" element={
              <PermissionRoute screenId="73f52ca4-fbca-4dde-b40e-d606903ac8d1">
                <CadastralV3 />
              </PermissionRoute>
            } />
            <Route path="/backoffice" element={
              <PermissionRoute screenId="10c387f7-0ebf-4953-a64b-9cec3163e398">
                <BackofficeDeltatype />
              </PermissionRoute>
            } />
            <Route path="/network-test" element={
              <PermissionRoute screenId="6dc6d33e-753d-4be2-a880-a466fd2d0389">
                <NetworkTest />
              </PermissionRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <PermissionRoute screenId="505f1b9a-e68b-4167-b56a-298cd2543f09">
                <UsersManager />
              </PermissionRoute>
            } />
            <Route path="/admin/permissions" element={
              <PermissionRoute screenId="a8e4700f-e153-46bb-82ac-ec961511cbd7">
                <PermissionsManager />
              </PermissionRoute>
            } />
            <Route path="/admin/monitoring" element={
              <PermissionRoute screenId="a8e4700f-e153-46bb-82ac-ec961511cbd7">
                <AdminMonitoring />
              </PermissionRoute>
            } />
            <Route path="/admin/fechamento-mes" element={
              <PermissionRoute screenId="a8e4700f-e153-46bb-82ac-ec961511cbd7">
                <FechamentoMes />
              </PermissionRoute>
            } />
            <Route path="/admin/ai-insights" element={
              <PermissionRoute screenId="a8e4700f-e153-46bb-82ac-ec961511cbd7">
                <AIInsights />
              </PermissionRoute>
            } />
            <Route path="/admin/auto-alerts" element={
              <PermissionRoute screenId="a8e4700f-e153-46bb-82ac-ec961511cbd7">
                <AutoAlerts />
              </PermissionRoute>
            } />
            <Route path="/admin/audit-logs" element={
              <PermissionRoute screenId="a8e4700f-e153-46bb-82ac-ec961511cbd7">
                <AuditLog />
              </PermissionRoute>
            } />
            <Route path="/match-averbadora" element={
              <PermissionRoute screenId="7f8c9d0a-1b2c-3d4e-5f6a-7b8c9d0a1b2c">
                <MatchAverbadora />
              </PermissionRoute>
            } />
            <Route path="/treynor/performance" element={
              <PermissionRoute screenId="a8f109b6-ab42-4e0a-8f65-f2c8485c7199">
                <TeamPerformance />
              </PermissionRoute>
            } />
            <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
      {/* Global AI Chat - aparece em todas as páginas */}
      <GlobalAIChat />
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SyncProvider>
        <SidebarProvider>
          <GamificationProvider>
            <ThemeProvider defaultTheme="dark" storageKey="delta-theme">
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </TooltipProvider>
            </ThemeProvider>
          </GamificationProvider>
        </SidebarProvider>
      </SyncProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
