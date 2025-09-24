import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/data/supabase"

// Hook para dados do funil mensal
export function useFunnelData() {
  return useQuery({
    queryKey: ['funnel-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_funil_mensal')
        .select('*')
        .order('ym', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true,
    staleTime: 0,
  })
}

// Hook para KPIs executivos
export function useExecutiveKPIs() {
  return useQuery({
    queryKey: ['executive-kpis'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true,
    staleTime: 0,
    queryFn: async () => {
      // Total de registros
      const [totalNovo, totalCompra, filaNovo, filaCompra, pagaNovo, pagaCompra] = await Promise.all([
        supabase.from('producao_total_novo').select('*', { count: 'exact', head: true }),
        supabase.from('producao_total_compra').select('*', { count: 'exact', head: true }),
        supabase.from('producao_fila_novo').select('*', { count: 'exact', head: true }),
        supabase.from('producao_fila_compra').select('*', { count: 'exact', head: true }),
        supabase.from('producao_paga_novo').select('valor_parcela, comissao'),
        supabase.from('producao_paga_compra').select('valor_parcela, comissao')
      ])

      const totalRegistros = (totalNovo.count || 0) + (totalCompra.count || 0)
      const totalFila = (filaNovo.count || 0) + (filaCompra.count || 0)
      const totalPago = (pagaNovo.data?.length || 0) + (pagaCompra.data?.length || 0)

      // Calcular valores
      const valorPago = [
        ...(pagaNovo.data || []),
        ...(pagaCompra.data || [])
      ].reduce((sum, item) => sum + (item.valor_parcela || 0), 0)

      const comissaoRecebida = [
        ...(pagaNovo.data || []),
        ...(pagaCompra.data || [])
      ].reduce((sum, item) => sum + (item.comissao || 0), 0)

      const ticketMedio = totalPago > 0 ? valorPago / totalPago : 0
      const conversaoTotal = totalRegistros > 0 ? (totalPago / totalRegistros) * 100 : 0

      return {
        totalRegistros,
        saldoDevedor: valorPago,
        comissaoPrevista: valorPago * 0.05, // Estimativa 5%
        comissaoRecebida,
        ticketMedio,
        conversaoTotal,
        totalFila,
        totalPago
      }
    }
  })
}

// Hook para dados de volume mensal
export function useVolumeData() {
  return useQuery({
    queryKey: ['volume-data'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true,
    staleTime: 0,
    queryFn: async () => {
      const { data: totalData } = await supabase.from('vw_total_mensal').select('*')
      const { data: pagaData } = await supabase.from('vw_paga_mensal').select('*')
      
      const combined = (totalData || []).map(total => {
        const pago = pagaData?.find(p => p.ym === total.ym && p.tipo === total.tipo)
        return {
          ym: total.ym,
          tipo: total.tipo,
          total: total.registros,
          pago: pago?.registros || 0,
          valorTotal: total.valor || 0,
          valorPago: pago?.valor || 0
        }
      })
      
      return combined
    }
  })
}

// Hook para ABC de receita
export function useABCRevenue() {
  return useQuery({
    queryKey: ['abc-revenue'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_abc_receita')
        .select('*')
        .limit(10)
      
      if (error) throw error
      return data || []
    }
  })
}

// Hook para performance por documento
export function useDocumentPerformance() {
  return useQuery({
    queryKey: ['document-performance'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_documento_performance')
        .select('*')
        .limit(5)
      
      if (error) throw error
      return data || []
    }
  })
}

// Hook para dados de abertura de contas
export function useAccountOpenings() {
  return useQuery({
    queryKey: ['account-openings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aberturas_contas')
        .select('*')
        .order('data_formalizacao', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      return data || []
    }
  })
}

// Hook para dados da fila de pagamento
export function usePaymentQueue() {
  return useQuery({
    queryKey: ['payment-queue'],
    queryFn: async () => {
      const [novoData, compraData] = await Promise.all([
        supabase.from('producao_fila_novo').select('*').order('data_formalizacao', { ascending: false }),
        supabase.from('producao_fila_compra').select('*').order('data_formalizacao', { ascending: false })
      ])
      
      return {
        novo: novoData.data || [],
        compra: compraData.data || []
      }
    }
  })
}