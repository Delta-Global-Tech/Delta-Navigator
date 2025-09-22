const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'airflow_treynor',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'MinhaSenh@123',
});

console.log('Configuração PostgreSQL:');
console.log('Host:', process.env.POSTGRES_HOST || 'localhost');
console.log('Port:', process.env.POSTGRES_PORT || 5432);
console.log('Database:', process.env.POSTGRES_DATABASE || 'airflow_treynor');
console.log('User:', process.env.POSTGRES_USER || 'postgres');
console.log('Password:', process.env.POSTGRES_PASSWORD ? '[DEFINIDA]' : '[NÃO DEFINIDA]');

// API de teste da conexão
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

// API para verificar dados disponíveis na tabela
app.get('/api/debug/data-range', async (req, res) => {
  try {
    const query = `
      SELECT 
        MIN(created_at) as data_minima,
        MAX(created_at) as data_maxima,
        COUNT(*) as total_registros,
        COUNT(DISTINCT DATE_TRUNC('month', created_at)) as meses_distintos
      FROM fact_proposals_newcorban
    `;
    
    const result = await pool.query(query);
    const dataInfo = result.rows[0];
    
    // Buscar dados por mês
    const monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as mes,
        COUNT(*) as registros
      FROM fact_proposals_newcorban
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
      FROM fact_proposals_newcorban 
      WHERE status_nome IN ('ASSINATURA APROVADA', 'GERANDO CCB', 'GERANDO NOVA CCB', 
                            'AGUARDANDO FORMALIZAÇÃO CCB', 'AGUARDANDO ENVIO DA CCB', 
                            'FILA DE DIGITAÇÃO', 'PENDENTE')
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
      FROM fact_proposals_newcorban 
      WHERE status_nome IN ('ASSINATURA APROVADA', 'GERANDO CCB', 'GERANDO NOVA CCB', 
                            'AGUARDANDO FORMALIZAÇÃO CCB', 'AGUARDANDO ENVIO DA CCB', 
                            'FILA DE DIGITAÇÃO', 'PENDENTE')
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
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
    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as mes,
        COUNT(*) as contratos,
        SUM(valor_financiado) as valor_total
      FROM fact_proposals_newcorban 
      WHERE status_nome IN ('ASSINATURA APROVADA', 'GERANDO CCB', 'GERANDO NOVA CCB', 
                            'AGUARDANDO FORMALIZAÇÃO CCB', 'AGUARDANDO ENVIO DA CCB', 
                            'FILA DE DIGITAÇÃO', 'PENDENTE')
        AND created_at >= '2024-01-01'  -- Últimos 2 anos para ter mais dados
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mes
    `;
    
    const result = await pool.query(query);
    
    const monthlyData = result.rows.map(row => ({
      mes: row.mes,
      contratos: parseInt(row.contratos),
      valor: parseFloat(row.valor_total) || 0
    }));
    
    console.log('Dados mensais NOVO encontrados:', monthlyData.length, 'meses');
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
      FROM fact_proposals_newcorban 
      WHERE status_nome IN ('ASSINATURA APROVADA', 'GERANDO CCB', 'GERANDO NOVA CCB', 
                            'AGUARDANDO FORMALIZAÇÃO CCB', 'AGUARDANDO ENVIO DA CCB', 
                            'FILA DE DIGITAÇÃO', 'PENDENTE')
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
      FROM fact_proposals_newcorban 
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
      FROM fact_proposals_newcorban 
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
    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as mes,
        COUNT(*) as contratos,
        SUM(valor_financiado) as valor_total
      FROM fact_proposals_newcorban 
      WHERE status_nome IN ('PAGO', 'BOLETO QUITADO', 'AVERBADO')
        AND created_at >= '2024-01-01'  -- Últimos 2 anos para ter mais dados
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mes
    `;
    
    const result = await pool.query(query);
    
    const monthlyData = result.rows.map(row => ({
      mes: row.mes,
      contratos: parseInt(row.contratos),
      valor: parseFloat(row.valor_total) || 0
    }));
    
    console.log('Dados mensais COMPRA encontrados:', monthlyData.length, 'meses');
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
      FROM fact_proposals_newcorban 
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor PostgreSQL rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}/api/test`);
});