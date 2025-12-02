import { useState } from 'react'

interface FinancialData {
  month: string
  receita: { total: number; data: Array<{ description: string; value: number }> }
  despesas: { total: number; data: Array<{ description: string; value: number }> }
  result: number
}

interface AnalysisRequest {
  question: string
  financialData?: FinancialData
}

export const useFinancialAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false)

  const analyzeFinancials = async (request: AnalysisRequest): Promise<string> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/financial/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao analisar dados')
      }

      const data = await response.json()
      return data.analysis
    } catch (error) {
      console.error('Analysis error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { analyzeFinancials, isLoading }
}
