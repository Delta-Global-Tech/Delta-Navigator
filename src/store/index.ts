// Delta Global Center - Global State Management
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { z } from 'zod';

// Validação de dados com Zod
export const FilterSchema = z.object({
  period: z.enum(['today', '7d', '30d', '90d', 'year', 'custom']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tipoDocumento: z.array(z.string()),
  tipoLiberacao: z.array(z.string()),
  prazo: z.array(z.number()),
  canal: z.array(z.string()),
  segmento: z.array(z.string()),
});

export const DatasetStatusSchema = z.enum(['idle', 'loading', 'ready', 'error']);

export const DictionaryEntrySchema = z.object({
  field: z.string(),
  type: z.enum(['key', 'metric', 'dimension', 'temporal', 'boolean', 'geo', 'text']),
  nullPercentage: z.number(),
  cardinality: z.number(),
  examples: z.array(z.any()),
  category: z.enum(['obrigatório', 'opcional', 'ignorado']),
});

// Tipos baseados nos schemas
export type FilterState = z.infer<typeof FilterSchema>;
export type DatasetStatus = z.infer<typeof DatasetStatusSchema>;
export type DictionaryEntry = z.infer<typeof DictionaryEntrySchema>;

// Interface do store
interface DeltaStore {
  // Filtros globais
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  
  // Estado dos datasets
  datasets: Record<string, DatasetStatus>;
  setDatasetStatus: (table: string, status: DatasetStatus) => void;
  
  // Data Dictionary
  dictionary: Record<string, DictionaryEntry[]>;
  setDictionary: (table: string, entries: DictionaryEntry[]) => void;
  
  // UI State
  ui: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    commandPaletteOpen: boolean;
    activeTab: string;
    loading: boolean;
    error: string | null;
  };
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Feature Flags
  flags: {
    leadTimeDDB: boolean;
    coortes: boolean;
    previsao: boolean;
    rbac: boolean;
    commandPalette: boolean;
    realTimeSync: boolean;
    advancedFilters: boolean;
    exportPremium: boolean;
  };
  setFlag: (flag: keyof DeltaStore['flags'], value: boolean) => void;
  
  // Cache de dados
  cache: {
    lastSync: Date | null;
    data: Record<string, any>;
  };
  setCache: (key: string, data: any) => void;
  clearCache: () => void;
  
  // Métricas calculadas
  metrics: {
    totalRegistros: number;
    totalSaldo: number;
    totalComissaoPrevista: number;
    totalComissaoRecebida: number;
    conversionRates: Record<string, number>;
    backlog: number;
    aging: {
      p50: number;
      p90: number;
      max: number;
    };
  };
  setMetrics: (metrics: Partial<DeltaStore['metrics']>) => void;
}

// Estado inicial
const initialFilters: FilterState = {
  period: '30d',
  tipoDocumento: [],
  tipoLiberacao: [],
  prazo: [],
  canal: [],
  segmento: [],
};

// Store principal
export const useDeltaStore = create<DeltaStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Filtros
      filters: initialFilters,
      setFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }), false, 'setFilters'),
      resetFilters: () => 
        set({ filters: initialFilters }, false, 'resetFilters'),
      
      // Datasets
      datasets: {},
      setDatasetStatus: (table, status) =>
        set((state) => ({
          datasets: { ...state.datasets, [table]: status }
        }), false, 'setDatasetStatus'),
      
      // Dictionary
      dictionary: {},
      setDictionary: (table, entries) =>
        set((state) => ({
          dictionary: { ...state.dictionary, [table]: entries }
        }), false, 'setDictionary'),
      
      // UI
      ui: {
        theme: 'system',
        sidebarCollapsed: false,
        commandPaletteOpen: false,
        activeTab: 'overview',
        loading: false,
        error: null,
      },
      setTheme: (theme) =>
        set((state) => ({
          ui: { ...state.ui, theme }
        }), false, 'setTheme'),
      setSidebarCollapsed: (collapsed) =>
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: collapsed }
        }), false, 'setSidebarCollapsed'),
      setCommandPaletteOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, commandPaletteOpen: open }
        }), false, 'setCommandPaletteOpen'),
      setActiveTab: (tab) =>
        set((state) => ({
          ui: { ...state.ui, activeTab: tab }
        }), false, 'setActiveTab'),
      setLoading: (loading) =>
        set((state) => ({
          ui: { ...state.ui, loading }
        }), false, 'setLoading'),
      setError: (error) =>
        set((state) => ({
          ui: { ...state.ui, error }
        }), false, 'setError'),
      
      // Flags
      flags: {
        leadTimeDDB: false,
        coortes: false,
        previsao: false,
        rbac: false,
        commandPalette: true,
        realTimeSync: false,
        advancedFilters: true,
        exportPremium: true,
      },
      setFlag: (flag, value) =>
        set((state) => ({
          flags: { ...state.flags, [flag]: value }
        }), false, 'setFlag'),
      
      // Cache
      cache: {
        lastSync: null,
        data: {},
      },
      setCache: (key, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            data: { ...state.cache.data, [key]: data },
            lastSync: new Date(),
          }
        }), false, 'setCache'),
      clearCache: () =>
        set({
          cache: { lastSync: null, data: {} }
        }, false, 'clearCache'),
      
      // Métricas
      metrics: {
        totalRegistros: 0,
        totalSaldo: 0,
        totalComissaoPrevista: 0,
        totalComissaoRecebida: 0,
        conversionRates: {},
        backlog: 0,
        aging: { p50: 0, p90: 0, max: 0 },
      },
      setMetrics: (newMetrics) =>
        set((state) => ({
          metrics: { ...state.metrics, ...newMetrics }
        }), false, 'setMetrics'),
    })),
    {
      name: 'delta-command-center',
    }
  )
);

// Seletores úteis
export const useFilters = () => useDeltaStore((state) => state.filters);
export const useDatasets = () => useDeltaStore((state) => state.datasets);
export const useDictionary = () => useDeltaStore((state) => state.dictionary);
export const useUI = () => useDeltaStore((state) => state.ui);
export const useFlags = () => useDeltaStore((state) => state.flags);
export const useMetrics = () => useDeltaStore((state) => state.metrics);