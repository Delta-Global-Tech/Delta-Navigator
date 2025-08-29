# Deploy RTM - Delta Navigator 🚀

Este guia mostra como fazer deploy do Delta Navigator na **RTM (Red Hat OpenShift/Kubernetes)**.

## 📋 Pré-requisitos

- **Docker** instalado
- **kubectl** configurado para RTM
- **Registry RTM** configurado
- **Credenciais dos bancos** PostgreSQL e SQL Server
- **Conta Supabase** configurada

## 🚀 Deploy Rápido

### 1. Configurar Secrets

```bash
# Criar arquivo de secrets
cp rtm-secrets.example.yaml rtm-secrets.yaml

# Editar com suas credenciais (usar base64)
echo -n "sua_url_supabase" | base64
echo -n "sua_chave_supabase" | base64
# ... (repetir para todas as credenciais)

# Aplicar secrets no cluster
kubectl apply -f rtm-secrets.yaml
```

### 2. Deploy Automático

```bash
# Executar script de deploy
./deploy-rtm.sh

# Ou especificar uma tag
./deploy-rtm.sh v1.0.0
```

### 3. Verificar Deploy

```bash
# Status dos pods
kubectl get pods -l app=delta-navigator

# Status do serviço
kubectl get services delta-navigator-service

# Logs
kubectl logs -l app=delta-navigator -f
```

## 🔧 Deploy Manual

### 1. Build da Imagem

```bash
# Build local
docker build -t delta-navigator:latest .

# Tag para registry RTM
docker tag delta-navigator:latest your-rtm-registry.com/delta-navigator:latest

# Push para registry
docker push your-rtm-registry.com/delta-navigator:latest
```

### 2. Deploy no Kubernetes

```bash
# Aplicar deployment
kubectl apply -f rtm-deployment.yaml

# Aplicar service
kubectl apply -f rtm-service.yaml
```

## 📊 Monitoramento

### Healthchecks

A aplicação inclui healthchecks automáticos:

- **Liveness Probe**: `GET /` na porta 80
- **Readiness Probe**: `GET /` na porta 80
- **Startup Probe**: 30s de delay inicial

### Logs

```bash
# Logs do frontend + APIs
kubectl logs -l app=delta-navigator -f

# Logs específicos
kubectl logs deployment/delta-navigator -c delta-navigator -f
```

### Métricas

```bash
# CPU e Memória
kubectl top pods -l app=delta-navigator

# Detalhes do deployment
kubectl describe deployment delta-navigator
```

## 🔒 Segurança

### Variables de Ambiente

Todas as credenciais são gerenciadas via **Kubernetes Secrets**:

- ✅ Supabase URL e Key
- ✅ PostgreSQL credentials
- ✅ SQL Server credentials
- ✅ Configurações não sensíveis via ConfigMap

### Network Policies

```yaml
# Exemplo de network policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: delta-navigator-netpol
spec:
  podSelector:
    matchLabels:
      app: delta-navigator
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from: []
    ports:
    - protocol: TCP
      port: 80
```

## 🛠 Troubleshooting

### Problemas Comuns

1. **Pod não inicia**:
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name>
   ```

2. **Secrets não encontrados**:
   ```bash
   kubectl get secrets
   kubectl describe secret delta-navigator-secrets
   ```

3. **Conectividade de banco**:
   ```bash
   # Teste dentro do pod
   kubectl exec -it <pod-name> -- /bin/sh
   # Dentro do pod:
   curl http://localhost:3002/api/test
   curl http://localhost:3001/api/test
   ```

### Debug do Container

```bash
# Entrar no container
kubectl exec -it deployment/delta-navigator -- /bin/sh

# Verificar processos
ps aux

# Verificar configuração nginx
cat /etc/nginx/conf.d/default.conf

# Verificar logs supervisord
tail -f /var/log/supervisor/supervisord.log
```

## 📈 Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: delta-navigator-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: delta-navigator
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Manual Scaling

```bash
# Escalar deployment
kubectl scale deployment delta-navigator --replicas=5

# Verificar réplicas
kubectl get deployment delta-navigator
```

## 🔄 CI/CD

### GitLab CI

```yaml
# .gitlab-ci.yml
deploy-rtm:
  stage: deploy
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - ./deploy-rtm.sh $CI_COMMIT_SHA
  only:
    - main
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'docker build -t delta-navigator:${BUILD_NUMBER} .'
            }
        }
        stage('Deploy') {
            steps {
                sh './deploy-rtm.sh ${BUILD_NUMBER}'
            }
        }
    }
}
```

## 📞 Suporte

- **Logs**: `kubectl logs -l app=delta-navigator`
- **Status**: `kubectl get all -l app=delta-navigator`
- **Troubleshooting**: Veja seção de troubleshooting acima

---

**🎉 Delta Navigator na RTM - Deploy Enterprise Ready!**
