import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Trash2, Search, TrendingUp, AlertCircle, Lightbulb, BarChart3 } from 'lucide-react'

interface Insight {
  id: string
  timestamp: Date
  page: string
  question: string
  analysis: string
  category: 'financial' | 'sales' | 'administrative' | 'other'
  importance: 'high' | 'medium' | 'low'
  actionable: boolean
}

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const GOLD_COLOR = '#C48A3F'
  const DARK_BG = '#06162B'

  // Simular carregamento de histórico
  useEffect(() => {
    // Em produção, isso viria de um API
    const mockInsights: Insight[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000),
        page: 'Fechamento do Mês',
        question: 'Qual foi minha receita total?',
        analysis: '💰 Receita de R$ 4.684.591,36 em 4797 transações. Crescimento de +3.2% vs mês anterior.',
        category: 'financial',
        importance: 'high',
        actionable: true,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000),
        page: 'Extrato Financeiro',
        question: 'Qual foi meu maior débito?',
        analysis: '🔴 Maior débito: R$ 250.000 em 03/11. Análise: Despesa operacional planejada.',
        category: 'financial',
        importance: 'medium',
        actionable: false,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 86400000),
        page: 'Propostas',
        question: 'Como tá minha taxa de aprovação?',
        analysis: '📊 Taxa de conversão: 58%. Total enviadas: 150, Aprovadas: 87. Tendência: +5% ao mês.',
        category: 'sales',
        importance: 'high',
        actionable: true,
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 172800000),
        page: 'Desembolso',
        question: 'Eficiência de liberação?',
        analysis: '⚡ Eficiência média: 2.3 dias. Dentro dos parâmetros normais. Recomendação: manter ritmo.',
        category: 'administrative',
        importance: 'medium',
        actionable: false,
      },
    ]

    setInsights(mockInsights)
    setFilteredInsights(mockInsights)
  }, [])

  // Filtrar insights
  useEffect(() => {
    let filtered = insights

    if (searchTerm) {
      filtered = filtered.filter(
        (insight) =>
          insight.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          insight.analysis.toLowerCase().includes(searchTerm.toLowerCase()) ||
          insight.page.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((insight) => insight.category === selectedCategory)
    }

    setFilteredInsights(filtered)
  }, [searchTerm, selectedCategory, insights])

  const deleteInsight = (id: string) => {
    setInsights(insights.filter((insight) => insight.id !== id))
  }

  const exportInsights = () => {
    const csv = filteredInsights
      .map(
        (insight) =>
          `"${insight.timestamp.toLocaleString('pt-BR')}","${insight.page}","${insight.question}","${insight.analysis}","${insight.importance}"`
      )
      .join('\n')

    const header = 'Data,Página,Pergunta,Análise,Importância\n'
    const blob = new Blob([header + csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `insights-ia-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return '💰'
      case 'sales':
        return '📊'
      case 'administrative':
        return '⚙️'
      default:
        return '💡'
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return GOLD_COLOR
      case 'low':
        return '#10b981'
      default:
        return GOLD_COLOR
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-8 w-8" style={{ color: GOLD_COLOR }} />
          <h1 className="text-3xl font-bold text-white">Intelligence Dashboard</h1>
        </div>
        <p className="text-gray-400">Histórico completo de análises e insights gerados pela IA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Total de Análises</div>
            <div className="text-3xl font-bold mt-2" style={{ color: GOLD_COLOR }}>
              {insights.length}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Insights Acionáveis</div>
            <div className="text-3xl font-bold mt-2" style={{ color: '#10b981' }}>
              {insights.filter((i) => i.actionable).length}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Importância Alta</div>
            <div className="text-3xl font-bold mt-2" style={{ color: '#ef4444' }}>
              {insights.filter((i) => i.importance === 'high').length}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Páginas Analisadas</div>
            <div className="text-3xl font-bold mt-2" style={{ color: GOLD_COLOR }}>
              {new Set(insights.map((i) => i.page)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="🔍 Buscar análises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-64"
              style={{ background: `${DARK_BG}cc`, borderColor: `${GOLD_COLOR}40`, color: 'white' }}
            />
            <Button
              onClick={exportInsights}
              style={{ background: GOLD_COLOR, color: '#000' }}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setSelectedCategory('all')}
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              style={{
                background: selectedCategory === 'all' ? GOLD_COLOR : `${GOLD_COLOR}20`,
                color: selectedCategory === 'all' ? '#000' : GOLD_COLOR,
                borderColor: `${GOLD_COLOR}40`,
              }}
            >
              Todas as Categorias
            </Button>
            <Button
              onClick={() => setSelectedCategory('financial')}
              variant={selectedCategory === 'financial' ? 'default' : 'outline'}
              style={{
                background: selectedCategory === 'financial' ? '#10b981' : '#10b98120',
                color: selectedCategory === 'financial' ? '#000' : '#10b981',
                borderColor: '#10b98140',
              }}
            >
              💰 Financeiro
            </Button>
            <Button
              onClick={() => setSelectedCategory('sales')}
              variant={selectedCategory === 'sales' ? 'default' : 'outline'}
              style={{
                background: selectedCategory === 'sales' ? GOLD_COLOR : `${GOLD_COLOR}20`,
                color: selectedCategory === 'sales' ? '#000' : GOLD_COLOR,
                borderColor: `${GOLD_COLOR}40`,
              }}
            >
              📊 Vendas
            </Button>
            <Button
              onClick={() => setSelectedCategory('administrative')}
              variant={selectedCategory === 'administrative' ? 'default' : 'outline'}
              style={{
                background: selectedCategory === 'administrative' ? '#06a0d8' : '#06a0d820',
                color: selectedCategory === 'administrative' ? '#000' : '#06a0d8',
                borderColor: '#06a0d840',
              }}
            >
              ⚙️ Administrativo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-3">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight) => (
            <Card
              key={insight.id}
              style={{
                background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`,
                borderColor: `${getImportanceColor(insight.importance)}40`,
              }}
              className="border-2 hover:shadow-lg transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="text-3xl">{getCategoryIcon(insight.category)}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Page & Time */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: `${GOLD_COLOR}20`, color: GOLD_COLOR }}>
                            {insight.page}
                          </span>
                          <span className="text-xs text-gray-400">{insight.timestamp.toLocaleString('pt-BR')}</span>
                          {insight.actionable && (
                            <span className="px-2 py-1 rounded text-xs font-semibold flex items-center gap-1" style={{ background: '#10b98120', color: '#10b981' }}>
                              <AlertCircle className="h-3 w-3" />
                              Acionável
                            </span>
                          )}
                        </div>

                        {/* Question */}
                        <div className="text-sm font-semibold text-white mb-2">❓ {insight.question}</div>

                        {/* Analysis */}
                        <div className="text-sm text-gray-300 leading-relaxed">{insight.analysis}</div>
                      </div>

                      {/* Importance Badge */}
                      <div className="flex-shrink-0">
                        <div
                          className="px-3 py-1 rounded font-semibold text-sm"
                          style={{
                            background: `${getImportanceColor(insight.importance)}20`,
                            color: getImportanceColor(insight.importance),
                            border: `1px solid ${getImportanceColor(insight.importance)}40`,
                          }}
                        >
                          {insight.importance === 'high' && '🔴 Alta'}
                          {insight.importance === 'medium' && '🟡 Média'}
                          {insight.importance === 'low' && '🟢 Baixa'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    onClick={() => deleteInsight(insight.id)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
            <CardContent className="pt-6 text-center py-12">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">Nenhum insight encontrado</p>
              <p className="text-sm text-gray-500">Comece a fazer perguntas no bot para gerar análises</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Stats */}
      <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <div className="font-semibold mb-1" style={{ color: GOLD_COLOR }}>
                Insight Mais Recente
              </div>
              <div>
                {filteredInsights.length > 0 ? filteredInsights[0].timestamp.toLocaleTimeString('pt-BR') : 'N/A'}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: GOLD_COLOR }}>
                Taxa de Acionabilidade
              </div>
              <div>
                {filteredInsights.length > 0
                  ? `${Math.round((filteredInsights.filter((i) => i.actionable).length / filteredInsights.length) * 100)}%`
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: GOLD_COLOR }}>
                Recomendação
              </div>
              <div>Continue fazendo perguntas ao bot para gerar mais insights</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
