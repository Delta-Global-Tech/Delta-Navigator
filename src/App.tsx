import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Aquisicao from "./pages/Aquisicao";
import ProducaoNovo from "./pages/ProducaoNovo";
import ProducaoCompra from "./pages/ProducaoCompra";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="delta-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/aquisicao" element={<Aquisicao />} />
              <Route path="/producao/novo" element={<ProducaoNovo />} />
              <Route path="/producao/compra" element={<ProducaoCompra />} />
              <Route path="/fila" element={<div className="p-6">Fila de Pagamento - Em desenvolvimento</div>} />
              <Route path="/paga" element={<div className="p-6">Produção Paga - Em desenvolvimento</div>} />
              <Route path="/explorar" element={<div className="p-6">Explorador - Em desenvolvimento</div>} />
              <Route path="/qualidade" element={<div className="p-6">Qualidade - Em desenvolvimento</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
