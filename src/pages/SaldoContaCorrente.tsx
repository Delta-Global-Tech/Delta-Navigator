import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter, ArrowUpDown, Wallet, TrendingUp, Lock, BarChart3, CreditCard, Users, CheckCircle2, Copy } from 'lucide-react';
import { useSync } from '@/providers/sync-provider';
import { getSaldoContaCorrenteData } from '@/data/saldoContaCorrenteApi';
import type { SaldoContaCorrente } from '@/data/saldoContaCorrenteApi';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TableRowProps {
  saldo: SaldoContaCorrente;
  index: number;
  copiedCell: string | null;
  onCopy: (text: string, cellId: string) => void;
}

const SaldoTableRow = memo(({ saldo, index, copiedCell, onCopy }: TableRowProps) => {
  const cellId = `${saldo.id}-${index}`;
  const statusColor = saldo.situacao?.toLowerCase().includes('ativa') ? '#10b981' : '#ef4444';
  
  const formatCurrency = (value: string | number | null): string => {
    if (!value) return 'R$ 0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  return (
    <TableRow key={cellId} className="border-b transition-colors hover:opacity-80" style={{borderColor: 'rgba(192, 134, 58, 0.1)', background: 'rgba(3, 18, 38, 0.5)'}}>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.6)', padding: '0.75rem'}} className="text-sm font-medium">{index + 1}</TableCell>
      <TableCell style={{color: '#FFFFFF', padding: '0.75rem'}} className="text-sm font-medium truncate">{saldo.cliente}</TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="font-mono text-xs">{saldo.nr_cpf_cnpj_cc}</TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-xs">{saldo.produto}</TableCell>
      <TableCell style={{color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem'}} className="text-xs">{saldo.gerente || '-'}</TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-right">
        <button 
          onClick={() => onCopy(parseFloat(String(saldo.sdo_disponivel || '0')).toFixed(2), cellId + '-disp')}
          className="relative inline-flex items-center gap-1 group hover:opacity-80 transition"
          title="Clique para copiar"
        >
          <span className="font-bold text-sm text-green-400">
            {formatCurrency(saldo.sdo_disponivel)}
          </span>
          {copiedCell === cellId + '-disp' ? (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" style={{color: '#C0863A'}} />
          )}
        </button>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-right">
        <button 
          onClick={() => onCopy(parseFloat(String(saldo.vlr_bloqueado || '0')).toFixed(2), cellId + '-bloq')}
          className="relative inline-flex items-center gap-1 group hover:opacity-80 transition"
          title="Clique para copiar"
        >
          <span className="font-bold text-sm text-red-400">
            {formatCurrency(saldo.vlr_bloqueado)}
          </span>
          {copiedCell === cellId + '-bloq' ? (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" style={{color: '#C0863A'}} />
          )}
        </button>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-right">
        <span className="font-semibold text-sm" style={{color: '#C0863A'}}>
          {formatCurrency(saldo.limite)}
        </span>
      </TableCell>
      <TableCell style={{padding: '0.75rem'}} className="text-center">
        <div className="w-2 h-2 rounded-full mx-auto" style={{backgroundColor: statusColor}}></div>
      </TableCell>
    </TableRow>
  );
});

SaldoTableRow.displayName = 'SaldoTableRow';

const SaldoContaCorrente = () => {
  const { updateSync, setRefreshing } = useSync();
  const [lastSync, setLastSync] = useState<string>('');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduto, setFilterProduto] = useState('todos');
  const [filterSituacao, setFilterSituacao] = useState('todos');
  
  const [sortBy, setSortBy] = useState('sdo_disponivel');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: saldoResponse, isLoading, error, isFetching } = useQuery({
    queryKey: ['saldo-conta-corrente'],
    queryFn: () => getSaldoContaCorrenteData(),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (saldoResponse) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      setLastSync(timestamp);
      updateSync(timestamp);
    }
  }, [saldoResponse, updateSync]);

  useEffect(() => {
    setRefreshing(isFetching);
  }, [isFetching, setRefreshing]);

  const saldoData = saldoResponse?.data || [];

  const produtosUnicos = useMemo(() => {
    const produtos = new Set(saldoData.map(s => s.produto).filter(Boolean));
    return Array.from(produtos).sort();
  }, [saldoData]);

  const situacoesUnicas = useMemo(() => {
    const situacoes = new Set(saldoData.map(s => s.situacao).filter(Boolean));
    return Array.from(situacoes).sort();
  }, [saldoData]);

  const sortSaldos = useCallback((saldos: SaldoContaCorrente[]) => {
    if (!saldos || saldos.length === 0) return saldos;
    
    return [...saldos].sort((a, b) => {
      let aValue: number | string = '';
      let bValue: number | string = '';
      
      if (sortBy === 'sdo_disponivel') {
        aValue = parseFloat(String(a.sdo_disponivel || '0'));
        bValue = parseFloat(String(b.sdo_disponivel || '0'));
      } else if (sortBy === 'vlr_bloqueado') {
        aValue = parseFloat(String(a.vlr_bloqueado || '0'));
        bValue = parseFloat(String(b.vlr_bloqueado || '0'));
      } else if (sortBy === 'cliente') {
        aValue = a.cliente || '';
        bValue = b.cliente || '';
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [sortBy, sortOrder]);

  const filteredData = useMemo(() => {
    const filtered = saldoData.filter(saldo => {
      const matchesSearch = 
        (saldo.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (saldo.nr_cpf_cnpj_cc || '').includes(searchTerm);
      
      const matchesProduto = filterProduto === 'todos' || saldo.produto === filterProduto;
      const matchesSituacao = filterSituacao === 'todos' || saldo.situacao === filterSituacao;
      
      return matchesSearch && matchesProduto && matchesSituacao;
    });
    
    return sortSaldos(filtered);
  }, [saldoData, searchTerm, filterProduto, filterSituacao, sortSaldos]);

  const formatCurrency = (value: string | number | null): string => {
    if (!value) return 'R$ 0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const kpis = useMemo(() => {
    const totalDisponivel = filteredData.reduce((sum: number, s) => sum + parseFloat(String(s.sdo_disponivel || '0')), 0);
    const totalBloqueado = filteredData.reduce((sum: number, s) => sum + parseFloat(String(s.vlr_bloqueado || '0')), 0);
    const totalLimite = filteredData.reduce((sum: number, s) => sum + parseFloat(String(s.limite || '0')), 0);
    
    return {
      contas: filteredData.length,
      disponivel: totalDisponivel,
      bloqueado: totalBloqueado,
      limite: totalLimite
    };
  }, [filteredData]);

  const produtoChart = useMemo(() => {
    const data: {[key: string]: {count: number; valor: number}} = {};
    
    filteredData.forEach((item: SaldoContaCorrente) => {
      const produto = item.produto || 'Sem Produto';
      if (!data[produto]) {
        data[produto] = { count: 0, valor: 0 };
      }
      data[produto].count++;
      data[produto].valor += parseFloat(String(item.sdo_disponivel || '0'));
    });
    
    return Object.entries(data).map(([name, value]) => ({
      name,
      count: value.count,
      valor: value.valor
    }));
  }, [filteredData]);

  const handleCopy = useCallback((text: string, cellId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 2000);
  }, []);

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const excelData = filteredData.map((saldo, index) => ({
      '#': index + 1,
      'Cliente': saldo.cliente,
      'CPF/CNPJ': saldo.nr_cpf_cnpj_cc,
      'Produto': saldo.produto,
      'Disponível': formatCurrency(saldo.sdo_disponivel),
      'Bloqueado': formatCurrency(saldo.vlr_bloqueado),
      'Limite': formatCurrency(saldo.limite),
      'Gerente': saldo.gerente,
      'Situação': saldo.situacao
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Saldo Conta Corrente');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `saldo_conta_corrente_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="backdrop-blur-md rounded-xl p-3 shadow-2xl border border-opacity-30" style={{
          background: 'linear-gradient(135deg, rgba(3, 18, 38, 0.95) 0%, rgba(10, 27, 51, 0.95) 100%)',
          borderColor: '#C0863A'
        }}>
          <p className="font-bold text-sm" style={{color: '#C0863A'}}>{payload[0].payload.name}</p>
          <p className="text-xs text-gray-300 mt-1">Contas: {payload[0].payload.count}</p>
          <p className="text-xs font-semibold mt-1" style={{color: '#10b981'}}>{formatCurrency(payload[0].payload.valor)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-2 md:p-4" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)' }}>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg" style={{color: '#C0863A'}}>Carregando saldos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-2 md:p-4" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)' }}>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-red-600">Erro ao carregar saldos</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-4" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)' }}>
      <div className="w-full mx-auto space-y-6 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3" style={{ color: '#C0863A' }}>
              💰 Saldo Conta Corrente
              {isFetching && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#C0863A' }}></div>
              )}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="mt-1">Análise completa de saldos e disponibilidades</p>
          </div>
          <div className="text-right">
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="text-sm">Última atualização</p>
            <p className="text-lg font-semibold" style={{ color: '#C0863A' }}>{lastSync || '--:--:--'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#10b981'}}>
                <Wallet className="h-4 w-4" />
                Total Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{color: '#10b981'}}>{formatCurrency(kpis.disponivel)}</div>
              <p className="text-xs mt-2" style={{color: 'rgba(16, 185, 129, 0.7)'}}>{kpis.contas} contas</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#ef4444'}}>
                <Lock className="h-4 w-4" />
                Total Bloqueado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{color: '#ef4444'}}>{formatCurrency(kpis.bloqueado)}</div>
              <p className="text-xs mt-2" style={{color: 'rgba(239, 68, 68, 0.7)'}}>Valor congelado</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(192, 134, 58, 0.1) 0%, rgba(192, 134, 58, 0.05) 100%)', border: '1px solid rgba(192, 134, 58, 0.3)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#C0863A'}}>
                <TrendingUp className="h-4 w-4" />
                Total em Limite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{color: '#C0863A'}}>{formatCurrency(kpis.limite)}</div>
              <p className="text-xs mt-2" style={{color: 'rgba(192, 134, 58, 0.7)'}}>Limite disponível</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#3b82f6'}}>
                <Users className="h-4 w-4" />
                Total de Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{color: '#3b82f6'}}>{kpis.contas}</div>
              <p className="text-xs mt-2" style={{color: 'rgba(59, 130, 246, 0.7)'}}>de {saldoData.length} total</p>
            </CardContent>
          </Card>
        </div>

        {produtoChart.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-2xl" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(192, 134, 58, 0.3)' }}>
              <CardHeader style={{borderColor: 'rgba(192, 134, 58, 0.2)', borderBottom: '1px solid rgba(192, 134, 58, 0.2)'}}>
                <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
                  <BarChart3 className="h-5 w-5" />
                  Saldo por Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={produtoChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(192, 134, 58, 0.2)" />
                    <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="valor" fill="#C0863A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl" style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(192, 134, 58, 0.3)' }}>
              <CardHeader style={{borderColor: 'rgba(192, 134, 58, 0.2)', borderBottom: '1px solid rgba(192, 134, 58, 0.2)'}}>
                <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
                  <BarChart3 className="h-5 w-5" />
                  Quantidade por Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={produtoChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(192, 134, 58, 0.2)" />
                    <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="font-semibold text-sm" style={{color: '#C0863A'}}>🔍 Pesquisar</Label>
                <Input
                  id="search"
                  placeholder="Cliente ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}
                  className="placeholder-gray-500 focus:border-yellow-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="produto" className="font-semibold text-sm" style={{color: '#C0863A'}}>📦 Produto</Label>
                <Select value={filterProduto} onValueChange={setFilterProduto}>
                  <SelectTrigger style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Produtos</SelectItem>
                    {produtosUnicos.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="situacao" className="font-semibold text-sm" style={{color: '#C0863A'}}>✅ Situação</Label>
                <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                  <SelectTrigger style={{background: '#0a1b33', borderColor: 'rgba(192, 134, 58, 0.3)', color: '#FFFFFF'}}>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {situacoesUnicas.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-sm" style={{color: '#C0863A'}}>⚙️ Ações</Label>
                <div className="flex gap-2 h-12">
                  <Button
                    onClick={handleExport}
                    style={{background: '#C0863A', color: '#031226'}}
                    className="flex-1 hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-2xl" 
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)'
          }}>
          <CardHeader className="border-b" style={{borderColor: 'rgba(192, 134, 58, 0.2)'}}>
            <CardTitle className="flex items-center gap-2" style={{color: '#C0863A'}}>
              <CreditCard className="h-5 w-5" />
              Saldos ({filteredData.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{borderColor: 'rgba(192, 134, 58, 0.1)'}}>
                    <TableHead className="w-12" style={{color: '#C0863A'}}>#</TableHead>
                    <TableHead style={{color: '#C0863A'}}>Cliente</TableHead>
                    <TableHead style={{color: '#C0863A'}}>CPF/CNPJ</TableHead>
                    <TableHead style={{color: '#C0863A'}}>Produto</TableHead>
                    <TableHead style={{color: '#C0863A'}}>Gerente</TableHead>
                    <TableHead style={{color: '#C0863A'}} className="text-right">
                      <button onClick={() => setSortBy('sdo_disponivel')} className="flex items-center gap-1 ml-auto">
                        Disponível {sortBy === 'sdo_disponivel' && <ArrowUpDown className="h-4 w-4" />}
                      </button>
                    </TableHead>
                    <TableHead style={{color: '#C0863A'}} className="text-right">
                      <button onClick={() => setSortBy('vlr_bloqueado')} className="flex items-center gap-1 ml-auto">
                        Bloqueado {sortBy === 'vlr_bloqueado' && <ArrowUpDown className="h-4 w-4" />}
                      </button>
                    </TableHead>
                    <TableHead style={{color: '#C0863A'}} className="text-right">Limite</TableHead>
                    <TableHead style={{color: '#C0863A'}} className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((saldo, index) => (
                      <SaldoTableRow 
                        key={saldo.id} 
                        saldo={saldo} 
                        index={index} 
                        copiedCell={copiedCell}
                        onCopy={handleCopy}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8" style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                        Nenhum saldo encontrado
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

export default memo(SaldoContaCorrente);

