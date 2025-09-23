// Configuração dinâmica de URLs das APIs para funcionar em rede
export const getApiUrl = (port: string | number, envVarName?: string) => {
  // Se estiver no browser, usa o hostname atual
  if (typeof window !== 'undefined') {
    const currentHostname = window.location.hostname;
    console.log(`[API-CONFIG] Current hostname: ${currentHostname}, Port: ${port}`);
    
    // Se a variável de ambiente existe
    if (envVarName && import.meta.env[envVarName]) {
      const envUrl = import.meta.env[envVarName];
      console.log(`[API-CONFIG] Env var ${envVarName}: ${envUrl}`);
      
      // Se a URL do .env contém localhost, substitui pelo hostname atual
      if (envUrl.includes('localhost')) {
        const dynamicUrl = envUrl.replace('localhost', currentHostname);
        console.log(`[API-CONFIG] Dynamic URL: ${dynamicUrl}`);
        return dynamicUrl;
      }
      
      // Se já contém o hostname correto, usa como está
      if (envUrl.includes(currentHostname)) {
        console.log(`[API-CONFIG] Using env URL as is: ${envUrl}`);
        return envUrl;
      }
    }
    
    // Construir URL dinamicamente
    const dynamicUrl = `http://${currentHostname}:${port}`;
    console.log(`[API-CONFIG] Constructed dynamic URL: ${dynamicUrl}`);
    return dynamicUrl;
  }
  
  // Fallback para localhost (usado em SSR/build)
  const fallbackUrl = `http://localhost:${port}`;
  console.log(`[API-CONFIG] Using fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
};

// URLs das APIs com fallback inteligente
export const API_URLS = {
  SQLSERVER: getApiUrl(3001, 'VITE_API_SQLSERVER_URL'),
  POSTGRES: getApiUrl(3002, 'VITE_API_POSTGRES_URL'), 
  EXTRATO: getApiUrl(3003, 'VITE_EXTRATO_API_URL'),
} as const;

// Log das URLs geradas para debug
console.log('[API-CONFIG] URLs geradas:', API_URLS);

// Função para obter URL da API com path
export const getApiEndpoint = (apiType: keyof typeof API_URLS, path: string) => {
  return `${API_URLS[apiType]}${path.startsWith('/') ? path : `/${path}`}`;
};

// Utilitário para logging
export const logApiCall = (url: string, type: 'REQUEST' | 'SUCCESS' | 'ERROR' = 'REQUEST') => {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
  console.log(`[${type}] ${timestamp} - Host: ${hostname} - API: ${url}`);
};