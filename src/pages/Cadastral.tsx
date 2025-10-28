import { useState } from 'react';
import { usePageXP } from '@/components/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EstatisticasCadastralKPIs } from '@/components/cadastral/EstatisticasCadastralKPIs';
import { MapaBrasilSVG } from '@/components/cadastral/MapaBrasilSVG';
import { ClientesTable } from '@/components/cadastral/ClientesTable';
import { EvolucaoMensalChart } from '@/components/cadastral/EvolucaoMensalChart';
import { Users, BarChart3 } from 'lucide-react';

import { StaggeredContainer } from "@/components/motion/StaggeredContainer"
export default function Cadastral() {
  // Gamification
  usePageXP('page_visit');
  
  // Estados para filtros compartilhados
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  return (
    <div className="min-h-screen w-full" style={{ background: '#06162B' }}>
      <div className="w-full px-4 py-12 space-y-12">
        {/* Header com Gradient */}
        <div className="flex items-center justify-between pt-6 pb-8 px-6 border-b" style={{ borderColor: '#C48A3F' }}>
          <div className="flex-1">
            <h1 className="text-6xl font-bold tracking-tight text-white mb-2">Cadastral de Clientes</h1>
            <p className="text-xl text-gray-300">
              Visão completa de clientes, créditos liberados e distribuição geográfica
            </p>
          </div>
          <Badge 
            className="px-4 py-2 h-fit text-base flex-shrink-0 ml-6"
            style={{ backgroundColor: '#C48A3F', color: '#FFF' }}
          >
            <Users className="h-4 w-4 mr-2" />
            Base de Dados
          </Badge>
        </div>

        {/* KPIs Section */}
        <div className="space-y-6 px-6">
          <div className="flex items-center gap-3 pb-4">
            <div style={{ color: '#C48A3F' }}>
              <BarChart3 className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-bold text-white">Indicadores Principais</h2>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/5 to-yellow-600/5 rounded-xl blur-lg" />
            <div className="relative rounded-xl overflow-hidden p-2" style={{ background: 'rgba(196, 138, 63, 0.08)' }}>
              <EstatisticasCadastralKPIs dataInicio={dataInicio} dataFim={dataFim} />
            </div>
          </div>
        </div>

        {/* Gráfico de Evolução Mensal */}
        <div className="space-y-6 px-6">
          <div className="flex items-center gap-3 pb-4">
            <div style={{ color: '#C48A3F' }}>
              📈
            </div>
            <h2 className="text-4xl font-bold text-white">Evolução Temporal</h2>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/5 to-yellow-600/5 rounded-xl blur-lg" />
            <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(196, 138, 63, 0.08)' }}>
              <EvolucaoMensalChart dataInicio={dataInicio} dataFim={dataFim} />
            </div>
          </div>
        </div>

        {/* Mapa Section */}
        <div className="space-y-6 px-6">
          <div className="flex items-center gap-3 pb-4">
            <div style={{ color: '#C48A3F' }}>
              📍
            </div>
            <h2 className="text-4xl font-bold text-white">Distribuição Geográfica</h2>
          </div>
          <div className="rounded-xl overflow-hidden backdrop-blur-sm" style={{ background: '#06162B', border: '2px solid #C48A3F' }}>
            <MapaBrasilSVG />
          </div>
        </div>

        {/* Clientes Table Section */}
        <div className="space-y-6 px-6 pb-12">
          <div className="flex items-center gap-3 pb-4">
            <div style={{ color: '#C48A3F' }}>
              👥
            </div>
            <h2 className="text-4xl font-bold text-white">Clientes Cadastrados</h2>
          </div>
          <div className="rounded-xl overflow-hidden backdrop-blur-sm" style={{ background: '#06162B', border: '2px solid #C48A3F' }}>
            <ClientesTable 
              dataInicio={dataInicio}
              dataFim={dataFim}
              onDataInicioChange={setDataInicio}
              onDataFimChange={setDataFim}
            />
          </div>
        </div>

        {/* Info Card */}
        <Card 
          className="border-2 backdrop-blur-sm mx-6"
          style={{ 
            background: 'rgba(196, 138, 63, 0.08)',
            borderColor: '#C48A3F'
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: '#C48A3F' }} className="text-2xl">💡 Dica de Uso</CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-gray-200">
            <ul className="list-disc list-inside space-y-3">
              <li>Use a <strong style={{ color: '#C48A3F' }}>Distribuição Geográfica</strong> para visualizar a cobertura de clientes e crédito liberado por estado</li>
              <li>Na <strong style={{ color: '#C48A3F' }}>Tabela de Clientes</strong>, busque clientes específicos por nome, CPF/CNPJ ou email</li>
              <li>Todos os dados são <strong style={{ color: '#C48A3F' }}>atualizados automaticamente</strong> a cada 30 segundos</li>
              <li>Clique em qualquer linha para ver mais detalhes do cliente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
