const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3005;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false
}));
app.use(express.json());

// Log de todas as requisicoes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Criar pool de conexoes PostgreSQL (reutilizavel)
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

console.log(`[INFO] Conectando ao PostgreSQL: ${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DB}`);

// Eventos do pool
pool.on('connect', () => {
  console.log('[INFO] Nova conexao estabelecida com PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[ERROR] Erro no pool de conexoes:', err);
});

// Rota de teste de conexao
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    
    res.json({ 
      message: 'Conexao PostgreSQL bem-sucedida!', 
      time: result.rows[0].current_time,
      database: process.env.PG_DB,
      status: 'OK'
    });
  } catch (error) {
    console.error('[ERROR] Erro na conexao PostgreSQL:', error.message);
    res.status(500).json({ 
      error: 'Erro na conexao com PostgreSQL',
      details: error.message,
      status: 'ERROR'
    });
  }
});

/**
 * GET /api/bank-slips
 * Busca boletos bancarios da tabela bank_slips
 */
app.get('/api/bank-slips', async (req, res) => {
  try {
    const query = `
      SELECT 
        cak.client_name,
        p.processor_type,
        bs.amount,
        bs.paid_net_amount,
        bs.fee_amount,
        bs.status,
        bs.paid_at
      FROM client_api_keys cak
      INNER JOIN processors p 
        ON cak.id = p.client_api_key_id
      INNER JOIN bank_slips bs 
        ON bs.processor_id = p.id
      WHERE cak.client_name = 'SAAE - Client Production'
      ORDER BY bs.paid_at DESC NULLS LAST
    `;

    console.log('[INFO] Buscando boletos bancarios...');
    const result = await pool.query(query);

    const bankSlips = result.rows.map(row => ({
      client_name: row.client_name,
      processor_type: row.processor_type,
      amount: parseFloat(row.amount) || 0,
      paid_net_amount: parseFloat(row.paid_net_amount) || 0,
      fee_amount: parseFloat(row.fee_amount) || 0,
      status: row.status || 'open',
      paid_at: row.paid_at
    }));

    console.log(`[OK] Encontrados ${bankSlips.length} boletos`);

    res.json({
      data: bankSlips,
      count: bankSlips.length,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    });

  } catch (error) {
    console.error('[ERROR] Erro ao buscar boletos bancarios:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar boletos bancarios',
      details: error.message,
      status: 'ERROR'
    });
  }
});

/**
 * GET /api/bank-slips/stats
 * Retorna estatisticas dos boletos
 */
app.get('/api/bank-slips/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN bs.status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN bs.status = 'open' THEN 1 END) as open_count,
        COUNT(CASE WHEN bs.status = 'canceled' THEN 1 END) as canceled_count,
        SUM(bs.amount) as total_amount,
        SUM(bs.paid_net_amount) as total_paid_net,
        SUM(bs.fee_amount) as total_fees,
        AVG(bs.fee_amount) as avg_fee
      FROM client_api_keys cak
      INNER JOIN processors p 
        ON cak.id = p.client_api_key_id
      INNER JOIN bank_slips bs 
        ON bs.processor_id = p.id
      WHERE cak.client_name = 'SAAE - Client Production'
    `;

    console.log('[INFO] Buscando estatisticas dos boletos...');
    const result = await pool.query(query);
    const stats = result.rows[0];

    console.log(`[OK] Estatisticas calculadas`);

    res.json({
      total_count: parseInt(stats.total_count) || 0,
      paid_count: parseInt(stats.paid_count) || 0,
      open_count: parseInt(stats.open_count) || 0,
      canceled_count: parseInt(stats.canceled_count) || 0,
      total_amount: parseFloat(stats.total_amount) || 0,
      total_paid_net: parseFloat(stats.total_paid_net) || 0,
      total_fees: parseFloat(stats.total_fees) || 0,
      avg_fee: parseFloat(stats.avg_fee) || 0,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    });

  } catch (error) {
    console.error('[ERROR] Erro ao buscar estatisticas:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar estatisticas',
      details: error.message,
      status: 'ERROR'
    });
  }
});

/**
 * GET /api/bank-slips/by-status/:status
 * Busca boletos por status especifico
 */
app.get('/api/bank-slips/by-status/:status', async (req, res) => {
  try {
    const { status } = req.params;

    const query = `
      SELECT 
        cak.client_name,
        p.processor_type,
        bs.amount,
        bs.paid_net_amount,
        bs.fee_amount,
        bs.status,
        bs.paid_at
      FROM client_api_keys cak
      INNER JOIN processors p 
        ON cak.id = p.client_api_key_id
      INNER JOIN bank_slips bs 
        ON bs.processor_id = p.id
      WHERE cak.client_name = 'SAAE - Client Production'
        AND bs.status = $1
      ORDER BY bs.paid_at DESC NULLS LAST
    `;

    console.log(`[INFO] Buscando boletos com status: ${status}`);
    const result = await pool.query(query, [status]);

    const bankSlips = result.rows.map(row => ({
      client_name: row.client_name,
      processor_type: row.processor_type,
      amount: parseFloat(row.amount) || 0,
      paid_net_amount: parseFloat(row.paid_net_amount) || 0,
      fee_amount: parseFloat(row.fee_amount) || 0,
      status: row.status || 'open',
      paid_at: row.paid_at
    }));

    console.log(`[OK] Encontrados ${bankSlips.length} boletos com status ${status}`);

    res.json({
      data: bankSlips,
      count: bankSlips.length,
      status: status,
      timestamp: new Date().toISOString(),
      response_status: 'SUCCESS'
    });

  } catch (error) {
    console.error('[ERROR] Erro ao buscar boletos por status:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar boletos por status',
      details: error.message,
      status: 'ERROR'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'iugu-server', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling para requisicoes nao encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota nao encontrada',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR] Erro nao tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Iniciar servidor
const server = app.listen(port, () => {
  console.log(`\n[OK] Servidor IUGU rodando em http://localhost:${port}`);
  console.log(`   Endpoints disponiveis:`);
  console.log(`   - GET /api/test (teste de conexao)`);
  console.log(`   - GET /api/bank-slips (buscar todos os boletos)`);
  console.log(`   - GET /api/bank-slips/stats (estatisticas)`);
  console.log(`   - GET /api/bank-slips/by-status/:status (boletos por status)`);
  console.log(`   - GET /health (health check)\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('[INFO] Servidor HTTP encerrado');
    pool.end(() => {
      console.log('[INFO] Pool de conexoes encerrado');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    console.log('[INFO] Servidor HTTP encerrado');
    pool.end(() => {
      console.log('[INFO] Pool de conexoes encerrado');
      process.exit(0);
    });
  });
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Excecao nao capturada:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Promise rejection nao tratada:', reason);
});
