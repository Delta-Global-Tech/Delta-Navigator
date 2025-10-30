import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, CheckCircle, Clock, AlertCircle, TrendingUp, Download, RefreshCw, Search } from 'lucide-react';

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

export default function LicitacoesV2() {
  const [data, setData] = useState<BankSlip[]>([]);
  const [filteredData, setFilteredData] = useState<BankSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[LicitacoesV2] Iniciando fetch...');
        const response = await axios.get<ApiResponse>('http://192.168.8.149:3005/api/bank-slips');
        console.log('[LicitacoesV2] Dados recebidos:', response.data.count);
        setData(response.data.data);
        setFilteredData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('[LicitacoesV2] Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar dados
  useEffect(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(slip =>
        slip.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.processor_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(slip => slip.status?.toUpperCase() === statusFilter.toUpperCase());
    }

    setFilteredData(filtered);
  }, [searchTerm, statusFilter, data]);

  // Calcular KPIs
  const stats = {
    total_slips: data.length,
    paid_slips: data.filter(s => s.status?.toUpperCase() === 'PAID').length,
    pending_slips: data.filter(s => s.status?.toUpperCase() === 'PENDING' || s.status?.toUpperCase() === 'OPEN').length,
    canceled_slips: data.filter(s => s.status?.toUpperCase() === 'CANCELED').length,
    total_amount: data.reduce((sum, s) => sum + (s.amount || 0), 0),
    total_paid: data.filter(s => s.status?.toUpperCase() === 'PAID').reduce((sum, s) => sum + (s.paid_net_amount || 0), 0),
    total_fees: data.reduce((sum, s) => sum + (s.fee_amount || 0), 0),
    pending_amount: data.filter(s => s.status?.toUpperCase() !== 'PAID').reduce((sum, s) => sum + (s.amount || 0), 0),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'PAID': { color: 'bg-green-100 text-green-800 border-green-300', label: '✓ Pago' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '⏱ Pendente' },
      'OPEN': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '⏱ Aberto' },
      'CANCELED': { color: 'bg-red-100 text-red-800 border-red-300', label: '✕ Cancelado' },
      'EXPIRED': { color: 'bg-gray-100 text-gray-800 border-gray-300', label: '⚠ Expirado' },
      'OVERDUE': { color: 'bg-orange-100 text-orange-800 border-orange-300', label: '⚠ Atrasado' },
    };
    const normalized = status?.toUpperCase() || 'PENDING';
    const config = statusMap[normalized] || statusMap['PENDING'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const exportCSV = () => {
    const headers = ['Cliente', 'Tipo', 'Valor Total', 'Taxa', 'Valor Líquido', 'Status', 'Data Pagamento'];
    const rows = filteredData.map(s => [
      s.client_name,
      s.processor_type,
      s.amount.toFixed(2),
      s.fee_amount.toFixed(2),
      s.paid_net_amount.toFixed(2),
      s.status,
      s.paid_at || '-'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `licitacoes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Carregando dados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-red-600 font-bold">Erro:</p>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Licitações V2 - IUGU</h1>
            <p className="text-muted-foreground">Gestão de boletos bancários</p>
          </div>
          <Button onClick={exportCSV} size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Boletos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Boletos</p>
                  <p className="text-3xl font-bold">{stats.total_slips}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Registros totais</p>
            </CardContent>
          </Card>

          {/* Pagos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Boletos Pagos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.paid_slips}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
              <p className="text-xs text-green-600 mt-3">
                {stats.total_slips > 0 ? `${((stats.paid_slips / stats.total_slips) * 100).toFixed(1)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>

          {/* Pendentes */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending_slips}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
              <p className="text-xs text-yellow-600 mt-3">
                {formatCurrency(stats.pending_amount)}
              </p>
            </CardContent>
          </Card>

          {/* Cancelados */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cancelados</p>
                  <p className="text-3xl font-bold text-red-600">{stats.canceled_slips}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
              </div>
              <p className="text-xs text-red-600 mt-3">
                {stats.total_slips > 0 ? `${((stats.canceled_slips / stats.total_slips) * 100).toFixed(1)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Valores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valor Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Valor Pago */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valor Pago (Líquido)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_paid)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Total de Taxas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Taxas</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.total_fees)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-md border border-input bg-background text-foreground text-sm min-w-[200px]"
            >
              <option value="all">Todos os status</option>
              <option value="PAID">Pago</option>
              <option value="PENDING">Pendente</option>
              <option value="OPEN">Aberto</option>
              <option value="CANCELED">Cancelado</option>
            </select>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Boletos ({filteredData.length} de {data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum boleto encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Valor Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((slip, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{slip.client_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{slip.processor_type}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(slip.amount)}</TableCell>
                        <TableCell className="text-right text-orange-600 font-medium">{formatCurrency(slip.fee_amount)}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">{formatCurrency(slip.paid_net_amount)}</TableCell>
                        <TableCell>{getStatusBadge(slip.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(slip.paid_at)}</TableCell>
                      </TableRow>
                    ))}
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
