const express = require('express');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const API_BASE = 'https://api-v2.conta-digital.paysmart.com.br/';
const API_KEY = '1a6109b1-096c-4e59-9026-6cd5d3caa16d';
const API_KEY_HEADER = 'x-api-key';

// ✅ Carregar certificados
let httpsAgent = null;
const certsPath = path.join(__dirname, 'certs');

try {
  if (fs.existsSync(path.join(certsPath, 'private.key')) && 
      fs.existsSync(path.join(certsPath, 'certificate.crt'))) {
    
    const privateKey = fs.readFileSync(path.join(certsPath, 'private.key'), 'utf8');
    const certificate = fs.readFileSync(path.join(certsPath, 'certificate.crt'), 'utf8');
    
    httpsAgent = new https.Agent({
      key: privateKey,
      cert: certificate,
      rejectUnauthorized: false // ⚠️ Só para testes! Mudar para true em produção
    });
    
    console.log('✅ Certificados carregados com sucesso!');
  } else {
    console.warn('⚠️  Certificados não encontrados. Usando sem mTLS...');
    httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }
} catch (error) {
  console.error('❌ Erro ao carregar certificados:', error.message);
  httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });
}

// ✅ Cliente Axios com certificados
const apiClient = axios.create({
  baseURL: API_BASE,
  httpsAgent: httpsAgent,
  headers: {
    [API_KEY_HEADER]: API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// 🔍 Interceptor para logging
apiClient.interceptors.request.use(
  config => {
    console.log(`📤 [${config.method.toUpperCase()}] ${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => {
    console.log(`📥 [${response.status}] Sucesso`);
    return response;
  },
  error => {
    console.error(`❌ [${error.response?.status || 'N/A'}] ${error.message}`);
    return Promise.reject(error);
  }
);

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /pix/limit/:accountId
 * Busca o limite PIX de uma conta
 */
app.get('/pix/limit/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    console.log(`\n🔵 GET /pix/limit/${accountId}`);
    
    const response = await apiClient.get(
      `conta-digital/api/v1/accounts/${accountId}/pix/getLimit`
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * PUT /pix/limit/:accountId
 * Altera o limite PIX de uma conta
 */
app.put('/pix/limit/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    console.log(`\n🔵 PUT /pix/limit/${accountId}`);
    console.log('Payload:', JSON.stringify(req.body, null, 2));
    
    const response = await apiClient.put(
      `conta-digital/api/v1/accounts/${accountId}/pix/limit`,
      req.body
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /pix/requests
 * Busca as solicitações de aumento de limite
 */
app.get('/pix/requests', async (req, res) => {
  try {
    const { accountId, status } = req.query;
    console.log(`\n🔵 GET /pix/requests?accountId=${accountId}&status=${status}`);
    
    const response = await apiClient.get(
      'conta-digital/api/v1/accounts/pix/limit/getRaiseLimitRequests',
      {
        params: {
          accountId,
          status: status || 'S'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * PUT /pix/process-request
 * Processa uma solicitação de aumento de limite (aprova ou recusa)
 */
app.put('/pix/process-request', async (req, res) => {
  try {
    console.log(`\n🔵 PUT /pix/process-request`);
    console.log('Payload:', JSON.stringify(req.body, null, 2));
    
    const response = await apiClient.put(
      'conta-digital/api/v1/accounts/pix/limit/processLimitRequest',
      req.body
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    certificatesLoaded: httpsAgent ? true : false
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

const PORT = process.env.PIX_PORT || 3005;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║     🚀 PIX Gateway Server                         ║
║     Porta: ${PORT}                                 ║
║     Status: ✅ Rodando                            ║
╚════════════════════════════════════════════════════╝

📍 Endpoints disponíveis:

  GET  http://localhost:${PORT}/pix/limit/:accountId
  PUT  http://localhost:${PORT}/pix/limit/:accountId
  GET  http://localhost:${PORT}/pix/requests
  PUT  http://localhost:${PORT}/pix/process-request
  GET  http://localhost:${PORT}/health

🔒 Certificados: ${httpsAgent ? '✅ Carregados' : '⚠️ Não encontrados'}

📚 Documentação: https://github.com/seu-repo/docs

  `);
});
