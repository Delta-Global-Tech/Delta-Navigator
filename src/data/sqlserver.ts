// Configuração da API backend
const API_BASE_URL = `http://${window.location.hostname}:3001/api`;

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface ApiResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const getProducaoNovoData = async (params: PaginationParams = {}): Promise<ApiResponse<any>> => {
  try {
    const { page = 1, limit = 1000 } = params;
    const url = new URL(`${API_BASE_URL}/producao/novo`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados da API:', error);
    throw new Error('Falha ao carregar dados de produção');
  }
};

// Função auxiliar para buscar todos os dados (para compatibilidade)
export const getAllProducaoNovoData = async () => {
  try {
    // Busca a primeira página para saber quantos registros existem
    const firstPage = await getProducaoNovoData({ page: 1, limit: 1000 });
    
    // Se houver mais páginas, busca todas
    if (firstPage.pagination.totalPages > 1) {
      const allRequests = [];
      for (let page = 1; page <= Math.min(firstPage.pagination.totalPages, 25); page++) {
        allRequests.push(getProducaoNovoData({ page, limit: 1000 }));
      }
      
      const allPages = await Promise.all(allRequests);
      const allData = allPages.flatMap(pageData => pageData.data);
      
      return {
        data: allData,
        pagination: {
          ...firstPage.pagination,
          currentPage: 1,
          totalRecords: allData.length
        }
      };
    }
    
    return firstPage;
  } catch (error) {
    console.error('Erro ao buscar todos os dados da API:', error);
    throw new Error('Falha ao carregar todos os dados de produção');
  }
};

// Função para buscar KPIs otimizados (muito mais rápido)
export const getProducaoNovoKPIs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/producao/novo/kpis`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar KPIs da API:', error);
    throw new Error('Falha ao carregar KPIs de produção');
  }
};

// Função para buscar dados mensais agregados
export const getProducaoNovoMonthly = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/producao/novo/monthly`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados mensais da API:', error);
    throw new Error('Falha ao carregar dados mensais');
  }
};

// Função para buscar ranking de produtos
export const getProducaoNovoProdutos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/producao/novo/produtos`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar ranking de produtos da API:', error);
    throw new Error('Falha ao carregar ranking de produtos');
  }
};

// ===== FUNÇÕES PARA PRODUCAO COMPRA =====

// Função para buscar status disponíveis
export const getProducaoCompraStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/producao/compra/status`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar status da API:', error);
    throw new Error('Falha ao carregar status disponíveis');
  }
};

// Função para buscar KPIs da produção COMPRA com filtros
export const getProducaoCompraKPIs = async (statusFilter?: string[]) => {
  try {
    let url = `${API_BASE_URL}/producao/compra/kpis`;
    if (statusFilter && statusFilter.length > 0) {
      const statusParams = statusFilter.map(s => `status=${encodeURIComponent(s)}`).join('&');
      url += `?${statusParams}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar KPIs COMPRA da API:', error);
    throw new Error('Falha ao carregar KPIs de produção COMPRA');
  }
};

// Função para buscar dados mensais agregados COMPRA com filtros
export const getProducaoCompraMonthly = async (statusFilter?: string[]) => {
  try {
    let url = `${API_BASE_URL}/producao/compra/monthly`;
    if (statusFilter && statusFilter.length > 0) {
      const statusParams = statusFilter.map(s => `status=${encodeURIComponent(s)}`).join('&');
      url += `?${statusParams}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados mensais COMPRA da API:', error);
    throw new Error('Falha ao carregar dados mensais COMPRA');
  }
};

// Função para buscar ranking de produtos COMPRA com filtros
export const getProducaoCompraProdutos = async (statusFilter?: string[]) => {
  try {
    let url = `${API_BASE_URL}/producao/compra/produtos`;
    if (statusFilter && statusFilter.length > 0) {
      const statusParams = statusFilter.map(s => `status=${encodeURIComponent(s)}`).join('&');
      url += `?${statusParams}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar produtos COMPRA da API:', error);
    throw new Error('Falha ao carregar ranking de produtos COMPRA');
  }
};

// ===== FUNÇÕES PARA PRODUCAO NOVO =====

export const getProducaoCompraData = async (params: PaginationParams = {}): Promise<ApiResponse<any>> => {
  try {
    const { page = 1, limit = 1000 } = params;
    const url = new URL(`${API_BASE_URL}/producao/compra`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados COMPRA da API:', error);
    throw new Error('Falha ao carregar dados de produção COMPRA');
  }
};
