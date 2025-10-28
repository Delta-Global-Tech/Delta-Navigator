import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { getMapaCidades } from '@/data/cadastralApi';

interface MapaCidade {
  estado: string;
  cidade: string;
  quantidade_clientes: number;
  total_credito_liberado: number;
  credito_medio: number;
}

interface EstadoData {
  sigla: string;
  nome: string;
  clientes: number;
  credito: number;
}

// Nomes completos dos estados
const NOMES_ESTADOS: Record<string, string> = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
};

export function MapaBrasilInterativo() {
  const [dados, setDados] = useState<MapaCidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredEstado, setHoveredEstado] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getMapaCidades();
        setDados(response.dados);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar mapa');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Agregar dados por estado
  const dadosPorEstado: Record<string, EstadoData> = {};
  dados.forEach(cidade => {
    if (!dadosPorEstado[cidade.estado]) {
      dadosPorEstado[cidade.estado] = {
        sigla: cidade.estado,
        nome: NOMES_ESTADOS[cidade.estado] || cidade.estado,
        clientes: 0,
        credito: 0
      };
    }
    dadosPorEstado[cidade.estado].clientes += cidade.quantidade_clientes;
    dadosPorEstado[cidade.estado].credito += cidade.total_credito_liberado;
  });

  // Encontrar min/max para escala de cores
  const clientesValues = Object.values(dadosPorEstado).map(d => d.clientes);
  const minClientes = clientesValues.length > 0 ? Math.min(...clientesValues) : 0;
  const maxClientes = clientesValues.length > 0 ? Math.max(...clientesValues) : 1;

  // Função para calcular cor baseada em intensidade
  const getCorPorIntensidade = (clientes: number) => {
    if (maxClientes === minClientes) return '#7eb8d4';
    const ratio = (clientes - minClientes) / (maxClientes - minClientes);
    
    if (ratio < 0.2) return '#e8f4f8';      // Muito claro
    if (ratio < 0.4) return '#b3d9e8';      // Claro
    if (ratio < 0.6) return '#7eb8d4';      // Médio
    if (ratio < 0.8) return '#4a9cbd';      // Forte
    return '#0d5a7f';                       // Muito forte
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Distribuição
          </CardTitle>
          <CardDescription>Distribuição de clientes por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Carregando mapa...</p>
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
            Mapa de Distribuição
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

  const estadoHover = hoveredEstado ? dadosPorEstado[hoveredEstado] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Distribuição - Brasil
        </CardTitle>
        <CardDescription>
          Passe o mouse sobre os estados para ver detalhes de clientes e crédito
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapa em Grid com cards dos estados */}
        <div className="relative w-full rounded-lg border-2 border-blue-200 overflow-auto bg-gradient-to-b from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-slate-900 p-6">
          <div className="grid grid-cols-6 gap-3 auto-rows-max">
            {/* Linha 1 - Norte */}
            <div className="col-start-3 col-span-1">
              <EstadoCard
                sigla="RR"
                estado={dadosPorEstado['RR']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-5 col-span-1">
              <EstadoCard
                sigla="AP"
                estado={dadosPorEstado['AP']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>

            {/* Linha 2 - Região Norte Grande */}
            <div className="col-start-1 col-span-2 row-start-2">
              <EstadoCard
                sigla="AM"
                estado={dadosPorEstado['AM']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
                large
              />
            </div>
            <div className="col-start-3 col-span-1 row-start-2">
              <EstadoCard
                sigla="PA"
                estado={dadosPorEstado['PA']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>

            {/* Linha 3 - Centro-Oeste e Nordeste */}
            <div className="col-start-1 col-span-1 row-start-3">
              <EstadoCard
                sigla="AC"
                estado={dadosPorEstado['AC']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-2 col-span-1 row-start-3">
              <EstadoCard
                sigla="RO"
                estado={dadosPorEstado['RO']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-3 col-span-1 row-start-3">
              <EstadoCard
                sigla="MT"
                estado={dadosPorEstado['MT']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-4 col-span-1 row-start-3">
              <EstadoCard
                sigla="MA"
                estado={dadosPorEstado['MA']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-5 col-span-1 row-start-3">
              <EstadoCard
                sigla="CE"
                estado={dadosPorEstado['CE']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-6 col-span-1 row-start-3">
              <EstadoCard
                sigla="RN"
                estado={dadosPorEstado['RN']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>

            {/* Linha 4 - Centro-Oeste */}
            <div className="col-start-2 col-span-1 row-start-4">
              <EstadoCard
                sigla="TO"
                estado={dadosPorEstado['TO']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-3 col-span-1 row-start-4">
              <EstadoCard
                sigla="GO"
                estado={dadosPorEstado['GO']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-4 col-span-1 row-start-4">
              <EstadoCard
                sigla="PI"
                estado={dadosPorEstado['PI']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-5 col-span-1 row-start-4">
              <EstadoCard
                sigla="PB"
                estado={dadosPorEstado['PB']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-6 col-span-1 row-start-4">
              <EstadoCard
                sigla="PE"
                estado={dadosPorEstado['PE']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>

            {/* Linha 5 - Centro-Oeste e Nordeste */}
            <div className="col-start-2 col-span-1 row-start-5">
              <EstadoCard
                sigla="MS"
                estado={dadosPorEstado['MS']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-3 col-span-1 row-start-5">
              <EstadoCard
                sigla="BA"
                estado={dadosPorEstado['BA']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-5 col-span-1 row-start-5">
              <EstadoCard
                sigla="AL"
                estado={dadosPorEstado['AL']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-6 col-span-1 row-start-5">
              <EstadoCard
                sigla="SE"
                estado={dadosPorEstado['SE']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>

            {/* Linha 6 - Sudeste */}
            <div className="col-start-3 col-span-1 row-start-6">
              <EstadoCard
                sigla="DF"
                estado={dadosPorEstado['DF']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-4 col-span-1 row-start-6">
              <EstadoCard
                sigla="MG"
                estado={dadosPorEstado['MG']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-5 col-span-1 row-start-6">
              <EstadoCard
                sigla="ES"
                estado={dadosPorEstado['ES']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>

            {/* Linha 7 - Sudeste grande */}
            <div className="col-start-2 col-span-2 row-start-7">
              <EstadoCard
                sigla="SP"
                estado={dadosPorEstado['SP']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
                large
              />
            </div>
            <div className="col-start-4 col-span-1 row-start-7">
              <EstadoCard
                sigla="RJ"
                estado={dadosPorEstado['RJ']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>

            {/* Linha 8 - Sul */}
            <div className="col-start-2 col-span-2 row-start-8">
              <EstadoCard
                sigla="PR"
                estado={dadosPorEstado['PR']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
                large
              />
            </div>

            {/* Linha 9 - Sul */}
            <div className="col-start-2 col-span-1 row-start-9">
              <EstadoCard
                sigla="SC"
                estado={dadosPorEstado['SC']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
            <div className="col-start-3 col-span-1 row-start-9">
              <EstadoCard
                sigla="RS"
                estado={dadosPorEstado['RS']}
                hoveredEstado={hoveredEstado}
                setHoveredEstado={setHoveredEstado}
                setMousePos={setMousePos}
                getCorPorIntensidade={getCorPorIntensidade}
                maxClientes={maxClientes}
              />
            </div>
          </div>

          {/* Tooltip ao passar mouse */}
          {estadoHover && (
            <div
              className="fixed bg-slate-950 text-white p-5 rounded-xl shadow-2xl text-sm z-50 pointer-events-none border-2 border-blue-400"
              style={{
                left: `${mousePos.x + 15}px`,
                top: `${mousePos.y - 80}px`,
                minWidth: '280px',
                backdropFilter: 'blur(8px)',
                background: 'rgba(15, 23, 42, 0.95)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              <div className="font-bold text-lg mb-4 text-blue-300 border-b border-blue-500 pb-3">
                📍 {estadoHover.nome}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-6 bg-slate-900 bg-opacity-50 p-3 rounded-lg">
                  <span className="text-gray-300">👥 Clientes:</span>
                  <span className="font-bold text-green-400">{estadoHover.clientes.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between gap-6 bg-slate-900 bg-opacity-50 p-3 rounded-lg">
                  <span className="text-gray-300">💰 Crédito Total:</span>
                  <span className="font-bold text-green-400">R$ {(estadoHover.credito / 1_000_000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between gap-6 bg-slate-900 bg-opacity-50 p-3 rounded-lg">
                  <span className="text-gray-300">📊 Crédito Médio:</span>
                  <span className="font-bold text-green-400">
                    R$ {(estadoHover.credito / Math.max(estadoHover.clientes, 1)).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-slate-900 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-bold mb-4 text-blue-900 dark:text-blue-200">🎯 Legenda de Intensidade</h4>
          <div className="grid grid-cols-5 gap-3 text-xs mb-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded border-2 border-blue-900 shadow-md"
                style={{ backgroundColor: '#e8f4f8' }}
              />
              <span className="text-center font-medium text-xs">Muito Baixo</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded border-2 border-blue-900 shadow-md"
                style={{ backgroundColor: '#b3d9e8' }}
              />
              <span className="text-center font-medium text-xs">Baixo</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded border-2 border-blue-900 shadow-md"
                style={{ backgroundColor: '#7eb8d4' }}
              />
              <span className="text-center font-medium text-xs">Médio</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded border-2 border-blue-900 shadow-md"
                style={{ backgroundColor: '#4a9cbd' }}
              />
              <span className="text-center font-medium text-xs">Alto</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded border-2 border-blue-900 shadow-md"
                style={{ backgroundColor: '#0d5a7f' }}
              />
              <span className="text-center font-medium text-xs">Muito Alto</span>
            </div>
          </div>

          <div className="text-xs text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="mb-2">
              <strong>💡 Como ler o mapa:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Cor do estado</strong> = intensidade de clientes (mais escuro = mais clientes)</li>
              <li><strong>Tamanho do card</strong> = estados maiores no mapa do Brasil</li>
              <li><strong>Passe o mouse</strong> para ver detalhes completos de cada estado</li>
            </ul>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-md">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-2">🗺️ Estados Cobertos</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{Object.keys(dadosPorEstado).length}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">dos 27 estados</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-300 dark:border-green-700 shadow-md">
            <p className="text-xs text-green-700 dark:text-green-300 font-semibold mb-2">👥 Total de Clientes</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {Object.values(dadosPorEstado).reduce((sum, e) => sum + e.clientes, 0).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">clientes ativos</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border-2 border-purple-300 dark:border-purple-700 shadow-md">
            <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold mb-2">💰 Crédito Total</p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              R$ {(Object.values(dadosPorEstado).reduce((sum, e) => sum + e.credito, 0) / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">liberado</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EstadoCardProps {
  sigla: string;
  estado?: EstadoData;
  hoveredEstado: string | null;
  setHoveredEstado: (estado: string | null) => void;
  setMousePos: (pos: { x: number; y: number }) => void;
  getCorPorIntensidade: (clientes: number) => string;
  maxClientes: number;
  large?: boolean;
}

function EstadoCard({
  sigla,
  estado,
  hoveredEstado,
  setHoveredEstado,
  setMousePos,
  getCorPorIntensidade,
  maxClientes,
  large
}: EstadoCardProps) {
  if (!estado) {
    return (
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 ${
          large ? 'min-h-24' : 'min-h-20'
        }`}
      >
        <span className="text-sm font-semibold">{sigla}</span>
      </div>
    );
  }

  const cor = getCorPorIntensidade(estado.clientes);
  const isHovered = hoveredEstado === sigla;

  return (
    <div
      onMouseEnter={() => setHoveredEstado(sigla)}
      onMouseLeave={() => setHoveredEstado(null)}
      onMouseMove={(e) => {
        setMousePos({
          x: e.clientX,
          y: e.clientY
        });
      }}
      className={`rounded-lg p-4 text-center cursor-pointer transition-all duration-200 border-2 shadow-md ${
        isHovered
          ? 'border-blue-500 shadow-lg scale-105'
          : 'border-gray-300'
      } ${large ? 'min-h-24' : 'min-h-20'}`}
      style={{
        backgroundColor: cor,
        opacity: isHovered ? 1 : 0.85
      }}
    >
      <div className="font-bold text-lg" style={{ color: estado.clientes > maxClientes / 2 ? '#fff' : '#0d5a7f' }}>
        {sigla}
      </div>
      <div className="text-xs opacity-75" style={{ color: estado.clientes > maxClientes / 2 ? '#fff' : '#0d5a7f' }}>
        {estado.clientes} clientes
      </div>
    </div>
  );
}
