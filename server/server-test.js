const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = 3001; // Força usar porta 3001

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'airflow_treynor',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
});

// Middleware
app.use(express.json());

// CORS Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Teste de conexão
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'PostgreSQL conectado com sucesso!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao conectar ao PostgreSQL',
      error: error.message 
    });
  }
});

// API para análise de produção por status
app.get('/api/producao/status-analysis', async (req, res) => {
  try {
    console.log('Recebida requisição para status-analysis');
    const { startDate, endDate, status } = req.query;
    
    // Definir período padrão se não fornecido
    const start = startDate || '2024-01-01';
    const end = endDate || new Date().toISOString().split('T')[0];
    
    console.log('Período:', start, 'até', end);
    
    let statusQuery, monthlyQuery, params;
    
    if (status) {
      console.log('Filtro por status:', status);
      statusQuery = `
        SELECT 
          COALESCE(status_nome, 'Não Informado') as status,
          COUNT(*) as quantidade,
          SUM(valor_referencia) as valor_referencia,
          SUM(valor_financiado) as valor_financiado,
          SUM(valor_liberado) as valor_liberado,
          SUM(valor_parcela) as valor_parcela
        FROM fact_proposals_newcorban 
        WHERE data_cadastro >= $1 
          AND data_cadastro <= $2
          AND status_nome = $3
        GROUP BY status_nome
        ORDER BY quantidade DESC
      `;
      
      monthlyQuery = `
        SELECT 
          DATE_TRUNC('month', data_cadastro) as mes,
          COALESCE(status_nome, 'Não Informado') as status,
          COUNT(*) as quantidade,
          SUM(valor_financiado) as valor_total
        FROM fact_proposals_newcorban 
        WHERE data_cadastro >= $1 
          AND data_cadastro <= $2
          AND status_nome = $3
        GROUP BY DATE_TRUNC('month', data_cadastro), status_nome
        ORDER BY mes, quantidade DESC
      `;
      
      params = [start, end, status];
    } else {
      console.log('Sem filtro de status');
      statusQuery = `
        SELECT 
          COALESCE(status_nome, 'Não Informado') as status,
          COUNT(*) as quantidade,
          SUM(valor_referencia) as valor_referencia,
          SUM(valor_financiado) as valor_financiado,
          SUM(valor_liberado) as valor_liberado,
          SUM(valor_parcela) as valor_parcela
        FROM fact_proposals_newcorban 
        WHERE data_cadastro >= $1 
          AND data_cadastro <= $2
        GROUP BY status_nome
        ORDER BY quantidade DESC
      `;
      
      monthlyQuery = `
        SELECT 
          DATE_TRUNC('month', data_cadastro) as mes,
          COALESCE(status_nome, 'Não Informado') as status,
          COUNT(*) as quantidade,
          SUM(valor_financiado) as valor_total
        FROM fact_proposals_newcorban 
        WHERE data_cadastro >= $1 
          AND data_cadastro <= $2
        GROUP BY DATE_TRUNC('month', data_cadastro), status_nome
        ORDER BY mes, quantidade DESC
      `;
      
      params = [start, end];
    }
    
    console.log('Executando queries...');
    
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
    console.error('Erro ao buscar análise por status:', error);
    res.status(500).json({ error: 'Erro ao buscar análise por status', details: error.message });
  }
});

// API para detalhes dos contratos por status
app.get('/api/producao/status-details', async (req, res) => {
  try {
    console.log('Recebida requisição para status-details');
    const { status } = req.query;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    console.log('Buscando detalhes para status:', status);
    
    const query = `
      SELECT 
        id,
        cliente_nome as "clienteNome",
        cpf_cnpj as "cpfCnpj",
        banco_nome as "bancoNome",
        produto_nome as "produtoNome",
        valor_financiado as valores,
        status_nome as "statusNome",
        data_cadastro as "dataCadastro"
      FROM fact_proposals_newcorban 
      WHERE status_nome = $1
      ORDER BY data_cadastro DESC
      LIMIT 500
    `;
    
    const result = await pool.query(query, [status]);
    
    console.log('Encontrados', result.rows.length, 'contratos para o status', status);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar detalhes por status:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes por status', details: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Configuração PostgreSQL:`);
  console.log(`Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.POSTGRES_PORT || 5432}`);
  console.log(`Database: ${process.env.POSTGRES_DATABASE || 'airflow_treynor'}`);
  console.log(`User: ${process.env.POSTGRES_USER || 'postgres'}`);
  console.log(`Password: ${process.env.POSTGRES_PASSWORD ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
  console.log(`Servidor PostgreSQL rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}/api/test`);
});