import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { FileText, Users, CheckCircle, XCircle, Clock, Search, RotateCcw, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, Download, BarChart3, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSync } from '@/providers/sync-provider';
import { useExport } from '@/hooks/useExport';

interface PropostaAberturaData {
  proposal_id: number;
  document: string;
  applicant_name: string;
  proposed_at: string;
  status_desc: string;
  status_description: string;
}

interface EstatisticasData {
  total: number;
  aprovadas_automaticamente: number;
  aprovadas_manualmente: number;
  reprovadas_manualmente: number;
  total_aprovadas: number;
  total_reprovadas: number;
  aguardando_analise_manual: number;
  outros: number;
}

const PropostasAbertura = () => {
  const { updateSync, setRefreshing } = useSync();
  const { exportPropostasAberturaToPDF } = useExport();
  
  // CSS para cursor pointer nas barras do gráfico e design melhorado
  useEffect(() => {
    if (document.getElementById('propostas-abertura-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'propostas-abertura-styles';
    style.textContent = `
      .recharts-bar-rectangle {
        cursor: pointer !important;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        filter: drop-shadow(0 2px 4px rgba(192, 134, 58, 0.1));
      }
      .recharts-bar-rectangle:hover {
        opacity: 0.9 !important;
        filter: drop-shadow(0 6px 16px rgba(192, 134, 58, 0.3)) !important;
        transform: translateY(-4px) scale(1.05);
        animation: barPulse 0.6s ease-out;
      }
      @keyframes barPulse {
        0% {
          box-shadow: 0 0 0 0 rgba(192, 134, 58, 0.4);
        }
        70% {
          box-shadow: 0 0 0 8px rgba(192, 134, 58, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(192, 134, 58, 0);
        }
      }
      .recharts-pie-sector {
        transition: all 0.3s ease;
        cursor: pointer;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
      }
      .recharts-pie-sector:hover {
        filter: drop-shadow(0 4px 16px rgba(192, 134, 58, 0.4)) brightness(1.15);
        transform: scale(1.05);
        animation: piePulse 0.6s ease-out;
      }
      @keyframes piePulse {
        0% {
          transform: scale(1.05);
          filter: drop-shadow(0 4px 16px rgba(192, 134, 58, 0.4)) brightness(1.15);
        }
        100% {
          transform: scale(1);
          filter: drop-shadow(0 4px 16px rgba(192, 134, 58, 0.2));
        }
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
      .chart-legend-glow {
        animation: legendGlow 2s ease-in-out infinite;
      }
      @keyframes legendGlow {
        0%, 100% {
          opacity: 0.7;
        }
        50% {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('propostas-abertura-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  
  // Estados para busca, ordenação e filtros
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'proposed_at' | 'proposal_id'>('proposed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedChartDate, setSelectedChartDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // Novo: filtro por status do gráfico
  const [lastSync, setLastSync] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 50;

  // Query para buscar dados das propostas
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['propostas-abertura'],
    queryFn: async () => {
      // Usar o extrato-server (porta 3003) que tem acesso ao banco com IP 116
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3003/api/propostas-abertura`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar propostas de abertura: ${response.status}`);
      }
      const data = await response.json();
      console.log('Dados reais de propostas carregados:', data);
      return data;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true, // Continua atualizando mesmo quando a aba não está ativa
    staleTime: 0, // Considera os dados sempre obsoletos para garantir atualizações
  });

  // Atualizar sync quando dados chegarem
  useEffect(() => {
    if (data) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[PROPOSTAS-ABERTURA] Atualizando sync para:', timestamp);
      console.log('[PROPOSTAS-ABERTURA] Dados recebidos:', {
        totalPropostas: data.propostas?.length || 0,
        estatisticas: data.estatisticas
      });
      setLastSync(timestamp);
      if (updateSync) updateSync(timestamp);
    }
  }, [data, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(isFetching);
  }, [isFetching, setRefreshing]);

  // Funções helper
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }, []);

  const copyToClipboard = useCallback((text: string, cellId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 2000);
  }, []);

  // Handler para clique nas barras do gráfico
  const handleBarClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedDay = data.activePayload[0].payload.day;
      setSelectedChartDate(prevDate => prevDate === clickedDay ? '' : clickedDay);
      setCurrentPage(1);
    }
  }, []);

  // Dados para gráfico de tendências (últimos 30 dias)
  const chartData = useMemo(() => {
    if (!data?.propostas || data.propostas.length === 0) return [];
    
    // Agrupar propostas por data
    const propostosByDate = new Map();
    
    data.propostas.forEach(proposta => {
      const dateStr = proposta.proposed_at.split(' ')[0]; // DD/MM/YYYY
      const [day, month, year] = dateStr.split('/');
      const dayMonth = `${day}/${month}`; // Formato DD/MM para exibição
      
      if (!propostosByDate.has(dayMonth)) {
        propostosByDate.set(dayMonth, {
          approved: 0,
          rejected: 0,
          pending: 0,
          total: 0
        });
      }
      
      const counts = propostosByDate.get(dayMonth);
      counts.total++;
      
      if (proposta.status_desc?.toLowerCase().includes('aprovad')) {
        counts.approved++;
      } else if (proposta.status_desc?.toLowerCase().includes('reprovad') || proposta.status_desc?.toLowerCase().includes('negad')) {
        counts.rejected++;
      } else {
        counts.pending++;
      }
    });
    
    // Converter para array e ordenar
    const chartArray = Array.from(propostosByDate.entries()).map(([dayMonth, counts]) => ({
      day: dayMonth,
      'Aprovadas': counts.approved,
      'Reprovadas': counts.rejected,
      'Pendentes': counts.pending,
      total: counts.total
    }));
    
    // Ordenar por data
    chartArray.sort((a, b) => {
      const [dayA, monthA] = a.day.split('/').map(Number);
      const [dayB, monthB] = b.day.split('/').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });
    
    return chartArray.slice(-30);
  }, [data?.propostas]);

  // Função para atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      if (updateSync) updateSync(new Date().toISOString());
    } finally {
      setRefreshing(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // Parsear data no formato: 2025-07-13 15:07:36.000 -0300
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Dados filtrados por busca e status selecionado
  const dadosFiltrados = useMemo(() => {
    if (!data?.propostas) return [];
    
    return data.propostas.filter((proposta: PropostaAberturaData) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        proposta.applicant_name?.toLowerCase().includes(searchLower) ||
        proposta.document?.toLowerCase().includes(searchLower) ||
        proposta.status_desc?.toLowerCase().includes(searchLower) ||
        proposta.status_description?.toLowerCase().includes(searchLower) ||
        proposta.proposal_id.toString().includes(searchLower);

      // Se tem filtro de status selecionado, aplicar
      if (selectedStatus) {
        return matchesSearch && proposta.status_desc?.toLowerCase().includes(selectedStatus.toLowerCase());
      }

      return matchesSearch;
    });
  }, [data?.propostas, searchText, selectedStatus]);

  // Aplicar ordenação aos dados filtrados
  const sortedData = useMemo(() => {
    return [...dadosFiltrados].sort((a, b) => {
      if (sortBy === 'proposal_id') {
        const aValue = Number(a.proposal_id || 0);
        const bValue = Number(b.proposal_id || 0);
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortBy === 'proposed_at') {
        const aValue = new Date(a.proposed_at || 0).getTime();
        const bValue = new Date(b.proposed_at || 0).getTime();
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [dadosFiltrados, sortBy, sortOrder]);

  // Função para alternar ordenação
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field as 'proposed_at' | 'proposal_id');
      setSortOrder('desc');
    }
  };

  // Handler para clicar nas barras do gráfico e filtrar
  const handleBarChartClick = useCallback((statusName: string) => {
    setSelectedStatus(selectedStatus === statusName ? '' : statusName);
    setCurrentPage(1);
  }, [selectedStatus]);

  // Calcular tendências dos últimos 7 dias vs 7 dias anteriores
  const trendsData = useMemo(() => {
    if (!data?.propostas || data.propostas.length === 0) {
      return { trend: 0, sparkData: [], direction: 'neutral' };
    }

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const last7Count = data.propostas.filter(p => new Date(p.proposed_at) >= last7Days).length;
    const prev7Count = data.propostas.filter(p => {
      const d = new Date(p.proposed_at);
      return d >= prev7Days && d < last7Days;
    }).length;

    const trend = prev7Count > 0 ? ((last7Count - prev7Count) / prev7Count) * 100 : 0;
    const direction = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

    // Gerar sparkline com dados dos últimos 7 dias
    const sparkData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const count = data.propostas.filter(p => {
        const propDate = new Date(p.proposed_at);
        return propDate.toDateString() === day.toDateString();
      }).length;
      sparkData.push({ value: count });
    }

    return { trend: Math.abs(trend), sparkData, direction };
  }, [data?.propostas]);

  // Dados para gráfico de pizza com cores dourada e azul - Design sensacional
  const dadosGraficoPizza = useMemo(() => {
    if (!data?.estatisticas) return [];
    
    return [
      { name: 'Aprovadas Automaticamente', value: data.estatisticas.aprovadas_automaticamente, color: '#C0863A' },
      { name: 'Aprovadas Manualmente', value: data.estatisticas.aprovadas_manualmente, color: '#d4a574' },
      { name: 'Reprovadas Manualmente', value: data.estatisticas.reprovadas_manualmente, color: '#0a3d66' },
      { name: 'Aguardando Análise Manual', value: data.estatisticas.aguardando_analise_manual, color: '#1a5fa0' },
      { name: 'Outros', value: data.estatisticas.outros, color: '#2d7bcc' },
    ].filter(item => item.value > 0);
  }, [data?.estatisticas]);

  // Função para exportar para Excel
  const exportarParaExcel = () => {
    if (!sortedData.length) return;

    const dados = sortedData.map((proposta: PropostaAberturaData) => ({
      'ID Proposta': proposta.proposal_id,
      'Documento': proposta.document,
      'Nome do Solicitante': proposta.applicant_name,
      'Data da Solicitação': formatDate(proposta.proposed_at),
      'Status Proposta': proposta.status_desc || 'Não informado',
      'Status da Conta': proposta.status_description || 'Sem conta'
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Propostas Abertura');
    
    // Ajustar largura das colunas
    const maxLengths = [
      Math.max(...dados.map(row => row['ID Proposta']?.toString().length || 0), 'ID Proposta'.length),
      Math.max(...dados.map(row => row['Documento']?.length || 0), 'Documento'.length),
      Math.max(...dados.map(row => row['Nome do Solicitante']?.length || 0), 'Nome do Solicitante'.length),
      Math.max(...dados.map(row => row['Status']?.length || 0), 'Status'.length),
    ];
    
    ws['!cols'] = maxLengths.map(length => ({ width: Math.min(length + 2, 50) }));
    
    XLSX.writeFile(wb, `propostas_abertura_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Tooltip customizado para o gráfico
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
              <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{background: '#22C55E'}}></div>
              <div>
                <p className="text-sm font-semibold text-white">✅ Aprovadas</p>
                <p className="text-sm font-bold mt-1" style={{color: '#22C55E'}}>{data['Aprovadas'] || 0}</p>
              </div>
            </div>
            <div className="h-px" style={{background: 'rgba(192, 134, 58, 0.2)'}}></div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{background: '#EF4444'}}></div>
              <div>
                <p className="text-sm font-semibold text-white">❌ Reprovadas</p>
                <p className="text-sm font-bold mt-1" style={{color: '#EF4444'}}>{data['Reprovadas'] || 0}</p>
              </div>
            </div>
            <div className="h-px" style={{background: 'rgba(192, 134, 58, 0.2)'}}></div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{background: '#F59E0B'}}></div>
              <div>
                <p className="text-sm font-semibold text-white">⏳ Pendentes</p>
                <p className="text-sm font-bold mt-1" style={{color: '#F59E0B'}}>{data['Pendentes'] || 0}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Função para obter cor do badge baseado no status
  const getStatusBadgeColor = (status: string) => {
    if (!status) return 'secondary';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('aprovad')) return 'default';
    if (statusLower.includes('reprovad') || statusLower.includes('negad')) return 'destructive';
    if (statusLower.includes('pendent')) return 'secondary';
    return 'outline';
  };

  // Função para obter cor do badge baseado no status da conta
  const getAccountStatusBadgeColor = (status: string) => {
    if (!status) return 'secondary';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ativa')) return 'default';
    if (statusLower.includes('bloqueada')) return 'destructive';
    if (statusLower.includes('inativa')) return 'secondary';
    if (statusLower.includes('pendente')) return 'secondary';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold" style={{color: '#C0863A'}}>Propostas de Abertura de Conta</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-2xl" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(192, 134, 58, 0.3)' }}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20" style={{backgroundColor: 'rgba(192, 134, 58, 0.2)'}}></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2" style={{backgroundColor: 'rgba(192, 134, 58, 0.2)'}}></div>
                <div className="h-3 bg-muted rounded w-24" style={{backgroundColor: 'rgba(192, 134, 58, 0.2)'}}></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)' }}>
        <Card className="border-0 shadow-2xl w-full max-w-md" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(192, 134, 58, 0.3)' }}>
          <CardContent className="pt-6 text-center">
            <div style={{color: '#ef4444'}}>
              <p className="text-lg font-bold">Erro ao carregar propostas</p>
              <p className="text-sm mt-2" style={{color: 'rgba(255, 255, 255, 0.7)'}}>{error?.message || 'Tente novamente mais tarde'}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estatisticas = data?.estatisticas || { 
    total: 0, 
    aprovadas_automaticamente: 0, 
    aprovadas_manualmente: 0, 
    reprovadas_manualmente: 0, 
    total_aprovadas: 0, 
    total_reprovadas: 0, 
    aguardando_analise_manual: 0,
    outros: 0 
  };

  return (
    <div className="min-h-screen p-2 md:p-4" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)' }}>
      <div className="w-full mx-auto space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3" style={{ color: '#C0863A' }}>
              📋 Propostas de Abertura
              {isFetching && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#C0863A' }}></div>
              )}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="mt-1">Gerenciamento de propostas em fase de abertura</p>
          </div>
          <div className="text-right">
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="text-sm">Última atualização</p>
            <p className="text-lg font-semibold" style={{ color: '#C0863A' }}>{lastSync || '--:--:--'}</p>
          </div>
        </div>

        {/* KPIs Cards - Design similar ao Statement */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Card Total */}
          <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 card-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(192, 134, 58, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(192, 134, 58, 0.9)' }}>
                📊 Total de Propostas
              </CardTitle>
              <FileText className="h-4 w-4" style={{color: '#C0863A'}} />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{estatisticas.total.toLocaleString()}</div>
                  <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Registradas</p>
                </div>
                <div className="flex items-center gap-1">
                  {trendsData.direction === 'up' && (
                    <>
                      <TrendingUp className="h-4 w-4" style={{ color: '#22C55E' }} />
                      <span className="text-sm font-bold" style={{ color: '#22C55E' }}>+{trendsData.trend.toFixed(0)}%</span>
                    </>
                  )}
                  {trendsData.direction === 'down' && (
                    <>
                      <TrendingDown className="h-4 w-4" style={{ color: '#EF4444' }} />
                      <span className="text-sm font-bold" style={{ color: '#EF4444' }}>-{trendsData.trend.toFixed(0)}%</span>
                    </>
                  )}
                </div>
              </div>
              {trendsData.sparkData.length > 0 && (
                <div className="mt-3 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendsData.sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C0863A" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#C0863A" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#C0863A" 
                        strokeWidth={2}
                        fill="url(#sparkGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Aprovadas */}
          <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 card-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(34, 197, 94, 0.9)' }}>
                ✅ Total Aprovadas
              </CardTitle>
              <CheckCircle className="h-4 w-4" style={{color: '#22C55E'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{estatisticas.total_aprovadas.toLocaleString()}</div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {estatisticas.total > 0 ? `${((estatisticas.total_aprovadas / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>

          {/* Card Aprovadas Automaticamente */}
          <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 card-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(34, 197, 94, 0.9)' }}>
                🤖 Aprov. Auto
              </CardTitle>
              <CheckCircle className="h-4 w-4" style={{color: '#22C55E'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{estatisticas.aprovadas_automaticamente.toLocaleString()}</div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {estatisticas.total > 0 ? `${((estatisticas.aprovadas_automaticamente / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>

          {/* Card Aprovadas Manualmente */}
          <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 card-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(59, 130, 246, 0.9)' }}>
                👤 Aprov. Manual
              </CardTitle>
              <Users className="h-4 w-4" style={{color: '#3B82F6'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{estatisticas.aprovadas_manualmente.toLocaleString()}</div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {estatisticas.total > 0 ? `${((estatisticas.aprovadas_manualmente / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>

          {/* Card Reprovadas */}
          <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 card-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(239, 68, 68, 0.9)' }}>
                ❌ Reprovadas
              </CardTitle>
              <XCircle className="h-4 w-4" style={{color: '#EF4444'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{estatisticas.total_reprovadas.toLocaleString()}</div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {estatisticas.total > 0 ? `${((estatisticas.total_reprovadas / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>

          {/* Card Aguardando */}
          <Card className="border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 card-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #1a0f06 0%, #2d1810 50%, #1a0f06 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: 'rgba(245, 158, 11, 0.9)' }}>
                ⏳ Aguardando
              </CardTitle>
              <Clock className="h-4 w-4" style={{color: '#F59E0B'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{estatisticas.aguardando_analise_manual.toLocaleString()}</div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {estatisticas.total > 0 ? `${((estatisticas.aguardando_analise_manual / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de tendências - LineChart */}
        <Card className="border-0 shadow-2xl chart-entrance" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
          <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl" style={{color: '#C0863A'}}>
              <BarChart3 className="h-6 w-6" />
              📊 Tendência de Propostas
            </CardTitle>
            <p className="text-xs mt-2" style={{color: 'rgba(255, 255, 255, 0.7)'}}>
              Evolução diária do status das propostas nos últimos dias
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-96 rounded-xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.3) 0%, rgba(10, 27, 51, 0.3) 100%)',
              border: '1px solid rgba(192, 134, 58, 0.2)',
              padding: '1.5rem'
            }}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartData} 
                    margin={{ top: 30, right: 40, left: 40, bottom: 30 }}
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
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
                      fontSize={12}
                      tick={{ fill: '#C0863A', fontWeight: 500 }}
                      axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                      tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    />
                    <YAxis 
                      stroke="rgba(192, 134, 58, 0.4)"
                      fontSize={12}
                      tick={{ fill: '#C0863A', fontWeight: 500 }}
                      axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                      tickLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: 'rgba(192, 134, 58, 0.3)', strokeWidth: 1 }}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        color: '#C0863A', 
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="Aprovadas" 
                      stroke="#22C55E"
                      strokeWidth={3}
                      dot={{ fill: '#22C55E', r: 5 }}
                      activeDot={{ r: 7, fill: '#4ade80' }}
                      name="✅ Aprovadas"
                      isAnimationActive={false}
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 8px rgba(34, 197, 94, 0.2))' }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="Reprovadas" 
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', r: 5 }}
                      activeDot={{ r: 7, fill: '#ff6b6b' }}
                      name="❌ Reprovadas"
                      isAnimationActive={false}
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.2))' }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="Pendentes" 
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', r: 5 }}
                      activeDot={{ r: 7, fill: '#fbbf24' }}
                      name="⏳ Pendentes"
                      isAnimationActive={false}
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>Sem dados para exibir</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráficos Pizza e Barras */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico Pizza */}
          <Card className="border-0 shadow-2xl chart-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(192, 134, 58, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
              <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
                🥧 Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={dadosGraficoPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={95}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#1e293b"
                    strokeWidth={2}
                    animationDuration={800}
                    animationEasing="ease-out"
                    paddingAngle={2}
                  >
                    {dadosGraficoPizza.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{
                          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => {
                      const total = dadosGraficoPizza.reduce((acc, item) => acc + Number(item.value), 0);
                      const percentage = ((Number(value) / total) * 100).toFixed(1);
                      return [
                        `${Number(value)} propostas (${percentage}%)`,
                        name
                      ];
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(3, 18, 38, 0.98)',
                      border: '2px solid #C0863A',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: '#C0863A',
                      boxShadow: '0 8px 24px rgba(192, 134, 58, 0.2)',
                      padding: '10px 14px',
                      fontWeight: '600'
                    }}
                    cursor={{ fill: 'rgba(192, 134, 58, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legenda com Perçentual */}
              <div className="mt-6 space-y-2">
                <div className="flex flex-wrap justify-center gap-4">
                  {dadosGraficoPizza.map((item, index) => {
                    const total = dadosGraficoPizza.reduce((acc, i) => acc + Number(i.value), 0);
                    const percentage = ((Number(item.value) / total) * 100).toFixed(1);
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-opacity-20 chart-legend-glow"
                        style={{ 
                          backgroundColor: `${item.color}20`,
                          border: `1px solid ${item.color}40`
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shadow-lg" 
                          style={{ 
                            backgroundColor: item.color,
                            boxShadow: `0 0 12px ${item.color}60`
                          }}
                        ></div>
                        <span style={{color: 'rgba(255, 255, 255, 0.85)'}} className="font-semibold text-sm">
                          {item.name}
                        </span>
                        <span style={{color: item.color}} className="font-bold text-sm">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico Barras */}
          <Card className="border-0 shadow-2xl chart-entrance" 
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(192, 134, 58, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
              <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
                📊 Status das Propostas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart 
                  data={dadosGraficoPizza}
                  style={{ cursor: 'pointer' }}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  onClick={(state: any) => {
                    if (state?.activeTooltipIndex !== undefined) {
                      const status = dadosGraficoPizza[state.activeTooltipIndex]?.name;
                      if (status) handleBarChartClick(status);
                    }
                  }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(192, 134, 58, 0.15)"
                  />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(192, 134, 58, 0.4)" 
                    fontSize={12}
                    fontWeight={600}
                    tick={{ fill: 'rgba(192, 134, 58, 0.8)' }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                  />
                  <YAxis 
                    stroke="rgba(192, 134, 58, 0.4)" 
                    fontSize={11}
                    tick={{ fill: 'rgba(192, 134, 58, 0.7)' }}
                    axisLine={{ stroke: 'rgba(192, 134, 58, 0.2)' }}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(3, 18, 38, 0.98)',
                      border: '2px solid #C0863A',
                      borderRadius: '12px',
                      color: '#C0863A',
                      boxShadow: '0 8px 24px rgba(192, 134, 58, 0.25)',
                      padding: '12px 16px',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                    cursor={{ fill: 'rgba(192, 134, 58, 0.08)' }}
                    formatter={(value) => [`${Number(value)} propostas`, 'Quantidade']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[12, 12, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {dadosGraficoPizza.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{
                          filter: 'drop-shadow(0 4px 12px rgba(192, 134, 58, 0.15))',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Resumo Estatístico */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {dadosGraficoPizza.map((item, index) => {
                  const total = dadosGraficoPizza.reduce((acc, i) => acc + Number(i.value), 0);
                  const percentage = ((Number(item.value) / total) * 100).toFixed(1);
                  return (
                    <div 
                      key={index}
                      className="p-3 rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-105"
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderColor: `${item.color}40`,
                        borderWidth: '1.5px'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p style={{color: 'rgba(255, 255, 255, 0.65)'}} className="text-xs font-medium">
                            {item.name}
                          </p>
                          <p style={{color: item.color}} className="text-lg font-bold mt-1">
                            {item.value}
                          </p>
                        </div>
                        <div 
                          className="text-center px-2 py-1 rounded-md"
                          style={{
                            backgroundColor: `${item.color}20`,
                            color: item.color
                          }}
                        >
                          <span className="font-bold text-sm">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-2xl chart-entrance" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
          <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
            <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-64">
                <Label htmlFor="search" className="font-semibold text-sm" style={{color: '#C0863A'}}>🔍 Buscar</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Nome, documento, status ou ID..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-8"
                    style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}
                  />
                </div>
              </div>
              <Button 
                onClick={() => setSearchText('')}
                variant="outline"
                size="sm"
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: '#C0863A'}}
              >
                Limpar
              </Button>
              <Button 
                onClick={() => {
                  setSortBy('proposed_at');
                  setSortOrder('desc');
                }}
                variant="outline"
                size="sm"
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: '#C0863A'}}
              >
                Resetar
              </Button>
              <Button 
                onClick={handleRefresh}
                size="sm"
                style={{background: '#C0863A', color: '#031226'}}
                className="hover:opacity-90"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                onClick={() => exportarParaExcel()}
                variant="outline"
                size="sm"
                disabled={!sortedData.length}
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: '#C0863A'}}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button 
                onClick={() => exportPropostasAberturaToPDF(sortedData, data?.estatisticas)}
                variant="outline"
                size="sm"
                disabled={!sortedData.length}
                style={{borderColor: 'rgba(192, 134, 58, 0.3)', color: '#C0863A'}}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
            {sortBy && (
              <div className="mt-4 text-sm" style={{color: '#C0863A'}}>
                <span className="inline-flex items-center gap-1">
                  📊 Ordenando por: <strong>
                    {sortBy === 'proposed_at' ? 'Data da Solicitação' : 'ID Proposta'}
                  </strong>
                  ({sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Propostas */}
        <Card className="border-0 shadow-2xl chart-entrance" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
          <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
                📑 Lista de Propostas ({sortedData.length})
              </CardTitle>
              {selectedStatus && (
                <Badge 
                  className="cursor-pointer" 
                  onClick={() => setSelectedStatus('')}
                  style={{
                    background: 'rgba(192, 134, 58, 0.2)',
                    color: '#C0863A',
                    border: '1px solid #C0863A',
                    fontWeight: '600'
                  }}
                >
                  🔍 Filtrando: {selectedStatus} ✕
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('proposal_id')}
                      style={{color: '#C0863A'}}
                    >
                      <div className="flex items-center gap-1">
                        ID Proposta
                        {sortBy === 'proposal_id' && (
                          sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                        )}
                        {sortBy !== 'proposal_id' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                      </div>
                    </TableHead>
                    <TableHead style={{color: '#C0863A'}}>Documento</TableHead>
                    <TableHead style={{color: '#C0863A'}}>Nome do Solicitante</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('proposed_at')}
                      style={{color: '#C0863A'}}
                    >
                      <div className="flex items-center gap-1">
                        Data da Solicitação
                        {sortBy === 'proposed_at' && (
                          sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                        )}
                        {sortBy !== 'proposed_at' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                      </div>
                    </TableHead>
                    <TableHead style={{color: '#C0863A'}}>Status Proposta</TableHead>
                    <TableHead style={{color: '#C0863A'}}>Status da Conta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length > 0 ? (
                    sortedData.map((proposta: PropostaAberturaData, index: number) => (
                      <TableRow key={`${proposta.proposal_id}-${index}`} style={{borderColor: 'rgba(192, 134, 58, 0.1)', background: 'rgba(3, 18, 38, 0.5)'}}>
                        <TableCell className="font-medium" style={{color: '#FFFFFF'}}>
                          {proposta.proposal_id}
                        </TableCell>
                        <TableCell style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                          {proposta.document || 'N/A'}
                        </TableCell>
                        <TableCell style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                          {proposta.applicant_name || 'N/A'}
                        </TableCell>
                        <TableCell style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                          <span className="text-sm font-mono">
                            {formatDate(proposta.proposed_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusBadgeColor(proposta.status_desc)}
                            className="badge-animated"
                            style={{
                              background: proposta.status_desc?.toLowerCase().includes('aprovad') 
                                ? 'rgba(34, 197, 94, 0.2)' 
                                : proposta.status_desc?.toLowerCase().includes('reprovad')
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                              color: proposta.status_desc?.toLowerCase().includes('aprovad') 
                                ? '#22C55E' 
                                : proposta.status_desc?.toLowerCase().includes('reprovad')
                                ? '#EF4444'
                                : '#F59E0B',
                              border: '1px solid currentColor',
                              fontWeight: '600'
                            }}
                          >
                            {proposta.status_desc?.toLowerCase().includes('aprovad') && '✅ '}
                            {proposta.status_desc?.toLowerCase().includes('reprovad') && '❌ '}
                            {proposta.status_desc?.toLowerCase().includes('pendent') && '⏳ '}
                            {proposta.status_desc || 'Não informado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {proposta.status_description ? (
                            <Badge 
                              variant={getAccountStatusBadgeColor(proposta.status_description)}
                              style={{
                                background: proposta.status_description.toLowerCase().includes('ativa')
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : proposta.status_description.toLowerCase().includes('bloqueada')
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : 'rgba(245, 158, 11, 0.2)',
                                color: proposta.status_description.toLowerCase().includes('ativa')
                                  ? '#22C55E'
                                  : proposta.status_description.toLowerCase().includes('bloqueada')
                                  ? '#EF4444'
                                  : '#F59E0B',
                                border: '1px solid currentColor',
                                fontWeight: '600'
                              }}
                            >
                              {proposta.status_description.toLowerCase().includes('ativa') && '🟢 '}
                              {proposta.status_description.toLowerCase().includes('bloqueada') && '🔒 '}
                              {proposta.status_description.toLowerCase().includes('inativa') && '🔘 '}
                              {proposta.status_description}
                            </Badge>
                          ) : (
                            <span style={{color: 'rgba(255, 255, 255, 0.5)'}}>⚪ Sem conta</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center" style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                        {searchText ? 'Nenhuma proposta encontrada com os critérios de busca' : 'Nenhuma proposta encontrada'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropostasAbertura;
