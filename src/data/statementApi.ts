// Configuração da API para PostgreSQL - Extrato
const EXTRATO_API_BASE_URL = `http://${window.location.hostname}:3003/api`; // Dinâmico para qualquer ambiente

export interface StatementItem {
  personal_name: string;
  personal_document: string;
  email: string;
  status_description: string;
  transaction_date: string;
  type: string;
  description: string;
  pix_free_description: string;
  amount: string; // Mudado para string pois vem assim do servidor
  saldo_posterior: string;
  beneficiario: string;
  banco_beneficiario: string;
  nome_pagador: string;
}

export interface StatementSummary {
  totalCredits: number;
  totalDebits: number;
  ticketMedio: number;
  currentBalance: number;
  previousBalance: number;
  transactionCount: number;
  period: {
    start: string;
    end: string;
  };
}

// Função para buscar dados do extrato
export const getStatementData = async (
  startDate?: string,
  endDate?: string,
  personalDocument?: string
): Promise<{ data: StatementItem[]; summary: StatementSummary }> => {
  try {
    let url = `${EXTRATO_API_BASE_URL}/statement`;
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    if (personalDocument) {
      params.append('personalDocument', personalDocument);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Processar os dados para calcular o resumo
    const summary = calculateSummary(data.data || []);
    
    return {
      data: data.data || [],
      summary
    };
  } catch (error) {
    console.error('Erro ao buscar dados do extrato:', error);
    throw new Error('Falha ao carregar dados do extrato');
  }
};

// Função para calcular o resumo dos dados
const calculateSummary = (data: StatementItem[]): StatementSummary => {
  const credits = data.filter(item => item.type === 'credit');
  const debits = data.filter(item => item.type === 'debit');
  
  const totalCredits = credits.reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0);
  const totalDebits = debits.reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0);
  const netFlow = totalCredits - totalDebits;
  
  // Calcular ticket médio das transações
  const totalTransactionValue = totalCredits + totalDebits;
  const transactionCount = credits.length + debits.length;
  const ticketMedio = transactionCount > 0 ? totalTransactionValue / transactionCount : 0;
  
  // Calcular saldo consolidado de todas as contas
  // Para uma visão executiva, vamos somar os saldos únicos por pessoa
  const uniqueBalancesByPerson = new Map<string, number>();
  
  // Obter o saldo mais recente por pessoa
  const sortedData = [...data].sort((a, b) => 
    new Date(b.transaction_date.split(' ')[0].split('/').reverse().join('-')).getTime() - 
    new Date(a.transaction_date.split(' ')[0].split('/').reverse().join('-')).getTime()
  );
  
  // Para cada pessoa, pegar apenas o saldo mais recente
  for (const item of sortedData) {
    if (!uniqueBalancesByPerson.has(item.personal_document)) {
      uniqueBalancesByPerson.set(item.personal_document, parseFloat(item.saldo_posterior));
    }
  }
  
  // Somar todos os saldos únicos
  const currentBalance = Array.from(uniqueBalancesByPerson.values())
    .reduce((sum, balance) => sum + balance, 0);
  
  const previousBalance = currentBalance - netFlow;
  
  // Calcular período
  const dates = data.map(item => item.transaction_date.split(' ')[0]);
  const sortedDates = dates.sort((a, b) => 
    new Date(a.split('/').reverse().join('-')).getTime() - 
    new Date(b.split('/').reverse().join('-')).getTime()
  );
  
  return {
    totalCredits,
    totalDebits,
    ticketMedio,
    currentBalance,
    previousBalance,
    transactionCount,
    period: {
      start: sortedDates.length > 0 ? sortedDates[0] : '',
      end: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : ''
    }
  };
};
