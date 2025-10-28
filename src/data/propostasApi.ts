// Configuração da API para PostgreSQL - Propostas de Abertura
import { getApiUrl } from '@/lib/api-config';

const PROPOSTAS_API_BASE_URL = `${getApiUrl(3003, 'VITE_EXTRATO_API_URL')}/api`; // Usando o mesmo servidor do extrato

export interface PropostaAberturaItem {
  nome_cliente: string;
  data_criação: string;
  CPF_CNPJ: string;
  status: string;
  proposal_id?: number; // Para compatibilidade com o código existente
  applicant_name?: string; // Para compatibilidade com o código existente
  proposed_at?: string; // Para compatibilidade com o código existente
  document?: string; // Para compatibilidade com o código existente
  status_desc?: string; // Para compatibilidade com o código existente
  status_description?: string; // Para compatibilidade com o código existente
}

export interface PropostasEstatisticas {
  total: number;
  aprovadas_automaticamente: number;
  aprovadas_manualmente: number;
  reprovadas_manualmente: number;
  total_aprovadas: number;
  total_reprovadas: number;
  outros: number;
}

// Função para buscar dados das propostas
export const getPropostasAberturaData = async (): Promise<{
  propostas: PropostaAberturaItem[];
  estatisticas: PropostasEstatisticas;
}> => {
  try {
    const url = `${PROPOSTAS_API_BASE_URL}/propostas-abertura`;
    
    console.log('[PROPOSTAS-API] Fazendo requisição para:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[PROPOSTAS-API] Dados recebidos do servidor:', data);

    // Mapear os dados para manter compatibilidade com a interface existente
    const propostasFormatadas = data.propostas?.map((proposta: any, index: number) => {
      console.log(`[PROPOSTAS-API] Mapeando proposta ${index}:`, proposta);
      
      return {
        ...proposta,
        // Campos de compatibilidade - usando os campos do servidor
        proposal_id: proposta.proposal_id || Math.floor(Math.random() * 100000) + 1000,
        applicant_name: proposta.applicant_name || proposta.nome_cliente,
        proposed_at: proposta.proposed_at || proposta.data_criação,
        document: proposta.document || proposta.cpf_cnpj, // Usando minúsculo também
        status_desc: proposta.status_desc || proposta.status,
        status_description: proposta.status_description,
        // Campos novos da API
        nome_cliente: proposta.nome_cliente || proposta.applicant_name,
        data_criação: proposta.data_criação || proposta.proposed_at,
        CPF_CNPJ: proposta.cpf_cnpj || proposta.document, // Usando minúsculo
        status: proposta.status || proposta.status_desc
      };
    }) || [];

    console.log('[PROPOSTAS-API] Propostas formatadas:', propostasFormatadas);

    // Calcular estatísticas
    const total = propostasFormatadas.length;
    const aprovadas_automaticamente = propostasFormatadas.filter(p => 
      p.status?.toLowerCase().includes('aprovada automaticamente')).length;
    const aprovadas_manualmente = propostasFormatadas.filter(p => 
      p.status?.toLowerCase().includes('aprovada manualmente')).length;
    const reprovadas_manualmente = propostasFormatadas.filter(p => 
      p.status?.toLowerCase().includes('reprovada') || p.status?.toLowerCase().includes('negada')).length;
    const total_aprovadas = aprovadas_automaticamente + aprovadas_manualmente;
    const total_reprovadas = reprovadas_manualmente;
    const outros = total - total_aprovadas - total_reprovadas;

    const estatisticas: PropostasEstatisticas = {
      total,
      aprovadas_automaticamente,
      aprovadas_manualmente,
      reprovadas_manualmente,
      total_aprovadas,
      total_reprovadas,
      outros
    };

    return {
      propostas: propostasFormatadas,
      estatisticas
    };

  } catch (error) {
    console.error('[PROPOSTAS-API] Erro ao buscar dados:', error);
    throw error;
  }
};

// Dados mockados como fallback
export const mockPropostasData = {
  propostas: [
    { nome_cliente: 'João Silva Santos', data_criação: '2025-07-13T15:07:36-03:00', CPF_CNPJ: '123.456.789-00', status: 'Aprovada automaticamente' },
    { nome_cliente: 'Maria Oliveira Costa', data_criação: '2025-07-14T10:30:25-03:00', CPF_CNPJ: '987.654.321-00', status: 'Aprovada manualmente' },
    { nome_cliente: 'Pedro Almeida Lima', data_criação: '2025-07-15T14:22:18-03:00', CPF_CNPJ: '456.789.123-00', status: 'Reprovada manualmente' },
    { nome_cliente: 'Ana Carla Ferreira', data_criação: '2025-07-16T09:15:42-03:00', CPF_CNPJ: '789.123.456-00', status: 'Aprovada automaticamente' },
    { nome_cliente: 'Carlos Eduardo Souza', data_criação: '2025-07-17T16:45:33-03:00', CPF_CNPJ: '321.654.987-00', status: 'Aprovada manualmente' },
    { nome_cliente: 'Lucia Helena Martins', data_criação: '2025-07-18T11:20:15-03:00', CPF_CNPJ: '159.753.486-00', status: 'Aprovada automaticamente' },
    { nome_cliente: 'Roberto Carlos Silva', data_criação: '2025-07-19T13:55:28-03:00', CPF_CNPJ: '951.357.654-00', status: 'Reprovada manualmente' },
    { nome_cliente: 'Patricia Santos Lima', data_criação: '2025-07-20T08:40:12-03:00', CPF_CNPJ: '753.951.258-00', status: 'Aprovada manualmente' }
  ],
  estatisticas: {
    total: 8,
    aprovadas_automaticamente: 3,
    aprovadas_manualmente: 3,
    reprovadas_manualmente: 2,
    total_aprovadas: 6,
    total_reprovadas: 2,
    outros: 0
  }
};