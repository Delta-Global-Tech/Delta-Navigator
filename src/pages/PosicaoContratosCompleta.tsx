import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { RefreshCw, DollarSign, TrendingUp, Calendar, Clock, BarChart3, PieChart, Users, FileText, Filter, Download, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getApiEndpoint, logApiCall } from '@/lib/api-config';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

interface ContratoCompleto {
  nomeCliente: string;
  valorLiquido: number;
  valorIof: number;
  custoEmissao: number;
  valorFinanciado: number;
  valorTotalDevedor: number;
  valorParcelas: number;
  taxa: number;
  prestacoesPagasTotal: number;
  quantidadeDeParcelas: number;
  valorPago: number;
  saldoDevedorAtual: number;
  descricaoDoProduto: string;
  dataPrimeiroPagamento: string;
  dataUltimaParcela: string;
  tacQtdeMoeda: number;
  taxaReal: number;
  taxaCet: number;
  descConvenio: string;
  numeroContrato: string;
  dataEntrada: string;
  duracaoMeses: number;
  percentualPago: number;
  valorRestante: number;
}

interface Estatisticas {
  totalContratos: number;
  valorTotalDevedor: number;
  valorTotalPago: number;
  saldoDevedorTotal: number;
  ticketMedio: number;
  duracaoMediaMeses: number;
  percentualPagoMedio: number;
}

interface PosicaoCompleta {
  contratos: ContratoCompleto[];
  estatisticas: Estatisticas;
}

const PosicaoContratosCompleta: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<PosicaoCompleta | null>(null);
  // ...existing code...
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    produtos: [] as string[],
    nomeCliente: '',
    taxaMinima: '',
    taxaMaxima: ''
  });

  // Estados para ordenação
  const [ordenacao, setOrdenacao] = useState<{
    campo: string | null;
    direcao: 'asc' | 'desc';
  }>({
    campo: null,
    direcao: 'asc'
  });

  const fetchDados = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = getApiEndpoint('POSTGRES', '/api/contratos/posicao-completa');
      logApiCall(endpoint, 'REQUEST');
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setDados(data);
    } catch (err) {
      console.error('Erro ao buscar dados de posição completa:', err);
      setError(`Erro ao carregar dados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Função para manipular ordenação
  const handleSort = (campo: string) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Função para ordenar contratos
  const ordenarContratos = (contratos: ContratoCompleto[]) => {
    if (!ordenacao.campo) return contratos;

    return [...contratos].sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (ordenacao.campo) {
        case 'prestacoes':
          valorA = a.prestacoesPagasTotal;
          valorB = b.prestacoesPagasTotal;
          break;
        case 'prestacoes_percentage':
          valorA = (a.prestacoesPagasTotal / a.quantidadeDeParcelas) * 100;
          valorB = (b.prestacoesPagasTotal / b.quantidadeDeParcelas) * 100;
          break;
        default:
          return 0;
      }

      if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Dados filtrados
  const dadosFiltrados = useMemo(() => {
    if (!dados) return null;

    let contratos = dados.contratos;

    // Filtro por data de entrada
    if (filtros.dataInicio) {
      contratos = contratos.filter(c => new Date(c.dataEntrada) >= new Date(filtros.dataInicio));
    }
    if (filtros.dataFim) {
      contratos = contratos.filter(c => new Date(c.dataEntrada) <= new Date(filtros.dataFim));
    }

    // Filtro por produtos (multi-seleção)
    if (filtros.produtos.length > 0) {
      contratos = contratos.filter(c => 
        filtros.produtos.some(produto => 
          c.descricaoDoProduto.toLowerCase().includes(produto.toLowerCase())
        )
      );
    }

    // Filtro por nome do cliente
    if (filtros.nomeCliente.trim()) {
      contratos = contratos.filter(c => 
        c.nomeCliente.toLowerCase().includes(filtros.nomeCliente.toLowerCase())
      );
    }

    // Filtro por taxa
    if (filtros.taxaMinima) {
      contratos = contratos.filter(c => c.taxa >= parseFloat(filtros.taxaMinima));
    }
    if (filtros.taxaMaxima) {
      contratos = contratos.filter(c => c.taxa <= parseFloat(filtros.taxaMaxima));
    }

    // Aplicar ordenação aos contratos filtrados
    contratos = ordenarContratos(contratos);

    // Calcular estatísticas filtradas
    const estatisticas = {
      totalContratos: contratos.length,
      valorTotalDevedor: contratos.reduce((sum, c) => sum + c.valorTotalDevedor, 0),
      valorTotalPago: contratos.reduce((sum, c) => sum + c.valorPago, 0),
      saldoDevedorTotal: contratos.reduce((sum, c) => sum + c.saldoDevedorAtual, 0),
      ticketMedio: contratos.length > 0 ? contratos.reduce((sum, c) => sum + c.valorFinanciado, 0) / contratos.length : 0,
      duracaoMediaMeses: contratos.filter(c => c.duracaoMeses > 0).length > 0 ?
        contratos.filter(c => c.duracaoMeses > 0).reduce((sum, c) => sum + c.duracaoMeses, 0) / 
        contratos.filter(c => c.duracaoMeses > 0).length : 0,
      percentualPagoMedio: contratos.length > 0 ? 
        contratos.reduce((sum, c) => sum + c.percentualPago, 0) / contratos.length : 0
    };

    return { contratos, estatisticas };
  }, [dados, filtros, ordenacao]);

  // Dados para gráfico de linha (evolução mensal)
  const dadosGraficoLinha = useMemo(() => {
    if (!dadosFiltrados) return [];

    const agrupados = dadosFiltrados.contratos.reduce((acc, contrato) => {
      const mes = new Date(contrato.dataEntrada).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: '2-digit' 
      });
      
      if (!acc[mes]) {
        acc[mes] = {
          mes,
          valorFinanciado: 0,
          valorDevedor: 0,
          jurosBrutos: 0
        };
      }
      
      acc[mes].valorFinanciado += contrato.valorFinanciado;
      acc[mes].valorDevedor += contrato.valorTotalDevedor;
      acc[mes].jurosBrutos += (contrato.valorTotalDevedor - contrato.valorFinanciado);
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agrupados).sort((a: any, b: any) => a.mes.localeCompare(b.mes));
  }, [dadosFiltrados]);

  // Dados para gráfico de barras (quantidade por mês)
  const dadosGraficoBarra = useMemo(() => {
    if (!dadosFiltrados) return [];

    const agrupados = dadosFiltrados.contratos.reduce((acc, contrato) => {
      const mes = new Date(contrato.dataEntrada).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: '2-digit' 
      });
      
      if (!acc[mes]) {
        acc[mes] = { mes, quantidade: 0 };
      }
      
      acc[mes].quantidade += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agrupados).sort((a: any, b: any) => a.mes.localeCompare(b.mes));
  }, [dadosFiltrados]);

  // KPIs ponderados adicionais
  const taxaCetMediaPonderada = useMemo(() => {
    if (!dadosFiltrados) return 0;
    const contratos = dadosFiltrados.contratos;
    // usar saldoDevedorAtual como peso quando disponível, senão fallback para valorTotalDevedor
    const pesoTotal = contratos.reduce((s, c) => s + ((c.saldoDevedorAtual != null ? c.saldoDevedorAtual : c.valorTotalDevedor) || 0), 0);
    if (pesoTotal === 0) return 0;
    const somaPonderada = contratos.reduce((s, c) => {
      const peso = (c.saldoDevedorAtual != null ? c.saldoDevedorAtual : c.valorTotalDevedor) || 0;
      return s + ((c.taxaCet || 0) * peso);
    }, 0);
    return somaPonderada / pesoTotal;
  }, [dadosFiltrados]);

  const jurosBrutos = useMemo(() => {
    if (!dadosFiltrados) return 0;
    // Normalizar: juros brutos = saldoDevedorTotal (agregado filtrado) - totalFinanciado
    const saldoTotal = dadosFiltrados.estatisticas.saldoDevedorTotal || 0;
    const totalFin = dadosFiltrados.contratos.reduce((s, c) => s + (c.valorFinanciado || 0), 0);
    return Math.max(0, saldoTotal - totalFin);
  }, [dadosFiltrados]);

  const totalFinanciado = useMemo(() => {
    if (!dadosFiltrados) return 0;
    return dadosFiltrados.contratos.reduce((s, c) => s + (c.valorFinanciado || 0), 0);
  }, [dadosFiltrados]);

  const prazoMedioPonderado = useMemo(() => {
    if (!dadosFiltrados) return 0;
    const contratos = dadosFiltrados.contratos;
    // usar saldoDevedorAtual como peso quando disponível
    const pesoTotal = contratos.reduce((s, c) => s + ((c.saldoDevedorAtual != null ? c.saldoDevedorAtual : c.valorTotalDevedor) || 0), 0);
    if (pesoTotal === 0) return 0;
    const soma = contratos.reduce((s, c) => {
      const peso = (c.saldoDevedorAtual != null ? c.saldoDevedorAtual : c.valorTotalDevedor) || 0;
      return s + ((c.duracaoMeses || 0) * peso);
    }, 0);
    return soma / pesoTotal;
  }, [dadosFiltrados]);

  // Top 5 produtos por saldo (para pie chart)
  const produtosTop5 = useMemo(() => {
    if (!dadosFiltrados) return [];
    const mapa: Record<string, number> = {};
    // usar saldoDevedorAtual como base para a carteira (exposição)
    dadosFiltrados.contratos.forEach(c => {
      const key = c.descricaoDoProduto || 'Sem Produto';
      const valor = (c.saldoDevedorAtual != null ? c.saldoDevedorAtual : c.valorTotalDevedor) || 0;
      mapa[key] = (mapa[key] || 0) + valor;
    });
    const arr = Object.keys(mapa).map(k => ({ produto: k, valor: mapa[k] }));
    arr.sort((a, b) => b.valor - a.valor);
    const top = arr.slice(0, 5);
    const somaTop = top.reduce((s, t) => s + t.valor, 0);
    const outros = arr.slice(5).reduce((s, t) => s + t.valor, 0);
    if (outros > 0) top.push({ produto: 'Outros', valor: outros });
    return top;
  }, [dadosFiltrados]);

  // Exportar top 5 produtos para CSV
  const exportTop5CSV = () => {
    if (!produtosTop5 || produtosTop5.length === 0) return;
    const total = produtosTop5.reduce((s, p) => s + p.valor, 0);
    const rows = produtosTop5.map(p => ({ produto: p.produto, valor: p.valor, percentual: total > 0 ? (p.valor / total) : 0 }));
    const header = ['produto', 'valor', 'percentual'];
    const csv = [header.join(',')].concat(rows.map(r => `${JSON.stringify(r.produto)},${(r.valor).toFixed(2)},${(r.percentual*100).toFixed(2)}`)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top5_produtos.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Exportar KPIs + contratos filtrados para Excel (XLSX)
  const exportPosicaoToExcel = () => {
    if (!dadosFiltrados) return;
    const workbook = XLSX.utils.book_new();

    // KPIs sheet
    const kpis: any[] = [
      { Métrica: 'Total de Contratos', Valor: dadosFiltrados.estatisticas.totalContratos },
      { Métrica: 'Valor Total Devedor (soma valorTotalDevedor)', Valor: dadosFiltrados.estatisticas.valorTotalDevedor },
      { Métrica: 'Saldo Devedor Total (saldoDevedorAtual agregado)', Valor: dadosFiltrados.estatisticas.saldoDevedorTotal },
      { Métrica: 'Valor Total Pago', Valor: dadosFiltrados.estatisticas.valorTotalPago },
      { Métrica: 'Total Financiado', Valor: totalFinanciado },
      { Métrica: 'Juros Brutos (Saldo - Financiado)', Valor: jurosBrutos },
      { Métrica: 'CET Média Ponderada', Valor: taxaCetMediaPonderada },
      { Métrica: 'Prazo Médio Ponderado (meses)', Valor: prazoMedioPonderado },
      { Métrica: 'Ticket Médio', Valor: dadosFiltrados.estatisticas.ticketMedio },
      { Métrica: 'Percentual Pago Médio', Valor: dadosFiltrados.estatisticas.percentualPagoMedio }
    ];

    const kpiSheet = XLSX.utils.json_to_sheet(kpis);
    XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');

    // Contratos sheet (todos os contratos filtrados)
    const contratosExport = dadosFiltrados.contratos.map(c => ({
      NomeCliente: c.nomeCliente,
      Produto: c.descricaoDoProduto,
      NumeroContrato: c.numeroContrato,
      ValorFinanciado: c.valorFinanciado,
      ValorTotalDevedor: c.valorTotalDevedor,
      ValorPago: c.valorPago,
      SaldoDevedorAtual: c.saldoDevedorAtual,
      SaldoTeorico: (c.valorTotalDevedor || 0) - (c.valorPago || 0),
      PrestacoesPagas: c.prestacoesPagasTotal,
      QuantidadeParcelas: c.quantidadeDeParcelas,
      PercentualPago: c.percentualPago,
      Taxa: c.taxa,
      TaxaReal: c.taxaReal,
      DuracaoMeses: c.duracaoMeses,
      DataEntrada: c.dataEntrada
    }));

    const contratosSheet = XLSX.utils.json_to_sheet(contratosExport);
    XLSX.utils.book_append_sheet(workbook, contratosSheet, 'Contratos');

    const filterSuffix = (filtros.produtos.length > 0 || filtros.nomeCliente || filtros.dataInicio || filtros.dataFim) ? `_filtrado` : '';
    const filename = `posicao_contratos${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Lista de produtos únicos para filtro
  const produtosUnicos = useMemo(() => {
    if (!dados) return [];
    const produtos = [...new Set(dados.contratos.map(c => c.descricaoDoProduto))];
    return produtos.sort();
  }, [dados]);

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      produtos: [],
      nomeCliente: '',
      taxaMinima: '',
      taxaMaxima: ''
    });
  };
  // ...existing code...

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchDados} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-full mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">
            Posição Completa de Contratos
          </h1>
          <p className="text-slate-400 text-lg">
            Análise detalhada com valor total devedor, valor pago e duração dos contratos
          </p>
        </div>

        {/* Filtros */}
        <Card 
          className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            borderColor: 'rgba(192, 134, 58, 0.3)',
            border: '1px solid rgba(192, 134, 58, 0.3)'
          }}
        >
          <CardHeader>
            <CardTitle 
              className="flex items-center gap-2 font-bold"
              style={{ color: '#C0863A' }}
            >
              <Filter className="h-5 w-5" />
              Filtros e Controles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              {/* Filtro de Data */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300" style={{ color: '#C0863A' }}>Data Início</label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-slate-100 focus:border-yellow-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300" style={{ color: '#C0863A' }}>Data Fim</label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-slate-100 focus:border-yellow-500"
                />
              </div>

              {/* Filtro de Nome */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300" style={{ color: '#C0863A' }}>Nome do Cliente</label>
                <Input
                  placeholder="Digite o nome..."
                  value={filtros.nomeCliente}
                  onChange={(e) => setFiltros({...filtros, nomeCliente: e.target.value})}
                  className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-yellow-500"
                />
              </div>

              {/* Filtro de Taxa */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300" style={{ color: '#C0863A' }}>Taxa (%)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    step="0.01"
                    value={filtros.taxaMinima}
                    onChange={(e) => setFiltros({...filtros, taxaMinima: e.target.value})}
                    className="w-20 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-yellow-500"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    step="0.01"
                    value={filtros.taxaMaxima}
                    onChange={(e) => setFiltros({...filtros, taxaMaxima: e.target.value})}
                    className="w-20 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Filtro de Produtos */}
            <div className="mb-4">
              <label className="text-sm mb-2 block" style={{ color: '#C0863A' }}>Produtos (Multi-seleção)</label>
              <div className="relative">
                <Select>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100 hover:border-yellow-500">
                    <SelectValue placeholder={filtros.produtos.length > 0 ? `${filtros.produtos.length} produtos selecionados` : "Selecione produtos..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFiltros({...filtros, produtos: []})}
                        className="w-full text-slate-300 hover:bg-slate-700 mb-2"
                        style={{ color: '#C0863A' }}
                      >
                        Limpar Seleção
                      </Button>
                      {produtosUnicos.map((produto) => (
                        <div
                          key={produto}
                          className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                          onClick={() => {
                            const novos = filtros.produtos.includes(produto)
                              ? filtros.produtos.filter(p => p !== produto)
                              : [...filtros.produtos, produto];
                            setFiltros({...filtros, produtos: novos});
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={filtros.produtos.includes(produto)}
                            onChange={() => {}}
                            className="text-yellow-500 bg-slate-800 border-slate-600 rounded focus:ring-yellow-500"
                          />
                          <span className="text-slate-100 text-sm flex-1">
                            {produto.length > 35 ? `${produto.substring(0, 35)}...` : produto}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              {filtros.produtos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filtros.produtos.map((produto) => (
                    <Badge
                      key={produto}
                      variant="secondary"
                      className="text-xs"
                      style={{ 
                        backgroundColor: 'rgba(192, 134, 58, 0.2)',
                        color: '#C0863A',
                        border: '1px solid rgba(192, 134, 58, 0.3)'
                      }}
                    >
                      {produto.length > 20 ? `${produto.substring(0, 20)}...` : produto}
                      <button
                        onClick={() => {
                          const novos = filtros.produtos.filter(p => p !== produto);
                          setFiltros({...filtros, produtos: novos});
                        }}
                        className="ml-1 hover:opacity-70"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Botões de Controle */}
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={fetchDados}
                disabled={loading}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 text-slate-900 hover:from-yellow-400 hover:to-orange-500 shadow-lg border-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar'}
              </Button>
              <Button
                onClick={limparFiltros}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              >
                Limpar Filtros
              </Button>
              <Button
                onClick={exportPosicaoToExcel}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
              <div className="text-sm text-slate-400">
                {dadosFiltrados ? `${dadosFiltrados.contratos.length} de ${dados?.contratos.length || 0} contratos` : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-yellow-500 mx-auto" />
              <p className="text-slate-400">Carregando dados completos...</p>
            </div>
          </div>
        )}

        {/* Estatísticas Principais */}
        {!loading && dadosFiltrados && (
          <>
            <div>
              {/* Total de Contratos */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-semibold" style={{ color: '#C48A3F' }}>
                    Total de Contratos
                  </CardTitle>
                  <Users className="h-6 w-6" style={{ color: '#C48A3F' }} />
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-3xl font-bold text-white mb-3">{formatNumber(dadosFiltrados.estatisticas.totalContratos)}</div>
                  <p className="text-sm text-gray-300">contratos ativos</p>
                </CardContent>
              </Card>

              {/* Valor Total Devedor */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-semibold" style={{ color: '#C48A3F' }}>
                    Valor Total Devedor
                  </CardTitle>
                  <DollarSign className="h-6 w-6" style={{ color: '#C48A3F' }} />
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-3xl font-bold text-white mb-2">{formatCurrency(dadosFiltrados.estatisticas.saldoDevedorTotal)}</div>
                  <div className="text-sm text-gray-300 mb-1">Valor Total Devedor (soma sdo_devedor_total)</div>
                  <div className="text-lg font-semibold text-green-300">Total Financiado: {formatCurrency(totalFinanciado)}</div>
                  <div className="text-lg font-semibold text-red-300">Juros Brutos: {formatCurrency(Math.max(0, dadosFiltrados.estatisticas.saldoDevedorTotal - totalFinanciado))}</div>
                </CardContent>
              </Card>

              {/* Valor Total Pago */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-semibold" style={{ color: '#C48A3F' }}>
                    Valor Total Pago
                  </CardTitle>
                  <TrendingUp className="h-6 w-6" style={{ color: '#22c55e' }} />
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-3xl font-bold text-green-400 mb-3">{formatCurrency(dadosFiltrados.estatisticas.valorTotalPago)}</div>
                  <p className="text-sm text-gray-300">
                    {formatPercentage(dadosFiltrados.estatisticas.percentualPagoMedio)} da carteira
                  </p>
                </CardContent>
              </Card>

              {/* Saldo Devedor (Atualizado: saldo - pago) */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-8 px-8">
                  <CardTitle className="text-lg font-semibold" style={{ color: '#C48A3F' }}>
                    Saldo Devedor Atual
                  </CardTitle>
                  <BarChart3 className="h-6 w-6" style={{ color: '#ef4444' }} />
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-sm text-gray-300 mb-2">Saldo fornecido pelo backend (soma sdo_devedor_total):</div>
                  <div className="text-2xl font-bold text-white mb-2">{formatCurrency(dadosFiltrados.estatisticas.saldoDevedorTotal)}</div>

                  <div className="text-sm text-gray-300 mb-1">Saldo após pagamentos (Saldo - Pago):</div>
                  <div className="text-2xl font-bold text-red-400 mb-2">{formatCurrency(Math.max(0, dadosFiltrados.estatisticas.saldoDevedorTotal - dadosFiltrados.estatisticas.valorTotalPago))}</div>

                  <div className="text-sm text-gray-300">Total Financiado:</div>
                  <div className="text-lg font-semibold text-green-300 mb-1">{formatCurrency(totalFinanciado)}</div>

                  <div className="text-sm text-gray-300">Juros Brutos (Saldo - Financiado):</div>
                  <div className="text-lg font-semibold text-red-300">{formatCurrency(jurosBrutos)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Cards Adicionais - Linha 1 */}
            <div>
              {/* Ticket Médio */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-8 px-8 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold" style={{ color: '#C48A3F' }}>
                    <PieChart className="h-6 w-6" />
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-3xl font-bold text-white mb-3">{formatCurrency(dadosFiltrados.estatisticas.ticketMedio)}</div>
                  <p className="text-sm text-gray-300">valor médio por contrato</p>
                </CardContent>
              </Card>

              {/* Duration - Conceito de Renda Fixa */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-8 px-8 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold" style={{ color: '#C48A3F' }}>
                    <Clock className="h-6 w-6" />
                    Duration (Média)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-3xl font-bold text-blue-400 mb-3">{dadosFiltrados.estatisticas.duracaoMediaMeses.toFixed(1)} meses</div>
                  <p className="text-sm text-gray-300">tempo médio para receber os fluxos de pagamento (cupons)</p>
                </CardContent>
              </Card>

              {/* Percentual Pago Médio */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-8 px-8 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold" style={{ color: '#C48A3F' }}>
                    <Calendar className="h-6 w-6" />
                    Taxa de Recuperação
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-3xl font-bold text-green-400 mb-3">{formatPercentage(dadosFiltrados.estatisticas.percentualPagoMedio)}</div>
                  <p className="text-sm text-gray-300">% médio recuperado da carteira</p>
                </CardContent>
              </Card>
            </div>

            {/* Cards Adicionais - Linha 2 - Novos KPIs */}
            <div>
              {/* CET Média Ponderada */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-6 px-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{ color: '#C48A3F' }}>
                    <BarChart3 className="h-5 w-5" />
                    CET Média Ponderada
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-2xl font-bold mb-2" style={{ color: '#C48A3F' }}>
                    {(taxaCetMediaPonderada * 100).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-300">ponderada pelo saldo devedor</p>
                </CardContent>
              </Card>

              {/* Prazo Médio Ponderado */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-6 px-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{ color: '#C48A3F' }}>
                    <Clock className="h-5 w-5" />
                    Prazo Médio Ponderado
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {prazoMedioPonderado.toFixed(1)} meses
                  </div>
                  <p className="text-xs text-gray-300">ponderado pelo saldo devedor</p>
                </CardContent>
              </Card>

              {/* Prestações Pagas Total */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-6 px-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{ color: '#C48A3F' }}>
                    <TrendingUp className="h-5 w-5" />
                    Prestações Pagas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {formatNumber(dadosFiltrados.contratos.reduce((sum, c) => sum + c.prestacoesPagasTotal, 0))}
                  </div>
                  <p className="text-xs text-gray-300">total de parcelas quitadas</p>
                </CardContent>
              </Card>

              {/* Eficiência de Cobrança */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-6 px-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{ color: '#C48A3F' }}>
                    <Users className="h-5 w-5" />
                    Eficiência Cobrança
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {formatPercentage(
                      (dadosFiltrados.contratos.reduce((sum, c) => sum + c.prestacoesPagasTotal, 0) / 
                       dadosFiltrados.contratos.reduce((sum, c) => sum + c.quantidadeDeParcelas, 0)) * 100
                    )}
                  </div>
                  <p className="text-xs text-gray-300">% de parcelas pagas vs. total</p>
                </CardContent>
              </Card>
            </div>

            {/* Segunda linha de KPIs - Novos KPIs Financeiros */}
            <div>
              {/* Valor Total Financiado */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader className="pt-6 px-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{ color: '#C48A3F' }}>
                    <DollarSign className="h-5 w-5" />
                    Total Financiado
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {formatCurrency(dadosFiltrados.contratos.reduce((sum, c) => sum + c.valorFinanciado, 0))}
                  </div>
                  <p className="text-xs text-gray-300">capital principal</p>
                </CardContent>
              </Card>

              {/* valor total pago (duplicado removido) */}

              {/* Juros Brutos */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                  borderColor: 'rgba(192, 134, 58, 0.3)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm" style={{ color: '#C0863A' }}>
                    <TrendingUp className="h-4 w-4" />
                    Juros Brutos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {formatCurrency(Math.max(0, dadosFiltrados.estatisticas.saldoDevedorTotal - totalFinanciado))}
                  </div>
                  <div className="text-sm text-slate-300 mb-1">
                    Total Devedor: {formatCurrency(dadosFiltrados.estatisticas.saldoDevedorTotal)}
                  </div>
                  <div className="text-xs text-slate-400">Juros brutos (Total Devedor - Total Financiado) • {((dadosFiltrados.estatisticas.saldoDevedorTotal > 0) ? (((dadosFiltrados.estatisticas.saldoDevedorTotal - totalFinanciado) / dadosFiltrados.estatisticas.saldoDevedorTotal) * 100).toFixed(2) : '0.00')}% da carteira</div>
                </CardContent>
              </Card>

              {/* Taxa Média Ponderada */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                  borderColor: 'rgba(192, 134, 58, 0.3)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm" style={{ color: '#C0863A' }}>
                    <BarChart3 className="h-4 w-4" />
                    Taxa Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {((dadosFiltrados.contratos.reduce((sum, c) => sum + (c.taxa * c.valorTotalDevedor), 0) / 
                       dadosFiltrados.contratos.reduce((sum, c) => sum + c.valorTotalDevedor, 0)) || 0).toFixed(2)}%
                  </div>
                  <p className="text-xs text-slate-400">ponderada por valor</p>
                </CardContent>
              </Card>
            </div>

            {/* Terceira linha - Duration Conceito */}
            <div>
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                  borderColor: 'rgba(192, 134, 58, 0.3)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm" style={{ color: '#C0863A' }}>
                    <Clock className="h-4 w-4" />
                    Duration - Conceito Renda Fixa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="min-w-0">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {(dadosFiltrados.contratos.reduce((sum, c) => sum + (c.duracaoMeses * c.valorTotalDevedor), 0) / 
                          dadosFiltrados.contratos.reduce((sum, c) => sum + c.valorTotalDevedor, 0)).toFixed(1)} meses
                      </div>
                      <p className="text-xs text-slate-400">Duration média ponderada</p>
                    </div>
                    <div className="flex-1 text-sm text-slate-300 leading-relaxed">
                      <strong style={{ color: '#C0863A' }}>Duration:</strong> Medida que indica o tempo médio que um investidor levará para receber os fluxos de pagamentos (cupons e principal) de um título. 
                      Representa a sensibilidade do preço do título às variações nas taxas de juros. 
                      <em style={{ color: '#C0863A' }}>Quanto maior a duration, maior o risco de taxa de juros.</em>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Gráficos */}
            <div>
              {/* Gráfico de Linha - Evolução Mensal */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                  borderColor: 'rgba(192, 134, 58, 0.3)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#C0863A' }}>
                    <TrendingUp className="h-5 w-5" />
                    Evolução Mensal dos Valores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dadosGraficoLinha}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#06162B" />
                      <XAxis dataKey="mes" stroke="#C48A3F" />
                      <YAxis stroke="#C48A3F" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#06162B',
                          border: '1px solid #C48A3F',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: any) => [formatCurrency(value), '']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="valorFinanciado" 
                        stroke="#C48A3F" 
                        name="Valor Financiado"
                        strokeWidth={3}
                        dot={{ fill: '#C48A3F', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#C48A3F', strokeWidth: 2, fill: '#ffffff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valorDevedor" 
                        stroke="#60A5FA" 
                        name="Valor Devedor"
                        strokeWidth={3}
                        dot={{ fill: '#60A5FA', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#60A5FA', strokeWidth: 2, fill: '#ffffff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="jurosBrutos" 
                        stroke="#F59E0B" 
                        name="Juros Brutos"
                        strokeWidth={3}
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart - Top 5 Produtos por Saldo */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                  borderColor: 'rgba(192, 134, 58, 0.3)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#C0863A' }}>
                    <PieChart className="h-5 w-5" />
                    Carteira por Produto (Top5)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-start">
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <ResponsiveContainer width="100%" height={320}>
                        <RePieChart>
                          <Pie
                            data={produtosTop5}
                            dataKey="valor"
                            nameKey="produto"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            labelLine={false}
                            label={({ percent, index }) => `${(percent*100).toFixed(0)}%`}
                          >
                            {produtosTop5.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={["#C48A3F", "#60A5FA", "#22c55e", "#F59E0B", "#A78BFA", "#64748b"][index % 6]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [formatCurrency(value), 'Saldo']} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ width: 220 }} className="text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-slate-100">Top 5 Produtos</strong>
                        <Button size="sm" onClick={exportTop5CSV} variant="ghost"><Download className="h-4 w-4 mr-2"/>Exportar</Button>
                      </div>
                      <div className="space-y-2">
                        {produtosTop5.map((p, i) => {
                          const total = produtosTop5.reduce((s, x) => s + x.valor, 0) || 1;
                          return (
                            <div key={p.produto} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span style={{ width: 12, height: 12, background: ["#C48A3F", "#60A5FA", "#22c55e", "#F59E0B", "#A78BFA", "#64748b"][i % 6], display: 'inline-block', borderRadius: 3 }} />
                                <span className="text-slate-100 break-words whitespace-normal">{p.produto}</span>
                              </div>
                              <div className="text-right text-slate-300">
                                <div>{formatCurrency(p.valor)}</div>
                                <div className="text-xs">{((p.valor / total) * 100).toFixed(2)}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Barras - Quantidade por Mês */}
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                  borderColor: 'rgba(192, 134, 58, 0.3)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#C0863A' }}>
                    <BarChart3 className="h-5 w-5" />
                    Quantidade de Contratos por Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dadosGraficoBarra} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C48A3F" stopOpacity={1} />
                          <stop offset="50%" stopColor="#B8793A" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#A06832" stopOpacity={0.8} />
                        </linearGradient>
                        <filter id="shadow" x="0" y="0" width="200%" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C48A3F" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#06162B" opacity={0.7} />
                      <XAxis 
                        dataKey="mes" 
                        stroke="#C48A3F" 
                        fontSize={12}
                        tickLine={{ stroke: '#C48A3F' }}
                        axisLine={{ stroke: '#C48A3F' }}
                      />
                      <YAxis 
                        stroke="#C48A3F" 
                        fontSize={12}
                        tickLine={{ stroke: '#C48A3F' }}
                        axisLine={{ stroke: '#C48A3F' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#06162B',
                          border: '2px solid #C48A3F',
                          borderRadius: '12px',
                          color: '#F9FAFB',
                          boxShadow: '0 8px 32px rgba(196, 138, 63, 0.3)'
                        }}
                        cursor={{ fill: 'rgba(196, 138, 63, 0.1)' }}
                      />
                      <Bar 
                        dataKey="quantidade" 
                        fill="url(#barGradient)"
                        name="Quantidade de Contratos"
                        radius={[8, 8, 0, 0]}
                        filter="url(#shadow)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Contratos */}
            <Card 
              className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
              style={{ 
                background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                borderColor: 'rgba(192, 134, 58, 0.3)',
                border: '1px solid rgba(192, 134, 58, 0.3)'
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: '#C0863A' }}>
                  {dadosFiltrados.contratos.length} Contratos Encontrados
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Detalhamento dos contratos com informações completas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="border-b-2 border-gray-600">
                        <th className="text-left py-6 px-6 font-semibold text-lg" style={{ color: '#C48A3F' }}>Cliente</th>
                        <th className="text-left py-6 px-6 font-semibold text-lg" style={{ color: '#C48A3F' }}>Produto</th>
                        <th className="text-right py-6 px-6 font-semibold text-lg" style={{ color: '#C48A3F' }}>
                          <div>Vlr. Financiado</div>
                          <div className="text-sm text-gray-400 font-normal">Total Devedor</div>
                        </th>
                        <th className="text-right py-6 px-6 font-semibold text-lg" style={{ color: '#C48A3F' }}>
                          <div>Vlr. Pago</div>
                          <div className="text-sm text-gray-400 font-normal">Saldo Atual</div>
                        </th>
                        
                        <th 
                          className="text-center py-6 px-6 font-semibold text-lg cursor-pointer hover:bg-yellow-900/20 transition-colors relative" 
                          style={{ color: '#C48A3F' }}
                          onClick={() => handleSort('prestacoes')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div>
                              <div>Prestações</div>
                              <div className="text-sm text-gray-400 font-normal">Pagas/Total</div>
                            </div>
                            <div className="flex flex-col">
                              {ordenacao.campo === 'prestacoes' ? (
                                ordenacao.direcao === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </div>
                          </div>
                        </th>
                        <th className="text-right py-6 px-6 font-semibold text-lg" style={{ color: '#C48A3F' }}>
                          <div>Vlr. Parcela</div>
                          <div className="text-sm text-gray-400 font-normal">Duration</div>
                        </th>
                        <th className="text-center py-6 px-6 font-semibold text-lg" style={{ color: '#C48A3F' }}>
                          <div>% Pago</div>
                          <div className="text-sm text-gray-400 font-normal">Taxa</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosFiltrados.contratos.slice(0, 50).map((contrato, index) => (
                        <tr key={index} className="border-b border-gray-600 hover:bg-yellow-900/20 transition-all duration-200">
                          {/* Cliente */}
                          <td className="py-6 px-6">
                            <div className="text-white font-medium truncate max-w-40 text-base" title={contrato.nomeCliente}>
                              {contrato.nomeCliente}
                            </div>
                          </td>

                          {/* Produto */}
                          <td className="py-6 px-6 align-top">
                            <div className="text-gray-300 text-sm whitespace-normal break-words max-w-full" title={contrato.descricaoDoProduto}>
                              {contrato.descricaoDoProduto}
                            </div>
                          </td>

                          {/* Valores Financiados */}
                          <td className="py-6 px-6 text-right">
                            <div className="text-blue-400 font-semibold text-base">
                              {formatCurrency(contrato.valorFinanciado)}
                            </div>
                            <div className="text-sm" style={{ color: '#C48A3F' }}>
                              {formatCurrency(contrato.valorTotalDevedor)}
                            </div>
                          </td>

                          {/* Valores Pagos + Saldo Remanescente (exibido na mesma coluna) */}
                          <td className="py-6 px-6 text-right">
                            <div className="text-green-400 font-semibold text-base">
                              {formatCurrency(contrato.valorPago)}
                            </div>
                            <div className="text-red-400 text-sm">
                              {formatCurrency(contrato.saldoDevedorAtual)}
                            </div>
                            <div className="text-yellow-300 text-sm mt-1">
                              Saldo após pagamento: {formatCurrency(Math.max(0, (contrato.saldoDevedorAtual || 0) - (contrato.valorPago || 0)))}
                            </div>
                          </td>

                          {/* Prestações */}
                          <td className="py-6 px-6 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-green-400 font-bold text-lg">
                                {contrato.prestacoesPagasTotal}
                              </div>
                              <div className="text-gray-400 text-sm">
                                de {contrato.quantidadeDeParcelas}
                              </div>
                              <div className={`text-sm px-3 py-1 rounded-full mt-2 ${
                                (contrato.prestacoesPagasTotal / contrato.quantidadeDeParcelas) > 0.8 ? 'bg-green-600/20 text-green-300' :
                                (contrato.prestacoesPagasTotal / contrato.quantidadeDeParcelas) > 0.5 ? 'bg-yellow-600/20 text-yellow-300' :
                                'bg-red-600/20 text-red-300'
                              }`}>
                                {formatPercentage((contrato.prestacoesPagasTotal / contrato.quantidadeDeParcelas) * 100)}
                              </div>
                            </div>
                          </td>

                          {/* Valor Parcela e Duration */}
                          <td className="py-6 px-6 text-right">
                            <div className="text-purple-400 font-semibold text-base">
                              {formatCurrency(contrato.valorParcelas)}
                            </div>
                            <div className="text-sm mt-2">
                              <Badge 
                                variant="outline" 
                                className="text-sm px-3 py-1"
                                style={{ 
                                  backgroundColor: 'rgba(196, 138, 63, 0.2)',
                                  color: '#C48A3F',
                                  border: '1px solid rgba(196, 138, 63, 0.3)'
                                }}
                              >
                                {contrato.duracaoMeses}m
                              </Badge>
                            </div>
                          </td>

                          {/* Percentual Pago e Taxa */}
                          <td className="py-6 px-6 text-center">
                            <div className="space-y-3">
                              <Badge 
                                variant="secondary" 
                                className={`text-base font-bold px-4 py-2 ${
                                  contrato.percentualPago > 80 ? 'bg-green-600 text-white' :
                                  contrato.percentualPago > 50 ? 'bg-yellow-600 text-white' : 
                                  'bg-red-600 text-white'
                                }`}
                              >
                                {formatPercentage(contrato.percentualPago)}
                              </Badge>
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-base" style={{ color: '#C48A3F' }}>
                                  {contrato.taxa.toFixed(2)}%
                                </span>
                                {contrato.taxaReal > 0 && (
                                  <span className="text-gray-500 text-sm">
                                    Real: {contrato.taxaReal.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* No Data State */}
        {!loading && !dados && (
          <Card 
            className="relative border-0 shadow-2xl overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(192, 134, 58, 0.3)'
            }}
          >
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum dado encontrado
              </h3>
              <p className="text-slate-400">
                Não foram encontrados dados de posição de contratos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PosicaoContratosCompleta;
