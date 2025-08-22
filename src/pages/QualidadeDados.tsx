import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Settings, Database, FileText, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QualityMetric {
  name: string
  score: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  issues: number
  description: string
}

interface DataField {
  name: string
  type: string
  nullable: boolean
  completeness: number
  validity: number
  uniqueness: number
  issues: string[]
}

export default function QualidadeDados() {
  const [selectedTable, setSelectedTable] = useState('aberturas_contas')

  // Mock quality metrics
  const qualityMetrics: QualityMetric[] = [
    {
      name: 'Completude',
      score: 87,
      status: 'good',
      issues: 3,
      description: 'Percentual de campos preenchidos'
    },
    {
      name: 'Validade',
      score: 92,
      status: 'excellent',
      issues: 1,
      description: 'Dados seguem formato esperado'
    },
    {
      name: 'Consistência',
      score: 75,
      status: 'warning',
      issues: 8,
      description: 'Consistência entre tabelas relacionadas'
    },
    {
      name: 'Unicidade',
      score: 98,
      status: 'excellent',
      issues: 0,
      description: 'Ausência de duplicatas indevidas'
    },
    {
      name: 'Atualidade',
      score: 65,
      status: 'critical',
      issues: 12,
      description: 'Dados atualizados recentemente'
    },
    {
      name: 'Integridade',
      score: 89,
      status: 'good',
      issues: 2,
      description: 'Integridade referencial mantida'
    }
  ]

  // Mock field analysis
  const dataFields: DataField[] = [
    {
      name: 'matricula',
      type: 'text',
      nullable: true,
      completeness: 95,
      validity: 100,
      uniqueness: 85,
      issues: ['Algumas matrículas duplicadas']
    },
    {
      name: 'data_formalizacao',
      type: 'date',
      nullable: false,
      completeness: 100,
      validity: 98,
      uniqueness: 100,
      issues: ['2% das datas em formato inválido']
    },
    {
      name: 'tipo_documento',
      type: 'text',
      nullable: true,
      completeness: 87,
      validity: 92,
      uniqueness: 100,
      issues: ['13% dos registros sem tipo', 'Valores não padronizados']
    },
    {
      name: 'valor_parcela',
      type: 'numeric',
      nullable: true,
      completeness: 78,
      validity: 95,
      uniqueness: 100,
      issues: ['22% sem valor', '5% com valores negativos']
    },
    {
      name: 'canal',
      type: 'text',
      nullable: true,
      completeness: 65,      
      validity: 88,
      uniqueness: 100,
      issues: ['35% sem canal definido', 'Variações de nomenclatura']
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success'
      case 'good': return 'text-primary'
      case 'warning': return 'text-warning'
      case 'critical': return 'text-danger'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-success" />
      case 'good': return <CheckCircle className="h-4 w-4 text-primary" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'critical': return <XCircle className="h-4 w-4 text-danger" />
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const overallScore = Math.round(qualityMetrics.reduce((sum, metric) => sum + metric.score, 0) / qualityMetrics.length)
  const totalIssues = qualityMetrics.reduce((sum, metric) => sum + metric.issues, 0)

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <Shield className="h-6 w-6 text-primary" />
            Qualidade de Dados
          </h1>
          <p className="section-subtitle">
            Monitoramento e análise da qualidade dos dados do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`border-${overallScore >= 90 ? 'success' : overallScore >= 80 ? 'warning' : 'danger'}/20 text-${overallScore >= 90 ? 'success' : overallScore >= 80 ? 'warning' : 'danger'}`}>
            <Shield className="h-3 w-3 mr-1" />
            Score: {overallScore}%
          </Badge>
          <Badge variant="outline" className="border-warning/20 text-warning">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {totalIssues} problemas
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Overall Quality Score */}
      <section>
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Score Geral de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getStatusColor(overallScore >= 90 ? 'excellent' : overallScore >= 80 ? 'good' : overallScore >= 70 ? 'warning' : 'critical')}`}>
                  {overallScore}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">Score Geral</p>
              </div>
              <div className="flex-1 space-y-4">
                {qualityMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32">
                      {getStatusIcon(metric.status)}
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={metric.score} 
                        className="h-2"
                      />
                    </div>
                    <div className="text-right w-16">
                      <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                        {metric.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quality Metrics Details */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qualityMetrics.map((metric, index) => (
          <Card key={index} className="kpi-card">
            <CardContent className="kpi-content">
              <div className={`kpi-icon bg-${metric.status === 'excellent' ? 'success' : metric.status === 'good' ? 'primary' : metric.status === 'warning' ? 'warning' : 'danger'}/10`}>
                {getStatusIcon(metric.status)}
              </div>
              <div>
                <p className="kpi-label">{metric.name}</p>
                <p className="kpi-value">{metric.score}%</p>
                <p className={`kpi-change ${getStatusColor(metric.status)}`}>
                  {metric.issues > 0 ? `${metric.issues} problemas` : 'Sem problemas'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Detailed Analysis */}
      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fields">Análise por Campo</TabsTrigger>
          <TabsTrigger value="issues">Problemas Identificados</TabsTrigger>
          <TabsTrigger value="dictionary">Dicionário de Dados</TabsTrigger>
        </TabsList>

        {/* Field Analysis */}
        <TabsContent value="fields" className="space-y-6">
          <Card className="chart-container">
            <CardHeader className="chart-toolbar">
              <div>
                <CardTitle className="chart-title">Análise por Campo</CardTitle>
                <p className="chart-subtitle">Qualidade individual dos campos de dados</p>
              </div>
              <Badge variant="outline">Tabela: {selectedTable}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataFields.map((field, index) => (
                  <div key={index} className="p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{field.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        {!field.nullable && (
                          <Badge variant="secondary" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Completude</p>
                        <div className="flex items-center gap-2">
                          <Progress value={field.completeness} className="h-1 flex-1" />
                          <span className="text-xs font-medium w-10">{field.completeness}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Validade</p>
                        <div className="flex items-center gap-2">
                          <Progress value={field.validity} className="h-1 flex-1" />
                          <span className="text-xs font-medium w-10">{field.validity}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unicidade</p>
                        <div className="flex items-center gap-2">
                          <Progress value={field.uniqueness} className="h-1 flex-1" />
                          <span className="text-xs font-medium w-10">{field.uniqueness}%</span>
                        </div>
                      </div>
                    </div>

                    {field.issues.length > 0 && (
                      <div className="space-y-1">
                        {field.issues.map((issue, issueIndex) => (
                          <Alert key={issueIndex} variant="destructive" className="py-2">
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription className="text-sm">{issue}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <Card className="chart-container">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Problemas Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atualidade:</strong> 35% dos dados de canal não foram atualizados nos últimos 30 dias
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Completude:</strong> 22% dos registros não possuem valor de parcela definido
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Consistência:</strong> Variações na nomenclatura de tipos de documento entre tabelas
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Dictionary */}
        <TabsContent value="dictionary" className="space-y-6">
          <Card className="chart-container">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dicionário de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="zero-state">
                <Database className="zero-state-icon" />
                <h3 className="zero-state-title">Dicionário em Desenvolvimento</h3>
                <p className="zero-state-description">
                  O dicionário completo de dados será disponibilizado em breve
                </p>
                <Button className="mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Dicionário
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}