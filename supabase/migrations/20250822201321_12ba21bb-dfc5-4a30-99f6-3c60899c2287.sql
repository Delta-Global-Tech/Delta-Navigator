-- ===== DELTA COMMAND CENTER - COMPLETE DATABASE STRUCTURE =====

-- Drop existing policies to recreate with proper names
DROP POLICY IF EXISTS "read_only" ON aberturas_contas;
DROP POLICY IF EXISTS "read_only" ON operacoes;
DROP POLICY IF EXISTS "read_only" ON producao_total_novo;
DROP POLICY IF EXISTS "read_only" ON producao_total_compra;
DROP POLICY IF EXISTS "read_only" ON producao_fila_novo;
DROP POLICY IF EXISTS "read_only" ON producao_fila_compra;
DROP POLICY IF EXISTS "read_only" ON producao_paga_novo;
DROP POLICY IF EXISTS "read_only" ON producao_paga_compra;

-- Add CHECK constraints and missing columns to existing tables
ALTER TABLE operacoes 
ADD CONSTRAINT check_prazo CHECK (prazo IS NULL OR (prazo >= 1 AND prazo <= 240)),
ADD CONSTRAINT check_valor_parcela CHECK (valor_parcela IS NULL OR valor_parcela >= 0),
ADD CONSTRAINT check_saldo_devedor CHECK (saldo_devedor IS NULL OR saldo_devedor >= 0);

-- ===== ENHANCED INDICES (temporal + composite) =====
DROP INDEX IF EXISTS idx_aberturas_data;
DROP INDEX IF EXISTS idx_operacoes_data;
DROP INDEX IF EXISTS idx_totalnovo_data;
DROP INDEX IF EXISTS idx_totalcompra_data;
DROP INDEX IF EXISTS idx_filanovo_data;
DROP INDEX IF EXISTS idx_filacompra_data;
DROP INDEX IF EXISTS idx_paganovo_data;
DROP INDEX IF EXISTS idx_pagacompra_data;

CREATE INDEX IF NOT EXISTS idx_aberturas_y_m ON aberturas_contas (date_trunc('month', data_formalizacao));
CREATE INDEX IF NOT EXISTS idx_aberturas_canal ON aberturas_contas (canal, data_formalizacao);
CREATE INDEX IF NOT EXISTS idx_operacoes_tipo_data ON operacoes (tipo_documento, data_emissao);
CREATE INDEX IF NOT EXISTS idx_operacoes_liberacao ON operacoes (tipo_liberacao, data_emissao);
CREATE INDEX IF NOT EXISTS idx_totalnovo_data ON producao_total_novo (data_formalizacao);
CREATE INDEX IF NOT EXISTS idx_totalnovo_tipo ON producao_total_novo (tipo_documento, data_formalizacao);
CREATE INDEX IF NOT EXISTS idx_totalcompra_data ON producao_total_compra (data_formalizacao);
CREATE INDEX IF NOT EXISTS idx_totalcompra_tipo ON producao_total_compra (tipo_documento, data_formalizacao);
CREATE INDEX IF NOT EXISTS idx_filanovo_data ON producao_fila_novo (COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off));
CREATE INDEX IF NOT EXISTS idx_filacompra_data ON producao_fila_compra (COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off));
CREATE INDEX IF NOT EXISTS idx_paganovo_data ON producao_paga_novo (data_formalizacao);
CREATE INDEX IF NOT EXISTS idx_paganovo_ddb ON producao_paga_novo (data_ddb);
CREATE INDEX IF NOT EXISTS idx_pagacompra_data ON producao_paga_compra (data_formalizacao);
CREATE INDEX IF NOT EXISTS idx_pagacompra_ddb ON producao_paga_compra (data_ddb);

-- ===== RLS POLICIES (READ-ONLY) =====
CREATE POLICY "read_only_access" ON aberturas_contas FOR SELECT USING (true);
CREATE POLICY "read_only_access" ON operacoes FOR SELECT USING (true);
CREATE POLICY "read_only_access" ON producao_total_novo FOR SELECT USING (true);
CREATE POLICY "read_only_access" ON producao_total_compra FOR SELECT USING (true);
CREATE POLICY "read_only_access" ON producao_fila_novo FOR SELECT USING (true);
CREATE POLICY "read_only_access" ON producao_fila_compra FOR SELECT USING (true);
CREATE POLICY "read_only_access" ON producao_paga_novo FOR SELECT USING (true);
CREATE POLICY "read_only_access" ON producao_paga_compra FOR SELECT USING (true);

-- ===== ANALYTICAL VIEWS =====

-- Monthly aggregations for Total
CREATE OR REPLACE VIEW vw_total_mensal AS
SELECT 
  to_char(data_formalizacao, 'YYYY-MM') as ym, 
  'NOVO' as tipo,
  count(*) as registros, 
  sum(COALESCE(valor_parcela, 0)) as valor,
  avg(COALESCE(valor_parcela, 0)) as ticket_medio
FROM producao_total_novo 
WHERE data_formalizacao IS NOT NULL
GROUP BY 1, 2
UNION ALL
SELECT 
  to_char(data_formalizacao, 'YYYY-MM') as ym, 
  'COMPRA' as tipo,
  count(*) as registros, 
  sum(COALESCE(valor_parcela, 0)) as valor,
  avg(COALESCE(valor_parcela, 0)) as ticket_medio
FROM producao_total_compra 
WHERE data_formalizacao IS NOT NULL
GROUP BY 1, 2;

-- Monthly aggregations for Fila (Queue)
CREATE OR REPLACE VIEW vw_fila_mensal AS
SELECT 
  to_char(COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off), 'YYYY-MM') as ym, 
  'NOVO' as tipo,
  count(*) as registros, 
  sum(COALESCE(valor_parcela, 0)) as valor,
  avg(COALESCE(valor_parcela, 0)) as ticket_medio
FROM producao_fila_novo 
WHERE COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off) IS NOT NULL
GROUP BY 1, 2
UNION ALL
SELECT 
  to_char(COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off), 'YYYY-MM') as ym, 
  'COMPRA' as tipo,
  count(*) as registros, 
  sum(COALESCE(valor_parcela, 0)) as valor,
  avg(COALESCE(valor_parcela, 0)) as ticket_medio
FROM producao_fila_compra 
WHERE COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off) IS NOT NULL
GROUP BY 1, 2;

-- Monthly aggregations for Paga (Paid)
CREATE OR REPLACE VIEW vw_paga_mensal AS
SELECT 
  to_char(data_formalizacao, 'YYYY-MM') as ym, 
  'NOVO' as tipo,
  count(*) as registros, 
  sum(COALESCE(valor_parcela, 0)) as valor,
  sum(COALESCE(comissao, 0)) as comissao,
  avg(COALESCE(valor_parcela, 0)) as ticket_medio,
  avg(CASE WHEN data_ddb IS NOT NULL AND data_formalizacao IS NOT NULL 
           THEN data_ddb - data_formalizacao END) as lead_time_medio
FROM producao_paga_novo 
WHERE data_formalizacao IS NOT NULL
GROUP BY 1, 2
UNION ALL
SELECT 
  to_char(data_formalizacao, 'YYYY-MM') as ym, 
  'COMPRA' as tipo,
  count(*) as registros, 
  sum(COALESCE(valor_parcela, 0)) as valor,
  sum(COALESCE(comissao, 0)) as comissao,
  avg(COALESCE(valor_parcela, 0)) as ticket_medio,
  avg(CASE WHEN data_ddb IS NOT NULL AND data_formalizacao IS NOT NULL 
           THEN data_ddb - data_formalizacao END) as lead_time_medio
FROM producao_paga_compra 
WHERE data_formalizacao IS NOT NULL
GROUP BY 1, 2;

-- Complete Funnel View
CREATE OR REPLACE VIEW vw_funil_mensal AS
SELECT 
  COALESCE(t.ym, f.ym, p.ym) as ym,
  COALESCE(t.tipo, f.tipo, p.tipo) as tipo,
  COALESCE(t.registros, 0) as total,
  COALESCE(f.registros, 0) as fila,
  COALESCE(p.registros, 0) as paga,
  COALESCE(t.valor, 0) as valor_total,
  COALESCE(f.valor, 0) as valor_fila,
  COALESCE(p.valor, 0) as valor_paga,
  COALESCE(p.comissao, 0) as comissao_paga,
  CASE WHEN COALESCE(t.registros, 0) > 0 
       THEN ROUND(100.0 * COALESCE(p.registros, 0) / t.registros, 2) 
       ELSE 0 END as conv_total_paga,
  CASE WHEN COALESCE(t.registros, 0) > 0 
       THEN ROUND(100.0 * COALESCE(f.registros, 0) / t.registros, 2) 
       ELSE 0 END as fila_sobre_total,
  CASE WHEN COALESCE(f.registros, 0) > 0 
       THEN ROUND(100.0 * COALESCE(p.registros, 0) / f.registros, 2) 
       ELSE 0 END as conv_fila_paga
FROM vw_total_mensal t
FULL OUTER JOIN vw_fila_mensal f ON t.ym = f.ym AND t.tipo = f.tipo
FULL OUTER JOIN vw_paga_mensal p ON COALESCE(t.ym, f.ym) = p.ym AND COALESCE(t.tipo, f.tipo) = p.tipo
ORDER BY ym, tipo;

-- ABC Revenue Analysis
CREATE OR REPLACE VIEW vw_abc_receita AS
SELECT 
  tipo_documento,
  sum(COALESCE(comissao, 0)) as comissao_total,
  count(*) as registros,
  avg(COALESCE(comissao, 0)) as comissao_media,
  RANK() OVER (ORDER BY sum(COALESCE(comissao, 0)) DESC) as ranking
FROM (
  SELECT tipo_documento, comissao FROM producao_paga_novo WHERE comissao IS NOT NULL
  UNION ALL
  SELECT tipo_documento, comissao FROM producao_paga_compra WHERE comissao IS NOT NULL
) s
GROUP BY tipo_documento
ORDER BY comissao_total DESC;

-- Document Type Performance
CREATE OR REPLACE VIEW vw_documento_performance AS
SELECT 
  tipo_documento,
  count(*) as total_registros,
  sum(COALESCE(valor_parcela, 0)) as valor_total,
  avg(COALESCE(valor_parcela, 0)) as ticket_medio,
  avg(prazo) as prazo_medio
FROM (
  SELECT tipo_documento, valor_parcela, prazo FROM producao_total_novo
  UNION ALL
  SELECT tipo_documento, valor_parcela, prazo FROM producao_total_compra
) s
WHERE tipo_documento IS NOT NULL
GROUP BY tipo_documento
ORDER BY valor_total DESC;

-- Aging Analysis for Queue
CREATE OR REPLACE VIEW vw_aging_fila AS
SELECT 
  'NOVO' as tipo,
  AVG(CURRENT_DATE - COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off)) as aging_medio,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CURRENT_DATE - COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off)) as aging_p50,
  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY CURRENT_DATE - COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off)) as aging_p90
FROM producao_fila_novo
WHERE COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off) IS NOT NULL
UNION ALL
SELECT 
  'COMPRA' as tipo,
  AVG(CURRENT_DATE - COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off)) as aging_medio,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CURRENT_DATE - COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off)) as aging_p50,
  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY CURRENT_DATE - COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off)) as aging_p90
FROM producao_fila_compra
WHERE COALESCE(data_formalizacao, data_atualizacao_on, data_atualizacao_off) IS NOT NULL;