-- Adicionar tela Match Averbadora ao banco de dados
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
  '7f8c9d0a-1b2c-3d4e-5f6a-7b8c9d0a1b2c',
  'Match Averbadora',
  'match-averbadora',
  'Análise de divergências de averbação entre regiões',
  'Link',
  '/match-averbadora',
  'reports',
  '25',
  'true',
  NOW(),
  NOW()
);

-- ✅ UUID usado: 7f8c9d0a-1b2c-3d4e-5f6a-7b8c9d0a1b2c
-- ✅ Já atualizado em App.tsx no PermissionRoute
