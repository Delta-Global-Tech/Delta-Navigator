# 🚀 Deploy Delta Navigator no OpenShift RTM

## 📋 Passo-a-Passo via Web Console

### 1. **Preparar Secrets** 🔑

Primeiro, você precisa codificar suas credenciais em base64:

```bash
# Supabase
echo -n "sua_url_supabase" | base64
echo -n "sua_chave_supabase" | base64

# PostgreSQL 
echo -n "seu_usuario_postgres" | base64
echo -n "sua_senha_postgres" | base64

# SQL Server
echo -n "seu_usuario_sqlserver" | base64  
echo -n "sua_senha_sqlserver" | base64
```

### 2. **No OpenShift Web Console** 🌐

#### **2.1 Criar Secrets**
1. Vá em **Workloads** → **Secrets**
2. Clique em **Create** → **From YAML**
3. Cole o conteúdo de `openshift-secrets.yaml`
4. **SUBSTITUA** os valores `# SUBSTITUA_AQUI` pelos base64 das suas credenciais
5. Clique **Create**

#### **2.2 Deploy da Aplicação**
1. Vá em **Workloads** → **Deployments** 
2. Clique em **Create** → **From YAML**
3. Cole o conteúdo de `openshift-deploy.yaml`
4. Clique **Create**

### 3. **Verificar Deploy** ✅

#### **3.1 Verificar Pods**
- Vá em **Workloads** → **Pods**
- Procure por `delta-navigator-xxxx`
- Status deve ser **Running**

#### **3.2 Verificar Logs**
- Clique no pod
- Aba **Logs**
- Deve mostrar nginx + APIs iniciando

#### **3.3 Acessar Aplicação**
- Vá em **Networking** → **Routes**
- Procure por `delta-navigator-route`
- Clique na **URL** gerada

### 4. **Troubleshooting** 🔧

#### **Pod não inicia**
```bash
# No terminal local (se tiver oc CLI):
oc describe pod <pod-name>
oc logs <pod-name>
```

#### **Secrets incorretos**
- Vá em **Workloads** → **Secrets** → `delta-navigator-secrets`
- Verifique se todos os valores estão preenchidos
- Re-encode as credenciais se necessário

#### **Build falha**
- Vá em **Builds** → **Build Configs** → `delta-navigator`
- Verifique logs do build
- Pode precisar triggerar novo build

### 5. **URLs de Acesso** 🌐

Após deploy bem-sucedido:

- **Frontend**: `https://delta-navigator-089327-deltaglobal-prod.apps.prd-cluster.priv.rtmcloud.net.br`
- **API PostgreSQL**: `https://delta-navigator-089327-deltaglobal-prod.apps.prd-cluster.priv.rtmcloud.net.br/api/postgres/`
- **API SQL Server**: `https://delta-navigator-089327-deltaglobal-prod.apps.prd-cluster.priv.rtmcloud.net.br/api/sql/`

### 6. **Comandos Úteis CLI (Opcional)** 💻

Se você tiver o CLI `oc` instalado:

```bash
# Login no cluster
oc login https://console-openshift-console.apps.prd-cluster.priv.rtmcloud.net.br

# Selecionar projeto
oc project 089327-deltaglobal-prod

# Aplicar configs
oc apply -f openshift-secrets.yaml
oc apply -f openshift-deploy.yaml

# Verificar status
oc get pods
oc get routes
oc logs deployment/delta-navigator
```

### 7. **Monitoramento** 📊

#### **Métricas**
- **Workloads** → **Deployments** → `delta-navigator`
- Aba **Metrics** mostra CPU/Memory

#### **Events**
- **Workloads** → **Pods** → selecione pod
- Aba **Events** mostra histórico

### 8. **Scaling** 📈

Para aumentar réplicas:
1. **Workloads** → **Deployments** → `delta-navigator`
2. Ações → **Edit Deployment**
3. Altere `replicas: 2` para o número desejado
4. **Save**

---

## 🎯 **Resumo dos Arquivos**

- `openshift-deploy.yaml` - Deployment, Service, Route, BuildConfig
- `openshift-secrets.yaml` - Secrets e ConfigMap
- `Dockerfile` - Imagem multi-stage pronta

## ✅ **Checklist Deploy**

- [ ] Secrets criados com credenciais corretas
- [ ] Deployment aplicado
- [ ] Pods em status Running
- [ ] Route criada e acessível
- [ ] APIs respondendo (teste /api/test)
- [ ] Frontend carregando corretamente

**🚀 Delta Navigator rodando na RTM!**
