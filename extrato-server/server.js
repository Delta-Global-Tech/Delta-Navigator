const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 3001;

// ====== VAULT INTEGRATION (fallback automatico) ======
const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'devtoken';

async function getVaultSecret(path) {
  try {
    const response = await axios.get(
      `${VAULT_ADDR}/v1/${path}`,
      {
        headers: { 'X-Vault-Token': VAULT_TOKEN },
        timeout: 3000,
      }
    );
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

async function initializeDatabase() {
  console.log('[VAULT] Tentando carregar secrets...');
  
  const vaultHost = await getVaultSecret('secret/data/extrato/postgres-host');
  const vaultPort = await getVaultSecret('secret/data/extrato/postgres-port');
  const vaultDb = await getVaultSecret('secret/data/extrato/postgres-db');
  const vaultUser = await getVaultSecret('secret/data/extrato/postgres-user');
  const vaultPassword = await getVaultSecret('secret/data/extrato/postgres-password');
  
  if (vaultHost) dbConfig.host = vaultHost;
  if (vaultPort) dbConfig.port = parseInt(vaultPort);
  if (vaultDb) dbConfig.database = vaultDb;
  if (vaultUser) dbConfig.user = vaultUser;
  if (vaultPassword) dbConfig.password = vaultPassword;
  
  console.log(`[DB] Configuracao final: host=${dbConfig.host} port=${dbConfig.port} database=${dbConfig.database}`);
  console.log('[DB] Pronto para conectar');
}
// ====== FIM VAULT INTEGRATION ======

// Configuração do banco de dados
const dbConfig = {
  host: process.env.POSTGRES_HOST || process.env.HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
  database: process.env.POSTGRES_DATABASE || process.env.DB || process.env.DB_NAME || 'airflow_treynor',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.PASSWORD || process.env.DB_PASSWORD || 'MinhaSenh@123',
  
  // Pool connection settings
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 30000,
  application_name: 'extrato-server'
};

const pool = new Pool(dbConfig);

// Error handling
pool.on('error', (err, client) => {
  console.error('[DB] Erro no pool PostgreSQL:', err);
});

pool.on('connect', () => {
  console.log('[DB] Nova conexão estabelecida');
});

pool.on('remove', () => {
  console.log('[DB] Conexão removida do pool');
});

// Sistema de cache com TTL de 30 segundos
const cache = new Map();
const CACHE_TTL = 30000; // 30 segundos

function getCacheKey(route, params) {
  return `${route}:${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache HIT para ${key}`);
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cache SET para ${key}`);
  
  // Limpar cache expirado periodicamente
  setTimeout(() => {
    if (cache.has(key)) {
      const cached = cache.get(key);
      if (Date.now() - cached.timestamp >= CACHE_TTL) {
        cache.delete(key);
        console.log(`Cache EXPIRED para ${key}`);
      }
    }
  }, CACHE_TTL);
}

// Limpar cache expirado a cada minuto
setInterval(() => {
  for (const [key, value] of cache.entries()) {
    if (Date.now() - value.timestamp >= CACHE_TTL) {
      cache.delete(key);
      console.log(`Cache CLEANUP para ${key}`);
    }
  }
}, 60000);

// Middlewares
app.use(cors({ 
  origin: [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:5173',
    /^http:\/\/192\.168\.\d+\.\d+/,
    /^http:\/\/10\.\d+\.\d+\.\d+/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/
  ], 
  credentials: true 
}));
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'extrato-server'
    });
  } catch (error) {
    console.error('[HEALTH CHECK] Falha:', error.message);
    res.status(503).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      service: 'extrato-server'
    });
  }
});

// Ranking de clientes por saldo
app.get('/api/statement/ranking', async (req, res) => {
  try {
    const { nome, dataInicio, dataFim } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('ranking', { nome, dataInicio, dataFim });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Ranking cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    let query = `
      SELECT 
        da.personal_name AS nome,
        da.personal_document AS documento,
        da.email AS email,
        da.status_description AS status,
        fas.saldo_posterior AS saldo,
        fas.transaction_date
      FROM dim_account da
      INNER JOIN fct_account_statement fas ON da.account_id = fas.account_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (nome) {
      query += ` AND da.personal_name ILIKE $${paramIndex}`;
      params.push(`%${nome}%`);
      paramIndex++;
    }
    
    if (dataInicio && dataFim) {
      // Se uma faixa de data foi fornecida
      if (dataInicio === dataFim) {
        // Se as datas são iguais, busca o último saldo daquela data específica
        query += ` AND fas.transaction_date = (
          SELECT MAX(fas2.transaction_date)
          FROM fct_account_statement fas2
          WHERE fas2.account_id = da.account_id
          AND DATE(fas2.transaction_date) = $${paramIndex}
        )`;
        params.push(dataInicio);
        paramIndex++;
      } else {
        // Se há faixa de datas, busca a transação mais recente no período
        query += ` AND fas.transaction_date = (
          SELECT MAX(fas2.transaction_date)
          FROM fct_account_statement fas2
          WHERE fas2.account_id = da.account_id
          AND DATE(fas2.transaction_date) BETWEEN $${paramIndex} AND $${paramIndex + 1}
        )`;
        params.push(dataInicio);
        params.push(dataFim);
        paramIndex += 2;
      }
    } else if (dataInicio) {
      // Se apenas data início foi fornecida, considera até essa data
      query += ` AND fas.transaction_date = (
        SELECT MAX(fas2.transaction_date)
        FROM fct_account_statement fas2
        WHERE fas2.account_id = da.account_id
        AND fas2.transaction_date <= $${paramIndex}
      )`;
      params.push(dataInicio);
      paramIndex++;
    } else {
      // Comportamento padrão: saldo mais recente
      query += ` AND fas.transaction_date = (
        SELECT MAX(fas2.transaction_date)
        FROM fct_account_statement fas2
        WHERE fas2.account_id = da.account_id
      )`;
    }
    
    query += ` ORDER BY saldo DESC LIMIT 100`;
    const result = await pool.query(query, params);
    
    const response = { clientes: result.rows };
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Ranking cache set: ${cacheKey}`);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking', details: error.message });
  }
});

// Rota de teste
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Conexão com banco de dados OK', 
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro na conexão com o banco' });
  }
});

// Rota de debug para contar clientes
app.get('/api/debug/clientes', async (req, res) => {
  try {
    // Contar total de clientes únicos
    const totalClientes = await pool.query(`
      SELECT COUNT(DISTINCT da.account_id) as total
      FROM dim_account da
    `);
    
    // Contar clientes com transações
    const clientesComTransacoes = await pool.query(`
      SELECT COUNT(DISTINCT da.account_id) as total
      FROM dim_account da
      INNER JOIN fct_account_statement fas ON da.account_id = fas.account_id
    `);
    
    // Contar clientes que apareceriam no ranking (com saldo mais recente)
    const clientesRanking = await pool.query(`
      SELECT COUNT(*) as total
      FROM (
        SELECT DISTINCT da.account_id
        FROM dim_account da
        INNER JOIN fct_account_statement fas ON da.account_id = fas.account_id
        WHERE fas.transaction_date = (
          SELECT MAX(fas2.transaction_date)
          FROM fct_account_statement fas2
          WHERE fas2.account_id = da.account_id
        )
      ) subquery
    `);
    
    res.json({
      totalClientesUnicos: totalClientes.rows[0].total,
      clientesComTransacoes: clientesComTransacoes.rows[0].total,
      clientesNoRanking: clientesRanking.rows[0].total
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar debug', details: error.message });
  }
});

// Rota para contar clientes únicos
app.get('/api/debug/count-clients', async (req, res) => {
  try {
    const totalClients = await pool.query('SELECT COUNT(DISTINCT account_id) as total FROM dim_account');
    const clientsWithTransactions = await pool.query(`
      SELECT COUNT(DISTINCT da.account_id) as total 
      FROM dim_account da
      INNER JOIN fct_account_statement fas ON da.account_id = fas.account_id
    `);
    const clientsWithLatestBalance = await pool.query(`
      SELECT COUNT(*) as total FROM (
        SELECT DISTINCT da.account_id
        FROM dim_account da
        INNER JOIN fct_account_statement fas ON da.account_id = fas.account_id
        WHERE fas.transaction_date = (
          SELECT MAX(fas2.transaction_date)
          FROM fct_account_statement fas2
          WHERE fas2.account_id = da.account_id
        )
      ) as sub
    `);
    
    res.json({
      totalClients: totalClients.rows[0].total,
      clientsWithTransactions: clientsWithTransactions.rows[0].total,
      clientsWithLatestBalance: clientsWithLatestBalance.rows[0].total
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao contar clientes', details: error.message });
  }
});

// Rota para listar schemas
app.get('/api/schemas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    res.json({ 
      schemas: result.rows.map(row => row.schema_name)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar schemas' });
  }
});

// Rota para listar tabelas de um schema
app.get('/api/tables/:schema', async (req, res) => {
  try {
    const { schema } = req.params;
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      ORDER BY table_name
    `, [schema]);
    res.json({ 
      schema,
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tabelas' });
  }
});

// Rota para buscar dados do extrato
app.get('/api/statement', async (req, res) => {
  try {
    const { dataInicio, dataFim, personalDocument } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('statement', { dataInicio, dataFim, personalDocument });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Statement cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    let query = `
      select 
        da.personal_name 
        ,da.personal_document 
        ,da.email 
        ,da.status_description
        ,to_char(fas.transaction_date - INTERVAL '3 hours', 'DD/MM/YYYY HH24:MI:SS') as transaction_date
        ,fas."type"
        ,fas.description
        ,COALESCE(fas.pix_free_description, '') as pix_free_description
        ,fas.amount 
        ,fas.saldo_posterior 
        ,fas.recipients_name as beneficiario
        ,fas.recipients_bank as banco_beneficiario
        ,fas.senders_name as nome_pagador
      from dim_account as da
      inner join fct_account_statement fas
        on da.account_id = fas.account_id
      where 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Filtros opcionais
    if (dataInicio && dataFim) {
      if (dataInicio === dataFim) {
        // Se as datas são iguais, busca transações daquela data específica
        query += ` AND DATE(fas.transaction_date) = TO_DATE($${paramIndex}, 'DD/MM/YYYY')`;
        params.push(dataInicio);
        paramIndex++;
      } else {
        // Se há faixa de datas, usa between
        query += ` AND DATE(fas.transaction_date) BETWEEN TO_DATE($${paramIndex}, 'DD/MM/YYYY') AND TO_DATE($${paramIndex + 1}, 'DD/MM/YYYY')`;
        params.push(dataInicio);
        params.push(dataFim);
        paramIndex += 2;
      }
    } else {
      if (dataInicio) {
        query += ` AND DATE(fas.transaction_date) >= TO_DATE($${paramIndex}, 'DD/MM/YYYY')`;
        params.push(dataInicio);
        paramIndex++;
      }
      
      if (dataFim) {
        query += ` AND DATE(fas.transaction_date) <= TO_DATE($${paramIndex}, 'DD/MM/YYYY')`;
        params.push(dataFim);
        paramIndex++;
      }
    }
    
    if (personalDocument) {
      query += ` AND da.personal_document = $${paramIndex}`;
      params.push(personalDocument);
      paramIndex++;
    }
    
    query += ` ORDER BY fas.transaction_date DESC, fas.amount DESC`;
    
    
    const result = await pool.query(query, params);
    
    const response = {
      success: true,
      data: result.rows,
      count: result.rowCount
    };
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Statement cache set: ${cacheKey}`);
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar dados do extrato',
      details: error.message 
    });
  }
});

// Rota para buscar resumo do extrato
app.get('/api/statement/summary', async (req, res) => {
  try {
    const { dataInicio, dataFim, personalDocument } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('summary', { dataInicio, dataFim, personalDocument });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Summary cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    let query = `
      select 
        COUNT(*) as transaction_count,
        SUM(CASE WHEN fas.amount > 0 THEN fas.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN fas.amount < 0 THEN ABS(fas.amount) ELSE 0 END) as total_debits,
        MAX(fas.saldo_posterior) as current_balance,
        MIN(fas.transaction_date) as start_date,
        MAX(fas.transaction_date) as end_date
      from dim_account as da
      inner join fct_account_statement fas
        on da.account_id = fas.account_id
      where 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (dataInicio && dataFim) {
      if (dataInicio === dataFim) {
        // Se as datas são iguais, busca transações daquela data específica
        query += ` AND DATE(fas.transaction_date) = $${paramIndex}`;
        params.push(dataInicio);
        paramIndex++;
      } else {
        // Se há faixa de datas, usa between
        query += ` AND DATE(fas.transaction_date) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(dataInicio);
        params.push(dataFim);
        paramIndex += 2;
      }
    } else {
      if (dataInicio) {
        query += ` AND DATE(fas.transaction_date) >= $${paramIndex}`;
        params.push(dataInicio);
        paramIndex++;
      }
      
      if (dataFim) {
        query += ` AND DATE(fas.transaction_date) <= $${paramIndex}`;
        params.push(dataFim);
        paramIndex++;
      }
    }
    
    if (personalDocument) {
      query += ` AND da.personal_document = $${paramIndex}`;
      params.push(personalDocument);
      paramIndex++;
    }
    
    const result = await pool.query(query, params);
    const summary = result.rows[0];
    
    const totalCredits = parseFloat(summary.total_credits) || 0;
    const totalDebits = parseFloat(summary.total_debits) || 0;
    const netFlow = totalCredits - totalDebits;
    const currentBalance = parseFloat(summary.current_balance) || 0;
    const previousBalance = currentBalance - netFlow;
    
    const response = {
      success: true,
      summary: {
        totalCredits,
        totalDebits,
        netFlow,
        currentBalance,
        previousBalance,
        transactionCount: parseInt(summary.transaction_count) || 0,
        period: {
          start: summary.start_date,
          end: summary.end_date
        }
      }
    };
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Summary cache set: ${cacheKey}`);
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar resumo do extrato',
      details: error.message 
    });
  }
});

// Endpoint para faturas de cartão de crédito
app.get('/api/faturas', async (req, res) => {
  try {
    const { personalDocument, status } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('faturas', { personalDocument, status });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Faturas cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    let query = `
      SELECT
           da.account_id 
          ,da.personal_name 
          ,da.personal_document 
          ,da.email 
          ,dps.statement_id 
          ,dps.kind 
          ,dps.balance
          ,dps.close_date AS fechamento
          ,dps.payment_due AS vencimento
          ,CASE
           WHEN dps.statement_id = 'CURRENT' THEN 'Em Aberto'
           WHEN dps.status = 'PAID' THEN 'Paga'
           WHEN dps.payment_due >= CURRENT_DATE THEN 'Em Aberto'
           WHEN dps.payment_due < CURRENT_DATE THEN 'Vencida'
           ELSE 'Em Aberto'
           END AS status
      FROM dim_account AS da
      INNER JOIN dim_postpaid_statement dps 
      ON da.account_id = dps.account_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Filtro por documento
    if (personalDocument && personalDocument.trim() !== '') {
      query += ` AND da.personal_document = $${paramCount}`;
      params.push(personalDocument.trim());
      paramCount++;
    }
    
    // Filtro por status
    if (status && status.trim() !== '' && status.toLowerCase() !== 'todos') {
      query += ` AND (
        CASE
         WHEN dps.statement_id = 'CURRENT' THEN 'Em Aberto'
         WHEN dps.status = 'PAID' THEN 'Paga'
         WHEN dps.payment_due >= CURRENT_DATE THEN 'Em Aberto'
         WHEN dps.payment_due < CURRENT_DATE THEN 'Vencida'
         ELSE 'Em Aberto'
         END
      ) ILIKE $${paramCount}`;
      params.push(`%${status}%`);
      paramCount++;
    }
    
    // Ordenar por data de vencimento (mais recentes primeiro)
    query += ` ORDER BY dps.payment_due DESC, da.personal_name ASC`;
    
    
    const result = await pool.query(query, params);
    
    // Processar dados para garantir tipos corretos
    const processedData = result.rows.map(row => ({
      ...row,
      balance: parseFloat(row.balance) || 0,
      fechamento: row.fechamento ? row.fechamento : null,
      vencimento: row.vencimento ? row.vencimento : null
    }));
    
    const response = {
      data: processedData,
      count: processedData.length,
      query: {
        personalDocument,
        status
      }
    };
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Faturas cache set: ${cacheKey}`);
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar faturas',
      details: error.message 
    });
  }
});

// Endpoint para extrato de cartão de crédito
app.get('/api/extrato-cartao-credito', async (req, res) => {
  try {
    const { personalDocument, dataInicio, dataFim } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('extrato-cartao-credito', { personalDocument, dataInicio, dataFim });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Extrato cartão de crédito cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    let query = `
      SELECT
        da.personal_name AS nome,
        da.personal_document AS cpf_cnpj,
        fpt.kind AS aberta_ou_fechada,
        to_char(fpt.tx_date, 'DD/MM/YYYY') AS data_trasacao,
        fpt.description AS descricao,
        fpt.amount AS valor,
        fals.credit_limit AS limite_cartao,
        fpt.debit_or_credit AS debito_ou_credito,
        to_char(fpt.close_date, 'DD/MM/YYYY') AS data_fechamento,
        to_char(fpt.payment_due, 'DD/MM/YYYY') AS data_pagamento
      FROM dim_account da 
      INNER JOIN fct_postpaid_tx fpt 
        ON da.account_id = fpt.account_id
      JOIN fact_account_limit_snapshot fals
        ON da.account_id = fals.account_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Filtro por documento
    if (personalDocument && personalDocument.trim() !== '') {
      query += ` AND da.personal_document = $${paramCount}`;
      params.push(personalDocument.trim());
      paramCount++;
    }
    
    // Filtro por data de transação
    if (dataInicio && dataFim) {
      if (dataInicio === dataFim) {
        // Se as datas são iguais, busca transações daquela data específica
        query += ` AND DATE(fpt.tx_date) = TO_DATE($${paramCount}, 'DD/MM/YYYY')`;
        params.push(dataInicio);
        paramCount++;
      } else {
        // Se há faixa de datas, usa between
        query += ` AND DATE(fpt.tx_date) BETWEEN TO_DATE($${paramCount}, 'DD/MM/YYYY') AND TO_DATE($${paramCount + 1}, 'DD/MM/YYYY')`;
        params.push(dataInicio);
        params.push(dataFim);
        paramCount += 2;
      }
    } else {
      if (dataInicio) {
        query += ` AND DATE(fpt.tx_date) >= TO_DATE($${paramCount}, 'DD/MM/YYYY')`;
        params.push(dataInicio);
        paramCount++;
      }
      
      if (dataFim) {
        query += ` AND DATE(fpt.tx_date) <= TO_DATE($${paramCount}, 'DD/MM/YYYY')`;
        params.push(dataFim);
        paramCount++;
      }
    }
    
    // Ordenar por data de transação (mais recentes primeiro) e depois por valor
    query += ` ORDER BY fpt.tx_date DESC, fpt.amount DESC`;
    
    const result = await pool.query(query, params);
    
    // Processar dados para garantir tipos corretos
    const processedData = result.rows.map(row => ({
      ...row,
      valor: parseFloat(row.valor) || 0
    }));
    
    const response = {
      success: true,
      data: processedData,
      count: processedData.length,
      query: {
        personalDocument: personalDocument || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined
      }
    };
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Extrato cartão de crédito cache set: ${cacheKey}`);
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar extrato de cartão de crédito',
      details: error.message 
    });
  }
});

// Endpoint para propostas de abertura
app.get('/api/propostas-abertura', async (req, res) => {
  try {
    console.log('Buscando propostas de abertura');
    
    const cacheKey = getCacheKey('propostas-abertura', {});
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      console.log('Retornando dados do cache para propostas de abertura');
      return res.json(cachedResult);
    }

    // Primeiro, buscar o total de propostas com COUNT
    const countQuery = `
      SELECT COUNT(dp.proposal_id) as total_propostas
      FROM dim_proposal dp
    `;
    
    const countResult = await pool.query(countQuery);
    const totalPropostas = parseInt(countResult.rows[0].total_propostas) || 0;

    // Depois, buscar os dados das propostas para a tabela
    const query = `
      select 
          dp.proposal_id,
          dp.document,
          dp.applicant_name,
          dp.proposed_at,
          dps.status_desc,
          da.status_description 
      from dim_proposal dp
      left join dim_proposal_status dps 
      on dp.status_code = dps.status_code
      left join dim_account da 
      on dp."document" = da.personal_document
      ORDER BY dp.proposed_at DESC
    `;

    const result = await pool.query(query);
    const propostas = result.rows;

    // Calcular estatísticas
    const stats = {
      total: totalPropostas, // Usar o COUNT do banco ao invés do length do array
      aprovadas_automaticamente: propostas.filter(p => p.status_desc && p.status_desc.toLowerCase().includes('aprovada automaticamente')).length,
      aprovadas_manualmente: propostas.filter(p => p.status_desc && p.status_desc.toLowerCase().includes('aprovada manualmente')).length,
      reprovadas_manualmente: propostas.filter(p => p.status_desc && p.status_desc.toLowerCase().includes('reprovada')).length,
      aguardando_analise_manual: propostas.filter(p => p.status_desc && (p.status_desc.toLowerCase().includes('aguardando') || p.status_desc.toLowerCase().includes('análise'))).length,
      outros: propostas.filter(p => !p.status_desc || (
        !p.status_desc.toLowerCase().includes('aprovada') && 
        !p.status_desc.toLowerCase().includes('reprovada') && 
        !p.status_desc.toLowerCase().includes('aguardando') && 
        !p.status_desc.toLowerCase().includes('análise')
      )).length
    };
    
    stats.total_aprovadas = stats.aprovadas_automaticamente + stats.aprovadas_manualmente;
    stats.total_reprovadas = stats.reprovadas_manualmente;

    const responseData = {
      propostas,
      estatisticas: stats
    };

    setCache(cacheKey, responseData);
    res.json(responseData);
    
  } catch (error) {
    console.error('Erro ao buscar propostas de abertura:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// ============================================
// ENDPOINTS CADASTRAIS - NOVA TELA CADASTRAL V2
// ============================================

// GET /api/cadastral/clientes - Lista clientes cadastrados
app.get('/api/cadastral/clientes', async (req, res) => {
  try {
    const { search, limite = 500 } = req.query;
    
    const cacheKey = getCacheKey('cadastral-clientes', { search, limite });
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    let query = `
      SELECT 
        da.account_id,
        da.personal_name AS nome,
        da.personal_document AS cpf_cnpj,
        da.email,
        da.account_number AS numero_da_conta,
        da.status_description AS status_conta,
        COALESCE(fals.credit_limit, 0) AS credit_limit,
        daa.state AS estado,
        daa.city AS cidade
      FROM dim_account da 
      INNER JOIN dim_account_address daa 
        ON da.account_id = daa.account_id
      LEFT JOIN fact_account_limit_snapshot fals 
        ON da.account_id = fals.account_id
      WHERE da.personal_name IS NOT NULL
    `;

    const params = [];
    let paramIndex = 1;

    // Filtro de busca
    if (search) {
      query += ` AND (
        LOWER(da.personal_name) ILIKE $${paramIndex} OR
        LOWER(da.personal_document) ILIKE $${paramIndex} OR
        LOWER(da.email) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY da.personal_name ASC LIMIT $${paramIndex}`;
    params.push(parseInt(limite));

    const result = await pool.query(query, params);
    
    const responseData = {
      clientes: result.rows,
      total: result.rows.length
    };

    setCache(cacheKey, responseData);
    res.json(responseData);

  } catch (error) {
    console.error('Erro ao buscar clientes cadastrais:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar clientes', 
      details: error.message 
    });
  }
});

// GET /api/cadastral/stats - Estatísticas cadastrais
app.get('/api/cadastral/stats', async (req, res) => {
  try {
    const cacheKey = getCacheKey('cadastral-stats', {});
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Total de clientes
    const totalQuery = `
      SELECT COUNT(DISTINCT da.account_id) as total_clientes
      FROM dim_account da 
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      WHERE da.personal_name IS NOT NULL
    `;
    
    // Clientes ativos (status_description contém 'DESBLOQUEADO' ou 'ATIVO')
    const ativosQuery = `
      SELECT COUNT(DISTINCT da.account_id) as clientes_ativos
      FROM dim_account da 
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      WHERE da.personal_name IS NOT NULL
      AND (LOWER(da.status_description) LIKE '%desbloqueado%' OR LOWER(da.status_description) LIKE '%ativo%')
    `;

    // Clientes inativos = Total - Ativos
    const inativosQuery = `
      SELECT (
        SELECT COUNT(DISTINCT da2.account_id)
        FROM dim_account da2 
        INNER JOIN dim_account_address daa2 ON da2.account_id = daa2.account_id
        WHERE da2.personal_name IS NOT NULL
      ) - (
        SELECT COUNT(DISTINCT da3.account_id)
        FROM dim_account da3 
        INNER JOIN dim_account_address daa3 ON da3.account_id = daa3.account_id
        WHERE da3.personal_name IS NOT NULL
        AND (LOWER(da3.status_description) LIKE '%desbloqueado%' OR LOWER(da3.status_description) LIKE '%ativo%')
      ) as clientes_inativos
    `;

    // Total de crédito liberado
    const creditoTotalQuery = `
      SELECT COALESCE(SUM(fals.credit_limit), 0) as total_credito_liberado
      FROM dim_account da 
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      LEFT JOIN fact_account_limit_snapshot fals ON da.account_id = fals.account_id
      WHERE da.personal_name IS NOT NULL
    `;

    // Crédito médio
    const creditoMedioQuery = `
      SELECT COALESCE(AVG(fals.credit_limit), 0) as credito_medio
      FROM dim_account da 
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      LEFT JOIN fact_account_limit_snapshot fals ON da.account_id = fals.account_id
      WHERE da.personal_name IS NOT NULL
      AND fals.credit_limit > 0
    `;

    // Total de estados
    const estadosQuery = `
      SELECT COUNT(DISTINCT daa.state) as total_estados
      FROM dim_account da 
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      WHERE da.personal_name IS NOT NULL
    `;

    // Total de cidades
    const cidadesQuery = `
      SELECT COUNT(DISTINCT CONCAT(daa.state, '-', daa.city)) as total_cidades
      FROM dim_account da 
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      WHERE da.personal_name IS NOT NULL
    `;

    const [totalResult, ativosResult, inativosResult, creditoTotalResult, creditoMedioResult, estadosResult, cidadesResult] = await Promise.all([
      pool.query(totalQuery),
      pool.query(ativosQuery),
      pool.query(inativosQuery),
      pool.query(creditoTotalQuery),
      pool.query(creditoMedioQuery),
      pool.query(estadosQuery),
      pool.query(cidadesQuery)
    ]);

    const responseData = {
      total_clientes: parseInt(totalResult.rows[0]?.total_clientes) || 0,
      clientes_ativos: parseInt(ativosResult.rows[0]?.clientes_ativos) || 0,
      clientes_inativos: parseInt(inativosResult.rows[0]?.clientes_inativos) || 0,
      total_credito_liberado: parseFloat(creditoTotalResult.rows[0]?.total_credito_liberado) || 0,
      credito_medio: parseFloat(creditoMedioResult.rows[0]?.credito_medio) || 0,
      total_estados: parseInt(estadosResult.rows[0]?.total_estados) || 0,
      total_cidades: parseInt(cidadesResult.rows[0]?.total_cidades) || 0
    };

    setCache(cacheKey, responseData);
    res.json(responseData);

  } catch (error) {
    console.error('Erro ao buscar estatísticas cadastrais:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas', 
      details: error.message 
    });
  }
});

// GET /api/cadastral/mapa-cidades - Mapa de cidades por estado
app.get('/api/cadastral/mapa-cidades', async (req, res) => {
  try {
    const cacheKey = getCacheKey('cadastral-mapa-cidades', {});
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const query = `
      SELECT
        daa.state AS estado,
        daa.city AS cidade,
        COUNT(DISTINCT da.account_id) as quantidade_clientes,
        COALESCE(SUM(fals.credit_limit), 0) as total_credito_liberado,
        COALESCE(AVG(fals.credit_limit), 0) as credito_medio
      FROM dim_account da 
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      LEFT JOIN fact_account_limit_snapshot fals ON da.account_id = fals.account_id
      WHERE da.personal_name IS NOT NULL
      GROUP BY daa.state, daa.city
      ORDER BY daa.state ASC, daa.city ASC
    `;

    const result = await pool.query(query);
    
    // Converter para números corretos
    const dados = result.rows.map(row => ({
      estado: row.estado,
      cidade: row.cidade,
      quantidade_clientes: parseInt(row.quantidade_clientes) || 0,
      total_credito_liberado: parseFloat(row.total_credito_liberado) || 0,
      credito_medio: parseFloat(row.credito_medio) || 0
    }));
    
    const responseData = {
      dados,
      total: dados.length
    };

    setCache(cacheKey, responseData);
    res.json(responseData);

  } catch (error) {
    console.error('Erro ao buscar mapa de cidades:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar mapa', 
      details: error.message 
    });
  }
});

// GET /api/cadastral/evolucao-mensal - Evolução mensal de cadastros
app.get('/api/cadastral/evolucao-mensal', async (req, res) => {
  try {
    console.log('[EVOLUCAO-MENSAL] Iniciando busca de evolução mensal');
    
    const cacheKey = getCacheKey('cadastral-evolucao-mensal', {});
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      console.log('[EVOLUCAO-MENSAL] Retornando do cache');
      return res.json(cachedResult);
    }

    // Como dim_account não tem created_at, vamos usar fct_account_statement para agrupar por mês
    // e depois agregamos os dados cadastrais
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', fas.transaction_date), 'YYYY-MM') as mes,
        COUNT(DISTINCT da.account_id) as total_cadastros,
        COALESCE(SUM(fals.credit_limit), 0) as total_credito_liberado,
        COALESCE(AVG(fals.credit_limit), 0) as credito_medio_mes
      FROM fct_account_statement fas
      INNER JOIN dim_account da ON fas.account_id = da.account_id
      INNER JOIN dim_account_address daa ON da.account_id = daa.account_id
      LEFT JOIN fact_account_limit_snapshot fals ON da.account_id = fals.account_id
      WHERE da.personal_name IS NOT NULL
      GROUP BY DATE_TRUNC('month', fas.transaction_date)
      ORDER BY mes DESC
      LIMIT 12
    `;

    console.log('[EVOLUCAO-MENSAL] Executando query do banco de dados');
    const result = await pool.query(query);
    console.log('[EVOLUCAO-MENSAL] Encontrados', result.rows.length, 'meses de evolução');
    
    const dados = result.rows.map(row => ({
      mes: row.mes,
      mes_nome: row.mes || 'Mês',
      total_cadastros: parseInt(row.total_cadastros) || 0,
      total_credito_liberado: parseFloat(row.total_credito_liberado) || 0,
      credito_medio_mes: parseFloat(row.credito_medio_mes) || 0
    })).reverse(); // Reverter para ordem crescente

    const responseData = {
      dados
    };

    console.log('[EVOLUCAO-MENSAL] Retornando', dados.length, 'meses de dados');
    setCache(cacheKey, responseData);
    res.json(responseData);

  } catch (error) {
    console.error('[EVOLUCAO-MENSAL] Erro geral:', error);
    console.error('[EVOLUCAO-MENSAL] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar evolução', 
      details: error.message,
      stack: error.stack
    });
  }
});

// GET /api/cadastral/contratos-por-cpf - Retorna contratos de desembolso para um cliente
app.get('/api/cadastral/contratos-por-cpf', async (req, res) => {
  try {
    const { cpf_cnpj } = req.query;
    
    if (!cpf_cnpj) {
      return res.status(400).json({ error: 'CPF/CNPJ é obrigatório' });
    }

    // Normalizar CPF: remover caracteres especiais e garantir 11 dígitos
    const cpfNormalizado = cpf_cnpj.replace(/\D/g, '');
    const cpfPadronizado = cpfNormalizado.length < 11 
      ? cpfNormalizado.padStart(11, '0') 
      : cpfNormalizado.substring(cpfNormalizado.length - 11);

    console.log('[CONTRATOS-POR-CPF] CPF recebido:', cpf_cnpj);
    console.log('[CONTRATOS-POR-CPF] CPF normalizado:', cpfPadronizado);
    console.log('[CONTRATOS-POR-CPF] Buscando contratos para CPF:', cpfPadronizado);

    const cacheKey = getCacheKey('cadastral-contratos-por-cpf', { cpf_cnpj: cpfPadronizado });
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      console.log('[CONTRATOS-POR-CPF] Retornando do cache');
      return res.json(cachedResult);
    }

    // Query para buscar contatos de desembolso por CPF/CNPJ
    // Usa axios para chamar o contratos-server (port 3004)
    const contratosServerUrl = process.env.CONTRATOS_SERVER_URL || 'http://localhost:3004';
    console.log('[CONTRATOS-POR-CPF] Chamando contratos-server em:', contratosServerUrl);
    
    try {
      // Buscar dados de desembolso
      const desembolsoResponse = await axios.get(`${contratosServerUrl}/api/contratos/desembolso`, {
        params: { cpf_cnpj: cpfPadronizado },
        timeout: 5000
      });
      
      console.log('[CONTRATOS-POR-CPF] Desembolsos encontrados:', desembolsoResponse.data.desembolsos?.length || 0);
      
      const desembolsos = desembolsoResponse.data.desembolsos || [];
      
      // Para cada desembolso, buscar dados de posição pelo número do contrato
      const contratosComPosicao = await Promise.all(
        desembolsos.map(async (desembolso) => {
          try {
            const posicaoResponse = await axios.get(
              `${contratosServerUrl}/api/contratos/posicao-completa`,
              {
                params: { no_contrato: desembolso.contrato },
                timeout: 3000
              }
            );
            
            const posicao = posicaoResponse.data.contratos && posicaoResponse.data.contratos.length > 0 
              ? posicaoResponse.data.contratos[0] 
              : null;

            return {
              ...desembolso,
              posicao: posicao || null
            };
          } catch (error) {
            console.log(`[CONTRATOS-POR-CPF] Posição não encontrada para contrato ${desembolso.contrato}:`, error.message);
            return {
              ...desembolso,
              posicao: null
            };
          }
        })
      );

      const responseData = {
        cpf_cnpj,
        contratos: contratosComPosicao,
        stats: desembolsoResponse.data.stats || {},
        total_contratos: contratosComPosicao.length
      };

      console.log('[CONTRATOS-POR-CPF] Retornando', contratosComPosicao.length, 'contratos com posição');
      setCache(cacheKey, responseData);
      res.json(responseData);
    } catch (axiosError) {
      console.error('[CONTRATOS-POR-CPF] Erro ao chamar contratos-server:', axiosError.message);
      console.error('[CONTRATOS-POR-CPF] Stack:', axiosError.stack);
      res.json({
        cpf_cnpj,
        contratos: [],
        stats: {},
        total_contratos: 0,
        warning: 'Dados de contrato indisponíveis',
        error_details: axiosError.message
      });
    }

  } catch (error) {
    console.error('[CONTRATOS-POR-CPF] Erro geral:', error);
    console.error('[CONTRATOS-POR-CPF] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar contratos', 
      details: error.message,
      stack: error.stack
    });
  }
});

// GET /api/cadastral/clientes-com-contratos - Lista clientes cadastrais com indicador de contratos
app.get('/api/cadastral/clientes-com-contratos', async (req, res) => {
  try {
    const { search, limite = 500 } = req.query;
    
    console.log('[CLIENTES-COM-CONTRATOS] Buscando clientes com contratos');
    
    const cacheKey = getCacheKey('cadastral-clientes-com-contratos', { search, limite });
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      console.log('[CLIENTES-COM-CONTRATOS] Retornando do cache');
      return res.json(cachedResult);
    }

    // Query para buscar clientes cadastrais
    let query = `
      SELECT 
        da.account_id,
        da.personal_name AS nome,
        da.personal_document AS cpf_cnpj,
        da.email,
        da.account_number AS numero_da_conta,
        da.status_description AS status_conta,
        COALESCE(fals.credit_limit, 0) AS credit_limit,
        daa.state AS estado,
        daa.city AS cidade
      FROM dim_account da 
      INNER JOIN dim_account_address daa 
        ON da.account_id = daa.account_id
      LEFT JOIN fact_account_limit_snapshot fals 
        ON da.account_id = fals.account_id
      WHERE da.personal_name IS NOT NULL
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        LOWER(da.personal_name) ILIKE $${paramIndex} OR
        LOWER(da.personal_document) ILIKE $${paramIndex} OR
        LOWER(da.email) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY da.personal_name ASC LIMIT $${paramIndex}`;
    params.push(parseInt(limite));

    const result = await pool.query(query, params);
    console.log('[CLIENTES-COM-CONTRATOS] Encontrados', result.rows.length, 'clientes no DB');
    
    // Para cada cliente, tentar buscar dados de contrato via contratos-server
    const contratosServerUrl = process.env.CONTRATOS_SERVER_URL || 'http://localhost:3004';
    const clientesComContratos = await Promise.all(
      result.rows.map(async (cliente) => {
        try {
          // Normalizar CPF: remover caracteres especiais e garantir 11 dígitos
          const cpfNormalizado = (cliente.cpf_cnpj || '').replace(/\D/g, '');
          const cpfPadronizado = cpfNormalizado.length < 11 
            ? cpfNormalizado.padStart(11, '0') 
            : cpfNormalizado.substring(cpfNormalizado.length - 11);
          
          const contratosResponse = await axios.get(
            `${contratosServerUrl}/api/contratos/desembolso`,
            { 
              params: { cpf_cnpj: cpfPadronizado },
              timeout: 3000
            }
          );
          
          // Extrair produtos únicos (tipo de produto)
          const desembolsos = contratosResponse.data.desembolsos || [];
          const produtosUnicos = [...new Set(desembolsos.map(d => d.descricao || 'Sem tipo').filter(Boolean))];
          
          return {
            ...cliente,
            tem_contratos: desembolsos.length > 0,
            qtd_contratos: desembolsos.length,
            total_contratado: contratosResponse.data.stats?.total_liberado || 0,
            produtos: produtosUnicos,
            desembolsos: desembolsos
          };
        } catch (error) {
          // Se falhar, apenas retorna sem info de contrato
          console.log('[CLIENTES-COM-CONTRATOS] Erro ao buscar contrato para', cliente.cpf_cnpj, ':', error.message);
          return {
            ...cliente,
            tem_contratos: false,
            qtd_contratos: 0,
            total_contratado: 0,
            produtos: [],
            desembolsos: []
          };
        }
      })
    );

    const responseData = {
      clientes: clientesComContratos,
      total: clientesComContratos.length
    };

    console.log('[CLIENTES-COM-CONTRATOS] Retornando', clientesComContratos.length, 'clientes com info de contratos');
    setCache(cacheKey, responseData);
    res.json(responseData);

  } catch (error) {
    console.error('[CLIENTES-COM-CONTRATOS] Erro geral:', error);
    console.error('[CLIENTES-COM-CONTRATOS] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar clientes', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Iniciar servidor
initializeDatabase().then(() => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🚀 Extrato Server - Iniciado com Sucesso!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📍 Porta: ${port}`);
    console.log(`🔗 URL: http://localhost:${port}`);
    console.log(`🏥 Health: http://localhost:${port}/health`);
    console.log('');
  });

  // Timeout padrão
  server.timeout = 30000;
  server.keepAliveTimeout = 65000;
}).catch(error => {
  console.error('Erro ao inicializar banco:', error);
  process.exit(1);
});

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
    
    console.log('✓ Servidor Extrato encerrado com sucesso');
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

// Teste de conexão na inicialização
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('[INIT] Erro na conexão:', err);
  } else {
    console.log('[INIT] PostgreSQL conectado');
  }
});
