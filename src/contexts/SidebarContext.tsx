import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SidebarContextType {
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Memoize callback para evitar re-renders desnecessários
  const handleSetIsMinimized = useCallback((value: boolean) => {
    setIsMinimized(value);
  }, []);

  // Memoize value para evitar novas references a cada render
  const value = useMemo(() => ({
    isMinimized,
    setIsMinimized: handleSetIsMinimized
  }), [isMinimized, handleSetIsMinimized]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
}
