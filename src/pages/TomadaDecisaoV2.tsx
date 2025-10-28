import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePageXP } from '@/components/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_URLS } from '@/lib/api-config';
import * as XLSX from 'xlsx';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Users,
  MapPin,
  Building,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Eye,
  Zap,
  Package,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Activity,
  Gauge,
  Brain,
  Shield,
  Maximize2,
  Minimize2,
  LineChart,
  Calendar,
  Clock,
  TrendingUpIcon,
  TriangleAlert,
  CheckCircle2,
  AlertCircle,
  Info,
  Flame,
  Cpu,
  Layers,
  Grid,
  List
} from 'lucide-react';
import { StaggeredContainer } from '@/components/motion/StaggeredContainer';

// ============ TIPOS E INTERFACES ============

interface ResumoExecutivo {
  total_operacoes: number;
  volume_total: number;
  ticket_medio_geral: number;
  produtos_ativos: number;
  regioes_ativas: number;
  instituicoes_ativas: number;
}

interface AnaliseProduto {
  produto: string;
  operacoes: number;
  valor_liberado: number;
  valor_solicitado: number;
  clientes_unicos: number;
  ticket_medio: number;
  eficiencia: number;
  participacao: number;
}

interface AnaliseGeografica {
  cidade: string;
  uf: string;
  operacoes: number;
  valor_total: number;
  diversificacao: number;
  produtos: string[];
  ticket_medio: number;
}

interface AnaliseInstituicao {
  instituicao: string;
  operacoes: number;
  volume: number;
  portfolio: number;
  produtos: string[];
  volume_medio: number;
}

interface MatrizBCG {
  produto: string;
  crescimento: number;
  participacao: number;
  categoria_bcg: string;
  valor_liberado: number;
  recomendacao_estrategica: string;
}

interface InsightRevolucionario {
  tipo: string;
  titulo: string;
  mes_critico?: string;
  concentracao?: string;
  quantidade?: number;
  melhor_produto?: string;
  eficiencia_maxima?: string;
  percentual?: string;
  valor_medio?: number;
  insight?: string;
  acao_recomendada?: string;
  oportunidade?: string;
}

interface AlertaCritico {
  tipo: string;
  titulo: string;
  descricao: string;
  urgencia: string;
  acao: string;
}

interface AnaliseComportamental {
  score_fidelidade: number;
  total_clientes: number;
  perfil_risco: {
    [key: string]: {
      quantidade: number;
      valor_medio: number;
    };
  };
}

interface ConcentracaoRisco {
  por_cliente: {
    percentual_top_10: number;
    valor_medio_top_10: number;
    nivel_risco: string;
  };
  por_produto: {
    percentual_top_3: number;
    produto_principal: string;
    nivel_risco: string;
  };
}

interface OportunidadeCrossSell {
  produto: string;
  clientes_potenciais: number;
  receita_potencial: number;
}

interface AnaliseTemporalItem {
  periodo: string;
  mes: number;
  ano: number;
  operacoes: number;
  volume: number;
  crescimento_mensal: number;
}

interface TendenciaMercado {
  categoria: string;
  velocidade_crescimento: number;
  tendencia: string;
  previsao_proximo_mes: number;
  confianca_previsao: number;
}

interface ScoringOportunidade {
  produto: string;
  score_final: string;
  categoria_investimento: string;
  componentes_score: {
    volume: string;
    crescimento: string;
    diversificacao: string;
    eficiencia: string;
    potencial: string;
  };
  tendencia_mercado: string;
  previsao_proximo_mes: number;
  acao_recomendada: string;
}

interface AnaliseTendencias {
  timeline_completa: AnaliseTemporalItem[];
  tendencias_por_categoria: TendenciaMercado[];
  crescimento_medio_mercado: number;
  previsao_receita_total: number;
  categorias_em_alta: TendenciaMercado[];
  categorias_em_queda: TendenciaMercado[];
}

interface TomadaDecisaoData {
  resumo_executivo: ResumoExecutivo;
  analise_produtos: AnaliseProduto[];
  analise_geografica: AnaliseGeografica[];
  analise_instituicoes: AnaliseInstituicao[];
  insights_revolucionarios: InsightRevolucionario[];
  matriz_bcg_produtos: MatrizBCG[];
  previsoes_inteligentes: {
    potencial_receita_adicional: number;
    produtos_com_maior_potencial: AnaliseProduto[];
    clientes_em_risco_churn: number;
    score_saude_portfolio: number;
  };
  alertas_criticos: AlertaCritico[];
  analise_comportamental: AnaliseComportamental;
  concentracao_risco: ConcentracaoRisco;
  oportunidades_crosssell: OportunidadeCrossSell[];
  analise_tendencias: AnaliseTendencias;
  scoring_oportunidades: ScoringOportunidade[];
}

// ============ TEMA E CORES ============

const THEME = {
  primary: '#06162B',
  primaryLight: '#0a1f3a',
  secondary: '#C48A3F',
  secondaryLight: '#d4984a',
  accent: '#1a2332',
  background: '#0a1729',
  cardBg: '#0f1a2e',
  border: '#1a2b47',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

// ============ COMPONENTES AUXILIARES ============

interface MetricaKPIProps {
  titulo: string;
  valor: string;
  icon: React.ReactNode;
  subtitulo?: string;
  gradient: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

const MetricaKPI: React.FC<MetricaKPIProps> = ({
  titulo,
  valor,
  icon,
  subtitulo,
  gradient,
  trend,
  trendValue
}) => (
  <Card
    className="relative overflow-hidden transform transition-all hover:scale-105"
    style={{
      background: gradient,
      border: `1px solid ${THEME.secondary}40`,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
    }}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div style={{ color: THEME.secondary }}>{icon}</div>
            <p className="text-sm font-medium" style={{ color: THEME.textMuted }}>{titulo}</p>
          </div>
          <div className="text-2xl font-bold" style={{ color: THEME.text }}>{valor}</div>
          {subtitulo && (
            <p className="text-xs mt-1" style={{ color: THEME.textMuted }}>{subtitulo}</p>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend === 'up' && <ArrowUp className="h-5 w-5" style={{ color: THEME.success }} />}
            {trend === 'down' && <ArrowDown className="h-5 w-5" style={{ color: THEME.danger }} />}
            {trend === 'stable' && <ArrowUp className="h-5 w-5" style={{ color: THEME.warning }} />}
            {trendValue && (
              <span style={{
                color: trend === 'up' ? THEME.success : trend === 'down' ? THEME.danger : THEME.warning
              }}>
                {Math.abs(trendValue)}%
              </span>
            )}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

interface ProdutoCardProps {
  produto: AnaliseProduto;
  indice: number;
  expandido?: boolean;
  onToggle?: () => void;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, indice, expandido, onToggle }) => {
  const percentualParticipacao = Math.min(produto.participacao * 8, 100);

  return (
    <Card
      className="overflow-hidden transform transition-all hover:shadow-lg cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #1E293B 100%)',
        border: `1px solid ${THEME.secondary}40`,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }}
      onClick={onToggle}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span style={{ color: THEME.secondary }} className="text-lg">
              {indice === 1 ? '🥇' : indice === 2 ? '🥈' : indice === 3 ? '🥉' : `${indice}º`}
            </span>
            <span style={{ color: THEME.text }}>{produto.produto}</span>
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-green-950 text-green-300 border-green-500/50"
          >
            {produto.participacao.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Grid de Métricas */}
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div style={{ color: THEME.textMuted }}>Operações</StaggeredContainer>
            <div style={{ color: THEME.text }} className="font-semibold">
              {produto.operacoes.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <div style={{ color: THEME.textMuted }}>Clientes</div>
            <div style={{ color: THEME.text }} className="font-semibold">
              {produto.clientes_unicos.toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            <div style={{ color: THEME.textMuted }}>Volume</div>
            <div style={{ color: THEME.success }} className="font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valor_liberado)}
            </div>
          </div>
          <div>
            <div style={{ color: THEME.textMuted }}>Ticket</div>
            <div style={{ color: THEME.info }} className="font-semibold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.ticket_medio)}
            </div>
          </div>
        </div>

        {/* Eficiência */}
        <div className="flex items-center justify-between pt-2">
          <span style={{ color: THEME.textMuted }} className="text-sm">Eficiência</span>
          <div className="flex items-center gap-2">
            {produto.eficiencia >= 100 ? (
              <ArrowUp className="h-4 w-4" style={{ color: THEME.success }} />
            ) : (
              <ArrowDown className="h-4 w-4" style={{ color: THEME.danger }} />
            )}
            <span
              className="font-bold"
              style={{
                color: produto.eficiencia >= 100 ? THEME.success : THEME.danger
              }}
              title={`Eficiência = (Valor Convertido / Valor Ofertado) × 100. Acima de 100% indica excelente performance. Abaixo de 100% pode indicar rejeição de propostas ou ciclos mais longos.`}
            >
              {produto.eficiencia.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-3">
          <div
            className="w-full bg-gray-700 rounded-full h-2"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${percentualParticipacao}%`,
                background: `linear-gradient(90deg, ${THEME.secondary}, ${THEME.secondaryLight})`
              }}
            ></div>
          </div>
        </div>

        {/* Detalhes Expandidos */}
        {expandido && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: THEME.border }}>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span style={{ color: THEME.textMuted }}>Valor Solicitado:</span>
                <span style={{ color: THEME.text }} className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valor_solicitado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: THEME.textMuted }}>Taxa de Conversão:</span>
                <span style={{ color: THEME.success }} className="font-semibold">
                  {((produto.valor_liberado / produto.valor_solicitado) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: THEME.textMuted }}>Ticket Médio:</span>
                <span style={{ color: THEME.info }} className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.ticket_medio)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ COMPONENTE PRINCIPAL ============

const TomadaDecisaoAnalytical: React.FC = () => {
  // Gamification
  usePageXP('page_visit');
  
  const [data, setData] = useState<TomadaDecisaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterRisco, setFilterRisco] = useState<'all' | 'alto' | 'medio' | 'baixo'>('all');
  const [filteredProducts, setFilteredProducts] = useState<AnaliseProduto[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['bcg', 'produtos', 'riscos', 'insights', 'crosssell']) // Tópicos abertos por padrão
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Buscar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URLS.CONTRATOS}/api/contratos/tomada-decisao`);

      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const result = await response.json();
      setData(result);
      setError(null);
      setToastMessage('✅ Dados carregados com sucesso');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message || 'Erro desconhecido');
      setToastMessage('❌ Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar produtos
  useEffect(() => {
    if (!data) return;

    let filtered = [...data.analise_produtos];

    if (filterRisco !== 'all') {
      const matrizBcg = data.matriz_bcg_produtos;
      filtered = filtered.filter(p => {
        const bcg = matrizBcg.find(b => b.produto === p.produto);
        if (!bcg) return true;

        switch (filterRisco) {
          case 'alto':
            return bcg.categoria_bcg === 'REVISAR';
          case 'medio':
            return bcg.categoria_bcg === 'SOLIDO';
          case 'baixo':
            return ['ESTRELA', 'OPORTUNIDADE'].includes(bcg.categoria_bcg);
          default:
            return true;
        }
      });
    }

    setFilteredProducts(filtered);
  }, [data, filterRisco]);

  // Funções auxiliares
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatNumber = (value: number): string =>
    new Intl.NumberFormat('pt-BR').format(value);

  const formatPercentage = (value: number): string =>
    `${value.toFixed(1)}%`;

  const toggleProductExpand = (index: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const exportToExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Resumo Executivo
    const resumoData = [
      ['RESUMO EXECUTIVO'],
      ['Métrica', 'Valor'],
      ['Total de Operações', data.resumo_executivo.total_operacoes],
      ['Volume Total', data.resumo_executivo.volume_total],
      ['Ticket Médio', data.resumo_executivo.ticket_medio_geral],
      ['Produtos Ativos', data.resumo_executivo.produtos_ativos],
      ['Regiões Ativas', data.resumo_executivo.regioes_ativas],
      ['Instituições Ativas', data.resumo_executivo.instituicoes_ativas],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo Executivo');

    // Sheet 2: Análise de Produtos
    const produtosData = [
      ['ANÁLISE DE PRODUTOS'],
      ['Posição', 'Produto', 'Operações', 'Valor Liberado', 'Clientes', 'Ticket Médio', 'Eficiência', 'Participação'],
      ...data.analise_produtos.map((p, i) => [
        i + 1,
        p.produto,
        p.operacoes,
        p.valor_liberado,
        p.clientes_unicos,
        p.ticket_medio,
        p.eficiencia,
        p.participacao
      ])
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(produtosData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Produtos');

    // Sheet 3: Alertas Críticos
    const alertasData = [
      ['ALERTAS CRÍTICOS'],
      ['Título', 'Descrição', 'Urgência', 'Ação'],
      ...data.alertas_criticos.map(a => [a.titulo, a.descricao, a.urgencia, a.acao])
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(alertasData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Alertas');

    // Baixar arquivo
    XLSX.writeFile(wb, `Tomada-Decisao-${new Date().toLocaleDateString('pt-BR')}.xlsx`);
    setToastMessage('📊 Arquivo exportado com sucesso');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.primaryLight} 100%)`
        }}
      >
        <div className="text-center space-y-4">
          <Cpu className="h-16 w-16 mx-auto animate-spin" style={{ color: THEME.secondary }} />
          <p style={{ color: THEME.secondary }} className="text-xl font-semibold">
            Carregando análise avançada...
          </p>
          <p style={{ color: THEME.textMuted }}>Por favor, aguarde enquanto processamos os dados</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen p-6"
        style={{
          background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.primaryLight} 100%)`
        }}
      >
        <Card
          className="max-w-md mx-auto mt-20"
          style={{
            borderColor: THEME.secondary + '80',
            backgroundColor: THEME.cardBg
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Erro ao Carregar</span>
            </div>
            <p style={{ color: THEME.text }} className="mb-4">
              {error}
            </p>
            <Button
              onClick={fetchData}
              variant="outline"
              className="w-full"
              style={{
                borderColor: THEME.secondary,
                color: THEME.secondary
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.primaryLight} 100%)`
      }}
    >
      {/* Toast Notification - Centralizado */}
      {toastMessage && (
        <div
          className="fixed top-6 inset-x-0 mx-auto z-50 animate-pulse"
          style={{
            width: '90%',
            maxWidth: '500px'
          }}
        >
          <div
            className="p-4 rounded-lg shadow-2xl"
            style={{
              background: THEME.cardBg,
              border: `2px solid ${THEME.secondary}`,
              color: THEME.secondary,
              textAlign: 'center',
              boxShadow: `0 0 30px ${THEME.secondary}40`
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============ HEADER ============ */}
      <div className="mb-8 text-center">
        <h1
          className="text-5xl font-bold mb-4"
          style={{
            color: THEME.secondary,
            textShadow: `0 0 30px ${THEME.secondary}40`
          }}
        >
          📊 Tomada de Decisão Estratégica
        </h1>
        <p className="text-xl max-w-4xl mx-auto" style={{ color: THEME.text }}>
          Dashboard Analítico Avançado com Insights de IA para Decisões Estratégicas Baseadas em Dados
        </p>

        {/* Controles */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          <Button
            onClick={fetchData}
            variant="outline"
            className="gap-2"
            style={{ borderColor: THEME.secondary, color: THEME.secondary }}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="gap-2"
            style={{ borderColor: THEME.secondary, color: THEME.secondary }}
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              style={
                viewMode === 'grid'
                  ? { background: THEME.secondary }
                  : { borderColor: THEME.secondary, color: THEME.secondary }
              }
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              style={
                viewMode === 'list'
                  ? { background: THEME.secondary }
                  : { borderColor: THEME.secondary, color: THEME.secondary }
              }
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ============ SEÇÃO: LEGENDAS E EXPLICAÇÕES ============ */}
      <div className="mb-8 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-6 rounded-lg border border-blue-500/30">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: THEME.secondary }}>
          <Info className="h-5 w-5" />
          📋 Como Ler Este Dashboard
        </h3>
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: THEME.secondary }}>🎯 KPIs Principais</p>
            <p style={{ color: THEME.text }}>Métricas-chave de desempenho do negócio. Baseadas em dados consolidados dos últimos 30 dias com análise de tendência.</p>
          </StaggeredContainer>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: THEME.secondary }}>🚨 Alertas Críticos</p>
            <p style={{ color: THEME.text }}>Situações que requerem atenção imediata. Geradas por regras inteligentes que monitoram risco, performance e concentração.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: THEME.secondary }}>📊 Matriz BCG</p>
            <p style={{ color: THEME.text }}>Posiciona produtos em 4 estratégias: Estrelas (crescer), Sólidos (manter), Oportunidades (analisar), Revisar (desinvestir).</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: THEME.secondary }}>🏆 Top 10 Produtos</p>
            <p style={{ color: THEME.text }}>Ranking dos produtos mais rentáveis e com melhor performance. Inclui volume, ticket médio e taxa de conversão.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-yellow-400">⚡ O que é Eficiência?</p>
            <p style={{ color: THEME.text }}>
              <strong>Fórmula:</strong> (Valor Convertido / Valor Ofertado) × 100
              <br/>
              <strong>→ &gt;100%:</strong> Excelente! Produto converte mais que o esperado
              <br/>
              <strong>→ &lt;100%:</strong> Rejeição de clientes ou ciclo de venda mais longo. Investigar causas.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: THEME.secondary }}>⚠️ Análise de Riscos</p>
            <p style={{ color: THEME.text }}>Avalia fidelidade de clientes, concentração por cliente (TOP 10) e concentração por produto (TOP 3).</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: THEME.secondary }}>🧠 Insights IA</p>
            <p style={{ color: THEME.text }}>Recomendações baseadas em machine learning, análise de sazonalidade e oportunidades de otimização.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold" style={{ color: THEME.secondary }}>💰 Cross-Sell</p>
            <p style={{ color: THEME.text }}>Identificação de clientes com potencial de venda adicional, baseado em comportamento e perfil de compra.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-yellow-400">📈 Tendências</p>
            <p style={{ color: THEME.text }}>↑ Verde = crescimento positivo | ↓ Vermelho = queda | —— Amarelo = estável</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-orange-400">🔄 Atualização</p>
            <p style={{ color: THEME.text }}>Dados atualizados em tempo real. Clique em "Atualizar" para forçar sincronização com o backend.</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2
          className="text-3xl font-bold mb-6 text-center"
          style={{ color: THEME.secondary }}
        >
          🎯 Indicadores de Desempenho Críticos
        </h2>
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricaKPI
            titulo="Total de Operações"
            valor={formatNumber(data.resumo_executivo.total_operacoes)}
            icon={<BarChart3 className="h-5 w-5" />}
            subtitulo="Transações executadas"
            gradient={`linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.primaryLight} 100%)`}
            trend="up"
            trendValue={8.5}
          />
          <MetricaKPI
            titulo="Volume Financeiro"
            valor={formatCurrency(data.resumo_executivo.volume_total)}
            icon={<DollarSign className="h-5 w-5" />}
            subtitulo="Capital movimentado"
            gradient={`linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.secondaryLight} 100%)`}
            trend="up"
            trendValue={12.3}
          />
          <MetricaKPI
            titulo="Ticket Médio"
            valor={formatCurrency(data.resumo_executivo.ticket_medio_geral)}
            icon={<Target className="h-5 w-5" />}
            subtitulo="Valor por operação"
            gradient={`linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.primaryLight} 100%)`}
            trend="stable"
            trendValue={2.1}
          />
          <MetricaKPI
            titulo="Produtos Ativos"
            valor={data.resumo_executivo.produtos_ativos.toString()}
            icon={<Package className="h-5 w-5" />}
            subtitulo="Linhas de negócio"
            gradient={`linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 100%)`}
          />
          <MetricaKPI
            titulo="Instituições"
            valor={data.resumo_executivo.instituicoes_ativas.toString()}
            icon={<Building className="h-5 w-5" />}
            subtitulo="Parceiros ativos"
            gradient={`linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.secondaryLight} 100%)`}
          />
        </StaggeredContainer>
      </div>

      {/* ============ SEÇÃO: ALERTAS CRÍTICOS ============ */}
      {data.alertas_criticos && data.alertas_criticos.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-3"
            style={{ color: THEME.danger }}
          >
            🚨 Alertas Críticos Detectados
          </h2>
          <div className="flex justify-center">
            <div className="w-full max-w-4xl grid grid-cols-1 gap-6">
              {data.alertas_criticos.map((alerta, index) => (
                <Card
                  key={index}
                  className="p-6 animate-pulse border-2"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 50%, ${THEME.primary} 100%)`,
                    borderColor: THEME.danger,
                    boxShadow: `0 8px 25px ${THEME.danger}40`
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className="text-xl font-bold flex items-center gap-3"
                      style={{ color: THEME.danger }}
                    >
                      <AlertTriangle className="h-6 w-6" />
                      {alerta.titulo}
                      <Badge
                        style={{
                          backgroundColor: THEME.danger + '20',
                          color: THEME.danger,
                          border: `1px solid ${THEME.danger}60`
                        }}
                      >
                        {alerta.urgencia}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p style={{ color: THEME.text }} className="text-base">
                      {alerta.descricao}
                    </p>
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: THEME.danger + '20',
                        borderColor: THEME.danger + '60'
                      }}
                    >
                      <p style={{ color: THEME.secondary }} className="font-semibold text-sm">
                        🎯 Ação Recomendada: {alerta.acao}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ SEÇÃO: MATRIZ BCG ============ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-3xl font-bold"
            style={{ color: THEME.secondary }}
          >
            📊 Matriz BCG - Estratégia de Produtos
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('bcg')}
            style={{ color: THEME.secondary }}
          >
            {expandedSections.has('bcg') ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {expandedSections.has('bcg') && (
          <>
            {/* Quadrantes Explicativos */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  title: '⭐ ESTRELAS',
                  desc: 'Alto crescimento + Alta participação',
                  strategy: 'EXPANDIR AGRESSIVAMENTE',
                  color: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)'
                },
                {
                  title: '📦 SÓLIDOS',
                  desc: 'Baixo crescimento + Alta participação',
                  strategy: 'MANTER ESTABILIDADE',
                  color: `linear-gradient(135deg, ${THEME.success} 0%, #047857 100%)`
                },
                {
                  title: '🚀 OPORTUNIDADES',
                  desc: 'Alto crescimento + Baixa participação',
                  strategy: 'EXPLORAR POTENCIAL',
                  color: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                },
                {
                  title: '⚠️ REVISAR',
                  desc: 'Baixo crescimento + Baixa participação',
                  strategy: 'REAVALIAR ESTRATÉGIA',
                  color: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                }
              ].map((quad, idx) => (
                <Card
                  key={idx}
                  className="p-4"
                  style={{
                    background: quad.color,
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-white">
                      {quad.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-white/90 mb-1">{quad.desc}</p>
                    <p className="text-xs font-semibold text-white/80">→ {quad.strategy}</p>
                  </CardContent>
                </Card>
              ))}
            </StaggeredContainer>

            {/* Produtos na Matriz */}
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.matriz_bcg_produtos.slice(0, 10).map((produto, index) => {
                const getBCGColor = (categoria: string) => {
                  switch (categoria) {
                    case 'ESTRELA':
                      return {
                        bg: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
                        text: 'text-amber-900',
                        icon: '⭐'
                      };
                    case 'SOLIDO':
                      return {
                        bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        text: 'text-green-100',
                        icon: '📦'
                      };
                    case 'OPORTUNIDADE':
                      return {
                        bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        text: 'text-blue-100',
                        icon: '🚀'
                      };
                    case 'REVISAR':
                      return {
                        bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        text: 'text-red-100',
                        icon: '⚠️'
                      };
                    default:
                      return {
                        bg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                        text: 'text-gray-100',
                        icon: '❓'
                      };
                  }
                };

                const bcgStyle = getBCGColor(produto.categoria_bcg);

                return (
                  <Card
                    key={index}
                    className="p-4"
                    style={{
                      background: bcgStyle.bg,
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle
                        className={`text-sm font-bold flex items-center justify-between ${bcgStyle.text}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{bcgStyle.icon}</span>
                          <span className="text-xs">#{index + 1}</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-black/20 text-white border-white/30"
                        >
                          {produto.categoria_bcg.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className={`font-semibold text-sm ${bcgStyle.text}`}>
                        {produto.produto}
                      </StaggeredContainer>
                      <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-2 gap-2 text-xs">
                        <div className={bcgStyle.text}>
                          <div>Crescimento</StaggeredContainer>
                          <div className="font-bold">{produto.crescimento.toFixed(1)}%</div>
                        </div>
                        <div className={bcgStyle.text}>
                          <div>Participação</div>
                          <div className="font-bold">{produto.participacao.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div
                        className={`text-xs font-semibold mt-2 p-2 rounded ${bcgStyle.text} bg-black/20`}
                      >
                        💡 {produto.recomendacao_estrategica}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ============ SEÇÃO: TOP 10 PRODUTOS ============ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-3xl font-bold"
            style={{ color: THEME.secondary }}
          >
            🏆 Top 10 Produtos por Performance
          </h2>
          <div className="flex gap-2 items-center">
            <select
              value={filterRisco}
              onChange={(e) => setFilterRisco(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: THEME.cardBg,
                border: `1px solid ${THEME.border}`,
                color: THEME.text
              }}
            >
              <option value="all">Todos os Produtos</option>
              <option value="baixo">Baixo Risco</option>
              <option value="medio">Médio Risco</option>
              <option value="alto">Alto Risco</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('produtos')}
              style={{ color: THEME.secondary }}
            >
              {expandedSections.has('produtos') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {expandedSections.has('produtos') && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
                : 'space-y-4'
            }
          >
            {filteredProducts.slice(0, 10).map((produto, index) => (
              <ProdutoCard
                key={index}
                produto={produto}
                indice={index + 1}
                expandido={expandedProducts.has(index)}
                onToggle={() => toggleProductExpand(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============ SEÇÃO: ANÁLISE DE RISCOS ============ */}
      {data.analise_comportamental && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-3xl font-bold"
              style={{ color: THEME.secondary }}
            >
              🎯 Análise de Riscos e Concentração
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('riscos')}
              style={{ color: THEME.secondary }}
            >
              {expandedSections.has('riscos') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>

          {expandedSections.has('riscos') && (
            <div className="flex justify-center">
              <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score de Fidelidade */}
                <Card
                className="p-6"
                style={{
                  background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #1E40AF 100%)',
                  border: '2px solid #3B82F6',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-blue-200 text-center">
                    🎖️ Fidelidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-5xl font-bold text-white">
                    {data.analise_comportamental.score_fidelidade.toFixed(0)}
                    <span className="text-lg text-blue-200">/100</span>
                  </div>
                  <div className="w-full bg-blue-800 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-200 transition-all duration-1000"
                      style={{
                        width: `${data.analise_comportamental.score_fidelidade}%`
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* Concentração por Cliente */}
              <Card
                className="p-6"
                style={{
                  background: 'linear-gradient(135deg, #831843 0%, #BE185D 50%, #831843 100%)',
                  border: '1px solid rgba(219, 39, 119, 0.3)',
                  boxShadow: '0 6px 20px rgba(190, 24, 93, 0.2)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-200">
                    <Users className="h-6 w-6" />
                    Por Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-white text-center">
                    {data.concentracao_risco.por_cliente.percentual_top_10.toFixed(1)}%
                  </div>
                  <p className="text-pink-200 text-center text-sm">
                    concentrados nos TOP 10
                  </p>
                  <Badge
                    className={`w-full text-center justify-center ${
                      data.concentracao_risco.por_cliente.nivel_risco === 'ALTO'
                        ? 'bg-red-800 text-red-100 border-red-600'
                        : data.concentracao_risco.por_cliente.nivel_risco === 'MÉDIO'
                        ? 'bg-yellow-800 text-yellow-100 border-yellow-600'
                        : 'bg-green-800 text-green-100 border-green-600'
                    }`}
                  >
                    {data.concentracao_risco.por_cliente.nivel_risco}
                  </Badge>
                </CardContent>
              </Card>

              {/* Concentração por Produto */}
              <Card
                className="p-6"
                style={{
                  background: 'linear-gradient(135deg, #831843 0%, #BE185D 50%, #831843 100%)',
                  border: '1px solid rgba(219, 39, 119, 0.3)',
                  boxShadow: '0 6px 20px rgba(190, 24, 93, 0.2)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-200">
                    <Package className="h-6 w-6" />
                    Por Produto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-white text-center">
                    {data.concentracao_risco.por_produto.percentual_top_3.toFixed(1)}%
                  </div>
                  <p className="text-pink-200 text-center text-sm">
                    concentrados nos TOP 3
                  </p>
                  <Badge
                    className={`w-full text-center justify-center ${
                      data.concentracao_risco.por_produto.nivel_risco === 'ALTO'
                        ? 'bg-red-800 text-red-100 border-red-600'
                        : data.concentracao_risco.por_produto.nivel_risco === 'MÉDIO'
                        ? 'bg-yellow-800 text-yellow-100 border-yellow-600'
                        : 'bg-green-800 text-green-100 border-green-600'
                    }`}
                  >
                    {data.concentracao_risco.por_produto.nivel_risco}
                  </Badge>
                </CardContent>
              </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ SEÇÃO: INSIGHTS IA ============ */}
      {data.insights_revolucionarios && data.insights_revolucionarios.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-3xl font-bold"
              style={{ color: THEME.secondary }}
            >
              🧠 Insights Revolucionários de IA
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('insights')}
              style={{ color: THEME.secondary }}
            >
              {expandedSections.has('insights') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>

          {expandedSections.has('insights') && (
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.insights_revolucionarios.map((insight, index) => (
                <Card
                  key={index}
                  className="p-6"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 50%, ${THEME.primary} 100%)`,
                    border: `1px solid ${THEME.secondary}`,
                    boxShadow: `0 8px 25px ${THEME.secondary}30`
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className="text-xl font-bold flex items-center gap-2"
                      style={{ color: THEME.secondary }}
                    >
                      <Zap className="h-6 w-6" />
                      {insight.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insight.mes_critico && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.secondary + '20' }}>
                        <p style={{ color: THEME.text }}>
                          <strong>Mês Crítico:</strong> {insight.mes_critico}
                          <span style={{ color: THEME.textMuted }} className="ml-2">
                            ({insight.concentracao} do volume)
                          </span>
                        </p>
                      </StaggeredContainer>
                    )}

                    {insight.quantidade && (
                      <div className="flex justify-between items-center">
                        <span style={{ color: THEME.textMuted }}>Produtos Detectados:</span>
                        <span className="font-bold text-xl" style={{ color: THEME.text }}>
                          {insight.quantidade}
                        </span>
                      </div>
                    )}

                    {insight.acao_recomendada && (
                      <div
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: THEME.secondary + '20',
                          borderColor: THEME.secondary + '60'
                        }}
                      >
                        <p className="font-semibold" style={{ color: THEME.secondary }}>
                          🎯 Ação: {insight.acao_recomendada}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ SEÇÃO: OPORTUNIDADES CROSS-SELL ============ */}
      {data.oportunidades_crosssell && data.oportunidades_crosssell.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-3xl font-bold"
              style={{ color: THEME.secondary }}
            >
              🚀 Oportunidades de Cross-Sell
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('crosssell')}
              style={{ color: THEME.secondary }}
            >
              {expandedSections.has('crosssell') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>

          {expandedSections.has('crosssell') && (
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.oportunidades_crosssell.map((opp, index) => (
                <Card
                  key={index}
                  className="p-6 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #0369A1 100%)',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    boxShadow: '0 6px 20px rgba(3, 105, 161, 0.2)'
                  }}
                >
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-sky-800/80 text-sky-100 border-sky-600 text-lg px-3 py-1">
                      #{index + 1}
                    </Badge>
                  </StaggeredContainer>

                  <CardContent className="space-y-4 pt-2">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2">
                        {opp.clientes_potenciais}
                      </div>
                      <div className="text-sky-200 text-sm">clientes potenciais</div>
                    </div>

                    <div className="bg-sky-900/30 p-3 rounded-lg border border-sky-700/50">
                      <p className="font-semibold text-sky-200 text-sm">🎯 Produto Alvo:</p>
                      <p className="text-white text-xs font-medium mt-1">{opp.produto}</p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <span className="text-sky-300 text-sm">💰 Receita Potencial:</span>
                      <div className="text-sky-100 font-bold text-lg text-center bg-sky-900/50 p-2 rounded">
                        {formatCurrency(opp.receita_potencial)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ RODAPÉ ============ */}
      <div className="text-center mt-12 pt-6 border-t" style={{ borderColor: THEME.border }}>
        <p style={{ color: THEME.textMuted }} className="text-sm">
          Dashboard atualizado automaticamente • Última consulta: {new Date().toLocaleString('pt-BR')}
        </p>
        <p style={{ color: THEME.textMuted }} className="text-xs mt-2">
          Todos os dados processados com algoritmos avançados de IA e análise preditiva
        </p>
      </div>
    </div>
  );
};

export default TomadaDecisaoAnalytical;
