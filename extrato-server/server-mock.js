const express = require('express');
const cors = require('cors');

const app = express();
const port = 3004;

// Sistema de cache com TTL de 30 segundos
const cache = new Map();
const CACHE_TTL = 30000; // 30 segundos

function getCacheKey(route, params) {
  return `${route}:${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
    console.log(`[CACHE EXPIRED] Cache expired for: ${key}`);
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Limpeza automática do cache
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      cache.delete(key);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`[CACHE CLEANUP] Cleaned ${cleanedCount} expired entries`);
  }
}, 60000);

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

// Dados mockados que mudam com o tempo
function generateMockData() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR');
  
  return {
    ranking: {
      clientes: [
        {
          nome: `Cliente Premium ${timeString}`,
          documento: "123.456.789-01",
          email: "cliente1@exemplo.com",
          status: "Ativo",
          saldo: Math.floor(Math.random() * 100000) + 50000,
          transaction_date: now.toISOString()
        },
        {
          nome: `Cliente Gold ${timeString}`,
          documento: "234.567.890-12",
          email: "cliente2@exemplo.com", 
          status: "Ativo",
          saldo: Math.floor(Math.random() * 50000) + 25000,
          transaction_date: now.toISOString()
        },
        {
          nome: `Cliente Silver ${timeString}`,
          documento: "345.678.901-23",
          email: "cliente3@exemplo.com",
          status: "Ativo", 
          saldo: Math.floor(Math.random() * 25000) + 10000,
          transaction_date: now.toISOString()
        }
      ]
    },
    statement: {
      success: true,
      data: [
        {
          personal_name: `João Silva ${timeString}`,
          personal_document: "123.456.789-01",
          email: "joao@exemplo.com",
          status_description: "Ativo",
          transaction_date: now.toLocaleDateString('pt-BR') + ' ' + timeString,
          type: "PIX",
          description: "Transferência PIX",
          pix_free_description: "",
          amount: Math.floor(Math.random() * 5000) - 2500,
          saldo_posterior: Math.floor(Math.random() * 50000) + 10000,
          beneficiario: "Maria Santos",
          banco_beneficiario: "Banco do Brasil",
          nome_pagador: "João Silva"
        }
      ],
      count: 1
    },
    summary: {
      success: true,
      summary: {
        totalCredits: Math.floor(Math.random() * 50000) + 10000,  
        totalDebits: Math.floor(Math.random() * 30000) + 5000,
        netFlow: Math.floor(Math.random() * 20000) + 5000,
        currentBalance: Math.floor(Math.random() * 100000) + 20000,
        previousBalance: Math.floor(Math.random() * 80000) + 15000,
        transactionCount: Math.floor(Math.random() * 100) + 20,
        period: {
          start: now.toISOString(),
          end: now.toISOString()
        }
      }
    },
    faturas: {
      data: [
        {
          account_id: "acc1",
          personal_name: `Cliente Cartão ${timeString}`,
          personal_document: "123.456.789-01",
          email: "cliente@exemplo.com",
          statement_id: "CURRENT",
          kind: "CREDIT",
          balance: Math.floor(Math.random() * 5000) + 1000,
          fechamento: now.toISOString().split('T')[0],
          vencimento: new Date(now.getTime() + 30*24*60*60*1000).toISOString().split('T')[0],
          status: "Em Aberto"
        }
      ],
      count: 1,
      query: {}
    }
  };
}

// Rota de teste
app.get('/api/test', (req, res) => {
  const now = new Date();
  res.json({ 
    message: 'Servidor Mock OK', 
    timestamp: now.toISOString(),
    cache_size: cache.size
  });
});

// Ranking de clientes por saldo
app.get('/api/statement/ranking', (req, res) => {
  try {
    const { nome, dataInicio, dataFim } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('ranking', { nome, dataInicio, dataFim });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Ranking cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    // Gerar dados mockados
    const mockData = generateMockData();
    const response = mockData.ranking;
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Ranking cache set: ${cacheKey}`);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking', details: error.message });
  }
});

// Rota para buscar dados do extrato
app.get('/api/statement', (req, res) => {
  try {
    const { dataInicio, dataFim, personalDocument } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('statement', { dataInicio, dataFim, personalDocument });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Statement cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    // Gerar dados mockados
    const mockData = generateMockData();
    const response = mockData.statement;
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Statement cache set: ${cacheKey}`);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar dados do extrato',
      details: error.message 
    });
  }
});

// Rota para buscar resumo do extrato
app.get('/api/statement/summary', (req, res) => {
  try {
    const { dataInicio, dataFim, personalDocument } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('summary', { dataInicio, dataFim, personalDocument });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Summary cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    // Gerar dados mockados
    const mockData = generateMockData();
    const response = mockData.summary;
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Summary cache set: ${cacheKey}`);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar resumo do extrato',
      details: error.message 
    });
  }
});

// Endpoint para faturas de cartão de crédito
app.get('/api/faturas', (req, res) => {
  try {
    const { personalDocument, status } = req.query;
    
    // Gerar chave do cache
    const cacheKey = getCacheKey('faturas', { personalDocument, status });
    
    // Verificar se existe no cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] Faturas cache hit: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    // Gerar dados mockados
    const mockData = generateMockData();
    const response = mockData.faturas;
    
    // Armazenar no cache
    setCache(cacheKey, response);
    console.log(`[CACHE SET] Faturas cache set: ${cacheKey}`);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar faturas',
      details: error.message 
    });
  }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor MOCK rodando na porta ${port}`);
  console.log(`📊 Cache TTL: ${CACHE_TTL}ms (30 segundos)`);
  console.log(`🔄 Auto-limpeza do cache: a cada 60 segundos`);
  console.log(`🌐 CORS habilitado para localhost:3000 e rede local`);
});
