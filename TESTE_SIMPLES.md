# 🧪 TESTE SIMPLES - Validar Docker Atual

**Tempo**: 5 minutos  
**Risco**: ⚠️ ZERO (apenas leitura, sem mudanças)  
**Objetivo**: Confirmar que sua arquitetura está saudável antes de adicionar Vault

---

## 🚀 **PASSO 1: Executar teste (Windows)**

Abra PowerShell e execute:

```powershell
# Ir para o diretório do projeto
cd C:\Users\alexsandro.costa\Delta-Navigator

# Executar teste
.\test-environment.ps1
```

**Esperado**: Você verá algo como isto:

```
═══════════════════════════════════════════════════════════════
  🧪 TESTE 1: Verificar status Docker atual
═══════════════════════════════════════════════════════════════

1️⃣  Verificando Docker...
✅ Docker encontrado: Docker version 24.0.0

2️⃣  Verificando Docker Compose...
✅ Docker Compose encontrado: version 2.20.0

3️⃣  Containers em execução:
NAME                            STATUS
delta-frontend                  Up 2 hours
delta-backend-sql               Up 2 hours
delta-backend-postgres          Up 2 hours
delta-backend-extrato           Up 2 hours
delta-backend-contratos         Up 2 hours

4️⃣  Validando docker-compose.yml...
✅ docker-compose.yml é válido

5️⃣  Testando conectividade dos backends...
   🔗 Backend SQL Server (http://localhost:3001/health): ✅ OK
   🔗 Backend PostgreSQL (http://localhost:3002/health): ✅ OK
   🔗 Backend Extrato (http://localhost:3003/health): ⚠️  Sem resposta
   🔗 Backend Contratos (http://localhost:3004/health): ⚠️  Sem resposta

6️⃣  Verificando variáveis de ambiente (.env)...
✅ Arquivo .env encontrado
   ✅ POSTGRES_HOST=192.168...
   ✅ POSTGRES_PORT=5432
   ✅ POSTGRES_DATABASE=airflow_...
   ✅ POSTGRES_USER=postgres
   ✅ POSTGRES_PASSWORD=MinhaS...
   ✅ VITE_SUPABASE_URL=https://...

7️⃣  Testando conectividade PostgreSQL...
✅ PostgreSQL conectado com sucesso
   Versão: PostgreSQL 13.0 ...

═══════════════════════════════════════════════════════════════
  ✅ TESTE COMPLETO!
═══════════════════════════════════════════════════════════════
```

---

## ✅ **O que significa cada resultado:**

| Símbolo | Significado | Ação |
|---------|------------|------|
| ✅ | Tudo OK | Nenhuma ação necessária |
| ⚠️  | Aviso (não crítico) | Verificar depois |
| ❌ | Erro crítico | Corrigir antes de continuar |

---

## 🔍 **ANÁLISE: Interpretando os resultados**

### **Backend SQL Server e PostgreSQL com ✅**
```
✅ OK - Perfeito!
```
→ Significa que os containers estão rodando e respondendo

### **Backend Extrato ou Contratos com ⚠️**
```
⚠️  Sem resposta (pode estar parado)
```
→ Tudo bem! Pode estar parado de propósito ou ainda inicializando. Não quebra nada.

### **.env com todos ✅**
```
✅ POSTGRES_HOST=192.168...
```
→ Suas variáveis estão configuradas. Perfeito para começar com Vault.

### **PostgreSQL com ✅**
```
✅ PostgreSQL conectado com sucesso
```
→ Banco de dados está acessível. Pronto para criptografia + audit logs.

---

## 🟢 **SE TUDO ESTÁ ✅:**

Você está **100% pronto** para começar a Fase 1 (Vault). 

**Próximo comando** (após confirmar teste):

```powershell
# Fazer backup do docker-compose.yml (segurança)
Copy-Item docker-compose.yml docker-compose.yml.backup

# Pronto para adicionar Vault!
```

---

## 🔴 **SE ALGO TEM ❌:**

### **❌ Docker não está instalado**
→ Instale: https://www.docker.com/products/docker-desktop

### **❌ docker-compose.yml tem erro**
→ Execute: `docker-compose config` para ver o erro exato

### **❌ .env não encontrado**
→ Crie a partir de `.env.example`:
```powershell
Copy-Item .env.example .env
# Depois editar .env com seus valores
```

### **❌ PostgreSQL não conecta**
→ Verifique:
```powershell
# Ver se container postgres está rodando
docker ps | grep postgres

# Verificar logs
docker logs delta-backend-postgres | tail -50

# Checar credenciais em .env
(Get-Content .env) | grep POSTGRES
```

---

## 📝 **CHECKLIST: Antes de continuar**

Execute isto e confirme cada item:

```powershell
# 1. Docker rodando?
docker --version
# Esperado: Docker version XX.X.X

# 2. Docker Compose rodando?
docker-compose --version
# Esperado: version X.X.X

# 3. Containers de backend em execução?
docker ps --filter "name=delta-backend"
# Esperado: pelo menos "delta-backend-sql" e "delta-backend-postgres"

# 4. .env existe?
Test-Path .env
# Esperado: True

# 5. Backend responde?
curl http://localhost:3001/health
# Esperado: JSON com status

# 6. PostgreSQL conecta?
# (se psql instalado)
psql -h localhost -U postgres -d airflow_treynor -c "SELECT 1"
# Esperado: (1 row)
```

---

## 🎯 **PRÓXIMO PASSO**

Quando confirmar que tudo está ✅:

**Faça:** Confirmar aqui nos comentários que o teste passou e qual foi o resultado

**Eu farei:** Adicionar Vault ao docker-compose.yml de forma segura

---

## 💡 **DÚVIDAS**

**P: Preciso parar os containers para fazer o teste?**  
R: Não! O teste funciona com tudo rodando.

**P: O teste altera algo no meu sistema?**  
R: Não! É apenas leitura. Completamente seguro.

**P: E se der erro?**  
R: Não tem problema. Vamos investigar e corrigir tudo junto.

---
