const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 3005;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configuração do PostgreSQL
const poolConfig = {
  host: process.env.PG_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || process.env.POSTGRES_PORT || 5432),
  database: process.env.PG_DB || process.env.POSTGRES_DATABASE || 'airflow_treynor',
  user: process.env.PG_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.PG_PASSWORD || process.env.POSTGRES_PASSWORD || 'MinhaSenh@123',
  
  // Pool settings
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
  ssl: false
};

// Criar pool global
const pool = new Pool(poolConfig);

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

console.log(`Conectando ao PostgreSQL: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'iugu-server'
    });
  } catch (error) {
    console.error('[HEALTH CHECK] Falha:', error.message);
    res.status(503).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      service: 'iugu-server'
    });
  }
});

// Rota de teste de conexão
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    
    res.json({ 
      message: 'Conexão PostgreSQL bem-sucedida!', 
      time: result.rows[0].current_time,
      database: poolConfig.database
    });
  } catch (error) {
    console.error('❌ Erro na conexão PostgreSQL:', error);
    res.status(500).json({ 
      error: 'Erro na conexão com PostgreSQL',
      details: error.message 
    });
  }
});

// GET /api/bank-slips
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

    console.log('📋 Buscando boletos bancários...');
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

    console.log(`✅ Encontrados ${bankSlips.length} boletos`);

    res.json({
      data: bankSlips,
      count: bankSlips.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar boletos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar boletos',
      details: error.message
    });
  }
});

// GET /api/bank-slips/stats
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

    console.log('📊 Buscando estatísticas...');
    const result = await pool.query(query);

    const stats = result.rows[0];

    res.json({
      total_count: parseInt(stats.total_count),
      paid_count: parseInt(stats.paid_count),
      open_count: parseInt(stats.open_count),
      canceled_count: parseInt(stats.canceled_count),
      total_amount: parseFloat(stats.total_amount) || 0,
      total_paid_net: parseFloat(stats.total_paid_net) || 0,
      total_fees: parseFloat(stats.total_fees) || 0,
      avg_fee: parseFloat(stats.avg_fee) || 0
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: error.message
    });
  }
});

// GET /api/bank-slips/by-status/:status
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

    console.log(`📋 Buscando boletos com status: ${status}`);
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

    console.log(`✅ Encontrados ${bankSlips.length} boletos com status ${status}`);

    res.json({
      data: bankSlips,
      count: bankSlips.length,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar boletos por status:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar boletos por status',
      details: error.message
    });
  }
});

// Iniciar servidor
const server = app.listen(port, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   🚀 Iugu Server - Iniciado com Sucesso!');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 Porta: ${port}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`🏥 Health: http://localhost:${port}/health`);
  console.log('');
  console.log('📋 Endpoints disponíveis:');
  console.log(`   - GET /api/test`);
  console.log(`   - GET /api/bank-slips`);
  console.log(`   - GET /api/bank-slips/stats`);
  console.log(`   - GET /api/bank-slips/by-status/:status`);
  console.log(`   - GET /health`);
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
    
    console.log('✓ Servidor Iugu encerrado com sucesso');
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
