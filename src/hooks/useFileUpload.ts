import { useState } from 'react'
import * as XLSX from 'xlsx'

export interface UploadedFile {
  name: string
  size: number
  type: string
  data: any[]
  sheets?: string[]
  lastModified: Date
}

export interface UploadError {
  message: string
  code: string
}

export function useFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<UploadError | null>(null)

  const processExcelFile = async (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          
          // Get all sheet names
          const sheets = workbook.SheetNames
          
          // Process all sheets into one dataset
          let allData: any[] = []
          sheets.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName]
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            
            // Add sheet name to each row for tracking
            const processedData = sheetData.slice(1).map((row: any) => {
              const obj: any = { _sheet: sheetName }
              const headers = sheetData[0] as string[]
              
              headers.forEach((header, index) => {
                obj[header] = row[index]
              })
              
              return obj
            })
            
            allData = [...allData, ...processedData]
          })

          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            data: allData,
            sheets,
            lastModified: new Date(file.lastModified)
          })
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsBinaryString(file)
    })
  }

  const processJsonFile = async (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)
          
          // Ensure data is an array
          const arrayData = Array.isArray(data) ? data : [data]
          
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            data: arrayData,
            lastModified: new Date(file.lastModified)
          })
        } catch (error) {
          reject(new Error('Arquivo JSON inválido'))
        }
      }
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsText(file)
    })
  }

  const uploadFiles = async (files: FileList | File[]) => {
    setIsUploading(true)
    setUploadError(null)
    
    try {
      const fileArray = Array.from(files)
      const processed: UploadedFile[] = []
      
      for (const file of fileArray) {
        // Validate file type
        const isExcel = file.name.match(/\.(xlsx|xls)$/i)
        const isJson = file.name.match(/\.json$/i)
        
        if (!isExcel && !isJson) {
          throw new Error(`Tipo de arquivo não suportado: ${file.name}`)
        }
        
        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`Arquivo muito grande: ${file.name} (máximo 50MB)`)
        }
        
        if (isExcel) {
          const uploadedFile = await processExcelFile(file)
          processed.push(uploadedFile)
        } else if (isJson) {
          const uploadedFile = await processJsonFile(file)
          processed.push(uploadedFile)
        }
      }
      
      setUploadedFiles(prev => [...prev, ...processed])
      return processed
    } catch (error) {
      const uploadError = {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'UPLOAD_ERROR'
      }
      setUploadError(uploadError)
      throw uploadError
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName))
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
    setUploadError(null)
  }

  const getFileData = (fileName?: string) => {
    if (!fileName) {
      // Return combined data from all files
      return uploadedFiles.reduce((acc, file) => [...acc, ...file.data], [] as any[])
    }
    
    const file = uploadedFiles.find(f => f.name === fileName)
    return file?.data || []
  }

  return {
    uploadedFiles,
    isUploading,
    uploadError,
    uploadFiles,
    removeFile,
    clearAllFiles,
    getFileData
  }
}