// Delta Command Center - Field Resolution
// Resolver de sinônimos com base em DataConfig.fields

import { DataConfig } from './config';

// Função para resolver campo por sinônimos
export function resolveField(row: Record<string, any>, synonyms: string[]): any {
  // Primeiro, tenta match exato
  for (const name of synonyms) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  
  // Fallback: tenta match case-insensitive/acentos removidos
  const norm = (s: string) => 
    s.normalize("NFD")
     .replace(/\p{Diacritic}/gu, "")
     .toLowerCase()
     .replace(/\s+/g, "_")
     .replace(/[^\w]/g, "");
  
  const keys = Object.keys(row);
  const normalizedSynonyms = synonyms.map(norm);
  
  for (const k of keys) {
    const normalizedKey = norm(k);
    if (normalizedSynonyms.includes(normalizedKey)) {
      const value = row[k];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }
  
  return undefined;
}

// Helper para resolver todos os campos de uma linha
export function resolveAllFields(row: Record<string, any>) {
  const resolved: Record<string, any> = {};
  
  Object.entries(DataConfig.fields).forEach(([fieldName, synonyms]) => {
    const value = resolveField(row, [...synonyms]);
    if (value !== undefined) {
      resolved[fieldName] = value;
    }
  });
  
  return resolved;
}

// Validador de linha de dados
export function validateRow(row: Record<string, any>, requiredFields: string[]): {
  isValid: boolean;
  missingFields: string[];
  resolvedRow: Record<string, any>;
} {
  const resolvedRow = resolveAllFields(row);
  const missingFields = requiredFields.filter(field => 
    resolvedRow[field] === undefined || 
    resolvedRow[field] === null || 
    resolvedRow[field] === ''
  );
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    resolvedRow
  };
}

// Detector de tipo de campo baseado nos dados
export type FieldType = 'key' | 'metric' | 'dimension' | 'temporal' | 'boolean' | 'geo' | 'text';

export function detectFieldType(values: any[]): FieldType {
  const nonNullValues = values.filter(v => v != null && v !== '');
  
  if (nonNullValues.length === 0) return 'text';
  
  // Chave: valores únicos (UUID, códigos)
  const uniqueRatio = new Set(nonNullValues).size / nonNullValues.length;
  if (uniqueRatio > 0.9) {
    const firstValue = String(nonNullValues[0]);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstValue) ||
        /^\d+$/.test(firstValue)) {
      return 'key';
    }
  }
  
  // Temporal: datas
  const dateCount = nonNullValues.filter(v => {
    const d = new Date(String(v));
    return !isNaN(d.getTime());
  }).length;
  
  if (dateCount / nonNullValues.length > 0.8) return 'temporal';
  
  // Métrica: números
  const numberCount = nonNullValues.filter(v => {
    const n = Number(String(v).replace(/[,.]/g, ''));
    return !isNaN(n);
  }).length;
  
  if (numberCount / nonNullValues.length > 0.8) return 'metric';
  
  // Boolean: sim/não, true/false, etc.
  const booleanValues = new Set(['sim', 'não', 'yes', 'no', 'true', 'false', '1', '0', 'ativo', 'inativo']);
  const booleanCount = nonNullValues.filter(v => 
    booleanValues.has(String(v).toLowerCase())
  ).length;
  
  if (booleanCount / nonNullValues.length > 0.8) return 'boolean';
  
  // Dimensão: baixa cardinalidade
  if (uniqueRatio < 0.1) return 'dimension';
  
  return 'text';
}

// Gerador de data dictionary
export function generateDataDictionary(data: Record<string, any>[]): Array<{
  field: string;
  type: FieldType;
  nullPercentage: number;
  cardinality: number;
  examples: any[];
  category: 'obrigatório' | 'opcional' | 'ignorado';
}> {
  if (data.length === 0) return [];
  
  const fields = Object.keys(data[0]);
  
  return fields.map(field => {
    const values = data.map(row => row[field]);
    const nonNullValues = values.filter(v => v != null && v !== '');
    
    return {
      field,
      type: detectFieldType(values),
      nullPercentage: ((values.length - nonNullValues.length) / values.length) * 100,
      cardinality: new Set(nonNullValues).size,
      examples: Array.from(new Set(nonNullValues)).slice(0, 3),
      category: nonNullValues.length === 0 ? 'ignorado' : 
                nonNullValues.length === values.length ? 'obrigatório' : 'opcional'
    };
  });
}