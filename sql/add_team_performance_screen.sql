-- Adicionar tela Team Performance (Treynor - Performance de Equipe) ao banco de dados
-- Execute este comando no SQL Editor do Supabase

INSERT INTO "public"."app_screens" (
  "id",
  "name",
  "slug",
  "description",
  "icon",
  "route",
  "category",
  "sort_order",
  "active",
  "created_at",
  "updated_at"
) VALUES (
  'c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f',
  'Performance de Equipe',
  'team-performance',
  'Análise de performance de equipes por período e status',
  'Users',
  '/treynor/performance',
  'reports',
  '26',
  'true',
  NOW(),
  NOW()
);

-- ✅ UUID usado: c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f
-- ✅ Já atualizado em App.tsx no PermissionRoute com screenId: a8f109b6-ab42-4e0a-8f65-f2c8485c7199 (compartilhado com Produção Analytics)

-- SQL Queries para os endpoints da API (adicionar ao seu servidor SQL/Node.js):
-- 
-- SELECT 
--   equipeNome,
--   COUNT(*) as totalPropostas,
--   SUM(valorFinanciado) as valorTotalFinanciado,
--   SUM(valorLiberado) as valorTotalLiberado,
--   SUM(valorParcela) as valorTotalParcela
-- FROM fact_proposals_newcorban
-- WHERE dataStatus BETWEEN @startDate AND @endDate
--   AND (@vendedor = '' OR vendedorNome = @vendedor)
--   AND (@status = '' OR statusNome = @status)
--   AND (@convenio = '' OR convenioNome = @convenio)
-- GROUP BY equipeNome
-- ORDER BY valorTotalFinanciado DESC;
--
-- -- Para obter o breakdown por status
-- SELECT 
--   statusNome,
--   COUNT(*) as quantidade
-- FROM fact_proposals_newcorban
-- WHERE dataStatus BETWEEN @startDate AND @endDate
--   AND (@equipe = '' OR equipeNome = @equipe)
--   AND (@vendedor = '' OR vendedorNome = @vendedor)
--   AND (@convenio = '' OR convenioNome = @convenio)
-- GROUP BY statusNome
-- ORDER BY quantidade DESC;
--
-- -- Para obter propostas detalhadas de uma equipe
-- SELECT 
--   clienteNome,
--   clienteCpf,
--   valorFinanciado,
--   valorLiberado,
--   valorParcela,
--   valorReferencia,
--   statusNome,
--   produtoNome,
--   convenioNome,
--   dataStatus,
--   dataCadastro,
--   vendedorNome,
--   equipeNome
-- FROM fact_proposals_newcorban
-- WHERE dataStatus BETWEEN @startDate AND @endDate
--   AND equipeNome = @equipe
--   AND (@vendedor = '' OR vendedorNome = @vendedor)
--   AND (@status = '' OR statusNome = @status)
--   AND (@convenio = '' OR convenioNome = @convenio)
-- ORDER BY dataStatus DESC
-- LIMIT 500;
