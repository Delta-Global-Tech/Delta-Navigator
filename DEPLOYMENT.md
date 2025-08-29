# 🚀 Guia de Deploy - Data Corban Navigator

## 📋 Opções de Hospedagem

### 🎯 **Recomendações por Tipo**

#### **🆓 Gratuitas (Para Testes)**
- **Vercel** - Melhor para frontend React
- **Netlify** - Excelente para SPAs
- **Railway** - Full-stack com banco
- **Render** - Backend + Frontend

#### **💼 Profissionais (Produção)**
- **AWS** - Máxima flexibilidade
- **Google Cloud** - Integração completa
- **Digital Ocean** - Simplicidade
- **Heroku** - Facilidade de uso

---

## 🏆 **OPÇÃO 1: VERCEL (Recomendado para Frontend)**

### ✅ **Vantagens**
- ✅ Deploy automático do GitHub
- ✅ HTTPS gratuito
- ✅ CDN global
- ✅ Domínio personalizado gratuito
- ✅ Perfeito para React/Vite

### 🚀 **Como Publicar**

1. **Preparar o projeto**:
```bash
# Build de produção
npm run build

# Testar build local
npm run preview
```

2. **Deploy via GitHub**:
   - Acesse [vercel.com](https://vercel.com)
   - Conecte com GitHub
   - Selecione o repositório `data-corban-navigator`
   - Configure as variáveis de ambiente
   - Deploy automático!

3. **Configuração**:
```bash
# vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

4. **Variáveis de Ambiente no Vercel**:
```
VITE_SUPABASE_URL=https://tgdvaaprejaojcwzgzng.supabase.co
VITE_SUPABASE_ANON_KEY=seu_supabase_key
VITE_API_URL=https://seu-backend.railway.app
VITE_POSTGRES_API_URL=https://seu-postgres.railway.app
```

---

## 🚂 **OPÇÃO 2: RAILWAY (Recomendado para Full-Stack)**

### ✅ **Vantagens**
- ✅ Deploy de frontend + backends
- ✅ Banco PostgreSQL incluído
- ✅ Domínios automáticos
- ✅ Logs em tempo real
- ✅ Fácil configuração

### 🚀 **Como Publicar**

1. **Frontend (React)**:
   - Acesse [railway.app](https://railway.app)
   - "New Project" → "Deploy from GitHub"
   - Selecione o repositório
   - Configure: `npm run build && npm run preview`

2. **Backend SQL Server**:
```bash
# Criar Dockerfile no /server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

3. **Backend PostgreSQL**:
```bash
# Criar Dockerfile no /postgres-server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD ["node", "server.js"]
```

4. **Configurar no Railway**:
   - 3 serviços separados
   - Configurar variáveis de ambiente
   - Conectar banco PostgreSQL do Railway

---

## 🌐 **OPÇÃO 3: NETLIFY (Simples para Frontend)**

### 🚀 **Deploy Direto**

1. **Build local**:
```bash
npm run build
```

2. **Deploy via GUI**:
   - Acesse [netlify.com](https://netlify.com)
   - Arraste a pasta `dist` para o deploy
   - Configurar redirects para SPA

3. **Configuração Netlify**:
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## ☁️ **OPÇÃO 4: AWS (Produção Empresarial)**

### 🏗️ **Arquitetura Completa**

1. **Frontend**: S3 + CloudFront
2. **Backend**: EC2 ou ECS
3. **Banco**: RDS (PostgreSQL/SQL Server)
4. **Domínio**: Route 53
5. **SSL**: Certificate Manager

### 💰 **Custos Estimados**
- **Desenvolvimento**: ~$20-50/mês
- **Produção**: ~$100-300/mês

---

## 🐳 **OPÇÃO 5: DOCKER + VPS**

### 🚀 **Deploy Completo**

1. **Criar docker-compose.yml**:
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:5173"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}
  
  backend-sql:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - SQLSERVER_HOST=${SQL_HOST}
      - SQLSERVER_PASSWORD=${SQL_PASSWORD}
  
  backend-postgres:
    build: ./postgres-server
    ports:
      - "3002:3002"
    environment:
      - HOST=${PG_HOST}
      - PASSWORD=${PG_PASSWORD}
```

2. **Deploy em VPS**:
```bash
# No servidor
git clone https://github.com/2carllos/data-corban-navigator.git
cd data-corban-navigator
docker-compose up -d
```

---

## 🎯 **RECOMENDAÇÃO PARA VOCÊ**

### 🥇 **Para Demo/Apresentação**: 
**VERCEL (Frontend) + RAILWAY (Backends)**

#### **Vantagens**:
- ✅ Deploy em 10 minutos
- ✅ Domínio automático: `https://data-corban-navigator.vercel.app`
- ✅ HTTPS automático
- ✅ Deploy contínuo do GitHub
- ✅ Gratuito para testes

#### **Passos Rápidos**:

1. **Vercel (Frontend)**:
   - GitHub → Vercel → Deploy
   - URL: `https://data-corban-navigator.vercel.app`

2. **Railway (Backends)**:
   - GitHub → Railway → 2 serviços
   - URLs automáticas para APIs

3. **Configurar URLs no Vercel**:
   - Apontar APIs para Railway
   - Manter Supabase atual

---

## 🌟 **OPÇÃO RTM (Se for Railway, Render, etc.)**

### 🚂 **Railway - RECOMENDADO**

```bash
# 1. Instalar CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy frontend
railway deploy

# 4. Deploy backends
cd server && railway deploy
cd ../postgres-server && railway deploy
```

### 🎨 **Render**

```bash
# 1. Conectar GitHub
# 2. Configurar 3 serviços
# 3. Deploy automático
```

---

## 📝 **CHECKLIST PRÉ-DEPLOY**

### ✅ **Frontend**
- [ ] Build de produção funciona (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Rotas SPA configuradas
- [ ] Performance otimizada

### ✅ **Backend**
- [ ] Conexões de banco testadas
- [ ] CORS configurado para domínio
- [ ] Logs implementados
- [ ] Health checks

### ✅ **Banco de Dados**
- [ ] Supabase configurado
- [ ] Políticas de segurança ativas
- [ ] Backups configurados

### ✅ **Domínio e SSL**
- [ ] Domínio personalizado (opcional)
- [ ] SSL/HTTPS ativo
- [ ] Redirects configurados

---

## 🎉 **Deploy Recomendado: VERCEL + RAILWAY**

### ⚡ **Deploy Rápido (15 minutos)**

1. **Push para GitHub** (já feito)
2. **Vercel**: Conectar repo → Deploy frontend
3. **Railway**: 2 backends → Deploy APIs
4. **Configurar URLs**: Apontar frontend para APIs
5. **Testar**: Login + Dashboard + APIs

### 🔗 **URLs Resultantes**
- **Frontend**: `https://data-corban-navigator.vercel.app`
- **API SQL**: `https://sql-api-xxxx.railway.app`
- **API PostgreSQL**: `https://postgres-api-xxxx.railway.app`

### 💡 **Quer que eu ajude com o deploy específico?**

Posso te guiar passo a passo para publicar em qualquer uma dessas plataformas! Qual você prefere?
