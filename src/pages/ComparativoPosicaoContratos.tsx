import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, RefreshCw, FileSpreadsheet, BarChart3, Filter, X, Users, DollarSign, Clock, PieChart } from 'lucide-react';
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
  qtd_contratos: number;
  vlr_financiado: number;
  ticket_medio: number;
}

interface ComparativeData {
  period: string;
  display: string;
  qtdContratos: number;
  vlrFinanciado: number;
  custoEmissao: number;
  iof: number;
  amortizacao: number;
  prestacoesPagasQtde: number;
  prestacoesPagasValor: number;
  jurosBrutos: number;
  ticketMedio: number;
  saldoDevedor: number;
  valorTotalDevedor?: number;
  valorTotalPago?: number;
  taxaMediaPonderada?: number;
  duracaoMedia?: number;
  eficienciaCobranca?: number;
  produtosDetalhes?: ProductDetail[];
}

const ComparativoPosicaoContratos: React.FC = () => {
  const [comparativeType, setComparativeType] = useState<'monthly' | 'daily'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeData[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productPosicao, setProductPosicao] = useState<any | null>(null);
  const [loadingProductPosicao, setLoadingProductPosicao] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [debugClickCount, setDebugClickCount] = useState<number>(() => {
    try { return Number(localStorage.getItem('cmp_debug_clicks') || '0'); } catch { return 0; }
  });
  const [expandedContracts, setExpandedContracts] = useState<string[]>([]);

  const fetchComparativeData = async (type: 'monthly' | 'daily') => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar dados principais
      const endpoint = type === 'monthly' 
        ? getApiEndpoint('CONTRATOS', '/api/contratos/comparativo-mensal')
        : getApiEndpoint('CONTRATOS', '/api/contratos/comparativo-diario');
      
      logApiCall(endpoint, 'REQUEST');
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setComparativeData(data);

      // Buscar dados de produtos para ambos os tipos de comparação
      const productEndpoint = type === 'monthly' 
        ? getApiEndpoint('CONTRATOS', '/api/contratos/comparativo-mensal-produtos')
        : getApiEndpoint('CONTRATOS', '/api/contratos/comparativo-diario-produtos');
      
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

  useEffect(() => {
    fetchComparativeData(comparativeType);
  }, [comparativeType]);

  // Modal for product drill-through placed at top-level so it mounts regardless of which card is rendered
  const ProductPositionModal = () => {
    if (!selectedProduct) return null;
    // clicking on backdrop closes modal
    const handleBackdropClick = () => { setSelectedProduct(null); setProductPosicao(null); };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleBackdropClick} style={{ background: 'rgba(0,0,0,0.6)', padding: '20px' }}>
        <div className="rounded-lg shadow-2xl overflow-hidden w-full max-w-6xl" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(180deg, #041122 0%, #072033 100%)', border: '1px solid rgba(192, 134, 58, 0.2)' }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-3">
              <div style={{ background: 'rgba(192,134,58,0.15)', padding: '8px', borderRadius: 8 }}>
                <BarChart3 style={{ color: '#C0863A' }} />
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: '#FFF' }}>Posição por Produto</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedProduct}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => { setSelectedProduct(null); setProductPosicao(null); }}>
                <X />
              </Button>
            </div>
          </div>

          <div className="p-4 text-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            {loadingProductPosicao && (
              <div className="py-8 text-center">Carregando posição do produto...</div>
            )}

            {!loadingProductPosicao && productPosicao && productPosicao.error && (
              <div className="py-4 text-red-400">Erro: {productPosicao.error}</div>
            )}

            {!loadingProductPosicao && productPosicao && !productPosicao.error && (
              <div className="space-y-4">
                <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                    <div className="text-xs text-slate-300">Contratos encontrados</div>
                    <div className="text-lg font-bold">{productPosicao.estatisticas.totalContratos}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                    <div className="text-xs text-slate-300">Total Financiado</div>
                    <div className="text-lg font-bold">{formatCurrency(productPosicao.estatisticas.totalFinanciado || 0)}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                    <div className="text-xs text-slate-300">Total Devedor</div>
                    <div className="text-lg font-bold">{formatCurrency(productPosicao.estatisticas.totalDevedor || 0)}</div>
                  </div>
                </StaggeredContainer>

                <div className="overflow-x-auto rounded-md" style={{ border: '1px solid rgba(255,255,255,0.03)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <th className="p-2 text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>Produto</th>
                        <th className="p-2 text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>Financiado</th>
                        <th className="p-2 text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>Pago</th>
                        <th className="p-2 text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(productPosicao.contratos || []).map((c: any, idx: number) => {
                        const contractId = c.numeroContrato || c.no_contrato || c.numero_contrato || `${idx}`;
                        const expanded = expandedContracts.includes(String(contractId));
                        return (
                          <React.Fragment key={contractId}>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td className="p-2" style={{ color: 'white' }}>{c.descricao_do_produto || c.descricaoDoProduto || '-'}</td>
                              <td className="p-2 text-right font-semibold" style={{ color: '#10B981' }}>{formatCurrency(c.valor_financiado || c.valorFinanciado || c.valorFinanciado || 0)}</td>
                              <td className="p-2 text-right" style={{ color: 'rgba(255,255,255,0.8)' }}>{formatCurrency(c.valor_pago || c.valorPago || c.valorPago || 0)}</td>
                              <td className="p-2 text-right font-semibold" style={{ color: '#F59E0B' }}>{formatCurrency(((c.valor_total_devedor ?? c.valorTotalDevedor) || 0) - ((c.valor_pago ?? c.valorPago) || 0))}</td>
                            </tr>

                            {/* Expanded details row */}
                            <tr>
                              <td colSpan={4} className="p-0">
                                <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-slate-300">Contrato: <span className="font-medium text-white">{contractId}</span></div>
                                    <div>
                                      <Button size="sm" variant="ghost" onClick={() => {
                                        setExpandedContracts(prev => {
                                          const key = String(contractId);
                                          if (prev.includes(key)) return prev.filter(p => p !== key);
                                          return [...prev, key];
                                        });
                                      }}>
                                        {expanded ? 'Fechar detalhes' : 'Ver detalhes'}
                                      </Button>
                                    </div>
                                  </div>

                                  {expanded ? (
                                    <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-200">
                                      {/* Render common fields in two columns */}
                                      <div>
                                        <div><strong>Nome do Cliente:</strong> {c.nomeCliente || c.nome_do_cliente || '-'}</div>
                                        <div><strong>Produto:</strong> {c.descricao_do_produto || c.descricaoDoProduto || '-'}</div>
                                        <div><strong>Nº Contrato:</strong> {contractId}</div>
                                        <div><strong>Valor Financiado:</strong> {formatCurrency(c.valorFinanciado || c.valor_financiado || 0)}</div>
                                        <div><strong>Valor Pago:</strong> {formatCurrency(c.valorPago || c.valor_pago || 0)}</div>
                                        <div><strong>Saldo Devedor Atual:</strong> {formatCurrency(c.saldoDevedorAtual || c.saldo_devedor_atual || 0)}</div>
                                        <div><strong>Valor Total Devedor:</strong> {formatCurrency(c.valorTotalDevedor || c.valor_total_devedor || 0)}</div>
                                        <div><strong>Valor Parcelas:</strong> {formatCurrency(c.valorParcelas || c.valor_parcelas || 0)}</div>
                                      </div>

                                      <div>
                                        <div><strong>Taxa (%):</strong> {c.taxa != null ? `${c.taxa}` : (c.taxaReal != null ? `${c.taxaReal}` : '-')}</div>
                                        <div><strong>Taxa Real:</strong> {c.taxaReal != null ? `${c.taxaReal}` : '-'}</div>
                                        <div><strong>Taxa CET:</strong> {c.taxaCet != null ? `${c.taxaCet}` : '-'}</div>
                                        <div><strong>Quantidade Parcelas:</strong> {c.quantidadeDeParcelas || c.quantidade_de_parcelas || c.prestacoesPagasTotal || '-'}</div>
                                        <div><strong>Prestações Pagas:</strong> {c.prestacoesPagasTotal || c.prestacoes_pagas_total || 0}</div>
                                        <div><strong>Data Primeiro Pagamento:</strong> {formatDate(c.dataPrimeiroPagamento || c.data_primeiro_pagamento)}</div>
                                        <div><strong>Data Última Parcela:</strong> {formatDate(c.dataUltimaParcela || c.data_do_ultima_parcela)}</div>
                                        <div><strong>Data Entrada:</strong> {formatDate(c.dataEntrada || c.data_entr)}</div>
                                      </div>

                                      {/* Full JSON fallback on bottom */}
                                      <div className="md:col-span-2">
                                        <div className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-300 overflow-auto" style={{ maxHeight: 220 }}>
                                          <pre className="whitespace-pre-wrap">{JSON.stringify(c, null, 2)}</pre>
                                        </div>
                                      </div>
                                    </StaggeredContainer>
                                  ) : (
                                    <div className="text-sm text-slate-400">Clique em "Ver detalhes" para expandir todas as informações do contrato.</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      {((productPosicao.contratos || []).length === 0) && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>Nenhuma posição encontrada para esse produto.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer with explicit close button */}
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => { setSelectedProduct(null); setProductPosicao(null); }} style={{ background: '#C0863A', border: 'none' }}>
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
          qtdContratos: 0,
          vlrFinanciado: 0,
          custoEmissao: 0,
          iof: 0,
          amortizacao: 0,
          prestacoesPagasQtde: 0,
          prestacoesPagasValor: 0,
          jurosBrutos: 0,
          ticketMedio: 0,
          saldoDevedor: 0
        };
      }
      
      // Calcular totais baseados apenas nos produtos filtrados
      const totalContratos = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.qtd_contratos || 0), 0);
      const totalFinanciado = matchingFilteredPeriod.produtos.reduce((sum: number, produto: any) => sum + (produto.vlr_financiado || 0), 0);
      const ticketMedio = totalContratos > 0 ? totalFinanciado / totalContratos : 0;
      
      // Para outros valores, vamos fazer uma proporção baseada no valor financiado
      const proporcao = periodData.vlrFinanciado > 0 ? totalFinanciado / periodData.vlrFinanciado : 0;
      
      return {
        ...periodData,
        qtdContratos: totalContratos,
        vlrFinanciado: totalFinanciado,
        custoEmissao: periodData.custoEmissao * proporcao,
        iof: periodData.iof * proporcao,
        amortizacao: periodData.amortizacao * proporcao,
        prestacoesPagasQtde: Math.round(periodData.prestacoesPagasQtde * proporcao),
        prestacoesPagasValor: periodData.prestacoesPagasValor * proporcao,
        jurosBrutos: periodData.jurosBrutos * proporcao,
        ticketMedio: ticketMedio,
        saldoDevedor: periodData.saldoDevedor * proporcao
      };
    });
  }, [comparativeData, filteredProductData, selectedProducts]);

  // Fetch position by product (client-side filter over posicao-completa)
  const fetchPosicaoPorProduto = async (produto: string, period?: string) => {
    try {
      setLoadingProductPosicao(true);
      setProductPosicao(null);
      console.log('[COMPARATIVO] fetchPosicaoPorProduto iniciada para:', produto);
      // fetch full posicao-completa and filter by product name (tolerant match)
      const endpoint = getApiEndpoint('CONTRATOS', '/api/contratos/posicao-completa');
      logApiCall(endpoint, 'REQUEST');
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Erro na API posicao: ${res.status}`);
      const json = await res.json();
      const rows = json.contratos || json;
      let filtered = (rows || []).filter((r: any) => {
        const prod = (r.descricao_do_produto || r.descricaoDoProduto || '').toString().toLowerCase();
        return prod.includes(produto.toLowerCase());
      });

      // If a period is provided, further filter by the period (monthly or daily)
      if (period) {
        try {
          const periodDate = new Date(period);
          if (!isNaN(periodDate.getTime())) {
            if (comparativeType === 'monthly') {
              filtered = filtered.filter((r: any) => {
                const d = new Date(r.dataEntrada || r.data_entr || r.dataEntrada || r.dataEntrada);
                if (isNaN(d.getTime())) return false;
                return d.getMonth() === periodDate.getMonth() && d.getFullYear() === periodDate.getFullYear();
              });
            } else {
              // daily comparison: match exact date
              filtered = filtered.filter((r: any) => {
                const d = new Date(r.dataEntrada || r.data_entr || r.dataEntrada);
                if (isNaN(d.getTime())) return false;
                return d.toDateString() === periodDate.toDateString();
              });
            }
          }
        } catch (e) {
          console.warn('[COMPARATIVO] erro ao filtrar por período', e);
        }
      }
      // compute simple stats
      const stats = {
        totalContratos: filtered.length,
        totalFinanciado: filtered.reduce((s: number, r: any) => s + (Number(r.valor_financiado ?? r.valorFinanciado ?? r.valor_financiado) || 0), 0),
        totalDevedor: filtered.reduce((s: number, r: any) => s + (Number((r.valor_total_devedor ?? r.valorTotalDevedor) || 0) || 0), 0)
      };
      setProductPosicao({ contratos: filtered, estatisticas: stats });
      logApiCall(endpoint, 'SUCCESS');
    } catch (err) {
      console.error('[COMPARATIVO] Erro ao buscar posicao por produto:', err);
      setProductPosicao({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
    } finally {
      setLoadingProductPosicao(false);
    }
  };

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

  const formatDate = (value: any) => {
    try {
      if (!value) return '-';
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      return new Intl.DateTimeFormat('pt-BR').format(d);
    } catch {
      return String(value);
    }
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

    // Dados principais (filtrados se necessário)
    const exportData = dataToExport.map(item => ({
      'Período': item.display,
      'Qtd Contratos': item.qtdContratos,
      'Valor Financiado': item.vlrFinanciado,
      'Custo Emissão': item.custoEmissao,
      'IOF': item.iof,
      'Amortização': item.amortizacao,
      'Prestações Pagas (Qtd)': item.prestacoesPagasQtde,
      'Prestações Pagas (Valor)': item.prestacoesPagasValor,
      'Juros Brutos': item.jurosBrutos,
      'Ticket Médio': item.ticketMedio,
      'Saldo Devedor': item.saldoDevedor
    }));

    const workbook = XLSX.utils.book_new();
    
    // Aba principal
    const mainWorksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Comparativo Principal');
    
    // Aba de produtos (se houver dados)
    if (productData.length > 0) {
      const productExportData: any[] = [];
      productData.forEach(periodData => {
        if (periodData.produtos) {
          periodData.produtos.forEach((produto: any) => {
            productExportData.push({
              'Período': periodData.display,
              'Produto': produto.produto,
              'Qtd Contratos': produto.qtd_contratos,
              'Valor Financiado': produto.vlr_financiado,
              'Ticket Médio': produto.ticket_medio
            });
          });
        }
      });
      
      if (productExportData.length > 0) {
        const productWorksheet = XLSX.utils.json_to_sheet(productExportData);
        XLSX.utils.book_append_sheet(workbook, productWorksheet, 'Detalhes por Produto');
      }
    }
    
    const filterSuffix = selectedProducts.length > 0 ? '_filtrado' : '';
    const filename = `comparativo_posicao_contratos_${comparativeType}${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const renderMetricCard = (
    title: string,
    getValue: (data: ComparativeData) => number,
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
            {toastMessage && (
              <div className="fixed right-6 bottom-6 z-50 p-3 rounded shadow-lg" style={{ background: '#0b1220', color: 'white', border: '1px solid rgba(192,134,58,0.2)' }}>
                {toastMessage}
              </div>
            )}
            {/* Modal removed from here and moved to top-level so it's always available when selectedProduct is set. */}
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
                {dataToUse[dataToUse.length - 1]?.display}
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
              className="text-2xl font-bold transition-all duration-300 group-hover:scale-105"
              style={{ 
                color: '#FFFFFF',
                textShadow: '0 0 10px rgba(192, 134, 58, 0.3)'
              }}
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
                {dataToUse[dataToUse.length - 2]?.display}
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
                  {dataToUse[dataToUse.length - 3]?.display}
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
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
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
    getValue: (data: ComparativeData) => number,
    formatter: (value: number) => string,
    description: string,
    icon: React.ReactNode
  ) => {
    const dataToUse = getFilteredMainData;
    if (dataToUse.length < 1) return null;

    // Pegar os últimos 3 períodos (ou quantos estiverem disponíveis)
    const periods = [];
    for (let i = Math.min(3, dataToUse.length); i > 0; i--) {
      const periodData = dataToUse[dataToUse.length - i];
      if (periodData) {
        periods.push({
          label: periodData.display,
          value: getValue(periodData),
          data: periodData
        });
      }
    }

    // Calcular variação entre o último e o penúltimo período
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
          <div style={{ color: '#C48A3F' }}>
            {icon}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            {/* Descrição */}
            <p className="text-xs text-gray-400">{description}</p>
            
            {/* Grid dos 3 períodos */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 gap-3">
              {periods.map((period, index) => {
                const isLatest = index === periods.length - 1;
                const isMostRecent = index === periods.length - 1;
                const isSecondMostRecent = index === periods.length - 2;
                const isOldest = index === 0;
                
                // Calcular variação para cada período (comparado com o anterior)
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
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-1"
                            style={{ 
                              backgroundColor: isLatest ? 'rgba(34, 197, 94, 0.2)' : 
                                             isSecondMostRecent ? 'rgba(59, 130, 246, 0.2)' : 
                                             'rgba(107, 114, 128, 0.2)',
                              color: isLatest ? '#22c55e' : 
                                     isSecondMostRecent ? '#3b82f6' : 
                                     '#6b7280',
                              border: `1px solid ${isLatest ? 'rgba(34, 197, 94, 0.3)' : 
                                                  isSecondMostRecent ? 'rgba(59, 130, 246, 0.3)' : 
                                                  'rgba(107, 114, 128, 0.3)'}`
                            }}
                          >
                            {isLatest ? 'Atual' : 
                             isSecondMostRecent ? 'Anterior' : 
                             'Retrasado'}
                          </Badge>
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
                        <div className="text-xs text-gray-400 mb-2">
                          {period.label}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-xl font-bold ${
                            isLatest ? 'text-white' : 
                            isSecondMostRecent ? 'text-blue-300' : 
                            'text-gray-300'
                          }`}>
                            {formatter(period.value)}
                          </div>
                          
                          {/* Indicador de variação para cada período */}
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
            </StaggeredContainer>
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

  return (
      <>
        <ProductPositionModal />

    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-full mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">
            Comparativo Avançado de Contratos
          </h1>
          <p className="text-slate-400 text-lg">
            Análise comparativa temporal com KPIs avançados e insights financeiros
          </p>
          <div className="text-sm text-slate-300">
            Debug clicks: <span className="font-medium text-white">{debugClickCount}</span>
          </div>
        </div>

        {/* Controls */}
        <Card 
          className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
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
              <Calendar className="h-6 w-6" />
              Controles de Comparação Avançada
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
                          className="cursor-pointer transition-all duration-200 hover:scale-105"
                          style={{
                            background: 'rgba(192, 134, 58, 0.2)',
                            color: '#C0863A',
                            border: '1px solid rgba(192, 134, 58, 0.3)'
                          }}
                        >
                          {produto.length > 20 ? `${produto.substring(0, 20)}...` : produto}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer hover:opacity-70 transition-opacity" 
                            onClick={() => setSelectedProducts(prev => prev.filter(p => p !== produto))}
                          />
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-slate-400 hover:text-orange-400 h-6 transition-colors duration-200"
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
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 font-medium transition-all duration-200"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  disabled={loading || getFilteredMainData.length === 0}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 font-medium transition-all duration-200"
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
                'Total de Contratos',
                (data) => data.qtdContratos,
                formatNumber,
                'contratos ativos',
                <TrendingUp className="h-6 w-6" style={{ color: '#C48A3F' }} />
              )}

              {renderAdvancedMetricCard(
                'Valor Financiado',
                (data) => data.vlrFinanciado,
                formatCurrency,
                'capital principal',
                <TrendingUp className="h-6 w-6" style={{ color: '#C48A3F' }} />
              )}

              {renderAdvancedMetricCard(
                'Valor Total Pago',
                (data) => data.prestacoesPagasValor,
                formatCurrency,
                'efetivamente recebido',
                <TrendingUp className="h-6 w-6" style={{ color: '#22c55e' }} />
              )}

              {renderAdvancedMetricCard(
                'Saldo Devedor',
                (data) => data.saldoDevedor,
                formatCurrency,
                'saldo em aberto',
                <TrendingDown className="h-6 w-6" style={{ color: '#ef4444' }} />
              )}
            </StaggeredContainer>

            {/* Segunda Linha - KPIs Analíticos */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {renderAdvancedMetricCard(
                'Ticket Médio',
                (data) => data.ticketMedio,
                formatCurrency,
                'valor médio por contrato',
                <BarChart3 className="h-6 w-6" style={{ color: '#C48A3F' }} />
              )}

              {renderAdvancedMetricCard(
                'Juros Brutos',
                (data) => data.jurosBrutos,
                formatCurrency,
                'receita de juros acumulada',
                <TrendingUp className="h-6 w-6" style={{ color: '#C48A3F' }} />
              )}

              {renderAdvancedMetricCard(
                'Prestações Pagas',
                (data) => data.prestacoesPagasQtde,
                formatNumber,
                'parcelas quitadas',
                <Calendar className="h-6 w-6" style={{ color: '#C48A3F' }} />
              )}
            </StaggeredContainer>

            {/* Terceira Linha - KPIs Operacionais */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {renderAdvancedMetricCard(
                'Custo de Emissão',
                (data) => data.custoEmissao,
                formatCurrency,
                'custos operacionais',
                <TrendingDown className="h-5 w-5" style={{ color: '#C48A3F' }} />
              )}

              {renderAdvancedMetricCard(
                'IOF',
                (data) => data.iof,
                formatCurrency,
                'imposto sobre operações',
                <TrendingDown className="h-5 w-5" style={{ color: '#C48A3F' }} />
              )}

              {renderAdvancedMetricCard(
                'Amortização',
                (data) => data.amortizacao,
                formatCurrency,
                'valor amortizado',
                <TrendingUp className="h-5 w-5" style={{ color: '#C48A3F' }} />
              )}

              {renderAdvancedMetricCard(
                'Eficiência de Cobrança',
                (data) => data.prestacoesPagasQtde > 0 && data.qtdContratos > 0 ? 
                  (data.prestacoesPagasQtde / data.qtdContratos) * 100 : 0,
                (value) => `${value.toFixed(1)}%`,
                '% média de parcelas pagas',
                <ArrowUp className="h-5 w-5" style={{ color: '#C48A3F' }} />
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
                    Breakdown de vendas por produto em cada período
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
                          {dayData.display}
                        </div>
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
                                    className="font-bold text-sm leading-tight max-w-full break-words" 
                                    style={{ 
                                      color: '#FFFFFF',
                                      textShadow: '0 0 8px rgba(196, 138, 63, 0.4)'
                                    }}
                                    title={produto.produto}
                                  >
                                    {produto.produto}
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
                                    {formatNumber(produto.qtd_contratos)} contratos
                                  </Badge>
                                </div>
                                
                                {/* Métricas */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: 'rgba(192, 134, 58, 0.8)' }}
                                    >
                                      Valor Financiado:
                                    </span>
                                    <span 
                                      className="text-sm font-bold"
                                      style={{ 
                                        color: '#22c55e',
                                        textShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
                                      }}
                                    >
                                      {formatCurrency(produto.vlr_financiado)}
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
                                      {formatCurrency(produto.ticket_medio)}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 flex justify-end">
                                  <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); const prodName = produto.produto || produto; console.log('[COMPARATIVO] Análise detalhada clicada para produto:', prodName); if (!prodName) return; setSelectedProduct(prodName); setToastMessage(`Abrindo análise: ${prodName}`); setTimeout(() => setToastMessage(null), 3000); fetchPosicaoPorProduto(prodName, dayData.period); setDebugClickCount(c => { const n = (c || 0) + 1; try { localStorage.setItem('cmp_debug_clicks', String(n)); } catch {} return n; }); }} style={{ background: '#C0863A', border: 'none' }}>
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
          <Card 
            className="relative border-0 shadow-2xl overflow-hidden transition-all duration-500"
            style={{ 
              background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
              borderColor: 'rgba(192, 134, 58, 0.3)',
              border: '1px solid rgba(192, 134, 58, 0.3)'
            }}
          >
            <CardContent className="py-12 text-center">
              <Calendar 
                className="h-16 w-16 mx-auto mb-6"
                style={{ color: 'rgba(192, 134, 58, 0.5)' }}
              />
              <h3 
                className="text-xl font-bold mb-3"
                style={{ 
                  color: '#FFFFFF',
                  textShadow: '0 0 10px rgba(192, 134, 58, 0.3)'
                }}
              >
                {selectedProducts.length > 0 ? 'Nenhum dado encontrado para os filtros aplicados' : 'Nenhum dado encontrado'}
              </h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                {selectedProducts.length > 0 
                  ? `Não foram encontrados dados para os produtos selecionados na comparação ${comparativeType === 'monthly' ? 'mensal' : 'diária'}.`
                  : `Não foram encontrados dados para a comparação ${comparativeType === 'monthly' ? 'mensal' : 'diária'}.`
                }
              </p>
              {selectedProducts.length > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 font-medium transition-all duration-200"
                  style={{
                    borderColor: 'rgba(192, 134, 58, 0.3)',
                    color: '#C0863A'
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
};

export default ComparativoPosicaoContratos;