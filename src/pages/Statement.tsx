import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatementData, StatementItem, StatementSummary } from '@/data/statementApi';
import { TrendingUp, TrendingDown, DollarSign, Activity, Download, Filter, Search, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useExport } from '@/hooks/useExport';

export default function Statement() {
  // Estado para controle da última sincronização
  const [lastSync, setLastSync] = useState<string>('');
  // Estados para valores dos inputs (não aplicados ainda)
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');
  const [inputPersonalDocument, setInputPersonalDocument] = useState('');
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  
  // Estados para valores aplicados nos filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [personalDocument, setPersonalDocument] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChartDate, setSelectedChartDate] = useState<string>(''); // Data selecionada no gráfico

  // CSS para cursor pointer nas barras do gráfico
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .recharts-bar-rectangle {
        cursor: pointer !important;
      }
      .recharts-bar-rectangle:hover {
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Hook para exportação
  const { exportToPDF, exportToExcel } = useExport();

  // Query para buscar dados do extrato
  const { data: statementResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['statement', startDate, endDate, personalDocument],
    queryFn: () => getStatementData(
      startDate || undefined,
      endDate || undefined, 
      personalDocument || undefined
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Fallback: força o refetch manualmente a cada 30s com atualização sempre do sync
  useEffect(() => {
    const interval = setInterval(() => {
      refetch().then(() => {
        // Sempre atualiza o sync independente dos dados
        const now = new Date();
        const syncTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setLastSync(syncTime);
        if (typeof window !== 'undefined') {
          const syncValue = `${syncTime} (${Date.now()})`;
          (window as any).__LAST_SYNC_EXTRATO__ = syncValue;
          localStorage.setItem('ultimaSyncExtrato', syncValue);
          console.log('[SYNC] ultimaSyncExtrato atualizado:', syncValue);
          // Dispara evento customizado para atualizar Sidebar imediatamente
          window.dispatchEvent(new Event('ultimaSyncExtratoUpdate'));
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const statementData = statementResponse?.data || [];
  // Atualiza o lastSync sempre que os dados mudarem
  useEffect(() => {
    if (statementResponse) {
      const now = new Date();
      const syncTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setLastSync(syncTime);
      if (typeof window !== 'undefined') {
        const syncValue = `${syncTime} (${Date.now()})`;
        (window as any).__LAST_SYNC_EXTRATO__ = syncValue;
        localStorage.setItem('ultimaSyncExtrato', syncValue);
        console.log('[SYNC] ultimaSyncExtrato atualizado:', syncValue);
        // Dispara evento customizado para atualizar Sidebar imediatamente
        window.dispatchEvent(new Event('ultimaSyncExtratoUpdate'));
      }
    }
  }, [statementResponse]);
  // Exemplo de uso do lastSync:
  // <div>Última sync: {lastSync}</div>
  const statementSummary = statementResponse?.summary || {
    totalCredits: 0,
    totalDebits: 0,
    ticketMedio: 0,
    currentBalance: 0,
    previousBalance: 0,
    transactionCount: 0,
    period: { start: '', end: '' }
  };

  // Preparar dados para o gráfico de fluxo de caixa (dias com transações)
  const chartData = React.useMemo(() => {
    // Agrupar transações por data
    const transactionsByDate = new Map();
    
    statementData.forEach(item => {
      const transactionDate = item.transaction_date.split(' ')[0]; // DD/MM/YYYY
      const [day, month, year] = transactionDate.split('/');
      const dayMonth = `${day}/${month}`; // Formato DD/MM para exibição
      
      if (!transactionsByDate.has(dayMonth)) {
        transactionsByDate.set(dayMonth, {
          credits: [],
          debits: []
        });
      }
      
      if (item.type === 'credit') {
        transactionsByDate.get(dayMonth).credits.push(item);
      } else if (item.type === 'debit') {
        transactionsByDate.get(dayMonth).debits.push(item);
      }
    });
    
    // Converter para array e calcular totais
    const chartArray = Array.from(transactionsByDate.entries()).map(([dayMonth, transactions]) => {
      const creditsCount = transactions.credits.length;
      const debitsCount = transactions.debits.length;
      const creditsValue = transactions.credits.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      const debitsValue = transactions.debits.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      
      return {
        day: dayMonth,
        entradas: creditsCount,
        saidas: debitsCount,
        entradasValor: creditsValue,
        saidasValor: debitsValue,
        hasTransactions: creditsCount > 0 || debitsCount > 0
      };
    });
    
    // Ordenar por data (assumindo que são do mesmo ano)
    chartArray.sort((a, b) => {
      const [dayA, monthA] = a.day.split('/').map(Number);
      const [dayB, monthB] = b.day.split('/').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });
    
    // Retornar apenas os últimos 30 dias com dados
    return chartArray.slice(-30);
  }, [statementData]);

  // Handler para clique nas barras do gráfico
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedDay = data.activePayload[0].payload.day;
      // Converter DD/MM para formato de data completo do ano atual
      const [day, month] = clickedDay.split('/');
      const currentYear = new Date().getFullYear();
      const selectedDate = `${day}/${month}/${currentYear}`;
      
      // Toggle: se já está filtrado pela mesma data, remove o filtro
      if (selectedChartDate === selectedDate) {
        setSelectedChartDate('');
      } else {
        setSelectedChartDate(selectedDate);
      }
    }
  };

  // Função para aplicar os filtros quando o botão for clicado
  const handleApplyFilters = () => {
    setStartDate(inputStartDate);
    setEndDate(inputEndDate);
    setPersonalDocument(inputPersonalDocument);
    setSearchTerm(inputSearchTerm);
  };

  // Função para aplicar filtros ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Filtro local por termo de busca e data do gráfico
  const filteredData = statementData.filter(item => {
    // Filtro por texto
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.personal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.beneficiario?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por data selecionada no gráfico
    const matchesChartDate = selectedChartDate ? 
      item.transaction_date.startsWith(selectedChartDate) : true;
    
    return matchesSearch && matchesChartDate;
  });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Função customizada para o tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{`Dia ${label}`}</p>
          <div className="space-y-1 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm">Entradas: {data.entradas} transações</span>
            </div>
            <div className="text-sm text-muted-foreground ml-5">
              Valor: {formatCurrency(data.entradasValor)}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm">Saídas: {data.saidas} transações</span>
            </div>
            <div className="text-sm text-muted-foreground ml-5">
              Valor: {formatCurrency(data.saidasValor)}
            </div>
          </div>
        </div>
      );
    }
    return null;
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

  const handleExport = () => {
    console.log('Exportando extrato...');
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-600 text-white';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ativo') || statusLower.includes('concluído') || statusLower.includes('finalizado')) {
      return 'bg-green-600 text-white';
    } else if (statusLower.includes('pendente') || statusLower.includes('processando')) {
      return 'bg-yellow-600 text-white';
    } else if (statusLower.includes('cancelado') || statusLower.includes('erro')) {
      return 'bg-red-600 text-white';
    }
    return 'bg-gray-600 text-white';
  };

  const getStatusText = (status: string) => {
    if (!status) return 'N/A';
    return status.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Carregando extrato...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-red-600">Erro ao carregar extrato</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Extrato Executivo</h1>
      
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
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={inputStartDate}
                onChange={(e) => setInputStartDate(e.target.value)}
                onKeyPress={handleKeyPress}
                className="cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={inputEndDate}
                onChange={(e) => setInputEndDate(e.target.value)}
                onKeyPress={handleKeyPress}
                className="cursor-pointer"
              />
            </div>
            
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
            {selectedChartDate && (
              <Button
                onClick={() => setSelectedChartDate('')}
                variant="outline"
                size="sm"
              >
                Limpar Filtro de Data ({selectedChartDate})
              </Button>
            )}
            <Button
              onClick={() => {
                setInputStartDate('');
                setInputEndDate('');
                setInputPersonalDocument('');
                setInputSearchTerm('');
                setStartDate('');
                setEndDate('');
                setPersonalDocument('');
                setSearchTerm('');
                setSelectedChartDate('');
              }}
              variant="outline"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Header com gráfico de barras */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fluxo de Caixa
                {selectedChartDate && (
                  <span className="text-sm font-normal text-blue-600 ml-2">
                    (Filtrado: {selectedChartDate})
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {(statementSummary.period.start && statementSummary.period.end) ? (
                  <>Período: {formatDate(statementSummary.period.start)} - {formatDate(statementSummary.period.end)}</>
                ) : (
                  <>Período: Todos os dados disponíveis</>
                )}
                {!selectedChartDate && (
                  <span className="text-blue-600 ml-2">• Clique em uma barra para filtrar</span>
                )}
                {selectedChartDate && (
                  <span className="text-blue-600 ml-2">• Clique novamente para remover o filtro</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button onClick={handleExport} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Gráfico de barras com Recharts */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                <Legend 
                  wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <Bar 
                  dataKey="entradas" 
                  fill="#eab308" 
                  name="Entradas"
                  radius={[2, 2, 0, 0]}
                  style={{ cursor: 'pointer' }}
                />
                <Bar 
                  dataKey="saidas" 
                  fill="#22c55e" 
                  name="Saídas"
                  radius={[2, 2, 0, 0]}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statementSummary.currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statementSummary.totalCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(statementSummary.totalDebits)}
            </div>
            <p className="text-xs text-muted-foreground">
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(statementSummary.ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por transação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de transações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transações ({statementSummary.transactionCount})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar transações..."
                  className="pl-10 w-64"
                  value={inputSearchTerm}
                  onChange={(e) => setInputSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button
                onClick={handleApplyFilters}
                size="sm"
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              <Button
                onClick={() => exportToPDF(filteredData, 'extrato-executivo')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                onClick={() => exportToExcel(filteredData, 'extrato-executivo')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo Transação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => {
                  // Lógica para determinar pagador e beneficiário baseado no tipo PIX
                  let pagador = item.nome_pagador || '-';
                  let beneficiario = item.beneficiario || '-';
                  
                  if (item.description.toLowerCase().includes('pix')) {
                    if (item.type === 'debit') {
                      // Se é pagamento PIX (débito), o nome da conta é o pagador
                      pagador = item.personal_name;
                      beneficiario = item.beneficiario || '-';
                    } else if (item.type === 'credit') {
                      // Se é recebimento PIX (crédito), o nome da conta é o beneficiário
                      pagador = item.nome_pagador || '-';
                      beneficiario = item.personal_name;
                    }
                  }
                  
                  return (
                    <TableRow key={`${item.personal_document}-${index}`}>
                      <TableCell className="text-sm font-medium">{item.personal_name}</TableCell>
                      <TableCell className="text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.type === 'credit' ? 'Crédito' : 'Débito'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={item.pix_free_description || '-'}>
                        {item.pix_free_description || '-'}
                      </TableCell>
                      <TableCell className="text-sm">{pagador}</TableCell>
                      <TableCell className="text-sm">{beneficiario}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Math.abs(parseFloat(item.amount)))}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.transaction_date}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>
      </div>
    );
  }