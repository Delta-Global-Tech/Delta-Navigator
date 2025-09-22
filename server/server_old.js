const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DATABASE || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  ssl: false
});

// Rota de teste para verificar conexão
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as timestamp, $1 as message', ['PostgreSQL conectado com sucesso!']);
    res.json({ 
      success: true,
      message: result.rows[0].message,
      timestamp: result.rows[0].timestamp 
    });
  } catch (error) {
    console.error('Erro na conexão:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro na conexão com PostgreSQL',
      details: error.message 
    });
  }
});

// Rota para buscar dados de produção NOVO
app.get('/api/producao/novo', async (req, res) => {
  try {
    // Parâmetros de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const offset = (page - 1) * limit;
    
    // TODO: Implementar queries PostgreSQL para dados de produção
    // Por enquanto, retornando dados mockados para testar a conexão
    const mockData = [];
    for (let i = 1; i <= Math.min(limit, 100); i++) {
      mockData.push({
        proposta_id: `PROP${String(i + offset).padStart(6, '0')}`,
        banco_nome: `Banco ${i % 5 + 1}`,
        convenio_nome: `Convênio ${i % 3 + 1}`,
        produto_nome: `Produto ${i % 4 + 1}`,
        valor_financiado: (Math.random() * 50000 + 10000).toFixed(2),
        valor_liberado: (Math.random() * 45000 + 8000).toFixed(2),
        cliente_nome: `Cliente ${i}`,
        vendedor_nome: `Vendedor ${i % 10 + 1}`,
        status_nome: ['Ativo', 'Pendente', 'Finalizado'][i % 3],
        inserted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    res.json({
      data: mockData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(1000 / limit), // Mock: assumindo 1000 registros total
        totalRecords: 1000,
        recordsPerPage: limit,
        hasNextPage: page < Math.ceil(1000 / limit),
        hasPreviousPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Erro na API de produção:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});
          WHERE status_nome = 'PAGO'
      )
      SELECT COUNT(*) as total FROM ranked WHERE rn = 1
    `);
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / limit);
    
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome = 'PAGO'
      )
      SELECT
          proposta_id,
          banco_id,
          banco_nome,
          convenio_nome,
          prazo,
          promotora_nome,
          produto_nome,
          valor_financiado,
          valor_liberado,
          valor_parcela,
          valor_referencia,
          valor_total_comissionado,
          origem,
          status_nome,
          vendedor_nome,
          cliente_nome,
          inserted_at
      FROM ranked
      WHERE rn = 1
      ORDER BY inserted_at DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `);
    
    
    // Retorna dados com metadados de paginação
    const response = {
      data: result.recordset,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
        recordsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
    
    await pool.close();
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para dados agregados mensais (para gráficos)
app.get('/api/producao/novo/monthly', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              date_cadastro,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome = 'PAGO'
      )
      SELECT 
        FORMAT(date_cadastro, 'yyyy-MM') as mes,
        COUNT(*) as contratos,
        SUM(valor_financiado) as valor_total
      FROM ranked
      WHERE rn = 1
      GROUP BY FORMAT(date_cadastro, 'yyyy-MM')
      ORDER BY mes
    `);
    
    
    await pool.close();
    res.json(result.recordset);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para ranking de produtos
app.get('/api/producao/novo/produtos', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome = 'PAGO'
      )
      SELECT 
        produto_nome,
        COUNT(*) as quantidade,
        SUM(valor_financiado) as valor_total
      FROM ranked
      WHERE rn = 1
      GROUP BY produto_nome
      ORDER BY quantidade DESC
    `);
    
    
    await pool.close();
    res.json(result.recordset);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota otimizada para KPIs (agregações rápidas)
app.get('/api/producao/novo/kpis', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              date_cadastro,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome = 'PAGO'
      )
      SELECT 
        COUNT(*) as total_contratos,
        SUM(valor_financiado) as valor_total,
        AVG(valor_financiado) as ticket_medio,
        MIN(date_cadastro) as data_inicio,
        MAX(date_cadastro) as data_fim
      FROM ranked
      WHERE rn = 1
    `);
    
    
    await pool.close();
    res.json(result.recordset[0]);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando' });
});

// Rota de teste de conexão com banco
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query('SELECT 1 as test, GETDATE() as now');
    
    await pool.close();
    
    res.json({ 
      status: 'OK', 
      message: 'Conexão com banco estabelecida',
      timestamp: new Date().toISOString(),
      result: result.recordset
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Falha na conexão com banco',
      details: error.message,
      code: error.code
    });
  }
});

// Rota simples de teste da tabela
app.get('/api/test-table', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query('SELECT TOP 5 proposta_id, cliente_nome FROM dbo.fact_proposals_newcorban');
    console.log(`Encontrados ${result.recordset.length} registros`);
    
    await pool.close();
    
    res.json({ 
      status: 'OK', 
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('Erro ao acessar tabela:', error);
    res.status(500).json({ 
      error: 'Falha ao acessar tabela',
      details: error.message,
      code: error.code
    });
  }
});

// ===============================
// ROTAS PARA PRODUÇÃO COMPRA (status != 'PAGO')
// ===============================

// Rota para buscar dados de produção COMPRA
app.get('/api/producao/compra', async (req, res) => {
  try {
    console.log('Iniciando busca de dados de produção COMPRA...');
    
    // Parâmetros de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const offset = (page - 1) * limit;
    
    // Filtros de status
    const statusFilter = req.query.status;
    let whereClause = "status_nome != 'PAGO'";
    
    if (statusFilter && statusFilter.length > 0) {
      const statusArray = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
      const statusList = statusArray.map(s => `'${s}'`).join(',');
      whereClause = `status_nome IN (${statusList}) AND status_nome != 'PAGO'`;
      console.log('Filtro de status aplicado:', statusList);
    }
    
    console.log(`Página: ${page}, Limit: ${limit}, Offset: ${offset}`);
    
    const pool = await sql.connect(config);
    console.log('Conexão estabelecida, executando query COMPRA...');
    
    // Primeiro, contar total de registros
    const countQuery = `
      ;WITH ranked AS (
          SELECT
              proposta_id,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE ` + whereClause + `
      )
      SELECT COUNT(*) as total FROM ranked WHERE rn = 1
    `;
    
    const countResult = await pool.request().query(countQuery);
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / limit);
    
    console.log(`Total de registros COMPRA no banco: ${totalRecords}, Total de páginas: ${totalPages}`);
    
    // Query principal com paginação
    const mainQuery = `
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE ` + whereClause + `
      )
      SELECT
          proposta_id,
          banco_id,
          banco_nome,
          convenio_nome,
          prazo,
          promotora_nome,
          produto_nome,
          valor_financiado,
          valor_liberado,
          valor_parcela,
          valor_referencia,
          valor_total_comissionado,
          origem,
          status_nome,
          vendedor_nome,
          cliente_nome,
          inserted_at
      FROM ranked
      WHERE rn = 1
      ORDER BY inserted_at DESC
      OFFSET ` + offset + ` ROWS
      FETCH NEXT ` + limit + ` ROWS ONLY
    `;
    
    const result = await pool.request().query(mainQuery);
    
    console.log(`Query COMPRA executada com sucesso. ${result.recordset.length} registros retornados da página ${page}.`);
    
    // Retorna dados com metadados de paginação
    const response = {
      data: result.recordset,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
        recordsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
    
    await pool.close();
    res.json(response);
    
  } catch (error) {
    console.error('Erro ao buscar dados COMPRA:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para dados agregados mensais COMPRA
app.get('/api/producao/compra/monthly', async (req, res) => {
  try {
    console.log('Buscando dados mensais agregados COMPRA...');
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              date_cadastro,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome != 'PAGO'
      )
      SELECT 
        FORMAT(date_cadastro, 'yyyy-MM') as mes,
        COUNT(*) as contratos,
        SUM(valor_financiado) as valor_total
      FROM ranked
      WHERE rn = 1
      GROUP BY FORMAT(date_cadastro, 'yyyy-MM')
      ORDER BY mes
    `);
    
    console.log('Dados mensais COMPRA calculados:', result.recordset.length, 'meses');
    
    await pool.close();
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar dados mensais COMPRA:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para ranking de produtos COMPRA
app.get('/api/producao/compra/produtos', async (req, res) => {
  try {
    console.log('Buscando ranking de produtos COMPRA...');
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome != 'PAGO'
      )
      SELECT 
        produto_nome,
        COUNT(*) as quantidade,
        SUM(valor_financiado) as valor_total
      FROM ranked
      WHERE rn = 1
      GROUP BY produto_nome
      ORDER BY quantidade DESC
    `);
    
    console.log('Ranking de produtos COMPRA calculado:', result.recordset.length, 'produtos');
    
    await pool.close();
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar ranking de produtos COMPRA:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para KPIs COMPRA
app.get('/api/producao/compra/kpis', async (req, res) => {
  try {
    console.log('Buscando KPIs de produção COMPRA...');
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              banco_id,
              banco_nome,
              convenio_nome,
              prazo,
              promotora_nome,
              produto_nome,
              valor_financiado,
              valor_liberado,
              valor_parcela,
              valor_referencia,
              valor_total_comissionado,
              origem,
              status_nome,
              vendedor_nome,
              cliente_nome,
              inserted_at,
              date_cadastro,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome != 'PAGO'
      )
      SELECT 
        COUNT(*) as total_contratos,
        SUM(valor_financiado) as valor_total,
        AVG(valor_financiado) as ticket_medio,
        MIN(date_cadastro) as data_inicio,
        MAX(date_cadastro) as data_fim
      FROM ranked
      WHERE rn = 1
    `);
    
    console.log('KPIs COMPRA calculados com sucesso:', result.recordset[0]);
    
    await pool.close();
    res.json(result.recordset[0]);
    
  } catch (error) {
    console.error('Erro ao buscar KPIs COMPRA:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para buscar status disponíveis (exceto PAGO)
app.get('/api/producao/compra/status', async (req, res) => {
  try {
    console.log('Buscando status disponíveis para COMPRA...');
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      ;WITH ranked AS (
          SELECT
              proposta_id,
              status_nome,
              inserted_at,
              ROW_NUMBER() OVER (
                  PARTITION BY proposta_id
                  ORDER BY inserted_at DESC
              ) AS rn
          FROM dbo.fact_proposals_newcorban
          WHERE status_nome != 'PAGO'
      )
      SELECT 
        status_nome,
        COUNT(*) as quantidade
      FROM ranked
      WHERE rn = 1
      GROUP BY status_nome
      ORDER BY quantidade DESC
    `);
    
    console.log('Status disponíveis COMPRA:', result.recordset.length, 'status');
    
    await pool.close();
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar status COMPRA:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});