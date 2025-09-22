import { useState, useEffect, useRef } from 'react'

interface UseAutoRefreshProps {
  onRefresh: () => Promise<{ hasNewData: boolean }> // Agora retorna se há dados novos
  interval?: number // em milissegundos
  enabled?: boolean
}

export function useAutoRefresh({ 
  onRefresh, 
  interval = 30000, // 30 segundos por padrão
  enabled = true 
}: UseAutoRefreshProps) {
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatLastSync = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const executeRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const result = await onRefresh()
      // Sempre atualiza o horário independente de novos dados
      setLastSync(new Date())
    } catch (error) {
      console.error('Erro no auto-refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Executar refresh inicial
    executeRefresh()

    // Configurar intervalo
    intervalRef.current = setInterval(executeRefresh, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval])

  // Limpar intervalo quando componente for desmontado
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return {
    lastSync: formatLastSync(lastSync),
    isRefreshing,
    executeRefresh
  }
}