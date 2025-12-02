import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Users, DollarSign, MapPin, TrendingUp, Download, RefreshCw, Search, BarChart3, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getApiUrl } from '@/lib/api-config';
import { MapaBrasilSVG } from '@/components/cadastral/MapaBrasilSVG';
import { ClienteContratoModal } from '@/components/cadastral/ClienteContratoModal';

interface ClienteCadastral {
  account_id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  numero_da_conta: string;
  status_conta: string;
  credit_limit: number;
  estado: string;
  cidade: string;
  data_criacao: string | null;
  qtd_contratos?: number;
  total_contratado?: number;
  produtos?: string[];
  tem_contratos?: boolean;
}

interface EstatisticasCadastral {
  total_clientes: number;
  clientes_ativos: number;
  clientes_inativos: number;
  total_credito_liberado: number;
  credito_medio: number;
  total_estados: number;
  total_cidades: number;
}

interface MapaCidade {
  estado: string;
  cidade: string;
  quantidade_clientes: number;
  total_credito_liberado: number;
  credito_medio: number;
}

interface EvolucaoMensal {
  mes: string;
  mes_nome: string;
  total_cadastros: number;
  total_credito_liberado: number;
  credito_medio_mes: number;
}

const CORES_PRINCIPAIS = ['#C0863A', '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

export default function CadastralV3() {
  const [clientes, setClientes] = useState<ClienteCadastral[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<ClienteCadastral[]>([]);
  const [stats, setStats] = useState<EstatisticasCadastral | null>(null);
  const [mapaCidades, setMapaCidades] = useState<MapaCidade[]>([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<{ cpf: string; nome: string } | null>(null);
  const itemsPerPage = 10;

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = getApiUrl(3003, 'VITE_EXTRATO_API_URL');
      const params: any = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;

      const [statsRes, clientesRes, mapaRes, evolucaoRes, clientesComContratosRes] = await Promise.all([
        axios.get(`${baseUrl}/api/cadastral/stats`, { params }).catch(() => ({ data: null })),
        axios.get(`${baseUrl}/api/cadastral/clientes`, { params }).catch(() => ({ data: { clientes: [] } })),
        axios.get(`${baseUrl}/api/cadastral/mapa-cidades`, { params }).catch(() => ({ data: { dados: [] } })),
        axios.get(`${baseUrl}/api/cadastral/evolucao-mensal`, { params }).catch(() => ({ data: { dados: [] } })),
        axios.get(`${baseUrl}/api/cadastral/clientes-com-contratos`, { params }).catch(() => ({ data: { clientes: [] } }))
      ]);

      if (statsRes.data) setStats(statsRes.data);
      let clientesList = clientesRes.data?.clientes || [];
      
      // Enriquecer clientes com dados de contratos
      const clientesComContratos = clientesComContratosRes.data?.clientes || [];
      const mapaClientesContratos = new Map(clientesComContratos.map((c: any) => [c.cpf_cnpj, c]));
      
      clientesList = clientesList.map(cliente => {
        const contratoInfo = mapaClientesContratos.get(cliente.cpf_cnpj) as any;
        return {
          ...cliente,
          qtd_contratos: contratoInfo?.qtd_contratos || 0,
          total_contratado: contratoInfo?.total_contratado || 0,
          produtos: contratoInfo?.produtos || [],
          tem_contratos: contratoInfo?.tem_contratos || false
        };
      });
      
      setClientes(clientesList);
      setFilteredClientes(clientesList);
      if (mapaRes.data?.dados) setMapaCidades(mapaRes.data.dados);
      if (evolucaoRes.data?.dados) setEvolucaoMensal(evolucaoRes.data.dados);
    } catch (err) {
      console.error('[CadastralV3] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    let filtered = clientes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.nome?.toLowerCase().includes(term) ||
        c.cpf_cnpj?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        const status = c.status_conta?.toLowerCase() || '';
        return statusFilter === 'ativo' 
          ? (status.includes('desbloqueado') || status.includes('ativo'))
          : (status.includes('bloqueado') || status.includes('inativo'));
      });
    }
    setFilteredClientes(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, clientes]);

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value && value !== 0) return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    } catch {
      return date;
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column: string) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleClickCliente = (cpf: string, nome: string) => {
    setClienteSelecionado({ cpf, nome });
    setModalOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    const isActive = status.toLowerCase().includes('desbloqueado') || status.toLowerCase().includes('ativo');
    return <Badge className={isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}>
      {isActive ? '✓ Ativo' : '✗ Inativo'}
    </Badge>;
  };

  // Dados para gráfico de pizza (Estados)
  const estadosPizza = useMemo(() => {
    const grouped = mapaCidades.reduce((acc: any[], curr) => {
      const existe = acc.find(e => e.estado === curr.estado);
      if (existe) {
        existe.quantidade_clientes += curr.quantidade_clientes;
        existe.value = existe.quantidade_clientes;
      } else {
        acc.push({
          estado: curr.estado,
          quantidade_clientes: curr.quantidade_clientes,
          value: curr.quantidade_clientes
        });
      }
      return acc;
    }, []);
    return grouped.sort((a, b) => b.value - a.value).slice(0, 10);
  }, [mapaCidades]);

  // Dados para gráfico de barras (Top Cidades)
  const cidadesBars = useMemo(() => {
    return mapaCidades
      .sort((a, b) => b.quantidade_clientes - a.quantidade_clientes)
      .slice(0, 10)
      .map(c => ({
        cidade: `${c.cidade}, ${c.estado}`,
        clientes: c.quantidade_clientes,
        credito: c.total_credito_liberado / 1000
      }));
  }, [mapaCidades]);

  // Paginação
  const paginatedClientes = useMemo(() => {
    let sorted = [...filteredClientes];
    
    // Aplicar ordenação
    if (sortColumn) {
      sorted.sort((a, b) => {
        let valueA: any = a[sortColumn as keyof ClienteCadastral];
        let valueB: any = b[sortColumn as keyof ClienteCadastral];
        
        // Converter para número se for número
        const numA = !isNaN(valueA) && !isNaN(parseFloat(valueA)) ? parseFloat(valueA) : null;
        const numB = !isNaN(valueB) && !isNaN(parseFloat(valueB)) ? parseFloat(valueB) : null;
        
        // Se ambos são números (ou números como strings), comparar numericamente
        if (numA !== null && numB !== null) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
        
        // Converter para string e comparar
        const strA = String(valueA || '').toLowerCase();
        const strB = String(valueB || '').toLowerCase();
        
        if (sortDirection === 'asc') {
          return strA.localeCompare(strB, 'pt-BR');
        } else {
          return strB.localeCompare(strA, 'pt-BR');
        }
      });
    }
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredClientes, currentPage, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  const exportCSV = () => {
    const headers = ['Conta ID', 'Nome', 'CPF/CNPJ', 'Email', 'Limite', 'Estado', 'Cidade', 'Status', 'Data'];
    const rows = filteredClientes.map(c => [
      c.account_id || '', c.nome || '', c.cpf_cnpj || '', c.email || '',
      c.credit_limit?.toString() || '0', c.estado || '', c.cidade || '', c.status_conta || '', formatDate(c.data_criacao)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cadastral_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="w-96 bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            <p className="text-slate-200">Carregando sistema cadastral...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-400 font-bold mb-2">❌ Erro</p>
            <p className="text-slate-300 text-sm mb-4">{error}</p>
            <Button onClick={() => fetchAllData()} className="w-full bg-yellow-600 hover:bg-yellow-700">Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      <div className="w-full space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-lg border border-slate-600 shadow-lg">
          <div>
            <h1 className="text-5xl font-bold mb-2 text-white">Cadastral de Clientes V3</h1>
            <p className="text-slate-300 text-lg">Dashboard completo com análise geográfica e financeira em tempo real</p>
          </div>
          <Button onClick={() => fetchAllData()} size="lg" className="gap-2 border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-white transition-all px-6">
            <RefreshCw className="h-5 w-5" />
            Atualizar
          </Button>
        </div>

        {/* KPIs - LINHA 1 (4 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/20 via-slate-800 to-slate-700 border-blue-600/50 hover:border-blue-500 transition-all shadow-lg hover:shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-400 font-semibold mb-1">Total de Clientes</p>
                  <p className="text-4xl font-bold text-white">{stats?.total_clientes || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <Users className="h-10 w-10 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 via-slate-800 to-slate-700 border-green-600/50 hover:border-green-500 transition-all shadow-lg hover:shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-400 font-semibold mb-1">Clientes Ativos</p>
                  <p className="text-4xl font-bold text-green-500">{stats?.clientes_ativos || 0}</p>
                  {stats?.total_clientes && <p className="text-xs text-green-400 mt-2 font-semibold">{((stats.clientes_ativos / stats.total_clientes) * 100).toFixed(1)}%</p>}
                </div>
                <Badge className="bg-green-500/20 text-green-500 border-green-500/50">{stats?.total_clientes ? `${((stats.clientes_ativos / stats.total_clientes) * 100).toFixed(1)}%` : '0%'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/20 via-slate-800 to-slate-700 border-red-600/50 hover:border-red-500 transition-all shadow-lg hover:shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-400 font-semibold mb-1">Clientes Inativos</p>
                  <p className="text-4xl font-bold text-red-500">{stats?.clientes_inativos || 0}</p>
                  {stats?.total_clientes && <p className="text-xs text-red-400 mt-2 font-semibold">{((stats.clientes_inativos / stats.total_clientes) * 100).toFixed(1)}%</p>}
                </div>
                <Badge className="bg-red-500/20 text-red-500 border-red-500/50">{stats?.total_clientes ? `${((stats.clientes_inativos / stats.total_clientes) * 100).toFixed(1)}%` : '0%'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 via-slate-800 to-slate-700 border-orange-600/50 hover:border-orange-500 transition-all shadow-lg hover:shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400 font-semibold mb-1">Cobertura Geográfica</p>
                  <p className="text-4xl font-bold text-orange-500">{stats?.total_estados || 0}</p>
                  <p className="text-xs text-orange-400 mt-2 font-semibold">{stats?.total_cidades || 0} cidades</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-500/20 border border-orange-500/30">
                  <MapPin className="h-10 w-10 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CRÉDITOS - LINHA 2 (2 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-green-900/30 via-slate-800 to-slate-700 border-green-600/50 hover:border-green-500 transition-all shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-400 font-semibold mb-1">Total Crédito Liberado</p>
                  <p className="text-4xl font-bold text-green-500">{formatCurrency(stats?.total_credito_liberado)}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30">
                  <DollarSign className="h-10 w-10 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 via-slate-800 to-slate-700 border-purple-600/50 hover:border-purple-500 transition-all shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-400 font-semibold mb-1">Crédito Médio por Cliente</p>
                  <p className="text-4xl font-bold text-purple-500">{formatCurrency(stats?.credito_medio)}</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <TrendingUp className="h-10 w-10 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* EVOLUÇÃO MENSAL */}
        {evolucaoMensal && evolucaoMensal.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-yellow-500" />
                Evolução de Cadastros (Últimos Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={evolucaoMensal} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                  <defs>
                    <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCredito" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="mes_nome" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ background: '#1F2937', border: '2px solid #C0863A', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="total_cadastros" stroke="#22C55E" strokeWidth={3} name="Cadastros" dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="total_credito_liberado" stroke="#3B82F6" strokeWidth={3} name="Crédito (R$)" dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* GRÁFICOS - Linha 3 (Full Width) */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* Pizza - Estados */}
          {estadosPizza.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-slate-600 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-white">Distribuição por Estado (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie 
                      data={estadosPizza} 
                      dataKey="value" 
                      nameKey="estado" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={120}
                      innerRadius={40}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={true}
                    >
                      {estadosPizza.map((_, i) => <Cell key={`cell-${i}`} fill={CORES_PRINCIPAIS[i % CORES_PRINCIPAIS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1F2937', border: '2px solid #C0863A', borderRadius: '8px' }} formatter={(value) => `${value} clientes`} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Barras - Top Cidades */}
          {cidadesBars.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-slate-600 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-white">Top 10 Cidades por Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={cidadesBars} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C0863A" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#A0681F" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="cidade" angle={-45} textAnchor="end" height={100} stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ background: '#1F2937', border: '2px solid #C0863A', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="clientes" fill="url(#colorBar)" name="Clientes" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* MAPA BRASIL COM DADOS POR ESTADO */}
        {mapaCidades.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Mapa de Distribuição Geográfica - Clique em um Estado para Detalhes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden" style={{ background: '#06162B', border: '2px solid #C0863A', padding: '30px', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapaBrasilSVG />
              </div>
            </CardContent>
          </Card>
        )}

        {/* RANKING DE ESTADOS */}
        {mapaCidades.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-slate-600 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Top 10 Estados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {estadosPizza.slice(0, 10).map((estado, idx) => {
                  const totalEstado = mapaCidades
                    .filter(c => c.estado === estado.estado)
                    .reduce((sum, c) => sum + c.total_credito_liberado, 0);
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-slate-600 hover:border-yellow-500/50 transition-all hover:shadow-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full shadow-lg"
                          style={{ backgroundColor: CORES_PRINCIPAIS[idx % CORES_PRINCIPAIS.length] }}
                        />
                        <div>
                          <p className="font-semibold text-white">{idx + 1}. {estado.estado}</p>
                          <p className="text-xs text-slate-400">{estado.quantidade_clientes} clientes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-yellow-500">{formatCurrency(totalEstado)}</p>
                        <p className="text-xs text-slate-400">Crédito</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* FILTROS */}
        <Card className="bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-slate-600 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-white">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input placeholder="Buscar cliente, CPF/CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white text-base py-2" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white text-base font-medium">
                <option value="all">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
              <Button onClick={exportCSV} className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block font-semibold">Data Início</label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block font-semibold">Data Fim</label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <Button onClick={() => fetchAllData()} className="w-full gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2">
              <RefreshCw className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </CardContent>
        </Card>

        {/* TABELA COM PAGINAÇÃO */}
        <Card className="bg-gradient-to-br from-slate-800 via-slate-750 to-slate-700 border-slate-600 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">Clientes ({filteredClientes.length} de {clientes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClientes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 bg-slate-700/50">
                        <TableHead className="text-yellow-500 font-bold w-12">#</TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('account_id')}
                        >
                          Conta ID{getSortIndicator('account_id')}
                        </TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('nome')}
                        >
                          Nome{getSortIndicator('nome')}
                        </TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('cpf_cnpj')}
                        >
                          CPF/CNPJ{getSortIndicator('cpf_cnpj')}
                        </TableHead>
                        <TableHead className="text-yellow-500 font-bold">Email</TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold text-right cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('credit_limit')}
                        >
                          Limite Crédito{getSortIndicator('credit_limit')}
                        </TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('estado')}
                        >
                          Estado{getSortIndicator('estado')}
                        </TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('cidade')}
                        >
                          Cidade{getSortIndicator('cidade')}
                        </TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold text-center cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('qtd_contratos')}
                        >
                          Contratos{getSortIndicator('qtd_contratos')}
                        </TableHead>
                        <TableHead className="text-yellow-500 font-bold">Produtos EM</TableHead>
                        <TableHead 
                          className="text-yellow-500 font-bold text-right cursor-pointer hover:text-yellow-300 hover:bg-slate-600/50 transition"
                          onClick={() => handleSort('total_contratado')}
                        >
                          Total EM{getSortIndicator('total_contratado')}
                        </TableHead>
                        <TableHead className="text-yellow-500 font-bold text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedClientes.map((cliente, idx) => (
                        <TableRow key={cliente.account_id || idx} className="border-slate-700 hover:bg-slate-700/50 transition">
                          <TableCell className="text-slate-300 font-semibold">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                          <TableCell className="font-mono text-sm text-yellow-500 font-bold">{cliente.account_id || '-'}</TableCell>
                          <TableCell 
                            className="font-medium text-white max-w-xs truncate cursor-pointer hover:text-yellow-400 hover:underline transition flex items-center gap-2"
                            onClick={() => handleClickCliente(cliente.cpf_cnpj, cliente.nome)}
                            title="Clique para ver contratos"
                          >
                            {cliente.nome || '-'}
                            <FileText className="h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-300">{cliente.cpf_cnpj || '-'}</TableCell>
                          <TableCell className="text-slate-400 text-sm max-w-xs truncate">{cliente.email || '-'}</TableCell>
                          <TableCell className="text-right font-semibold text-green-400">{formatCurrency(cliente.credit_limit)}</TableCell>
                          <TableCell className="text-white font-medium">{cliente.estado || '-'}</TableCell>
                          <TableCell className="text-slate-300">{cliente.cidade || '-'}</TableCell>
                          <TableCell className="text-center">
                            {cliente.qtd_contratos && cliente.qtd_contratos > 0 ? (
                              <Badge className="bg-green-600 text-white">{cliente.qtd_contratos}</Badge>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {cliente.produtos && cliente.produtos.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {cliente.produtos.slice(0, 2).map((produto, i) => (
                                  <Badge key={i} className="bg-blue-600 text-white text-xs">{produto}</Badge>
                                ))}
                                {cliente.produtos.length > 2 && (
                                  <Badge className="bg-slate-600 text-white text-xs">+{cliente.produtos.length - 2}</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-yellow-400">
                            {cliente.total_contratado && cliente.total_contratado > 0 ? (
                              formatCurrency(cliente.total_contratado)
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(cliente.status_conta)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* PAGINAÇÃO */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Página {currentPage} de {totalPages} ({filteredClientes.length} clientes de {clientes.length} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                    >
                      ← Anterior
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                    >
                      Próxima →
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modal de Contratos */}
      {clienteSelecionado && (
        <ClienteContratoModal 
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setClienteSelecionado(null);
          }}
          cpfCnpj={clienteSelecionado.cpf}
          nomeCliente={clienteSelecionado.nome}
        />
      )}
    </div>
  );
}
