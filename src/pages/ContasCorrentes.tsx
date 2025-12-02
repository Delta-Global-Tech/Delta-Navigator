import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark, Search, Filter, Download, ArrowUpDown } from 'lucide-react';
import { useSync } from '@/providers/sync-provider';
import { getContasCorrentesData } from '@/data/contasCorrentesApi';
import type { ContaCorrente } from '@/data/contasCorrentesApi';
import * as XLSX from 'xlsx';

const ContasCorrentes = () => {
  const { updateSync, setRefreshing } = useSync();
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterProduto, setFilterProduto] = useState('todos');
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState('dt_ult_mov');
  const [sortOrder, setSortOrder] = useState('desc');

  // Query para buscar dados das contas correntes
  const { data: contasResponse, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['contas-correntes'],
    queryFn: () => getContasCorrentesData(),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Atualizar sync quando dados chegarem
  useEffect(() => {
    if (contasResponse) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[CONTAS CORRENTES] Atualizando sync para:', timestamp);
      updateSync(timestamp);
    }
  }, [contasResponse, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(isFetching);
  }, [isFetching, setRefreshing]);

  const contasData = contasResponse?.data || [];

  // Extrair tipos e produtos únicos para os filtros
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(contasData.map(conta => conta.tipo).filter(Boolean));
    return Array.from(tipos).sort();
  }, [contasData]);

  const produtosUnicos = useMemo(() => {
    const produtos = new Set(contasData.map(conta => conta.produto).filter(Boolean));
    return Array.from(produtos).sort();
  }, [contasData]);

  // Função para ordenar contas
  const sortContas = (contas: ContaCorrente[]) => {
    if (!contas || contas.length === 0) return contas;
    
    return [...contas].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      if (sortBy === 'dt_ult_mov') {
        aValue = a.dt_ult_mov ? new Date(a.dt_ult_mov) : new Date(0);
        bValue = b.dt_ult_mov ? new Date(b.dt_ult_mov) : new Date(0);
      } else if (sortBy === 'dt_abert') {
        aValue = a.dt_abert ? new Date(a.dt_abert) : new Date(0);
        bValue = b.dt_abert ? new Date(b.dt_abert) : new Date(0);
      } else if (sortBy === 'nome_cliente') {
        aValue = a.nome_cliente || '';
        bValue = b.nome_cliente || '';
      } else if (sortBy === 'nr_agencia') {
        aValue = a.nr_agencia || '';
        bValue = b.nr_agencia || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Filtrar dados localmente
  const filteredData = useMemo(() => {
    const filtered = contasData.filter(conta => {
      const matchesSearch = 
        (conta.nome_cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conta.usuario_resumido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conta.nr_agencia || '').includes(searchTerm);
      
      const matchesTipo = filterTipo === 'todos' || conta.tipo === filterTipo;
      const matchesProduto = filterProduto === 'todos' || conta.produto === filterProduto;
      
      return matchesSearch && matchesTipo && matchesProduto;
    });
    
    return sortContas(filtered);
  }, [contasData, searchTerm, filterTipo, filterProduto, sortBy, sortOrder]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return '-';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const excelData = filteredData.map((conta, index) => ({
      '#': index + 1,
      'ID': conta.id,
      'Agência': conta.nr_agencia,
      'Usuário': conta.usuario_resumido,
      'Nome Cliente': conta.nome_cliente,
      'Tipo': conta.tipo,
      'Produto': conta.produto,
      'Data Abertura': formatDate(conta.dt_abert),
      'Última Movimentação': formatDate(conta.dt_ult_mov)
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contas Correntes');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `contas_correntes_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    console.log('Contas correntes exportadas para:', fileName);
  };

  const limparFiltros = () => {
    setSearchTerm('');
    setFilterTipo('todos');
    setFilterProduto('todos');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Carregando contas correntes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-red-600">Erro ao carregar contas correntes</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Landmark className="h-8 w-8 text-blue-600" />
          Contas Correntes
          {isFetching && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          )}
        </h1>
        <Button 
          onClick={handleExport}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Pesquisar</Label>
              <Input
                id="search"
                placeholder="Nome, usuário ou agência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {tiposUnicos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="produto">Produto</Label>
              <Select value={filterProduto} onValueChange={setFilterProduto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Produtos</SelectItem>
                  {produtosUnicos.map(produto => (
                    <SelectItem key={produto} value={produto}>
                      {produto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={limparFiltros}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de dados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">de {contasData.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tipos Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiposUnicos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtosUnicos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredData.map(c => c.nome_cliente)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Contas Correntes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Contas ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Nome Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      if (sortBy === 'dt_abert') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('dt_abert');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Data Abertura
                      {sortBy === 'dt_abert' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      if (sortBy === 'dt_ult_mov') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('dt_ult_mov');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Última Movimentação
                      {sortBy === 'dt_ult_mov' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((conta, index) => (
                    <TableRow key={conta.id} className="hover:bg-accent/50">
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{conta.id}</TableCell>
                      <TableCell className="font-mono">{conta.nr_agencia}</TableCell>
                      <TableCell>{conta.usuario_resumido}</TableCell>
                      <TableCell className="font-medium">{conta.nome_cliente}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {conta.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {conta.produto}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(conta.dt_abert)}</TableCell>
                      <TableCell className="text-sm">{formatDate(conta.dt_ult_mov)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma conta corrente encontrada
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

export default ContasCorrentes;
