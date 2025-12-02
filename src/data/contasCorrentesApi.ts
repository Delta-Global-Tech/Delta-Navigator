// Configuração da API para PostgreSQL - Contas Correntes
import { getApiUrl } from '@/lib/api-config';

const CONTRATOS_API_BASE_URL = `${getApiUrl(3004, 'VITE_API_CONTRATOS_URL')}/api`; // Usando porta do contratos

export interface ContaCorrente {
  id: string;
  nr_agencia: string;
  usuario_resumido: string;
  nome_cliente: string;
  tipo: string;
  produto: string;
  dt_abert: string;
  dt_ult_mov: string;
}

export interface ContasCorrentesResponse {
  success: boolean;
  data: ContaCorrente[];
  count: number;
}

// Função para buscar dados das contas correntes
export const getContasCorrentesData = async (): Promise<ContasCorrentesResponse> => {
  try {
    const url = `${CONTRATOS_API_BASE_URL}/contas-correntes`;
    console.log(`[CONTAS-CORRENTES-API] Fetching from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[CONTAS-CORRENTES-API] Recebido ${data.count} contas correntes`);
    return data;
  } catch (error) {
    console.error('[CONTAS-CORRENTES-API] Erro ao buscar contas correntes:', error);
    throw error;
  }
};
