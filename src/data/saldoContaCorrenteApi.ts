// Configuração da API para PostgreSQL - Saldo Conta Corrente
import { getApiUrl } from '@/lib/api-config';

const CONTRATOS_API_BASE_URL = `${getApiUrl(3004, 'VITE_API_CONTRATOS_URL')}/api`; // Usando porta do contratos

export interface SaldoContaCorrente {
  id: string;
  dt_movimento: string;
  cod_cliente: string;
  nr_cpf_cnpj_cc: string;
  cliente: string;
  produto: string;
  ult_mov: string;
  sdo_anterior: number;
  debito: number;
  credito: number;
  vlr_bloqueado: number;
  limite: number;
  sdo_disponivel: number;
  sdo_contabil: number;
  gerente: string;
  situacao: string;
}

export interface SaldoContaCorrenteResponse {
  success: boolean;
  data: SaldoContaCorrente[];
  count: number;
}

// Função para buscar dados de saldo conta corrente
export const getSaldoContaCorrenteData = async (): Promise<SaldoContaCorrenteResponse> => {
  try {
    const url = `${CONTRATOS_API_BASE_URL}/saldo-conta-corrente`;
    console.log(`[SALDO-CONTA-CORRENTE-API] Fetching from: ${url}`);
    
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
    console.log(`[SALDO-CONTA-CORRENTE-API] Recebido ${data.count} registros`);
    return data;
  } catch (error) {
    console.error('[SALDO-CONTA-CORRENTE-API] Erro ao buscar saldo conta corrente:', error);
    throw error;
  }
};
