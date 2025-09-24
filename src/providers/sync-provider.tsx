import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SyncContextType {
  lastSync: string
  isRefreshing: boolean
  updateSync: (timestamp: string) => void
  setRefreshing: (refreshing: boolean) => void
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

interface SyncProviderProps {
  children: ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [lastSync, setLastSync] = useState<string>('--:--:--')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const updateSync = (timestamp: string) => {
    console.log('[SYNC PROVIDER] Recebendo timestamp:', timestamp);
    setLastSync(timestamp)
  }

  const setRefreshing = (refreshing: boolean) => {
    setIsRefreshing(refreshing)
  }

  return (
    <SyncContext.Provider value={{
      lastSync,
      isRefreshing,
      updateSync,
      setRefreshing
    }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSync deve ser usado dentro de um SyncProvider')
  }
  return context
}