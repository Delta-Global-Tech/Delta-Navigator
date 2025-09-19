const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração do PostgreSQL
const config = {
  host: process.env.HOST,
  port: process.env.PORT,
  database: process.env.DB,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  ssl: false
};


// Rota de teste de conexão
app.get('/api/test', async (req, res) => {
  try {
    const pool = new Pool(config);
    const result = await pool.query('SELECT NOW() as current_time');
    await pool.end();
    
    res.json({ 
      message: 'Conexão PostgreSQL bem-sucedida!', 
      time: result.rows[0].current_time 
    });
  } catch (error) {
    console.error('Erro na conexão PostgreSQL:', error);
    res.status(500).json({ 
      error: 'Erro na conexão com PostgreSQL',
      details: error.message 
    });
  }
});

// Rota para listar tabelas disponíveis
app.get('/api/tables', async (req, res) => {
  try {
    const pool = new Pool(config);
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    await pool.end();
    
    res.json({ 
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
    res.status(500).json({ 
      error: 'Erro ao listar tabelas',
      details: error.message 
    });
  }
});

// Rota para buscar dados do funil
app.get('/api/funil/data', async (req, res) => {
  try {
    console.log('Iniciando busca de dados do funil...');
    
    const { produto, step, status } = req.query;
    
    // Construir filtros WHERE para o funil
    let whereFunnel = "";
    const params = [];
    let paramIndex = 1;
    
    // Filtro produto
    if (produto && produto === "juros_baixos") {
      whereFunnel = "WHERE f.store_lp_id = 26";
    }
    
    // Filtro por etapa específica
    if (step) {
      const stepConditions = {
        '1': 'f.steps_fgts_id = 1', // Pré-Registro
        '2': 'f.steps_fgts_id = 2', // Site
        '9': 'f.steps_fgts_id = 9', // WhatsApp
        '3': 'f.steps_fgts_id = 3', // Download FGTS
        '4': 'f.steps_fgts_id = 4', // App Autorizado
        '5': 'f.steps_fgts_id = 5', // Simulação
        '6': 'f.steps_fgts_id = 6'  // Registro Completo
      };
      
      if (stepConditions[step]) {
        whereFunnel = whereFunnel ? `${whereFunnel} AND ${stepConditions[step]}` : `WHERE ${stepConditions[step]}`;
      }
    }
    
    // Construir filtro de status para o resultado final
    let whereStatus = "";
    if (status && status !== 'todos') {
      whereStatus = `WHERE lps.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const pool = new Pool(config);
    console.log('Conexão estabelecida, executando query...');
    
    const query = `
      WITH latest_proposal_status AS (
        SELECT DISTINCT ON (p.id)
               p.id,
               p."nrCpfCnpj"                    AS doc,
               p2.status
        FROM proposals p
        LEFT JOIN proccess_sworks p2
               ON p2.id_proposta = p.id
        -- pega o status mais recente por proposta
        ORDER BY p.id, p2."created_at" DESC NULLS LAST
      ),
      funnel_por_cliente AS (
        SELECT
          c.id                                   AS client_id,
          c.name                                 AS "Nome",
          c.identity                             AS "Documento",
          c."mainPhone"                          AS "Telefone",
          MIN(f."createdAt")                     AS "Data Criacao",
          MAX((f.steps_fgts_id = 1)::int)        AS "Pre-Registro",
          MAX((f.steps_fgts_id = 2)::int)        AS "Site",
          MAX((f.steps_fgts_id = 9)::int)        AS "Whatsapp",
          MAX((f.steps_fgts_id = 3)::int)        AS "Download-FGTS",
          MAX((f.steps_fgts_id = 4)::int)        AS "App-Autorizado",
          MAX((f.steps_fgts_id = 5)::int)        AS "Simulacao",
          MAX((f.steps_fgts_id = 6)::int)        AS "Registro Completo",
          CASE WHEN MAX((f.store_lp_id = 26)::int) = 1
               THEN 'Juros Baixos' ELSE 'Outro Produto' END AS produto_nome
        FROM funnel_fgts f
        JOIN clients c ON f.client_id = c.id
        ${whereFunnel}
        GROUP BY c.id, c.name, c.identity, c."mainPhone"
      )
      SELECT
        fc."Nome",
        fc."Documento",
        fc."Telefone",
        fc."Data Criacao",
        lps.status AS "Status",
        fc."Pre-Registro",
        fc."Site",
        fc."Whatsapp",
        fc."Download-FGTS",
        fc."App-Autorizado",
        fc."Simulacao",
        fc."Registro Completo",
        fc.produto_nome
      FROM funnel_por_cliente fc
      LEFT JOIN latest_proposal_status lps
             ON lps.doc = fc."Documento"
      ${whereStatus}
      ORDER BY fc."Data Criacao" DESC
    `;
    
    console.log('Query executada:', query);
    console.log('Parâmetros:', params);
    
    const result = await pool.query(query, params);
    
    console.log(`Query executada com sucesso. ${result.rows.length} registros retornados.`);
    
    await pool.end();
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erro ao buscar dados do funil:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para buscar KPIs do funil
app.get('/api/funil/kpis', async (req, res) => {
  try {
    console.log('Buscando KPIs do funil...');
    
    const { produto, status } = req.query;
    
    // Construir filtros WHERE para o funil
    let whereFunnel = "";
    const params = [];
    let paramIndex = 1;
    
    // Filtro produto
    if (produto && produto === "juros_baixos") {
      whereFunnel = "WHERE f.store_lp_id = 26";
    }
    
    // Construir filtro de status para o resultado final
    let whereStatus = "";
    if (status && status !== 'todos') {
      whereStatus = `WHERE lps.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const pool = new Pool(config);
    console.log('Conexão estabelecida, executando query de KPIs...');
    
    const query = `
      WITH latest_proposal_status AS (
        SELECT DISTINCT ON (p.id)
               p.id,
               p."nrCpfCnpj"                    AS doc,
               p2.status
        FROM proposals p
        LEFT JOIN proccess_sworks p2
               ON p2.id_proposta = p.id
        -- pega o status mais recente por proposta
        ORDER BY p.id, p2."created_at" DESC NULLS LAST
      ),
      funnel_por_cliente AS (
        SELECT
          c.id                                   AS client_id,
          c.name                                 AS "Nome",
          c.identity                             AS "Documento",
          c."mainPhone"                          AS "Telefone",
          MIN(f."createdAt")                     AS "Data Criacao",
          MAX((f.steps_fgts_id = 1)::int)        AS "Pre-Registro",
          MAX((f.steps_fgts_id = 2)::int)        AS "Site",
          MAX((f.steps_fgts_id = 9)::int)        AS "Whatsapp",
          MAX((f.steps_fgts_id = 3)::int)        AS "Download-FGTS",
          MAX((f.steps_fgts_id = 4)::int)        AS "App-Autorizado",
          MAX((f.steps_fgts_id = 5)::int)        AS "Simulacao",
          MAX((f.steps_fgts_id = 6)::int)        AS "Registro Completo",
          CASE WHEN MAX((f.store_lp_id = 26)::int) = 1
               THEN 'Juros Baixos' ELSE 'Outro Produto' END AS produto_nome
        FROM funnel_fgts f
        JOIN clients c ON f.client_id = c.id
        ${whereFunnel}
        GROUP BY c.id, c.name, c.identity, c."mainPhone"
      ),
      filtered_data AS (
        SELECT
          fc.*,
          lps.status AS "Status"
        FROM funnel_por_cliente fc
        LEFT JOIN latest_proposal_status lps
               ON lps.doc = fc."Documento"
        ${whereStatus}
      )
      SELECT 
          COUNT(DISTINCT client_id) as total_clients,
          SUM("Pre-Registro") AS pre_registro,
          SUM("Site") AS site,
          SUM("Whatsapp") AS whatsapp,
          SUM("Download-FGTS") AS download_fgts,
          SUM("App-Autorizado") AS app_autorizado,
          SUM("Simulacao") AS simulacao,
          SUM("Registro Completo") AS registro_completo
      FROM filtered_data
    `;
    
    console.log('Query KPIs executada:', query);
    console.log('Parâmetros:', params);
    
    const result = await pool.query(query, params);
    
    console.log('KPIs calculados com sucesso:', result.rows[0]);
    
    await pool.end();
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao buscar KPIs do funil:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
    });
  }
});

// Rota para buscar status disponíveis do funil
app.get('/api/funil/status', async (req, res) => {
  try {
    console.log('Buscando status disponíveis do funil...');
    
    const pool = new Pool(config);
    const query = `
      SELECT DISTINCT p2.status
      FROM proposals p
      LEFT JOIN proccess_sworks p2 ON p2.id_proposta = p.id
      WHERE p2.status IS NOT NULL
      ORDER BY p2.status
    `;
    
    const result = await pool.query(query);
    await pool.end();
    
    console.log(`Encontrados ${result.rows.length} status diferentes no funil`);
    
    res.json({
      status: result.rows.map(row => row.status)
    });
    
  } catch (error) {
    console.error('Erro ao buscar status do funil:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar status do funil',
      details: error.message 
    });
  }
});

// Rota para buscar dados das propostas
app.get('/api/propostas/data', async (req, res) => {
  try {
    console.log('Iniciando busca de dados das propostas...');
    
    const { status, data_inicio, data_fim } = req.query;
    
    // Construir filtros WHERE
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramIndex = 1;
    
    if (status && status !== 'todos') {
      // Regra especial para Joseane dos Santos: sempre considerar como FINALIZADO
      if (status === 'FINALIZADO') {
        whereClause += ` AND (p2.status = $${paramIndex} OR c.name = 'Joseane Dos Santos Firmo')`;
      } else {
        whereClause += ` AND p2.status = $${paramIndex} AND c.name != 'Joseane Dos Santos Firmo'`;
      }
      params.push(status);
      paramIndex++;
    }
    
    // Validar formato da data antes de aplicar filtro (YYYY-MM-DD)
    if (data_inicio && data_inicio.length === 10 && data_inicio.includes('-')) {
      whereClause += ` AND p."contractDate" >= $${paramIndex}`;
      params.push(data_inicio.replace(/-/g, '')); // Converter para YYYYMMDD
      paramIndex++;
    }
    
    if (data_fim && data_fim.length === 10 && data_fim.includes('-')) {
      whereClause += ` AND p."contractDate" <= $${paramIndex}`;
      params.push(data_fim.replace(/-/g, '')); // Converter para YYYYMMDD
      paramIndex++;
    }
    
    const pool = new Pool(config);
    console.log('Conexão estabelecida, executando query...');
    
    const query = `
      SELECT 
          c.name AS cliente,
          c."mainPhone" AS telefone,
          c."mainEmail" AS email,
          p.id AS proposta_id,
          p."contractDate" AS data_contrato,
          p."createdAt" AS data_criacao,
          p."vlTotal" AS valor_total,
          p."vlLiquid" AS valor_liquido,
          p."qtPresta" AS qtd_parcelas,
          p."channel_id" AS canal_venda,
          CASE 
              WHEN c.name = 'Joseane Dos Santos Firmo' THEN 'FINALIZADO'
              ELSE p2.status
          END AS status_processo,
          p2.updated_at AS data_finalizacao,
          p2.id_processo_sworks
      FROM proposals p
      INNER JOIN clients c ON c.identity = p."nrCpfCnpj"
      INNER JOIN proccess_sworks p2 ON p2.id_proposta = p.id
      ${whereClause}
      ORDER BY p2.updated_at DESC
    `;
    
    console.log('Query a ser executada:', query);
    console.log('Parâmetros:', params);
    
    const result = await pool.query(query, params);
    await pool.end();
    
    console.log(`Encontrados ${result.rows.length} registros de propostas`);
    
    res.json({
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados das propostas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados das propostas',
      details: error.message 
    });
  }
});

// Rota para buscar KPIs das propostas
app.get('/api/propostas/kpis', async (req, res) => {
  try {
    console.log('Iniciando busca de KPIs das propostas...');
    
    const { status, data_inicio, data_fim } = req.query;
    
    // Construir filtros WHERE
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramIndex = 1;
    
    if (status && status !== 'todos') {
      // Regra especial para Joseane dos Santos: sempre considerar como FINALIZADO
      if (status === 'FINALIZADO') {
        whereClause += ` AND (p2.status = $${paramIndex} OR c.name = 'Joseane Dos Santos Firmo')`;
      } else {
        whereClause += ` AND p2.status = $${paramIndex} AND c.name != 'Joseane Dos Santos Firmo'`;
      }
      params.push(status);
      paramIndex++;
    }
    
    // Validar formato da data antes de aplicar filtro (YYYY-MM-DD)
    if (data_inicio && data_inicio.length === 10 && data_inicio.includes('-')) {
      whereClause += ` AND p."contractDate" >= $${paramIndex}`;
      params.push(data_inicio.replace(/-/g, '')); // Converter para YYYYMMDD
      paramIndex++;
    }
    
    if (data_fim && data_fim.length === 10 && data_fim.includes('-')) {
      whereClause += ` AND p."contractDate" <= $${paramIndex}`;
      params.push(data_fim.replace(/-/g, '')); // Converter para YYYYMMDD
      paramIndex++;
    }
    
    const pool = new Pool(config);
    console.log('Conexão estabelecida, executando query de KPIs...');
    
    const query = `
      SELECT 
          COUNT(*) as total_propostas,
          COUNT(DISTINCT c.identity) as clientes_unicos,
          SUM(p."vlTotal") as valor_total_sum,
          SUM(p."vlLiquid") as valor_liquido_sum,
          AVG(p."vlTotal") as valor_medio,
          COUNT(CASE WHEN p2.status = 'FINALIZADO' OR c.name = 'Joseane Dos Santos Firmo' THEN 1 END) as finalizadas,
          COUNT(CASE WHEN p2.status = 'EM_ANDAMENTO' THEN 1 END) as em_andamento,
          COUNT(CASE WHEN p2.status = 'PENDENTE' THEN 1 END) as pendentes,
          COUNT(CASE WHEN p2.status = 'CANCELADO' THEN 1 END) as canceladas
      FROM proposals p
      INNER JOIN clients c ON c.identity = p."nrCpfCnpj"
      INNER JOIN proccess_sworks p2 ON p2.id_proposta = p.id
      ${whereClause}
    `;
    
    console.log('Query KPIs a ser executada:', query);
    console.log('Parâmetros:', params);
    
    const result = await pool.query(query, params);
    await pool.end();
    
    const kpis = result.rows[0];
    
    console.log('KPIs calculados:', kpis);
    
    res.json({
      total_propostas: parseInt(kpis.total_propostas),
      clientes_unicos: parseInt(kpis.clientes_unicos),
      valor_total: parseFloat(kpis.valor_total_sum) || 0,
      valor_liquido: parseFloat(kpis.valor_liquido_sum) || 0,
      valor_medio: parseFloat(kpis.valor_medio) || 0,
      finalizadas: parseInt(kpis.finalizadas),
      em_andamento: parseInt(kpis.em_andamento),
      pendentes: parseInt(kpis.pendentes),
      canceladas: parseInt(kpis.canceladas)
    });
    
  } catch (error) {
    console.error('Erro ao buscar KPIs das propostas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar KPIs das propostas',
      details: error.message 
    });
  }
});

// Rota para buscar status disponíveis
app.get('/api/propostas/status', async (req, res) => {
  try {
    console.log('Buscando status disponíveis...');
    
    const pool = new Pool(config);
    const query = `
      SELECT DISTINCT 
          CASE 
              WHEN c.name = 'Joseane Dos Santos Firmo' THEN 'FINALIZADO'
              ELSE p2.status
          END AS status_processo
      FROM proposals p
      INNER JOIN clients c ON c.identity = p."nrCpfCnpj"
      INNER JOIN proccess_sworks p2 ON p2.id_proposta = p.id
      WHERE p2.status IS NOT NULL
      ORDER BY status_processo
    `;
    
    const result = await pool.query(query);
    await pool.end();
    
    console.log(`Encontrados ${result.rows.length} status diferentes`);
    
    res.json({
      status: result.rows.map(row => row.status_processo)
    });
    
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar status',
      details: error.message 
    });
  }
});

// Rota para buscar evolução diária das propostas
app.get('/api/propostas/evolucao-diaria', async (req, res) => {
  try {
    console.log('Buscando evolução diária...');
    
    const { status, data_inicio, data_fim } = req.query;
    
    // Construir filtros WHERE
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramIndex = 1;
    
    if (status && status !== 'todos') {
      // Regra especial para Joseane dos Santos: sempre considerar como FINALIZADO
      if (status === 'FINALIZADO') {
        whereClause += ` AND (p2.status = $${paramIndex} OR c.name = 'Joseane Dos Santos Firmo')`;
      } else {
        whereClause += ` AND p2.status = $${paramIndex} AND c.name != 'Joseane Dos Santos Firmo'`;
      }
      params.push(status);
      paramIndex++;
    }
    
    // Validar formato da data antes de aplicar filtro (YYYY-MM-DD)
    if (data_inicio && data_inicio.length === 10 && data_inicio.includes('-')) {
      whereClause += ` AND p."contractDate" >= $${paramIndex}`;
      params.push(data_inicio.replace(/-/g, '')); // Converter para YYYYMMDD
      paramIndex++;
    }
    
    if (data_fim && data_fim.length === 10 && data_fim.includes('-')) {
      whereClause += ` AND p."contractDate" <= $${paramIndex}`;
      params.push(data_fim.replace(/-/g, '')); // Converter para YYYYMMDD
      paramIndex++;
    }
    
    const pool = new Pool(config);
    const query = `
      SELECT 
          p."contractDate" as data,
          COUNT(*) as quantidade,
          SUM(p."vlTotal") as valor_total,
          SUM(p."vlLiquid") as valor_liquido,
          COUNT(CASE WHEN p2.status = 'FINALIZADO' OR c.name = 'Joseane Dos Santos Firmo' THEN 1 END) as finalizadas
      FROM proposals p
      INNER JOIN clients c ON c.identity = p."nrCpfCnpj"
      INNER JOIN proccess_sworks p2 ON p2.id_proposta = p.id
      ${whereClause}
      GROUP BY p."contractDate"
      ORDER BY p."contractDate" DESC
      ${!data_inicio && !data_fim ? 'LIMIT 30' : ''}
    `;
    
    console.log('Query evolução diária:', query);
    console.log('Parâmetros:', params);
    
    const result = await pool.query(query, params);
    await pool.end();
    
    // Formatar dados para o gráfico
    const dadosFormatados = result.rows.map(row => ({
      data: row.data,
      quantidade: parseInt(row.quantidade),
      valor_total: parseFloat(row.valor_total) || 0,
      valor_liquido: parseFloat(row.valor_liquido) || 0,
      finalizadas: parseInt(row.finalizadas)
    }));
    
    console.log(`Encontrados ${dadosFormatados.length} dias de dados`);
    
    res.json({
      evolucao: dadosFormatados
    });
    
  } catch (error) {
    console.error('Erro ao buscar evolução diária:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar evolução diária',
      details: error.message 
    });
  }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Teste a API em: http://localhost:${port}/api/test`);
});
