import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatementData, StatementItem, StatementSummary } from '@/data/statementApi';
import { TrendingUp, TrendingDown, DollarSign, Activity, Download, Filter, Search, Calendar, FileText, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useExport } from '@/hooks/useExport';
import { useSync } from '@/providers/sync-provider';

export default function Statement() {
  const { updateSync, setRefreshing } = useSync();
  
  // Estado para controle da última sincronização (mantido para compatibilidade)
  const [lastSync, setLastSync] = useState<string>('');
  // Estados para valores dos inputs (não aplicados ainda)
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');
  const [inputPersonalDocument, setInputPersonalDocument] = useState('');
  const [inputPersonalName, setInputPersonalName] = useState('');
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  
  // Estados para valores aplicados nos filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [personalDocument, setPersonalDocument] = useState('');
  const [personalName, setPersonalName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChartDate, setSelectedChartDate] = useState<string>(''); // Data selecionada no gráfico
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState('saldo_posterior'); // Campo para ordenação
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Direção da ordenação

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

  // Função para converter data do formato YYYY-MM-DD para DD/MM/YYYY
  const formatDateForAPI = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Query para buscar dados do extrato
  const { data: statementResponse, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['statement', startDate, endDate, personalDocument],
    queryFn: () => {
      console.log('[STATEMENT] Fazendo requisição para API com:', {
        startDate: formatDateForAPI(startDate) || undefined,
        endDate: formatDateForAPI(endDate) || undefined,
        personalDocument: personalDocument || undefined
      });
      return getStatementData(
        formatDateForAPI(startDate) || undefined,
        formatDateForAPI(endDate) || undefined, 
        personalDocument || undefined
      );
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true, // Continua atualizando mesmo quando a aba não está ativa
    staleTime: 0, // Considera os dados sempre obsoletos para garantir atualizações
  });

  // Atualizar sync quando dados chegarem
  useEffect(() => {
    if (statementResponse) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[STATEMENT] Atualizando sync para:', timestamp);
      console.log('[STATEMENT] Dados recebidos:', {
        totalTransactions: statementResponse.data.length,
        summary: statementResponse.summary,
        firstTransaction: statementResponse.data[0],
        lastTransaction: statementResponse.data[statementResponse.data.length - 1]
      });
      updateSync(timestamp);
      setLastSync(timestamp); // Mantém compatibilidade local
    }
  }, [statementResponse, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(isFetching);
  }, [isFetching, setRefreshing]);

  const statementData = statementResponse?.data || [];
  
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
    console.log('[STATEMENT] Aplicando filtros:', {
      inputStartDate,
      inputEndDate,
      inputPersonalDocument,
      formattedStartDate: formatDateForAPI(inputStartDate),
      formattedEndDate: formatDateForAPI(inputEndDate)
    });
    
    setStartDate(inputStartDate);
    setEndDate(inputEndDate);
    setPersonalDocument(inputPersonalDocument);
    setPersonalName(inputPersonalName);
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
    // Filtro por nome específico
    const matchesName = personalName ? 
      item.personal_name.toLowerCase().includes(personalName.toLowerCase()) : true;
    
    // Filtro por texto geral
    const matchesSearch = searchTerm ? (
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.personal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.beneficiario?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;
    
    // Filtro por data selecionada no gráfico
    const matchesChartDate = selectedChartDate ? 
      item.transaction_date.startsWith(selectedChartDate) : true;
    
    return matchesName && matchesSearch && matchesChartDate;
  });

  // Calcular KPIs baseados nos dados filtrados localmente
  const filteredSummary = React.useMemo(() => {
    const credits = filteredData.filter(item => item.type === 'credit');
    const debits = filteredData.filter(item => item.type === 'debit');
    
    const totalCredits = credits.reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0);
    const totalDebits = debits.reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0);
    
    // Calcular ticket médio das transações filtradas
    const totalTransactionValue = totalCredits + totalDebits;
    const transactionCount = credits.length + debits.length;
    const ticketMedio = transactionCount > 0 ? totalTransactionValue / transactionCount : 0;
    
    // Calcular saldo consolidado dos dados filtrados
    const uniqueBalancesByPerson = new Map<string, number>();
    
    // Obter o saldo mais recente por pessoa nos dados filtrados
    const sortedFilteredData = [...filteredData].sort((a, b) => 
      new Date(b.transaction_date.split(' ')[0].split('/').reverse().join('-')).getTime() - 
      new Date(a.transaction_date.split(' ')[0].split('/').reverse().join('-')).getTime()
    );
    
    // Para cada pessoa, pegar apenas o saldo mais recente
    for (const item of sortedFilteredData) {
      if (!uniqueBalancesByPerson.has(item.personal_document)) {
        uniqueBalancesByPerson.set(item.personal_document, parseFloat(item.saldo_posterior));
      }
    }
    
    // Somar todos os saldos únicos
    const currentBalance = Array.from(uniqueBalancesByPerson.values())
      .reduce((sum, balance) => sum + balance, 0);
    
    return {
      totalCredits,
      totalDebits,
      ticketMedio,
      currentBalance,
      transactionCount,
    };
  }, [filteredData]);

  // Usar KPIs filtrados se há filtros locais ativos, senão usar os da API
  const displaySummary = (personalName || searchTerm) ? filteredSummary : statementSummary;

  // Aplicar ordenação aos dados filtrados
  const sortedData = React.useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'saldo_posterior') {
        aValue = Number(a.saldo_posterior || 0);
        bValue = Number(b.saldo_posterior || 0);
      } else if (sortBy === 'transaction_date') {
        // Converter strings de data DD/MM/YYYY HH:MM:SS para Date objects para comparação
        const parseDate = (dateStr: string) => {
          const [datePart] = dateStr.split(' ');
          const [day, month, year] = datePart.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        };
        
        aValue = parseDate(a.transaction_date);
        bValue = parseDate(b.transaction_date);
      }
      
      if (sortOrder === 'asc') {
        if (sortBy === 'transaction_date') {
          return aValue.getTime() - bValue.getTime();
        } else {
          return aValue > bValue ? 1 : -1;
        }
      } else {
        if (sortBy === 'transaction_date') {
          return bValue.getTime() - aValue.getTime();
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
    });
  }, [filteredData, sortBy, sortOrder]);

  // Função para alternar ordenação
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Log para debug dos dados filtrados
  React.useEffect(() => {
    console.log('[STATEMENT] Dados após filtro local:', {
      totalOriginal: statementData.length,
      totalFiltrado: filteredData.length,
      filtrosAtivos: {
        personalName: personalName || 'nenhum',
        searchTerm: searchTerm || 'nenhum',
        selectedChartDate: selectedChartDate || 'nenhum'
      }
    });
  }, [statementData.length, filteredData.length, personalName, searchTerm, selectedChartDate]);
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Extrato Executivo
          {isFetching && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          )}
        </h1>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={inputStartDate}
                onChange={(e) => setInputStartDate(e.target.value)}
                onKeyPress={handleKeyPress}
                className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                style={{ colorScheme: 'dark' }}
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
                className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Digite o nome..."
                value={inputPersonalName}
                onChange={(e) => setInputPersonalName(e.target.value)}
                onKeyPress={handleKeyPress}
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
            {(startDate || endDate || personalDocument || personalName || searchTerm || selectedChartDate || sortOrder) && (
              <Button
                onClick={() => {
                  setInputStartDate('');
                  setInputEndDate('');
                  setInputPersonalDocument('');
                  setInputPersonalName('');
                  setInputSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                  setPersonalDocument('');
                  setPersonalName('');
                  setSearchTerm('');
                  setSelectedChartDate('');
                  setSortOrder(null);
                }}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Limpar Filtros
              </Button>
            )}
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
            <CardTitle className="text-sm font-medium">
              Saldo Atual
              {(personalName || searchTerm) && (
                <span className="ml-1 text-xs text-blue-600">• Filtrado</span>
              )}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(displaySummary.currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(personalName || searchTerm) ? 'Baseado nos dados filtrados' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entradas
              {(personalName || searchTerm) && (
                <span className="ml-1 text-xs text-blue-600">• Filtrado</span>
              )}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(displaySummary.totalCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(personalName || searchTerm) ? 'Baseado nos dados filtrados' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Saídas
              {(personalName || searchTerm) && (
                <span className="ml-1 text-xs text-blue-600">• Filtrado</span>
              )}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(displaySummary.totalDebits)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(personalName || searchTerm) ? 'Baseado nos dados filtrados' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
              {(personalName || searchTerm) && (
                <span className="ml-1 text-xs text-blue-600">• Filtrado</span>
              )}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(displaySummary.ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(personalName || searchTerm) ? 'Baseado nos dados filtrados' : 'Valor médio por transação'}
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
              Transações ({displaySummary.transactionCount})
              {sortOrder && (
                <span className="text-sm font-normal text-blue-600">
                  {sortOrder === 'asc' ? '↑ Mais antigas primeiro' : '↓ Mais recentes primeiro'}
                </span>
              )}
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
                onClick={() => exportToPDF(sortedData, 'extrato-executivo')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                onClick={() => exportToExcel(sortedData, 'extrato-executivo')}
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
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('transaction_date')}
                  >
                    <div className="flex items-center gap-1">
                      Data
                      {sortBy === 'transaction_date' && (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                      {sortBy !== 'transaction_date' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('saldo_posterior')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Saldo Posterior
                      {sortBy === 'saldo_posterior' && (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                      {sortBy !== 'saldo_posterior' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => {
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
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(parseFloat(item.saldo_posterior))}
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