import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Bell, TrendingDown, TrendingUp, Flame } from 'lucide-react'
import { toast } from 'sonner'

interface Alert {
  id: string
  type: 'anomaly' | 'efficiency' | 'threshold' | 'warning'
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'active' | 'resolved' | 'ignored'
  timestamp: Date
  page: string
  recommendation?: string
  value?: string
  threshold?: string
}

export default function AutoAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const GOLD_COLOR = '#C48A3F'
  const DARK_BG = '#06162B'

  // Simular alertas de anomalias
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'anomaly',
        title: '🚨 Despesa Anormalmente Alta',
        description: 'Despesa de R$ 450.000 detectada - 180% acima da média mensal',
        severity: 'critical',
        status: 'active',
        timestamp: new Date(Date.now() - 300000),
        page: 'Extrato Financeiro',
        recommendation: 'Verifique autorização desta despesa com financeiro',
        value: 'R$ 450.000',
        threshold: 'R$ 250.000 (média)',
      },
      {
        id: '2',
        type: 'efficiency',
        title: '⚡ Eficiência de Liberação Baixa',
        description: 'Média de 5.2 dias - acima do padrão de 2.5 dias',
        severity: 'high',
        status: 'active',
        timestamp: new Date(Date.now() - 1800000),
        page: 'Desembolso',
        recommendation: 'Investigar atrasos no fluxo de aprovação',
        value: '5.2 dias',
        threshold: '2.5 dias',
      },
      {
        id: '3',
        type: 'threshold',
        title: '📉 Taxa de Conversão Caiu',
        description: 'Taxa reduzida para 42% vs 58% do mês anterior',
        severity: 'high',
        status: 'active',
        timestamp: new Date(Date.now() - 3600000),
        page: 'Propostas',
        recommendation: 'Revisar propostas rejeitadas para identificar padrões',
        value: '42%',
        threshold: '58% (anterior)',
      },
      {
        id: '4',
        type: 'warning',
        title: '⚠️ Proposta Parada há Muito Tempo',
        description: 'Proposta #1847 aguardando aprovação há 12 dias',
        severity: 'medium',
        status: 'active',
        timestamp: new Date(Date.now() - 7200000),
        page: 'Propostas',
        recommendation: 'Fazer follow-up com aprovador responsável',
        value: '12 dias',
        threshold: '5 dias (SLA)',
      },
      {
        id: '5',
        type: 'anomaly',
        title: '💰 Receita Caiu',
        description: 'Receita de R$ 3.2M vs R$ 4.7M do mês anterior (-32%)',
        severity: 'high',
        status: 'resolved',
        timestamp: new Date(Date.now() - 86400000),
        page: 'Extrato Financeiro',
        recommendation: 'Aumentar esforço de cobrança no período',
        value: 'R$ 3.2M',
        threshold: 'R$ 4.7M (anterior)',
      },
    ]

    setAlerts(mockAlerts)
    setFilteredAlerts(mockAlerts)
  }, [])

  // Filtrar alertas
  useEffect(() => {
    let filtered = alerts

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter((alert) => alert.severity === selectedSeverity)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((alert) => alert.status === selectedStatus)
    }

    setFilteredAlerts(filtered)
  }, [selectedSeverity, selectedStatus, alerts])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: '#ef444420', border: '#ef4444', text: '#ef4444', label: '🔴 Crítico' }
      case 'high':
        return { bg: '#f97316b0', border: '#f97316', text: '#f97316', label: '🟠 Alto' }
      case 'medium':
        return { bg: `${GOLD_COLOR}20`, border: GOLD_COLOR, text: GOLD_COLOR, label: '🟡 Médio' }
      case 'low':
        return { bg: '#10b98120', border: '#10b981', text: '#10b981', label: '🟢 Baixo' }
      default:
        return { bg: `${GOLD_COLOR}20`, border: GOLD_COLOR, text: GOLD_COLOR, label: 'Outro' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🔔'
      case 'resolved':
        return '✅'
      case 'ignored':
        return '⏭️'
      default:
        return '❓'
    }
  }

  const markAsResolved = (id: string) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, status: 'resolved' } : alert)))
    toast.success('Alerta marcado como resolvido')
  }

  const markAsIgnored = (id: string) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, status: 'ignored' } : alert)))
    toast.info('Alerta ignorado')
  }

  const activeCount = alerts.filter((a) => a.status === 'active').length
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-8 w-8" style={{ color: GOLD_COLOR }} />
            <h1 className="text-3xl font-bold text-white">Auto-Alert System</h1>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: `${DARK_BG}cc`, border: `1px solid ${GOLD_COLOR}40` }}>
            <span className="text-sm text-gray-400">Alertas Ativados</span>
            <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
          </div>
        </div>
        <p className="text-gray-400">Monitoramento automático de anomalias e desvios em tempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Alertas Ativos</div>
            <div className="text-3xl font-bold mt-2" style={{ color: '#ef4444' }}>
              {activeCount}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: '#ef444040' }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Críticos</div>
            <div className="text-3xl font-bold mt-2" style={{ color: '#ef4444' }}>
              {criticalCount}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: '#10b98140' }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Resolvidos</div>
            <div className="text-3xl font-bold mt-2" style={{ color: '#10b981' }}>
              {alerts.filter((a) => a.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-400">Total de Alertas</div>
            <div className="text-3xl font-bold mt-2" style={{ color: GOLD_COLOR }}>
              {alerts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por Severidade</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setSelectedSeverity('all')}
                  style={{
                    background: selectedSeverity === 'all' ? GOLD_COLOR : `${DARK_BG}cc`,
                    color: selectedSeverity === 'all' ? '#000' : 'white',
                    border: `1px solid ${GOLD_COLOR}40`,
                  }}
                >
                  Todos
                </Button>
                <Button
                  onClick={() => setSelectedSeverity('critical')}
                  style={{
                    background: selectedSeverity === 'critical' ? '#ef4444' : '#ef444420',
                    color: selectedSeverity === 'critical' ? '#fff' : '#ef4444',
                    border: `1px solid #ef444440`,
                  }}
                >
                  🔴 Crítico
                </Button>
                <Button
                  onClick={() => setSelectedSeverity('high')}
                  style={{
                    background: selectedSeverity === 'high' ? '#f97316' : '#f9731620',
                    color: selectedSeverity === 'high' ? '#fff' : '#f97316',
                    border: `1px solid #f9731640`,
                  }}
                >
                  🟠 Alto
                </Button>
                <Button
                  onClick={() => setSelectedSeverity('medium')}
                  style={{
                    background: selectedSeverity === 'medium' ? GOLD_COLOR : `${GOLD_COLOR}20`,
                    color: selectedSeverity === 'medium' ? '#000' : GOLD_COLOR,
                    border: `1px solid ${GOLD_COLOR}40`,
                  }}
                >
                  🟡 Médio
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por Status</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setSelectedStatus('all')}
                  style={{
                    background: selectedStatus === 'all' ? GOLD_COLOR : `${DARK_BG}cc`,
                    color: selectedStatus === 'all' ? '#000' : 'white',
                    border: `1px solid ${GOLD_COLOR}40`,
                  }}
                >
                  Todos
                </Button>
                <Button
                  onClick={() => setSelectedStatus('active')}
                  style={{
                    background: selectedStatus === 'active' ? '#ef4444' : '#ef444420',
                    color: selectedStatus === 'active' ? '#fff' : '#ef4444',
                    border: `1px solid #ef444440`,
                  }}
                >
                  🔔 Ativos
                </Button>
                <Button
                  onClick={() => setSelectedStatus('resolved')}
                  style={{
                    background: selectedStatus === 'resolved' ? '#10b981' : '#10b98120',
                    color: selectedStatus === 'resolved' ? '#000' : '#10b981',
                    border: `1px solid #10b98140`,
                  }}
                >
                  ✅ Resolvidos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const severityColor = getSeverityColor(alert.severity)
            return (
              <Card
                key={alert.id}
                style={{
                  background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`,
                  borderColor: `${severityColor.border}40`,
                }}
                className="border-2 hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Severity Icon */}
                    <div className="flex-shrink-0 pt-1">
                      {alert.severity === 'critical' && <Flame className="h-8 w-8 text-red-500" />}
                      {alert.severity === 'high' && <AlertCircle className="h-8 w-8 text-orange-500" />}
                      {alert.severity === 'medium' && <TrendingDown className="h-8 w-8" style={{ color: GOLD_COLOR }} />}
                      {alert.severity === 'low' && <TrendingUp className="h-8 w-8 text-green-500" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{alert.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{alert.description}</p>
                        </div>
                        <div
                          className="px-3 py-1 rounded font-semibold text-sm flex-shrink-0"
                          style={{
                            background: severityColor.bg,
                            color: severityColor.text,
                            border: `1px solid ${severityColor.border}40`,
                          }}
                        >
                          {severityColor.label}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500">Página</span>
                          <p className="text-white font-semibold">{alert.page}</p>
                        </div>
                        {alert.value && (
                          <div>
                            <span className="text-gray-500">Valor Atual</span>
                            <p className="text-white font-semibold">{alert.value}</p>
                          </div>
                        )}
                        {alert.threshold && (
                          <div>
                            <span className="text-gray-500">Limite/Meta</span>
                            <p className="text-white font-semibold">{alert.threshold}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Horário</span>
                          <p className="text-white font-semibold">{alert.timestamp.toLocaleTimeString('pt-BR')}</p>
                        </div>
                      </div>

                      {/* Recommendation */}
                      {alert.recommendation && (
                        <div className="p-3 rounded-lg mb-3" style={{ background: `${severityColor.border}15`, borderLeft: `3px solid ${severityColor.border}` }}>
                          <p className="text-sm text-white">
                            <strong>💡 Recomendação:</strong> {alert.recommendation}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: `${DARK_BG}cc` }}>
                        {alert.status === 'active' && (
                          <>
                            <Button
                              onClick={() => markAsResolved(alert.id)}
                              size="sm"
                              style={{
                                background: '#10b98120',
                                color: '#10b981',
                                border: '1px solid #10b98140',
                              }}
                              className="hover:bg-green-500/30"
                            >
                              ✅ Resolver
                            </Button>
                            <Button
                              onClick={() => markAsIgnored(alert.id)}
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-gray-300"
                            >
                              ⏭️ Ignorar
                            </Button>
                          </>
                        )}
                        {alert.status === 'resolved' && <span className="text-sm text-green-400">✅ Resolvido</span>}
                        {alert.status === 'ignored' && <span className="text-sm text-gray-400">⏭️ Ignorado</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
            <CardContent className="pt-6 text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">Nenhum alerta encontrado</p>
              <p className="text-sm text-gray-500">Sistema monitorando continuamente...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Info */}
      <Card style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }} className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              <strong style={{ color: GOLD_COLOR }}>🔔 Sistema Ativo:</strong> Monitorando continuamente todas as páginas financeiras
            </p>
            <p>
              <strong style={{ color: GOLD_COLOR }}>📊 Detecção:</strong> Anomalias em despesas, receitas, eficiência e SLAs
            </p>
            <p>
              <strong style={{ color: GOLD_COLOR }}>⏰ Atualizações:</strong> Em tempo real conforme dados são inseridos
            </p>
            <p>
              <strong style={{ color: GOLD_COLOR }}>💡 Recomendações:</strong> Cada alerta vem com ação recomendada
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
