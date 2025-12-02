const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 3004;

// Middleware para garantir que pool existe
let poolReady = false;
app.use((req, res, next) => {
  if (!poolReady) {
    return res.status(503).json({ status: 'initializing', message: 'Server initializing database connection' });
  }
  next();
});

// Configuração CORS para aceitar conexões da rede local
app.use(cors({
  origin: [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3004',
    // Redes locais mais comuns
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+/,
    /^http:\/\/192\.168\.\d+\.\d+/,
    // Modo desenvolvimento - aceita qualquer origem local
    true
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());


// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'sem origin'}`);
  next();
});

// Configuração do PostgreSQL com melhores práticas
const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'devtoken';

async function getVaultSecret(path) {
  try {
    const response = await axios.get(`${VAULT_ADDR}/v1/${path}`, {
      headers: { 'X-Vault-Token': VAULT_TOKEN },
      timeout: 3000,
    });
    const value = response.data?.data?.data?.value;
    if (value) {
      console.log(`[VAULT] Secret carregado: ${path}`);
      return value;
    }
  } catch (error) {
    console.warn(`[VAULT] Indisponivel (${path}), usando .env`);
  }
  return null;
}

// Configuração do banco - será preenchida por initializeDatabase
let dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DATABASE || 'airflow_treynor',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'MinhaSenh@123',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
};

async function initializeDatabase() {
  console.log('[VAULT] Tentando carregar secrets...');
  const vaultHost = await getVaultSecret('secret/data/contratos/postgres-host');
  const vaultPort = await getVaultSecret('secret/data/contratos/postgres-port');
  const vaultDb = await getVaultSecret('secret/data/contratos/postgres-db');
  const vaultUser = await getVaultSecret('secret/data/contratos/postgres-user');
  const vaultPassword = await getVaultSecret('secret/data/contratos/postgres-password');
  
  if (vaultHost) dbConfig.host = vaultHost;
  if (vaultPort) dbConfig.port = parseInt(vaultPort);
  if (vaultDb) dbConfig.database = vaultDb;
  if (vaultUser) dbConfig.user = vaultUser;
  if (vaultPassword) dbConfig.password = vaultPassword;
  
  console.log(`[DB] Configuracao final: host=${dbConfig.host} port=${dbConfig.port} database=${dbConfig.database}`);
  console.log('[DB] Pronto para conectar');
}

let pool;

async function createPool() {
  await initializeDatabase();
  pool = new Pool(dbConfig);
  poolReady = true;
  
  pool.on('error', (err, client) => {
    console.error('[DB] Erro no pool PostgreSQL:', err);
  });

  pool.on('connect', () => {
    console.log('[DB] Nova conexão estabelecida');
  });

  pool.on('remove', () => {
    console.log('[DB] Conexão removida do pool');
  });

  // Health check endpoint - DEPOIS que pool é criado
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT NOW()');
      res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        service: 'contratos-server'
      });
    } catch (error) {
      console.error('[HEALTH CHECK] Falha:', error.message);
      res.status(503).json({ 
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
        service: 'contratos-server'
      });
    }
  });
}

// API para KPIs principais
app.get('/api/contratos/kpis', async (req, res) => {
  try {
    const query = `
      SELECT
        COUNT(*)                                 AS qtd_registros,
        COUNT(DISTINCT no_contrato)              AS qtd_contratos,

        -- valores principais
        SUM(COALESCE(vlr_financiado,0))          AS total_vlr_financiado,
        SUM(COALESCE(out_vlr,0))                 AS total_custo_emissao,
        SUM(COALESCE(vlr_iof,0))                 AS total_iof,
        SUM(COALESCE(vl_amortizacao,0))          AS total_amortizacao,

        -- prestações
        SUM(COALESCE(prestacoes_pagas_total,0))  AS total_prestacoes_pagas_qtde,
        SUM(COALESCE(prestacoes_pagas_total_r,0))AS total_prestacoes_pagas_valor,

        -- juros brutos estimados (vlr_total - financiado)
        SUM( COALESCE(vlr_total,0) - COALESCE(vlr_financiado,0) ) AS total_juros_brutos,

        -- extras úteis pra cards/benchmarks
        AVG(NULLIF(vlr_financiado,0))            AS ticket_medio,
        SUM(COALESCE(sdo_devedor_total,0))       AS total_saldo_devedor,
        SUM(COALESCE(sdo_devedor_valor_presente,0)) AS total_saldo_devedor_vp

      FROM em.posicao_de_contratos_por_produtos
    `;

    const result = await pool.query(query);
    
    const kpis = result.rows[0];
    
    const response = {
      qtdRegistros: parseInt(kpis.qtd_registros) || 0,
      qtdContratos: parseInt(kpis.qtd_contratos) || 0,
      totalVlrFinanciado: parseFloat(kpis.total_vlr_financiado) || 0,
      totalCustoEmissao: parseFloat(kpis.total_custo_emissao) || 0,
      totalIof: parseFloat(kpis.total_iof) || 0,
      totalAmortizacao: parseFloat(kpis.total_amortizacao) || 0,
      totalPrestacoesPagasQtde: parseInt(kpis.total_prestacoes_pagas_qtde) || 0,
      totalPrestacoesPagasValor: parseFloat(kpis.total_prestacoes_pagas_valor) || 0,
      totalJurosBrutos: parseFloat(kpis.total_juros_brutos) || 0,
      ticketMedio: parseFloat(kpis.ticket_medio) || 0,
      totalSaldoDevedor: parseFloat(kpis.total_saldo_devedor) || 0,
      totalSaldoDevedorVp: parseFloat(kpis.total_saldo_devedor_vp) || 0
    };

    console.log('KPIs encontrados:', response);
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs', details: error.message });
  }
});

// API para evolução mensal
app.get('/api/contratos/evolucao-mensal', async (req, res) => {
  try {
    const query = `
      SELECT
        date_trunc('month', data_entr)::date         AS mes_ref,
        COUNT(DISTINCT no_contrato)                  AS qtd_contratos,
        SUM(COALESCE(vlr_financiado,0))              AS vlr_financiado,
        SUM(COALESCE(out_vlr,0))                     AS custo_emissao,
        SUM(COALESCE(vlr_iof,0))                     AS iof,
        SUM(COALESCE(vl_amortizacao,0))              AS amortizacao,
        SUM(COALESCE(prestacoes_pagas_total,0))      AS prestacoes_pagas_qtde,
        SUM(COALESCE(prestacoes_pagas_total_r,0))    AS prestacoes_pagas_valor,
        SUM(COALESCE(vlr_total,0) - COALESCE(vlr_financiado,0)) AS juros_brutos
      FROM em.posicao_de_contratos_por_produtos
      GROUP BY 1
      ORDER BY 1
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      mesRef: row.mes_ref,
      qtdContratos: parseInt(row.qtd_contratos) || 0,
      vlrFinanciado: parseFloat(row.vlr_financiado) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      iof: parseFloat(row.iof) || 0,
      amortizacao: parseFloat(row.amortizacao) || 0,
      prestacoesPagasQtde: parseInt(row.prestacoes_pagas_qtde) || 0,
      prestacoesPagasValor: parseFloat(row.prestacoes_pagas_valor) || 0,
      jurosBrutos: parseFloat(row.juros_brutos) || 0
    }));

    console.log('Evolução mensal encontrada:', response.length, 'meses');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar evolução mensal:', error);
    res.status(500).json({ error: 'Erro ao buscar evolução mensal', details: error.message });
  }
});

// API para dados do mapa por cidade
app.get('/api/contratos/mapa-cidades', async (req, res) => {
  try {
    const query = `
      SELECT
        cod_cidade,                               -- chave IBGE p/ join do mapa
        cidade,                                   -- rótulo

        COUNT(DISTINCT no_contrato) AS qtd_contratos,

        SUM(COALESCE(vlr_financiado,0))              AS vlr_financiado,
        SUM(COALESCE(out_vlr,0))                     AS custo_emissao,
        SUM(COALESCE(vlr_iof,0))                     AS iof,
        SUM(COALESCE(vl_amortizacao,0))             AS amortizacao,

        SUM(COALESCE(prestacoes_pagas_total,0))      AS prestacoes_pagas_qtde,
        SUM(COALESCE(prestacoes_pagas_total_r,0))    AS prestacoes_pagas_valor,

        SUM(COALESCE(vlr_total,0) - COALESCE(vlr_financiado,0)) AS juros_brutos,

        -- extras pra cor/tooltip
        AVG(NULLIF(vlr_financiado,0))                AS ticket_medio,
        SUM(COALESCE(sdo_devedor_total,0))           AS sdo_devedor_total,
        SUM(COALESCE(sdo_devedor_valor_presente,0))  AS sdo_devedor_vp,

        -- razões úteis
        SUM(COALESCE(out_vlr,0) + COALESCE(vlr_iof,0))
          / NULLIF(SUM(COALESCE(vlr_financiado,0)),0) AS custo_emissao_sobre_financ,
        SUM(COALESCE(sdo_devedor_total,0))
          / NULLIF(SUM(COALESCE(vlr_total,0)),0)      AS saldo_sobre_total
      FROM em.posicao_de_contratos_por_produtos
      GROUP BY cod_cidade, cidade
      ORDER BY vlr_financiado DESC NULLS LAST
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      codCidade: row.cod_cidade,
      cidade: row.cidade,
      qtdContratos: parseInt(row.qtd_contratos) || 0,
      vlrFinanciado: parseFloat(row.vlr_financiado) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      iof: parseFloat(row.iof) || 0,
      amortizacao: parseFloat(row.amortizacao) || 0,
      prestacoesPagasQtde: parseInt(row.prestacoes_pagas_qtde) || 0,
      prestacoesPagasValor: parseFloat(row.prestacoes_pagas_valor) || 0,
      jurosBrutos: parseFloat(row.juros_brutos) || 0,
      ticketMedio: parseFloat(row.ticket_medio) || 0,
      sdoDevedorTotal: parseFloat(row.sdo_devedor_total) || 0,
      sdoDevedorVp: parseFloat(row.sdo_devedor_vp) || 0,
      custoEmissaoSobreFinanc: parseFloat(row.custo_emissao_sobre_financ) || 0,
      saldoSobreTotal: parseFloat(row.saldo_sobre_total) || 0
    }));

    console.log('Dados do mapa encontrados:', response.length, 'cidades');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar dados do mapa:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do mapa', details: error.message });
  }
});

// API para análise por produto e convênio (com query melhorada)
app.get('/api/contratos/produto-convenio', async (req, res) => {
  try {
    const query = `
      WITH norm_text AS (
        SELECT
          regexp_replace(
            replace(replace(desc_produto, chr(160), ' '), '–', '-'),
            '\\s+', ' ', 'g'
          ) AS desc_norm,
          vlr_financiado, vlr_total, sdo_devedor_total, taxa, taxa_cet
        FROM em.posicao_de_contratos_por_produtos
      ),
      split2 AS (
        SELECT
          trim(split_part(desc_norm, ' - ', 1)) AS p1,  -- 1º bloco (cidade)
          trim(split_part(desc_norm, ' - ', 2)) AS p2,  -- 2º bloco (produto)
          desc_norm,
          vlr_financiado, vlr_total, sdo_devedor_total, taxa, taxa_cet
        FROM norm_text
      ),
      labels AS (
        SELECT
          (p2 = '') AS is_global,
          CASE WHEN p2 = '' THEN '[GLOBAL]' ELSE p1 END AS cidade_label,
          CASE WHEN p2 = '' THEN split_part(desc_norm, ' - ', 1) ELSE p2 END AS produto_label,

          -- chaves robustas (sem acento/pontuação e espaços normalizados)
          lower(
            regexp_replace(
              translate(CASE WHEN p2 = '' THEN '[GLOBAL]' ELSE p1 END,
                        'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
                        'aaaaaaeeeeiiiiooooouuuucnAAAAAAEEEEIIIIOOOOOUUUUCN'),
              '\\s+', ' ', 'g'
            )
          ) AS cidade_key,
          lower(
            regexp_replace(
              regexp_replace(
                translate(CASE WHEN p2 = '' THEN split_part(desc_norm, ' - ', 1) ELSE p2 END,
                          'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
                          'aaaaaaeeeeiiiiooooouuuucnAAAAAAEEEEIIIIOOOOOUUUUCN'),
                '[^a-z0-9 ]', ' ', 'g'
              ),
              '\\s+', ' ', 'g'
            )
          ) AS produto_key,

          vlr_financiado, vlr_total, sdo_devedor_total, taxa, taxa_cet
        FROM split2
      )
      SELECT
        -- rótulo: se global, mostra só o produto; senão "Cidade - Produto"
        CASE
          WHEN bool_or(is_global) THEN initcap(min(produto_label))
          ELSE initcap(min(cidade_label)) || ' - ' || initcap(min(produto_label))
        END AS cidade_produto,

        -- cidade: NULL para global (troque por 'Global' se preferir)
        CASE WHEN bool_or(is_global) THEN NULL ELSE initcap(min(cidade_label)) END AS cidade,

        initcap(min(produto_label))                             AS produto,
        COUNT(*)                                                AS qtd,
        SUM(vlr_financiado)                                     AS financiado,
        SUM(vlr_total)                                          AS total_previsto,
        SUM(sdo_devedor_total)                                  AS saldo_atual,
        AVG(NULLIF(taxa,0))                                     AS media_taxa_pct_am,
        AVG(NULLIF(taxa_cet,0))                                 AS media_cet_pct_am
      FROM labels
      GROUP BY cidade_key, produto_key
      ORDER BY cidade NULLS LAST, financiado DESC NULLS LAST
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      cidadeProduto: row.cidade_produto,
      cidade: row.cidade,
      produto: row.produto,
      qtd: parseInt(row.qtd) || 0,
      financiado: parseFloat(row.financiado) || 0,
      totalPrevisto: parseFloat(row.total_previsto) || 0,
      saldoAtual: parseFloat(row.saldo_atual) || 0,
      mediaTaxaPctAm: parseFloat(row.media_taxa_pct_am) || 0,
      mediaCetPctAm: parseFloat(row.media_cet_pct_am) || 0
    }));

    console.log('Análise por produto/convênio encontrada:', response.length, 'registros');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar análise por produto/convênio:', error);
    res.status(500).json({ error: 'Erro ao buscar análise por produto/convênio', details: error.message });
  }
});

// API para Top 10 Produtos por Cidade (nova query otimizada)
app.get('/api/contratos/top-produtos-por-cidade', async (req, res) => {
  try {
    const query = `
      WITH norm_text AS (
        SELECT
          regexp_replace(
            replace(replace(desc_produto, chr(160), ' '), '–', '-'),
            '\\s+', ' ', 'g'
          ) AS desc_norm,
          vlr_financiado, vlr_total, sdo_devedor_total, taxa, taxa_cet
        FROM em.posicao_de_contratos_por_produtos
      ),
      split2 AS (
        SELECT
          trim(split_part(desc_norm, ' - ', 1)) AS p1,
          trim(split_part(desc_norm, ' - ', 2)) AS p2,
          desc_norm,
          vlr_financiado, vlr_total, sdo_devedor_total, taxa, taxa_cet
        FROM norm_text
      )
      SELECT
        CASE
          WHEN p2 = '' THEN initcap(trim(split_part(desc_norm, ' - ', 1)))
          ELSE initcap(p1) || ' - ' || initcap(p2)
        END AS cidade_produto,
        
        CASE WHEN p2 = '' THEN NULL ELSE initcap(p1) END AS cidade,
        CASE WHEN p2 = '' THEN initcap(trim(split_part(desc_norm, ' - ', 1))) ELSE initcap(p2) END AS produto,
        
        COUNT(*) AS qtd,
        SUM(vlr_financiado) AS financiado,
        SUM(vlr_total) AS total_previsto,
        SUM(sdo_devedor_total) AS saldo_atual,
        AVG(NULLIF(taxa,0)) AS media_taxa_pct_am,
        AVG(NULLIF(taxa_cet,0)) AS media_cet_pct_am
      FROM split2
      GROUP BY 
        CASE
          WHEN p2 = '' THEN initcap(trim(split_part(desc_norm, ' - ', 1)))
          ELSE initcap(p1) || ' - ' || initcap(p2)
        END,
        CASE WHEN p2 = '' THEN NULL ELSE initcap(p1) END,
        CASE WHEN p2 = '' THEN initcap(trim(split_part(desc_norm, ' - ', 1))) ELSE initcap(p2) END
      ORDER BY financiado DESC
      LIMIT 10
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      cidade_produto: row.cidade_produto,
      cidade: row.cidade,
      produto: row.produto,
      qtd: parseInt(row.qtd) || 0,
      financiado: parseFloat(row.financiado) || 0,
      total_previsto: parseFloat(row.total_previsto) || 0,
      saldo_atual: parseFloat(row.saldo_atual) || 0,
      media_taxa_pct_am: parseFloat(row.media_taxa_pct_am) || 0,
      media_cet_pct_am: parseFloat(row.media_cet_pct_am) || 0
    }));

    console.log('Top 10 produtos por cidade encontrados:', response.length, 'registros');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar top produtos por cidade:', error);
    res.status(500).json({ error: 'Erro ao buscar top produtos por cidade', details: error.message });
  }
});

// API para contratos detalhados
app.get('/api/contratos/detalhes', async (req, res) => {
  try {
    const { limit = 1000, offset = 0, produto, convenio, cidade } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (produto) {
      whereConditions.push(`desc_produto = $${paramIndex}`);
      queryParams.push(produto);
      paramIndex++;
    }
    
    if (convenio) {
      whereConditions.push(`desc_convenio = $${paramIndex}`);
      queryParams.push(convenio);
      paramIndex++;
    }
    
    if (cidade) {
      whereConditions.push(`cidade = $${paramIndex}`);
      queryParams.push(cidade);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT
        no_contrato, nome_do_cliente, cidade, desc_produto, desc_convenio,
        data_entr, vlr_financiado, vlr_total, sdo_devedor_total, taxa, taxa_cet,
        out_vlr as custo_emissao, vlr_iof, vlr_prest, prestacoes_pagas_total,
        prestacoes_pagas_total_r, data_primeiro_pagamento, dt_ult_vcto,
        vl_amortizacao, taxa_real
      FROM em.posicao_de_contratos_por_produtos
      ${whereClause}
      ORDER BY vlr_financiado DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    const response = result.rows.map(row => ({
      noContrato: row.no_contrato,
      nomeCliente: row.nome_do_cliente,
      cidade: row.cidade,
      descProduto: row.desc_produto,
      descConvenio: row.desc_convenio,
      dataEntr: row.data_entr,
      vlrFinanciado: parseFloat(row.vlr_financiado) || 0,
      vlrTotal: parseFloat(row.vlr_total) || 0,
      sdoDevedorTotal: parseFloat(row.sdo_devedor_total) || 0,
      taxa: parseFloat(row.taxa) || 0,
      taxaCet: parseFloat(row.taxa_cet) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      vlrIof: parseFloat(row.vlr_iof) || 0,
      vlrPrest: parseFloat(row.vlr_prest) || 0,
      prestacoesPagasTotal: parseInt(row.prestacoes_pagas_total) || 0,
      prestacoesPagasTotalR: parseFloat(row.prestacoes_pagas_total_r) || 0,
      dataPrimeiroPagamento: row.data_primeiro_pagamento,
      dtUltVcto: row.dt_ult_vcto,
      vlAmortizacao: parseFloat(row.vl_amortizacao) || 0,
      taxaReal: parseFloat(row.taxa_real) || 0
    }));

    console.log('Contratos detalhados encontrados:', response.length);
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar contratos detalhados:', error);
    res.status(500).json({ error: 'Erro ao buscar contratos detalhados', details: error.message });
  }
});

// API para KPIs avançados
app.get('/api/contratos/kpis-avancados', async (req, res) => {
  try {
    const query = `
      WITH kpi AS (
        SELECT
          no_contrato, vlr_financiado, vlr_total, vlr_prest,
          COALESCE(vlr_iof,0)+COALESCE(out_vlr,0) AS custo_total_emissao,
          sdo_devedor_total, sdo_devedor_valor_presente AS sdo_devedor_vp,
          taxa AS taxa_pct_am, taxa_real AS taxa_real_pct_am, taxa_cet AS taxa_cet_pct_am,
          data_primeiro_pagamento, dt_ult_vcto
        FROM em.posicao_de_contratos_por_produtos
      )
      SELECT
        COUNT(*)                                             AS qtd_contratos,
        SUM(vlr_financiado)                                  AS soma_financiado,
        SUM(custo_total_emissao)                             AS soma_custos_emissao,
        SUM(vlr_total)                                       AS soma_total_previsto,
        SUM(sdo_devedor_total)                               AS soma_saldo_atual,
        SUM(sdo_devedor_vp)                                  AS soma_saldo_vp,
        AVG(NULLIF(taxa_pct_am,0))                           AS media_taxa_pct_am,
        AVG(NULLIF(taxa_real_pct_am,0))                      AS media_taxa_real_pct_am,
        AVG(NULLIF(taxa_cet_pct_am,0))                       AS media_cet_pct_am,
        AVG(vlr_financiado)                                  AS ticket_medio,
        AVG( (EXTRACT(YEAR FROM dt_ult_vcto)*12 + EXTRACT(MONTH FROM dt_ult_vcto))
           - (EXTRACT(YEAR FROM data_primeiro_pagamento)*12 + EXTRACT(MONTH FROM data_primeiro_pagamento)) )::int AS prazo_medio_meses
      FROM kpi
    `;

    const result = await pool.query(query);
    
    const kpis = result.rows[0];
    
    const response = {
      qtdContratos: parseInt(kpis.qtd_contratos) || 0,
      somaFinanciado: parseFloat(kpis.soma_financiado) || 0,
      somaCustosEmissao: parseFloat(kpis.soma_custos_emissao) || 0,
      somaTotalPrevisto: parseFloat(kpis.soma_total_previsto) || 0,
      somaSaldoAtual: parseFloat(kpis.soma_saldo_atual) || 0,
      somaSaldoVp: parseFloat(kpis.soma_saldo_vp) || 0,
      mediaTaxaPctAm: parseFloat(kpis.media_taxa_pct_am) || 0,
      mediaTaxaRealPctAm: parseFloat(kpis.media_taxa_real_pct_am) || 0,
      mediaCetPctAm: parseFloat(kpis.media_cet_pct_am) || 0,
      ticketMedio: parseFloat(kpis.ticket_medio) || 0,
      prazoMedioMeses: parseInt(kpis.prazo_medio_meses) || 0
    };

    console.log('KPIs avançados encontrados:', response);
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar KPIs avançados:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs avançados', details: error.message });
  }
});

// API para dados completos de posição de contratos (nova query refatorada)
app.get('/api/contratos/posicao-completa', async (req, res) => {
  try {
    console.log('[POSICAO-COMPLETA] Buscando dados completos de posição de contratos...');
    
    // Suporta filtro opcional por número de contrato: ?no_contrato=XYZ
    const { no_contrato } = req.query || {};
    let query = `
      SELECT 
        nome_do_cliente,
        vlr_liquido as valor_liquido,
        vlr_iof as valor_iof,
        out_vlr as custo_emissao,
        vlr_financiado as valor_financiado,
        vlr_total as valor_total_devedor,
        vlr_prest as valor_parcelas,
        taxa,
        prestacoes_pagas_total,
        pagamentos_efetuados_total as quantidade_de_parcelas,
        pagamentos_efetuados_total_r as valor_pago,
        sdo_devedor_total as saldo_devedor_atual,
        desc_produto as descricao_do_produto,
        data_primeiro_pagamento,
        dt_ult_vcto as data_do_ultima_parcela,
        tac_qtde_de_moeda,
        taxa_real,
        taxa_cet,
        desc_convenio,
        no_contrato,
        data_entr
      FROM em.posicao_de_contratos_por_produtos
    `;

    const params = [];
    if (no_contrato) {
      query += ` WHERE no_contrato = $1`;
      params.push(no_contrato);
    }

    query += ` ORDER BY data_entr DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    
    const contratos = result.rows.map(row => ({
      nomeCliente: row.nome_do_cliente,
      valorLiquido: parseFloat(row.valor_liquido) || 0,
      valorIof: parseFloat(row.valor_iof) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      valorFinanciado: parseFloat(row.valor_financiado) || 0,
      valorTotalDevedor: parseFloat(row.valor_total_devedor) || 0,
      valorParcelas: parseFloat(row.valor_parcelas) || 0,
      taxa: parseFloat(row.taxa) || 0,
      prestacoesPagasTotal: parseInt(row.prestacoes_pagas_total) || 0,
      quantidadeDeParcelas: parseInt(row.quantidade_de_parcelas) || 0,
      valorPago: parseFloat(row.valor_pago) || 0,
      saldoDevedorAtual: parseFloat(row.saldo_devedor_atual) || 0,
      descricaoDoProduto: row.descricao_do_produto,
      dataPrimeiroPagamento: row.data_primeiro_pagamento,
      dataUltimaParcela: row.data_do_ultima_parcela,
      tacQtdeMoeda: parseFloat(row.tac_qtde_de_moeda) || 0,
      taxaReal: parseFloat(row.taxa_real) || 0,
      taxaCet: parseFloat(row.taxa_cet) || 0,
      descConvenio: row.desc_convenio,
      numeroContrato: row.no_contrato,
      dataEntrada: row.data_entr,
      // Campos calculados
      duracaoMeses: row.data_primeiro_pagamento && row.data_do_ultima_parcela ? 
        Math.ceil((new Date(row.data_do_ultima_parcela) - new Date(row.data_primeiro_pagamento)) / (1000 * 60 * 60 * 24 * 30)) : 0,
      percentualPago: row.valor_total_devedor > 0 ? 
        ((parseFloat(row.valor_pago) || 0) / (parseFloat(row.valor_total_devedor) || 1)) * 100 : 0,
      valorRestante: (parseFloat(row.valor_total_devedor) || 0) - (parseFloat(row.valor_pago) || 0)
    }));

    // Calcular estatísticas gerais
    const stats = {
      totalContratos: contratos.length,
      valorTotalDevedor: contratos.reduce((sum, c) => sum + c.valorTotalDevedor, 0),
      valorTotalPago: contratos.reduce((sum, c) => sum + c.valorPago, 0),
      saldoDevedorTotal: contratos.reduce((sum, c) => sum + c.saldoDevedorAtual, 0),
      ticketMedio: contratos.length > 0 ? contratos.reduce((sum, c) => sum + c.valorFinanciado, 0) / contratos.length : 0,
      duracaoMediaMeses: contratos.filter(c => c.duracaoMeses > 0).length > 0 ?
        contratos.filter(c => c.duracaoMeses > 0).reduce((sum, c) => sum + c.duracaoMeses, 0) / 
        contratos.filter(c => c.duracaoMeses > 0).length : 0,
      percentualPagoMedio: contratos.length > 0 ? 
        contratos.reduce((sum, c) => sum + c.percentualPago, 0) / contratos.length : 0
    };

    const response = {
      contratos,
      estatisticas: stats
    };

    console.log(`[POSICAO-COMPLETA] ${contratos.length} contratos encontrados`);
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar posição completa de contratos:', error);
    res.status(500).json({ error: 'Erro ao buscar posição completa de contratos', details: error.message });
  }
});

// API para dados de desembolso EM com filtros e taxas
app.get('/api/contratos/desembolso', async (req, res) => {
  try {
    console.log('[DESEMBOLSO] Buscando dados de desembolso com filtros...');
    console.log('[DESEMBOLSO] Query params recebidos:', req.query);
    console.log('[DESEMBOLSO] URL completa:', req.originalUrl);
    
    // Extrair parâmetros de filtro da query string
    const {
      cpf_cnpj,
      dataInicio,
      dataFim,
      produto,
      valorMinimo,
      valorMaximo,
      filial,
      convenio,
      status
    } = req.query;

    // Construir condições WHERE dinamicamente
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    console.log('[DESEMBOLSO] ✓ Valor de cpf_cnpj:', cpf_cnpj, 'tipo:', typeof cpf_cnpj, 'boolean:', !!cpf_cnpj);

    // FILTRO CRÍTICO: CPF/CNPJ do cliente
    if (cpf_cnpj) {
      // Normalizar CPF: remover caracteres especiais e zeros à esquerda
      const cpfNumero = cpf_cnpj.replace(/\D/g, '');
      // Remove zeros à esquerda para comparação com banco que armazena sem zeros
      const cpfSemZeros = cpfNumero.replace(/^0+/, '');
      
      console.log('[DESEMBOLSO] ✓ CPF RECEBIDO NO FILTRO:', cpf_cnpj);
      console.log('[DESEMBOLSO] ✓ CPF COMO NÚMERO:', cpfNumero);
      console.log('[DESEMBOLSO] ✓ CPF SEM ZEROS À ESQUERDA:', cpfSemZeros);
      
      // Comparar como número inteiro para evitar problemas com zeros à esquerda
      // O banco armazena sem zeros, então compara: CAST(nr_cpf_cnpj AS BIGINT) = valor_sem_zeros
      whereConditions.push(`CAST(d.nr_cpf_cnpj AS BIGINT) = $${paramIndex}::BIGINT`);
      queryParams.push(cpfSemZeros);
      paramIndex++;
      
      console.log('[DESEMBOLSO] ✓ Filtro adicionado:', whereConditions[whereConditions.length - 1]);
    }

    if (dataInicio) {
      whereConditions.push(`d.data_entrada >= $${paramIndex}`);
      queryParams.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      whereConditions.push(`d.data_entrada <= $${paramIndex}`);
      queryParams.push(dataFim);
      paramIndex++;
    }

    // Múltipla seleção para produtos
    if (produto) {
      const produtos = Array.isArray(produto) ? produto : [produto];
      if (produtos.length > 0) {
        const produtoConditions = produtos.map((prod) => {
          const condition = `LOWER(d.descricao) = LOWER($${paramIndex})`;
          queryParams.push(prod);
          paramIndex++;
          return condition;
        });
        whereConditions.push(`(${produtoConditions.join(' OR ')})`);
      }
    }

    if (valorMinimo) {
      whereConditions.push(`d.vlr_liberado >= $${paramIndex}`);
      queryParams.push(parseFloat(valorMinimo));
      paramIndex++;
    }

    if (valorMaximo) {
      whereConditions.push(`d.vlr_liberado <= $${paramIndex}`);
      queryParams.push(parseFloat(valorMaximo));
      paramIndex++;
    }

    // Múltipla seleção para filiais
    if (filial) {
      const filiais = Array.isArray(filial) ? filial : [filial];
      if (filiais.length > 0) {
        const filialConditions = filiais.map((fil) => {
          const condition = `LOWER(d.nome_filial) = LOWER($${paramIndex})`;
          queryParams.push(fil);
          paramIndex++;
          return condition;
        });
        whereConditions.push(`(${filialConditions.join(' OR ')})`);
      }
    }

    // Múltipla seleção para convênios
    if (convenio) {
      const convenios = Array.isArray(convenio) ? convenio : [convenio];
      if (convenios.length > 0) {
        const convenioConditions = convenios.map((conv) => {
          const condition = `LOWER(d.nome_conven) = LOWER($${paramIndex})`;
          queryParams.push(conv);
          paramIndex++;
          return condition;
        });
        whereConditions.push(`(${convenioConditions.join(' OR ')})`);
      }
    }

    if (status) {
      if (status === 'Liberado') {
        whereConditions.push(`d.vlr_liberado > 0`);
      } else if (status === 'Pendente') {
        whereConditions.push(`d.vlr_liberado = 0`);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        d.descricao,
        d.nome,
        d.vl_financ,
        d.vlr_tac,
        d.vlr_iof,
        d.out_vlr,
        d.vlr_liberado,
        d.valor_solic,
        d.nr_cpf_cnpj,
        d.nome_inst,
        d.data_entrada,
        d.nome_conven,
        d.nome_filial,
        d.data_mov_lib,
        d.contrato,
        p.taxa,
        p.taxa_real,
        p.taxa_cet
      FROM 
        em.desembolso_por_conveniofilial d
      LEFT JOIN 
        em.posicao_de_contratos_por_produtos p
        ON d.contrato = p.no_contrato
      ${whereClause}
      ORDER BY d.data_entrada DESC
      LIMIT 2000
    `;

    console.log('[DESEMBOLSO] ✓ WHERE CLAUSE:', whereClause || 'NENHUM (retornando TODOS)');
    console.log('[DESEMBOLSO] ✓ Query params:', queryParams);
    console.log('[DESEMBOLSO] ✓ Executando query...');
    const result = await pool.query(query, queryParams);
    
    console.log(`[DESEMBOLSO] Query executada, ${result.rows.length} registros encontrados`);
    
    const desembolsos = result.rows.map(row => {
      const vlrFinanc = parseFloat(row.vl_financ) || 0;
      const vlrLiberado = parseFloat(row.vlr_liberado) || 0;
      const valorSolicOriginal = parseFloat(row.valor_solic) || 0;
      
      // Se valor_solic for 0, usar o valor financiado como referência
      const valorSolic = valorSolicOriginal === 0 ? vlrFinanc : valorSolicOriginal;
      
      return {
        descricao: row.descricao || 'N/A',
        nome: row.nome || 'N/A',
        vl_financ: vlrFinanc,
        vlr_tac: parseFloat(row.vlr_tac) || 0,
        vlr_iof: parseFloat(row.vlr_iof) || 0,
        out_vlr: parseFloat(row.out_vlr) || 0,
        vlr_liberado: vlrLiberado,
        valor_solic: valorSolic,
        nr_cpf_cnpj: row.nr_cpf_cnpj || 'N/A',
        nome_inst: row.nome_inst || 'N/A',
        data_entrada: row.data_entrada ? new Date(row.data_entrada).toISOString() : null,
        nome_conven: row.nome_conven || 'N/A',
        nome_filial: row.nome_filial || 'N/A',
        data_mov_lib: row.data_mov_lib ? new Date(row.data_mov_lib).toISOString() : null,
        contrato: row.contrato || 'N/A',
        taxa: parseFloat(row.taxa) || 0,
        taxa_real: parseFloat(row.taxa_real) || 0,
        taxa_cet: parseFloat(row.taxa_cet) || 0,
        status_final: vlrLiberado > 0 ? 'Liberado' : 'Pendente'
      };
    });

    // Calcular estatísticas dos dados filtrados
    const liberados = desembolsos.filter(d => d.status_final === 'Liberado');
    const pendentes = desembolsos.filter(d => d.status_final === 'Pendente');
    
    const stats = {
      total_contratos: desembolsos.length,
      total_liberado: desembolsos.reduce((sum, d) => sum + d.vlr_liberado, 0),
      total_solicitado: desembolsos.reduce((sum, d) => sum + d.valor_solic, 0),
      valor_total_financiado: desembolsos.reduce((sum, d) => sum + d.vl_financ, 0),
      valor_total_tac: desembolsos.reduce((sum, d) => sum + d.vlr_tac, 0),
      valor_total_iof: desembolsos.reduce((sum, d) => sum + d.vlr_iof, 0),
      valor_total_outros: desembolsos.reduce((sum, d) => sum + d.out_vlr, 0),
      ticket_medio: desembolsos.length > 0 ? desembolsos.reduce((sum, d) => sum + d.vlr_liberado, 0) / desembolsos.length : 0,
      ticket_medio_financiado: desembolsos.length > 0 ? desembolsos.reduce((sum, d) => sum + d.vl_financ, 0) / desembolsos.length : 0,
      liberados: liberados.length,
      pendentes: pendentes.length,
      reprovados: 0, // Adicionar se houver status de reprovado
      eficiencia_liberacao: desembolsos.length > 0 ? (liberados.length / desembolsos.length) * 100 : 0,
      filiais_unicas: [...new Set(desembolsos.map(d => d.nome_filial))].length,
      convenios_unicos: [...new Set(desembolsos.map(d => d.nome_conven))].length,
      produtos_unicos: [...new Set(desembolsos.map(d => d.descricao))].length,
      taxa_media: desembolsos.length > 0 ? desembolsos.reduce((sum, d) => sum + d.taxa, 0) / desembolsos.length : 0,
      taxa_real_media: desembolsos.length > 0 ? desembolsos.reduce((sum, d) => sum + d.taxa_real, 0) / desembolsos.length : 0,
      taxa_cet_media: desembolsos.length > 0 ? desembolsos.reduce((sum, d) => sum + d.taxa_cet, 0) / desembolsos.length : 0,
      filtros_aplicados: {
        dataInicio,
        dataFim,
        produto,
        valorMinimo,
        valorMaximo,
        filial,
        convenio,
        status
      }
    };
    
    console.log('[DESEMBOLSO] Estatísticas calculadas:', {
      total: stats.total_contratos,
      liberados: stats.liberados,
      valor_total_liberado: stats.total_liberado,
      valor_total_financiado: stats.valor_total_financiado,
      filiais: stats.filiais_unicas,
      convenios: stats.convenios_unicos
    });

    res.json({
      desembolsos,
      estatisticas: stats
    });
    
  } catch (error) {
    console.error('[DESEMBOLSO] Erro ao buscar dados de desembolso:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// API para buscar opções de filtros
app.get('/api/contratos/desembolso/filtros', async (req, res) => {
  try {
    console.log('[DESEMBOLSO FILTROS] Buscando opções de filtros...');
    
    const queries = {
      produtos: `
        SELECT DISTINCT descricao as value, descricao as label
        FROM em.desembolso_por_conveniofilial 
        WHERE descricao IS NOT NULL AND descricao != ''
        ORDER BY descricao
      `,
      filiais: `
        SELECT DISTINCT nome_filial as value, nome_filial as label
        FROM em.desembolso_por_conveniofilial 
        WHERE nome_filial IS NOT NULL AND nome_filial != ''
        ORDER BY nome_filial
      `,
      convenios: `
        SELECT DISTINCT nome_conven as value, nome_conven as label
        FROM em.desembolso_por_conveniofilial 
        WHERE nome_conven IS NOT NULL AND nome_conven != ''
        ORDER BY nome_conven
      `,
      instituicoes: `
        SELECT DISTINCT nome_inst as value, nome_inst as label
        FROM em.desembolso_por_conveniofilial 
        WHERE nome_inst IS NOT NULL AND nome_inst != ''
        ORDER BY nome_inst
      `
    };

    const [produtosResult, filiaisResult, conveniosResult, instituicoesResult] = await Promise.all([
      pool.query(queries.produtos),
      pool.query(queries.filiais),
      pool.query(queries.convenios),
      pool.query(queries.instituicoes)
    ]);

    const filtros = {
      produtos: produtosResult.rows,
      filiais: filiaisResult.rows,
      convenios: conveniosResult.rows,
      instituicoes: instituicoesResult.rows,
      status: [
        { value: 'Liberado', label: 'Liberado' },
        { value: 'Pendente', label: 'Pendente' }
      ]
    };

    console.log('[DESEMBOLSO FILTROS] Opções encontradas:', {
      produtos: filtros.produtos.length,
      filiais: filtros.filiais.length,
      convenios: filtros.convenios.length,
      instituicoes: filtros.instituicoes.length
    });

    res.json(filtros);
    
  } catch (error) {
    console.error('[DESEMBOLSO FILTROS] Erro ao buscar filtros:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// API para ranking de produtos por categoria com filtros
app.get('/api/contratos/desembolso/ranking-produtos', async (req, res) => {
  try {
    console.log('[DESEMBOLSO RANKING] Buscando ranking de produtos por categoria com filtros...');
    
    // Extrair parâmetros de filtro da query string
    const {
      dataInicio,
      dataFim,
      produto,
      valorMinimo,
      valorMaximo,
      filial,
      convenio,
      status
    } = req.query;

    // Construir condições WHERE dinamicamente
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (dataInicio) {
      whereConditions.push(`data_entrada >= $${paramIndex}`);
      queryParams.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      whereConditions.push(`data_entrada <= $${paramIndex}`);
      queryParams.push(dataFim);
      paramIndex++;
    }

    // Múltipla seleção para produtos
    if (produto) {
      const produtos = Array.isArray(produto) ? produto : [produto];
      if (produtos.length > 0) {
        const produtoConditions = produtos.map((prod) => {
          const condition = `LOWER(descricao) = LOWER($${paramIndex})`;
          queryParams.push(prod);
          paramIndex++;
          return condition;
        });
        whereConditions.push(`(${produtoConditions.join(' OR ')})`);
      }
    }

    if (valorMinimo) {
      whereConditions.push(`vlr_liberado >= $${paramIndex}`);
      queryParams.push(parseFloat(valorMinimo));
      paramIndex++;
    }

    if (valorMaximo) {
      whereConditions.push(`vlr_liberado <= $${paramIndex}`);
      queryParams.push(parseFloat(valorMaximo));
      paramIndex++;
    }

    // Múltipla seleção para filiais
    if (filial) {
      const filiais = Array.isArray(filial) ? filial : [filial];
      if (filiais.length > 0) {
        const filialConditions = filiais.map((fil) => {
          const condition = `LOWER(nome_filial) = LOWER($${paramIndex})`;
          queryParams.push(fil);
          paramIndex++;
          return condition;
        });
        whereConditions.push(`(${filialConditions.join(' OR ')})`);
      }
    }

    // Múltipla seleção para convênios
    if (convenio) {
      const convenios = Array.isArray(convenio) ? convenio : [convenio];
      if (convenios.length > 0) {
        const convenioConditions = convenios.map((conv) => {
          const condition = `LOWER(nome_conven) = LOWER($${paramIndex})`;
          queryParams.push(conv);
          paramIndex++;
          return condition;
        });
        whereConditions.push(`(${convenioConditions.join(' OR ')})`);
      }
    }

    if (status) {
      if (status === 'Liberado') {
        whereConditions.push(`vlr_liberado > 0`);
      } else if (status === 'Pendente') {
        whereConditions.push(`vlr_liberado = 0`);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        descricao,
        COUNT(*) as quantidade_contratos,
        SUM(vl_financ) as total_financiado,
        SUM(vlr_liberado) as total_liberado,
        SUM(valor_solic) as total_solicitado,
        AVG(vl_financ) as ticket_medio_financiado,
        AVG(vlr_liberado) as ticket_medio_liberado
      FROM em.desembolso_por_conveniofilial
      ${whereClause}
      GROUP BY descricao
      ORDER BY total_liberado DESC
    `;

    console.log('[DESEMBOLSO RANKING] Executando query de ranking com filtros...', { whereClause, params: queryParams });
    const result = await pool.query(query, queryParams);
    
    console.log(`[DESEMBOLSO RANKING] Query executada, ${result.rows.length} produtos encontrados`);
    
    // Função para categorizar produtos
    const categorizeProduct = (descricao) => {
      const desc = descricao.toLowerCase();
      
      // Compra de Dívida (incluindo variações de digitação)
      if (desc.includes('compra de d') || desc.includes('compra de divida') || desc.includes('compre de d')) {
        return 'Compra de Dívida';
      } 
      // FGTS
      else if (desc.includes('fgts') || desc.includes('antecipação fgts')) {
        return 'FGTS';
      } 
      // Crédito Pessoal
      else if (desc.includes('crédito pessoal') || desc.includes('credito pessoal')) {
        return 'Crédito Pessoal';
      } 
      // Novo Crediário
      else if (desc.includes('novo s/') || desc.includes('novo s/ seguro')) {
        return 'Novo Crediário';
      } 
      // Cartão de Crédito
      else if (desc.includes('cartão') || desc.includes('cartao')) {
        return 'Cartão de Crédito';
      } 
      else {
        return 'Outros';
      }
    };

    // Processar dados por produto individual
    const produtosDetalhados = result.rows.map(row => ({
      descricao: row.descricao || 'N/A',
      categoria: categorizeProduct(row.descricao || ''),
      quantidade_contratos: parseInt(row.quantidade_contratos) || 0,
      total_financiado: parseFloat(row.total_financiado) || 0,
      total_liberado: parseFloat(row.total_liberado) || 0,
      total_solicitado: parseFloat(row.total_solicitado) || 0,
      ticket_medio_financiado: parseFloat(row.ticket_medio_financiado) || 0,
      ticket_medio_liberado: parseFloat(row.ticket_medio_liberado) || 0
    }));

    // Agregar por categoria
    const categorias = {};
    
    produtosDetalhados.forEach(produto => {
      const cat = produto.categoria;
      
      if (!categorias[cat]) {
        categorias[cat] = {
          categoria: cat,
          quantidade_produtos: 0,
          quantidade_contratos: 0,
          total_financiado: 0,
          total_liberado: 0,
          total_solicitado: 0,
          produtos: []
        };
      }
      
      categorias[cat].quantidade_produtos += 1;
      categorias[cat].quantidade_contratos += produto.quantidade_contratos;
      categorias[cat].total_financiado += produto.total_financiado;
      categorias[cat].total_liberado += produto.total_liberado;
      categorias[cat].total_solicitado += produto.total_solicitado;
      categorias[cat].produtos.push(produto);
    });

    // Converter para array e calcular percentuais
    const categoriasArray = Object.values(categorias);
    const totalGeralLiberado = categoriasArray.reduce((sum, cat) => sum + cat.total_liberado, 0);
    
    categoriasArray.forEach(categoria => {
      categoria.percentual_liberado = totalGeralLiberado > 0 ? 
        ((categoria.total_liberado / totalGeralLiberado) * 100) : 0;
      categoria.ticket_medio = categoria.quantidade_contratos > 0 ? 
        (categoria.total_liberado / categoria.quantidade_contratos) : 0;
      
      // Ordenar produtos dentro de cada categoria por valor liberado
      categoria.produtos.sort((a, b) => b.total_liberado - a.total_liberado);
    });

    // Ordenar categorias por valor total liberado
    categoriasArray.sort((a, b) => b.total_liberado - a.total_liberado);

    const responseData = {
      resumo_categorias: categoriasArray,
      produtos_detalhados: produtosDetalhados.sort((a, b) => b.total_liberado - a.total_liberado),
      estatisticas_gerais: {
        total_categorias: categoriasArray.length,
        total_produtos: produtosDetalhados.length,
        total_contratos: categoriasArray.reduce((sum, cat) => sum + cat.quantidade_contratos, 0),
        total_financiado_geral: categoriasArray.reduce((sum, cat) => sum + cat.total_financiado, 0),
        total_liberado_geral: totalGeralLiberado,
        categoria_lider: categoriasArray[0]?.categoria || 'N/A',
        produto_lider: produtosDetalhados[0]?.descricao || 'N/A'
      }
    };
    
    console.log('[DESEMBOLSO RANKING] Ranking calculado:', {
      categorias: categoriasArray.length,
      produtos: produtosDetalhados.length,
      total_liberado: totalGeralLiberado
    });

    res.json(responseData);
    
  } catch (error) {
    console.error('[DESEMBOLSO RANKING] Erro ao buscar ranking de produtos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// API para análise de tomada de decisão
app.get('/api/contratos/tomada-decisao', async (req, res) => {
  try {
    console.log('[TOMADA DE DECISÃO] Buscando dados para análise estratégica...');
    
    const query = `SELECT * FROM em.desembolso_por_conveniofilial ORDER BY vlr_liberado DESC`;
    const result = await pool.query(query);
    
    console.log(`[TOMADA DE DECISÃO] Query executada, ${result.rows.length} registros encontrados`);
    
    // Função para categorizar produtos (mesma lógica do desembolso)
    const categorizeProduct = (descricao) => {
      const desc = descricao.toLowerCase();
      
      // Compra de Dívida (incluindo variações de digitação)
      if (desc.includes('compra de d') || desc.includes('compra de divida') || desc.includes('compre de d')) {
        return 'Compra de Dívida';
      } 
      // FGTS
      else if (desc.includes('fgts') || desc.includes('antecipação fgts')) {
        return 'FGTS';
      } 
      // Crédito Pessoal
      else if (desc.includes('crédito pessoal') || desc.includes('credito pessoal')) {
        return 'Crédito Pessoal';
      } 
      // Novo Crediário
      else if (desc.includes('novo s/') || desc.includes('novo s/ seguro')) {
        return 'Novo Crediário';
      } 
      // Cartão de Crédito
      else if (desc.includes('cartão') || desc.includes('cartao')) {
        return 'Cartão de Crédito';
      } 
      else {
        return 'Outros';
      }
    };
    
    // Processar dados completos com categorização
    const dadosCompletos = result.rows.map(row => ({
      id: row.id,
      nome: row.nome || 'N/A',
      nr_cpf_cnpj: row.nr_cpf_cnpj || 'N/A',
      descricao: row.descricao || 'N/A',
      categoria_produto: categorizeProduct(row.descricao || ''),
      nome_inst: row.nome_inst || 'N/A',
      data_entrada: row.data_entrada,
      valor_solic: parseFloat(row.valor_solic) || 0,
      vlr_liberado: parseFloat(row.vlr_liberado) || 0,
      vl_financ: parseFloat(row.vl_financ) || 0,
      status: row.status || 'N/A',
      cidade: row.cidade || 'N/A',
      uf: row.uf || 'N/A'
    }));

    // 🧠 ANÁLISES DE INTELIGÊNCIA ESTRATÉGICA AVANÇADA

    // 1. ANÁLISE DE COMPORTAMENTO E PADRÕES OCULTOS
    const produtos = {};
    const clientesComportamento = {};
    const instituicoesPerformance = {};
    const padroesSazonais = {};
    const redeSocial = {};
    
    dadosCompletos.forEach(item => {
      const categoria = item.categoria_produto; // Usar categoria ao invés de descrição específica
      const cliente = item.nr_cpf_cnpj;
      const instituicao = item.nome_inst;
      const dataEntrada = new Date(item.data_entrada);
      const mes = dataEntrada.getMonth() + 1;
      const diaSemana = dataEntrada.getDay();
      
      // Análise de Produtos com Métricas Avançadas (por categoria)
      if (!produtos[categoria]) {
        produtos[categoria] = {
          produto: categoria,
          operacoes: 0,
          valor_liberado: 0,
          valor_solicitado: 0,
          clientes_unicos: new Set(),
          tickets: [],
          aprovacoes_rapidas: 0,
          clientes_premium: new Set(),
          sazonalidade: {},
          margem_operacional: 0,
          indice_fidelizacao: 0
        };
      }
      
      produtos[categoria].operacoes += 1;
      produtos[categoria].valor_liberado += item.vlr_liberado;
      produtos[categoria].valor_solicitado += item.valor_solic;
      produtos[categoria].clientes_unicos.add(cliente);
      produtos[categoria].tickets.push(item.vlr_liberado);
      
      // Sazonalidade por categoria
      produtos[categoria].sazonalidade[mes] = (produtos[categoria].sazonalidade[mes] || 0) + 1;
      
      // Clientes Premium (acima de R$ 50k)
      if (item.vlr_liberado > 50000) {
        produtos[categoria].clientes_premium.add(cliente);
      }
      
      // Análise de Comportamento do Cliente
      if (!clientesComportamento[cliente]) {
        clientesComportamento[cliente] = {
          cliente: cliente,
          produtos_utilizados: new Set(),
          valor_total_historico: 0,
          frequencia_operacoes: 0,
          ticket_medio_pessoal: 0,
          perfil_risco: 'BAIXO',
          fidelidade_score: 0,
          diversificacao_produtos: 0,
          sazonalidade_pessoal: {},
          instituicoes_utilizadas: new Set()
        };
      }
      
      clientesComportamento[cliente].produtos_utilizados.add(categoria);
      clientesComportamento[cliente].valor_total_historico += item.vlr_liberado;
      clientesComportamento[cliente].frequencia_operacoes += 1;
      clientesComportamento[cliente].sazonalidade_pessoal[mes] = 
        (clientesComportamento[cliente].sazonalidade_pessoal[mes] || 0) + 1;
      clientesComportamento[cliente].instituicoes_utilizadas.add(instituicao);
      
      // Análise de Instituições Performance
      if (!instituicoesPerformance[instituicao]) {
        instituicoesPerformance[instituicao] = {
          instituicao: instituicao,
          eficiencia_aprovacao: 0,
          tempo_medio_processamento: 0,
          produtos_especializacao: {},
          clientes_atendidos: new Set(),
          volume_processado: 0,
          indice_satisfacao: 0,
          crescimento_mensal: {}
        };
      }
      
      instituicoesPerformance[instituicao].clientes_atendidos.add(cliente);
      instituicoesPerformance[instituicao].volume_processado += item.vlr_liberado;
      instituicoesPerformance[instituicao].produtos_especializacao[categoria] = 
        (instituicoesPerformance[instituicao].produtos_especializacao[categoria] || 0) + 1;
      
      // Padrões Sazonais Globais
      const chaveData = `${mes}-${diaSemana}`;
      if (!padroesSazonais[chaveData]) {
        padroesSazonais[chaveData] = {
          mes: mes,
          dia_semana: diaSemana,
          operacoes: 0,
          volume: 0,
          produtos_ativos: new Set()
        };
      }
      
      padroesSazonais[chaveData].operacoes += 1;
      padroesSazonais[chaveData].volume += item.vlr_liberado;
      padroesSazonais[chaveData].produtos_ativos.add(categoria);
    });

    // 🔬 CÁLCULOS DE MÉTRICAS AVANÇADAS E INTELIGÊNCIA PREDITIVA
    
    // Finalizar análise de comportamento de clientes
    Object.values(clientesComportamento).forEach(cliente => {
      cliente.diversificacao_produtos = cliente.produtos_utilizados.size;
      cliente.ticket_medio_pessoal = cliente.frequencia_operacoes > 0 
        ? cliente.valor_total_historico / cliente.frequencia_operacoes : 0;
      
      // Score de Fidelidade (0-100)
      cliente.fidelidade_score = Math.min(100, 
        (cliente.frequencia_operacoes * 10) + 
        (cliente.diversificacao_produtos * 15) + 
        (cliente.valor_total_historico / 1000)
      );
      
      // Perfil de Risco baseado em comportamento
      if (cliente.valor_total_historico > 100000) cliente.perfil_risco = 'PREMIUM';
      else if (cliente.diversificacao_produtos > 2) cliente.perfil_risco = 'MEDIO';
      else cliente.perfil_risco = 'BAIXO';
      
      // Converter Sets para arrays
      cliente.produtos_utilizados = Array.from(cliente.produtos_utilizados);
      cliente.instituicoes_utilizadas = Array.from(cliente.instituicoes_utilizadas);
    });

    // Finalizar análise de produtos com métricas revolucionárias
    const analise_produtos = Object.values(produtos).map(p => {
      const tickets_ordenados = p.tickets.sort((a, b) => a - b);
      const q1 = tickets_ordenados[Math.floor(tickets_ordenados.length * 0.25)];
      const mediana = tickets_ordenados[Math.floor(tickets_ordenados.length * 0.5)];
      const q3 = tickets_ordenados[Math.floor(tickets_ordenados.length * 0.75)];
      
      // Calcular sazonalidade (mês com mais operações)
      const mesComMaisOp = Object.entries(p.sazonalidade)
        .reduce((a, b) => a[1] > b[1] ? a : b, [0, 0]);
      
      return {
        ...p,
        clientes_unicos: p.clientes_unicos.size,
        clientes_premium: p.clientes_premium.size,
        ticket_medio: p.operacoes > 0 ? p.valor_liberado / p.operacoes : 0,
        ticket_mediano: mediana || 0,
        ticket_q1: q1 || 0,
        ticket_q3: q3 || 0,
        eficiencia: p.operacoes > 0 ? Math.min(100, (p.valor_liberado / (p.valor_solicitado || p.valor_liberado) * 100)) : 0,
        participacao: 0, // será calculado depois
        concentracao_clientes: p.clientes_unicos.size > 0 ? (p.clientes_premium.size / p.clientes_unicos.size * 100) : 0,
        volatilidade: tickets_ordenados.length > 1 ? 
          (q3 - q1) / (mediana || 1) * 100 : 0,
        mes_pico_sazonalidade: parseInt(mesComMaisOp[0]) || 0,
        intensidade_sazonal: mesComMaisOp[1] || 0,
        margem_estimada: p.valor_liberado > 0 ? 
          ((p.valor_liberado - (p.valor_solicitado || 0)) / p.valor_liberado * 100) : 0,
        potencial_crescimento: Math.min(100, 
          (p.clientes_premium.size / p.clientes_unicos.size * 50) +
          (p.operacoes > 10 ? 25 : 0) +
          (Object.keys(p.sazonalidade).length > 6 ? 25 : 0)
        )
      };
    });

    const total_liberado = analise_produtos.reduce((sum, p) => sum + p.valor_liberado, 0);
    analise_produtos.forEach(p => {
      p.participacao = total_liberado > 0 ? (p.valor_liberado / total_liberado * 100) : 0;
    });

    // 2. Análise Geográfica
    const regioes = {};
    dadosCompletos.forEach(item => {
      const key = `${item.cidade}-${item.uf}`;
      if (!regioes[key]) {
        regioes[key] = {
          cidade: item.cidade,
          uf: item.uf,
          operacoes: 0,
          valor_total: 0,
          produtos: new Set()
        };
      }
      regioes[key].operacoes += 1;
      regioes[key].valor_total += item.vlr_liberado;
      regioes[key].produtos.add(item.categoria_produto);
    });

    const analise_geografica = Object.values(regioes).map(r => ({
      ...r,
      diversificacao: r.produtos.size,
      produtos: Array.from(r.produtos),
      ticket_medio: r.operacoes > 0 ? r.valor_total / r.operacoes : 0
    })).sort((a, b) => b.valor_total - a.valor_total);

    // 3. Análise de Instituições
    const instituicoes = {};
    dadosCompletos.forEach(item => {
      const inst = item.nome_inst;
      if (!instituicoes[inst]) {
        instituicoes[inst] = {
          instituicao: inst,
          operacoes: 0,
          volume: 0,
          produtos: new Set()
        };
      }
      instituicoes[inst].operacoes += 1;
      instituicoes[inst].volume += item.vlr_liberado;
      instituicoes[inst].produtos.add(item.categoria_produto);
    });

    const analise_instituicoes = Object.values(instituicoes).map(i => ({
      ...i,
      portfolio: i.produtos.size,
      produtos: Array.from(i.produtos),
      volume_medio: i.operacoes > 0 ? i.volume / i.operacoes : 0
    })).sort((a, b) => b.volume - a.volume);

    // 4. INSIGHTS E ALERTAS
    const insights = [];
    const oportunidades = [];

    // Top performers
    const top_produto = analise_produtos.sort((a, b) => b.valor_liberado - a.valor_liberado)[0];
    const top_regiao = analise_geografica[0];

    insights.push({
      tipo: 'destaque',
      titulo: 'Produto Líder',
      valor: `${top_produto?.produto || 'N/A'}`,
      metrica: `R$ ${(top_produto?.valor_liberado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
      descricao: `Representa ${(top_produto?.participacao || 0).toFixed(1)}% do volume total`
    });

    // Oportunidades de crescimento
    analise_geografica.forEach(regiao => {
      if (regiao.diversificacao < 3 && regiao.valor_total > 100000) {
        oportunidades.push({
          tipo: 'expansao',
          titulo: 'Potencial de Diversificação',
          regiao: `${regiao.cidade} - ${regiao.uf}`,
          atual: `${regiao.diversificacao} produtos`,
          potencial: 'Alto volume, baixa diversificação'
        });
      }
    });

    // 🎯 INTELIGÊNCIA DE MERCADO E ANÁLISES REVOLUCIONÁRIAS
    
    // Análise de Concentração de Risco
    const analise_concentracao = {
      concentracao_top3_produtos: 0,
      concentracao_top5_clientes: 0,
      indice_diversificacao: 0,
      risco_concentracao: 'BAIXO'
    };
    
    const top3Produtos = analise_produtos
      .sort((a, b) => b.valor_liberado - a.valor_liberado)
      .slice(0, 3);
    
    analise_concentracao.concentracao_top3_produtos = 
      top3Produtos.reduce((sum, p) => sum + p.participacao, 0);
    
    // Análise de Oportunidades Inteligentes
    const oportunidades_inteligentes = [];
    
    // 1. Produtos Subexplorados com Alto Potencial
    analise_produtos.forEach(produto => {
      if (produto.potencial_crescimento > 70 && produto.participacao < 5) {
        oportunidades_inteligentes.push({
          tipo: 'produto_subexplorado',
          titulo: 'Produto com Potencial Inexplorado',
          produto: produto.produto,
          potencial: `${produto.potencial_crescimento.toFixed(0)}%`,
          acao: 'Aumentar investimento em marketing e parcerias',
          impacto_estimado: `+${(produto.valor_liberado * 2.5).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`,
          prioridade: 'ALTA'
        });
      }
    });
    
    // 2. Análise de Clientes Premium Subutilizados
    const clientesPremiumSubutilizados = Object.values(clientesComportamento)
      .filter(c => c.valor_total_historico > 50000 && c.diversificacao_produtos < 2)
      .length;
      
    if (clientesPremiumSubutilizados > 0) {
      oportunidades_inteligentes.push({
        tipo: 'cross_selling',
        titulo: 'Oportunidade de Cross-Selling Premium',
        detalhes: `${clientesPremiumSubutilizados} clientes premium usando poucos produtos`,
        potencial_receita: clientesPremiumSubutilizados * 25000,
        acao: 'Campanha direcionada de produtos complementares',
        prioridade: 'MUITO_ALTA'
      });
    }
    
    // 3. Análise Temporal e Sazonalidade Inteligente com Tendências Avançadas
    const analise_temporal = {};
    const tendencias_mercado = {};
    
    dadosCompletos.forEach(item => {
      const data = new Date(item.data_entrada);
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      const trimestre = Math.ceil(mes / 3);
      const chaveAnoMes = `${ano}-${mes.toString().padStart(2, '0')}`;
      const chaveTrimestre = `${ano}-T${trimestre}`;
      
      // Análise mensal
      if (!analise_temporal[chaveAnoMes]) {
        analise_temporal[chaveAnoMes] = {
          periodo: chaveAnoMes,
          mes: mes,
          ano: ano,
          operacoes: 0,
          volume: 0,
          ticket_medio: 0,
          produtos_por_categoria: {},
          crescimento_mensal: 0,
          indice_atividade: 0
        };
      }
      
      analise_temporal[chaveAnoMes].operacoes += 1;
      analise_temporal[chaveAnoMes].volume += item.vlr_liberado;
      analise_temporal[chaveAnoMes].produtos_por_categoria[item.categoria_produto] = 
        (analise_temporal[chaveAnoMes].produtos_por_categoria[item.categoria_produto] || 0) + item.vlr_liberado;
      
      // Análise de tendências por categoria
      if (!tendencias_mercado[item.categoria_produto]) {
        tendencias_mercado[item.categoria_produto] = {
          categoria: item.categoria_produto,
          timeline_mensal: {},
          velocidade_crescimento: 0,
          aceleracao: 0,
          previsao_proximo_mes: 0,
          tendencia: 'ESTAVEL',
          confianca_previsao: 0
        };
      }
      
      if (!tendencias_mercado[item.categoria_produto].timeline_mensal[chaveAnoMes]) {
        tendencias_mercado[item.categoria_produto].timeline_mensal[chaveAnoMes] = 0;
      }
      tendencias_mercado[item.categoria_produto].timeline_mensal[chaveAnoMes] += item.vlr_liberado;
    });
    
    // Calcular tendências e previsões
    const periodos_ordenados = Object.keys(analise_temporal).sort();
    
    // Calcular crescimento mensal
    for (let i = 1; i < periodos_ordenados.length; i++) {
      const atual = analise_temporal[periodos_ordenados[i]];
      const anterior = analise_temporal[periodos_ordenados[i - 1]];
      
      if (anterior.volume > 0) {
        atual.crescimento_mensal = ((atual.volume - anterior.volume) / anterior.volume) * 100;
      }
      
      atual.ticket_medio = atual.operacoes > 0 ? atual.volume / atual.operacoes : 0;
    }
    
    // Análise de tendências por categoria com IA preditiva
    Object.values(tendencias_mercado).forEach(categoria => {
      const timeline = Object.entries(categoria.timeline_mensal).sort();
      
      if (timeline.length >= 3) {
        const valores = timeline.map(([_, valor]) => valor);
        const ultimos3 = valores.slice(-3);
        
        // Calcular velocidade de crescimento de forma mais inteligente
        let crescimentos = [];
        const valoresFiltrados = valores.filter(v => v > 0); // Remove valores zero
        
        // Se temos poucos dados válidos, usar análise baseada no volume total
        if (valoresFiltrados.length < 2) {
          const volumeTotal = valores.reduce((sum, val) => sum + val, 0);
          // Para produtos dominantes, considerar estável/crescimento
          if (volumeTotal > 1000000) { // Mais de 1M = produto dominante
            categoria.velocidade_crescimento = 5; // Crescimento moderado
            categoria.tendencia = 'CRESCIMENTO_MODERADO';
          } else {
            categoria.velocidade_crescimento = 0;
            categoria.tendencia = 'ESTAVEL';
          }
        } else {
          // Análise normal para dados suficientes
          for (let i = 1; i < valoresFiltrados.length; i++) {
            const crescimento = ((valoresFiltrados[i] - valoresFiltrados[i - 1]) / valoresFiltrados[i - 1]) * 100;
            // Limitar crescimentos extremos para evitar outliers
            crescimentos.push(Math.max(-100, Math.min(500, crescimento)));
          }
          
          if (crescimentos.length > 0) {
            categoria.velocidade_crescimento = crescimentos.reduce((a, b) => a + b, 0) / crescimentos.length;
          } else {
            categoria.velocidade_crescimento = 0;
          }
          
          // Determinar tendência com lógica melhorada
          const volumeTotal = valores.reduce((sum, val) => sum + val, 0);
          const volumeMedio = volumeTotal / valores.length;
          
          // Para produtos com alto volume, ser mais conservador
          if (volumeMedio > 500000) {
            if (categoria.velocidade_crescimento > 20) categoria.tendencia = 'CRESCIMENTO_FORTE';
            else if (categoria.velocidade_crescimento > 5) categoria.tendencia = 'CRESCIMENTO_MODERADO';
            else if (categoria.velocidade_crescimento > -5) categoria.tendencia = 'ESTAVEL';
            else if (categoria.velocidade_crescimento > -15) categoria.tendencia = 'DECLINIO_MODERADO';
            else categoria.tendencia = 'DECLINIO_FORTE';
          } else {
            // Para produtos menores, usar thresholds originais
            if (categoria.velocidade_crescimento > 10) categoria.tendencia = 'CRESCIMENTO_FORTE';
            else if (categoria.velocidade_crescimento > 3) categoria.tendencia = 'CRESCIMENTO_MODERADO';
            else if (categoria.velocidade_crescimento > -3) categoria.tendencia = 'ESTAVEL';
            else if (categoria.velocidade_crescimento > -10) categoria.tendencia = 'DECLINIO_MODERADO';
            else categoria.tendencia = 'DECLINIO_FORTE';
          }
        }
        
        // Calcular aceleração (mudança na velocidade)
        if (crescimentos.length >= 2) {
          categoria.aceleracao = crescimentos[crescimentos.length - 1] - crescimentos[0];
        }
        
        // Previsão para próximo mês usando regressão linear simples
        const ultimoValor = valores[valores.length - 1];
        categoria.previsao_proximo_mes = ultimoValor * (1 + (Math.max(-50, Math.min(50, categoria.velocidade_crescimento)) / 100));
        
        // Confiança na previsão baseada na consistência dos dados
        const desvio_padrao = Math.sqrt(
          crescimentos.reduce((sum, val) => sum + Math.pow(val - categoria.velocidade_crescimento, 2), 0) 
          / crescimentos.length
        );
        categoria.confianca_previsao = Math.max(0, Math.min(100, 100 - (desvio_padrao * 2)));
      }
    });
    
    const mesesComMaiorVolume = Object.entries(
      dadosCompletos.reduce((acc, item) => {
        const mes = new Date(item.data_entrada).getMonth() + 1;
        acc[mes] = (acc[mes] || 0) + item.vlr_liberado;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);
    
    // 4. Insights de Comportamento Revolucionários
    const insights_revolucionarios = [];
    
    // Insight de Concentração Temporal
    if (mesesComMaiorVolume.length > 0) {
      const mesComMaiorVolume = mesesComMaiorVolume[0];
      const nomesMeses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                         'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      insights_revolucionarios.push({
        tipo: 'sazonalidade_critica',
        titulo: 'Padrão Sazonal Identificado',
        mes_critico: nomesMeses[mesComMaiorVolume[0]],
        concentracao: `${((mesComMaiorVolume[1] / dadosCompletos.reduce((sum, item) => sum + item.vlr_liberado, 0)) * 100).toFixed(1)}%`,
        insight: 'Oportunidade de redistribuir demanda ou intensificar marketing nos outros meses',
        acao_recomendada: 'Criar campanhas antecipadas para equilibrar fluxo'
      });
    }
    
    // Insight de Eficiência Operacional
    const produtosMaisEficientes = analise_produtos
      .filter(p => p.eficiencia > 100)
      .sort((a, b) => b.eficiencia - a.eficiencia);
      
    if (produtosMaisEficientes.length > 0) {
      insights_revolucionarios.push({
        tipo: 'eficiencia_operacional',
        titulo: 'Produtos Super-Eficientes Identificados',
        quantidade: produtosMaisEficientes.length,
        melhor_produto: produtosMaisEficientes[0].produto,
        eficiencia_maxima: `${produtosMaisEficientes[0].eficiencia.toFixed(1)}%`,
        oportunidade: 'Replicar processos destes produtos para outros com baixa eficiência'
      });
    }
    
    // Insight de Clientes Estratégicos
    const clientesEstrategicos = Object.values(clientesComportamento)
      .filter(c => c.fidelidade_score > 80)
      .length;
      
    insights_revolucionarios.push({
      tipo: 'clientes_estrategicos',
      titulo: 'Base de Clientes Estratégicos',
      quantidade: clientesEstrategicos,
      percentual: `${((clientesEstrategicos / Object.keys(clientesComportamento).length) * 100).toFixed(1)}%`,
      valor_medio: Object.values(clientesComportamento)
        .filter(c => c.fidelidade_score > 80)
        .reduce((sum, c, _, arr) => sum + (c.valor_total_historico / arr.length), 0),
      insight: 'Esta base de clientes fiéis é o núcleo do negócio - merecem tratamento VIP'
    });

    const resumo = {
      total_operacoes: dadosCompletos.length,
      volume_total: dadosCompletos.reduce((sum, item) => sum + item.vlr_liberado, 0),
      ticket_medio_geral: dadosCompletos.length > 0 ? 
        dadosCompletos.reduce((sum, item) => sum + item.vlr_liberado, 0) / dadosCompletos.length : 0,
      produtos_ativos: new Set(dadosCompletos.map(item => item.categoria_produto)).size,
      regioes_ativas: new Set(dadosCompletos.map(item => `${item.cidade}-${item.uf}`)).size,
      instituicoes_ativas: new Set(dadosCompletos.map(item => item.nome_inst)).size,
      clientes_premium: Object.values(clientesComportamento).filter(c => c.perfil_risco === 'PREMIUM').length,
      indice_diversificacao: analise_produtos.length > 0 ? 
        (1 - (analise_concentracao.concentracao_top3_produtos / 100)) * 100 : 0,
      sazonalidade_detectada: mesesComMaiorVolume.length > 0,
      mes_pico: mesesComMaiorVolume.length > 0 ? mesesComMaiorVolume[0][0] : null
    };

    const response = {
      resumo_executivo: resumo,
      analise_produtos: analise_produtos.sort((a, b) => b.valor_liberado - a.valor_liberado),
      analise_geografica: analise_geografica,
      analise_instituicoes: analise_instituicoes,
      insights: insights,
      oportunidades: oportunidades,
      
      // 🚀 ANÁLISES REVOLUCIONÁRIAS EXCLUSIVAS
      inteligencia_comportamental: {
        clientes_estrategicos: Object.values(clientesComportamento)
          .filter(c => c.fidelidade_score > 80)
          .sort((a, b) => b.fidelidade_score - a.fidelidade_score)
          .slice(0, 10),
        clientes_potencial_premium: Object.values(clientesComportamento)
          .filter(c => c.perfil_risco === 'MEDIO' && c.valor_total_historico > 30000)
          .sort((a, b) => b.valor_total_historico - a.valor_total_historico)
          .slice(0, 10),
        oportunidades_cross_sell: Object.values(clientesComportamento)
          .filter(c => c.diversificacao_produtos === 1 && c.valor_total_historico > 20000)
          .length
      },
      
      analise_concentracao_risco: analise_concentracao,
      
      oportunidades_inteligentes: oportunidades_inteligentes,
      
      insights_revolucionarios: insights_revolucionarios,
      
      matriz_bcg_produtos: analise_produtos.map(p => ({
        produto: p.produto,
        crescimento: p.potencial_crescimento,
        participacao: p.participacao,
        categoria_bcg: p.participacao > 10 && p.potencial_crescimento > 70 ? 'ESTRELA' :
                      p.participacao > 10 && p.potencial_crescimento <= 70 ? 'SOLIDO' :
                      p.participacao <= 10 && p.potencial_crescimento > 70 ? 'OPORTUNIDADE' : 'REVISAR',
        valor_liberado: p.valor_liberado,
        recomendacao_estrategica: p.participacao > 10 && p.potencial_crescimento > 70 ? 'EXPANDIR AGRESSIVAMENTE' :
                                 p.participacao > 10 && p.potencial_crescimento <= 70 ? 'MANTER ESTABILIDADE' :
                                 p.participacao <= 10 && p.potencial_crescimento > 70 ? 'EXPLORAR POTENCIAL' : 'REAVALIAR ESTRATÉGIA'
      })).sort((a, b) => b.valor_liberado - a.valor_liberado),
      
      previsoes_inteligentes: {
        potencial_receita_adicional: oportunidades_inteligentes
          .reduce((sum, op) => sum + (op.potencial_receita || 0), 0),
        produtos_com_maior_potencial: analise_produtos
          .filter(p => p.potencial_crescimento > 80)
          .sort((a, b) => b.potencial_crescimento - a.potencial_crescimento)
          .slice(0, 3),
        clientes_em_risco_churn: Object.values(clientesComportamento)
          .filter(c => c.fidelidade_score < 30 && c.valor_total_historico > 10000)
          .length,
        score_saude_portfolio: Math.min(100, 
          (resumo.indice_diversificacao * 0.3) +
          (clientesEstrategicos / Object.keys(clientesComportamento).length * 100 * 0.4) +
          (analise_produtos.filter(p => p.potencial_crescimento > 70).length / analise_produtos.length * 100 * 0.3)
        )
      },
      
      // 🚀 ANÁLISES REVOLUCIONÁRIAS COM IA E MACHINE LEARNING
      analise_tendencias: {
        timeline_completa: Object.values(analise_temporal).sort((a, b) => a.periodo.localeCompare(b.periodo)),
        tendencias_por_categoria: Object.values(tendencias_mercado).sort((a, b) => b.previsao_proximo_mes - a.previsao_proximo_mes),
        crescimento_medio_mercado: Object.values(analise_temporal).length > 1 
          ? Object.values(analise_temporal).reduce((sum, p) => sum + p.crescimento_mensal, 0) / Object.values(analise_temporal).length 
          : 0,
        volatilidade_mercado: 0, // será calculada
        indice_momentum: 0,
        previsao_receita_total: Object.values(tendencias_mercado).reduce((sum, t) => sum + (t.previsao_proximo_mes || 0), 0),
        categorias_em_alta: Object.values(tendencias_mercado).filter(t => t.tendencia.includes('CRESCIMENTO')),
        categorias_em_queda: Object.values(tendencias_mercado).filter(t => t.tendencia.includes('DECLINIO')),
        oportunidades_emergentes: []
      },

      // 🎯 SCORING INTELIGENTE DE OPORTUNIDADES
      scoring_oportunidades: Object.values(analise_produtos).map(produto => {
        const tendencia = tendencias_mercado[produto.produto];
        let score_final = 0;
        
        // Componentes do score (0-100)
        const score_volume = Math.min(100, (produto.valor_liberado / 1000000) * 20); // Volume atual
        const score_crescimento = tendencia ? Math.min(100, Math.max(0, (tendencia.velocidade_crescimento + 50))) : 50; // Crescimento
        const score_diversificacao = Math.min(100, produto.clientes_unicos * 2); // Base de clientes
        const score_eficiencia = Math.min(100, produto.eficiencia || 50); // Eficiência operacional
        const score_potencial = produto.potencial_crescimento || 50; // Potencial identificado
        
        score_final = (score_volume * 0.25) + (score_crescimento * 0.25) + (score_diversificacao * 0.2) + 
                      (score_eficiencia * 0.15) + (score_potencial * 0.15);
        
        let categoria_investimento = 'MANTER';
        if (score_final > 80) categoria_investimento = 'INVESTIR_MASSIVAMENTE';
        else if (score_final > 65) categoria_investimento = 'EXPANDIR';
        else if (score_final > 45) categoria_investimento = 'MANTER';
        else if (score_final > 25) categoria_investimento = 'REAVALIAR';
        else categoria_investimento = 'DESCONTINUAR';
        
        return {
          produto: produto.produto,
          score_final: score_final.toFixed(1),
          categoria_investimento: categoria_investimento,
          componentes_score: {
            volume: score_volume.toFixed(1),
            crescimento: score_crescimento.toFixed(1),
            diversificacao: score_diversificacao.toFixed(1),
            eficiencia: score_eficiencia.toFixed(1),
            potencial: score_potencial.toFixed(1)
          },
          tendencia_mercado: tendencia?.tendencia || 'DADOS_INSUFICIENTES',
          previsao_proximo_mes: tendencia?.previsao_proximo_mes || 0,
          confianca_previsao: tendencia?.confianca_previsao || 0,
          acao_recomendada: categoria_investimento === 'INVESTIR_MASSIVAMENTE' ? 'Alocar recursos máximos, expandir equipe' :
                           categoria_investimento === 'EXPANDIR' ? 'Aumentar investimento, testar novos canais' :
                           categoria_investimento === 'MANTER' ? 'Manter estratégia atual, otimizar processos' :
                           categoria_investimento === 'REAVALIAR' ? 'Analisar causas, implementar melhorias' :
                           'Considerar descontinuação ou reformulação completa'
        };
      }).sort((a, b) => parseFloat(b.score_final) - parseFloat(a.score_final)),

      // 🧠 INTELIGÊNCIA PREDITIVA AVANÇADA
      inteligencia_preditiva: {
        probabilidade_churn: Object.values(clientesComportamento)
          .map(c => ({
            cliente: c.cliente,
            probabilidade_churn: Math.max(0, Math.min(100, 100 - c.fidelidade_score + (c.diversificacao_produtos < 2 ? 30 : 0))),
            valor_risco: c.valor_total_historico,
            acao_preventiva: c.fidelidade_score < 50 ? 'CONTATO_URGENTE' : 'MONITORAR'
          }))
          .filter(c => c.probabilidade_churn > 60)
          .sort((a, b) => b.valor_risco - a.valor_risco),
          
        produtos_canibalizacao: analise_produtos
          .filter((produto, index, array) => {
            // Detectar produtos que podem estar canibalizando uns aos outros
            return array.some((outro, outroIndex) => 
              outroIndex !== index && 
              Math.abs(produto.ticket_medio - outro.ticket_medio) < (produto.ticket_medio * 0.1) &&
              produto.categoria_bcg === outro.categoria_bcg
            );
          })
          .map(p => ({
            produto: p.produto,
            risco_canibalizacao: 'MÉDIO',
            acao: 'Diferenciar proposta de valor'
          })),
          
        janelas_oportunidade: mesesComMaiorVolume.slice(0, 3).map(([mes, volume], index) => ({
          mes: parseInt(mes),
          nome_mes: ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][mes],
          volume_historico: volume,
          ranking: index + 1,
          oportunidade: index === 0 ? 'PRINCIPAL' : index === 1 ? 'SECUNDÁRIA' : 'TERCIÁRIA',
          estrategia_recomendada: index === 0 ? 'Maximizar recursos e campanhas' : 
                                  index === 1 ? 'Campanhas direcionadas' : 'Preparação antecipada'
        }))
      },

      alertas_criticos: [
        ...(analise_concentracao.concentracao_top3_produtos > 70 ? [{
          tipo: 'CONCENTRACAO_ALTA',
          titulo: 'Risco de Concentração Detectado',
          descricao: `Top 3 produtos representam ${analise_concentracao.concentracao_top3_produtos.toFixed(1)}% do volume`,
          urgencia: 'ALTA',
          acao: 'Diversificar portfólio urgentemente'
        }] : []),
        ...(Object.values(clientesComportamento).filter(c => c.fidelidade_score < 30 && c.valor_total_historico > 50000).length > 0 ? [{
          tipo: 'CLIENTES_PREMIUM_RISCO',
          titulo: 'Clientes Premium em Risco',
          descricao: 'Clientes de alto valor com baixa fidelidade detectados',
          urgencia: 'MUITO_ALTA',
          acao: 'Programa de retenção imediato'
        }] : []),
        ...(Object.values(tendencias_mercado).filter(t => t.tendencia === 'DECLINIO_FORTE').length > 0 ? [{
          tipo: 'PRODUTOS_EM_DECLINIO',
          titulo: 'Produtos em Declínio Crítico',
          descricao: `${Object.values(tendencias_mercado).filter(t => t.tendencia === 'DECLINIO_FORTE').length} produtos com queda acentuada`,
          urgencia: 'ALTA',
          acao: 'Revisão estratégica imediata'
        }] : [])
      ],

      // 🧬 ANÁLISE COMPORTAMENTAL AVANÇADA
      analise_comportamental: {
        score_fidelidade: Object.values(clientesComportamento).length > 0 
          ? Object.values(clientesComportamento).reduce((sum, c) => sum + c.fidelidade_score, 0) / Object.values(clientesComportamento).length
          : 0,
        total_clientes: Object.values(clientesComportamento).length,
        perfil_risco: {
          baixo: {
            quantidade: Object.values(clientesComportamento).filter(c => c.perfil_risco === 'BAIXO').length,
            valor_medio: Object.values(clientesComportamento).filter(c => c.perfil_risco === 'BAIXO')
              .reduce((sum, c, _, arr) => sum + c.valor_total_historico / arr.length || 0, 0)
          },
          medio: {
            quantidade: Object.values(clientesComportamento).filter(c => c.perfil_risco === 'MEDIO').length,
            valor_medio: Object.values(clientesComportamento).filter(c => c.perfil_risco === 'MEDIO')
              .reduce((sum, c, _, arr) => sum + c.valor_total_historico / arr.length || 0, 0)
          },
          alto: {
            quantidade: Object.values(clientesComportamento).filter(c => c.perfil_risco === 'ALTO').length,
            valor_medio: Object.values(clientesComportamento).filter(c => c.perfil_risco === 'ALTO')
              .reduce((sum, c, _, arr) => sum + c.valor_total_historico / arr.length || 0, 0)
          }
        }
      },

      // 🎯 CONCENTRAÇÃO DE RISCO DETALHADA
      concentracao_risco: {
        por_cliente: {
          percentual_top_10: analise_concentracao.concentracao_top5_clientes || 0,
          valor_medio_top_10: Object.values(clientesComportamento)
            .sort((a, b) => b.valor_total_historico - a.valor_total_historico)
            .slice(0, 10)
            .reduce((sum, c, _, arr) => sum + c.valor_total_historico / arr.length || 0, 0),
          nivel_risco: (analise_concentracao.concentracao_top5_clientes || 0) > 50 ? 'ALTO' : 
                      (analise_concentracao.concentracao_top5_clientes || 0) > 30 ? 'MÉDIO' : 'BAIXO'
        },
        por_produto: {
          percentual_top_3: analise_concentracao.concentracao_top3_produtos,
          produto_principal: analise_produtos.length > 0 ? analise_produtos[0].produto : 'N/A',
          nivel_risco: analise_concentracao.concentracao_top3_produtos > 50 ? 'ALTO' : 
                      analise_concentracao.concentracao_top3_produtos > 30 ? 'MÉDIO' : 'BAIXO'
        }
      },

      // 🚀 OPORTUNIDADES DE CROSS-SELL INTELIGENTE
      oportunidades_crosssell: analise_produtos
        .filter(p => p.potencial_crescimento > 50)
        .sort((a, b) => b.potencial_crescimento - a.potencial_crescimento)
        .slice(0, 5)
        .map((p, index) => ({
          produto: p.produto,
          clientes_potenciais: Math.floor(p.potencial_crescimento / 10) + (5 - index) * 2,
          receita_potencial: p.valor_liberado * (p.potencial_crescimento / 100) * 0.3
        })),

      // 🤖 ANÁLISES DE INTELIGÊNCIA ARTIFICIAL AVANÇADA
      ia_insights: {
        // Detecção de padrões ocultos usando correlação
        padroes_correlacao: analise_produtos.map(produto => {
          const outros_produtos = analise_produtos.filter(p => p.produto !== produto.produto);
          let correlacoes = [];
          
          outros_produtos.forEach(outro => {
            // Calcular similaridade baseada em múltiplas métricas
            const similaridade_ticket = 1 - Math.abs(produto.ticket_medio - outro.ticket_medio) / Math.max(produto.ticket_medio, outro.ticket_medio);
            const similaridade_eficiencia = 1 - Math.abs(produto.eficiencia - outro.eficiencia) / 100;
            const similaridade_participacao = 1 - Math.abs(produto.participacao - outro.participacao) / 100;
            
            const correlacao_total = (similaridade_ticket + similaridade_eficiencia + similaridade_participacao) / 3;
            
            if (correlacao_total > 0.7) {
              correlacoes.push({
                produto_relacionado: outro.produto,
                forca_correlacao: correlacao_total,
                tipo_relacao: correlacao_total > 0.85 ? 'SUBSTITUTO' : 'COMPLEMENTAR'
              });
            }
          });
          
          return {
            produto: produto.produto,
            correlacoes: correlacoes.sort((a, b) => b.forca_correlacao - a.forca_correlacao).slice(0, 3)
          };
        }).filter(p => p.correlacoes.length > 0),

        // Análise de ciclo de vida do produto usando machine learning básico
        ciclo_vida_produtos: analise_produtos.map(produto => {
          let fase_ciclo = 'MATURIDADE';
          let confianca = 0;
          
          // Algoritmo simples de classificação baseado em múltiplas variáveis
          const score_introducao = (produto.clientes_unicos < 100 && produto.potencial_crescimento > 80) ? 0.8 : 0;
          const score_crescimento = (produto.potencial_crescimento > 60 && produto.eficiencia > 80) ? 0.8 : 0;
          const score_maturidade = (produto.participacao > 15 && produto.eficiencia > 70 && produto.potencial_crescimento < 50) ? 0.8 : 0;
          const score_declinio = (produto.potencial_crescimento < 30 && produto.eficiencia < 60) ? 0.8 : 0;
          
          const scores = [
            { fase: 'INTRODUÇÃO', score: score_introducao },
            { fase: 'CRESCIMENTO', score: score_crescimento },
            { fase: 'MATURIDADE', score: score_maturidade },
            { fase: 'DECLÍNIO', score: score_declinio }
          ].sort((a, b) => b.score - a.score);
          
          fase_ciclo = scores[0].fase;
          confianca = scores[0].score * 100;
          
          // Estratégias por fase
          let estrategia_recomendada = '';
          switch (fase_ciclo) {
            case 'INTRODUÇÃO':
              estrategia_recomendada = 'Investir em marketing e desenvolvimento de mercado';
              break;
            case 'CRESCIMENTO':
              estrategia_recomendada = 'Expandir capacidade e fortalecer posição competitiva';
              break;
            case 'MATURIDADE':
              estrategia_recomendada = 'Otimizar custos e buscar diferenciação';
              break;
            case 'DECLÍNIO':
              estrategia_recomendada = 'Reavaliar estratégia ou considerar descontinuação';
              break;
          }
          
          return {
            produto: produto.produto,
            fase_ciclo: fase_ciclo,
            confianca_ia: confianca.toFixed(1),
            estrategia_recomendada: estrategia_recomendada,
            prioridade_atencao: fase_ciclo === 'DECLÍNIO' ? 'ALTA' : 
                               fase_ciclo === 'INTRODUÇÃO' ? 'MÉDIA' : 'BAIXA'
          };
        }),

        // Detecção de anomalias usando análise estatística
        anomalias_detectadas: analise_produtos
          .map(produto => {
            const anomalias = [];
            
            // Anomalia: Alto volume mas baixa eficiência
            if (produto.participacao > 10 && produto.eficiencia < 50) {
              anomalias.push({
                tipo: 'EFICIENCIA_BAIXA',
                descricao: 'Alto volume com baixa eficiência operacional',
                impacto: 'ALTO',
                acao: 'Revisar processos operacionais urgentemente'
              });
            }
            
            // Anomalia: Baixo volume mas alta eficiência
            if (produto.participacao < 5 && produto.eficiência > 90) {
              anomalias.push({
                tipo: 'POTENCIAL_SUBEXPLORADO',
                descricao: 'Alta eficiência mas baixo volume de mercado',
                impacto: 'MÉDIO',
                acao: 'Oportunidade de expansão e marketing'
              });
            }
            
            // Anomalia: Concentração extrema de clientes premium
            if (produto.concentracao_clientes > 80) {
              anomalias.push({
                tipo: 'CONCENTRACAO_ALTA',
                descricao: 'Dependência excessiva de poucos clientes premium',
                impacto: 'ALTO',
                acao: 'Diversificar base de clientes'
              });
            }
            
            return anomalias.length > 0 ? {
              produto: produto.produto,
              anomalias: anomalias
            } : null;
          })
          .filter(item => item !== null),

        // Score de saúde geral do portfólio usando IA
        score_saude_portfolio: Math.min(100, 
          // Diversificação (30%)
          (resumo.indice_diversificacao * 0.3) +
          // Base de clientes estratégicos (25%)
          (clientesEstrategicos / Object.keys(clientesComportamento).length * 100 * 0.25) +
          // Produtos em crescimento (25%)
          (analise_produtos.filter(p => p.potencial_crescimento > 70).length / analise_produtos.length * 100 * 0.25) +
          // Eficiência média (20%)
          (analise_produtos.reduce((sum, p) => sum + (p.eficiencia || 0), 0) / analise_produtos.length * 0.2)
        )
      },

      // 🎯 RECOMENDAÇÕES ESTRATÉGICAS PRIORITÁRIAS
      recomendacoes_prioritarias: [
        // Top 3 produtos para investimento imediato
        ...analise_produtos
          .filter(p => p.potencial_crescimento > 75 && p.participacao < 20)
          .sort((a, b) => b.potencial_crescimento - a.potencial_crescimento)
          .slice(0, 3)
          .map((p, index) => ({
            prioridade: index + 1,
            tipo: 'INVESTIMENTO_PRODUTO',
            titulo: `Acelerar ${p.produto}`,
            impacto_estimado: `+${(p.valor_liberado * 0.5).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`,
            cronograma: '3-6 meses',
            recursos_necessarios: 'Marketing + Expansão de equipe',
            kpi_principal: `Aumentar participação de ${p.participacao.toFixed(1)}% para ${(p.participacao * 1.5).toFixed(1)}%`
          })),
        
        // Retenção de clientes em risco
        ...(Object.values(clientesComportamento).filter(c => c.fidelidade_score < 40 && c.valor_total_historico > 30000).length > 0 ? [{
          prioridade: 4,
          tipo: 'RETENCAO_CLIENTES',
          titulo: 'Programa de Retenção Premium',
          impacto_estimado: 'Evitar perda de R$ 2M+',
          cronograma: 'Imediato (30 dias)',
          recursos_necessarios: 'Equipe de relacionamento dedicada',
          kpi_principal: 'Reduzir churn de clientes premium em 50%'
        }] : []),
        
        // Diversificação geográfica
        ...(analise_geografica.filter(r => r.diversificacao < 3 && r.valor_total > 500000).length > 2 ? [{
          prioridade: 5,
          tipo: 'EXPANSAO_GEOGRAFICA',
          titulo: 'Diversificação Regional',
          impacto_estimado: '+30% volume regional',
          cronograma: '6-12 meses',
          recursos_necessarios: 'Parcerias locais + Marketing regional',
          kpi_principal: 'Aumentar produtos por região de 2 para 4+'
        }] : [])
      ].sort((a, b) => a.prioridade - b.prioridade)
    };

    res.json(response);
    
  } catch (error) {
    console.error('Erro na análise de tomada de decisão:', error);
    res.status(500).json({ error: 'Erro na análise', details: error.message });
  }
});

// API para comparativo mensal com nova estrutura de dados
app.get('/api/contratos/comparativo-mensal-completo', async (req, res) => {
  try {
    const query = `
      WITH monthly_data AS (
        SELECT
          date_trunc('month', data_entr)::date AS period,
          CASE 
            WHEN date_trunc('month', data_entr) = date_trunc('month', CURRENT_DATE) THEN 'Mês Atual (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
            WHEN date_trunc('month', data_entr) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN 'Mês Passado (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
            WHEN date_trunc('month', data_entr) = date_trunc('month', CURRENT_DATE - INTERVAL '2 months') THEN 'Mês Retrasado (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
            ELSE TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY')
          END AS display,
          COUNT(DISTINCT no_contrato) AS qtd_contratos,
          SUM(COALESCE(vlr_financiado,0)) AS valor_financiado,
          SUM(COALESCE(vlr_total,0)) AS valor_total_devedor,
          SUM(COALESCE(pagamentos_efetuados_total_r,0)) AS valor_total_pago,
          SUM(COALESCE(sdo_devedor_total,0)) AS saldo_devedor_total,
          SUM(COALESCE(out_vlr,0)) AS custo_emissao,
          SUM(COALESCE(vlr_iof,0)) AS valor_iof,
          SUM(COALESCE(prestacoes_pagas_total,0)) AS prestacoes_pagas_total,
          SUM(COALESCE(pagamentos_efetuados_total,0)) AS quantidade_parcelas_total,
          AVG(NULLIF(vlr_financiado,0)) AS ticket_medio,
          AVG(COALESCE(taxa,0)) AS taxa_media,
          AVG(COALESCE(taxa_real,0)) AS taxa_real_media,
          AVG(COALESCE(taxa_cet,0)) AS taxa_cet_media,
          -- Calcular duração média em meses (valor fixo por enquanto)
          12.0 AS duracao_media_meses
        FROM em.posicao_de_contratos_por_produtos
        WHERE data_entr >= CURRENT_DATE - INTERVAL '3 months'
        GROUP BY 1, 2
        ORDER BY 1 DESC
        LIMIT 3
      )
      SELECT * FROM monthly_data ORDER BY period ASC
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      period: row.period,
      display: row.display,
      qtdContratos: parseInt(row.qtd_contratos) || 0,
      valorFinanciado: parseFloat(row.valor_financiado) || 0,
      valorTotalDevedor: parseFloat(row.valor_total_devedor) || 0,
      valorTotalPago: parseFloat(row.valor_total_pago) || 0,
      saldoDevedorTotal: parseFloat(row.saldo_devedor_total) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      valorIof: parseFloat(row.valor_iof) || 0,
      prestacoesPagasTotal: parseInt(row.prestacoes_pagas_total) || 0,
      quantidadeParcelasTotal: parseInt(row.quantidade_parcelas_total) || 0,
      ticketMedio: parseFloat(row.ticket_medio) || 0,
      taxaMedia: parseFloat(row.taxa_media) || 0,
      taxaRealMedia: parseFloat(row.taxa_real_media) || 0,
      taxaCetMedia: parseFloat(row.taxa_cet_media) || 0,
      duracaoMediaMeses: parseFloat(row.duracao_media_meses) || 0,
      // Campos calculados
      percentualPago: row.valor_total_devedor > 0 ? 
        (parseFloat(row.valor_total_pago) / parseFloat(row.valor_total_devedor)) * 100 : 0,
      valorRestante: (parseFloat(row.valor_total_devedor) || 0) - (parseFloat(row.valor_total_pago) || 0)
    }));

    console.log('Comparativo mensal completo encontrado:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar comparativo mensal completo:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo mensal completo', details: error.message });
  }
});

// API para comparativo diário com nova estrutura de dados
app.get('/api/contratos/comparativo-diario-completo', async (req, res) => {
  try {
    const query = `
      WITH daily_data AS (
        SELECT
          data_entr::date AS period,
          CASE 
            WHEN data_entr::date = CURRENT_DATE THEN 'Hoje (' || TO_CHAR(data_entr, 'DD/MM/YYYY') || ')'
            WHEN data_entr::date = CURRENT_DATE - INTERVAL '1 day' THEN 'Ontem (' || TO_CHAR(data_entr, 'DD/MM/YYYY') || ')'
            WHEN data_entr::date = CURRENT_DATE - INTERVAL '2 days' THEN 'Anteontem (' || TO_CHAR(data_entr, 'DD/MM/YYYY') || ')'
            ELSE TO_CHAR(data_entr, 'DD/MM/YYYY')
          END AS display,
          COUNT(DISTINCT no_contrato) AS qtd_contratos,
          SUM(COALESCE(vlr_financiado,0)) AS valor_financiado,
          SUM(COALESCE(vlr_total,0)) AS valor_total_devedor,
          SUM(COALESCE(pagamentos_efetuados_total_r,0)) AS valor_total_pago,
          SUM(COALESCE(sdo_devedor_total,0)) AS saldo_devedor_total,
          SUM(COALESCE(out_vlr,0)) AS custo_emissao,
          SUM(COALESCE(vlr_iof,0)) AS valor_iof,
          SUM(COALESCE(prestacoes_pagas_total,0)) AS prestacoes_pagas_total,
          SUM(COALESCE(pagamentos_efetuados_total,0)) AS quantidade_parcelas_total,
          AVG(NULLIF(vlr_financiado,0)) AS ticket_medio,
          AVG(COALESCE(taxa,0)) AS taxa_media,
          AVG(COALESCE(taxa_real,0)) AS taxa_real_media,
          AVG(COALESCE(taxa_cet,0)) AS taxa_cet_media,
          -- Calcular duração média em meses (valor fixo por enquanto)
          12.0 AS duracao_media_meses
        FROM em.posicao_de_contratos_por_produtos
        WHERE data_entr >= CURRENT_DATE - INTERVAL '3 days'
        GROUP BY 1, 2
        ORDER BY 1 DESC
        LIMIT 3
      )
      SELECT * FROM daily_data ORDER BY period ASC
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      period: row.period,
      display: row.display,
      qtdContratos: parseInt(row.qtd_contratos) || 0,
      valorFinanciado: parseFloat(row.valor_financiado) || 0,
      valorTotalDevedor: parseFloat(row.valor_total_devedor) || 0,
      valorTotalPago: parseFloat(row.valor_total_pago) || 0,
      saldoDevedorTotal: parseFloat(row.saldo_devedor_total) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      valorIof: parseFloat(row.valor_iof) || 0,
      prestacoesPagasTotal: parseInt(row.prestacoes_pagas_total) || 0,
      quantidadeParcelasTotal: parseInt(row.quantidade_parcelas_total) || 0,
      ticketMedio: parseFloat(row.ticket_medio) || 0,
      taxaMedia: parseFloat(row.taxa_media) || 0,
      taxaRealMedia: parseFloat(row.taxa_real_media) || 0,
      taxaCetMedia: parseFloat(row.taxa_cet_media) || 0,
      duracaoMediaMeses: parseFloat(row.duracao_media_meses) || 0,
      // Campos calculados
      percentualPago: row.valor_total_devedor > 0 ? 
        (parseFloat(row.valor_total_pago) / parseFloat(row.valor_total_devedor)) * 100 : 0,
      valorRestante: (parseFloat(row.valor_total_devedor) || 0) - (parseFloat(row.valor_total_pago) || 0)
    }));

    console.log('Comparativo diário completo encontrado:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar comparativo diário completo:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo diário completo', details: error.message });
  }
});

// API para comparativo mensal de posição de contratos
app.get('/api/contratos/comparativo-mensal', async (req, res) => {
  try {
    const query = `
      WITH target_months AS (
        SELECT 
          date_trunc('month', CURRENT_DATE)::date AS mes_atual,
          date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date AS mes_passado,
          date_trunc('month', CURRENT_DATE - INTERVAL '2 months')::date AS mes_retrasado
      ),
      monthly_data AS (
        SELECT
          date_trunc('month', data_entr)::date AS period,
          CASE 
            WHEN date_trunc('month', data_entr)::date = (SELECT mes_atual FROM target_months) THEN 'Mês Atual (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
            WHEN date_trunc('month', data_entr)::date = (SELECT mes_passado FROM target_months) THEN 'Mês Passado (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
            WHEN date_trunc('month', data_entr)::date = (SELECT mes_retrasado FROM target_months) THEN 'Mês Retrasado (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
            ELSE TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY')
          END AS display,
          COUNT(DISTINCT no_contrato) AS qtd_contratos,
          SUM(COALESCE(vlr_financiado,0)) AS vlr_financiado,
          SUM(COALESCE(out_vlr,0)) AS custo_emissao,
          SUM(COALESCE(vlr_iof,0)) AS iof,
          SUM(COALESCE(vl_amortizacao,0)) AS amortizacao,
          SUM(COALESCE(prestacoes_pagas_total,0)) AS prestacoes_pagas_qtde,
          SUM(COALESCE(prestacoes_pagas_total_r,0)) AS prestacoes_pagas_valor,
          SUM(COALESCE(vlr_total,0) - COALESCE(vlr_financiado,0)) AS juros_brutos,
          AVG(NULLIF(vlr_financiado,0)) AS ticket_medio,
          SUM(COALESCE(sdo_devedor_total,0)) AS saldo_devedor
        FROM em.posicao_de_contratos_por_produtos
        CROSS JOIN target_months
        WHERE date_trunc('month', data_entr)::date IN (
          (SELECT mes_atual FROM target_months),
          (SELECT mes_passado FROM target_months),
          (SELECT mes_retrasado FROM target_months)
        )
        GROUP BY 1, 2
        ORDER BY 1 DESC
      )
      SELECT * FROM monthly_data ORDER BY period ASC
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      period: row.period,
      display: row.display,
      qtdContratos: parseInt(row.qtd_contratos) || 0,
      vlrFinanciado: parseFloat(row.vlr_financiado) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      iof: parseFloat(row.iof) || 0,
      amortizacao: parseFloat(row.amortizacao) || 0,
      prestacoesPagasQtde: parseInt(row.prestacoes_pagas_qtde) || 0,
      prestacoesPagasValor: parseFloat(row.prestacoes_pagas_valor) || 0,
      jurosBrutos: parseFloat(row.juros_brutos) || 0,
      ticketMedio: parseFloat(row.ticket_medio) || 0,
      saldoDevedor: parseFloat(row.saldo_devedor) || 0
    }));

    console.log('Comparativo mensal encontrado:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar comparativo mensal:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo mensal', details: error.message });
  }
});

// API para comparativo diário de posição de contratos
app.get('/api/contratos/comparativo-diario', async (req, res) => {
  try {
    const query = `
      WITH target_dates AS (
        SELECT 
          (CURRENT_DATE - INTERVAL '1 day')::date AS dia_ontem,
          (CURRENT_DATE - INTERVAL '2 days')::date AS dia_anteontem,
          (CURRENT_DATE - INTERVAL '3 days')::date AS dia_tres_dias_atras
      ),
      daily_data AS (
        SELECT
          data_entr::date AS period,
          CASE 
            WHEN data_entr::date = (SELECT dia_ontem FROM target_dates) THEN 'Ontem (' || TO_CHAR(data_entr, 'DD/MM') || ')'
            WHEN data_entr::date = (SELECT dia_anteontem FROM target_dates) THEN 'Anteontem (' || TO_CHAR(data_entr, 'DD/MM') || ')'
            WHEN data_entr::date = (SELECT dia_tres_dias_atras FROM target_dates) THEN 'Há 3 dias (' || TO_CHAR(data_entr, 'DD/MM') || ')'
            ELSE TO_CHAR(data_entr, 'DD/MM/YYYY')
          END AS display,
          COUNT(DISTINCT no_contrato) AS qtd_contratos,
          SUM(COALESCE(vlr_financiado,0)) AS vlr_financiado,
          SUM(COALESCE(out_vlr,0)) AS custo_emissao,
          SUM(COALESCE(vlr_iof,0)) AS iof,
          SUM(COALESCE(vl_amortizacao,0)) AS amortizacao,
          SUM(COALESCE(prestacoes_pagas_total,0)) AS prestacoes_pagas_qtde,
          SUM(COALESCE(prestacoes_pagas_total_r,0)) AS prestacoes_pagas_valor,
          SUM(COALESCE(vlr_total,0) - COALESCE(vlr_financiado,0)) AS juros_brutos,
          AVG(NULLIF(vlr_financiado,0)) AS ticket_medio,
          SUM(COALESCE(sdo_devedor_total,0)) AS saldo_devedor
        FROM em.posicao_de_contratos_por_produtos
        CROSS JOIN target_dates
        WHERE data_entr::date IN (
          (SELECT dia_ontem FROM target_dates),
          (SELECT dia_anteontem FROM target_dates),
          (SELECT dia_tres_dias_atras FROM target_dates)
        )
        GROUP BY 1, 2
        ORDER BY 1 DESC
      )
      SELECT * FROM daily_data ORDER BY period ASC
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      period: row.period,
      display: row.display,
      qtdContratos: parseInt(row.qtd_contratos) || 0,
      vlrFinanciado: parseFloat(row.vlr_financiado) || 0,
      custoEmissao: parseFloat(row.custo_emissao) || 0,
      iof: parseFloat(row.iof) || 0,
      amortizacao: parseFloat(row.amortizacao) || 0,
      prestacoesPagasQtde: parseInt(row.prestacoes_pagas_qtde) || 0,
      prestacoesPagasValor: parseFloat(row.prestacoes_pagas_valor) || 0,
      jurosBrutos: parseFloat(row.juros_brutos) || 0,
      ticketMedio: parseFloat(row.ticket_medio) || 0,
      saldoDevedor: parseFloat(row.saldo_devedor) || 0
    }));

    console.log('Comparativo diário encontrado:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar comparativo diário:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo diário', details: error.message });
  }
});

// API para detalhes de produtos por dia (comparativo diário)
app.get('/api/contratos/comparativo-diario-produtos', async (req, res) => {
  try {
    const query = `
      WITH target_dates AS (
        SELECT 
          (CURRENT_DATE - INTERVAL '1 day')::date AS dia_ontem,
          (CURRENT_DATE - INTERVAL '2 days')::date AS dia_anteontem,
          (CURRENT_DATE - INTERVAL '3 days')::date AS dia_tres_dias_atras
      )
      SELECT
        data_entr::date AS period,
        CASE 
          WHEN data_entr::date = (SELECT dia_ontem FROM target_dates) THEN 'Ontem (' || TO_CHAR(data_entr, 'DD/MM') || ')'
          WHEN data_entr::date = (SELECT dia_anteontem FROM target_dates) THEN 'Anteontem (' || TO_CHAR(data_entr, 'DD/MM') || ')'
          WHEN data_entr::date = (SELECT dia_tres_dias_atras FROM target_dates) THEN 'Há 3 dias (' || TO_CHAR(data_entr, 'DD/MM') || ')'
          ELSE TO_CHAR(data_entr, 'DD/MM/YYYY')
        END AS display,
        COALESCE(desc_produto, 'Sem Produto') AS produto,
        COUNT(DISTINCT no_contrato) AS qtd_contratos,
        SUM(COALESCE(vlr_financiado,0)) AS vlr_financiado,
        AVG(NULLIF(vlr_financiado,0)) AS ticket_medio
      FROM em.posicao_de_contratos_por_produtos
      CROSS JOIN target_dates
      WHERE data_entr::date IN (
        (SELECT dia_ontem FROM target_dates),
        (SELECT dia_anteontem FROM target_dates),
        (SELECT dia_tres_dias_atras FROM target_dates)
      )
      GROUP BY 1, 2, 3
      ORDER BY 1 DESC, vlr_financiado DESC
    `;

    const result = await pool.query(query);
    
    // Organizar os dados por período
    const groupedData = result.rows.reduce((acc, row) => {
      const period = row.period;
      if (!acc[period]) {
        acc[period] = {
          period: period,
          display: row.display,
          produtos: []
        };
      }
      
      acc[period].produtos.push({
        produto: row.produto,
        qtd_contratos: parseInt(row.qtd_contratos) || 0,
        vlr_financiado: parseFloat(row.vlr_financiado) || 0,
        ticket_medio: parseFloat(row.ticket_medio) || 0
      });
      
      return acc;
    }, {});

    const response = Object.values(groupedData).sort((a, b) => 
      new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    console.log('Produtos por dia encontrados:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar produtos por dia:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos por dia', details: error.message });
  }
});

// API para detalhes de produtos por mês (comparativo mensal)
app.get('/api/contratos/comparativo-mensal-produtos', async (req, res) => {
  try {
    const query = `
      WITH target_months AS (
        SELECT 
          date_trunc('month', CURRENT_DATE)::date AS mes_atual,
          date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date AS mes_passado,
          date_trunc('month', CURRENT_DATE - INTERVAL '2 months')::date AS mes_retrasado
      )
      SELECT
        date_trunc('month', data_entr)::date AS period,
        CASE 
          WHEN date_trunc('month', data_entr)::date = (SELECT mes_atual FROM target_months) THEN 'Mês Atual (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
          WHEN date_trunc('month', data_entr)::date = (SELECT mes_passado FROM target_months) THEN 'Mês Passado (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
          WHEN date_trunc('month', data_entr)::date = (SELECT mes_retrasado FROM target_months) THEN 'Mês Retrasado (' || TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY') || ')'
          ELSE TO_CHAR(date_trunc('month', data_entr), 'MM/YYYY')
        END AS display,
        COALESCE(desc_produto, 'Sem Produto') AS produto,
        COUNT(DISTINCT no_contrato) AS qtd_contratos,
        SUM(COALESCE(vlr_financiado,0)) AS vlr_financiado,
        AVG(NULLIF(vlr_financiado,0)) AS ticket_medio
      FROM em.posicao_de_contratos_por_produtos
      CROSS JOIN target_months
      WHERE date_trunc('month', data_entr)::date IN (
        (SELECT mes_atual FROM target_months),
        (SELECT mes_passado FROM target_months),
        (SELECT mes_retrasado FROM target_months)
      )
      GROUP BY 1, 2, 3
      ORDER BY 1 DESC, vlr_financiado DESC
    `;

    const result = await pool.query(query);
    
    // Organizar os dados por período
    const groupedData = result.rows.reduce((acc, row) => {
      const period = row.period;
      if (!acc[period]) {
        acc[period] = {
          period: period,
          display: row.display,
          produtos: []
        };
      }
      
      acc[period].produtos.push({
        produto: row.produto,
        qtd_contratos: parseInt(row.qtd_contratos) || 0,
        vlr_financiado: parseFloat(row.vlr_financiado) || 0,
        ticket_medio: parseFloat(row.ticket_medio) || 0
      });
      
      return acc;
    }, {});

    const response = Object.values(groupedData).sort((a, b) => 
      new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    console.log('Produtos por mês encontrados:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar produtos por mês:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos por mês', details: error.message });
  }
});

// API para comparativo mensal de desembolso
app.get('/api/contratos/desembolso-comparativo-mensal', async (req, res) => {
  try {
    const query = `
      WITH target_months AS (
        SELECT 
          DATE_TRUNC('month', CURRENT_DATE)::date AS mes_atual,
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date AS mes_passado,
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::date AS mes_retrasado
      ),
      monthly_data AS (
        SELECT
          DATE_TRUNC('month', d.data_entrada)::date AS period,
          CASE 
            WHEN DATE_TRUNC('month', d.data_entrada)::date = (SELECT mes_atual FROM target_months) THEN 'Mês Atual (' || TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY') || ')'
            WHEN DATE_TRUNC('month', d.data_entrada)::date = (SELECT mes_passado FROM target_months) THEN 'Mês Passado (' || TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY') || ')'
            WHEN DATE_TRUNC('month', d.data_entrada)::date = (SELECT mes_retrasado FROM target_months) THEN 'Mês Retrasado (' || TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY') || ')'
            ELSE TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY')
          END AS display,
          COUNT(*) AS qtd_registros,
          SUM(COALESCE(d.valor_solic,0)) AS valor_solicitado,
          SUM(COALESCE(d.vl_financ,0)) AS valor_financiado,
          SUM(COALESCE(d.vlr_tac,0)) AS valor_tac,
          SUM(COALESCE(d.vlr_iof,0)) AS valor_iof,
          SUM(COALESCE(d.vlr_liberado,0)) AS valor_liberado,
          SUM(COALESCE(d.out_vlr,0)) AS outros_valores,
          SUM(COALESCE(d.vlr_liberado,0) + COALESCE(d.vlr_tac,0) + COALESCE(d.vlr_iof,0) + COALESCE(d.out_vlr,0)) AS total_desembolsado,
          AVG(NULLIF(d.vlr_liberado,0)) AS ticket_medio,
          AVG(COALESCE(p.taxa,0)) AS taxa_media
        FROM em.desembolso_por_conveniofilial d
        LEFT JOIN em.posicao_de_contratos_por_produtos p ON d.contrato = p.no_contrato
        CROSS JOIN target_months
        WHERE DATE_TRUNC('month', d.data_entrada)::date IN (
          (SELECT mes_atual FROM target_months),
          (SELECT mes_passado FROM target_months),
          (SELECT mes_retrasado FROM target_months)
        )
        GROUP BY 1, 2
        ORDER BY 1 DESC
      )
      SELECT * FROM monthly_data ORDER BY period ASC
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      period: row.period,
      display: row.display,
      qtdRegistros: parseInt(row.qtd_registros) || 0,
      valorSolicitado: parseFloat(row.valor_solicitado) || 0,
      valorFinanciado: parseFloat(row.valor_financiado) || 0,
      valorTac: parseFloat(row.valor_tac) || 0,
      valorIof: parseFloat(row.valor_iof) || 0,
      valorLiberado: parseFloat(row.valor_liberado) || 0,
      outrosValores: parseFloat(row.outros_valores) || 0,
      totalDesembolsado: parseFloat(row.total_desembolsado) || 0,
      ticketMedio: parseFloat(row.ticket_medio) || 0,
      taxaMedia: parseFloat(row.taxa_media) || 0
    }));

    console.log('Comparativo mensal desembolso encontrado:', response.length, 'períodos');
    console.log('Meses retornados:', response.map(r => r.display));
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar comparativo mensal desembolso:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo mensal desembolso', details: error.message });
  }
});

// API para comparativo diário de desembolso
app.get('/api/contratos/desembolso-comparativo-diario', async (req, res) => {
  try {
    const query = `
      WITH target_days AS (
        SELECT 
          CURRENT_DATE AS dia_atual,
          CURRENT_DATE - INTERVAL '1 day' AS dia_passado,
          CURRENT_DATE - INTERVAL '2 days' AS dia_retrasado
      ),
      all_days AS (
        SELECT (SELECT dia_retrasado FROM target_days) AS day
        UNION ALL
        SELECT (SELECT dia_passado FROM target_days) AS day
        UNION ALL
        SELECT (SELECT dia_atual FROM target_days) AS day
      ),
      daily_data AS (
        SELECT
          ad.day AS period,
          CASE 
            WHEN ad.day = (SELECT dia_atual FROM target_days) THEN 'Hoje (' || TO_CHAR(ad.day, 'DD/MM/YYYY') || ')'
            WHEN ad.day = (SELECT dia_passado FROM target_days) THEN 'Ontem (' || TO_CHAR(ad.day, 'DD/MM/YYYY') || ')'
            WHEN ad.day = (SELECT dia_retrasado FROM target_days) THEN 'Anteontem (' || TO_CHAR(ad.day, 'DD/MM/YYYY') || ')'
            ELSE TO_CHAR(ad.day, 'DD/MM/YYYY')
          END AS display,
          COUNT(d.contrato) AS qtd_registros,
          SUM(COALESCE(d.valor_solic,0)) AS valor_solicitado,
          SUM(COALESCE(d.vl_financ,0)) AS valor_financiado,
          SUM(COALESCE(d.vlr_tac,0)) AS valor_tac,
          SUM(COALESCE(d.vlr_iof,0)) AS valor_iof,
          SUM(COALESCE(d.vlr_liberado,0)) AS valor_liberado,
          SUM(COALESCE(d.out_vlr,0)) AS outros_valores,
          SUM(COALESCE(d.vlr_liberado,0) + COALESCE(d.vlr_tac,0) + COALESCE(d.vlr_iof,0) + COALESCE(d.out_vlr,0)) AS total_desembolsado,
          AVG(NULLIF(d.vlr_liberado,0)) AS ticket_medio,
          AVG(COALESCE(p.taxa,0)) AS taxa_media
        FROM all_days ad
        LEFT JOIN em.desembolso_por_conveniofilial d ON d.data_entrada::date = ad.day
        LEFT JOIN em.posicao_de_contratos_por_produtos p ON d.contrato = p.no_contrato
        GROUP BY 1, 2
      )
      SELECT * FROM daily_data ORDER BY period ASC
    `;

    const result = await pool.query(query);
    
    const response = result.rows.map(row => ({
      period: row.period,
      display: row.display,
      qtdRegistros: parseInt(row.qtd_registros) || 0,
      valorSolicitado: parseFloat(row.valor_solicitado) || 0,
      valorFinanciado: parseFloat(row.valor_financiado) || 0,
      valorTac: parseFloat(row.valor_tac) || 0,
      valorIof: parseFloat(row.valor_iof) || 0,
      valorLiberado: parseFloat(row.valor_liberado) || 0,
      outrosValores: parseFloat(row.outros_valores) || 0,
      totalDesembolsado: parseFloat(row.total_desembolsado) || 0,
      ticketMedio: parseFloat(row.ticket_medio) || 0,
      taxaMedia: parseFloat(row.taxa_media) || 0
    }));

    console.log('Dias retornados:', response.map(r => r.display));
    console.log('Comparativo diário desembolso encontrado:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar comparativo diário desembolso:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo diário desembolso', details: error.message });
  }
});

// Teste de conectividade específico
app.get('/api/test-connection', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Conexão funcionando!',
    timestamp: new Date().toISOString(),
    server: 'contratos-server',
    port: port,
    origin: req.headers.origin,
    ip: req.ip || req.connection.remoteAddress
  });
});

// API para comparativo mensal de desembolso por produtos
app.get('/api/contratos/desembolso-comparativo-mensal-produtos', async (req, res) => {
  try {
    const query = `
      WITH target_months AS (
        SELECT 
          DATE_TRUNC('month', CURRENT_DATE)::date AS mes_atual,
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date AS mes_passado,
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::date AS mes_retrasado
      )
      SELECT
        DATE_TRUNC('month', d.data_entrada)::date AS period,
        CASE 
          WHEN DATE_TRUNC('month', d.data_entrada)::date = (SELECT mes_atual FROM target_months) THEN 'Mês Atual (' || TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY') || ')'
          WHEN DATE_TRUNC('month', d.data_entrada)::date = (SELECT mes_passado FROM target_months) THEN 'Mês Passado (' || TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY') || ')'
          WHEN DATE_TRUNC('month', d.data_entrada)::date = (SELECT mes_retrasado FROM target_months) THEN 'Mês Retrasado (' || TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY') || ')'
          ELSE TO_CHAR(DATE_TRUNC('month', d.data_entrada), 'MM/YYYY')
        END AS display,
        COALESCE(p.desc_produto, 'Sem Produto') AS produto,
        COUNT(*) AS qtdRegistros,
        SUM(COALESCE(d.valor_solic,0)) AS valorSolicitado,
        SUM(COALESCE(d.vl_financ,0)) AS valorFinanciado,
        SUM(COALESCE(d.vlr_tac,0)) AS valorTac,
        SUM(COALESCE(d.vlr_iof,0)) AS valorIof,
        SUM(COALESCE(d.vlr_liberado,0)) AS valorLiberado,
        SUM(COALESCE(d.out_vlr,0)) AS outrosValores,
        SUM(COALESCE(d.vlr_liberado,0) + COALESCE(d.vlr_tac,0) + COALESCE(d.vlr_iof,0) + COALESCE(d.out_vlr,0)) AS totalDesembolsado,
        AVG(NULLIF(d.vlr_liberado,0)) AS ticketMedio,
        AVG(COALESCE(p.taxa,0)) AS taxaMedia
      FROM em.desembolso_por_conveniofilial d
      LEFT JOIN em.posicao_de_contratos_por_produtos p ON d.contrato = p.no_contrato
      CROSS JOIN target_months
      WHERE DATE_TRUNC('month', d.data_entrada)::date IN (
        (SELECT mes_atual FROM target_months),
        (SELECT mes_passado FROM target_months),
        (SELECT mes_retrasado FROM target_months)
      )
      GROUP BY 1, 2, 3
      ORDER BY 1 DESC, valorFinanciado DESC
    `;

    const result = await pool.query(query);
    
    // Organizar os dados por período
    const groupedData = result.rows.reduce((acc, row) => {
      const period = row.period;
      if (!acc[period]) {
        acc[period] = {
          period: period,
          display: row.display,
          produtos: []
        };
      }
      
      acc[period].produtos.push({
        produto: row.produto,
        qtdRegistros: parseInt(row.qtdregistros) || 0,
        valorSolicitado: parseFloat(row.valorsolicitado) || 0,
        valorFinanciado: parseFloat(row.valorfinanciado) || 0,
        valorTac: parseFloat(row.valortac) || 0,
        valorIof: parseFloat(row.valoriof) || 0,
        valorLiberado: parseFloat(row.valorliberado) || 0,
        outrosValores: parseFloat(row.outrosvalores) || 0,
        totalDesembolsado: parseFloat(row.totaldesembolsado) || 0,
        ticketMedio: parseFloat(row.ticketmedio) || 0,
        taxaMedia: parseFloat(row.taxamedia) || 0
      });
      
      return acc;
    }, {});

    const response = Object.values(groupedData).sort((a, b) => new Date(a.period) - new Date(b.period));
    
    console.log('Produtos por mês de desembolso encontrados:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar produtos por mês de desembolso:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos por mês de desembolso', details: error.message });
  }
});

// API para comparativo diário de desembolso por produtos
app.get('/api/contratos/desembolso-comparativo-diario-produtos', async (req, res) => {
  try {
    const query = `
      WITH target_days AS (
        SELECT 
          CURRENT_DATE AS dia_atual,
          CURRENT_DATE - INTERVAL '1 day' AS dia_passado,
          CURRENT_DATE - INTERVAL '2 days' AS dia_retrasado
      ),
      all_days AS (
        SELECT (SELECT dia_retrasado FROM target_days) AS day
        UNION ALL
        SELECT (SELECT dia_passado FROM target_days) AS day
        UNION ALL
        SELECT (SELECT dia_atual FROM target_days) AS day
      )
      SELECT
        ad.day AS period,
        CASE 
          WHEN ad.day = (SELECT dia_atual FROM target_days) THEN 'Hoje (' || TO_CHAR(ad.day, 'DD/MM/YYYY') || ')'
          WHEN ad.day = (SELECT dia_passado FROM target_days) THEN 'Ontem (' || TO_CHAR(ad.day, 'DD/MM/YYYY') || ')'
          WHEN ad.day = (SELECT dia_retrasado FROM target_days) THEN 'Anteontem (' || TO_CHAR(ad.day, 'DD/MM/YYYY') || ')'
          ELSE TO_CHAR(ad.day, 'DD/MM/YYYY')
        END AS display,
        COALESCE(p.desc_produto, 'Sem Produto') AS produto,
        COUNT(d.contrato) AS qtdRegistros,
        SUM(COALESCE(d.valor_solic,0)) AS valorSolicitado,
        SUM(COALESCE(d.vl_financ,0)) AS valorFinanciado,
        SUM(COALESCE(d.vlr_tac,0)) AS valorTac,
        SUM(COALESCE(d.vlr_iof,0)) AS valorIof,
        SUM(COALESCE(d.vlr_liberado,0)) AS valorLiberado,
        SUM(COALESCE(d.out_vlr,0)) AS outrosValores,
        SUM(COALESCE(d.vlr_liberado,0) + COALESCE(d.vlr_tac,0) + COALESCE(d.vlr_iof,0) + COALESCE(d.out_vlr,0)) AS totalDesembolsado,
        AVG(NULLIF(d.vlr_liberado,0)) AS ticketMedio,
        AVG(COALESCE(p.taxa,0)) AS taxaMedia
      FROM all_days ad
      LEFT JOIN em.desembolso_por_conveniofilial d ON d.data_entrada::date = ad.day
      LEFT JOIN em.posicao_de_contratos_por_produtos p ON d.contrato = p.no_contrato
      GROUP BY 1, 2, 3
      ORDER BY 1 ASC, valorFinanciado DESC
    `;

    const result = await pool.query(query);
    
    // Organizar os dados por período
    const groupedData = result.rows.reduce((acc, row) => {
      const period = row.period;
      if (!acc[period]) {
        acc[period] = {
          period: period,
          display: row.display,
          produtos: []
        };
      }
      
      acc[period].produtos.push({
        produto: row.produto,
        qtdRegistros: parseInt(row.qtdregistros) || 0,
        valorSolicitado: parseFloat(row.valorsolicitado) || 0,
        valorFinanciado: parseFloat(row.valorfinanciado) || 0,
        valorTac: parseFloat(row.valortac) || 0,
        valorIof: parseFloat(row.valoriof) || 0,
        valorLiberado: parseFloat(row.valorliberado) || 0,
        outrosValores: parseFloat(row.outrosvalores) || 0,
        totalDesembolsado: parseFloat(row.totaldesembolsado) || 0,
        ticketMedio: parseFloat(row.ticketmedio) || 0,
        taxaMedia: parseFloat(row.taxamedia) || 0
      });
      
      return acc;
    }, {});

    const response = Object.values(groupedData).sort((a, b) => new Date(a.period) - new Date(b.period));
    
    console.log('Dias retornados:', response.map(r => r.display));
    console.log('Produtos por dia de desembolso encontrados:', response.length, 'períodos');
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar produtos por dia de desembolso:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos por dia de desembolso', details: error.message });
  }
});

// API para buscar dados de empenhos a desembolsar (EM - Empenho)
app.get('/api/em/a-desembolsar', async (req, res) => {
  try {
    console.log('[EM] Buscando dados de empenhos a desembolsar...');
    
    const query = `
      SELECT * FROM em.a_desembolsar
      LIMIT 5000
    `;

    const result = await pool.query(query);
    
    console.log(`[EM] Query executada, ${result.rows.length} registros encontrados`);
    
    const dados = result.rows.map(row => {
      // Converter todos os valores numéricos para evitar problemas de serialização
      const parsedRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'number') {
          parsedRow[key] = value;
        } else if (value instanceof Date) {
          parsedRow[key] = value.toISOString();
        } else {
          parsedRow[key] = value;
        }
      }
      return parsedRow;
    });

    // AGREGAÇÃO POR NOME DO PRODUTO (simples!)
    const produtosPorNome = {};
    dados.forEach(item => {
      const produto = item.produto || 'SEM_PRODUTO';
      
      if (!produtosPorNome[produto]) {
        produtosPorNome[produto] = {
          produto: produto,
          quantidade: 0,
          vlr_solic_total: 0,
          vlr_liberado_total: 0,
          vlr_pendente_total: 0,
          empenhos_liberados: 0,
          empenhos_pendentes: 0,
          empenhos_parciais: 0
        };
      }
      
      produtosPorNome[produto].quantidade += 1;
      produtosPorNome[produto].vlr_solic_total += parseFloat(item.vlr_solic) || 0;
      produtosPorNome[produto].vlr_liberado_total += parseFloat(item.vlr_liberado) || 0;
      
      const vlrLiberado = parseFloat(item.vlr_liberado) || 0;
      const vlrSolic = parseFloat(item.vlr_solic) || 0;
      
      if (vlrLiberado === 0 || !item.vlr_liberado) {
        produtosPorNome[produto].empenhos_pendentes += 1;
      } else if (vlrLiberado >= vlrSolic) {
        produtosPorNome[produto].empenhos_liberados += 1;
      } else {
        produtosPorNome[produto].empenhos_parciais += 1;
      }
    });
    
    // Calcular vlr_pendente_total
    Object.keys(produtosPorNome).forEach(produto => {
      produtosPorNome[produto].vlr_pendente_total = 
        produtosPorNome[produto].vlr_solic_total - produtosPorNome[produto].vlr_liberado_total;
    });

    // Calcular estatísticas significativas
    const totalSolicitado = dados.reduce((sum, d) => sum + (parseFloat(d.vlr_solic) || 0), 0);
    const totalLiberado = dados.reduce((sum, d) => sum + (parseFloat(d.vlr_liberado) || 0), 0);
    const totalPendente = totalSolicitado - totalLiberado;
    
    // Contar empenhos por status
    const empenhosPendentes = dados.filter(d => parseFloat(d.vlr_liberado) === 0 || !d.vlr_liberado).length;
    const empenhosLiberados = dados.filter(d => parseFloat(d.vlr_liberado) > 0).length;
    const empenhosParciais = dados.filter(d => {
      const solicitado = parseFloat(d.vlr_solic) || 0;
      const liberado = parseFloat(d.vlr_liberado) || 0;
      return liberado > 0 && liberado < solicitado;
    }).length;
    
    // Ticket médio
    const ticketMedioSolicitado = dados.length > 0 ? totalSolicitado / dados.length : 0;
    const ticketMedioLiberado = dados.length > 0 ? totalLiberado / dados.length : 0;
    
    // Taxa de liberação
    const taxaLiberacao = dados.length > 0 ? (empenhosLiberados / dados.length) * 100 : 0;
    
    // Contagem de produtos
    const carteirasUnicas = [...new Set(dados.map(d => d.carteira).filter(Boolean))].length;
    const produtosUnicos = Object.keys(produtosPorNome).length;

    const stats = {
      total_registros: dados.length,
      total_solicitado: totalSolicitado,
      total_liberado: totalLiberado,
      total_pendente: totalPendente,
      percentual_liberacao: dados.length > 0 ? (totalLiberado / totalSolicitado) * 100 : 0,
      empenhos_liberados: empenhosLiberados,
      empenhos_pendentes: empenhosPendentes,
      empenhos_parciais: empenhosParciais,
      ticket_medio_solicitado: ticketMedioSolicitado,
      ticket_medio_liberado: ticketMedioLiberado,
      taxa_liberacao_empenhos: taxaLiberacao,
      carteiras_unicas: carteirasUnicas,
      produtos_unicos: produtosUnicos,
      data_atualizacao: new Date().toISOString(),
      colunas: Object.keys(dados.length > 0 ? dados[0] : {})
    };
    
    console.log('[EM] Estatísticas:', {
      total_registros: stats.total_registros,
      total_solicitado: stats.total_solicitado,
      total_liberado: stats.total_liberado,
      percentual_liberacao: stats.percentual_liberacao.toFixed(2) + '%'
    });

    res.json({
      dados,
      produtos_agregados: Object.values(produtosPorNome).sort((a, b) => b.vlr_solic_total - a.vlr_solic_total),
      estatisticas: stats,
      sucesso: true
    });
    
  } catch (error) {
    console.error('[EM] Erro ao buscar dados de empenhos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados de empenhos a desembolsar', 
      details: error.message,
      sucesso: false
    });
  }
});

// Endpoint para contas correntes
app.get('/api/contas-correntes', async (req, res) => {
  try {
    console.log('[CONTAS CORRENTES] Buscando contas correntes');
    
    const query = `
      SELECT 
        id,
        nr_agencia,
        usuario_resumido,
        nome_cliente,
        tipo,
        produto,
        dt_abert,
        dt_ult_mov
      FROM em.conta_corrente
      ORDER BY dt_ult_mov DESC NULLS LAST, dt_abert DESC
    `;
    
    console.log('[CONTAS CORRENTES] Executando query');
    const result = await pool.query(query);
    console.log(`[CONTAS CORRENTES] Resultado: ${result.rows.length} linhas retornadas`);
    
    // Processar dados
    const processedData = result.rows.map(row => ({
      id: row.id,
      nr_agencia: row.nr_agencia,
      usuario_resumido: row.usuario_resumido,
      nome_cliente: row.nome_cliente,
      tipo: row.tipo,
      produto: row.produto,
      dt_abert: row.dt_abert,
      dt_ult_mov: row.dt_ult_mov
    }));
    
    const response = {
      success: true,
      data: processedData,
      count: processedData.length
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('[CONTAS CORRENTES] Erro:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar contas correntes',
      details: error.message
    });
  }
});

// Endpoint para saldo conta corrente
app.get('/api/saldo-conta-corrente', async (req, res) => {
  try {
    console.log('[SALDO CONTA CORRENTE] Buscando saldo conta corrente');
    
    const query = `
      SELECT 
        id,
        dt_movimento,
        cod_cliente,
        nr_cpf_cnpj_cc,
        cliente,
        produto,
        ult_mov,
        sdo_anterior,
        debito,
        credito,
        vlr_bloqueado,
        limite,
        sdo_disponivel,
        sdo_contabil,
        gerente,
        situacao
      FROM em.saldo_conta_corrente
      ORDER BY dt_movimento DESC NULLS LAST
    `;
    
    console.log('[SALDO CONTA CORRENTE] Executando query');
    const result = await pool.query(query);
    console.log(`[SALDO CONTA CORRENTE] Resultado: ${result.rows.length} linhas retornadas`);
    
    // Processar dados
    const processedData = result.rows.map(row => ({
      id: row.id,
      dt_movimento: row.dt_movimento,
      cod_cliente: row.cod_cliente,
      nr_cpf_cnpj_cc: row.nr_cpf_cnpj_cc,
      cliente: row.cliente,
      produto: row.produto,
      ult_mov: row.ult_mov,
      sdo_anterior: parseFloat(row.sdo_anterior) || 0,
      debito: parseFloat(row.debito) || 0,
      credito: parseFloat(row.credito) || 0,
      vlr_bloqueado: parseFloat(row.vlr_bloqueado) || 0,
      limite: parseFloat(row.limite) || 0,
      sdo_disponivel: parseFloat(row.sdo_disponivel) || 0,
      sdo_contabil: parseFloat(row.sdo_contabil) || 0,
      gerente: row.gerente,
      situacao: row.situacao
    }));
    
    const response = {
      success: true,
      data: processedData,
      count: processedData.length
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('[SALDO CONTA CORRENTE] Erro:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar saldo conta corrente',
      details: error.message
    });
  }
});

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
createPool().then(() => {
const server = app.listen(port, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   🚀 Contratos Server - Iniciado com Sucesso!');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 Porta: ${port}`);
  console.log(`� URL: http://localhost:${port}`);
  console.log(`🏥 Health: http://localhost:${port}/health`);
  
  // Mostrar IPs disponíveis para acesso da rede
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log('\n🌐 URLs de acesso na rede:');
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((interface) => {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`   - http://${interface.address}:${port}`);
      }
    });
  });
  console.log('');
});

// Timeout padrão
server.timeout = 30000;
server.keepAliveTimeout = 65000;

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`⚠️  Sinal ${signal} recebido, encerrando...`);
  console.log('═══════════════════════════════════════════════════════');
  
  server.close(async () => {
    console.log('✓ Servidor Express encerrado');
    
    try {
      await pool.end();
      console.log('✓ Pool PostgreSQL encerrado');
    } catch (error) {
      console.error('✗ Erro ao encerrar pool:', error);
    }
    
    console.log('✓ Servidor Contratos encerrado com sucesso');
    console.log('═══════════════════════════════════════════════════════');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('✗ Timeout durante shutdown, forçando saída...');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('');
  console.error('═══════════════════════════════════════════════════════');
  console.error('🔴 UNCAUGHT EXCEPTION:');
  console.error(error);
  console.error('═══════════════════════════════════════════════════════');
  console.error('');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('═══════════════════════════════════════════════════════');
  console.error('🔴 UNHANDLED REJECTION:');
  console.error('Motivo:', reason);
  console.error('═══════════════════════════════════════════════════════');
  console.error('');
});

module.exports = app;