// Configuração da API para PostgreSQL
const POSTGRES_API_BASE_URL = 'http://localhost:3002/api';

// Função para buscar dados do funil
export const getFunilData = async (produto?: string, status?: string) => {
  try {
    let url = `${POSTGRES_API_BASE_URL}/funil/data`;
    const params = new URLSearchParams();
    
    if (produto) {
      params.append('produto', produto);
    }
    
    if (status) {
      params.append('status', status);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do funil:', error);
    throw new Error('Falha ao carregar dados do funil');
  }
};

// Função para buscar dados do funil por etapa específica
export const getFunilDataByStep = async (stepId: number, produto?: string, status?: string) => {
  try {
    const params = new URLSearchParams();
    params.append('step', stepId.toString());
    
    if (produto) {
      params.append('produto', produto);
    }
    
    if (status) {
      params.append('status', status);
    }
    
    const url = `${POSTGRES_API_BASE_URL}/funil/data?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do funil por etapa:', error);
    throw new Error('Falha ao carregar dados do funil por etapa');
  }
};

// Função para buscar status disponíveis do funil
export const getFunilStatus = async () => {
  try {
    const url = `${POSTGRES_API_BASE_URL}/funil/status`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.status || [];
  } catch (error) {
    console.error('Erro ao buscar status do funil:', error);
    throw new Error('Falha ao carregar status do funil');
  }
};

// Função para buscar KPIs do funil
export const getFunilKPIs = async (produto?: string, status?: string) => {
  try {
    const params = new URLSearchParams();
    
    if (produto) {
      params.append('produto', produto);
    }
    
    if (status) {
      params.append('status', status);
    }
    
    let url = `${POSTGRES_API_BASE_URL}/funil/kpis`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar KPIs do funil:', error);
    throw new Error('Falha ao carregar KPIs do funil');
  }
};
