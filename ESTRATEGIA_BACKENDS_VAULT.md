# 📋 Estratégia: Integrar Vault em Todos os Backends (Incremental)

**Status**: Vault rodando ✅  
**Próximo**: Adicionar Vault a CADA backend, um por um

---

## 🎯 **Backends para atualizar:**

```
1. delta-backend-server (SQL Server) - porta 3001
2. delta-postgres-server (PostgreSQL) - porta 3002 [JA FEITO]
3. delta-extrato-server (Extrato) - porta 3003
4. delta-contratos-server (Contratos) - porta 3004
5. delta-iugu-server (Iugu) - porta 3005
```

---

## ⚠️ **IMPORTANTE: Estratégia Segura**

Não vamos parar tudo de uma vez. Vamos:

1. **Modificar código** do backend
2. **Reconstruir imagem** do Docker
3. **Reiniciar apenas aquele** backend
4. **Validar** se conecta
5. **Passar para o próximo**

---

## 🚀 **Passo-a-Passo por Backend**

### **Backend 1: postgres-server (JA FEITO ✅)**

Status: Código modificado, imagem precisa ser rebuilda

```bash
# Reconstruir imagem
docker-compose build postgres-server

# Reiniciar apenas este
docker-compose up -d postgres-server

# Testar
curl http://localhost:3002/health

# Validar logs
docker logs delta-postgres-server | grep VAULT
```

---

### **Backend 2: backend-server (SQL Server)**

Arquivo: `server/server.js`

Mesma integração que fizemos no postgres-server.

---

### **Backend 3: extrato-server**

Arquivo: `extrato-server/server.js`

Mesma integração.

---

### **Backend 4: contratos-server**

Arquivo: `contratos-server/server.js`

Mesma integração.

---

### **Backend 5: iugu-server**

Arquivo: `iugu-server/server.js`

Mesma integração.

---

## ❓ **Qual é o caminho mais seguro?**

**OPÇÃO A: Atualizar tudo de uma vez (mais rápido, um pouco mais arriscado)**
- Modificar todos os servidores agora
- Rebuildar todas as imagens
- Restart tudo junto
- Risco: Se algo quebrar, afeta tudo

**OPÇÃO B: Um por um (mais lento, super seguro)**
- Fazer 1 backend completamente (código + rebuild + restart + teste)
- Validar que funciona
- Passar para o próximo
- Risco: Zero quebra, descobre problema isolado

---

## 🎯 **Minha recomendação:**

→ **OPÇÃO B (um por um)** porque:
- Você tem 5 backends em produção rodando
- Cada um pode ter suas peculiaridades
- Se quebrar, afeta um, não todos
- Você pode parar tudo e voltar pro backup rápido

---

## 📝 **O que você quer fazer?**

1. **Rebuildar postgres-server agora** (que acabamos de modificar)?
   ```bash
   docker-compose build postgres-server
   docker-compose up -d postgres-server
   docker logs delta-postgres-server | tail -30
   ```

2. **Depois passar para os outros**?

---

## ✅ **Checklist antes de continuar**

- [ ] Vault está rodando: `docker ps | grep vault` = healthy
- [ ] Secrets foram inicializados: `.\init-vault.ps1` = OK
- [ ] Backend postgres foi modificado: código tem VAULT_ADDR
- [ ] Pronto para rebuildar e testar

---

**O que você prefere?** 👇

A) Rebuild postgres-server agora e testar  
B) Deixar quieto por enquanto  
C) Fazer tudo de uma vez (todos os backends)

---
