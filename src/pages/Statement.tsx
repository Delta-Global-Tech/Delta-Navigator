import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatementData, StatementItem, StatementSummary } from '@/data/statementApi';
import { TrendingUp, TrendingDown, DollarSign, Activity, Download, Filter, Search, Calendar, FileText, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, Copy, CheckCircle2, AlertCircle, Zap, PieChart, BarChart3, TrendingUpIcon, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { useExport } from '@/hooks/useExport';
import { useSync } from '@/providers/sync-provider';
import * as XLSX from 'xlsx';

// Componente memoizado para linhas da tabela - Otimiza re-renders
interface TableRowProps {
  item: StatementItem;
  index: number;
  copiedCell: string | null;
  onCopy: (text: string, cellId: string) => void;
}

const StatementTableRow = memo(({ item, index, copiedCell, onCopy }: TableRowProps) => {
  const isCredit = item.type === 'credit';
  const amount = parseFloat(item.amount);
  const saldo = parseFloat(item.saldo_posterior);
  const cellId = `${item.personal_document}-${index}`;
  
  let pagador = item.nome_pagador || '-';
  let beneficiario = item.beneficiario || '-';
  
  if (item.description.toLowerCase().includes('pix')) {
    if (item.type === 'debit') {
      pagador = item.personal_name;
      beneficiario = item.beneficiario || '-';
    } else if (item.type === 'credit') {
      pagador = item.nome_pagador || '-';
      beneficiario = item.personal_name;
    }
  }
  
  const dateParts = item.transaction_date.split(' ');
  const date = dateParts[0];
  const time = dateParts[1] || '--:--:--';
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <TableRow key={cellId} className="border-b transition-colors hover:opacity-80" style={{borderColor: 'rgba(192, 134, 58, 0.1)', background: 'rgba(3, 18, 38, 0.5)'}}>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.6)', padding: '0.75rem'}} className="text-sm font-medium">{index + 1}</TableCell>
      <TableCell style={{color: '#FFFFFF', padding: '0.75rem'}} className="text-sm font-medium">{date}</TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-xs">{time}</TableCell>
      <TableCell style={{color: '#FFFFFF', padding: '0.75rem'}} className="text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{backgroundColor: isCredit ? '#10b981' : '#ef4444'}}></div>
          <span className="truncate" title={item.personal_name}>{item.personal_name}</span>
        </div>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-sm">
        <Badge style={{background: isCredit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isCredit ? '#10b981' : '#ef4444', border: `1px solid ${isCredit ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`, padding: '0.5rem 0.75rem', fontSize: '0.75rem'}}>
          {isCredit ? '📥 Crédito' : '📤 Débito'}
        </Badge>
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.85)', padding: '0.75rem'}} className="text-xs max-w-sm">
        <div className="truncate" title={item.pix_free_description || item.description}>
          {item.pix_free_description || item.description || '-'}
        </div>
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.6)', padding: '0.75rem'}} className="text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span style={{color: 'rgba(192, 134, 58, 0.7)'}}>De:</span>
            <span className="truncate font-mono max-w-[120px]" title={pagador}>{pagador}</span>
          </div>
          <div className="flex items-center gap-1">
            <span style={{color: 'rgba(192, 134, 58, 0.7)'}}>Para:</span>
            <span className="truncate font-mono max-w-[120px]" title={beneficiario}>{beneficiario}</span>
          </div>
        </div>
      </TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-xs max-w-xs">
        <div className="truncate" title={item.banco_beneficiario || '-'}>
          {item.banco_beneficiario || '-'}
        </div>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-right">
        <button 
          onClick={() => onCopy(Math.abs(amount).toFixed(2), cellId + '-valor')}
          className="relative inline-flex items-center gap-1 group hover:opacity-80 transition"
          title="Clique para copiar o valor"
        >
          <span className={`font-bold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
            {isCredit ? '+' : '-'}{formatCurrency(Math.abs(amount))}
          </span>
          {copiedCell === cellId + '-valor' ? (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" style={{color: '#C0863A'}} />
          )}
        </button>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-right">
        <button 
          onClick={() => onCopy(saldo.toFixed(2), cellId + '-saldo')}
          className="relative inline-flex items-center gap-1 group hover:opacity-80 transition"
          title="Clique para copiar o saldo"
        >
          <span className="font-bold text-sm" style={{color: '#C0863A'}}>
            {formatCurrency(saldo)}
          </span>
          {copiedCell === cellId + '-saldo' ? (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" style={{color: '#C0863A'}} />
          )}
        </button>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-center">
        <Badge 
          style={{background: 'rgba(192, 134, 58, 0.2)', color: '#C0863A', border: '1px solid rgba(192, 134, 58, 0.3)', padding: '0.5rem 0.75rem', fontSize: '0.75rem'}}
          title={item.status_description}
        >
          {item.status_description ? item.status_description.substring(0, 3).toUpperCase() : '???'}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

StatementTableRow.displayName = 'StatementTableRow';

export default function Statement() {
  const { updateSync, setRefreshing } = useSync();
  
  // Estado para controle da última sincronização (mantido para compatibilidade)
  const [lastSync, setLastSync] = useState<string>('');
  const [showBalances, setShowBalances] = useState(true);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  
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
  const [sortBy, setSortBy] = useState('transaction_date'); // Campo para ordenação
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Direção da ordenação
  
  // Estado para view mode
  const [viewMode, setViewMode] = useState<'table' | 'detailed'>('table');

  // CSS para cursor pointer nas barras do gráfico
  useEffect(() => {
    // Verificar se já foi adicionado
    if (document.getElementById('statement-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'statement-styles';
    style.textContent = `
      .recharts-bar-rectangle {
        cursor: pointer !important;
        transition: all 0.3s ease;
        filter: drop-shadow(0 2px 4px rgba(192, 134, 58, 0.1));
      }
      .recharts-bar-rectangle:hover {
        opacity: 0.9 !important;
        filter: drop-shadow(0 6px 16px rgba(192, 134, 58, 0.3)) !important;
        transform: translateY(-2px);
      }
      .recharts-surface {
        overflow: visible;
      }
      .transaction-row:hover {
        background-color: rgba(59, 130, 246, 0.05);
      }
      .chart-container {
        animation: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('statement-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // Hook para exportação
  const { exportToPDF, exportToExcel } = useExport();

  // Função para copiar para clipboard
  const copyToClipboard = useCallback((text: string, cellId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 2000);
  }, []);

  // Handler para clique nas barras do gráfico
  const handleBarClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedDay = data.activePayload[0].payload.day;
      const [day, month] = clickedDay.split('/');
      const currentYear = new Date().getFullYear();
      const selectedDate = `${day}/${month}/${currentYear}`;
      
      setSelectedChartDate(prevDate => prevDate === selectedDate ? '' : selectedDate);
    }
  }, []);

  // Função para aplicar os filtros quando o botão for clicado
  const handleApplyFilters = useCallback(() => {
    setStartDate(inputStartDate);
    setEndDate(inputEndDate);
    setPersonalDocument(inputPersonalDocument);
    setPersonalName(inputPersonalName);
    setSearchTerm(inputSearchTerm);
  }, [inputStartDate, inputEndDate, inputPersonalDocument, inputPersonalName, inputSearchTerm]);

  // Função para aplicar filtros ao pressionar Enter
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  }, [handleApplyFilters]);

  // Função para alternar ordenação
  const handleSort = useCallback((field: string) => {
    setSortBy(prevSortBy => {
      if (prevSortBy === field) {
        setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
      } else {
        setSortBy(field);
        setSortOrder('desc');
      }
      return field === prevSortBy ? prevSortBy : field;
    });
  }, []);

  // Função para converter data do formato YYYY-MM-DD para DD/MM/YYYY
  const formatDateForAPI = useCallback((dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }, []);

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
    staleTime: 10000, // Cache de 10 segundos para evitar refetch constante
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
        <div className="backdrop-blur-md rounded-xl p-4 shadow-2xl border border-opacity-30" style={{
          background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.95) 0%, rgba(10, 27, 51, 0.95) 100%)',
          borderColor: '#C0863A'
        }}>
          <p className="font-bold text-base" style={{color: '#C0863A'}}>📅 Dia {label}</p>
          <div className="space-y-2.5 mt-3">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{background: 'linear-gradient(135deg, #C0863A 0%, #d4a574 100%)'}}></div>
              <div>
                <p className="text-sm font-semibold text-white">💰 Entradas</p>
                <p className="text-xs text-gray-300 mt-0.5">{data.entradas} transações</p>
                <p className="text-sm font-bold mt-1" style={{color: '#C0863A'}}>{formatCurrency(data.entradasValor)}</p>
              </div>
            </div>
            <div className="h-px" style={{background: 'rgba(192, 134, 58, 0.2)'}}></div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{background: 'linear-gradient(135deg, #031226 0%, #0a1b33 100%)', border: '2px solid #C0863A'}}></div>
              <div>
                <p className="text-sm font-semibold text-white">📉 Saídas</p>
                <p className="text-xs text-gray-300 mt-0.5">{data.saidas} transações</p>
                <p className="text-sm font-bold mt-1" style={{color: '#ef4444'}}>{formatCurrency(data.saidasValor)}</p>
              </div>
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
    if (!sortedData || sortedData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    // Preparar dados para o Excel
    const excelData = sortedData.map((item, index) => ({
      '#': index + 1,
      'Nome': item.personal_name,
      'Documento': item.personal_document,
      'Data': item.transaction_date,
      'Tipo': item.type,
      'Descrição': item.description,
      'PIX Descrição': item.pix_free_description,
      'Valor': item.amount,
      'Saldo Posterior': item.saldo_posterior,
      'Beneficiário': item.beneficiario,
      'Banco Beneficiário': item.banco_beneficiario,
      'Pagador': item.nome_pagador,
      'Status': item.status_description
    }));

    // Criar worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Criar workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extrato');
    
    // Gerar nome do arquivo com timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `extrato_${timestamp}.xlsx`;
    
    // Salvar arquivo
    XLSX.writeFile(workbook, fileName);
    
    console.log('Extrato exportado para:', fileName);
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
    <div className="min-h-screen p-2 md:p-4" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)' }}>
      <div className="w-full mx-auto space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3" style={{ color: '#C0863A' }}>
              📊 Extrato Executivo
              {isFetching && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#C0863A' }}></div>
              )}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="mt-1">Análise completa do seu fluxo de caixa</p>
          </div>
          <div className="text-right">
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="text-sm">Última atualização</p>
            <p className="text-lg font-semibold" style={{ color: '#C0863A' }}>{lastSync || '--:--:--'}</p>
          </div>
        </div>
      
      {/* Filtros - DESIGN MELHORADO */}
      <Card className="border-0 shadow-2xl" 
        style={{ 
          background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
          border: '1px solid rgba(192, 134, 58, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
        <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
          <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio" className="font-semibold text-sm" style={{color: '#C0863A'}}>📅 Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={inputStartDate}
                onChange={(e) => setInputStartDate(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}
                className="placeholder-gray-500 focus:border-yellow-600 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-fim" className="font-semibold text-sm" style={{color: '#C0863A'}}>📅 Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={inputEndDate}
                onChange={(e) => setInputEndDate(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}
                className="placeholder-gray-500 focus:border-yellow-600 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome" className="font-semibold text-sm" style={{color: '#C0863A'}}>👤 Nome</Label>
              <Input
                id="nome"
                placeholder="Digite o nome..."
                value={inputPersonalName}
                onChange={(e) => setInputPersonalName(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}
                className="placeholder-gray-500 focus:border-yellow-600 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documento" className="font-semibold text-sm" style={{color: '#C0863A'}}>🆔 CPF/CNPJ</Label>
              <Input
                id="documento"
                placeholder="Apenas números..."
                value={inputPersonalDocument}
                onChange={(e) => setInputPersonalDocument(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}
                className="placeholder-gray-500 focus:border-yellow-600 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold text-sm" style={{color: '#C0863A'}}>🔍 Ações</Label>
              <div className="flex gap-2 h-12">
                <Button
                  onClick={handleApplyFilters}
                  style={{background: '#C0863A', color: '#031226'}}
                  className="flex-1 hover:opacity-90 text-base"
                >
                  <Search className="h-5 w-5" />
                </Button>
                {(startDate || endDate || personalDocument || personalName || selectedChartDate) && (
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
                    }}
                    variant="outline"
                    style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: '#C0863A'}}
                    className="hover:bg-red-950"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {selectedChartDate && (
            <div className="mt-4 p-3 rounded-lg flex items-center justify-between" style={{background: 'rgba(192, 134, 58, 0.15)', border: '1px solid rgba(192, 134, 58, 0.3)'}}>
              <span className="text-sm" style={{color: '#C0863A'}}>
                📊 Filtrado por data: <strong>{selectedChartDate}</strong>
              </span>
              <Button
                onClick={() => setSelectedChartDate('')}
                variant="ghost"
                size="sm"
                style={{color: '#C0863A'}}
                className="hover:opacity-70"
              >
                ✕ Remover
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Header com gráfico de barras - MELHORADO */}
      <Card className="border-0 shadow-2xl" 
        style={{ 
          background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
          border: '1px solid rgba(192, 134, 58, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
        <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl" style={{color: '#C0863A'}}>
                <BarChart3 className="h-6 w-6" />
                📊 Fluxo de Caixa - Últimos 30 dias
                {selectedChartDate && (

                  <Badge style={{background: 'rgba(192, 134, 58, 0.3)', color: '#C0863A', border: '1px solid rgba(192, 134, 58, 0.5)'}}>
                    Filtrado: {selectedChartDate}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs mt-2" style={{color: 'rgba(255, 255, 255, 0.7)'}}>
                {(statementSummary.period.start && statementSummary.period.end) ? (
                  <>Período completo: {formatDate(statementSummary.period.start)} até {formatDate(statementSummary.period.end)}</>
                ) : (
                  <>Todos os dados disponíveis</>
                )}
                {!selectedChartDate && (
                  <span className="block mt-1" style={{color: '#C0863A'}}>💡 Clique em uma barra para filtrar por data</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExport} size="sm" style={{background: '#C0863A', color: '#031226'}} className="hover:opacity-90">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Card de Insights do Gráfico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Insight: Maior dia */}
            <div className="rounded-lg p-4 border border-opacity-30" style={{
              background: 'linear-gradient(135deg, rgba(192, 134, 58, 0.1) 0%, rgba(212, 165, 116, 0.05) 100%)',
              borderColor: '#C0863A'
            }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color: 'rgba(192, 134, 58, 0.7)'}}>📈 Melhor dia</p>
              <p className="text-lg font-bold mt-2" style={{color: '#C0863A'}}>
                {chartData && chartData.length > 0
                  ? chartData.reduce((max, curr) => (curr.entradasValor > max.entradasValor) ? curr : max).day
                  : '--'
                }
              </p>
              <p className="text-xs mt-1" style={{color: 'rgba(255, 255, 255, 0.6)'}}>
                Maiores entradas
              </p>
            </div>

            {/* Insight: Total Entradas */}
            <div className="rounded-lg p-4 border border-opacity-30" style={{
              background: 'linear-gradient(135deg, rgba(192, 134, 58, 0.15) 0%, rgba(212, 165, 116, 0.1) 100%)',
              borderColor: '#C0863A'
            }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color: 'rgba(192, 134, 58, 0.7)'}}>💰 Total entradas</p>
              <p className="text-lg font-bold mt-2" style={{color: '#C0863A'}}>
                {formatCurrency(chartData?.reduce((sum, d) => sum + d.entradasValor, 0) || 0)}
              </p>
              <p className="text-xs mt-1" style={{color: 'rgba(255, 255, 255, 0.6)'}}>
                Últimos 30 dias
              </p>
            </div>

            {/* Insight: Total Saídas */}
            <div className="rounded-lg p-4 border border-opacity-30" style={{
              background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.3) 0%, rgba(10, 27, 51, 0.2) 100%)',
              borderColor: '#0a1b33'
            }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color: 'rgba(192, 134, 58, 0.7)'}}>📉 Total saídas</p>
              <p className="text-lg font-bold mt-2" style={{color: '#ef4444'}}>
                {formatCurrency(chartData?.reduce((sum, d) => sum + d.saidasValor, 0) || 0)}
              </p>
              <p className="text-xs mt-1" style={{color: 'rgba(255, 255, 255, 0.6)'}}>
                Últimos 30 dias
              </p>
            </div>
          </div>

          {/* 3 Gráficos em uma linha - LAYOUT HORIZONTAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gráfico 1: Entradas */}
            <div className="h-64 rounded-xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.3) 0%, rgba(10, 27, 51, 0.3) 100%)',
              border: '1px solid rgba(192, 134, 58, 0.2)',
              padding: '1rem'
            }}>
              <p className="text-xs font-semibold mb-2" style={{color: 'rgba(192, 134, 58, 0.9)'}}>💰 Entradas</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="4 4" 
                    stroke="rgba(192, 134, 58, 0.15)" 
                    verticalPoints={[]}
                    verticalFill={['rgba(192, 134, 58, 0.02)', 'transparent']}
                  />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(192, 134, 58, 0.4)"
                    fontSize={10}
                    tick={{ fill: '#C0863A', fontWeight: 500 }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                  />
                  <YAxis 
                    stroke="rgba(192, 134, 58, 0.4)"
                    fontSize={10}
                    tick={{ fill: '#C0863A', fontWeight: 500 }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'rgba(192, 134, 58, 0.3)', strokeWidth: 1 }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Line 
                    type="monotone"
                    dataKey="entradasValor" 
                    stroke="#C0863A"
                    strokeWidth={2}
                    dot={{ fill: '#C0863A', r: 3 }}
                    activeDot={{ r: 5, fill: '#d4a574' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico 2: Saídas */}
            <div className="h-64 rounded-xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.3) 0%, rgba(10, 27, 51, 0.3) 100%)',
              border: '1px solid rgba(192, 134, 58, 0.2)',
              padding: '1rem'
            }}>
              <p className="text-xs font-semibold mb-2" style={{color: 'rgba(239, 68, 68, 0.9)'}}>📉 Saídas</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="4 4" 
                    stroke="rgba(192, 134, 58, 0.15)" 
                    verticalPoints={[]}
                    verticalFill={['rgba(192, 134, 58, 0.02)', 'transparent']}
                  />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(192, 134, 58, 0.4)"
                    fontSize={10}
                    tick={{ fill: '#C0863A', fontWeight: 500 }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                  />
                  <YAxis 
                    stroke="rgba(192, 134, 58, 0.4)"
                    fontSize={10}
                    tick={{ fill: '#C0863A', fontWeight: 500 }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'rgba(192, 134, 58, 0.3)', strokeWidth: 1 }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Line 
                    type="monotone"
                    dataKey="saidasValor" 
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                    activeDot={{ r: 5, fill: '#ff6b6b' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico 3: Saldo Líquido */}
            <div className="h-64 rounded-xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.3) 0%, rgba(10, 27, 51, 0.3) 100%)',
              border: '1px solid rgba(192, 134, 58, 0.2)',
              padding: '1rem'
            }}>
              <p className="text-xs font-semibold mb-2" style={{color: 'rgba(16, 185, 129, 0.9)'}}>💹 Saldo Líquido</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData?.map(d => ({
                    ...d,
                    saldoLiquido: d.entradasValor - d.saidasValor
                  })) || []} 
                  margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="4 4" 
                    stroke="rgba(192, 134, 58, 0.15)" 
                    verticalPoints={[]}
                    verticalFill={['rgba(192, 134, 58, 0.02)', 'transparent']}
                  />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(192, 134, 58, 0.4)"
                    fontSize={10}
                    tick={{ fill: '#C0863A', fontWeight: 500 }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                  />
                  <YAxis 
                    stroke="rgba(192, 134, 58, 0.4)"
                    fontSize={10}
                    tick={{ fill: '#C0863A', fontWeight: 500 }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'rgba(192, 134, 58, 0.3)', strokeWidth: 1 }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Line 
                    type="monotone"
                    dataKey="saldoLiquido" 
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5, fill: '#34d399' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo - NOVO DESIGN COM CORES DO DESEMBOLSO */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Card Saldo Atual */}
        <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(192, 134, 58, 0.9)' }}>
              💰 Saldo Atual
            </CardTitle>
            <button 
              onClick={() => setShowBalances(!showBalances)}
              className="p-1 rounded transition" 
              style={{ background: 'rgba(192, 134, 58, 0.15)' }}
            >
              {showBalances ? <Eye className="h-4 w-4" style={{color: '#C0863A'}} /> : <EyeOff className="h-4 w-4" style={{color: '#C0863A'}} />}
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold" style={{ color: '#FFFFFF', textShadow: '0 0 10px rgba(192, 134, 58, 0.3)' }}>
              {showBalances ? formatCurrency(displaySummary.currentBalance) : '••••••'}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#C0863A'}}></div>
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Posição consolidada</p>
            </div>
            <button 
              onClick={() => copyToClipboard(displaySummary.currentBalance.toString(), 'saldo-atual')}
              className="text-xs flex items-center gap-1 transition" 
              style={{ color: 'rgba(192, 134, 58, 0.9)' }}
            >
              {copiedCell === 'saldo-atual' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedCell === 'saldo-atual' ? 'Copiado!' : 'Copiar'}
            </button>
          </CardContent>
        </Card>

        {/* Card Total Entradas */}
        <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(192, 134, 58, 0.9)' }}>
              📈 Total Entradas
            </CardTitle>
            <TrendingUp className="h-4 w-4" style={{color: '#10b981'}} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold" style={{ color: '#10b981' }}>
              {formatCurrency(displaySummary.totalCredits)}
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>Em {displaySummary.transactionCount} transações</span>
              <Badge variant="outline" className="text-green-400 border-green-400" style={{background: 'rgba(16, 185, 129, 0.2)'}}>
                +{(displaySummary.totalCredits).toFixed(0)}
              </Badge>
            </div>
            <div className="w-full rounded-full h-2 overflow-hidden" style={{background: 'rgba(16, 185, 129, 0.2)'}}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((displaySummary.totalCredits / (displaySummary.totalCredits + displaySummary.totalDebits)) * 100, 100)}%`, background: '#10b981' }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Card Total Saídas */}
        <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(192, 134, 58, 0.9)' }}>
              📉 Total Saídas
            </CardTitle>
            <TrendingDown className="h-4 w-4" style={{color: '#ef4444'}} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold" style={{ color: '#ef4444' }}>
              {formatCurrency(displaySummary.totalDebits)}
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>Em {displaySummary.transactionCount} transações</span>
              <Badge variant="outline" className="text-red-400 border-red-400" style={{background: 'rgba(239, 68, 68, 0.2)'}}>
                -{(displaySummary.totalDebits).toFixed(0)}
              </Badge>
            </div>
            <div className="w-full rounded-full h-2 overflow-hidden" style={{background: 'rgba(239, 68, 68, 0.2)'}}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((displaySummary.totalDebits / (displaySummary.totalCredits + displaySummary.totalDebits)) * 100, 100)}%`, background: '#ef4444' }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Card Ticket Médio */}
        <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(192, 134, 58, 0.9)' }}>
              🎯 Ticket Médio
            </CardTitle>
            <Zap className="h-4 w-4" style={{color: '#C0863A'}} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold" style={{ color: '#C0863A' }}>
              {formatCurrency(displaySummary.ticketMedio)}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{background: '#C0863A'}}></span>
                Valor médio por transação
              </span>
            </div>
            <div className="rounded px-3 py-2 text-sm text-center font-semibold" style={{background: 'rgba(192, 134, 58, 0.2)', color: '#C0863A'}}>
              {displaySummary.transactionCount} transações
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de transações - NOVO DESIGN */}
      <Card className="border-0 shadow-2xl" 
        style={{ 
          background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
          border: '1px solid rgba(192, 134, 58, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
        <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
                <Activity className="h-5 w-5" />
                Transações Detalhadas
                <Badge style={{background: 'rgba(192, 134, 58, 0.3)', color: '#C0863A', border: '1px solid rgba(192, 134, 58, 0.5)'}}>
                  {displaySummary.transactionCount} registros
                </Badge>
              </CardTitle>
              <p className="text-xs mt-1" style={{color: 'rgba(255, 255, 255, 0.7)'}}>
                {sortOrder === 'asc' ? '↑ Mais antigas primeiro' : '↓ Mais recentes primeiro'} • Clique nos cabeçalhos para ordenar
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{color: '#C0863A'}} />
                <Input
                  placeholder="Buscar..."
                  style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF', paddingLeft: '2.5rem'}}
                  className="w-64 placeholder-gray-500"
                  value={inputSearchTerm}
                  onChange={(e) => setInputSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button
                onClick={handleApplyFilters}
                size="sm"
                style={{background: '#C0863A', color: '#031226'}}
                className="hover:opacity-90"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => exportToPDF(sortedData, 'extrato-executivo')}
                size="sm"
                variant="outline"
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: '#C0863A'}}
                className="hover:bg-opacity-10"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleExport}
                size="sm"
                variant="outline"
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: '#C0863A'}}
                className="hover:bg-opacity-10"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader style={{background: 'rgba(10, 27, 51, 0.8)', borderBottom: '2px solid rgba(192, 134, 58, 0.3)'}}>
                <TableRow className="hover:bg-opacity-80">
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">#</span>
                  </TableHead>
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">Data</span>
                  </TableHead>
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <button 
                      onClick={() => handleSort('transaction_date')}
                      className="flex items-center gap-1 hover:opacity-80 transition"
                    >
                      <span className="text-sm">Data</span>
                      {sortBy === 'transaction_date' ? (sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </button>
                  </TableHead>
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">Cliente</span>
                  </TableHead>
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">Tipo</span>
                  </TableHead>
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">Descrição</span>
                  </TableHead>
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">De / Para</span>
                  </TableHead>
                  <TableHead style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">Banco</span>
                  </TableHead>
                  <TableHead className="text-right" style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">Valor</span>
                  </TableHead>
                  <TableHead className="text-right" style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <button 
                      onClick={() => handleSort('saldo_posterior')}
                      className="flex items-center justify-end gap-1 hover:opacity-80 transition w-full"
                    >
                      <span className="text-sm">Saldo</span>
                      {sortBy === 'saldo_posterior' ? (sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-center" style={{color: '#C0863A', fontWeight: 'bold', padding: '0.75rem'}}>
                    <span className="text-sm">Status</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <StatementTableRow 
                    key={`${item.personal_document}-${index}`}
                    item={item}
                    index={index}
                    copiedCell={copiedCell}
                    onCopy={copyToClipboard}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          {sortedData.length === 0 && (
            <div className="p-8 text-center" style={{borderTop: '1px solid rgba(192, 134, 58, 0.2)'}}>
              <AlertCircle className="h-12 w-12 mx-auto mb-2" style={{color: 'rgba(192, 134, 58, 0.5)'}} />
              <p style={{color: 'rgba(255, 255, 255, 0.6)'}}>Nenhuma transação encontrada com os filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
    );
  }
