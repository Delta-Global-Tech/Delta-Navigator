import { ShoppingCart, FileText, Target, Calendar, BarChart3, Clock, TrendingUp, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from "@tanstack/react-query"
import { getProducaoCompraKPIs, getProducaoCompraMonthly, getProducaoCompraProdutos, getProducaoCompraStatus } from "@/data/sqlserver"
import { useMemo, useState } from "react"

export default function ProducaoCompra() {
  // Estado para filtros de status
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])

  // Buscar status disponíveis
  const { data: statusData } = useQuery({
    queryKey: ['producao-compra-status'],
    queryFn: getProducaoCompraStatus
  })

  // Buscar KPIs de produção COMPRA
  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: ['producao-compra-kpis', selectedStatus],
    queryFn: () => getProducaoCompraKPIs(selectedStatus.length > 0 ? selectedStatus : undefined)
  })

  // Buscar dados mensais
  const { data: monthlyApiData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['producao-compra-monthly', selectedStatus],
    queryFn: () => getProducaoCompraMonthly(selectedStatus.length > 0 ? selectedStatus : undefined)
  })

  // Buscar dados de produtos
  const { data: productApiData, isLoading: productLoading } = useQuery({
    queryKey: ['producao-compra-produtos', selectedStatus],
    queryFn: () => getProducaoCompraProdutos(selectedStatus.length > 0 ? selectedStatus : undefined)
  })

  // Processar dados para análises
  const monthlyData = useMemo(() => {
    if (!monthlyApiData || !Array.isArray(monthlyApiData)) return []
    
    return monthlyApiData.map((item: any) => ({
      ym: item.mes,
      count: item.contratos,
      valor: item.valor_total
    }))
  }, [monthlyApiData])

  const documentData = useMemo(() => {
    if (!productApiData || !Array.isArray(productApiData)) return []
    
    const processedData = productApiData.slice(0, 5).map((item: any) => ({
      name: item.produto_nome,
      count: item.quantidade,
      valor: item.valor_total
    }));
    
    console.log('Processed documentData COMPRA:', processedData);
    return processedData;
  }, [productApiData])

  const prazoData = useMemo(() => {
    if (!productApiData || !Array.isArray(productApiData)) return []
    
    return productApiData.slice(0, 6).map((item: any, index: number) => ({
      name: item.produto_nome,
      value: item.quantidade
    }))
  }, [productApiData])

  const pieColors = [
    '#ac7b39', // Dourado principal
    '#2563eb', // Azul vivo
    '#853636ff', // Vermelho
    '#059669', // Verde
    '#7c3aed', // Roxo
    '#ea580c', // Laranja
    '#0891b2', // Ciano
    '#be123c'  // Rosa escuro
  ]
  
  const totalContratos = (kpisData as any)?.totalContratos || 0
  const valorReferencia = (kpisData as any)?.valorReferencia || 0
  const valorFinanciado = (kpisData as any)?.valorFinanciado || 0
  const valorLiberado = (kpisData as any)?.valorLiberado || 0
  const valorParcela = (kpisData as any)?.valorParcela || 0
  
  // Dados do mês anterior para comparação
  const totalContratosAnterior = (kpisData as any)?.totalContratosAnterior || 0
  const valorReferenciaAnterior = (kpisData as any)?.valorReferenciaAnterior || 0
  const valorFinanciadoAnterior = (kpisData as any)?.valorFinanciadoAnterior || 0
  const valorLiberadoAnterior = (kpisData as any)?.valorLiberadoAnterior || 0
  const valorParcelaAnterior = (kpisData as any)?.valorParcelaAnterior || 0
  
  // Cálculo das variações percentuais
  const variacaoContratos = totalContratosAnterior > 0 ? ((totalContratos - totalContratosAnterior) / totalContratosAnterior * 100) : 0
  const variacaoReferencia = valorReferenciaAnterior > 0 ? ((valorReferencia - valorReferenciaAnterior) / valorReferenciaAnterior * 100) : 0
  const variacaoFinanciado = valorFinanciadoAnterior > 0 ? ((valorFinanciado - valorFinanciadoAnterior) / valorFinanciadoAnterior * 100) : 0
  const variacaoLiberado = valorLiberadoAnterior > 0 ? ((valorLiberado - valorLiberadoAnterior) / valorLiberadoAnterior * 100) : 0
  const variacaoParcela = valorParcelaAnterior > 0 ? ((valorParcela - valorParcelaAnterior) / valorParcelaAnterior * 100) : 0

  const isLoading = kpisLoading || monthlyLoading || productLoading

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Produção</h1>
          <p className="text-muted-foreground">
            Análise de contratos em Andamento
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtro de Status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <Filter className="mr-2 h-4 w-4" />
                Status
                {selectedStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedStatus.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="grid gap-3">
                <div className="font-medium">Filtrar por Status</div>
                <div className="text-sm text-muted-foreground">
                  Selecione os status para filtrar
                </div>
                {statusData && Array.isArray(statusData) && statusData.length > 0 ? (
                  <div className="grid gap-3 max-h-80 overflow-y-auto">
                    {statusData.map((status: any) => (
                      <div key={status.status_nome} className="flex items-center space-x-3">
                        <Checkbox
                          id={status.status_nome}
                          checked={selectedStatus.includes(status.status_nome)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStatus([...selectedStatus, status.status_nome])
                            } else {
                              setSelectedStatus(selectedStatus.filter(s => s !== status.status_nome))
                            }
                          }}
                        />
                        <label
                          htmlFor={status.status_nome}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {status.status_nome} ({status.total})
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Carregando status...
                  </div>
                )}
                {selectedStatus.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStatus([])}
                    className="mt-2"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            Tempo real
          </Badge>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  {totalContratos.toLocaleString("pt-BR")}
                </p>
                {variacaoContratos !== 0 && (
                  <span className={`text-xs ${variacaoContratos > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {variacaoContratos > 0 ? '+' : ''}{variacaoContratos.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Contratos em processo de compra
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Referência</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  R$ {(valorReferencia / 1000000).toFixed(1)}M
                </p>
                {variacaoReferencia !== 0 && (
                  <span className={`text-xs ${variacaoReferencia > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {variacaoReferencia > 0 ? '+' : ''}{variacaoReferencia.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor de referência total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Financiado</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  R$ {(valorFinanciado / 1000000).toFixed(1)}M
                </p>
                {variacaoFinanciado !== 0 && (
                  <span className={`text-xs ${variacaoFinanciado > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {variacaoFinanciado > 0 ? '+' : ''}{variacaoFinanciado.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor financiado total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Liberado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  R$ {(valorLiberado / 1000000).toFixed(1)}M
                </p>
                {variacaoLiberado !== 0 && (
                  <span className={`text-xs ${variacaoLiberado > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {variacaoLiberado > 0 ? '+' : ''}{variacaoLiberado.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor liberado total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Parcela</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold tracking-tight text-[#ac7b39]" style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(172, 123, 57, 0.2)'
                }}>
                  R$ {(valorParcela / 1000000).toFixed(1)}M
                </p>
                {variacaoParcela !== 0 && (
                  <span className={`text-xs ${variacaoParcela > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {variacaoParcela > 0 ? '+' : ''}{variacaoParcela.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor da parcela total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Volume Chart */}
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Volume Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ym" 
                      tick={{ fontSize: 12, fill: '#ffffff' }}
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#ffffff' }} />
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => {
                        if (name === 'count') {
                          const valorFormatted = `R$ ${(props.payload.valor / 1000000).toFixed(1)}M`;
                          return [
                            <>
                              <div>{value.toLocaleString("pt-BR")} contratos</div>
                              <div style={{ color: '#ac7b39' }}>{valorFormatted}</div>
                            </>, 
                            'Volume Mensal'
                          ];
                        }
                        return [`R$ ${(props.payload.valor / 1000000).toFixed(1)}M`, 'Volume'];
                      }}
                      labelFormatter={(label) => `Período: ${label}`}
                      contentStyle={{
                        backgroundColor: '#081535',
                        border: '2px solid #ac7b39',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      labelStyle={{
                        color: '#ac7b39',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="count" fill="#ac7b39" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top Produtos ({documentData.length} produtos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : documentData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-500">Nenhum dado disponível</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#ffffff' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#ffffff' }} />
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => {
                        if (name === 'count') {
                          const valorFormatted = `R$ ${(props.payload.valor / 1000000).toFixed(1)}M`;
                          return [
                            <>
                              <div>{value.toLocaleString("pt-BR")} contratos</div>
                              <div style={{ color: '#ac7b39' }}>{valorFormatted}</div>
                            </>, 
                            'Performance do Produto'
                          ];
                        }
                        return [`R$ ${(props.payload.valor / 1000000).toFixed(1)}M`, 'Volume'];
                      }}
                      contentStyle={{
                        backgroundColor: '#081535',
                        border: '2px solid #ac7b39',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      labelStyle={{
                        color: '#ac7b39',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="count" fill="#ac7b39" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volume Evolution Chart */}
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolução de Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ym" 
                      tick={{ fontSize: 12, fill: '#ffffff' }}
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#ffffff' }}
                      tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => {
                        const contratos = props.payload.count || 0;
                        return [
                          <>
                            <div>R$ {(value / 1000000).toFixed(2)}M</div>
                            <div style={{ color: '#ac7b39' }}>{contratos.toLocaleString("pt-BR")} contratos</div>
                          </>, 
                          'Evolução'
                        ];
                      }}
                      labelFormatter={(label) => `Período: ${label}`}
                      contentStyle={{
                        backgroundColor: '#081535',
                        border: '2px solid #ac7b39',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      labelStyle={{
                        color: '#ac7b39',
                        fontWeight: 'bold'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="#ac7b39" 
                      strokeWidth={3}
                      dot={{ fill: "#ac7b39", strokeWidth: 2, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Distribuição por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="75%">
                    <PieChart>
                      <Pie
                        data={prazoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prazoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => {
                          // Procurar o valor monetário correspondente no documentData
                          const produto = documentData.find(item => item.name === props.payload.name);
                          const valorFormatted = produto ? `R$ ${(produto.valor / 1000000).toFixed(1)}M` : 'N/A';
                          
                          return [
                            <>
                              <div>{value.toLocaleString("pt-BR")} contratos</div>
                              <div style={{ color: '#ac7b39' }}>{valorFormatted}</div>
                            </>, 
                            'Distribuição'
                          ];
                        }}
                        labelFormatter={(label) => `Produto: ${label}`}
                        contentStyle={{
                          backgroundColor: '#081535',
                          border: '2px solid #ac7b39',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        labelStyle={{
                          color: '#ac7b39',
                          fontWeight: 'bold'
                        }}
                        itemStyle={{
                          color: '#ffffff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legenda customizada */}
                  <div className="mt-2">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {prazoData.slice(0, 6).map((item, index) => {
                        const total = prazoData.reduce((sum, p) => sum + p.value, 0);
                        const percent = ((item.value / total) * 100).toFixed(0);
                        return (
                          <div key={index} className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: pieColors[index % pieColors.length] }}
                            />
                            <span className="text-white" title={`${item.name}: ${percent}%`}>
                              {item.name}: {percent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
