const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Configuração do banco de dados
const dbConfig = {
  host: process.env.HOST || process.env.DB_HOST,
  port: process.env.PORT || process.env.DB_PORT || 5432,
  database: process.env.DB || process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.PASSWORD || process.env.DB_PASSWORD,
};


const pool = new Pool(dbConfig);

// Middlewares
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/
  ], 
  credentials: true 
}));
app.use(express.json());
// Ranking de clientes por saldo
app.get('/api/statement/ranking', async (req, res) => {
  try {
    const { nome, dataInicio, dataFim } = req.query;
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
    res.json({ clientes: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking', details: error.message });
  }
});
app.use(express.json());

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
    
    query += ` ORDER BY fas.transaction_date DESC, fas.amount DESC`;
    
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
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
    
    res.json({
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
    });
    
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
    
    
    res.json({
      data: processedData,
      count: processedData.length,
      query: {
        personalDocument,
        status
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar faturas',
      details: error.message 
    });
  }
});

// Iniciar servidor
  app.listen(port, '0.0.0.0', () => {
});

// Teste de conexão na inicialização
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
  } else {
  }
});
