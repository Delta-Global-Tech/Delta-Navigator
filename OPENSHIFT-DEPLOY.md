# 🔴 Deploy no Red Hat OpenShift - Data Corban Navigator

## 🚀 Guia Completo para OpenShift

### 📋 **Pré-requisitos**
- Acesso ao cluster OpenShift
- `oc` CLI instalado
- Docker/Podman
- Conta no registry de containers

---

## 🏗️ **Arquitetura no OpenShift**

```
┌─────────────────────────────────────────────────┐
│                OpenShift Cluster                │
├─────────────────────────────────────────────────┤
│  🌐 Route (HTTPS)                               │
│  ↓                                              │
│  📱 Frontend Service (data-corban-frontend)     │
│  ↓                                              │
│  🔄 Load Balancer                               │
│  ↓                                              │
│  ┌─────────────┬─────────────┬─────────────┐    │
│  │ Frontend    │ SQL Backend │ PG Backend  │    │
│  │ Pod         │ Pod         │ Pod         │    │
│  │ (React)     │ (Express)   │ (Express)   │    │
│  │ Port: 8080  │ Port: 3001  │ Port: 3002  │    │
│  └─────────────┴─────────────┴─────────────┘    │
│                                                 │
│  💾 External Databases                          │
│  ├── SQL Server (External)                     │
│  ├── PostgreSQL (External)                     │
│  └── Supabase (External)                       │
└─────────────────────────────────────────────────┘
```

---

## 📦 **1. Preparação dos Containers**

### **Build das Imagens**

```bash
# 1. Build Frontend
podman build -t data-corban-frontend:latest .

# 2. Build SQL Backend  
podman build -t data-corban-sql-backend:latest ./server

# 3. Build PostgreSQL Backend
podman build -t data-corban-postgres-backend:latest ./postgres-server

# 4. Tag para registry
podman tag data-corban-frontend:latest quay.io/seu-usuario/data-corban-frontend:latest
podman tag data-corban-sql-backend:latest quay.io/seu-usuario/data-corban-sql-backend:latest
podman tag data-corban-postgres-backend:latest quay.io/seu-usuario/data-corban-postgres-backend:latest

# 5. Push para registry
podman push quay.io/seu-usuario/data-corban-frontend:latest
podman push quay.io/seu-usuario/data-corban-sql-backend:latest
podman push quay.io/seu-usuario/data-corban-postgres-backend:latest
```

---

## 🚀 **2. Deploy no OpenShift**

### **Método 1: Via oc CLI (Recomendado)**

```bash
# 1. Login no cluster
oc login https://api.seu-cluster.openshift.com:6443

# 2. Criar novo projeto
oc new-project data-corban-navigator

# 3. Deploy usando os yamls
oc apply -f openshift/

# 4. Verificar status
oc get pods
oc get services
oc get routes
```

### **Método 2: Via Web Console**

1. **Acesse o Console Web do OpenShift**
2. **Developer Perspective → +Add**
3. **Import from Git**:
   - Git Repository: `https://github.com/2carllos/data-corban-navigator.git`
   - Builder Image: Node.js
   - Application Name: `data-corban-navigator`

---

## 📝 **3. Configuração via Template**

### **Deploy Completo com Template**

```bash
# 1. Aplicar template
oc process -f openshift/template.yaml \
  -p APPLICATION_NAME=data-corban-navigator \
  -p GIT_URI=https://github.com/2carllos/data-corban-navigator.git \
  -p SUPABASE_URL=https://tgdvaaprejaojcwzgzng.supabase.co \
  -p SUPABASE_KEY=sua_chave_supabase \
  | oc apply -f -

# 2. Verificar deployment
oc get all -l app=data-corban-navigator

# 3. Acessar aplicação
oc get route data-corban-frontend
```

---

## 🔧 **4. Configuração de Recursos**

### **Scaling e Resources**

```bash
# Escalar serviços
oc scale deployment data-corban-frontend --replicas=3
oc scale deployment data-corban-sql-backend --replicas=2
oc scale deployment data-corban-postgres-backend --replicas=2

# Configurar autoscaling
oc autoscale deployment data-corban-frontend --min=2 --max=10 --cpu-percent=70

# Verificar recursos
oc describe deployment data-corban-frontend
```

---

## 🔐 **5. Secrets e ConfigMaps**

### **Gerenciar Configurações Sensíveis**

```bash
# Criar secrets para databases
oc create secret generic db-credentials \
  --from-literal=SQLSERVER_PASSWORD=sua_senha \
  --from-literal=POSTGRES_PASSWORD=sua_senha \
  --from-literal=SUPABASE_KEY=sua_chave

# Criar configmap para configurações
oc create configmap app-config \
  --from-literal=SQLSERVER_HOST=seu_sql_server \
  --from-literal=POSTGRES_HOST=seu_postgres_host

# Aplicar nos deployments
oc set env deployment/data-corban-sql-backend --from=secret/db-credentials
oc set env deployment/data-corban-sql-backend --from=configmap/app-config
```

---

## 📊 **6. Monitoramento e Logs**

### **Visualizar Logs**

```bash
# Logs em tempo real
oc logs -f deployment/data-corban-frontend
oc logs -f deployment/data-corban-sql-backend
oc logs -f deployment/data-corban-postgres-backend

# Logs de builds
oc logs -f build/data-corban-frontend-1

# Status dos pods
oc describe pod -l app=data-corban-frontend
```

### **Métricas e Health Checks**

```bash
# Verificar health
oc get endpoints
oc describe service data-corban-frontend

# Métricas via Prometheus (se habilitado)
oc get servicemonitor
```

---

## 🌐 **7. Networking e Routes**

### **Configurar Acesso Externo**

```bash
# Expor serviços
oc expose service data-corban-frontend
oc expose service data-corban-sql-backend
oc expose service data-corban-postgres-backend

# Configurar SSL/TLS
oc create route edge data-corban-frontend-secure \
  --service=data-corban-frontend \
  --hostname=data-corban.apps.seu-cluster.com

# Verificar routes
oc get routes
```

---

## 🔄 **8. CI/CD Pipeline**

### **Pipeline Tekton/Jenkins**

```bash
# Criar pipeline
oc apply -f openshift/pipeline.yaml

# Trigger build
oc start-build data-corban-frontend

# Acompanhar pipeline
oc get pipelinerun
oc logs -f pipelinerun/data-corban-build-xxx
```

---

## 🛡️ **9. Segurança**

### **Service Mesh (Istio)**

```bash
# Habilitar service mesh
oc label namespace data-corban-navigator istio-injection=enabled

# Aplicar políticas de segurança
oc apply -f openshift/security-policies.yaml
```

### **Network Policies**

```bash
# Aplicar políticas de rede
oc apply -f openshift/network-policies.yaml

# Verificar políticas
oc get networkpolicy
```

---

## 📋 **10. Troubleshooting**

### **Comandos Úteis**

```bash
# Status geral
oc status

# Eventos do projeto
oc get events --sort-by=.metadata.creationTimestamp

# Debug de pods
oc debug deployment/data-corban-frontend

# Port forward para teste local
oc port-forward service/data-corban-frontend 8080:8080

# Executar comandos no pod
oc exec -it deployment/data-corban-frontend -- /bin/bash
```

### **Problemas Comuns**

| Problema | Solução |
|----------|---------|
| Pod não inicia | `oc describe pod` → verificar resources/limits |
| Build falha | `oc logs build/xxx` → verificar Dockerfile |
| Service não responde | `oc get endpoints` → verificar selector |
| Route não funciona | `oc describe route` → verificar TLS |

---

## 🎯 **URLs Finais**

Após o deploy bem-sucedido:

```
🌐 Frontend: https://data-corban-frontend-data-corban-navigator.apps.seu-cluster.com
🔌 SQL API: https://data-corban-sql-backend-data-corban-navigator.apps.seu-cluster.com
🔌 PG API: https://data-corban-postgres-backend-data-corban-navigator.apps.seu-cluster.com
```

---

## ✅ **Checklist de Deploy**

- [ ] Cluster OpenShift configurado
- [ ] Imagens buildadas e no registry
- [ ] Secrets criados
- [ ] ConfigMaps aplicados
- [ ] Deployments rodando
- [ ] Services expostos
- [ ] Routes configuradas
- [ ] Health checks funcionando
- [ ] Logs sendo coletados
- [ ] Monitoramento ativo

---

## 🆘 **Suporte**

```bash
# Verificar versão do cluster
oc version

# Informações do projeto
oc describe project data-corban-navigator

# Recursos utilizados
oc describe quota
oc describe limitrange
```

**O sistema estará rodando de forma enterprise no OpenShift! 🚀**
