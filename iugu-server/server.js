const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3005;

// Middlewares
app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configuração do PostgreSQL
const config = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: false
};

console.log(`Conectando ao PostgreSQL: ${config.host}:${config.port}/${config.database}`);

// Rota de teste de conexão
app.get('/api/test', async (req, res) => {
  try {
    const pool = new Pool(config);
    const result = await pool.query('SELECT NOW() as current_time');
    await pool.end();
    
    res.json({ 
      message: 'Conexão PostgreSQL bem-sucedida!', 
      time: result.rows[0].current_time,
      database: config.database
    });
  } catch (error) {
    console.error('❌ Erro na conexão PostgreSQL:', error);
    res.status(500).json({ 
      error: 'Erro na conexão com PostgreSQL',
      details: error.message 
    });
  }
});

/**
 * GET /api/bank-slips
 * Busca boletos bancários da tabela bank_slips
 * Query SQL:
 * SELECT 
 *   cak.client_name,
 *   p.processor_type,
 *   bs.amount,
 *   bs.paid_net_amount,
 *   bs.fee_amount,
 *   bs.status,
 *   bs.paid_at
 * FROM client_api_keys cak
 * INNER JOIN processors p ON cak.id = p.client_api_key_id
 * INNER JOIN bank_slips bs ON bs.processor_id = p.id
 * WHERE cak.client_name = 'SAAE - Client Production'
 */
app.get('/api/bank-slips', async (req, res) => {
  try {
    const pool = new Pool(config);

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
    await pool.end();

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
    console.error('❌ Erro ao buscar boletos bancários:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar boletos bancários',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/bank-slips/stats
 * Retorna estatísticas dos boletos
 */
app.get('/api/bank-slips/stats', async (req, res) => {
  try {
    const pool = new Pool(config);

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

    console.log('📊 Buscando estatísticas dos boletos...');
    const result = await pool.query(query);
    await pool.end();

    const stats = result.rows[0];

    console.log(`✅ Estatísticas calculadas`);

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

/**
 * GET /api/bank-slips/by-status/:status
 * Busca boletos por status específico
 */
app.get('/api/bank-slips/by-status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const pool = new Pool(config);

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
    await pool.end();

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'iugu-server', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`\n✅ Servidor IUGU rodando em http://localhost:${port}`);
  console.log(`   Endpoints disponíveis:`);
  console.log(`   - GET /api/test (teste de conexão)`);
  console.log(`   - GET /api/bank-slips (buscar todos os boletos)`);
  console.log(`   - GET /api/bank-slips/stats (estatísticas)`);
  console.log(`   - GET /api/bank-slips/by-status/:status (boletos por status)`);
  console.log(`   - GET /health (health check)\n`);
});
