import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/data/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Eye, Download, AlertCircle } from 'lucide-react'

interface AuditLog {
  id: string
  user_email: string
  action: string
  resource: string
  resource_id?: string
  details?: any
  status: 'success' | 'error' | 'warning'
  error_message?: string
  created_at: string
}

const ACTIONS = ['LOGIN', 'LOGOUT', 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT']
const RESOURCES = ['Sistema', 'Dashboard', 'Contratos', 'Faturas', 'Propostas', 'Desembolso']

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)

  // Filtros
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedResource, setSelectedResource] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [page, selectedAction, selectedResource, selectedStatus, searchEmail, dateFrom, dateTo])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = (supabase as any).from('audit_logs').select('*', { count: 'exact' })

      // Aplicar filtros
      if (searchEmail) {
        query = query.ilike('user_email', `%${searchEmail}%`)
      }

      if (selectedAction) {
        query = query.eq('action', selectedAction)
      }

      if (selectedResource) {
        query = query.eq('resource', selectedResource)
      }

      if (selectedStatus) {
        query = query.eq('status', selectedStatus)
      }

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00`)
      }

      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`)
      }

      // Paginação
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      setLogs(data || [])
      setTotalCount(count || 0)
    } catch (err: any) {
      console.error('Erro ao buscar logs:', err)
      setError(err.message || 'Erro ao carregar audit logs')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800'
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800'
      case 'EXPORT':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-slate-50'
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />
    return null
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Email', 'Ação', 'Recurso', 'ID', 'Status', 'Detalhes']
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      log.user_email,
      log.action,
      log.resource,
      log.resource_id || '-',
      log.status,
      log.details ? JSON.stringify(log.details) : '-',
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground mt-2">Registro de todas as ações no sistema</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Email do Usuário</label>
              <Input
                placeholder="Buscar email..."
                value={searchEmail}
                onChange={e => {
                  setSearchEmail(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ação</label>
              <Select value={selectedAction} onValueChange={val => {
                setSelectedAction(val)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {ACTIONS.map(action => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Recurso</label>
              <Select value={selectedResource} onValueChange={val => {
                setSelectedResource(val)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {RESOURCES.map(resource => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={val => {
                setSelectedStatus(val)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">De</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Até</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearchEmail('')
                setSelectedAction('')
                setSelectedResource('')
                setSelectedStatus('')
                setDateFrom('')
                setDateTo('')
                setPage(1)
              }}
              className="mt-6"
            >
              Limpar Filtros
            </Button>

            <Button
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="mt-6"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Logs ({totalCount} total)
          </CardTitle>
          <CardDescription>
            Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalCount)} de {totalCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>ID do Recurso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow
                      key={log.id}
                      className={getStatusColor(log.status)}
                    >
                      <TableCell className="text-xs">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">{log.user_email}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.resource}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.resource_id || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="text-xs capitalize">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.error_message && (
                          <div className="text-red-600 font-medium">{log.error_message}</div>
                        )}
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-primary">Ver dados</summary>
                            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-auto max-h-40">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="flex items-center justify-between gap-4 pt-4">
                <div className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
