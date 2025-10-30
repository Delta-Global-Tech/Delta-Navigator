import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, RefreshCw, FileSpreadsheet, BarChart3, DollarSign, Clock, PieChart } from 'lucide-react';
import { getApiEndpoint, logApiCall } from '@/lib/api-config';
import * as XLSX from 'xlsx';

// Adicionando estilos personalizados dinamicamente
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes compareGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
      50% { box-shadow: 0 0 35px rgba(59, 130, 246, 0.4); }
    }
    
    @keyframes pulseComparison {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }
    
    .comparison-card {
      animation: compareGlow 3s ease-in-out infinite;
      transition: all 0.3s ease;
    }
    
    .comparison-card:hover {
      transform: translateY(-5px);
      animation: pulseComparison 2s ease-in-out infinite;
    }
    
    .metric-increase {
      color: #22c55e;
      animation: pulseComparison 2s ease-in-out infinite;
    }
    
    .metric-decrease {
      color: #ef4444;
      animation: pulseComparison 2s ease-in-out infinite;
    }
    
    .metric-stable {
      color: #f59e0b;
    }
  `;
  document.head.appendChild(styleSheet);
}

interface ComparativeDataCompleto {
  period: string;
  display: string;
  qtdContratos: number;
  valorFinanciado: number;
  valorTotalDevedor: number;
  valorTotalPago: number;
  saldoDevedorTotal: number;
  custoEmissao: number;
  valorIof: number;
  prestacoesPagasTotal: number;
  quantidadeParcelasTotal: number;
  ticketMedio: number;
  taxaMedia: number;
  taxaRealMedia: number;
  taxaCetMedia: number;
  duracaoMediaMeses: number;
  percentualPago: number;
  valorRestante: number;
}

const ComparativoPosicaoContratosCompleto: React.FC = () => {
  const [comparativeType, setComparativeType] = useState<'monthly' | 'daily'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeDataCompleto[]>([]);

  const fetchComparativeData = async (type: 'monthly' | 'daily') => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = type === 'monthly' 
        ? getApiEndpoint('CONTRATOS', '/api/contratos/comparativo-mensal-completo')
        : getApiEndpoint('CONTRATOS', '/api/contratos/comparativo-diario-completo');
      
      logApiCall(endpoint, 'REQUEST');
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setComparativeData(data);
    } catch (err) {
      console.error(`Erro ao buscar dados comparativos ${type}:`, err);
      setError(`Erro ao carregar dados comparativos: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparativeData(comparativeType);
  }, [comparativeType]);

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

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isIncrease: false, isDecrease: false };
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage),
      isIncrease: percentage > 0,
      isDecrease: percentage < 0
    };
  };

  const getVariationIcon = (variation: ReturnType<typeof calculateVariation>) => {
    if (variation.isIncrease) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (variation.isDecrease) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getVariationClass = (variation: ReturnType<typeof calculateVariation>) => {
    if (variation.isIncrease) return 'metric-increase';
    if (variation.isDecrease) return 'metric-decrease';
    return 'metric-stable';
  };

  const import { StaggeredContainer } from "@/components/motion/StaggeredContainer"
exportToExcel = () => {
    if (comparativeData.length === 0) return;

    const exportData = comparativeData.map(item => ({
      'Período': item.display,
      'Qtd Contratos': item.qtdContratos,
      'Valor Financiado': item.valorFinanciado,
      'Valor Total Devedor': item.valorTotalDevedor,
      'Valor Total Pago': item.valorTotalPago,
      'Saldo Devedor': item.saldoDevedorTotal,
      'Custo Emissão': item.custoEmissao,
      'Valor IOF': item.valorIof,
      'Prestações Pagas': item.prestacoesPagasTotal,
      'Quantidade Parcelas': item.quantidadeParcelasTotal,
      'Ticket Médio': item.ticketMedio,
      'Taxa Média': item.taxaMedia,
      'Taxa Real Média': item.taxaRealMedia,
      'Taxa CET Média': item.taxaCetMedia,
      'Duração Média (meses)': item.duracaoMediaMeses,
      'Percentual Pago': item.percentualPago,
      'Valor Restante': item.valorRestante
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparativo Completo');

    const fileName = `comparativo_posicao_completo_${comparativeType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const renderMetricCard = (
    title: string,
    getValue: (data: ComparativeDataCompleto) => number,
    formatter: (value: number) => string,
    icon: React.ReactNode,
    colorClass: string = 'text-blue-500'
  ) => {
    if (comparativeData.length < 2) return null;

    const current = getValue(comparativeData[comparativeData.length - 1]);
    const previous = getValue(comparativeData[comparativeData.length - 2]);
    const beforePrevious = comparativeData.length >= 3 ? getValue(comparativeData[comparativeData.length - 3]) : 0;

    const currentVsPrevious = calculateVariation(current, previous);
    const previousVsBeforePrevious = beforePrevious ? calculateVariation(previous, beforePrevious) : null;

    return (
      <Card 
        className="relative border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 hover:shadow-3xl" 
        style={{ 
          background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
          border: '1px solid rgba(192, 134, 58, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle 
            className="text-sm font-medium tracking-wide flex items-center gap-2"
            style={{ color: 'rgba(192, 134, 58, 0.9)' }}
          >
            <div 
              className="p-2 rounded-full transition-all duration-300 group-hover:scale-110"
              style={{ 
                background: 'rgba(192, 134, 58, 0.15)',
                border: '1px solid rgba(192, 134, 58, 0.3)' 
              }}
            >
              <span style={{ color: '#C0863A' }}>
                {icon}
              </span>
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          {/* Período Atual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span 
                className="text-sm font-medium"
                style={{ color: 'rgba(192, 134, 58, 0.8)' }}
              >
                {comparativeData[comparativeData.length - 1]?.display}
              </span>
              <Badge 
                variant="outline" 
                style={{ 
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#22c55e'
                }}
              >
                Atual
              </Badge>
            </div>
            <div 
              className="text-2xl font-bold"
              style={{ color: 'rgba(255, 255, 255, 0.95)' }}
            >
              {formatter(current)}
            </div>
            <div className={`flex items-center gap-1 text-sm ${getVariationClass(currentVsPrevious)}`}>
              {getVariationIcon(currentVsPrevious)}
              <span>
                {currentVsPrevious.percentage.toFixed(1)}% vs período anterior
              </span>
            </div>
          </div>

          {/* Período Anterior */}
          <div className="border-t pt-3 space-y-2" style={{ borderColor: 'rgba(192, 134, 58, 0.2)' }}>
            <div className="flex items-center justify-between">
              <span 
                className="text-sm font-medium"
                style={{ color: 'rgba(192, 134, 58, 0.8)' }}
              >
                {comparativeData[comparativeData.length - 2]?.display}
              </span>
              <Badge 
                variant="outline" 
                style={{ 
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#6366f1'
                }}
              >
                Anterior
              </Badge>
            </div>
            <div 
              className="text-xl font-semibold"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {formatter(previous)}
            </div>
            {previousVsBeforePrevious && (
              <div className={`flex items-center gap-1 text-sm ${getVariationClass(previousVsBeforePrevious)}`}>
                {getVariationIcon(previousVsBeforePrevious)}
                <span>
                  {previousVsBeforePrevious.percentage.toFixed(1)}% vs período anterior
                </span>
              </div>
            )}
          </div>

          {/* Período Retrasado */}
          {comparativeData.length >= 3 && (
            <div className="border-t pt-3 space-y-2" style={{ borderColor: 'rgba(192, 134, 58, 0.2)' }}>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'rgba(192, 134, 58, 0.8)' }}
                >
                  {comparativeData[comparativeData.length - 3]?.display}
                </span>
                <Badge 
                  variant="outline" 
                  style={{ 
                    background: 'rgba(107, 114, 128, 0.2)',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    color: '#6b7280'
                  }}
                >
                  Retrasado
                </Badge>
              </div>
              <div 
                className="text-lg font-medium"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                {formatter(beforePrevious)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchComparativeData(comparativeType)} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">
            Comparativo Posição Contratos Completo
          </h1>
          <p className="text-slate-400 text-lg">
            Análise comparativa completa com valor total devedor, valor pago e duração
          </p>
        </div>

        {/* Controls */}
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
              <Calendar className="h-5 w-5" />
              Controles de Comparação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  onClick={() => setComparativeType('monthly')}
                  variant={comparativeType === 'monthly' ? 'default' : 'outline'}
                  className={`font-medium transition-all duration-200 ${
                    comparativeType === 'monthly' 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-slate-900 hover:from-yellow-400 hover:to-orange-500 shadow-lg border-none' 
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  }`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Comparação Mensal
                </Button>
                <Button
                  onClick={() => setComparativeType('daily')}
                  variant={comparativeType === 'daily' ? 'default' : 'outline'}
                  className={`font-medium transition-all duration-200 ${
                    comparativeType === 'daily' 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-slate-900 hover:from-yellow-400 hover:to-orange-500 shadow-lg border-none' 
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  }`}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Comparação Diária
                </Button>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={() => fetchComparativeData(comparativeType)}
                  variant="outline"
                  disabled={loading}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  disabled={loading || comparativeData.length === 0}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>
            </div>

            <div className="text-sm text-slate-400">
              {comparativeType === 'monthly' 
                ? 'Comparando: Mês Retrasado ↔ Mês Passado ↔ Mês Atual (últimos 3 meses)'
                : 'Comparando: Há 3 dias ↔ Anteontem ↔ Ontem (últimos 3 dias)'
              }
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-slate-400">Carregando dados comparativos...</p>
            </div>
          </div>
        )}

        {/* Comparative Metrics */}
        {!loading && comparativeData.length > 0 && (
          <>
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {renderMetricCard(
                'Quantidade de Contratos',
                (data) => data.qtdContratos,
                formatNumber,
                <TrendingUp className="h-5 w-5" />
              )}

              {renderMetricCard(
                'Valor Financiado',
                (data) => data.valorFinanciado,
                formatCurrency,
                <DollarSign className="h-5 w-5" />
              )}

              {renderMetricCard(
                'Valor Total Devedor',
                (data) => data.valorTotalDevedor,
                formatCurrency,
                <BarChart3 className="h-5 w-5" />
              )}

              {renderMetricCard(
                'Valor Total Pago',
                (data) => data.valorTotalPago,
                formatCurrency,
                <TrendingUp className="h-5 w-5 text-green-500" />
              )}

              {renderMetricCard(
                'Saldo Devedor Total',
                (data) => data.saldoDevedorTotal,
                formatCurrency,
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}

              {renderMetricCard(
                'Ticket Médio',
                (data) => data.ticketMedio,
                formatCurrency,
                <PieChart className="h-5 w-5" />
              )}

              {renderMetricCard(
                'Duração Média (meses)',
                (data) => data.duracaoMediaMeses,
                (value) => `${value.toFixed(1)} meses`,
                <Clock className="h-5 w-5" />
              )}

              {renderMetricCard(
                'Percentual Pago Médio',
                (data) => data.percentualPago,
                formatPercentage,
                <TrendingUp className="h-5 w-5 text-green-500" />
              )}

              {renderMetricCard(
                'Taxa Média',
                (data) => data.taxaMedia,
                formatPercentage,
                <BarChart3 className="h-5 w-5" />
              )}
            </StaggeredContainer>
          </>
        )}

        {/* No Data State */}
        {!loading && comparativeData.length === 0 && (
          <Card 
            className="relative border-0 shadow-2xl overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              border: '1px solid rgba(192, 134, 58, 0.3)'
            }}
          >
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum dado encontrado
              </h3>
              <p className="text-slate-400">
                Não foram encontrados dados para a comparação {comparativeType === 'monthly' ? 'mensal' : 'diária'}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ComparativoPosicaoContratosCompleto;
