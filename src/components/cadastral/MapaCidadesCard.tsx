import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMapaCidades } from '@/data/cadastralApi';
import { MapPin } from 'lucide-react';

interface MapaCidade {
  estado: string;
  cidade: string;
  quantidade_clientes: number;
  total_credito_liberado: number;
  credito_medio: number;
}

interface MapaCidadesProps {
  estado?: string;
}

export function MapaCidadesCard({ estado }: MapaCidadesProps) {
  const [dados, setDados] = useState<MapaCidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getMapaCidades(estado);
        setDados(response.dados);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar mapa de cidades');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [estado]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Distribuição por Cidade
          </CardTitle>
          <CardDescription>Clientes e crédito liberado por localização</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Distribuição por Cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular max para criar escala de visualização
  const maxClientes = Math.max(...dados.map(d => d.quantidade_clientes), 1);
  const maxCredito = Math.max(...dados.map(d => d.total_credito_liberado), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Distribuição por Cidade
        </CardTitle>
        <CardDescription>
          {dados.length} cidades mapeadas • Clientes e crédito liberado por localização
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {dados.map((cidade) => {
            const clienteRatio = (cidade.quantidade_clientes / maxClientes) * 100;
            const creditoRatio = (cidade.total_credito_liberado / maxCredito) * 100;

            return (
              <div
                key={`${cidade.estado}-${cidade.cidade}`}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{cidade.cidade}</p>
                    <p className="text-xs text-muted-foreground">{cidade.estado}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Métrica de Clientes */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">Clientes</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {cidade.quantidade_clientes}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${clienteRatio}%` }}
                      />
                    </div>
                  </div>

                  {/* Métrica de Crédito */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">Crédito</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        R$ {(cidade.total_credito_liberado / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${creditoRatio}%` }}
                      />
                    </div>
                  </div>

                  {/* Crédito Médio */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-muted-foreground">
                      Crédito médio: <span className="font-semibold">R$ {parseFloat(String(cidade.credito_medio)).toFixed(0)}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
