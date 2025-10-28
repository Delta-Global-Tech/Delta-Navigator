import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, RefreshCw, FileSpreadsheet, BarChart3, DollarSign, Filter, X } from 'lucide-react';
import { getApiEndpoint, logApiCall } from '@/lib/api-config';
import * as XLSX from 'xlsx';
import { StaggeredContainer } from '@/components/motion/StaggeredContainer';

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

interface ProductDetail {
  produto: string;
  qtdRegistros: number;
  valorSolicitado: number;
  valorFinanciado: number;
  valorTac: number;
  valorIof: number;
  valorLiberado: number;
  outrosValores: number;
  totalDesembolsado: number;
  ticketMedio: number;
  taxaMedia: number;
}

interface ComparativeDesembolsoData {
  period: string;
  display: string;
  qtdRegistros: number;
  valorSolicitado: number;
  valorFinanciado: number;
  valorTac: number;
  valorIof: number;
  valorLiberado: number;
  outrosValores: number;
  totalDesembolsado: number;
  ticketMedio: number;
  taxaMedia: number;
  produtosDetalhes?: ProductDetail[];
}

const ComparativoDesembolso: React.FC = () => {
  const [comparativeType, setComparativeType] = useState<'monthly' | 'daily'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeDesembolsoData[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productDesembolso, setProductDesembolso] = useState<any | null>(null);
  const [loadingProductDesembolso, setLoadingProductDesembolso] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchComparativeData = async (type: 'monthly' | 'daily') => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar dados principais
      const endpoint = type === 'monthly' 
        ? getApiEndpoint('CONTRATOS', '/api/contratos/desembolso-comparativo-mensal')
        : getApiEndpoint('CONTRATOS', '/api/contratos/desembolso-comparativo-diario');
      
      logApiCall(endpoint, 'REQUEST');
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setComparativeData(data);

      // Buscar dados de produtos para ambos os tipos de comparação
      const productEndpoint = type === 'monthly' 
        ? getApiEndpoint('CONTRATOS', '/api/contratos/desembolso-comparativo-mensal-produtos')
        : getApiEndpoint('CONTRATOS', '/api/contratos/desembolso-comparativo-diario-produtos');
      
      logApiCall(productEndpoint, 'REQUEST');
      const productResponse = await fetch(productEndpoint);
      
      if (productResponse.ok) {
        const products = await productResponse.json();
        setProductData(products);
        
        // Extrair lista de produtos únicos para o filtro
        const uniqueProducts = new Set<string>();
        products.forEach((period: any) => {
          if (period.produtos) {
            period.produtos.forEach((produto: any) => {
              uniqueProducts.add(produto.produto);
            });
          }
        });
        setAvailableProducts(Array.from(uniqueProducts).sort());
      } else {
        console.warn('Não foi possível carregar dados de produtos');
        setProductData([]);
        setAvailableProducts([]);
      }
      
    } catch (err) {
      console.error(`Erro ao buscar dados comparativos ${type}:`, err);
      setError(`Erro ao carregar dados comparativos: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch desembolso by product and period - buscando dados completos e detalhados
  const fetchDesembolsoPorProduto = async (produto: string, period?: string) => {
    try {
      setLoadingProductDesembolso(true);
      setProductDesembolso(null);
      console.log('[COMPARATIVO DESEMBOLSO] fetchDesembolsoPorProduto iniciada para:', produto, 'período:', period);
      
      // fetch full desembolso and filter by product name (tolerant match)
      const endpoint = getApiEndpoint('CONTRATOS', '/api/contratos/desembolso');
      logApiCall(endpoint, 'REQUEST');
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Erro na API desembolso: ${res.status}`);
      const json = await res.json();
      
      // Handle different response structures
      const rows = json.desembolsos || json.contratos || [];
      console.log('[COMPARATIVO DESEMBOLSO] Total de registros recebidos:', rows.length);
      
      let filtered = (rows || []).filter((r: any) => {
        const prod = (r.descricao || r.desc_produto || r.nm_prod || '').toString().toLowerCase();
        return prod.includes(produto.toLowerCase());
      });

      console.log('[COMPARATIVO DESEMBOLSO] Registros filtrados por produto:', filtered.length);

      // If a period is provided, further filter by the period (monthly or daily)
      if (period) {
        try {
          const periodDate = new Date(period);
          if (!isNaN(periodDate.getTime())) {
            if (comparativeType === 'monthly') {
              filtered = filtered.filter((r: any) => {
                const d = new Date(r.data_entrada || r.data_mov_lib || r.data_desembolso);
                if (isNaN(d.getTime())) return false;
                return d.getMonth() === periodDate.getMonth() && d.getFullYear() === periodDate.getFullYear();
              });
            } else {
              // daily comparison: match exact date
              filtered = filtered.filter((r: any) => {
                const d = new Date(r.data_entrada || r.data_mov_lib || r.data_desembolso);
                if (isNaN(d.getTime())) return false;
                return d.toDateString() === periodDate.toDateString();
              });
            }
          }
        } catch (e) {
          console.warn('[COMPARATIVO DESEMBOLSO] erro ao filtrar por período', e);
        }
      }
      
      console.log('[COMPARATIVO DESEMBOLSO] Registros após filtro de período:', filtered.length);
      
      // compute simple stats
      const stats = {
        totalRegistros: filtered.length,
        totalSolicitado: filtered.reduce((s: number, r: any) => s + (Number(r.valor_solic) || 0), 0),
        totalFinanciado: filtered.reduce((s: number, r: any) => s + (Number(r.vl_financ) || 0), 0),
        totalTac: filtered.reduce((s: number, r: any) => s + (Number(r.vlr_tac) || 0), 0),
        totalIof: filtered.reduce((s: number, r: any) => s + (Number(r.vlr_iof) || 0), 0),
        totalLiberado: filtered.reduce((s: number, r: any) => s + (Number(r.vlr_liberado) || 0), 0),
        totalDesembolsado: filtered.reduce((s: number, r: any) => s + (Number(r.vlr_liberado) || 0), 0)
      };
      
      setProductDesembolso({ 
        desembolsos: filtered, 
        periodo: period || 'Período não especificado',
        estatisticas: stats,
        isAggregated: false 
      });
      logApiCall(endpoint, 'SUCCESS');
      console.log('[COMPARATIVO DESEMBOLSO] Modal aberto com sucesso para:', produto);
    } catch (err) {
      console.error('[COMPARATIVO DESEMBOLSO] Erro ao buscar desembolso por produto:', err);
      setProductDesembolso({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
    } finally {
      setLoadingProductDesembolso(false);
    }
  };

  useEffect(() => {
    fetchComparativeData(comparativeType);
  }, [comparativeType]);

  // Filtrar dados de produtos baseado na seleção
  const filteredProductData = useMemo(() => {
    if (selectedProducts.length === 0) return productData;
    
    return productData.map(period => ({
      ...period,
      produtos: period.produtos?.filter((produto: any) => 
        selectedProducts.includes(produto.produto)
      ) || []
    })).filter(period => period.produtos.length > 0); // Remove períodos sem produtos
  }, [productData, selectedProducts]);

  const handleProductFilter = (produtos: string[]) => {
    setSelectedProducts(produtos);
  };

  const clearFilters = () => {
    setSelectedProducts([]);
  };

  // Recalcular dados principais baseados nos produtos filtrados
  const getFilteredMainData = useMemo(() => {
    if (selectedProducts.length === 0) return comparativeData;
    
    // Se temos filtros de produto aplicados, precisamos recalcular baseado nos produtos selecionados
    return comparativeData.map(periodData => {
      // Encontrar os dados de produtos para este período nos dados filtrados
      const matchingFilteredPeriod = filteredProductData.find(p => p.period === periodData.period);
      
      if (!matchingFilteredPeriod || !matchingFilteredPeriod.produtos || matchingFilteredPeriod.produtos.length === 0) {
        // Se não há produtos filtrados para este período, retornar dados zerados
        return {
          ...periodData,
          qtdRegistros: 0,
          valorSolicitado: 0,
          valorFinanciado: 0,
          valorTac: 0,
          valorIof: 0,
          valorLiberado: 0,
          outrosValores: 0,
          totalDesembolsado: 0,
          ticketMedio: 0,
          taxaMedia: 0
        };
      }
      
      // Calcular totais baseados apenas nos produtos filtrados
      const totalRegistros = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.qtdRegistros || 0), 0);
      const totalSolicitado = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.valorSolicitado || 0), 0);
      const totalFinanciado = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.valorFinanciado || 0), 0);
      const totalTac = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.valorTac || 0), 0);
      const totalIof = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.valorIof || 0), 0);
      const totalLiberado = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.valorLiberado || 0), 0);
      const totalOutros = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.outrosValores || 0), 0);
      const totalDesembolsado = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.totalDesembolsado || 0), 0);
      const ticketMedio = totalRegistros > 0 ? totalFinanciado / totalRegistros : 0;
      
      // Calcular taxa média ponderada
      let somaValorTaxa = 0;
      let somaValorFinanciado = 0;
      matchingFilteredPeriod.produtos.forEach((produto: any) => {
        if (produto.valorFinanciado && produto.taxaMedia) {
          somaValorTaxa += produto.valorFinanciado * produto.taxaMedia;
          somaValorFinanciado += produto.valorFinanciado;
        }
      });
      const taxaMedia = somaValorFinanciado > 0 ? somaValorTaxa / somaValorFinanciado : 0;
      
      return {
        ...periodData,
        qtdRegistros: totalRegistros,
        valorSolicitado: totalSolicitado,
        valorFinanciado: totalFinanciado,
        valorTac: totalTac,
        valorIof: totalIof,
        valorLiberado: totalLiberado,
        outrosValores: totalOutros,
        totalDesembolsado: totalDesembolsado,
        ticketMedio: ticketMedio,
        taxaMedia: taxaMedia
      };
    });
  }, [comparativeData, filteredProductData, selectedProducts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Helpers para formatar rótulos de período
  const formatMonthLabel = (periodOrDisplay: string) => {
    // tenta extrair mês a partir de 'period' ou 'display'. Se não encontrar, retorna o original
    // aceitamos formatos como '2025-10' ou '10/2025' ou um número de mês
    const isoMatch = periodOrDisplay.match(/(\d{4})-(\d{2})/);
    if (isoMatch) {
      const m = parseInt(isoMatch[2], 10);
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return `${monthNames[m - 1] || 'Inválido'} (${m})`;
    }

    const slashMatch = periodOrDisplay.match(/(\d{2})\/(\d{4})/);
    if (slashMatch) {
      const m = parseInt(slashMatch[1], 10);
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return `${monthNames[m - 1] || 'Inválido'} (${m})`;
    }

    // se o display já for tipo 'Outubro' ou '10', tenta extrair apenas número
    const num = periodOrDisplay.match(/^(\d{1,2})$/);
    if (num) {
      const m = parseInt(num[1], 10);
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return `${monthNames[m - 1] || 'Inválido'} (${m})`;
    }

    return periodOrDisplay;
  };

  const formatDayLabel = (periodOrDisplay: string) => {
    // Tenta interpretar como ISO date (YYYY-MM-DD) ou dd/MM/yyyy
    const isoMatch = periodOrDisplay.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}`;
    }
    const dmMatch = periodOrDisplay.match(/(\d{2})\/(\d{2})/);
    if (dmMatch) return `${dmMatch[1]}/${dmMatch[2]}`;
    return periodOrDisplay;
  };

  // Parseia period/display em Date (se possível)
  const parsePeriodToDate = (periodOrDisplay: string, type: 'monthly' | 'daily'): Date | null => {
    if (!periodOrDisplay) return null;
    // monthly: formatos YYYY-MM ou MM/YYYY ou apenas MM
    if (type === 'monthly') {
      const iso = periodOrDisplay.match(/(\d{4})-(\d{2})/);
      if (iso) return new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, 1);
      const mmYYYY = periodOrDisplay.match(/(\d{2})\/(\d{4})/);
      if (mmYYYY) return new Date(parseInt(mmYYYY[2], 10), parseInt(mmYYYY[1], 10) - 1, 1);
      const justMonth = periodOrDisplay.match(/^(\d{1,2})$/);
      if (justMonth) {
        const now = new Date();
        return new Date(now.getFullYear(), parseInt(justMonth[1], 10) - 1, 1);
      }
      return null;
    }

    // daily: YYYY-MM-DD or DD/MM/YYYY or DD/MM
    const isoDay = periodOrDisplay.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoDay) return new Date(parseInt(isoDay[1], 10), parseInt(isoDay[2], 10) - 1, parseInt(isoDay[3], 10));
    const dmY = periodOrDisplay.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dmY) return new Date(parseInt(dmY[3], 10), parseInt(dmY[2], 10) - 1, parseInt(dmY[1], 10));
    const dm = periodOrDisplay.match(/(\d{2})\/(\d{2})/);
    if (dm) {
      const now = new Date();
      return new Date(now.getFullYear(), parseInt(dm[2], 10) - 1, parseInt(dm[1], 10));
    }
    return null;
  };

  const isFuture = (d: Date) => {
    const now = new Date();
    // comparar apenas por dia
    return d.getFullYear() > now.getFullYear() || (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth()) || d > now;
  };

  const formatMonthFromDate = (d: Date) => {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${monthNames[d.getMonth()]} (${d.getMonth() + 1})`;
  };
  const formatDayFromDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  // Retorna label relativa: 0 = atual, 1 = anterior, 2 = retrasado
  const getRelativeLabel = (offsetFromCurrent: number, type: 'monthly' | 'daily') => {
    const now = new Date();
    if (type === 'monthly') {
      const d = new Date(now.getFullYear(), now.getMonth() - offsetFromCurrent, 1);
      return formatMonthFromDate(d);
    } else {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetFromCurrent);
      return formatDayFromDate(d);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
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

  const exportToExcel = () => {
    const dataToExport = getFilteredMainData;
    if (dataToExport.length === 0) return;

    const exportData = dataToExport.map((item, idx) => ({
      'Período': comparativeType === 'monthly' ? (item.display || item.period || '') : (item.display || item.period || ''),
      'Qtd Registros': item.qtdRegistros,
      'Valor Solicitado': item.valorSolicitado,
      'Valor Financiado': item.valorFinanciado,
      'Valor TAC': item.valorTac,
      'Valor IOF': item.valorIof,
      'Valor Liberado': item.valorLiberado,
      'Outros Valores': item.outrosValores,
      'Total Desembolsado': item.totalDesembolsado,
      'Ticket Médio': item.ticketMedio,
      'Taxa Média': item.taxaMedia
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparativo Desembolso');
    
    const filename = `comparativo_desembolso_${comparativeType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const renderMetricCard = (
    title: string,
    getValue: (data: ComparativeDesembolsoData) => number,
    formatter: (value: number) => string,
    icon: React.ReactNode
  ) => {
    const dataToUse = getFilteredMainData;
    if (dataToUse.length < 2) return null;

    const current = getValue(dataToUse[dataToUse.length - 1]);
    const previous = getValue(dataToUse[dataToUse.length - 2]);
    const beforePrevious = dataToUse.length >= 3 ? getValue(dataToUse[dataToUse.length - 3]) : 0;

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
            {selectedProducts.length > 0 && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  background: 'rgba(192, 134, 58, 0.2)',
                  border: '1px solid rgba(192, 134, 58, 0.3)',
                  color: '#C0863A'
                }}
              >
                Filtrado
              </Badge>
            )}
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
                {getRelativeLabel(0, comparativeType)}
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
                  {getRelativeLabel(1, comparativeType)}
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

          {/* Período Retrasado (se disponível) */}
          {dataToUse.length >= 3 && (
            <div className="border-t pt-3 space-y-2" style={{ borderColor: 'rgba(192, 134, 58, 0.2)' }}>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'rgba(192, 134, 58, 0.8)' }}
                >
                  {getRelativeLabel(2, comparativeType)}
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

  const renderAdvancedMetricCard = (
    title: string,
    getValue: (data: ComparativeDesembolsoData) => number,
    formatter: (value: number) => string,
    description: string,
    icon: React.ReactNode
  ) => {
    const dataToUse = getFilteredMainData;
    if (dataToUse.length < 1) return null;

    // Pegar os últimos 3 períodos (ou quantos estiverem disponíveis)
    const periods: { label: string; value: number; data: ComparativeDesembolsoData }[] = [];
    // Construir períodos garantindo que não apontem para o futuro.
    const now = new Date();
    for (let i = Math.min(3, dataToUse.length); i > 0; i--) {
      const periodData = dataToUse[dataToUse.length - i];
      if (!periodData) continue;

      const raw = periodData.period || periodData.display || '';
      const parsed = parsePeriodToDate(raw, comparativeType);
      let label = periodData.display || '';

      // Se não tiver display do backend, gera localmente
      if (!label) {
        if (parsed && !isFuture(parsed)) {
          label = comparativeType === 'monthly' ? formatMonthFromDate(parsed) : formatDayFromDate(parsed);
        } else {
          const baseDate = new Date(now.getFullYear(), now.getMonth() - (Math.min(3, dataToUse.length) - i), 1);
          if (comparativeType === 'monthly') {
            label = formatMonthFromDate(baseDate);
          } else {
            const dayBase = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (Math.min(3, dataToUse.length) - i));
            label = formatDayFromDate(dayBase);
          }
        }
      }

      periods.push({ label, value: getValue(periodData), data: periodData });
    }

    let variation = null;
    if (periods.length >= 2) {
      const current = periods[periods.length - 1].value;
      const previous = periods[periods.length - 2].value;
      variation = calculateVariation(current, previous);
    }

    return (
      <Card 
        className="relative border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105"
        style={{ 
          background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
          border: '2px solid rgba(196, 138, 63, 0.4)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
          <CardTitle className="text-base font-semibold" style={{ color: '#C48A3F' }}>
            {title}
          </CardTitle>
          <div style={{ color: '#C48A3F' }}>{icon}</div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            <p className="text-xs text-gray-400">{description}</p>

            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 gap-3">
              {periods.map((period, index) => {
                const isLatest = index === periods.length - 1;
                const isSecondMostRecent = index === periods.length - 2;
                const isOldest = index === 0;

                let periodVariation = null;
                if (index > 0) {
                  const currentValue = period.value;
                  const previousValue = periods[index - 1].value;
                  periodVariation = calculateVariation(currentValue, previousValue);
                }

                return (
                  <div 
                    key={period.label}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      isLatest ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30' :
                      isSecondMostRecent ? 'bg-blue-900/20 border-blue-500/30' :
                      'bg-gray-800/30 border-gray-600/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-semibold" style={{ color: isLatest ? '#22c55e' : isSecondMostRecent ? '#3b82f6' : '#9ca3af' }}>
                              {period.label}
                            </div>
                            <div className="text-xs" style={{ color: isLatest ? 'rgba(34, 197, 94, 0.8)' : isSecondMostRecent ? 'rgba(59, 130, 246, 0.8)' : 'rgba(156, 163, 175, 0.8)' }}>
                              {isLatest ? 'Atual' : isSecondMostRecent ? 'Anterior' : 'Retrasado'}
                            </div>
                          </div>
                          {selectedProducts.length > 0 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-2 py-1"
                              style={{ 
                                background: 'rgba(196, 138, 63, 0.2)',
                                border: '1px solid rgba(196, 138, 63, 0.3)',
                                color: '#C48A3F'
                              }}
                            >
                              Filtrado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-xl font-bold ${
                            isLatest ? 'text-white' : isSecondMostRecent ? 'text-blue-300' : 'text-gray-300'
                          }`}>
                            {formatter(period.value)}
                          </div>

                          {periodVariation ? (
                            <div className="text-right ml-2">
                              <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                                periodVariation.isIncrease ? 'text-green-400 bg-green-900/20' :
                                periodVariation.isDecrease ? 'text-red-400 bg-red-900/20' :
                                'text-yellow-400 bg-yellow-900/20'
                              }`}>
                                {periodVariation.isIncrease && <ArrowUp className="h-3 w-3" />}
                                {periodVariation.isDecrease && <ArrowDown className="h-3 w-3" />}
                                {!periodVariation.isIncrease && !periodVariation.isDecrease && <Minus className="h-3 w-3" />}
                                <span className="font-semibold text-xs">
                                  {periodVariation.percentage === 0 ? '0%' : 
                                   periodVariation.isIncrease ? `+${periodVariation.percentage.toFixed(1)}%` :
                                   `-${Math.abs(periodVariation.percentage).toFixed(1)}%`}
                                </span>
                              </div>
                            </div>
                          ) : isOldest && (
                            <div className="text-right ml-2">
                              <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-gray-500 bg-gray-800/20">
                                <span>Base</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{error}</p>
            <Button 
              onClick={() => fetchComparativeData(comparativeType)} 
              className="mt-4 w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modal for product drill-through
  const ProductDesembolsoModal = () => {
    const [expandedDesembolsos, setExpandedDesembolsos] = React.useState<string[]>([]);
    
    if (!selectedProduct) return null;
    const handleBackdropClick = () => { setSelectedProduct(null); setProductDesembolso(null); };
    
    const formatCurrencyForModal = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    };

    const formatDateForModal = (value: any) => {
      try {
        if (!value) return '-';
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return new Intl.DateTimeFormat('pt-BR').format(d);
      } catch {
        return String(value);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleBackdropClick} style={{ background: 'rgba(0,0,0,0.6)', padding: '20px' }}>
        <div className="rounded-lg shadow-2xl overflow-hidden w-full max-w-7xl" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(180deg, #041122 0%, #072033 100%)', border: '1px solid rgba(192, 134, 58, 0.2)' }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-3">
              <div style={{ background: 'rgba(192,134,58,0.15)', padding: '8px', borderRadius: 8 }}>
                <BarChart3 style={{ color: '#C0863A' }} />
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: '#FFF' }}>Análise Detalhada de Desembolso</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedProduct} - {productDesembolso?.periodo}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => { setSelectedProduct(null); setProductDesembolso(null); }}>
                <X />
              </Button>
            </div>
          </div>

          <div className="p-4 text-white" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            {loadingProductDesembolso && (
              <div className="py-8 text-center">Carregando dados de desembolso...</div>
            )}

            {!loadingProductDesembolso && productDesembolso && productDesembolso.error && (
              <div className="py-4 text-red-400">Erro: {productDesembolso.error}</div>
            )}

            {!loadingProductDesembolso && productDesembolso && !productDesembolso.error && (
              <div className="space-y-4">
                {/* Estatísticas Principais */}
                <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md border" style={{ borderColor: 'rgba(196, 138, 63, 0.3)' }}>
                    <div className="text-xs text-slate-300">
                      {productDesembolso.isAggregated ? 'Registros' : 'Desembolsos'}
                    </StaggeredContainer>
                    <div className="text-lg font-bold text-white">{productDesembolso.estatisticas.totalRegistros}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md border" style={{ borderColor: 'rgba(196, 138, 63, 0.3)' }}>
                    <div className="text-xs text-slate-300">Financiado</div>
                    <div className="text-lg font-bold text-white">{formatCurrencyForModal(productDesembolso.estatisticas.totalFinanciado || 0)}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md border" style={{ borderColor: 'rgba(196, 138, 63, 0.3)' }}>
                    <div className="text-xs text-slate-300">Liberado</div>
                    <div className="text-lg font-bold text-white">{formatCurrencyForModal(productDesembolso.estatisticas.totalLiberado || 0)}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md border" style={{ borderColor: 'rgba(196, 138, 63, 0.3)' }}>
                    <div className="text-xs text-slate-300">Total TAC</div>
                    <div className="text-lg font-bold text-white">{formatCurrencyForModal(productDesembolso.estatisticas.totalTac || 0)}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md border" style={{ borderColor: 'rgba(196, 138, 63, 0.3)' }}>
                    <div className="text-xs text-slate-300">Total IOF</div>
                    <div className="text-lg font-bold text-white">{formatCurrencyForModal(productDesembolso.estatisticas.totalIof || 0)}</div>
                  </div>
                </div>

                {/* Tabela de Desembolsos */}
                {!productDesembolso.isAggregated && productDesembolso.desembolsos && productDesembolso.desembolsos.length > 0 && (
                  <div className="overflow-x-auto rounded-md" style={{ border: '1px solid rgba(255,255,255,0.03)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.3)' }}>
                          <th className="p-3 text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>Produto</th>
                          <th className="p-3 text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>Cliente</th>
                          <th className="p-3 text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>CPF/CNPJ</th>
                          <th className="p-3 text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>Contrato</th>
                          <th className="p-3 text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>Financiado</th>
                          <th className="p-3 text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>Liberado</th>
                          <th className="p-3 text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>Taxa (%)</th>
                          <th className="p-3 text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>Data Entrada</th>
                          <th className="p-3 text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productDesembolso.desembolsos.map((detalhe: any, idx: number) => {
                          const desembolsoId = detalhe.contrato || `${idx}`;
                          const expanded = expandedDesembolsos.includes(String(desembolsoId));
                          
                          return (
                            <React.Fragment key={desembolsoId}>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td className="p-3" style={{ color: '#e0e7ff' }}>
                                  {(detalhe.descricao || '-').substring(0, 40)}
                                </td>
                                <td className="p-3" style={{ color: 'white' }}>
                                  {detalhe.nome || '-'}
                                </td>
                                <td className="p-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                  {detalhe.nr_cpf_cnpj || '-'}
                                </td>
                                <td className="p-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                  {detalhe.contrato || '-'}
                                </td>
                                <td className="p-3 text-right font-semibold" style={{ color: '#10B981' }}>
                                  {formatCurrencyForModal(detalhe.vl_financ || 0)}
                                </td>
                                <td className="p-3 text-right font-semibold" style={{ color: '#22c55e' }}>
                                  {formatCurrencyForModal(detalhe.vlr_liberado || 0)}
                                </td>
                                <td className="p-3 text-right" style={{ color: '#f59e0b' }}>
                                  {(detalhe.taxa_real || detalhe.taxa || 0).toFixed(2)}%
                                </td>
                                <td className="p-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                  {formatDateForModal(detalhe.data_entrada || '-')}
                                </td>
                                <td className="p-3 text-center">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => {
                                      setExpandedDesembolsos(prev => {
                                        const key = String(desembolsoId);
                                        if (prev.includes(key)) return prev.filter(p => p !== key);
                                        return [...prev, key];
                                      });
                                    }}
                                  >
                                    {expanded ? '−' : '+'}
                                  </Button>
                                </td>
                              </tr>

                              {/* Expanded details row */}
                              {expanded && (
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: 'rgba(0,0,0,0.3)' }}>
                                  <td colSpan={9} className="p-4">
                                    <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>Solicitado:</strong> {formatCurrencyForModal(detalhe.valor_solic || 0)}</StaggeredContainer>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>Financiado:</strong> {formatCurrencyForModal(detalhe.vl_financ || 0)}</div>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>Liberado:</strong> {formatCurrencyForModal(detalhe.vlr_liberado || 0)}</div>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>TAC:</strong> {formatCurrencyForModal(detalhe.vlr_tac || 0)}</div>
                                      </div>
                                      <div>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>IOF:</strong> {formatCurrencyForModal(detalhe.vlr_iof || 0)}</div>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>Taxa Real (%):</strong> {(detalhe.taxa_real || 0).toFixed(2)}%</div>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>Taxa CET (%):</strong> {(detalhe.taxa_cet || 0).toFixed(2)}%</div>
                                        <div className="mb-2"><strong style={{ color: '#C48A3F' }}>Instituição:</strong> {detalhe.nome_inst || '-'}</div>
                                      </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                      <div>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Status:</span>
                                        <div style={{ color: '#22c55e', fontWeight: 'bold' }}>{detalhe.status_final || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Filial:</span>
                                        <div style={{ color: 'white' }}>{detalhe.nome_filial || '-'}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Convênio:</span>
                                        <div style={{ color: 'white' }}>{detalhe.nome_conven || '-'}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Data Entrada:</span>
                                        <div style={{ color: 'white' }}>{formatDateForModal(detalhe.data_entrada || '-')}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Data Mov. Lib:</span>
                                        <div style={{ color: 'white' }}>{formatDateForModal(detalhe.data_mov_lib || '-')}</div>
                                      </div>
                                      <div>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Outros Valores:</span>
                                        <div style={{ color: 'white' }}>{formatCurrencyForModal(detalhe.out_vlr || 0)}</div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {((productDesembolso.desembolsos || []).length === 0) && (
                          <tr>
                            <td colSpan={9} className="p-4 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>Nenhum desembolso encontrado para esse produto.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mensagem quando em modo agregado ou sem dados detalhados */}
                {(productDesembolso.isAggregated || !productDesembolso.desembolsos || productDesembolso.desembolsos.length === 0) && (
                  <div className="p-4 rounded-lg border" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                    <div className="flex items-start gap-3">
                      <div style={{ color: '#3b82f6', marginTop: '2px' }}>
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Dados Consolidados</h4>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                          Não há detalhes individuais disponíveis para este período. Os valores acima representam o total consolidado do período.
                        </p>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Solicitado:</span>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrencyForModal(productDesembolso.estatisticas.totalSolicitado || 0)}</div>
                          </div>
                          <div>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>TAC:</span>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrencyForModal(productDesembolso.estatisticas.totalTac || 0)}</div>
                          </div>
                          <div>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>IOF:</span>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrencyForModal(productDesembolso.estatisticas.totalIof || 0)}</div>
                          </div>
                          <div>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total:</span>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrencyForModal(productDesembolso.estatisticas.totalDesembolsado || 0)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer with explicit close button */}
                <div className="mt-4 flex justify-end gap-2">
                  <Button onClick={() => { setSelectedProduct(null); setProductDesembolso(null); }} style={{ background: '#C0863A', border: 'none', color: 'white' }}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">
            Comparativo Desembolso
          </h1>
          <p className="text-slate-400 text-lg">
            Análise comparativa temporal dos dados de desembolso
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

              {/* Filtros por Produto */}
              {availableProducts.length > 0 && (
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Filtrar por produto:</span>
                  </div>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setSelectedProducts([]);
                      } else if (value === 'select-all') {
                        setSelectedProducts([...availableProducts]);
                      } else if (value && !selectedProducts.includes(value)) {
                        setSelectedProducts(prev => [...prev, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder={
                        selectedProducts.length === 0 
                          ? "Selecione produtos..." 
                          : `${selectedProducts.length} produto${selectedProducts.length > 1 ? 's' : ''} selecionado${selectedProducts.length > 1 ? 's' : ''}`
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Limpar todos os filtros
                        </div>
                      </SelectItem>
                      <SelectItem value="select-all">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Selecionar todos os produtos
                        </div>
                      </SelectItem>
                      {availableProducts
                        .filter(produto => !selectedProducts.includes(produto))
                        .map(produto => (
                        <SelectItem key={produto} value={produto}>
                          {produto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-slate-500">Produtos selecionados:</span>
                      {selectedProducts.map(produto => (
                        <Badge 
                          key={produto} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-red-600 hover:text-white transition-colors"
                          onClick={() => setSelectedProducts(prev => prev.filter(p => p !== produto))}
                        >
                          {produto} ×
                        </Badge>
                      ))}
                      <Button
                        onClick={clearFilters}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar todos
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
                  disabled={loading || getFilteredMainData.length === 0}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Excel
                  {selectedProducts.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Filtrado
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-slate-400">
              {comparativeType === 'monthly' 
                ? 'Comparando: Mês Retrasado ↔ Mês Passado ↔ Mês Atual (últimos 3 meses)'
                : 'Comparando: Há 3 dias ↔ Anteontem ↔ Ontem (últimos 3 dias)'
              }
              {selectedProducts.length > 0 && (
                <span className="block mt-1 text-blue-400">
                  🔍 Filtrado por {selectedProducts.length} produto{selectedProducts.length > 1 ? 's' : ''}
                </span>
              )}
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
        {!loading && getFilteredMainData.length > 0 && (
          <>
            {/* Primeira Linha - KPIs Principais */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {renderAdvancedMetricCard(
                'Quantidade de Registros',
                (data) => data.qtdRegistros,
                formatNumber,
                'registros totais',
                <TrendingUp className="h-5 w-5" />
              )}

              {renderAdvancedMetricCard(
                'Total Desembolsado',
                (data) => data.totalDesembolsado,
                formatCurrency,
                'total desembolsado',
                <DollarSign className="h-5 w-5" />
              )}

              {renderAdvancedMetricCard(
                'Valor Solicitado',
                (data) => data.valorSolicitado,
                formatCurrency,
                'valor solicitado',
                <TrendingUp className="h-5 w-5" />
              )}

              {renderAdvancedMetricCard(
                'Ticket Médio',
                (data) => data.ticketMedio,
                formatCurrency,
                'valor médio por registro',
                <TrendingUp className="h-5 w-5" />
              )}
            </StaggeredContainer>

            {/* Segunda Linha - KPIs Financeiros */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {renderAdvancedMetricCard(
                'Valor Financiado',
                (data) => data.valorFinanciado,
                formatCurrency,
                'valor financiado',
                <DollarSign className="h-5 w-5" />
              )}

              {renderAdvancedMetricCard(
                'Valor Liberado',
                (data) => data.valorLiberado,
                formatCurrency,
                'valor liberado',
                <TrendingUp className="h-5 w-5" />
              )}

              {renderAdvancedMetricCard(
                'Taxa Média',
                (data) => data.taxaMedia,
                formatPercentage,
                'taxa média ponderada',
                <TrendingUp className="h-5 w-5" />
              )}
            </StaggeredContainer>

            {/* Terceira Linha - KPIs Operacionais */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {renderAdvancedMetricCard(
                'Valor TAC',
                (data) => data.valorTac,
                formatCurrency,
                'custos operacionais',
                <TrendingDown className="h-5 w-5" />
              )}

              {renderAdvancedMetricCard(
                'Valor IOF',
                (data) => data.valorIof,
                formatCurrency,
                'imposto IOF',
                <TrendingDown className="h-5 w-5" />
              )}

              {renderAdvancedMetricCard(
                'Outros Valores',
                (data) => data.outrosValores,
                formatCurrency,
                'valores diversos',
                <TrendingDown className="h-5 w-5" />
              )}
            </StaggeredContainer>

            {/* Detalhes por Produto - para ambas as comparações */}
            {filteredProductData.length > 0 && (
              <Card 
                className="relative border-0 shadow-2xl overflow-hidden mt-6 transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                  border: '2px solid rgba(196, 138, 63, 0.4)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <CardHeader>
                  <CardTitle 
                    className="flex items-center gap-2 font-bold text-xl"
                    style={{ color: '#C48A3F' }}
                  >
                    <BarChart3 className="h-6 w-6" />
                    Análise Detalhada por Produto - {comparativeType === 'daily' ? 'Últimos 3 Dias' : 'Últimos 3 Meses'}
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Breakdown de desembolsos por produto em cada período
                    {selectedProducts.length > 0 && (
                      <span 
                        className="ml-2 font-medium"
                        style={{ color: '#C0863A' }}
                      >
                        (Filtrado: {selectedProducts.length} produto{selectedProducts.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {filteredProductData.map((dayData, index) => (
                      <div key={dayData.period} className="space-y-4">
                        <div 
                          className="text-center py-3 px-4 rounded-lg font-bold text-sm border"
                          style={{ 
                            background: 'rgba(196, 138, 63, 0.1)',
                            borderColor: 'rgba(196, 138, 63, 0.3)',
                            color: '#C48A3F'
                          }}
                        >
                          {comparativeType === 'monthly' ? formatMonthLabel(dayData.period || dayData.display || '') : formatDayLabel(dayData.period || dayData.display || '')}
                        </StaggeredContainer>
                        {dayData.produtos && dayData.produtos.length > 0 ? (
                          <div className="space-y-3">
                            {dayData.produtos.map((produto: any, pIndex: number) => (
                              <div 
                                key={pIndex} 
                                className="relative rounded-lg p-4 border transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                                style={{ 
                                  background: 'linear-gradient(135deg, #06162B 0%, #0a1b33 50%, #06162B 100%)',
                                  borderColor: 'rgba(196, 138, 63, 0.3)',
                                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                                }}
                              >
                                {/* Produto Header */}
                                <div className="flex justify-between items-start mb-3">
                                  <h5 
                                    className="font-bold text-sm leading-tight max-w-[60%]" 
                                    style={{ 
                                      color: '#FFFFFF',
                                      textShadow: '0 0 8px rgba(196, 138, 63, 0.4)'
                                    }}
                                    title={produto.produto}
                                  >
                                    {produto.produto.length > 25 ? `${produto.produto.substring(0, 25)}...` : produto.produto}
                                  </h5>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs font-medium"
                                    style={{
                                      background: 'rgba(34, 197, 94, 0.2)',
                                      border: '1px solid rgba(34, 197, 94, 0.3)',
                                      color: '#22c55e'
                                    }}
                                  >
                                    {formatNumber(produto.qtdRegistros || produto.qtdRegistros === 0 ? produto.qtdRegistros : produto.qtd_registros || produto.qtd_registros)} registros
                                  </Badge>
                                </div>
                                
                                {/* Métricas */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: 'rgba(192, 134, 58, 0.8)' }}
                                    >
                                      Valor Liberado:
                                    </span>
                                    <span 
                                      className="text-sm font-bold"
                                      style={{ 
                                        color: '#22c55e',
                                        textShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
                                      }}
                                    >
                                      {formatCurrency(produto.valorLiberado || produto.valor_liberado || produto.totalDesembolsado || produto.total_desembolsado || 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: 'rgba(192, 134, 58, 0.8)' }}
                                    >
                                      Ticket Médio:
                                    </span>
                                    <span 
                                      className="text-sm font-bold"
                                      style={{ 
                                        color: '#60a5fa',
                                        textShadow: '0 0 6px rgba(96, 165, 250, 0.3)'
                                      }}
                                    >
                                      {formatCurrency(produto.ticketMedio || produto.ticket_medio || produto.valorFinanciado || produto.valor_financiado || 0)}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 flex justify-end">
                                  <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); const prodName = produto.produto || produto; console.log('[COMPARATIVO DESEMBOLSO] Análise detalhada clicada para produto:', prodName); if (!prodName) return; setSelectedProduct(prodName); setToastMessage(`Abrindo análise: ${prodName}`); setTimeout(() => setToastMessage(null), 3000); fetchDesembolsoPorProduto(prodName, dayData.period); }} style={{ background: '#C0863A', border: 'none' }}>
                                    Análise Detalhada
                                  </Button>
                                </div>

                                {/* Efeito de brilho no hover */}
                                <div 
                                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
                                  style={{
                                    background: 'linear-gradient(45deg, transparent 30%, rgba(192, 134, 58, 0.3) 50%, transparent 70%)',
                                    transform: 'translateX(-100%)'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="text-center py-6 rounded-lg border"
                            style={{ 
                              background: 'rgba(71, 85, 105, 0.2)',
                              borderColor: 'rgba(71, 85, 105, 0.3)',
                              color: '#94a3b8'
                            }}
                          >
                            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum produto encontrado</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* No Data State */}
        {!loading && getFilteredMainData.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
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
      <ProductDesembolsoModal />
    </div>
  );
};

export default ComparativoDesembolso;