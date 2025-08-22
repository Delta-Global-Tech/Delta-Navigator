-- 1. Abertura de Contas
create table if not exists aberturas_contas (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_formalizacao date not null,
  canal text,
  segmento text,
  tipo_documento text,
  created_at timestamptz default now()
);

-- 2. Operações
create table if not exists operacoes (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_emissao date,
  tipo_documento text not null,
  tipo_liberacao text not null,
  prazo int,
  valor_parcela numeric(18,2),
  saldo_devedor numeric(18,2),
  status text,
  created_at timestamptz default now()
);

-- 3. Produção Total - NOVO
create table if not exists producao_total_novo (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_formalizacao date not null,
  tipo_documento text,
  tipo_liberacao text,
  prazo int,
  valor_parcela numeric(18,2),
  created_at timestamptz default now()
);

-- 4. Produção Total - COMPRA
create table if not exists producao_total_compra (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_formalizacao date not null,
  tipo_documento text,
  tipo_liberacao text,
  prazo int,
  valor_parcela numeric(18,2),
  created_at timestamptz default now()
);

-- 5. Produção Fila - NOVO
create table if not exists producao_fila_novo (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_formalizacao date,
  data_atualizacao_on date,
  data_atualizacao_off date,
  tipo_documento text,
  tipo_liberacao text,
  prazo int,
  valor_parcela numeric(18,2),
  status text,
  created_at timestamptz default now()
);

-- 6. Produção Fila - COMPRA
create table if not exists producao_fila_compra (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_formalizacao date,
  data_atualizacao_on date,
  data_atualizacao_off date,
  tipo_documento text,
  tipo_liberacao text,
  prazo int,
  valor_parcela numeric(18,2),
  status text,
  created_at timestamptz default now()
);

-- 7. Produção Paga - NOVO
create table if not exists producao_paga_novo (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_formalizacao date not null,
  data_ddb date,
  valor_parcela numeric(18,2),
  comissao numeric(18,2),
  tipo_documento text,
  tipo_liberacao text,
  prazo int,
  created_at timestamptz default now()
);

-- 8. Produção Paga - COMPRA
create table if not exists producao_paga_compra (
  id uuid default gen_random_uuid() primary key,
  matricula text,
  data_formalizacao date not null,
  data_ddb date,
  valor_parcela numeric(18,2),
  comissao numeric(18,2),
  tipo_documento text,
  tipo_liberacao text,
  prazo int,
  created_at timestamptz default now()
);

-- Índices úteis
create index if not exists idx_aberturas_data on aberturas_contas(data_formalizacao);
create index if not exists idx_operacoes_data on operacoes(data_emissao);
create index if not exists idx_totalnovo_data on producao_total_novo(data_formalizacao);
create index if not exists idx_totalcompra_data on producao_total_compra(data_formalizacao);
create index if not exists idx_filanovo_data on producao_fila_novo(data_formalizacao);
create index if not exists idx_filacompra_data on producao_fila_compra(data_formalizacao);
create index if not exists idx_paganovo_data on producao_paga_novo(data_formalizacao);
create index if not exists idx_pagacompra_data on producao_paga_compra(data_formalizacao);

-- Policies (read-only)
alter table aberturas_contas enable row level security;
alter table operacoes enable row level security;
alter table producao_total_novo enable row level security;
alter table producao_total_compra enable row level security;
alter table producao_fila_novo enable row level security;
alter table producao_fila_compra enable row level security;
alter table producao_paga_novo enable row level security;
alter table producao_paga_compra enable row level security;

create policy "read_only" on aberturas_contas for select using (true);
create policy "read_only" on operacoes for select using (true);
create policy "read_only" on producao_total_novo for select using (true);
create policy "read_only" on producao_total_compra for select using (true);
create policy "read_only" on producao_fila_novo for select using (true);
create policy "read_only" on producao_fila_compra for select using (true);
create policy "read_only" on producao_paga_novo for select using (true);
create policy "read_only" on producao_paga_compra for select using (true);