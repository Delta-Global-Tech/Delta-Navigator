import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePageXP } from '@/components/gamification';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaggeredContainer } from '@/components/motion/StaggeredContainer';
import {
  FileCheck,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Loader2
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';

// Types
interface BankSlip {
  client_name: string;
  processor_type: string;
  amount: number;
  paid_net_amount: number;
  fee_amount: number;
  status: string;
  paid_at: string | null;
}

interface ApiResponse {
  data: BankSlip[];
  count: number;
}

// Status configuration
const statusConfig: Record<string, { color: string; label: string; icon: React.ComponentType<any> }> = {
  'paid': { color: 'bg-green-100 text-green-800 border-green-300', label: 'Pago', icon: CheckCircle },
  'open': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Aberto', icon: Clock },
  'canceled': { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelado', icon: AlertCircle },
  'expired': { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Expirado', icon: AlertCircle },
  'overdue': { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Atrasado', icon: AlertCircle },
};

export default function Licitacoes() {
  // Gamification
  usePageXP('page_visit');
  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredSlips, setFilteredSlips] = useState<BankSlip[]>([]);

  // Fetch bank slips
  const {
    data: bankSlipsResponse,
    isLoading: loadingSlips,
    refetch: refetchSlips,
    error: errorSlips
  } = useQuery<ApiResponse>({
    queryKey: ['bank-slips'],
    queryFn: async () => {
      const url = getApiEndpoint('IUGU', '/api/bank-slips');
      const response = await axios.get<ApiResponse>(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const bankSlips = bankSlipsResponse?.data || [];

  // Calculate stats from bankSlips data
  const statsData = {
    total_count: bankSlips.length,
    paid_count: bankSlips.filter(slip => slip.status?.toLowerCase() === 'paid').length,
    open_count: bankSlips.filter(slip => slip.status?.toLowerCase() === 'open').length,
    canceled_count: bankSlips.filter(slip => slip.status?.toLowerCase() === 'canceled').length,
    total_amount: bankSlips.reduce((sum, slip) => sum + (slip.amount || 0), 0),
    total_paid_net: bankSlips.reduce((sum, slip) => sum + (slip.paid_net_amount || 0), 0),
    total_fees: bankSlips.reduce((sum, slip) => sum + (slip.fee_amount || 0), 0),
    avg_fee: bankSlips.length > 0 ? bankSlips.reduce((sum, slip) => sum + (slip.fee_amount || 0), 0) / bankSlips.length : 0,
  };

  // Filter logic
  useEffect(() => {
    let filtered = bankSlips;

    if (searchTerm) {
      filtered = filtered.filter(slip =>
        slip.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.processor_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(slip => slip.status?.toLowerCase() === statusFilter);
    }

    setFilteredSlips(filtered);
  }, [searchTerm, statusFilter, bankSlips]);

  // Utility functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const getStatusConfig = (status?: string) => {
    const normalizedStatus = status?.toLowerCase() || 'open';
    return statusConfig[normalizedStatus] || statusConfig['open'];
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Cliente', 'Tipo de Processador', 'Valor Total', 'Valor Líquido', 'Taxa', 'Status', 'Data de Pagamento'];
    const rows = filteredSlips.map(slip => [
      slip.client_name,
      slip.processor_type,
      slip.amount,
      slip.paid_net_amount,
      slip.fee_amount,
      statusConfig[slip.status?.toLowerCase() || 'open'].label,
      slip.paid_at || '-',
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `licitacoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Sucesso',
      description: `${filteredSlips.length} registros exportados com sucesso`,
    });
  };

  // Loading state
  if (loadingSlips) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando licitações...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <FileCheck className="h-6 w-6 text-accent" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Licitações</h1>
            </div>
            <p className="text-muted-foreground">
              Gestão e acompanhamento de boletos bancários (Sistema IUGU)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSlips()}
              disabled={loadingSlips}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={exportToCSV}
              disabled={filteredSlips.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {errorSlips && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Erro ao carregar dados</p>
                <p className="text-sm text-red-700">Não foi possível conectar ao servidor</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Grid */}
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total de Boletos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total de Boletos</span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{statsData?.total_count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Registros totais</p>
            </CardContent>
          </Card>

          {/* Valor Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Valor Total</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(statsData?.total_amount || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Valor bruto</p>
            </CardContent>
          </Card>

          {/* Valor Líquido */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Valor Líquido</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(statsData?.total_paid_net || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Após descontos</p>
            </CardContent>
          </Card>

          {/* Total de Taxas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total de Taxas</span>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(statsData?.total_fees || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Descontos aplicados</p>
            </CardContent>
          </Card>

          {/* Pagos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Pagos</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{statsData?.paid_count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statsData?.total_count ? `${((statsData.paid_count / statsData.total_count) * 100).toFixed(0)}% do total` : '0% do total'}
              </p>
            </CardContent>
          </Card>
        </StaggeredContainer>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                >
                  <option value="all">Todos os status</option>
                  <option value="paid">Pago</option>
                  <option value="open">Aberto</option>
                  <option value="canceled">Cancelado</option>
                  <option value="expired">Expirado</option>
                  <option value="overdue">Atrasado</option>
                </select>
              </div>
            </StaggeredContainer>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Boletos Bancários</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredSlips.length} de {bankSlips.length} registros
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSlips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum boleto encontrado com os filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo de Processador</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Valor Líquido</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlips.map((slip, idx) => {
                      const config = getStatusConfig(slip.status);
                      const StatusIcon = config.icon;

                      return (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{slip.client_name}</TableCell>
                          <TableCell>{slip.processor_type}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(slip.amount)}</TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">{formatCurrency(slip.paid_net_amount)}</TableCell>
                          <TableCell className="text-right text-orange-600">{formatCurrency(slip.fee_amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${config.color} border`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(slip.paid_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
