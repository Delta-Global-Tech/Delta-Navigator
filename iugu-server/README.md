# IUGU - Servidor de Licitações (Bank Slips)

## 📋 Visão Geral

Servidor Node.js/Express para gerenciar dados de boletos bancários da plataforma Iugu, conectando ao PostgreSQL externo da Delta Global.

## 🚀 Inicialização Rápida

### Opção 1: Servidor Isolado
```bash
cd iugu-server
npm install
npm start
```

### Opção 2: Com Todos os Servidores
```bash
npm run servers
```

### Opção 3: Desenvolvimento (com nodemon)
```bash
cd iugu-server
npm run dev
```

## 🔌 Endpoints

### GET /api/test
Testa conexão com o banco de dados
```bash
curl http://localhost:3005/api/test
```

### GET /api/bank-slips
Busca todos os boletos bancários
```bash
curl http://localhost:3005/api/bank-slips
```

**Resposta:**
```json
{
  "data": [
    {
      "client_name": "SAAE - Client Production",
      "processor_type": "Iugu",
      "amount": 1000.00,
      "paid_net_amount": 980.00,
      "fee_amount": 20.00,
      "status": "paid",
      "paid_at": "2025-10-21T10:30:00Z"
    }
  ],
  "count": 50,
  "timestamp": "2025-10-21T14:20:00Z"
}
```

### GET /api/bank-slips/stats
Busca estatísticas dos boletos
```bash
curl http://localhost:3005/api/bank-slips/stats
```

### GET /api/bank-slips/by-status/:status
Busca boletos por status específico
```bash
curl http://localhost:3005/api/bank-slips/by-status/paid
```

### GET /health
Health check
```bash
curl http://localhost:3005/health
```

## 🗄️ Banco de Dados

**Host:** 10.174.1.117
**Porta:** 5432
**Database:** ntxdeltaglobal
**Usuário:** postgres

### Tabelas Utilizadas
- `client_api_keys` - Clientes API
- `processors` - Processadores de pagamento
- `bank_slips` - Boletos bancários

### SQL Base
```sql
SELECT 
  cak.client_name,
  p.processor_type,
  bs.amount,
  bs.paid_net_amount,
  bs.fee_amount,
  bs.status,
  bs.paid_at
FROM client_api_keys cak
INNER JOIN processors p ON cak.id = p.client_api_key_id
INNER JOIN bank_slips bs ON bs.processor_id = p.id
WHERE cak.client_name = 'SAAE - Client Production'
ORDER BY bs.paid_at DESC NULLS LAST
```

## 📝 Variáveis de Ambiente

Arquivo `.env`:
```
PG_HOST=10.174.1.117
PG_PORT=5432
PG_DB=ntxdeltaglobal
PG_USER=postgres
PG_PASSWORD=u8@UWlfV@mT8TjSVtcEJmOTd
```

## 🌐 Integração com Frontend

### Configuração no .env (raiz do projeto)
```
VITE_IUGU_API_URL=http://localhost:3005
```

### Uso no Código React
```typescript
import { getApiEndpoint } from '@/lib/api-config';

// Usar em qualquer página
const url = getApiEndpoint('IUGU', '/api/bank-slips');
const response = await axios.get(url);
```

## 🔍 Verificação de Funcionamento

1. **Terminal 1:** Inicie o servidor
   ```bash
   cd iugu-server && npm start
   ```

2. **Terminal 2:** Teste a conexão
   ```bash
   curl http://localhost:3005/api/test
   ```

3. **Terminal 3:** Teste os boletos
   ```bash
   curl http://localhost:3005/api/bank-slips
   ```

## 📊 Tela Frontend (Licitacoes.tsx)

A tela `/licitacoes` foi atualizada para usar o novo endpoint do iugu-server:
- Carrega dados automaticamente ao abrir a página
- Mostra estatísticas: total, valor líquido, taxas, pagos
- Filtro por cliente e status
- Exportação em CSV
- Refresh manual com botão

## 🐛 Troubleshooting

### Erro de conexão com o banco
- Verifique se o IP `10.174.1.117` está acessível
- Verifique as credenciais no `.env`
- Teste com um cliente PostgreSQL externo

### Porta 3005 já em uso
```bash
netstat -ano | findstr :3005
taskkill /PID <PID> /F
```

### CORS errors
O servidor inclui CORS habilitado. Se houver problemas:
1. Verifique se o frontend está acessando a URL correta
2. Veja os logs do servidor para debug

## 📚 Estrutura

```
iugu-server/
├── server.js          # Arquivo principal
├── package.json       # Dependências
├── .env               # Variáveis de ambiente
├── .env.example       # Exemplo de .env
└── README.md          # Este arquivo
```

## ✅ Status

- ✅ Backend criado e funcionando
- ✅ Endpoints implementados
- ✅ Frontend integrado
- ✅ Scripts npm adicionados
- ✅ CORS configurado
- ✅ Logs de debug habilitados
