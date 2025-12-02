// Configuração da API para Extrato de Cartão de Crédito
import { getApiUrl } from '@/lib/api-config';

const EXTRATO_API_BASE_URL = `${getApiUrl(3003, 'VITE_EXTRATO_API_URL')}/api`;

export interface ExtratoCartaoCreditoItem {
  nome: string;
  cpf_cnpj: string;
  aberta_ou_fechada: string;
  data_trasacao: string;
  descricao: string;
  valor: number;
  limite_cartao: number;
  debito_ou_credito: string;
  data_fechamento: string | null;
  data_pagamento: string | null;
}

export interface ExtratoCartaoCreditoResponse {
  success: boolean;
  data: ExtratoCartaoCreditoItem[];
  count: number;
  query: {
    personalDocument?: string;
    dataInicio?: string;
    dataFim?: string;
  };
}

/**
 * Busca dados de extrato de cartão de crédito
 * @param personalDocument - CPF/CNPJ opcional para filtrar
 * @param dataInicio - Data de início no formato DD/MM/YYYY
 * @param dataFim - Data de fim no formato DD/MM/YYYY
 */
export const getExtratoCartaoCreditoData = async (
  personalDocument?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<ExtratoCartaoCreditoResponse> => {
  try {
    let url = `${EXTRATO_API_BASE_URL}/extrato-cartao-credito`;
    const params = new URLSearchParams();

    if (personalDocument && personalDocument.trim()) {
      params.append('personalDocument', personalDocument.trim());
    }

    if (dataInicio && dataInicio.trim()) {
      params.append('dataInicio', dataInicio.trim());
    }

    if (dataFim && dataFim.trim()) {
      params.append('dataFim', dataFim.trim());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`[API] Buscando extrato cartão de crédito: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar extrato: ${response.statusText}`);
    }

    const data: ExtratoCartaoCreditoResponse = await response.json();
    console.log(`[API] Extrato cartão crédito retornou ${data.count} registros`);

    return data;
  } catch (error) {
    console.error('[API] Erro ao buscar extrato de cartão de crédito:', error);
    throw error;
  }
};

/**
 * Formata valor monetário em BRL
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

/**
 * Formata data para exibição
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

/**
 * Formata CPF/CNPJ
 */
export const formatCpfCnpj = (value: string): string => {
  if (!value) return '-';
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length === 11) {
    // CPF
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    // CNPJ
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return value;
};
