# 🚀 Deploy Rápido - Data Corban Navigator

## ⚡ Deploy em 10 Minutos (Recomendado)

### 🥇 **VERCEL + RAILWAY**

#### **1. Deploy Frontend (Vercel)**

```bash
# 1. Acesse https://vercel.com
# 2. "New Project" → "Import Git Repository"
# 3. Selecione: data-corban-navigator
# 4. Configure Environment Variables:
```

**Variáveis no Vercel**:
```
VITE_SUPABASE_URL = https://tgdvaaprejaojcwzgzng.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL = https://seu-sql-api.railway.app
VITE_POSTGRES_API_URL = https://seu-postgres-api.railway.app
```

```bash
# 5. Deploy automático!
# 6. URL: https://data-corban-navigator.vercel.app
```

#### **2. Deploy Backends (Railway)**

```bash
# 1. Acesse https://railway.app
# 2. "New Project" → "Deploy from GitHub"
# 3. Selecione o mesmo repositório
# 4. Crie 2 serviços:
```

**Serviço 1 - SQL Server Backend**:
- Root Directory: `/server`
- Build Command: `npm install`
- Start Command: `node server.js`
- Port: `3001`

**Serviço 2 - PostgreSQL Backend**:
- Root Directory: `/postgres-server`
- Build Command: `npm install`
- Start Command: `node server.js`
- Port: `3002`

#### **3. Conectar URLs**

```bash
# Copie as URLs do Railway e cole no Vercel:
# SQL API: https://server-production-xxxx.railway.app
# PostgreSQL API: https://postgres-server-production-xxxx.railway.app
```

#### **4. Resultado Final**

✅ **Frontend**: `https://data-corban-navigator.vercel.app`
✅ **Login funcionando**
✅ **APIs conectadas**
✅ **HTTPS automático**
✅ **Deploy contínuo**

---

## 🚂 **Alternativa: Só Railway (Full-Stack)**

### **Deploy Completo no Railway**

```bash
# 1. Criar 3 serviços no Railway:
# - Frontend (porta 5173)
# - SQL Backend (porta 3001)  
# - PostgreSQL Backend (porta 3002)

# 2. URLs automáticas:
# - https://frontend-production-xxxx.railway.app
# - https://sql-production-xxxx.railway.app
# - https://postgres-production-xxxx.railway.app
```

---

## 🌐 **Alternativa: Netlify (Apenas Frontend)**

### **Deploy Simples**

```bash
# 1. Build local
npm run build

# 2. Arrastar pasta 'dist' para netlify.com
# 3. Configurar redirects automático
# 4. URL: https://data-corban-navigator.netlify.app
```

---

## 💡 **Qual Escolher?**

### 🥇 **Vercel + Railway** 
- ✅ Mais rápido
- ✅ Melhor performance
- ✅ Deploy automático

### 🥈 **Só Railway**
- ✅ Tudo em um lugar
- ✅ Mais simples
- ✅ Backend + Frontend

### 🥉 **Netlify**
- ✅ Apenas frontend
- ✅ Supersimples
- ✅ Precisa backends externos

---

## 🎯 **Quer Deploy Agora?**

**Escolha uma opção e eu te guio passo a passo!**

1. **Vercel + Railway** (Recomendado)
2. **Railway Full-Stack**
3. **Netlify Simples**
4. **Docker/VPS Custom**

**Qual você prefere?** 🚀
