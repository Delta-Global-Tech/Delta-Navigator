import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FileText, DollarSign, TrendingUp, Users, AlertCircle, CheckCircle, XCircle, Clock, Search, FileSpreadsheet, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, X, Eye, Layers } from 'lucide-react';
import { getApiEndpoint, logApiCall } from '@/lib/api-config';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StaggeredContainer } from '@/components/motion/StaggeredContainer';

// Adicionando estilos personalizados dinamicamente
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
      25% { transform: translateY(-10px) translateX(5px); opacity: 0.6; }
      50% { transform: translateY(-20px) translateX(-5px); opacity: 1; }
      75% { transform: translateY(-10px) translateX(10px); opacity: 0.6; }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    
    @keyframes slideInFromBottom {
      0% { transform: translateY(100px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);
}

interface DesembolsoData {
  descricao: string;
  nome: string;
  vl_financ: number;
  vlr_tac: number;
  vlr_iof: number;
  out_vlr: number;
  vlr_liberado: number;
  valor_solic: number;
  nr_cpf_cnpj: string;
  nome_inst: string;
  data_entrada: string;
  nome_conven: string;
  nome_filial: string;
  data_mov_lib: string;
  contrato: string;
  taxa: number;
  taxa_real: number;
  taxa_cet: number;
  status_final: string;
}

interface DesembolsoStats {
  total_contratos: number;
  total_liberado: number;
  total_solicitado: number;
  valor_total_financiado: number;
  valor_total_tac: number;
  valor_total_iof: number;
  valor_total_outros: number;
  ticket_medio: number;
  ticket_medio_financiado: number;
  liberados: number;
  pendentes: number;
  reprovados: number;
  eficiencia_liberacao: number;
  filiais_unicas: number;
  convenios_unicos: number;
  produtos_unicos: number;
  taxa_media: number;
  taxa_real_media: number;
  taxa_cet_media: number;
  filtros_aplicados: any;
}

const KPICard = ({ title, value, subtitle, icon: Icon }) => { 
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
          className="text-sm font-medium tracking-wide"
          style={{ color: 'rgba(192, 134, 58, 0.9)' }}
        >
          {title}
        </CardTitle>
        <div 
          className="p-2 rounded-full transition-all duration-300 group-hover:scale-110"
          style={{ 
            background: 'rgba(192, 134, 58, 0.15)',
            border: '1px solid rgba(192, 134, 58, 0.3)' 
          }}
        >
          <Icon 
            className="h-4 w-4 transition-colors duration-300" 
            style={{ color: '#C0863A' }}
          />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div 
          className="text-2xl font-bold mb-1 transition-all duration-300 group-hover:scale-105"
          style={{ 
            color: '#FFFFFF',
            textShadow: '0 0 10px rgba(192, 134, 58, 0.3)'
          }}
        >
          {value}
        </div>
        <p 
          className="text-xs transition-colors duration-300"
          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
};

const LoadingSpinner = () => (
  <div 
    className="flex items-center justify-center min-h-screen relative overflow-hidden" 
    style={{ 
      background: 'linear-gradient(135deg, #031226 0%, #0a1b33 20%, #142b4a 40%, #1a3454 60%, #0a1b33 80%, #031226 100%)'
    }}
  >
    {/* Efeito de partículas */}
    <div className="absolute inset-0">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
    
    <div className="text-center relative z-10 flex flex-col items-center justify-center">
      <img
        src="/delta-logo-original.png"
        alt="Delta Global Logo"
        className="h-48 w-48 mb-8 mx-auto"
        style={{ 
          filter: 'drop-shadow(0 0 40px rgba(184, 134, 11, 0.9))',
          objectFit: 'contain'
        }}
      />
      <p style={{ color: '#C0863A', fontSize: '1.3rem', fontWeight: '600' }}>Carregando dados de desembolso...</p>
      <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginTop: '8px' }}>Aguarde enquanto processamos as informações</p>
    </div>
  </div>
);

const MultiSelectDropdown = ({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  onRemove 
}: {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1" style={{ color: '#C0863A' }}>
        {label}
      </label>
      
      {/* Selected items */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedValues.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ 
                background: 'rgba(192, 134, 58, 0.2)',
                border: '1px solid rgba(192, 134, 58, 0.3)',
                color: '#C0863A'
              }}
            >
              {options.find(opt => opt.value === value)?.label || value}
              <X 
                size={12} 
                className="cursor-pointer hover:opacity-70" 
                onClick={() => onRemove(value)}
              />
            </span>
          ))}
        </div>
      )}

      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 rounded border-0 text-left text-white flex justify-between items-center"
        style={{ 
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(192, 134, 58, 0.3)'
        }}
      >
        <span>
          {selectedValues.length > 0 
            ? `${selectedValues.length} selecionado(s)`
            : `Selecionar ${label.toLowerCase()}`
          }
        </span>
        <span>{isOpen ? '▼' : '▶'}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 rounded border max-h-60 overflow-y-auto"
          style={{ 
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(192, 134, 58, 0.3)'
          }}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 p-2 hover:bg-opacity-10 hover:bg-white cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => onChange(option.value)}
                className="rounded"
                style={{ accentColor: '#C0863A' }}
              />
              <span style={{ color: 'white' }}>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

interface RankingCategoria {
  categoria: string;
  quantidade_produtos: number;
  quantidade_contratos: number;
  total_financiado: number;
  total_liberado: number;
  total_solicitado: number;
  percentual_liberado: number;
  ticket_medio: number;
  produtos: any[];
}

interface RankingData {
  resumo_categorias: RankingCategoria[];
  produtos_detalhados: any[];
  estatisticas_gerais: any;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterOptions {
  produtos: FilterOption[];
  filiais: FilterOption[];
  convenios: FilterOption[];
  instituicoes: FilterOption[];
  status: FilterOption[];
}

interface FilterState {
  dataInicio: string;
  dataFim: string;
  produto: string[];
  valorMinimo: string;
  valorMaximo: string;
  filial: string[];
  convenio: string[];
  status: string;
}

const Desembolso = () => {
  const [data, setData] = useState<{desembolsos: DesembolsoData[], estatisticas: DesembolsoStats} | null>(null);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'data_entrada' | 'vlr_liberado' | 'vlr_financiado'>('data_entrada');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<string | null>(null);
  const [contratoPosicao, setContratoPosicao] = useState<any | null>(null);
  const [loadingPosicao, setLoadingPosicao] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    dataInicio: '',
    dataFim: '',
    produto: [],
    valorMinimo: '',
    valorMaximo: '',
    filial: [],
    convenio: [],
    status: ''
  });

  const fetchFilterOptions = async () => {
    try {
      const url = getApiEndpoint('CONTRATOS', '/api/contratos/desembolso/filtros');
      console.log('[DESEMBOLSO] Buscando opções de filtros...', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro na API de filtros: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[DESEMBOLSO] Opções de filtros recebidas:', result);
      setFilterOptions(result);
    } catch (err) {
      console.error('[DESEMBOLSO] Erro ao carregar filtros:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query string com filtros
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Para arrays (múltipla seleção), enviar cada valor separadamente
          value.forEach(item => {
            if (item && item.trim() !== '') {
              queryParams.append(key, item.trim());
            }
          });
        } else if (value && value.trim() !== '') {
          queryParams.append(key, value.trim());
        }
      });
      
      const queryString = queryParams.toString();
      
      // Buscar dados principais de desembolso
      const url = getApiEndpoint('CONTRATOS', '/api/contratos/desembolso' + (queryString ? `?${queryString}` : ''));
      console.log('[DESEMBOLSO] Buscando dados...', url);
      logApiCall(url, 'REQUEST');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[DESEMBOLSO] Dados recebidos:', result);
      logApiCall(url, 'SUCCESS');
      
      setData(result);
      
      // Buscar dados de ranking com os mesmos filtros
      const rankingUrl = getApiEndpoint('CONTRATOS', '/api/contratos/desembolso/ranking-produtos' + (queryString ? `?${queryString}` : ''));
      console.log('[DESEMBOLSO] Buscando ranking...', rankingUrl);
      logApiCall(rankingUrl, 'REQUEST');
      
      const rankingResponse = await fetch(rankingUrl);
      
      if (!rankingResponse.ok) {
        throw new Error(`Erro na API de ranking: ${rankingResponse.status}`);
      }
      
      const rankingResult = await rankingResponse.json();
      console.log('[DESEMBOLSO] Ranking recebido:', rankingResult);
      logApiCall(rankingUrl, 'SUCCESS');
      
      setRankingData(rankingResult);
      
    } catch (err) {
      console.error('[DESEMBOLSO] Erro ao carregar dados:', err);
      const url = getApiEndpoint('CONTRATOS', '/api/contratos/desembolso');
      logApiCall(url, 'ERROR');
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatCurrencyCompact = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(value || 0);
    } catch {
      return formatCurrency(value);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  const formatPercent = (value: number) => {
    return `${(value || 0).toFixed(2)}%`;
  };


  const fetchPosicaoPorContrato = async (no_contrato: string) => {
    try {
      setLoadingPosicao(true);
      setContratoPosicao(null);
      const endpoint = getApiEndpoint('CONTRATOS', `/api/contratos/posicao-completa?no_contrato=${encodeURIComponent(no_contrato)}`);
      console.log('[DESEMBOLSO] Buscando posição para contrato', no_contrato, endpoint);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Erro na API posicao: ${res.status}`);
      const json = await res.json();
      // API returns { contratos: [...], estatisticas: {...} }
      setContratoPosicao(json);
    } catch (err) {
      console.error('[DESEMBOLSO] Erro ao buscar posicao do contrato:', err);
      setContratoPosicao({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
    } finally {
      setLoadingPosicao(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMultiSelectChange = (key: 'produto' | 'filial' | 'convenio', value: string) => {
    setFilters(prev => {
      const currentValues = prev[key] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [key]: newValues
      };
    });
  };

  const removeFromMultiSelect = (key: 'produto' | 'filial' | 'convenio', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter(item => item !== value)
    }));
  };

  const clearFilters = () => {
    setFilters({
      dataInicio: '',
      dataFim: '',
      produto: [],
      valorMinimo: '',
      valorMaximo: '',
      filial: [],
      convenio: [],
      status: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Liberado': { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
      'Pendente': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
      'Reprovado': { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }
    };
    
    const config = statusConfig[status] || statusConfig['Pendente'];
    
    return (
      <Badge 
        style={{ 
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.color}30`
        }}
      >
        {status}
      </Badge>
    );
  };

  // Filtrar e ordenar dados
  const filteredAndSortedData = useMemo(() => {
    if (!data?.desembolsos) return [];
    
    let filtered = data.desembolsos.filter(item => 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nr_cpf_cnpj.includes(searchTerm) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nome_inst.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'vlr_liberado':
          aValue = a.vlr_liberado;
          bValue = b.vlr_liberado;
          break;
        case 'vlr_financiado':
          aValue = a.vl_financ;
          bValue = b.vl_financ;
          break;
        case 'data_entrada':
        default:
          aValue = new Date(a.data_entrada || 0).getTime();
          bValue = new Date(b.data_entrada || 0).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [data?.desembolsos, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Advanced analytics: monthly series and top products (based on the current filtered dataset)
  const monthlySeries = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return [];
    const map: Record<string, { month: string; valorLiberado: number; valorFinanciado: number }> = {};
    filteredAndSortedData.forEach(item => {
      const date = item.data_entrada ? new Date(item.data_entrada) : null;
      const key = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 'SemData';
      if (!map[key]) map[key] = { month: key, valorLiberado: 0, valorFinanciado: 0 };
      map[key].valorLiberado += Number(item.vlr_liberado) || 0;
      map[key].valorFinanciado += Number(item.vl_financ) || 0;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredAndSortedData]);

  const topProducts = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return [];
    const map: Record<string, number> = {};
    filteredAndSortedData.forEach(item => {
      const key = item.descricao || 'Sem Produto';
      map[key] = (map[key] || 0) + (Number(item.vl_financ) || 0);
    });
    const arr = Object.keys(map).map(k => ({ produto: k, valor: map[k] }));
    arr.sort((a, b) => b.valor - a.valor);
    return arr.slice(0, 10);
  }, [filteredAndSortedData]);

  const insights = useMemo(() => {
    const ins: string[] = [];
    if ((monthlySeries || []).length >= 2) {
      const last = monthlySeries[monthlySeries.length - 1].valorLiberado;
      const prev = monthlySeries[monthlySeries.length - 2].valorLiberado || 0;
      const mom = prev === 0 ? 0 : ((last - prev) / prev) * 100;
      ins.push(`Variação Mês-a-Mês (Valor Liberado): ${mom >= 0 ? '+' : ''}${mom.toFixed(2)}%`);
    }
    if ((topProducts || []).length > 0) {
      const totalTop = topProducts.reduce((s, t) => s + t.valor, 0);
      const share = totalTop > 0 ? (topProducts[0].valor / totalTop) * 100 : 0;
      ins.push(`Produto líder: ${topProducts[0].produto} — participa ${share.toFixed(1)}% da carteira TOP`);
    }
    if ((filteredAndSortedData || []).length > 0) {
      const totalFin = filteredAndSortedData.reduce((s, it) => s + (Number(it.vl_financ) || 0), 0);
      ins.push(`Total Financiado (visível): ${formatCurrency(totalFin)}`);
    }
    return ins;
  }, [monthlySeries, topProducts, filteredAndSortedData]);

  const exportToExcel = () => {
    if (!filteredAndSortedData.length) return;

    // Build workbook with KPIs + Desembolsos
    const wb = XLSX.utils.book_new();


  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 20%, #142b4a 40%, #1a3454 60%, #0a1b33 80%, #031226 100%)' }}
      >
        <Card className="p-8 text-center max-w-md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <XCircle className="mx-auto mb-4" size={48} style={{ color: '#EF4444' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#EF4444' }}>Erro ao Carregar</h3>
          <p className="mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{error}</p>
          <Button onClick={fetchData} style={{ background: '#C0863A', border: 'none' }}>
            <RotateCcw className="mr-2" size={16} />
            Tentar Novamente
          </Button>
        </Card>
      </div>
    );
  }

  const stats = data?.estatisticas || {
    total_contratos: 0,
    total_liberado: 0,
    total_solicitado: 0,
    valor_total_financiado: 0,
    valor_total_tac: 0,
    valor_total_iof: 0,
    valor_total_outros: 0,
    ticket_medio: 0,
    ticket_medio_financiado: 0,
    liberados: 0,
    pendentes: 0,
    reprovados: 0,
    eficiencia_liberacao: 0,
    filiais_unicas: 0,
    convenios_unicos: 0,
    produtos_unicos: 0,
    taxa_media: 0,
    taxa_real_media: 0,
    taxa_cet_media: 0,
    filtros_aplicados: {}
  };

  return (
    <div 
      className="space-y-8 p-8 relative overflow-hidden animate-slideInFromBottom"
      style={{ 
        background: 'linear-gradient(135deg, #031226 0%, #0a1b33 20%, #142b4a 40%, #1a3454 60%, #0a1b33 80%, #031226 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Efeito avançado de partículas de energia */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Partículas principais */}
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: ['#C0863A', '#031226', 'rgba(192, 134, 58, 0.7)', 'rgba(3, 18, 38, 0.8)'][Math.floor(Math.random() * 4)],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`,
              animation: `float ${4 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
        
        {/* Linhas de conexão energética */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute opacity-10"
            style={{
              width: '2px',
              height: `${Math.random() * 200 + 100}px`,
              background: 'linear-gradient(180deg, transparent, #C0863A, transparent)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `pulse ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Orbes de energia grandes */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full opacity-5"
            style={{
              width: `${Math.random() * 150 + 100}px`,
              height: `${Math.random() * 150 + 100}px`,
              background: `radial-gradient(circle, ${['#C0863A', '#031226', 'rgba(192, 134, 58, 0.5)'][i]} 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(40px)',
              animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      {/* Header */}
      <div className="mb-8 relative z-10">
        <div 
          className="text-center py-8 rounded-xl mb-6"
          style={{ 
            background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ 
              color: '#FFFFFF',
              textShadow: '0 0 20px rgba(192, 134, 58, 0.5)'
            }}
          >
            📊 Análise de Desembolsos EM
          </h1>
          <p 
            className="text-lg"
            style={{ color: 'rgba(192, 134, 58, 0.8)' }}
          >
            Painel Executivo de Controle Financeiro e Performance
          </p>
        </div>
      </div>

      {/* KPIs Principais (estilo alinhado com Posição Contratos) */}
      <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 relative z-10">
        <KPICard
          title="Total Contratos"
          value={stats.total_contratos.toLocaleString()}
          subtitle="Operações processadas"
          icon={FileText}
        />
        <KPICard
          title="Valor Liberado"
          value={formatCurrency(stats.total_liberado)}
          subtitle="Montante total liberado"
          icon={DollarSign}
        />
        <KPICard
          title="Total Financiado"
          value={formatCurrency(stats.valor_total_financiado)}
          subtitle="Capital financiado"
          icon={DollarSign}
        />
        <KPICard
          title="Ticket Médio"
          value={formatCurrency(stats.ticket_medio)}
          subtitle="Valor médio por contrato"
          icon={TrendingUp}
        />
      </StaggeredContainer>

      {/* KPIs de Taxas e Status */}
      <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <KPICard
          title="Taxa Média"
          value={formatPercent(stats.taxa_media || 0)}
          subtitle="Taxa nominal média"
          icon={TrendingUp}
        />
        <KPICard
          title="Taxa Real Média"
          value={formatPercent(stats.taxa_real_media || 0)}
          subtitle="Taxa real média"
          icon={TrendingUp}
        />
        <KPICard
          title="Taxa CET Média"
          value={formatPercent(stats.taxa_cet_media || 0)}
          subtitle="CET médio"
          icon={TrendingUp}
        />
        <KPICard
          title="Total TAC"
          value={formatCurrency(stats.valor_total_tac || 0)}
          subtitle="Taxa de abertura de crédito"
          icon={AlertCircle}
        />
        <KPICard
          title="Total IOF"
          value={formatCurrency(stats.valor_total_iof || 0)}
          subtitle="Imposto sobre operações financeiras"
          icon={AlertCircle}
        />
      </StaggeredContainer>

      {/* Ranking de Produtos por Categoria */}
      {rankingData && (
        <div className="mb-8 relative z-10">
          <h2 
            className="text-2xl font-bold mb-4 text-center"
            style={{ 
              color: '#C0863A',
              textShadow: '0 0 10px rgba(192, 134, 58, 0.5)'
            }}
          >
            🏆 Ranking de Produtos por Categoria
          </h2>
          
          <div 
            className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
          >
            {rankingData.resumo_categorias
              .filter(categoria => categoria.categoria !== 'Outros' || categoria.quantidade_produtos > 0)
              .map((categoria, index) => (
              <Card
                key={categoria.categoria}
                className="p-5 w-full"
                style={{ 
                  background: categoria.categoria === 'Outros' 
                    ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #DC2626 100%)' 
                    : 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
                  border: categoria.categoria === 'Outros' 
                    ? '1px solid rgba(220, 38, 38, 0.5)' 
                    : '1px solid rgba(192, 134, 58, 0.3)',
                  boxShadow: categoria.categoria === 'Outros' 
                    ? '0 4px 15px rgba(220, 38, 38, 0.3)' 
                    : '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle 
                    className="text-lg font-bold flex items-center gap-2"
                    style={{ color: categoria.categoria === 'Outros' ? '#FEE2E2' : '#C0863A' }}
                  >
                    <span className="text-xl">
                      {categoria.categoria === 'Outros' ? '⚠️' : (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊')}
                    </span>
                    {categoria.categoria}
                    {categoria.categoria === 'Outros' && (
                      <span className="text-sm font-normal" style={{ color: '#FECACA' }}>
                        (Novos Produtos!)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Produtos:</span>
                    <span style={{ color: '#FFFFFF' }} className="font-semibold">
                      {categoria.quantidade_produtos}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Contratos:</span>
                    <span style={{ color: '#FFFFFF' }} className="font-semibold">
                      {categoria.quantidade_contratos.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Total Liberado:</span>
                    <span style={{ color: '#10B981' }} className="font-bold">
                      {formatCurrency(categoria.total_liberado)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Valor Financiado:</span>
                    <span style={{ color: '#10B981' }} className="font-bold">
                      {formatCurrency((categoria.total_financiado ?? categoria.total_liberado) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Participação:</span>
                    <span style={{ color: '#C0863A' }} className="font-bold">
                      {categoria.percentual_liberado.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Ticket Médio:</span>
                    <span style={{ color: '#FFFFFF' }} className="font-semibold">
                      {formatCurrency(categoria.ticket_medio)}
                    </span>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <div 
                      className="w-full bg-gray-700 rounded-full h-2"
                      style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${categoria.percentual_liberado}%`,
                          background: `linear-gradient(90deg, #C0863A, #D4A574)`
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filtros e Controles */}
      <Card 
        className="mb-6 p-4 relative z-10"
        style={{ 
          background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
          border: '1px solid rgba(192, 134, 58, 0.3)'
        }}
      >
        <div className="flex flex-col gap-4">
          {/* Linha de busca e botões */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search size={20} style={{ color: '#C0863A' }} />
              <input
                type="text"
                placeholder="Buscar por cliente, CPF/CNPJ, produto ou instituição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 rounded border-0 text-white"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                style={{ borderColor: '#C0863A', color: '#C0863A' }}
              >
                Filtros {showFilters ? '▼' : '▶'}
              </Button>
              <Button
                onClick={exportToExcel}
                disabled={!filteredAndSortedData.length}
                style={{ background: '#C0863A', border: 'none' }}
              >
                <FileSpreadsheet className="mr-2" size={16} />
                Exportar Excel
              </Button>
              <Button
                onClick={fetchData}
                variant="outline"
                style={{ borderColor: '#C0863A', color: '#C0863A' }}
              >
                <RotateCcw className="mr-2" size={16} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Painel de filtros */}
          {showFilters && (
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(192, 134, 58, 0.2)'
              }}
            >
              <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtros de Data */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C0863A' }}>
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                    className="w-full p-2 rounded border-0 text-white"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(192, 134, 58, 0.3)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C0863A' }}>
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                    className="w-full p-2 rounded border-0 text-white"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(192, 134, 58, 0.3)'
                    }}
                  />
                </div>

                {/* Filtros de Valor */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C0863A' }}>
                    Valor Mínimo
                  </label>
                  <input
                    type="number"
                    value={filters.valorMinimo}
                    onChange={(e) => handleFilterChange('valorMinimo', e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2 rounded border-0 text-white"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(192, 134, 58, 0.3)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C0863A' }}>
                    Valor Máximo
                  </label>
                  <input
                    type="number"
                    value={filters.valorMaximo}
                    onChange={(e) => handleFilterChange('valorMaximo', e.target.value)}
                    placeholder="999999.00"
                    className="w-full p-2 rounded border-0 text-white"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(192, 134, 58, 0.3)'
                    }}
                  />
                </div>

                {/* Dropdowns com múltipla seleção */}
                <MultiSelectDropdown
                  label="Produtos"
                  options={filterOptions?.produtos || []}
                  selectedValues={filters.produto}
                  onChange={(value) => handleMultiSelectChange('produto', value)}
                  onRemove={(value) => removeFromMultiSelect('produto', value)}
                />

                <MultiSelectDropdown
                  label="Filiais"
                  options={filterOptions?.filiais || []}
                  selectedValues={filters.filial}
                  onChange={(value) => handleMultiSelectChange('filial', value)}
                  onRemove={(value) => removeFromMultiSelect('filial', value)}
                />

                <MultiSelectDropdown
                  label="Convênios"
                  options={filterOptions?.convenios || []}
                  selectedValues={filters.convenio}
                  onChange={(value) => handleMultiSelectChange('convenio', value)}
                  onRemove={(value) => removeFromMultiSelect('convenio', value)}
                />

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C0863A' }}>
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full p-2 rounded border-0 text-white"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(192, 134, 58, 0.3)'
                    }}
                  >
                    <option value="">Todos os status</option>
                    {filterOptions?.status.map(option => (
                      <option key={option.value} value={option.value} style={{ background: '#1A1A1A' }}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </StaggeredContainer>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  style={{ borderColor: '#6B7280', color: '#6B7280' }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal: Posição do Contrato (drill-through) */}
      {selectedContrato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', padding: '28px' }}>
          <div className="rounded-2xl shadow-3xl overflow-hidden w-full max-w-6xl animate-fade-in" style={{ background: 'linear-gradient(180deg, #031226 0%, #062233 100%)', border: '1px solid rgba(192, 134, 58, 0.22)', padding: '8px' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(192,134,58,0.15)', padding: '8px', borderRadius: 8 }}>
                  <Layers style={{ color: '#C0863A' }} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: '#FFF' }}>Posição do Contrato</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedContrato}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setSelectedContrato(null); setContratoPosicao(null); }}>
                  <X />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {loadingPosicao && (
                <div className="py-8 text-center text-white">Carregando posição do contrato...</div>
              )}

              {!loadingPosicao && contratoPosicao && contratoPosicao.error && (
                <div className="py-4 text-red-400">Erro: {contratoPosicao.error}</div>
              )}

              {!loadingPosicao && contratoPosicao && !contratoPosicao.error && (
                <div className="space-y-4 text-white">
                  {/* KPIs linha */}
                  <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-4">
                    {(() => {
                      const first = contratoPosicao.contratos?.[0] || {};
                      const valorFin = (first.valor_financiado ?? first.valorFinanciado ?? 0);
                      const valorTotal = (first.valor_total_devedor ?? first.valorTotalDevedor ?? 0);
                      const valorPago = (first.valor_pago ?? first.valorPago ?? 0);
                      // Saldo atual calculado como (valor total devedor - valor pago)
                      const saldoAtual = (valorTotal - valorPago);
                      const qtdParcelas = (first.quantidade_de_parcelas ?? first.quantidadeDeParcelas ?? first.prestacoes_pagas_total ?? first.prestacoesPagasTotal ?? 0);
                      const valorParcela = (first.valor_parcelas ?? first.valorParcelas ?? first.vlr_prest ?? 0);
                      const percentualPago = (first.percentualPago ?? first.percentual_pago ?? ((valorTotal > 0) ? (valorPago / valorTotal) * 100 : 0));

                      return (
                        <>
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                            <div className="text-sm text-slate-300">Valor Financiado</div>
                            <div className="text-2xl font-bold" title={formatCurrency(valorFin)}>{formatCurrencyCompact(valorFin)}</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                            <div className="text-sm text-slate-300">Valor Total Devedor</div>
                            <div className="text-2xl font-bold" title={formatCurrency(valorTotal)}>{formatCurrencyCompact(valorTotal)}</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                            <div className="text-sm text-slate-300">Valor Pago</div>
                            <div className="text-2xl font-bold" title={formatCurrency(valorPago)}>{formatCurrencyCompact(valorPago)}</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                            <div className="text-sm text-slate-300">Saldo Atual</div>
                            <div className="text-2xl font-bold" title={formatCurrency(saldoAtual)}>{formatCurrencyCompact(saldoAtual)}</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                            <div className="text-sm text-slate-300">Qtd. Parcelas</div>
                            <div className="text-2xl font-bold" title={qtdParcelas.toLocaleString()}>{qtdParcelas.toLocaleString()}</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                            <div className="text-sm text-slate-300">Valor Parcela</div>
                            <div className="text-2xl font-bold" title={formatCurrency(valorParcela)}>{formatCurrencyCompact(valorParcela)}</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md">
                            <div className="text-sm text-slate-300">% Pago</div>
                            <div className="text-2xl font-bold" title={formatPercent(percentualPago)}>{formatPercent(percentualPago)}</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Compact table with rows */}
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
                        {(contratoPosicao.contratos || []).map((c: any, idx: number) => {
                          const rowValorFin = (c.valor_financiado ?? c.valorFinanciado ?? 0);
                          const rowValorPago = (c.valor_pago ?? c.valorPago ?? 0);
                          const rowValorTotal = (c.valor_total_devedor ?? c.valorTotalDevedor ?? 0);
                          const rowSaldo = (rowValorTotal - rowValorPago);
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td className="p-2 max-w-[320px] whitespace-nowrap overflow-hidden text-ellipsis" title={c.descricao_do_produto || c.descricaoDoProduto || '-'} style={{ color: 'white' }}>{c.descricao_do_produto || c.descricaoDoProduto || '-'}</td>
                                <td className="p-2 text-right font-semibold" title={formatCurrency(rowValorFin)} style={{ color: '#10B981' }}>{formatCurrencyCompact(rowValorFin)}</td>
                                <td className="p-2 text-right" title={formatCurrency(rowValorPago)} style={{ color: 'rgba(255,255,255,0.8)' }}>{formatCurrencyCompact(rowValorPago)}</td>
                                <td className="p-2 text-right font-semibold" title={formatCurrency(rowSaldo)} style={{ color: '#F59E0B' }}>{formatCurrencyCompact(rowSaldo)}</td>
                              </tr>
                          );
                        })}
                        {((contratoPosicao.contratos || []).length === 0) && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>Nenhuma posição encontrada para esse contrato.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <Card 
        className="overflow-hidden relative z-10"
        style={{ 
          background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
          border: '1px solid rgba(192, 134, 58, 0.3)'
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: '#C0863A' }}>
            Lista de Desembolsos ({filteredAndSortedData.length})
          </CardTitle>
          <CardDescription style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Clique nos cabeçalhos para ordenar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(192, 134, 58, 0.3)' }}>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Produto</th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Cliente</th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>CPF/CNPJ</th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Contrato</th>
                  <th 
                    className="p-3 text-left font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-white transition-colors"
                    style={{ color: '#C0863A' }}
                    onClick={() => handleSort('vlr_financiado')}
                  >
                    <div className="flex items-center gap-1">
                      Valor Financiado
                      {sortBy === 'vlr_financiado' && (
                        sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                      )}
                      {sortBy !== 'vlr_financiado' && <ArrowUpDown size={14} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-left font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-white transition-colors"
                    style={{ color: '#C0863A' }}
                    onClick={() => handleSort('vlr_liberado')}
                  >
                    <div className="flex items-center gap-1">
                      Valor Liberado
                      {sortBy === 'vlr_liberado' && (
                        sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                      )}
                      {sortBy !== 'vlr_liberado' && <ArrowUpDown size={14} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Taxa (%)</th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Taxa Real (%)</th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Taxa CET (%)</th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Instituição</th>
                  <th className="p-3 text-left font-semibold" style={{ color: '#C0863A' }}>Status</th>
                  <th 
                    className="p-3 text-left font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-white transition-colors"
                    style={{ color: '#C0863A' }}
                    onClick={() => handleSort('data_entrada')}
                  >
                    <div className="flex items-center gap-1">
                      Data Entrada
                      {sortBy === 'data_entrada' && (
                        sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                      )}
                      {sortBy !== 'data_entrada' && <ArrowUpDown size={14} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((item, index) => (
                  <tr 
                    key={index}
                    className="hover:bg-opacity-5 hover:bg-white transition-colors"
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    <td className="p-3" style={{ color: 'white' }}>{item.descricao}</td>
                    <td className="p-3" style={{ color: 'white' }}>{item.nome}</td>
                    <td className="p-3" style={{ color: 'white', fontFamily: 'monospace' }}>{item.nr_cpf_cnpj}</td>
                    <td className="p-3" style={{ color: 'white', fontFamily: 'monospace' }}>{item.contrato}</td>
                    <td className="p-3 font-semibold" style={{ color: '#10B981' }}>{formatCurrency(item.vl_financ)}</td>
                    <td className="p-3 font-semibold" style={{ color: item.vlr_liberado > 0 ? '#10B981' : '#6B7280' }}>
                      {formatCurrency(item.vlr_liberado)}
                    </td>
                    <td className="p-3 font-semibold" style={{ color: item.taxa > 0 ? '#C0863A' : '#6B7280' }}>
                      {item.taxa > 0 ? formatPercent(item.taxa) : 'N/A'}
                    </td>
                    <td className="p-3 font-semibold" style={{ color: item.taxa_real > 0 ? '#C0863A' : '#6B7280' }}>
                      {item.taxa_real > 0 ? formatPercent(item.taxa_real) : 'N/A'}
                    </td>
                    <td className="p-3 font-semibold" style={{ color: item.taxa_cet > 0 ? '#C0863A' : '#6B7280' }}>
                      {item.taxa_cet > 0 ? formatPercent(item.taxa_cet) : 'N/A'}
                    </td>
                    <td className="p-3" style={{ color: 'white' }}>{item.nome_inst}</td>
                    <td className="p-3">{getStatusBadge(item.status_final)}</td>
                    <td className="p-3" style={{ color: 'white' }}>{formatDate(item.data_entrada)}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.stopPropagation();
                        const contratoId = item.contrato || item.nr_cpf_cnpj || '';
                        if (contratoId) {
                          setSelectedContrato(contratoId);
                          fetchPosicaoPorContrato(contratoId);
                        }
                      }}>
                        <Eye className="mr-2" />
                        Ver posição
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {searchTerm ? 'Nenhum resultado encontrado para a busca' : 'Nenhum dado disponível'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Desembolso;