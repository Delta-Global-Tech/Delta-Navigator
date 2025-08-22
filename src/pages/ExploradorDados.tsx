import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, Database, Eye, Settings, Table2, BarChart3 } from "lucide-react"
import { FileUpload } from '@/components/FileUpload'
import { useFileUpload } from '@/hooks/useFileUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ExploradorDados() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const { uploadedFiles, getFileData } = useFileUpload()

  // Mock table data structure
  const tables = [
    {
      name: 'aberturas_contas',
      displayName: 'Abertura de Contas',
      rows: 12540,
      columns: 7,
      lastUpdated: '2024-01-20',
      description: 'Dados de abertura de contas por canal e segmento'
    },
    {
      name: 'producao_total_novo',
      displayName: 'Produção Total NOVO',
      rows: 8932,
      columns: 8,
      lastUpdated: '2024-01-20',
      description: 'Contratos NOVO formalizados'
    },
    {
      name: 'producao_total_compra',
      displayName: 'Produção Total COMPRA',
      rows: 5467,
      columns: 8,
      lastUpdated: '2024-01-20',
      description: 'Contratos COMPRA formalizados'
    },
    {
      name: 'producao_fila_novo',
      displayName: 'Fila Pagamento NOVO',
      rows: 1234,
      columns: 11,
      lastUpdated: '2024-01-20',
      description: 'Contratos NOVO aguardando pagamento'
    },
    {
      name: 'producao_fila_compra',
      displayName: 'Fila Pagamento COMPRA',
      rows: 789,
      columns: 11,
      lastUpdated: '2024-01-20',
      description: 'Contratos COMPRA aguardando pagamento'
    },
    {
      name: 'producao_paga_novo',
      displayName: 'Produção Paga NOVO',
      rows: 3456,
      columns: 10,
      lastUpdated: '2024-01-20',
      description: 'Contratos NOVO com pagamento liberado'
    },
    {
      name: 'producao_paga_compra',
      displayName: 'Produção Paga COMPRA',
      rows: 2123,
      columns: 10,
      lastUpdated: '2024-01-20',
      description: 'Contratos COMPRA com pagamento liberado'
    }
  ]

  const filteredTables = tables.filter(table =>
    table.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
  }

  const currentData = selectedTable ? getFileData() : []

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <Search className="h-6 w-6 text-primary" />
            Explorador de Dados
          </h1>
          <p className="section-subtitle">
            Análise detalhada e exploração dos dados do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-success/20 text-success">
            <Database className="h-3 w-3 mr-1" />
            {tables.length} tabelas
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">Tabelas do Sistema</TabsTrigger>
          <TabsTrigger value="upload">Upload de Dados</TabsTrigger>
          <TabsTrigger value="analysis">Análise Avançada</TabsTrigger>
        </TabsList>

        {/* System Tables Tab */}
        <TabsContent value="tables" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar tabelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTables.map((table) => (
              <Card 
                key={table.name} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTable === table.name ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => handleTableSelect(table.name)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Table2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{table.displayName}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Linhas</p>
                      <p className="font-medium">{table.rows.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Colunas</p>
                      <p className="font-medium">{table.columns}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Atualizado em {table.lastUpdated}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Data Preview */}
          {selectedTable && (
            <Card className="chart-container">
              <CardHeader className="chart-toolbar">
                <div>
                  <CardTitle className="chart-title">
                    Preview: {filteredTables.find(t => t.name === selectedTable)?.displayName}
                  </CardTitle>
                  <p className="chart-subtitle">Primeiras 10 linhas da tabela</p>
                </div>
                <Badge variant="outline">Conectado ao Supabase</Badge>
              </CardHeader>
              <CardContent>
                <div className="zero-state">
                  <Database className="zero-state-icon" />
                  <h3 className="zero-state-title">Preview de Dados</h3>
                  <p className="zero-state-description">
                    Conecte-se ao Supabase para visualizar os dados da tabela selecionada
                  </p>
                  <Button className="mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <FileUpload
            onFilesUploaded={(files) => {
              console.log('Files uploaded:', files)
            }}
          />

          {/* Uploaded Files Data Preview */}
          {uploadedFiles.length > 0 && (
            <Card className="chart-container">
              <CardHeader className="chart-toolbar">
                <div>
                  <CardTitle className="chart-title">Dados Carregados</CardTitle>
                  <p className="chart-subtitle">
                    {getFileData().length.toLocaleString()} registros de {uploadedFiles.length} arquivo(s)
                  </p>
                </div>
                <Badge variant="outline">Local</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{file.name}</h4>
                        <Badge variant="secondary">
                          {file.data.length.toLocaleString()} registros
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Colunas: {Object.keys(file.data[0] || {}).length}</p>
                        <p>Tamanho: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {file.sheets && (
                          <p>Planilhas: {file.sheets.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="chart-container">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise Estatística
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="zero-state">
                  <BarChart3 className="zero-state-icon" />
                  <h3 className="zero-state-title">Estatísticas</h3>
                  <p className="zero-state-description">
                    Análise estatística dos dados será exibida aqui
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="chart-container">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Qualidade dos Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="zero-state">
                  <Database className="zero-state-icon" />
                  <h3 className="zero-state-title">Qualidade</h3>
                  <p className="zero-state-description">
                    Relatório de qualidade dos dados
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="chart-container">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Correlações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="zero-state">
                  <Search className="zero-state-icon" />
                  <h3 className="zero-state-title">Correlações</h3>
                  <p className="zero-state-description">
                    Análise de correlações entre variáveis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}