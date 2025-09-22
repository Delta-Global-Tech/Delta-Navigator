-- ==================================================
-- QUERIES PARA TESTAR A TABELA fact_proposals_newcorban
-- ==================================================

-- 1. QUERY BÁSICA - Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'fact_proposals_newcorban'
ORDER BY ordinal_position;

-- ==================================================

-- 2. QUERY DE TESTE - Primeiros 10 registros
SELECT 
    proposta_id,
    status_nome,
    valor_financiado,
    valor_liberado,
    banco_nome,
    produto_nome,
    cliente_nome,
    vendedor_nome
FROM fact_proposals_newcorban 
LIMIT 10;

-- ==================================================

-- 3. QUERY PARA PRODUÇÃO NOVO (apenas contratos PAGOS)
SELECT 
    proposta_id,
    status_nome,
    valor_financiado,
    valor_liberado,
    valor_parcela,
    valor_referencia,
    prazo,
    taxa,
    banco_nome,
    produto_nome,
    convenio_nome,
    cliente_nome,
    cliente_cpf,
    cliente_sexo,
    cliente_nascimento,
    cliente_renda,
    vendedor_nome,
    equipe_nome,
    digitador_nome,
    origem
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO'
ORDER BY proposta_id DESC
LIMIT 100;

-- ==================================================

-- 4. QUERY COM PAGINAÇÃO (para API)
SELECT 
    proposta_id,
    status_nome,
    valor_financiado,
    valor_liberado,
    valor_parcela,
    banco_nome,
    produto_nome,
    cliente_nome,
    vendedor_nome,
    origem
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO'
ORDER BY proposta_id DESC
LIMIT 50 OFFSET 0; -- Primeira página, 50 registros

-- ==================================================

-- 5. QUERY PARA KPIs
SELECT 
    COUNT(*) as total_contratos,
    COUNT(DISTINCT cliente_cpf) as clientes_unicos,
    SUM(valor_financiado) as valor_total_financiado,
    SUM(valor_liberado) as valor_total_liberado,
    AVG(valor_financiado) as valor_medio_financiado,
    COUNT(DISTINCT banco_nome) as bancos_parceiros,
    COUNT(DISTINCT produto_nome) as produtos_diferentes,
    COUNT(DISTINCT vendedor_nome) as vendedores_ativos
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO';

-- ==================================================

-- 6. QUERY PARA DADOS MENSAIS (ALTERNATIVAS)
-- Opção A: Se houver um campo de data na tabela, substitua 'campo_data' pelo nome correto
-- SELECT 
--     DATE_TRUNC('month', campo_data) as mes,
--     COUNT(*) as contratos,
--     SUM(valor_financiado) as valor_total,
--     AVG(valor_financiado) as valor_medio
-- FROM fact_proposals_newcorban 
-- WHERE status_nome = 'PAGO'
--     AND campo_data >= CURRENT_DATE - INTERVAL '12 months'
-- GROUP BY DATE_TRUNC('month', campo_data)
-- ORDER BY mes DESC;

-- Opção B: Se não houver campo de data, usar dados agregados simples
SELECT 
    'Sem dados temporais' as mes,
    COUNT(*) as contratos,
    SUM(valor_financiado) as valor_total,
    AVG(valor_financiado) as valor_medio
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO';

-- Opção C: Verificar se existe algum campo de data na tabela
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'fact_proposals_newcorban'
    AND (data_type LIKE '%timestamp%' OR data_type LIKE '%date%' OR column_name LIKE '%data%' OR column_name LIKE '%date%')
ORDER BY column_name;

-- ==================================================

-- 7. QUERY PARA TOP PRODUTOS
SELECT 
    produto_nome,
    COUNT(*) as quantidade,
    SUM(valor_financiado) as valor_total,
    AVG(valor_financiado) as valor_medio
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO'
GROUP BY produto_nome
ORDER BY quantidade DESC
LIMIT 10;

-- ==================================================

-- 8. QUERY PARA TOP BANCOS
SELECT 
    banco_nome,
    COUNT(*) as quantidade,
    SUM(valor_financiado) as valor_total,
    AVG(valor_financiado) as valor_medio
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO'
GROUP BY banco_nome
ORDER BY quantidade DESC
LIMIT 10;

-- ==================================================

-- 9. QUERY PARA TOP VENDEDORES
SELECT 
    vendedor_nome,
    equipe_nome,
    COUNT(*) as quantidade,
    SUM(valor_financiado) as valor_total,
    AVG(valor_financiado) as valor_medio
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO'
GROUP BY vendedor_nome, equipe_nome
ORDER BY quantidade DESC
LIMIT 20;

-- ==================================================

-- 10. QUERY PARA VERIFICAR STATUS DISPONÍVEIS
SELECT 
    status_nome,
    COUNT(*) as quantidade
FROM fact_proposals_newcorban 
GROUP BY status_nome
ORDER BY quantidade DESC;

-- ==================================================

-- 11. QUERY PARA ANÁLISE POR ORIGEM
SELECT 
    origem,
    COUNT(*) as quantidade,
    SUM(valor_financiado) as valor_total,
    AVG(valor_financiado) as valor_medio
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO'
GROUP BY origem
ORDER BY quantidade DESC;

-- ==================================================

-- 12. QUERY COMPLETA PARA API (com todos os campos necessários)
WITH contratos_pagos AS (
    SELECT 
        proposta_id,
        status_nome,
        valor_financiado,
        valor_liberado,
        valor_parcela,
        valor_referencia,
        prazo,
        taxa,
        banco_nome,
        produto_nome,
        convenio_nome,
        cliente_nome,
        cliente_cpf,
        cliente_sexo,
        cliente_nascimento,
        cliente_renda,
        vendedor_nome,
        equipe_nome,
        digitador_nome,
        origem,
        ROW_NUMBER() OVER (ORDER BY proposta_id DESC) as row_num
    FROM fact_proposals_newcorban 
    WHERE status_nome = 'PAGO'
)
SELECT *
FROM contratos_pagos
WHERE row_num BETWEEN 1 AND 50; -- Primeira página de 50 registros

-- ==================================================

-- 13. QUERY PARA IDENTIFICAR CAMPOS DE DATA
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'fact_proposals_newcorban'
    AND (
        data_type LIKE '%timestamp%' 
        OR data_type LIKE '%date%' 
        OR column_name ILIKE '%data%' 
        OR column_name ILIKE '%date%'
        OR column_name ILIKE '%created%'
        OR column_name ILIKE '%updated%'
        OR column_name ILIKE '%inserted%'
    )
ORDER BY column_name;

-- ==================================================

-- 14. QUERY PARA VER AMOSTRAS DE TODOS OS CAMPOS
SELECT 
    proposta_id,
    status_nome,
    valor_financiado,
    valor_liberado,
    valor_parcela,
    valor_referencia,
    prazo,
    taxa,
    banco_nome,
    produto_nome,
    convenio_nome,
    cliente_nome,
    cliente_cpf,
    cliente_sexo,
    cliente_nascimento,
    cliente_renda,
    vendedor_nome,
    equipe_nome,
    digitador_nome,
    origem
FROM fact_proposals_newcorban 
WHERE status_nome = 'PAGO'
LIMIT 5;

-- ==================================================

-- 15. QUERY PARA CONTAR REGISTROS TOTAL
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status_nome = 'PAGO' THEN 1 END) as registros_pagos
FROM fact_proposals_newcorban;