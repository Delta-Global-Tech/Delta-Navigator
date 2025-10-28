import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_URLS } from '@/lib/api-config';
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
  TrendingUpIcon,
  Activity,
  Gauge,
  Brain,
  Zap as Lightning,
  Shield,
  Maximize2,
  Minimize2
} from 'lucide-react';

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

interface Insight {
  tipo: string;
  titulo: string;
  valor: string;
  metrica: string;
  descricao: string;
}

interface Oportunidade {
  tipo: string;
  titulo: string;
  regiao?: string;
  atual?: string;
  potencial: string;
}

interface ClienteEstrategico {
  cliente: string;
  valor_total_historico: number;
  fidelidade_score: number;
  diversificacao_produtos: number;
  perfil_risco: string;
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
  insights: Insight[];
  oportunidades: Oportunidade[];
  analise_tendencias: AnaliseTendencias;
  scoring_oportunidades: ScoringOportunidade[];
  inteligencia_comportamental: {
    clientes_estrategicos: ClienteEstrategico[];
    clientes_potencial_premium: ClienteEstrategico[];
    oportunidades_cross_sell: number;
  };
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
}

const TomadaDecisao: React.FC = () => {
  const [data, setData] = useState<TomadaDecisaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cores do tema: Azul Escuro (#06162B) e Dourado (#C48A3F)
  const themeColors = {
    primary: '#06162B', // Azul muito escuro
    primaryLight: '#0a1f3a', // Azul escuro mais claro
    secondary: '#C48A3F', // Dourado
    secondaryLight: '#d4984a', // Dourado mais claro
    accent: '#1a2332', // Azul escuro médio
    background: '#0a1729', // Fundo azul escuro
    cardBg: '#0f1a2e', // Fundo dos cards
    border: '#1a2b47', // Bordas
    text: '#e2e8f0', // Texto claro
    textMuted: '#94a3b8' // Texto secundário
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URLS.CONTRATOS}/api/contratos/tomada-decisao`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryLight} 100%)` }}>
        <div className="flex items-center justify-center h-96 flex-col">
          <img
            src="/delta-logo-original.png"
            alt="Delta Global Logo"
            className="h-48 w-48 mb-8"
            style={{ 
              filter: 'drop-shadow(0 0 40px rgba(184, 134, 11, 0.9))',
              objectFit: 'contain'
            }}
          />
          <p style={{ color: '#C0863A', fontSize: '1.3rem', fontWeight: '600' }}>INICIALIZANDO SISTEMA</p>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginTop: '8px' }}>Carregando análise de tomada de decisão...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryLight} 100%)` }}>
        <Card className="max-w-md mx-auto mt-20" style={{ borderColor: themeColors.secondary + '80', backgroundColor: themeColors.cardBg }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Erro ao Carregar</span>
            </div>
            <p className="text-red-300 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline" className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Função helper para verificar se dados existem
  const safeGet = (obj: any, path: string, defaultValue: any = null) => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Verificações de segurança para dados opcionais
  const hasAnaliseComportamental = data.analise_comportamental && typeof data.analise_comportamental === 'object';
  const hasConcentracaoRisco = data.concentracao_risco && typeof data.concentracao_risco === 'object';
  const hasPrevisoes = data.previsoes_inteligentes && typeof data.previsoes_inteligentes === 'object';

  console.log('Data structure:', {
    hasAnaliseComportamental,
    hasConcentracaoRisco, 
    hasPrevisoes,
    keys: Object.keys(data),
    analiseComportamental: data.analise_comportamental,
    concentracaoRisco: data.concentracao_risco,
    previsoes: data.previsoes_inteligentes
  });

  return (
    <div className="min-h-screen p-6" style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryLight} 100%)` }}>
      {/* Header Principal */}
      <div className="mb-8 text-center">
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ 
            color: themeColors.secondary,
            textShadow: `0 0 20px ${themeColors.secondary}40`
          }}
        >
          📊 Tomada de Decisão Estratégica
        </h1>
        <p className="text-xl max-w-4xl mx-auto" style={{ color: themeColors.text }}>
          Dashboard executivo com insights automatizados para orientar decisões estratégicas e identificar oportunidades de crescimento
        </p>
      </div>

      {/* Resumo Executivo - KPIs Principais */}
      <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Total de Operações */}
        <Card className="relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryLight} 100%)`, 
          border: `1px solid ${themeColors.secondary}40` 
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: themeColors.secondary }}>
              <BarChart3 className="h-4 w-4" />
              Operações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: themeColors.text }}>{formatNumber(data.resumo_executivo.total_operacoes)}</div>
            <p className="text-xs" style={{ color: themeColors.textMuted }}>Total de transações</p>
          </CardContent>
        </Card>

        {/* Volume Total */}
        <Card className="relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.secondaryLight} 100%)`, 
          border: `1px solid ${themeColors.secondary}60` 
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: themeColors.primary }}>
              <DollarSign className="h-4 w-4" />
              Volume Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: themeColors.primary }}>{formatCurrency(data.resumo_executivo.volume_total)}</div>
            <p className="text-xs" style={{ color: themeColors.primary + 'CC' }}>Valor liberado</p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${themeColors.accent} 0%, ${themeColors.primaryLight} 100%)`, 
          border: `1px solid ${themeColors.secondary}40` 
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: themeColors.secondary }}>
              <Target className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: themeColors.text }}>{formatCurrency(data.resumo_executivo.ticket_medio_geral)}</div>
            <p className="text-xs" style={{ color: themeColors.textMuted }}>Por operação</p>
          </CardContent>
        </Card>

        {/* Produtos Ativos */}
        <Card className="relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`, 
          border: `1px solid ${themeColors.secondary}40` 
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: themeColors.secondary }}>
              <PieChart className="h-4 w-4" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: themeColors.text }}>{data.resumo_executivo.produtos_ativos}</div>
            <p className="text-xs" style={{ color: themeColors.textMuted }}>Produtos ativos</p>
          </CardContent>
        </Card>

        {/* Regiões Ativas */}
        <Card className="relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${themeColors.accent} 0%, ${themeColors.primary} 100%)`, 
          border: `1px solid ${themeColors.secondary}40` 
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: themeColors.secondary }}>
              <MapPin className="h-4 w-4" />
              Regiões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: themeColors.text }}>{data.resumo_executivo.regioes_ativas}</div>
            <p className="text-xs" style={{ color: themeColors.textMuted }}>Regiões ativas</p>
          </CardContent>
        </Card>

        {/* Instituições */}
        <Card className="relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.secondaryLight} 100%)`, 
          border: `1px solid ${themeColors.secondary}60` 
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: themeColors.primary }}>
              <Building className="h-4 w-4" />
              Instituições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: themeColors.primary }}>{data.resumo_executivo.instituicoes_ativas}</div>
            <p className="text-xs" style={{ color: themeColors.primary + 'CC' }}>Parceiras ativas</p>
          </CardContent>
        </Card>
      </StaggeredContainer>

      {/* Alertas Críticos */}
      {data.alertas_criticos && data.alertas_criticos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-3" style={{ color: themeColors.secondary }}>
            🚨 Alertas Críticos Detectados
          </h2>
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.alertas_criticos.map((alerta, index) => (
              <Card
                key={index}
                className="p-6 animate-pulse"
                style={{ 
                  background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 50%, ${themeColors.primary} 100%)`,
                  border: `2px solid ${themeColors.secondary}`,
                  boxShadow: `0 8px 25px ${themeColors.secondary}40`
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold flex items-center gap-3" style={{ color: themeColors.secondary }}>
                    <AlertTriangle className="h-6 w-6" style={{ color: themeColors.secondary }} />
                    {alerta.titulo}
                    <Badge style={{ 
                      backgroundColor: themeColors.secondary + '20', 
                      color: themeColors.secondary, 
                      border: `1px solid ${themeColors.secondary}60` 
                    }}>
                      {alerta.urgencia}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-base" style={{ color: themeColors.text }}>{alerta.descricao}</p>
                  <div className="p-3 rounded-lg" style={{ 
                    backgroundColor: themeColors.secondary + '20', 
                    border: `1px solid ${themeColors.secondary}60` 
                  }}>
                    <p className="font-semibold text-sm" style={{ color: themeColors.secondary }}>
                      🎯 Ação Recomendada: {alerta.acao}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </StaggeredContainer>
        </div>
      )}

      {/* Score de Saúde do Portfolio */}
      {hasPrevisoes && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: themeColors.secondary }}>
            🏥 Saúde do Portfólio
          </h2>
          <Card
            className="p-8 max-w-2xl mx-auto"
            style={{ 
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 50%, ${themeColors.primary} 100%)`,
              border: `2px solid ${themeColors.secondary}`,
              boxShadow: `0 8px 25px ${themeColors.secondary}40`
            }}
          >
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-bold" style={{ color: themeColors.text }}>
                {data.previsoes_inteligentes.score_saude_portfolio.toFixed(0)}
                <span className="text-2xl" style={{ color: themeColors.secondary }}>/100</span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: themeColors.secondary }}>
                {data.previsoes_inteligentes.score_saude_portfolio >= 80 ? '🌟 EXCELENTE' :
                 data.previsoes_inteligentes.score_saude_portfolio >= 60 ? '✅ SAUDÁVEL' :
                 data.previsoes_inteligentes.score_saude_portfolio >= 40 ? '⚠️ ATENÇÃO' : '🚨 CRÍTICO'}
              </div>
              <div className="w-full rounded-full h-4" style={{ backgroundColor: themeColors.primary }}>
                <div 
                  className="h-4 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${data.previsoes_inteligentes.score_saude_portfolio}%`,
                    background: `linear-gradient(to right, ${themeColors.secondary}, ${themeColors.secondaryLight})`
                  }}
                ></div>
              </div>
              <p className="text-lg" style={{ color: themeColors.textMuted }}>
                Score baseado em diversificação, fidelização de clientes e potencial de crescimento
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Revolucionários */}
      {data.insights_revolucionarios && data.insights_revolucionarios.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: themeColors.secondary }}>
            🧠 Insights Revolucionários de IA
          </h2>
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.insights_revolucionarios.map((insight, index) => (
              <Card
                key={index}
                className="p-6"
                style={{ 
                  background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 50%, ${themeColors.primary} 100%)`,
                  border: `1px solid ${themeColors.secondary}`,
                  boxShadow: `0 8px 25px ${themeColors.secondary}30`
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.secondary }}>
                    <Zap className="h-6 w-6" style={{ color: themeColors.secondary }} />
                    {insight.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insight.mes_critico && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: themeColors.secondary + '20' }}>
                      <p style={{ color: themeColors.text }}>
                        <strong>Mês Crítico:</strong> {insight.mes_critico} 
                        <span className="ml-2" style={{ color: themeColors.textMuted }}>({insight.concentracao} do volume)</span>
                      </p>
                    </div>
                  )}
                  
                  {insight.quantidade && (
                    <div className="flex justify-between items-center">
                      <span style={{ color: themeColors.textMuted }}>Produtos Detectados:</span>
                      <span className="font-bold text-xl" style={{ color: themeColors.text }}>{insight.quantidade}</span>
                    </div>
                  )}
                  
                  {insight.melhor_produto && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: themeColors.secondary + '20' }}>
                      <p style={{ color: themeColors.text }}>
                        <strong>Melhor:</strong> {insight.melhor_produto}
                      </p>
                      <p className="text-sm" style={{ color: themeColors.textMuted }}>
                        Eficiência: {insight.eficiencia_maxima}
                      </p>
                    </div>
                  )}
                  
                  {insight.percentual && (
                    <div className="flex justify-between items-center">
                      <span style={{ color: themeColors.textMuted }}>Base Estratégica:</span>
                      <span className="font-bold text-xl" style={{ color: themeColors.text }}>{insight.percentual}</span>
                    </div>
                  )}
                  
                  {insight.insight && (
                    <div className="border-l-4 pl-4" style={{ borderColor: themeColors.secondary }}>
                      <p className="italic" style={{ color: themeColors.text }}>💡 {insight.insight}</p>
                    </div>
                  )}
                  
                  {insight.acao_recomendada && (
                    <div className="p-3 rounded-lg" style={{ 
                      backgroundColor: themeColors.secondary + '20', 
                      border: `1px solid ${themeColors.secondary}60` 
                    }}>
                      <p className="font-semibold" style={{ color: themeColors.secondary }}>
                        🎯 Ação: {insight.acao_recomendada}
                      </p>
                    </div>
                  )}
                  
                  {insight.oportunidade && (
                    <div className="p-3 rounded-lg" style={{ 
                      backgroundColor: themeColors.secondary + '20', 
                      border: `1px solid ${themeColors.secondary}60` 
                    }}>
                      <p style={{ color: themeColors.secondary }}>
                        🚀 Oportunidade: {insight.oportunidade}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Matriz BCG */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: themeColors.secondary }}>
          📊 Matriz BCG - Classificação Estratégica
        </h2>
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Estrelas */}
          <Card className="p-4" style={{ 
            background: `linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.secondaryLight} 100%)`, 
            border: `1px solid ${themeColors.secondary}` 
          }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: themeColors.primary }}>
                ⭐ ESTRELAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm" style={{ color: themeColors.primary }}>Alto crescimento + Alta participação</div>
              <div className="text-xs mt-1" style={{ color: themeColors.primary + 'CC' }}>→ EXPANDIR AGRESSIVAMENTE</div>
            </CardContent>
          </Card>

          {/* Sólidos */}
          <Card className="p-4" style={{ 
            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`, 
            border: `1px solid ${themeColors.secondary}40` 
          }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: themeColors.secondary }}>
                � SÓLIDOS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm" style={{ color: themeColors.text }}>Baixo crescimento + Alta participação</div>
              <div className="text-xs mt-1" style={{ color: themeColors.textMuted }}>→ MANTER ESTABILIDADE</div>
            </CardContent>
          </Card>

          {/* Oportunidades */}
          <Card className="p-4" style={{ 
            background: `linear-gradient(135deg, ${themeColors.accent} 0%, ${themeColors.primaryLight} 100%)`, 
            border: `1px solid ${themeColors.secondary}40` 
          }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: themeColors.secondary }}>
                🚀 OPORTUNIDADES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm" style={{ color: themeColors.text }}>Alto crescimento + Baixa participação</div>
              <div className="text-xs mt-1" style={{ color: themeColors.textMuted }}>→ EXPLORAR POTENCIAL</div>
            </CardContent>
          </Card>

          {/* Revisar */}
          <Card className="p-4" style={{ 
            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`, 
            border: `1px solid ${themeColors.secondary}40` 
          }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: themeColors.secondary }}>
                ⚠️ REVISAR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm" style={{ color: themeColors.text }}>Baixo crescimento + Baixa participação</div>
              <div className="text-xs mt-1" style={{ color: themeColors.textMuted }}>→ REAVALIAR ESTRATÉGIA</div>
            </CardContent>
          </Card>
        </StaggeredContainer>

        {/* Top 10 Produtos na Matriz */}
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.matriz_bcg_produtos.slice(0, 10).map((produto, index) => {
            const getBCGColor = (categoria) => {
              switch (categoria) {
                case 'ESTRELA': return { bg: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)', text: 'text-amber-900', icon: '⭐' };
                case 'SOLIDO': return { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: 'text-green-100', icon: '�' };
                case 'OPORTUNIDADE': return { bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', text: 'text-blue-100', icon: '🚀' };
                case 'REVISAR': return { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', text: 'text-red-100', icon: '⚠️' };
                default: return { bg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', text: 'text-gray-100', icon: '❓' };
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
                  <CardTitle className={`text-sm font-bold flex items-center justify-between ${bcgStyle.text}`}>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{bcgStyle.icon}</span>
                      <span className="text-xs">{index + 1}º</span>
                    </span>
                    <Badge variant="outline" className="bg-black/20 text-white border-white/30">
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
                      <div>Crescimento</div>
                      <div className="font-bold">{produto.crescimento.toFixed(1)}%</div>
                    </div>
                    <div className={bcgStyle.text}>
                      <div>Participação</div>
                      <div className="font-bold">{produto.participacao.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className={`text-xs font-semibold mt-2 p-2 rounded ${bcgStyle.text} bg-black/20`}>
                    💡 {produto.recomendacao_estrategica}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </StaggeredContainer>
      </div>

      {/* Análise de Tendências e Previsões */}
      {data.analise_tendencias && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#C0863A' }}>
            📈 Análise de Tendências de Mercado
          </h2>
          
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Métricas Gerais de Tendência */}
            <Card className="p-4" style={{ 
              background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
              border: '1px solid rgba(192, 134, 58, 0.3)'
            }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-orange-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Crescimento de Mercado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {data.analise_tendencias.crescimento_medio_mercado > 0 ? '+' : ''}{data.analise_tendencias.crescimento_medio_mercado.toFixed(1)}%
                  </StaggeredContainer>
                  <div className="text-gray-400 text-xs">Crescimento Médio Mensal</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(data.analise_tendencias.previsao_receita_total)}
                  </div>
                  <div className="text-gray-400 text-xs">Previsão Próximo Mês</div>
                </div>
              </CardContent>
            </Card>

            {/* Categorias em Alta */}
            <Card className="p-4" style={{ 
              background: 'linear-gradient(135deg, #0F5132 0%, #198754 100%)',
              border: '1px solid rgba(25, 135, 84, 0.3)'
            }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-green-100 flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Em Crescimento ({data.analise_tendencias.categorias_em_alta.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.analise_tendencias.categorias_em_alta.slice(0, 3).map((categoria, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-green-100 text-xs">{categoria.categoria}</span>
                    <Badge className="bg-green-800 text-green-100">
                      +{categoria.velocidade_crescimento.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Categorias em Queda */}
            <Card className="p-4" style={{ 
              background: 'linear-gradient(135deg, #7C2D12 0%, #DC2626 100%)',
              border: '1px solid rgba(220, 38, 38, 0.3)'
            }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-red-100 flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Em Declínio ({data.analise_tendencias.categorias_em_queda.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.analise_tendencias.categorias_em_queda.slice(0, 3).map((categoria, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-red-100 text-xs">{categoria.categoria}</span>
                    <Badge className="bg-red-800 text-red-100">
                      {categoria.velocidade_crescimento.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Timeline de Evolução */}
          <Card className="p-6" style={{ 
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(192, 134, 58, 0.3)'
          }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-orange-400 text-center">
                📊 Timeline de Performance por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {data.analise_tendencias.timeline_completa.slice(-6).map((periodo, index) => (
                  <div key={index} className="text-center p-3 rounded-lg" style={{
                    background: periodo.crescimento_mensal > 0 
                      ? 'linear-gradient(135deg, #0F5132 0%, #198754 100%)'
                      : 'linear-gradient(135deg, #7C2D12 0%, #DC2626 100%)'
                  }}>
                    <div className="text-xs text-gray-300">{periodo.periodo}</div>
                    <div className="text-lg font-bold text-white">
                      {formatCurrency(periodo.volume)}
                    </div>
                    <div className={`text-xs font-semibold flex items-center justify-center gap-1 ${
                      periodo.crescimento_mensal > 0 ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {periodo.crescimento_mensal > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(periodo.crescimento_mensal).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scoring Inteligente de Oportunidades */}
      {data.scoring_oportunidades && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#C0863A' }}>
            🎯 Scoring Inteligente de Investimento
          </h2>
          
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.scoring_oportunidades.slice(0, 6).map((item, index) => {
              const getScoreColor = (score) => {
                const scoreNum = parseFloat(score);
                if (scoreNum >= 80) return { bg: 'linear-gradient(135deg, #0F5132 0%, #198754 100%)', text: 'text-green-100', icon: '🚀' };
                if (scoreNum >= 65) return { bg: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', text: 'text-blue-100', icon: '📈' };
                if (scoreNum >= 45) return { bg: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)', text: 'text-orange-100', icon: '⚖️' };
                if (scoreNum >= 25) return { bg: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)', text: 'text-orange-100', icon: '⚠️' };
                return { bg: 'linear-gradient(135deg, #7C2D12 0%, #DC2626 100%)', text: 'text-red-100', icon: '🛑' };
              };
              
              const scoreStyle = getScoreColor(item.score_final);
              
              return (
                <Card key={index} className="p-4" style={{ 
                  background: scoreStyle.bg,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-bold flex items-center justify-between ${scoreStyle.text}`}>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{scoreStyle.icon}</span>
                        <span className="text-xs">{index + 1}º</span>
                      </span>
                      <Badge variant="outline" className="bg-black/20 text-white border-white/30">
                        Score: {item.score_final}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={`font-semibold text-sm ${scoreStyle.text}`}>
                      {item.produto}
                    </StaggeredContainer>
                    
                    <div className={`text-xs font-bold p-2 rounded bg-black/20 ${scoreStyle.text}`}>
                      📊 {item.categoria_investimento.replace('_', ' ')}
                    </div>
                    
                    <div className={`text-xs ${scoreStyle.text}`}>
                      <div className="font-semibold">Tendência:</div>
                      <div>{item.tendencia_mercado.replace('_', ' ')}</div>
                    </div>
                    
                    <div className={`text-xs ${scoreStyle.text}`}>
                      <div className="font-semibold">Previsão:</div>
                      <div>{formatCurrency(item.previsao_proximo_mes)}</div>
                    </div>
                    
                    <div className={`text-xs font-medium mt-2 p-2 rounded ${scoreStyle.text} bg-black/30`}>
                      💡 {item.acao_recomendada}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Análise de Produtos - Top 10 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#C0863A' }}>
          🎯 Top 10 Produtos por Performance
        </h2>
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.analise_produtos.slice(0, 10).map((produto, index) => (
            <Card
              key={index}
              className="p-4"
              style={{ 
                background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #1E293B 100%)',
                border: '1px solid rgba(192, 134, 58, 0.3)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span className="text-orange-400 flex items-center gap-2">
                    <span className="text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                    </span>
                    {produto.produto}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="bg-green-950 text-green-300 border-green-500/50"
                  >
                    {formatPercentage(produto.participacao)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Operações</div>
                    <div className="text-white font-semibold">{formatNumber(produto.operacoes)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Clientes</div>
                    <div className="text-white font-semibold">{formatNumber(produto.clientes_unicos)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Volume</div>
                    <div className="text-green-400 font-bold">{formatCurrency(produto.valor_liberado)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Ticket Médio</div>
                    <div className="text-blue-400 font-semibold">{formatCurrency(produto.ticket_medio)}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Eficiência</span>
                  <div className="flex items-center gap-2">
                    {produto.eficiencia >= 100 ? (
                      <ArrowUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`font-bold ${produto.eficiencia >= 100 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(produto.eficiencia)}
                    </span>
                  </div>
                </div>

                {/* Barra de progresso da participação */}
                <div className="mt-3">
                  <div 
                    className="w-full bg-gray-700 rounded-full h-2"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(produto.participacao * 8, 100)}%`,
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

      {/* Oportunidades de Crescimento */}
      {data.oportunidades.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#C0863A' }}>
            🚀 Oportunidades de Crescimento
          </h2>
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.oportunidades.map((oportunidade, index) => (
              <Card
                key={index}
                className="p-4"
                style={{ 
                  background: 'linear-gradient(135deg, #7C2D12 0%, #9A3412 50%, #7C2D12 100%)',
                  border: '1px solid rgba(249, 115, 22, 0.5)',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-300">
                    <Zap className="h-5 w-5" />
                    {oportunidade.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {oportunidade.regiao && (
                    <div className="text-white font-semibold">{oportunidade.regiao}</div>
                  )}
                  {oportunidade.atual && (
                    <div className="text-orange-200 text-sm">Atual: {oportunidade.atual}</div>
                  )}
                  <div className="text-orange-400 font-semibold">{oportunidade.potencial}</div>
                  <Badge variant="outline" className="bg-orange-950 text-orange-300 border-orange-500/50">
                    {oportunidade.tipo.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Análise Comportamental de Clientes */}
      {hasAnaliseComportamental && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#C0863A' }}>
            🧬 Análise Comportamental Avançada
          </h2>
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Geral de Fidelidade */}
            <Card
              className="p-6 col-span-1"
              style={{ 
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #1E40AF 100%)',
                border: '2px solid #3B82F6',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-blue-200 text-center">
                  🎖️ Score de Fidelidade
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-5xl font-bold text-white">
                  {data.analise_comportamental.score_fidelidade.toFixed(0)}
                  <span className="text-lg text-blue-200">/100</span>
                </StaggeredContainer>
                <div className="w-full bg-blue-800 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-200 transition-all duration-1000"
                    style={{ width: `${data.analise_comportamental.score_fidelidade}%` }}
                  ></div>
                </div>
                <div className="text-blue-200 text-sm">
                  {data.analise_comportamental.score_fidelidade >= 80 ? '🏆 Base Extremamente Fiel' :
                   data.analise_comportamental.score_fidelidade >= 60 ? '💙 Base Fiel' :
                   data.analise_comportamental.score_fidelidade >= 40 ? '⚠️ Fidelidade Moderada' : '🚨 Risco de Churn'}
                </div>
              </CardContent>
            </Card>

          {/* Perfil de Risco */}
          <Card
            className="p-6 col-span-2"
            style={{ 
              background: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 50%, #7C2D12 100%)',
              border: '1px solid #EA580C'
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-orange-200">
                ⚖️ Distribuição de Risco dos Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.analise_comportamental.perfil_risco).map(([risco, dados]) => {
                  const getRiskColor = (risk) => {
                    switch (risk) {
                      case 'baixo': return { color: 'text-green-300', bg: 'bg-green-800', icon: '🟢' };
                      case 'medio': return { color: 'text-yellow-300', bg: 'bg-yellow-800', icon: '🟡' };
                      case 'alto': return { color: 'text-red-300', bg: 'bg-red-800', icon: '🔴' };
                      default: return { color: 'text-gray-300', bg: 'bg-gray-800', icon: '⚪' };
                    }
                  };
                  
                  const riskStyle = getRiskColor(risco);
                  const percentage = (dados.quantidade / data.analise_comportamental.total_clientes * 100);
                  
                  return (
                    <div key={risco} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{riskStyle.icon}</span>
                        <span className={`font-semibold capitalize ${riskStyle.color}`}>
                          Risco {risco}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-orange-900 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${riskStyle.bg}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-orange-100 font-bold text-sm w-20 text-right">
                          {dados.quantidade} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-orange-700">
                <div className="text-orange-200 text-sm">
                  💰 Valor médio por perfil de risco varia de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.min(...Object.values(data.analise_comportamental.perfil_risco).map(p => p.valor_medio)))} a {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(...Object.values(data.analise_comportamental.perfil_risco).map(p => p.valor_medio)))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Concentração de Risco */}
      {hasConcentracaoRisco && (
        <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#C0863A' }}>
          🎯 Mapa de Concentração de Riscos
        </h2>
        <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Target className="h-6 w-6" />
                Concentração por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-white text-center">
                {data.concentracao_risco.por_cliente.percentual_top_10.toFixed(1)}%
              </StaggeredContainer>
              <p className="text-pink-200 text-center">concentrados nos TOP 10 clientes</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-pink-900/30 rounded">
                  <span className="text-pink-300">Valor Médio Top 10:</span>
                  <span className="text-white font-bold">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(data.concentracao_risco.por_cliente.valor_medio_top_10)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-pink-900/30 rounded">
                  <span className="text-pink-300">Nível de Risco:</span>
                  <Badge className={`${
                    data.concentracao_risco.por_cliente.nivel_risco === 'ALTO' ? 'bg-red-800 text-red-100 border-red-600' :
                    data.concentracao_risco.por_cliente.nivel_risco === 'MÉDIO' ? 'bg-yellow-800 text-yellow-100 border-yellow-600' : 'bg-green-800 text-green-100 border-green-600'
                  }`}>
                    {data.concentracao_risco.por_cliente.nivel_risco}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

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
                Concentração por Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-white text-center">
                {data.concentracao_risco.por_produto.percentual_top_3.toFixed(1)}%
              </div>
              <p className="text-pink-200 text-center">concentrados nos TOP 3 produtos</p>
              <div className="space-y-3">
                <div className="p-2 bg-pink-900/30 rounded">
                  <span className="text-pink-300 text-sm">Produto Dominante:</span>
                  <div className="text-white font-bold text-xs mt-1">
                    {data.concentracao_risco.por_produto.produto_principal}
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-pink-900/30 rounded">
                  <span className="text-pink-300">Nível de Risco:</span>
                  <Badge className={`${
                    data.concentracao_risco.por_produto.nivel_risco === 'ALTO' ? 'bg-red-800 text-red-100 border-red-600' :
                    data.concentracao_risco.por_produto.nivel_risco === 'MÉDIO' ? 'bg-yellow-800 text-yellow-100 border-yellow-600' : 'bg-green-800 text-green-100 border-green-600'
                  }`}>
                    {data.concentracao_risco.por_produto.nivel_risco}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Oportunidades Inteligentes */}
      {data.oportunidades_crosssell && data.oportunidades_crosssell.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#C0863A' }}>
            🚀 Oportunidades de Cross-Sell Inteligente
          </h2>
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.oportunidades_crosssell.map((oportunidade, index) => (
              <Card
                key={index}
                className="p-6 relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #0369A1 100%)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  boxShadow: '0 6px 20px rgba(3, 105, 161, 0.2)'
                }}
              >
                {/* Número do ranking */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-sky-800/80 text-sky-100 border-sky-600 text-lg px-3 py-1">
                    #{index + 1}
                  </Badge>
                </StaggeredContainer>
                
                <CardContent className="space-y-4 pt-2">
                  {/* Indicador de potencial */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {oportunidade.clientes_potenciais}
                    </div>
                    <div className="text-sky-200 text-sm">clientes potenciais</div>
                  </div>

                  {/* Produto alvo */}
                  <div className="bg-sky-900/30 p-3 rounded-lg border border-sky-700/50">
                    <p className="font-semibold text-sky-200 text-sm">🎯 Produto Alvo:</p>
                    <p className="text-white text-xs font-medium mt-1">{oportunidade.produto}</p>
                  </div>

                  {/* Potencial financeiro */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sky-300 text-sm">💰 Receita Potencial:</span>
                    </div>
                    <div className="text-sky-100 font-bold text-lg text-center bg-sky-900/50 p-2 rounded">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(oportunidade.receita_potencial)}
                    </div>
                  </div>

                  {/* Score de prioridade */}
                  <div className="flex justify-between items-center bg-sky-800/30 p-2 rounded">
                    <span className="text-sky-300 text-sm">🔥 Prioridade:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.floor(oportunidade.clientes_potenciais / 10) ? 'text-yellow-400' : 'text-gray-500'}`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resumo Executivo */}
      <Card
        className="p-8 max-w-4xl mx-auto mb-8"
        style={{ 
          background: 'linear-gradient(135deg, #1F2937 0%, #374151 50%, #1F2937 100%)',
          border: '2px solid #C0863A',
          boxShadow: '0 8px 25px rgba(192, 134, 58, 0.3)'
        }}
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-center" style={{ color: '#C0863A' }}>
            📋 Resumo Executivo - Tomada de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
              <div className="text-2xl font-bold text-green-400">
                {data.previsoes_inteligentes.score_saude_portfolio.toFixed(0)}/100
              </StaggeredContainer>
              <div className="text-gray-300 text-sm">Saúde do Portfólio</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
              <div className="text-2xl font-bold text-blue-400">
                {data.analise_comportamental.score_fidelidade.toFixed(0)}/100
              </div>
              <div className="text-gray-300 text-sm">Fidelidade dos Clientes</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
              <div className="text-2xl font-bold text-purple-400">
                {data.insights_revolucionarios.length}
              </div>
              <div className="text-gray-300 text-sm">Insights Críticos</div>
            </div>
          </div>
          
          <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">
              🎯 Próximas Ações Recomendadas
            </h3>
            <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-gray-300">• Focar em produtos SÓLIDOS da Matriz BCG</div>
                <div className="text-gray-300">• Implementar cross-sell nos {data.oportunidades_crosssell.length} produtos identificados</div>
                <div className="text-gray-300">• Monitorar concentração de risco em clientes TOP 10</div>
              </div>
              <div className="space-y-2">
                <div className="text-gray-300">• Investigar produtos a REVISAR para otimização</div>
                <div className="text-gray-300">• Diversificar base de clientes para reduzir concentração</div>
                <div className="text-gray-300">• Aproveitar padrões sazonais para maximizar receita</div>
              </div>
            </StaggeredContainer>
          </div>
        </CardContent>
      </Card>

      {/* Análise Geográfica */}
      {data.analise_geografica.length > 1 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#C0863A' }}>
            🗺️ Análise Geográfica
          </h2>
          <StaggeredContainer stagger={0.1} delay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.analise_geografica.slice(0, 6).map((regiao, index) => (
              <Card
                key={index}
                className="p-4"
                style={{ 
                  background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #1E293B 100%)',
                  border: '1px solid rgba(192, 134, 58, 0.3)'
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-orange-400 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {regiao.cidade} - {regiao.uf}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400">Operações</div>
                      <div className="text-white font-semibold">{formatNumber(regiao.operacoes)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Produtos</div>
                      <div className="text-blue-400 font-semibold">{regiao.diversificacao}</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">{formatCurrency(regiao.valor_total)}</div>
                  <div className="text-gray-300 text-sm">
                    Ticket: {formatCurrency(regiao.ticket_medio)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé com Última Atualização */}
      <div className="text-center mt-8 pt-6 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          Dashboard atualizado automaticamente • Última consulta: {new Date().toLocaleString('pt-BR')}
        </p>
        <Button 
          onClick={fetchData} 
          variant="outline" 
          className="mt-4 border-orange-500/50 text-orange-400 hover:bg-orange-950/30"
        >
          <Eye className="h-4 w-4 mr-2" />
          Atualizar Análise
        </Button>
      </div>
    </div>
  );
};

import { StaggeredContainer } from "@/components/motion/StaggeredContainer"
export default TomadaDecisao;