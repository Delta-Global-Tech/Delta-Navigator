import { useCallback, useState } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useFileUpload, UploadedFile } from '@/hooks/useFileUpload'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  className?: string
}

export function FileUpload({ onFilesUploaded, className }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const { uploadedFiles, isUploading, uploadError, uploadFiles, removeFile, clearAllFiles } = useFileUpload()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      try {
        const uploaded = await uploadFiles(e.dataTransfer.files)
        onFilesUploaded?.(uploaded)
      } catch (error) {
        // Error handled by hook
      }
    }
  }, [uploadFiles, onFilesUploaded])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const uploaded = await uploadFiles(e.target.files)
        onFilesUploaded?.(uploaded)
      } catch (error) {
        // Error handled by hook
      }
    }
  }, [uploadFiles, onFilesUploaded])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadSample = () => {
    const sampleData = [
      {
        matricula: '12345',
        data_formalizacao: '2024-01-15',
        tipo_documento: 'CONSIGNADO',
        valor_parcela: 1500.00,
        prazo: 84
      },
      {
        matricula: '67890',
        data_formalizacao: '2024-01-16',
        tipo_documento: 'CARTAO',
        valor_parcela: 2000.00,
        prazo: 36
      }
    ]
    
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exemplo-dados.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              isUploading && 'pointer-events-none opacity-50'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUploading) {
                document.getElementById('file-input')?.click()
              }
            }}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".xlsx,.xls,.json"
              onChange={handleFileInput}
              className="hidden"
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Processando arquivos...</p>
                  <Progress value={undefined} className="w-full max-w-xs mx-auto" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className={cn(
                  'h-12 w-12 mx-auto transition-colors',
                  isDragActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Suporte para .xlsx, .xls e .json (máximo 50MB por arquivo)
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Arquivos Carregados ({uploadedFiles.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearAllFiles}>
              Limpar Todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.data.length.toLocaleString()} registros</span>
                        {file.sheets && file.sheets.length > 1 && (
                          <>
                            <span>•</span>
                            <span>{file.sheets.length} planilhas</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {file.type.includes('excel') || file.name.includes('.xlsx') ? 'Excel' : 'JSON'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Download */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Arquivo de Exemplo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Baixe um arquivo de exemplo para ver a estrutura esperada
            </p>
            <Button variant="outline" size="sm" onClick={downloadSample}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Exemplo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}