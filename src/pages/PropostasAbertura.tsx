import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { FileText, Users, CheckCircle, XCircle, Clock, Search, RotateCcw, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSync } from '@/providers/sync-provider';

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
  outros: number;
}

const PropostasAbertura = () => {
  const { updateSync, setRefreshing } = useSync();
  
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
  
  // Estados para busca e ordenação
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'proposed_at' | 'proposal_id'>('proposed_at'); // Começar ordenando por data
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Query para buscar dados das propostas
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['propostas-abertura'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:3002/api/propostas-abertura');
        if (!response.ok) {
          throw new Error('Erro ao buscar propostas de abertura');
        }
        return response.json();
      } catch (error) {
        // Se não conseguir conectar, usar dados mockados para demonstração
        console.warn('Usando dados mockados para propostas de abertura:', error);
        return {
          propostas: [
            { proposal_id: 1001, document: '123.456.789-00', applicant_name: 'João Silva Santos', proposed_at: '2025-07-13 15:07:36.000 -0300', status_desc: 'Aprovada automaticamente', status_description: 'Conta Ativa' },
            { proposal_id: 1002, document: '987.654.321-00', applicant_name: 'Maria Oliveira Costa', proposed_at: '2025-07-14 10:30:25.000 -0300', status_desc: 'Aprovada manualmente', status_description: 'Conta Ativa' },
            { proposal_id: 1003, document: '456.789.123-00', applicant_name: 'Pedro Almeida Lima', proposed_at: '2025-07-15 14:22:18.000 -0300', status_desc: 'Reprovada manualmente', status_description: null },
            { proposal_id: 1004, document: '789.123.456-00', applicant_name: 'Ana Carla Ferreira', proposed_at: '2025-07-16 09:15:42.000 -0300', status_desc: 'Aprovada automaticamente', status_description: 'Conta Bloqueada' },
            { proposal_id: 1005, document: '321.654.987-00', applicant_name: 'Carlos Eduardo Souza', proposed_at: '2025-07-17 16:45:33.000 -0300', status_desc: 'Aprovada manualmente', status_description: 'Conta Ativa' },
            { proposal_id: 1006, document: '159.753.486-00', applicant_name: 'Lucia Helena Martins', proposed_at: '2025-07-18 11:20:15.000 -0300', status_desc: 'Aprovada automaticamente', status_description: 'Conta Ativa' },
            { proposal_id: 1007, document: '951.357.654-00', applicant_name: 'Roberto Carlos Silva', proposed_at: '2025-07-19 13:55:28.000 -0300', status_desc: 'Reprovada manualmente', status_description: null },
            { proposal_id: 1008, document: '753.951.258-00', applicant_name: 'Patricia Santos Lima', proposed_at: '2025-07-20 08:40:12.000 -0300', status_desc: 'Aprovada manualmente', status_description: 'Conta Inativa' },
          ],
          estatisticas: {
            total: 8,
            aprovadas_automaticamente: 3,
            aprovadas_manualmente: 3,
            reprovadas_manualmente: 2,
            total_aprovadas: 6,
            total_reprovadas: 2,
            outros: 0
          }
        };
      }
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
      updateSync(timestamp);
    }
  }, [data, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(isFetching);
  }, [isFetching, setRefreshing]);

  // Função para atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      updateSync(new Date().toISOString());
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

  // Dados filtrados por busca
  const dadosFiltrados = useMemo(() => {
    if (!data?.propostas) return [];
    
    return data.propostas.filter((proposta: PropostaAberturaData) => {
      const searchLower = searchText.toLowerCase();
      return (
        proposta.applicant_name?.toLowerCase().includes(searchLower) ||
        proposta.document?.toLowerCase().includes(searchLower) ||
        proposta.status_desc?.toLowerCase().includes(searchLower) ||
        proposta.status_description?.toLowerCase().includes(searchLower) ||
        proposta.proposal_id.toString().includes(searchLower)
      );
    });
  }, [data?.propostas, searchText]);

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

  // Dados para gráfico de pizza
  const dadosGraficoPizza = useMemo(() => {
    if (!data?.estatisticas) return [];
    
    return [
      { name: 'Aprovadas Automaticamente', value: data.estatisticas.aprovadas_automaticamente, color: '#22C55E' },
      { name: 'Aprovadas Manualmente', value: data.estatisticas.aprovadas_manualmente, color: '#3B82F6' },
      { name: 'Reprovadas Manualmente', value: data.estatisticas.reprovadas_manualmente, color: '#EF4444' },
      { name: 'Outros', value: data.estatisticas.outros, color: '#6B7280' },
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
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Propostas de Abertura de Conta</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Propostas de Abertura de Conta</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Erro ao carregar dados: {error.message}</p>
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
    outros: 0 
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Propostas de Abertura de Conta
          {isFetching && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          )}
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={exportarParaExcel}
            variant="outline"
            size="sm"
            disabled={!sortedData.length}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Propostas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Propostas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.total_aprovadas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.total > 0 ? `${((estatisticas.total_aprovadas / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas Automaticamente</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.aprovadas_automaticamente.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.total > 0 ? `${((estatisticas.aprovadas_automaticamente / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas Manualmente</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estatisticas.aprovadas_manualmente.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.total > 0 ? `${((estatisticas.aprovadas_manualmente / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reprovadas Manualmente</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticas.reprovadas_manualmente.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.total > 0 ? `${((estatisticas.reprovadas_manualmente / estatisticas.total) * 100).toFixed(1)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficoPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosGraficoPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Propostas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={dadosGraficoPizza}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
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
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))">
                  {dadosGraficoPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por nome, documento, status ou ID..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button 
              onClick={() => setSearchText('')}
              variant="outline"
              size="sm"
            >
              Limpar Busca
            </Button>
            <Button 
              onClick={() => {
                setSortBy('proposed_at');
                setSortOrder('desc');
              }}
              variant="outline"
              size="sm"
            >
              Resetar Ordenação
            </Button>
          </div>
          {sortBy && (
            <div className="mt-2 text-sm text-muted-foreground">
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
      <Card>
        <CardHeader>
          <CardTitle>Lista de Propostas ({sortedData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('proposal_id')}
                  >
                    <div className="flex items-center gap-1">
                      ID Proposta
                      {sortBy === 'proposal_id' && (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                      {sortBy !== 'proposal_id' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Nome do Solicitante</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('proposed_at')}
                  >
                    <div className="flex items-center gap-1">
                      Data da Solicitação
                      {sortBy === 'proposed_at' && (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                      )}
                      {sortBy !== 'proposed_at' && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Status Proposta</TableHead>
                  <TableHead>Status da Conta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((proposta: PropostaAberturaData, index: number) => (
                    <TableRow key={`${proposta.proposal_id}-${index}`}>
                      <TableCell className="font-medium">
                        {proposta.proposal_id}
                      </TableCell>
                      <TableCell>
                        {proposta.document || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {proposta.applicant_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {formatDate(proposta.proposed_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeColor(proposta.status_desc)}>
                          {proposta.status_desc || 'Não informado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {proposta.status_description ? (
                          <Badge variant={getAccountStatusBadgeColor(proposta.status_description)}>
                            {proposta.status_description}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Sem conta</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
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
  );
};

export default PropostasAbertura;
