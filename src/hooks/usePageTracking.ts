import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que rastreia a página atual para o AdminMonitoring
 * Atualiza sessionStorage sempre que a rota muda
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Extrair o nome da página do pathname
    const pathname = location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const pageName = parts[parts.length - 1] || 'Dashboard';
    
    // Formatar o nome da página (ex: 'desembolso' -> 'Desembolso')
    const formattedPageName = pageName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Atualizar sessionStorage
    sessionStorage.setItem('currentPage', formattedPageName);

    console.log(`[PageTracking] Current page: ${formattedPageName} (${pathname})`);
  }, [location]);
};
