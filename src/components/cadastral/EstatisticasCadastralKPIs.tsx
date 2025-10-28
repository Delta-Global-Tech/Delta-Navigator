import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getEstatisticasCadastral } from '@/data/cadastralApi';
import { Users, UserCheck, UserX, DollarSign, MapPin, Zap } from 'lucide-react';

interface EstatisticasCadastral {
  total_clientes: number;
  clientes_ativos: number;
  clientes_inativos: number;
  total_credito_liberado: number;
  credito_medio: number;
  total_estados: number;
  total_cidades: number;
}

interface EstatisticasCadastralKPIsProps {
  dataInicio?: string;
  dataFim?: string;
}

export function EstatisticasCadastralKPIs({ dataInicio, dataFim }: EstatisticasCadastralKPIsProps) {
  const [stats, setStats] = useState<EstatisticasCadastral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Converter datas do formato YYYY-MM-DD para DD/MM/YYYY se necessário
        const formatDate = (dateStr: string) => {
          if (!dateStr) return undefined;
          const parts = dateStr.split('-');
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        };
        
        const data = await getEstatisticasCadastral(
          formatDate(dataInicio || ''),
          formatDate(dataFim || '')
        );
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataInicio, dataFim]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-sm text-destructive">
              ❌ {error || 'Erro ao carregar estatísticas'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentualAtivos = stats.total_clientes > 0 
    ? ((stats.clientes_ativos / stats.total_clientes) * 100).toFixed(1) 
    : 0;

  const percentualInativos = stats.total_clientes > 0 
    ? ((stats.clientes_inativos / stats.total_clientes) * 100).toFixed(1) 
    : 0;

  const isFiltered = dataInicio || dataFim;

  const kpis = [
    {
      title: 'Total de Clientes',
      value: stats.total_clientes.toLocaleString('pt-BR'),
      subtitle: 'Clientes cadastrados',
      icon: Users,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Clientes Ativos',
      value: `${stats.clientes_ativos.toLocaleString('pt-BR')}`,
      subtitle: `${percentualAtivos}% do total`,
      icon: UserCheck,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Clientes Inativos',
      value: `${stats.clientes_inativos.toLocaleString('pt-BR')}`,
      subtitle: `${percentualInativos}% do total`,
      icon: UserX,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Crédito Total Liberado',
      value: `R$ ${(stats.total_credito_liberado).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      subtitle: `Valor total em carteira`,
      icon: DollarSign,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Crédito Médio',
      value: `R$ ${stats.credito_medio.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`,
      subtitle: `Média por cliente`,
      icon: Zap,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Cobertura Geográfica',
      value: `${stats.total_estados} Estados`,
      subtitle: `${stats.total_cidades} Cidades`,
      icon: MapPin,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Indicador de Filtros Ativos */}
      {isFiltered && (
        <div className="p-3 rounded-lg border text-sm" style={{ 
          background: 'rgba(196, 138, 63, 0.1)', 
          borderColor: '#C48A3F',
          color: '#D4A574'
        }}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">📊 KPIs filtrados por período</span>
            {dataInicio && <span>• Início: {dataInicio}</span>}
            {dataFim && <span>• Fim: {dataFim}</span>}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <Card 
            key={kpi.title} 
            className="border-0 backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg"
            style={{ 
              background: 'rgba(6, 22, 43, 0.9)',
              border: '2px solid #C48A3F'
            }}
          >
            <CardContent className="pt-10 pb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-400 mb-4 tracking-wide uppercase">
                    {kpi.title}
                  </p>
                  <p className="text-4xl font-bold text-white mb-4 tracking-tight">{kpi.value}</p>
                  {kpi.subtitle && (
                    <p className="text-base text-gray-300">{kpi.subtitle}</p>
                  )}
                </div>
                <div 
                  className="p-5 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(196, 138, 63, 0.2)' }}
                >
                  <IconComponent className="h-7 w-7" style={{ color: '#C48A3F' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
