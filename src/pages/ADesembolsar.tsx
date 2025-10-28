import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { StaggeredContainer } from '@/components/motion/StaggeredContainer';
import { 
  FileText, DollarSign, TrendingUp, Users, AlertCircle, CheckCircle, 
  Download, RotateCcw, ArrowUpDown, Search, Eye, Layers, RefreshCw 
} from 'lucide-react';
import { getApiEndpoint, logApiCall, API_URLS } from '@/lib/api-config';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

interface ADesembolsarData {
  [key: string]: any;
}

interface ADesembolsarStats {
  total_registros: number;
  total_solicitado: number;
  total_liberado: number;
  total_pendente: number;
  percentual_liberacao: number;
  empenhos_liberados: number;
  empenhos_pendentes: number;
  empenhos_parciais: number;
  ticket_medio_solicitado: number;
  ticket_medio_liberado: number;
  taxa_liberacao_empenhos: number;
  carteiras_unicas: number;
  produtos_unicos: number;
  data_atualizacao: string;
  colunas: string[];
}

const KPICard = ({ title, value, subtitle, icon: Icon, color = '#C0863A' }) => { 
  return (
    <Card 
      className="relative border-0 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-105 hover:shadow-3xl" 
      style={{ 
        background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
        border: `1px solid rgba(${color === '#C0863A' ? '192, 134, 58' : '59, 130, 246'}, 0.3)`,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle 
          className="text-sm font-medium tracking-wide"
          style={{ color: `rgba(${color === '#C0863A' ? '192, 134, 58' : '59, 130, 246'}, 0.9)` }}
        >
          {title}
        </CardTitle>
        <div 
          className="p-2 rounded-full transition-all duration-300 group-hover:scale-110"
          style={{ 
            background: `rgba(${color === '#C0863A' ? '192, 134, 58' : '59, 130, 246'}, 0.15)`,
            border: `1px solid rgba(${color === '#C0863A' ? '192, 134, 58' : '59, 130, 246'}, 0.3)` 
          }}
        >
          <Icon 
            className="h-4 w-4 transition-colors duration-300" 
            style={{ color }}
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

    <div className="relative z-10 flex flex-col items-center gap-4">
      <div 
        className="w-16 h-16 border-4 border-gray-700 border-t-yellow-400 rounded-full animate-spin"
      />
      <p style={{ color: 'rgba(192, 134, 58, 0.9)' }} className="text-lg font-medium tracking-wide">
        Carregando dados de empenhos...
      </p>
    </div>
  </div>
);

const ErrorCard = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Card className="border-red-500/20 bg-red-950/10 my-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-400">
        <AlertCircle className="h-5 w-5" />
        Erro ao carregar dados
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-red-300 mb-4">{message}</p>
      <Button 
        onClick={onRetry}
        className="gap-2"
        style={{ 
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
          color: '#FFFFFF'
        }}
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </CardContent>
  </Card>
);

const ADesembolsar: React.FC = () => {
  const [dados, setDados] = useState<ADesembolsarData[]>([]);
  const [produtosAgregados, setProdutosAgregados] = useState<any[]>([]);
  const [stats, setStats] = useState<ADesembolsarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [produtoFiltro, setProdutoFiltro] = useState<string | null>(null);

  const contractsApiUrl = API_URLS.CONTRATOS;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${contractsApiUrl}/api/em/a-desembolsar`;
      console.log('[ADesembolsar] Buscando dados de:', url);
      
      logApiCall(url, 'REQUEST');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('[ADesembolsar] Dados recebidos:', result);
      
      if (result.sucesso) {
        setDados(result.dados || []);
        setProdutosAgregados(result.produtos_agregados || []);
        setStats(result.estatisticas);
        
        // Definir colunas visíveis por padrão (primeiras 10 colunas)
        if (result.dados && result.dados.length > 0) {
          const firstRow = result.dados[0];
          const columns = Object.keys(firstRow).slice(0, 10);
          setVisibleColumns(columns);
        }
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[ADesembolsar] Erro:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const allColumns = useMemo(() => {
    if (dados.length === 0) return [];
    return Object.keys(dados[0]);
  }, [dados]);

  const filteredData = useMemo(() => {
    let result = dados;
    
    // Filtrar por searchTerm
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(value => {
          return String(value).toLowerCase().includes(term);
        });
      });
    }
    
    // Filtrar por produto selecionado no gráfico
    if (produtoFiltro) {
      result = result.filter(item => item.produto === produtoFiltro);
    }
    
    return result;
  }, [dados, searchTerm, produtoFiltro]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null) return 1;
        if (bValue === null) return -1;
        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return sortableData;
  }, [filteredData, sortConfig]);

  const displayData = useMemo(() => {
    return sortedData.slice(0, 100); // Mostrar primeiros 100 registros
  }, [sortedData]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Coluna formatado com nome amigável
  const formatCell = (value: any, columnName: string) => {
    if (value === null || value === undefined) return '-';
    
    // Valores monetários
    if (['vlr_solic', 'vlr_liberado', 'vlr_pl', 'vlr_contrato'].includes(columnName)) {
      const num = parseFloat(value);
      if (isNaN(num)) return String(value).substring(0, 50);
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(num);
    }
    
    // Datas
    if (['dt_da_p1', 'dt_liberacao', 'loaded_at'].includes(columnName) && value) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('pt-BR');
      } catch {
        return String(value).substring(0, 50);
      }
    }
    
    return String(value).substring(0, 50);
  };

  // Função para determinar classe de status baseado no valor liberado
  const getStatusBadge = (row: ADesembolsarData) => {
    const solicitado = parseFloat(row.vlr_solic) || 0;
    const liberado = parseFloat(row.vlr_liberado) || 0;
    
    if (liberado === 0) {
      return { status: 'Pendente', color: '#F59E0B' };
    } else if (liberado >= solicitado) {
      return { status: 'Liberado', color: '#10B981' };
    } else {
      return { status: 'Parcial', color: '#3B82F6' };
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  // Formatar dados de produtos agregados para os gráficos
  const produtosData = useMemo(() => {
    if (!produtosAgregados || produtosAgregados.length === 0) return [];
    
    return produtosAgregados
      .map(p => ({
        produto: p.produto || 'Sem Produto',
        quantidade: p.quantidade,
        valor_solicitado: p.vlr_solic_total,
        valor_liberado: p.vlr_liberado_total
      }))
      .sort((a, b) => b.valor_solicitado - a.valor_solicitado);
  }, [produtosAgregados]);

  // Cores para gráficos
  const COLORS = ['#C0863A', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#EAB308'];

  // Handler para clique no gráfico
  const handleChartClick = (data: any) => {
    setProdutoFiltro(data.produto);
  };

  // Limpar filtro
  const limparFiltro = () => {
    setProdutoFiltro(null);
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(sortedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'A Desembolsar');
      XLSX.writeFile(wb, `a_desembolsar_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div 
      className="min-h-screen p-6 space-y-6" 
      style={{ 
        background: 'linear-gradient(135deg, #031226 0%, #0a1b33 20%, #142b4a 40%, #1a3454 60%, #0a1b33 80%, #031226 100%)'
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 
          className="text-4xl font-bold tracking-tight"
          style={{ color: '#FFFFFF', textShadow: '0 0 20px rgba(192, 134, 58, 0.3)' }}
        >
          Empenhos a Desembolsar
        </h1>
        <p 
          className="text-lg"
          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Gestão de empenhos pendentes de desembolso
        </p>
      </div>

      {error && (
        <ErrorCard 
          message={error}
          onRetry={fetchData}
        />
      )}

      {/* KPIs */}
      {stats && (
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Total Solicitado"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.total_solicitado)}
            subtitle={`${stats.total_registros} empenhos`}
            icon={DollarSign}
            color="#C0863A"
          />
          <KPICard 
            title="Total Liberado"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.total_liberado)}
            subtitle={`${stats.percentual_liberacao.toFixed(1)}% do solicitado`}
            icon={CheckCircle}
            color="#10B981"
          />
          <KPICard 
            title="Pendente"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.total_pendente)}
            subtitle={`${stats.empenhos_pendentes} pendentes`}
            icon={AlertCircle}
            color="#F59E0B"
          />
          <KPICard 
            title="Taxa de Liberação"
            value={`${stats.taxa_liberacao_empenhos.toFixed(1)}%`}
            subtitle={`${stats.empenhos_liberados} liberados / ${stats.empenhos_pendentes} pendentes`}
            icon={TrendingUp}
            color="#3B82F6"
          />
        </StaggeredContainer>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar em todos os campos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20 focus:outline-none transition-all"
          />
        </div>
        
        <Button 
          onClick={exportToExcel}
          className="gap-2 px-6"
          style={{ 
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF'
          }}
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>

        <Button 
          onClick={fetchData}
          className="gap-2 px-6"
          style={{ 
            background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            color: '#FFFFFF'
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>

        {produtoFiltro && (
          <Button 
            onClick={limparFiltro}
            className="gap-2 px-6"
            style={{ 
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF'
            }}
          >
            ✕ Limpar Filtro
          </Button>
        )}
      </div>

      {/* Indicador de Filtro Ativo */}
      {produtoFiltro && (
        <div 
          className="p-4 rounded-lg border border-blue-500/50 bg-blue-500/10"
          style={{ color: '#60A5FA' }}
        >
          <span className="font-semibold">🔍 Filtrado por produto:</span> <Badge className="ml-2 bg-blue-600">{produtoFiltro}</Badge>
          <span className="ml-2 text-sm">Mostrando {filteredData.length} registros</span>
        </div>
      )}

      {/* Gráficos de Produtos */}
      <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Quantidade por Produto */}
        <Card 
          className="border-0" 
          style={{ 
            background: 'rgba(10, 27, 51, 0.5)',
            border: '1px solid rgba(192, 134, 58, 0.2)'
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: '#C0863A' }}>
              📊 Quantidade de Empenhos por Produto
            </CardTitle>
            <CardDescription style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Soma total agrupada por nome de produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosData} onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  handleChartClick(produtosData[state.activeTooltipIndex]);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="produto" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(3, 18, 38, 0.9)',
                    border: '1px solid rgba(192, 134, 58, 0.3)',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }}
                  formatter={(value) => [value, 'Quantidade']}
                />
                <Bar 
                  dataKey="quantidade" 
                  fill="#C0863A" 
                  radius={[8, 8, 0, 0]}
                  onClick={(entry) => handleChartClick(entry.payload)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Valores por Categoria */}
        <Card 
          className="border-0" 
          style={{ 
            background: 'rgba(10, 27, 51, 0.5)',
            border: '1px solid rgba(192, 134, 58, 0.2)'
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: '#C0863A' }}>
              💰 Valor Total por Categoria (R$)
            </CardTitle>
            <CardDescription style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Solicitado vs Liberado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="produto" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(3, 18, 38, 0.9)',
                    border: '1px solid rgba(192, 134, 58, 0.3)',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }}
                  formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value as number)}
                  labelFormatter={(label) => `Produto: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <Bar 
                  dataKey="valor_solicitado" 
                  fill="#F59E0B" 
                  radius={[8, 8, 0, 0]} 
                  name="Solicitado"
                  onClick={(entry) => handleChartClick(entry.payload)}
                  style={{ cursor: 'pointer' }}
                />
                <Bar 
                  dataKey="valor_liberado" 
                  fill="#10B981" 
                  radius={[8, 8, 0, 0]} 
                  name="Liberado"
                  onClick={(entry) => handleChartClick(entry.payload)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </StaggeredContainer>

      {/* Column Visibility Selector */}
      <Card 
        className="border-0" 
        style={{ 
          background: 'rgba(10, 27, 51, 0.5)',
          border: '1px solid rgba(192, 134, 58, 0.2)'
        }}
      >
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: '#C0863A' }}>
            Colunas Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allColumns.map(column => (
              <Badge
                key={column}
                onClick={() => toggleColumn(column)}
                className="cursor-pointer transition-all hover:scale-110"
                style={{
                  background: visibleColumns.includes(column) 
                    ? 'rgba(192, 134, 58, 0.4)' 
                    : 'rgba(100, 100, 100, 0.3)',
                  border: visibleColumns.includes(column)
                    ? '1px solid #C0863A'
                    : '1px solid rgba(100, 100, 100, 0.5)',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                {column}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card 
        className="border-0 overflow-hidden" 
        style={{ 
          background: 'rgba(10, 27, 51, 0.5)',
          border: '1px solid rgba(192, 134, 58, 0.2)'
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: '#C0863A' }}>
            Dados ({displayData.length} de {filteredData.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th 
                  className="px-4 py-3 text-left font-semibold"
                  style={{ color: '#C0863A', minWidth: '80px' }}
                >
                  Status
                </th>
                {visibleColumns.map(column => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-800/50 transition-colors"
                    style={{ color: '#C0863A', minWidth: '120px' }}
                  >
                    <div className="flex items-center gap-2">
                      {column}
                      {sortConfig.key === column && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.length > 0 ? (
                displayData.map((row, idx) => {
                  const statusBadge = getStatusBadge(row);
                  return (
                    <tr 
                      key={idx}
                      className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Badge
                          style={{
                            background: `${statusBadge.color}33`,
                            border: `1px solid ${statusBadge.color}`,
                            color: statusBadge.color,
                            cursor: 'default',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          {statusBadge.status}
                        </Badge>
                      </td>
                      {visibleColumns.map(column => (
                        <td 
                          key={`${idx}-${column}`}
                          className="px-4 py-3"
                          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                        >
                          {formatCell(row[column], column)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td 
                    colSpan={visibleColumns.length + 1}
                    className="px-4 py-8 text-center"
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Info Footer */}
      <Card 
        className="border-0" 
        style={{ 
          background: 'rgba(10, 27, 51, 0.5)',
          border: '1px solid rgba(192, 134, 58, 0.2)'
        }}
      >
        <CardContent className="pt-6">
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats && (
              <>
                <div className="space-y-2">
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    💰 <strong>Ticket Médio Solicitado:</strong>
                  </p>
                  <p style={{ color: '#C0863A', fontSize: '14px', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(stats.ticket_medio_solicitado)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    ✅ <strong>Ticket Médio Liberado:</strong>
                  </p>
                  <p style={{ color: '#10B981', fontSize: '14px', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(stats.ticket_medio_liberado)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    📊 <strong>Carteiras / Produtos:</strong>
                  </p>
                  <p style={{ color: '#3B82F6', fontSize: '14px', fontWeight: 600 }}>
                    {stats.carteiras_unicas} carteiras • {stats.produtos_unicos} produtos
                  </p>
                </div>

                <div className="space-y-2">
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    🎯 <strong>Status dos Empenhos:</strong>
                  </p>
                  <p style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 600 }}>
                    {stats.empenhos_liberados} liberados • {stats.empenhos_parciais} parciais • {stats.empenhos_pendentes} pendentes
                  </p>
                </div>

                <div className="space-y-2">
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    📅 <strong>Última Atualização:</strong>
                  </p>
                  <p style={{ color: '#C0863A', fontSize: '12px' }}>
                    {new Date(stats.data_atualizacao).toLocaleDateString('pt-BR')} às {new Date(stats.data_atualizacao).toLocaleTimeString('pt-BR')}
                  </p>
                </div>

                <div className="space-y-2">
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    🔍 <strong>Busca:</strong>
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px' }}>
                    {searchTerm || 'Nenhuma busca ativa'}
                  </p>
                </div>
              </>
            )}
          </StaggeredContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ADesembolsar;
