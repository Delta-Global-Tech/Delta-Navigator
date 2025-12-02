import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, 
  CheckCircle, XCircle, Info, Download, Filter, X 
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Dados importados
import bhData from '@/data/averbadora/bh.json';
import poaData from '@/data/averbadora/poa.json';
import allData from '@/data/averbadora/all.json';
import regionsData from '@/data/averbadora/regions.json';

// Status helper function
const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
    'MATCH': {
      color: 'text-white',
      bgColor: 'bg-green-500 hover:bg-green-600',
      label: '✓ Match',
      icon: <CheckCircle className="w-4 h-4 mr-1" />
    },
    'MISMATCH': {
      color: 'text-white',
      bgColor: 'bg-red-500 hover:bg-red-600',
      label: '✗ Mismatch',
      icon: <XCircle className="w-4 h-4 mr-1" />
    },
    'SOMENTE_EM_EM_BH': {
      color: 'text-white',
      bgColor: 'bg-blue-500 hover:bg-blue-600',
      label: 'Apenas em BH',
      icon: <Info className="w-4 h-4 mr-1" />
    },
    'SOMENTE_EM_ZETRA': {
      color: 'text-white',
      bgColor: 'bg-purple-500 hover:bg-purple-600',
      label: 'Apenas em Poá',
      icon: <Info className="w-4 h-4 mr-1" />
    }
  };
  return configs[status] || { color: 'text-gray-700', bgColor: 'bg-gray-400 hover:bg-gray-500', label: status, icon: null };
};

interface MatchRecord {
  Nome: string;
  CPF_DIGITOS: number;
  Produto: string;
  Data_Entrada: string;
  Vlr_Liberado: number;
  Situacao_Contrato: string;
  Valor_Prestacao_Soma: number;
  _VLR_ADE: number;
  DIFERENCA: number;
  ABS_DIF: number;
  STATUS: 'MATCH' | string;
}

interface RegionData {
  name: string;
  records: number;
  matches: number;
  path: string;
}

const MatchAverbadora: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');

  // Get data for current region
  const getData = (region: string): MatchRecord[] => {
    switch (region) {
      case 'bh':
        return bhData as MatchRecord[];
      case 'poa':
        return poaData as MatchRecord[];
      default:
        return bhData as MatchRecord[];
    }
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let data = getData(activeTab);
    
    // Search filter
    if (searchTerm) {
      data = data.filter(
        (record) =>
          record.Nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.CPF_DIGITOS.toString().includes(searchTerm) ||
          record.Produto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      data = data.filter((record) => statusFilter.includes(record.STATUS));
    }

    // Value range filter
    if (minValue) {
      data = data.filter((record) => (record.Vlr_Liberado || 0) >= parseFloat(minValue));
    }
    if (maxValue) {
      data = data.filter((record) => (record.Vlr_Liberado || 0) <= parseFloat(maxValue));
    }

    return data;
  }, [searchTerm, activeTab, statusFilter, minValue, maxValue]);

  // Statistics for current region
  const stats = useMemo(() => {
    const data = getData(activeTab);
    const matches = data.filter((r) => r.STATUS === 'MATCH').length;
    const noMatches = data.length - matches;
    const totalValue = data.reduce((sum, r) => sum + (r.Vlr_Liberado || 0), 0);
    const totalADE = data.reduce((sum, r) => sum + r._VLR_ADE, 0);
    const totalDifference = totalValue - totalADE;
    const avgValue = totalValue / data.length;
    const avgADE = totalADE / data.length;

    return {
      total: data.length,
      matches,
      noMatches,
      matchRate: ((matches / data.length) * 100).toFixed(1),
      totalValue,
      totalADE,
      totalDifference,
      avgValue,
      avgADE,
      avgDifference: (
        data.reduce((sum, r) => sum + Math.abs(r.DIFERENCA), 0) / data.length
      ).toFixed(2),
    };
  }, [activeTab]);

  // Overview stats for all data
  const overviewStats = useMemo(() => {
    const data = allData as MatchRecord[];
    const regions = (regionsData as any) as Record<string, RegionData>;

    const totalMatches = data.filter((r) => r.STATUS === 'MATCH').length;
    const totalValue = data.reduce((sum, r) => sum + (r.Vlr_Liberado || 0), 0);
    const totalADE = data.reduce((sum, r) => sum + r._VLR_ADE, 0);

    return {
      totalRecords: data.length,
      totalMatches,
      matchRate: ((totalMatches / data.length) * 100).toFixed(1),
      totalValue,
      totalADE,
      totalDifference: totalValue - totalADE,
      regions: regions,
    };
  }, []);

  // Chart data
  const chartData = useMemo(() => {
    const data = getData(activeTab);
    const statusGroups = data.reduce(
      (acc, record) => {
        const status = record.STATUS || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusGroups).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: ((count / data.length) * 100).toFixed(1),
    }));
  }, [activeTab]);

  // Region comparison data
  const regionComparisonData = useMemo(() => {
    const regions = (regionsData as any) as Record<string, RegionData>;
    return Object.entries(regions).map(([key, region]) => ({
      region: region.name,
      total: region.records,
      matches: region.matches,
      noMatches: region.records - region.matches,
      matchRate: ((region.matches / region.records) * 100).toFixed(1),
    }));
  }, []);

  // Overall data for geral tab
  const allDataFiltered = useMemo(() => {
    let data = allData as MatchRecord[];
    
    if (searchTerm) {
      data = data.filter(
        (record) =>
          record.Nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.CPF_DIGITOS.toString().includes(searchTerm) ||
          record.Produto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter.length > 0) {
      data = data.filter((record) => statusFilter.includes(record.STATUS));
    }

    if (minValue) {
      data = data.filter((record) => (record.Vlr_Liberado || 0) >= parseFloat(minValue));
    }
    if (maxValue) {
      data = data.filter((record) => (record.Vlr_Liberado || 0) <= parseFloat(maxValue));
    }

    return data;
  }, [searchTerm, statusFilter, minValue, maxValue]);

  // Export to Excel function
  const exportToExcel = (data: MatchRecord[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map(record => ({
        'Nome': record.Nome,
        'CPF': `***${String(record.CPF_DIGITOS).slice(-4)}`,
        'Produto': record.Produto,
        'Data Entrada': new Date(record.Data_Entrada).toLocaleDateString('pt-BR'),
        'Vlr Liberado': record.Vlr_Liberado || '-',
        'Situação Contrato': record.Situacao_Contrato,
        'Vlr Prestação': record.Valor_Prestacao_Soma,
        'Vlr ADE': record._VLR_ADE,
        'Diferença': record.DIFERENCA,
        'Abs Diferença': record.ABS_DIF,
        'Status': record.STATUS,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🔗 Match Averbadora</h1>
          <p className="text-gray-400">
            Dashboard de análise de averbações com inteligência de matching
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <TabsList className="grid grid-cols-4 w-full max-w-md bg-slate-700">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Geral</TabsTrigger>
            <TabsTrigger value="bh" className="text-xs sm:text-sm">BH</TabsTrigger>
            <TabsTrigger value="poa" className="text-xs sm:text-sm">Poá</TabsTrigger>
            <TabsTrigger value="compare" className="text-xs sm:text-sm">Comparar</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-50">Total de Registros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overviewStats.totalRecords}</div>
                <p className="text-green-100 text-xs mt-1">145 averbações</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-50">Taxa de Match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overviewStats.matchRate}%</div>
                <p className="text-blue-100 text-xs mt-1">{overviewStats.totalMatches} matches confirmados</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-50">Regiões Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Object.keys(overviewStats.regions).length}</div>
                <p className="text-purple-100 text-xs mt-1">BH e Poá</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-50">Divergências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">R$ {(overviewStats.totalDifference / 1000).toFixed(1)}k</div>
                <p className="text-orange-100 text-xs mt-1">Total divergente</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Matches por Região</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="region" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="matches" fill="#10b981" name="Matches" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="noMatches" fill="#ef4444" name="Não Matches" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Distribuição por Região</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(overviewStats.regions).map(([key, region]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-300">{region.name}</span>
                        <Badge variant="secondary" className="bg-blue-500 text-white">
                          {region.records} registros
                        </Badge>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600"
                          style={{
                            width: `${(region.matches / region.records) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        {region.matches} matches (
                        {((region.matches / region.records) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela com todos os registros */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
              <div>
                <CardTitle className="text-white">Todos os Registros</CardTitle>
                <CardDescription className="text-gray-400">{allDataFiltered.length} registros encontrados</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filtros
                </Button>
                <Button
                  size="sm"
                  onClick={() => exportToExcel(allDataFiltered, 'averbadora_geral')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Filtros Avançados */}
              {showFilters && (
                <div className="bg-slate-700 p-4 rounded-lg space-y-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold">Filtros Avançados</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowFilters(false);
                        setStatusFilter([]);
                        setMinValue('');
                        setMaxValue('');
                        setSearchTerm('');
                      }}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Input
                      placeholder="🔍 Buscar por nome, CPF ou produto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">Valor Mín (R$)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">Valor Máx (R$)</label>
                      <Input
                        type="number"
                        placeholder="999999"
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">Status</label>
                      <div className="space-y-2">
                        {['MATCH', 'MISMATCH', 'SOMENTE_EM_EM_BH', 'SOMENTE_EM_ZETRA'].map((status) => (
                          <label key={status} className="flex items-center text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={statusFilter.includes(status)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setStatusFilter([...statusFilter, status]);
                                } else {
                                  setStatusFilter(statusFilter.filter((s) => s !== status));
                                }
                              }}
                              className="mr-2 w-4 h-4 rounded"
                            />
                            <span className="text-xs">{getStatusConfig(status).label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
                <Table>
                  <TableHeader className="bg-slate-700">
                    <TableRow className="border-slate-700">
                      <TableHead className="text-xs font-bold text-gray-300">Nome</TableHead>
                      <TableHead className="text-xs font-bold">Região</TableHead>
                      <TableHead className="text-xs font-bold">CPF</TableHead>
                      <TableHead className="text-xs font-bold">Produto</TableHead>
                      <TableHead className="text-xs font-bold">Data Entrada</TableHead>
                      <TableHead className="text-xs font-bold text-right">Vlr Liberado</TableHead>
                      <TableHead className="text-xs font-bold">Situação</TableHead>
                      <TableHead className="text-xs font-bold text-right">Vlr Prestação</TableHead>
                      <TableHead className="text-xs font-bold text-right">Vlr ADE</TableHead>
                      <TableHead className="text-xs font-bold text-right">Diferença</TableHead>
                      <TableHead className="text-xs font-bold text-right">Abs Dif</TableHead>
                      <TableHead className="text-xs font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDataFiltered.slice(0, 100).map((record, idx) => (
                      <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50 text-xs">
                        <TableCell className="font-medium truncate max-w-xs text-gray-300">{record.Nome}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-gray-300">
                          {bhData.some((r: MatchRecord) => r.Nome === record.Nome) ? 'BH' : 'Poá'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-gray-300">***{String(record.CPF_DIGITOS).slice(-4)}</TableCell>
                        <TableCell className="text-xs truncate max-w-xs text-gray-300">{record.Produto}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-gray-300">
                          {new Date(record.Data_Entrada).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap text-blue-400 font-semibold">
                          {record.Vlr_Liberado
                            ? `R$ ${record.Vlr_Liberado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs py-0 px-1 bg-slate-600 text-gray-300 border-slate-500">
                            {record.Situacao_Contrato}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap text-blue-400">
                          R$ {record.Valor_Prestacao_Soma.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap text-blue-400">
                          R$ {record._VLR_ADE.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap">
                          <span
                            className={
                              record.DIFERENCA === 0
                                ? 'text-green-400 font-bold'
                                : record.DIFERENCA > 0
                                  ? 'text-cyan-400'
                                  : 'text-yellow-400'
                            }
                          >
                            {record.DIFERENCA > 0 ? '+' : ''}
                            {record.DIFERENCA.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap text-yellow-400 font-semibold">
                          {record.ABS_DIF.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {(() => {
                            const config = getStatusConfig(record.STATUS);
                            return (
                              <Badge className={`${config.bgColor} ${config.color} flex items-center w-fit text-xs`}>
                                {config.icon}
                                {config.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {allDataFiltered.length > 100 && (
                <p className="text-sm text-gray-500 text-center">
                  Mostrando 100 de {allDataFiltered.length} registros
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGION TABS */}
        {['BH', 'POA'].map((region) => (
          <TabsContent
            key={region}
            value={region.toLowerCase()}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-gray-500">registros</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.matches}
                  </div>
                  <p className="text-xs text-gray-500">{stats.matchRate}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Não Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.noMatches}
                  </div>
                  <p className="text-xs text-gray-500">
                    {(100 - parseFloat(stats.matchRate)).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Diferença Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.avgDifference}</div>
                  <p className="text-xs text-gray-500">absoluta</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor Liberado</span>
                      <span className="font-bold">
                        R$ {stats.totalValue.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor ADE</span>
                      <span className="font-bold">
                        R$ {stats.totalADE.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm">
                      <span className="text-gray-600">Diferença Total</span>
                      <span className="font-bold">
                        R${' '}
                        {(stats.totalValue - stats.totalADE).toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
                <div>
                  <CardTitle className="text-white">Registros</CardTitle>
                  <CardDescription className="text-gray-400">
                    {filteredData.length} registros encontrados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Filtros
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => exportToExcel(filteredData, `averbadora_${activeTab}`)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {showFilters && (
                  <div className="bg-slate-700 p-4 rounded-lg space-y-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-semibold">Filtros Avançados</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowFilters(false);
                          setStatusFilter([]);
                          setMinValue('');
                          setMaxValue('');
                          setSearchTerm('');
                        }}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Input
                        placeholder="🔍 Buscar por nome, CPF ou produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-gray-300 text-sm mb-2 block">Valor Mín (R$)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm mb-2 block">Valor Máx (R$)</label>
                        <Input
                          type="number"
                          placeholder="999999"
                          value={maxValue}
                          onChange={(e) => setMaxValue(e.target.value)}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm mb-2 block">Status</label>
                        <div className="space-y-2">
                          {['MATCH', 'MISMATCH', 'SOMENTE_EM_EM_BH', 'SOMENTE_EM_ZETRA'].map((status) => (
                            <label key={status} className="flex items-center text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={statusFilter.includes(status)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStatusFilter([...statusFilter, status]);
                                  } else {
                                    setStatusFilter(statusFilter.filter((s) => s !== status));
                                  }
                                }}
                                className="mr-2 w-4 h-4 rounded"
                              />
                              <span className="text-xs">{getStatusConfig(status).label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border rounded-lg border-slate-700 bg-slate-900">
                  <Table>
                    <TableHeader className="bg-slate-700">
                      <TableRow className="border-slate-700">
                        <TableHead className="text-xs font-bold text-gray-300">Nome</TableHead>
                        <TableHead className="text-xs font-bold text-gray-300">CPF</TableHead>
                        <TableHead className="text-xs font-bold text-gray-300">Produto</TableHead>
                        <TableHead className="text-xs font-bold text-gray-300">Data Entrada</TableHead>
                        <TableHead className="text-xs font-bold text-right text-gray-300">Vlr Liberado</TableHead>
                        <TableHead className="text-xs font-bold text-gray-300">Situação</TableHead>
                        <TableHead className="text-xs font-bold text-right text-gray-300">Vlr Prestação</TableHead>
                        <TableHead className="text-xs font-bold text-right text-gray-300">Vlr ADE</TableHead>
                        <TableHead className="text-xs font-bold text-right text-gray-300">Diferença</TableHead>
                        <TableHead className="text-xs font-bold text-right text-gray-300">Abs Dif</TableHead>
                        <TableHead className="text-xs font-bold text-gray-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.slice(0, 100).map((record, idx) => (
                        <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50 text-xs">
                          <TableCell className="font-medium truncate max-w-xs text-gray-300">
                            {record.Nome}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap text-gray-300">
                            ***{String(record.CPF_DIGITOS).slice(-4)}
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-xs text-gray-300">
                            {record.Produto}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap text-gray-300">
                            {new Date(record.Data_Entrada).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap text-blue-400 font-semibold">
                            {record.Vlr_Liberado
                              ? `R$ ${record.Vlr_Liberado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-xs py-0 px-1 bg-slate-600 text-gray-300 border-slate-500">
                              {record.Situacao_Contrato}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap text-blue-400">
                            R$ {record.Valor_Prestacao_Soma.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap text-blue-400">
                            R$ {record._VLR_ADE.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap">
                            <span
                              className={
                                record.DIFERENCA === 0
                                  ? 'text-green-400 font-bold'
                                  : record.DIFERENCA > 0
                                    ? 'text-cyan-400'
                                    : 'text-yellow-400'
                              }
                            >
                              {record.DIFERENCA > 0 ? '+' : ''}
                              {record.DIFERENCA.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap text-yellow-400 font-semibold">
                            {record.ABS_DIF.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {(() => {
                              const config = getStatusConfig(record.STATUS);
                              return (
                                <Badge className={`${config.bgColor} ${config.color} flex items-center w-fit text-xs`}>
                                  {config.icon}
                                  {config.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredData.length > 100 && (
                  <p className="text-sm text-gray-400 text-center">
                    Mostrando 100 de {filteredData.length} registros
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* COMPARE TAB */}
        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo entre Regiões</CardTitle>
              <CardDescription>
                Análise de matches e valores por região
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Total de Registros" />
                  <Bar dataKey="matches" fill="#10b981" name="Matches" />
                  <Bar dataKey="noMatches" fill="#ef4444" name="Não Matches" />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(overviewStats.regions).map(([key, region]) => (
                  <Card key={key} className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">{region.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total de registros:</span>
                        <span className="font-bold">{region.records}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Matches:</span>
                        <span className="font-bold text-green-600">
                          {region.matches}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Não Matches:</span>
                        <span className="font-bold text-red-600">
                          {region.records - region.matches}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Taxa de Match:</span>
                        <span className="font-bold">
                          {(
                            (region.matches / region.records) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchAverbadora;
