import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, DollarSign, MapPin, TrendingUp, Download, RefreshCw, Search, BarChart3, ChevronDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapaBrasilSVG } from '@/components/cadastral/MapaBrasilSVG';
import { getApiUrl } from '@/lib/api-config';

// =====================
// TYPES
// =====================

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

// =====================
// MAIN COMPONENT
// =====================

export default function CadastralV2() {
  // =====================
  // STATES
  // =====================
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

  // =====================
  // FETCH DATA
  // =====================

  const fetchAllData = async (inicio?: string, fim?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Usar URL dinâmica baseada no hostname atual
      const baseUrl = getApiUrl(3003, 'VITE_EXTRATO_API_URL');
      
      console.log('[CadastralV2] Usando base URL:', baseUrl);
      
      const params = {
        ...(inicio && { dataInicio: inicio }),
        ...(fim && { dataFim: fim })
      };

      const [statsRes, clientesRes, mapaRes, evolucaoRes] = await Promise.all([
        axios.get(`${baseUrl}/api/cadastral/stats`, { params }),
        axios.get(`${baseUrl}/api/cadastral/clientes`, { params }),
        axios.get(`${baseUrl}/api/cadastral/mapa-cidades`, { params }),
        axios.get(`${baseUrl}/api/cadastral/evolucao-mensal`, { params })
      ]);

      setStats(statsRes.data);
      setClientes(clientesRes.data.clientes);
      setFilteredClientes(clientesRes.data.clientes);
      setMapaCidades(mapaRes.data.dados);
      setEvolucaoMensal(evolucaoRes.data.dados);

      console.log('[CadastralV2] Dados carregados com sucesso');
    } catch (err) {
      console.error('[CadastralV2] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // EFFECTS
  // =====================

  useEffect(() => {
    fetchAllData(dataInicio, dataFim);
  }, []);

  // Filtrar clientes
  useEffect(() => {
    let filtered = clientes;

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf_cnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status_conta?.toLowerCase().includes(statusFilter.toLowerCase()));
    }

    setFilteredClientes(filtered);
  }, [searchTerm, statusFilter, clientes]);

  // =====================
  // UTILITIES
  // =====================

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const isActive = status?.toLowerCase().includes('ativo');
    return (
      <Badge className={isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'}>
        {isActive ? '✓ Ativo' : '⊗ Inativo'}
      </Badge>
    );
  };

  const exportCSV = () => {
    const headers = ['Conta ID', 'Nome', 'CPF/CNPJ', 'Email', 'Número Conta', 'Status', 'Limite Crédito', 'Estado', 'Cidade', 'Data Criação'];
    const rows = filteredClientes.map(c => [
      c.account_id,
      c.nome,
      c.cpf_cnpj,
      c.email,
      c.numero_da_conta,
      c.status_conta,
      c.credit_limit.toFixed(2),
      c.estado,
      c.cidade,
      c.data_criacao || '-'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cadastral-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =====================
  // RENDER
  // =====================

  if (loading) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Carregando dados cadastrais...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-red-600 font-bold">❌ Erro:</p>
            <p className="text-red-500 text-sm">{error}</p>
            <Button onClick={() => fetchAllData(dataInicio, dataFim)} className="mt-4 w-full">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Cadastral de Clientes V2</h1>
            <p className="text-muted-foreground">Visão completa de clientes, créditos e distribuição geográfica</p>
          </div>
          <Button onClick={() => fetchAllData(dataInicio, dataFim)} size="sm" variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Clientes */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Clientes</p>
                  <p className="text-3xl font-bold">{stats?.total_clientes || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Ativos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.clientes_ativos || 0}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">{stats?.total_clientes ? `${((stats.clientes_ativos / stats.total_clientes) * 100).toFixed(1)}%` : '0%'}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Inativos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Clientes Inativos</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.clientes_inativos || 0}</p>
                </div>
                <Badge className="bg-red-100 text-red-800">{stats?.total_clientes ? `${((stats.clientes_inativos / stats.total_clientes) * 100).toFixed(1)}%` : '0%'}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cobertura Geográfica */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cobertura</p>
                  <p className="text-3xl font-bold">{stats?.total_estados || 0} Estados</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.total_cidades || 0} cidades</p>
                </div>
                <MapPin className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Valores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Crédito */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Crédito Liberado</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.total_credito_liberado || 0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Crédito Médio */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Crédito Médio por Cliente</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.credito_medio || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evolução Mensal */}
        {evolucaoMensal.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolução de Cadastros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-max">
                  {evolucaoMensal.map((mes, idx) => (
                    <div key={idx} className="border rounded p-4 min-w-[200px]">
                      <p className="text-sm font-medium text-muted-foreground">{mes.mes_nome} {mes.mes.split('-')[0]}</p>
                      <p className="text-2xl font-bold mt-2">{mes.total_cadastros}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatCurrency(mes.total_credito_liberado)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente, CPF/CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-md border border-input bg-background text-foreground text-sm min-w-[150px]"
              >
                <option value="all">Todos os status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
              <Button onClick={exportCSV} size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {/* Filtros de Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={() => fetchAllData(dataInicio, dataFim)} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </CardContent>
        </Card>

        {/* Tabela de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Clientes ({filteredClientes.length} de {clientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conta ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Limite Crédito</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{cliente.account_id}</TableCell>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell className="font-mono text-sm">{cliente.cpf_cnpj}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cliente.email}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(cliente.credit_limit)}</TableCell>
                        <TableCell className="font-medium">{cliente.estado}</TableCell>
                        <TableCell>{cliente.cidade}</TableCell>
                        <TableCell>{getStatusBadge(cliente.status_conta)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(cliente.data_criacao)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapa de Cidades */}
        {mapaCidades.length > 0 && (
          <>
            {/* Mapa Brasil SVG */}
            <div className="rounded-xl overflow-hidden backdrop-blur-sm" style={{ background: '#06162B', border: '2px solid #C48A3F' }}>
              <MapaBrasilSVG />
            </div>

            {/* Gráfico Visual - Distribuição Geográfica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Distribuição Geográfica - Mapa Visual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Gráfico de Pizza */}
                  <div>
                    <h3 className="text-center font-semibold mb-4">Clientes por Estado</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={mapaCidades
                            .reduce((acc: any[], curr) => {
                              const existe = acc.find(e => e.estado === curr.estado);
                              if (existe) {
                                existe.quantidade_clientes += curr.quantidade_clientes;
                              } else {
                                acc.push({
                                  estado: curr.estado,
                                  quantidade_clientes: curr.quantidade_clientes
                                });
                              }
                              return acc;
                            }, [])
                            .sort((a, b) => b.quantidade_clientes - a.quantidade_clientes)
                            .slice(0, 10)}
                          dataKey="quantidade_clientes"
                          nameKey="estado"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ estado, quantidade_clientes }) => `${estado}: ${quantidade_clientes}`}
                        >
                          {['#C48A3F', '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'].map((color, i) => (
                            <Cell key={`cell-${i}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#06162B', border: '1px solid #C48A3F' }}
                          labelStyle={{ color: '#C48A3F' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Ranking de Estados */}
                  <div>
                    <h3 className="text-center font-semibold mb-4">Top 10 Estados</h3>
                    <div className="space-y-3">
                      {mapaCidades
                        .reduce((acc: any[], curr) => {
                          const existe = acc.find(e => e.estado === curr.estado);
                          if (existe) {
                            existe.quantidade_clientes += curr.quantidade_clientes;
                            existe.total_credito_liberado += curr.total_credito_liberado;
                          } else {
                            acc.push({
                              estado: curr.estado,
                              quantidade_clientes: curr.quantidade_clientes,
                              total_credito_liberado: curr.total_credito_liberado
                            });
                          }
                          return acc;
                        }, [])
                        .sort((a, b) => b.quantidade_clientes - a.quantidade_clientes)
                        .slice(0, 10)
                        .map((estado, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded border" style={{ borderColor: '#C48A3F' }}>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: ['#C48A3F', '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'][idx] }}
                              />
                              <div>
                                <p className="font-semibold">{idx + 1}. {estado.estado}</p>
                                <p className="text-xs text-muted-foreground">{estado.quantidade_clientes} clientes</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(estado.total_credito_liberado)}</p>
                              <p className="text-xs text-muted-foreground">Crédito</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela Detalhada de Cidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Distribuição Detalhada - Por Cidade ({mapaCidades.length} cidades)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead className="text-right">Clientes</TableHead>
                        <TableHead className="text-right">Crédito Total</TableHead>
                        <TableHead className="text-right">Crédito Médio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mapaCidades.slice(0, 50).map((cidade, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{cidade.estado}</TableCell>
                          <TableCell>{cidade.cidade}</TableCell>
                          <TableCell className="text-right font-semibold">{cidade.quantidade_clientes}</TableCell>
                          <TableCell className="text-right">{formatCurrency(cidade.total_credito_liberado)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(cidade.credito_medio)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {mapaCidades.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-4">Mostrando 50 de {mapaCidades.length} cidades</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
