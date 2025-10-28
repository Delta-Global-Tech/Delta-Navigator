# ⚡ IUGU Server - Start Here

## 🚀 Em 10 Segundos

```bash
npm start
```

Pronto! Servidor rodando em `http://localhost:3005`

## 📋 Endpoints Disponíveis

```
GET  /health                    - ✅ Health check
GET  /api/test                  - ✅ Teste BD
GET  /api/bank-slips            - ✅ Todos os boletos (224)
GET  /api/bank-slips/stats      - ✅ Estatísticas
GET  /api/bank-slips/by-status/paid - ✅ Boletos pagos
```

## 🔍 Testar Rápido

```bash
# PowerShell
curl http://localhost:3005/api/bank-slips | ConvertFrom-Json | Select-Object -First 5

# Ou com o script
.\test-iugu.ps1
```

## 🗄️ Dados

- **Fonte:** PostgreSQL (10.174.1.117)
- **Database:** ntxdeltaglobal
- **Cliente:** SAAE - Client Production
- **Total:** 224 boletos

## 📊 Resposta Típica

```json
{
  "data": [
    {
      "client_name": "SAAE - Client Production",
      "processor_type": "Iugu",
      "amount": 1000,
      "paid_net_amount": 980,
      "fee_amount": 20,
      "status": "paid",
      "paid_at": "2025-10-21T10:30:00Z"
    }
  ],
  "count": 224,
  "timestamp": "2025-10-21T21:48:23Z"
}
```

## 🛠️ Stack

- Node.js
- Express.js
- PostgreSQL (pg)
- CORS
- dotenv

## 📝 Config

Arquivo: `.env`

```
PG_HOST=10.174.1.117
PG_PORT=5432
PG_DB=ntxdeltaglobal
PG_USER=postgres
PG_PASSWORD=u8@UWlfV@mT8TjSVtcEJmOTd
```

## 🐛 Troubleshooting

**Erro de conexão?**
- Verifique `.env`
- Teste: `ping 10.174.1.117`
- Verifique credenciais

**Porta 3005 ocupada?**
- Veja: `netstat -ano | findstr :3005`
- Mate: `taskkill /PID <PID> /F`

**Sem dados?**
- Verifique logs do servidor
- Teste endpoint diretamente
- Veja erro de CORS no navegador

## 📞 Suporte

Veja documentação:
- `README.md` - Completa
- `../IUGU_QUICK_START.md` - Rápida
- `../IUGU_SETUP_COMPLETE.md` - Setup

## ✅ Status

```
✅ Servidor rodando
✅ BD conectando
✅ 224 boletos disponíveis
✅ Pronto para produção
```

---

**Dúvida?** Veja `README.md` aqui na pasta!
