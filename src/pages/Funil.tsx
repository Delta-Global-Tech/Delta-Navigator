import { Users, TrendingDown, Database, MessageSquare, FileText, CheckCircle, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getFunilData, getFunilKPIs, getFunilDataByStep, getFunilStatus } from "@/data/postgres"
import { useState, useMemo, useRef, useEffect } from "react"
import * as XLSX from 'xlsx'
import { useAutoRefresh } from "@/hooks/useAutoRefresh"
import { useSync } from "@/providers/sync-provider"

export default function FunilPage() {
  const { updateSync, setRefreshing } = useSync()
  
  // Ref para armazenar dados anteriores para comparação
  const previousDataRef = useRef<any>(null)
  
  // Estado para filtro de produto
  const [selectedProduct, setSelectedProduct] = useState<string>("todos")
  // Estado para filtro de status
  const [selectedStatus, setSelectedStatus] = useState<string>("todos")
  // Estado para etapa selecionada (null = todas as etapas)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  // Buscar status disponíveis
  const { data: statusList = [], refetch: refetchStatus } = useQuery({
    queryKey: ['funil-status'],
    queryFn: getFunilStatus,
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  })

  // Buscar dados do funil (geral ou por etapa)
  const { data: funilData, isLoading: funilLoading, refetch: refetchFunil } = useQuery({
    queryKey: ['funil-data', selectedProduct, selectedStatus, selectedStep],
    queryFn: () => {
      const produto = selectedProduct === "todos" ? "" : selectedProduct
      const status = selectedStatus === "todos" ? "" : selectedStatus
      
      if (selectedStep !== null) {
        return getFunilDataByStep(selectedStep, produto, status)
      } else {
        return getFunilData(produto, status)
      }
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  })

  // Buscar KPIs do funil
  const { data: kpisData, isLoading: kpisLoading, refetch: refetchKpis } = useQuery({
    queryKey: ['funil-kpis', selectedProduct, selectedStatus],
    queryFn: () => {
      const produto = selectedProduct === "todos" ? "" : selectedProduct
      const status = selectedStatus === "todos" ? "" : selectedStatus
      return getFunilKPIs(produto, status)
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  })

  // Atualizar sync quando dados mudarem
  useEffect(() => {
    if (funilData) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[Funil] Dados do funil atualizados:', timestamp);
      updateSync(timestamp);
    }
  }, [funilData, updateSync]);

  useEffect(() => {
    if (kpisData) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR');
      console.log('[Funil] KPIs do funil atualizados:', timestamp);
      updateSync(timestamp);
    }
  }, [kpisData, updateSync]);

  // Atualizar estado de refreshing
  useEffect(() => {
    setRefreshing(funilLoading || kpisLoading);
  }, [funilLoading, kpisLoading, setRefreshing]);

  // Função para atualizar todos os dados
  const refreshAllData = async () => {
    setRefreshing(true)
    try {
      const results = await Promise.all([
        refetchStatus(),
        refetchFunil(),
        refetchKpis()
      ])
      
      // Combinar todos os dados para comparação
      const newData = {
        status: results[0].data,
        funil: results[1].data,
        kpis: results[2].data
      }
      
      // Comparar com dados anteriores
      const hasNewData = !previousDataRef.current || 
        JSON.stringify(previousDataRef.current) !== JSON.stringify(newData)
      
      if (hasNewData) {
        previousDataRef.current = newData
        const now = new Date()
        updateSync(now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }))
      }
      
      return { hasNewData }
    } catch (error) {
      console.error('Erro ao atualizar dados do funil:', error)
      return { hasNewData: false }
    } finally {
      setRefreshing(false)
    }
  }

  // Auto-refresh configurado para 30 segundos
  useAutoRefresh({
    onRefresh: refreshAllData,
    interval: 30000, // 30 segundos
    enabled: true
  })

  const isLoading = funilLoading || kpisLoading
  const totalClients = Number(kpisData?.total_clients) || 0

  // Dados do funil com taxa de conversão
  const funnelData = useMemo(() => {
    if (!kpisData) return []
    
    const steps = [
      { name: 'Pré-Registro', stepId: 1, value: Number(kpisData.pre_registro) || 0, color: '#ac7b39' },
      { name: 'Site', stepId: 2, value: Number(kpisData.site) || 0, color: '#d4a574' },
      { name: 'WhatsApp', stepId: 9, value: Number(kpisData.whatsapp) || 0, color: '#2563eb' },
      { name: 'Download FGTS', stepId: 3, value: Number(kpisData.download_fgts) || 0, color: '#16a34a' },
      { name: 'App Autorizado', stepId: 4, value: Number(kpisData.app_autorizado) || 0, color: '#dc2626' },
      { name: 'Simulação', stepId: 5, value: Number(kpisData.simulacao) || 0, color: '#7c3aed' },
      { name: 'Registro Completo', stepId: 6, value: Number(kpisData.registro_completo) || 0, color: '#ea580c' }
    ]
    
    return steps.map((step, index) => ({
      ...step,
      percentage: totalClients > 0 ? ((step.value / totalClients) * 100).toFixed(1) : '0',
      conversionRate: index > 0 && steps[index-1].value > 0 ? 
        ((step.value / steps[index-1].value) * 100).toFixed(1) : '100'
    }))
  }, [kpisData, totalClients])

  // Função para lidar com clique nas etapas
  const handleStepClick = (stepId: number) => {
    if (selectedStep === stepId) {
      // Se já está selecionado, desselecionar (mostrar todos)
      setSelectedStep(null)
    } else {
      // Selecionar a etapa clicada
      setSelectedStep(stepId)
    }
  }

  // Função para obter o nome da etapa selecionada
  const getSelectedStepName = () => {
    if (selectedStep === null) return "Todos os Registros"
    const step = funnelData.find(s => s.stepId === selectedStep)
    return step ? `${step.name} (${step.value} registros)` : "Etapa Selecionada"
  }

  // Função para exportar dados para Excel
  const exportToExcel = () => {
    if (!funilData || funilData.length === 0) {
      alert('Não há dados para exportar')
      return
    }

    // Preparar dados para exportação
    const exportData = funilData.map((item: any) => ({
      'Nome': item.Nome || '',
      'Documento': item.Documento || '',
      'Telefone': item.Telefone || '',
      'Status': item.Status || '',
      'Produto': item.produto_nome || ''
    }))

    // Criar workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Definir larguras das colunas
    const columnWidths = [
      { wch: 30 }, // Nome
      { wch: 15 }, // Documento
      { wch: 15 }, // Telefone
      { wch: 15 }, // Status
      { wch: 20 }  // Produto
    ]
    worksheet['!cols'] = columnWidths

    // Adicionar worksheet ao workbook
    const sheetName = selectedStep !== null ? 
      `Funil_${funnelData.find(s => s.stepId === selectedStep)?.name?.replace(/\s+/g, '_') || 'Etapa'}` : 
      'Funil_Todos_Registros'
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Gerar nome do arquivo
    const fileName = `funil_conversao_${new Date().toISOString().split('T')[0]}.xlsx`

    // Fazer download
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Funil de Conversão</h1>
          <p className="text-muted-foreground">
            Análise do funil de vendas e conversão por etapas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtro de Produto */}
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os produtos</SelectItem>
              <SelectItem value="juros_baixos">Juros Baixos</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Status */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {statusList.map((status: string) => (
                <SelectItem key={status} value={status}>
                  {status || 'Sem Status'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botão de Exportar */}
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
            disabled={!funilData || funilData.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          
          <Badge variant="outline" className="px-3 py-1">
            <Database className="h-3 w-3 mr-1" />
            PostgreSQL
          </Badge>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  {totalClients.toLocaleString("pt-BR")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes únicos no funil
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizações</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  {(() => {
                    // Contar clientes com status FINALIZADO nos dados filtrados
                    const finalizados = funilData ? funilData.filter((item: any) => item.Status === 'FINALIZADO').length : 0;
                    return finalizados.toLocaleString("pt-BR");
                  })()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes com status FINALIZADO
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  {(() => {
                    // Calcular taxa de conversão: Finalizados / Total de Clientes
                    const finalizados = funilData ? funilData.filter((item: any) => item.Status === 'FINALIZADO').length : 0;
                    const taxa = totalClients > 0 ? ((finalizados / totalClients) * 100).toFixed(1) : "0";
                    return taxa + "%";
                  })()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Finalizações / Total de Clientes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil e Tabela lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Funil de Conversão */}
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {funnelData.map((step, index) => {
                    const maxValue = Math.max(...funnelData.map(d => d.value));
                    const widthPercent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
                    const isSelected = selectedStep === step.stepId;
                    
                    return (
                      <div key={step.name} className="flex items-center space-x-3">
                        {/* Nome da etapa */}
                        <div className="w-24 text-xs text-white text-right font-medium">
                          {step.name}
                        </div>
                        
                        {/* Barra do funil */}
                        <div className="flex-1 relative">
                          <div 
                            className={`h-8 rounded-lg transition-all duration-700 flex items-center justify-between px-3 shadow-lg cursor-pointer hover:opacity-80 ${
                              isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                            }`}
                            style={{ 
                              backgroundColor: step.color,
                              width: `${Math.max(widthPercent, 20)}%`,
                              minWidth: '80px',
                              background: isSelected 
                                ? `linear-gradient(135deg, ${step.color}, ${step.color}cc)` 
                                : `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
                              transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                            }}
                            onClick={() => handleStepClick(step.stepId)}
                            title={`Clique para filtrar registros de ${step.name}`}
                          >
                            <span className="text-white font-bold text-xs">
                              {step.value.toLocaleString("pt-BR")}
                            </span>
                            <div className="text-white text-xs flex flex-col items-end">
                              <span className="font-semibold">{step.percentage}%</span>
                              {index > 0 && (
                                <span className="opacity-90">
                                  ↓{step.conversionRate}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="mt-4 text-xs text-muted-foreground text-center border-t pt-3">
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold text-[#ac7b39]">% Total:</span> Em relação ao total
                  </div>
                  <div>
                    <span className="font-semibold text-[#ac7b39]">↓%:</span> Conversão da etapa anterior
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Dados */}
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {getSelectedStepName()}
              {selectedStep !== null && (
                <button
                  onClick={() => setSelectedStep(null)}
                  className="ml-2 px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                  title="Mostrar todos os registros"
                >
                  ✕ Limpar Filtro
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : funilData && funilData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Produto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funilData.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.Nome}</TableCell>
                      <TableCell>{item.Documento}</TableCell>
                      <TableCell>{item.Telefone}</TableCell>
                      <TableCell>
                        {item.Status ? (
                          <Badge 
                            variant={
                              item.Status === 'FINALIZADO' ? 'default' : 
                              item.Status === 'EM_ANDAMENTO' ? 'secondary' : 
                              item.Status === 'PENDENTE' ? 'outline' : 
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {item.Status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem status</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {item.produto_nome}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-slate-500">Nenhum dado disponível</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
