import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEvolucaoMensal, EvolucaoMensal } from '@/data/cadastralApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface EvolucaoMensalChartProps {
  dataInicio?: string;
  dataFim?: string;
}

export function EvolucaoMensalChart({ dataInicio, dataFim }: EvolucaoMensalChartProps) {
  const [dados, setDados] = useState<EvolucaoMensal[]>([]);
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
        
        const response = await getEvolucaoMensal(
          formatDate(dataInicio || ''),
          formatDate(dataFim || '')
        );
        setDados(response.dados);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar evolução mensal');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataInicio, dataFim]);

  if (loading) {
    return (
      <Card 
        className="border-0 backdrop-blur-sm"
        style={{ 
          background: '#06162B',
          borderColor: '#C48A3F'
        }}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" style={{ color: '#C48A3F' }} />
            <CardTitle style={{ color: '#C48A3F' }} className="text-xl">
              Evolução Mensal
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-400 text-lg">📈 Carregando gráfico...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || dados.length === 0) {
    return (
      <Card 
        className="border-0 backdrop-blur-sm"
        style={{ 
          background: '#06162B',
          borderColor: '#C48A3F'
        }}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" style={{ color: '#C48A3F' }} />
            <CardTitle style={{ color: '#C48A3F' }} className="text-xl">
              Evolução Mensal
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-red-400 text-center">
              ❌ {error || 'Nenhum dado encontrado para o período selecionado'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formatear dados para o gráfico
  const maxCredito = Math.max(...dados.map(item => item.total_credito_liberado));
  const usarMilhoes = maxCredito >= 1000000;
  
  const chartData = dados.map(item => ({
    ...item,
    mes_abrev: item.mes_nome.split(' ')[0].substring(0, 3), // Ex: "Jan", "Fev"
    credito_formatado: usarMilhoes 
      ? item.total_credito_liberado / 1000000 // Milhões
      : item.total_credito_liberado / 1000    // Milhares
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="p-4 rounded-lg border shadow-lg"
          style={{ 
            background: 'rgba(3, 18, 38, 0.95)',
            borderColor: '#C48A3F',
            color: '#FFF'
          }}
        >
          <p className="font-semibold mb-2" style={{ color: '#C48A3F' }}>
            {data.mes_nome}
          </p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#C48A3F' }}
              />
              Cadastros: <strong>{data.total_cadastros.toLocaleString('pt-BR')}</strong>
            </p>
            <p className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#D4A574' }}
              />
              Crédito: <strong>R$ {usarMilhoes 
                ? `${data.credito_formatado.toFixed(1)}M` 
                : `${data.credito_formatado.toFixed(1)}K`
              }</strong>
            </p>
            <p className="text-gray-300 mt-2">
              Crédito médio: <strong>R$ {data.credito_medio_mes.toLocaleString('pt-BR', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className="border-0 backdrop-blur-sm"
      style={{ 
        background: '#06162B',
        borderColor: '#C48A3F'
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" style={{ color: '#C48A3F' }} />
            <CardTitle style={{ color: '#C48A3F' }} className="text-xl">
              Evolução Mensal - Cadastros e Crédito
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#D4A574' }}>
            <TrendingUp className="h-4 w-4" />
            <span>{dados.length} meses</span>
          </div>
        </div>
        <p className="text-gray-300 text-sm mt-2">
          Total de cadastros e crédito liberado por mês
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196, 138, 63, 0.2)" />
              <XAxis 
                dataKey="mes_abrev" 
                stroke="#D4A574"
                fontSize={12}
                tickLine={{ stroke: '#C48A3F' }}
              />
              <YAxis 
                yAxisId="cadastros"
                orientation="left"
                stroke="#C48A3F"
                fontSize={12}
                tickLine={{ stroke: '#C48A3F' }}
                label={{ 
                  value: 'Cadastros', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#C48A3F' }
                }}
              />
              <YAxis 
                yAxisId="credito"
                orientation="right"
                stroke="#D4A574"
                fontSize={12}
                tickLine={{ stroke: '#D4A574' }}
                label={{ 
                  value: usarMilhoes ? 'Crédito (R$ Milhões)' : 'Crédito (R$ Milhares)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fill: '#D4A574' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#FFF' }}
                iconType="line"
              />
              <Line
                yAxisId="cadastros"
                type="monotone"
                dataKey="total_cadastros"
                stroke="#C48A3F"
                strokeWidth={3}
                dot={{ fill: '#C48A3F', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#C48A3F', strokeWidth: 2 }}
                name="Total de Cadastros"
              />
              <Line
                yAxisId="credito"
                type="monotone"
                dataKey="credito_formatado"
                stroke="#D4A574"
                strokeWidth={3}
                dot={{ fill: '#D4A574', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#D4A574', strokeWidth: 2 }}
                name={usarMilhoes ? "Crédito (R$ Milhões)" : "Crédito (R$ Milhares)"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}