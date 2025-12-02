import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Download, TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'
import { getApiEndpoint } from '@/lib/api-config'

interface FinancialRow {
  description: string
  value: number
}

interface FinancialData {
  month: string
  receita: {
    name: string
    data: FinancialRow[]
    total: number
  }
  despesas: {
    name: string
    data: FinancialRow[]
    total: number
  }
  result: number
}

const COLORS = ['#C48A3F', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1']
const GOLD_COLOR = '#C48A3F'
const DARK_BG = '#06162B'

export default function FechamentoMes() {
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-09')
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFinancialData(selectedMonth)
  }, [selectedMonth])

  const loadFinancialData = async (month: string) => {
    setLoading(true)
    setError(null)

    try {
      // Usar a mesma configuração dinâmica que outras páginas
      const backendUrl = getApiEndpoint('SQLSERVER', '/api/financial/read')
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Arquivo não encontrado para este mês`)
      }

      const data = await response.json()
      setFinancialData(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const generateMonths = () => {
    const months = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      months.push(`${year}-${month}`)
    }

    return months
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const handleDownload = () => {
    if (!financialData) return

    let csv = `Fechamento Financeiro - ${formatMonthYear(selectedMonth)}\n\n`

    csv += `RECEITA\n`
    csv += `Descrição,Valor\n`
    financialData.receita.data.forEach((row) => {
      csv += `"${row.description}",${row.value}\n`
    })
    csv += `Total Receita,${financialData.receita.total}\n\n`

    csv += `DESPESA\n`
    csv += `Descrição,Valor\n`
    financialData.despesas.data.forEach((row) => {
      csv += `"${row.description}",${row.value}\n`
    })
    csv += `Total Despesa,${financialData.despesas.total}\n\n`

    csv += `RESULTADO\n`
    csv += `Receita,${financialData.receita.total}\n`
    csv += `Despesa,${financialData.despesas.total}\n`
    csv += `Saldo,${financialData.result}\n`

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `Fechamento_${selectedMonth}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const chartData = financialData
    ? [
        { name: 'Receita', value: financialData.receita.total },
        { name: 'Despesa', value: financialData.despesas.total },
      ]
    : []

  const isPositive = financialData && financialData.result >= 0

  return (
    <div className="space-y-8 p-6 lg:p-10 min-h-screen" style={{ backgroundColor: DARK_BG }}>
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl p-10">
        <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${GOLD_COLOR}40 0%, transparent 100%)` }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-5xl">💰</div>
                <div>
                  <h1 className="text-4xl font-black leading-tight" style={{ color: GOLD_COLOR }}>
                    Fechamento Mensal
                  </h1>
                  <p className="text-gray-400 text-sm font-medium mt-1">Análise financeira completa e detalhada do período</p>
                </div>
              </div>
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Período</p>
              <p className="text-xl font-bold" style={{ color: GOLD_COLOR }}>{formatMonthYear(selectedMonth)}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${GOLD_COLOR}20 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}></div>
      </div>

      {/* Selector Card */}
      <Card className="backdrop-blur-xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl" style={{ background: `linear-gradient(135deg, ${DARK_BG}f0 0%, ${DARK_BG}80 100%)`, borderColor: `${GOLD_COLOR}40` }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-base font-semibold" style={{ color: GOLD_COLOR }}>
              <Calendar className="h-5 w-5" style={{ color: GOLD_COLOR }} />
              Período Financeiro
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full max-w-xs font-semibold text-sm" style={{ background: `${DARK_BG}cc`, borderColor: `${GOLD_COLOR}60`, color: 'white', height: '44px' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: `${DARK_BG}ff`, borderColor: `${GOLD_COLOR}40` }}>
              {generateMonths().map((month) => (
                <SelectItem key={month} value={month} className="text-gray-100">
                  {formatMonthYear(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="p-5 rounded-xl border-2 flex items-center gap-4 backdrop-blur-lg animate-in fade-in" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.6)' }}>
          <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-200 font-semibold text-sm">{error}</p>
            <p className="text-red-300 text-xs mt-1">Tente selecionar um período diferente</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-16 rounded-xl flex flex-col items-center justify-center gap-4 backdrop-blur-md border-2 animate-in fade-in" style={{ background: `linear-gradient(135deg, ${DARK_BG}99 0%, ${GOLD_COLOR}10 100%)`, borderColor: `${GOLD_COLOR}40` }}>
          <div className="relative w-12 h-12">
            <Loader className="h-12 w-12 animate-spin" style={{ color: GOLD_COLOR }} />
          </div>
          <p className="text-gray-300 font-semibold text-base">Carregando dados financeiros...</p>
          <p className="text-gray-500 text-xs">Processando informações do período selecionado</p>
        </div>
      )}

      {/* Main Content */}
      {financialData && !loading && (
        <div className="space-y-6">
          {/* KPI Cards - Premium Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Receita KPI */}
            <Card className="border-2 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group" style={{ background: `linear-gradient(135deg, #10b98118 0%, #10b98110 100%)`, borderColor: '#10b98160' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Receita</CardTitle>
                  <div className="p-2.5 rounded-lg group-hover:scale-110 transition-transform" style={{ background: '#10b98125' }}>
                    <TrendingUp className="h-4 w-4" style={{ color: '#10b981' }} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2" style={{ color: '#10b981' }}>
                  {formatCurrency(financialData.receita.total)}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-bold text-gray-400">{financialData.receita.data.length}</span> lançamentos realizados
                </p>
              </CardContent>
            </Card>

            {/* Despesa KPI */}
            <Card className="border-2 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group" style={{ background: `linear-gradient(135deg, #ef444418 0%, #ef444410 100%)`, borderColor: '#ef444460' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Despesa</CardTitle>
                  <div className="p-2.5 rounded-lg group-hover:scale-110 transition-transform" style={{ background: '#ef444425' }}>
                    <TrendingDown className="h-4 w-4" style={{ color: '#ef4444' }} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2" style={{ color: '#ef4444' }}>
                  {formatCurrency(financialData.despesas.total)}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-bold text-gray-400">{financialData.despesas.data.length}</span> lançamentos realizados
                </p>
              </CardContent>
            </Card>

            {/* Saldo KPI */}
            <Card className="border-2 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group" style={{ background: `linear-gradient(135deg, ${isPositive ? '#10b98118' : '#ef444418'} 0%, ${isPositive ? '#10b98110' : '#ef444410'} 100%)`, borderColor: isPositive ? '#10b98160' : '#ef444460' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-gray-400">Saldo Líquido</CardTitle>
                  <div className="p-2.5 rounded-lg group-hover:scale-110 transition-transform" style={{ background: `${isPositive ? '#10b98125' : '#ef444425'}` }}>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" style={{ color: '#10b981' }} />
                    ) : (
                      <TrendingDown className="h-4 w-4" style={{ color: '#ef4444' }} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2" style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
                  {isPositive ? '+' : ''}
                  {formatCurrency(financialData.result)}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-bold" style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
                    {((financialData.result / financialData.receita.total) * 100).toFixed(1)}%
                  </span>{' '}
                  da receita total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição Donut Chart */}
            <Card className="border-2 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden" style={{ background: `linear-gradient(135deg, ${DARK_BG}f5 0%, ${GOLD_COLOR}08 100%)`, borderColor: `${GOLD_COLOR}50` }}>
              <CardHeader className="pb-4 border-b" style={{ borderColor: `${GOLD_COLOR}20` }}>
                <CardTitle className="text-base font-bold flex items-center gap-3" style={{ color: GOLD_COLOR }}>
                  <span className="text-xl">📊</span>
                  Distribuição Financeira
                </CardTitle>
                <p className="text-xs text-gray-500 mt-2 font-medium">Proporcionalidade receita vs. despesa</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        innerRadius={55}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1500}
                        animationBegin={0}
                        animationEasing="ease-out"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{ 
                          background: `${DARK_BG}ff`, 
                          border: `2px solid ${GOLD_COLOR}`, 
                          borderRadius: '10px',
                          boxShadow: `0 8px 24px rgba(196, 138, 63, 0.2)`,
                          color: 'white',
                          padding: '12px 16px'
                        }}
                        labelStyle={{ color: GOLD_COLOR, fontWeight: 'bold', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Statistics Cards */}
                  <div className="w-full grid grid-cols-2 gap-3 mt-6 pt-4 border-t" style={{ borderColor: `${GOLD_COLOR}20` }}>
                    <div className="p-4 rounded-lg backdrop-blur-sm border-2 transform hover:scale-105 transition-all" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: '#10b98150' }}>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Receita</p>
                      <p className="text-2xl font-black" style={{ color: '#10b981' }}>
                        {((chartData[0]?.value / (chartData[0]?.value + chartData[1]?.value)) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-2 font-medium">{formatCurrency(chartData[0]?.value || 0)}</p>
                    </div>
                    <div className="p-4 rounded-lg backdrop-blur-sm border-2 transform hover:scale-105 transition-all" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef444450' }}>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Despesa</p>
                      <p className="text-2xl font-black" style={{ color: '#ef4444' }}>
                        {((chartData[1]?.value / (chartData[0]?.value + chartData[1]?.value)) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-2 font-medium">{formatCurrency(chartData[1]?.value || 0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparativo Bar Chart */}
            <Card className="border-2 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden" style={{ background: `linear-gradient(135deg, ${DARK_BG}f5 0%, ${GOLD_COLOR}08 100%)`, borderColor: `${GOLD_COLOR}50` }}>
              <CardHeader className="pb-4 border-b" style={{ borderColor: `${GOLD_COLOR}20` }}>
                <CardTitle className="text-base font-bold flex items-center gap-3" style={{ color: GOLD_COLOR }}>
                  <span className="text-xl">📈</span>
                  Comparativo Mensal
                </CardTitle>
                <p className="text-xs text-gray-500 mt-2 font-medium">Visualização lado a lado do período</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[
                      {
                        name: 'Período',
                        Receita: financialData.receita.total,
                        Despesa: financialData.despesas.total,
                      },
                    ]}
                    margin={{ top: 25, right: 25, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="4 4" 
                      stroke="rgba(196, 138, 63, 0.12)"
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255, 255, 255, 0.4)"
                      tick={{ fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.4)"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), '']}
                      contentStyle={{
                        background: `${DARK_BG}ff`, 
                        border: `2px solid ${GOLD_COLOR}`, 
                        borderRadius: '10px',
                        boxShadow: `0 8px 24px rgba(196, 138, 63, 0.2)`,
                        color: 'white',
                        padding: '12px 16px'
                      }}
                      labelStyle={{ color: GOLD_COLOR, fontWeight: 'bold', fontSize: '13px' }}
                      cursor={{ fill: 'rgba(196, 138, 63, 0.08)' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                      formatter={(value) => <span style={{ fontSize: '13px', fontWeight: '600' }}>{value}</span>}
                    />
                    <Bar 
                      dataKey="Receita" 
                      fill="#10b981" 
                      radius={[18, 18, 6, 6]} 
                      animationDuration={1500}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                    />
                    <Bar 
                      dataKey="Despesa" 
                      fill="#ef4444" 
                      radius={[18, 18, 6, 6]} 
                      animationDuration={1500}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary Info */}
                <div className="mt-6 p-4 rounded-lg flex items-center justify-between gap-4 border" style={{ background: `${GOLD_COLOR}08`, borderColor: `${GOLD_COLOR}30` }}>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Diferença</p>
                    <p className="text-lg font-black" style={{ color: GOLD_COLOR }}>
                      {formatCurrency(Math.abs(chartData[0]?.value - chartData[1]?.value) || 0)}
                    </p>
                  </div>
                  <div className="w-px h-12" style={{ background: `${GOLD_COLOR}30` }}></div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Resultado</p>
                    <p className={`text-lg font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '✓ Positivo' : '✗ Negativo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas Table */}
            <Card className="border-2 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: `linear-gradient(135deg, ${DARK_BG}f5 0%, #10b98806 100%)`, borderColor: '#10b98140' }}>
              <CardHeader className="pb-4 border-b backdrop-blur-sm" style={{ borderColor: '#10b98120', background: 'rgba(16, 185, 129, 0.06)' }}>
                <CardTitle className="flex items-center gap-3 text-base font-bold">
                  <span className="text-lg">�</span>
                  <span style={{ color: '#10b981' }}>Receitas Detalhadas</span>
                  <span className="ml-auto text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">{financialData.receita.data.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: '#10b98110', background: 'rgba(16, 185, 129, 0.04)' }}>
                        <TableHead className="font-bold text-xs uppercase tracking-widest" style={{ color: '#10b981' }}>Descrição</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest" style={{ color: '#10b981' }}>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.receita.data.map((row, idx) => (
                        <TableRow key={idx} style={{ borderColor: '#10b98108' }} className="hover:bg-opacity-50 transition-colors text-sm">
                          <TableCell className="font-medium text-gray-300 py-3">{row.description}</TableCell>
                          <TableCell className="text-right font-bold py-3" style={{ color: '#10b981' }}>
                            {formatCurrency(row.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: '#10b98140' }} className="font-bold text-sm">
                        <TableCell className="text-gray-100 py-3">TOTAL</TableCell>
                        <TableCell className="text-right py-3" style={{ color: '#10b981' }}>
                          {formatCurrency(financialData.receita.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Despesas Table */}
            <Card className="border-2 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: `linear-gradient(135deg, ${DARK_BG}f5 0%, #ef444406 100%)`, borderColor: '#ef444140' }}>
              <CardHeader className="pb-4 border-b backdrop-blur-sm" style={{ borderColor: '#ef444120', background: 'rgba(239, 68, 68, 0.06)' }}>
                <CardTitle className="flex items-center gap-3 text-base font-bold">
                  <span className="text-lg">💸</span>
                  <span style={{ color: '#ef4444' }}>Despesas Detalhadas</span>
                  <span className="ml-auto text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">{financialData.despesas.data.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: '#ef444110', background: 'rgba(239, 68, 68, 0.04)' }}>
                        <TableHead className="font-bold text-xs uppercase tracking-widest" style={{ color: '#ef4444' }}>Descrição</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest" style={{ color: '#ef4444' }}>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.despesas.data.map((row, idx) => (
                        <TableRow key={idx} style={{ borderColor: '#ef444108' }} className="hover:bg-opacity-50 transition-colors text-sm">
                          <TableCell className="font-medium text-gray-300 py-3">{row.description}</TableCell>
                          <TableCell className="text-right font-bold py-3" style={{ color: '#ef4444' }}>
                            {formatCurrency(row.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef444140' }} className="font-bold text-sm">
                        <TableCell className="text-gray-100 py-3">TOTAL</TableCell>
                        <TableCell className="text-right py-3" style={{ color: '#ef4444' }}>
                          {formatCurrency(financialData.despesas.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Button - Premium Style */}
          <Button
            onClick={handleDownload}
            className="w-full font-black py-6 text-base rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 uppercase tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${GOLD_COLOR}, #d4a574)`,
              borderColor: GOLD_COLOR,
              color: '#000',
            }}
          >
            <Download className="h-5 w-5" />
            Exportar Relatório em CSV
          </Button>
        </div>
      )}
    </div>
  )
}

