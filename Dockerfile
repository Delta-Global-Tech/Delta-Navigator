# Multi-stage Dockerfile para RTM - Delta Navigator
FROM node:18-alpine as frontend-builder

WORKDIR /app

# Copiar package files do frontend
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação React
RUN npm run build

# Stage 2: Setup dos Backends
FROM node:18-alpine as backend-setup

WORKDIR /app

# Instalar dependências do PostgreSQL server
COPY postgres-server/package*.json ./postgres-server/
RUN cd postgres-server && npm ci --only=production

# Instalar dependências do SQL Server
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copiar código dos backends
COPY postgres-server/ ./postgres-server/
COPY server/ ./server/

# Stage 3: Imagem de Produção
FROM node:18-alpine

# Instalar nginx, supervisord e curl para healthcheck
RUN apk add --no-cache nginx supervisor curl

WORKDIR /app

# Copiar frontend buildado
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copiar backends
COPY --from=backend-setup /app/postgres-server ./postgres-server
COPY --from=backend-setup /app/server ./server

# Criar arquivos de configuração
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Ajustar permissões
RUN chown -R nodejs:nodejs /app
RUN chown -R nodejs:nodejs /usr/share/nginx/html

# Criar diretório para logs
RUN mkdir -p /var/log/supervisor

# Expor portas
EXPOSE 80 3001 3002

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Comando de inicialização
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
