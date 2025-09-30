import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { CreditCard, AlertTriangle, CheckCircle, Clock, DollarSign, Users, Calendar, Search, Filter, Download, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getFaturasData, FaturaData, FaturasSummary } from '@/data/faturasApi';
import { useSync } from '@/providers/sync-provider';
import * as XLSX from 'xlsx';

const Faturas = () => {
  const { updateSync, setRefreshing } = useSync()
  
  // Estados para filtros (inputs não aplicados)
  const [inputPersonalDocument, setInputPersonalDocument] = useState('');
  const [inputStatus, setInputStatus] = useState('todos');
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  
  // Estados para filtros aplicados
  const [personalDocument, setPersonalDocument] = useState('');
  const [status, setStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para ordenação da tabela
  const [sortBy, setSortBy] = useState('fechamento'); // 'balance' ou 'fechamento'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' ou 'desc'

  // Função para aplicar os filtros
  const handleApplyFilters = () => {
    setPersonalDocument(inputPersonalDocument);
    setStatus(inputStatus);
    setSearchTerm(inputSearchTerm);
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setInputPersonalDocument('');
    setInputStatus('todos');
    setInputSearchTerm('');
    setPersonalDocument('');
    setStatus('todos');
    setSearchTerm('');
  };

  // Função para aplicar filtros ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Função para ordenar faturas
  const sortFaturas = (faturas: FaturaData[]) => {
    if (!faturas || faturas.length === 0) return faturas;
    
    return [...faturas].sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'balance') {
        aValue = Number(a.balance || 0);
        bValue = Number(b.balance || 0);
      } else if (sortBy === 'fechamento') {
        aValue = new Date(a.fechamento || '1970-01-01');
        bValue = new Date(b.fechamento || '1970-01-01');
      } else if (sortBy === 'vencimento') {
        aValue = new Date(a.vencimento || '1970-01-01');
        bValue = new Date(b.vencimento || '1970-01-01');
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Query para buscar dados das faturas
  const { data: faturasResponse, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['faturas', personalDocument, status],
    queryFn: () => getFaturasData(personalDocument, status),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true, // Continua atualizando mesmo quando a aba não está ativa
    staleTime: 0, // Considera os dados sempre obsoletos para garantir atualizações
  });

  // Atualizar sync quando dados chegarem
  useEffect(() => {
    if (faturasResponse) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[FATURAS] Atualizando sync para:', timestamp);
      updateSync(timestamp);
    }
  }, [faturasResponse, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(isFetching);
  }, [isFetching, setRefreshing]);

  const faturasData = faturasResponse?.data || [];
  const faturasSummary = faturasResponse?.summary || {
    totalFaturas: 0,
    valorTotal: 0,
    valorMedio: 0,
    clientesUnicos: 0,
    emAberto: 0,
    vencidas: 0,
    pagas: 0,
    valorEmAberto: 0,
    valorVencido: 0,
    valorPago: 0,
  };

  // Filtrar e ordenar dados localmente
  const filteredData = useMemo(() => {
    const filtered = faturasData.filter(item => {
      const matchesSearch = item.personal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.personal_document.includes(searchTerm) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.statement_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    return sortFaturas(filtered);
  }, [faturasData, searchTerm, sortBy, sortOrder]);

  // Preparar dados para gráfico de status
  const statusChartData = useMemo(() => {
    const statusCount = {
      'Em Aberto': faturasSummary.emAberto,
      'Vencidas': faturasSummary.vencidas,
      'Pagas': faturasSummary.pagas,
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      valor: status === 'Em Aberto' ? faturasSummary.valorEmAberto :
             status === 'Vencidas' ? faturasSummary.valorVencido :
             faturasSummary.valorPago
    }));
  }, [faturasSummary]);

  // Cores para o gráfico de status
  const COLORS = {
    'Em Aberto': '#eab308', // amarelo mais visível
    'Vencidas': '#dc2626',  // vermelho mais intenso
    'Pagas': '#16a34a',     // verde mais intenso
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return '-';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'em aberto':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencida':
      case 'vencidas':
        return 'bg-red-100 text-red-800';
      case 'paga':
      case 'pagas':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    // Preparar dados para o Excel
    const excelData = filteredData.map((fatura, index) => ({
      '#': index + 1,
      'Nome': fatura.personal_name,
      'Documento': fatura.personal_document,
      'Email': fatura.email,
      'ID Fatura': fatura.statement_id,
      'Tipo': fatura.kind,
      'Valor Fatura': fatura.balance,
      'Fechamento': formatDate(fatura.fechamento),
      'Vencimento': formatDate(fatura.vencimento),
      'Status': fatura.status
    }));

    // Criar worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Criar workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturas');
    
    // Gerar nome do arquivo com timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `faturas_${timestamp}.xlsx`;
    
    // Salvar arquivo
    XLSX.writeFile(workbook, fileName);
    
    console.log('Faturas exportadas para:', fileName);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Carregando faturas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-red-600">Erro ao carregar faturas</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-blue-600" />
          Faturas de Cartão de Crédito
          {isFetching && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          )}
        </h1>
        <div className="flex items-center gap-2">

        </div>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documento">CPF/CNPJ</Label>
              <Input
                id="documento"
                placeholder="Digite o documento..."
                value={inputPersonalDocument}
                onChange={(e) => setInputPersonalDocument(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={inputStatus} onValueChange={setInputStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Em Aberto">Em Aberto</SelectItem>
                  <SelectItem value="Vencida">Vencidas</SelectItem>
                  <SelectItem value="Paga">Pagas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="busca">Busca Geral</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="busca"
                  placeholder="Buscar por nome, email..."
                  className="pl-10"
                  value={inputSearchTerm}
                  onChange={(e) => setInputSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={handleApplyFilters}
              variant="default"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Pesquisar
            </Button>
            {(personalDocument || status !== 'todos' || searchTerm) && (
              <Button
                onClick={limparFiltros}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faturasSummary.totalFaturas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {faturasSummary.clientesUnicos} clientes únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(faturasSummary.valorTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {formatCurrency(faturasSummary.valorMedio)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(faturasSummary.valorEmAberto)}
            </div>
            <p className="text-xs text-muted-foreground">
              {faturasSummary.emAberto} faturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(faturasSummary.valorVencido)}
            </div>
            <p className="text-xs text-muted-foreground">
              {faturasSummary.vencidas} faturas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Status */}
        <Card>
          <CardHeader>
            <CardTitle>Faturas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="status" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => {
                      // O gráfico de barras só mostra quantidade
                      return [value, 'Quantidade de Faturas'];
                    }}
                    labelFormatter={(label) => `Status: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#8884d8" 
                    name="Quantidade"
                    radius={[4, 4, 0, 0]}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Pizza - Valores por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="40%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Valor']} 
                    labelFormatter={(label) => `Status: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legenda customizada */}
            <div className="mt-4 flex flex-wrap justify-center gap-6">
              {statusChartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[entry.status as keyof typeof COLORS] }}
                  ></div>
                  <span className="text-sm font-medium">
                    {entry.status}: {formatCurrency(entry.valor)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Faturas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Faturas ({faturasSummary.totalFaturas})
            </CardTitle>
            <Button onClick={handleExport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>ID Fatura</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortBy === 'balance') {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy('balance');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Valor Fatura
                      {sortBy === 'balance' && (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                      {sortBy !== 'balance' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortBy === 'fechamento') {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy('fechamento');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Fechamento
                      {sortBy === 'fechamento' && (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                      {sortBy !== 'fechamento' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortBy === 'vencimento') {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy('vencimento');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Vencimento
                      {sortBy === 'vencimento' && (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                      {sortBy !== 'vencimento' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((fatura, index) => (
                  <TableRow key={`${fatura.account_id}-${index}`}>
                    <TableCell className="text-sm font-medium">
                      {fatura.personal_name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fatura.personal_document}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fatura.statement_id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fatura.kind}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(fatura.balance)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(fatura.fechamento)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(fatura.vencimento)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(fatura.status)}>
                        {fatura.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Faturas;
