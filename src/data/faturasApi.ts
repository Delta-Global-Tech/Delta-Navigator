// Configuração da API para PostgreSQL - Faturas de Cartão
const FATURAS_API_BASE_URL = `http://${window.location.hostname}:3003/api`; // Dinâmico para qualquer ambiente

export interface FaturaData {
  account_id: string;
  personal_name: string;
  personal_document: string;
  email: string;
  statement_id: string;
  kind: string;
  balance: number;
  fechamento: string;
  vencimento: string;
  status: string;
}

export interface FaturasSummary {
  totalFaturas: number;
  valorTotal: number;
  valorMedio: number;
  clientesUnicos: number;
  emAberto: number;
  vencidas: number;
  pagas: number;
  valorEmAberto: number;
  valorVencido: number;
  valorPago: number;
}

// Função para buscar dados das faturas
export const getFaturasData = async (
  personalDocument?: string,
  status?: string
): Promise<{ data: FaturaData[]; summary: FaturasSummary }> => {
  try {
    let url = `${FATURAS_API_BASE_URL}/faturas`;
    const params = new URLSearchParams();
    
    if (personalDocument && personalDocument.trim() !== '') {
      params.append('personalDocument', personalDocument);
    }
    
    if (status && status !== 'todos') {
      params.append('status', status);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Calcular summary
    const summary = calculateFaturasSummary(data.data || []);
    
    return {
      data: data.data || [],
      summary
    };
  } catch (error) {
    console.error('Erro ao buscar dados das faturas:', error);
    throw error;
  }
};

// Função para calcular o resumo das faturas
const calculateFaturasSummary = (data: FaturaData[]): FaturasSummary => {
  if (!data || data.length === 0) {
    return {
      totalFaturas: 0,
      valorTotal: 0,
      valorMedio: 0,
      clientesUnicos: 0,
      emAberto: 0,
      vencidas: 0,
      pagas: 0,
      valorEmAberto: 0,
      valorVencido: 0,
      valorPago: 0,
    };
  }

  const totalFaturas = data.length;
  const valorTotal = data.reduce((sum, fatura) => sum + fatura.balance, 0);
  const valorMedio = valorTotal / totalFaturas;
  
  // Contar clientes únicos
  const clientesUnicos = new Set(data.map(fatura => fatura.personal_document)).size;
  
  // Contar por status e calcular valores
  let emAberto = 0;
  let vencidas = 0;
  let pagas = 0;
  let valorEmAberto = 0;
  let valorVencido = 0;
  let valorPago = 0;
  
  data.forEach(fatura => {
    switch (fatura.status.toLowerCase()) {
      case 'em aberto':
        emAberto++;
        valorEmAberto += fatura.balance;
        break;
      case 'vencida':
      case 'vencidas':
        vencidas++;
        valorVencido += fatura.balance;
        break;
      case 'paga':
      case 'pagas':
        pagas++;
        valorPago += fatura.balance;
        break;
    }
  });
  
  return {
    totalFaturas,
    valorTotal,
    valorMedio,
    clientesUnicos,
    emAberto,
    vencidas,
    pagas,
    valorEmAberto,
    valorVencido,
    valorPago,
  };
};
