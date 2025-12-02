import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Line, Scatter, ScatterChart
} from 'recharts'
import { TrendingUp, TrendingDown, Filter, DollarSign, FileText, Download, FileSpreadsheet, ArrowUp, ArrowDown, Users, Activity, Zap, Target } from "lucide-react"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { useAutoRefresh } from "@/hooks/useAutoRefresh"
import { useSync } from "@/providers/sync-provider"
import { getApiEndpoint, logApiCall } from "@/lib/api-config"

const TEAM_COLORS = ['#ac7b39', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B']

export default function TeamPerformance() {
  const { updateSync, setRefreshing } = useSync()
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [proposals, setProposals] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sortBy, setSortBy] = useState('dataStatus')
  const [sortOrder, setSortOrder] = useState('desc')

  const formatValue = (value) => {
    if (!value || value === 0) return 'R$ 0'
    const absValue = Math.abs(value)
    if (absValue >= 1000000000) return `R$ ${(value / 1000000000).toFixed(1)}B`
    if (absValue >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
    if (absValue >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`
    return `R$ ${value.toFixed(0)}`
  }

  const sortProposals = (proposals) => {
    if (!proposals || proposals.length === 0) return proposals
    return [...proposals].sort((a, b) => {
      let aValue, bValue
      if (sortBy === 'dataStatus') {
        aValue = new Date(a.dataStatus || '1970-01-01')
        bValue = new Date(b.dataStatus || '1970-01-01')
      } else if (sortBy === 'valor') {
        aValue = Number(a.valorFinanciado || 0)
        bValue = Number(b.valorFinanciado || 0)
      }
      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1
      return aValue < bValue ? 1 : -1
    })
  }

  const sortedProposals = sortProposals(proposals)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `.recharts-bar-rectangle { cursor: pointer !important; } .recharts-bar-rectangle:hover { opacity: 0.8; }`
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const fetchData = async (customStartDate?: string, customEndDate?: string) => {
    setLoading(true)
    setRefreshing(true)
    
    const params = new URLSearchParams()
    params.append('startDate', customStartDate || startDate)
    params.append('endDate', customEndDate || endDate)
    
    const url = getApiEndpoint('SQLSERVER', `/api/treynor/team-performance?${params.toString()}`)
    console.log('🔍 Buscando performance:', url)
    logApiCall(url, 'REQUEST')
    
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Erro: ${response.status}`)
      
      const result = await response.json()
      setData(result)
      logApiCall(url, 'SUCCESS')
      
      const now = new Date()
      const timestamp = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      updateSync(timestamp)
      
      return { hasNewData: true }
    } catch (error) {
      console.error('Erro:', error)
      logApiCall(url, 'ERROR')
      alert('Erro: ' + error.message)
      return { hasNewData: false }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  useAutoRefresh({
    onRefresh: () => fetchData(startDate, endDate),
    interval: 30000,
    enabled: autoRefreshEnabled
  })

  useEffect(() => {
    const loadInitialData = async () => {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      
      const defaultStart = firstDay.toISOString().split('T')[0]
      const defaultEnd = today.toISOString().split('T')[0]
      
      setStartDate(defaultStart)
      setEndDate(defaultEnd)
      await fetchData(defaultStart, defaultEnd)
    }
    
    loadInitialData()
  }, [])

  const fetchTeamProposals = async (teamName) => {
    setLoadingDetails(true)
    
    const params = new URLSearchParams()
    params.append('startDate', startDate)
    params.append('endDate', endDate)
    params.append('equipe', teamName)
    
    const url = getApiEndpoint('SQLSERVER', `/api/treynor/team-proposals?${params.toString()}`)
    logApiCall(url, 'REQUEST')
    
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Erro: ${response.status}`)
      
      const result = await response.json()
      setProposals(result)
      logApiCall(url, 'SUCCESS')
    } catch (error) {
      console.error('Erro:', error)
      logApiCall(url, 'ERROR')
      setProposals([])
      alert('Erro: ' + error.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  const clearSelection = () => {
    setSelectedTeam(null)
    setProposals([])
  }

  const clearAllFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedTeam(null)
    setProposals([])
    setData(null)
    setAutoRefreshEnabled(false)
  }

  const exportToExcel = () => {
    if (!sortedProposals || sortedProposals.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    const dataForExport = sortedProposals.map(p => ({
      'Cliente': p.clienteNome || 'N/A',
      'CPF': p.clienteCpf || 'N/A',
      'Equipe': p.equipeNome || 'N/A',
      'Vendedor': p.vendedorNome || 'N/A',
      'Status': p.statusNome || 'N/A',
      'Produto': p.produtoNome || 'N/A',
      'Convênio': p.convenioNome || 'N/A',
      'Valor Financiado': p.valorFinanciado || 0,
      'Valor Liberado': p.valorLiberado || 0,
      'Valor Parcela': p.valorParcela || 0,
      'Valor Referência': p.valorReferencia || 0,
      'Data Status': p.dataStatus ? new Date(p.dataStatus).toLocaleDateString('pt-BR') : 'N/A'
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataForExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Propostas')
    
    const fileName = `Propostas_${selectedTeam?.replace(/[^a-zA-Z0-9]/g, '_') || 'Completas'}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const exportToPDF = () => {
    if (!sortedProposals || sortedProposals.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Performance de Equipe', 14, 15)
    doc.setFontSize(12)
    doc.text(`Equipe: ${selectedTeam || 'Todas'}`, 14, 25)
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 35)

    const tableData: string[][] = []
    sortedProposals.forEach((p: any) => {
      tableData.push([
        p.clienteNome || 'N/A',
        p.statusNome || 'N/A',
        p.equipeNome || 'N/A',
        p.clienteCpf || 'N/A',
        p.valorFinanciado ? `R$ ${Number(p.valorFinanciado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00',
        p.dataStatus ? new Date(p.dataStatus).toLocaleDateString('pt-BR') : 'N/A'
      ])
    })

    (doc as any).autoTable({
      head: [['Cliente', 'Status', 'Equipe', 'CPF', 'Valor', 'Data']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [172, 123, 57] },
    })

    const fileName = `Performance_${selectedTeam?.replace(/[^a-zA-Z0-9]/g, '_') || 'Completa'}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  // Processar dados para gráficos
  const teamChartData = useMemo(() => {
    if (!data?.teamPerformance) return []
    return data.teamPerformance.map((team, idx) => ({
      name: team.equipeNome,
      propostas: team.totalPropostas,
      valor: team.valorTotalFinanciado,
      liberado: team.valorTotalLiberado,
      eficiencia: (team.valorTotalLiberado / (team.valorTotalFinanciado || 1)) * 100,
      ticket: team.valorTotalFinanciado / (team.totalPropostas || 1),
      color: TEAM_COLORS[idx % TEAM_COLORS.length],
      equipeNome: team.equipeNome
    }))
  }, [data])

  const statusChartData = useMemo(() => {
    if (!data?.statusBreakdown) return []
    return data.statusBreakdown.map((status, idx) => ({
      name: status.statusNome?.substring(0, 12) || 'N/A',
      value: status.quantidade,
      fullName: status.statusNome,
      color: TEAM_COLORS[idx % TEAM_COLORS.length]
    }))
  }, [data])

  const kpis = useMemo(() => {
    if (!data?.teamPerformance) return null
    
    const totalPropostas = data.teamPerformance.reduce((sum, t) => sum + t.totalPropostas, 0)
    const valorTotal = data.teamPerformance.reduce((sum, t) => sum + t.valorTotalFinanciado, 0)
    const valorLiberado = data.teamPerformance.reduce((sum, t) => sum + t.valorTotalLiberado, 0)
    
    return {
      totalPropostas,
      valorTotal,
      valorLiberado,
      eficiencia: (valorLiberado / valorTotal) * 100 || 0,
      ticket: valorTotal / totalPropostas || 0
    }
  }, [data])

  const filteredKPIs = useMemo(() => {
    if (!data?.teamPerformance) return null
    if (selectedTeam) {
      return data.teamPerformance.find(team => team.equipeNome === selectedTeam)
    }
    return kpis
  }, [data, selectedTeam, kpis])

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-950 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Users className="h-12 w-12 text-[#ac7b39]" />
        <div>
          <h1 className="text-4xl font-bold text-white">Performance de Equipe</h1>
          <p className="text-slate-400 mt-1">Análise profunda de performance por equipe e status</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-[#ac7b39] border-2 bg-slate-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-[#ac7b39] flex items-center gap-2">
            <Filter className="h-5 w-5" /> Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-white font-medium">Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="text-sm text-white font-medium">Fim</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={() => {
                  setAutoRefreshEnabled(true)
                  fetchData(startDate, endDate)
                }}
                disabled={loading}
                className="flex-1 bg-[#ac7b39] hover:bg-[#8d6631] text-white font-semibold"
              >
                {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
              </Button>
              {(startDate || endDate) && (
                <Button
                  onClick={clearAllFilters}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  ✕ Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && !data && (
        <Card className="border-[#ac7b39] border-2 bg-slate-800/50">
          <CardContent className="py-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#ac7b39] mx-auto mb-4"></div>
            <p className="text-xl text-white font-semibold">Carregando análise...</p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {data && filteredKPIs && (
        <>
          {selectedTeam && (
            <Card className="border-[#ac7b39] border-2 bg-gradient-to-r from-[#ac7b39]/20 to-transparent">
              <CardContent className="py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#ac7b39]">📊 {selectedTeam}</h3>
                <Button 
                  onClick={clearSelection} 
                  variant="outline" 
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  ✕ Limpar
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-[#ac7b39] border-2 bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex justify-between">
                  Propostas
                  <FileText className="h-5 w-5 text-[#ac7b39]" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#ac7b39]">
                  {(filteredKPIs?.totalPropostas || 0).toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-slate-400 mt-2">total</p>
              </CardContent>
            </Card>

            <Card className="border-green-500 border-2 bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex justify-between">
                  Financiado
                  <DollarSign className="h-5 w-5 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {formatValue(filteredKPIs?.valorTotal || 0)}
                </div>
                <p className="text-xs text-slate-400 mt-2">valor</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500 border-2 bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex justify-between">
                  Liberado
                  <Zap className="h-5 w-5 text-blue-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {formatValue(filteredKPIs?.valorTotalLiberado || 0)}
                </div>
                <p className="text-xs text-slate-400 mt-2">em produção</p>
              </CardContent>
            </Card>

            <Card className="border-purple-500 border-2 bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex justify-between">
                  Eficiência
                  <Activity className="h-5 w-5 text-purple-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-500">
                  {((filteredKPIs?.valorTotalLiberado || 0) / (filteredKPIs?.valorTotal || 1) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-slate-400 mt-2">de liberação</p>
              </CardContent>
            </Card>

            <Card className="border-orange-500 border-2 bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex justify-between">
                  Ticket Médio
                  <Target className="h-5 w-5 text-orange-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {formatValue((filteredKPIs?.valorTotal || 0) / (filteredKPIs?.totalPropostas || 1))}
                </div>
                <p className="text-xs text-slate-400 mt-2">por proposta</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Gráficos */}
      {data && teamChartData.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance por Equipe */}
            <Card className="border-[#ac7b39] border-2 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-[#ac7b39] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#fff' }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11, fill: '#fff' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '2px solid #ac7b39', borderRadius: '8px' }} />
                      <Bar 
                        dataKey="propostas" 
                        fill="#ac7b39"
                        onClick={(e) => {
                          setSelectedTeam(e.equipeNome)
                          fetchTeamProposals(e.equipeNome)
                        }}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">💡 Clique para detalhar</p>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="border-[#ac7b39] border-2 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-[#ac7b39] flex items-center gap-2">
                  <Activity className="h-5 w-5" /> Por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Eficiência por Equipe */}
          <Card className="border-[#ac7b39] border-2 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-[#ac7b39] flex items-center gap-2">
                <Zap className="h-5 w-5" /> Análise de Eficiência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis type="number" dataKey="ticket" name="Ticket Médio" tick={{ fontSize: 11, fill: '#fff' }} />
                    <YAxis type="number" dataKey="eficiencia" name="Eficiência %" tick={{ fontSize: 11, fill: '#fff' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '2px solid #ac7b39', borderRadius: '8px' }} />
                    <Scatter name="Equipes" data={teamChartData} fill="#ac7b39" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Ranking */}
          <Card className="border-[#ac7b39] border-2 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-[#ac7b39] flex items-center gap-2">
                <TrendingDown className="h-5 w-5" /> Ranking por Valor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamChartData
                  .sort((a, b) => b.valor - a.valor)
                  .slice(0, 10)
                  .map((team, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 cursor-pointer transition" onClick={() => { setSelectedTeam(team.equipeNome); fetchTeamProposals(team.equipeNome); }}>
                      <div className="text-xl font-bold text-[#ac7b39] w-8 text-center">#{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{team.name}</div>
                        <div className="text-xs text-slate-400">{team.propostas} propostas • {team.eficiencia.toFixed(1)}% eficiência</div>
                      </div>
                      <div className="text-right font-bold text-green-400">{formatValue(team.valor)}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Tabela de Propostas */}
      {selectedTeam && (
        <Card className="border-[#ac7b39] border-2 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#ac7b39] flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Propostas ({proposals?.length || 0})
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">{selectedTeam}</p>
              </div>
              
              {!loadingDetails && proposals && proposals.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={exportToExcel} variant="outline" size="sm" className="text-green-400">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                  </Button>
                  <Button onClick={exportToPDF} variant="outline" size="sm" className="text-red-400">
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetails ? (
              <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : proposals && proposals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-[#ac7b39]">Cliente</TableHead>
                      <TableHead className="text-[#ac7b39]">CPF</TableHead>
                      <TableHead className="text-[#ac7b39]">Status</TableHead>
                      <TableHead className="text-[#ac7b39]">Produto</TableHead>
                      <TableHead className="text-[#ac7b39]">Convênio</TableHead>
                      <TableHead className="text-[#ac7b39]">Vendedor</TableHead>
                      <TableHead 
                        className="text-[#ac7b39] text-right cursor-pointer hover:bg-slate-700/30"
                        onClick={() => {
                          if (sortBy === 'valor') {
                            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                          } else {
                            setSortBy('valor')
                            setSortOrder('desc')
                          }
                        }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Valor {sortBy === 'valor' && (sortOrder === 'desc' ? '▼' : '▲')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-[#ac7b39] cursor-pointer hover:bg-slate-700/30"
                        onClick={() => {
                          if (sortBy === 'dataStatus') {
                            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                          } else {
                            setSortBy('dataStatus')
                            setSortOrder('desc')
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Data {sortBy === 'dataStatus' && (sortOrder === 'desc' ? '▼' : '▲')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProposals.map((p, idx) => (
                      <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-sm font-medium text-white">{p.clienteNome || 'N/A'}</TableCell>
                        <TableCell className="text-sm font-mono text-slate-400">{p.clienteCpf || 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            p.statusNome?.includes('AVERBADO') || p.statusNome?.includes('PAGO')
                              ? 'bg-green-900 text-green-300' 
                              : p.statusNome?.includes('CANCELADO') || p.statusNome?.includes('REJEITADO')
                              ? 'bg-red-900 text-red-300'
                              : p.statusNome?.includes('PENDENTE')
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-blue-900 text-blue-300'
                          }`}>
                            {p.statusNome?.substring(0, 15) || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-300">{p.produtoNome?.substring(0, 20) || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-slate-300">{p.convenioNome?.substring(0, 15) || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-slate-300">{p.vendedorNome || 'N/A'}</TableCell>
                        <TableCell className="text-sm font-semibold text-green-400 text-right">
                          {formatValue(p.valorFinanciado)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-400">
                          {p.dataStatus ? new Date(p.dataStatus).toLocaleDateString('pt-BR') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">Nenhuma proposta encontrada.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
