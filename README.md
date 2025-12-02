# 🚀 Delta Navigator v2.0 - AI Intelligence Platform

**Plataforma corporativa de Business Intelligence com IA integrada, análises automáticas e dashboards executivos.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Status-Estável-brightgreen?style=flat)](https://github.com)

---

## 📋 Índice Rápido

- [Visão Geral](#-visão-geral)
- [Quick Start](#-quick-start-seguro)
- [Configuração Segura](#-configuração-segura)
- [Arquitetura](#-arquitetura)
- [Telas Disponíveis](#-telas-disponíveis)
- [APIs e Endpoints](#-apis-e-endpoints)
- [🔒 Segurança](#-segurança-crítica)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

O **Delta Navigator** é uma plataforma completa de Business Intelligence com **IA integrada** que oferece:

### ⚡ Principais Recursos

| Recurso | Descrição | Status |
|---------|-----------|--------|
| **🧠 AI Intelligence Dashboard** | Histórico completo de análises IA com exportação | ✅ Live |
| **🚨 Auto-Alert System** | Monitoramento automático com alertas inteligentes | ✅ Live |
| **🤖 Bot IA Global** | Análises em 25+ páginas com contexto inteligente | ✅ Live |
| **🎮 Gamificação Completa** | XP, badges, ranking, milestones | ✅ Live |
| **📊 Dashboard Executivo** | KPIs em tempo real e gráficos interativos | ✅ Live |
| **📱 Interface Responsiva** | Desktop, tablet e mobile | ✅ Live |
| **🔐 Autenticação Segura** | Supabase Auth com permissões granulares | ✅ Live |
| **⚡ Performance Otimizada** | Carregamento rápido e cache inteligente | ✅ Live |

---

## 🚀 Quick Start (Seguro)

### 1. Clone e Configure

```bash
git clone git@github.com:Delta-Global-Dados/Delta-Navigator.git
cd Delta-Navigator
cp .env.example .env
```

### 2. Configure as Variáveis de Ambiente

**⚠️ IMPORTANTE: Nunca commit credenciais reais! Use sempre .env.example**

```bash
# Abra .env e configure com suas credenciais reais:
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
VITE_API_POSTGRES_URL=http://seu-host:3002
```

### 3. Instale Dependências

```bash
npm install
cd postgres-server && npm install && cd ..
cd iugu-server && npm install && cd ..
```

### 4. Execute Localmente

```bash
# Todos os serviços (recomendado)
npm run dev:all

# Ou individual
npm run dev                    # Frontend (porta 5173)
npm run dev:postgres          # API PostgreSQL (porta 3002)
npm run dev:iugu              # API Iugu (porta 3005)
```

### 5. Acesse

- **Frontend**: http://localhost:5173
- **APIs**: Veja `package.json` para portas

---

## 🔒 Configuração Segura

### Frontend (.env)

```env
# ✅ SEGURO: Use variáveis de ambiente com prefixo VITE_

# Supabase (credenciais públicas estão OK)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_supabase

# APIs Backend (use localhost em dev, URL segura em prod)
VITE_API_POSTGRES_URL=http://localhost:3002
VITE_API_IUGU_URL=http://localhost:3005
VITE_API_SQLSERVER_URL=http://localhost:3001

# ⚠️ NUNCA COMMIT este arquivo!
```

### PostgreSQL (postgres-server/.env)

```env
# ✅ SEGURO: Credenciais sensíveis NUNCA vão para o frontend

# Banco de Dados
POSTGRES_HOST=seu-host-postgres
POSTGRES_PORT=5432
POSTGRES_DATABASE=seu-banco-producao
POSTGRES_USER=seu_usuario_seguro
POSTGRES_PASSWORD=sua_senha_forte_aqui

# Servidor
PORT=3002

# ⚠️ NUNCA COMMIT este arquivo!
# Use: .env.example como template
```

### Iugu (iugu-server/.env)

```env
# ✅ SEGURO: Chaves sensíveis protegidas

# API Iugu
IUGU_API_KEY=sua_chave_api_iugu_segura
DATABASE_URL=postgresql://user:password@host:5432/database

# Servidor
PORT=3005

# ⚠️ NUNCA COMMIT este arquivo!
```

### SQL Server (server/.env)

```env
# ✅ SEGURO: Credenciais sensíveis protegidas

SQLSERVER_HOST=seu-host-sqlserver
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=seu_banco
SQLSERVER_USER=seu_usuario
SQLSERVER_PASSWORD=sua_senha_forte

PORT=3001

# ⚠️ NUNCA COMMIT este arquivo!
```

---

## 🛡️ Segurança Crítica

### ✅ Boas Práticas Implementadas

1. **Nunca Commitar Credenciais**
   ```bash
   # ✅ Correto
   git commit -m "Update config"  # .env não vai ser commitado
   
   # ❌ Errado
   git add .env && git commit -m "Add credentials"
   ```

2. **Usar .env.example Como Template**
   ```bash
   # Todos os arquivos sensíveis devem ter exemplo:
   .env.example
   postgres-server/.env.example
   iugu-server/.env.example
   server/.env.example
   ```

3. **Secrets em Produção**
   - **Vercel**: Use Dashboard → Settings → Environment Variables
   - **Railway**: Use Project → Settings → Variables
   - **Docker**: Use `docker secret` ou `docker-compose secrets`

4. **Rotação de Chaves**
   - Altere senhas regularmente
   - Revogue chaves antigas após mudança
   - Use versionamento de secrets

5. **Acesso Limitado**
   - Nunca compartilhe `.env` via email/chat
   - Use password managers (Bitwarden, 1Password)
   - Audit logs de acesso ao `.env`

### 🚨 Cenários de Risco

| Cenário | Risco | Solução |
|---------|-------|---------|
| Commit acidental | ⚠️ CRÍTICO | Use `git-secrets` ou `pre-commit` hooks |
| .env em screenshot | ⚠️ CRÍTICO | Nunca compartilhe prints com .env |
| Dados em logs | ⚠️ ALTO | Nunca faça `console.log()` de credenciais |
| Histórico Git público | ⚠️ CRÍTICO | Revogue credenciais que vazaram |

---

## 🏗 Arquitetura

```
┌────────────────────────────────────────────┐
│   Frontend (React + Vite)                 │
│   http://localhost:5173                   │
└──────────────┬───────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
┌────▼────┐ ┌─▼────┐ ┌──▼──────┐
│ Port 3001│ │Port  │ │Supabase │
│ (SQL)    │ │3002  │ │(Auth)   │
└────┬────┘ │(PG)  │ └──┬──────┘
     │      └─┬────┘    │
     │        │         │
  SQLSRV   PostgreSQL  Auth DB
```

### Fluxo de Dados

1. **Frontend** faz requisição segura
2. **Backend** autentica com JWT
3. **Backend** acessa banco com credenciais seguras
4. **Backend** retorna dados processados
5. **Frontend** exibe resultado

---

## 📁 Telas Disponíveis (25+)

### 📊 Financeiro
- Dashboard, Fechamento Mês, Statement, Faturas, Desembolso, Comparativo Desembolso, AI Intelligence, Auto-Alerts

### 🎯 Vendas
- Propostas, Funil, Licitações (v1/v2), Propostas Abertura

### 👤 Cadastral
- Cadastral (v1/v2/v3), Extrato Ranking, Posição de Contratos

### 💼 Admin
- Backoffice, Tomada de Decisão, Produção Analytics, Produção Novo, Produção Compra

### 📈 Análise
- Produção Analytics Simples, Funil, Ranking

---

## 🔌 APIs e Endpoints

### PostgreSQL (Port 3002)

```bash
# Propostas
GET /api/propostas/data
GET /api/propostas/kpis
GET /api/propostas/status

# Funil
GET /api/funil/data
GET /api/funil/kpis
GET /api/funil/steps

# Licitações
GET /api/licitacoes
POST /api/licitacoes
PUT /api/licitacoes/:id
DELETE /api/licitacoes/:id
```

### Iugu (Port 3005)

```bash
# Cobrança
POST /api/charges
GET /api/charges
```

---

## ⚙️ Deploy Seguro

### Vercel (Frontend)

```bash
# 1. Conecte seu GitHub
# 2. Vá em Settings → Environment Variables
# 3. Adicione:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica
VITE_API_POSTGRES_URL=https://sua-api-producao.com
# 4. Deploy automático via Git
```

### Railway (Backend)

```bash
# 1. Conecte seu GitHub
# 2. Railway detecta Node.js automaticamente
# 3. Vá em Variables e configure:
POSTGRES_HOST=seu-host-producao
POSTGRES_PORT=5432
POSTGRES_DATABASE=producao
POSTGRES_USER=postgres_prod
POSTGRES_PASSWORD=sua_senha_forte
# 4. Deploy automático
```

### Docker (Seguro)

```bash
# Use docker-compose.yml com variáveis de ambiente
docker-compose up -d

# Ou com arquivo de secrets
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

---

## 🐛 Troubleshooting

### ❌ Erro: "API Authentication Failed"
**Causa**: Credenciais incorretas no `.env`
```bash
# Solução:
1. Verifique POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD
2. Teste conexão: psql -h host -U user -d database
3. Verifique firewall/network
```

### ❌ Erro: "Cannot find module"
**Causa**: Dependências não instaladas
```bash
# Solução:
npm install
cd postgres-server && npm install && cd ..
cd iugu-server && npm install && cd ..
```

### ❌ Erro: "Port already in use"
**Causa**: Outro processo usando a porta
```bash
# Solução:
lsof -i :3002
kill -9 <PID>
```

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| Linhas de Código | 50.000+ |
| Componentes React | 50+ |
| Telas | 25+ |
| Endpoints API | 20+ |
| Build Time | ~18s |
| Status | ✅ Production Ready |

---

## 🤝 Contribuição

### Padrões de Segurança

1. **Nunca commit `.env`** - Use `.env.example`
2. **Valide inputs** - Sempre validar dados de entrada
3. **Use HTTPS** - Em produção sempre HTTPS
4. **Rotate secrets** - A cada 90 dias
5. **Audit logs** - Log tentativas de acesso

---

## 📞 Suporte

- 📚 **Documentação**: Este README
- 🐛 **Issues**: GitHub issues
- 📧 **Email**: suporte@delta-global.com
- 🔒 **Security**: security@delta-global.com (para vulnerabilidades)

---

## 📝 Licença

Todos os direitos reservados © 2025 Delta Global Dados

---

## 🎉 Status

| Componente | Status |
|-----------|--------|
| Frontend | ✅ Live |
| Backend PostgreSQL | ✅ Live |
| Gamificação | ✅ Completo |
| Autenticação | ✅ Live |
| Deploy | ✅ Configurado |
| **Segurança** | ✅ **Melhorada** |

---

**Versão**: 2.0.0 | **Atualizado**: Dezembro 2025 | **Status**: ✅ Production Ready

**Desenvolvido com ❤️ pela equipe Delta Global Dados**
