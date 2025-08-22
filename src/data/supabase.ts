// Delta Command Center - Supabase Integration
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export const supabase = createClient<Database>(
  "https://tgdvaaprejaojcwzgzng.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZHZhYXByZWphb2pjd3pnem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjYxODIsImV4cCI6MjA3MTQ0MjE4Mn0.Z80j00gTMk89yjHdlUNKaCjrTb1eB8dKbAEzgsIVqG8",
  { 
    auth: { persistSession: false },
    global: {
      headers: {
        'x-client-info': 'delta-command-center@1.0.0',
      }
    }
  }
);

// Normalizadores pt-BR para dados das planilhas
export const toNumberBR = (v: unknown): number | null => {
  if (v == null || v === '' || v === '-') return null;
  const s = String(v)
    .replace(/\./g, "")     // Remove milhares
    .replace(",", ".")      // Vírgula → ponto decimal
    .replace(/[^\d.-]/g, ""); // Remove caracteres não numéricos
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const toDate = (v: unknown): string | null => {
  if (v == null || v === '' || v === '-') return null;
  
  // Tenta formato brasileiro DD/MM/YYYY
  const brDateMatch = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Fallback para outros formatos
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};

export const toYM = (isoDate: string): string => {
  return isoDate.slice(0, 7); // YYYY-MM
};

// Tipo para dados agregados mensais
export type MonthlyAgg = {
  ym: string;
  registros: number;
  valorTotal?: number;
  comissaoTotal?: number;
};

// Helper para queries de agregação mensal
export const buildMonthlyQuery = (
  tableName: keyof Database['public']['Tables'], 
  dateField = 'data_formalizacao'
) => {
  return supabase
    .from(tableName)
    .select(`
      ${dateField},
      valor_parcela,
      comissao
    `)
    .not(dateField, 'is', null)
    .order(dateField, { ascending: true });
};

// Agregador de dados mensais
export const aggregateByMonth = (data: any[], dateField = 'data_formalizacao'): MonthlyAgg[] => {
  const grouped = new Map<string, MonthlyAgg>();
  
  data.forEach(row => {
    const date = row[dateField];
    if (!date) return;
    
    const ym = toYM(date);
    const existing = grouped.get(ym);
    const valorParcela = toNumberBR(row.valor_parcela) || 0;
    const comissao = toNumberBR(row.comissao) || 0;
    
    if (existing) {
      existing.registros += 1;
      existing.valorTotal = (existing.valorTotal || 0) + valorParcela;
      existing.comissaoTotal = (existing.comissaoTotal || 0) + comissao;
    } else {
      grouped.set(ym, {
        ym,
        registros: 1,
        valorTotal: valorParcela || undefined,
        comissaoTotal: comissao || undefined,
      });
    }
  });
  
  return Array.from(grouped.values()).sort((a, b) => a.ym.localeCompare(b.ym));
};

// Helper para calcular conversões do funil
export type FunnelData = {
  ym: string;
  total: number;
  fila: number;
  paga: number;
  convTotalParaFila: number;
  convFilaParaPaga: number;
  convTotalParaPaga: number;
};

export const calculateFunnel = (
  totalData: MonthlyAgg[],
  filaData: MonthlyAgg[],
  pagaData: MonthlyAgg[]
): FunnelData[] => {
  const allMonths = new Set([
    ...totalData.map(d => d.ym),
    ...filaData.map(d => d.ym),
    ...pagaData.map(d => d.ym),
  ]);
  
  return Array.from(allMonths).sort().map(ym => {
    const total = totalData.find(d => d.ym === ym)?.registros || 0;
    const fila = filaData.find(d => d.ym === ym)?.registros || 0;
    const paga = pagaData.find(d => d.ym === ym)?.registros || 0;
    
    return {
      ym,
      total,
      fila,
      paga,
      convTotalParaFila: total > 0 ? (fila / total) * 100 : 0,
      convFilaParaPaga: fila > 0 ? (paga / fila) * 100 : 0,
      convTotalParaPaga: total > 0 ? (paga / total) * 100 : 0,
    };
  });
};

// Helper para calcular lead time em dias
export const calculateLeadTime = (dataFormalizacao: string, dataDDB: string): number | null => {
  const formalizacao = new Date(dataFormalizacao);
  const ddb = new Date(dataDDB);
  
  if (isNaN(formalizacao.getTime()) || isNaN(ddb.getTime())) return null;
  
  const diffTime = ddb.getTime() - formalizacao.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : null;
};

// Helper para calcular percentis (p50, p90, etc.)
export const calculatePercentile = (values: number[], percentile: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (index === Math.floor(index)) {
    return sorted[index];
  } else {
    const lower = sorted[Math.floor(index)];
    const upper = sorted[Math.ceil(index)];
    return lower + (upper - lower) * (index - Math.floor(index));
  }
};