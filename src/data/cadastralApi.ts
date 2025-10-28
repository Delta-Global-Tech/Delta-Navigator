// Configuração da API para PostgreSQL - Cadastral de Clientes
import { getApiUrl } from '@/lib/api-config';

const EXTRATO_API_BASE_URL = `${getApiUrl(3003, 'VITE_EXTRATO_API_URL')}/api`;

console.log('[Cadastral API] URL Base:', EXTRATO_API_BASE_URL);

export interface ClienteCadastral {
  account_id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  numero_da_conta: string;
  status_conta: string;
  credit_limit: number;
  estado: string;
  cidade: string;
  data_criacao: string | null;
}

export interface MapaCidade {
  estado: string;
  cidade: string;
  quantidade_clientes: number;
  total_credito_liberado: number;
  credito_medio: number;
}

export interface EstatisticasCadastral {
  total_clientes: number;
  clientes_ativos: number;
  clientes_inativos: number;
  total_credito_liberado: number;
  credito_medio: number;
  total_estados: number;
  total_cidades: number;
}

export interface EvolucaoMensal {
  mes: string;
  mes_nome: string;
  total_cadastros: number;
  total_credito_liberado: number;
  credito_medio_mes: number;
}

// Buscar lista de clientes com filtros
export const getClientesCadastral = async (
  search?: string,
  estado?: string,
  limite?: number,
  dataInicio?: string,
  dataFim?: string
): Promise<{ clientes: ClienteCadastral[]; total: number }> => {
  try {
    let url = `${EXTRATO_API_BASE_URL}/cadastral/clientes`;
    const params = new URLSearchParams();

    if (search) {
      params.append('search', search);
    }

    if (estado) {
      params.append('estado', estado);
    }

    if (limite) {
      params.append('limite', limite.toString());
    }

    if (dataInicio) {
      params.append('dataInicio', dataInicio);
    }

    if (dataFim) {
      params.append('dataFim', dataFim);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`Fetching cadastral clients from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Cadastral API] HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      clientes: data.clientes || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar clientes cadastral:', error);
    throw error;
  }
};

// Buscar mapa de clientes por cidade
export const getMapaCidades = async (
  estado?: string
): Promise<{ dados: MapaCidade[]; total_cidades: number }> => {
  try {
    let url = `${EXTRATO_API_BASE_URL}/cadastral/mapa-cidades`;
    const params = new URLSearchParams();

    if (estado) {
      params.append('estado', estado);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`Fetching mapa cidades from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      dados: data.dados || [],
      total_cidades: data.total_cidades || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar mapa de cidades:', error);
    throw error;
  }
};

// Buscar estatísticas gerais
export const getEstatisticasCadastral = async (
  dataInicio?: string,
  dataFim?: string
): Promise<EstatisticasCadastral> => {
  try {
    let url = `${EXTRATO_API_BASE_URL}/cadastral/estatisticas`;
    const params = new URLSearchParams();

    if (dataInicio) {
      params.append('dataInicio', dataInicio);
    }

    if (dataFim) {
      params.append('dataFim', dataFim);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`Fetching cadastral statistics from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas cadastral:', error);
    throw error;
  }
};

// Buscar evolução mensal de cadastros e crédito
export const getEvolucaoMensal = async (
  dataInicio?: string,
  dataFim?: string
): Promise<{ dados: EvolucaoMensal[]; total_meses: number }> => {
  try {
    let url = `${EXTRATO_API_BASE_URL}/cadastral/evolucao-mensal`;
    const params = new URLSearchParams();

    if (dataInicio) {
      params.append('dataInicio', dataInicio);
    }

    if (dataFim) {
      params.append('dataFim', dataFim);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`Fetching monthly evolution from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar evolução mensal:', error);
    throw error;
  }
};

// Buscar cliente por account_id
export const getClienteByAccountId = async (
  accountId: string | number
): Promise<ClienteCadastral | null> => {
  try {
    // Tenta buscar todos os clientes e filtra localmente
    const response = await getClientesCadastral(undefined, undefined, 1000);
    const cliente = response.clientes.find(c => c.account_id === accountId.toString());
    return cliente || null;
  } catch (error) {
    console.error('Erro ao buscar cliente por account_id:', error);
    return null;
  }
};
