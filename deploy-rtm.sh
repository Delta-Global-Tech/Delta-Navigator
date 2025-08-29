#!/bin/bash

# Script de Deploy para RTM - Delta Navigator
# Uso: ./deploy-rtm.sh [tag]

set -e

# Configurações
IMAGE_NAME="delta-navigator"
REGISTRY_URL="your-rtm-registry.com"  # Substitua pela URL do seu registry RTM
TAG=${1:-latest}

echo "🚀 Iniciando deploy do Delta Navigator para RTM..."

# 1. Build da imagem Docker
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:${TAG} .

# 2. Tag para o registry RTM
echo "🏷️  Tagging image for RTM registry..."
docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY_URL}/${IMAGE_NAME}:${TAG}

# 3. Push para RTM registry
echo "📤 Pushing to RTM registry..."
docker push ${REGISTRY_URL}/${IMAGE_NAME}:${TAG}

# 4. Deploy no RTM (exemplo usando kubectl)
echo "🚢 Deploying to RTM..."

# Criar deployment YAML
cat > rtm-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: delta-navigator
  labels:
    app: delta-navigator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: delta-navigator
  template:
    metadata:
      labels:
        app: delta-navigator
    spec:
      containers:
      - name: delta-navigator
        image: ${REGISTRY_URL}/${IMAGE_NAME}:${TAG}
        ports:
        - containerPort: 80
        - containerPort: 3001
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        # Adicione suas variáveis de ambiente aqui
        - name: VITE_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: delta-navigator-secrets
              key: supabase-url
        - name: VITE_SUPABASE_ANON_KEY
          valueFrom:
            secretKeyRef:
              name: delta-navigator-secrets
              key: supabase-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: delta-navigator-service
spec:
  selector:
    app: delta-navigator
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: postgres-api
    port: 3002
    targetPort: 3002
  - name: sql-api
    port: 3001
    targetPort: 3001
  type: LoadBalancer
EOF

# Aplicar no cluster RTM
kubectl apply -f rtm-deployment.yaml

echo "✅ Deploy concluído!"
echo "📋 Para verificar o status:"
echo "   kubectl get pods -l app=delta-navigator"
echo "   kubectl get services delta-navigator-service"

# Cleanup
rm rtm-deployment.yaml

echo "🎉 Delta Navigator deployado com sucesso na RTM!"
