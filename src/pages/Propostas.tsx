import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FileText, Users, DollarSign, TrendingUp, TrendingDown, Calendar, Filter, BarChart3, RotateCcw, FileSpreadsheet, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSync } from '@/providers/sync-provider';
import { getApiEndpoint, logApiCall } from '@/lib/api-config';

interface PropostaData {
  cliente: string;
  telefone: string;
  email: string;
  proposta_id: number;
  data_contrato: string;
  data_criacao: string;
  valor_total: number;
  valor_liquido: number;
  qtd_parcelas: number;
  canal_venda: number;
  status_processo: string;
  data_finalizacao: string;
  id_processo_sworks: string;
}

interface EvolucaoData {
  data: string;
  quantidade: number;
  valor_total: number;
  valor_liquido: number;
  finalizadas: number;
}

interface KPIData {
  total_propostas: number;
  clientes_unicos: number;
  valor_total: number;
  valor_liquido: number;
  valor_medio: number;
  finalizadas: number;
  em_andamento: number;
  pendentes: number;
  canceladas: number;
}

const Propostas = () => {
  const { updateSync, setRefreshing } = useSync()
  
  // Debug: verificar se hooks estão funcionando
  console.log('[PROPOSTAS DEBUG] Component mounted, updateSync:', typeof updateSync);
  
  // Estados para valores dos inputs (não aplicados ainda)
  const [inputStatus, setInputStatus] = useState('todos');
  const [inputDataInicio, setInputDataInicio] = useState('');
  const [inputDataFim, setInputDataFim] = useState('');
  
  // Estados para valores aplicados nos filtros
  const [status, setStatus] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Estado para controlar a data selecionada no gráfico
  const [selectedChartDate, setSelectedChartDate] = useState<string | null>(null);

  // Função para aplicar os filtros quando o botão for clicado
  const handleApplyFilters = () => {
    setStatus(inputStatus);
    setDataInicio(inputDataInicio);
    setDataFim(inputDataFim);
  };

  // Função para aplicar filtros ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setInputStatus('todos');
    setInputDataInicio('');
    setInputDataFim('');
    setStatus('todos');
    setDataInicio('');
    setDataFim('');
    setSelectedChartDate(null);
  };

  // Função para lidar com clique no gráfico
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      const originalDate = clickedData.dataOriginal; // YYYYMMDD format
      
      if (originalDate) {
        // Converter YYYYMMDD para YYYY-MM-DD
        const year = originalDate.substring(0, 4);
        const month = originalDate.substring(4, 6);
        const day = originalDate.substring(6, 8);
        const formattedDate = `${year}-${month}-${day}`;
        
        // Se é a mesma data, limpar o filtro
        if (selectedChartDate === formattedDate) {
          setSelectedChartDate(null);
          setInputDataInicio('');
          setInputDataFim('');
          setDataInicio('');
          setDataFim('');
        } else {
          // Filtrar apenas este dia
          setSelectedChartDate(formattedDate);
          setInputDataInicio(formattedDate);
          setInputDataFim(formattedDate);
          setDataInicio(formattedDate);
          setDataFim(formattedDate);
        }
      }
    }
  };

  // Handlers para mudança de data (agora apenas atualiza inputs)
  const handleDataInicioChange = (value: string) => {
    setInputDataInicio(value);
  };

  const handleDataFimChange = (value: string) => {
    setInputDataFim(value);
  };

  // Função para exportar para Excel
  const exportToExcel = () => {
    if (!propostas?.data || propostas.data.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    // Preparar dados para o Excel
    const excelData = propostas.data.map((proposta: PropostaData, index: number) => ({
      'Linha': index + 1,
      'Cliente': proposta.cliente,
      'Telefone': proposta.telefone,
      'Email': proposta.email,
      'Proposta ID': proposta.proposta_id,
      'Data Contrato': proposta.data_contrato,
      'Data Criação': proposta.data_criacao,
      'Valor Total': proposta.valor_total,
      'Valor Líquido': proposta.valor_liquido,
      'Qtd Parcelas': proposta.qtd_parcelas,
      'Canal Venda': proposta.canal_venda,
      'Status Processo': proposta.status_processo,
      'Data Finalização': proposta.data_finalizacao,
      'ID Processo SWorks': proposta.id_processo_sworks
    }));

    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Propostas');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 8 },  // Linha
      { wch: 25 }, // Cliente
      { wch: 15 }, // Telefone
      { wch: 30 }, // Email
      { wch: 12 }, // Proposta ID
      { wch: 12 }, // Data Contrato
      { wch: 12 }, // Data Criação
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Valor Líquido
      { wch: 12 }, // Qtd Parcelas
      { wch: 12 }, // Canal Venda
      { wch: 20 }, // Status Processo
      { wch: 15 }, // Data Finalização
      { wch: 20 }  // ID Processo SWorks
    ];
    ws['!cols'] = colWidths;

    // Gerar nome do arquivo com data atual
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `propostas_${dataFormatada}.xlsx`;

    // Fazer download
    XLSX.writeFile(wb, nomeArquivo);
  };

  // Buscar dados das propostas
  const { data: propostas, isLoading: loadingPropostas, error: errorPropostas, refetch: refetchPropostas, isFetching: isFetchingPropostas } = useQuery({
    queryKey: ['propostas', status, dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'todos') params.append('status', status);
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      const url = getApiEndpoint('POSTGRES', `/api/propostas/data?${params}`);
      logApiCall(url, 'REQUEST');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar propostas');
      const result = await response.json();
      logApiCall(url, 'SUCCESS');
      return result;
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Buscar KPIs
  const { data: kpis, isLoading: loadingKPIs, refetch: refetchKpis, isFetching: isFetchingKpis } = useQuery({
    queryKey: ['propostas-kpis', status, dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'todos') params.append('status', status);
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      const url = getApiEndpoint('POSTGRES', `/api/propostas/kpis?${params}`);
      logApiCall(url, 'REQUEST');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar KPIs');
      const result = await response.json();
      logApiCall(url, 'SUCCESS');
      return result;
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Buscar status disponíveis
  const { data: statusList, refetch: refetchStatus } = useQuery({
    queryKey: ['propostas-status'],
    queryFn: async () => {
      const url = getApiEndpoint('POSTGRES', '/api/propostas/status');
      logApiCall(url, 'REQUEST');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar status');
      const result = await response.json();
      logApiCall(url, 'SUCCESS');
      return result;
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Buscar evolução diária
  const { data: evolucao, isLoading: loadingEvolucao, refetch: refetchEvolucao, isFetching: isFetchingEvolucao } = useQuery({
    queryKey: ['propostas-evolucao', status, dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'todos') params.append('status', status);
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      const url = getApiEndpoint('POSTGRES', `/api/propostas/evolucao-diaria?${params}`);
      logApiCall(url, 'REQUEST');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar evolução');
      const result = await response.json();
      logApiCall(url, 'SUCCESS');
      return result;
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Atualizar sync quando dados chegarem - padrão igual ao ExtratoRanking
  useEffect(() => {
    if (propostas || kpis || evolucao) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[PROPOSTAS] Atualizando sync para:', timestamp);
      updateSync(timestamp);
    }
  }, [propostas, kpis, evolucao, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(isFetchingPropostas || isFetchingKpis || isFetchingEvolucao);
  }, [isFetchingPropostas, isFetchingKpis, isFetchingEvolucao, setRefreshing]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      // Se for formato YYYYMMDD, converter para DD/MM/YYYY diretamente
      if (dateString.length === 8 && !dateString.includes('-')) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        
        return `${day}/${month}/${year}`;
      }
      
      // Se for formato ISO (YYYY-MM-DD) ou timestamp, usar Date mas com cuidado
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      // Para timestamps ISO, adicionar um dia para compensar fuso horário
      if (dateString.includes('T')) {
        return date.toLocaleDateString('pt-BR');
      } else {
        // Para datas simples, criar uma data local sem conversão UTC
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.warn('Erro ao formatar data:', dateString, error);
      return '-';
    }
  };

  const formatDateForChart = (dateString: string) => {
    if (!dateString || dateString.length !== 8) return '';
    
    try {
      // Converter de YYYYMMDD para formato DD/MM diretamente sem usar Date()
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      
      // Retornar diretamente no formato DD/MM sem conversões de data
      return `${day}/${month}`;
    } catch (error) {
      console.warn('Erro ao formatar data para gráfico:', dateString, error);
      return '';
    }
  };

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    if (!evolucao?.evolucao) return [];
    
    return (evolucao.evolucao as EvolucaoData[])
      .filter((item: EvolucaoData) => {
        // Filtrar datas válidas
        if (!item.data || item.data.length !== 8) return false;
        
        // Se há filtro de data início, verificar se a data é >= filtro
        if (dataInicio) {
          const dataInicioFormatada = dataInicio.replace(/-/g, ''); // 2025-07-07 -> 20250707
          if (item.data < dataInicioFormatada) return false;
        }
        
        // Se há filtro de data fim, verificar se a data é <= filtro
        if (dataFim) {
          const dataFimFormatada = dataFim.replace(/-/g, ''); // 2025-07-10 -> 20250710
          if (item.data > dataFimFormatada) return false;
        }
        
        return true;
      })
      .map((item: EvolucaoData) => {
        // Calcular valores proporcionais das finalizadas
        const percentualFinalizadas = item.quantidade > 0 ? (item.finalizadas / item.quantidade) : 0;
        const valorTotalFinalizadas = item.valor_total * percentualFinalizadas;
        const valorLiquidoFinalizadas = item.valor_liquido * percentualFinalizadas;
        
        return {
          data: formatDateForChart(item.data),
          dataOriginal: item.data, // Para debug
          'Qtd Propostas': item.quantidade,
          'Valor Total (R$)': item.valor_total,
          'Valor Líquido (R$)': item.valor_liquido,
          'Valor Total Finalizadas (R$)': valorTotalFinalizadas,
          'Valor Líquido Finalizadas (R$)': valorLiquidoFinalizadas,
          'Finalizadas': item.finalizadas,
          'Percentual Finalizadas': percentualFinalizadas
        };
      })
      .filter(item => item.data !== '') // Remover itens com data inválida
      .reverse(); // Ordem cronológica
  }, [evolucao, dataInicio, dataFim, status]);

  // Título dinâmico do gráfico
  const chartTitle = useMemo(() => {
    const hasDateFilter = dataInicio || dataFim;
    const count = chartData.length;
    
    if (selectedChartDate) {
      const formattedDate = selectedChartDate.split('-').reverse().join('/'); // YYYY-MM-DD -> DD/MM/YYYY
      return `Evolução Diária - ${formattedDate} (Clique novamente para desmarcar)`;
    }
    
    if (hasDateFilter) {
      return `Evolução Diária - Período Filtrado (${count} ${count === 1 ? 'dia' : 'dias'})`;
    }
    
    return `Evolução Diária (Últimos ${count} ${count === 1 ? 'dia' : 'dias'}) - Clique nas barras para filtrar`;
  }, [chartData.length, dataInicio, dataFim, selectedChartDate]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'FINALIZADO':
        return 'default';
      case 'EM_ANDAMENTO':
        return 'secondary';
      case 'PENDENTE':
        return 'outline';
      case 'CANCELADO':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const KPICards = ({ kpis }: { kpis: KPIData }) => {
    const custoNominal = kpis.valor_total - kpis.valor_liquido;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.valor_total)}</div>
            <p className="text-xs text-muted-foreground">
              Todas as propostas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.valor_liquido)}</div>
            <p className="text-xs text-muted-foreground">
              Valor para o cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Nominal</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(custoNominal)}</div>
            <p className="text-xs text-muted-foreground">
              Diferença total - líquido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qtd. Propostas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_propostas}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.finalizadas} finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.valor_medio)}</div>
            <p className="text-xs text-muted-foreground">
              Por proposta
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loadingPropostas || loadingKPIs) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando propostas...</div>
      </div>
    );
  }

  if (errorPropostas) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Erro ao carregar propostas</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Propostas</h1>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {(loadingPropostas || loadingKPIs) && (
              <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={inputStatus} onValueChange={setInputStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  {statusList?.status.map((s: string) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={inputDataInicio}
                onChange={(e) => handleDataInicioChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="dd/mm/aaaa"
                className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                style={{
                  colorScheme: 'dark'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={inputDataFim}
                onChange={(e) => handleDataFimChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="dd/mm/aaaa"
                className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                style={{
                  colorScheme: 'dark'
                }}
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
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </button>
            {(status !== 'todos' || dataInicio || dataFim || selectedChartDate) && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50 rounded-md transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Limpar Filtros
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {kpis && <KPICards kpis={kpis} />}

      {/* Gráfico de Evolução Diária */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onClick={handleChartClick}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name.includes('R$')) {
                      return [formatCurrency(value), name];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => `Data: ${label}`}
                  content={(props) => {
                    if (props.active && props.payload && props.payload.length > 0) {
                      const data = props.payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
                          <p className="font-semibold text-foreground mb-3">📅 {data.data}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">📊 Qtd Propostas:</span>
                              <span className="font-medium text-primary">{data['Qtd Propostas']}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">✅ Finalizadas:</span>
                              <span className="font-medium text-green-600">{data['Finalizadas']}</span>
                            </div>
                            <hr className="my-2 border-border" />
                            <div className="text-xs text-muted-foreground mb-2 font-medium">💰 Valores das Finalizadas:</div>
                            <div className="flex justify-between items-center pl-2">
                              <span className="text-sm text-muted-foreground">• Valor Total:</span>
                              <span className="font-medium text-blue-600">{formatCurrency(data['Valor Total Finalizadas (R$)'])}</span>
                            </div>
                            <div className="flex justify-between items-center pl-2">
                              <span className="text-sm text-muted-foreground">• Valor Líquido:</span>
                              <span className="font-medium text-green-600">{formatCurrency(data['Valor Líquido Finalizadas (R$)'])}</span>
                            </div>
                            <hr className="my-2 border-border" />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">📈 Taxa Conversão:</span>
                              <span className="font-medium text-orange-600">
                                {data['Qtd Propostas'] > 0 ? 
                                  `${Math.round((data['Finalizadas'] / data['Qtd Propostas']) * 100)}%` : 
                                  '0%'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="Qtd Propostas" 
                  fill="hsl(var(--primary))" 
                  name="Qtd Propostas"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="Finalizadas" 
                  fill="hsl(142.1 76.2% 36.3%)" 
                  name="Finalizadas"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Propostas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Propostas ({propostas?.data?.length || 0})
            {selectedChartDate && (
              <Badge variant="secondary" className="ml-2">
                📅 {selectedChartDate.split('-').reverse().join('/')}
                <button
                  onClick={() => {
                    setSelectedChartDate(null);
                    setInputDataInicio('');
                    setInputDataFim('');
                    setDataInicio('');
                    setDataFim('');
                  }}
                  className="ml-1 text-xs hover:text-destructive"
                  title="Remover filtro de data"
                >
                  ✕
                </button>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            <Table className="min-w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Cliente</TableHead>
                  <TableHead className="w-[200px]">Contato</TableHead>
                  <TableHead className="w-[100px]">Proposta ID</TableHead>
                  <TableHead className="w-[120px]">Data Contrato</TableHead>
                  <TableHead className="w-[120px]">Valor Total</TableHead>
                  <TableHead className="w-[120px]">Valor Líquido</TableHead>
                  <TableHead className="w-[80px]">Parcelas</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[120px]">Data Finalização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propostas?.data?.map((proposta: PropostaData, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium w-[150px] truncate p-3">
                      {proposta.cliente}
                    </TableCell>
                    <TableCell className="w-[200px] p-3">
                      <div className="space-y-1">
                        <div className="text-sm truncate">{proposta.telefone}</div>
                        <div className="text-xs text-muted-foreground truncate">{proposta.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[100px] p-3">{proposta.proposta_id}</TableCell>
                    <TableCell className="w-[120px] p-3">{formatDate(proposta.data_contrato)}</TableCell>
                    <TableCell className="w-[120px] p-3">{formatCurrency(proposta.valor_total)}</TableCell>
                    <TableCell className="w-[120px] p-3">{formatCurrency(proposta.valor_liquido)}</TableCell>
                    <TableCell className="w-[80px] p-3">{proposta.qtd_parcelas}x</TableCell>
                    <TableCell className="w-[140px] p-3">
                      <Badge variant={getStatusBadgeVariant(proposta.status_processo)}>
                        {proposta.status_processo}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[120px] p-3">{formatDate(proposta.data_finalizacao)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {propostas?.data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma proposta encontrada com os filtros selecionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Propostas;
