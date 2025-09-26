import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TrendingUp, Users, DollarSign, Target, Crown, Filter, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { getApiEndpoint, logApiCall } from '@/lib/api-config';
import { useSync } from '@/providers/sync-provider';

// Função para buscar ranking dos clientes
async function fetchRankingClientes(nome?: string, dataInicio?: string, dataFim?: string) {
  const params = new URLSearchParams();
  if (nome) params.append('nome', nome);
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  
  const queryString = params.toString();
  const url = getApiEndpoint('EXTRATO', `/api/statement/ranking${queryString ? `?${queryString}` : ''}`);
  
  logApiCall(url, 'REQUEST');
  const res = await fetch(url);
  if (!res.ok) {
    logApiCall(url, 'ERROR');
    throw new Error('Erro ao buscar ranking');
  }
  const result = await res.json();
  logApiCall(url, 'SUCCESS');
  return result;
}

export default function ExtratoRanking() {
  const { updateSync, setRefreshing } = useSync();
  
  // Função para agrupar saldos em faixas
  function getFaixasSaldos(clientes: any[]) {
    const faixas = [
      { label: '< R$ 1k', min: 0, max: 1000, color: '#eab308' },
      { label: 'R$ 1k - 5k', min: 1000, max: 5000, color: '#ef4444' },
      { label: 'R$ 5k - 20k', min: 5000, max: 20000, color: '#22c55e' },
      { label: 'R$ 20k - 50k', min: 20000, max: 50000, color: '#3b82f6' },
      { label: '> R$ 50k', min: 50000, max: Infinity, color: '#8b5cf6' },
    ];
    const result = faixas.map(faixa => ({ ...faixa, total: 0 }));
    clientes?.forEach(cliente => {
      const saldo = parseFloat(cliente.saldo || 0);
      const faixa = result.find(f => saldo >= f.min && saldo < f.max);
      if (faixa) faixa.total += 1;
    });
    return result.filter(f => f.total > 0);
  }
  
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = maior para menor, asc = menor para maior
  
  const [activeFilters, setActiveFilters] = useState({ nome: '', dataInicio: '', dataFim: '' });
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['extratoRanking', activeFilters.nome, activeFilters.dataInicio, activeFilters.dataFim],
    queryFn: () => fetchRankingClientes(activeFilters.nome, activeFilters.dataInicio, activeFilters.dataFim),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true, // Continua atualizando mesmo quando a aba não está ativa
    staleTime: 0, // Considera os dados sempre obsoletos para garantir atualizações
    enabled: true,
  });

  // Atualizar sync quando dados chegarem
  useEffect(() => {
    if (data) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[RANKING] Atualizando sync para:', timestamp);
      updateSync(timestamp);
    }
  }, [data, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(isFetching);
  }, [isFetching, setRefreshing]);

  // Calcular faixas de saldo após data estar disponível
  const faixasSaldos = getFaixasSaldos(data?.clientes || []);

  // Dados ordenados baseados no sortOrder
  const sortedClientes = React.useMemo(() => {
    if (!data?.clientes) return [];
    return [...data.clientes].sort((a, b) => {
      const saldoA = parseFloat(a.saldo || 0);
      const saldoB = parseFloat(b.saldo || 0);
      return sortOrder === 'desc' ? saldoB - saldoA : saldoA - saldoB;
    });
  }, [data?.clientes, sortOrder]);

  // Função para alternar ordenação
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Handler para aplicar filtro
  const handleApplyFilter = () => {
    setActiveFilters({
      nome: filtroNome,
      dataInicio: filtroDataInicio,
      dataFim: filtroDataFim
    });
  };

  // Handler para limpar filtro
  const handleClearFilter = () => {
    setFiltroNome('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setActiveFilters({ nome: '', dataInicio: '', dataFim: '' });
  };

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            Ranking de Clientes por Saldo
            {isFetching && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
            )}
          </h1>
          <p className="text-slate-400 mt-2">
            {activeFilters.dataInicio || activeFilters.dataFim
              ? `Saldos dos clientes ${activeFilters.dataInicio && activeFilters.dataFim
                  ? `entre ${new Date(activeFilters.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} e ${new Date(activeFilters.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`
                  : activeFilters.dataInicio
                    ? `a partir de ${new Date(activeFilters.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}`
                    : `até ${new Date(activeFilters.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`
                }`
              : 'Classificação dos clientes com maior saldo disponível (dados mais recentes)'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(activeFilters.nome || activeFilters.dataInicio || activeFilters.dataFim) && (
            <Badge variant="outline" className="border-orange-500/20 text-orange-400">
              Filtros ativos
            </Badge>
          )}
          <Badge variant="outline" className="border-blue-500/20 text-blue-400">
            <Users className="h-3 w-3 mr-1" />
            {data?.clientes?.length || 0} clientes
          </Badge>

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
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente</Label>
              <Input
                id="nome"
                placeholder="Digite o nome do cliente..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={handleApplyFilter}
              variant="default"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Pesquisar
            </Button>
            {(filtroNome || filtroDataInicio || filtroDataFim) && (
              <Button
                onClick={handleClearFilter}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">{data?.clientes?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Maior Saldo</p>
                <p className="text-2xl font-bold text-green-400">
                  {data?.clientes?.[0]?.saldo ? parseFloat(data.clientes[0].saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Saldo Médio</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {data?.clientes?.length > 0 
                    ? (data.clientes.reduce((acc: number, c: any) => acc + parseFloat(c.saldo || 0), 0) / data.clientes.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'R$ 0,00'
                  }
                </p>
              </div>
              <Target className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Saldo Total</p>
                <p className="text-2xl font-bold text-purple-400">
                  {data?.clientes?.length > 0 
                    ? data.clientes.reduce((acc: number, c: any) => acc + parseFloat(c.saldo || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'R$ 0,00'
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 clientes por saldo */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Top 5 Clientes por Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-slate-400">Carregando...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data?.clientes?.slice(0, 5).sort((a, b) => parseFloat(b.saldo) - parseFloat(a.saldo)) || []} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="nome" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fill: '#94a3b8', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const cliente = payload[0].payload;
                          let statusColor = '#64748b';
                          if (cliente.status?.toLowerCase().includes('desbloqueado')) statusColor = '#22c55e';
                          else if (cliente.status?.toLowerCase().includes('bloqueado')) statusColor = '#ef4444';
                          return (
                            <div style={{ background: '#0f172a', color: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px #0002', minWidth: 220 }}>
                              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{cliente.nome}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ color: '#eab308', fontWeight: 500 }}>Saldo Atual:</span>
                                <span style={{ fontWeight: 700 }}>{parseFloat(cliente.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: statusColor, fontWeight: 500 }}>Status:</span>
                                <span style={{ fontWeight: 600 }}>{cliente.status}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="saldo" 
                      name="Saldo" 
                      radius={[4, 4, 0, 0]}
                    >
                      {(data?.clientes?.slice(0, 5) || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#eab308', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Distribuição de saldos por faixa */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Distribuição por Faixas de Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {faixasSaldos.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-slate-400">Sem dados para distribuição</span>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 space-y-4">
                    {faixasSaldos.map((faixa, idx) => {
                      const percentage = (faixa.total / (data?.clientes?.length || 1)) * 100;
                      return (
                        <div key={faixa.label} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">{faixa.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-400">{faixa.total} clientes</span>
                              <span className="text-sm font-bold text-white">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${percentage}%`, 
                                backgroundColor: faixa.color 
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Total de clientes</p>
                      <p className="text-2xl font-bold text-white">{data?.clientes?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Tabela de Ranking */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Ranking Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <span className="text-slate-400">Carregando...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32">
              <span className="text-red-400">Erro ao buscar dados</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300 font-semibold">Posição</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Nome</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Documento</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Email</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                  <TableHead 
                    className="text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors select-none"
                    onClick={toggleSortOrder}
                    title={`Clique para ordenar do ${sortOrder === 'desc' ? 'menor para o maior' : 'maior para o menor'}`}
                  >
                    <div className="flex items-center gap-1">
                      Saldo
                      {sortOrder === 'desc' ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClientes?.map((cliente: any, idx: number) => (
                  <TableRow key={cliente.documento} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-2">
                        {idx < 3 && (
                          <Crown className={`h-4 w-4 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-orange-600'}`} />
                        )}
                        <span className="font-semibold">{idx + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">{cliente.nome}</TableCell>
                    <TableCell className="text-slate-300 font-mono text-sm">{cliente.documento}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{cliente.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          cliente.status?.toLowerCase().includes('desbloqueado')
                            ? 'bg-green-100 text-green-800'
                            : cliente.status?.toLowerCase().includes('bloqueado')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cliente.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-green-400 font-bold text-lg">
                      {parseFloat(cliente.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
}
