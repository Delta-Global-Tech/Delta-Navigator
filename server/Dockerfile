# Dockerfile para backend PostgreSQL - Production Ready
FROM node:18-alpine

# Instalar curl para health checks
RUN apk add --no-cache curl tini

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Criar diretório para logs
RUN mkdir -p /app/logs

# Expor porta
EXPOSE 3001

# Health check melhorado
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Usar tini como PID 1 para melhor handling de sinais
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar com melhor gerenciamento de memória
CMD ["node", "--max-old-space-size=512", "server.js"]
