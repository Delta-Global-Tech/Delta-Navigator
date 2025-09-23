import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Filter, Calendar, DollarSign, FileText, Download, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { useAutoRefresh } from "@/hooks/useAutoRefresh"
import { useSync } from "@/providers/sync-provider"
import { getApiEndpoint, logApiCall } from "@/lib/api-config"

export default function ProducaoAnalytics() {
  const { updateSync, setRefreshing } = useSync()
  
  // Estados básicos
  const [startDate, setStartDate] = useState('2025-01-01')
  const [endDate, setEndDate] = useState('2025-09-22')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true) // Começa como true para mostrar loading inicial
  const [selectedStatus, setSelectedStatus] = useState(null) // Novo estado para status selecionado
  const [contractDetails, setContractDetails] = useState([]) // Novo estado para detalhes dos contratos (array vazio por padrão)
  const [loadingDetails, setLoadingDetails] = useState(false) // Loading para detalhes dos contratos
  
  // Novos estados para filtros
  const [selectedBanco, setSelectedBanco] = useState('')
  const [selectedEquipe, setSelectedEquipe] = useState('')
  const [bancos, setBancos] = useState([])
  const [equipes, setEquipes] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Função para formatar valores dinamicamente
  const formatValue = (value) => {
    if (!value || value === 0) return 'R$ 0'
    
    const absValue = Math.abs(value)
    
    if (absValue >= 1000000000) {
      return `R$ ${(value / 1000000000).toFixed(1)}B`
    } else if (absValue >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    } else {
      return `R$ ${value.toFixed(0)}`
    }
  }

  // CSS para cursor pointer nas barras do gráfico
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .recharts-bar-rectangle {
        cursor: pointer !important;
      }
      .recharts-bar-rectangle:hover {
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Função para buscar dados
  const fetchData = async (customStartDate?: string, customEndDate?: string) => {
    setLoading(true)
    setRefreshing(true)
    
    const params = new URLSearchParams()
    params.append('startDate', customStartDate || startDate)
    params.append('endDate', customEndDate || endDate)
    
    // Adicionar filtros de banco e equipe
    if (selectedBanco) params.append('banco', selectedBanco)
    if (selectedEquipe) params.append('equipe', selectedEquipe)
    
    const url = getApiEndpoint('SQLSERVER', `/api/producao/status-analysis?${params.toString()}`)
    console.log('🔍 Buscando análise:', url)
    logApiCall(url, 'REQUEST')
    console.log('🏦 Filtros ativos - Banco:', selectedBanco, 'Equipe:', selectedEquipe)
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
      console.log('Dados recebidos:', result)
      logApiCall(url, 'SUCCESS')
      
      // Atualizar indicador de sincronização
      const now = new Date()
      updateSync(now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
      
      return { hasNewData: true } // Sempre retorna hasNewData: true
    } catch (error) {
      console.error('Erro:', error)
      logApiCall(url, 'ERROR')
      alert('Erro ao carregar dados: ' + error.message)
      return { hasNewData: false }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Auto-refresh configurado para 30 segundos
  const { executeRefresh } = useAutoRefresh({
    onRefresh: fetchData,
    interval: 30000, // 30 segundos
    enabled: true
  })

  // Carregar dados automaticamente quando o componente montar
  useEffect(() => {
    loadFiltersData()
  }, []) // Array vazio para executar apenas uma vez

  // Recarregar dados quando filtros de banco ou equipe mudarem
  useEffect(() => {
    if (bancos.length > 0 || equipes.length > 0) { // Só recarrega se os filtros já foram carregados
      executeRefresh()
    }
  }, [selectedBanco, selectedEquipe]) // Dependências dos filtros

  // Função para carregar dados dos filtros (bancos e equipes)
  const loadFiltersData = async () => {
    setLoadingFilters(true)
    try {
      // Carregar bancos
      const bancosUrl = getApiEndpoint('SQLSERVER', '/api/producao/bancos')
      const bancosResponse = await fetch(bancosUrl)
      if (bancosResponse.ok) {
        const bancosData = await bancosResponse.json()
        setBancos(bancosData)
      }

      // Carregar equipes
      const equipesUrl = getApiEndpoint('SQLSERVER', '/api/producao/equipes')
      const equipesResponse = await fetch(equipesUrl)
      if (equipesResponse.ok) {
        const equipesData = await equipesResponse.json()
        setEquipes(equipesData)
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error)
    } finally {
      setLoadingFilters(false)
    }
  }

  // Função para refiltrar dados quando mudarem as datas ou filtros
  const handleFilterChange = () => {
    executeRefresh()
    if (selectedStatus) {
      if (selectedStatus === 'ALL') {
        fetchAllContracts()
      } else {
        fetchContractDetails(selectedStatus)
      }
    }
  }

  // Função para buscar detalhes dos contratos por status
  const fetchContractDetails = async (status) => {
    setLoadingDetails(true)
    
    const params = new URLSearchParams()
    params.append('startDate', startDate)
    params.append('endDate', endDate)
    if (status) params.append('status', status)
    if (selectedBanco) params.append('banco', selectedBanco)
    if (selectedEquipe) params.append('equipe', selectedEquipe)
    
    const url = getApiEndpoint('SQLSERVER', `/api/producao/status-details?${params.toString()}`)
    console.log('🔍 Buscando detalhes:', url)
    logApiCall(url, 'REQUEST')
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      setContractDetails(result)
      console.log('Detalhes recebidos:', result)
      logApiCall(url, 'SUCCESS')
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      logApiCall(url, 'ERROR')
      setContractDetails([]) // Definir array vazio em caso de erro
      alert('Erro ao carregar detalhes: ' + error.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Função para buscar todos os contratos
  const fetchAllContracts = async () => {
    setLoadingDetails(true)
    
    const params = new URLSearchParams()
    params.append('startDate', startDate)
    params.append('endDate', endDate)
    params.append('limit', '500')
    if (selectedBanco) params.append('banco', selectedBanco)
    if (selectedEquipe) params.append('equipe', selectedEquipe)
    
    const url = getApiEndpoint('SQLSERVER', `/api/producao/status-details?${params.toString()}`)
    console.log('🔍 Buscando todos os contratos:', url)
    logApiCall(url, 'REQUEST')
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      setContractDetails(result)
      console.log('Todos os contratos recebidos:', result)
      logApiCall(url, 'SUCCESS')
    } catch (error) {
      console.error('Erro ao buscar todos os contratos:', error)
      logApiCall(url, 'ERROR')
      setContractDetails([])
      alert('Erro ao carregar contratos: ' + error.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Função para lidar com clique no gráfico (similar ao extrato)
  const handleChartClick = (data, index) => {
    console.log('Clique no gráfico detectado:', data)
    
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedStatus = data.activePayload[0].payload.originalStatus
      console.log('Status clicado:', clickedStatus)
      
      // Toggle: se já está filtrado pelo mesmo status, remove o filtro
      if (selectedStatus === clickedStatus) {
        clearSelection()
      } else {
        setSelectedStatus(clickedStatus)
        fetchContractDetails(clickedStatus)
      }
    } else {
      console.log('Dados do clique não encontrados:', data)
    }
  }

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedStatus(null)
    setContractDetails([])
    console.log('Filtro limpo')
  }

  // Função para exportar para Excel
  const exportToExcel = () => {
    if (!contractDetails || contractDetails.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    const dataForExport = contractDetails.map(contract => ({
      'ID': contract.id,
      'Cliente': contract.clienteNome || 'N/A',
      'Status': contract.statusNome?.replace(/\?\?\?\?/g, 'ção').replace(/\?\?/g, 'ã') || 'N/A',
      'Produto': contract.produtoNome || 'N/A',
      'Banco': contract.bancoNome || 'N/A',
      'Equipe': contract.equipeNome || 'N/A',
      'CPF/CNPJ': contract.cpfCnpj || 'N/A',
      'Valor': contract.valores ? Number(contract.valores) : 0,
      'Valor Referência': contract.valorReferencia ? Number(contract.valorReferencia) : 0,
      'Valor Liberado': contract.valorLiberado ? Number(contract.valorLiberado) : 0,
      'Valor Parcela': contract.valorParcela ? Number(contract.valorParcela) : 0,
      'Data Cadastro': contract.dataCadastro ? new Date(contract.dataCadastro).toLocaleDateString('pt-BR') : 'N/A'
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataForExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contratos')
    
    const fileName = `Contratos_Producao_${selectedStatus === 'ALL' ? 'Todos' : selectedStatus?.replace(/[^a-zA-Z0-9]/g, '_') || 'Filtrado'}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  // Função para exportar para PDF
  const exportToPDF = () => {
    if (!contractDetails || contractDetails.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(16)
    doc.text('Relatório de Contratos - Produção', 14, 15)
    
    // Filtro ativo
    doc.setFontSize(12)
    const filterText = selectedStatus === 'ALL' ? 'Todos os Status' : selectedStatus?.replace(/\?\?\?\?/g, 'ção').replace(/\?\?/g, 'ã') || 'Filtrado'
    doc.text(`Filtro: ${filterText}`, 14, 25)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35)
    doc.text(`Total de Contratos: ${contractDetails.length}`, 14, 45)

    // Preparar dados para tabela
    const tableData: string[][] = []
    
    if (Array.isArray(contractDetails)) {
      contractDetails.forEach((contract: any) => {
        tableData.push([
          String(contract.id || ''),
          contract.clienteNome || 'N/A',
          contract.statusNome?.replace(/\?\?\?\?/g, 'ção').replace(/\?\?/g, 'ã') || 'N/A',
          contract.produtoNome || 'N/A',
          contract.bancoNome || 'N/A',
          contract.equipeNome || 'N/A',
          contract.cpfCnpj || 'N/A',
          contract.valores ? `R$ ${Number(contract.valores).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00',
          contract.dataCadastro ? new Date(contract.dataCadastro).toLocaleDateString('pt-BR') : 'N/A'
        ])
      })
    }

    // Criar tabela
    (doc as any).autoTable({
      head: [['ID', 'Cliente', 'Status', 'Produto', 'Banco', 'Equipe', 'CPF/CNPJ', 'Valor', 'Data']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [172, 123, 57] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 15 }
      }
    })

    const fileName = `Contratos_Producao_${selectedStatus === 'ALL' ? 'Todos' : selectedStatus?.replace(/[^a-zA-Z0-9]/g, '_') || 'Filtrado'}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  // Processar dados para gráfico
  const chartData = useMemo(() => {
    if (!data?.statusBreakdown) return []
    
    const processed = data.statusBreakdown.slice(0, 10).map(item => ({
      name: item.status.replace(/\?\?\?\?/g, 'ção').replace(/\?\?/g, 'ã'),
      originalStatus: item.status, // Manter status original para busca
      quantidade: item.quantidade,
      valor: item.valorFinanciado / 1000000
    }))
    
    console.log('chartData processado:', processed)
    return processed
  }, [data])

  // Filtrar dados dos KPIs baseado no status selecionado
  const filteredKPIs = useMemo(() => {
    if (!data?.statusBreakdown) return null
    
    if (selectedStatus) {
      const statusData = data.statusBreakdown.find(item => item.status === selectedStatus)
      return statusData ? [statusData] : []
    }
    
    return data.statusBreakdown
  }, [data, selectedStatus])

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Produção Analytics</h1>
          <p className="text-muted-foreground">
            Análise completa de produção por status e período
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros Opcionais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Os dados históricos são carregados automaticamente. Use os filtros para refinar a análise.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Banco</label>
              <select
                value={selectedBanco}
                onChange={(e) => setSelectedBanco(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ac7b39] bg-background text-foreground text-sm"
                disabled={loadingFilters}
              >
                <option value="">Todos os bancos</option>
                {bancos.map((banco) => (
                  <option key={banco} value={banco}>
                    {banco}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipe</label>
              <select
                value={selectedEquipe}
                onChange={(e) => setSelectedEquipe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ac7b39] bg-background text-foreground text-sm"
                disabled={loadingFilters}
              >
                <option value="">Todas as equipes</option>
                {equipes.map((equipe) => (
                  <option key={equipe} value={equipe}>
                    {equipe}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              onClick={handleFilterChange}
              disabled={loading}
              className="w-full bg-[#ac7b39] hover:bg-[#8d6631] text-white"
            >
              {loading ? 'Carregando...' : 'Filtrar Dados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading inicial */}
      {loading && !data && (
        <Card className="gradient-border">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ac7b39] mx-auto mb-4"></div>
              <p className="text-lg text-white">Carregando dados históricos...</p>
              <p className="text-sm text-muted-foreground">Analisando contratos de {startDate} a {endDate}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {data && (
        <div className="space-y-4">
          {/* Header dos KPIs com opção de limpar filtro */}
          {selectedStatus && (
            <Card className="gradient-border border-[#ac7b39]">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#ac7b39]">
                      {selectedStatus === 'ALL' ? 
                        'Exibindo: Todos os Status' :
                        `Filtrado por: ${selectedStatus.replace(/\?\?\?\?/g, 'ção').replace(/\?\?/g, 'ã')}`
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStatus === 'ALL' ? 
                        'Mostrando dados de todos os status de contratos' :
                        'Clique em "Limpar Filtro" para ver todos os dados'
                      }
                    </p>
                  </div>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Limpar Filtro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="gradient-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-[#ac7b39]">
                  {filteredKPIs.reduce((sum, item) => sum + item.quantidade, 0).toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Referência</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-[#ac7b39]">
                  {formatValue(filteredKPIs.reduce((sum, item) => sum + item.valorReferencia, 0))}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Financiado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-[#ac7b39]">
                  {formatValue(filteredKPIs.reduce((sum, item) => sum + item.valorFinanciado, 0))}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Liberado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-[#ac7b39]">
                  {formatValue(filteredKPIs.reduce((sum, item) => sum + item.valorLiberado, 0))}
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Parcela</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-[#ac7b39]">
                  {formatValue(filteredKPIs.reduce((sum, item) => sum + item.valorParcela, 0))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Gráfico */}
      {data && chartData.length > 0 && (
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Volume por Status (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData}
                  onClick={handleChartClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#ffffff' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#ffffff' }} />
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => {
                      if (name === 'quantidade') {
                        return [
                          <>
                            <div>{value.toLocaleString("pt-BR")} contratos</div>
                            <div style={{ color: '#ac7b39' }}>R$ {props.payload.valor.toFixed(1)}M</div>
                          </>, 
                          'Volume por Status'
                        ];
                      }
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: '#081535',
                      border: '2px solid #ac7b39',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar 
                    dataKey="quantidade" 
                    fill="#ac7b39"
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Instruções e botões de ação */}
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                💡 <strong>Dica:</strong> Clique nas barras do gráfico para filtrar por status específico
              </p>
              
              <div className="flex gap-2 justify-center flex-wrap">
                <Button 
                  onClick={() => {
                    setSelectedStatus('ALL')
                    fetchAllContracts()
                  }} 
                  variant={selectedStatus === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  className="bg-[#ac7b39] hover:bg-[#8d6631] text-white"
                >
                  📋 Ver Todos os Contratos
                </Button>
                
                {selectedStatus && selectedStatus !== 'ALL' && (
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    🔄 Limpar Filtro
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Detalhes dos Contratos */}
      {selectedStatus && (
        <Card className="gradient-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#ac7b39]">
                  <TrendingUp className="h-5 w-5" />
                  {selectedStatus === 'ALL' ? 
                    `Todos os Contratos (${contractDetails?.length || 0})` :
                    `Contratos - ${selectedStatus.replace(/\?\?\?\?/g, 'ção').replace(/\?\?/g, 'ã')} (${contractDetails?.length || 0})`
                  }
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {loadingDetails ? 'Carregando contratos...' : 
                   selectedStatus === 'ALL' ? 
                     `Exibindo ${contractDetails?.length || 0} contratos de todos os status` :
                     `Exibindo ${contractDetails?.length || 0} contratos neste status`
                  }
                </p>
              </div>
              
              {/* Botões de Exportação */}
              {!loadingDetails && contractDetails && contractDetails.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={exportToExcel} variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={exportToPDF} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando detalhes dos contratos...</div>
              </div>
            ) : contractDetails && contractDetails.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#ac7b39]">Cliente</TableHead>
                        <TableHead className="text-[#ac7b39]">Status</TableHead>
                        <TableHead className="text-[#ac7b39]">Produto</TableHead>
                        <TableHead className="text-[#ac7b39]">Banco</TableHead>
                        <TableHead className="text-[#ac7b39]">Equipe</TableHead>
                        <TableHead className="text-[#ac7b39]">CPF/CNPJ</TableHead>
                        <TableHead className="text-[#ac7b39] text-right">Valor</TableHead>
                        <TableHead className="text-[#ac7b39]">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractDetails.map((contract, index) => (
                        <TableRow key={contract.id} className="hover:bg-muted/50">
                          <TableCell className="text-sm font-medium">{contract.clienteNome || 'N/A'}</TableCell>
                          <TableCell className="text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              contract.statusNome === 'PAGO' || contract.statusNome === 'AVERBADO' || contract.statusNome === 'BOLETO QUITADO' 
                                ? 'bg-green-100 text-green-800' 
                                : contract.statusNome === 'CANCELADO' || contract.statusNome === 'REJEITADO'
                                ? 'bg-red-100 text-red-800'
                                : contract.statusNome === 'PENDENTE' || contract.statusNome === 'AGUARDANDO'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {contract.statusNome?.replace(/\?\?\?\?/g, 'ção').replace(/\?\?/g, 'ã') || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate" title={contract.produtoNome}>
                            {contract.produtoNome || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">{contract.bancoNome || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{contract.equipeNome || 'N/A'}</TableCell>
                          <TableCell className="text-sm font-mono text-xs">{contract.cpfCnpj || 'N/A'}</TableCell>
                          <TableCell className="text-sm font-medium text-[#ac7b39] text-right">
                            R$ {contract.valores ? Number(contract.valores).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {contract.dataCadastro ? new Date(contract.dataCadastro).toLocaleDateString('pt-BR') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {contractDetails.length >= 500 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> Exibindo os primeiros 500 contratos. Há mais contratos neste status.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Nenhum contrato encontrado para este status.</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}