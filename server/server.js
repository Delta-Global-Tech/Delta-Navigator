const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

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

// Inicializar configuração do banco com Vault + fallback
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
  maxRetries: 3,
  retryDelay: 1000,
  retryDelayMultiplier: 2,
  query_timeout: 30000,
};

async function initializeDatabase() {
  console.log('[VAULT] Tentando carregar secrets...');
  
  const vaultHost = await getVaultSecret('secret/data/delta/postgres-host');
  const vaultPort = await getVaultSecret('secret/data/delta/postgres-port');
  const vaultDb = await getVaultSecret('secret/data/delta/postgres-db');
  const vaultUser = await getVaultSecret('secret/data/delta/postgres-user');
  const vaultPassword = await getVaultSecret('secret/data/delta/postgres-password');
  
  if (vaultHost) dbConfig.host = vaultHost;
  if (vaultPort) dbConfig.port = parseInt(vaultPort);
  if (vaultDb) dbConfig.database = vaultDb;
  if (vaultUser) dbConfig.user = vaultUser;
  if (vaultPassword) dbConfig.password = vaultPassword;
  
  console.log(`[DB] Configuracao final: host=${dbConfig.host} port=${dbConfig.port} database=${dbConfig.database}`);
  console.log('[DB] Pronto para conectar');
}

// Configuração do PostgreSQL com melhores práticas
const pool = new Pool(dbConfig);
// ====== FIM VAULT INTEGRATION ======

// Error handling para o pool
pool.on('error', (err, client) => {
  console.error('Erro no pool PostgreSQL:', err);
  console.error('Cliente afetado:', client);
  // Pool continuará tentando recuperar-se
});

pool.on('connect', () => {
  console.log('[DB] Nova conexão estabelecida');
});

pool.on('remove', () => {
  console.log('[DB] Conexão removida do pool');
});

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('      🚀 Delta Navigator - Backend PostgreSQL Server');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('📊 Configuração PostgreSQL:');
console.log('   Host:', process.env.POSTGRES_HOST || 'localhost');
console.log('   Port:', process.env.POSTGRES_PORT || 5432);
console.log('   Database:', process.env.POSTGRES_DATABASE || 'airflow_treynor');
console.log('   User:', process.env.POSTGRES_USER || 'postgres');
console.log('   Password:', process.env.POSTGRES_PASSWORD ? '✓ Configurada' : '✗ Não configurada');
console.log('');
console.log('⚙️  Configuração do Pool:');
console.log('   Max Connections:', 20);
console.log('   Min Connections:', 2);
console.log('   Idle Timeout:', '30s');
console.log('   Connection Timeout:', '10s');
console.log('   Query Timeout:', '30s');
console.log('');

// API de saúde do servidor (health check para Docker)
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('[HEALTH CHECK] Falha na conexão:', error.message);
    res.status(503).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});
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

// API para diagnosticar Vault
app.get('/api/vault/health', async (req, res) => {
  try {
    const vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
    const vaultToken = process.env.VAULT_TOKEN || 'devtoken';
    
    console.log(`[VAULT-HEALTH] Testando conexão com Vault: ${vaultAddr}`);
    
    const response = await axios.get(
      `${vaultAddr}/v1/sys/health`,
      {
        headers: { 'X-Vault-Token': vaultToken },
        timeout: 5000,
      }
    );
    
    res.json({
      status: 'healthy',
      vault_address: vaultAddr,
      vault_status: response.data,
      message: '✅ Vault está operacional!'
    });
  } catch (error) {
    console.error('[VAULT-HEALTH] Erro ao conectar com Vault:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      vault_address: process.env.VAULT_ADDR || 'http://vault:8200',
      error: error.message,
      message: '❌ Vault não está acessível',
      tips: [
        'Verifique se o container vault está rodando: docker ps | grep vault',
        'Verifique se a porta 8200 está aberta',
        'Verifique os logs: docker logs delta-vault'
      ]
    });
  }
});

// API para testar busca de secrets do Vault
app.get('/api/vault/test-secret/:path', async (req, res) => {
  try {
    const secretPath = req.params.path;
    const vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
    const vaultToken = process.env.VAULT_TOKEN || 'devtoken';
    
    console.log(`[VAULT-SECRET] Testando leitura de secret: ${secretPath}`);
    
    const response = await axios.get(
      `${vaultAddr}/v1/${secretPath}`,
      {
        headers: { 'X-Vault-Token': vaultToken },
        timeout: 5000,
      }
    );
    
    res.json({
      status: 'found',
      path: secretPath,
      data: response.data.data,
      message: '✅ Secret encontrado no Vault!'
    });
  } catch (error) {
    console.error('[VAULT-SECRET] Erro ao buscar secret:', error.message);
    res.status(error.response?.status || 500).json({
      status: 'error',
      path: req.params.path,
      error: error.message,
      message: '❌ Secret não encontrado ou erro ao acessar',
      tips: [
        'Verifique se o caminho do secret está correto',
        'Secrets no Vault devem estar em: secret/data/[seu-caminho]',
        'Exemplo: secret/data/delta/postgres-host'
      ]
    });
  }
});

// API de debug para listar rotas registradas
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json({ routes, total: routes.length });
});

// API de debug para listar tabelas no banco
app.get('/api/debug/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%fact_proposals%'
      ORDER BY table_schema, table_name
    `);
    
    const tables = result.rows;
    res.json({ 
      database: dbConfig.database,
      host: dbConfig.host,
      tables,
      total: tables.length,
      message: `Encontradas ${tables.length} tabelas com 'fact_proposals' no nome`
    });
  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
    res.status(500).json({ 
      error: 'Erro ao listar tabelas',
      details: error.message 
    });
  }
});

// API de debug para ver estrutura da tabela
app.get('/api/debug/columns', async (req, res) => {
  try {
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'fact_proposals_newcorban'
      ORDER BY ordinal_position
    `;
    const result = await pool.query(query);
    res.json({ columns: result.rows });
  } catch (error) {
    console.error('Erro ao buscar colunas:', error);
    res.status(500).json({ error: 'Erro ao buscar colunas', details: error.message });
  }
});

// API para verificar dados disponíveis na tabela
app.get('/api/debug/data-range', async (req, res) => {
  try {
    const query = `
      SELECT 
        MIN(created_at) as data_minima,
        MAX(created_at) as data_maxima,
        COUNT(*) as total_registros,
        COUNT(DISTINCT DATE_TRUNC('month', created_at)) as meses_distintos
      FROM public.fact_proposals_newcorban
    `;
    
    const result = await pool.query(query);
    const dataInfo = result.rows[0];
    
    // Buscar dados por mês
    const monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as mes,
        COUNT(*) as registros
      FROM public.fact_proposals_newcorban
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mes
    `;
    
    const monthlyResult = await pool.query(monthlyQuery);
    
    res.json({
      info: dataInfo,
      meses: monthlyResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar informações dos dados:', error);
    res.status(500).json({ error: 'Erro ao buscar informações', details: error.message });
  }
});

// ===== APIs DE PRODUÇÃO =====

// API para KPIs da tela PRODUCAO NOVO
app.get('/api/producao/novo/kpis', async (req, res) => {
  try {
    // KPIs do mês atual
    const queryAtual = `
      SELECT 
        COUNT(*) as total_contratos,
        SUM(valor_referencia) as valor_referencia_total,
        SUM(valor_financiado) as valor_financiado_total,
        SUM(valor_liberado) as valor_liberado_total,
        SUM(valor_parcela) as valor_parcela_total,
        COUNT(DISTINCT cliente_nome) as clientes_unicos,
        COUNT(DISTINCT banco_nome) as bancos_parceiros
      FROM public.fact_proposals_newcorban 
      WHERE status_nome IN ('ASSINATURA APROVADA', 'GERANDO CCB', 'GERANDO NOVA CCB', 
                            'AGUARDANDO FORMALIZAÇÃO CCB', 'AGUARDANDO ENVIO DA CCB', 
                            'FILA DE DIGITAÇÃO', 'PENDENTE')
        AND DATE_TRUNC('month', data_cadastro) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    // KPIs do mês anterior para comparação
    const queryAnterior = `
      SELECT 
        COUNT(*) as total_contratos_anterior,
        SUM(valor_referencia) as valor_referencia_anterior,
        SUM(valor_financiado) as valor_financiado_anterior,
        SUM(valor_liberado) as valor_liberado_anterior,
        SUM(valor_parcela) as valor_parcela_anterior
      FROM public.fact_proposals_newcorban 
      WHERE status_nome IN ('ASSINATURA APROVADA', 'GERANDO CCB', 'GERANDO NOVA CCB', 
                            'AGUARDANDO FORMALIZAÇÃO CCB', 'AGUARDANDO ENVIO DA CCB', 
                            'FILA DE DIGITAÇÃO', 'PENDENTE')
        AND DATE_TRUNC('month', data_cadastro) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `;
    
    const [resultAtual, resultAnterior] = await Promise.all([
      pool.query(queryAtual),
      pool.query(queryAnterior)
    ]);
    
    const kpisAtual = resultAtual.rows[0];
    const kpisAnterior = resultAnterior.rows[0];
    
    console.log('KPIs NOVO Atual:', kpisAtual);
    console.log('KPIs NOVO Anterior:', kpisAnterior);
    
    const formattedKPIs = {
      totalContratos: parseInt(kpisAtual.total_contratos) || 0,
      valorReferencia: parseFloat(kpisAtual.valor_referencia_total) || 0,
      valorFinanciado: parseFloat(kpisAtual.valor_financiado_total) || 0,
      valorLiberado: parseFloat(kpisAtual.valor_liberado_total) || 0,
      valorParcela: parseFloat(kpisAtual.valor_parcela_total) || 0,
      clientesUnicos: parseInt(kpisAtual.clientes_unicos) || 0,
      bancosParceiros: parseInt(kpisAtual.bancos_parceiros) || 0,
      // Comparações com mês anterior
      totalContratosAnterior: parseInt(kpisAnterior.total_contratos_anterior) || 0,
      valorReferenciaAnterior: parseFloat(kpisAnterior.valor_referencia_anterior) || 0,
      valorFinanciadoAnterior: parseFloat(kpisAnterior.valor_financiado_anterior) || 0,
      valorLiberadoAnterior: parseFloat(kpisAnterior.valor_liberado_anterior) || 0,
      valorParcelaAnterior: parseFloat(kpisAnterior.valor_parcela_anterior) || 0
    };
    
    res.json(formattedKPIs);
  } catch (error) {
    console.error('Erro ao buscar KPIs NOVO:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs NOVO', details: error.message });
  }
});

// API para evolução mensal da tela PRODUCAO NOVO
app.get('/api/producao/novo/monthly', async (req, res) => {
  try {
    // Primeiro, buscar os dados reais
    const dataQuery = `
      SELECT 
        DATE_TRUNC('month', data_cadastro) as mes,
        COUNT(*) as contratos,
        SUM(valor_financiado) as valor_total
      FROM public.fact_proposals_newcorban 
      WHERE data_cadastro >= '2024-01-01'
        AND status_nome IS NOT NULL
        AND status_nome != ''
      GROUP BY DATE_TRUNC('month', data_cadastro)
      ORDER BY mes
    `;
    
    const dataResult = await pool.query(dataQuery);
    
    // Gerar série temporal completa de 2024-01 até hoje
    const generateMonthlyTimeSeries = () => {
      const months = [];
      const startDate = new Date('2024-01-01');
      const currentDate = new Date();
      
      // Garantir que vamos até o mês atual
      currentDate.setDate(1); // Primeiro dia do mês atual
      
      let date = new Date(startDate);
      while (date <= currentDate) {
        months.push(new Date(date));
        date.setMonth(date.getMonth() + 1);
      }
      
      return months;
    };
    
    const timeSeries = generateMonthlyTimeSeries();
    
    // Criar um mapa dos dados reais para lookup rápido
    const dataMap = new Map();
    dataResult.rows.forEach(row => {
      const key = row.mes.toISOString().substring(0, 7); // YYYY-MM format
      dataMap.set(key, {
        contratos: parseInt(row.contratos),
        valor: parseFloat(row.valor_total) || 0
      });
    });
    
    // Combinar série temporal com dados reais
    const monthlyData = timeSeries.map(month => {
      const key = month.toISOString().substring(0, 7); // YYYY-MM format
      const data = dataMap.get(key) || { contratos: 0, valor: 0 };
      
      return {
        mes: month,
        contratos: data.contratos,
        valor: data.valor
      };
    });
    
    console.log('Dados mensais NOVO encontrados:', monthlyData.length, 'meses (série temporal completa)');
    res.json(monthlyData);
  } catch (error) {
    console.error('Erro ao buscar dados mensais NOVO:', error);
    res.status(500).json({ error: 'Erro ao buscar dados mensais NOVO', details: error.message });
  }
});

// API para produtos da tela PRODUCAO NOVO
app.get('/api/producao/novo/produtos', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(produto_nome, 'Não Informado') as produto_nome,
        COUNT(*) as quantidade,
        SUM(valor_financiado) as valor_total
      FROM public.fact_proposals_newcorban 
      WHERE status_nome IN ('ASSINATURA APROVADA', 'GERANDO CCB', 'GERANDO NOVA CCB', 
                            'AGUARDANDO FORMALIZAÇÃO CCB', 'AGUARDANDO ENVIO DA CCB', 
                            'FILA DE DIGITAÇÃO', 'PENDENTE')
        AND data_cadastro >= '2024-01-01'
      GROUP BY produto_nome
      ORDER BY quantidade DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    const produtosData = result.rows.map(row => ({
      produto_nome: row.produto_nome,
      quantidade: parseInt(row.quantidade),
      valor_total: parseFloat(row.valor_total) || 0
    }));
    
    console.log('Produtos NOVO encontrados:', produtosData.length);
    res.json(produtosData);
  } catch (error) {
    console.error('Erro ao buscar produtos NOVO:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos NOVO', details: error.message });
  }
});

// API para análise de produção por status
app.get('/api/producao/status-analysis', async (req, res) => {
  try {
    const { startDate, endDate, status, banco, equipe } = req.query;
    
    console.log(`[STATUS-ANALYSIS] Query params:`, { startDate, endDate, status, banco, equipe });
    console.log(`[STATUS-ANALYSIS] DB Config:`, { host: dbConfig.host, port: dbConfig.port, database: dbConfig.database });
    
    // Definir período padrão se não fornecido ou vazio
    const today = new Date().toISOString().split('T')[0];
    const start = (startDate && startDate.trim()) ? startDate.trim() : today.substring(0, 7) + '-01'; // Primeiro dia do mês atual
    const end = (endDate && endDate.trim()) ? endDate.trim() : today;
    
    console.log(`[STATUS-ANALYSIS] Final dates - start: ${start}, end: ${end}`);
    
    // Validar formato das datas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return res.status(400).json({ 
        error: 'Formato de data inválido. Use YYYY-MM-DD',
        receivedStart: start,
        receivedEnd: end
      });
    }
    
    let statusQuery, monthlyQuery, params;
    let whereConditions = ['data_cadastro::date >= $1', 'data_cadastro::date <= $2'];
    let paramIndex = 3;
    let queryParams = [start, end];
    
    // Adicionar filtros opcionais
    if (status && status.trim()) {
      whereConditions.push(`status_nome = $${paramIndex}`);
      queryParams.push(status.trim());
      paramIndex++;
    }
    
    if (banco && banco.trim()) {
      whereConditions.push(`banco_nome = $${paramIndex}`);
      queryParams.push(banco.trim());
      paramIndex++;
    }
    
    if (equipe && equipe.trim()) {
      whereConditions.push(`equipe_nome = $${paramIndex}`);
      queryParams.push(equipe.trim());
      paramIndex++;
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Query para breakdown por status
    statusQuery = `
      SELECT 
        COALESCE(status_nome, 'Não Informado') as status,
        COUNT(*) as quantidade,
        SUM(valor_referencia) as valor_referencia,
        SUM(valor_financiado) as valor_financiado,
        SUM(valor_liberado) as valor_liberado,
        SUM(valor_parcela) as valor_parcela
      FROM public.fact_proposals_newcorban 
      ${whereClause}
      GROUP BY status_nome
      ORDER BY quantidade DESC
    `;
    
    console.log(`[STATUS-ANALYSIS] Status Query:`, statusQuery);
    console.log(`[STATUS-ANALYSIS] Query Params:`, queryParams);
    
    // Query para evolução mensal
    monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', data_cadastro) as mes,
        COALESCE(status_nome, 'Não Informado') as status,
        COUNT(*) as quantidade,
        SUM(valor_financiado) as valor_total
      FROM public.fact_proposals_newcorban 
      ${whereClause}
      GROUP BY DATE_TRUNC('month', data_cadastro), status_nome
      ORDER BY mes, quantidade DESC
    `;
    
    params = queryParams;
    
    const [statusResult, monthlyResult] = await Promise.all([
      pool.query(statusQuery, params),
      pool.query(monthlyQuery, params)
    ]);
    
    const response = {
      period: { start, end },
      statusBreakdown: statusResult.rows.map(row => ({
        status: row.status,
        quantidade: parseInt(row.quantidade),
        valorReferencia: parseFloat(row.valor_referencia) || 0,
        valorFinanciado: parseFloat(row.valor_financiado) || 0,
        valorLiberado: parseFloat(row.valor_liberado) || 0,
        valorParcela: parseFloat(row.valor_parcela) || 0
      })),
      monthlyEvolution: monthlyResult.rows.map(row => ({
        mes: row.mes,
        status: row.status,
        quantidade: parseInt(row.quantidade),
        valorTotal: parseFloat(row.valor_total) || 0
      }))
    };
    
    console.log('Análise por status encontrada:', response.statusBreakdown.length, 'status diferentes');
    res.json(response);
  } catch (error) {
    console.error('[STATUS-ANALYSIS] ❌ Erro ao buscar análise por status:');
    console.error('[STATUS-ANALYSIS] Error message:', error.message);
    console.error('[STATUS-ANALYSIS] Error code:', error.code);
    console.error('[STATUS-ANALYSIS] Error detail:', error.detail);
    console.error('[STATUS-ANALYSIS] Full error:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar análise por status', 
      details: error.message,
      code: error.code,
      hint: error.hint
    });
  }
});

// API para KPIs da tela PRODUCAO COMPRA
app.get('/api/producao/compra/kpis', async (req, res) => {
  try {
    // KPIs do mês atual
    const queryAtual = `
      SELECT 
        COUNT(*) as total_contratos,
        SUM(valor_referencia) as valor_referencia_total,
        SUM(valor_financiado) as valor_financiado_total,
        SUM(valor_liberado) as valor_liberado_total,
        SUM(valor_parcela) as valor_parcela_total,
        COUNT(DISTINCT cliente_nome) as clientes_unicos,
        COUNT(DISTINCT banco_nome) as bancos_parceiros
      FROM public.fact_proposals_newcorban 
      WHERE status_nome IN ('PAGO', 'BOLETO QUITADO', 'AVERBADO')
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    // KPIs do mês anterior para comparação
    const queryAnterior = `
      SELECT 
        COUNT(*) as total_contratos_anterior,
        SUM(valor_referencia) as valor_referencia_anterior,
        SUM(valor_financiado) as valor_financiado_anterior,
        SUM(valor_liberado) as valor_liberado_anterior,
        SUM(valor_parcela) as valor_parcela_anterior
      FROM public.fact_proposals_newcorban 
      WHERE status_nome IN ('PAGO', 'BOLETO QUITADO', 'AVERBADO')
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `;
    
    const [resultAtual, resultAnterior] = await Promise.all([
      pool.query(queryAtual),
      pool.query(queryAnterior)
    ]);
    
    const kpisAtual = resultAtual.rows[0];
    const kpisAnterior = resultAnterior.rows[0];
    
    console.log('KPIs COMPRA Atual:', kpisAtual);
    console.log('KPIs COMPRA Anterior:', kpisAnterior);
    
    const formattedKPIs = {
      totalContratos: parseInt(kpisAtual.total_contratos) || 0,
      valorReferencia: parseFloat(kpisAtual.valor_referencia_total) || 0,
      valorFinanciado: parseFloat(kpisAtual.valor_financiado_total) || 0,
      valorLiberado: parseFloat(kpisAtual.valor_liberado_total) || 0,
      valorParcela: parseFloat(kpisAtual.valor_parcela_total) || 0,
      clientesUnicos: parseInt(kpisAtual.clientes_unicos) || 0,
      bancosParceiros: parseInt(kpisAtual.bancos_parceiros) || 0,
      // Comparações com mês anterior
      totalContratosAnterior: parseInt(kpisAnterior.total_contratos_anterior) || 0,
      valorReferenciaAnterior: parseFloat(kpisAnterior.valor_referencia_anterior) || 0,
      valorFinanciadoAnterior: parseFloat(kpisAnterior.valor_financiado_anterior) || 0,
      valorLiberadoAnterior: parseFloat(kpisAnterior.valor_liberado_anterior) || 0,
      valorParcelaAnterior: parseFloat(kpisAnterior.valor_parcela_anterior) || 0
    };
    
    res.json(formattedKPIs);
  } catch (error) {
    console.error('Erro ao buscar KPIs COMPRA:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs COMPRA', details: error.message });
  }
});

// API para evolução mensal da tela PRODUCAO COMPRA
app.get('/api/producao/compra/monthly', async (req, res) => {
  try {
    // Primeiro, buscar os dados reais
    const dataQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as mes,
        COUNT(*) as contratos,
        SUM(valor_financiado) as valor_total
      FROM public.fact_proposals_newcorban 
      WHERE status_nome IN ('PAGO', 'BOLETO QUITADO', 'AVERBADO')
        AND created_at >= '2024-01-01'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mes
    `;
    
    const dataResult = await pool.query(dataQuery);
    
    // Gerar série temporal completa de 2024-01 até hoje
    const generateMonthlyTimeSeries = () => {
      const months = [];
      const startDate = new Date('2024-01-01');
      const currentDate = new Date();
      
      // Garantir que vamos até o mês atual
      currentDate.setDate(1); // Primeiro dia do mês atual
      
      let date = new Date(startDate);
      while (date <= currentDate) {
        months.push(new Date(date));
        date.setMonth(date.getMonth() + 1);
      }
      
      return months;
    };
    
    const timeSeries = generateMonthlyTimeSeries();
    
    // Criar um mapa dos dados reais para lookup rápido
    const dataMap = new Map();
    dataResult.rows.forEach(row => {
      const key = row.mes.toISOString().substring(0, 7); // YYYY-MM format
      dataMap.set(key, {
        contratos: parseInt(row.contratos),
        valor: parseFloat(row.valor_total) || 0
      });
    });
    
    // Combinar série temporal com dados reais
    const monthlyData = timeSeries.map(month => {
      const key = month.toISOString().substring(0, 7); // YYYY-MM format
      const data = dataMap.get(key) || { contratos: 0, valor: 0 };
      
      return {
        mes: month,
        contratos: data.contratos,
        valor: data.valor
      };
    });
    
    console.log('Dados mensais COMPRA encontrados:', monthlyData.length, 'meses (série temporal completa)');
    res.json(monthlyData);
  } catch (error) {
    console.error('Erro ao buscar dados mensais COMPRA:', error);
    res.status(500).json({ error: 'Erro ao buscar dados mensais COMPRA', details: error.message });
  }
});

// API para produtos da tela PRODUCAO COMPRA
app.get('/api/producao/compra/produtos', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(produto_nome, 'Não Informado') as produto_nome,
        COUNT(*) as quantidade,
        SUM(valor_financiado) as valor_total
      FROM public.fact_proposals_newcorban 
      WHERE status_nome IN ('PAGO', 'BOLETO QUITADO', 'AVERBADO')
      GROUP BY produto_nome
      ORDER BY quantidade DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    const produtosData = result.rows.map(row => ({
      produto_nome: row.produto_nome,
      quantidade: parseInt(row.quantidade),
      valor_total: parseFloat(row.valor_total) || 0
    }));
    
    console.log('Produtos COMPRA encontrados:', produtosData.length);
    res.json(produtosData);
  } catch (error) {
    console.error('Erro ao buscar produtos COMPRA:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos COMPRA', details: error.message });
  }
});

// API para detalhes de contratos por status
app.get('/api/producao/status-details', async (req, res) => {
  try {
    const { startDate, endDate, status, banco, equipe, limit } = req.query;
    
    // Definir período padrão se não fornecido
    const start = startDate || '2024-01-01';
    const end = endDate || new Date().toISOString().split('T')[0];
    const maxLimit = parseInt(limit) || 500;
    
    let query, params;
    let whereConditions = [];
    let paramCount = 0;
    
    // Condições base
    whereConditions.push(`data_cadastro >= $${++paramCount}`);
    whereConditions.push(`data_cadastro <= $${++paramCount}`);
    params = [start, end];
    
    // Adicionar filtro de status se fornecido
    if (status && status !== '') {
      whereConditions.push(`status_nome = $${++paramCount}`);
      params.push(status);
    }
    
    // Adicionar filtro de banco se fornecido
    if (banco && banco !== '') {
      whereConditions.push(`banco_nome = $${++paramCount}`);
      params.push(banco);
    }
    
    // Adicionar filtro de equipe se fornecido
    if (equipe && equipe !== '') {
      whereConditions.push(`equipe_nome = $${++paramCount}`);
      params.push(equipe);
    }
    
    // Construir query
    query = `
      SELECT 
        proposta_id as id,
        cliente_nome,
        cliente_cpf as cpf_cnpj,
        banco_nome,
        produto_nome,
        equipe_nome,
        valor_referencia,
        valor_financiado,
        valor_liberado,
        valor_parcela,
        status_nome,
        data_cadastro
      FROM public.fact_proposals_newcorban 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY data_cadastro DESC
      LIMIT $${++paramCount}
    `;
    params.push(maxLimit);
    
    const result = await pool.query(query, params);
    
    const contractDetails = result.rows.map(row => ({
      id: row.id,
      clienteNome: row.cliente_nome,
      cpfCnpj: row.cpf_cnpj,
      bancoNome: row.banco_nome,
      produtoNome: row.produto_nome,
      equipeNome: row.equipe_nome,
      valores: parseFloat(row.valor_financiado) || 0,
      valorReferencia: parseFloat(row.valor_referencia) || 0,
      valorLiberado: parseFloat(row.valor_liberado) || 0,
      valorParcela: parseFloat(row.valor_parcela) || 0,
      statusNome: row.status_nome,
      dataCadastro: row.data_cadastro
    }));
    
    console.log('Detalhes encontrados:', contractDetails.length, 'contratos para filtros:', {
      status: status || 'todos',
      banco: banco || 'todos',
      equipe: equipe || 'todas'
    });
    res.json(contractDetails);
  } catch (error) {
    console.error('Erro ao buscar detalhes por status:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes por status', details: error.message });
  }
});

// API para obter lista de bancos para filtros
app.get('/api/producao/bancos', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT banco_nome
      FROM public.fact_proposals_newcorban 
      WHERE banco_nome IS NOT NULL 
        AND banco_nome != ''
      ORDER BY banco_nome
    `;
    
    const result = await pool.query(query);
    const bancos = result.rows.map(row => row.banco_nome);
    
    res.json(bancos);
  } catch (error) {
    console.error('Erro ao buscar bancos:', error);
    res.status(500).json({ error: 'Erro ao buscar bancos', details: error.message });
  }
});

// API para obter lista de equipes para filtros
app.get('/api/producao/equipes', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT equipe_nome
      FROM public.fact_proposals_newcorban 
      WHERE equipe_nome IS NOT NULL 
        AND equipe_nome != ''
      ORDER BY equipe_nome
    `;
    
    const result = await pool.query(query);
    const equipes = result.rows.map(row => row.equipe_nome);
    
    res.json(equipes);
  } catch (error) {
    console.error('Erro ao buscar equipes:', error);
    res.status(500).json({ error: 'Erro ao buscar equipes', details: error.message });
  }
});

// ===== ROTAS TREYNOR (PERFORMANCE DE EQUIPE) =====

// API para obter performance de equipe
app.get('/api/treynor/team-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const today = new Date().toISOString().split('T')[0];
    const start = (startDate && startDate.trim()) ? startDate.trim() : today.substring(0, 7) + '-01';
    const end = (endDate && endDate.trim()) ? endDate.trim() : today;
    
    console.log(`[TEAM-PERFORMANCE] Período: ${start} a ${end}`);
    
    // Normalizar campo data para incluir registros onde data_status é NULL
    // Usamos COALESCE entre data_status, data_cadastro e created_at (quando disponível)
    const dateExpr = `COALESCE(data_status::date, data_cadastro::date, created_at::date)`;

    // Query 1: Performance agregada por equipe
    const teamQuery = `
      SELECT 
        COALESCE(equipe_nome, 'Sem Equipe') as equipe_nome,
        COUNT(*) as total_propostas,
        SUM(valor_financiado) as valor_total_financiado,
        SUM(valor_liberado) as valor_total_liberado,
        SUM(valor_parcela) as valor_total_parcela,
        SUM(valor_referencia) as valor_total_referencia
      FROM public.fact_proposals_newcorban 
      WHERE ${dateExpr} >= $1 AND ${dateExpr} <= $2
      GROUP BY equipe_nome
      ORDER BY valor_total_financiado DESC
    `;
    
    // Query 2: Breakdown por status
    const statusQuery = `
      SELECT 
        COALESCE(status_nome, 'Não Informado') as status_nome,
        COUNT(*) as quantidade
      FROM public.fact_proposals_newcorban 
      WHERE ${dateExpr} >= $1 AND ${dateExpr} <= $2
      GROUP BY status_nome
      ORDER BY quantidade DESC
    `;
    
    // Query 3: Timeline por período (mensal)
    const timelineQuery = `
      SELECT 
        DATE_TRUNC('month', ${dateExpr})::date as data,
        COUNT(*) as quantidade,
        SUM(valor_financiado) as valor
      FROM public.fact_proposals_newcorban 
      WHERE ${dateExpr} >= $1 AND ${dateExpr} <= $2
      GROUP BY DATE_TRUNC('month', ${dateExpr})
      ORDER BY data ASC
    `;
    
    const queryParams = [start, end];
    
    const [teamResult, statusResult, timelineResult] = await Promise.all([
      pool.query(teamQuery, queryParams),
      pool.query(statusQuery, queryParams),
      pool.query(timelineQuery, queryParams)
    ]);
    
    const response = {
      period: { start, end },
      teamPerformance: teamResult.rows.map(row => ({
        equipeNome: row.equipe_nome,
        totalPropostas: parseInt(row.total_propostas),
        valorTotalFinanciado: parseFloat(row.valor_total_financiado) || 0,
        valorTotalLiberado: parseFloat(row.valor_total_liberado) || 0,
        valorTotalParcela: parseFloat(row.valor_total_parcela) || 0,
        valorTotalReferencia: parseFloat(row.valor_total_referencia) || 0
      })),
      statusBreakdown: statusResult.rows.map(row => ({
        statusNome: row.status_nome,
        quantidade: parseInt(row.quantidade)
      })),
      timeline: timelineResult.rows.map(row => ({
        data: row.data,
        quantidade: parseInt(row.quantidade),
        valor: parseFloat(row.valor) || 0
      }))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar performance de equipe:', error);
    res.status(500).json({ error: 'Erro ao buscar performance', details: error.message });
  }
});

// API para obter propostas detalhadas de uma equipe
app.get('/api/treynor/team-proposals', async (req, res) => {
  try {
    const { startDate, endDate, equipe } = req.query;
    
    const today = new Date().toISOString().split('T')[0];
    const start = (startDate && startDate.trim()) ? startDate.trim() : today.substring(0, 7) + '-01';
    const end = (endDate && endDate.trim()) ? endDate.trim() : today;
    
  // Normalizar data para não perder registros sem data_status
  const dateExprLocal = `COALESCE(data_status::date, data_cadastro::date, created_at::date)`;

  let whereConditions = [`${dateExprLocal} >= $1`, `${dateExprLocal} <= $2`];
  let queryParams = [start, end];
  let paramIndex = 3;
    
    if (equipe && equipe.trim()) {
      whereConditions.push(`equipe_nome = $${paramIndex}`);
      queryParams.push(equipe.trim());
      paramIndex++;
    }
    // Filtros adicionais: status, produto, vendedor, convenio
    if (req.query.status && req.query.status.trim()) {
      whereConditions.push(`status_nome = $${paramIndex}`);
      queryParams.push(req.query.status.trim());
      paramIndex++;
    }
    if (req.query.produto && req.query.produto.trim()) {
      whereConditions.push(`produto_nome = $${paramIndex}`);
      queryParams.push(req.query.produto.trim());
      paramIndex++;
    }
    if (req.query.vendedor && req.query.vendedor.trim()) {
      whereConditions.push(`vendedor_nome = $${paramIndex}`);
      queryParams.push(req.query.vendedor.trim());
      paramIndex++;
    }
    if (req.query.convenio && req.query.convenio.trim()) {
      whereConditions.push(`convenio_nome = $${paramIndex}`);
      queryParams.push(req.query.convenio.trim());
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Limites: padrão 5000, ou passar ?all=true para trazer até cap (segurança)
    const maxLimitLocal = 50000;
    const defaultLimitLocal = 5000;
    const wantAllLocal = req.query.all === 'true' || req.query.all === '1';
    const limitClauseLocal = wantAllLocal ? `LIMIT ${maxLimitLocal}` : `LIMIT ${defaultLimitLocal}`;

    const query = `
      SELECT 
        cliente_nome,
        cliente_cpf,
        valor_financiado,
        valor_liberado,
        valor_parcela,
        valor_referencia,
        status_nome,
        produto_nome,
        convenio_nome,
        data_status,
        data_cadastro,
        vendedor_nome,
        equipe_nome
      FROM public.fact_proposals_newcorban 
      WHERE ${whereClause}
      ORDER BY COALESCE(data_status, data_cadastro, created_at) DESC
      ${limitClauseLocal}
    `;
    
    const result = await pool.query(query, queryParams);
    
    const proposals = result.rows.map(row => ({
      clienteNome: row.cliente_nome,
      clienteCpf: row.cliente_cpf,
      valorFinanciado: parseFloat(row.valor_financiado) || 0,
      valorLiberado: parseFloat(row.valor_liberado) || 0,
      valorParcela: parseFloat(row.valor_parcela) || 0,
      valorReferencia: parseFloat(row.valor_referencia) || 0,
      statusNome: row.status_nome,
      produtoNome: row.produto_nome,
      convenioNome: row.convenio_nome,
      dataStatus: row.data_status,
      dataCadastro: row.data_cadastro,
      vendedorNome: row.vendedor_nome,
      equipeNome: row.equipe_nome
    }));
    
    res.json(proposals);
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    res.status(500).json({ error: 'Erro ao buscar propostas', details: error.message });
  }
});

// API para retornar todas as propostas (filtros avançados)
app.get('/api/treynor/all-proposals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const today = new Date().toISOString().split('T')[0];
    const start = (startDate && startDate.trim()) ? startDate.trim() : today.substring(0, 7) + '-01';
    const end = (endDate && endDate.trim()) ? endDate.trim() : today;

    const dateExpr = `COALESCE(data_status::date, data_cadastro::date, created_at::date)`;

    let where = [`${dateExpr} >= $1`, `${dateExpr} <= $2`];
    let params = [start, end];
    let idx = 3;

    // filtros avançados
    const advancedFilters = ['status', 'produto', 'vendedor', 'convenio', 'equipe'];
    const mapping = {
      status: 'status_nome',
      produto: 'produto_nome',
      vendedor: 'vendedor_nome',
      convenio: 'convenio_nome',
      equipe: 'equipe_nome'
    };

    advancedFilters.forEach((f) => {
      if (req.query[f] && req.query[f].toString().trim()) {
        where.push(`${mapping[f]} = $${idx}`);
        params.push(req.query[f].toString().trim());
        idx++;
      }
    });

    const whereClause = where.join(' AND ');

    // limites de segurança: por padrão 5000, passar ?all=true para cap maior
    const defaultLimit = 5000;
    const capAll = 200000; // limite máximo absoluto
    const wantAll = req.query.all === 'true' || req.query.all === '1';
    const limitClause = wantAll ? `LIMIT ${capAll}` : `LIMIT ${defaultLimit}`;

    const orderBy = req.query.orderBy && req.query.orderBy.trim() ? req.query.orderBy.trim() : 'data_status';
    const orderDir = (req.query.orderDir && req.query.orderDir.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    const sql = `
      SELECT *
      FROM public.fact_proposals_newcorban
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      ${limitClause}
    `;

    const result = await pool.query(sql, params);

    const rows = result.rows.map(row => ({
      clienteNome: row.cliente_nome,
      clienteCpf: row.cliente_cpf,
      valorFinanciado: parseFloat(row.valor_financiado) || 0,
      valorLiberado: parseFloat(row.valor_liberado) || 0,
      valorParcela: parseFloat(row.valor_parcela) || 0,
      valorReferencia: parseFloat(row.valor_referencia) || 0,
      statusNome: row.status_nome,
      produtoNome: row.produto_nome,
      convenioNome: row.convenio_nome,
      dataStatus: row.data_status,
      dataCadastro: row.data_cadastro,
      vendedorNome: row.vendedor_nome,
      equipeNome: row.equipe_nome,
      raw: row
    }));

    res.json({ count: rows.length, rows });
  } catch (error) {
    console.error('Erro ao buscar all-proposals:', error);
    res.status(500).json({ error: 'Erro ao buscar all-proposals', details: error.message });
  }
});

// API para obter lista de equipes para filtros
app.get('/api/treynor/equipes', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT equipe_nome
      FROM public.fact_proposals_newcorban 
      WHERE equipe_nome IS NOT NULL AND equipe_nome != ''
      ORDER BY equipe_nome
    `;
    
    const result = await pool.query(query);
    const equipes = result.rows.map(row => row.equipe_nome);
    res.json(equipes);
  } catch (error) {
    console.error('Erro ao buscar equipes:', error);
    res.status(500).json({ error: 'Erro ao buscar equipes', details: error.message });
  }
});

// ===== ROTAS FINANCEIRAS =====

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Função para ler arquivo Excel
const readExcelFile = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  return workbook;
};

// Função para normalizar texto (remover acentos e espaços)
const normalizeText = (text) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
};

// Função para encontrar coluna por padrão
const findColumnByPattern = (headers, pattern) => {
  const normalizedPattern = normalizeText(pattern);
  const colIndex = headers.findIndex(header => {
    const normalized = normalizeText(header);
    return normalized.includes(normalizedPattern);
  });
  return colIndex !== -1 ? colIndex : null;
};

// GET - Listar meses disponíveis
app.get('/api/financial/list-months', (req, res) => {
  try {
    const financialPath = process.env.FINANCIAL_PATH || 'C:\\Users\\alexsandro.costa\\Documents\\FINANCEIRA';
    
    if (!fs.existsSync(financialPath)) {
      return res.status(404).json({ error: 'Diretório financeiro não encontrado' });
    }

    const files = fs.readdirSync(financialPath)
      .filter(file => file.match(/^\d{4}-\d{2}\.xlsx$/))
      .map(file => file.replace('.xlsx', ''))
      .sort()
      .reverse();

    res.json({ months: files });
  } catch (error) {
    console.error('Erro ao listar meses:', error);
    res.status(500).json({ error: 'Erro ao listar meses', details: error.message });
  }
});

// POST - Ler dados financeiros de um mês
app.post('/api/financial/read', (req, res) => {
  try {
    const { month } = req.body;
    
    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      return res.status(400).json({ error: 'Formato de mês inválido. Use YYYY-MM' });
    }

    const financialPath = process.env.FINANCIAL_PATH || 'C:\\Users\\alexsandro.costa\\Documents\\FINANCEIRA';
    const filePath = path.join(financialPath, `${month}.xlsx`);

    console.log(`[FINANCIAL] Procurando arquivo: ${filePath}`);
    console.log(`[FINANCIAL] FINANCIAL_PATH env: ${process.env.FINANCIAL_PATH}`);
    console.log(`[FINANCIAL] Arquivo existe? ${fs.existsSync(filePath)}`);
    console.log(`[FINANCIAL] Diretório existe? ${fs.existsSync(financialPath)}`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Arquivo não encontrado para o mês ${month}`, path: filePath });
    }

    const workbook = readExcelFile(filePath);
    const result = {
      month,
      receita: { name: 'RECEITA', data: [], total: 0 },
      despesas: { name: 'Despesas', data: [], total: 0 },
      result: 0
    };

    // Processar sheet de RECEITA
    if (workbook.SheetNames.includes('RECEITA')) {
      const receitaSheet = workbook.Sheets['RECEITA'];
      const receitaData = XLSX.utils.sheet_to_json(receitaSheet);
      
      if (receitaData.length > 0) {
        const headers = Object.keys(receitaData[0]);
        const descCol = findColumnByPattern(headers, 'DESCRI');
        const valueCol = findColumnByPattern(headers, 'VALOR');

        if (descCol !== null && valueCol !== null) {
          const descKey = headers[descCol];
          const valueKey = headers[valueCol];

          receitaData.forEach(row => {
            const value = parseFloat(String(row[valueKey] || 0).replace(/[^\d.-]/g, '')) || 0;
            if (value !== 0) {
              result.receita.data.push({
                description: String(row[descKey] || 'Sem descrição'),
                value
              });
              result.receita.total += value;
            }
          });
        }
      }
    }

    // Processar sheet de DESPESAS
    if (workbook.SheetNames.includes('Despesas')) {
      const despesasSheet = workbook.Sheets['Despesas'];
      const despesasData = XLSX.utils.sheet_to_json(despesasSheet);
      
      if (despesasData.length > 0) {
        const headers = Object.keys(despesasData[0]);
        const descCol = findColumnByPattern(headers, 'DESCRI');
        const valueCol = findColumnByPattern(headers, 'VALOR');

        if (descCol !== null && valueCol !== null) {
          const descKey = headers[descCol];
          const valueKey = headers[valueCol];

          despesasData.forEach(row => {
            const value = parseFloat(String(row[valueKey] || 0).replace(/[^\d.-]/g, '')) || 0;
            if (value !== 0) {
              result.despesas.data.push({
                description: String(row[descKey] || 'Sem descrição'),
                value
              });
              result.despesas.total += value;
            }
          });
        }
      }
    }

    // Calcular resultado
    result.result = result.receita.total - result.despesas.total;

    res.json(result);
  } catch (error) {
    console.error('Erro ao ler dados financeiros:', error);
    res.status(500).json({ error: 'Erro ao ler dados financeiros', details: error.message });
  }
});

// POST - Análise com IA (Claude)
app.post('/api/financial/analyze', async (req, res) => {
  try {
    const { question, pageContext, financialData } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Pergunta é obrigatória' });
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  CLAUDE_API_KEY não definida. Retornando resposta mock com contexto de página.');
      return res.json({
        analysis: generateContextAwareAnalysis(question, pageContext, financialData)
      });
    }

    // Preparar dados para o Claude
    const dataContext = financialData ? formatFinancialData(financialData) : 'Nenhum dado financeiro fornecido.';
    const pageInfo = pageContext ? `Página atual: ${pageContext.pageName}\nDescrição: ${pageContext.description}\nDados disponíveis: ${pageContext.availableData?.join(', ') || 'N/A'}` : '';
    
    const prompt = `Você é um analista financeiro expert. O usuário está em: ${pageContext?.pageName || 'uma página do sistema'}

CONTEXTO DA PÁGINA:
${pageInfo}

DADOS FINANCEIROS DISPONÍVEIS:
${dataContext}

PERGUNTA DO USUÁRIO:
${question}

Responda em português. Seja específico, use dados do contexto quando apropriado, e forneça insights acionáveis. Se a pergunta não for sobre os dados disponíveis, responda de forma útil baseado no contexto da página.`;

    // Chamar Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API Error:', error);
      return res.status(response.status).json({
        error: 'Erro ao processar análise com IA',
        details: error
      });
    }

    const data = await response.json();
    const analysis = data.content[0]?.text || 'Desculpe, não consegui gerar uma análise.';

    res.json({ analysis });
  } catch (error) {
    console.error('Erro na análise financeira:', error);
    res.status(500).json({
      error: 'Erro ao analisar dados financeiros',
      details: error.message
    });
  }
});

// Função auxiliar para formatar dados financeiros para o Claude
function formatFinancialData(data) {
  const total_receita = data.receita?.total || 0;
  const total_despesa = data.despesas?.total || 0;
  const resultado = data.result || 0;
  const margem = total_receita > 0 ? ((resultado / total_receita) * 100).toFixed(2) : 0;

  let formatted = `Período: ${data.month || 'N/A'}\n`;
  formatted += `\n📊 RESUMO:\n`;
  formatted += `Total Receita: R$ ${total_receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  formatted += `Total Despesa: R$ ${total_despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  formatted += `Saldo Líquido: R$ ${resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  formatted += `Margem: ${margem}%\n`;

  if (data.receita?.data?.length > 0) {
    formatted += `\n💰 TOP 5 RECEITAS:\n`;
    data.receita.data
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .forEach((item, idx) => {
        const itemValue = item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        formatted += `${idx + 1}. ${item.description}: R$ ${itemValue}\n`;
      });
  }

  if (data.despesas?.data?.length > 0) {
    formatted += `\n💸 TOP 5 DESPESAS:\n`;
    data.despesas.data
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .forEach((item, idx) => {
        const itemValue = item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        formatted += `${idx + 1}. ${item.description}: R$ ${itemValue}\n`;
      });
  }

  return formatted;
}

// Função auxiliar para gerar resposta mock com contexto de página (quando Claude API não está configurada)
function generateContextAwareAnalysis(question, pageContext, financialData) {
  const lower = question.toLowerCase().trim();
  const pageName = pageContext?.pageName || 'Sistema';
  const isFinancialPage = pageContext?.isFinancialPage || false;

  // Helper: verificar se a pergunta contém alguma palavra-chave
  const hasKeywords = (keywords) => keywords.some(k => lower.includes(k));
  
  // Helper: normalizar a pergunta (remover caracteres especiais, múltiplos espaços)
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  // ===== ANNOUNCEMENT: ALWAYS SHOW CURRENT PAGE AS PER USER REQUIREMENT =====
  // User requirement: "identify the tela que estou logo no começo" (identify screen right from start)
  const pageAnnouncement = `📍 **Você está em: ${pageName}**\n`;
  
  // ===== RESPOSTAS GENÉRICAS (qualquer página) =====
  
  if (hasKeywords(['qual', 'página', 'tela'])) {
    return pageAnnouncement + `\n${pageContext?.description || 'Página do sistema'}\n\n✨ **Dados disponíveis:**\n${pageContext?.availableData?.map(d => `• ${d}`).join('\n') || '• Informações gerais'}`;
  }

  if (hasKeywords(['o que', 'oq', 'pode fazer', 'quais dados', 'o que você faz', 'capabilities'])) {
    const dataList = pageContext?.availableData?.map(d => `• ${d}`).join('\n') || '• Informações da página';
    return pageAnnouncement + `\n\nℹ️  Nesta página posso ajudar com:\n\n${dataList}\n\n💡 Faça uma pergunta específica e receba uma resposta detalhada! 😊`;
  }

  if (hasKeywords(['oi', 'olá', 'opa', 'e aí', 'hey', 'opa bot'])) {
    return pageAnnouncement + `\n👋 Oi! Estou aqui para ajudar nesta página. \n\n💬 Faça uma pergunta e receba respostas rápidas e precisas!`;
  }

  if (hasKeywords(['ajuda', 'help', 'como usar', 'como funciona', 'tutorial', 'como fazer', 'me ajuda'])) {
    const suggestions = pageContext?.availableData?.slice(0, 3).map((d, i) => `  ${i + 1}. ${d}`).join('\n') || '  • Informações gerais';
    return pageAnnouncement + `\n🆘 **Estou aqui para ajudar!**\n\nNesta página, posso fornecer informações sobre:\n\n${suggestions}\n\n📝 Você pode perguntar:\n• Dados e estatísticas\n• Informações sobre itens específicos\n• Análises e relatórios\n• Como interpretar os dados\n\nFaça sua pergunta! 🚀`;
  }

  // ===== RESPOSTAS ESPECÍFICAS PARA PÁGINAS FINANCEIRAS =====

  if (isFinancialPage && financialData) {
    const total_receita = financialData.receita?.total || 0;
    const total_despesa = financialData.despesas?.total || 0;
    const resultado = financialData.result || 0;
    const margem = total_receita > 0 ? ((resultado / total_receita) * 100).toFixed(2) : 0;

    // Formatar valores
    const receitaFormatted = total_receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const despesaFormatted = total_despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const resultadoFormatted = resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const percentualDespesa = total_receita > 0 ? ((total_despesa / total_receita) * 100).toFixed(1) : 0;

    const topDespesas = financialData.despesas?.data?.sort((a, b) => b.value - a.value).slice(0, 5) || [];
    const topReceitas = financialData.receita?.data?.sort((a, b) => b.value - a.value).slice(0, 5) || [];

    // ===== MARGEM / LUCRO / RESULTADO =====
    if (hasKeywords(['margem', 'lucro', 'ganho', 'ganhou', 'profit', 'rentabil', 'return', 'roi', 'saldo liquido', 'quanto ganhei', 'resultado'])) {
      let emoji = '✅';
      let statusText = 'Muito boa!';
      if (margem <= 0) { emoji = '❌'; statusText = 'Negativa'; }
      else if (margem < 10) { emoji = '⚠️'; statusText = 'Baixa'; }
      else if (margem < 20) { emoji = '✅'; statusText = 'Boa'; }
      
      return `📊 **Análise de Margem & Resultado - ${financialData.month}**\n\n✨ **Margem Líquida: ${margem}%** ${emoji}\n   Status: ${statusText}\n\n💰 **Saldo Líquido: R$ ${resultadoFormatted}**\n\n📈 Detalhes:\n• Receita: R$ ${receitaFormatted}\n• Despesa: R$ ${despesaFormatted}\n• Cada R$ 100 em receita = R$ ${margem} de lucro\n\n${margem > 20 ? '🎉 Desempenho excelente! Continue assim!' : margem > 10 ? '👍 Performance dentro do esperado' : '⚠️ Recomendo revisar as despesas'}`;
    }

    // ===== DESPESAS / GASTOS / CUSTOS =====
    if (hasKeywords(['despesa', 'gasto', 'custo', 'consumo', 'onde gast', 'maior gast', 'principal gast', 'custo alto', 'despesa alta', 'top despesa', 'maiores despesas', 'reduzir', 'economizar', 'cortar'])) {
      let resposta = `💸 **Análise de Despesas - ${financialData.month}**\n\n`;
      resposta += `📌 **Total Gasto: R$ ${despesaFormatted}**\n`;
      resposta += `📊 Representa **${percentualDespesa}%** da sua receita\n\n`;
      
      if (topDespesas.length > 0) {
        resposta += `� **Top 5 Maiores Despesas:**\n`;
        topDespesas.forEach((item, idx) => {
          const percentual = ((item.value / total_despesa) * 100).toFixed(1);
          const barSize = Math.floor(percentual / 5);
          const bar = '█'.repeat(Math.max(1, barSize));
          resposta += `${idx + 1}. ${item.description}\n   R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentual}%) ${bar}\n`;
        });
      }

      if (hasKeywords(['reduzir', 'economizar', 'cortar', 'diminuir'])) {
        resposta += `\n💡 **Sugestões para Reduzir Custos:**\n`;
        if (topDespesas.length > 0) {
          resposta += `• Foque na maior: ${topDespesas[0].description} (R$ ${topDespesas[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})\n`;
        }
        resposta += `• Negocie com fornecedores\n• Elimine despesas redundantes\n• Automatize processos\n• Ideal: gastos < 70% da receita`;
      }
      
      return resposta;
    }

    // ===== RECEITAS / FATURAMENTO / VENDAS =====
    if (hasKeywords(['receita', 'faturamento', 'venda', 'entrada', 'ganho', 'revenue', 'income', 'total recebido', 'quanto recebi', 'maior receita', 'top receita'])) {
      let resposta = `💰 **Análise de Receitas - ${financialData.month}**\n\n`;
      resposta += `📌 **Total Recebido: R$ ${receitaFormatted}**\n\n`;
      
      if (topReceitas.length > 0) {
        resposta += `� **Top 5 Maiores Receitas:**\n`;
        topReceitas.forEach((item, idx) => {
          const percentual = ((item.value / total_receita) * 100).toFixed(1);
          const barSize = Math.floor(percentual / 5);
          const bar = '█'.repeat(Math.max(1, barSize));
          resposta += `${idx + 1}. ${item.description}\n   R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentual}%) ${bar}\n`;
        });
      }
      
      resposta += `\n📊 ${topReceitas.length > 0 ? `Sua receita principal é: **${topReceitas[0].description}**` : 'Sem dados de receita'}`;
      
      return resposta;
    }

    // ===== COMPARATIVO / ANÁLISE GERAL =====
    if (hasKeywords(['como vai', 'como tá', 'status', 'resumo', 'geral', 'overview', 'tudo bem', 'como está', 'me resume', 'analytics'])) {
      let statusEmoji = '✅';
      let statusText = 'Positivo';
      let analise = `🎉 Lucro de **R$ ${resultadoFormatted}**.`;
      
      if (resultado < 0) {
        statusEmoji = '❌';
        statusText = 'Negativo';
        analise = `⚠️ Prejuízo de **R$ ${Math.abs(resultado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.`;
      } else if (resultado === 0) {
        statusEmoji = '➖';
        statusText = 'Equilibrado';
        analise = `Receitas = Despesas`;
      }
      
      return `💼 **RESUMO EXECUTIVO - ${financialData.month}**\n\n${statusEmoji} **Status: ${statusText}** ${analise}\n\n📊 **Números Principais:**\n• Receita: R$ ${receitaFormatted}\n• Despesa: R$ ${despesaFormatted}\n• Margem: ${margem}%\n• Despesas representam ${percentualDespesa}% da receita\n\n${margem > 15 ? '✅ Saúde financeira boa' : '⚠️ Revisar despesas recomendado'}`;
    }

    // ===== COMPARAÇÃO / DIFERENÇA =====
    if (hasKeywords(['vs', 'versus', 'comparar', 'diferença', 'receita menos', 'receita menos despesa'])) {
      const diferenca = total_receita - total_despesa;
      const diferencaFormatted = diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      return `📊 **Comparativo - ${financialData.month}**\n\n💰 Receita: **R$ ${receitaFormatted}**\n➖\n💸 Despesa: **R$ ${despesaFormatted}**\n━━━━━━━━━\n📈 Resultado: **R$ ${diferencaFormatted}**\n\nVariação: ${diferenca > 0 ? '✅ Positiva' : '❌ Negativa'}`;
    }

    // ===== CRESCIMENTO / POTENCIAL =====
    if (hasKeywords(['crescer', 'aumentar', 'expandir', 'potencial', 'oportunidad', 'melhorar', 'otimizar', 'estratég'])) {
      const percentualLucro = parseFloat(margem);
      const potencialOtimizado = (percentualLucro * 1.5).toFixed(1);
      return `� **Potencial de Crescimento - ${financialData.month}**\n\n📊 Margem Atual: ${percentualLucro}%\n🎯 Margem Possível: ${potencialOtimizado}%\n\n💡 **Estratégias:**\n1. **Aumentar Receita** (atual: R$ ${receitaFormatted})\n   - Expandir canais de venda\n   - Novos produtos/serviços\n\n2. **Reduzir Despesas** (atual: R$ ${despesaFormatted})\n   - Renegociar fornecedores\n   - Eliminar custos desnecessários\n\n3. **Otimizar Operações**\n   - Automações\n   - Eficiência de processos\n\n💰 Com essas melhorias: R$ ${(resultado * 1.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${potencialOtimizado}%)`;
    }

    // ===== PERGUNTA GERAL SOBRE DADOS =====
    if (hasKeywords(['qual', 'quais', 'quanto', 'quanto é', 'qual é', 'me mostre', 'me mostra', 'dados', 'informação', 'info'])) {
      return `� **RESUMO FINANCEIRO - ${financialData.month}**\n\n💰 Receita: R$ ${receitaFormatted}\n� Despesa: R$ ${despesaFormatted}\n📊 Saldo: R$ ${resultadoFormatted}\n📉 Margem: ${margem}%\n📌 Despesa/Receita: ${percentualDespesa}%\n\n❓ **Perguntas que você pode fazer:**\n• "Qual minha maior despesa?"\n• "Quanto faturei?"\n• "Como está meu resultado?"\n• "Posso reduzir custos?"\n• "Qual minha margem de lucro?"`;
    }

    // Fallback: resumo se não reconhecer a pergunta
    const resumo = `📋 **RESUMO EXECUTIVO - ${financialData.month}**\n\n💰 Receita: R$ ${receitaFormatted}\n💸 Despesa: R$ ${despesaFormatted}\n📊 Saldo: R$ ${resultadoFormatted}\n📉 Margem: ${margem}%\n\n💡 **Tente perguntar:**\n• "Qual minha maior despesa?"\n• "Qual foi minha receita?"\n• "Como está meu resultado?"\n• "Como posso reduzir custos?"\n• "Qual a margem de lucro?"`;
    return resumo;
  }

  // ===== RESPOSTAS PARA NÃO-FINANCEIRAS =====

  // Função auxiliar para analisar dados genéricos de qualquer tela
  const analyzeGenericData = (data) => {
    if (!data || typeof data !== 'object') return null;

    try {
      // Detectar se são arrays (tabelas de dados)
      if (Array.isArray(data)) {
        const itemCount = data.length;
        const hasNumericFields = data.some(item => 
          Object.values(item).some(val => !isNaN(val) && val !== '' && val !== null)
        );
        
        if (hasNumericFields && itemCount > 0) {
          // Encontrar campos numéricos
          const firstItem = data[0];
          const numericFields = Object.keys(firstItem).filter(key =>
            data.some(item => !isNaN(item[key]) && item[key] !== '')
          );

          if (numericFields.length > 0) {
            let summary = `📊 **Análise de Dados** (${itemCount} registros)\n\n`;
            
            // Para cada campo numérico, calcular totais
            numericFields.forEach(field => {
              const values = data
                .map(item => parseFloat(item[field]))
                .filter(v => !isNaN(v));
              
              if (values.length > 0) {
                const total = values.reduce((a, b) => a + b, 0);
                const avg = (total / values.length).toFixed(2);
                const max = Math.max(...values);
                const min = Math.min(...values);
                
                summary += `\n💠 **${field}:**\n`;
                summary += `  • Total: ${total.toLocaleString('pt-BR')}\n`;
                summary += `  • Média: ${avg}\n`;
                summary += `  • Máximo: ${max}\n`;
                summary += `  • Mínimo: ${min}\n`;
              }
            });

            return summary;
          }
        }

        return `📋 Tabela com ${itemCount} registros encontrados`;
      }

      // Se é objeto com números, fazer análise
      const numValues = Object.entries(data)
        .filter(([, val]) => !isNaN(val) && val !== '' && val !== null)
        .reduce((acc, [key, val]) => {
          acc[key] = parseFloat(val);
          return acc;
        }, {});

      if (Object.keys(numValues).length > 0) {
        let summary = `📊 **Análise de Dados Disponíveis:**\n\n`;
        Object.entries(numValues).forEach(([key, val]) => {
          summary += `• ${key}: ${val.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}\n`;
        });
        return summary;
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  // Análise genérica de dados se disponível
  if (financialData && !isFinancialPage) {
    const genericAnalysis = analyzeGenericData(financialData);
    if (genericAnalysis) {
      return genericAnalysis;
    }
  }

  // Respostas específicas por tipo de página
  if (pageName.includes('Licitação')) {
    if (hasKeywords(['ativa', 'aberta', 'andamento', 'progress', 'status'])) {
      return `🏛️ Na página de **Licitações**:\n\n**Licitações Ativas:**\n• Status em andamento\n• Documentação em processo\n• Prazos a cumprir\n\nFaça uma pergunta específica sobre uma licitação! 📋`;
    }
    if (hasKeywords(['concluida', 'finalizada', 'pronta', 'resultado', 'vencedor'])) {
      return `✅ Na página de **Licitações**:\n\n**Licitações Concluídas:**\n• Processos finalizados\n• Resultados publicados\n• Vencedores selecionados\n\nQual licitação específica você quer analisar? 📋`;
    }
    if (hasKeywords(['documentação', 'documento', 'arquivo', 'anexo', 'papel'])) {
      return `📄 Na página de **Licitações**:\n\n**Documentação:**\n• Editais disponíveis\n• Propostas apresentadas\n• Arquivos anexados\n• Registros de conformidade\n\nQual documento você procura? 📋`;
    }
    if (hasKeywords(['prazo', 'data', 'quando', 'vencimento', 'deadline'])) {
      return `⏰ Na página de **Licitações**:\n\n**Prazos Importantes:**\n• Datas de abertura\n• Prazos para propostas\n• Datas de resultado\n• Cronograma do processo\n\nQual prazo você quer verificar? 📋`;
    }
    return `🏛️ Na página de **Licitações**, posso ajudar com:\n\n✓ Licitações ativas\n✓ Status de andamento\n✓ Documentação\n✓ Prazos e datas\n✓ Processosde licitação\n\nFaça uma pergunta específica! 📋`;
  }

  if (pageName.includes('Usuário') || pageName.includes('User')) {
    if (hasKeywords(['permissão', 'acesso', 'role', 'grupo', 'função', 'direito'])) {
      return `🔐 Na página de **Usuários**:\n\n**Permissões e Acessos:**\n• Roles disponíveis\n• Níveis de acesso\n• Permissões por tela\n• Grupos de usuários\n\nQual usuário ou permissão você quer verificar? 🔐`;
    }
    if (hasKeywords(['ativo', 'inativo', 'bloqueado', 'status', 'habilitado'])) {
      return `👥 Na página de **Usuários**:\n\n**Status dos Usuários:**\n• Usuários ativos\n• Usuários inativos\n• Usuários bloqueados\n• Histórico de mudanças\n\nQual usuário você quer analisar? 👥`;
    }
    return `👥 Na página de **Usuários**, posso ajudar com:\n\n✓ Permissões e acessos\n✓ Status de usuários\n✓ Roles e funções\n✓ Histórico de atividades\n✓ Controle de permissões\n\nFaça uma pergunta específica! 🔐`;
  }

  if (pageName.includes('Extrato') || pageName.includes('Transação') || pageName.includes('Bancário')) {
    if (hasKeywords(['saldo', 'total', 'quanto', 'consolidado', 'resultado'])) {
      return pageAnnouncement + `💰 **ANÁLISE DE SALDO:**\n\nDados disponíveis nesta página:\n• **saldo_posterior** - Saldo atualizado após cada transação\n• **transaction_date** - Data e hora de cada movimentação\n• **amount** - Valor de cada transação\n• **type** - Tipo: crédito (🟢) ou débito (🔴)\n\n💡 Faça perguntas como:\n• "Qual é meu saldo atual?"\n• "Qual foi a última movimentação?"\n• "Quanto entrou ontem?"\n• "Qual minha maior transação?"\n\nQual período você quer analisar? 💰`;
    }
    if (hasKeywords(['entrada', 'recebimento', 'crédito', 'depósito', 'ganho'])) {
      return pageAnnouncement + `🟢 **ENTRADAS/CRÉDITOS:**\n\nDados que posso analisar:\n• **type='credit'** - Todas as transações de crédito\n• **nome_pagador** - Quem fez o pagamento\n• **amount** - Valor recebido\n• **pix_free_description** - Descrição PIX (se aplicável)\n• **transaction_date** - Quando recebeu\n\n📊 Posso informar:\n• Total de entradas no período\n• Maiores recebimentos\n• Tendência de receitas\n• Origem dos pagamentos\n\nQual período você quer analisar? 📈`;
    }
    if (hasKeywords(['saída', 'débito', 'pagamento', 'transferência', 'gasto'])) {
      return pageAnnouncement + `🔴 **SAÍDAS/DÉBITOS:**\n\nDados que posso analisar:\n• **type='debit'** - Todas as transações de débito\n• **beneficiario** - Quem recebeu o pagamento\n• **banco_beneficiario** - Banco de destino\n• **amount** - Valor pago\n• **description** - Motivo do pagamento\n\n📊 Posso informar:\n• Total de saídas no período\n• Maiores pagamentos\n• Destinatários frequentes\n• Análise por banco\n\nQual período você quer analisar? 📉`;
    }
    if (hasKeywords(['banco', 'qual', 'onde', 'instituição'])) {
      return pageAnnouncement + `🏦 **ANÁLISE POR BANCO:**\n\nDados disponíveis:\n• **personal_name** - Titulares das contas\n• **banco_beneficiario** - Banco de destino (para débitos)\n• **transaction_date** - Histórico de movimentações\n• **amount** - Valores movimentados\n\n📊 Posso mostrar:\n• Movimentações por banco\n• Saldo consolidado\n• Instituições mais usadas\n• Histórico de transações\n\nQual banco você quer verificar? 🏦`;
    }
    return pageAnnouncement + `💳 **EXTRATO FINANCEIRO**\n\nNesta página você tem acesso aos seus dados:\n${pageContext?.availableData?.map(d => `• ${d}`).join('\n') || `• transaction_date (data/hora)
• type (crédito/débito)
• amount (valor)
• saldo_posterior (saldo após transação)
• personal_name (titular)
• beneficiario (destinatário)
• banco_beneficiario (banco)`}\n\n💡 Faça uma pergunta específica! 💰`;
  }

  if (pageName.includes('Fatura') || pageName.includes('Invoice')) {
    if (hasKeywords(['pendente', 'aberta', 'em aberto', 'não paga', 'vencida'])) {
      return `⏳ Na página de **Faturas**:\n\n**Faturas Pendentes:**\n• Faturas em aberto\n• Faturas vencidas\n• Valores a receber\n• Datas de vencimento\n\nQual período você quer ver? ⏳`;
    }
    if (hasKeywords(['paga', 'pago', 'recebida', 'liquidada', 'quitada'])) {
      return `✅ Na página de **Faturas**:\n\n**Faturas Pagas:**\n• Faturas liquidadas\n• Data de pagamento\n• Histórico de recebimentos\n• Total recebido\n\nQual período você quer ver? ✅`;
    }
    if (hasKeywords(['valor', 'quanto', 'total', 'quanto vale'])) {
      return `💵 Na página de **Faturas**:\n\n**Análise de Valores:**\n• Total em aberto\n• Total pago\n• Média por fatura\n• Maior fatura\n\nQual tipo de fatura? 💵`;
    }
    return `🧾 Na página de **Faturas**, posso ajudar com:\n\n✓ Faturas pendentes\n✓ Faturas pagas\n✓ Análise de valores\n✓ Datas de vencimento\n✓ Status de pagamento\n\nFaça uma pergunta específica! 💳`;
  }

  if (pageName.includes('Proposta')) {
    if (hasKeywords(['ativa', 'aberta', 'andamento', 'pendente'])) {
      return `📋 Na página de **Propostas**:\n\n**Propostas Ativas:**\n• Propostas em análise\n• Aguardando resposta\n• Em negociação\n• Próximos passos\n\nQual proposta você quer analisar? 📋`;
    }
    if (hasKeywords(['aprovada', 'aceita', 'ganha', 'ganho'])) {
      return `✅ Na página de **Propostas**:\n\n**Propostas Aprovadas:**\n• Propostas ganhas\n• Contratos confirmados\n• Receita gerada\n• Histórico de aprovações\n\nQual proposta você quer ver? ✅`;
    }
    if (hasKeywords(['rejeitada', 'perdida', 'cancelada', 'recusada'])) {
      return `❌ Na página de **Propostas**:\n\n**Propostas Rejeitadas:**\n• Propostas perdidas\n• Motivos de rejeição\n• Propostas canceladas\n• Histórico de perdas\n\nQual proposta você quer analisar? ❌`;
    }
    if (hasKeywords(['conversion', 'taxa', 'percentual', 'quanto'])  ) {
      return `📊 Na página de **Propostas**:\n\n**Análise de Conversion:**\n• Taxa de aprovação\n• Valor total em propostas\n• Valor aprovado\n• Taxa de sucesso\n\nQual período? 📊`;
    }
    return `📋 Na página de **Propostas**, posso ajudar com:\n\n✓ Propostas ativas\n✓ Propostas aprovadas\n✓ Propostas rejeitadas\n✓ Taxa de conversion\n✓ Análise de valores\n\nFaça uma pergunta específica! 📋`;
  }

  if (pageName.includes('Produção') || pageName.includes('Production')) {
    if (hasKeywords(['novo', 'nova produção', 'novo negócio'])) {
      return `🆕 Na página de **Produção**:\n\n**Nova Produção:**\n• Novos contratos\n• Novos produtos\n• Pipeline de negócios\n• Forecast\n\nQual período você quer ver? 🆕`;
    }
    if (hasKeywords(['tendência', 'trend', 'crescimento', 'evolução'])) {
      return `📈 Na página de **Produção**:\n\n**Tendências:**\n• Gráfico de evolução\n• Comparativo mensal\n• Taxa de crescimento\n• Projeções\n\nQual métrica você quer analisar? 📈`;
    }
    if (hasKeywords(['compra', 'volume', 'quantidade', 'quantidade de compras'])) {
      return `🛒 Na página de **Produção**:\n\n**Análise de Compras:**\n• Volume de compras\n• Quantidade de produtos\n• Fornecedores principais\n• Tendência de consumo\n\nQual período? 🛒`;
    }
    return `📊 Na página de **Produção**, posso ajudar com:\n\n✓ Nova produção\n✓ Tendências de crescimento\n✓ Volume de compras\n✓ Analytics avançado\n✓ Comparativos\n\nFaça uma pergunta específica! 📊`;
  }

  if (pageName.includes('Funil')) {
    if (hasKeywords(['estágio', 'etapa', 'fase', 'progresso'])) {
      return `🔀 Na página de **Funil de Vendas**:\n\n**Estágios do Funil:**\n• Leads identificados\n• Prospecção\n• Proposta enviada\n• Negociação\n• Fechamento\n\nQual estágio você quer analisar? 🔀`;
    }
    if (hasKeywords(['conversion', 'taxa', 'percentual', 'quanto sai'])) {
      return `📉 Na página de **Funil de Vendas**:\n\n**Taxa de Conversão:**\n• Conversão por etapa\n• Funil de progressão\n• Histórico de taxas\n• Benchmark\n\nQual período? 📉`;
    }
    if (hasKeywords(['valor', 'pipeline', 'quanto', 'em aberto'])) {
      return `💰 Na página de **Funil de Vendas**:\n\n**Valor em Pipeline:**\n• Total em aberto\n• Valor por estágio\n• Valor médio\n• Oportunidades maiores\n\nQual período? 💰`;
    }
    return `🔀 Na página de **Funil de Vendas**, posso ajudar com:\n\n✓ Estágios do funil\n✓ Taxa de conversão\n✓ Valor em pipeline\n✓ Oportunidades abertas\n✓ Análise de performance\n\nFaça uma pergunta específica! 🔀`;
  }

  // ===== DESEMBOLSOS =====
  if (pageName.includes('Desembolso') || pageName.includes('desembolso')) {
    if (hasKeywords(['total', 'liberado', 'quanto', 'consolidado'])) {
      return pageAnnouncement + `💰 **ANÁLISE DE DESEMBOLSOS:**\n\nDados disponíveis:\n• **total_liberado** - Valor total liberado\n• **total_solicitado** - Valor total solicitado\n• **liberados, pendentes, reprovados** - Contagens de status\n• **eficiencia_liberacao** - Taxa de eficiência (%)\n• **ticket_medio** - Valor médio por contrato\n• **taxa_media, taxa_real, taxa_cet** - Taxas aplicadas\n\n💡 Perguntas:\n• "Qual o total liberado?"\n• "Qual a eficiência de liberação?"\n• "Quantos contratos?"\n• "Qual o ticket médio?"\n• "Qual a taxa média?"\n\nQual período? 💰`;
    }
    if (hasKeywords(['eficiência', 'eficiencia', 'taxa de liberação', 'desempenho'])) {
      return pageAnnouncement + `📊 **EFICIÊNCIA DE LIBERAÇÃO:**\n\nCampo analisado: **eficiencia_liberacao**\n\nEsta métrica mostra:\n• Percentual de contratos liberados vs total\n• Velocidade de processamento\n• Qualidade de aprovação\n\n✓ Excelente: > 80%\n✓ Boa: 60-80%\n⚠️ Precisa melhorar: < 60%\n\nDeseja analisar por período, produto ou instituição? 📊`;
    }
    if (hasKeywords(['taxa', 'rate', 'juros', 'percentual'])) {
      return pageAnnouncement + `💹 **ANÁLISE DE TAXAS:**\n\nTaxas disponíveis nesta página:\n• **taxa** - Taxa comercial\n• **taxa_real** - Taxa real (deflacionada)\n• **taxa_cet** - Taxa Efetiva ao Consumidor\n• **taxa_media** - Média das taxas\n\n💡 Posso informar:\n• Taxa média geral\n• Taxas por produto\n• Taxas por instituição\n• Comparativo de períodos\n\nQual análise você quer? 💹`;
    }
    if (hasKeywords(['status', 'liberado', 'pendente', 'reprovado'])) {
      return pageAnnouncement + `📋 **ANÁLISE DE STATUS:**\n\nStatus disponíveis em **status_final**:\n• **liberados** - Contratos aprovados e liberados\n• **pendentes** - Aguardando processamento\n• **reprovados** - Contratos rejeitados\n\n💡 Posso mostrar:\n• Contagem por status\n• Percentual de aprovação\n• Distribuição temporal\n• Motivos de rejeição\n\nQual status você quer analisar? 📋`;
    }
    return pageAnnouncement + `💼 **HISTÓRICO DE DESEMBOLSOS**\n\nCampos disponíveis:\n${pageContext?.availableData?.map(d => `• ${d}`).join('\n') || `• vl_financ (valor financiado)
• vlr_tac, vlr_iof (taxas)
• vlr_liberado (liberado)
• eficiencia_liberacao (%)
• taxa_media, taxa_real, taxa_cet
• total_contratos, liberados, pendentes, reprovados`}\n\n💡 Faça uma pergunta específica! 💰`;
  }

  // ===== PROPOSTAS =====
  if (pageName.includes('Proposta')) {
    if (hasKeywords(['ativa', 'aberta', 'andamento', 'pendente', 'em_andamento'])) {
      return pageAnnouncement + `📋 **PROPOSTAS EM ANDAMENTO:**\n\nCampos analisados:\n• **status_processo='em_andamento'** - Propostas ativas\n• **cliente, email, telefone** - Dados de contato\n• **valor_total, valor_liquido** - Valores\n• **data_criacao, data_contrato** - Datas\n\n💡 Posso informar:\n• Total de propostas em aberto\n• Valores totais em negociação\n• Tempo médio em análise\n• Propostas mais antigas\n\nQual período? 📋`;
    }
    if (hasKeywords(['aprovada', 'aceita', 'ganha', 'ganho', 'finalizadas'])) {
      return pageAnnouncement + `✅ **PROPOSTAS APROVADAS:**\n\nCampos analisados:\n• **status_processo='finalizadas'** - Aprovadas\n• **valor_total, valor_liquido** - Valores gerados\n• **data_finalizacao** - Quando fechou\n• **canal_venda** - Origem da venda\n\n💡 Posso mostrar:\n• Total de propostas ganhas\n• Valor total gerado\n• Taxa de conversão\n• Valor médio por proposta\n• Canal mais produtivo\n\nQual período? ✅`;
    }
    if (hasKeywords(['rejeitada', 'perdida', 'cancelada', 'recusada', 'canceladas'])) {
      return pageAnnouncement + `❌ **PROPOSTAS REJEITADAS:**\n\nCampos analisados:\n• **status_processo='canceladas' ou 'pendentes'** - Não aprovadas\n• **valor_total** - Valor em risco\n• **data_criacao** - Quando foi criada\n• **cliente** - Quem rejeitou\n\n💡 Análises:\n• Total de propostas perdidas\n• Valor em risco\n• Taxa de rejeição\n• Propostas com mais tempo aberto\n\nQual período? ❌`;
    }
    if (hasKeywords(['valor', 'conversion', 'taxa', 'percentual', 'quanto']) && hasKeywords(['approval', 'aprovação', 'conversion'])) {
      return pageAnnouncement + `📊 **TAXA DE CONVERSÃO:**\n\nCálculos disponíveis:\n• **finalizadas / total_propostas** - Taxa geral (%)\n• **valor_total aprovado vs solicitado** - Valor aprovado\n• **clientes_unicos** - Diversificação\n• **valor_liquido vs valor_total** - Margem média\n\n💡 KPI disponível: **KPIData**\n• total_propostas\n• finalizadas, em_andamento, pendentes, canceladas\n• valor_total, valor_liquido, valor_medio\n\nQual análise? 📊`;
    }
    if (hasKeywords(['cliente', 'contato', 'email', 'telefone'])) {
      return pageAnnouncement + `👥 **DADOS DE CLIENTES:**\n\nCampos disponíveis:\n• **cliente** - Nome da empresa\n• **email** - Email de contato\n• **telefone** - Telefone\n• **clientes_unicos** - Contagem de clientes diferentes\n\n💡 Posso informar:\n• Clientes com mais propostas\n• Clientes mais recentes\n• Clientes top por valor\n• Histórico de cliente\n\nQual cliente? 👥`;
    }
    return pageAnnouncement + `📋 **GESTÃO DE PROPOSTAS**\n\nDados disponíveis:\n${pageContext?.availableData?.map(d => `• ${d}`).join('\n') || `• cliente, telefone, email
• valor_total, valor_liquido
• qtd_parcelas, canal_venda
• status_processo, data_finalizacao
• KPI: finalizadas, em_andamento, pendentes, canceladas`}\n\n💡 Faça uma pergunta! 📋`;
  }

  if (pageName.includes('Contrato')) {
    if (hasKeywords(['posição', 'saldo', 'quanto', 'valor atualizado'])) {
      return `💼 Na página de **Contratos**:\n\n**Posição Atual:**\n• Saldo por contrato\n• Vencimentos\n• Valores ativados\n• Posição consolidada\n\nQual contrato você quer verificar? 💼`;
    }
    if (hasKeywords(['comparativo', 'vs', 'diferença', 'variação'])) {
      return `📊 Na página de **Contratos**:\n\n**Análise Comparativa:**\n• Comparativo por período\n• Variação de saldos\n• Análise de desempenho\n• Comparativo de contratos\n\nQual período? 📊`;
    }
    if (hasKeywords(['vencimento', 'data', 'quando', 'próximo'])) {
      return `📅 Na página de **Contratos**:\n\n**Datas Importantes:**\n• Próximos vencimentos\n• Contratos vencidos\n• Cronograma de ativação\n• Histórico de datas\n\nQual período? 📅`;
    }
    return `💼 Na página de **Contratos**, posso ajudar com:\n\n✓ Posição de contratos\n✓ Análise comparativa\n✓ Datas de vencimento\n✓ Saldos por contrato\n✓ Performance\n\nFaça uma pergunta específica! 💼`;
  }

  if (pageName.includes('Dashboard')) {
    if (hasKeywords(['resumo', 'overview', 'tudo', 'geral'])) {
      return `📊 **Dashboard Principal**\n\n**Resumo Executivo:**\n• KPIs principais\n• Gráficos de performance\n• Alertas importantes\n• Métricas do dia\n\nQual métrica você quer analisar? 📊`;
    }
    if (hasKeywords(['alerta', 'problema', 'atenção', 'erro', 'aviso'])) {
      return `⚠️ **Dashboard Principal**\n\n**Alertas:**\n• Alertas ativos\n• Problemas identificados\n• Itens que precisam atenção\n• Ação recomendada\n\nQual alerta você quer verificar? ⚠️`;
    }
    if (hasKeywords(['performance', 'como tá', 'como vai', 'status'])) {
      return `📈 **Dashboard Principal**\n\n**Performance:**\n• KPIs do período\n• Tendências\n• Comparativo com meta\n• Status geral\n\nQual KPI você quer analisar? 📈`;
    }
    return `📊 No **Dashboard**, posso ajudar com:\n\n✓ Resumo executivo\n✓ Alertas importantes\n✓ Performance de KPIs\n✓ Métricas principais\n✓ Tendências\n\nFaça uma pergunta específica! 📊`;
  }

  if (pageName.includes('Monitoramento') || pageName.includes('Monitoring')) {
    if (hasKeywords(['requisição', 'request', 'http', 'api'])) {
      return `📡 Na página de **Monitoramento**:\n\n**Requisições HTTP:**\n• Total de requisições\n• Endpoints mais usados\n• Taxa de erro\n• Performance média\n\nQual período? 📡`;
    }
    if (hasKeywords(['performance', 'latência', 'speed', 'tempo'])) {
      return `⚡ Na página de **Monitoramento**:\n\n**Performance:**\n• Latência média\n• Throughput\n• Tempo de resposta\n• Gargalos identificados\n\nQual métrica? ⚡`;
    }
    if (hasKeywords(['erro', 'erro', 'falha', 'problema', 'crash'])) {
      return `❌ Na página de **Monitoramento**:\n\n**Erros:**\n• Erros detectados\n• Taxa de erro\n• Endpoints problemáticos\n• Histórico de falhas\n\nQual período? ❌`;
    }
    return `📡 Na página de **Monitoramento**, posso ajudar com:\n\n✓ Requisições HTTP\n✓ Performance do sistema\n✓ Erros e falhas\n✓ Alertas\n✓ Análise de logs\n\nFaça uma pergunta específica! 📡`;
  }

  // Resposta padrão
  return `ℹ️ **${pageName}**\n\n${pageContext?.description || 'Página do sistema'}\n\n💡 Dados disponíveis:\n${pageContext?.availableData?.map(d => `✓ ${d}`).join('\n')}\n\nFaça uma pergunta específica para receber uma análise detalhada! 🚀`;
}

// Função auxiliar para gerar resposta mock (quando Claude API não está configurada)
function generateMockAnalysis(question, financialData) {
  const lower = question.toLowerCase();
  
  if (!financialData) {
    return '📝 Carregue dados financeiros para receber análises personalizadas.';
  }

  const total_receita = financialData.receita?.total || 0;
  const total_despesa = financialData.despesas?.total || 0;
  const resultado = financialData.result || 0;
  const margem = total_receita > 0 ? ((resultado / total_receita) * 100).toFixed(2) : 0;

  // Formatar valores para exibição
  const receitaFormatted = total_receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const despesaFormatted = total_despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const resultadoFormatted = resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const percentualDespesa = ((total_despesa / total_receita) * 100).toFixed(1);

  // Análise de margem/lucro
  if (lower.includes('margem') || lower.includes('lucro') || lower.includes('ganho') || lower.includes('ganhou')) {
    const status = margem > 20 ? '✅ Muito boa!' : margem > 10 ? '✅ Boa' : margem > 0 ? '⚠️ Baixa' : '❌ Negativa';
    return `📊 Sua margem líquida foi de ${margem}% em ${financialData.month} ${status}\n\nSaldo: R$ ${resultadoFormatted}\nIsso significa que a cada R$ 100 em receita, você ficou com R$ ${margem}.`;
  }

  // Análise de despesas
  if (lower.includes('despesa') || lower.includes('gasto') || lower.includes('custo') || lower.includes('consumo')) {
    return `💸 Suas despesas totais foram R$ ${despesaFormatted} em ${financialData.month}.\n\nRepresentam ${percentualDespesa}% da sua receita.\n\nTop 3 maiores despesas:\n${financialData.despesas.data
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((item, idx) => `${idx + 1}. ${item.description}: R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .join('\n')}`;
  }

  // Análise de receita
  if (lower.includes('receita') || lower.includes('faturamento') || lower.includes('vendas') || lower.includes('entrada')) {
    return `💰 Sua receita total foi R$ ${receitaFormatted} em ${financialData.month}.\n\nTop 3 maiores receitas:\n${financialData.receita.data
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((item, idx) => `${idx + 1}. ${item.description}: R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .join('\n')}`;
  }

  // Status geral
  if (lower.includes('como vai') || lower.includes('como tá') || lower.includes('como está') || lower.includes('status') || lower.includes('resultado')) {
    const status = resultado > 0 ? '✅ Positivo' : resultado === 0 ? '➖ Equilibrado' : '❌ Negativo';
    const analise = resultado > 0 
      ? `Parabéns! Você teve lucro de R$ ${resultadoFormatted}.`
      : resultado === 0
      ? `Suas receitas e despesas se igualaram.`
      : `Sua despesa superou a receita em R$ ${Math.abs(resultado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
    return `Seu resultado financeiro em ${financialData.month} foi ${status}.\n\n${analise}`;
  }

  // Comparação receita vs despesa
  if (lower.includes('receita vs') || lower.includes('vs despesa') || lower.includes('comparar') || lower.includes('diferença') || lower.includes('diferença')) {
    const diferenca = total_receita - total_despesa;
    const diferencaFormatted = diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    return `📊 Comparativo de ${financialData.month}:\n\n💰 Receita: R$ ${receitaFormatted}\n💸 Despesa: R$ ${despesaFormatted}\n📈 Diferença: R$ ${diferencaFormatted}`;
  }

  // Maiores gastos
  if (lower.includes('maior') || lower.includes('top') || lower.includes('maior despesa') || lower.includes('principal')) {
    if (financialData.despesas?.data?.length > 0) {
      const topDespesa = financialData.despesas.data.reduce((max, item) => item.value > max.value ? item : max);
      const percentualTop = ((topDespesa.value / total_despesa) * 100).toFixed(1);
      return `🔴 Sua maior despesa é: ${topDespesa.description}\n\nValor: R$ ${topDespesa.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nRepresenta ${percentualTop}% do total de despesas.`;
    }
  }

  // Resumo executivo
  const mensalFormatted = (resultado / 1).toLocaleString('pt-BR', { minimumFractionDigits: 0 });
  return `� **RESUMO FINANCEIRO - ${financialData.month.toUpperCase()}**\n\n💰 Receita: R$ ${receitaFormatted}\n💸 Despesa: R$ ${despesaFormatted}\n📊 Saldo: R$ ${resultadoFormatted}\n📉 Margem: ${margem}%\n\nFaça perguntas específicas como:\n• "Por que minhas despesas subiram?"\n• "Qual foi minha receita?"\n• "Como está meu resultado?"\n• "Quais são minhas maiores despesas?"`;
}


// ===== SERVIDOR E GRACEFUL SHUTDOWN =====

// Iniciar servidor
initializeDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`✅ Servidor iniciado com sucesso!`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('');
  });

  // Timeout padrão para todas as requests (30 segundos)
  server.timeout = 30000;
  server.keepAliveTimeout = 65000;

  // Graceful Shutdown - fechar conexões quando receber sinais
  const gracefulShutdown = async (signal) => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`⚠️  Recebido sinal ${signal}, iniciando shutdown gracioso...`);
    console.log('═══════════════════════════════════════════════════════');
    
    // Parar de aceitar novas conexões
    server.close(async () => {
      console.log('✓ Servidor Express encerrado');
    
    // Fechar o pool de conexões
    try {
      await pool.end();
      console.log('✓ Pool de conexões PostgreSQL encerrado');
    } catch (error) {
      console.error('✗ Erro ao encerrar pool:', error);
    }
    
    console.log('✓ Aplicação encerrada com sucesso');
    console.log('═══════════════════════════════════════════════════════');
    process.exit(0);
  });
  
  // Se não encerrar em 30s, forçar
  setTimeout(() => {
    console.error('✗ Timeout durante shutdown, forçando saída...');
    process.exit(1);
  }, 30000);
};

// Handlers para sinais de encerramento
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}).catch(error => {
  console.error('Erro ao inicializar banco:', error);
  process.exit(1);
});

// Error handler global para uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('═══════════════════════════════════════════════════════');
  console.error('🔴 UNCAUGHT EXCEPTION:');
  console.error(error);
  console.error('═══════════════════════════════════════════════════════');
  console.error('');
});

// Error handler para promises não tratadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('═══════════════════════════════════════════════════════');
  console.error('🔴 UNHANDLED REJECTION:');
  console.error('Motivo:', reason);
  console.error('Promise:', promise);
  console.error('═══════════════════════════════════════════════════════');
  console.error('');
});
