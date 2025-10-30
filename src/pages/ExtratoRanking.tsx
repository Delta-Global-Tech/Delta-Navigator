import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TrendingUp, Users, DollarSign, Target, Crown, Filter, Search, ChevronUp, ChevronDown, Zap, Star, Flame } from 'lucide-react';
import { StaggeredContainer } from '@/components/motion/StaggeredContainer';
import { getApiEndpoint, logApiCall } from '@/lib/api-config';
import { useSync } from '@/providers/sync-provider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const getFaixasSaldos = useCallback((clientes: any[]) => {
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
  }, []);
  
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = maior para menor, asc = menor para maior
  
  const [activeFilters, setActiveFilters] = useState({ nome: '', dataInicio: '', dataFim: '' });
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['extratoRanking', activeFilters.nome, activeFilters.dataInicio, activeFilters.dataFim],
    queryFn: () => fetchRankingClientes(activeFilters.nome, activeFilters.dataInicio, activeFilters.dataFim),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 10000, // ✅ 10s cache ao invés de 0 = menos requests
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
  const faixasSaldosData = useMemo(() => getFaixasSaldos(data?.clientes || []), [data?.clientes, getFaixasSaldos]);

  // Dados ordenados baseados no sortOrder - memoizado
  const sortedClientes = useMemo(() => {
    if (!data?.clientes) return [];
    return [...data.clientes].sort((a, b) => {
      const saldoA = parseFloat(a.saldo || 0);
      const saldoB = parseFloat(b.saldo || 0);
      return sortOrder === 'desc' ? saldoB - saldoA : saldoA - saldoB;
    });
  }, [data?.clientes, sortOrder]);

  // Função para alternar ordenação - memoizada
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  }, []);

  // Handler para aplicar filtro - memoizado
  const handleApplyFilter = useCallback(() => {
    setActiveFilters({
      nome: filtroNome,
      dataInicio: filtroDataInicio,
      dataFim: filtroDataFim
    });
  }, [filtroNome, filtroDataInicio, filtroDataFim]);

  // Handler para limpar filtro - memoizado
  const handleClearFilter = useCallback(() => {
    setFiltroNome('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setActiveFilters({ nome: '', dataInicio: '', dataFim: '' });
  }, []);

  // ✅ Componente memoizado para linha da tabela - evita re-renders desnecessários
  const RankingTableRow = useCallback(memo(({ cliente, idx }: any) => (
    <TableRow className="border-slate-700 hover:bg-slate-700/30 transition-colors">
      <TableCell className="text-slate-300">
        <div className="flex items-center gap-2">
          {idx < 3 && (
            <Crown className={`h-4 w-4 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-orange-600'}`} />
          )}
          <span className="font-semibold">#{idx + 1}</span>
        </div>
      </TableCell>
      <TableCell className="text-white font-medium">{cliente.nome}</TableCell>
      <TableCell className="text-slate-300 font-mono text-sm">{cliente.documento}</TableCell>
      <TableCell className="text-slate-400 text-sm hidden md:table-cell">{cliente.email}</TableCell>
      <TableCell>
        <span
          className={cn(
            "px-2 py-1 rounded text-xs font-semibold",
            cliente.status?.toLowerCase().includes('desbloqueado')
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : cliente.status?.toLowerCase().includes('bloqueado')
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          )}
        >
          {cliente.status}
        </span>
      </TableCell>
      <TableCell className="text-green-400 font-bold text-lg">
        {parseFloat(cliente.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </TableCell>
    </TableRow>
  )), []);

  return (
    <div className="p-6 space-y-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 min-h-screen">
      {/* 🎯 Page Header - VISUAL PREMIUM COM DOURADO */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-orange-500/10 rounded-2xl blur-3xl -z-10" />
        
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-amber-500"
              >
                <Flame className="h-8 w-8" />
              </motion.div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
                🏆 Ranking de Clientes
              </h1>
              {isFetching && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/50 rounded-full px-3 py-1"
                >
                  <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-400">Atualizando</span>
                </motion.div>
              )}
            </div>
            <p className="text-slate-400 text-lg font-medium">
              {activeFilters.dataInicio || activeFilters.dataFim
                ? `Classificação dos clientes ${activeFilters.dataInicio && activeFilters.dataFim
                    ? `entre ${new Date(activeFilters.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} e ${new Date(activeFilters.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`
                    : activeFilters.dataInicio
                      ? `a partir de ${new Date(activeFilters.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}`
                      : `até ${new Date(activeFilters.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`
                  }`
                : '⭐ Visualize os maiores saldos em tempo real'
              }
            </p>
          </div>
          
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {(activeFilters.nome || activeFilters.dataInicio || activeFilters.dataFim) && (
              <Badge variant="outline" className="border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-xs px-3 py-1">
                🔥 {Number(!!activeFilters.nome) + Number(!!activeFilters.dataInicio) + Number(!!activeFilters.dataFim)} Filtros Ativos
              </Badge>
            )}
            <Badge variant="outline" className="border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 text-xs px-3 py-1">
              <Users className="h-3 w-3 mr-1" />
              {data?.clientes?.length || 0} clientes
            </Badge>
          </motion.div>
        </div>
      </motion.div>

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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleApplyFilter}
                variant="default"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-amber-500/50 text-white font-semibold"
              >
                <Search className="h-4 w-4" />
                🔍 Pesquisar
              </Button>
            </motion.div>
            {(filtroNome || filtroDataInicio || filtroDataFim) && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleClearFilter}
                  variant="outline"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50/10 border-red-500/30 hover:border-red-500/50"
                >
                  ✕ Limpar
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🎁 KPIs Section - DESIGN PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
        >
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950/80 border-blue-500/40 hover:border-blue-500/60 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/70">Total de Clientes</p>
                  <p className="text-3xl font-black text-blue-200 mt-2">{data?.clientes?.length || 0}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)' }}
        >
          <Card className="bg-gradient-to-br from-emerald-900/50 to-green-950/80 border-emerald-500/40 hover:border-emerald-500/60 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">🏆 Maior Saldo</p>
                  <p className="text-3xl font-black text-emerald-200 mt-2">
                    {data?.clientes?.[0]?.saldo ? parseFloat(data.clientes[0].saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                  </p>
                </div>
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="p-3 bg-amber-500/30 rounded-lg"
                >
                  <Crown className="h-6 w-6 text-amber-400" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(234, 179, 8, 0.3)' }}
        >
          <Card className="bg-gradient-to-br from-amber-900/50 to-yellow-950/80 border-amber-500/40 hover:border-amber-500/60 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/70">Saldo Médio</p>
                  <p className="text-3xl font-black text-amber-200 mt-2">
                    {data?.clientes?.length > 0 
                    ? (data.clientes.reduce((acc: number, c: any) => acc + parseFloat(c.saldo || 0), 0) / data.clientes.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'R$ 0,00'
                  }
                  </p>
                </div>
                <div className="p-3 bg-amber-500/30 rounded-lg">
                  <Target className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)' }}
        >
          <Card className="bg-gradient-to-br from-violet-900/50 to-purple-950/80 border-violet-500/40 hover:border-violet-500/60 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/70">Saldo Total</p>
                  <p className="text-3xl font-black text-violet-200 mt-2">
                    {data?.clientes?.length > 0 
                      ? data.clientes.reduce((acc: number, c: any) => acc + parseFloat(c.saldo || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'R$ 0,00'
                    }
                  </p>
                </div>
                <div className="p-3 bg-violet-500/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 📊 Gráficos - VISUAL MELHORADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 clientes - Gráfico de Linhas Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/50 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                </motion.div>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  📈 Top Clientes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.span 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-slate-400 font-medium"
                    >
                      ⏳ Carregando dados...
                    </motion.span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={data?.clientes?.slice(0, 5).sort((a, b) => parseFloat(b.saldo) - parseFloat(a.saldo)) || []} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis 
                        dataKey="nome" 
                        stroke="#94a3b8" 
                        fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: 8, border: '1px solid #334155' }}
                      formatter={(value: any) => typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone"
                      dataKey="saldo" 
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
          </Card>
        </motion.div>
        
        {/* Distribuição de saldos por faixa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/50 border-fuchsia-500/30 hover:border-fuchsia-500/50 transition-all hover:shadow-lg hover:shadow-fuchsia-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <Target className="h-5 w-5 text-fuchsia-400" />
                </motion.div>
                <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  📊 Distribuição por Faixas
                </span>
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full flex flex-col">
              {faixasSaldosData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-slate-400">Sem dados para distribuição</span>
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {faixasSaldosData.map((faixa, idx) => {
                    const percentage = (faixa.total / (data?.clientes?.length || 1)) * 100;
                    return (
                      <div key={faixa.label} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-300">{faixa.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">{faixa.total}</span>
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
        </motion.div>
      </div>

      {/* 📋 Tabela de Ranking - VISUAL PREMIUM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/50 border-amber-500/30 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/30">
        <CardHeader className="bg-gradient-to-r from-amber-950/40 to-orange-950/40 border-b border-slate-700/50">
          <CardTitle className="text-white flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-5 w-5 text-amber-400" />
            </motion.div>
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent font-black">
              👑 Ranking Completo
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-slate-400 font-medium"
              >
                ⏳ Carregando dados...
              </motion.span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32">
              <span className="text-red-400 font-medium">❌ Erro ao buscar dados</span>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="border-slate-700 bg-gradient-to-r from-slate-900/80 to-slate-800/50 hover:bg-slate-800/50">
                  <TableHead className="text-amber-300 font-bold text-xs py-3 px-4 uppercase tracking-wider">Pos.</TableHead>
                  <TableHead className="text-blue-300 font-bold text-xs py-3 px-4 uppercase tracking-wider">Nome</TableHead>
                  <TableHead className="text-emerald-300 font-bold text-xs py-3 px-4 uppercase tracking-wider">Documento</TableHead>
                  <TableHead className="text-violet-300 font-bold text-xs py-3 px-4 hidden md:table-cell uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-cyan-300 font-bold text-xs py-3 px-4 uppercase tracking-wider">Status</TableHead>
                  <TableHead 
                    className="text-pink-300 font-bold text-xs py-3 px-4 cursor-pointer hover:text-pink-200 transition-colors select-none uppercase tracking-wider"
                    onClick={toggleSortOrder}
                    title={`Clique para ordenar do ${sortOrder === 'desc' ? 'menor para o maior' : 'maior para o menor'}`}
                  >
                    <div className="flex items-center gap-1">
                      Saldo
                      {sortOrder === 'desc' ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronUp className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClientes?.map((cliente: any, idx: number) => (
                  <RankingTableRow key={cliente.documento} cliente={cliente} idx={idx} sortOrder={sortOrder} toggleSortOrder={toggleSortOrder} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    </div>
  );
}
